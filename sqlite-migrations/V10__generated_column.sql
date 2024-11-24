CREATE TABLE generated_column(
	id INTEGER PRIMARY KEY,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name)
);
