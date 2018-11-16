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
const sql_user = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.user_table +
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
    "`description` LONGTEXT DEFAULT NULL," +
    "`popularity` INT(11) DEFAULT 0," +
    "`profil` VARCHAR(255) DEFAULT 'public/img/avatarDefault.png'," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";
    
const sql_tags = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.tags_table +
	"(`id` INT(11) NOT NULL AUTO_INCREMENT," +
	"`user_id` INT(11) NOT NULL," +
    "`tag` VARCHAR(255) NOT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

const sql_likes = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.likes_table +
	"(`id` INT(9) NOT NULL AUTO_INCREMENT," +
	"`user_id` INT(11) NOT NULL," +
    "`user_liked` INT(11) NOT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

connection.query(sql_user, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.user_table + " created");
});

connection.query(sql_tags, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.tags_table + " created");
});

connection.query(sql_likes, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.likes_table + " created");
});

connection.end();