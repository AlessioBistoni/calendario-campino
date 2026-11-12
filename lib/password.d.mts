export function validUsername(username: string): boolean;
export function validPassword(password: string): boolean;
export function hashPassword(password: string): Promise<string>;
export function verifyPassword(password: string, storedHash: string): Promise<boolean>;
