import pg from "pg";
// pg receives credentials only from the caller's environment; never log configuration.
export const pool = new pg.Pool({ max: 5, application_name: "bizhang" });
