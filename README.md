Obs.: This is a WIP experimental project.

Typesql: Generate type safe code for **mysql** database.

## Example

Having the following query in `select-products.sql` file.
```sql
SELECT 
  id,
  product_name,
  list_price
FROM products
WHERE discontinued = 0
  AND list_price > :minPrice
  AND list_price  < :maxPrice
```

TypeSql will generate the types and function in the file `select-products.ts`. 
Then you can import the generate code and execute as following:

deno syntax:

![](typesql-deno.gif)

## Usage

1. Write your queries in a determined folder, like this:

```
sqls\
    select-products.sql
    insert-product.sql
    update-product.sql
```

2. Then run `npx typesql-cli -w -t=deno -d mysql://root:password@localhost/mydb .\sqls` to start typesql in watch mode and generate code targeting the deno runtime.

3. After that you will have one Typescript file for each query file.

```
sqls\
    select-products.sql
    select-products.ts
    insert-product.sql
    insert-product.ts
    update-product.sql
    update-product.ts
```

4. Now you can import and use the generated code

```
const products = await selectProducts(...

const updateResult = await updateProduct(...
```

# Examples

[Order by and limit clauses](/docs/orderBy_limit.md)