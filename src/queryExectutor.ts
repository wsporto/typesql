import { Pool, createPool } from "mysql2/promise";
import { Either, right, left } from "fp-ts/lib/Either";
import { TypeSqlError } from "./types";
import { ColumnSchema, Table } from "./mysql-query-analyzer/types";

const connectionNotOpenError: TypeSqlError = {
    name: 'Connection error',
    description: 'The database connection is not open.'
}

export class DbClient {

    private pool: Pool | null;
    mySqlVersion: string;
    database: string;
    async connect(connectionUri: string): Promise<Either<TypeSqlError, true>> {
        try {
            this.pool = await createPool(connectionUri);
            const [rows] = await this.pool.execute("select @@version as version");
            this.mySqlVersion = (rows as any[])[0].version;
            //@ts-ignore
            this.database = this.pool.pool.config.connectionConfig.database;
            return right(true);
        }
        catch (e: any) {
            const connError: TypeSqlError = {
                name: 'Connection error',
                description: e.message
            }
            return left(connError);
        }
    }

    async closeConnection() {
        if (this.pool != null) {
            this.pool.end();
        }
    }

    async loadDbSchema(): Promise<Either<TypeSqlError, ColumnSchema[]>> {

        const sql = `
            SELECT 
                TABLE_SCHEMA as "schema", TABLE_NAME as "table", 
                COLUMN_NAME as "column", 
                IF(data_type = 'enum', COLUMN_TYPE, DATA_TYPE) as "column_type", 
                if(IS_NULLABLE='NO', true, false) as "notNull",
                COLUMN_KEY as "columnKey",
                IF(EXTRA = 'auto_increment', true, false) as "autoincrement"
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ?
            ORDER BY TABLE_NAME, ORDINAL_POSITION
            `

        if (this.pool != null) {
            return this.pool.execute(sql, [this.database])
                .then(res => {
                    const columns = res[0] as ColumnSchema[];
                    return right(columns.map(col => ({ ...col, notNull: !!+col.notNull }))); //convert 1 to true, 0 to false
                });
        }
        return left(connectionNotOpenError);

    }

    async loadTableSchema(tableName: string): Promise<Either<TypeSqlError, ColumnSchema[]>> {
        const sql = `
        SELECT 
            TABLE_SCHEMA as "schema", 
            TABLE_NAME as "table", 
            COLUMN_NAME as "column", 
            IF(data_type = 'enum', COLUMN_TYPE, DATA_TYPE) as "column_type",
            IF(IS_NULLABLE='NO', true, false) as "notNull",
            COLUMN_KEY as "columnKey",
            IF(EXTRA = 'auto_increment', true, false) as "autoincrement"
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION
        `

        if (this.pool) {
            return this.pool.execute(sql, [this.database, tableName])
                .then(res => {
                    const columns = res[0] as ColumnSchema[]
                    return right(columns);
                });
        }
        return left(connectionNotOpenError);

    }

    async selectTablesFromSchema(): Promise<Either<TypeSqlError, Table[]>> {
        const sql = `
        SELECT 
            table_schema as "schema",
            table_name as "table"
        FROM information_schema.tables
        WHERE table_type = 'BASE TABLE' and table_schema = database() 
        order by "schema", "table"
        `

        if (this.pool) {
            return this.pool.execute(sql)
                .then(res => {
                    const columns = res[0] as ColumnSchema[]
                    return right(columns);
                });
        }
        return left(connectionNotOpenError);

    }

    createParams(sql: string, paramValue: '1' | '?') {
        let params = [];
        for (var i = 0; i < sql.length; i++) {
            if (sql[i] === "?") params.push(paramValue);
        }
        return params;
    }

    async explainSql(sql: string): Promise<Either<TypeSqlError, boolean>> {
        if (this.pool) {
            const conn = await this.pool.getConnection();
            return conn.prepare(sql)
                .then(() => {
                    return right(true)
                }).finally(() => {
                    this.pool?.releaseConnection(conn);
                }).catch((err: any) => this.createInvalidSqlError(err));
        }
        return left(connectionNotOpenError);

    }

    createInvalidSqlError(err: any) {
        const error: TypeSqlError = {
            name: 'Invalid sql',
            description: err.message
        }
        return left(error);
    }

    isVersion8() {
        return this.mySqlVersion.startsWith("8.");
    }
}