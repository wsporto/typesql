import { ColumnInfo, DynamicSqlInfo, DynamicSqlInfoResult, FragmentInfo, FragmentInfoResult, TableField } from "./mysql-query-analyzer/types";

export function describeDynamicQuery(dynamicQueryInfo: DynamicSqlInfo, namedParameters: string[], columnNames: ColumnInfo[]): DynamicSqlInfoResult {
    const { with: withFragments, select, from, where } = dynamicQueryInfo;

    const selectFragments = select.map((fragment, index) => {
        const fragmentResult: FragmentInfoResult = {
            fragment: fragment.fragment,
            fragmentWitoutAlias: fragment.fragementWithoutAlias,
            dependOnFields: [index], //remove duplicated
            dependOnParams: [],
            parameters: []
        }
        return fragmentResult;
    });
    const withFragements = withFragments?.map(fragment => transformFrom(fragment, withFragments, select, from, where, namedParameters));
    const fromFragements = from.map(fragment => transformFrom(fragment, undefined, select, from, where, namedParameters));

    const whereFragements = where.map(fragment => {

        const params = fragment.dependOnParams.map(paramIndex => namedParameters[paramIndex]);
        const fragmentResult: FragmentInfoResult = {
            fragment: fragment.fragment,
            dependOnFields: [],
            dependOnParams: params,
            parameters: params
        }
        return fragmentResult
    })

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

function transformFrom(fragment: FragmentInfo, withFragments: FragmentInfo[] | undefined, select: FragmentInfo[], from: FragmentInfo[], where: FragmentInfo[], namedParameters: string[]) {
    if (fragment.relation) {
        addAllChildFields(fragment, from, withFragments);
    }

    const filteredWhere = where.filter(whereFragment => includeAny(whereFragment.fields, fragment.fields));
    const hasUnconditional = filteredWhere
        .some(fragment => fragment.dependOnParams.length == 0);

    if (hasUnconditional) {
        return {
            fragment: fragment.fragment,
            dependOnFields: [],
            dependOnParams: [],
            parameters: fragment.parameters.map(paramIndex => namedParameters[paramIndex])
        }
    }

    const fieldIndex = select.flatMap((selectField, index) => {
        const found = selectField.dependOn.find(dependsOn => fragment.dependOn.includes(dependsOn));
        if (found) {
            return index;
        }
        return [];
    });

    const params = filteredWhere.flatMap(fragment => fragment.dependOnParams).map(paramIndex => namedParameters[paramIndex]);
    const fragmentResult: FragmentInfoResult = {
        fragment: fragment.fragment,
        dependOnFields: fieldIndex,
        dependOnParams: [...new Set(params)],
        parameters: fragment.parameters.map(paramIndex => namedParameters[paramIndex])
    }
    return fragmentResult;
}

function includeAny(fields: TableField[], fields2: TableField[]) {
    return fields.some(f => fields2.find(f2 => f2.field == f.field && f2.table == f.table));
}

function addAllChildFields(currentRelation: FragmentInfo, select: FragmentInfo[], withFragments: FragmentInfo[] | undefined) {
    currentRelation.dependOn.push(currentRelation.relation + '');
    select.forEach(fragment => {
        if (fragment.parentRelation == currentRelation.relation) {
            currentRelation.fields.push(...fragment.fields);
            currentRelation.dependOn.push(fragment.relation + '')
        }
        withFragments?.forEach(withFragment => {
            if (withFragment.parentRelation == fragment.relation) {
                withFragment.fields.push(...fragment.fields);
                withFragment.dependOn.push(fragment.relation + '');
            }
        })
    })

}