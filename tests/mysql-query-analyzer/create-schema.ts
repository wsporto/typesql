import { ColumnSchema } from "../../src/mysql-query-analyzer/types";

export const dbSchema: ColumnSchema[] = [
    {
        column: 'id',
        column_type: 'int',
        columnKey: 'PRI',
        table: 'mytable1',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'value',
        column_type: 'int',
        columnKey: '',
        table: 'mytable1',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'id',
        column_type: 'int',
        columnKey: 'PRI',
        table: 'mytable2',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'name',
        column_type: 'varchar',
        columnKey: '',
        table: 'mytable2',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'id',
        column_type: 'int',
        columnKey: 'PRI',
        table: 'mytable3',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'double_value',
        column_type: 'double',
        columnKey: '',
        table: 'mytable3',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'smallint_column',
        column_type: 'smallint',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'int_column',
        column_type: 'int',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'bigint_column',
        column_type: 'bigint',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'float_column',
        column_type: 'float',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'double_column',
        column_type: 'double',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'decimal_column',
        column_type: 'decimal',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'datetime_column',
        column_type: 'datetime',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'varchar_column',
        column_type: 'varchar',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'enum_column',
        column_type: `enum('x-small', 'small', 'medium', 'large', 'x-large')`,
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'char_column',
        column_type: 'char',
        columnKey: '',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'id',
        column_type: 'int',
        columnKey: 'PRI',
        table: 'my table',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'name',
        column_type: 'varchar',
        columnKey: '',
        table: 'my table',
        schema: 'mydb',
        notNull: false
    },
]