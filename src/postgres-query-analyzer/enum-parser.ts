export function transformCheckToEnum(checkStr: string): string | null {
	const regex = /ARRAY\[(.*?)\]/;
	const match = checkStr.match(regex);

	if (!match || match.length < 2) {
		return null; // Not a match or bad format
	}

	// Extract the array contents
	const arrayContent = match[1];

	// Split by commas that are not inside quotes (basic case)
	const values = arrayContent
		.split(',')
		.map(s => s.trim().replace(/::text$/, '').replace(/^'(.*)'$/, '$1'))  // Remove ::text and surrounding single quotes
		.map(s => `'${s}'`); // Re-wrap clean value in single quotes

	return `enum(${values.join(',')})`;
}
