/// <reference types="node" />
declare const encRegExp: RegExp;
declare const generateSalt: () => Promise<Buffer>;
export declare function encrypt(value: string, password: string, salt: string): Promise<string>;
export declare function encryptSync(value: string, password: string, salt: string): string;
export declare function decrypt(value: string, password: string): Promise<string>;
export declare function decryptSync(value: string, password: string): string;
export { encRegExp, generateSalt };
