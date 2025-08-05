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
	| ['id', NumericOperator, number | null]
	| ['id', SetOperator, number[]]
	| ['id', BetweenOperator, number | null, number | null]
	| ['name', StringOperator, string | null]
	| ['name', SetOperator, string[]]
	| ['name', BetweenOperator, string | null, string | null]

let currentIndex: number;
export async function dynamicQuery05(client: pg.Client | pg.Pool | pg.PoolClient, params?: DynamicQuery05DynamicParams): Promise<DynamicQuery05Result[]> {
	currentIndex = 0;
	const where = whereConditionsToObject(params?.where);
	const paramsValues: any = [];
	let withClause = '';
	if (params?.select == null
		|| params.select.name
		|| where.name != null) {
		if (withClause !== '') withClause += ',' + EOL;
		withClause += `cte as (
		select id, name from mytable2
	)`;
	}
	let sql = 'SELECT';
	if (withClause) {
		sql = 'WITH' + EOL + withClause + EOL + sql;
	}
	if (params?.select == null || params.select.id) {
		sql = appendSelect(sql, `m1.id`);
	}
	if (params?.select == null || params.select.name) {
		sql = appendSelect(sql, `m2.name`);
	}
	sql += EOL + `FROM mytable1 m1`;
	if (params?.select == null
		|| params.select.name
		|| where.name != null) {
		sql += EOL + `INNER JOIN cte m2 on m2.id = m1.id`;
	}
	sql += EOL + `WHERE 1 = 1`;
	params?.where?.forEach(condition => {
		const where = whereCondition(condition);
		if (where?.hasValue) {
			sql += EOL + 'AND ' + where.sql;
			paramsValues.push(...where.values);
		}
	});
	return client.query({ text: sql, rowMode: 'array', values: paramsValues })
		.then(res => res.rows.map(row => mapArrayToDynamicQuery05Result(row, params?.select)));
}

function mapArrayToDynamicQuery05Result(data: any, select?: DynamicQuery05Select) {
	const result = {} as DynamicQuery05Result;
	let rowIndex = -1;
	if (select == null || select.id) {
		rowIndex++;
		result.id = data[rowIndex];
	}
	if (select == null || select.name) {
		rowIndex++;
		result.name = data[rowIndex];
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

function whereConditionsToObject(whereConditions?: DynamicQuery05Where[]) {
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

function whereCondition(condition: DynamicQuery05Where): WhereConditionResult | null {

	const selectFragment = selectFragments[condition[0]];
	const operator = condition[1];

	if (operator == 'LIKE') {
		return {
			sql: `${selectFragment} LIKE ${placeholder()}`,
			hasValue: condition[2] != null,
			values: [condition[2]]
		}
	}
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