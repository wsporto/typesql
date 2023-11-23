import { ColumnSchema } from "../src/mysql-query-analyzer/types"
import { generateInsertStatement, generateSelectStatement, generateUpdateStatement, generateDeleteStatement } from "../src/sql-generator"
import assert from "assert";

describe('code-generator', () => {

    const columns: ColumnSchema[] = [
        {
            column: 'id',
            columnKey: 'PRI',
            autoincrement: true,
            column_type: 'int',
            notNull: true,
            table: '',
            schema: 'mydb'
        },
        {
            column: 'value',
            columnKey: '',
            autoincrement: false,
            column_type: 'int',
            notNull: false,
            table: '',
            schema: 'mydb'
        }

    ]

    it('test scaffolding select stmt', () => {

        const actual = generateSelectStatement('mytable1', columns);
        const expected =
            `SELECT
    \`id\`,
    \`value\`
FROM mytable1
WHERE \`id\` = :id`

        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding insert stmt', () => {

        const actual = generateInsertStatement('mytable1', columns);
        const expected =
            `INSERT INTO mytable1
(
    \`value\`
)
VALUES
(
    :value
)`
        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding update stmt', () => {

        const actual = generateUpdateStatement('mytable1', columns);
        const expected =
            `UPDATE mytable1
SET
    \`value\` = IF(:valueSet, :value, \`value\`)
WHERE
    \`id\` = :id`

        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding delete stmt', () => {

        const actual = generateDeleteStatement('mytable1', columns);
        const expected =
            `DELETE FROM mytable1
WHERE \`id\` = :id`

        assert.deepStrictEqual(actual, expected);

    })

    it('test tablename with whitespace', () => {

        const actual = generateSelectStatement("my table", columns);
        const expected =
            `SELECT
    \`id\`,
    \`value\`
FROM \`my table\`
WHERE \`id\` = :id`

        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding insert stmt with space in table name', () => {

        const actual = generateInsertStatement('my table', columns);
        const expected =
            `INSERT INTO \`my table\`
(
    \`value\`
)
VALUES
(
    :value
)`
        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding update stmt with space in table name', () => {

        const actual = generateUpdateStatement('my table', columns);
        const expected =
            `UPDATE \`my table\`
SET
    \`value\` = IF(:valueSet, :value, \`value\`)
WHERE
    \`id\` = :id`

        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding delete stmt with space in table name', () => {

        const actual = generateDeleteStatement('my table', columns);
        const expected =
            `DELETE FROM \`my table\`
WHERE \`id\` = :id`

        assert.deepStrictEqual(actual, expected);

    })

});