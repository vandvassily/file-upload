// hash计算的切片大小
export const HASH_CHUNK_SIZE = 2 * 1024 * 1024;

// 文件切片大小
export const SLICE_CHUNK_SIZE = 2 * 1024 * 1024;

const API_URL = `http://${window.location.hostname}:4000/`;

// 请求地址
// 切片上传
export const UPLOAD_SLICE_URL = API_URL + "upload-slice";
// 合并接口
export const UPLOAD_MERGE_URL = API_URL + "upload-merge";
// 获取已上传的chunks数组
export const GET_UPLOADED_CHUNKS_URL = API_URL + "get-uploaded-chunks";
// 获取已上传的chunks数组
export const COPY_FILE_URL = API_URL + "copy-file";
// 检查服务端是否存在相同hash的文件
export const CHECK_HASH_URL = API_URL + "check-hash";