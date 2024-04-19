CREATE TABLE mytable1 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    value INTEGER
);

CREATE TABLE mytable2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
	descr TEXT
);

CREATE TABLE mytable3 (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  real_value REAL,
  name TEXT NOT NULL
);

CREATE TABLE all_types (
    int_column INT,
    integer_column INTEGER,
    tinyiny_column TINYINT,
    smallint_column SMALLINT,
    mediumint_column MEDIUMINT,
    bigint_column BIGINT,
    unsignedbigint_column UNSIGNED BIGINT,
    int2_column INT2,
    int8_column INT8,
    character_column CHARACTER(20),
    varchar_column VARCHAR(255),
    varyingcharacter_column VARYING CHARACTER(255),
    nchar_column NCHAR(55),
    native_character_column NATIVE CHARACTER(70),
    nvarchar_column NVARCHAR(100),
    text_column TEXT,
    clob_column CLOB,
    blob_column BLOB,
    blob_column2,
    real_column REAL,
    double_column DOUBLE,
    doubleprecision_column DOUBLE PRECISION,
    float_column FLOAT,
    numeric_column NUMERIC,
    decimal_column DECIMAL(10,5),
    boolean_column BOOLEAN,
    date_column DATE,
    datetime_column DATETIME
);