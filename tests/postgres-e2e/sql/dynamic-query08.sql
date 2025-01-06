-- @dynamicQuery
SELECT 
	timestamp_not_null_column
FROM all_types 
WHERE EXTRACT(YEAR FROM timestamp_not_null_column) = :param1 AND EXTRACT(MONTH FROM timestamp_not_null_column) = :param2