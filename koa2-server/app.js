const Koa = require("koa");
const logger = require("koa-logger");
const serve = require("koa-static");
const koaBody = require("koa-body");
const cors = require("koa2-cors");

const os = require("os");
const path = require("path");
const fs = require("fs");

const app = new Koa();

const upload = require("./router/upload");

app.use(koaBody({ multipart: true }));

// log requests
app.use(logger());

// 支持跨域
app.use(cors());

// serve files from ./public

app.use(serve(path.join(__dirname, "/public")));

// 加载路由中间件
app.use(upload.routes()).use(upload.allowedMethods());

app.listen(3001);
console.log("now is starting at port 3001");
