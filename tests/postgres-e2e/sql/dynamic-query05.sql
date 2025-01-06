-- @dynamicQuery
WITH 
	cte as (
		select id, name from mytable2
	)
SELECT 
	m1.id,
	m2.name
FROM mytable1 m1
INNER JOIN cte m2 on m2.id = m1.id