import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery10DynamicParams = {
	select?: DynamicQuery10Select;
	params: DynamicQuery10Params;
	where?: DynamicQuery10Where[];
}

export type DynamicQuery10Params = {
	name: string;
	limit: string;
	offset: string;
}

export type DynamicQuery10Result = {
	id?: number;
	name?: string;
}

export type DynamicQuery10Select = {
	id?: boolean;
	name?: boolean;
}

const selectFragments = {
	id: `t1.id`,
	name: `t2.name`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery10Where =
	| { column: 'id'; op: NumericOperator; value: number | null }
	| { column: 'id'; op: SetOperator; value: number[] }
	| { column: 'id'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'name'; op: StringOperator; value: string | null }
	| { column: 'name'; op: SetOperator; value: string[] }
	| { column: 'name'; op: BetweenOperator; value: [string | null, string | null] }

export async function dynamicQuery10(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery10DynamicParams): Promise<DynamicQuery10Result[]> {

	const { sql, paramsValues } = buildSql(params);
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery10Result(row, params?.select)));
}

function buildSql(queryParams?: DynamicQuery10DynamicParams) {
	const { select, where, params } = queryParams || {};

	const selectedSqlFragments: string[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(where?.map(w => w.column) || []);

	if (!select || select.id === true) {
		selectedSqlFragments.push(`t1.id`);
	}
	if (!select || select.name === true) {
		selectedSqlFragments.push(`t2.name`);
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM mytable1 t1`);

	if (
		(!select || select.name === true)
		|| whereColumns.has('name')
	) {
		fromSqlFragments.push(`INNER JOIN mytable2 t2 on t2.id = t1.id`);
	}

	const whereSqlFragments: string[] = [];

	whereSqlFragments.push(`name <> $1`);
	paramsValues.push(params?.name ?? null);
	paramsValues.push(params?.limit ?? null);
	paramsValues.push(params?.offset ?? null);

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
	${whereSql}
	LIMIT $2 OFFSET $3`;

	return { sql, paramsValues };
}

function mapArrayToDynamicQuery10Result(data: any, select?: DynamicQuery10Select) {
	const result = {} as DynamicQuery10Result;
	let rowIndex = -1;
	if (!select || select.id === true) {
		rowIndex++;
		result.id = data[rowIndex];
	}
	if (!select || select.name === true) {
		rowIndex++;
		result.name = data[rowIndex];
	}
	return result;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery10Where, placeholder: () => string): WhereConditionResult | null {
	const selectFragment = selectFragments[condition.column];
	const { op, value } = condition;

	if (op === 'LIKE') {
		return {
			sql: `${selectFragment} LIKE ${placeholder()}`,
			hasValue: value != null,
			values: [value]
		}
	}
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