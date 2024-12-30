-- @nested
SELECT
	s.id as surveyId,
	s.name as surveyName,
	p.id as participantId,
	u.id as userId,
	u.name as userName
FROM surveys s
INNER JOIN participants p on p.fk_survey = s.id
INNER JOIN users u on u.id = p.fk_user