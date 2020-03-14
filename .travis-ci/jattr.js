//#!/bin/env node

// let data = '';
// process.stdin.on('readable', () => {
//   let chunk = process.stdin.read();
//   if (chunk) {
//     data += chunk;
//   }
// });
// process.stdin.on('end', () => {
//   const value = JSON.parse(data);
//   const target = eval(`value.${process.argv[2]}`);
//   process.stdout.write(target? JSON.stringify(target): '');
// });

// console.log(process.argv)
const fs = require('fs')
const content = fs.readFileSync(process.argv[2]);
const value = JSON.parse(content);
const target = eval(`value.${process.argv[3]}`);
fs.writeFileSync(process.argv[4], target? JSON.stringify(target): '');
// process.stdout.write(target? JSON.stringify(target): '');