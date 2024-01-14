CREATE TABLE books(
    id SERIAL,
    title VARCHAR(255) NOT NULL,
    isbn char(50) NOT NULL,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE authors(
    id SERIAL,
    fullName VARCHAR(255) NOT NULL,
    shortName VARCHAR(50),
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE books_authors(
    id SERIAL,
    book_id BIGINT UNSIGNED NOT NULL,
    author_id BIGINT UNSIGNED NOT NULL,
    author_ordinal INT NOT NULL,
    PRIMARY KEY `pk_id`(`id`),
    CONSTRAINT `fk_books_authors_books`
        FOREIGN KEY (`book_id`)
        REFERENCES `books` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT `fk_books_authors_authors`
        FOREIGN KEY (`author_id`)
        REFERENCES `authors` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE
);