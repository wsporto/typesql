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
	| { column: 'id'; op: NumericOperator; value: number | null }
	| { column: 'id'; op: SetOperator; value: number[] }
	| { column: 'id'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'value'; op: NumericOperator; value: number | null }
	| { column: 'value'; op: SetOperator; value: number[] }
	| { column: 'value'; op: BetweenOperator; value: [number | null, number | null] }

export async function dynamicQuery03(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery03DynamicParams): Promise<DynamicQuery03Result[]> {

	const { sql, paramsValues } = buildSql(params);
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery03Result(row, params?.select)));
}

function buildSql(queryParams?: DynamicQuery03DynamicParams) {
	const { select, where } = queryParams || {};

	const selectedSqlFragments: string[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(where?.map(w => w.column) || []);

	if (!select || select.id === true) {
		selectedSqlFragments.push(`t1.id`);
	}
	if (!select || select.value === true) {
		selectedSqlFragments.push(`t1.value`);
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM mytable1 t1`);

	const whereSqlFragments: string[] = [];

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

function mapArrayToDynamicQuery03Result(data: any, select?: DynamicQuery03Select) {
	const result = {} as DynamicQuery03Result;
	let rowIndex = -1;
	if (!select || select.id === true) {
		rowIndex++;
		result.id = data[rowIndex];
	}
	if (!select || select.value === true) {
		rowIndex++;
		result.value = data[rowIndex];
	}
	return result;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery03Where, placeholder: () => string): WhereConditionResult | null {
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