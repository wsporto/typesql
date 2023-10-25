# Nested query results

TypeSQL also has support for nested queries results.

When you create your queries, by default, TypeSQL will generate a tabular result type, even if your queries include JOINs relations. For example, consider the query below in the file `select-user-posts.sql`:

```sql
SELECT
    id as user_id,
    name as user_name,
    posts.id as post_id,
    title as post_title,
    body as post_body
FROM users
INNER JOIN posts on posts.user_id = users.id
```

For this query, TypeSQL by default will generate a type result like this:

```ts
const result = await selectUserPosts(conn);

//result type
const result: {
  user_id: number;
  user_name: string;
  post_id: number;
  post_title: string;
  post_body: string;
}[];
```

If you want to generate a nested query result, you must annotate the query with `@nested` in a SQL comment.
For example:

```sql
-- @nested
SELECT
    id, -- you must return the primary key of each relation
    name,
    posts.id, -- you must return the primary key of each relation
    title,
    body
FROM users
INNER JOIN posts on posts.user_id = users.id
```

Now TypeSQL will generate a nested type that will be returned when you run `selectUserPostsNested(conn)`:

```ts
const result = await selectUserPostsNested(conn);

//result type
const result: {
  id: number;
  name: string;
  posts: {
    id: number;
    title: string;
    body: string;
  }[];
}[];
```

### Nested result limitations

When you use nested queries you must project the `primary key` of each relation in the query. If you have a query like this `SELECT ... FROM users LEFT JOIN posts LEFT JOIN comments` you must project the primary of the tables: `users`, `posts` and `comments`.

For example, the query below can't be annotated with ` @nested` because it doesn't project the primary key of the `posts` table (posts.id).

```sql
-- This query can't be annotated with @nested
SELECT
    id,
    name,
    title,
    body
FROM users
INNER JOIN posts on posts.user_id = users.id
```
