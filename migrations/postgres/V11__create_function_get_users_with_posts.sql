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