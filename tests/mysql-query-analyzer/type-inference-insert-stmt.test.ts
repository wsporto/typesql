
import assert from "assert";
import { parseAndInfer } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { TypeInferenceResult, ColumnSchema } from "../../src/mysql-query-analyzer/types";

describe('type-inference test', () => {

    it(`SELECT id FROM mytable1`, () => {
        const sql = `INSERT INTO mytable1 (value) VALUES (?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['int']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`INSERT INTO mydb.mytable1 (value) VALUES (?)`, () => {
        const sql = `INSERT INTO mydb.mytable1 (value) VALUES (?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['int']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`INSERT INTO alltypes (double_column, int_column, varchar_column) VALUES (?, ?, ?)`, () => {
        const sql = `INSERT INTO all_types (double_column, int_column, varchar_column) VALUES (?, ?, ?)`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['double', 'int', 'varchar']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`INSERT INTO mytable1 VALUES (DEFAULT, ?, ?, DEFAULT)`, () => {
        //values(int, int, double, bigint)
        const sql = `INSERT INTO mytable1 VALUES (DEFAULT, ?, ?, DEFAULT)`;
        const newSchema : ColumnSchema [] = [
            ...dbSchema,
            {
                column: 'column3',
                column_type: 'double',
                columnKey: '',
                table: 'mytable1',
                schema: 'mydb',
                notNull: false
            },
            {
                column: 'column4',
                column_type: 'bigint',
                columnKey: '',
                table: 'mytable1',
                schema: 'mydb',
                notNull: false
            }
        ]
        const actual = parseAndInfer(sql, newSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['int', 'double']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`INSERT INTO all_types (double_column) VALUE (subquery)`, () => {
        const sql = `INSERT INTO all_types (double_column) 
                     VALUES (
                        (SELECT double_value FROM mytable3 WHERE id = ?)
                    )`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['int']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`INSERT INTO alltypes (double_column, int_column) VALUES (?, ?)`, () => {
        const sql = `INSERT INTO all_types (bigint_column) 
                     VALUES (
                        (SELECT ? from mytable2)
                    )`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['bigint']   
        }

        assert.deepEqual(actual, expected);
    })

    it(`INSERT INTO alltypes (double_column, int_column) VALUES (?, ?)`, () => {
        const sql = `INSERT INTO all_types (double_column, bigint_column) 
                     VALUES (
                        (SELECT double_column+? FROM all_types WHERE int_column = ?),
                        (SELECT id + id + ? from mytable2 WHERE name = ?)
                    )`;
        const actual = parseAndInfer(sql, dbSchema);

        const expected : TypeInferenceResult = {
            columns: [],
            parameters: ['double', 'int', 'bigint', 'varchar']   
        }

        assert.deepEqual(actual, expected);
    })
    

});