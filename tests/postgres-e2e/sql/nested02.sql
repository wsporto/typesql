-- @nested
SELECT 
	u.id as user_id, 
	u.name as user_name,
	p.id as post_id,
	p.title as post_title,
	p.body  as post_body,
	r.id as role_id,
	r.role,
	c.id as comment_id,
	c.comment 
FROM users u
INNER JOIN posts p on p.fk_user = u.id
INNER JOIN roles r on r.fk_user = u.id
INNER JOIN comments c on c.fk_post = p.id
ORDER BY user_id, post_id, role_id, comment_id