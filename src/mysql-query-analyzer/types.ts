import type { NestedResultInfo } from '../describe-nested-query';
import type { MySqlType, InferType, DbType } from '../mysql-mapping';
import type { Relation2 } from '../sqlite-query-analyzer/sqlite-describe-nested-query';
import type { PostgresSimpleType, SQLiteType } from '../sqlite-query-analyzer/types';
import type { ParameterDef } from '../types';

export type TypeVar = {
	kind: 'TypeVar';
	id: string;
	name: string;
	type: InferType;
	table?: string;
	list?: true;
};

export type NamedNodes = {
	[key: string]: Type;
};

export type Type = TypeVar | TypeOperator;

export type TypeOperator = {
	kind: 'TypeOperator';
	types: TypeVar[];
};

export type CoercionType = 'Sum' | 'Coalesce' | 'SumFunction' | 'Ceiling' | 'Union' | 'Numeric'; //Numeric means: Don't convert to string

export type TraverseContext = {
	dbSchema: ColumnSchema[];
	withSchema: ColumnDef[];
	constraints: Constraint[];
	parameters: TypeAndNullInferParam[];
	fromColumns: ColumnDef[];
	subQueryColumns: ColumnDef[];
	subQuery: boolean;
	where: boolean;
	currentFragement?: FragmentInfo;
	dynamicSqlInfo: DynamicSqlInfo;
	dynamicSqlInfo2: DynamicSqlInfo2;
	relations: Relation2[];
};

export type Constraint = {
	type1: Type;
	type2: Type;
	expression: string;
	mostGeneralType?: true;
	coercionType?: CoercionType;
};

export type ColumnSchema = GenericColumnSchema<MySqlType> | GenericColumnSchema<SQLiteType> | GenericColumnSchema<PostgresSimpleType>;

export type GenericColumnSchema<DbType> = {
	schema: string;
	table: string;
	column: string;
	column_type: DbType | '?';
	columnKey: 'PRI' | 'MUL' | 'UNI' | 'VT' | '';
	defaultValue?: string;
	notNull: boolean;
	autoincrement?: boolean;
	hidden: number;
};

export type Table = {
	schema: string;
	table: string;
};

export type ColumnDef = {
	table: string;
	columnName: string;
	columnType: TypeVar;
	columnKey: 'PRI' | 'MUL' | 'UNI' | 'VT' | '';
	tableAlias?: string;
	notNull?: boolean; //true, false or undefined (can't infere)
	intrinsicNotNull?: boolean;
	hidden: number;
};

export type FieldName = {
	name: string;
	prefix: string;
};

export type ColumnInfo = {
	name: string;
	type: DbType | '?';
	notNull: boolean;
	intrinsicNotNull?: boolean;
	table?: string;
	optional?: boolean;
};

export type FieldInfo = {
	name: string;
	notNull: boolean;
};

export type ParameterInfo = {
	type: DbType | 'any';
	notNull: boolean;
};

export type TableField = {
	field: string;
	table: string;
	name: string;
};

export type FragmentInfo = {
	fragment: string;
	fragementWithoutAlias?: string;
	relation?: string;
	parentRelation?: string;
	fields: TableField[];
	dependOnFields: TableField[];
	dependOnParams: number[];
	parameters: number[];
	dependOn: string[];
};

export type FragmentInfoResult = {
	fragment: string;
	fragmentWitoutAlias?: string;
	dependOnFields: number[];
	dependOnParams: string[];
	dependOnOrderBy?: string[];
	parameters: string[];
};

export type DynamicSqlInfo = {
	with: FragmentInfo[];
	select: FragmentInfo[];
	from: FragmentInfo[];
	where: FragmentInfo[];
};

export type DynamicSqlInfoResult = {
	with?: FragmentInfoResult[];
	select: FragmentInfoResult[];
	from: FragmentInfoResult[];
	where: FragmentInfoResult[];
};

export type DynamicSqlInfo2 = {
	with: WithFragment[];
	select: SelectFragment[];
	from: FromFragment[];
	where: WhereFragment[];
	limitOffset?: LimitOffset;
};

export type SelectFragment = {
	fragment: string;
	fragmentWitoutAlias?: string;
	dependOnRelations: string[];
	parameters: number[];
};

export type WithFragment = {
	fragment: string;
	relationName: string;
	parameters: number[];
};

export type FromFragment = {
	fragment: string;
	relationAlias: string;
	relationName: string;
	parentRelation: string;
	fields: string[];
	parameters: number[];
};
export type WhereFragment = {
	fragment: string;
	dependOnRelations: string[];
	parameters: number[];
};

export type LimitOffset = {
	fragment: string;
	parameters: number[];
};

export type DynamicSqlInfoResult2 = {
	with: FromFragementResult[];
	select: SelectFragmentResult[];
	from: FromFragementResult[];
	where: WhereFragmentResult[];
	limitOffset?: LimitOffsetResult;
};

export type SelectFragmentResult = {
	fragment: string;
	fragmentWitoutAlias?: string;
	parameters: string[];
};

export type FromFragementResult = {
	fragment: string;
	relationName: string;
	dependOnFields: number[];
	parameters: number[];
	dependOnOrderBy: string[];
};

export type WhereFragmentResult = {
	fragment: string;
	parameters: number[];
};

export type LimitOffsetResult = {
	fragment: string;
	parameters: string[];
};

export type SubstitutionHash = {
	[index: string]: TypeVar;
};

export type TypeInferenceResult = {
	columns: InferType[];
	parameters: InferType[];
};

export type TypeAndNullInfer = {
	name: string; //TODO - need?
	type: TypeVar;
	notNull?: boolean; //true, false or undefined (can't infere)
	intrinsicNotNull?: boolean;
	table: string;
	hidden?: number;
};

export type TypeAndNullInferParam = TypeAndNullInfer & {
	paramIndex: number;
};

export type TypeAndNullInferResult = {
	columns: TypeAndNullInfer[];
	parameters: TypeAndNullInfer[];
};

export type TypeAndNullInferResultWithIdentifier = {
	queryResult: TypeAndNullInferResult;
	identifier: string;
};

export type QueryInfoResult = {
	kind: 'Select';
	columns: ColumnInfo[];
	parameters: ParameterInfo[];
	multipleRowsResult: boolean;
	orderByColumns?: string[];
	nestedResultInfo?: NestedResultInfo;
	dynamicQuery?: DynamicSqlInfoResult;
};

export type InsertInfoResult = {
	kind: 'Insert';
	parameters: ParameterDef[];
};

export type UpdateInfoResult = {
	kind: 'Update';
	data: ParameterDef[];
	parameters: ParameterDef[];
};

export type DeleteInfoResult = {
	kind: 'Delete';
	parameters: ParameterDef[];
};

export type ExtensionFunctionCatalog = {
	[functionName: string]: ExtensionFunction
}

export type ExtensionFunction = {
	paramsTypes: FunctionType[],
	variableParameters?: true;
	returnType: FunctionType
}

export type FunctionType = {
	type: SQLiteType;
	notNull: boolean | number; //true | false | index of parameter
}
