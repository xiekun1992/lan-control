#!/bin/env node

let data = '';
process.stdin.on('readable', () => {
  let chunk = process.stdin.read();
  if (chunk) {
    data += chunk;
  }
});
process.stdin.on('end', () => {
  const value = JSON.parse(data);
  const target = eval(`value.${process.argv[2]}`);
  process.stdout.write(target? JSON.stringify(target): '');
});
