<script>
import axios from "../utils/axios";
import SparkMD5 from "spark-md5";

export default {
  methods: {
    async asyncPool(poolLimit, array, iteratorFn) {
      const ret = []; // 存储所有的异步任务
      const executing = []; // 存储正在执行的异步任务
      for (const item of array) {
        // 调用iteratorFn函数创建异步任务
        const p = Promise.resolve().then(() => iteratorFn(item, array));
        ret.push(p); // 保存新的异步任务

        // 当poolLimit值小于或等于总任务个数时，进行并发控制
        if (poolLimit <= array.length) {
          // 当任务完成后，从正在执行的任务数组中移除已完成的任务
          const e = p.then(() => executing.splice(executing.indexOf(e), 1));
          executing.push(e); // 保存正在执行的异步任务
          if (executing.length >= poolLimit) {
            await Promise.race(executing); // 等待较快的任务执行完成
          }
        }
      }
      return Promise.all(ret);
    },
    readFile(fileReader, file) {
      return (start, end) => {
        return new Promise((resolve, reject) => {
          fileReader.onload = (e) => {
            console.log("read chunk: ", start, end);
            resolve(e.target.result);
          };
          fileReader.onerror = (e) => {
            reject(e);
            fileReader.abort();
          };
          fileReader.readAsArrayBuffer(file.slice(start, end));
        });
      };
    },
    // 计算MD5值
    calculateMd5(file) {
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        const chunkSize = 2 * 1024 * 1024;
        const spark = new SparkMD5.ArrayBuffer();
        const chunksNumber = Math.ceil(file.size / chunkSize);
        const readPromise = this.readFile(fileReader, file);
        [...new Array(chunksNumber).keys()]
          .reduce((prev, curr) => {
            return prev.then(() => {
              const start = curr * chunkSize;
              const end = Math.min(start + chunkSize, file.size);
              return readPromise(start, end).then((result) => {
                spark.append(result);
              });
            });
          }, Promise.resolve())
          .then(() => {
            resolve(spark.end());
          })
          .catch(reject);
      });
    },
    // 检查有没有上传过
    checkUploaded(params) {
      return axios.post("/exists", params).then((res) => res.data);
    },
    // 合并操作
    mergeFile(params) {
      return axios.post("/merge", params).then((res) => res.data);
    },
    // 上传分块
    uploadChunk(params) {
      return axios.post("/chunk", params).then((res) => res.data);
    },
    // 处理上传按钮
    handleUpload() {
      if (this.$refs.file.files.length) {
        const file = this.$refs.file.files[0];
        console.log(file);
        this.handleFile(file);
      } else {
        alert("请选择文件");
      }
    },
    // 真正的处理文件
    async handleFile(file) {
      // 计算MD5
      const md5 = await this.calculateMd5(file);
      // 查看当前文件有没有上传过
      const fileStatus = await this.checkUploaded({
        name: file.name,
        md5,
      });
      const { chunksIds = [], isExists } = fileStatus.data;
      if (!isExists) {
        // 不存在上传
        await this.handleChunk(file, chunksIds, md5);
      }
      await this.mergeFile({
        name: file.name,
        md5,
      });
    },
    async handleChunk(file, chunksIds, md5) {
      const size = file.size;
      const name = file.name;
      const chunkSize = 1 * 1024 * 1024;
      const limit = 3;
      const chunksNumber = Math.ceil(size / chunkSize);
      const formDataInfo = [...new Array(chunksNumber).keys()]
        .filter((x) => chunksIds.indexOf(x + "") < 0)
        .map((id) => {
          const form = new FormData();
          const start = id * chunkSize;
          const end = Math.min((id + 1) * chunkSize, size);
          form.append("file", file.slice(start, end), `${md5}_${id}`);
          form.append("id", id);
          form.append("md5", md5);
          form.append("name", name);
          form.append("timestamp", Date.now());
          return form;
        });
      return this.asyncPool(limit, formDataInfo, this.uploadChunk);
    },
  },
};
</script>
<template>
  <div>
    <input id="uploadFile" type="file" ref="file" />
    <button id="submit" @click="handleUpload">上传文件</button>
  </div>
</template>
