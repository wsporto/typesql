import fs from 'node:fs';
import path, { parse } from 'node:path';
import { PostgresSchemaInfo, SchemaInfo } from '../schema-info';
import { DatabaseClient, TypeSqlError } from '../types';
import { convertToCamelCaseName, generateTsFileFromContent } from './mysql2';
import { Either, isLeft, left, right } from 'fp-ts/lib/Either';
import { validateAndGenerateCode } from './sqlite';
import { generateCode } from './pg';
import { ColumnSchema } from '../mysql-query-analyzer/types';

export async function generateTsFile(client: DatabaseClient, sqlFile: string, tsFilePath: string, schemaInfo: SchemaInfo | PostgresSchemaInfo, isCrudFile: boolean) {
	const sqlContent = fs.readFileSync(sqlFile, 'utf8');

	if (sqlContent.trim() === '') {
		//ignore empty file
		return;
	}

	const { name: fileName } = parse(sqlFile);
	const queryName = convertToCamelCaseName(fileName);

	const tsContentResult = await generateTypeScriptContent({
		client,
		queryName,
		sqlContent,
		schemaInfo,
		isCrudFile,
	})

	if (isLeft(tsContentResult)) {
		console.error('ERROR: ', tsContentResult.left.description);
		console.error('at ', sqlFile);
		writeFile(tsFilePath, '//Invalid SQL');
		return;
	}
	const tsContent = tsContentResult.right;

	writeFile(tsFilePath, tsContent);
}

export async function generateTypeScriptContent(params: {
	client: DatabaseClient;
	queryName: string;
	sqlContent: string;
	schemaInfo: SchemaInfo | PostgresSchemaInfo;
	isCrudFile: boolean;
}): Promise<Either<TypeSqlError, string>> {
	const { client, queryName, sqlContent, schemaInfo, isCrudFile } = params;

	switch (client.type) {
		case 'mysql2':
			return generateTsFileFromContent(client, queryName, sqlContent, isCrudFile);
		case 'better-sqlite3':
		case 'bun:sqlite':
		case 'libsql':
		case 'd1':
			return validateAndGenerateCode(client, sqlContent, queryName, schemaInfo.columns as ColumnSchema[], isCrudFile);
		case 'pg': {
			const result = await generateCode(client, sqlContent, queryName, schemaInfo as PostgresSchemaInfo);
			return result.isErr() ? left(result.error) : right(result.value);
		}
	}
}

export function writeFile(filePath: string, tsContent: string) {
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(filePath, tsContent);
}