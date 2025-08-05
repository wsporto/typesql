import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery08Params = {
	param1: number;
	param2: number;
}

export type DynamicQuery08Result = {
	timestamp_not_null_column?: Date;
}

export type DynamicQuery08DynamicParams = {
	select?: DynamicQuery08Select;
	params: DynamicQuery08Params;
	where?: DynamicQuery08Where[];
}

export type DynamicQuery08Select = {
	timestamp_not_null_column?: boolean;
}

const selectFragments = {
	timestamp_not_null_column: `timestamp_not_null_column`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery08Where =
	| ['timestamp_not_null_column', NumericOperator, Date | null]
	| ['timestamp_not_null_column', SetOperator, Date[]]
	| ['timestamp_not_null_column', BetweenOperator, Date | null, Date | null]

let currentIndex: number;
export async function dynamicQuery08(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery08DynamicParams): Promise<DynamicQuery08Result[]> {
	currentIndex = 2;
	const where = whereConditionsToObject(params?.where);
	const paramsValues: any = [];
	let sql = 'SELECT';
	if (params?.select == null || params.select.timestamp_not_null_column) {
		sql = appendSelect(sql, `timestamp_not_null_column`);
	}
	sql += EOL + `FROM all_types `;
	sql += EOL + `WHERE 1 = 1`;
	sql += EOL + `AND EXTRACT(YEAR FROM timestamp_not_null_column) = $1 AND EXTRACT(MONTH FROM timestamp_not_null_column) = $2`;
	paramsValues.push(params?.params?.param1 ?? null);
	paramsValues.push(params?.params?.param2 ?? null);
	params?.where?.forEach(condition => {
		const where = whereCondition(condition);
		if (where?.hasValue) {
			sql += EOL + 'AND ' + where.sql;
			paramsValues.push(...where.values);
		}
	});
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery08Result(row, params?.select)));
}

function mapArrayToDynamicQuery08Result(data: any, select?: DynamicQuery08Select) {
	const result = {} as DynamicQuery08Result;
	let rowIndex = -1;
	if (select == null || select.timestamp_not_null_column) {
		rowIndex++;
		result.timestamp_not_null_column = data[rowIndex] != null ? new Date(data[rowIndex]) : data[rowIndex];
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

function whereConditionsToObject(whereConditions?: DynamicQuery08Where[]) {
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

function whereCondition(condition: DynamicQuery08Where): WhereConditionResult | null {

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