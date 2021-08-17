import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { message, Button, Progress } from 'antd';
import { computeFileMd5 } from './utils/md5.js';
import asyncPool from 'tiny-async-pool'; // 异步控制

// 引入参数
import { SLICE_CHUNK_SIZE, UPLOAD_SLICE_URL } from './constant';
// 引入请求
import { getUploadedChunks, checkHash, copyFile, mergeChunks } from './api.js';

const userId = 'testUser1';
const poolLimit = 5; // 并发数量

// 拖动复制
function onDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';
}

function App() {
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState(0);
  const [total, setTotal] = useState(Number.MAX_SAFE_INTEGER);

  useEffect(() => {
    setProgress(Number((chunks * 100) / total));
  }, [chunks, total]);

  const handleUploadClick = useCallback(async () => {
    if(file === null) return;
    if (file.md5) {
      await computeFileMd5(file).then((file) => {
        message.info(`${file.name}的hash为: ${file.md5}`);
      });
    }

    const res = await checkHash(file.md5);
    if (res.data) {
      await copyFile(file.md5, userId, file.name).then((res) => {
        setProgress(100);
        message.info(`文件: ${file.name} 秒传成功`);
      });

      return;
    }

    const uploadedChunks = await getUploadedChunks(userId, file.md5).then((res) => {
      return res.data;
    });

    /**
     * 并发控制上传切片数量
     * @param {File} file 文件对象
     * @param {number} poolLimit 单次并发数量
     * @param {number} chunkSize 切片大小
     * @param {Array} uploadedChunks 已上传的分片编号  例如 ['1', '2', '4']
     * @param {string} userId 用户ID
     * @return {Promise}
     */
    const uploadChunksByAsyncPool = async (file, poolLimit, chunkSize, uploadedChunks = [], userId) => {
      const fileSize = file.size;
      const chunkCount = Math.ceil(fileSize / chunkSize);
      const chunks = [];
      const hashName = file.md5;

      setTotal(chunkCount);

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
    };

    /**
     * 上传单一切片
     * @param {FormData} formData 数据
     * @return {Promise}
     */
    const uploadChunk = (formData) => {
      return fetch(UPLOAD_SLICE_URL, {
        method: 'POST',
        body: formData,
      })
        .then((res) => res.json())
        .then(() => {
          setChunks((prev) => prev + 1);
        });
    };

    setChunks(uploadedChunks.length);
    await uploadChunksByAsyncPool(file, poolLimit, SLICE_CHUNK_SIZE, uploadedChunks, userId).then((res) => {
      message.info(`文件: ${file.name} 上传成功`);
    });
  }, [file]);

  const onChange = (e) => {
    const files = e.target.files;
    commonComputeMD5(files[0]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    commonComputeMD5(file);
  };

  function commonComputeMD5(file) {
    setFile(file);
    computeFileMd5(file).then((file) => {
      message.info(`${file.name}的hash为: ${file.md5}`);
      console.log(file.md5);
    });
  }

  return (
    <div className='App'>
      <div className='drag-area' onDrop={onDrop} onDragOver={onDragOver}>
        <input id='drag-upload' type='file' onChange={onChange} style={{ display: 'none' }} />
        <label className='label-center' htmlFor='drag-upload'>
          Click or drag file to this area to upload
        </label>
      </div>
      <div>
        <Button onClick={handleUploadClick}>上传</Button>
      </div>
      <div style={{ display: 'flex' }}>
        <div>{file ? file.name : ''}</div>
        <Progress percent={progress} />
      </div>
    </div>
  );
}

export default App;
