CREATE TABLE enum_types(
    id INTEGER PRIMARY KEY,
    column1 TEXT CHECK(column1 IN ('A', 'B', 'C')),
    column2 INTEGER CHECK(column2 IN (1, 2)),
    column3 TEXT CHECK(column3 NOT IN ('A', 'B', 'C')),
    column4 TEXT CHECK(column4 LIKE '%a%'),
	column5 NOT NULL CHECK(column5 IN ('D', 'E'))
);

CREATE TABLE enum_types2(
    id INTEGER PRIMARY KEY,
    column1 TEXT CHECK         (   column1 IN ('f', 'g')   )
);

ALTER TABLE all_types ADD COLUMN enum_column TEXT CHECK(enum_column IN ('x-small', 'small', 'medium', 'large', 'x-large'));