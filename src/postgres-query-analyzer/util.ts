import { NotNullInfo } from './traverse';

export function getOrderByColumns(fromColumns: NotNullInfo[], selectColumns: NotNullInfo[]): string[] {
	const orderByColumns: string[] = [];
	fromColumns.forEach((col) => {
		const ambiguous = isAmbiguous(fromColumns, col.column_name);
		if (!ambiguous) {
			const exists = orderByColumns.find((orderBy) => orderBy === col.column_name);
			if (!exists) {
				orderByColumns.push(col.column_name);
			}
		}
		if (col.table) {
			orderByColumns.push(`${col.table}.${col.column_name}`);
		}
	});
	selectColumns.forEach((col) => {
		const duplicated = selectColumns.filter((orderBy) => orderBy.column_name === col.column_name);
		if (duplicated.length <= 1) {
			const exists = orderByColumns.find((orderBy) => orderBy === col.column_name);
			if (!exists) {
				orderByColumns.push(col.column_name);
			}
		}
	});

	return orderByColumns;
}

function isAmbiguous(columns: NotNullInfo[], columnName: string) {
	const filterByName = columns.filter((col) => col.column_name === columnName);
	return filterByName.length > 1;
}

export type OrderByReplaceResult = {
	sql: string;
	replaced: boolean;
};

export function replaceOrderByParamWithPlaceholder(sql: string): OrderByReplaceResult {
	// Match ORDER BY followed by $<number> or :<paramName>
	const pattern = /(order\s+by\s+)(\$[0-9]+|:[a-zA-Z_][a-zA-Z0-9_]*)/i;
	const match = sql.match(pattern);

	if (!match) {
		return { sql, replaced: false };
	}

	const [fullMatch, orderByKeyword] = match;

	const placeholder = `${orderByKeyword}/*__orderByPlaceholder__*/ 1`;
	const newSql = sql.replace(fullMatch, placeholder);

	return {
		sql: newSql,
		replaced: true,
	};
}

export function replaceOrderByPlaceholderWithBuildOrderBy(sql: string): string {
	const pattern = /(order\s+by\s+)\/\*__orderByPlaceholder__\*\/\s+1/i;

	return sql.replace(pattern, (_, originalOrderBy) => {
		return `${originalOrderBy}\${buildOrderBy(params.orderBy)}`;
	});
}
