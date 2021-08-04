const chunkSize = 2 * 1024 * 1024; // 切片大小
const blobSlice =
  File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;

/**
 * 加载文件并计算其md5
 * @param {Object} spark 加密库实例
 * @param {Object} file 上传文件对象
 * @param {number} currentChunk 上传文件块索引
 * @param {Function} resolve 上传完成后的回调
 * @param {Function} reject 上传失败后的回调
 */
function loadNext(spark, file, currentChunk, resolve, reject) {
  const fileReader = new FileReader();
  fileReader.onload = function (event) {
    const data = event.target.result;
    spark.append(data);
    file.chunkCount = Math.ceil(file.size / chunkSize);
    if (currentChunk < file.chunkCount - 1) {
      currentChunk++;
      loadNext(spark, file, currentChunk, resolve, reject);
    } else {
      file.complete = true;
      file.md5 = spark.end();
      resolve(file);
    }
  };
  fileReader.onerror = function (event) {
    reject(event.target.error);
  };

  const start = currentChunk * chunkSize;
  const end = start + chunkSize >= file.size ? file.size : start + chunkSize;

  // 使用blob.slice方法，可以指定从哪个位置开始读取
  fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
}

/**
 * 加载文件并计算其md5
 * @export
 * @param {Object} SparkMD5 第三方加密库
 * @param {Object} file 上传文件对象
 * @return {Promise<string>}
 */
export function computeFileMd5(SparkMD5, file) {
  const currentChunk = 0;
  const spark = new SparkMD5.ArrayBuffer();

  return new Promise((resolve, reject) => {
    loadNext(spark, file, currentChunk, resolve, reject);
  });
}
