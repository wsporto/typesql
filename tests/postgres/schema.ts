import { PostgresColumnSchema } from '../../src/drivers/types';

export const schema: PostgresColumnSchema[] = [
	{
		oid: 16396,
		table_name: 'mytable1',
		column_name: 'id',
		is_nullable: false,
		table_schema: 'public',
	},
	{
		oid: 16396,
		table_name: 'mytable1',
		column_name: 'value',
		is_nullable: true,
		table_schema: 'public'
	},
	{
		oid: 16403,
		table_name: 'mytable2',
		column_name: 'id',
		is_nullable: false,
		table_schema: 'public'
	},
	{
		oid: 16403,
		table_name: 'mytable2',
		column_name: 'name',
		is_nullable: true,
		table_schema: 'public'
	},
	{
		oid: 16403,
		table_name: 'mytable2',
		column_name: 'descr',
		is_nullable: true,
		table_schema: 'public'
	},
	{
		oid: 16413,
		table_name: 'mytable3',
		column_name: 'id',
		is_nullable: false,
		table_schema: 'public'
	},
	{
		oid: 16413,
		table_name: 'mytable3',
		column_name: 'double_value',
		is_nullable: true,
		table_schema: 'public'
	},
	{
		oid: 16413,
		table_name: 'mytable3',
		column_name: 'name',
		is_nullable: false,
		table_schema: 'public'
	}
]
