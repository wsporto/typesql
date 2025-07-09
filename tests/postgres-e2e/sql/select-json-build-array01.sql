SELECT 
	json_build_array('a', 'b') as value1, 
	jsonb_build_array(null, 'c', 10) as value2
