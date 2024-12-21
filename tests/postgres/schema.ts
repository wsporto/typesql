import { PostgresColumnSchema } from '../../src/drivers/types';

export const schema: PostgresColumnSchema[] = [
	{
		column_name: "bool_column",
		type_id: 16,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "bytea_column",
		type_id: 17,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "char_column",
		type_id: 1042,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "name_column",
		type_id: 19,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "int8_column",
		type_id: 20,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "int2_column",
		type_id: 21,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "int4_column",
		type_id: 23,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "text_column",
		type_id: 25,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "varchar_column",
		type_id: 1043,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "date_column",
		type_id: 1082,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "bit_column",
		type_id: 1560,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "numeric_column",
		type_id: 1700,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "uuid_column",
		type_id: 2950,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "float4_column",
		type_id: 700,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "float8_column",
		type_id: 701,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "timestamp_column",
		type_id: 1114,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "timestamp_not_null_column",
		type_id: 1114,
		is_nullable: false,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "timestamptz_column",
		type_id: 1184,
		is_nullable: true,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		column_name: "timestamptz_not_null_column",
		type_id: 1184,
		is_nullable: false,
		oid: 16437,
		table_name: "all_types",
		table_schema: "public",
		column_key: ''
	},
	{
		oid: 16396,
		table_name: 'mytable1',
		column_name: 'id',
		type_id: 23,
		is_nullable: false,
		table_schema: 'public',
		column_key: 'PRI'
	},
	{
		oid: 16396,
		table_name: 'mytable1',
		column_name: 'value',
		type_id: 23,
		is_nullable: true,
		table_schema: 'public',
		column_key: ''
	},
	{
		oid: 16403,
		table_name: 'mytable2',
		column_name: 'id',
		type_id: 23,
		is_nullable: false,
		table_schema: 'public',
		column_key: 'PRI'
	},
	{
		oid: 16403,
		table_name: 'mytable2',
		column_name: 'name',
		type_id: 25,
		is_nullable: true,
		table_schema: 'public',
		column_key: ''
	},
	{
		oid: 16403,
		table_name: 'mytable2',
		column_name: 'descr',
		type_id: 25,
		is_nullable: true,
		table_schema: 'public',
		column_key: ''
	},
	{
		oid: 16413,
		table_name: 'mytable3',
		column_name: 'id',
		type_id: 23,
		is_nullable: false,
		table_schema: 'public',
		column_key: 'PRI'
	},
	{
		oid: 16413,
		table_name: 'mytable3',
		column_name: 'double_value',
		type_id: 700,
		is_nullable: true,
		table_schema: 'public',
		column_key: ''
	},
	{
		oid: 16413,
		table_name: 'mytable3',
		column_name: 'name',
		type_id: 25,
		is_nullable: false,
		table_schema: 'public',
		column_key: ''
	},
	{
		column_key: "PRI",
		column_name: "id",
		type_id: 25,
		is_nullable: false,
		oid: 16421,
		table_name: "mytable4",
		table_schema: "public"
	},
	{
		column_key: "",
		column_name: "name",
		type_id: 25,
		is_nullable: true,
		oid: 16421,
		table_name: "mytable4",
		table_schema: "public"
	},
	{
		column_key: "",
		column_name: "year",
		type_id: 23,
		is_nullable: true,
		oid: 16421,
		table_name: "mytable4",
		table_schema: "public"
	},
	{
		column_key: "PRI",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		oid: 16429,
		table_name: "mytable5",
		table_schema: "public"
	},
	{
		column_key: "",
		column_name: "name",
		type_id: 25,
		is_nullable: true,
		oid: 16429,
		table_name: "mytable5",
		table_schema: "public"
	},
	{
		column_key: "",
		column_name: "year",
		type_id: 23,
		is_nullable: true,
		oid: 16429,
		table_name: "mytable5",
		table_schema: "public"
	}
]
