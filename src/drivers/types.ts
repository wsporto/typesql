import { TaskEither } from 'fp-ts/lib/TaskEither';
import { CheckConstraintResult, EnumMap } from './postgres';
import { PostgresSimpleType } from '../sqlite-query-analyzer/types';
import { UserFunctionSchema } from '../postgres-query-analyzer/types';

export type PostgresColumnSchema = {
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
	userFunctions: UserFunctionSchema[]
	namedParameters: string[];
}

export type PostgresDescribe = {
	parameters: number[];
	columns: DescribeQueryColumn[];
}
export type DescribeQueryResult = PostgresDescribe & {
	multipleRowsResult: boolean;
}

export type PostgresTypeHash = { [key: number]: PostgresSimpleType | undefined }

export type Driver<Connection> = {
	loadDbSchema: (conn: Connection) => TaskEither<string, PostgresColumnSchema[]>;
}