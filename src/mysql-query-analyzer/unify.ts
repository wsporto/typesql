import { SubstitutionHash } from "./parse";
import { Constraint, TypeVar, Type } from "./collect-constraints";
import { MySqlType, InferType } from "../mysql-mapping";

export function unify(constraints: Constraint[], substitutions: SubstitutionHash) {
    for (const constraint of constraints) {
        unifyOne(constraint, substitutions);
    }
}

function unifyOne(constraint: Constraint, substitutions: SubstitutionHash) {
    const ty1 = substitute(constraint.type1, substitutions);
    const ty2 = substitute(constraint.type2, substitutions);

    if(ty1.kind == 'TypeOperator' && ty2.kind == 'TypeOperator') {

        ty1.types.forEach((t, i) => {
            const newConstr : Constraint = {
                expression: 'list',
                type1: ty1.types[i],
                type2: ty2.types[i]
            }
            unifyOne(newConstr, substitutions)
        })
    }

    else if(ty1.kind == 'TypeVar' && ty2.kind == 'TypeVar') {
        if(ty1.id == ty2.id) return;
        if(ty1.type != '?') {
            
            if(ty2.type != '?') {
                const bestType = getBestPossibleType(ty1.type, ty2.type, constraint.mostGeneralType, constraint.coercionType);
                ty1.type = bestType;
                ty2.type = bestType;
                setSubstitution(ty1, ty2, substitutions);
                setSubstitution(ty2, ty1, substitutions);
            }
            else {
                
                const numberTypes = ['number', 'tinyint', 'int', 'bigint', 'decimal', 'double'];
                if(constraint.coercionType == 'Sum' && numberTypes.indexOf(ty1.type) >= 0) {
                    //In the expression ty1 + ?, ty2 = double
                    ty1.type = 'double';   
                    ty2.type = 'double'; 
                }
               
                substitutions[ty2.id] = ty1;
            }
        }
        else {
            //THEN ? ELSE id; ? will be double; or ? will be int if commented
            // const numberTypes = ['number', 'tinyint', 'int', 'bigint', 'decimal', 'double']
            // if(!constraint.strict && numberTypes.indexOf(ty2.type) >= 0) {
            //     ty2.type = 'number';
            // }

            if(constraint.coercionType == 'SumFunction') {
                const exactValueNumbers = ['int', 'bigint', 'decimal'];
                if(exactValueNumbers.indexOf(ty2.type) >=0) {
                    ty2.type = 'decimal';
                }
                else {
                    ty2.type = 'double';
                }
            }

            substitutions[ty1.id] = ty2;
            ty1.type = ty2.type
            ty2.list = ty1.list;
            
            
        }
    }
    else if(ty1.kind == 'TypeVar' && ty2.kind == 'TypeOperator') {
        ty2.types.forEach( t => {
            const listType = t as TypeVar;
            listType.list = true;
            const newContraint : Constraint = {
                ...constraint,
                type1: ty1,
                type2: listType
            }
            unifyOne(newContraint, substitutions);
        })
    }
    if(ty1.kind == 'TypeOperator' && ty2.kind == 'TypeVar') {
        const newConstraint : Constraint = {
            ...constraint,
            type1: ty2,
            type2: ty1
        }
        unifyOne(newConstraint, substitutions);
    }
}

function setSubstitution(ty1: TypeVar, ty2: TypeVar, substitutions: SubstitutionHash) {

    const subs = substitutions[ty1.id];
    substitutions[ty1.id] = ty2;
    if(subs && subs.id != ty2.id) {
        subs.type = ty2.type;
        // if(ty2.list) subs.list = true;
        setSubstitution(subs, ty2, substitutions);
    }
}

function getBestPossibleType(type1: InferType, type2: InferType, max?:boolean, coercionType?: 'Sum' | 'Coalesce' | 'SumFunction' | 'Ceiling') : InferType {

    if(coercionType == 'Ceiling' && (type2 == 'decimal' || type1 == 'decimal')) { //ceiling(decimal) returns bigint
        return 'bigint';
    }
    if(type1 == 'any') {
        return coercionType == 'Coalesce'? 'any': type2;
    }
    if(type2 == 'any') {
        return coercionType == 'Coalesce'? 'any': type1;
    }
    if(coercionType != 'Sum' && type1 === type2) return type1;
    if( coercionType == 'Sum' && max && type1 == 'number' && type2 == 'int' ||  type1 == 'int' && type2 == 'number') return 'double';
    // if( coercionType == 'Sum' && type1 == 'number' && type2 == 'bigint' ||  type1 == 'bigint' && type2 == 'number') return 'double';
    if( coercionType == 'Sum' && max && type1 == 'int' && type2 == 'int') return 'bigint';
    if( coercionType == 'Sum' && max && ((type1 == 'int' && type2 == 'double') || type1 == 'double' && type2 == 'int' )) return 'double';
    if( coercionType == 'Sum' && max && ((type1 == 'bigint' && type2 == 'double') || type1 == 'double' && type2 == 'bigint' )) return 'double';
    //if( sum && (type1 == 'decimal' && type2 == 'number') || type1 == 'number' && type2 == 'decimal' ) return 'double';
    if( coercionType == 'Sum' && max && type1 == 'date' && type2 == 'date') return 'bigint';

    const order : InferType[] = ['number', 'tinyint', 'smallint', 'int', 'bigint', 'decimal', 'float', 'double'];
    const indexType1 = order.indexOf(type1);
    const indexType2 = order.indexOf(type2);
    if(indexType1 != -1 && indexType2 != -1) {
        const index = max? Math.max(indexType1, indexType2) : Math.min(indexType1, indexType2);
        return order[index];
    } 
    const order2 : InferType[] = ['varchar'];
    const indexStrType1 = order2.indexOf(type1);
    const indexStrType2 = order2.indexOf(type2);
    if(indexStrType1 != -1 && indexStrType2 != -1) {
        const index = max? Math.max(indexStrType1, indexStrType2) : Math.min(indexStrType1, indexStrType2);
        return order2[index];
    } 

    // Is possible to convert to date to datetime
    const dateTypeOrder  : InferType[] = ['date', 'datetime'];
    const indexDateType1 = dateTypeOrder.indexOf(type1);
    const indexDateType2 = dateTypeOrder.indexOf(type2);
    if(indexDateType1 != -1 && indexDateType2 != -1) {
        const index = max? Math.max(indexDateType1, indexDateType2) : Math.min(indexDateType1, indexDateType2);
        return dateTypeOrder[index];
    }

    // Is possitlbe to conver to time to dateTime
    const dateTypeLiteralOrder : InferType[] = ['time', 'datetime'];
    const indexDateLiteralType1 = dateTypeLiteralOrder.indexOf(type1);
    const indexDateLiteralType2 = dateTypeLiteralOrder.indexOf(type2);
    if(indexDateLiteralType1 != -1 && indexDateLiteralType2 != -1) {
        const index = max? Math.max(indexDateLiteralType1, indexDateLiteralType2) : Math.min(indexDateLiteralType1, indexDateLiteralType2);
        return dateTypeLiteralOrder[index];
    }
    
    throw Error ('Type mismatch: ' + type1 + ' and ' + type2);
}

export function substitute(type: Type, substitutions: SubstitutionHash) : Type {
    if(type.kind == 'TypeVar' && type.type != '?') {
        return type;
    }
    if(type.kind == 'TypeVar' && type.type == '?') {
        const subs = substitutions[type.id];
        if(subs) {
            if(type.list && subs.kind == 'TypeVar') subs.list;
            return substitute( subs, substitutions)
        }
        
        return type;
    } 
    return type;
}