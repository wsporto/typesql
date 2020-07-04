import { generateTsFile } from "./src/index";

generateTsFile('./example.sql').then( () => {
    console.log("arquivo gerado.");
})