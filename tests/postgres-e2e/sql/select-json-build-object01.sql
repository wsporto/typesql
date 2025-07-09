SELECT 
	json_build_object('key1', 'str1') as value1, 
	json_build_object('key2', 10) as value2,
	jsonb_build_object('key3', 'str2') as value3,
	jsonb_build_object('key4', 20) as value4
