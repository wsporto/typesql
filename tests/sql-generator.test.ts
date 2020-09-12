import { ColumnSchema2 } from "../src/mysql-query-analyzer/types"
import { generateInsertStatment, generateSelectStatment, generateUpdateStatment, generateDeleteStatment } from "../src/sql-generator"
import assert from "assert";

describe('code-generator', () => {

    const columns: ColumnSchema2[] = [
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

        const actual = generateSelectStatment('mytable1', columns);
        const expected = 
`SELECT
    id,
    value
FROM mytable1`

        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding insert stmt', () => {

        const actual = generateInsertStatment('mytable1', columns);
        const expected = 
`INSERT INTO mytable1
(
    value
)
VALUES
(
    :value
)`        
        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding update stmt', () => {

        const actual = generateUpdateStatment('mytable1', columns);
        const expected = 
`UPDATE mytable1
SET
    value = :value
WHERE
    id = :id`      

        assert.deepStrictEqual(actual, expected);

    })

    it('test scaffolding delete stmt', () => {

        const actual = generateDeleteStatment('mytable1', columns);
        const expected = 
`DELETE FROM mytable1
WHERE id = :id`

        assert.deepStrictEqual(actual, expected);

    })
    
});