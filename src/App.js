import "./App.css";
import { message, Button } from "antd";
import { computeFileMd5 } from "./utils/compute_file_md5.js";
import SparkMD5 from "spark-md5";

const upload_url = "http://localhost:4000/upload";

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

const onSubmit = (e) => {
  console.log(_files);
  const fd = new FormData();
  fd.append("file", _files[0]);
  fd.append("userId", "zhs");
  fetch(upload_url, {
    method: "post",
    body: fd,
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
    });
};

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
