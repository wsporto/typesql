#!/usr/bin/env node
import fs from 'node:fs';
import dotenv from 'dotenv';
import path from 'node:path';
import chokidar from 'chokidar';
import yargs from 'yargs';
import { generateTsFile, writeFile } from './codegen/code-generator';
import { generateInsertStatement, generateUpdateStatement, generateDeleteStatement, generateSelectStatement } from './sql-generator';
import type { ColumnSchema, Table } from './mysql-query-analyzer/types';
import type { TypeSqlConfig, SqlGenOption, DatabaseClient, TypeSqlDialect, SQLiteClient, CrudQueryType } from './types';
import { type Either, isLeft, left } from 'fp-ts/lib/Either';
import { globSync } from 'glob';
import { closeClient, createClient, loadSchemaInfo, loadTableSchema, PostgresSchemaInfo, SchemaInfo, selectTables } from './schema-info';
import { generateCrud } from './codegen/sqlite';
import { createCodeBlockWriter, generateCrud as generatePgCrud } from './codegen/pg';
import uniqBy from 'lodash.uniqby';
import { buildExportList, buildExportMap, loadConfig, resolveTsFilePath } from './load-config';
import { PostgresColumnSchema } from './drivers/types';

const CRUD_FOLDER = 'crud';

function parseArgs() {
	return yargs
		.usage('Usage: $0 [options] DIRECTORY')
		.option('config', {
			describe: 'Path to the TypeSQL config file (e.g., ./src/sql/typesql.json)',
			type: 'string',
			default: './typesql.json'
		})
		.option('env-file', {
			describe: 'Path to the .env file to load',
			type: 'string'
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
				const envFile = args.envFile;
				if (envFile) {
					if (fs.existsSync(envFile)) {
						dotenv.config({ path: envFile, quiet: true });
					} else {
						console.warn(`Warning: .env file not found: ${envFile}`);
					}
				}

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

function validateDirectories(dir: string) {
	if (!fs.statSync(dir).isDirectory()) {
		console.log(`The argument is not a directory: ${dir}`);
	}
}

function watchDirectories(client: DatabaseClient, sqlDir: string, outDir: string, dbSchema: SchemaInfo | PostgresSchemaInfo, config: TypeSqlConfig) {
	const dirGlob = `${sqlDir}/**/*.sql`;

	chokidar
		.watch(dirGlob, {
			awaitWriteFinish: {
				stabilityThreshold: 100
			}
		})
		.on('add', (path) => rewiteFiles(client, path, sqlDir, outDir, dbSchema, isCrudFile(sqlDir, path), config))
		.on('change', (path) => rewiteFiles(client, path, sqlDir, outDir, dbSchema, isCrudFile(sqlDir, path), config));
}

async function rewiteFiles(client: DatabaseClient, sqlPath: string, sqlDir: string, outDir: string, schemaInfo: SchemaInfo | PostgresSchemaInfo, isCrudFile: boolean, config: TypeSqlConfig) {
	const tsFilePath = resolveTsFilePath(sqlPath, sqlDir, outDir);
	await generateTsFile(client, sqlPath, tsFilePath, schemaInfo, isCrudFile);
	const tsDir = path.dirname(tsFilePath);
	writeIndexFileFor(tsDir, config);
}

async function main() {
	parseArgs();
}

async function compile(watch: boolean, config: TypeSqlConfig) {
	const { sqlDir, outDir = sqlDir, databaseUri, client: dialect, attach, loadExtensions, authToken } = config;
	validateDirectories(sqlDir);

	const databaseClientResult = await createClient(databaseUri, dialect, attach, loadExtensions, authToken);
	if (databaseClientResult.isErr()) {
		console.error(`Error: ${databaseClientResult.error.description}.`);
		return;
	}

	const includeCrudTables = config.includeCrudTables || [];
	const databaseClient = databaseClientResult.value;

	const dbSchema = await loadSchemaInfo(databaseClient, config.schemas);
	if (dbSchema.isErr()) {
		console.error(`Error: ${dbSchema.error.description}.`);
		return;
	}

	await generateCrudTables(outDir, dbSchema.value, includeCrudTables);
	const dirGlob = `${sqlDir}/**/*.sql`;

	const sqlFiles = globSync(dirGlob);

	const filesGeneration = sqlFiles.map((sqlPath) => generateTsFile(databaseClient, sqlPath, resolveTsFilePath(sqlPath, sqlDir, outDir), dbSchema.value, isCrudFile(sqlDir, sqlPath)));
	await Promise.all(filesGeneration);

	writeIndexFile(outDir, config);

	if (watch) {
		console.log('watching mode!');
		watchDirectories(databaseClient, sqlDir, outDir, dbSchema.value, config);
	} else {
		closeClient(databaseClient);
	}
}

function writeIndexFile(outDir: string, config: TypeSqlConfig) {
	const exportMap = buildExportMap(outDir);
	for (const [dir, files] of exportMap.entries()) {
		const indexContent = generateIndexContent(files, config.moduleExtension);
		const indexPath = path.join(dir, 'index.ts');
		writeFile(indexPath, indexContent);
	}
}

function writeIndexFileFor(tsDir: string, config: TypeSqlConfig) {
	if (fs.existsSync(tsDir)) {
		const tsFiles = buildExportList(tsDir);
		const indexContent = generateIndexContent(tsFiles, config.moduleExtension);
		const tsPath = path.join(tsDir, 'index.ts');
		writeFile(tsPath, indexContent);
	}
}

//Move to code-generator
function generateIndexContent(tsFiles: string[], moduleExtension: TypeSqlConfig['moduleExtension']) {
	const writer = createCodeBlockWriter();
	for (const filePath of tsFiles) {
		const fileName = path.basename(filePath, '.ts'); //remove the ts extension
		const suffix = moduleExtension ? `.${moduleExtension}` : '.js';
		writer.writeLine(`export * from "./${fileName}${suffix}";`);
	}
	return writer.toString();
}

async function writeSql(stmtType: SqlGenOption, tableName: string, queryName: string, config: TypeSqlConfig): Promise<boolean> {
	const { sqlDir, databaseUri, client: dialect } = config;
	const clientResult = await createClient(databaseUri, dialect);
	if (clientResult.isErr()) {
		console.error(clientResult.error.name);
		return false;
	}

	const client = clientResult.value;

	const columnsOption = await loadTableSchema(client, tableName);
	if (columnsOption.isErr()) {
		console.error(columnsOption.error.description);
		return false;
	}

	const columns = columnsOption.value;
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

function _filterTables(schemaInfo: SchemaInfo | PostgresSchemaInfo, includeCrudTables: string[]) {
	const allTables = schemaInfo.columns.map(col => ({ schema: col.schema, table: col.table } satisfies Table));
	const uniqueTables = uniqBy(allTables, (item) => `${item.schema}:${item.table}`);
	const filteredTables = filterTables(uniqueTables, includeCrudTables);
	return filteredTables;
}

async function generateCrudTables(sqlFolderPath: string, schemaInfo: SchemaInfo | PostgresSchemaInfo, includeCrudTables: string[]) {

	const filteredTables = _filterTables(schemaInfo, includeCrudTables);
	for (const tableInfo of filteredTables) {
		const tableName = tableInfo.table;
		const filePath = `${sqlFolderPath}/${CRUD_FOLDER}/${tableName}/`;
		if (schemaInfo.kind === 'mysql2') {
			const columns = schemaInfo.columns.filter((col) => col.table === tableName);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}select-from-${tableName}.sql`, 'select', tableName, columns);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}insert-into-${tableName}.sql`, 'insert', tableName, columns);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}update-${tableName}.sql`, 'update', tableName, columns);
			checkAndGenerateSql(schemaInfo.kind, `${filePath}delete-from-${tableName}.sql`, 'delete', tableName, columns);
		} else {
			generateAndWriteCrud(schemaInfo.kind, `${filePath}select-from-${tableName}.ts`, 'Select', tableName, schemaInfo.columns);
			generateAndWriteCrud(schemaInfo.kind, `${filePath}insert-into-${tableName}.ts`, 'Insert', tableName, schemaInfo.columns);
			generateAndWriteCrud(schemaInfo.kind, `${filePath}update-${tableName}.ts`, 'Update', tableName, schemaInfo.columns);
			generateAndWriteCrud(schemaInfo.kind, `${filePath}delete-from-${tableName}.ts`, 'Delete', tableName, schemaInfo.columns);
		}
	}
}

function generateAndWriteCrud(client: 'pg' | SQLiteClient, filePath: string, queryType: CrudQueryType, tableName: string, columns: ColumnSchema[] | PostgresColumnSchema[]) {

	const content = client === 'pg' ? generatePgCrud(queryType, tableName, columns as PostgresColumnSchema[]) : generateCrud(client, queryType, tableName, columns as ColumnSchema[]);
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

//https://stackoverflow.com/a/45242825
function isCrudFile(sqlDir: string, sqlFile: string): boolean {
	const relative = path.relative(`${sqlDir}/${CRUD_FOLDER}`, sqlFile);
	const result = relative != null && !relative.startsWith('..') && !path.isAbsolute(relative);
	return result;
}
