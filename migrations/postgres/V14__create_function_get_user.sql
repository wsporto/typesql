CREATE SCHEMA schema1;

CREATE TABLE schema1.users(
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT,
  schema1_field1 TEXT NOT NULL CHECK (schema1_field1 IN ('str1', 'str2'))
);

CREATE SCHEMA schema2;

CREATE FUNCTION schema2.get_user(user_id INTEGER)
RETURNS schema1.users
LANGUAGE sql
STABLE
AS $$
  SELECT * from schema1.users where id = user_id
$$;

CREATE FUNCTION schema2.get_user_or_throw(user_id INTEGER)
RETURNS schema1.users
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  u schema1.users;
BEGIN
  SELECT * INTO u FROM schema1.users WHERE id = user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with id % not found', user_id;
  END IF;
  RETURN u;
END;
$$;