CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    address TEXT NOT NULL
);

CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    primaryAddress INTEGER NOT NULL,
    secondaryAddress INTEGER,
    FOREIGN KEY (primaryAddress) REFERENCES addresses (id),
    FOREIGN KEY (secondaryAddress) REFERENCES addresses (id)
);
