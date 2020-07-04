import assert from "assert";
import { parseSqlWalker } from "../src/parser";
import { DBSchema, FieldNullability } from "../src/types";

describe('infer-not-null-experimental', () => {

    const dbSchema: DBSchema = {
        columns: [
            {
                column: 'id',
                table: 'mytable1',
                notNull: true
            },
            {
                column: 'value',
                table: 'mytable1',
                notNull: false
            },
            {
                column: 'id',
                table: 'mytable2',
                notNull: true
            },
            {
                column: 'name',
                table: 'mytable2',
                notNull: false
            },
            {
                column: 'id',
                table: 'mytable3',
                notNull: true
            },
            {
                column: 'double_value',
                table: 'mytable3',
                notNull: false
            }
        ]
    }

    it('select id from mytable1', () => {
        const sql = 'select id from mytable1';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value from mytable1', () => {
        const sql = 'select value from mytable1';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value from mytable1 where value is not null', () => {
        const sql = 'select value from mytable1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select * from mytable1 where value is not null', () => {
        const sql = 'select * from mytable1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select t1.* from mytable1 t1 where value is not null', () => {
        const sql = 'select t1.* from mytable1 t1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value+10 from mytable1 where value is not null', () => {
        const sql = 'select value+10 from mytable1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value+10',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it(`select *, 'desc' as description`, () => {
        const sql = `select *, 'desc' as description from mytable1 where value is not null`;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: true
            },
            {
                name: 'description',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value+10+? from mytable1 where value is not null', () => {
        const sql = 'select value+10+? from mytable1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value+10+?',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select t1.value from mytable1 t1 where t1.value is not null', () => {
        const sql = 'select t1.value from mytable1 t1 where t1.value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select t1.value from mytable1 t1 where value is not null', () => {
        const sql = 'select t1.value from mytable1 t1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select value from mytable1 t1 where t1.value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select t1.value + value from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select t1.value + value from mytable1 t1 where t1.value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 't1.value + value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })
    it('select value as alias from mytable1 t1 where t1.value is not null', async () => {

        const sql = `
        select value as alias from mytable1 t1 where t1.value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'alias',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })
    
    it('select t1.value from mytable1 t1 where id is not null', async () => {

        const sql = `
        select t1.value from mytable1 t1 where id is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value from mytable1 where value is not null or (id > 0 or value is not null)', async () => {

        const sql = `
        select value from mytable1 where value is not null or (id > 0 or value is not null)
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value from mytable1 where value is not null and (id > 0 or value is not null)', async () => {

        const sql = `
        select value from mytable1 where value is not null and (id > 0 or value is not null)
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))', async () => {

        const sql = `
        select value from mytable1 where value is not null or (id > 0 and (id < 10 and value is not null))
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value from mytable1 where id > 0 and id < 10 and value > 1', async () => {

        const sql = `
        select value from mytable1 where id > 0 and id < 10 and value > 1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })
    
    it('select value from mytable1 where value is not null and (value > 1 or value is null)', async () => {

        const sql = `
        select value from mytable1 where value is not null and (value > 1 or value is null)
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })
    
    it('select value from mytable1 where value is not null or (value > 1 and value is null)', async () => {

        const sql = `
        select value from mytable1 where value is not null or (value > 1 and value is null)
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value from mytable1 where value > 1 and value is null', async () => {

        const sql = `
        select value from mytable1 where value > 1 and value is null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value + value from mytable1 where value > 1', async () => {

        const sql = `
        select value + value from mytable1 where value > 1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value + value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value + value from mytable1 where id > 1', async () => {

        const sql = `
        select value + value from mytable1 where id > 1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value + value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })
    
    it('select value + id from mytable1 where value > 1', async () => {

        const sql = `
        select value + id from mytable1 where value > 1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value + id',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select value+id from mytable1 where id > 10', async () => {

        const sql = `
        select value+id from mytable1 where id > 10
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value+id',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select id+id, value from mytable1 where value > 10', async () => {

        const sql = `
        select id+id, value from mytable1 where value > 10
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id+id',
                notNull: true
            },
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })
    
    it('select sum(value) from mytable1 where value > 10', async () => {

        const sql = `
        select sum(value) from mytable1 where value > 10
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'sum(value)',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select sum(value) from mytable1 where value is not null', async () => {

        const sql = `
        select sum(value) from mytable1 where value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'sum(value)',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 1', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select id from mytable1
        UNION
        select value from mytable1 where value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 2', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select id from mytable1
        UNION
        select value from mytable1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 3', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select name from mytable2
        UNION
        select value from mytable1 where value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 4', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select value from mytable1 where value is not null
        UNION
        select value from mytable1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 5', async () => {

        const sql = `
        select *, (select descr from mytable2 where id = 1) from mytable1 where value is not null
        UNION 
        select *, 'description' as description from mytable2 where name is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: true
            },
            {
                name: '(select descr from mytable2 where id = 1)',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 6', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select value+value from mytable1 where value is not null
        UNION
        select value+id from mytable1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('UNION 7', async () => {

        const sql = `
        select name from mytable2 where name is not null
        UNION 
        select value+value as total from mytable1 where value is not null
        UNION
        select value+id from mytable1 where value is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select (select id from mytable1 where id = 10), name, name as name2 from mytable2 where name = abc', async () => {

        const sql = `
        select (select id from mytable1 where id = 10), name, name as name2 from mytable2 where name = 'abc'
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: '(select id from mytable1 where id = 10)',
                notNull: false
            },
            {
                name: 'name',
                notNull: true
            },
            {
                name: 'name2',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select with subquery 1', async () => {

        const sql = `
        select (select id from mytable1 where id = 10) as name1, name, name as name2 from mytable2 where name = 'abc'
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name1',
                notNull: false
            },
            {
                name: 'name',
                notNull: true
            },
            {
                name: 'name2',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select with subquery', async () => {

        const sql = `
        select name, (select id from mytable1 where id = 10) from mytable2 where id is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: false
            },
            {
                name: '(select id from mytable1 where id = 10)',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })
    
    it('select value + subquery', async () => {

        const sql = `
        select id + (select id from mytable2 where id = 10 and id is not null) from mytable1 m1 where id is not null
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id + (select id from mytable2 where id = 10 and id is not null)',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select name from (select name from mytable2 where name is not null) t1', async () => {

        const sql = `
        select name from (select name from mytable2 where name is not null) t1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select name from (select id as name from mytable2) t1', async () => {

        const sql = `
        select name from (select id as name from mytable2) t1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select id from (select * from mytable2) t1', async () => {

        const sql = `
        select id from (select * from mytable2) t1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select * from (select * from mytable2 where name is not null and descr is not null) t1', async () => {

        const sql = `
        select * from (select * from mytable2 where name is not null and descr is not null) t1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select * from (select * from mytable2 where name is not null or descr is not null) t1', async () => {

        const sql = `
        select * from (select * from mytable2 where name is not null or descr is not null) t1
            `;
        
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    })

    it('select * from mytable1', () => {
        const sql = 'select * from mytable1';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value+value from mytable1 where value is not null', () => {
        const sql = 'select value+value from mytable1 where value is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value+value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select value+value from mytable1 where value is not null', () => {
        const sql = 'select value+id from mytable1 where id is not null';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'value+id',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2', () => {
        const sql = 'select * from (select * from (select * from mytable2 where name is not null and descr is not null) t1) t2';
        let timeStart = Date.now();
        const walker = parseSqlWalker(sql);
        let timeEnd = Date.now();
        timeStart = Date.now();
        const actual = walker.inferNotNull(dbSchema);
        timeEnd = Date.now();
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select * from (select * from (select * from mytable2 where id > 10) t1) t2', () => {
        const sql = 'select * from (select * from (select * from mytable2 where id > 10) t1) t2';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('3 levels of subselects on from  - where name is not null on the 2nd level', () => {
        const sql = 'select * from (select * from (select * from mytable2 where id > 10) t1 where name is not null) t2';
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select with left join', () => {
        const sql = `
        select t1.id, t2.id, t1.value, t2.name 
        from mytable1 t1 
        left join mytable2 t2 on t1.id = t2.id;
        `;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select with inner join after left join', () => {
        const sql = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value 
        from mytable1 t1 
        left join mytable2 t2 on t1.id = t2.id
        inner join mytable3 t3 on t2.id = t3.id
        `;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'name',
                notNull: false
            },
            {
                name: 'double_value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select with left join after inner join', () => {
        const sql = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value 
        from mytable1 t1 
        inner join mytable2 t2 on t1.id = t2.id
        left join mytable3 t3 on t2.id = t3.id
        `;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'name',
                notNull: false
            },
            {
                name: 'double_value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select with left join after left join', () => {
        const sql = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value 
        from mytable1 t1 
        left join mytable2 t2 on t1.id = t2.id
        left join mytable3 t3 on t2.id = t3.id
        `;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'name',
                notNull: false
            },
            {
                name: 'double_value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select with left join and internal inner join', () => {
        const sql = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value
        from mytable1 t1 
        left join mytable2 t2
        	inner join mytable3 t3 on t2.id = t3.id
        on t1.id = t2.id
        `;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'name',
                notNull: false
            },
            {
                name: 'double_value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select with left join and internal inner join (using parentheses)', () => {
        const sql = `
        select t1.id, t2.id, t3.id, t1.value, t2.name, t3.double_value
        from mytable1 t1 
        left join (mytable2 t2
        	inner join mytable3 t3 on t2.id = t3.id)
        on t1.id = t2.id
        `;
        const walker = parseSqlWalker(sql);

        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'name',
                notNull: false
            },
            {
                name: 'double_value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select t1.*, t2.* from inner join', () => {
        const sql = `
        select t1.*, t2.*
        from mytable1 t1 
        inner join mytable2 t2 on t1.id = t2.id
        `;
        const walker = parseSqlWalker(sql);
        
        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: false
            },
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'name',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select * with left join and internal inner join (using parentheses)', () => {
        const sql = `
        select t1.*
        from mytable1 t1 
        left join (mytable2 t2
        	inner join mytable3 t3 on t2.id = t3.id)
        on t1.id = t2.id
        `;
        const walker = parseSqlWalker(sql);
        
        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: false
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select * with left join and internal inner join (using parentheses)', () => {
        const sql = `
        select t2.*
        from mytable1 t1 
        left join mytable2 t2
        on t1.id = t2.id
        where t2.name is not null
        `;
        const walker = parseSqlWalker(sql);
        
        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: false
            },
            {
                name: 'name',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });

    it('select * from (union)', () => {
        const sql = `
        select * from (
        select * from mytable1 t1 
        union
        select * from mytable1 t1
        ) t
        where t.value > 10
        `;
        const walker = parseSqlWalker(sql);
        
        const actual = walker.inferNotNull(dbSchema);
        const expected: FieldNullability[] = [
            {
                name: 'id',
                notNull: true
            },
            {
                name: 'value',
                notNull: true
            }
        ]

        assert.deepEqual(actual, expected);
    });


});