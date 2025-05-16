CREATE TYPE sizes_enum AS ENUM ('x-small', 'small', 'medium', 'large', 'x-large');
ALTER TABLE all_types
ADD COLUMN enum_column sizes_enum,
ADD COLUMN enum_constraint text CHECK (enum_constraint IN ('x-small', 'small', 'medium', 'large', 'x-large'));