import mysql2 from "mysql2/promise";
import { example } from "./example";

async function main() {
    const connection = await mysql2.createConnection({host:'localhost', user: 'user', password:'password', database: 'mydatabase'});

    
    const result = await example(connection, {
        param1: 'a',
        id: 2
    });

    result.forEach( res => {
        console.log("res=", res.id, " value=", res.value);
    })

    connection.end();

}

main();