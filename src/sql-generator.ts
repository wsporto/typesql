import { ColumnSchema2 } from "./mysql-query-analyzer/types";
import CodeBlockWriter from "code-block-writer";

export function generateSelectStatment(tableName: string, columns: ColumnSchema2[], ) {
    const keys = columns.filter(col => col.columnKey = 'PRI');
    if(keys.length == 0) {
        keys.push(...columns.filter(col => col.columnKey == 'UNI'));
    }

    const writer = new CodeBlockWriter();

    writer.writeLine("SELECT");
    columns.forEach( (col, columnIndex) => {
        writer.indent().write(col.column);
        writer.conditionalWrite(columnIndex < columns.length - 1, ',');
        writer.newLine();
    })
    
    writer.write(`FROM ${tableName}`);
    
    return writer.toString();
}

export function generateInsertStatment(tableName: string, dbSchema: ColumnSchema2[], ) {
    const columns = dbSchema.filter(col => !col.autoincrement);

    const writer = new CodeBlockWriter();

    writer.writeLine(`INSERT INTO ${tableName}`);
    writer.writeLine("(")
    columns.forEach( (col, columnIndex) => {
        writer.indent().write(col.column);
        writer.conditionalWrite(columnIndex != columns.length - 1, ',');
        writer.newLine();
    })
    writer.writeLine(')');
    writer.writeLine("VALUES");
    writer.writeLine("(");
    columns.forEach( (col, columnIndex) => {
        writer.indent().write(':' + col.column);
        writer.conditionalWrite(columnIndex < columns.length - 1, ',');
        writer.newLine();
        
    })
    writer.write(")");

    return writer.toString();
}

export function generateUpdateStatment(tableName: string, dbSchema: ColumnSchema2[], ) {
    const columns = dbSchema.filter(col => !col.autoincrement);
    const keys = dbSchema.filter(col => col.columnKey = 'PRI');
    if(keys.length == 0) {
        keys.push(...dbSchema.filter(col => col.columnKey == 'UNI'));
    }

    const writer = new CodeBlockWriter();

    writer.writeLine(`UPDATE ${tableName}`);
    writer.writeLine("SET")
    columns.forEach( (col, columnIndex) => {
        writer.indent().write(`${col.column} = :${col.column}`);
        writer.conditionalWrite(columnIndex != columns.length - 1, ',');
        writer.newLine();
    })
    writer.writeLine('WHERE');
    if(keys.length > 0) {
        writer.indent().write(`${keys[0].column} = :${keys[0].column}`);
    }

    return writer.toString();
}

export function generateDeleteStatment(tableName: string, dbSchema: ColumnSchema2[], ) {
    const keys = dbSchema.filter(col => col.columnKey = 'PRI');
    if(keys.length == 0) {
        keys.push(...dbSchema.filter(col => col.columnKey == 'UNI'));
    }

    const writer = new CodeBlockWriter();

    writer.writeLine(`DELETE FROM ${tableName}`);
    writer.write('WHERE ');
    if(keys.length > 0) {
        writer.write(`${keys[0].column} = :${keys[0].column}`);
    }
    return writer.toString();
}