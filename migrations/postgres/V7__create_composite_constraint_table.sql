CREATE TABLE composite_key (
    key1 INTEGER,
    key2 INTEGER,
    value INTEGER,
    PRIMARY KEY (key1, key2)
);

CREATE TABLE composite_unique_constraint (
    key1 INTEGER,
    key2 INTEGER,
    value INTEGER,
    UNIQUE (key1, key2)
);