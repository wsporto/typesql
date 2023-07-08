import assert from "assert";
import { renameInvalidNames, escapeInvalidTsField, generateTsDescriptor, removeDuplicatedParameters } from "../src/code-generator";
import { ParameterDef, SchemaDef } from "../src/types";

describe('rename invalid names', () => {

    it('rename duplicated column names', async () => {

        //duplicated names
        const columnNames = ['id', 'id', 'name', 'id'];
        const actual = renameInvalidNames(columnNames);
        const expected = ['id', 'id_2', 'name', 'id_3'];

        assert.deepStrictEqual(actual, expected);
    })

    it('test escape properties', async () => {

        assert.deepStrictEqual(escapeInvalidTsField('id'), 'id');
        assert.deepStrictEqual(escapeInvalidTsField('id_id'), 'id_id'); //valid name
        assert.deepStrictEqual(escapeInvalidTsField('1'), '1'); //valid name
        assert.deepStrictEqual(escapeInvalidTsField('_'), '_'); //valid name
        assert.deepStrictEqual(escapeInvalidTsField('$'), '$'); //valid name

        assert.deepStrictEqual(escapeInvalidTsField('id+id'), '"id+id"'); //escaped
        assert.deepStrictEqual(escapeInvalidTsField('id + id'), '"id + id"'); //escaped
        assert.deepStrictEqual(escapeInvalidTsField('count(*)'), '"count(*)"'); //escaped
    })

    it('rename/escape column names', async () => {

        //duplicated names
        const columnNames = ['id', 'id', 'id+id', 'id+id', 'id'];
        const actual = renameInvalidNames(columnNames);
        const expected = ['id', 'id_2', '"id+id"', '"id+id_2"', 'id_3'];

        assert.deepStrictEqual(actual, expected);
    })

    it('rename/escape column from TsDescriptor', async () => {

        const schema: SchemaDef = {
            sql: 'UPDATE ...',
            queryType: 'Update',
            multipleRowsResult: true,
            columns: [
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'id',
                    dbtype: 'int',
                    notNull: true
                },
                {
                    name: 'count(*)',
                    dbtype: 'bigint',
                    notNull: true
                }
            ],
            data: [
                {
                    name: 'id+id',
                    columnType: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    name: 'name',
                    columnType: 'varchar',
                    notNull: true,
                },
                {
                    name: 'name',
                    columnType: 'varchar',
                    notNull: true,
                }
            ],
            orderByColumns: ['id', 'count(*)', `concat(name, ' ', name)`]
        }
        const actual = generateTsDescriptor(schema);

        assert.deepStrictEqual(actual.columns.map(col => col.name), ['id', 'id_2', '"count(*)"']);
        assert.deepStrictEqual(actual.data!.map(col => col.name), ['"id+id"']);
        assert.deepStrictEqual(actual.parameters.map(col => col.name), ['name']); //remove duplicated parameters
        assert.deepStrictEqual(actual.orderByColumns, ['id', 'count(*)', `concat(name, ' ', name)`]);
    })

    it('removeDuplicatedParameters: notNull (true) and notNull (false)', async () => {

        const parameters: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar',
                notNull: true,
            },
            {
                name: 'name',
                columnType: 'varchar',
                notNull: false,
            }
        ]

        const expected: ParameterDef[] = [{
            name: 'name',
            columnType: 'varchar',
            notNull: false,
        }]

        const actual = removeDuplicatedParameters(parameters);
        assert.deepStrictEqual(actual, expected);
    })

    it('removeDuplicatedParameters: notNull (false) and notNull (true)', async () => {

        const parameters: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar',
                notNull: false,
            },
            {
                name: 'name',
                columnType: 'varchar',
                notNull: true,
            }
        ]

        const expected: ParameterDef[] = [{
            name: 'name',
            columnType: 'varchar',
            notNull: false,
        }]

        const actual = removeDuplicatedParameters(parameters);
        assert.deepStrictEqual(actual, expected);
    })

    it('removeDuplicatedParameters: notNull (true), notNull (true), notNull(false) ', async () => {

        const parameters: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar',
                notNull: true,
            },
            {
                name: 'id',
                columnType: 'varchar',
                notNull: true,
            },
            {
                name: 'name',
                columnType: 'varchar',
                notNull: true,
            },
            {
                name: 'name',
                columnType: 'varchar',
                notNull: false,
            },
            {
                name: 'id',
                columnType: 'varchar',
                notNull: false,
            }
        ]

        const expected: ParameterDef[] = [
            {
                name: 'name',
                columnType: 'varchar',
                notNull: false
            },
            {
                columnType: "varchar",
                name: "id",
                notNull: false
            }
        ]

        const actual = removeDuplicatedParameters(parameters);
        assert.deepStrictEqual(actual, expected);
    })

});