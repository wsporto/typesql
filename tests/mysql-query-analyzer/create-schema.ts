import { ColumnSchema } from "../../src/mysql-query-analyzer/types";

export const dbSchema : ColumnSchema[] = [
    {
        column: 'id',
        column_type: 'int',
        table: 'mytable1',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'value',
        column_type: 'int',
        table: 'mytable1',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'id',
        column_type: 'int',
        table: 'mytable2',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'name',
        column_type: 'varchar',
        table: 'mytable2',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'id',
        column_type: 'int',
        table: 'mytable3',
        schema: 'mydb',
        notNull: true
    },
    {
        column: 'double_value',
        column_type: 'double',
        table: 'mytable3',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'smallint_column',
        column_type: 'smallint',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'int_column',
        column_type: 'int',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'bigint_column',
        column_type: 'bigint',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'float_column',
        column_type: 'float',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'double_column',
        column_type: 'double',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'datetime_column',
        column_type: 'datetime',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    },
    {
        column: 'varchar_column',
        column_type: 'varchar',
        table: 'all_types',
        schema: 'mydb',
        notNull: false
    }
]