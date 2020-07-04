
    import { Connection } from 'mysql2/promise';
    export type exampleParams = {
        	 param1 : number | string
	 id : number

    }

    export type exampleResult = {
        	 id : number
	 value? : number

    }

    export async function example(connection: Connection, params: exampleParams) : Promise<exampleResult[]> {
        const sql = `
        SELECT * FROM mytable1 t WHERE ? in (1, 2, 3, 'a') and id = ?
        `;
        return connection.query(sql, [params.param1, params.id])
            .then( res => res[0] as exampleResult[] );
    }
    