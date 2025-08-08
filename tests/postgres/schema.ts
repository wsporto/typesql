import { CheckConstraintResult, EnumMap, EnumResult } from '../../src/drivers/postgres';
import { PostgresColumnSchema } from '../../src/drivers/types';
import { UserFunctionSchema } from '../../src/postgres-query-analyzer/types';
import { PostgresSchemaInfo } from '../../src/schema-info';
import postgres from 'postgres';

export const schema: PostgresColumnSchema[] = [
	{
		schema: "public",
		table: "addresses",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "addresses",
		column_name: "address",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "bool_column",
		type: 'bool',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "bytea_column",
		type: 'bytea',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "char_column",
		type: 'bpchar',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "name_column",
		type: 'name',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "int8_column",
		type: 'int8',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "int2_column",
		type: 'int2',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "int4_column",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "text_column",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "varchar_column",
		type: 'varchar',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "date_column",
		type: 'date',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "bit_column",
		type: 'bit',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "numeric_column",
		type: 'numeric',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "uuid_column",
		type: 'uuid',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "float4_column",
		type: 'float4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "float8_column",
		type: 'float8',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "timestamp_column",
		type: 'timestamp',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "timestamp_not_null_column",
		type: 'timestamp',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "timestamptz_column",
		type: 'timestamptz',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "all_types",
		column_name: "timestamptz_not_null_column",
		type: 'timestamptz',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'all_types',
		column_name: 'enum_column',
		type: 'enum()', //16651
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'all_types',
		column_name: 'enum_constraint',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'all_types',
		column_name: 'integer_column_default',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false,
		column_default: true
	},
	{
		schema: 'public',
		table: 'all_types',
		column_name: 'enum_column_default',
		type: 'enum()', //16651,
		is_nullable: true,
		column_key: '',
		autoincrement: false,
		column_default: true
	},
	{
		schema: 'public',
		table: 'all_types',
		column_name: 'enum_constraint_default',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false,
		column_default: true
	},
	{
		schema: 'public',
		table: 'all_types',
		column_name: 'positive_number_column',
		type: 'int4',
		is_nullable: true,
		autoincrement: false,
		column_key: '',
	},
	{
		schema: "public",
		table: "answers",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "answers",
		column_name: "answer",
		type: 'varchar',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "answers",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "answers",
		column_name: "fk_question",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "authors",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "authors",
		column_name: "fullname",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "authors",
		column_name: "shortname",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "books",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "books",
		column_name: "title",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "books",
		column_name: "isbn",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "books_authors",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "books_authors",
		column_name: "book_id",
		type: 'int8',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "books_authors",
		column_name: "author_id",
		type: 'int8',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "books_authors",
		column_name: "author_ordinal",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "clients",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "clients",
		column_name: "primaryaddress",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "clients",
		column_name: "secondaryaddress",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "comments",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "comments",
		column_name: "comment",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "comments",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "comments",
		column_name: "fk_post",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'composite_key',
		column_name: 'key1',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'composite_key',
		column_name: 'key2',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'composite_key',
		column_name: 'value',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'composite_unique_constraint',
		column_name: 'key1',
		type: 'int4',
		is_nullable: true,
		column_key: 'UNI',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'composite_unique_constraint',
		column_name: 'key2',
		type: 'int4',
		is_nullable: true,
		column_key: 'UNI',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'composite_unique_constraint',
		column_name: 'value',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'id',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'column1',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'column2',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'column3',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'column4',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'column5',
		type: 'text',
		is_nullable: false,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types',
		column_name: 'column6',
		type: 'int4',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types2',
		column_name: 'id',
		type: 'int4',
		is_nullable: false,
		column_key: 'PRI',
		autoincrement: false
	},
	{
		schema: 'public',
		table: 'enum_types2',
		column_name: 'column1',
		type: 'text',
		is_nullable: true,
		column_key: '',
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable1",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true
	},
	{
		schema: "public",
		table: "mytable1",
		column_name: "value",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable2",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true
	},
	{
		schema: "public",
		table: "mytable2",
		column_name: "name",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable2",
		column_name: "descr",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable3",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true
	},
	{
		schema: "public",
		table: "mytable3",
		column_name: "double_value",
		type: 'float4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable3",
		column_name: "name",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable4",
		column_name: "id",
		type: 'text',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable4",
		column_name: "name",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable4",
		column_name: "year",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable5",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable5",
		column_name: "name",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "mytable5",
		column_name: "year",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "participants",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "participants",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "participants",
		column_name: "fk_survey",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "posts",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "posts",
		column_name: "title",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "posts",
		column_name: "body",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "posts",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "questions",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "questions",
		column_name: "questions",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "questions",
		column_name: "fk_survey",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "roles",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "roles",
		column_name: "role",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false,
		column_default: true
	},
	{
		schema: "public",
		table: "roles",
		column_name: "fk_user",
		type: 'int4',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "surveys",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "surveys",
		column_name: "name",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "users",
		column_name: "id",
		type: 'int4',
		is_nullable: false,
		column_key: "PRI",
		autoincrement: true,
		column_default: true
	},
	{
		schema: "public",
		table: "users",
		column_name: "name",
		type: 'text',
		is_nullable: false,
		column_key: "",
		autoincrement: false
	},
	{
		schema: "public",
		table: "users",
		column_name: "email",
		type: 'text',
		is_nullable: true,
		column_key: "",
		autoincrement: false
	}
]

export const userDefinedFunctions: UserFunctionSchema[] = [
	{
		schema: 'public',
		function_name: 'get_clients_with_addresses',
		arguments: '',
		return_type: 'TABLE(id integer, primaryaddress json, secondaryaddress json)',
		definition: '\r\n  SELECT \r\n    c.id, \r\n    json_build_object(\r\n      \'id\', a1.id,\r\n      \'address\', a1.address\r\n    ),\r\n    CASE\r\n      WHEN a2.id IS NOT NULL THEN json_build_object(\r\n        \'id\', a2.id,\r\n        \'address\', a2.address\r\n      )\r\n      ELSE NULL\r\n    END AS secondaryAddress\r\n  FROM clients c\r\n  JOIN addresses a1 ON c.primaryAddress = a1.id\r\n  LEFT JOIN addresses a2 ON c.secondaryAddress = a2.id;\r\n',
		language: 'sql'
	},
	{
		schema: 'public',
		function_name: 'get_mytable1',
		arguments: '',
		return_type: 'SETOF mytable1',
		definition: '\r\n  SELECT * FROM mytable1;\r\n',
		language: 'sql'
	},
	{
		schema: 'public',
		function_name: 'get_mytable1_by_id',
		arguments: 'id integer',
		return_type: 'SETOF mytable1',
		definition: '\r\n  SELECT * FROM mytable1 WHERE id = $1;\r\n',
		language: 'sql'
	},
	{
		schema: 'public',
		function_name: 'get_mytable_plpgsql',
		arguments: '',
		return_type: 'TABLE(id integer, value integer)',
		definition: '\r\nBEGIN\r\n    RETURN QUERY\r\n    SELECT * FROM mytable1;\r\nEND;\r\n',
		language: 'plpgsql'
	},
	{
		schema: 'public',
		function_name: 'get_users_with_posts',
		arguments: '',
		return_type: 'TABLE(id integer, posts json)',
		definition: '\r\n    SELECT\r\n        u.id,\r\n        (\r\n            SELECT json_agg(\r\n                json_build_object(\r\n                    \'id\', p.id,\r\n                    \'title\', p.title\r\n                )\r\n            )\r\n            FROM posts p\r\n            WHERE p.fk_user = u.id\r\n        ) AS posts\r\n    FROM users u;\r\n',
		language: 'sql'
	},
	{
		schema: 'public',
		function_name: 'get_users_with_posts_plpgsql',
		arguments: '',
		return_type: 'TABLE(id integer, posts json)',
		definition: '\r\nBEGIN\r\n    RETURN QUERY\r\n    SELECT\r\n        u.id,\r\n        (\r\n            SELECT json_agg(\r\n                json_build_object(\r\n                    \'id\', p.id,\r\n                    \'title\', p.title\r\n                )\r\n            )\r\n            FROM posts p\r\n            WHERE p.fk_user = u.id\r\n        ) AS posts\r\n    FROM users u;\r\nEND;\r\n',
		language: 'plpgsql'
	}
]

export const enumMap: EnumMap = new Map();
const enumValues: EnumResult[] = [
	{
		type_oid: 16651,
		enumlabel: 'x-small',
		enum_name: 'sizes_enum'
	},
	{
		type_oid: 16651,
		enumlabel: 'small',
		enum_name: 'sizes_enum'
	},
	{
		type_oid: 16651,
		enumlabel: 'medium',
		enum_name: 'sizes_enum'
	},
	{
		type_oid: 16651,
		enumlabel: 'large',
		enum_name: 'sizes_enum'
	},
	{
		type_oid: 16651,
		enumlabel: 'x-large',
		enum_name: 'sizes_enum'
	}
]
enumMap.set(16651, enumValues);

export const checkConstraints: CheckConstraintResult = {
	'[public][all_types][enum_constraint]': `enum('x-small','small','medium','large','x-large')`,
	'[public][all_types][enum_constraint_default]': `enum('x-small','small','medium','large','x-large')`,
	'[public][enum_types2][column1]': `enum('f','g')`,
	'[public][enum_types][column1]': `enum('A','B','C')`,
	'[public][enum_types][column2]': `enum(1,2)`,
	'[public][enum_types][column5]': `enum('D','E')`,
}

export const userFunctions: UserFunctionSchema[] = [
	{
		schema: "public",
		function_name: "check_users",
		arguments: "u users",
		return_type: "TABLE(user_ok boolean)",
		definition: `
  SELECT true AS user_ok FROM users
`,
		language: "sql",
	},
	{
		schema: "public",
		function_name: "get_clients_with_addresses",
		arguments: "",
		return_type: "TABLE(id integer, primaryaddress json, secondaryaddress json)",
		definition: `
  SELECT 
    c.id, 
    json_build_object(
      'id', a1.id,
      'address', a1.address
    ),
    CASE
      WHEN a2.id IS NOT NULL THEN json_build_object(
        'id', a2.id,
        'address', a2.address
      )
      ELSE NULL
    END AS secondaryAddress
  FROM clients c
  JOIN addresses a1 ON c.primaryAddress = a1.id
  LEFT JOIN addresses a2 ON c.secondaryAddress = a2.id;
`,
		language: "sql",
	},
	{
		schema: "public",
		function_name: "get_mytable1",
		arguments: "",
		return_type: "SETOF mytable1",
		definition: `
  SELECT * FROM mytable1;
`,
		language: "sql",
	},
	{
		schema: "public",
		function_name: "get_mytable1_by_id",
		arguments: "id integer",
		return_type: "SETOF mytable1",
		definition: `
  SELECT * FROM mytable1 WHERE id = $1;
`,
		language: "sql",
	},
	{
		schema: "public",
		function_name: "get_mytable1_with_nested_function",
		arguments: "",
		return_type: "TABLE(id integer, value integer, posts json)",
		definition: `
    SELECT 
      mytable1.*, 
      get_users_with_posts.posts 
    FROM mytable1
    INNER JOIN get_users_with_posts() ON get_users_with_posts.id = mytable1.id
`,
		language: "sql",
	},
	{
		schema: "public",
		function_name: "get_mytable_plpgsql",
		arguments: "",
		return_type: "TABLE(id integer, value integer)",
		definition: `
BEGIN
    RETURN QUERY
    SELECT * FROM mytable1;
END;
`,
		language: "plpgsql",
	},
	{
		schema: "public",
		function_name: "get_users_with_posts",
		arguments: "",
		return_type: "TABLE(id integer, posts json)",
		definition: `
    SELECT
        u.id,
        (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'title', p.title
                )
            )
            FROM posts p
            WHERE p.fk_user = u.id
        ) AS posts
    FROM users u;
`,
		language: "sql",
	},
	{
		schema: "public",
		function_name: "get_users_with_posts_plpgsql",
		arguments: "",
		return_type: "TABLE(id integer, posts json)",
		definition: `
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'title', p.title
                )
            )
            FROM posts p
            WHERE p.fk_user = u.id
        ) AS posts
    FROM users u;
END;
`,
		language: "plpgsql",
	},
]

export function createSchemaInfo(): PostgresSchemaInfo {
	const schemaInfo: PostgresSchemaInfo = {
		kind: 'pg',
		columns: schema,
		foreignKeys: [],
		userFunctions,
		enumTypes: enumMap,
		checkConstraints
	}
	return schemaInfo;
}

export function createTestClient() {
	return postgres({
		host: 'localhost',
		username: 'postgres',
		password: 'password',
		database: 'postgres',
		port: 5432
	});
}

function normalizeNewlines(str: string) {
	return str.replace(/\r\n/g, '\n');
}

export function normalizeUserFunctions(userFunctions: UserFunctionSchema[]) {
	const normalized = userFunctions.map(r => ({
		...r, definition: normalizeNewlines(r.definition)
	}));
	return normalized
}
