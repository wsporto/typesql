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

CREATE TABLE all_types (
    column_bool BOOL,
    column_bytea BYTEA,
    column_char CHAR(1),
    column_name NAME,
    column_int8 INT8,
    column_int2 INT2,
    column_int4 INT4,
    column_text TEXT,
    column_varchar VARCHAR(255),
    column_date DATE,
    column_bit BIT(1),
    column_numeric NUMERIC,
    column_uuid UUID,
    column_float4 FLOAT4,
    column_float8 FLOAT8
);
