const fs = require('fs');
const path = require('path');
const { writeFile } = require('./file');

const hashName = 'aabbcc';
const dbPath = path.join(__dirname, 'db.json');

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

function isFileMatched(hashName) {
  const db = readDB().map;
  return !!db[hashName];
}

function insertToDB(hashName, file) {
  const db = readDB();
  const { filePath, userId } = file;
  db.map[hashName] = {
    filePath,
    userId,
  };

  fs.writeFileSync(dbPath, JSON.stringify(db));
}

// TODO: 待完成
async function copyFile(hashName, serverPath) {
  // 1. 读取数据库
  // 2. 复制第一条数据
  const db = readDB().map;
  const fileList = db[hashName];

  const file = fileList[0];
  await writeFile(file.filePath, serverPath);
}


console.log(isFileMatched(hashName));

if(isFileMatched(hashName)) {
  const userId = 'vassily';
  const dirPath = path.join(__dirname,'../upload', userId);
  if(!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath)
  }
  copyFile(hashName, path.join(dirPath, 'logo.jpg'))
}
