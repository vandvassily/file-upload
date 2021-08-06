import "./App.css";
import { message, Button } from "antd";
import { computeFileMd5 } from "./utils/compute_file_md5.js";
import SparkMD5 from "spark-md5";

const UPLOAD_URL = "http://localhost:4000/upload";
const UPLOAD_SLICE_URL = "http://localhost:4000/upload-slice";
const COMBINE_URL = "http://localhost:4000/upload-merge";
const TEST_USER = "test";
const SLICE_SIZE = 2 * 1024 * 1024;

let _files = null;

function onChange(e) {
  const files = e.target.files;
  _files = files;
  const file = files[0];
  computeFileMd5(SparkMD5, file).then((file) => {
    message.info(`${file.name}的hash为: ${file.md5}`);
    console.log(file.md5);
  });
}

function onDrag() {
  console.log("onDrag");
}

function onDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log(e.dataTransfer.files);
  _files = e.dataTransfer.files;
  [].forEach.call(e.dataTransfer.files, (file) => {
    computeFileMd5(SparkMD5, file).then((file) => {
      message.info(`${file.name}的hash为: ${file.md5}`);
      console.log(file.md5);
    });
  });
}

function onDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = "copy";
  console.log("onDragOver");
}

function onDragEnter(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log("onDragEnter");
}

function onDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log("onDragLeave");
}

// 上传按钮点击事件
function onSubmit(e) {
  console.log(_files);
  uploadChunksByPromiseAll(_files[0], SLICE_SIZE, TEST_USER).then((res) => {
    message.success(res.msg);
  });
  // uploadFile(_files, TEST_USER);
}

/**
 * 文件上传
 * @param {FileList} files 上传的文件对象列表
 * @param {Object} userId 上传用户的id
 */
function uploadFile(files, userId) {
  if (!files || files.length === 0) {
    message.error("请先选择文件");
    return;
  }

  if (!userId) {
    message.error("请输入userId");
    return;
  }
  // 先实现一个简单的上传
  const formData = new FormData();
  // TODO: 改造为多文件上传
  formData.append("file", _files[0]);
  formData.append("userId", TEST_USER);
  // for (let i = 0; i < files.length; i++) {
  //   formData.append("file", files[i]);
  // }
  fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((res) => {
      if (res.code === 0) {
        message.success(res.msg);
      } else {
        message.error(res.msg);
      }
    })
    .catch((err) => {
      message.error(`${err}`);
    });
}

async function uploadChunksByPromiseAll(file, chunkSize, userId) {
  const fileSize = file.size;
  const chunkCount = Math.ceil(fileSize / chunkSize);
  const chunks = [];
  const prefixFileName = file.name.split(".")[0];

  for (let i = 0; i < chunkCount; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunk = file.slice(start, end);
    const formData = new FormData();
    formData.append("file", chunk);
    formData.append("userId", userId);
    formData.append("sliceIndex", i);
    formData.append("prefixFileName", prefixFileName);
    chunks.push(uploadSlicedChunk(formData, userId));
  }
  await Promise.all(chunks);

  // 文件名字为带后缀的
  return combineSlicedChunks(file.name, prefixFileName, chunkCount, userId);
}

function uploadSlicedChunk(formData, userId) {
  return fetch(UPLOAD_SLICE_URL, {
    method: "POST",
    body: formData,
  }).then((res) => res.json());
}

// send a combine request
function combineSlicedChunks(fileName, prefixFileName, chunkCount, userId) {
  return fetch(COMBINE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fileName,
      prefixFileName,
      chunkCount,
      userId,
    }),
  }).then((res) => res.json());
}

function App() {
  return (
    <div className="App">
      <div
        className="drag-area"
        onDrag={onDrag}
        onDrop={onDrop}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          id="drag-upload"
          type="file"
          onChange={onChange}
          style={{ display: "none" }}
        />
        <label className="label-center" htmlFor="drag-upload">
          Click or drag file to this area to upload
        </label>
      </div>
      <div>
        <Button onClick={onSubmit}>上传</Button>
      </div>
    </div>
  );
}

export default App;
