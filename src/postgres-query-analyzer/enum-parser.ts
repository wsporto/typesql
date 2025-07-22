import { PostgresEnumType } from '../sqlite-query-analyzer/types';

export function transformCheckToEnum(checkStr: string): PostgresEnumType | null {
	// Match only = ANY (ARRAY[...]) pattern
	const anyArrayRegex = /=\s*ANY\s*\(\s*ARRAY\[(.*?)\]\s*\)/i;
	const match = checkStr.match(anyArrayRegex);

	if (!match || match.length < 2) {
		return null;
	}

	const arrayContent = match[1];

	const values = arrayContent.split(',').map((rawValue) => {
		let value = rawValue.trim().replace(/::\w+$/, ''); // Remove type casts like ::text, ::int

		// If it's a quoted string, clean and re-wrap it in single quotes
		if (/^'.*'$/.test(value)) {
			value = value.replace(/^'(.*)'$/, '$1');
			return `'${value}'`;
		}

		// Otherwise assume it's a number or raw literal — return as-is
		return value;
	});

	return `enum(${values.join(',')})`;
}
