-- @dynamicQuery
SELECT 
	t1.id, 
	t2.name
FROM mytable1 t1
INNER JOIN mytable2 t2 on t2.id = t1.id
WHERE name <> :name
LIMIT :limit OFFSET :offset