## Example

If you write the following query in `select-products.sql` file.
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
