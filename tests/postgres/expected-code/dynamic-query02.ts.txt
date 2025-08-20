import pg from 'pg';
import { EOL } from 'os';

export type DerivatedTableParams = {
	subqueryName: string;
}

export type DerivatedTableResult = {
	id?: number;
	name?: string;
}

export type DerivatedTableDynamicParams = {
	select?: DerivatedTableSelect;
	params: DerivatedTableParams;
	where?: DerivatedTableWhere[];
}

export type DerivatedTableSelect = {
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

export type DerivatedTableWhere =
	| { column: 'id'; op: NumericOperator; value: number | null }
	| { column: 'id'; op: SetOperator; value: number[] }
	| { column: 'id'; op: BetweenOperator; value: [number | null, number | null] }
	| { column: 'name'; op: StringOperator; value: string | null }
	| { column: 'name'; op: SetOperator; value: string[] }
	| { column: 'name'; op: BetweenOperator; value: [string | null, string | null] }

export async function derivatedTable(client: pg.Client | pg.Pool | pg.PoolClient, params?: DerivatedTableDynamicParams): Promise<DerivatedTableResult[]> {
	const isSelected = (field: keyof DerivatedTableSelect) =>
		params?.select == null || params.select[field] === true;

	const selectedSqlFragments: string[] = [];
	const selectedFields: (keyof DerivatedTableResult)[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(params?.where?.map(w => w.column) || []);

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
		fromSqlFragments.push(`INNER JOIN ( -- derivated table
	SELECT id, name from mytable2 m 
	WHERE m.name = $1
) m2 on m2.id = m1.id`);
	}
	paramsValues.push(params?.params?.subqueryName);

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

	const whereSql = whereSqlFragments.length > 0 ? `WHERE ${whereSqlFragments.join(' AND ')}` : '';

	const sql = `SELECT
	${selectedSqlFragments.join(`,${EOL}`)}
	${fromSqlFragments.join(EOL)}
	${whereSql}`;

	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDerivatedTableResult(row, selectedFields)));
}

function mapArrayToDerivatedTableResult(data: any, selectedFields: (keyof DerivatedTableResult)[]) {
	const result: DerivatedTableResult = {};
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

function whereCondition(condition: DerivatedTableWhere, placeholder: () => string): WhereConditionResult | null {
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