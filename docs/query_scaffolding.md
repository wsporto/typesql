Using the typesql cli to scaffold your sql queries can be a time saver. You can adjust them according your needs.

# Examples:

## SELECT:

`typesql generate select select-employees.sql --table employees` will generate the following in the file `sqls/select-employees.sql`.
```sql
SELECT
    emp_no,
    birth_date,
    first_name,
    last_name,
    gender,
    hire_date
FROM employees
```

## INSERT:

`typesql generate insert insert-employee.sql --table employees` will generate the following in the file `sqls/insert-employee.sql`.
```sql
INSERT INTO employees
(
    emp_no,
    birth_date,
    first_name,
    last_name,
    gender,
    hire_date
)
VALUES
(
    :emp_no,
    :birth_date,
    :first_name,
    :last_name,
    :gender,
    :hire_date
)
```

## UPDATE

`typesql generate update update-employee.sql --table employees` will generate the following in the file `sqls/update-employee.sql`.
```sql
UPDATE employees
SET
    emp_no = :emp_no,
    birth_date = :birth_date,
    first_name = :first_name,
    last_name = :last_name,
    gender = :gender,
    hire_date = :hire_date
WHERE
    emp_no = :emp_no
```

## DELETE

`typesql generate delete delete-employee.sql --table employees` will generate the following in the file `sqls/delete-employee.sql`.
```sql
DELETE FROM employees
WHERE emp_no = :emp_no
```