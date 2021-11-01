<script>
import axios from "../utils/axios";

export default {
  methods: {
    handleUpload() {
      if (this.$refs.file.files.length) {
        const file = this.$refs.file.files[0];
        console.log(file);
        this.doUpload({
          url: "/single",
          file,
        });
      }
    },
    doUpload({ url, file, name = "file" }) {
      const formData = new FormData();
      formData.append(name, file);
      formData.append("test", 123);
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
    <input id="uploadFile" type="file" accept="images/*" ref="file" />
    <button id="submit" @click="handleUpload">上传文件</button>
  </div>
</template>
