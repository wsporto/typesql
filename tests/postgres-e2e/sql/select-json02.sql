SELECT
	json_build_object(
		'total', SUM(m.id),
		'count', COUNT(m.id),
		'coalesce', COALESCE(m.id, 0),
		'nested', COALESCE(json_agg(jsonb_build_object(
			'key1', 'value',
			'key2', 10
		)))
	) AS sum
FROM mytable1 m
GROUP BY id