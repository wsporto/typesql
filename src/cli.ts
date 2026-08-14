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
import { generateCrud as generatePgCrud } from './codegen/pg';
import uniqBy from 'lodash.uniqby';
import { buildExportList, collectSqlFiles, crudFilePaths, indexFileDirs, loadConfig, resolveSqlDir, resolveSqlFile, type SqlFile } from './load-config';
import { PostgresColumnSchema } from './drivers/types';
import { createCodeBlockWriter } from './codegen/shared/codegen-util';

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

function watchDirectories(client: DatabaseClient, watchPaths: string[], baseDir: string, outDir: string, crudPaths: ReadonlySet<string>, dbSchema: SchemaInfo | PostgresSchemaInfo, config: TypeSqlConfig) {
	const rewrite = (sqlPath: string) => rewiteFiles(client, resolveSqlFile(sqlPath, baseDir, outDir, crudPaths), dbSchema, config);

	chokidar
		.watch(watchPaths, {
			awaitWriteFinish: {
				stabilityThreshold: 100
			}
		})
		.on('add', rewrite)
		.on('change', rewrite);
}

async function rewiteFiles(client: DatabaseClient, sqlFile: SqlFile, schemaInfo: SchemaInfo | PostgresSchemaInfo, config: TypeSqlConfig) {
	await generateTsFile(client, sqlFile.sqlPath, sqlFile.tsPath, schemaInfo, sqlFile.isCrud);
	const tsDir = path.dirname(sqlFile.tsPath);
	if (config.generateIndexFiles !== false) {
		writeIndexFileFor(tsDir, config);
	}
}

async function main() {
	parseArgs();
}

async function compile(watch: boolean, config: TypeSqlConfig) {
	const { sqlDir, databaseUri, client: dialect, attach, loadExtensions, authToken } = config;
	const { glob: dirGlob, baseDir } = resolveSqlDir(sqlDir);
	const outDir = config.outDir ?? baseDir;
	validateDirectories(baseDir);

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

	const crudFiles = await generateCrudTables(outDir, dbSchema.value, includeCrudTables);
	const crudSqlFiles = crudFiles.filter((file) => file.endsWith('.sql'));

	const sqlFiles = collectSqlFiles(globSync(dirGlob), crudSqlFiles, baseDir, outDir);

	const filesGeneration = sqlFiles.map((sqlFile) => generateTsFile(databaseClient, sqlFile.sqlPath, sqlFile.tsPath, dbSchema.value, sqlFile.isCrud));
	await Promise.all(filesGeneration);

	if (config.generateIndexFiles !== false) {
		const generatedTsFiles = [...sqlFiles.map((sqlFile) => sqlFile.tsPath), ...crudFiles.filter((file) => file.endsWith('.ts'))];
		writeIndexFiles(generatedTsFiles, config);
	}

	if (watch) {
		console.log('watching mode!');
		watchDirectories(databaseClient, [dirGlob, ...crudSqlFiles], baseDir, outDir, crudFilePaths(crudSqlFiles), dbSchema.value, config);
	} else {
		closeClient(databaseClient);
	}
}

function writeIndexFiles(generatedTsFiles: string[], config: TypeSqlConfig) {
	for (const dir of indexFileDirs(generatedTsFiles)) {
		writeIndexFileFor(dir, config);
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
	const { baseDir } = resolveSqlDir(sqlDir);
	const filePath = `${baseDir}/${queryName}`;

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

// Returns every crud file written, so the caller can compile the generated `.sql` queries and
// write index files for the generated `.ts` ones without rescanning the output directory.
async function generateCrudTables(sqlFolderPath: string, schemaInfo: SchemaInfo | PostgresSchemaInfo, includeCrudTables: string[]): Promise<string[]> {

	const generatedFiles: string[] = [];
	const filteredTables = _filterTables(schemaInfo, includeCrudTables);
	for (const tableInfo of filteredTables) {
		const tableName = tableInfo.table;
		const filePath = `${sqlFolderPath}/${CRUD_FOLDER}/${tableName}/`;
		if (schemaInfo.kind === 'mysql2') {
			const columns = schemaInfo.columns.filter((col) => col.table === tableName);
			const sqlFiles = [
				{ path: `${filePath}select-from-${tableName}.sql`, stmtType: 'select' },
				{ path: `${filePath}insert-into-${tableName}.sql`, stmtType: 'insert' },
				{ path: `${filePath}update-${tableName}.sql`, stmtType: 'update' },
				{ path: `${filePath}delete-from-${tableName}.sql`, stmtType: 'delete' }
			] satisfies { path: string; stmtType: SqlGenOption }[];
			for (const sqlFile of sqlFiles) {
				if (checkAndGenerateSql(schemaInfo.kind, sqlFile.path, sqlFile.stmtType, tableName, columns)) {
					generatedFiles.push(sqlFile.path);
				}
			}
		} else {
			const tsFiles = [
				{ path: `${filePath}select-from-${tableName}.ts`, queryType: 'Select' },
				{ path: `${filePath}insert-into-${tableName}.ts`, queryType: 'Insert' },
				{ path: `${filePath}update-${tableName}.ts`, queryType: 'Update' },
				{ path: `${filePath}delete-from-${tableName}.ts`, queryType: 'Delete' }
			] satisfies { path: string; queryType: CrudQueryType }[];
			for (const tsFile of tsFiles) {
				generateAndWriteCrud(schemaInfo.kind, tsFile.path, tsFile.queryType, tableName, schemaInfo.columns);
				generatedFiles.push(tsFile.path);
			}
		}
	}
	return generatedFiles;
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
