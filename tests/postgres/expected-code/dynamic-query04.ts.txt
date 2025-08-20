import pg from 'pg';
import { EOL } from 'os';

export type DynamicQuery04Result = {
	id?: number;
	value?: number;
	id_2?: number;
	name?: string;
	descr?: string;
}

export type DynamicQuery04DynamicParams = {
	select?: DynamicQuery04Select;
	where?: DynamicQuery04Where[];
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

export async function dynamicQuery04(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery04DynamicParams): Promise<DynamicQuery04Result[]> {
	const isSelected = (field: keyof DynamicQuery04Select) =>
		params?.select == null || params.select[field] === true;

	const selectedSqlFragments: string[] = [];
	const selectedFields: (keyof DynamicQuery04Result)[] = [];
	const paramsValues: any[] = [];

	const whereColumns = new Set(params?.where?.map(w => w.column) || []);

	if (isSelected('id')) {
		selectedSqlFragments.push('m1.id');
		selectedFields.push('id');
	}
	if (isSelected('value')) {
		selectedSqlFragments.push('m1.value');
		selectedFields.push('value');
	}
	if (isSelected('id_2')) {
		selectedSqlFragments.push('m2.id');
		selectedFields.push('id_2');
	}
	if (isSelected('name')) {
		selectedSqlFragments.push('m2.name');
		selectedFields.push('name');
	}
	if (isSelected('descr')) {
		selectedSqlFragments.push('m2.descr');
		selectedFields.push('descr');
	}

	const fromSqlFragments: string[] = [];
	fromSqlFragments.push(`FROM mytable1 m1`);

	if (
		isSelected('id_2')
		|| isSelected('name')
		|| isSelected('descr')
		|| whereColumns.has('id_2')
		|| whereColumns.has('name')
		|| whereColumns.has('descr')
	) {
		fromSqlFragments.push(`INNER JOIN mytable2 m2 on m2.id = m1.id`);
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

	const whereSql = whereSqlFragments.length > 0 ? `WHERE ${whereSqlFragments.join(' AND ')}` : '';

	const sql = `SELECT
	${selectedSqlFragments.join(`,${EOL}`)}
	${fromSqlFragments.join(EOL)}
	${whereSql}`;

	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery04Result(row, selectedFields)));
}

function mapArrayToDynamicQuery04Result(data: any, selectedFields: (keyof DynamicQuery04Result)[]) {
	const result: DynamicQuery04Result = {};
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