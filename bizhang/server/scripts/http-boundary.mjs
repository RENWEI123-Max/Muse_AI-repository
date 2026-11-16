import assert from 'node:assert/strict';
import {protectedRoutes} from '../src/app.js';
const base=process.env.BZ_HTTP_BASE??'http://127.0.0.1:13100/api/v1';
let count=0;
for(const [method,path] of protectedRoutes)for(const authorization of [undefined,'Bearer '+'a'.repeat(64)]){
const response=await fetch(base+path.replace(':id','1'),{method,headers:authorization?{authorization}:{}});
assert.equal(response.status,401,`${method} ${path}`);count++;
}
console.log(`PASS: ${count} real HTTP requests through SSH tunnel returned 401 (login is the documented public exception).`);
