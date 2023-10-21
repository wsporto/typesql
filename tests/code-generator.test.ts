import assert from "assert";
import { TsDescriptor, convertToCamelCaseName, replaceOrderByParam, generateTsCode, generateTsDescriptor, generateTsFileFromContent } from "../src/code-generator";
import { describeSql } from "../src/describe-query";
import { dbSchema } from "./mysql-query-analyzer/create-schema";
import { DbClient } from "../src/queryExectutor";

describe('code-generator', () => {

    let client: DbClient = new DbClient();
    before(async () => {
        await client.connect('mysql://root:password@localhost/mydb');
    })

    after(async () => {
        await client.closeConnection();
    })

    it('generate main function with parameters', () => {
        const queryName = 'get-person';
        const tsDescriptor: TsDescriptor = {
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
            parameterNames: ['param1'],
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
            `import type { Connection } from 'mysql2/promise';

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
        const sql = 'update mytable2 set name=? where id = ?';
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, queryName, 'node');
        const expected =
            `import type { Connection } from 'mysql2/promise';

export type UpdatePersonData = {
    name?: string;
}

export type UpdatePersonParams = {
    param1: number;
}

export type UpdatePersonResult = {
    affectedRows: number;
}

export async function updatePerson(connection: Connection, data: UpdatePersonData, params: UpdatePersonParams) : Promise<UpdatePersonResult> {
    const sql = \`
    update mytable2 set name=? where id = ?
    \`

    return connection.query(sql, [data.name, params.param1])
        .then( res => res[0] as UpdatePersonResult );
}`

        assert.deepStrictEqual(actual, expected);
    })

    it('generate main function only with order by parameter', () => {
        const queryName = convertToCamelCaseName('select-person');
        const tsDescriptor: TsDescriptor = {
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
            parameterNames: [],
            parameters: [],
            orderByColumns: ['id', 'name']
        }

        const actual = generateTsCode(tsDescriptor, queryName, 'node');
        const expected =
            `import type { Connection } from 'mysql2/promise';

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

    it('test generateTsDescriptor - select with same parameter used twice', () => {
        const sql = 'SELECT id from mytable1 where id = :id or id = :id';
        const schemaDef = describeSql(dbSchema, sql);
        const tsDescriptor = generateTsDescriptor(schemaDef);
        const actual = generateTsCode(tsDescriptor, 'selectId', 'node');
        const expected =
            `import type { Connection } from 'mysql2/promise';

export type SelectIdParams = {
    id: number;
}

export type SelectIdResult = {
    id: number;
}

export async function selectId(connection: Connection, params: SelectIdParams) : Promise<SelectIdResult[]> {
    const sql = \`
    SELECT id from mytable1 where id = ? or id = ?
    \`

    return connection.query(sql, [params.id, params.id])
        .then( res => res[0] as SelectIdResult[] );
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

    it('generate nested result', async () => {
        const queryName = 'select-users';
        const sql = `-- @nested
SELECT 
    u.id as user_id, 
    u.name as user_name,
    p.id as post_id,
    p.title as post_title,
    p.body  as post_body,
    r.id as role_id,
    r.role,
    c.id as comment_id,
    c.comment 
FROM users u
LEFT JOIN posts p on p.fk_user = u.id
LEFT JOIN roles r on r.fk_user = u.id
LEFT JOIN comments c on c.fk_post = p.id`

        const actual = await generateTsFileFromContent(client, 'select-users.sql', queryName, sql, 'node');
        const expected = `import type { Connection } from 'mysql2/promise';

export type SelectUsersResult = {
    user_id: number;
    user_name: string;
    post_id?: number;
    post_title?: string;
    post_body?: string;
    role_id?: number;
    role?: 'user' | 'admin' | 'guest';
    comment_id?: number;
    comment?: string;
}

export async function selectUsers(connection: Connection) : Promise<SelectUsersResult[]> {
    const sql = \`
    -- @nested
    SELECT 
        u.id as user_id, 
        u.name as user_name,
        p.id as post_id,
        p.title as post_title,
        p.body  as post_body,
        r.id as role_id,
        r.role,
        c.id as comment_id,
        c.comment 
    FROM users u
    LEFT JOIN posts p on p.fk_user = u.id
    LEFT JOIN roles r on r.fk_user = u.id
    LEFT JOIN comments c on c.fk_post = p.id
    \`

    return connection.query(sql)
        .then( res => res[0] as SelectUsersResult[] );
}

export type SelectUsersNestedU = {
    user_id: number;
    user_name: string;
    p: SelectUsersNestedP[];
    r: SelectUsersNestedR[];
}

export type SelectUsersNestedP = {
    post_id: number;
    post_title: string;
    post_body: string;
    c: SelectUsersNestedC[];
}

export type SelectUsersNestedC = {
    comment_id: number;
    comment: string;
}

export type SelectUsersNestedR = {
    role_id: number;
    role: 'user' | 'admin' | 'guest';
}

export async function selectUsersNested(connection: Connection): Promise<SelectUsersNestedU[]> {
    const selectResult = await selectUsers(connection);
    if (selectResult.length == 0) {
        return [];
    }
    return collectSelectUsersNestedU(selectResult);
}

function collectSelectUsersNestedU(selectResult: SelectUsersResult[]): SelectUsersNestedU[] {
    const grouped = groupBy(selectResult.filter(r => r.user_id != null), r => r.user_id);
    return Object.values(grouped).map(r => mapToSelectUsersNestedU(r))
}

function mapToSelectUsersNestedU(selectResult: SelectUsersResult[]): SelectUsersNestedU {
    const firstRow = selectResult[0];
    const result: SelectUsersNestedU = {
        user_id: firstRow.user_id,
        user_name: firstRow.user_name,
        p: collectSelectUsersNestedP(selectResult),
        r: collectSelectUsersNestedR(selectResult)
    }
    return result;
}

function collectSelectUsersNestedP(selectResult: SelectUsersResult[]): SelectUsersNestedP[] {
    const grouped = groupBy(selectResult.filter(r => r.post_id != null), r => r.post_id);
    return Object.values(grouped).map(r => mapToSelectUsersNestedP(r))
}

function mapToSelectUsersNestedP(selectResult: SelectUsersResult[]): SelectUsersNestedP {
    const firstRow = selectResult[0];
    const result: SelectUsersNestedP = {
        post_id: firstRow.post_id,
        post_title: firstRow.post_title,
        post_body: firstRow.post_body,
        c: collectSelectUsersNestedC(selectResult)
    }
    return result;
}

function collectSelectUsersNestedC(selectResult: SelectUsersResult[]): SelectUsersNestedC[] {
    const grouped = groupBy(selectResult.filter(r => r.comment_id != null), r => r.comment_id);
    return Object.values(grouped).map(r => mapToSelectUsersNestedC(r))
}

function mapToSelectUsersNestedC(selectResult: SelectUsersResult[]): SelectUsersNestedC {
    const firstRow = selectResult[0];
    const result: SelectUsersNestedC = {
        comment_id: firstRow.comment_id,
        comment: firstRow.comment
    }
    return result;
}

function collectSelectUsersNestedR(selectResult: SelectUsersResult[]): SelectUsersNestedR[] {
    const grouped = groupBy(selectResult.filter(r => r.role_id != null), r => r.role_id);
    return Object.values(grouped).map(r => mapToSelectUsersNestedR(r))
}

function mapToSelectUsersNestedR(selectResult: SelectUsersResult[]): SelectUsersNestedR {
    const firstRow = selectResult[0];
    const result: SelectUsersNestedR = {
        role_id: firstRow.role_id,
        role: firstRow.role
    }
    return result;
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

it('test generateTsDescriptor for enum column schema', () => {
    let sql = 'SELECT enum_column FROM all_types';

    const schemaDef = describeSql(dbSchema, sql);
    const actual = generateTsDescriptor(schemaDef);
    const expected: TsDescriptor = {
        sql: "SELECT enum_column FROM all_types",
        queryType: "Select",
        multipleRowsResult: true,
        columns: [
            {
                name: 'enum_column',
                tsType: `'x-small' | 'small' | 'medium' | 'large' | 'x-large'`,
                notNull: false
            }
        ],
        orderByColumns: undefined,
        data: undefined,
        parameterNames: [],
        parameters: []
    }

    assert.deepStrictEqual(actual, expected);
})

it('test code generation with duplicated parameters', () => {
    const sql = 'SELECT id from mytable1 where (id = :id or id = :id) and value = :value';

    const schemaDef = describeSql(dbSchema, sql);
    const tsDescriptor = generateTsDescriptor(schemaDef);
    const actual = generateTsCode(tsDescriptor, 'select-id', 'node');
    const expected =
        `import type { Connection } from 'mysql2/promise';

export type SelectIdParams = {
    id: number;
    value: number;
}

export type SelectIdResult = {
    id: number;
}

export async function selectId(connection: Connection, params: SelectIdParams) : Promise<SelectIdResult[]> {
    const sql = \`
    SELECT id from mytable1 where (id = ? or id = ?) and value = ?
    \`

    return connection.query(sql, [params.id, params.id, params.value])
        .then( res => res[0] as SelectIdResult[] );
}`

    assert.deepStrictEqual(actual, expected);
})

