import assert from "assert";
import { parse } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { ColumnDef, FieldInfo, ColumnSchema } from "../../src/mysql-query-analyzer/types";
import { getColumnsFrom, getColumnNames, findColumn, splitName, findColumn2 } from "../../src/mysql-query-analyzer/select-columns";
import { unionTypeResult } from "../../src/mysql-query-analyzer/collect-constraints";

describe('Utility functions tests', () => {

    it('findColumn should be case insensitive', () => {
        const colDef : ColumnDef[] = [
            {
                column: 'name',
                columnName: 'name',
                columnType: 'varchar',
                notNull: true,
                table: 'mytable2'
            }
        ]
        const fieldName = splitName('name');
        const actual = findColumn(fieldName, colDef);
        assert.deepEqual(actual, colDef[0]);

        const fieldNameUperCase = splitName('NAME');
        const actualUpperCase = findColumn(fieldNameUperCase, colDef);
        assert.deepEqual(actualUpperCase, colDef[0]);
    })

    it.only('findColumn2 should be case insensitive', () => {
        const colDef : ColumnSchema[] = [
            {
                column: 'name',
                column_type: 'varchar',
                notNull: true,
                table: 'mytable2',
                schema: 'mydb'
            }
        ]
        const fieldName = splitName('name');
        const actual = findColumn2(fieldName, 'mytable2', colDef);
        assert.deepEqual(actual, colDef[0]);

        const fieldNameUperCase = splitName('NAME');
        const actualUpperCase = findColumn2(fieldNameUperCase, 'mytable2', colDef);
        assert.deepEqual(actualUpperCase, colDef[0]);
    })

    it.skip(`test selectColumns`, () => {

        const query = parse('SELECT count(*) FROM mytable1');
        const querySpec = query
            .simpleStatement()
            ?.selectStatement()
            ?.queryExpression()
            ?.queryExpressionBody()
            ?.querySpecification()!;

        const fromColumns = getColumnsFrom(querySpec, dbSchema);

        const expectedColumns: ColumnDef[] = [
            {
                column: 'id',
                columnName: 'id',
                columnType: 'int',
                notNull: true,
                table: 'mytable1',
                tableAlias: ''
            },
            {
                column: 'value',
                columnName: 'value',
                columnType: 'int',
                notNull: false,
                table: 'mytable1',
                tableAlias: ''
            }
        ]

        assert.deepEqual(fromColumns, expectedColumns);

        const selectedColumns = getColumnNames(querySpec, fromColumns);
        const expectedSelectedColumns : FieldInfo[] = [
            {
                name: 'count(*)',
                notNull: true
            }
        ]

        assert.deepEqual(selectedColumns, expectedSelectedColumns);

    })

    it('test unionTypeResult', () => {
        assert.deepEqual(unionTypeResult('tinyint', 'tinyint'), 'tinyint');
        assert.deepEqual(unionTypeResult('tinyint', 'smallint'), 'smallint');
        assert.deepEqual(unionTypeResult('tinyint', 'mediumint'), 'mediumint');
        assert.deepEqual(unionTypeResult('tinyint', 'int'), 'int');
        assert.deepEqual(unionTypeResult('tinyint', 'bigint'), 'bigint');
        
        assert.deepEqual(unionTypeResult('smallint', 'tinyint'), 'smallint');
        assert.deepEqual(unionTypeResult('smallint', 'smallint'), 'smallint');
        assert.deepEqual(unionTypeResult('smallint', 'mediumint'), 'mediumint');
        assert.deepEqual(unionTypeResult('smallint', 'int'), 'int');
        assert.deepEqual(unionTypeResult('smallint', 'bigint'), 'bigint');

        assert.deepEqual(unionTypeResult('mediumint', 'tinyint'), 'mediumint');
        assert.deepEqual(unionTypeResult('mediumint', 'smallint'), 'mediumint');
        assert.deepEqual(unionTypeResult('mediumint', 'mediumint'), 'mediumint');
        assert.deepEqual(unionTypeResult('mediumint', 'int'), 'int');
        assert.deepEqual(unionTypeResult('mediumint', 'bigint'), 'bigint');

        assert.deepEqual(unionTypeResult('int', 'tinyint'), 'int');
        assert.deepEqual(unionTypeResult('int', 'smallint'), 'int');
        assert.deepEqual(unionTypeResult('int', 'mediumint'), 'int');
        assert.deepEqual(unionTypeResult('int', 'int'), 'int');
        assert.deepEqual(unionTypeResult('int', 'bigint'), 'bigint');

        assert.deepEqual(unionTypeResult('bigint', 'tinyint'), 'bigint');
        assert.deepEqual(unionTypeResult('bigint', 'smallint'), 'bigint');
        assert.deepEqual(unionTypeResult('bigint', 'mediumint'), 'bigint');
        assert.deepEqual(unionTypeResult('bigint', 'int'), 'bigint');
        assert.deepEqual(unionTypeResult('bigint', 'bigint'), 'bigint');
    })
})