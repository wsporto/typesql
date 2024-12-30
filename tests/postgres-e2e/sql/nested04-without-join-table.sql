-- @nested
SELECT
	s.*,
	u.*
FROM surveys s
INNER JOIN participants p on p.fk_survey = s.id
INNER JOIN users u on u.id = p.fk_user