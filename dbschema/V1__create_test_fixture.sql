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
	decimal_column DECIMAL, -- code: 246
	tinyint_column TINYINT, -- code: 1
	smallint_column SMALLINT, -- code: 2
	int_column INT, -- code: 3
	float_column FLOAT, -- code: 4
	double_column DOUBLE, -- code: 5
	timestamp_column TIMESTAMP, -- code: 7
	bigint_column BIGINT, -- code: 8
	mediumint_column MEDIUMINT, -- code: 9
	date_column DATE, -- code: 10
	time_column TIME, -- code: 11
	datetime_column DATETIME, -- code: 12
	year_column YEAR, -- code: 13
	varchar_column varchar(100), -- code: 253
	bit_column BIT, -- code: 16
	json_column json, -- code: 245
	enum_column ENUM('x-small', 'small', 'medium', 'large', 'x-large'), -- code: 254 WRONG? flags: 256
	set_column SET('a', 'b', 'c'), -- code: 254 WRONG? flags: 2048
	tinytext_column TINYTEXT, -- code: 252 length: 765
	mediumtext_column MEDIUMTEXT, -- code: 252 length: 50331645
	longtext_column LONGTEXT, -- code: 252 length: 4294967295
	text_column TEXT(500), -- code: 252 length: 196605
	varbinary_column VARBINARY(200), -- code: 253
	binary_column BINARY(100), -- code: 254
	geometry_column GEOMETRY -- code 255
)
ENGINE=InnoDB;



