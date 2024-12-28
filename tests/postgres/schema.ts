import { PostgresColumnSchema } from '../../src/drivers/types';

export const schema: PostgresColumnSchema[] = [
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "bool_column",
		type_id: 16,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "bytea_column",
		type_id: 17,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "char_column",
		type_id: 1042,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "name_column",
		type_id: 19,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "int8_column",
		type_id: 20,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "int2_column",
		type_id: 21,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "int4_column",
		type_id: 23,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "text_column",
		type_id: 25,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "varchar_column",
		type_id: 1043,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "date_column",
		type_id: 1082,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "bit_column",
		type_id: 1560,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "numeric_column",
		type_id: 1700,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "uuid_column",
		type_id: 2950,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "float4_column",
		type_id: 700,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "float8_column",
		type_id: 701,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamp_column",
		type_id: 1114,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamp_not_null_column",
		type_id: 1114,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamptz_column",
		type_id: 1184,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamptz_not_null_column",
		type_id: 1184,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "answer",
		type_id: 1043,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "fk_user",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "fk_question",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "comment",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "fk_user",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "fk_post",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16396,
		table_schema: "public",
		table_name: "mytable1",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16396,
		table_schema: "public",
		table_name: "mytable1",
		column_name: "value",
		type_id: 23,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16403,
		table_schema: "public",
		table_name: "mytable2",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16403,
		table_schema: "public",
		table_name: "mytable2",
		column_name: "name",
		type_id: 25,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16403,
		table_schema: "public",
		table_name: "mytable2",
		column_name: "descr",
		type_id: 25,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16413,
		table_schema: "public",
		table_name: "mytable3",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16413,
		table_schema: "public",
		table_name: "mytable3",
		column_name: "double_value",
		type_id: 700,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16413,
		table_schema: "public",
		table_name: "mytable3",
		column_name: "name",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16421,
		table_schema: "public",
		table_name: "mytable4",
		column_name: "id",
		type_id: 25,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16421,
		table_schema: "public",
		table_name: "mytable4",
		column_name: "name",
		type_id: 25,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16421,
		table_schema: "public",
		table_name: "mytable4",
		column_name: "year",
		type_id: 23,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16429,
		table_schema: "public",
		table_name: "mytable5",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16429,
		table_schema: "public",
		table_name: "mytable5",
		column_name: "name",
		type_id: 25,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16429,
		table_schema: "public",
		table_name: "mytable5",
		column_name: "year",
		type_id: 23,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16521,
		table_schema: "public",
		table_name: "participants",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16521,
		table_schema: "public",
		table_name: "participants",
		column_name: "fk_user",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16521,
		table_schema: "public",
		table_name: "participants",
		column_name: "fk_survey",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "title",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "body",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "fk_user",
		type_id: 23,
		is_nullable: true,
		column_key: "",
	},
	{
		oid: 16539,
		table_schema: "public",
		table_name: "questions",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16539,
		table_schema: "public",
		table_name: "questions",
		column_name: "questions",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16539,
		table_schema: "public",
		table_name: "questions",
		column_name: "fk_survey",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16493,
		table_schema: "public",
		table_name: "roles",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16493,
		table_schema: "public",
		table_name: "roles",
		column_name: "role",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16493,
		table_schema: "public",
		table_name: "roles",
		column_name: "fk_user",
		type_id: 23,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16510,
		table_schema: "public",
		table_name: "surveys",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16510,
		table_schema: "public",
		table_name: "surveys",
		column_name: "name",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16445,
		table_schema: "public",
		table_name: "users",
		column_name: "id",
		type_id: 23,
		is_nullable: false,
		column_key: "PRI",
	},
	{
		oid: 16445,
		table_schema: "public",
		table_name: "users",
		column_name: "name",
		type_id: 25,
		is_nullable: false,
		column_key: "",
	},
	{
		oid: 16445,
		table_schema: "public",
		table_name: "users",
		column_name: "email",
		type_id: 25,
		is_nullable: true,
		column_key: "",
	}
]
