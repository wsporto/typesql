import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery03Result = {
	id?: number;
	value?: number;
}

export type DynamicQuery03DynamicParams = {
	select?: DynamicQuery03Select;
	where?: DynamicQuery03Where[];
}

export type DynamicQuery03Select = {
	id?: boolean;
	value?: boolean;
}

const selectFragments = {
	id: `t1.id`,
	value: `t1.value`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery03Where =
	| ['id', NumericOperator, number | null]
	| ['id', SetOperator, number[]]
	| ['id', BetweenOperator, number | null, number | null]
	| ['value', NumericOperator, number | null]
	| ['value', SetOperator, number[]]
	| ['value', BetweenOperator, number | null, number | null]

let currentIndex: number;
export async function dynamicQuery03(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery03DynamicParams): Promise<DynamicQuery03Result[]> {
	currentIndex = 0;
	const where = whereConditionsToObject(params?.where);
	const paramsValues: any = [];
	let sql = 'SELECT';
	if (params?.select == null || params.select.id) {
		sql = appendSelect(sql, `t1.id`);
	}
	if (params?.select == null || params.select.value) {
		sql = appendSelect(sql, `t1.value`);
	}
	sql += EOL + `FROM mytable1 t1`;
	sql += EOL + `WHERE 1 = 1`;
	params?.where?.forEach(condition => {
		const where = whereCondition(condition);
		if (where?.hasValue) {
			sql += EOL + 'AND ' + where.sql;
			paramsValues.push(...where.values);
		}
	});
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery03Result(row, params?.select)));
}

function mapArrayToDynamicQuery03Result(data: any, select?: DynamicQuery03Select) {
	const result = {} as DynamicQuery03Result;
	let rowIndex = -1;
	if (select == null || select.id) {
		rowIndex++;
		result.id = data[rowIndex];
	}
	if (select == null || select.value) {
		rowIndex++;
		result.value = data[rowIndex];
	}
	return result;
}

function appendSelect(sql: string, selectField: string) {
	if (sql.toUpperCase().endsWith('SELECT')) {
		return sql + EOL + selectField;
	}
	else {
		return sql + ', ' + EOL + selectField;
	}
}

function whereConditionsToObject(whereConditions?: DynamicQuery03Where[]) {
	const obj = {} as any;
	whereConditions?.forEach(condition => {
		obj[condition[0]] = true;
	});
	return obj;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery03Where): WhereConditionResult | null {

	const selectFragment = selectFragments[condition[0]];
	const operator = condition[1];

	if (operator == 'BETWEEN') {
		return {
			sql: `${selectFragment} BETWEEN ${placeholder()} AND ${placeholder()}`,
			hasValue: condition[2] != null && condition[3] != null,
			values: [condition[2], condition[3]]
		}
	}
	if (operator == 'IN' || operator == 'NOT IN') {
		return {
			sql: `${selectFragment} ${operator} (${condition[2]?.map(_ => placeholder()).join(', ')})`,
			hasValue: condition[2] != null && condition[2].length > 0,
			values: condition[2]
		}
	}
	if (NumericOperatorList.includes(operator)) {
		return {
			sql: `${selectFragment} ${operator} ${placeholder()}`,
			hasValue: condition[2] != null,
			values: [condition[2]]
		}
	}
	return null;
}

function placeholder(): string {
	return `$${++currentIndex}`;
}