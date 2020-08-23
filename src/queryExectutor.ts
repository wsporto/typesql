import mysql2, { Connection, FieldPacket } from "mysql2/promise";
import { Either, right, left } from "fp-ts/lib/Either";
import { FieldDescriptor, InvalidSqlError } from "./types";
import { FlagEnum, checkFlag, convertTypeCodeToMysqlType } from "./mysql-mapping";
import { ColumnSchema } from "./mysql-query-analyzer/types";

export class DbClient {

    private connection: Connection;
    async connect(connectionUri: string) {
        this.connection = await mysql2.createConnection(connectionUri);
    }

    async closeConnection() {
        this.connection.end();
    }

    async loadDbSchema() : Promise<ColumnSchema[]> {
        const sql = `
        SELECT TABLE_SCHEMA as "schema", TABLE_NAME as "table", COLUMN_NAME as "column", DATA_TYPE as "column_type", if(IS_NULLABLE='NO', true, false) as "notNull"
        FROM INFORMATION_SCHEMA.COLUMNS 
        ORDER BY TABLE_NAME, ORDINAL_POSITION
        `
        return this.connection.execute(sql)
            .then( res => res[0] as ColumnSchema[]);
    }

    createParams(sql: string, paramValue: '1' | '?') {
        let params = [];
        for(var i=0; i<sql.length;i++) {
            if (sql[i] === "?") params.push(paramValue);
        }
        return params;
    }

    async explainSql(sql: string) : Promise<Either<InvalidSqlError, boolean>>{
        //@ts-ignore
        return this.connection.prepare(sql)
            .then( () => {
                return right(true)
            }).catch( (err: any) => this.createInvalidSqlError(err));
    }

    createInvalidSqlError(err: any) {
        const error : InvalidSqlError = {
            name: 'Invalid sql',
            description: err.message
        }
        return left(error);
    }
    

    async executeQuery(query: string) : Promise<Either<InvalidSqlError, FieldDescriptor[]>> {
        const params = this.createParams(query, '?');
        try {
            const [columns, fields] = await this.connection
            .query(`${query} LIMIT 0`, params);

            const columnsSchema = fields.map( field => this.fieldPacketToFieldDescriptor(field));
            return right(columnsSchema);
        }
        catch( err ) {
            return this.createInvalidSqlError(err);
        };
            
        
    }
    
    async executeExpression (expr: string, from?: string) : Promise<FieldDescriptor[]> {

        const query = `select ${expr}` + (from? ` ${from} LIMIT 0`: '');
        let params = this.createParams(query, '?');
        const [columns, fields] = await this.connection.execute(`${query.toLowerCase()}`, params);
        return fields.map( field => this.fieldPacketToFieldDescriptor(field));
    }

    fieldPacketToFieldDescriptor(field: FieldPacket) {
        const fieldDescriptor : FieldDescriptor = {
            name: field.name,
            column: field.orgName,
            columnType: convertTypeCodeToMysqlType(field.columnType, field.flags, field.columnLength),
            notNull: checkFlag(field.flags, FlagEnum.NOT_NULL)
        }
        return fieldDescriptor;
    }
    
    functionParamType(functionName: string) {
        switch(functionName.toLowerCase()) {
            case 'abs':
            case 'acos':
            case 'asin':
            case 'atan':
            case 'atan2':
            case 'ceil':
                return 'double'
            default:
                return 'varchar';

                
        }
    }

}