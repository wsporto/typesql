import { ColumnSchema } from '../mysql-query-analyzer/types';

export const virtualTablesSchema: ColumnSchema[] = [
	{
		column: 'key',
		column_type: 'any',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'value',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'type',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'atom',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: false,
		hidden: 2
	},
	{
		column: 'id',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'parent',
		column_type: 'INTEGER',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'fullkey',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'path',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'json',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: true,
		hidden: 1
	},
	{
		column: 'root',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_each',
		schema: 'main',
		notNull: true,
		hidden: 1
	},
	{
		column: 'key',
		column_type: 'any',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'value',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'type',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'atom',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: false,
		hidden: 2
	},
	{
		column: 'id',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'parent',
		column_type: 'INTEGER',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: false,
		hidden: 0
	},
	{
		column: 'fullkey',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'path',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: true,
		hidden: 0
	},
	{
		column: 'json',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: true,
		hidden: 1
	},
	{
		column: 'root',
		column_type: 'TEXT',
		columnKey: '',
		table: 'json_tree',
		schema: 'main',
		notNull: true,
		hidden: 1
	}
];
