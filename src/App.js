import './App.css';
import { Upload, message, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const upload_url = 'http://localhost:4000/upload';

const props = {
  name: 'file',
  action: upload_url,
  headers: {
    authorization: 'authorization-text',
  },
  onChange(info) {
    console.log(info);
    if (info.file.status !== 'uploading') {
      console.log(info.file, info.fileList);
    }
    if (info.file.status === 'done') {
      message.success(`${info.file.name} file uploaded successfully`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  },
};

let _files = null;

function print(e) {
  const files = e.target.files;
  console.log(this)
  _files = files; 
  // this.files = files;
  const test = files[0];
  // console.log(test);
  // test.text().then((res) => {
  //   console.log(res);
  // });
}

const onSubmit = (e) => {
  console.log(_files)
  const fd = new FormData();
  fd.append('file', _files[0])
  fd.append('userId', 'zhs');
  fetch(upload_url, {
    method: 'post',
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
      <div>
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>Click to Upload</Button>
        </Upload>
      </div>
      <div>
        <input type="file" id="" onChange={print.bind(this)} />
      </div>
      <div>
        <Button onClick={onSubmit}>上传</Button>
      </div>
    </div>
  );
}

export default App;
