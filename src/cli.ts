#!/usr/bin/env node
import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import yargs from "yargs";
import { generateTsFile } from "./code-generator";
import { DbClient } from "./queryExectutor";

function parseArgs() {
    return yargs
        .usage('Usage: $0 [options] DIRECTORY')
        .option('database', {
            alias: 'd',
            describe: 'Database URI to connect to, e.g. -d mysql://user:password@localhost/mydb.',
            demandOption: true,
            type: 'string' 
        }).option('watch', {
            alias: 'w',
            describe: 'Watch for changes in the folders',
            type: 'boolean'
        })
        .argv;
}

function validateDirectories(dirPaths: string[]) {
    if(dirPaths.length == 0) {
        console.error("No input folder.");
        return 1;
    }
    for(const dir of dirPaths) {
        if(!fs.statSync(dir).isDirectory()) {
            console.log(`The argument is not a directory: ${dir}`);
            return 1;
        }
    }
    return dirPaths;
}

function watchDirectories(client:DbClient, dirPath: string) {
    const dirGlob = `${dirPath}/**/*.sql`;

    chokidar.watch(dirGlob)
        .on('add', path => generateTsFile(client, path))
        .on('change', path => generateTsFile(client, path));
}

async function main() {
    const args = parseArgs();
    
    const dirPaths = validateDirectories(args._);
    if(dirPaths == 1) return 1; //error

    const dirPath = dirPaths[0];
    const sqlFiles = fs.readdirSync(dirPath)
        .filter( file => path.extname(file) == '.sql')
        .map( sqlFileName => path.resolve(dirPath, sqlFileName));
    
    const client = new DbClient();
    await client.connect(args.database);

    const filesGeneration = sqlFiles.map( sqlFile => generateTsFile(client, sqlFile));
    await Promise.all(filesGeneration);


    if(args.watch) {
        console.log("watching");
        watchDirectories(client, dirPath);
    }
    else {
        client.closeConnection();
    }


    

}

main().then( () => console.log("finished!"));