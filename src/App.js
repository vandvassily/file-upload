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

function print(e) {
  const files = e.target.files;
  const test = files[0];
  console.log(test);
  test.text().then((res) => {
    console.log(res);
  });
  console.log(test.stream());
}

const btnOnClick = (e) => {
  fetch(upload_url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify({
      name: 'zhs'
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res);
    });
};

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>Click to Upload</Button>
        </Upload>
        <input type="file" id="" onChange={print} />
        <Button onClick={btnOnClick}>click test</Button>
      </header>
    </div>
  );
}

export default App;
