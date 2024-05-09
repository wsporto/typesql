CREATE TABLE addresses(
    id INTEGER PRIMARY KEY,
    address TEXT NOT NULL
);

CREATE TABLE clients(
    id INTEGER PRIMARY KEY,
    primaryAddress INTEGER NOT NULL,
    secondaryAddress INTEGER,
    FOREIGN KEY(primaryAddress) REFERENCES addresses(id),
    FOREIGN KEY(secondaryAddress) REFERENCES addresses(id)
);