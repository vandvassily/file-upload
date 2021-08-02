# file-upload

开放性问题： 需完成大文件上传功能，传输速度慢，怎么实现这个功能？

## 需实现的功能

- [ ] 分片上传
- [ ] 断点续传
- [ ] 安全校验
- [ ] 高并发情况

## 技术框架

前端： React
后端： Node + Nginx（负载均衡）

## 参考

[nodejs+koa2实现文件上传大文件切片上传断点续传（服务器端）](https://blog.csdn.net/lixiaosenlin/article/details/114400710)

## Getting Started

Start the dev server,

```bash
$ yarn start
```
