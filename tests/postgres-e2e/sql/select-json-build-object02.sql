SELECT json_agg(
	json_build_object('key', name, 'key2', id)
) AS result
FROM (
	VALUES
		(1, 'a'),
		(2, 'b')
) AS t(id, name)