import { ColumnInfo, DynamicSqlInfo, DynamicSqlInfoResult, FragmentInfo, FragmentInfoResult, TableField } from "./mysql-query-analyzer/types";

export function describeDynamicQuery(dynamicQueryInfo: DynamicSqlInfo, namedParameters: string[], columnNames: ColumnInfo[]): DynamicSqlInfoResult {
    const { select, from, where } = dynamicQueryInfo;

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
    const fromFragements = from.map(fragment => {

        if (fragment.relation) {
            addAllChildFields(fragment, from);
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
        const selectedFields = select.flatMap(fragment => fragment.fields)
            .filter(field => fragment.dependOn.includes(field.table));
        const fieldIndex = selectedFields.map(field => columnNames.findIndex(col => col.columnName == field.name && (col.table == field.table || col.table == '')));

        const params = filteredWhere.flatMap(fragment => fragment.dependOnParams).map(paramIndex => namedParameters[paramIndex]);
        const fragmentResult: FragmentInfoResult = {
            fragment: fragment.fragment,
            dependOnFields: fieldIndex,
            dependOnParams: [...new Set(params)],
            parameters: fragment.parameters.map(paramIndex => namedParameters[paramIndex])
        }
        return fragmentResult;
    });

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

    return {
        select: selectFragments,
        from: fromFragements,
        where: whereFragements
    };
}

function includeAny(fields: TableField[], fields2: TableField[]) {
    return fields.some(f => fields2.find(f2 => f2.field == f.field && f2.table == f.table));
}

function addAllChildFields(currentRelation: FragmentInfo, from: FragmentInfo[]) {
    currentRelation.dependOn.push(currentRelation.relation + '');
    from.forEach(fragment => {
        if (fragment.parentRelation == currentRelation.relation) {
            currentRelation.fields.push(...fragment.fields);
            currentRelation.dependOn.push(fragment.relation + '')
        }
    })
}