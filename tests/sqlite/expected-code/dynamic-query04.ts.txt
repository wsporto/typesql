import type { Database } from 'better-sqlite3';
import { EOL } from 'os';

export type DynamicQuery04DynamicParams = {
	select?: DynamicQuery04Select;
	where?: DynamicQuery04Where[];
}

export type DynamicQuery04Result = {
	id?: number;
	value?: number;
	id_2?: number;
	name?: string;
	descr?: string;
}

export type DynamicQuery04Select = {
	id?: boolean;
	value?: boolean;
	id_2?: boolean;
	name?: boolean;
	descr?: boolean;
}

const selectFragments = {
	id: `m1.id`,
	value: `m1.value`,
	id_2: `m2.id`,
	name: `m2.name`,
	descr: `m2.descr`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery04Where =
	| { column: 'id'; op: NumericOperator; value: number | null }
	| { column: 'id'; op: SetOperator; value: number[] }
	| { column: 'id'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'value'; op: NumericOperator; value: number | null }
	| { column: 'value'; op: SetOperator; value: number[] }
	| { column: 'value'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'id_2'; op: NumericOperator; value: number | null }
	| { column: 'id_2'; op: SetOperator; value: number[] }
	| { column: 'id_2'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'name'; op: StringOperator; value: string | null }
	| { column: 'name'; op: SetOperator; value: string[] }
	| { column: 'name'; op: BetweenOperator; value: [string | null, string | null] }
	| { column: 'descr'; op: StringOperator; value: string | null }
	| { column: 'descr'; op: SetOperator; value: string[] }
	| { column: 'descr'; op: BetweenOperator; value: [string | null, string | null] }

export function dynamicQuery04(db: Database, params?: DynamicQuery04DynamicParams): DynamicQuery04Result[] {

	const { sql, paramsValues } = buildSql(params);
	return db.prepare(sql)
		.raw(true)
		.all(paramsValues)
		.map(data => mapArrayToDynamicQuery04Result(data, params?.select));
}

function buildSql(queryParams?: DynamicQuery04DynamicParams) {
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
	if (!select || select.id_2 === true) {
		selectedSqlFragments.push(`m2.id`);
	}
	if (!select || select.name === true) {
		selectedSqlFragments.push(`m2.name`);
	}
	if (!select || select.descr === true) {
		selectedSqlFragments.push(`m2.descr`);
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM mytable1 m1`);

	if (
		(!select || select.id_2 === true)
		|| (!select || select.name === true)
		|| (!select || select.descr === true)
		|| whereColumns.has('id_2')
		|| whereColumns.has('name')
		|| whereColumns.has('descr')
	) {
		fromSqlFragments.push(`INNER JOIN mytable2 m2 on m2.id = m1.id`);
	}

	const whereSqlFragments: string[] = [];

	const placeholder = () => '?';

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

function mapArrayToDynamicQuery04Result(data: any, select?: DynamicQuery04Select) {
	const result = {} as DynamicQuery04Result;
	let rowIndex = -1;
	if (!select || select.id === true) {
		rowIndex++;
		result.id = data[rowIndex];
	}
	if (!select || select.value === true) {
		rowIndex++;
		result.value = data[rowIndex];
	}
	if (!select || select.id_2 === true) {
		rowIndex++;
		result.id_2 = data[rowIndex];
	}
	if (!select || select.name === true) {
		rowIndex++;
		result.name = data[rowIndex];
	}
	if (!select || select.descr === true) {
		rowIndex++;
		result.descr = data[rowIndex];
	}
	return result;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery04Where, placeholder: () => string): WhereConditionResult | null {
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