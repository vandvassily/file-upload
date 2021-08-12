const fs = require("fs");

/**
 * 切片文件合并
 */
function mergeFile(dirPath, filePath, chunkCount) {
  return new Promise((resolve, reject) => {
    // 读取文件夹内文件数量
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      }

      if (files.length !== chunkCount) {
        reject("上传失败");
      }

      // 创建写入流
      const writeStream = fs.createWriteStream(filePath);

      function append(currentChunkIndex) {
        return new Promise((res, rej) => {
          if (currentChunkIndex === chunkCount) {
            fs.rmdir(dirPath, (err) => {
              console.log(`切片文件夹: ${dirPath} 已移除`);
            });
            res();
          }

          const chunkPath = dirPath + "/" + currentChunkIndex;

          fs.readFile(chunkPath, (err, data) => {
            if (err) return rej(err);

            fs.appendFile(filePath, data, () => {
              console.log(`当前合并顺序:${currentChunkIndex}`);
              fs.unlink(chunkPath, () => {
                // 递归合并
                res(append(currentChunkIndex + 1));
              });
            });
          });
        });
      }

      append(0).then(() => {
        writeStream.close();
        resolve();
      });
    });
  });
}

/**
 * 存储临时文件
 * @param {string} filePath 上传文件临时地址
 * @param {string} serverPath 服务端存放地址
 * @return {Promise}
 */
function writeFile(filePath, serverPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(serverPath);

    readStream.on("data", (chunkData) => {
      writeStream.write(chunkData, () => {
        console.log(`切片开始写入: ${serverPath}`);
      });
    });

    readStream.on("end", () => {
      writeStream.end("", () => {
        console.log(`切片写入完成: ${serverPath}`);
        resolve();
      });
    });

    readStream.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = {
  mergeFile,
  writeFile,
};
