/// <reference types="node" />
/**
 * Reads the file line-by-line. Returns an empty array if the file doesn't exist.
 */
export declare function readLines(filename: string, encoding: BufferEncoding): Promise<string[]>;
/**
 * Writes an array of text lines to file.
 */
export declare function writeLines(lines: string[], filename: string, encoding: BufferEncoding): Promise<void>;
export declare function findPassword(filename: string, encoding: BufferEncoding): Promise<string>;
