const Koa = require('koa');
const fs = require('fs');
const Router = require('koa-router');
const cors = require('koa-cors');
const koaBody = require('koa-body');
const path = require('path');
const app = new Koa();
const router = new Router();

const PORT = process.env.PORT || 4000;

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
  }),
);

// 单片上传
router.post('/upload-slice', async (ctx, next) => {
  const { file } = ctx.request.files;
  const { userId, sliceName, sliceIndex } = ctx.request.body;
  if(!userId) {
    ctx.body = {
      code: 400,
      msg: "用户id不能为空",
    };
    return;
  }
  if (!fs.existsSync(path.join(__dirname, "../upload/", userId))) {
    fs.mkdirSync(path.join(__dirname, "../upload/", userId));
  }
  const serverPath = path.join(__dirname, "../upload/", userId, sliceName);
  await writeFile(file.path, serverPath);

  ctx.body = {
    code: 0,
    msg: 'upload success',
  };
});

// 合并请求
router.post("/upload-combine", async (ctx, next) => {
  const { userId, fileName, chunkCount } = ctx.request.body;
  const filePath = path.join(__dirname, "../upload/", userId, fileName);

  const writeStream = fs.createWriteStream(filePath);

  
  function append(i) {
    
  }
  // if (!fs.existsSync(path.join(__dirname, "../upload/", userId))) {
  //   fs.mkdirSync(path.join(__dirname, "../upload/", userId));
  // }
  // const serverPath = path.join(__dirname, "../upload/", userId, sliceName);
  // await writeFile(file.path, serverPath);

  // ctx.body = {
  //   code: 0,
  //   msg: "upload success",
  // };
});

// 整个文件上传
router.post('/upload', async (ctx, next) => {
  const { file } = ctx.request.files;
  const { name } = file;
  const { userId } = ctx.request.body;
  if(!userId) {
    ctx.body = {
      code: 400,
      msg: "用户id不能为空",
    };
    return;
  }
  if (!fs.existsSync(path.join(__dirname, "../upload/", userId))) {
    fs.mkdirSync(path.join(__dirname, "../upload/", userId));
  }
  const serverPath = path.join(__dirname, '../upload/', userId, name);
  await writeFile(file.path, serverPath);

  ctx.body = {
    code: 0,
    msg: 'upload success',
  };
});

// 写入文件
function writeFile(filePath, serverPath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(serverPath);

    readStream.on('data', (chunkData) => {
      writeStream.write(chunkData, () => {
        console.log(`开始写入`);
      });
    });

    readStream.on('end', () => {
        writeStream.end('end', () => {
            console.log('写入完成');
            resolve();
        })
    });

    readStream.on('error', (err) => {
        reject(err);
    });
  });
}

router.get('/', async (ctx) => {
  ctx.body = 'Hello World!';
});

app.use(router.routes());

app.listen(PORT, () => {
  console.log(`Listening at ${PORT};`);
});
