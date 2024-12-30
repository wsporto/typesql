CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    isbn TEXT NOT NULL
);

CREATE TABLE authors (
    id SERIAL PRIMARY KEY,
    fullName TEXT NOT NULL,
    shortName TEXT
);

CREATE TABLE books_authors (
    id SERIAL PRIMARY KEY,
    book_id BIGINT NOT NULL,
    author_id BIGINT NOT NULL,
    author_ordinal INT NOT NULL,
    FOREIGN KEY (book_id) REFERENCES books (id),
    FOREIGN KEY (author_id) REFERENCES authors (id)
);
