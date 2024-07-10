import { createConnection } from 'mysql2/promise';
import { convertTypeCodeToMysqlType } from '../src/mysql-mapping';

// https://github.com/sidorares/node-mysql2/blob/master/lib/constants/types.js
async function main() {
	const conn = await createConnection('mysql://root:password@localhost/mydb');

	const allTypes = [
		'decimal_column',
		'tinyint_column',
		'smallint_column',
		'int_column',
		'float_column',
		'double_column',
		'timestamp_column',
		'bigint_column',
		'mediumint_column',
		'date_column',
		'time_column',
		'datetime_column',
		'year_column',
		'varchar_column',
		'bit_column',
		'json_column',
		'enum_column',
		'set_column',
		'tinyblob_column',
		'mediumblob_column',
		'longblob_column',
		'blob_column',
		'tinytext_column',
		'mediumtext_column',
		'longtext_column',
		'text_column',
		'varbinary_column',
		'binary_column',
		'char_column',
		'geometry_column'
	];

	//https://stackoverflow.com/questions/43241174/javascript-generating-all-combinations-of-elements-in-a-single-array-in-pairs
	const combinations = allTypes.flatMap((v, i) =>
		allTypes.slice(i + 1).map((w) => ({ first: v, second: w }))
	);
	const firstUnionColumns = combinations
		.map((c) => c.first + generateAlias(c))
		.join(', ');
	const secondUnionColumns = combinations
		.map((c) => c.second + generateAlias(c))
		.join(', ');

	const generateSql = `
        SELECT ${firstUnionColumns} FROM all_types
        UNION
        SELECT ${secondUnionColumns} FROM all_types`;
	// console.log("generatedSql=", generateSql);

	const result: any = await conn.prepare(generateSql);
	const resultArray: [{ name: string; type: string }] =
		result.statement.columns.map(
			(col: {
				name: string;
				columnType: number;
				columnLength: number;
				flags: number;
			}) => ({
				name: col.name,
				type: convertTypeCodeToMysqlType(
					col.columnType,
					col.flags,
					col.columnLength
				)
			})
		);
	const resultHash = resultArray.reduce((map, obj) => {
		map[obj.name] = obj.type;
		return map;
	}, {} as any);
	console.log('resultHash=', JSON.stringify(resultHash, null, 2));
}

function removeColumnFromName(nameWithColumn: string) {
	return nameWithColumn.split('_')[0];
}

function generateAlias(column: { first: string; second: string }) {
	return ` AS ${removeColumnFromName(column.first)}_${removeColumnFromName(column.second)}`;
}

// main();
