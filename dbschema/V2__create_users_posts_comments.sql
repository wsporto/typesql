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