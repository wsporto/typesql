import assert from "assert";
import { TsDescriptor, convertToCamelCaseName,  replaceOrderByParam, generateTsCode, generateTsDescriptor } from "../src/code-generator";
import { describeSql } from "../src/describe-query";
import { dbSchema } from "./mysql-query-analyzer/create-schema";

describe('code-generator', () => {
  
    it('generate main function with parameters', () => {
        const queryName = 'get-person';
        const tsDescriptor : TsDescriptor = {
            sql: 'select id, name from person where id = ?',
            queryType: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    tsType: 'number',
                    notNull: true
                },
                {
                    name: 'name',
                    tsType: 'string',
                    notNull: false
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    tsType: 'number',
                    notNull: true
                }
            ]
        }

        const actual = generateTsCode(tsDescriptor, queryName, 'node');
        const expected = 
`import { Connection } from 'mysql2/promise';

export type GetPersonParams = {
    param1: number;
}

export type GetPersonResult = {
    id: number;
    name?: string;
}

export async function getPerson(connection: Connection, params: GetPersonParams) : Promise<GetPersonResult[]> {
    const sql = \`
    select id, name from person where id = ?
    \`

    return connection.query(sql, [params.param1])
        .then( res => res[0] as GetPersonResult[] );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('generate main function with data and parameters', () => {
        const queryName = convertToCamelCaseName('update-person');
        const tsDescriptor : TsDescriptor = {
            sql: 'update person set name=? where id = ?', 
            queryType: 'Update',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'affectedRows',
                    tsType: 'number',
                    notNull: true
                }
            ],
            data: [
                {
                    name: 'name',
                    tsType: 'string',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'param1',
                    tsType: 'number',
                    notNull: true
                }
            ]
        }

        const actual = generateTsCode(tsDescriptor, queryName, 'node');
        const expected = 
`import { Connection } from 'mysql2/promise';

export type UpdatePersonData = {
    name: string;
}

export type UpdatePersonParams = {
    param1: number;
}

export type UpdatePersonResult = {
    affectedRows: number;
}

export async function updatePerson(connection: Connection, data: UpdatePersonData, params: UpdatePersonParams) : Promise<UpdatePersonResult> {
    const sql = \`
    update person set name=? where id = ?
    \`

    return connection.query(sql, [data.name, params.param1])
        .then( res => res[0] as UpdatePersonResult );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('generate main function only with order by parameter', () => {
        const queryName = convertToCamelCaseName('select-person');
        const tsDescriptor : TsDescriptor = {
            sql: 'SELECT id FROM person ORDER BY ?', 
            queryType: 'Select',
            multipleRowsResult: false,
            columns: [
                {
                    name: 'id',
                    tsType: 'number',
                    notNull: true
                }
            ],
            data: [],
            parameters: [],
            orderByColumns: ['id', 'name']
        }

        const actual = generateTsCode(tsDescriptor, queryName, 'node');
        const expected = 
`import { Connection } from 'mysql2/promise';

export type SelectPersonParams = {
    orderBy: [SelectPersonOrderBy, ...SelectPersonOrderBy[]];
}

export type SelectPersonResult = {
    id: number;
}

export async function selectPerson(connection: Connection, params: SelectPersonParams) : Promise<SelectPersonResult | null> {
    const sql = \`
    SELECT id FROM person ORDER BY \${escapeOrderBy(params.orderBy)}
    \`

    return connection.query(sql)
        .then( res => res[0] as SelectPersonResult[] )
        .then( res => res[0] );
}

export type SelectPersonOrderBy = {
    column: "id" | "name";
    direction: 'asc' | 'desc';
}

function escapeOrderBy(orderBy: SelectPersonOrderBy[]) : string {
    return orderBy.map( order => \`\\\`\${order.column}\\\` \${order.direction == 'desc' ? 'desc' : 'asc' }\`).join(', ');
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('test replace order by parameter', () => {
        const sql = `
        SELECT *
        FROM mytable1
        ORDER BY ?`;

        const actual = replaceOrderByParam(sql);
        
        const expected = `
        SELECT *
        FROM mytable1
        ORDER BY \${escapeOrderBy(params.orderBy)}`;
        
        assert.deepStrictEqual(actual, expected);

    })

    it('test replace order by parameter with LIMIT', () => {
        const sql = `
        SELECT *
        FROM mytable1
        ORDER BY ? LIMIT 10`;

        const actual = replaceOrderByParam(sql);
        
        const expected = `
        SELECT *
        FROM mytable1
        ORDER BY \${escapeOrderBy(params.orderBy)} LIMIT 10`;
        
        assert.deepStrictEqual(actual, expected);

    })

    it('test replace order by parameter with extra blank line', () => {
        const sql = `
        SELECT *
        FROM mytable1
        ORDER BY ?
        
        `;

        const actual = replaceOrderByParam(sql);
        
        const expected = `
        SELECT *
        FROM mytable1
        ORDER BY \${escapeOrderBy(params.orderBy)}
        
        `;
        
        assert.deepStrictEqual(actual, expected);

    })

    it('test generateTsDescriptor - select without parameters', () => {
        let sql = 'SELECT id FROM mytable1';
        
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, 'select-id', 'deno');
        const expected = 
`import { Client } from "https://deno.land/x/mysql/mod.ts";

export type SelectIdResult = {
    id: number;
}

export async function selectId(client: Client) : Promise<SelectIdResult[]> {
    const sql = \`
    SELECT id FROM mytable1
    \`

    return client.query(sql)
        .then( res => res );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('test generateTsDescriptor - select with parameters', () => {
        const sql = 'SELECT id from mytable1 where id = ? and value in (?)'; //returns single row result
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, 'selectId', 'deno');
        const expected = 
`import { Client } from "https://deno.land/x/mysql/mod.ts";

export type SelectIdParams = {
    param1: number;
    param2: number[];
}

export type SelectIdResult = {
    id: number;
}

export async function selectId(client: Client, params: SelectIdParams) : Promise<SelectIdResult | null> {
    const sql = \`
    SELECT id from mytable1 where id = ? and value in (?)
    \`

    return client.query(sql, [params.param1, params.param2])
        .then( res => res[0] );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('test generateTsDescriptor - update', () => {
        const sql = 'UPDATE mytable1 SET value = ?';
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, 'update-value', 'deno');
        const expected = 
`import { Client } from "https://deno.land/x/mysql/mod.ts";

export type UpdateValueData = {
    value?: number;
}

export type UpdateValueResult = {
    affectedRows: number;
    insertId: number;
}

export async function updateValue(client: Client, data: UpdateValueData) : Promise<UpdateValueResult> {
    const sql = \`
    UPDATE mytable1 SET value = ?
    \`

    return client.query(sql, [data.value])
        .then( res => res );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('test generateTsDescriptor - update with parameters', () => {
        const sql = 'UPDATE mytable1 SET value = ? WHERE id = ?';
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, 'update-value', 'deno');

        const expected = 
`import { Client } from "https://deno.land/x/mysql/mod.ts";

export type UpdateValueData = {
    value?: number;
}

export type UpdateValueParams = {
    param1: number;
}

export type UpdateValueResult = {
    affectedRows: number;
    insertId: number;
}

export async function updateValue(client: Client, data: UpdateValueData, params: UpdateValueParams) : Promise<UpdateValueResult> {
    const sql = \`
    UPDATE mytable1 SET value = ? WHERE id = ?
    \`

    return client.query(sql, [data.value, params.param1])
        .then( res => res );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('test generateTsDescriptor - select with order by', () => {
        const sql = 'SELECT id from mytable1 ORDER BY ?';
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, 'selectId', 'deno');
        const expected = 
`import { Client } from "https://deno.land/x/mysql/mod.ts";

export type SelectIdParams = {
    orderBy: [SelectIdOrderBy, ...SelectIdOrderBy[]];
}

export type SelectIdResult = {
    id: number;
}

export async function selectId(client: Client, params: SelectIdParams) : Promise<SelectIdResult[]> {
    const sql = \`
    SELECT id from mytable1 ORDER BY \${escapeOrderBy(params.orderBy)}
    \`

    return client.query(sql)
        .then( res => res );
}

export type SelectIdOrderBy = {
    column: "id" | "value";
    direction: 'asc' | 'desc';
}

function escapeOrderBy(orderBy: SelectIdOrderBy[]) : string {
    return orderBy.map( order => \`\\\`\${order.column}\\\` \${order.direction == 'desc' ? 'desc' : 'asc' }\`).join(', ');
}`

        assert.deepStrictEqual(actual, expected);
    })
})

it('test code generation with escaped table name', () => {
    let sql = 'SELECT id FROM `my table`';
    
    const schemaDef = describeSql(dbSchema, sql);
    const tsDescriptor = generateTsDescriptor(schemaDef);
    const actual = generateTsCode(tsDescriptor, 'select-id', 'deno');
    const expected = 
`import { Client } from "https://deno.land/x/mysql/mod.ts";

export type SelectIdResult = {
    id: number;
}

export async function selectId(client: Client) : Promise<SelectIdResult[]> {
    const sql = \`
    SELECT id FROM \\\`my table\\\`
    \`

    return client.query(sql)
        .then( res => res );
}`

    assert.deepStrictEqual(actual, expected);
})