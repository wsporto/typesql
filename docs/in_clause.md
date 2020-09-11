The following query in `select-products-in-categories.sql`.

```sql
SELECT 
    ProductID, 
    ProductName, 
    UnitPrice
FROM Products
WHERE Discontinued = 0
    AND CategoryID IN (?)
```

Will generate the following types and functions.

```typescript
export type SelectProductsInCategoriesParams = {
    categories: number[];
}

export type SelectProductsInCategoriesResult = {
    ProductID: number;
    ProductName: string;
    UnitPrice?: number;
}

export async function selectProductsInCategories(client: Client, params: SelectProductsInCategoriesParams) : Promise<SelectProductsInCategoriesResult[]> {
    const sql = `
    SELECT 
        ProductID, 
        ProductName, 
        UnitPrice
    FROM Products
    WHERE CategoryID IN (?)
    `

    return client.query(sql, [params.categories])
        .then( res => res );
}
```

And you can use the API as below.

```typescript
const products = await selectProductsInCategories(client, {
    categories: [10, 11, 12]
})
```

You can also use the `NOT IN` Clause.

**NOTE:** The IN Clause as shown will not work with the deno_mysql driver. See issue [#70](https://github.com/manyuanrong/deno_mysql/issues/70) in the deno_mysql repository. 
