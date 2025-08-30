import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery08DynamicParams = {
	select?: DynamicQuery08Select;
	params: DynamicQuery08Params;
	where?: DynamicQuery08Where[];
}

export type DynamicQuery08Params = {
	param1: number;
	param2: number;
}

export type DynamicQuery08Result = {
	timestamp_not_null_column?: Date;
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
	| { column: 'timestamp_not_null_column'; op: NumericOperator; value: Date | null }
	| { column: 'timestamp_not_null_column'; op: SetOperator; value: Date[] }
	| { column: 'timestamp_not_null_column'; op: BetweenOperator; value: [Date | null, Date | null] }

export async function dynamicQuery08(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery08DynamicParams): Promise<DynamicQuery08Result[]> {

	const { sql, paramsValues } = buildSql(params);
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery08Result(row, params?.select)));
}

function buildSql(queryParams?: DynamicQuery08DynamicParams) {
	const { select, where, params } = queryParams || {};

	const selectedSqlFragments: string[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(where?.map(w => w.column) || []);

	if (!select || select.timestamp_not_null_column === true) {
		selectedSqlFragments.push(`timestamp_not_null_column`);
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM all_types `);

	const whereSqlFragments: string[] = [];

	whereSqlFragments.push(`EXTRACT(YEAR FROM timestamp_not_null_column) = $1 AND EXTRACT(MONTH FROM timestamp_not_null_column) = $2`);
	paramsValues.push(params?.param1 ?? null);
	paramsValues.push(params?.param2 ?? null);
	let currentIndex = paramsValues.length;
	const placeholder = () => `$${++currentIndex}`;

	where?.forEach(condition => {
		const whereClause = whereCondition(condition, placeholder);
		if (whereClause?.hasValue) {
			whereSqlFragments.push(whereClause.sql);
			paramsValues.push(...whereClause.values);
		}
	});

	const whereSql = whereSqlFragments.length > 0 ? `WHERE ${whereSqlFragments.join(' AND ')}` : '';

	const sql = `SELECT
	${selectedSqlFragments.join(`,${EOL}`)}
	${fromSqlFragments.join(EOL)}
	${whereSql}`;

	return { sql, paramsValues };
}

function mapArrayToDynamicQuery08Result(data: any, select?: DynamicQuery08Select) {
	const result = {} as DynamicQuery08Result;
	let rowIndex = -1;
	if (!select || select.timestamp_not_null_column === true) {
		rowIndex++;
		result.timestamp_not_null_column = data[rowIndex];
	}
	return result;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery08Where, placeholder: () => string): WhereConditionResult | null {
	const selectFragment = selectFragments[condition.column];
	const { op, value } = condition;

	if (op === 'BETWEEN') {
		const [from, to] = Array.isArray(value) ? value : [null, null];
		return {
			sql: `${selectFragment} BETWEEN ${placeholder()} AND ${placeholder()}`,
			hasValue: from != null && to != null,
			values: [from, to]
		}
	}
	if (op === 'IN' || op === 'NOT IN') {
		if (!Array.isArray(value) || value.length === 0) {
			return { sql: '', hasValue: false, values: [] };
		}
		return {
			sql: `${selectFragment} ${op} (${value.map(() => placeholder()).join(', ')})`,
			hasValue: true,
			values: value
		}
	}
	if (NumericOperatorList.includes(op)) {
		return {
			sql: `${selectFragment} ${op} ${placeholder()}`,
			hasValue: value != null,
			values: [value]
		}
	}
	return null;
}