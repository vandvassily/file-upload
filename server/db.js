const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath));
}

/**
 * 获取拥有相同hash的文件相对地址
 * @param {string} hashName 文件hash指纹
 * @return {string} dirPath 文件存储的相对路径
 */
function getSameFileDir(hashName) {
  const db = readDB().map;
  
  return !!db[hashName] ? db[hashName].filePath : '';
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

module.exports = {
  getSameFileDir,
  insertToDB,
};
