SELECT 
	json_object_agg(id, value) as result1,
	json_object_agg(id, row_to_json(mytable1)) as result2
FROM mytable1