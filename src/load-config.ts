import path from 'node:path';
import fs from 'node:fs';
import { escape as escapeGlob, hasMagic } from 'glob';
import { TypeSqlConfig } from './types';

const CRUD_FOLDER = 'crud';

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
 *   verbatim as the pattern.
 * - Otherwise `**\/*.sql` is appended, so both a plain directory (`./src`) and a directory
 *   glob (`src/**\/queries`) recursively match every `.sql` file beneath what they describe.
 *
 * The base directory is the real directory the pattern is anchored to; it anchors
 * output-path resolution (`resolveTsFilePath`) and crud-file detection. Because it is a
 * path rather than a pattern, it is escaped before being spliced back into the glob —
 * otherwise a directory whose name contains glob magic (`src/[locale]/queries`) would
 * both fail to match and drag the base directory above the project.
 */
export function resolveSqlDir(sqlDir: string): { glob: string; baseDir: string } {
	const normalized = sqlDir.split(path.sep).join('/'); // glob requires forward slashes
	const pattern = /\.sql$/i.test(normalized) ? normalized : path.posix.join(normalized, '**/*.sql');

	const { baseDir, rest } = splitPattern(pattern);
	const glob = path.posix.join(escapeGlob(baseDir), rest);

	return { glob, baseDir };
}

/**
 * Splits a pattern into the directory it is anchored to and the pattern applying beneath it.
 * A segment ends the base directory only when it is glob magic that does not also name a
 * real directory — `**` never does, `app[dev]` may well.
 */
function splitPattern(pattern: string): { baseDir: string; rest: string } {
	const segments = pattern.split('/');
	const baseSegments: string[] = [];

	let index = 0;
	for (; index < segments.length - 1; index++) { // the trailing segment always belongs to the pattern
		const segment = segments[index];
		const candidate = baseSegments.concat(segment).join('/');
		if (hasMagic(segment, { magicalBraces: true }) && !isDirectory(candidate)) break;
		baseSegments.push(segment);
	}

	return {
		baseDir: joinBaseSegments(baseSegments),
		rest: segments.slice(index).join('/')
	};
}

function joinBaseSegments(baseSegments: string[]): string {
	if (baseSegments.length === 0) return '.';
	const base = baseSegments.join('/');
	return base === '' ? '/' : path.posix.join(base, '.'); // joining '.' collapses './src' and 'src/'
}

function isDirectory(candidate: string): boolean {
	try {
		return fs.statSync(candidate).isDirectory();
	} catch {
		return false;
	}
}

export type SqlFile = {
	sqlPath: string;
	tsPath: string;
	isCrud: boolean;
};

export type OutputConfig = {
	/** Directory the sql glob is anchored to; the tree beneath it is mirrored into a global `outDir`. */
	baseDir: string;
	/** The configured `outDir`, if any. See {@link isNestedOutDir} for how its shape is read. */
	outDir?: string;
};

/**
 * Whether `outDir` names a folder beside each query rather than one global output tree.
 *
 * A bare name (`gen`, `generated/ts`) is resolved against the directory each `.sql` file
 * lives in, so `**\/queries` outputs to `**\/queries/gen`. Anything explicitly rooted -
 * `./out`, `../out`, `/abs/out` - keeps the single output tree that mirrors `baseDir`.
 */
export function isNestedOutDir(outDir: string | undefined): outDir is string {
	return outDir != null && outDir.trim() !== '' && !path.isAbsolute(outDir) && !/^\.\.?([\\/]|$)/.test(outDir);
}

/** Root the generated `crud` folder sits under: the global output tree when there is one. */
export function crudRootDir({ baseDir, outDir }: OutputConfig): string {
	return outDir != null && outDir.trim() !== '' && !isNestedOutDir(outDir) ? outDir : baseDir;
}

/**
 * Pairs a `.sql` file with the `.ts` file generated from it.
 *
 * `crudPaths` holds the queries typesql generated itself (from `includeCrudTables`). Those
 * live under the crud root, which the configured glob does not necessarily cover, so they
 * are resolved against that root rather than the base directory.
 */
export function resolveSqlFile(sqlPath: string, output: OutputConfig, crudPaths: ReadonlySet<string>): SqlFile {
	const { baseDir, outDir } = output;
	const isGeneratedCrud = crudPaths.has(path.resolve(sqlPath));
	return {
		sqlPath,
		tsPath: resolveTsFilePath(sqlPath, isGeneratedCrud ? crudRootDir(output) : baseDir, outDir),
		isCrud: isGeneratedCrud || isCrudFile(baseDir, sqlPath)
	};
}

/**
 * Every `.sql` file to compile: the files the configured glob matched, plus any generated
 * crud query it did not cover. Crud queries are written under `outDir`, which a narrower
 * glob (`src/**\/*.query.sql`, `src/**\/queries`) has no reason to match.
 */
export function collectSqlFiles(matchedFiles: string[], crudSqlFiles: string[], output: OutputConfig): SqlFile[] {
	const crudPaths = crudFilePaths(crudSqlFiles);
	const matchedPaths = new Set(matchedFiles.map((file) => path.resolve(file)));
	const uncoveredCrudFiles = crudSqlFiles.filter((file) => !matchedPaths.has(path.resolve(file)));

	return [...matchedFiles, ...uncoveredCrudFiles].map((sqlPath) => resolveSqlFile(sqlPath, output, crudPaths));
}

export function crudFilePaths(crudSqlFiles: string[]): ReadonlySet<string> {
	return new Set(crudSqlFiles.map((file) => path.resolve(file)));
}

//https://stackoverflow.com/a/45242825
export function isCrudFile(sqlDir: string, sqlFile: string): boolean {
	const relative = path.relative(`${sqlDir}/${CRUD_FOLDER}`, sqlFile);
	const result = relative != null && !relative.startsWith('..') && !path.isAbsolute(relative);
	return result;
}

// Only the directories that received generated code, so index files are never written
// into hand-written source folders that merely sit under the base directory.
export function indexFileDirs(tsPaths: string[]): string[] {
	return [...new Set(tsPaths.map((tsPath) => path.dirname(tsPath)))];
}

export function resolveTsFilePath(sqlPath: string, sqlDir: string, outDir?: string) {
	const fileNameWithoutExt = path.basename(sqlPath, '.sql');
	const tsFileName = `${fileNameWithoutExt}.ts`;

	// A nested outDir sits beside the query itself, so the base directory plays no part.
	if (isNestedOutDir(outDir)) {
		return path.join(path.dirname(sqlPath), outDir, tsFileName);
	}

	const outputBase = outDir || sqlDir;
	const relativeDir = path.relative(sqlDir, path.dirname(sqlPath));

	const tsFilePath = path.join(outputBase, relativeDir, tsFileName);
	return tsFilePath;
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
