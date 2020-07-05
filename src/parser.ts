import { CommonTokenStream, ANTLRInputStream } from "antlr4ts";
import { MySQLLexer } from "./parser/MySQLLexer";
import { MySQLParser } from "./parser/MySQLParser";
import { ParseTreeWalker } from "antlr4ts/tree";
import { MySQLWalker } from "./parser/MySQLWalker";
import { isLeft, right, Either } from "fp-ts/lib/Either"
import { ColumnDef, SchemaDef, ParameterDef, FieldDescriptor, DBSchema, InvalidSqlError } from "./types";
import { DbClient } from "./queryExectutor";

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
    
    const queryResult = await client.executeQuery(sql); //the original query
    if( isLeft(queryResult)) {
        return queryResult;
    }
    
    const fields = queryResult.right;

    const walker = parseSqlWalker(sql);
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
            dbtype: typesMapping[field.columnType],
            notNull: field.notNull
        }
        if(!col.notNull && fields.length == fieldsNullability.length) {
            col.notNull = fieldsNullability[fieldIndex].notNull;
        }
        return col;
    })

    

    const mappedParameters: ParameterDef[] = [];

    //console.log("parameters====", walker.parameters);

    let index = 0;
    for (const parameter of walker.parameters) {
        index++;
        const param: ParameterDef = {
            name: '?',
            columnType: '?'
        }

        switch (parameter.type) {
            case 'resolved':
                param.name = parameter.name;
                param.columnType = parameter.columnType;
                break;
            case 'function':
                const paramType = client.functionParamType(parameter.functionName);
                param.name = '?';
                param.columnType = paramType;

                break;
            case 'expression':
                const resultParams2 = await client.executeExpression(parameter.expression, parameter.from); //TODO - execute at once
                const typeResult = getResultType(resultParams2);
                param.name = parameter.name || resultParams2[0].name;
                param.columnType = typeResult;
                if(parameter.list) param.list = parameter.list;
                break;
        }
        if (param.name == '?') {
            param.name = 'param' + index;
        }
        mappedParameters.push(param);

    }

    const result: SchemaDef = {
        columns: mapped,
        parameters: mappedParameters,
    }
    return right(result);


}


function getResultType(packet: FieldDescriptor[]): string | string[] {
    if (packet.length == 1) return typesMapping[packet[0].columnType];
    const resultTypes: string[] = [];
    packet.forEach(p => {
        const mappedType = typesMapping[p.columnType];
        if (!resultTypes.includes(mappedType)) {
            resultTypes.push(mappedType);
        }
    })
    if (resultTypes.length == 1) return resultTypes[0];
    return resultTypes;
}


type typeDef = {
    [a: number]: string
}

export const typesMapping: typeDef = {
    0: 'decimal',
    1: 'tiny',
    2: 'short',
    3: 'int',
    4: 'float',
    5: 'double',
    8: 'bigint',
    10: 'date',
    246: 'decimal',
    253: 'varchar'
}