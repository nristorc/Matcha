"use strict";

/* MYSQL */
const mysql = require('mysql');
const configDatabase = require('./database');

/* SETTING UP DB */
const connection = mysql.createConnection(configDatabase.connection);

connection.query("CREATE DATABASE IF NOT EXISTS " + configDatabase.database, (err, result) => {
    if (err) {
        console.error('error creating db: ' + err.stack);
        return
    }
    console.log("Database " + configDatabase.database + " created");
});

connection.query("USE " + configDatabase.database, (err) => {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return
    }
    console.log('connected to ' + configDatabase.database)
});
/*const sql = "CREATE TABLES IF NOT EXISTS " + configDatabase.user_table + '` ('
    + 'id INT NOT NULL AUTO_INCREMENT,'
    + 'PRIMARY KEY(id),'
    + 'email VARCHAR(255) NOT NULL,'
    + 'firstname VARCHAR(30) NOT NULL,'
    + 'lastname VARCHAR(255) NOT NULL,'
    + 'username VARCHAR(30) NOT NULL,'
    + 'password VARCHAR(255) NOT NULL,'
    + 'created_at DATETIME NOT NULL'
    + ')';
connection.query(sql, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.user_table + " created");
});*/

connection.end();