const fs = require("fs");

/**
 * 切片文件合并
 * @param {string} dirPath 切片所在的文件夹
 * @param {string} targetFilePath 目标文件路径
 * @param {number} chunkCount 切片数量
 * @return {Promise}
 */
function mergeFile(dirPath, targetFilePath, chunkCount) {
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
      const writeStream = fs.createWriteStream(targetFilePath);

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

            fs.appendFile(targetFilePath, data, () => {
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
 * @param {string} sourceFilePath 上传文件临时地址
 * @param {string} targetFilePath 服务端存放地址
 * @return {Promise}
 */
function writeFile(sourceFilePath, targetFilePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(sourceFilePath);
    const writeStream = fs.createWriteStream(targetFilePath);

    readStream.on("data", (chunkData) => {
      writeStream.write(chunkData, () => {
        console.log(`切片开始写入: ${sourceFilePath}`);
      });
    });

    readStream.on("end", () => {
      writeStream.end("", () => {
        console.log(`文件写入完成: ${targetFilePath}`);
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
