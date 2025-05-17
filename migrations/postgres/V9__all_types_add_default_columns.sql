ALTER TABLE all_types
ADD COLUMN integer_column_default INTEGER DEFAULT 10,
ADD COLUMN enum_column_default sizes_enum DEFAULT 'medium',
ADD COLUMN enum_constraint_default text CHECK (enum_constraint_default IN ('x-small', 'small', 'medium', 'large', 'x-large')) DEFAULT 'medium';