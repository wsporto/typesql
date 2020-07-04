import mysql2, { Connection } from "mysql2/promise";
import { ColumnSchema, FieldDescriptor } from "./types";

enum flag {
    NOT_NULL = 1,
    PRI_KEY = 2
}

export class DbClient {

    private connection: Connection;
    async connect(connectionUri: string) {
        this.connection = await mysql2.createConnection(connectionUri);
    }

    async closeConnection() {
        this.connection.end();
    }

    checkNullFlag(flags: number) {
        return (flags & flag.NOT_NULL) != 0;
    }

    async loadDbSchema() : Promise<ColumnSchema[]> {
        const sql = `
        SELECT TABLE_NAME as "table", COLUMN_NAME as "column", if(IS_NULLABLE='NO', true, false) as "notNull"
        FROM INFORMATION_SCHEMA.COLUMNS 
        ORDER BY TABLE_NAME, ORDINAL_POSITION
        `
        return this.connection.execute(sql)
            .then( res => res[0] as ColumnSchema[]);
    }
    

    async executeQuery(query: string) : Promise<FieldDescriptor[]> {
        let params = [];
        for(var i=0; i<query.length;i++) {
            if (query[i] === "?") params.push('?');
        }
        const [columns, fields] = await this.connection.query(`${query.toLowerCase()} LIMIT 0`, params);
        return fields.map( field => ({
            name: field.name,
            column: field.orgName,
            columnType: field.columnType,
            notNull: this.checkNullFlag(field.flags)
        }));
    }
    
    async executeExpression (expr: string, from?: string) : Promise<FieldDescriptor[]> {
        
        const query = `select ${expr}` + (from? ` ${from} LIMIT 0`: '');
        let params = [];
        for(var i=0; i<query.length;i++) {
            if (query[i] === "?") params.push('?');
        }
        const [columns, fields] = await this.connection.query(`${query.toLowerCase()}`, params);
        return fields.map( field => ({
            name: field.name,
            column: field.orgName,
            columnType: field.columnType,
            notNull: this.checkNullFlag(field.flags)
        }));
    
    
    
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