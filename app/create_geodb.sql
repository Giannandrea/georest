PRAGMA journal_mode = MEMORY;
PRAGMA synchronous = OFF;
PRAGMA foreign_keys = OFF;
PRAGMA ignore_check_constraints = OFF;
PRAGMA auto_vacuum = NONE;
PRAGMA secure_delete = OFF;
BEGIN TRANSACTION;
CREATE TABLE `ip2location_db`(
`ip_from` INTEGER,
`ip_to` INTEGER,
`country_code` CHAR(2),
`country_name` TEXT,
`region_name` TEXT,
`city_name` TEXT,
`latitude` DOUBLE,
`longitude` DOUBLE,
PRIMARY KEY(`ip_to`)
);

CREATE TABLE `ip2location_ip`(
`ip_from` INTEGER,
`ip_to` INTEGER,
`isp` TEXT,
PRIMARY KEY(`ip_to`)
);

CREATE TABLE `ipv62location_db`(
`ip_from` CHAR(39),
`ip_to` CHAR(39),
`country_code` CHAR(2),
`country_name` TEXT,
`region_name` TEXT,
`city_name` TEXT,
`latitude` DOUBLE,
`longitude` DOUBLE,
PRIMARY KEY(`ip_to`)
);

CREATE TABLE `ipv62location_isp`(
`ip_from` CHAR(39),
`ip_to` CHAR(39),
`isp` TEXT,
PRIMARY KEY(`ip_to`)
);

COMMIT;
PRAGMA ignore_check_constraints = ON;
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
