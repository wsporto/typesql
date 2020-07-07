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



