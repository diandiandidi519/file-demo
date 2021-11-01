const Router = require("koa-router");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { readdir } = require("fs/promises");
const fse = require("fs-extra");

const upload = new Router({
  prefix: "/upload",
});

const TMP_DIR = path.join(__dirname, "../public/tmp"); // 临时目录
const UPLOAD_DIR = path.join(__dirname, "../public/upload");
const URL = "http://localhost:3001";

upload.post("/single", async (ctx, next) => {
  const file = ctx.request.files.file;
  // 创建可读流
  const readStream = fs.createReadStream(file.path);
  const filePath = path.join(UPLOAD_DIR, file.name);
  // 创建可写流
  const writeStream = fs.createWriteStream(filePath);
  // 可读流通过管道写入可写流
  readStream.pipe(writeStream);
  ctx.body = {
    code: 0,
    message: "",
    data: {
      url: `${URL}/${file.name}`,
    },
  };
});
upload.post("/multiple", async (ctx, next) => {
  const files = ctx.request.files;
  const urls = [];
  console.log(files);
  for (let file of files) {
    // 创建可读流
    const readStream = fs.createReadStream(file.path);
    const filePath = path.join(UPLOAD_DIR, file.name);
    // 创建可写流
    const writeStream = fs.createWriteStream(filePath);
    // 可读流通过管道写入可写流
    readStream.pipe(writeStream);
    urls.push(`${URL}/${file.name}`);
  }

  ctx.body = {
    code: 0,
    message: "",
    data: {
      urls,
    },
  };
});

upload.post("/chunk", async (ctx, next) => {
  const file = ctx.request.files.file;
  const chunkId = ctx.request.body.id;
  const fileMd5 = ctx.request.body.md5;
  console.log(file);
  const filePath = path.join(TMP_DIR, fileMd5);
  // 判断文件夹
  await fse.ensureDir(filePath);
  const chunkPath = path.join(filePath, chunkId);

  await fse.move(file.path, chunkPath);
  // const writeStream = fs.createWriteStream(path.join(filePath, chunkId));
  ctx.body = {
    code: 0,
    data: {
      path: chunkPath,
      size: file.size,
    },
  };
});
/**
 * 判断文件存在 如果存在，返回url，不存在返回对应的分片id
 */

upload.post("/exists", async (ctx) => {
  const { name: fileName, md5: fileMd5 } = ctx.request.body;
  const filePath = path.join(UPLOAD_DIR, fileName);
  const isExits = await fse.pathExists(filePath);
  // 判断当前文件是否存在
  if (isExits) {
    // 存在直接返回地址
    ctx.body = {
      status: "success",
      data: {
        isExists: true,
        url: `${URL}/${fileName}`,
      },
    };
  } else {
    //不存在判断一下当前chunk是否存在
    let chunksIds = [];
    const chunksPath = path.join(TMP_DIR, fileMd5);
    console.log(chunksPath);
    const hasChunksPath = await fse.pathExists(chunksPath);
    if (hasChunksPath) {
      // 返回目录中的文件名称组成的数组
      chunksIds = await readdir(chunksPath);
      console.log(chunksIds);
    }
    ctx.body = {
      status: "success",
      data: {
        isExists: false,
        chunksIds,
      },
    };
  }
});

/**
 * 合并分片
 */
upload.post("/merge", async (ctx) => {
  const { name: fileName, md5: fileMd5 } = ctx.request.body;
  await concatFiles(
    path.join(TMP_DIR, fileMd5),
    path.join(UPLOAD_DIR, fileName)
  );
  ctx.body = {
    status: "success",
    data: {
      url: `${URL}/${fileName}`,
    },
  };
});

async function concatFiles(sourceDir, targetPath) {
  const readFile = (file, ws) =>
    new Promise((resolve, reject) => {
      fs.createReadStream(file)
        .on("data", (data) => ws.write(data))
        .on("end", resolve)
        .on("error", reject);
    });
  // 读取该文件的所有分片
  const files = await readdir(sourceDir);
  // 按照序号进行排序
  const sortedFiles = files.sort((a, b) => a - b);
  // 创建一个可写流
  const writeStream = fs.createWriteStream(targetPath);
  for (const file of sortedFiles) {
    let filePath = path.join(sourceDir, file);
    await readFile(filePath, writeStream);
    await fse.remove(filePath);
  }
  writeStream.end();
}
module.exports = upload;
