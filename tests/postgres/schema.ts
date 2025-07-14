import { PostgresColumnSchema } from '../../src/drivers/types';

export const schema: PostgresColumnSchema[] = [
	{
		oid: 16613,
		table_schema: "public",
		table_name: "addresses",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16613,
		table_schema: "public",
		table_name: "addresses",
		column_name: "address",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "bool_column",
		type: 'bool',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "bytea_column",
		type: 'bytea',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "char_column",
		type: 'bpchar',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "name_column",
		type: 'name',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "int8_column",
		type: 'int8',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "int2_column",
		type: 'int2',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "int4_column",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "text_column",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "varchar_column",
		type: 'varchar',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "date_column",
		type: 'date',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "bit_column",
		type: 'bit',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "numeric_column",
		type: 'numeric',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "uuid_column",
		type: 'uuid',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "float4_column",
		type: 'float4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "float8_column",
		type: 'float8',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamp_column",
		type: 'timestamp',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamp_not_null_column",
		type: 'timestamp',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamptz_column",
		type: 'timestamptz',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: "public",
		table_name: "all_types",
		column_name: "timestamptz_not_null_column",
		type: 'timestamptz',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: 'public',
		table_name: 'all_types',
		column_name: 'enum_column',
		type: 'enum()', //16651
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: 'public',
		table_name: 'all_types',
		column_name: 'enum_constraint',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16437,
		table_schema: 'public',
		table_name: 'all_types',
		column_name: 'integer_column_default',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false,
		column_default: true
	},
	{
		oid: 16437,
		table_schema: 'public',
		table_name: 'all_types',
		column_name: 'enum_column_default',
		type: 'enum()', //16651,
		is_nullable: true,
		column_key: '',
		autoincrement: false,
		column_default: true
	},
	{
		oid: 16437,
		table_schema: 'public',
		table_name: 'all_types',
		column_name: 'enum_constraint_default',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false,
		column_default: true
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "answer",
		type: 'varchar',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16555,
		table_schema: "public",
		table_name: "answers",
		column_name: "fk_question",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16584,
		table_schema: "public",
		table_name: "authors",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16584,
		table_schema: "public",
		table_name: "authors",
		column_name: "fullname",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16584,
		table_schema: "public",
		table_name: "authors",
		column_name: "shortname",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16573,
		table_schema: "public",
		table_name: "books",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16573,
		table_schema: "public",
		table_name: "books",
		column_name: "title",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16573,
		table_schema: "public",
		table_name: "books",
		column_name: "isbn",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16595,
		table_schema: "public",
		table_name: "books_authors",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16595,
		table_schema: "public",
		table_name: "books_authors",
		column_name: "book_id",
		type: 'int8',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16595,
		table_schema: "public",
		table_name: "books_authors",
		column_name: "author_id",
		type: 'int8',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16595,
		table_schema: "public",
		table_name: "books_authors",
		column_name: "author_ordinal",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16624,
		table_schema: "public",
		table_name: "clients",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16624,
		table_schema: "public",
		table_name: "clients",
		column_name: "primaryaddress",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16624,
		table_schema: "public",
		table_name: "clients",
		column_name: "secondaryaddress",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "comment",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16472,
		table_schema: "public",
		table_name: "comments",
		column_name: "fk_post",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16640,
		table_schema: 'public',
		table_name: 'composite_key',
		column_name: 'key1',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		oid: 16640,
		table_schema: 'public',
		table_name: 'composite_key',
		column_name: 'key2',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		oid: 16640,
		table_schema: 'public',
		table_name: 'composite_key',
		column_name: 'value',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16645,
		table_schema: 'public',
		table_name: 'composite_unique_constraint',
		column_name: 'key1',
		type: 'int4',
		is_nullable: true,
		column_key: 'UNI',
		autoincrement: false
	},
	{
		oid: 16645,
		table_schema: 'public',
		table_name: 'composite_unique_constraint',
		column_name: 'key2',
		type: 'int4',
		is_nullable: true,
		column_key: 'UNI',
		autoincrement: false
	},
	{
		oid: 16645,
		table_schema: 'public',
		table_name: 'composite_unique_constraint',
		column_name: 'value',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'id',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'column1',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'column2',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'column3',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'column4',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'column5',
		type: 'text',
		is_nullable: false,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16666,
		table_schema: 'public',
		table_name: 'enum_types',
		column_name: 'column6',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16680,
		table_schema: 'public',
		table_name: 'enum_types2',
		column_name: 'id',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		oid: 16680,
		table_schema: 'public',
		table_name: 'enum_types2',
		column_name: 'column1',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		oid: 16396,
		table_schema: "public",
		table_name: "mytable1",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true
	},
	{
		oid: 16396,
		table_schema: "public",
		table_name: "mytable1",
		column_name: "value",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16403,
		table_schema: "public",
		table_name: "mytable2",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true
	},
	{
		oid: 16403,
		table_schema: "public",
		table_name: "mytable2",
		column_name: "name",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16403,
		table_schema: "public",
		table_name: "mytable2",
		column_name: "descr",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16413,
		table_schema: "public",
		table_name: "mytable3",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true
	},
	{
		oid: 16413,
		table_schema: "public",
		table_name: "mytable3",
		column_name: "double_value",
		type: 'float4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16413,
		table_schema: "public",
		table_name: "mytable3",
		column_name: "name",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16421,
		table_schema: "public",
		table_name: "mytable4",
		column_name: "id",
		type: 'text',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: false
	},
	{
		oid: 16421,
		table_schema: "public",
		table_name: "mytable4",
		column_name: "name",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16421,
		table_schema: "public",
		table_name: "mytable4",
		column_name: "year",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16429,
		table_schema: "public",
		table_name: "mytable5",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: false
	},
	{
		oid: 16429,
		table_schema: "public",
		table_name: "mytable5",
		column_name: "name",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16429,
		table_schema: "public",
		table_name: "mytable5",
		column_name: "year",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16521,
		table_schema: "public",
		table_name: "participants",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16521,
		table_schema: "public",
		table_name: "participants",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16521,
		table_schema: "public",
		table_name: "participants",
		column_name: "fk_survey",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "title",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "body",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16456,
		table_schema: "public",
		table_name: "posts",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16539,
		table_schema: "public",
		table_name: "questions",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16539,
		table_schema: "public",
		table_name: "questions",
		column_name: "questions",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16539,
		table_schema: "public",
		table_name: "questions",
		column_name: "fk_survey",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16493,
		table_schema: "public",
		table_name: "roles",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16493,
		table_schema: "public",
		table_name: "roles",
		column_name: "role",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false,
		column_default: true
	},
	{
		oid: 16493,
		table_schema: "public",
		table_name: "roles",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16510,
		table_schema: "public",
		table_name: "surveys",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16510,
		table_schema: "public",
		table_name: "surveys",
		column_name: "name",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16445,
		table_schema: "public",
		table_name: "users",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		oid: 16445,
		table_schema: "public",
		table_name: "users",
		column_name: "name",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		oid: 16445,
		table_schema: "public",
		table_name: "users",
		column_name: "email",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	}
]
