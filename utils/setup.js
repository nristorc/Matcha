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
    "`orientation` VARCHAR (20) DEFAULT 'Bisexuel'," +
    "`description` LONGTEXT DEFAULT NULL," +
    "`popularity` INT(11) DEFAULT 0," +
    "`profil` VARCHAR(255) DEFAULT 'public/img/avatarDefault.png'," +
    "`online` enum('N','Y') DEFAULT 'N'," +
    "`lastOnline` DATETIME DEFAULT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";
    
const sql_tags = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.tags_table +
	"(`id` INT(11) NOT NULL AUTO_INCREMENT," +
	"`user_id` INT(11) NOT NULL," +
    "`tag` VARCHAR(255) NOT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

const sql_photos = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.photos_table +
    "(`id` INT(11) NOT NULL AUTO_INCREMENT," +
    "`user_id` INT(11) NOT NULL," +
    "`photo` VARCHAR(255) NOT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

const sql_likes = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.likes_table +
	"(`id` INT(9) NOT NULL AUTO_INCREMENT," +
	"`user_id` INT(11) NOT NULL," +
    "`user_liked` INT(11) DEFAULT NULL," +
    "`liked_at` DATETIME NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

const sql_visits = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.visits_table +
    "(`id` INT(9) NOT NULL AUTO_INCREMENT," +
    "`visitor_id` INT(11) NOT NULL," +
    "`visited_id` INT(11) DEFAULT NULL," +
    "`visited_at` DATETIME NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

const sql_reports = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.reports_table +
    "(`id` INT(9) NOT NULL AUTO_INCREMENT," +
    "`report_id` INT(11) DEFAULT NULL," +
    "`reported_id` INT(11) DEFAULT NULL," +
    "`reported_at` DATETIME NULL," +
    // Flag: 1 = fake; 2 = block
    "`flag` TINYINT NOT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

const sql_messages = 'CREATE TABLE IF NOT EXISTS ' + configDatabase.messages_table +
    "(`id` INT(9) NOT NULL AUTO_INCREMENT," +
    "`from_user_id` INT(11) DEFAULT NULL," +
    "`to_user_id` INT(11) DEFAULT NULL," +
    "`message` TEXT DEFAULT NULL," +
    "`sent_at` DATETIME DEFAULT NOW()," +
    "`unread` TINYINT DEFAULT NULL," +
    "PRIMARY KEY (`id`)) ENGINE = InnoDB;";

// Flag = 1 - like
// Flag = 2 - match
// Flag = 3 - unlike
// Flag = 4 - unmatch
// Flag = 5 - visite

const sql_notifications =  'CREATE TABLE IF NOT EXISTS ' + configDatabase.notifications_table +
    "(`id` INT(9) NOT NULL AUTO_INCREMENT," +
    "`from` INT(11) DEFAULT NULL," +
    "`to` INT(11) DEFAULT NULL," +
    "`date` DATETIME DEFAULT NOW()," +
    "`flag` INT DEFAULT NULL," +
    "`unread` TINYINT DEFAULT 1," +
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

connection.query(sql_photos, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.photos_table + " created");
});

connection.query(sql_visits, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.visits_table + " created");
});

connection.query(sql_reports, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.reports_table + " created");
});

connection.query(sql_messages, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.messages_table + " created");
});

connection.query(sql_notifications, (err, result) => {
    if (err) {
        console.error('error creating table: ' + err.stack);
        return
    }
    console.log("Table " + configDatabase.notifications_table + " created");
});

connection.end();