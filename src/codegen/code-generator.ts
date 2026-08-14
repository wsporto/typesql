import fs from 'node:fs';
import path, { parse } from 'node:path';
import { PostgresSchemaInfo, SchemaInfo } from '../schema-info';
import { DatabaseClient, FileHeader, TypeSqlError } from '../types';
import { generateTsFileFromContent } from './mysql2';
import { Either, isLeft, left, right } from 'fp-ts/lib/Either';
import { validateAndGenerateCode } from './sqlite';
import { generateCode } from './pg';
import { ColumnSchema } from '../mysql-query-analyzer/types';
import { convertToCamelCaseName } from './shared/codegen-util';

export async function generateTsFile(client: DatabaseClient, sqlFile: string, tsFilePath: string, schemaInfo: SchemaInfo | PostgresSchemaInfo, isCrudFile: boolean, fileHeader?: FileHeader) {
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
		writeTsFile(tsFilePath, '//Invalid SQL', fileHeader);
		return;
	}
	const tsContent = tsContentResult.right;

	writeTsFile(tsFilePath, tsContent, fileHeader);
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

export function writeTsFile(filePath: string, tsContent: string, fileHeader: FileHeader) {
	writeFile(filePath, applyFileHeader(tsContent, fileHeader));
}

/**
 * Prepends the configured header to generated TypeScript. The header is written verbatim -
 * it is the user's own comment or directive - followed by a single newline.
 */
export function applyFileHeader(tsContent: string, fileHeader: FileHeader): string {
	const header = Array.isArray(fileHeader) ? fileHeader.join('\n') : fileHeader ?? '';

	return header.trim() === '' ? tsContent : `${header}\n${tsContent}`;
}