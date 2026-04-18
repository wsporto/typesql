import { readFileSync } from "fs";

export function readNormalizedEOL(path: string): string {
    return readFileSync(path, "utf8")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
}