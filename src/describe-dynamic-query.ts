import { splitName } from './mysql-query-analyzer/select-columns';
import type {
	DynamicSqlInfo,
	DynamicSqlInfo2,
	DynamicSqlInfoResult,
	DynamicSqlInfoResult2,
	FragmentInfo,
	FragmentInfoResult,
	FromFragementResult,
	FromFragment,
	SelectFragment,
	SelectFragmentResult,
	TableField,
	WhereFragment,
	WhereFragmentResult,
	WithFragment
} from './mysql-query-analyzer/types';

export function describeDynamicQuery(
	dynamicQueryInfo: DynamicSqlInfo,
	namedParameters: string[],
	orderBy: string[]
): DynamicSqlInfoResult {
	const { with: withFragments, select, from, where } = dynamicQueryInfo;

	const selectFragments = select.map((fragment, index) => {
		const fragmentResult: FragmentInfoResult = {
			fragment: fragment.fragment,
			fragmentWitoutAlias: fragment.fragementWithoutAlias,
			dependOnFields: [index], //remove duplicated
			dependOnParams: [],
			parameters: []
		};
		return fragmentResult;
	});
	const withFragements = withFragments?.map((fragment) =>
		transformFrom(
			fragment,
			withFragments,
			select,
			from,
			where,
			namedParameters,
			orderBy
		)
	);
	const fromFragements = from.map((fragment) =>
		transformFrom(
			fragment,
			undefined,
			select,
			from,
			where,
			namedParameters,
			orderBy
		)
	);

	const whereFragements = where.map((fragment) => {
		const params = fragment.dependOnParams.map(
			(paramIndex) => namedParameters[paramIndex]
		);
		const fragmentResult: FragmentInfoResult = {
			fragment: fragment.fragment,
			dependOnFields: [],
			dependOnParams: params,
			parameters: params
		};
		return fragmentResult;
	});

	const result: DynamicSqlInfoResult = {
		select: selectFragments,
		from: fromFragements,
		where: whereFragements
	};
	if (withFragements != null && withFragements.length > 0) {
		result.with = withFragements;
	}
	return result;
}

function transformFrom(
	fragment: FragmentInfo,
	withFragments: FragmentInfo[] | undefined,
	select: FragmentInfo[],
	from: FragmentInfo[],
	where: FragmentInfo[],
	namedParameters: string[],
	orderByColumns: string[]
) {
	if (fragment.relation) {
		addAllChildFields(fragment, from, withFragments);
	}

	const filteredWhere = where.filter((whereFragment) =>
		includeAny(whereFragment.fields, fragment.fields)
	);
	const hasUnconditional = filteredWhere.some(
		(fragment) => fragment.dependOnParams.length === 0
	);

	if (hasUnconditional) {
		return {
			fragment: fragment.fragment,
			dependOnFields: [],
			dependOnParams: [],
			parameters: fragment.parameters.map(
				(paramIndex) => namedParameters[paramIndex]
			)
		};
	}

	const fieldIndex = select.flatMap((selectField, index) => {
		const found = selectField.dependOn.find((dependsOn) =>
			fragment.dependOn.includes(dependsOn)
		);
		if (found) {
			return index;
		}
		return [];
	});

	const orderBy = orderByColumns.flatMap((orderBy) => {
		const orderByField = splitName(orderBy);
		const found = fragment.fields.find(
			(field) =>
				field.name === orderByField.name &&
				(field.table === orderByField.prefix || orderByField.prefix === '')
		);
		if (found) {
			return orderBy;
		}
		return [];
	});

	const params = filteredWhere
		.flatMap((fragment) => fragment.dependOnParams)
		.map((paramIndex) => namedParameters[paramIndex]);
	const fragmentResult: FragmentInfoResult = {
		fragment: fragment.fragment,
		dependOnFields: fieldIndex,
		dependOnParams: [...new Set(params)],
		parameters: fragment.parameters.map(
			(paramIndex) => namedParameters[paramIndex]
		)
	};
	if (orderBy.length > 0) {
		fragmentResult.dependOnOrderBy = orderBy;
	}
	return fragmentResult;
}

function includeAny(fields: TableField[], fields2: TableField[]) {
	return fields.some((f) =>
		fields2.find((f2) => f2.field === f.field && f2.table === f.table)
	);
}

function addAllChildFields(
	currentRelation: FragmentInfo,
	select: FragmentInfo[],
	withFragments: FragmentInfo[] | undefined
) {
	currentRelation.dependOn.push(`${currentRelation.relation}`);
	select.forEach((fragment) => {
		if (fragment.parentRelation === currentRelation.relation) {
			currentRelation.fields.push(...fragment.fields);
			currentRelation.dependOn.push(`${fragment.relation}`);
		}
		withFragments?.forEach((withFragment) => {
			if (withFragment.parentRelation === fragment.relation) {
				withFragment.fields.push(...fragment.fields);
				withFragment.dependOn.push(`${fragment.relation}`);
			}
		});
	});
}

export function describeDynamicQuery2(
	dynamicQueryInfo: DynamicSqlInfo2,
	namedParameters: string[],
	orderByColumns: string[]
): DynamicSqlInfoResult2 {
	const {
		with: withFragments,
		select,
		from,
		where,
		limitOffset
	} = dynamicQueryInfo;

	const fromResult = transformFromFragments(
		from,
		select,
		namedParameters,
		orderByColumns
	);

	const result: DynamicSqlInfoResult2 = {
		with: transformWithFragmnts(withFragments, fromResult, namedParameters),
		select: transformSelectFragments(select, namedParameters),
		from: fromResult,
		where: transformWhereFragments(where, namedParameters)
	};
	if (limitOffset) {
		result.limitOffset = {
			fragment: limitOffset.fragment,
			parameters: limitOffset.parameters.map(
				(paramIndex) => namedParameters[paramIndex]
			)
		};
	}
	return result;
}

function transformSelectFragments(
	selectFragments: SelectFragment[],
	namedParameters: string[]
): SelectFragmentResult[] {
	return selectFragments.map((select) => ({
		fragment: select.fragment,
		fragmentWitoutAlias: select.fragmentWitoutAlias,
		parameters: select.parameters.map(
			(paramIndex) => namedParameters[paramIndex]
		)
	}));
}

function transformWithFragmnts(
	withFragments: WithFragment[],
	fromFragments: FromFragementResult[],
	namedParameters: string[]
): FromFragementResult[] {
	return withFragments.map((withFragment) => {
		const fromDependOn = fromFragments.filter(
			(from) => from.relationName === withFragment.relationName
		);
		const dependOnFields = fromDependOn.flatMap((from) => from.dependOnFields);
		const dependOnOrderBy = fromDependOn.flatMap(
			(from) => from.dependOnOrderBy
		);
		const fromFragmentResult: FromFragementResult = {
			fragment: withFragment.fragment,
			relationName: withFragment.relationName,
			dependOnFields,
			dependOnOrderBy,
			parameters: withFragment.parameters.map(
				(paramIndex) => namedParameters[paramIndex]
			)
		};
		return fromFragmentResult;
	});
}

type FromFragmentTempResult = FromFragementResult & {
	parentRelation: string;
	relationAlias: string;
};

function transformFromFragments(
	fromFragments: FromFragment[],
	selectFragments: SelectFragment[],
	namedParameters: string[],
	orderByColumns: string[]
): FromFragementResult[] {
	const fromResult = fromFragments.map((from) => {
		const orderBy = orderByColumns.flatMap((orderBy) => {
			const orderByField = splitName(orderBy);
			const found = from.fields.find(
				(field) =>
					field === orderByField.name &&
					(from.relationAlias === orderByField.prefix ||
						from.relationName === orderByField.prefix ||
						orderByField.prefix === '')
			);
			if (found) {
				return orderBy;
			}
			return [];
		});
		const { relationName, relationAlias, parentRelation } = from;
		const fromFragmentResult: FromFragmentTempResult = {
			fragment: from.fragment,
			relationName: from.relationName,
			relationAlias: from.relationAlias,
			parentRelation: from.parentRelation,
			dependOnFields: getDependOnFields(
				{ relationName, relationAlias, parentRelation },
				selectFragments
			),
			dependOnOrderBy: orderBy,
			parameters: from.parameters.map(
				(paramIndex) => namedParameters[paramIndex]
			)
		};
		return fromFragmentResult;
	});

	const withChildren = fromResult.map((parentFrom) => {
		const actualAndChildRelations = fromResult.filter(
			(childFrom) =>
				(childFrom.parentRelation === parentFrom.relationAlias &&
					parentFrom.parentRelation !== '') ||
				childFrom.relationName === parentFrom.relationName
		);
		const dependOnFields = actualAndChildRelations.flatMap(
			(from) => from.dependOnFields
		);
		const dependOnOrderBy = actualAndChildRelations.flatMap(
			(from) => from.dependOnOrderBy
		);
		const result: FromFragementResult = {
			fragment: parentFrom.fragment,
			relationName: parentFrom.relationName,
			dependOnFields,
			dependOnOrderBy,
			parameters: parentFrom.parameters
		};
		return result;
	});
	return withChildren;
}

function transformWhereFragments(
	whereFragements: WhereFragment[],
	namedParameters: string[]
): WhereFragmentResult[] {
	return whereFragements.map((where) => {
		const parameters = where.parameters.map((param) => namedParameters[param]);
		const whereFragmentResult: WhereFragmentResult = {
			fragment: where.fragment,
			parameters
		};
		return whereFragmentResult;
	});
}

function getDependOnFields(
	relationInfo: {
		relationName: string;
		relationAlias: string;
		parentRelation: string;
	},
	selectFragments: SelectFragment[]
): number[] {
	if (relationInfo.parentRelation === '') {
		//from
		return [];
	}

	const dependOnFields = selectFragments.flatMap((select, index) => {
		if (select.dependOnRelations.includes(relationInfo.relationAlias)) {
			return index;
		}
		return [];
	});

	return dependOnFields;
}
