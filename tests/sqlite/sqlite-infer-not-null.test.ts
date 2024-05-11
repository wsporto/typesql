import assert from "assert";
import { SchemaDef } from "../../src/types";
import { isLeft } from "fp-ts/lib/Either";
import { parseSql } from "../../src/sqlite-query-analyzer/parser";
import { sqliteDbSchema } from "../mysql-query-analyzer/create-schema";
import { ColumnInfo } from "../../src/mysql-query-analyzer/types";

describe('sqlite-infer-not-null.test', () => {

    it('select with left join', () => {
        const sql = `
        select t1.id, t2.id, t1.value, t2.name 
        from mytable1 t1 
        left join mytable2 t2 on t1.id = t2.id;
        `;
        const result = parseSql(sql, sqliteDbSchema);
        if (isLeft(result)) {
            assert.fail(`Shouldn't return an error`);
        }
        const actual = getColumnNullability(result.right.columns);

        const expected = [true, false, false, false];

        assert.deepStrictEqual(actual, expected);
    });
});

function getColumnNullability(columns: ColumnInfo[]) {
    return columns.map(col => col.notNull);
}