import path from 'node:path';
import fs from 'node:fs';
import { TypeSqlConfig } from './types';

export function loadConfig(configPath: string): TypeSqlConfig {
	const rawdata = fs.readFileSync(configPath, 'utf-8');
	const config = JSON.parse(rawdata);
	return resolveConfig(configPath, config);
}

export function resolveConfig(configPath: string, config: TypeSqlConfig): TypeSqlConfig {
	const configDir = path.dirname(path.resolve(configPath));

	const resolvedDatabaseUri = isRelativeFilePath(config.databaseUri)
		? path.resolve(configDir, config.databaseUri)
		: config.databaseUri;

	return {
		...config,
		databaseUri: resolvedDatabaseUri,
		sqlDir: path.resolve(configDir, config.sqlDir),
	};
}

function isRelativeFilePath(uri: string): boolean {
	return typeof uri === 'string' && !uri.includes('://') && !path.isAbsolute(uri);
}