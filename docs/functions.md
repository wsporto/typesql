Some of MySQL functions are supported by TypeSQL.

## Date and Time Functions

Supported functions: ADDDATE, CURDATE, DATE_ADD, DATE_SUB, DATE_DIFF, DAY, HOUR, MICROSECOND, MINUTE, MONTH, NOW, SECOND,
STR_TO_DATE, SUB_DATE, YEAR


Example:

If you have the SQL:
```sql
SELECT :startDate, ADDDATE(:startDate, 20) as deadline
```

TypeSQL will generate the following types and function.

```typescript
export type SelectDeadlineParams = {
    startDate: Date;
}

export type SelectDeadlineResult = {
    startDate: Date;
    deadline: Date;
}

export async function selectDeadline(client: Client, params: SelectDeadlineParams) : Promise<SelectOneResult[]> {
    const sql = `
    SELECT ? as startDate, ADDDATE(?, 20) as deadline
    `

    return client.query(sql, [params.startDate])
        .then( res => res );
}
```

And you can use execute the SQL as below.

```typescript
const result = await selectDeadline(client, {
    startDate: new Date(2020, 2, 1)
})
```
