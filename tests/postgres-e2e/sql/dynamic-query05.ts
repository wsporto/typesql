import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery05Result = {
	id?: number;
	name?: string;
}

export type DynamicQuery05DynamicParams = {
	select?: DynamicQuery05Select;
	where?: DynamicQuery05Where[];
}

export type DynamicQuery05Select = {
	id?: boolean;
	name?: boolean;
}

const selectFragments = {
	id: `m1.id`,
	name: `m2.name`,
} as const;

const NumericOperatorList = ['=', '<>', '>', '<', '>=', '<='] as const;
type NumericOperator = typeof NumericOperatorList[number];
type StringOperator = '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE';
type SetOperator = 'IN' | 'NOT IN';
type BetweenOperator = 'BETWEEN';

export type DynamicQuery05Where =
	| { column: 'id'; op: NumericOperator; value: number | null }
	| { column: 'id'; op: SetOperator; value: number[] }
	| { column: 'id'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'name'; op: StringOperator; value: string | null }
	| { column: 'name'; op: SetOperator; value: string[] }
	| { column: 'name'; op: BetweenOperator; value: [string | null, string | null] }

export async function dynamicQuery05(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery05DynamicParams): Promise<DynamicQuery05Result[]> {
	const isSelected = (field: keyof DynamicQuery05Select) =>
		params?.select == null || params.select[field] === true;

	const selectedSqlFragments: string[] = [];
	const selectedFields: (keyof DynamicQuery05Result)[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(params?.where?.map(w => w.column) || []);

	const withFragments: string[] = [];
	if (
		isSelected('name')
		|| whereColumns.has('name')
	) {
		withFragments.push(`cte as (
		select id, name from mytable2
	)`);
	}
	if (isSelected('id')) {
		selectedSqlFragments.push('m1.id');
		selectedFields.push('id');
	}
	if (isSelected('name')) {
		selectedSqlFragments.push('m2.name');
		selectedFields.push('name');
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM mytable1 m1`);

	if (
		isSelected('name')
		|| whereColumns.has('name')
	) {
		fromSqlFragments.push(`INNER JOIN cte m2 on m2.id = m1.id`);
	}

	const whereSqlFragments: string[] = [];

	let currentIndex = paramsValues.length;
	const placeholder = () => `$${++currentIndex}`;

	params?.where?.forEach(condition => {
		const whereClause = whereCondition(condition, placeholder);
		if (whereClause?.hasValue) {
			whereSqlFragments.push(whereClause.sql);
			paramsValues.push(...whereClause.values);
		}
	});

	const withSql = withFragments.length > 0
		? `WITH${EOL}${withFragments.join(`,${EOL}`)}${EOL}`
		: '';

	const whereSql = whereSqlFragments.length > 0 ? `WHERE ${whereSqlFragments.join(' AND ')}` : '';

	const sql = `${withSql}SELECT
	${selectedSqlFragments.join(`,${EOL}`)}
	${fromSqlFragments.join(EOL)}
	${whereSql}`;

	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery05Result(row, selectedFields)));
}

function mapArrayToDynamicQuery05Result(data: any, selectedFields: (keyof DynamicQuery05Result)[]) {
	const result: DynamicQuery05Result = {};
	selectedFields.forEach((field, index) => {
		result[field] = data[index];
	});
	return result;
}

type WhereConditionResult = {
	sql: string;
	hasValue: boolean;
	values: any[];
}

function whereCondition(condition: DynamicQuery05Where, placeholder: () => string): WhereConditionResult | null {
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