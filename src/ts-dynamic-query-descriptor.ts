import type { TsFieldDescriptor } from './types';

export function mapToDynamicSelectColumns(columns: TsFieldDescriptor[]): TsFieldDescriptor[] {
	return columns.map((column) => mapToSelectColumn(column));
}

function mapToSelectColumn(r: TsFieldDescriptor): TsFieldDescriptor {
	return {
		name: r.name,
		tsType: 'boolean',
		notNull: false
	};
}

export function mapToDynamicParams(columns: TsFieldDescriptor[]): TsFieldDescriptor[] {
	return columns.map((column) => mapToDynamicParam(column));
}

function mapToDynamicParam(r: TsFieldDescriptor): TsFieldDescriptor {
	return {
		name: r.name,
		tsType: `${r.tsType} | null`,
		notNull: false
	};
}
