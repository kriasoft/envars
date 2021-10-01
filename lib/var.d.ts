/// <reference types="node" />
export declare type Options = {
    /**
     * The source directory containing .env.* files.
     */
    cwd: string;
    /**
     * The environment name such as "local", "dev", "test", "prod", etc.
     */
    env: string;
    /**
     * Use password-based encryption.
     */
    secret?: boolean;
    /**
     * Text encoding of the .env.* files.
     */
    encoding?: BufferEncoding;
};
/**
 * Writes environment variable to the .env.{envName} file.
 */
export declare function set(name: string, value: string, options: Options): Promise<void>;
export declare function get(name: string, options: Omit<Options, "secret">): Promise<string | null>;
