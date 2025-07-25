CREATE FUNCTION check_users(u users)
RETURNS TABLE (user_ok BOOLEAN)
LANGUAGE sql
STABLE
AS $$
  SELECT true AS user_ok FROM users
$$;