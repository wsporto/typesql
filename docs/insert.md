Considere the following SQL in the file `insert-products.sql`. The template for this query can be generated using the cli command `typesql generate insert insert-product.sql --table Products`.

```sql
INSERT INTO Products
(
    ProductName,
    SupplierID,
    CategoryID,
    QuantityPerUnit,
    UnitPrice,
    UnitsInStock,
    UnitsOnOrder,
    ReorderLevel,
    Discontinued
)
VALUES
(
    :ProductName,
    :SupplierID,
    :CategoryID,
    :QuantityPerUnit,
    :UnitPrice,
    :UnitsInStock,
    :UnitsOnOrder,
    :ReorderLevel,
    :Discontinued
)
```

After run `typesql compile`, TypeSQL will generate the types and function below for this SQL.

```typescript
export type InsertProductParams = {
    ProductName: string;
    SupplierID?: number;
    CategoryID?: number;
    QuantityPerUnit?: string;
    UnitPrice?: number;
    UnitsInStock?: number;
    UnitsOnOrder?: number;
    ReorderLevel?: number;
    Discontinued: boolean;
}

export type InsertProductResult = {
    affectedRows: number;
    insertId: number;
}

export async function insertProduct(client: Client, params: InsertProductParams) : Promise<InsertProductResult> {
    const sql = `
    INSERT INTO Products
    (
        ProductName,
        SupplierID,
        CategoryID,
        QuantityPerUnit,
        UnitPrice,
        UnitsInStock,
        UnitsOnOrder,
        ReorderLevel,
        Discontinued
    )
    VALUES
    (
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
    )
    `

    return client.query(sql, [params.ProductName, params.SupplierID, params.CategoryID, params.QuantityPerUnit, params.UnitPrice, params.UnitsInStock, params.UnitsOnOrder, params.ReorderLevel, params.Discontinued])
        .then( res => res );
}
```

You can use the generated code as following. Note that only `ProductName` and `Discontinued` are mandatory fields.

```typescript
const result = await insertProduct(client, {
    ProductName: 'Product name',
    Discontinued: false
})

console.log("insertedId:", result.insertId)
```