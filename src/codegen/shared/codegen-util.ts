import CodeBlockWriter from 'code-block-writer';
import { TsFieldDescriptor } from '../../types';

export function hasStringColumn(columns: TsFieldDescriptor[]) {
	return columns.some((c) => c.tsType === 'string');
}

export function getOperator(type: string) {
	if (type === 'number' || type === 'Date') {
		return 'NumericOperator';
	}
	return 'StringOperator';
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