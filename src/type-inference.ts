import { DbClient } from "./queryExectutor";
import { DBSchema } from "./types";
import { ExprContext, ExprIsContext, ExprOrContext, BoolPriContext, PrimaryExprPredicateContext, PredicateContext, BitExprContext, SimpleExprParamMarkerContext, SimpleExprContext, SimpleExprCaseContext, PrimaryExprCompareContext, SimpleExprColumnRefContext } from "./parser/MySQLParser";
import { parseSqlTree } from "./parser";

export async function inferType(client: DbClient, dbSchema: DBSchema, sql: string) {
    
    const sqlTree = parseSqlTree(sql);
    const query = sqlTree.simpleStatement()?.selectStatement()?.queryExpression()?.queryExpressionBody()?.querySpecification();
    const expr = query?.whereClause()?.expr();
    if(expr) {
        const paramsResult : string[] = [];
        const result = inferExpr(client, dbSchema, expr, paramsResult);
        console.log("params=", paramsResult);
        return result;
    }
}

async function inferExpr(client: DbClient, dbSchema: DBSchema, expr: ExprContext, paramsResult: string[]) {
    if(expr instanceof ExprIsContext) {
        const boolPri = expr.boolPri();
        return inferBoolPri(client, dbSchema, boolPri, paramsResult);

    }
    if(expr instanceof ExprOrContext) {

    }
    //...
    return [];
}

async function inferBoolPri(client: DbClient, dbSchema: DBSchema, boolPri: BoolPriContext, paramsResult: string[]): Promise<string[]> {
    if(boolPri instanceof PrimaryExprPredicateContext) {
        const predicate = boolPri.predicate();
        return inferPredicate(client, dbSchema, predicate, paramsResult);
    }
    // ...
    if(boolPri instanceof PrimaryExprCompareContext) {
        const boolPriLeft = boolPri.boolPri();
        const predicateRight = boolPri.predicate();
        const typeLeft = await inferBoolPri(client, dbSchema, boolPriLeft, paramsResult);
        const typeRight = await inferPredicate(client, dbSchema, predicateRight, paramsResult);
        console.log("typeLeft=", typeLeft);
        console.log("typeRight=", typeRight);
        const result = resolveParameters(typeLeft, typeRight, paramsResult);
        console.log("typeResult=", result);
        return result;
    }
    //...
    return []
}

async function inferPredicate(client: DbClient, dbSchema: DBSchema, predicate: PredicateContext, paramsResult: string[]): Promise<string[]> {
    const bitExpr = predicate.bitExpr()[0];
    //...
    const bitExprType = inferBitExpr(client, dbSchema, bitExpr, paramsResult);
    //...
    return bitExprType;
}

async function inferBitExpr(client: DbClient, dbSchema: DBSchema, bitExpr: BitExprContext, paramsResult: string[]): Promise<string[]> {
    const simpleExpr = bitExpr.simpleExpr();
    //...
    if(simpleExpr) {
        const simpleExprTypes = inferSimpleExpr(client, dbSchema, simpleExpr, paramsResult);
        return simpleExprTypes;
    }
    //...
    return [];
    
}

async function inferSimpleExpr(client: DbClient, dbSchema: DBSchema, simpleExpr: SimpleExprContext, paramsResult: string[]) : Promise<string[]> {
    if(simpleExpr instanceof SimpleExprColumnRefContext) {
        return ['int'];
    }

    if(simpleExpr instanceof SimpleExprParamMarkerContext) {
        return ['?']
    } 
    
    //...
    if(simpleExpr instanceof SimpleExprCaseContext) {
        const whenExpr = simpleExpr.whenExpression();
        const thenExpr = simpleExpr.thenExpression()[0].expr(); //TODO - FOREACH
        const thenExprType = await inferExpr(client, dbSchema, thenExpr, paramsResult);
        console.log("thenExprType=", thenExprType);
        const elseExpr = simpleExpr.elseExpression()?.expr()!; //todo - por enquanto
        const elseExprType = await inferExpr(client, dbSchema, elseExpr, paramsResult);
        console.log("elseExprType=", elseExprType);
        const result = resolveParameters(thenExprType, elseExprType, paramsResult);
        console.log("caseResolve=", result);
        return result;
        
    }
    
    
    return [];
}

function resolveParameters(left: string[], right: string[], paramsResult: string[]) : string[] {
    const result : string[] = [];
    left.forEach( (param, index) => {
        if(param == '?') {
            paramsResult.push(right[index]);
        }
    })

    right.forEach( (param, index) => {
        if(param == '?') {
            paramsResult.push(left[index]);
        }
    })
    console.log("resolveParameters=", paramsResult);

    return ['int'];
}