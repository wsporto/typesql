import type { InferType } from '../mysql-mapping';
import type { CoercionType, Constraint, SubstitutionHash, Type } from './types';

export function unify(constraints: Constraint[], substitutions: SubstitutionHash) {
	for (const constraint of constraints) {
		unifyOne(constraint, substitutions);
	}
}

function unifyOne(constraint: Constraint, substitutions: SubstitutionHash) {
	const ty1 = substitute(constraint.type1, substitutions);
	const ty2 = substitute(constraint.type2, substitutions);

	if (ty1.kind === 'TypeOperator' && ty2.kind === 'TypeOperator') {
		ty1.types.forEach((t, i) => {
			const newConstr: Constraint = {
				expression: 'list',
				type1: ty1.types[i],
				type2: ty2.types[i]
			};
			unifyOne(newConstr, substitutions);
		});
	} else if (ty1.kind === 'TypeVar' && ty2.kind === 'TypeVar') {
		// if (ty1.id == ty2.id) return;
		if (ty1.type !== '?') {
			if (ty2.type !== '?') {
				const bestType = getBestPossibleType(ty1.type, ty2.type, constraint.mostGeneralType, constraint.coercionType);
				substitutions[ty1.id] = { ...ty1, type: bestType };
			} else {
				//type2 = ?
				let newType = ty1.type;
				if (constraint.coercionType === 'Sum') {
					newType = 'double';
				}
				if (constraint.coercionType === 'Coalesce') {
					newType = 'any';
				}

				substitutions[ty2.id] = { ...ty1, list: ty2.list, type: newType };
				substitutions[ty1.id] = { ...ty1, list: ty1.list, type: newType };
			}
		} else {
			ty2.list = ty1.list;
			if (constraint.coercionType === 'SumFunction') {
				const bestType = getSumFunctionType(ty2.type);
				substitutions[ty1.id] = { ...ty2, type: bestType };
				substitutions[ty2.id] = { ...ty2, type: bestType };
			} else if (constraint.coercionType === 'Sum') {
				const bestType = getSumType(ty2.type);
				substitutions[ty1.id] = { ...ty2, type: bestType };
				substitutions[ty2.id] = { ...ty2, type: bestType };
			} else {
				substitutions[ty1.id] = { ...ty2 };
			}
		}
	}
	//todo - remove
	else if (ty1.kind === 'TypeVar' && ty2.kind === 'TypeOperator') {
		ty2.types.forEach((t) => {
			t.list = true;
			const newContraint: Constraint = {
				...constraint,
				type1: ty1,
				type2: t
			};
			unifyOne(newContraint, substitutions);
		});
	}
	if (ty1.kind === 'TypeOperator' && ty2.kind === 'TypeVar') {
		const newConstraint: Constraint = {
			...constraint,
			type1: ty2,
			type2: ty1
		};
		unifyOne(newConstraint, substitutions);
	}
}

function getSumType(type: InferType): InferType {
	const exactValueNumbers = ['int'];
	if (exactValueNumbers.indexOf(type) >= 0) {
		return 'bigint';
	}
	const dateTypes = ['date'];
	if (dateTypes.indexOf(type) >= 0) {
		return 'date';
	}
	return 'number';
}
function getSumFunctionType(type: InferType): InferType {
	const exactValueNumbers = ['int', 'bigint', 'decimal'];
	if (exactValueNumbers.indexOf(type) >= 0) {
		return 'decimal';
	}
	return 'double';
}

function getBestPossibleType(type1: InferType, type2: InferType, max?: boolean, coercionType?: CoercionType): InferType {
	// Is possible to convert text to date
	const sqliteDateCoercionOrder: InferType[] = ['TEXT', 'DATE'];
	const sqliteIndexDateType1 = sqliteDateCoercionOrder.indexOf(type1);
	const sqliteIndexDateType2 = sqliteDateCoercionOrder.indexOf(type2);
	if (sqliteIndexDateType1 !== -1 && sqliteIndexDateType2 !== -1) {
		const index = max ? Math.max(sqliteIndexDateType1, sqliteIndexDateType2) : Math.min(sqliteIndexDateType1, sqliteIndexDateType2);
		return sqliteDateCoercionOrder[index];
	}

	// Is possible to convert numeric to date
	const sqliteNumberCoercionOrder: InferType[] = ['INTEGER', 'REAL', 'NUMERIC'];
	const sqliteIndexNumberType1 = sqliteNumberCoercionOrder.indexOf(type1);
	const sqliteIndexNumberType2 = sqliteNumberCoercionOrder.indexOf(type2);
	if (sqliteIndexNumberType1 !== -1 && sqliteIndexNumberType2 !== -1) {
		const index = max ? Math.max(sqliteIndexNumberType1, sqliteIndexNumberType2) : Math.min(sqliteIndexNumberType1, sqliteIndexNumberType2);
		return sqliteNumberCoercionOrder[index];
	}

	if (coercionType === 'Union') {
		const unionType = unionTypeResult(type1, type2);
		return unionType;
	}
	if (coercionType === 'SumFunction') {
		const exactValueNumbers = ['int', 'bigint', 'decimal'];
		if (exactValueNumbers.indexOf(type2) >= 0) {
			return 'decimal';
		}
		return 'double';
	}
	if (coercionType === 'Ceiling' && (type1 === 'decimal' || type2 === 'decimal')) {
		//ceiling(decimal) returns bigint
		return 'bigint';
	}
	if (type1 === 'any') {
		return coercionType === 'Coalesce' ? type2 : type2;
	}
	if (type2 === 'any') {
		return coercionType === 'Coalesce' ? 'any' : type1;
	}

	if (coercionType === 'Sum' && isNumericType(type1) && isNumericType(type2) && (type1 === 'number' || type2 === 'number')) return 'double';
	if (coercionType === 'Sum' && max && type1 === 'int' && type2 === 'int') return 'bigint';
	if (coercionType === 'Sum' && max && type1 === 'date' && type2 === 'date') return 'bigint';

	//enum
	if (type1 === type2) {
		return type1;
	}

	const order: InferType[] = ['number', 'bit', 'tinyint', 'year', 'smallint', 'int', 'bigint', 'decimal', 'float', 'double', 'varchar'];
	const indexType1 = order.indexOf(type1);
	const indexType2 = order.indexOf(type2);
	if (indexType1 !== -1 && indexType2 !== -1) {
		const index = max ? Math.max(indexType1, indexType2) : Math.min(indexType1, indexType2);
		const resultType = order[index];
		if (resultType === 'varchar' && coercionType === 'Numeric') {
			throw Error(`Type mismatch: ${type1} and ${type2}`);
		}
		return resultType;
	}
	const newType1 = type1.startsWith('enum(') ? 'char' : type1;
	const newType2 = type2.startsWith('enum(') ? 'char' : type2;
	const order2: InferType[] = ['char', 'varchar', 'tinytext', 'mediumtext', 'text', 'longtext'];
	const indexStrType1 = order2.indexOf(newType1);
	const indexStrType2 = order2.indexOf(newType2);
	if (indexStrType1 !== -1 && indexStrType2 !== -1) {
		const index = max ? Math.max(indexStrType1, indexStrType2) : Math.min(indexStrType1, indexStrType2);
		return order2[index];
	}

	// Is possible to convert to date to datetime
	const dateTypeOrder: InferType[] = ['date', 'datetime'];
	const indexDateType1 = dateTypeOrder.indexOf(type1);
	const indexDateType2 = dateTypeOrder.indexOf(type2);
	if (indexDateType1 !== -1 && indexDateType2 !== -1) {
		const index = max ? Math.max(indexDateType1, indexDateType2) : Math.min(indexDateType1, indexDateType2);
		return dateTypeOrder[index];
	}

	// Is possitlbe to conver to time to dateTime
	const dateTypeLiteralOrder: InferType[] = ['time', 'datetime'];
	const indexDateLiteralType1 = dateTypeLiteralOrder.indexOf(type1);
	const indexDateLiteralType2 = dateTypeLiteralOrder.indexOf(type2);
	if (indexDateLiteralType1 !== -1 && indexDateLiteralType2 !== -1) {
		const index = max ? Math.max(indexDateLiteralType1, indexDateLiteralType2) : Math.min(indexDateLiteralType1, indexDateLiteralType2);
		return dateTypeLiteralOrder[index];
	}
	throw Error(`Type mismatch: ${type1} and ${type2}`);
}

export function substitute(type: Type, substitutions: SubstitutionHash): Type {
	if (type.kind === 'TypeVar' && type.type !== '?') {
		const subs = substitutions[type.id];
		if (subs) {
			if (type.id !== subs.id) {
				return substitute(subs, substitutions);
			}
			return subs;
		}

		return type;
	}
	if (type.kind === 'TypeVar' && type.type === '?') {
		const subs = substitutions[type.id];
		if (subs) {
			if (type.id !== subs.id) {
				return substitute(subs, substitutions);
			}
			return subs;
		}
		return type;
	}

	return type;
}

function isNumericType(type: InferType) {
	const numericTypes = ['number', 'tinyint', 'year', 'smallint', 'int', 'bigint', 'decimal', 'float', 'double'];
	return numericTypes.indexOf(type) >= 0;
}

export function unionTypeResult(type1: InferType, type2: InferType): InferType {
	//Gernerated with tests\check-mysql-inference.ts
	const typeMapping = {
		number_int: 'int',
		bigint_number: 'bigint',
		decimal_tinyint: 'decimal',
		decimal_smallint: 'decimal',
		decimal_int: 'decimal',
		decimal_float: 'double',
		decimal_double: 'double',
		decimal_timestamp: 'varchar',
		decimal_bigint: 'decimal',
		decimal_mediumint: 'decimal',
		decimal_date: 'varchar',
		decimal_time: 'varchar',
		decimal_datetime: 'varchar',
		decimal_year: 'decimal',
		decimal_varchar: 'varchar',
		decimal_bit: 'decimal',
		decimal_json: 'varbinary',
		decimal_enum: 'varchar',
		decimal_set: 'varchar',
		decimal_tinyblob: 'text',
		decimal_mediumblob: 'text',
		decimal_longblob: 'longtext',
		decimal_blob: 'text',
		decimal_tinytext: 'text',
		decimal_mediumtext: 'text',
		decimal_longtext: 'longtext',
		decimal_text: 'text',
		decimal_varbinary: 'varbinary',
		decimal_binary: 'binary',
		decimal_char: 'binary',
		decimal_geometry: 'varbinary',
		tinyint_smallint: 'smallint',
		tinyint_int: 'int',
		tinyint_float: 'float',
		tinyint_double: 'double',
		tinyint_timestamp: 'varchar',
		tinyint_bigint: 'bigint',
		tinyint_mediumint: 'mediumint',
		tinyint_date: 'varchar',
		tinyint_time: 'varchar',
		tinyint_datetime: 'varchar',
		tinyint_year: 'tinyint',
		tinyint_varchar: 'varchar',
		tinyint_bit: 'decimal',
		tinyint_json: 'varbinary',
		tinyint_enum: 'varchar',
		tinyint_set: 'varchar',
		tinyint_tinyblob: 'text',
		tinyint_mediumblob: 'text',
		tinyint_longblob: 'longtext',
		tinyint_blob: 'text',
		tinyint_tinytext: 'text',
		tinyint_mediumtext: 'text',
		tinyint_longtext: 'longtext',
		tinyint_text: 'text',
		tinyint_varbinary: 'varbinary',
		tinyint_binary: 'binary',
		tinyint_char: 'binary',
		tinyint_geometry: 'varbinary',
		smallint_int: 'int',
		smallint_float: 'float',
		smallint_double: 'double',
		smallint_timestamp: 'varchar',
		smallint_bigint: 'bigint',
		smallint_mediumint: 'mediumint',
		smallint_date: 'varchar',
		smallint_time: 'varchar',
		smallint_datetime: 'varchar',
		smallint_year: 'smallint',
		smallint_varchar: 'varchar',
		smallint_bit: 'decimal',
		smallint_json: 'varbinary',
		smallint_enum: 'varchar',
		smallint_set: 'varchar',
		smallint_tinyblob: 'text',
		smallint_mediumblob: 'text',
		smallint_longblob: 'longtext',
		smallint_blob: 'text',
		smallint_tinytext: 'text',
		smallint_mediumtext: 'text',
		smallint_longtext: 'longtext',
		smallint_text: 'text',
		smallint_varbinary: 'varbinary',
		smallint_binary: 'binary',
		smallint_char: 'binary',
		smallint_geometry: 'varbinary',
		int_float: 'double',
		int_double: 'double',
		int_timestamp: 'varchar',
		int_bigint: 'bigint',
		int_mediumint: 'int',
		int_date: 'varchar',
		int_time: 'varchar',
		int_datetime: 'varchar',
		int_year: 'int',
		int_varchar: 'varchar',
		int_bit: 'decimal',
		int_json: 'varbinary',
		int_enum: 'varchar',
		int_set: 'varchar',
		int_tinyblob: 'text',
		int_mediumblob: 'text',
		int_longblob: 'longtext',
		int_blob: 'text',
		int_tinytext: 'text',
		int_mediumtext: 'text',
		int_longtext: 'longtext',
		int_text: 'text',
		int_varbinary: 'varbinary',
		int_binary: 'binary',
		int_char: 'binary',
		int_geometry: 'varbinary',
		float_double: 'double',
		float_timestamp: 'varchar',
		float_bigint: 'float',
		float_mediumint: 'float',
		float_date: 'varchar',
		float_time: 'varchar',
		float_datetime: 'varchar',
		float_year: 'float',
		float_varchar: 'varchar',
		float_bit: 'double',
		float_json: 'varbinary',
		float_enum: 'varchar',
		float_set: 'varchar',
		float_tinyblob: 'text',
		float_mediumblob: 'text',
		float_longblob: 'longtext',
		float_blob: 'text',
		float_tinytext: 'text',
		float_mediumtext: 'text',
		float_longtext: 'longtext',
		float_text: 'text',
		float_varbinary: 'varbinary',
		float_binary: 'binary',
		float_char: 'binary',
		float_geometry: 'varbinary',
		double_timestamp: 'varchar',
		double_bigint: 'double',
		double_mediumint: 'double',
		double_date: 'varchar',
		double_time: 'varchar',
		double_datetime: 'varchar',
		double_year: 'double',
		double_varchar: 'varchar',
		double_bit: 'double',
		double_json: 'varbinary',
		double_enum: 'varchar',
		double_set: 'varchar',
		double_tinyblob: 'text',
		double_mediumblob: 'text',
		double_longblob: 'longtext',
		double_blob: 'text',
		double_tinytext: 'text',
		double_mediumtext: 'text',
		double_longtext: 'longtext',
		double_text: 'text',
		double_varbinary: 'varbinary',
		double_binary: 'binary',
		double_char: 'binary',
		double_geometry: 'varbinary',
		timestamp_bigint: 'varchar',
		timestamp_mediumint: 'varchar',
		timestamp_date: 'datetime',
		timestamp_time: 'datetime',
		timestamp_datetime: 'datetime',
		timestamp_year: 'varchar',
		timestamp_varchar: 'varchar',
		timestamp_bit: 'varbinary',
		timestamp_json: 'varbinary',
		timestamp_enum: 'varchar',
		timestamp_set: 'varchar',
		timestamp_tinyblob: 'text',
		timestamp_mediumblob: 'text',
		timestamp_longblob: 'longtext',
		timestamp_blob: 'text',
		timestamp_tinytext: 'text',
		timestamp_mediumtext: 'text',
		timestamp_longtext: 'longtext',
		timestamp_text: 'text',
		timestamp_varbinary: 'varbinary',
		timestamp_binary: 'binary',
		timestamp_char: 'binary',
		timestamp_geometry: 'varbinary',
		bigint_mediumint: 'bigint',
		bigint_date: 'varchar',
		bigint_time: 'varchar',
		bigint_datetime: 'varchar',
		bigint_year: 'bigint',
		bigint_varchar: 'varchar',
		bigint_bit: 'decimal',
		bigint_json: 'varbinary',
		bigint_enum: 'varchar',
		bigint_set: 'varchar',
		bigint_tinyblob: 'text',
		bigint_mediumblob: 'text',
		bigint_longblob: 'longtext',
		bigint_blob: 'text',
		bigint_tinytext: 'text',
		bigint_mediumtext: 'text',
		bigint_longtext: 'longtext',
		bigint_text: 'text',
		bigint_varbinary: 'varbinary',
		bigint_binary: 'binary',
		bigint_char: 'binary',
		bigint_geometry: 'varbinary',
		mediumint_date: 'varchar',
		mediumint_time: 'varchar',
		mediumint_datetime: 'varchar',
		mediumint_year: 'mediumint',
		mediumint_varchar: 'varchar',
		mediumint_bit: 'decimal',
		mediumint_json: 'varbinary',
		mediumint_enum: 'varchar',
		mediumint_set: 'varchar',
		mediumint_tinyblob: 'text',
		mediumint_mediumblob: 'text',
		mediumint_longblob: 'longtext',
		mediumint_blob: 'text',
		mediumint_tinytext: 'text',
		mediumint_mediumtext: 'text',
		mediumint_longtext: 'longtext',
		mediumint_text: 'text',
		mediumint_varbinary: 'varbinary',
		mediumint_binary: 'binary',
		mediumint_char: 'binary',
		mediumint_geometry: 'varbinary',
		date_time: 'datetime',
		date_datetime: 'datetime',
		date_year: 'varchar',
		date_varchar: 'varchar',
		date_bit: 'varbinary',
		date_json: 'varbinary',
		date_enum: 'varchar',
		date_set: 'varchar',
		date_tinyblob: 'text',
		date_mediumblob: 'text',
		date_longblob: 'longtext',
		date_blob: 'text',
		date_tinytext: 'text',
		date_mediumtext: 'text',
		date_longtext: 'longtext',
		date_text: 'text',
		date_varbinary: 'varbinary',
		date_binary: 'binary',
		date_char: 'binary',
		date_geometry: 'varbinary',
		time_datetime: 'datetime',
		time_year: 'varchar',
		time_varchar: 'varchar',
		time_bit: 'varbinary',
		time_json: 'varbinary',
		time_enum: 'varchar',
		time_set: 'varchar',
		time_tinyblob: 'text',
		time_mediumblob: 'text',
		time_longblob: 'longtext',
		time_blob: 'text',
		time_tinytext: 'text',
		time_mediumtext: 'text',
		time_longtext: 'longtext',
		time_text: 'text',
		time_varbinary: 'varbinary',
		time_binary: 'binary',
		time_char: 'binary',
		time_geometry: 'varbinary',
		datetime_year: 'varchar',
		datetime_varchar: 'varchar',
		datetime_bit: 'varbinary',
		datetime_json: 'varbinary',
		datetime_enum: 'varchar',
		datetime_set: 'varchar',
		datetime_tinyblob: 'text',
		datetime_mediumblob: 'text',
		datetime_longblob: 'longtext',
		datetime_blob: 'text',
		datetime_tinytext: 'text',
		datetime_mediumtext: 'text',
		datetime_longtext: 'longtext',
		datetime_text: 'text',
		datetime_varbinary: 'varbinary',
		datetime_binary: 'binary',
		datetime_char: 'binary',
		datetime_geometry: 'varbinary',
		year_varchar: 'varchar',
		year_bit: 'bigint',
		year_json: 'varbinary',
		year_enum: 'varchar',
		year_set: 'varchar',
		year_tinyblob: 'text',
		year_mediumblob: 'text',
		year_longblob: 'longtext',
		year_blob: 'text',
		year_tinytext: 'text',
		year_mediumtext: 'text',
		year_longtext: 'longtext',
		year_text: 'text',
		year_varbinary: 'varbinary',
		year_binary: 'binary',
		year_char: 'binary',
		year_geometry: 'varbinary',
		varchar_bit: 'varbinary',
		varchar_json: 'varbinary',
		varchar_enum: 'varchar',
		varchar_set: 'varchar',
		varchar_tinyblob: 'text',
		varchar_mediumblob: 'text',
		varchar_longblob: 'longtext',
		varchar_blob: 'text',
		varchar_tinytext: 'text',
		varchar_mediumtext: 'text',
		varchar_longtext: 'longtext',
		varchar_text: 'text',
		varchar_varbinary: 'varbinary',
		varchar_binary: 'varbinary',
		varchar_char: 'varchar',
		varchar_geometry: 'varbinary',
		bit_json: 'varbinary',
		bit_enum: 'varbinary',
		bit_set: 'varbinary',
		bit_tinyblob: 'text',
		bit_mediumblob: 'text',
		bit_longblob: 'longtext',
		bit_blob: 'text',
		bit_tinytext: 'tinytext',
		bit_mediumtext: 'mediumtext',
		bit_longtext: 'longtext',
		bit_text: 'text',
		bit_varbinary: 'varbinary',
		bit_binary: 'binary',
		bit_char: 'binary',
		bit_geometry: 'varbinary',
		json_enum: 'varbinary',
		json_set: 'varbinary',
		json_tinyblob: 'longtext',
		json_mediumblob: 'longtext',
		json_longblob: 'longtext',
		json_blob: 'longtext',
		json_tinytext: 'longtext',
		json_mediumtext: 'longtext',
		json_longtext: 'longtext',
		json_text: 'longtext',
		json_varbinary: 'varbinary',
		json_binary: 'varbinary',
		json_char: 'varbinary',
		json_geometry: 'varbinary',
		enum_set: 'varchar',
		enum_tinyblob: 'text',
		enum_mediumblob: 'text',
		enum_longblob: 'longtext',
		enum_blob: 'text',
		enum_tinytext: 'text',
		enum_mediumtext: 'text',
		enum_longtext: 'longtext',
		enum_text: 'text',
		enum_varbinary: 'varbinary',
		enum_binary: 'binary',
		enum_char: 'binary',
		enum_geometry: 'varbinary',
		set_tinyblob: 'text',
		set_mediumblob: 'text',
		set_longblob: 'longtext',
		set_blob: 'text',
		set_tinytext: 'text',
		set_mediumtext: 'text',
		set_longtext: 'longtext',
		set_text: 'text',
		set_varbinary: 'varbinary',
		set_binary: 'binary',
		set_char: 'binary',
		set_geometry: 'varbinary',
		tinyblob_mediumblob: 'text',
		tinyblob_longblob: 'longtext',
		tinyblob_blob: 'text',
		tinyblob_tinytext: 'tinytext',
		tinyblob_mediumtext: 'mediumtext',
		tinyblob_longtext: 'longtext',
		tinyblob_text: 'text',
		tinyblob_varbinary: 'text',
		tinyblob_binary: 'text',
		tinyblob_char: 'text',
		tinyblob_geometry: 'longtext',
		mediumblob_longblob: 'longtext',
		mediumblob_blob: 'text',
		mediumblob_tinytext: 'text',
		mediumblob_mediumtext: 'mediumtext',
		mediumblob_longtext: 'longtext',
		mediumblob_text: 'text',
		mediumblob_varbinary: 'text',
		mediumblob_binary: 'text',
		mediumblob_char: 'text',
		mediumblob_geometry: 'longtext',
		longblob_blob: 'longtext',
		longblob_tinytext: 'longtext',
		longblob_mediumtext: 'longtext',
		longblob_longtext: 'longtext',
		longblob_text: 'longtext',
		longblob_varbinary: 'longtext',
		longblob_binary: 'longtext',
		longblob_char: 'longtext',
		longblob_geometry: 'longtext',
		blob_tinytext: 'text',
		blob_mediumtext: 'mediumtext',
		blob_longtext: 'longtext',
		blob_text: 'text',
		blob_varbinary: 'text',
		blob_binary: 'text',
		blob_char: 'text',
		blob_geometry: 'longtext',
		tinytext_mediumtext: 'text',
		tinytext_longtext: 'longtext',
		tinytext_text: 'text',
		tinytext_varbinary: 'tinytext',
		tinytext_binary: 'tinytext',
		tinytext_char: 'text',
		tinytext_geometry: 'longtext',
		mediumtext_longtext: 'longtext',
		mediumtext_text: 'text',
		mediumtext_varbinary: 'mediumtext',
		mediumtext_binary: 'mediumtext',
		mediumtext_char: 'text',
		mediumtext_geometry: 'longtext',
		longtext_text: 'longtext',
		longtext_varbinary: 'longtext',
		longtext_binary: 'longtext',
		longtext_char: 'longtext',
		longtext_geometry: 'longtext',
		text_varbinary: 'text',
		text_binary: 'text',
		text_char: 'text',
		text_geometry: 'longtext',
		varbinary_binary: 'varbinary',
		varbinary_char: 'varbinary',
		varbinary_geometry: 'varbinary',
		binary_char: 'binary',
		binary_geometry: 'varbinary',
		char_geometry: 'varbinary'
	};

	if (type1 === type2) return type1;
	//ex. tinyint_smallint or smallint_tinyint

	//@ts-ignore
	const type1_type2 = typeMapping[`${type1}_${type2}`];
	//@ts-ignore
	const type2_type1 = typeMapping[`${type2}_${type1}`];

	if (type1_type2 === type1 || type2_type1 === type1) {
		return type1;
	}
	if (type1_type2 === type2 || type2_type1 === type2) {
		return type2;
	}
	throw Error(`unionTypeResult:${type1}_${type2}`);
}
