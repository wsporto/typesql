CREATE FUNCTION get_users_with_posts()
RETURNS TABLE (
    id INTEGER,
    posts JSON
)
LANGUAGE sql
AS $$
    SELECT
        u.id,
        (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'title', p.title
                )
            )
            FROM posts p
            WHERE p.fk_user = u.id
        ) AS posts
    FROM users u;
$$;

CREATE OR REPLACE FUNCTION get_users_with_posts_plsql()
RETURNS TABLE (
    id INTEGER,
    posts JSON
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        (
            SELECT json_agg(
                json_build_object(
                    'id', p.id,
                    'title', p.title
                )
            )
            FROM posts p
            WHERE p.fk_user = u.id
        ) AS posts
    FROM users u;
END;
$$;

CREATE OR REPLACE FUNCTION get_clients_with_addresses()
RETURNS SETOF JSON
LANGUAGE sql
AS $$
  SELECT json_build_object(
    'id', c.id,
    'primaryAddress', json_build_object(
      'id', a1.id,
      'address', a1.address
    ),
    'secondaryAddress', CASE
      WHEN a2.id IS NOT NULL THEN json_build_object(
        'id', a2.id,
        'address', a2.address
      )
      ELSE NULL
    END
  )
  FROM clients c
  JOIN addresses a1 ON c.primaryAddress = a1.id
  LEFT JOIN addresses a2 ON c.secondaryAddress = a2.id;
$$;