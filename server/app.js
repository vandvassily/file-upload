const Koa = require("koa");
const fs = require("fs");
const Router = require("koa-router");
const cors = require("koa-cors");
const koaBody = require("koa-body");
const path = require("path");
const app = new Koa();
const router = new Router();

const PORT = process.env.PORT || 4000;
const UPLOAD_PATH = path.join(__dirname, "../upload");

// 解决跨域问题
app.use(cors());
app.use(
  koaBody({
    multipart: true,
    // formidable: {
    // uploadDir: path.join(__dirname, '../upload/'),
    // maxFieldsSize: 200 * 1024 * 1024,
    // keepExtensions: true,
    // onFileBegin: (name) => {
    //     console.log(name)
    // }
    // }
  })
);

// 单片上传
router.post("/upload-slice", async (ctx, next) => {
  const { file } = ctx.request.files;
  const { userId, prefixFileName, sliceIndex } = ctx.request.body;
  if (!userId) {
    ctx.body = {
      code: 400,
      msg: "用户id不能为空",
    };
    return;
  }
  const dirPath = path.join(UPLOAD_PATH, userId, prefixFileName);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }
  const serverPath = path.join(dirPath, sliceIndex);
  await writeFile(file.path, serverPath);

  ctx.body = {
    code: 0,
    msg: "upload success",
  };
});

// 合并请求
router.post("/upload-merge", async (ctx, next) => {
  const { userId, fileName, prefixFileName, chunkCount } = ctx.request.body;
  const filePath = path.join(UPLOAD_PATH, userId, fileName);
  const dirPath = path.join(UPLOAD_PATH, userId, prefixFileName);

  await mergeFile(dirPath, filePath, chunkCount)
    .then(() => {
      ctx.body = {
        code: 0,
        msg: "upload success",
      };
    })
    .catch((err) => {
      ctx.body = {
        code: 0,
        msg: err,
      };
    });
});

/**
 * 切片文件合并
 */
function mergeFile(dirPath, filePath, chunkCount) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        reject(err);
      }

      if (files.length !== chunkCount) {
        reject("上传失败");
      }

      const writeStream = fs.createWriteStream(filePath);

      function append(currentChunkIndex) {
        return new Promise((res, rej) => {
          if (currentChunkIndex === chunkCount) {
            fs.rmdir(dirPath, (err) => {
              console.log(err, "rmdir");
            });
            res();
          }

          const chunkPath = dirPath + '/' + currentChunkIndex;

          fs.readFile(chunkPath, (err, data) => {
            if (err) return rej(err);

            fs.appendFile(filePath, data, () => {
              console.log(`当前合并顺序:${currentChunkIndex}`)
              fs.unlink(chunkPath, () => {
                // 递归合并
                res(append(currentChunkIndex + 1));
              });
            });
          });
        });
      }

      append(0).then(() => {
        writeStream.close();
        resolve();
      });
    });
  });
}

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
  const serverPath = path.join(UPLOAD_PATH, userId, name);
  await writeFile(file.path, serverPath);

  ctx.body = {
    code: 0,
    msg: "upload success",
  };
});

// 写入文件
function writeFile(filePath, serverPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(serverPath);

    readStream.on("data", (chunkData) => {
      writeStream.write(chunkData, () => {
        console.log(`开始写入`);
      });
    });

    readStream.on("end", () => {
      writeStream.end("", () => {
        console.log("写入完成");
        resolve();
      });
    });

    readStream.on("error", (err) => {
      reject(err);
    });
  });
}

router.get("/", async (ctx) => {
  ctx.body = "Hello World!";
});

app.use(router.routes());

app.listen(PORT, () => {
  console.log(`Listening at ${PORT};`);
});
