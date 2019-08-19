const pg = require('pg');

const client = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'pulse',
    password: "!@+%DKFNXO%+",
    port: 5432,
  })
client.connect();

module.exports = client;