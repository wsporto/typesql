import assert from "assert";
import { extractQueryInfo } from "../../src/mysql-query-analyzer/parse";
import { dbSchema } from "./create-schema";
import { QueryInfoResult } from "../../src/mysql-query-analyzer/types";

describe('Test parse parameters', () => {

    it(`SELECT id FROM mytable1`, () => {
        const sql = `SELECT id FROM mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id as value FROM mytable1`, () => {
        const sql = `SELECT id as value FROM mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id, name FROM mytable2`, () => {
        const sql = `SELECT id, name FROM mytable2`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                },
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id+id FROM mytable1`, () => {
        const sql = `SELECT id+id FROM mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id+id',
                    type: 'bigint',
                    notNull: true
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT id+double_value FROM mytable3`, () => {
        const sql = `SELECT id+double_value FROM mytable3`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id+double_value',
                    type: 'double',
                    notNull: false
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT datetime_column FROM all_types`, () => {
        const sql = `SELECT datetime_column FROM all_types e WHERE datetime_column >= ?`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'datetime_column',
                    type: 'datetime',
                    notNull: true
                }
            ],
            parameters: [
                {
                    type: 'datetime',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT ? FROM mytable3`, () => {
        const sql = `SELECT ? FROM mytable3`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: '?',
                    type: 'varchar',
                    notNull: true
                }
            ],
            parameters: [
                {
                    type: 'varchar',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT CASE WHEN id = 1 then ? else id END from mytable1', () => {
        const sql = `SELECT CASE WHEN id = 1 then ? else id END from mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'CASE WHEN id = 1 then ? else id END',
                    type: 'int',
                    notNull: true

                }
            ],
            parameters: [
                {
                    type: 'int',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT CASE WHEN id = 1 then ? else id END from mytable1', () => {
        const sql = `SELECT CASE WHEN id = 1 then ? else id END from mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'CASE WHEN id = 1 then ? else id END',
                    type: 'int',
                    notNull: true

                }
            ],
            parameters: [
                {
                    type: 'int',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT ?+id from mytable1', () => {
        const sql = `SELECT ?+id from mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: '?+id',
                    type: 'double',
                    notNull: true

                }
            ],
            parameters: [
                {
                    type: 'double',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it('infer case with subselect', () => {
        const sql = `SELECT case when id=1 then ? else (select id from mytable1 where id = 1) end from mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'case when id=1 then ? else (select id from mytable1 where id = 1) end',
                    type: 'int',
                    notNull: false

                }
            ],
            parameters: [
                {
                    type: 'int',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT concat_ws('/', ?, ?, ?) FROM mytable1`, () => {
        const sql = `SELECT concat_ws('/', ?, ?, ?) FROM mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: `concat_ws('/', ?, ?, ?)`,
                    type: 'varchar',
                    notNull: true
                    
                }
            ],
            parameters: [
                {
                    type: 'varchar',
                    notNull: true
                },
                {
                    type: 'varchar',
                    notNull: true
                },
                {
                    type: 'varchar',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it(`SELECT * FROM mytable1`, () => {
        const sql = `SELECT * FROM mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: false
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it('SELECT (SELECT ? FROM mytable2) FROM mytable1', () => {
        const sql = `SELECT (SELECT id FROM mytable2) FROM mytable1`;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: '(SELECT id FROM mytable2)',
                    type: 'int',
                    notNull: false
                }
            ],
            parameters: []
        }


        assert.deepEqual(actual, expected);
    })

    it(`SELECT ?=id, ?=name FROM (SELECT id, name FROM mytable2) t`, () => {
        const sql = `SELECT ?=id, ?=name FROM (SELECT id, name FROM mytable2) t`;

        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: '?=id',
                    type: 'tinyint',
                    notNull: true
                },
                {
                    columnName: '?=name',
                    type: 'tinyint',
                    notNull: false
                }
            ],
            parameters: [
                {
                    type: 'int',
                    notNull: true
                },
                {
                    type: 'varchar',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    });

    it(`parse a select with 3-levels nested select (with alias)`, () => {
        const sql = `
        select id from (
            select matricula as id from (
                select name as matricula from mytable2 
            ) t1
        ) t2
        `;
        const actual = extractQueryInfo(sql, dbSchema);

         const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'varchar',
                    notNull: false
                }
            ],
            parameters: []
        }

        assert.deepEqual(actual, expected);
    })

    it(`select * from subquery`, () => {
        const sql = `
        select * from (
            select name, name as descr, id as value from mytable2
        ) t2 where t2.value = ?
        `;
        const actual = extractQueryInfo(sql, dbSchema);

        const expected: QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'name',
                    type: 'varchar',
                    notNull: false
                },
                {
                    columnName: 'descr',
                    type: 'varchar',
                    notNull: false
                },
                {
                    columnName: 'value',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    type: 'int',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    })

    it('parse a select with UNION and parameters', async () => {
        const sql = `
        SELECT id, value FROM mytable1 where value = ?
        UNION
        SELECT id, name FROM mytable2 where name = ?
        UNION
        SELECT id, id FROM mytable3 where double_value = ?
        `
        const actual = extractQueryInfo(sql, dbSchema);

        const expected : QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                },
                {
                    columnName: 'value',
                    type: 'varchar',
                    notNull: true
                }
            ],
            parameters: [
                {
                    type: 'int',
                    notNull: true
                },
                {
                    type: 'varchar',
                    notNull: true
                },
                {
                    type: 'double',
                    notNull: true
                }

            ]
        }

        assert.deepEqual(actual, expected);
    });

    it('SELECT id FROM mytable1 ORDER BY ?', async () => {
        const sql = `
        SELECT id FROM mytable1 ORDER BY ?
        `
        const actual = extractQueryInfo(sql, dbSchema);

        const expected : QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: [],
            orderByColumns: ['id', 'value']
        }

        assert.deepEqual(actual, expected);
    });

    it('SELECT id FROM mytable1 LIMIT ?', async () => {
        const sql = `
        SELECT id FROM mytable1 LIMIT ?
        `
        const actual = extractQueryInfo(sql, dbSchema);

        const expected : QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    type: 'bigint',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    });

    it('SELECT id FROM mytable1 LIMIT ?, ?', async () => {
        const sql = `
        SELECT id FROM mytable1 LIMIT ?, ?
        `
        const actual = extractQueryInfo(sql, dbSchema);

        const expected : QueryInfoResult = {
            kind: 'Select',
            multipleRowsResult: true,
            columns: [
                {
                    columnName: 'id',
                    type: 'int',
                    notNull: true
                }
            ],
            parameters: [
                {
                    type: 'bigint',
                    notNull: true
                },
                {
                    type: 'bigint',
                    notNull: true
                }
            ]
        }

        assert.deepEqual(actual, expected);
    });

    it('SELECT id FROM mytable1 LIMIT 1', async () => {
        const sql = `
        SELECT id FROM mytable1 LIMIT 1
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, false);
    });

    it('SELECT id FROM mytable1 LIMIT 1,10', async () => {
        const sql = `
        SELECT id FROM mytable1 LIMIT 1,10
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 LIMIT 10,1', async () => {
        const sql = `
        SELECT id FROM mytable1 LIMIT 10,1
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, false);
    });

    it('SELECT id FROM mytable1 WHERE id = 1 LIMIT 10', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id = 1 LIMIT 10
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, false);
    });

    it('SELECT id FROM mytable1 WHERE id+id = 1', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id+id = 1
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 WHERE 1 = id LIMIT 10', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE 1 = id LIMIT 10
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, false);
    });

    it('SELECT id FROM mytable1 WHERE 1 = id LIMIT 10', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE 1 = id+id
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 WHERE id > 10', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id > 10
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 WHERE id > 10 and id = 11', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id > 10 and id = 11
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, false);
    });

    it('SELECT id FROM mytable1 WHERE id > 10 or id = 5', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id > 10 or id = 5
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 WHERE id > 10 or (id = 5 or id = 6)', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id > 10 or (id = 5 or id = 6)
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 WHERE (id = 5 or id = 6) and id = 10', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE (id = 5 or id = 6) and id = 10
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, false);
    });

    it('SELECT id FROM mytable1 WHERE value = 1 LIMIT 10', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE value = 1 LIMIT 10
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT id FROM mytable1 UNION...', async () => {
        const sql = `
        SELECT id FROM mytable1 WHERE id=1
        UNION
        SELECT id FROM mytable2 WHERE id=1
        `
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });

    it('SELECT value FROM mytable1 WHERE value > 1 and value is null', async () => {
        const sql = 'SELECT value FROM mytable1 WHERE value > 1 and value is null'
        
        const actual = extractQueryInfo(sql, dbSchema) as QueryInfoResult;
        assert.deepEqual(actual.multipleRowsResult, true);
    });
});