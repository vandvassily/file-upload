const Koa = require('koa');
const Router = require('koa-router');
const cors = require('koa-cors');
const koaBody = require('koa-body');
const path = require('path')
const app = new Koa();
const router = new Router();

// 解决跨域问题
app.use(cors());
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, '../upload/'),
        maxFieldsSize: 200 * 1024 * 1024,
        keepExtensions: true,
        onFileBegin: (name) => {
            console.log(name)
        }
    }
}));

router.post('/upload', async (ctx, next) => {
    console.log(ctx.request.files)
    ctx.body = JSON.stringify({
        code: 0,
        msg: 'upload success'
    })
})

router.get('/', async (ctx) => {
    ctx.body = 'Hello World!';
})

app.use(router.routes());

app.listen(4000, () => {
    console.log('Listening at 4000;')
});
