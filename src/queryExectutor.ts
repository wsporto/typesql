import { Connection, createConnection } from "mysql2/promise";
import { Either, right, left } from "fp-ts/lib/Either";
import { TypeSqlError } from "./types";
import { ColumnSchema, ColumnSchema2 } from "./mysql-query-analyzer/types";

const connectionNotOpenError: TypeSqlError = {
    name: 'Connection error',
    description: 'The database connection is not open.'
}

export class DbClient {

    private connection: Connection | null;
    mySqlVersion: string;
    async connect(connectionUri: string): Promise<Either<TypeSqlError, true>> {
        try {
            this.connection = await createConnection(connectionUri);
            const [rows] = await this.connection.execute("select @@version as version");
            this.mySqlVersion = (rows as any[])[0].version;
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
        if (this.connection != null) {
            this.connection.end();
        }
    }

    async loadDbSchema(): Promise<Either<TypeSqlError, ColumnSchema[]>> {

        if (this.connection != null) {
            const sql = `
                SELECT TABLE_SCHEMA as "schema", TABLE_NAME as "table", COLUMN_NAME as "column", DATA_TYPE as "column_type", if(IS_NULLABLE='NO', true, false) as "notNull",
                    COLUMN_KEY as "columnKey"
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = "${this.connection.config.database}"
                ORDER BY TABLE_NAME, ORDINAL_POSITION
            `
            return this.connection.execute(sql)
                .then(res => {
                    const columns = res[0] as ColumnSchema[];
                    return right(columns.map(col => ({ ...col, notNull: !!+col.notNull }))); //convert 1 to true, 0 to false
                });
        }
        return left(connectionNotOpenError);

    }

    async loadTableSchema(tableName: string): Promise<Either<TypeSqlError, ColumnSchema2[]>> {
        const sql = `
        SELECT 
            TABLE_SCHEMA as "schema", 
            TABLE_NAME as "table", 
            COLUMN_NAME as "column", 
            DATA_TYPE as "column_type", 
            IF(IS_NULLABLE='NO', true, false) as "notNull",
            COLUMN_KEY as "columnKey",
            IF(EXTRA = 'auto_increment', true, false) as "autoincrement"
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION
        `

        if (this.connection) {
            return this.connection.execute(sql, [tableName])
                .then(res => {
                    const columns = res[0] as ColumnSchema2[]
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
        if (this.connection) {
            //@ts-ignore
            return this.connection.prepare(sql)
                .then(() => {
                    return right(true)
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