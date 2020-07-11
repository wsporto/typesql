CREATE TABLE `mytable1` (
  `id` int NOT NULL AUTO_INCREMENT,
  `value` int,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `mytable2` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100),
  `descr` varchar(100),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE `mytable3` (
  `id` int NOT NULL AUTO_INCREMENT,
  `double_value` double,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

CREATE TABLE mydb.all_types (
	decimal_column DECIMAL NULL,
	tinyint_column TINYINT NULL,
	smallint_column SMALLINT NULL,
	int_column INT NULL,
	float_column FLOAT NULL,
	double_column DOUBLE NULL,
	timestamp_column TIMESTAMP NULL,
	bigint_column BIGINT NULL,
	mediumint_column MEDIUMINT NULL,
	date_column DATE NULL,
	time_column TIME NULL,
	datetime_column DATETIME NULL,
	year_column YEAR NULL,
	varchar_column varchar(100) NULL,
	bit_column BIT NULL,
	json_column json NULL
)
ENGINE=InnoDB;



