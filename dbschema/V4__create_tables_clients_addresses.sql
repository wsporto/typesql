CREATE TABLE addresses(
    id SERIAL,
    address VARCHAR(255) NOT NULL,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE clients(
    id SERIAL,
    primaryAddress BIGINT UNSIGNED NOT NULL,
    secondaryAddress BIGINT UNSIGNED,
    PRIMARY KEY `pk_id`(`id`),
    CONSTRAINT `fk_primaryAddress`
        FOREIGN KEY (`primaryAddress`)
        REFERENCES `addresses` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT `fk_secondaryAddress`
        FOREIGN KEY (`secondaryAddress`)
        REFERENCES `addresses` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);