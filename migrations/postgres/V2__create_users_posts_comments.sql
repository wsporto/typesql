CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    fk_user INTEGER,
    FOREIGN KEY (fk_user) REFERENCES users (id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    comment TEXT NOT NULL,
    fk_user INTEGER NOT NULL,
    fk_post INTEGER NOT NULL,
    FOREIGN KEY (fk_user) REFERENCES users (id),
    FOREIGN KEY (fk_post) REFERENCES posts (id)
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user',
    fk_user INTEGER NOT NULL,
    FOREIGN KEY (fk_user) REFERENCES users (id)
);

CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    fk_user INTEGER NOT NULL,
    fk_survey INTEGER NOT NULL,
    FOREIGN KEY (fk_user) REFERENCES users (id),
    FOREIGN KEY (fk_survey) REFERENCES surveys (id)
);

CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    questions TEXT NOT NULL,
    fk_survey INTEGER NOT NULL,
    FOREIGN KEY (fk_survey) REFERENCES surveys(id)
);

CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    answer VARCHAR(255),
    fk_user INTEGER NOT NULL,
    fk_question INTEGER NOT NULL,
    FOREIGN KEY (fk_user) REFERENCES users (id),
    FOREIGN KEY (fk_question) REFERENCES questions(id)
);
