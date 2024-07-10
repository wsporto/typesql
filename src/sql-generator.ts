import type { ColumnSchema } from './mysql-query-analyzer/types';
import CodeBlockWriter from 'code-block-writer';
import type { TypeSqlDialect } from './types';

export function generateSelectStatement(
	dialect: TypeSqlDialect,
	tableName: string,
	columns: ColumnSchema[]
) {
	const keys = columns.filter((col) => col.columnKey === 'PRI');
	if (keys.length === 0) {
		keys.push(...columns.filter((col) => col.columnKey === 'UNI'));
	}

	const writer = new CodeBlockWriter();

	writer.writeLine('SELECT');
	columns.forEach((col, columnIndex) => {
		writer.indent().write(escapeColumn(dialect, col.column));
		writer.conditionalWrite(columnIndex < columns.length - 1, ',');
		writer.newLine();
	});

	writer.writeLine(`FROM ${escapeTableName(dialect, tableName)}`);

	if (keys.length > 0) {
		writer.write('WHERE ');
		writer.write(
			`${escapeColumn(dialect, keys[0].column)} = :${keys[0].column}`
		);
	}

	return writer.toString();
}

export function generateInsertStatement(
	dialect: TypeSqlDialect,
	tableName: string,
	dbSchema: ColumnSchema[]
) {
	const columns = dbSchema.filter((col) => !col.autoincrement);

	const writer = new CodeBlockWriter();

	writer.writeLine(`INSERT INTO ${escapeTableName(dialect, tableName)}`);
	writer.writeLine('(');
	columns.forEach((col, columnIndex) => {
		writer.indent().write(escapeColumn(dialect, col.column));
		writer.conditionalWrite(columnIndex !== columns.length - 1, ',');
		writer.newLine();
	});
	writer.writeLine(')');
	writer.writeLine('VALUES');
	writer.writeLine('(');
	columns.forEach((col, columnIndex) => {
		writer.indent().write(`:${col.column}`);
		writer.conditionalWrite(columnIndex < columns.length - 1, ',');
		writer.newLine();
	});
	writer.write(')');

	return writer.toString();
}

export function generateUpdateStatement(
	dialect: TypeSqlDialect,
	tableName: string,
	dbSchema: ColumnSchema[]
) {
	const columns = dbSchema.filter((col) => !col.autoincrement);
	const keys = dbSchema.filter((col) => col.columnKey === 'PRI');
	if (keys.length === 0) {
		keys.push(...dbSchema.filter((col) => col.columnKey === 'UNI'));
	}

	const writer = new CodeBlockWriter();

	writer.writeLine(`UPDATE ${escapeTableName(dialect, tableName)}`);
	writer.writeLine('SET');
	columns.forEach((col, columnIndex) => {
		writer
			.indent()
			.write(
				`${escapeColumn(dialect, col.column)} = CASE WHEN :${col.column}Set THEN :${col.column} ELSE ${escapeColumn(dialect, col.column)} END`
			);
		writer.conditionalWrite(columnIndex !== columns.length - 1, ',');
		writer.newLine();
	});
	if (keys.length > 0) {
		writer.writeLine('WHERE');
		writer
			.indent()
			.write(`${escapeColumn(dialect, keys[0].column)} = :${keys[0].column}`);
	}

	return writer.toString();
}

export function generateDeleteStatement(
	dialect: TypeSqlDialect,
	tableName: string,
	dbSchema: ColumnSchema[]
) {
	const keys = dbSchema.filter((col) => col.columnKey === 'PRI');
	if (keys.length === 0) {
		keys.push(...dbSchema.filter((col) => col.columnKey === 'UNI'));
	}

	const writer = new CodeBlockWriter();

	writer.writeLine(`DELETE FROM ${escapeTableName(dialect, tableName)}`);
	if (keys.length > 0) {
		writer.write('WHERE ');
		writer.write(
			`${escapeColumn(dialect, keys[0].column)} = :${keys[0].column}`
		);
	}
	return writer.toString();
}

//Permitted characters in unquoted identifiers: ASCII: [0-9,a-z,A-Z$_]
function escapeTableName(dialect: TypeSqlDialect, tableName: string) {
	const validPattern = /^[a-zA-Z0-9_$]+$/g;
	if (dialect === 'mysql' && !validPattern.test(tableName)) {
		return `\`${tableName}\``;
	}
	return tableName;
}

function escapeColumn(dialect: TypeSqlDialect, column: string): string {
	if (dialect === 'mysql') {
		return `\`${column}\``;
	}
	return `${column}`;
}
