TypeSQL: Generate type safe api for **mysql** databases.

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

TypeSql will generate the types and function in the file `select-products.ts`. 
Then you can import the generate code and execute as following:

deno syntax:

![](typesql-deno.gif)

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

[Order by and limit clauses](/docs/orderBy_limit.md)

# Project status

**WARNING:** This is an WIP experimental project. It is under active development and its API can change. 

Issues reports and feature requests are welcome.
