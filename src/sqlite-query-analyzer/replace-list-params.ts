import { ParameterNameAndPosition } from "../types";

export function replaceListParams(sql: string, listParamPositions: ParameterNameAndPosition[]): string {
	if (listParamPositions.length == 0) {
		return sql;
	}
	let newSql = '';
	let start = 0;
	listParamPositions.forEach((param, index, array) => {
		newSql += sql.substring(start, param.paramPosition);
		newSql += '${params.' + param.name + '.map(() => \'?\')}';
		if (index == array.length - 1) { //last
			newSql += sql.substring(param.paramPosition + 1, sql.length);
		}
		start = param.paramPosition + 1;
	})
	return newSql;
}