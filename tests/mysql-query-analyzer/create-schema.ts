import type {
	ColumnSchema,
	GenericColumnSchema
} from '../../src/mysql-query-analyzer/types';
import type { SQLiteType } from '../../src/sqlite-query-analyzer/types';

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
		column: 'descr',
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
		column_type: `enum('x-small','small','medium','large','x-large')`,
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
	}
];

export const sqliteDbSchema: GenericColumnSchema<SQLiteType>[] = [
	{
		column: 'id',
		column_type: 'INTEGER',
		columnKey: 'PRI',
		table: 'mytable1',
		schema: 'mydb',
		notNull: true
	},
	{
		column: 'value',
		column_type: 'INTEGER',
		columnKey: '',
		table: 'mytable1',
		schema: 'mydb',
		notNull: false
	},
	{
		column: 'id',
		column_type: 'INTEGER',
		columnKey: 'PRI',
		table: 'mytable2',
		schema: 'mydb',
		notNull: true
	},
	{
		column: 'name',
		column_type: 'TEXT',
		columnKey: '',
		table: 'mytable2',
		schema: 'mydb',
		notNull: false
	},
	{
		column: 'descr',
		column_type: 'TEXT',
		columnKey: '',
		table: 'mytable2',
		schema: 'mydb',
		notNull: false
	},
	{
		column: 'id',
		column_type: 'INTEGER',
		columnKey: 'PRI',
		table: 'mytable3',
		schema: 'mydb',
		notNull: true
	},
	{
		column: 'double_value',
		column_type: 'REAL',
		columnKey: '',
		table: 'mytable3',
		schema: 'mydb',
		notNull: false
	},
	{
		column: 'name',
		column_type: 'TEXT',
		columnKey: '',
		table: 'mytable3',
		schema: 'mydb',
		notNull: true
	},
	{
		column: 'id',
		column_type: 'TEXT',
		columnKey: 'PRI',
		table: 'mytable4',
		schema: 'mydb',
		notNull: true
	},
	{
		column: 'name',
		column_type: 'TEXT',
		columnKey: '',
		table: 'mytable4',
		schema: 'mydb',
		notNull: false
	},
	{
		column: 'year',
		column_type: 'INTEGER',
		columnKey: '',
		table: 'mytable4',
		schema: 'mydb',
		notNull: false
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'int_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'integer_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'tinyiny_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'smallint_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'mediumint_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'bigint_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'unsignedbigint_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'int2_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'int8_column',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'character_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'varchar_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'varyingcharacter_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'nchar_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'native_character_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'nvarchar_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'text_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'clob_column',
		column_type: 'TEXT',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'blob_column',
		column_type: 'BLOB',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'blob_column2',
		column_type: 'BLOB',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'real_column',
		column_type: 'REAL',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'double_column',
		column_type: 'REAL',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'doubleprecision_column',
		column_type: 'REAL',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'float_column',
		column_type: 'REAL',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'numeric_column',
		column_type: 'NUMERIC',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'decimal_column',
		column_type: 'NUMERIC',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'boolean_column',
		column_type: 'NUMERIC',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'date_column',
		column_type: 'NUMERIC',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'datetime_column',
		column_type: 'NUMERIC',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'all_types',
		column: 'integer_column_default',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: '',
		defaultValue: '10'
	},
	{
		schema: 'main',
		table: 'users',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'users',
		column: 'name',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'posts',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'posts',
		column: 'title',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'posts',
		column: 'body',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'posts',
		column: 'fk_user',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'roles',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'roles',
		column: 'role',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'roles',
		column: 'fk_user',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'comments',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'comments',
		column: 'comment',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'comments',
		column: 'fk_user',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'comments',
		column: 'fk_post',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'books',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'books',
		column: 'title',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'books',
		column: 'isbn',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'authors',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'authors',
		column: 'fullName',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'authors',
		column: 'shortName',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'books_authors',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'books_authors',
		column: 'book_id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'books_authors',
		column: 'author_id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'books_authors',
		column: 'author_ordinal',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'clients',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'clients',
		column: 'primaryAddress',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'clients',
		column: 'secondaryAddress',
		column_type: 'INTEGER',
		notNull: false,
		columnKey: ''
	},
	{
		schema: 'main',
		table: 'addresses',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'main',
		table: 'addresses',
		column: 'address',
		column_type: 'TEXT',
		notNull: true,
		columnKey: ''
	},
	{
		schema: 'users',
		table: 'users',
		column: 'id',
		column_type: 'INTEGER',
		notNull: true,
		columnKey: 'PRI'
	},
	{
		schema: 'users',
		table: 'users',
		column: 'username',
		column_type: 'TEXT',
		notNull: true,
		columnKey: 'UNI'
	}
];
