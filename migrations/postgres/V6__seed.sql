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

INSERT INTO public.all_types (bool_column,bytea_column,char_column,name_column,int8_column,int2_column,int4_column,text_column,varchar_column,date_column,bit_column,numeric_column,uuid_column,float4_column,float8_column,timestamp_column,timestamp_not_null_column,timestamptz_column,timestamptz_not_null_column) VALUES
	 (NULL,NULL,NULL,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2024-12-31 00:00:00',NULL,'2024-12-31 00:00:00-03'),
	 (NULL,NULL,NULL,NULL,NULL,NULL,2,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-01-01 00:00:00',NULL,'2025-01-01 00:00:00-03'),
	 (NULL,NULL,NULL,NULL,NULL,NULL,3,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-01-02 00:00:00',NULL,'2025-01-02 00:00:00-03'),
	 (NULL,NULL,NULL,NULL,NULL,NULL,4,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-01-03 00:00:00',NULL,'2025-01-03 00:00:00-03'),
	 (NULL,NULL,NULL,NULL,NULL,NULL,5,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-02-04 00:00:00',NULL,'2025-02-04 00:00:00-03'),
	 (NULL,NULL,NULL,NULL,NULL,NULL,6,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-02-05 00:00:00',NULL,'2025-02-05 00:00:00-03');
