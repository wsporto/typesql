import { NotNullInfo } from './traverse';

export function getOrderByColumns(fromColumns: NotNullInfo[], selectColumns: NotNullInfo[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];

	// Add fromColumns
	for (const col of fromColumns) {
		const name = isAmbiguous(fromColumns, col.column_name)
			? `${col.table}.${col.column_name}`
			: col.column_name;
		const lowerName = name.toLowerCase();
		if (!seen.has(lowerName)) {
			result.push(lowerName);
			seen.add(lowerName);
		}
	}

	// Add selectColumns (may include expressions like 'nullif')
	for (const col of selectColumns) {
		const lowerName = col.column_name.toLowerCase();
		if (!seen.has(lowerName)) {
			result.push(lowerName);
			seen.add(lowerName);
		}
	}

	return result;
}

function isAmbiguous(columns: NotNullInfo[], columnName: string) {
	const filterByName = columns.filter((col) => col.column_name.toLowerCase() === columnName.toLowerCase());
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
