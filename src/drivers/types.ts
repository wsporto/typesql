import { TaskEither } from 'fp-ts/lib/TaskEither';

export type PostgresColumnSchema = {
	oid: number;
	table_schema: string;
	table_name: string;
	column_name: string;
	type_id: number;
	is_nullable: boolean;
	column_key: 'PRI' | 'UNI' | '';
	autoincrement?: boolean;
};

export type DescribeQueryColumn = {
	name: string;
	tableId: number;
	typeId: number;

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