/// <reference types="node" />
export declare type Options = {
    /**
     * The source directory containing .env.* files.
     */
    cwd?: string;
    /**
     * The environment name such as "local", "dev", "test", "prod", etc.
     */
    env?: string;
    /**
     * Text encoding of the .env.* files.
     */
    encoding?: BufferEncoding;
    /**
     * You may turn on logging to help debug why certain keys or values are not being set as you expect.
     */
    debug?: boolean;
};
export declare function config(options?: Options): Record<string, string>;
