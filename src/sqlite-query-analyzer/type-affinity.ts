import { SQLiteType } from "./types";

export function checkAffinity(type: string): SQLiteType {
    const normalized = type.toUpperCase();
    if (normalized.includes('INT')) {
        return 'INTEGER';
    }
    if (normalized.includes('CHAR') || normalized.includes('CLOB') || normalized.includes('TEXT')) {
        return 'TEXT';
    }
    if (normalized === '' || normalized.includes('BLOB')) {
        return 'BLOB';
    }
    if (normalized.includes('REAL') || normalized.includes('FLOA') || normalized.includes('DOUB')) {
        return 'REAL';
    }
    return 'NUMERIC';
}