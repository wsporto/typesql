import { CommonTokenStream, ANTLRInputStream } from "antlr4ts";
import { MySQLLexer } from "./parser/MySQLLexer";
import { MySQLParser } from "./parser/MySQLParser";
import { ParseTreeWalker } from "antlr4ts/tree";
import { MySQLWalker } from "./parser/MySQLWalker";
import { isLeft, right, Either } from "fp-ts/lib/Either"
import { ColumnDef, SchemaDef, ParameterDef, FieldDescriptor, DBSchema, InvalidSqlError, PreprocessedSql, ParameterContext } from "./types";
import { DbClient } from "./queryExectutor";
import { MySqlType } from "./mysql-mapping";

export function parseSqlWalker(sql: string) : MySQLWalker {

    const lexer = new MySQLLexer(new ANTLRInputStream(sql));
    const tokens = new CommonTokenStream(lexer);
    const parser = new MySQLParser(tokens);

    let tree = parser.query();

    const walker = new MySQLWalker()
    // console.log("before walk");
    ParseTreeWalker.DEFAULT.walk(walker, tree);

    return walker;
}

export async function parseSql(client: DbClient, sql: string) : Promise<Either<InvalidSqlError, SchemaDef>> {

    const {sql: processedSql, namedParameters} = preprocessSql(sql);
    const explainResult = await client.explainSql(processedSql);
    if(isLeft(explainResult)) {
        return explainResult;
    }
    const walker = parseSqlWalker(processedSql);
    if(walker.insertParameters) {

        const insertSchema = await client.loadDbSchema();
        const insertParameters = walker.insertParameters.map( (param, index) => {
            const column = insertSchema.find( col => col.column == param && col.table == walker.insertIntoTable);
            const paramName = namedParameters.length > 0? namedParameters[index] : param;
            const parameter : ParameterDef = {
                name: paramName,
                columnType: column?.column_type!,
                notNull: column?.notNull!
            }
            return parameter;
        })

        //const uniqueParameters = getUniqueParameters(insertParameters, namedParameters, params => params.some( param => param.notNull));
        const insertResultColumns : ColumnDef[] = [
            {
                name: 'affectedRows',
                dbtype: 'int',
                notNull: true
            },
            {
                name: 'insertId',
                dbtype: 'int',
                notNull: true
            }
        ]
        const insertResult : SchemaDef = {
            sql: processedSql,
            multipleRowsResult: false,
            columns: insertResultColumns,
            parameters: insertParameters
        }
        return right(insertResult);
    }
    if(walker.updateTable) {

        const insertSchema = await client.loadDbSchema();
        const insertParameters = walker.updateColumns.map( (columnName, index) => {
            const column = insertSchema.find( col => col.column == columnName && col.table == walker.updateTable);
            
            const paramName = namedParameters.length > 0? namedParameters[index] : column?.column!;
            const parameter : ParameterDef = {
                name: paramName,
                columnType: column?.column_type!,
                notNull: column?.notNull!
            }
            return parameter;
        })

        const insertResultColumns : ColumnDef[] = [
            {
                name: 'affectedRows',
                dbtype: 'int',
                notNull: true
            },
            {
                name: 'insertId',
                dbtype: 'int',
                notNull: true
            }
        ]

        const filterParameters = await resolveParameters(client, walker.parameters);
        const updateParamNames = namedParameters.slice(0, insertParameters.length);
        const filterParamNames = namedParameters.slice(insertParameters.length);
        
        const namedInsertParameters = addParameterNames(insertParameters, updateParamNames);
        const namedDataParameters = addParameterNames(filterParameters, filterParamNames);

        const insertResult : SchemaDef = {
            sql: processedSql,
            multipleRowsResult: false,
            columns: insertResultColumns,
            data: namedInsertParameters,
            parameters: namedDataParameters
        }
        return right(insertResult);
    }

    if(walker.deleteTable) {

        const insertResultColumns : ColumnDef[] = [
            {
                name: 'affectedRows',
                dbtype: 'int',
                notNull: true
            }
        ]

        const parameters = await resolveParameters(client, walker.parameters);

        const insertResult : SchemaDef = {
            sql: processedSql,
            multipleRowsResult: false,
            columns: insertResultColumns,
            parameters: parameters,
            data: []
        }
        return right(insertResult);
    }
    
    const queryResult = await client.executeQuery(processedSql); //the original query
    if( isLeft(queryResult)) {
        return queryResult;
    }
    
    const fields = queryResult.right;

    const columnsSchema = await client.loadDbSchema();
    const dbSchema: DBSchema = {
        columns: columnsSchema
    }
    
    const fieldsNullability = walker.inferNotNull(dbSchema);
    if(fields.length != fieldsNullability.length) {
        console.warn("Something went wrong at the nullability verification for the query:", sql);
    }

    const mapped = fields.map( (field, fieldIndex) => {
        const col : ColumnDef = {
            name: field.name.trim(),
            dbtype: field.columnType,
            notNull: field.notNull
        }
        if(!col.notNull && fields.length == fieldsNullability.length) {
            col.notNull = fieldsNullability[fieldIndex].notNull;
        }
        return col;
    })

    renameDuplicatedColumns(mapped);

    const mappedParameters = await resolveParameters(client, walker.parameters);

    // const resultParameters = namedParameters.length == 0 ? mappedParameters : getUniqueParameters(mappedParameters, namedParameters, 
    //     params => true);
    const resultParameters = addParameterNames(mappedParameters, namedParameters);

    const result: SchemaDef = {
        sql: processedSql,
        multipleRowsResult: true,
        columns: mapped,
        parameters: resultParameters
    }

    const fromColumns = walker.getColumnsFrom(dbSchema, walker.querySpecification[0]).map( col => col.columnName);
    const selectColumns = mapped.map( col => col.name);
    const allOrderByColumns = Array.from(new Set(fromColumns.concat(selectColumns)));
    if(walker.orderByParameter) {
        result.orderByColumns = allOrderByColumns;
    }
    return right(result);
}

function addParameterNames(parameters: ParameterDef[], namedParameters: string[]) {
    return namedParameters.length>0? parameters.map( (param, index) => ({...param, name: namedParameters[index]})): parameters;
}

async function resolveParameters(client: DbClient, parameters: ParameterContext[]) {
    const mappedParameters: ParameterDef[] = [];

    let index = 0;
    for (const parameter of parameters) {
        index++;
        const param: ParameterDef = {
            name: '?',
            columnType: '?',
            notNull: false
        }

        switch (parameter.type) {
            case 'resolved':
                param.columnType = parameter.columnType;
                break;
            case 'function':
                const paramType = client.functionParamType(parameter.functionName);
                param.columnType = paramType;

                break;
            case 'expression':
                const resultParams2 = await client.executeExpression(parameter.expression, parameter.from); //TODO - execute at once
                const typeResult = getResultType(resultParams2);
                param.columnType = typeResult;
                param.notNull = parameter.notNull;
                if(parameter.list) param.list = parameter.list;
                break;
        }
        param.name = 'param' + index;
        mappedParameters.push(param);

    }
    return mappedParameters;
}

// Will be used to validating same params with different types
function getUniqueParameters(parameters: ParameterDef[], namedParameters: string[], 
    notNullResolver: (parameters: ParameterDef[]) => boolean) {

    if(namedParameters.length == 0) {
        return parameters;
    }

    const uniqueParameters : Map<string, ParameterDef[]> = new Map();
    
    namedParameters.forEach( (namedParam, paramIndex) => {
        if(!uniqueParameters.get(namedParam)) {
            uniqueParameters.set(namedParam, []);
        }
        const paramWithSameName = uniqueParameters.get(namedParam)!;
        paramWithSameName.push(parameters[paramIndex]);
        uniqueParameters.set(namedParam, paramWithSameName)
    })

    const resultParameters :ParameterDef[] = [];
    Array.from(uniqueParameters.keys()).forEach( paramName => {
        const uniqParams = uniqueParameters.get(paramName)!;
        const resultParam : ParameterDef = {
            name: paramName,
            columnType: uniqParams[0].columnType,
            notNull: notNullResolver(uniqParams)
        }
        resultParameters.push(resultParam);

    })
    return resultParameters;
}

export function preprocessSql(sql: string) {
    const regex = /:[a-zA-Z\d]+/g;
    const namedParameters : string[] = sql.match(regex)?.map( param => param.slice(1) ) || [];
    const newSql = sql.replace(regex, '?');
    const processedSql : PreprocessedSql = {
        sql: newSql,
        namedParameters
    }
    return processedSql;
}

function renameDuplicatedColumns(columns: ColumnDef[]) {
    const columnsCount: Map<string, number> = new Map();
    columns.forEach( column => {
        if(columnsCount.has(column.name)) {
            const count = columnsCount.get(column.name)! + 1;
            columnsCount.set(column.name, count);
            column.name = column.name + '_' + count
        }
        else {
            columnsCount.set(column.name, 1);
        }
    })
}


function getResultType(packet: FieldDescriptor[]): MySqlType | MySqlType[] {
    if (packet.length == 1) return packet[0].columnType;
    const resultTypes: MySqlType[] = [];
    packet.forEach(p => {
        const mappedType = p.columnType;
        if (!resultTypes.includes(mappedType)) {
            resultTypes.push(mappedType);
        }
    })
    if (resultTypes.length == 1) return resultTypes[0];
    return resultTypes;
}