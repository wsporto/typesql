import assert from "assert";
import { parse } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { ColumnDef, FieldInfo } from "../../src/mysql-query-analyzer/types";
import { getColumnsFrom, getColumnNames } from "../../src/mysql-query-analyzer/select-columns";
import { unionTypeResult } from "../../src/mysql-query-analyzer/collect-constraints";

describe('Utility functions tests', () => {

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