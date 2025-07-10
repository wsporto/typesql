import { ParameterDef } from '../types';
import { DynamicSqlInfoResult2 } from '../mysql-query-analyzer/types';
import { RelationInfo2 } from '../sqlite-query-analyzer/sqlite-describe-nested-query';
import { PostgresType } from '../sqlite-query-analyzer/types';

export type PostgresQueryType = 'Select' | 'Insert' | 'Update' | 'Delete' | 'Copy';

export type PostgresColumnInfo = {
	name: string;
	type: PostgresType;
	notNull: boolean;
	table: string;
}

export type PostgresParameterDef = {
	name: string;
	type: PostgresType;
	notNull: boolean;
	list?: boolean; //id in (?)
}

export type PostgresSchemaDef = {
	sql: string;
	queryType: PostgresQueryType;
	multipleRowsResult: boolean;
	returning?: true;
	columns: PostgresColumnInfo[];
	orderByColumns?: string[];
	parameters: PostgresParameterDef[];
	data?: PostgresParameterDef[];
	dynamicSqlQuery2?: DynamicSqlInfoResult2;
	nestedInfo?: RelationInfo2[];
};