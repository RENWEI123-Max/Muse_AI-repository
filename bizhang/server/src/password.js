import {
  randomBytes,
  scrypt as callback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(callback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + (await scrypt(password, salt, 64)).toString("hex");
}
export async function verifyPassword(password, stored) {
  const [salt, hex] = stored.split(":");
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export const tokenHash = (token) => createHash("sha256").update(token).digest();
