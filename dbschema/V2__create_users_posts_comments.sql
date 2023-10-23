CREATE TABLE users(
    id SERIAL,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE posts(
    id SERIAL,
    title varchar(255) NOT NULL,
    body TEXT NOT NULL,
    fk_user BIGINT UNSIGNED,
    CONSTRAINT `fk_posts_users`
        FOREIGN KEY (`fk_user`)
        REFERENCES `users` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE comments(
    id SERIAL,
    comment TEXT NOT NULL,
    fk_user BIGINT UNSIGNED NOT NULL,
    fk_post BIGINT UNSIGNED NOT NULL,
    CONSTRAINT `fk_comments_posts`
        FOREIGN KEY (`fk_post`)
        REFERENCES `posts` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT `fk_comments_users`
        FOREIGN KEY (`fk_user`)
        REFERENCES `users` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE roles(
    id SERIAL,
    role ENUM('user', 'admin', 'guest') NOT NULL DEFAULT 'user',
    fk_user BIGINT UNSIGNED NOT NULL,
    CONSTRAINT `fk_roles_users`
        FOREIGN KEY (`fk_user`)
        REFERENCES `users` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE surveys(
    id SERIAL,
    name VARCHAR(255) NOT NULL,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE participants(
    id SERIAL,
    fk_user BIGINT UNSIGNED NOT NULL,
    fk_survey BIGINT UNSIGNED NOT NULL,
    CONSTRAINT `fk_participant_users`
        FOREIGN KEY (`fk_user`)
        REFERENCES `users` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT `fk_participants_surveys`
        FOREIGN KEY (`fk_survey`)
        REFERENCES `surveys` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE questions(
    id SERIAL,
    questions VARCHAR(255) NOT NULL,
    fk_survey BIGINT UNSIGNED NOT NULL,
    CONSTRAINT `fk_questions_suvey`
        FOREIGN KEY (`fk_survey`)
        REFERENCES `surveys` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    PRIMARY KEY `pk_id`(`id`)
);

CREATE TABLE answers(
    id SERIAL,
    answer VARCHAR(255),
    fk_user BIGINT UNSIGNED NOT NULL,
    fk_question BIGINT UNSIGNED NOT NULL,
    CONSTRAINT `fk_answers_users`
        FOREIGN KEY (`fk_user`)
        REFERENCES `users` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    CONSTRAINT `fk_answers_questions`
        FOREIGN KEY (`fk_question`)
        REFERENCES `questions` (`id`)
        ON DELETE NO ACTION
        ON UPDATE CASCADE,
    PRIMARY KEY `pk_id`(`id`)
);