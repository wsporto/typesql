TypeSQL: An alternative to access MySQL databases without an ORM. Write your queries in raw SQL and TypeSQL will generate a type-safe API to execute the queries. 

## Example

Having the following query in `select-products.sql` file.
```sql
SELECT 
  id,
  product_name,
  list_price
FROM products
WHERE discontinued = 0
  AND list_price BETWEEN :minPrice AND :maxPrice
```

TypeSQL will generate the types and function in the file `select-products.ts`. 
Then you can import the generate code and execute as following:

deno syntax:

![](typesql-deno.gif)

## Some features:

- **Do not restrict the use of SQL** You dont need to learn any new query language, you can use SQL with all its power and expressiveness.

- **Infer parameters and columns types.** `SELECT DATEDIFF(:date1, :date2) as days_stayed` will resolve the `date1` and `date2` parameters to the type `Date` and the function return type as `number`. 

- **Infer parameter and column nullability.** The nullable database column `email` will generate a nullable field for the query `SELECT email FROM mytable`, but will generate a non-nullable field for the query `SELECT email FROM mytable WHERE email is not null`;

- **Infer the query return type (single row vs multiple rows).** If the `id` is a primary key or unique key, then function for the query `SELECT * FROM Books where id = :id` will return `Book|null`, instead of `Book[]`. The same is true for filters with LIMIT 1;

- Allow the use of **dynamic ORDER BY** with auto-completion and compile-time verification. See [here](/docs/orderBy_limit.md).

## Usage

1. *npm install -g typesql-cli*

2. Add the `typesql.json` configuration file in project root folder. You can generate an template with cli command `typesql init`.

```json
{
    "databaseUri": "mysql://root:password@localhost/mydb",
    "sqlDir": "./sqls",
    "target": "node"
}
```

3. Write your queries in the folder specified in the configuration file. You can also use the cli to scaffold the queries.

```
sqls\
    select-products.sql
    insert-product.sql
    update-product.sql
```

4. Then run `typesql compile --watch` to start typesql in watch mode. After that you will have one Typescript file for each query file.

```
sqls\
    select-products.sql
    select-products.ts
    insert-product.sql
    insert-product.ts
    update-product.sql
    update-product.ts
```

5. Now you can import and use the generated code.

```
const products = await selectProducts(...

const updateResult = await updateProduct(...
```

# Examples
[Query scaffolding](/docs/query_scaffolding.md)

[IN/NOT IN Clause](/docs/in_clause.md)

[Order by and limit clauses](/docs/orderBy_limit.md)

# Project status

**WARNING:** This is a WIP experimental project. It is under active development and its API might change. 

Issues reports and feature requests are welcome.
