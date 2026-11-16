import { pool } from "../src/db.js";
import { hashPassword } from "../src/password.js";
// Supply a NEW Smith password on stdin. No existing secret files are read.
let password = "";
for await (const chunk of process.stdin) password += chunk;
password = password.trim();
if (password.length < 12 || password.length > 128)
  throw Error("New password must be 12–128 characters");
try {
  await pool.query(
    "INSERT INTO users(username,password_hash) VALUES('Smith',$1) ON CONFLICT(username) DO NOTHING",
    [await hashPassword(password)],
  );
  console.log("Smith seed ready (existing account unchanged)");
} finally {
  await pool.end();
}
