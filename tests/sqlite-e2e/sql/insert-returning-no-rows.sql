INSERT INTO mytable1(
    value
)
SELECT value
FROM mytable1
WHERE 1 > 2
RETURNING *