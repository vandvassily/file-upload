import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { message, Button, Progress } from 'antd';
import { computeFileMd5 } from './utils/md5.js';
import asyncPool from 'tiny-async-pool'; // 异步控制

// 引入参数
import {
  SLICE_CHUNK_SIZE,
  UPLOAD_SLICE_URL,
  UPLOAD_MERGE_URL,
  GET_UPLOADED_CHUNKS_URL,
  CHECK_HASH_URL,
  COPY_FILE_URL,
} from './constant';

const userId = 'testUser1';
const poolLimit = 5; // 并发数量

function onDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
  console.log('onDragOver');
}

// 获取已上传的切片数组
function getUploadedChunks(userId, hashName) {
  return fetch(GET_UPLOADED_CHUNKS_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      hashName,
    }),
  }).then((res) => res.json());
}

// 检查文件hash
function checkHash(hashName) {
  return fetch(CHECK_HASH_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      hashName,
    }),
  }).then((res) => res.json());
}
// 复制相同文件---秒传
function copyFile(hashName, userId, fileName) {
  return fetch(COPY_FILE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      hashName,
      userId,
      fileName,
    }),
  }).then((res) => res.json());
}

/**
 * 合并接口
 * @param {string} fileName 文件名称
 * @param {string} hashName hash
 * @param {number} chunkCount 切片数量
 * @param {string} userId 用户ID
 * @return {Promise}
 */
function mergeChunks(fileName, hashName, chunkCount, userId) {
  return fetch(UPLOAD_MERGE_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      hashName,
      chunkCount,
      userId,
    }),
  }).then((res) => res.json());
}

function App() {
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState(0);
  const [total, setTotal] = useState(Number.MAX_SAFE_INTEGER);

  useEffect(() => {
    setProgress(parseInt(chunks * 100 / total));
  }, [chunks, total]);

  const handleUploadClick = useCallback(async () => {
    if (!file.md5) {
      await computeFileMd5(file).then((file) => {
        message.info(`${file.name}的hash为: ${file.md5}`);
      });
    }

    const res = await checkHash(file.md5);
    if (res.data) {
      await copyFile(file.md5, userId, file.name).then((res) => {
        setProgress(100)
        message.info(`文件: ${file.name} 秒传成功`);
      });

      return;
    }

    const uploadedChunks = await getUploadedChunks(userId, file.md5).then(
      (res) => {
        return res.data;
      },
    );

    setChunks(uploadedChunks.length);
    return await uploadChunksByAsyncPool(
      file,
      poolLimit,
      SLICE_CHUNK_SIZE,
      uploadedChunks,
      userId,
    );
  }, [file]);

  const onChange = useCallback((e) => {
    const files = e.target.files;
    const file = files[0];
    setFile(file);

    computeFileMd5(file).then((file) => {
      message.info(`${file.name}的hash为: ${file.md5}`);
      console.log(file.md5);
    });
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    console.log(file);
    setFile(file);
    [].forEach.call(e.dataTransfer.files, (file) => {
      computeFileMd5(file).then((file) => {
        message.info(`${file.name}的hash为: ${file.md5}`);
        console.log(file.md5);
      });
    });
  };

  /**
   * 并发控制上传切片数量
   * @param {File} file 文件对象
   * @param {number} poolLimit 单次并发数量
   * @param {number} chunkSize 切片大小
   * @param {Array} uploadedChunks 已上传的分片编号  例如 ['1', '2', '4']
   * @param {string} userId 用户ID
   * @return {Promise}
   */
  async function uploadChunksByAsyncPool(
    file,
    poolLimit,
    chunkSize,
    uploadedChunks = [],
    userId,
  ) {
    const fileSize = file.size;
    const chunkCount = Math.ceil(fileSize / chunkSize);
    const chunks = [];
    const hashName = file.md5;

    setTotal(chunkCount)

    for (let i = 0; i < chunkCount; i++) {
      // 如果切片存在，则跳过
      if (uploadedChunks.length > 0 && uploadedChunks.includes(i + '')) {
        continue;
      }
      const start = i * chunkSize;
      const end = start + chunkSize;
      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('userId', userId);
      formData.append('sliceIndex', i);
      formData.append('hashName', hashName);
      chunks.push(formData);
    }
    await asyncPool(poolLimit, chunks, uploadChunk);

    // 调用合并接口
    return mergeChunks(file.name, hashName, chunkCount, userId);
  }

  /**
   * 上传单一切片
   * @param {FormData} formData 数据
   * @return {Promise}
   */
  const uploadChunk = (formData) => {
    return fetch(UPLOAD_SLICE_URL, {
      method: 'POST',
      body: formData,
    }).then((res) => res.json()).then(() => {
      setChunks(prev => prev + 1)
    });
  };

  return (
    <div className="App">
      <div
        className="drag-area"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <input
          id="drag-upload"
          type="file"
          onChange={onChange}
          style={{ display: 'none' }}
        />
        <label className="label-center" htmlFor="drag-upload">
          Click or drag file to this area to upload
        </label>
      </div>
      <div>
        <Button onClick={handleUploadClick}>上传</Button>
      </div>
      <div>
        <Progress percent={progress} />
      </div>
    </div>
  );
}

export default App;
