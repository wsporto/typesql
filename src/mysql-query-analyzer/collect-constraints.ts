import moment from 'moment';

import type { SimpleExprFunctionContext, ExprContext, InsertStatementContext, DeleteStatementContext } from '@wsporto/ts-mysql-parser';

import type { ColumnSchema, ColumnDef, TypeVar, Type, Constraint, SubstitutionHash, TypeAndNullInfer } from './types';
import { findColumn, splitName } from './select-columns';
import type { MySqlType, InferType } from '../mysql-mapping';
import { unify } from './unify';
import type TerminalNode from '@wsporto/ts-mysql-parser';

let counter = 0;
export function freshVar(name: string, typeVar: InferType, table?: string, list?: true): TypeVar {
	const param: TypeVar = {
		kind: 'TypeVar',
		id: (++counter).toString(),
		name,
		type: typeVar,
		table
	};
	if (list) {
		param.list = true;
	}
	return param;
}

export function createColumnType(col: ColumnDef) {
	const columnType: TypeVar = {
		kind: 'TypeVar',
		id: (++counter).toString(),
		name: col.columnName,
		type: col.columnType.type,
		table: col.tableAlias || col.table
	};
	return columnType;
}

export function createColumnTypeFomColumnSchema(col: ColumnSchema) {
	const columnType: TypeVar = {
		kind: 'TypeVar',
		id: col.column,
		name: col.column,
		type: col.column_type,
		table: col.table
	};
	return columnType;
}

export type ExprOrDefault = ExprContext | TerminalNode;

export function getInsertIntoTable(insertStatement: InsertStatementContext) {
	const insertIntoTable = splitName(insertStatement.tableRef().getText()).name;
	return insertIntoTable;
}

export function getInsertColumns(insertStatement: InsertStatementContext, fromColumns: ColumnDef[]) {
	const insertIntoTable = getInsertIntoTable(insertStatement);

	const insertFields = insertStatement.insertFromConstructor() || insertStatement.insertQueryExpression();

	const fields = insertFields
		?.fields()
		?.insertIdentifier_list()
		.map((insertIdentifier) => {
			const colRef = insertIdentifier.columnRef();
			if (colRef) {
				const fieldName = splitName(colRef.getText());
				const column = findColumn(fieldName, fromColumns);
				return column;
			}
			throw Error('Invalid sql');
		});

	//check insert stmt without fields (only values). Ex.: insert into mytable values()
	if (!fields) {
		return fromColumns.filter((column) => column.table === insertIntoTable);
	}
	return fields;
}

export function getDeleteColumns(deleteStatement: DeleteStatementContext, dbSchema: ColumnSchema[]): ColumnDef[] {
	//TODO - Use extractColumnsFromTableReferences
	const tableNameStr = deleteStatement.tableRef()?.getText()!;
	const tableAlias = deleteStatement.tableAlias()?.getText();
	const tableName = splitName(tableNameStr).name;
	const columns = dbSchema
		.filter((col) => col.table === tableName)
		.map((col) => {
			const colDef: ColumnDef = {
				table: tableNameStr,
				tableAlias: tableAlias,
				columnName: col.column,
				columnType: createColumnTypeFomColumnSchema(col),
				columnKey: col.columnKey,
				notNull: col.notNull,
				hidden: col.hidden
			};
			return colDef;
		});
	return columns;
}

export function generateTypeInfo(namedNodes: TypeAndNullInfer[], constraints: Constraint[]): InferType[] {
	const substitutions: SubstitutionHash = {};
	unify(constraints, substitutions);

	const parameters = namedNodes.map((param) => getVarType(substitutions, param.type));
	return parameters;
}

export function getVarType(substitutions: SubstitutionHash, typeVar: Type): InferType {
	if (typeVar.kind === 'TypeVar') {
		// if (typeVar.type != '?') {
		//     return typeVar.type;
		// }
		const subs = substitutions[typeVar.id];
		if (subs) {
			if (subs.id !== typeVar.id) {
				return getVarType(substitutions, subs);
			}
			const resultType = subs.list || typeVar.list ? `${subs.type}[]` : subs.type;
			return resultType as MySqlType;
		}
		// if (!subs) {
		//     return typeVar.type as MySqlType;
		// }
		const resultType = typeVar.list ? `${typeVar.type}[]` : typeVar.type;
		return resultType as MySqlType;
	}
	return '?';
}

export function verifyDateTypesCoercion(type: Type) {
	if (type.kind === 'TypeVar' && isDateTimeLiteral(type.name)) {
		type.type = 'datetime';
	}
	if (type.kind === 'TypeVar' && isDateLiteral(type.name)) {
		type.type = 'date';
	}
	if (type.kind === 'TypeVar' && isTimeLiteral(type.name)) {
		type.type = 'time';
	}
	return type;
}

export function isTimeLiteral(literal: string) {
	return moment(literal, 'HH:mm:ss', true).isValid() || moment(literal, 'HH:mm', true).isValid();
}

export function isDateTimeLiteral(literal: string) {
	return moment(literal, 'YYYY-MM-DD HH:mm:ss', true).isValid();
}

export function isDateLiteral(literal: string) {
	return moment(literal, 'YYYY-MM-DD', true).isValid();
}

export function getFunctionName(simpleExprFunction: SimpleExprFunctionContext) {
	return (
		simpleExprFunction.functionCall().pureIdentifier()?.getText().toLowerCase() ||
		simpleExprFunction.functionCall().qualifiedIdentifier()?.getText().toLowerCase()
	);
}

export type VariableLengthParams = {
	kind: 'VariableLengthParams';
	paramType: InferType;
};

export type FixedLengthParams = {
	kind: 'FixedLengthParams';
	paramsType: TypeVar[];
};

export type FunctionParams = VariableLengthParams | FixedLengthParams;
