-- @dynamicQuery
SELECT 
	date1, 
	date(date1) as date, 
	datetime(date2) as date_time 
FROM date_table 
WHERE date(date1) = :param1 AND datetime(date2) = :param2