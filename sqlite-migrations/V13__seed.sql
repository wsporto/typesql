INSERT INTO mytable1(
	value
) VALUES 
	(1), 
	(2), 
	(3), 
	(4);

INSERT INTO mytable2(
	name,
	descr
) VALUES 
	('one', 'descr-one'), 
	('two', 'descr-two'), 
	('three', 'descr-three'),
	('four', null);

INSERT INTO date_table (id, date1, date2)
	VALUES
	(1, '2024-12-31', '2024-12-31 01:10:20'),
	(2, '2025-01-01', '2025-01-01 00:00:00'),
	(3, '2025-01-02', '2025-01-02 01:10:20'),
	(4, '2025-01-03', '2025-01-03 00:00:00'),
	(5, '2025-02-04', '2025-02-04 00:00:00'),
	(6, '2025-02-05', '2025-02-05 00:00:00');
