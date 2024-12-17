CREATE TABLE mytable1 (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  value INTEGER
);

CREATE TABLE mytable2 (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT,
  descr TEXT
);

CREATE TABLE mytable3 (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  double_value real,
  name TEXT NOT NULL
);

CREATE TABLE mytable4 (
    id TEXT PRIMARY KEY,
    name TEXT,
    year INTEGER
);

CREATE TABLE mytable5 (
    id INTEGER PRIMARY KEY,
    name TEXT,
    year INTEGER
);

CREATE TABLE all_types (
    bool_column BOOL,
    bytea_column BYTEA,
    char_column CHAR(1),
    name_column NAME,
    int8_column INT8,
    int2_column INT2,
    int4_column INT4,
    text_column TEXT,
    varchar_column VARCHAR(255),
    date_column DATE,
    bit_column BIT(1),
    numeric_column NUMERIC,
    uuid_column UUID,
    float4_column FLOAT4,
    float8_column FLOAT8,
    timestamp_column timestamp,
    timestamp_not_null_column timestamp NOT NULL,
    timestamptz_column timestamptz,
    timestamptz_not_null_column timestamptz NOT NULL
);
