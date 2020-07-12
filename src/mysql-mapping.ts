export enum FlagEnum {
    NOT_NULL = 1,
    PRI_KEY = 2,
    BINARY_FLAG = 128,
    ENUM_FLAG = 256,
    SET_FLAG = 2048
}

export type MySqlType = 
    | 'decimal'  
    | 'tinyint'
    | 'smallint' 
    | 'int'
    | 'float'
    | 'double'
    | 'null'
    | 'timestamp'
    | 'bigint'
    | 'mediumint'
    | 'date'
    | 'time'
    | 'datetime'
    | 'year'
    | 'newdate'
    | 'varchar'
    | 'bit'
    | 'timestamp2'
    | 'datetime2'
    | 'time2'
    | 'json'
    | 'enum'
    | 'set'
    | 'tinyblob'
    | 'mediumblob'
    | 'longblob'
    | 'blob'
    | 'varbinary'
    | 'binary'
    | 'geometry'

export type TsType =
    | 'string'
    | 'number'
    | 'boolean'
    | 'Date'
    | 'Object'
    | 'Buffer'
    | 'any'
    | 'null'


export function converToTsType(mySqlType: MySqlType) : TsType {
    switch (mySqlType) {
        case 'decimal': 
        case 'smallint':
        case 'int':
        case 'float':
        case 'double':
        case 'bigint':
        case 'mediumint':
        case 'year':
            return 'number';
        case 'varchar':
        case 'varbinary':
        case 'geometry':
            return 'string';
        case 'tinyint':
            return 'boolean';
        case 'timestamp':
        case 'timestamp2':
        case 'date':
        case 'newdate':
        case 'datetime':
        case 'datetime2':
        case 'time':
        case 'time2':
            return 'Date';
        case 'bit':
        case 'json':
            return 'Object';
        case 'null':
            return 'null';
        case 'tinyblob':
        case 'mediumblob':
        case 'longblob':
        case 'blob':
        case 'binary':
            return 'Buffer';
        case 'enum':
        case 'set':
            return 'any'
        default: 
            const exaustive : never = mySqlType;
            return exaustive;
    }
        
}

export function checkFlag(flags: number, flag: FlagEnum) {
    return (flags & flag) != 0;
}

export function convertTypeCodeToMysqlType(typeCode: number, flags: FlagEnum) : MySqlType {
    if(flags & FlagEnum.SET_FLAG) {
        return 'set'
    }
    if(flags & FlagEnum.ENUM_FLAG) {
        return 'enum'
    }
    const mappedType = typesMapping[typeCode];
    if(mappedType == 'varchar' && (flags & FlagEnum.BINARY_FLAG)) {
        return 'varbinary';
    }
    return mappedType;
}



type MySqlTypeHash = {
    [a: number]: MySqlType
}

export const typesMapping: MySqlTypeHash = {
    0: 'decimal', //deprecated? newdecimal=246
    1: 'tinyint',
    2: 'smallint',
    3: 'int',
    4: 'float',
    5: 'double',
    6: 'null',
    7: 'timestamp',
    8: 'bigint',
    9: 'mediumint',
    10: 'date',
    11: 'time',
    12: 'datetime',
    13: 'year',
    14: 'newdate', //NEWDATE?
    15: 'varchar', //deprecated? newvarchar=253
    16: 'bit',
    17: 'timestamp2', //TIMESTAMP2?
    18: 'datetime2', //DATETIME2?
    19: 'time2', //TIME2?
    245: 'json',
    246: 'decimal', //NEWDECIMAL
    247: 'enum',
    248: 'set',
    249: 'tinyblob',
    250: 'mediumblob',
    251: 'longblob',
    252: 'blob',
    253: 'varchar', //aka VAR_STRING, VARBINARY
    254: 'binary',
    255: 'geometry'
}