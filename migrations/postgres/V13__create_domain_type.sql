CREATE DOMAIN positive_number AS integer
CHECK (VALUE > 0);

ALTER TABLE all_types ADD COLUMN positive_number_column positive_number; 