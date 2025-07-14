import { TaskEither } from 'fp-ts/lib/TaskEither';
import { CheckConstraintResult, EnumMap } from './postgres';
import { PostgresSimpleType } from '../sqlite-query-analyzer/types';

export type PostgresColumnSchema = {
	oid: number;
	table_schema: string;
	table_name: string;
	column_name: string;
	type: PostgresSimpleType;
	is_nullable: boolean;
	column_key: 'PRI' | 'UNI' | '';
	autoincrement?: boolean;
	column_default?: true;
};

export type DescribeQueryColumn = {
	name: string;
	tableId: number;
	typeId: number;

}

export type DescribeParameters = {
	sql: string;
	postgresDescribeResult: PostgresDescribe;
	dbSchema: PostgresColumnSchema[];
	enumsTypes: EnumMap;
	checkConstraints: CheckConstraintResult;
	namedParameters: string[];
}

export type PostgresDescribe = {
	parameters: number[];
	columns: DescribeQueryColumn[];
}
export type DescribeQueryResult = PostgresDescribe & {
	multipleRowsResult: boolean;
}

export type PostgresType = { [key: number]: string }

export type Driver<Connection> = {
	loadDbSchema: (conn: Connection) => TaskEither<string, PostgresColumnSchema[]>;
}