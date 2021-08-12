const fs = require("fs");
const path = require("path");

const hashName = "asfdasdasd";

function readDB() {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "db.json")));
}

function isFileMatched(hashName) {
  const db = readDB().map;
  return !!db[hashName];
}

console.log(isFileMatched(hashName));

// TODO: 待完成
// function copyFile(hashName, serverPath) {
//     // 1. 读取数据库
//     // 2. 复制第一条数据
//     const db = readDB().map;
//     const fileList = db[hashName]

//     const 
// }