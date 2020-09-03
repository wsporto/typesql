import assert from "assert";
import { TsFieldDescriptor } from "../src/types";
import { TsDescriptor, generateReturnName, convertToCamelCaseName, generateParamsType, generateDataType, generateFunction, generateReturnType, replaceOrderByParam } from "../src/code-generator";

describe('code-generator', () => {
    
    it('generate return name with isMultResult = true', () => {
        const queryName = convertToCamelCaseName('update-person');
        const actual = generateReturnName(queryName);
        const expected = 'UpdatePersonResult';
        assert.deepEqual(actual, expected);
    })

    it('generate params type', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = [
            {
                name: 'param1',
                tsType: 'number',
                notNull: true
            },
            {
                name: 'param2',
                tsType: 'string',
                notNull: false
            }
        ]
        const includeOrderBy = false;
        const actual = generateParamsType(queryName, fields, includeOrderBy);
        const expected = `
        export type GetPersonParams = {
            param1: number;
            param2?: string;
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate params type with order by', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = [
            {
                name: 'param1',
                tsType: 'number',
                notNull: true
            },
            {
                name: 'param2',
                tsType: 'string',
                notNull: false
            }
        ]
        const includeOrderBy = true;

        const actual = generateParamsType(queryName, fields, includeOrderBy);
        const expected = `
        export type GetPersonParams = {
            param1: number;
            param2?: string;
            orderBy: [GetPersonOrderBy, ...GetPersonOrderBy[]];
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate params type - no fields', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = []
        const includeOrderBy = false;
        const actual = generateParamsType(queryName, fields, includeOrderBy);
        const expected = '';

        assert.deepEqual(actual, expected);
    })

    it('generate params type - only order by', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = []
        const includeOrderBy = true;
        const actual = generateParamsType(queryName, fields, includeOrderBy);
        const expected = `
        export type GetPersonParams = {
            orderBy: [GetPersonOrderBy, ...GetPersonOrderBy[]];
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate params type - duplicated field name', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = [
            {
                name: 'name',
                tsType: 'string',
                notNull: true
            },
            {
                name: 'name',
                tsType: 'string',
                notNull: true
            }
        ]
        const includeOrderBy = false;
        const actual = generateParamsType(queryName, fields, includeOrderBy);
        const expected = `
        export type GetPersonParams = {
            name: string;
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate data type', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = [
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
        ]
        const actual = generateDataType(queryName, fields);
        const expected = `
        export type GetPersonData = {
            id: number;
            name?: string;
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate result type', () => {
        const queryName = convertToCamelCaseName('get-person');
        const fields: TsFieldDescriptor[] = [
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
        ]
        const actual = generateReturnType(queryName, fields);
        const expected = `
        export type GetPersonResult = {
            id: number;
            name?: string;
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate main function', () => {
        const queryName = convertToCamelCaseName('get-person');
        const tsDescriptor : TsDescriptor = {
            sql: 'select id, name from person',
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
            parameters: []
        }

        const actual = generateFunction(queryName, tsDescriptor, 'node');
        const expected = `
        export async function getPerson(connection: Connection) : Promise<GetPersonResult[]> {
            const sql = \`
            select id, name from person
            \`;
            return connection.query(sql)
                .then( res => res[0] as GetPersonResult[] );
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate main function with parameters', () => {
        const queryName = convertToCamelCaseName('get-person');
        const tsDescriptor : TsDescriptor = {
            sql: 'select id, name from person where id = ?',
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

        const actual = generateFunction(queryName, tsDescriptor, 'node');
        const expected = `
        export async function getPerson(connection: Connection, params: GetPersonParams) : Promise<GetPersonResult[]> {
            const sql = \`
            select id, name from person where id = ?
            \`;
            return connection.query(sql, [params.param1])
                .then( res => res[0] as GetPersonResult[] );
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
    })

    it('generate main function with data and parameters', () => {
        const queryName = convertToCamelCaseName('update-person');
        const tsDescriptor : TsDescriptor = {
            sql: 'update person set name=? where id = ?', 
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

        const actual = generateFunction(queryName, tsDescriptor, 'node');
        const expected = `
        export async function updatePerson(connection: Connection, data: UpdatePersonData, params: UpdatePersonParams) : Promise<UpdatePersonResult> {
            const sql = \`
            update person set name=? where id = ?
            \`;
            return connection.query(sql, [data.name, params.param1])
                .then( res => res[0] as UpdatePersonResult );
        }
        `

        assert.deepEqual(actual.replace(/\s/g, ''), expected.replace(/\s/g, ''));
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
        
        assert.deepEqual(actual, expected);

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
        
        assert.deepEqual(actual, expected);

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
        
        assert.deepEqual(actual, expected);

    })
})