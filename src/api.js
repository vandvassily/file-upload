import { UPLOAD_MERGE_URL, GET_UPLOADED_CHUNKS_URL, CHECK_HASH_URL, COPY_FILE_URL } from './constant';

function fetchPost(url, data) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

/**
 * 获取已上传的切片数组
 * @param {string} userId
 * @param {string} hashName
 * @return {Promise}
 */
export function getUploadedChunks(userId, hashName) {
  return fetchPost(GET_UPLOADED_CHUNKS_URL, { userId, hashName });
}

/**
 * 检查文件hash
 * @param {string} hashName
 * @return {Promise}
 */
export function checkHash(hashName) {
  return fetchPost(CHECK_HASH_URL, { hashName });
}

/**
 * 复制相同文件---秒传
 * @param {string} hashName hash
 * @param {string} userId 用户ID
 * @param {string} fileName 文件名称
 * @return {Promise}
 */
export function copyFile(hashName, userId, fileName) {
  return fetchPost(COPY_FILE_URL, { hashName, userId, fileName });
}

/**
 * 合并接口
 * @param {string} fileName 文件名称
 * @param {string} hashName hash
 * @param {number} chunkCount 切片数量
 * @param {string} userId 用户ID
 * @return {Promise}
 */
export function mergeChunks(fileName, hashName, chunkCount, userId) {
  return fetchPost(UPLOAD_MERGE_URL, { hashName, chunkCount, userId, fileName });
}
