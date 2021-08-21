# file-upload

开放性问题： 需完成大文件上传功能，传输速度慢，怎么实现这个功能？

## 需实现的功能

- [x] 分片上传
- [x] 断点续传
- [ ] 安全校验
- [x] 文件秒传
- [ ] 高并发情况
- [ ] 多文件上传

## 技术框架

前端： React
后端： Node + Nginx（负载均衡）

## 思路

1. 前端实现选择文件上传，后端接收文件并保存
2. 分片上传
   1. 文件切片改造，并发控制(async-pool)发送切片
   2. 全部发送完成后，发送合并请求
   3. 后端接收保存分片后的数据，保存已上传的编号
   4. 收到合并请求后，读取切片文件，合并保存
3. 断点续传
   1. 前端调用接口，请求已上传的编号，并发控制发送未上传的分片
4. 文件秒传
   1. 前端对内容取 hash，调用后端接口查询是否有相同文件
   2. 后端查询待上传文件是否已被上传过，如果有则复制一份并重命名，没有则开始上传
5. 高并发情况
   1. 服务端多台服务器部署，采用nginx负载均衡，转到同一台服务器（session一致）

### 其他小功能

1. 拖拽上传
2. 改为vite构建项目
3. 改为nodemon启动后端服务

## Getting Started

Start the dev server,

```bash
$ yarn dev
$ yarn server
# or 同时启动前端和后端项目
$ yarn all
```

## 参考

[nodejs+koa2实现文件上传大文件切片上传断点续传（服务器端）](https://blog.csdn.net/lixiaosenlin/article/details/114400710)
[HTML5 File API 配合 Web Worker 计算大文件 SHA3 Hash 值](https://blog.izgq.net/archives/1260/)
[webuploader](https://github.com/fex-team/webuploader)
