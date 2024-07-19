#!/usr/bin/env node
import fs from 'node:fs';
import path, { parse } from 'node:path';
import chokidar from 'chokidar';
import yargs from 'yargs';
import { generateTsFile, writeFile } from './code-generator';
import { createMysqlClient, loadMysqlSchema, loadMySqlTableSchema, selectTablesFromSchema } from './queryExectutor';
import { generateInsertStatement, generateUpdateStatement, generateDeleteStatement, generateSelectStatement } from './sql-generator';
import type { ColumnSchema, Table } from './mysql-query-analyzer/types';
import type { TypeSqlConfig, SqlGenOption, DatabaseClient, TypeSqlDialect, TypeSqlError, SQLiteClient, QueryType } from './types';
import { type Either, isLeft, left } from 'fp-ts/lib/Either';
import CodeBlockWriter from 'code-block-writer';
import { globSync } from 'glob';
import { createSqliteClient, loadDbSchema, selectSqliteTablesFromSchema } from './sqlite-query-analyzer/query-executor';
import { createLibSqlClient } from './drivers/libsql';
import { generateCrud } from './sqlite-query-analyzer/code-generator';

const CRUD_FOLDER = 'crud';

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
				databaseUri: 'mysql://root:password@localhost/mydb',
				sqlDir: './sqls',
				client: 'mysql2',
				includeCrudTables: []
			};
			const configPath = './typesql.json';
			writeFile(configPath, JSON.stringify(config, null, 4));
			console.log('Init file generated:', configPath);
		})
		.command(
			['compile [options]', 'c [options]'],
			'Compile the queries and generate ts files',
			(yargs) => {
				return yargs.option('watch', {
					alias: 'w',
					describe: 'Watch for changes in the folders',
					type: 'boolean',
					default: false
				});
			},
			(args) => {
				const config = loadConfig(args.config);
				compile(args.watch, config);
			}
		)
		.command(
			['generate <option> <sql-name>', 'g <option> <sql-name>'],
			'generate sql queries',
			(yargs) => {
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
						demandOption: true
					})
					.strict();
			},
			(args) => {
				const config = loadConfig(args.config);
				const genOption = args.option as SqlGenOption;
				writeSql(genOption, args.table, args['sql-name'], config);
			}
		)

		.demand(1, 'Please specify one of the commands!')
		.wrap(null)
		.strict().argv;
}

function loadConfig(configPath: string): TypeSqlConfig {
	const rawdata = fs.readFileSync(configPath, 'utf-8');
	const config = JSON.parse(rawdata);
	return config;
}

function validateDirectories(dir: string) {
	if (!fs.statSync(dir).isDirectory()) {
		console.log(`The argument is not a directory: ${dir}`);
	}
}

function watchDirectories(client: DatabaseClient, dirPath: string, dbSchema: ColumnSchema[]) {
	const dirGlob = `${dirPath}/**/*.sql`;

	chokidar
		.watch(dirGlob, {
			awaitWriteFinish: {
				stabilityThreshold: 100
			}
		})
		.on('add', (path) => rewiteFiles(client, path, dbSchema, isCrudFile(dirPath, path)))
		.on('change', (path) => rewiteFiles(client, path, dbSchema, isCrudFile(dirPath, path)));
}

async function rewiteFiles(client: DatabaseClient, path: string, dbSchema: ColumnSchema[], isCrudFile: boolean) {
	await generateTsFile(client, path, dbSchema, isCrudFile);
	const dirPath = parse(path).dir;
	await writeIndexFile(dirPath);
}

async function main() {
	parseArgs();
}

async function compile(watch: boolean, config: TypeSqlConfig) {
	const { sqlDir, databaseUri, client: dialect, attach, authToken } = config;
	validateDirectories(sqlDir);

	const databaseClientResult = await createClient(databaseUri, dialect, attach, authToken);
	if (isLeft(databaseClientResult)) {
		console.error(`Error: ${databaseClientResult.left.description}.`);
		return;
	}

	const includeCrudTables = config.includeCrudTables || [];
	const databaseClient = databaseClientResult.right;

	const dbSchema = await loadSchema(databaseClient);
	if (isLeft(dbSchema)) {
		console.error(`Error: ${dbSchema.left.description}.`);
		return;
	}

	await generateCrudTables(databaseClient, sqlDir, dbSchema.right, includeCrudTables);
	const dirGlob = `${sqlDir}/**/*.sql`;

	const sqlFiles = globSync(dirGlob);

	const filesGeneration = sqlFiles.map((sqlFile) => generateTsFile(databaseClient, sqlFile, dbSchema.right, isCrudFile(sqlDir, sqlFile)));
	await Promise.all(filesGeneration);

	writeIndexFile(sqlDir);

	if (watch) {
		console.log('watching mode!');
		watchDirectories(databaseClient, sqlDir, dbSchema.right);
	} else {
		// databaseClient.client.closeConnection();
	}
}

async function writeIndexFile(sqlDir: string) {
	const tsFiles = fs.readdirSync(sqlDir).filter((file) => path.basename(file) !== 'index.ts' && path.extname(file) === '.ts');

	const indexContent = generateIndexContent(tsFiles);
	const indexFilePath = `${sqlDir}/index.ts`;
	writeFile(indexFilePath, indexContent);
}

//Move to code-generator
function generateIndexContent(tsFiles: string[]) {
	const writer = new CodeBlockWriter();
	for (const filePath of tsFiles) {
		const fileName = path.basename(filePath, '.ts'); //remove the ts extension
		writer.writeLine(`export * from "./${fileName}";`);
	}
	return writer.toString();
}

async function writeSql(stmtType: SqlGenOption, tableName: string, queryName: string, config: TypeSqlConfig): Promise<boolean> {
	const { sqlDir, databaseUri, client: dialect } = config;
	const clientResult = await createClient(databaseUri, dialect);
	if (isLeft(clientResult)) {
		console.error(clientResult.left.name);
		return false;
	}

	const client = clientResult.right;

	const columnsOption = await loadTableSchema(client, tableName);
	if (isLeft(columnsOption)) {
		console.error(columnsOption.left.description);
		return false;
	}

	const columns = columnsOption.right;
	const filePath = `${sqlDir}/${queryName}`;

	const generatedOk = checkAndGenerateSql(client.type, filePath, stmtType, tableName, columns);
	return generatedOk;
}

function checkAndGenerateSql(
	dialect: TypeSqlDialect,
	filePath: string,
	stmtType: SqlGenOption,
	tableName: string,
	columns: ColumnSchema[]
) {
	if (columns.length === 0) {
		console.error(`Got no columns for table '${tableName}'. Did you type the table name correclty?`);
		return false;
	}

	const generatedSql = generateSql(dialect, stmtType, tableName, columns);
	writeFile(filePath, generatedSql);
	console.log('Generated file:', filePath);
	return true;
}

function generateSql(dialect: TypeSqlDialect, stmtType: SqlGenOption, tableName: string, columns: ColumnSchema[]) {
	switch (stmtType) {
		case 'select':
		case 's':
			return generateSelectStatement(dialect, tableName, columns);
		case 'insert':
		case 'i':
			return generateInsertStatement(dialect, tableName, columns);
		case 'update':
		case 'u':
			return generateUpdateStatement(dialect, tableName, columns);
		case 'delete':
		case 'd':
			return generateDeleteStatement(dialect, tableName, columns);
	}
}

main().then(() => console.log('finished!'));

async function generateCrudTables(client: DatabaseClient, sqlFolderPath: string, dbSchema: ColumnSchema[], includeCrudTables: string[]) {
	const allTables = await selectAllTables(client);
	if (isLeft(allTables)) {
		console.error(allTables.left);
		return;
	}
	const filteredTables = filterTables(allTables.right, includeCrudTables);

	for (const tableInfo of filteredTables) {
		const tableName = tableInfo.table;
		const filePath = `${sqlFolderPath}/${CRUD_FOLDER}/${tableName}/`;
		if (!fs.existsSync(filePath)) {
			fs.mkdirSync(filePath, { recursive: true });
		}

		const columns = dbSchema.filter((col) => col.table === tableName);
		if (client.type === 'mysql2') {
			checkAndGenerateSql(client.type, `${filePath}select-from-${tableName}.sql`, 'select', tableName, columns);
			checkAndGenerateSql(client.type, `${filePath}insert-into-${tableName}.sql`, 'insert', tableName, columns);
			checkAndGenerateSql(client.type, `${filePath}update-${tableName}.sql`, 'update', tableName, columns);
			checkAndGenerateSql(client.type, `${filePath}delete-from-${tableName}.sql`, 'delete', tableName, columns);
		} else {
			generateAndWriteCrud(client.type, `${filePath}select-from-${tableName}.ts`, 'Select', tableName, dbSchema);
			generateAndWriteCrud(client.type, `${filePath}insert-into-${tableName}.ts`, 'Insert', tableName, dbSchema);
			generateAndWriteCrud(client.type, `${filePath}update-${tableName}.ts`, 'Update', tableName, dbSchema);
			generateAndWriteCrud(client.type, `${filePath}delete-from-${tableName}.ts`, 'Delete', tableName, dbSchema);
		}
	}
}

function generateAndWriteCrud(client: SQLiteClient, filePath: string, queryType: QueryType, tableName: string, columns: ColumnSchema[]) {
	const content = generateCrud(client, queryType, tableName, columns);
	writeFile(filePath, content);
	console.log('Generated file:', filePath);
}

function filterTables(allTables: Table[], includeCrudTables: string[]) {
	const selectAll = includeCrudTables.find((filter) => filter === '*');
	return selectAll ? allTables : allTables.filter((t) => includeCrudTables.find((t2) => t.table === t2) != null);
}

async function selectAllTables(client: DatabaseClient): Promise<Either<string, Table[]>> {
	const selectTablesResult = await selectTables(client);
	if (isLeft(selectTablesResult)) {
		return left(`Error selecting table names: ${selectTablesResult.left.description}`);
	}
	return selectTablesResult;
}

async function createClient(databaseUri: string, dialect: TypeSqlDialect, attach?: string[], authToken?: string) {
	switch (dialect) {
		case 'mysql2':
			return createMysqlClient(databaseUri);
		case 'better-sqlite3':
		case 'bun:sqlite':
			return createSqliteClient(databaseUri, attach || []);
		case 'libsql':
			return createLibSqlClient(databaseUri, attach || [], authToken || '');
	}
}
async function loadSchema(databaseClient: DatabaseClient): Promise<Either<TypeSqlError, ColumnSchema[]>> {
	switch (databaseClient.type) {
		case 'mysql2':
			return loadMysqlSchema(databaseClient.client, databaseClient.schema);
		case 'better-sqlite3':
		case 'libsql':
			return loadDbSchema(databaseClient.client);
	}
}

async function loadTableSchema(databaseClient: DatabaseClient, tableName: string): Promise<Either<TypeSqlError, ColumnSchema[]>> {
	switch (databaseClient.type) {
		case 'mysql2':
			return loadMySqlTableSchema(databaseClient.client, databaseClient.schema, tableName);
		case 'better-sqlite3':
		case 'libsql':
			return await loadDbSchema(databaseClient.client);
	}
}

async function selectTables(databaseClient: DatabaseClient) {
	switch (databaseClient.type) {
		case 'mysql2':
			return await selectTablesFromSchema(databaseClient.client);
		case 'better-sqlite3':
		case 'libsql':
			return selectSqliteTablesFromSchema(databaseClient.client);
	}
}

//https://stackoverflow.com/a/45242825
function isCrudFile(sqlDir: string, sqlFile: string): boolean {
	const relative = path.relative(`${sqlDir}/${CRUD_FOLDER}`, sqlFile);
	const result = relative != null && !relative.startsWith('..') && !path.isAbsolute(relative);
	return result;
}
