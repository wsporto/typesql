# Using LIKE Clause:

The following SQL in the file `select-employees.sql`:

```sql
SELECT 
    employeeNumber, 
    lastName, 
    firstName
FROM
    employees
WHERE
    firstName LIKE 'a%'
```

Can be executed using the generated code:

```ts
//...
const result = await selectEmployees(conn);
console.log("result=", result);

```

# Parameters in the LIKE Clause:

```sql
SELECT 
    employeeNumber, 
    lastName, 
    firstName
FROM
    employees
WHERE
    firstName LIKE :nameLike
```

```ts
//...
const result = await selectEmployees(conn, {
    nameLike: 'a%'
});
console.log("result=", result);
```

```js
result= [
  { employeeNumber: 1143, lastName: 'Bow', firstName: 'Anthony' },
  { employeeNumber: 1611, lastName: 'Fixter', firstName: 'Andy' }
]
```