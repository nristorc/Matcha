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
const sql = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.user_table +
    "(`id` INT(11) NOT NULL AUTO_INCREMENT," +
    "`email` VARCHAR(255) NOT NULL," +
    "`firstname` VARCHAR(30) NOT NULL," +
    "`lastname` VARCHAR(50) NOT NULL," +
    "`username` VARCHAR(50) NOT NULL," +
    "`password` VARCHAR(255) NOT NULL," +
    "`created_at` DATETIME NOT NULL," +
    "`registerToken` varchar(30) NOT NULL," +
    "`active` tinyint(1) NOT NULL," +
    "`resetToken` varchar(30) NULL," +
    "`reset_at` DATETIME NULL," +
    "`birth` DATE DEFAULT NULL," +
    "`gender` VARCHAR (20) DEFAULT NULL," +
    "`orientation` VARCHAR (20) DEFAULT NULL," +
    "`description` VARCHAR (255) DEFAULT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

connection.query(sql, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.user_table + " created");
});

connection.end();