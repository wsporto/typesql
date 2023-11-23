import { ColumnSchema } from "./mysql-query-analyzer/types";
import CodeBlockWriter from "code-block-writer";

export function generateSelectStatement(tableName: string, columns: ColumnSchema[],) {
    const keys = columns.filter(col => col.columnKey = 'PRI');
    if (keys.length == 0) {
        keys.push(...columns.filter(col => col.columnKey == 'UNI'));
    }

    const writer = new CodeBlockWriter();

    writer.writeLine("SELECT");
    columns.forEach((col, columnIndex) => {
        writer.indent().write(escapeColumn(col.column));
        writer.conditionalWrite(columnIndex < columns.length - 1, ',');
        writer.newLine();
    })

    writer.writeLine(`FROM ${escapeTableName(tableName)}`);

    if (keys.length > 0) {
        writer.write(`WHERE `);
        writer.write(`${escapeColumn(keys[0].column)} = :${keys[0].column}`);
    }

    return writer.toString();
}

export function generateInsertStatement(tableName: string, dbSchema: ColumnSchema[],) {
    const columns = dbSchema.filter(col => !col.autoincrement);

    const writer = new CodeBlockWriter();

    writer.writeLine(`INSERT INTO ${escapeTableName(tableName)}`);
    writer.writeLine("(")
    columns.forEach((col, columnIndex) => {
        writer.indent().write(escapeColumn(col.column));
        writer.conditionalWrite(columnIndex != columns.length - 1, ',');
        writer.newLine();
    })
    writer.writeLine(')');
    writer.writeLine("VALUES");
    writer.writeLine("(");
    columns.forEach((col, columnIndex) => {
        writer.indent().write(':' + col.column);
        writer.conditionalWrite(columnIndex < columns.length - 1, ',');
        writer.newLine();

    })
    writer.write(")");

    return writer.toString();
}

export function generateUpdateStatement(tableName: string, dbSchema: ColumnSchema[],) {
    const columns = dbSchema.filter(col => !col.autoincrement);
    const keys = dbSchema.filter(col => col.columnKey = 'PRI');
    if (keys.length == 0) {
        keys.push(...dbSchema.filter(col => col.columnKey == 'UNI'));
    }

    const writer = new CodeBlockWriter();

    writer.writeLine(`UPDATE ${escapeTableName(tableName)}`);
    writer.writeLine("SET")
    columns.forEach((col, columnIndex) => {
        writer.indent().write(`${escapeColumn(col.column)} = IF(:${col.column}Set, :${col.column}, ${escapeColumn(col.column)})`);
        writer.conditionalWrite(columnIndex != columns.length - 1, ',');
        writer.newLine();
    })
    if (keys.length > 0) {
        writer.writeLine('WHERE');
        writer.indent().write(`${escapeColumn(keys[0].column)} = :${keys[0].column}`);
    }

    return writer.toString();
}

export function generateDeleteStatement(tableName: string, dbSchema: ColumnSchema[],) {
    const keys = dbSchema.filter(col => col.columnKey = 'PRI');
    if (keys.length == 0) {
        keys.push(...dbSchema.filter(col => col.columnKey == 'UNI'));
    }

    const writer = new CodeBlockWriter();

    writer.writeLine(`DELETE FROM ${escapeTableName(tableName)}`);
    if (keys.length > 0) {
        writer.write('WHERE ');
        writer.write(`${escapeColumn(keys[0].column)} = :${keys[0].column}`);
    }
    return writer.toString();
}

//Permitted characters in unquoted identifiers: ASCII: [0-9,a-z,A-Z$_]
function escapeTableName(tableName: string) {
    const validPattern = /^[a-zA-Z0-9_$]+$/g;
    if (!validPattern.test(tableName)) {
        return `\`${tableName}\``;
    }
    return tableName;
}

function escapeColumn(column: string) {
    return `\`${column}\``;
}