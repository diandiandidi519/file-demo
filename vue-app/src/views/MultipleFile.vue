<script>
import axios from "../utils/axios";

export default {
  methods: {
    handleUpload() {
      if (this.$refs.file.files.length) {
        const files = this.$refs.file.files;
        console.log(files);
        this.doUpload({
          url: "/multiple",
          files: Array.from(files),
        });
      }
    },
    doUpload({ url, files, name = "file" }) {
      const formData = new FormData();
      for (let file of files) {
        formData.append(name, file);
      }
      axios
        .post(url, formData, {
          onUploadProgress: function (progressEvent) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            console.log(percentCompleted);
          },
        })
        .then((res) => {
          console.log(res);
        });
    },
  },
};
</script>
<template>
  <div>
    <input id="uploadFile" type="file" accept="images/*" ref="file" multiple />
    <button id="submit" @click="handleUpload">上传文件</button>
  </div>
</template>
