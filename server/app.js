const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const cors = require("koa-cors");
const koaBody = require("koa-body");
const serve = require('koa-static');
const log4js = require("./logger.js");
const fileHandle = require('./file.js');
const { getSameFileDir, insertToDB } = require("./db.js");

const PORT = process.env.PORT || 4000;
const UPLOAD_PATH = path.join(__dirname, "../upload");
// 创建临时文件存放目录
const tempUploadDir = path.join(__dirname, "../upload-temp/");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir);
}

const app = new Koa();
const router = new Router();

// 静态化上传目录，通过url可以访问
app.use(serve('./upload', {
  maxage: 60 * 1000,
}));
// 解决跨域问题
app.use(cors());
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: tempUploadDir, // 前端文件默认缓存存储的位置
      // maxFieldsSize: 200 * 1024 * 1024,
      // keepExtensions: true,
      // onFileBegin: (name) => {
      //     console.log(name)
      // }
    },
  })
);

// 检查服务端数据库是否用相同hash的文件
router.post("/check-hash", async (ctx, next) => {
  const { hashName } = ctx.request.body;
  const dirPath = getSameFileDir(hashName);

  ctx.body = {
    code: 0,
    data: !!dirPath,
    msg: dirPath ? '拥有相同文件' : "未有相同文件",
  };
})

// 文件秒传
router.post("/copy-file", async (ctx, next) => {
  const { userId, hashName, fileName } = ctx.request.body;
  const dirPath = getSameFileDir(hashName);

  if (!dirPath) {
    ctx.body = {
      code: 500,
      msg: "服务器错误",
    };
    return;
  }

  const targetDir = path.join(UPLOAD_PATH, userId)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const sourceFilePath = path.join(UPLOAD_PATH, dirPath);
  const targetFilePath = path.join(UPLOAD_PATH, userId, fileName);
  await fileHandle.writeFile(sourceFilePath, targetFilePath);

  const resUrl = userId + '/' + fileName;
  ctx.body = {
    code: 0,
    data: resUrl,
    msg: "秒传成功",
  };
});

// 获取已上传的切片编号
router.post("/get-uploaded-chunks", async (ctx, next) => {
  const { userId, hashName } = ctx.request.body;
  const dirPath = path.join(UPLOAD_PATH, userId, hashName);
  if (!fs.existsSync(dirPath)) {
    ctx.body = {
      code: 0,
      data: [],
      msg: "未上传",
    };
  } else {
    const arr = fs.readdirSync(dirPath);
    ctx.body = {
      code: 0,
      data: arr,
      msg: "获取成功",
    };
  }
});

// 单片上传
router.post("/upload-slice", async (ctx, next) => {
  const { file } = ctx.request.files;
  const { userId, hashName, sliceIndex } = ctx.request.body;
  if (!userId) {
    ctx.body = {
      code: 400,
      msg: "用户id不能为空",
    };
    return;
  }
  const dirPath = path.join(UPLOAD_PATH, userId, hashName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const targetFilePath = path.join(dirPath, sliceIndex);
  await fileHandle.writeFile(file.path, targetFilePath).catch((err) => {
    fs.unlink(targetFilePath, () => {
      console.log(`已删除未完成的切片: ${targetFilePath}`);
    });
  });

  ctx.body = {
    code: 0,
    msg: "upload success",
  };
});

// 合并请求
router.post("/upload-merge", async (ctx, next) => {
  const { userId, fileName, hashName, chunkCount } = ctx.request.body;
  const filePath = path.join(UPLOAD_PATH, userId, fileName);
  const dirPath = path.join(UPLOAD_PATH, userId, hashName);

  await fileHandle.mergeFile(dirPath, filePath, chunkCount)
    .then(() => {
      const resUrl = userId + '/' + fileName;
      // 数据库json插入数据
      insertToDB(hashName, {
        userId,
        filePath: resUrl,
      });
      ctx.body = {
        code: 0,
        data: resUrl,
        msg: "upload success",
      };
    })
    .catch((err) => {
      ctx.body = {
        code: 500,
        msg: err,
      };
    });
});

// 整个文件上传
router.post("/upload", async (ctx, next) => {
  const { file } = ctx.request.files;
  const { name } = file;
  const { userId } = ctx.request.body;
  if (!userId) {
    ctx.body = {
      code: 400,
      msg: "用户id不能为空",
    };
    return;
  }
  if (!fs.existsSync(path.join(UPLOAD_PATH, userId))) {
    fs.mkdirSync(path.join(UPLOAD_PATH, userId));
  }
  const targetFilePath = path.join(UPLOAD_PATH, userId, name);
  await fileHandle.writeFile(file.path, targetFilePath);

  ctx.body = {
    code: 0,
    msg: "upload success",
  };
});

router.get("/", async (ctx) => {
  ctx.body = "Hello World!";
});

app.use(router.routes());

// 处理异常情况，记录异常日志
app.on("error", (err, ctx) => {
  log4js.logError(err);
});

//监听未捕获的异常
process.on("uncaughtException", function (err) {
  console.log(`未捕获的异常: ${JSON.stringify(err)}`);
});

//监听Promise没有被捕获的失败函数
process.on("unhandledRejection", function (err) {
  console.log(`未捕获的promise异常: ${JSON.stringify(err)}`);
});

app.listen(PORT, () => {
  console.log(`Listening at ${PORT};`);
});
