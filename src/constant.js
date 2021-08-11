// hash计算的切片大小
export const HASH_CHUNK_SIZE = 2 * 1024 * 1024;

// 文件切片大小
export const SLICE_CHUNK_SIZE = 2 * 1024 * 1024;

const HOST = `http://${window.location.hostname}:4000/`;

// 请求地址
// 切片上传
export const UPLOAD_SLICE_URL = HOST + "upload-slice";
// 合并接口
export const UPLOAD_MERGE_URL = HOST + "upload-merge";