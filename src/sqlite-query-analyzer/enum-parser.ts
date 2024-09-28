import { Column_defContext, Create_table_stmtContext, ExprContext, parseSql, Sql_stmtContext } from '@wsporto/ts-mysql-parser/dist/sqlite';
import { EnumColumnMap, EnumMap, EnumType } from './types';

export function enumParser(createStmts: string): EnumMap {
	const result = parseSql(createStmts);
	const enumMap: EnumMap = {};
	result.sql_stmt_list().children?.forEach(stmt => {
		if (stmt instanceof Sql_stmtContext) {
			const create_table_stmt = stmt.create_table_stmt();
			if (create_table_stmt) {
				collect_enum_create_table_stmt(create_table_stmt, enumMap);
			}
		}

	});
	return enumMap;
}

function collect_enum_create_table_stmt(create_table_stmt: Create_table_stmtContext, enumMap: EnumMap) {
	const table_name = create_table_stmt.table_name().getText();
	const enumColumnMap: EnumColumnMap = {};
	create_table_stmt.column_def_list().forEach(column_def => {
		const column_name = column_def.column_name().getText();
		const enum_column = enum_column_def(column_def);
		if (enum_column) {
			enumColumnMap[column_name] = enum_column;
		}
	});
	enumMap[table_name] = enumColumnMap;

}

function enum_column_def(column_def: Column_defContext): EnumType | null {
	for (const column_constraint of column_def.column_constraint_list()) {
		if (column_constraint.CHECK_() && column_constraint.expr()) {
			return enum_column(column_constraint.expr());
		}
	}
	return null;
}

function enum_column(expr: ExprContext): EnumType | null {
	if (expr.IN_()) {
		// expr IN expr
		const expr_list = expr.expr_list()[1].expr_list();
		if (expr_list.length > 0) {
			const isEnum = expr_list.every(inExpr => isStringLiteral(inExpr));
			if (isEnum) {
				return `ENUM(${expr_list.map(exprValue => exprValue.literal_value().getText()).join(',')})`
			}
		}
		return null
	}
	return null;
}

function isStringLiteral(expr: ExprContext) {
	const literal_value = expr.literal_value();
	if (literal_value) {
		const string_literal = literal_value.STRING_LITERAL();
		if (string_literal) {
			return true;
		}
	}
	return false;
}
