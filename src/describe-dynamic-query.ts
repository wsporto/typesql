import { DynamicSqlInfo, DynamicSqlInfoResult, FragmentInfo, FragmentInfoResult, TableField } from "./mysql-query-analyzer/types";

export function describeDynamicQuery(dynamicQueryInfo: DynamicSqlInfo, namedParameters: string[]): DynamicSqlInfoResult {
    const { select, from, where } = dynamicQueryInfo;
    const dynamicQuery: DynamicSqlInfoResult = {
        select: convertToFragmentResultList(select, namedParameters),
        from: convertToFragmentResultList(from, namedParameters),
        where: convertToFragmentResultList(where, namedParameters)
    }
    return dynamicQuery;
}

function convertToFragmentResultList(fragmentInfo: FragmentInfo[], namedParameters: string[]) {
    return fragmentInfo.map(fragment => convertToFragementResult(fragment, namedParameters));
}

function convertToFragementResult(fragmentInfo: FragmentInfo, namedParameters: string[]): FragmentInfoResult {
    const fragmentResult: FragmentInfoResult = {
        fragment: fragmentInfo.fragment,
        dependOnFields: fragmentInfo.dependOnFields.map(field => field.name),
        dependOnParams: fragmentInfo.dependOnParams.map(paramIndex => namedParameters[paramIndex])
    }
    return fragmentResult;
}

export function filterSelectFieldsFromAllFragments(dynamicSqlInfo: DynamicSqlInfo, selectFragments: FragmentInfo[]) {

    dynamicSqlInfo.from?.forEach(fragment => {
        fragment.dependOnFields = filterSelectFieldsFromFragment(fragment, selectFragments.flatMap(f => f.fields));
    })
    selectFragments.forEach(selectFragment => {
        selectFragment.dependOnFields = [...selectFragment.fields]
    })
}

export function filterSelectFieldsFromFragment(fragment: FragmentInfo, selectedItems: TableField[]) {
    return fragment.fields?.filter(field => selectedItems?.find(f => f.field == field.field && f.table == field.table));
}