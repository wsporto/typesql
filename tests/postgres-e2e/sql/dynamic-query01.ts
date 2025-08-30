import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery01DynamicParams = {
	select?: DynamicQuery01Select;
	where?: DynamicQuery01Where[];
}

export type DynamicQuery01Result = {
	id?: number;
	value?: number;
	name?: string;
	description?: string;
}

export type DynamicQuery01Select = {
	id?: boolean;
	value?: boolean;
	name?: boolean;
	description?: boolean;
}

const selectFragments = {
	id: `m1.id`,
	value: `m1.value`,
	name: `m2.name`,
	description: `m2.descr`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery01Where =
	| { column: 'id'; op: NumericOperator; value: number | null }
	| { column: 'id'; op: SetOperator; value: number[] }
	| { column: 'id'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'value'; op: NumericOperator; value: number | null }
	| { column: 'value'; op: SetOperator; value: number[] }
	| { column: 'value'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'name'; op: StringOperator; value: string | null }
	| { column: 'name'; op: SetOperator; value: string[] }
	| { column: 'name'; op: BetweenOperator; value: [string | null, string | null] }
	| { column: 'description'; op: StringOperator; value: string | null }
	| { column: 'description'; op: SetOperator; value: string[] }
	| { column: 'description'; op: BetweenOperator; value: [string | null, string | null] }

export async function dynamicQuery01(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery01DynamicParams): Promise<DynamicQuery01Result[]> {

	const { sql, paramsValues } = buildSql(params);
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery01Result(row, params?.select)));
}

function buildSql(queryParams?: DynamicQuery01DynamicParams) {
	const { select, where } = queryParams || {};

	const selectedSqlFragments: string[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(where?.map(w => w.column) || []);

	if (!select || select.id === true) {
		selectedSqlFragments.push(`m1.id`);
	}
	if (!select || select.value === true) {
		selectedSqlFragments.push(`m1.value`);
	}
	if (!select || select.name === true) {
		selectedSqlFragments.push(`m2.name`);
	}
	if (!select || select.description === true) {
		selectedSqlFragments.push(`m2.descr as description`);
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM mytable1 m1`);

	if (
		(!select || select.name === true)
		|| (!select || select.description === true)
		|| whereColumns.has('name')
		|| whereColumns.has('description')
	) {
		fromSqlFragments.push(`INNER JOIN mytable2 m2 on m1.id = m2.id`);
	}

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

function mapArrayToDynamicQuery01Result(data: any, select?: DynamicQuery01Select) {
	const result = {} as DynamicQuery01Result;
	let rowIndex = -1;
	if (!select || select.id === true) {
		rowIndex++;
		result.id = data[rowIndex];
	}
	if (!select || select.value === true) {
		rowIndex++;
		result.value = data[rowIndex];
	}
	if (!select || select.name === true) {
		rowIndex++;
		result.name = data[rowIndex];
	}
	if (!select || select.description === true) {
		rowIndex++;
		result.description = data[rowIndex];
	}
	return result;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery01Where, placeholder: () => string): WhereConditionResult | null {
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