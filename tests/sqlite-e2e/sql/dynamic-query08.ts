import type { Database } from 'better-sqlite3';
import { EOL } from 'os';

export type DynamicQuery08DynamicParams = {
	select?: DynamicQuery08Select;
	params: DynamicQuery08Params;
	where?: DynamicQuery08Where[];
}

export type DynamicQuery08Params = {
	param1?: Date | null;
	param2?: Date | null;
}

export type DynamicQuery08Result = {
	date1?: string;
	date?: Date;
	date_time?: Date;
}

export type DynamicQuery08Select = {
	date1?: boolean;
	date?: boolean;
	date_time?: boolean;
}

const selectFragments = {
	date1: `date1`,
	date: `date(date1)`,
	date_time: `datetime(date2)`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery08Where =
	| { column: 'date1'; op: StringOperator; value: string | null }
	| { column: 'date1'; op: SetOperator; value: string[] }
	| { column: 'date1'; op: BetweenOperator; value: [string | null, string | null] }
	| { column: 'date'; op: NumericOperator; value: Date | null }
	| { column: 'date'; op: SetOperator; value: Date[] }
	| { column: 'date'; op: BetweenOperator; value: [Date | null, Date | null] }
	| { column: 'date_time'; op: NumericOperator; value: Date | null }
	| { column: 'date_time'; op: SetOperator; value: Date[] }
	| { column: 'date_time'; op: BetweenOperator; value: [Date | null, Date | null] }

export function dynamicQuery08(db: Database, params?: DynamicQuery08DynamicParams): DynamicQuery08Result[] {

	const { sql, paramsValues } = buildSql(params);
	return db.prepare(sql)
		.raw(true)
		.all(paramsValues)
		.map(data => mapArrayToDynamicQuery08Result(data, params?.select));
}

function buildSql(queryParams?: DynamicQuery08DynamicParams) {
	const { select, where, params } = queryParams || {};

	const selectedSqlFragments: string[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(where?.map(w => w.column) || []);

	if (!select || select.date1 === true) {
		selectedSqlFragments.push(`date1`);
	}
	if (!select || select.date === true) {
		selectedSqlFragments.push(`date(date1) as date`);
	}
	if (!select || select.date_time === true) {
		selectedSqlFragments.push(`datetime(date2) as date_time`);
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM date_table`);

	const whereSqlFragments: string[] = [];

	whereSqlFragments.push(`date(date1) = ? AND datetime(date2) = ?`);
	paramsValues.push(params?.param1?.toISOString().split('T')[0] ?? null);
	paramsValues.push(params?.param2?.toISOString().split('.')[0].replace('T', ' ') ?? null);
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

function mapArrayToDynamicQuery08Result(data: any, select?: DynamicQuery08Select) {
	const result = {} as DynamicQuery08Result;
	let rowIndex = -1;
	if (!select || select.date1 === true) {
		rowIndex++;
		result.date1 = data[rowIndex];
	}
	if (!select || select.date === true) {
		rowIndex++;
		result.date = data[rowIndex] != null ? new Date(data[rowIndex]) : data[rowIndex];
	}
	if (!select || select.date_time === true) {
		rowIndex++;
		result.date_time = data[rowIndex] != null ? new Date(data[rowIndex]) : data[rowIndex];
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

function isDate(value: any): value is Date {
	return value instanceof Date;
}