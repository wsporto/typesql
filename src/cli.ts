#!/usr/bin/env node
import fs from "fs";
import path, { parse } from "path";
import chokidar from "chokidar";
import yargs from "yargs";
import { generateTsFile, writeFile } from "./code-generator";
import { DbClient } from "./queryExectutor";
import { generateInsertStatment, generateUpdateStatment, generateDeleteStatment, generateSelectStatment } from "./sql-generator";
import { ColumnSchema2 } from "./mysql-query-analyzer/types";
import { TypeSqlConfig, SqlGenOption } from "./types";
import { isLeft } from "fp-ts/lib/Either";
import CodeBlockWriter from "code-block-writer";

function parseArgs() {
    return yargs
        .usage('Usage: $0 [options] DIRECTORY')
        .option('config', {
            describe: 'Database URI to connect to, e.g. -d mysql://user:password@localhost/mydb.',
            demandOption: true,
            type: 'string',
            default: 'typesql.json'
        })
        .command('init', 'generate config file', () => {
            const config: TypeSqlConfig = {
                "databaseUri": "mysql://root:password@localhost/mydb",
                "sqlDir": "./sqls",
                "target": "node"
            }
            const configPath = "./typesql.json";
            writeFile(configPath, JSON.stringify(config, null, 4));
            console.log("Init file generated:", configPath);
        })
        .command(['compile [options]', 'c [options]'], 'Compile the queries and generate ts files', yargs => {
            return yargs
                .option('watch', {
                    alias: 'w',
                    describe: 'Watch for changes in the folders',
                    type: 'boolean',
                    default: false
                })
        }, args => {
            const config = loadConfig(args.config);
            compile(args.watch, config);
        })
        .command(['generate <option> <sql-name>', 'g <option> <sql-name>'], 'generate sql queries', yargs => {
            return yargs
                .positional('option', {
                    type: 'string',
                    demandOption: true,
                    choices: ['select', 'insert', 'update', 'delete', 's', 'i', 'u', 'd']
                })
                .positional('sql-name', {
                    type: 'string',
                    demandOption: true
                })
                .option('table', {
                    alias: 't',
                    type: 'string',
                    demandOption: true,
                })
                .strict()
        }, args => {
            const config = loadConfig(args.config);
            const genOption = args.option as SqlGenOption
            writeSql(genOption, args.table, args["sql-name"], config);
        })

        .demand(1, 'Please specify one of the commands!')
        .wrap(null)
        .strict()
        .argv;
}



function loadConfig(configPath: string): TypeSqlConfig {
    let rawdata = fs.readFileSync(configPath, 'utf-8');
    let config = JSON.parse(rawdata);
    return config;
}

function validateDirectories(dir: string) {
    if (!fs.statSync(dir).isDirectory()) {
        console.log(`The argument is not a directory: ${dir}`);
    }
}

function watchDirectories(client: DbClient, dirPath: string, target: 'node' | 'deno') {
    const dirGlob = `${dirPath}/**/*.sql`;

    chokidar.watch(dirGlob)
        .on('add', path => rewiteFiles(client, path, target))
        .on('change', path => rewiteFiles(client, path, target));
}

async function rewiteFiles(client: DbClient, path: string, target: 'node' | 'deno') {
    await generateTsFile(client, path, target);
    const dirPath = parse(path).dir;
    await writeIndexFile(dirPath);
}

async function main() {
    parseArgs();
}

async function compile(watch: boolean, config: TypeSqlConfig) {

    const { sqlDir, databaseUri, target } = config;
    validateDirectories(sqlDir);

    const sqlFiles = fs.readdirSync(sqlDir)
        .filter(file => path.extname(file) == '.sql')
        .map(sqlFileName => path.resolve(sqlDir, sqlFileName));

    const client = new DbClient();
    const result = await client.connect(databaseUri);
    if (isLeft(result)) {
        console.error(`Error: ${result.left.description}.`);
        return;
    }

    const filesGeneration = sqlFiles.map(sqlFile => generateTsFile(client, sqlFile, target));
    await Promise.all(filesGeneration);

    writeIndexFile(sqlDir);

    if (watch) {
        console.log("watching mode!");
        watchDirectories(client, sqlDir, target);
    }
    else {
        client.closeConnection();
    }
}

async function writeIndexFile(sqlDir: string) {
    const tsFiles = fs.readdirSync(sqlDir)
        .filter(file => path.basename(file) != "index.ts" && path.extname(file) == '.ts');

    const indexContent = generateIndexContent(tsFiles);
    const indexFilePath = sqlDir + "/index.ts";
    writeFile(indexFilePath, indexContent);
}

//Move to code-generator
function generateIndexContent(tsFiles: string[]) {
    const writer = new CodeBlockWriter();
    tsFiles.forEach(filePath => {
        const fileName = path.basename(filePath, ".ts"); //remove the ts extension
        writer.writeLine(`export * from "./${fileName}";`)
    })
    return writer.toString();
}

async function writeSql(stmtType: SqlGenOption, tableName: string, queryName: string, config: TypeSqlConfig): Promise<boolean> {
    const { sqlDir, databaseUri } = config;
    const client = new DbClient();
    const connectionResult = await client.connect(databaseUri);
    if (isLeft(connectionResult)) {
        console.error(connectionResult.left.name);
        return false;
    }


    const columnsOption = await client.loadTableSchema(tableName);
    if (isLeft(columnsOption)) {
        console.error(columnsOption.left.description);
        return false;
    }

    const columns = columnsOption.right;

    if (columns.length == 0) {
        console.error(`Got no columns for table '${tableName}'. Did you type the table name correclty?`);
        client.closeConnection();
        return false;
    }

    client.closeConnection();


    let generatedSql = generateSql(stmtType, tableName, columns);
    const filePath = sqlDir + '/' + queryName;
    writeFile(filePath, generatedSql);
    console.log("Generated file:", filePath);
    return true;
}

function generateSql(stmtType: SqlGenOption, tableName: string, columns: ColumnSchema2[]) {
    switch (stmtType) {
        case 'select':
        case 's':
            return generateSelectStatment(tableName, columns);
        case 'insert':
        case 'i':
            return generateInsertStatment(tableName, columns);
        case 'update':
        case 'u':
            return generateUpdateStatment(tableName, columns);
        case 'delete':
        case 'd':
            return generateDeleteStatment(tableName, columns);
        default:
            const exhaustive: never = stmtType;
            return exhaustive;
    }
}

main().then(() => console.log("finished!"));