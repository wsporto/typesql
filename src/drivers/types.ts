import { TaskEither } from 'fp-ts/lib/TaskEither';
import { PostgresSimpleType } from '../sqlite-query-analyzer/types';
import { PostgresSchemaInfo } from '../schema-info';

export type PostgresColumnSchema = {
	schema: string;
	table: string;
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
	schemaInfo: PostgresSchemaInfo;
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