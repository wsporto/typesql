import path from 'node:path';
import fs from 'node:fs';
import { TypeSqlConfig } from './types';

export function loadConfig(configPath: string): TypeSqlConfig {
	const rawdata = fs.readFileSync(configPath, 'utf-8');
	const config = JSON.parse(rawdata);
	const substitutedConfig = resolveEnvVars(config);
	return resolveConfig(configPath, substitutedConfig);
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

// Replaces ${ENV_VAR} with values from process.env
export function resolveEnvVars(config: TypeSqlConfig): TypeSqlConfig {
	const newConfig: TypeSqlConfig = {
		...config,
		databaseUri: resolveEnvVar(config.databaseUri),
	};

	if (config.authToken != null) {
		newConfig.authToken = resolveEnvVar(config.authToken);
	}

	return newConfig;
}

function resolveEnvVar(rawValue: string): string {
	return rawValue.replace(/\$\{([\w\d_]+)\}/g, (_, varName) => {
		const envVal = process.env[varName];

		if (envVal === undefined) {
			console.warn(`Warning: Environment variable ${varName} is not defined.`);
		}

		return envVal ?? '';
	});
}

function isRelativeFilePath(uri: string): boolean {
	return typeof uri === 'string' && !uri.includes('://') && !path.isAbsolute(uri);
}