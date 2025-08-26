import CodeBlockWriter from 'code-block-writer';
import { TsFieldDescriptor, TsParameterDescriptor } from '../../types';
import { DynamicSqlInfoResult2 } from '../../mysql-query-analyzer/types';
import { EOL } from 'os';

export function hasStringColumn(columns: TsFieldDescriptor[]) {
	return columns.some((c) => c.tsType === 'string');
}

export function getOperator(type: string) {
	if (type === 'number' || type === 'Date') {
		return 'NumericOperator';
	}
	return 'StringOperator';
}

export function writeBuildOrderByBlock(writer: CodeBlockWriter, orderByColumns: string[], orderByTypeName: string) {
	writer.writeLine(`const orderByColumns = [${orderByColumns.map(col => `'${col}'`).join(', ')}] as const;`);
	writer.blankLine();
	writer.write(`export type ${orderByTypeName} =`).block(() => {
		writer.writeLine('column: typeof orderByColumns[number];');
		writer.writeLine(`direction: 'asc' | 'desc';`);
	});
	writer.blankLine();
	writer.write(`function buildOrderBy(orderBy: ${orderByTypeName}[]): string`).block(() => {
		writer.write('if (!Array.isArray(orderBy) || orderBy.length === 0)').block(() => {
			writer.writeLine(`throw new Error('orderBy must be a non-empty array');`);
		});
		writer.blankLine();
		writer.write('for (const { column, direction } of orderBy)').block(() => {
			writer.write('if (!orderByColumns.includes(column))').block(() => {
				writer.writeLine('throw new Error(`Invalid orderBy column: ${column}`);');
			});
			writer.write(`if (direction !== 'asc' && direction !== 'desc')`).block(() => {
				writer.writeLine('throw new Error(`Invalid orderBy direction: ${direction}`);');
			});
		});
		writer.blankLine();
		writer.writeLine('return orderBy');
		writer.indent().write('.map(({ column, direction }) => `"${column}" ${direction.toUpperCase()}`)').newLine();
		writer.indent().write(`.join(', ');`).newLine();
	});
}

export function writeDynamicQueryOperators(writer: CodeBlockWriter, whereTypeName: string, columns: TsFieldDescriptor[]) {
	writer.writeLine(`const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;`);
	writer.writeLine('type NumericOperator = typeof NumericOperatorList[number];');
	if (hasStringColumn(columns)) {
		writer.writeLine(`type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';`);
	}
	writer.writeLine(`type SetOperator = 'IN' | 'NOT IN';`);
	writer.writeLine(`type BetweenOperator = 'BETWEEN';`);
	writer.blankLine();
	writer.write(`export type ${whereTypeName} =`).indent(() => {
		for (const col of columns) {
			writer.writeLine(`| { column: '${col.name}'; op: ${getOperator(col.tsType)}; value: ${col.tsType} | null }`);
			writer.writeLine(`| { column: '${col.name}'; op: SetOperator; value: ${col.tsType}[] }`);
			writer.writeLine(`| { column: '${col.name}'; op: BetweenOperator; value: [${col.tsType} | null, ${col.tsType} | null] }`);
		}
	});
}

export function writeWhereConditionFunction(writer: CodeBlockWriter, whereTypeName: string, columns: TsFieldDescriptor[]) {
	writer.write(`function whereCondition(condition: ${whereTypeName}, placeholder: () => string): WhereConditionResult | null `).block(() => {
		writer.writeLine('const selectFragment = selectFragments[condition.column];');
		writer.writeLine('const { op, value } = condition;');
		writer.blankLine();
		if (hasStringColumn(columns)) {
			writer.write(`if (op === 'LIKE') `).block(() => {
				writer.write('return ').block(() => {
					writer.writeLine("sql: `${selectFragment} LIKE ${placeholder()}`,");
					writer.writeLine('hasValue: value != null,');
					writer.writeLine('values: [value]');
				});
			});
		}
		writer.write(`if (op === 'BETWEEN') `).block(() => {
			writer.writeLine('const [from, to] = Array.isArray(value) ? value : [null, null];');
			writer.write('return ').block(() => {
				writer.writeLine('sql: `${selectFragment} BETWEEN ${placeholder()} AND ${placeholder()}`,');
				writer.writeLine('hasValue: from != null && to != null,');
				writer.writeLine('values: [from, to]');
			});
		});
		writer.write(`if (op === 'IN' || op === 'NOT IN') `).block(() => {
			writer.write('if (!Array.isArray(value) || value.length === 0)').block(() => {
				writer.writeLine(`return { sql: '', hasValue: false, values: [] };`);
			})
			writer.write('return ').block(() => {
				writer.writeLine("sql: `${selectFragment} ${op} (${value.map(() => placeholder()).join(', ')})`,");
				writer.writeLine('hasValue: true,');
				writer.writeLine('values: value');
			});
		});
		writer.write('if (NumericOperatorList.includes(op)) ').block(() => {
			writer.write('return ').block(() => {
				writer.writeLine('sql: `${selectFragment} ${op} ${placeholder()}`,');
				writer.writeLine('hasValue: value != null,');
				writer.writeLine('values: [value]');
			});
		});
		writer.writeLine('return null;');
	});
}

export function writeWhereConditionsToObjectFunction(writer: CodeBlockWriter, whereTypeName: string) {
	writer.write(`function whereConditionsToObject(whereConditions?: ${whereTypeName}[])`).block(() => {
		writer.writeLine('const obj = {} as any;');
		writer.write('whereConditions?.forEach(condition => ').inlineBlock(() => {
			writer.writeLine('const where = whereCondition(condition);');
			writer.write('if (where?.hasValue) ').block(() => {
				writer.writeLine('obj[condition.column] = true;');
			});
		});
		writer.write(');');
		writer.writeLine('return obj;');
	});
}

export type BuildSqlFunction = {
	dynamicParamsTypeName: string;
	dynamicQueryInfo: DynamicSqlInfoResult2;
	columns: TsFieldDescriptor[];
	parameters: TsParameterDescriptor[];
	placeHolderType: 'questionMark' | 'numbered';
	hasOrderBy: boolean;
	toDrive: (variable: string, param: TsParameterDescriptor) => string;
}

export function writeBuildSqlFunction(writer: CodeBlockWriter, params: BuildSqlFunction) {
	const { dynamicParamsTypeName, dynamicQueryInfo, columns, parameters, placeHolderType, hasOrderBy, toDrive } = params;
	const optional = hasOrderBy ? '' : '?';
	const paramsVar = parameters.length > 0 ? ', params' : '';
	writer.write(`function buildSql(queryParams${optional}: ${dynamicParamsTypeName})`).block(() => {
		writer.writeLine(`const { select, where${paramsVar} } = queryParams || {};`);
		writer.blankLine();
		if (hasOrderBy) {
			writer.writeLine('const orderBy = orderByToObject(queryParams.orderBy);');
		}
		writer.writeLine('const selectedSqlFragments: string[] = [];');
		writer.writeLine('const paramsValues: any[] = [];');
		writer.blankLine();
		writer.writeLine('const whereColumns = new Set(where?.map(w => w.column) || []);');
		writer.blankLine();

		if (dynamicQueryInfo.with.length > 0) {
			writer.writeLine(`const withFragments: string[] = [];`);
			dynamicQueryInfo.with.forEach((withFragment) => {
				const selectConditions = withFragment.dependOnFields.map((fieldIndex) => `(!select || select.${columns[fieldIndex].name} === true)`);
				const whereConditions = withFragment.dependOnFields.map((fieldIndex) => `whereColumns.has('${columns[fieldIndex].name}')`);
				const orderByConditions = withFragment.dependOnOrderBy?.map((orderBy) => `orderBy['${orderBy}'] != null`) || [];
				const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
				const paramValues = withFragment.parameters.map((paramIndex) => {
					const param = parameters[paramIndex];
					return toDrive('params?', param);
				});
				if (allConditions.length > 0) {
					writer.writeLine(`if (`);
					writer.indent().write(`${allConditions.join(`${EOL}\t|| `)}`).newLine();
					writer.write(') ').inlineBlock(() => {
						writer.write(`withFragments.push(\`${withFragment.fragment}\`);`);
						paramValues.forEach((paramValues) => {
							writer.writeLine(`paramsValues.push(${paramValues});`);
						});
					}).newLine();
				}
				else {
					writer.writeLine(`withFragments.push(\`${withFragment.fragment}\`);`);
					paramValues.forEach((paramValues) => {
						writer.writeLine(`paramsValues.push(${paramValues});`);
					});
				}
			});
		}
		dynamicQueryInfo.select.forEach((select, index) => {
			writer.write(`if (!select || select.${columns[index].name} === true)`).block(() => {
				writer.writeLine(`selectedSqlFragments.push(\`${select.fragment}\`);`);
				select.parameters.forEach((param) => {
					writer.writeLine(`paramsValues.push(params?.${param} ?? null);`);
				});
			});
		});
		writer.blankLine();
		writer.writeLine('const fromSqlFragments: string[] = [];');

		dynamicQueryInfo.from.forEach((from, index) => {
			const selectConditions = from.dependOnFields.map((fieldIndex) => `(!select || select.${columns[fieldIndex].name} === true)`);
			const whereConditions = from.dependOnFields.map((fieldIndex) => `whereColumns.has('${columns[fieldIndex].name}')`);
			const orderByConditions = from.dependOnOrderBy?.map((orderBy) => `orderBy['${orderBy}'] != null`) || [];
			const allConditions = [...selectConditions, ...whereConditions, ...orderByConditions];
			const paramValues = from.parameters.map((paramIndex) => {
				const param = parameters[paramIndex];
				return toDrive('params?', param);
			});
			if (index != 0 && allConditions.length > 0) {
				writer.blankLine();
				writer.writeLine(`if (`);
				writer.indent().write(`${allConditions.join(`${EOL}\t|| `)}`).newLine();
				writer.write(') ').inlineBlock(() => {
					writer.write(`fromSqlFragments.push(\`${from.fragment}\`);`);
				})
				paramValues.forEach((paramValues) => {
					writer.writeLine(`paramsValues.push(${paramValues});`);
				});
			}
			else {
				writer.writeLine(`fromSqlFragments.push(\`${from.fragment}\`);`);
				paramValues.forEach((paramValues) => {
					writer.writeLine(`paramsValues.push(${paramValues});`);
				});
			}
		});
		writer.blankLine();
		writer.writeLine('const whereSqlFragments: string[] = [];');
		writer.blankLine();
		dynamicQueryInfo.where.forEach((fragment) => {
			const paramValues = fragment.parameters.map((paramIndex) => {
				const param = parameters[paramIndex];
				return `${toDrive('params?', param)} ?? null`;
			});
			writer.writeLine(`whereSqlFragments.push(\`${fragment.fragment}\`);`);
			paramValues.forEach((paramValues) => {
				writer.writeLine(`paramsValues.push(${paramValues});`);
			});
		});
		if (placeHolderType === 'questionMark') {
			writer.writeLine(`const placeholder = () => '?';`);
		}
		else if (placeHolderType === 'numbered') {
			writer.writeLine(`let currentIndex = paramsValues.length;`);
			writer.writeLine('const placeholder = () => `$${++currentIndex}`;');
		}
		writer.blankLine();
		writer.write('where?.forEach(condition => ').inlineBlock(() => {
			writer.writeLine('const whereClause = whereCondition(condition, placeholder);');
			dynamicQueryInfo.select.forEach((select, index) => {
				if (select.parameters.length > 0) {
					writer.write(`if (condition[0] == '${columns[index].name}')`).block(() => {
						select.parameters.forEach((param) => {
							writer.writeLine(`paramsValues.push(params?.${param} ?? null);`);
						});
					});
				}
			});
			writer.write('if (whereClause?.hasValue)').block(() => {
				writer.writeLine(`whereSqlFragments.push(whereClause.sql);`);
				writer.write('paramsValues.push(...whereClause.values);');
			});
		});
		writer.write(');').newLine();
		if (dynamicQueryInfo.with.length > 0) {
			writer.blankLine();
			writer.writeLine('const withSql = withFragments.length > 0');
			writer.indent().write('? `WITH${EOL}${withFragments.join(`,${EOL}`)}${EOL}`').newLine();
			writer.indent().write(`: '';`).newLine();
		}
		writer.blankLine();
		writer.writeLine('const whereSql = whereSqlFragments.length > 0 ? `WHERE ${whereSqlFragments.join(\' AND \')}` : \'\';');
		writer.blankLine();
		if (dynamicQueryInfo.with.length > 0) {
			writer.writeLine('const sql = `${withSql}SELECT');
		}
		else {
			writer.writeLine('const sql = `SELECT');
		}
		writer.indent().write('${selectedSqlFragments.join(`,${EOL}`)}').newLine();
		writer.indent().write('${fromSqlFragments.join(EOL)}').newLine();;
		writer.indent().write('${whereSql}');
		if (hasOrderBy) {
			writer.newLine();
			writer.indent().write('ORDER BY ${buildOrderBy(queryParams.orderBy)}');
		}
		const limitOffset = dynamicQueryInfo?.limitOffset;
		if (limitOffset) {
			writer.newLine();
			writer.indent().write(`${limitOffset.fragment}`);

		}
		writer.write('`;');
		if (dynamicQueryInfo?.limitOffset) {
			writer.blankLine();
			dynamicQueryInfo?.limitOffset.parameters.forEach((param) => {
				writer.writeLine(`paramsValues.push(params?.${param} ?? null);`);
			});
		}

		writer.blankLine();
		writer.writeLine('return { sql, paramsValues };');
	})
}

type MapToResultParameters = {
	columns: TsFieldDescriptor[];
	resultTypeName: string;
	selectColumnsTypeName: string;
	fromDriver: (variable: string, field: TsFieldDescriptor) => string;
}
export function writeMapToResultFunction(writer: CodeBlockWriter, params: MapToResultParameters) {
	const { columns, resultTypeName, selectColumnsTypeName, fromDriver } = params;
	writer.write(`function mapArrayTo${resultTypeName}(data: any, select?: ${selectColumnsTypeName})`).block(() => {
		writer.writeLine(`const result = {} as ${resultTypeName};`);
		writer.writeLine('let rowIndex = -1;');
		columns.forEach((tsField) => {
			writer.write(`if (!select || select.${tsField.name} === true)`).block(() => {
				writer.writeLine('rowIndex++;');
				writer.writeLine(`result.${tsField.name} = ${fromDriver('data[rowIndex]', tsField)};`);
			});
		});
		writer.write('return result;');
	});
}

export function writeOrderByToObjectFunction(writer: CodeBlockWriter, dynamicParamsTypeName: string) {
	writer.write(`function orderByToObject(orderBy: ${dynamicParamsTypeName}['orderBy'])`).block(() => {
		writer.writeLine('const obj = {} as any;');
		writer.write('orderBy?.forEach(order => ').inlineBlock(() => {
			writer.writeLine('obj[order.column] = true;');
		});
		writer.write(');');
		writer.writeLine('return obj;');
	});
}