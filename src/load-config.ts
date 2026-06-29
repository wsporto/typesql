import path from 'node:path';
import fs from 'node:fs';
import { hasMagic } from 'glob';
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

/**
 * Derives the file-discovery glob and the static base directory from `sqlDir`.
 *
 * - When `sqlDir` already targets `.sql` files (e.g. `src/queries/**\/*.sql`), it is used
 *   verbatim as the glob.
 * - Otherwise `**\/*.sql` is appended, so both a plain directory (`./src`) and a directory
 *   glob (`src/**\/queries`) recursively match every `.sql` file beneath what they describe.
 *
 * The base directory is the glob's leading magic-free prefix; it anchors output-path
 * resolution (`resolveTsFilePath`) and crud-file detection.
 */
export function resolveSqlDir(sqlDir: string): { glob: string; baseDir: string } {
	const normalized = sqlDir.split(path.sep).join('/'); // glob requires forward slashes
	const glob = /\.sql$/i.test(normalized) ? normalized : path.posix.join(normalized, '**/*.sql');
	const baseDir = hasMagic(glob, { magicalBraces: true }) ? globBaseDir(glob) : path.posix.dirname(glob);
	return { glob, baseDir };
}

// Longest leading run of path segments that contain no glob magic.
function globBaseDir(glob: string): string {
	const baseSegments: string[] = [];
	for (const segment of glob.split('/')) {
		if (hasMagic(segment, { magicalBraces: true })) break;
		baseSegments.push(segment);
	}
	return baseSegments.join('/') || '.';
}

export function resolveTsFilePath(sqlPath: string, sqlDir: string, outDir?: string) {
	const outputBase = outDir || sqlDir;
	const relativeDir = path.relative(sqlDir, path.dirname(sqlPath));
	const fileNameWithoutExt = path.basename(sqlPath, '.sql');
	const tsFileName = `${fileNameWithoutExt}.ts`;

	const tsFilePath = path.join(outputBase, relativeDir, tsFileName);
	return tsFilePath;
}

type ExportMap = Map<string, string[]>;
export function buildExportMap(rootDir: string): ExportMap {
	const exportMap: ExportMap = new Map();
	function walk(dir: string) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });

		const tsFiles: string[] = [];

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				walk(fullPath);
			} else if (isExportableTsFile(entry)) {
				tsFiles.push(entry.name);
			}
		}

		if (tsFiles.length > 0) {
			exportMap.set(dir, tsFiles);
		}
	}

	walk(rootDir);
	return exportMap;
}

export function buildExportList(dir: string): string[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	const exports = entries
		.filter(isExportableTsFile)
		.map((entry) => entry.name);

	return exports;
}

function isExportableTsFile(entry: fs.Dirent) {
	return entry.isFile() &&
		entry.name.endsWith('.ts') &&
		entry.name !== 'index.ts' &&
		!entry.name.endsWith('.d.ts')
}
