import assert from "assert";
import { renameInvalidNames, escapeInvalidTsField, generateTsDescriptor} from "../src/code-generator";
import { SchemaDef } from "../src/types";

describe('rename invalid names', () => {

    it('rename duplicated column names', async () => {

        //duplicated names
        const columnNames = ['id', 'id', 'name', 'id'];
        const actual = renameInvalidNames(columnNames);
        const expected = ['id', 'id_2', 'name', 'id_3'];

        assert.deepEqual(actual, expected);
    })

    it('test escape properties', async () => {

        assert.deepEqual(escapeInvalidTsField('id'), 'id');
        assert.deepEqual(escapeInvalidTsField('id_id'), 'id_id'); //valid name
        assert.deepEqual(escapeInvalidTsField('1'), '1'); //valid name
        assert.deepEqual(escapeInvalidTsField('_'), '_'); //valid name
        assert.deepEqual(escapeInvalidTsField('$'), '$'); //valid name

        assert.deepEqual(escapeInvalidTsField('id+id'), '"id+id"'); //escaped
        assert.deepEqual(escapeInvalidTsField('id + id'), '"id + id"'); //escaped
        assert.deepEqual(escapeInvalidTsField('count(*)'), '"count(*)"'); //escaped
    })

    it('rename/escape column names', async () => {

        //duplicated names
        const columnNames = ['id', 'id', 'id+id', 'id+id', 'id'];
        const actual = renameInvalidNames(columnNames);
        const expected = ['id', 'id_2', '"id+id"', '"id+id_2"', 'id_3'];

        assert.deepEqual(actual, expected);
    })

    it('rename/escape column from TsDescriptor', async () => {

        const schema : SchemaDef = {
            sql: 'UPDATE ...',
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
        }
        const actual = generateTsDescriptor(schema);

        assert.deepEqual(actual.columns.map(col => col.name), ['id', 'id_2', '"count(*)"']);
        assert.deepEqual(actual.data!.map(col => col.name), ['"id+id"']);
        assert.deepEqual(actual.parameters.map(col => col.name), ['name', 'name_2']);
    })

});