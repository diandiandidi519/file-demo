import SingleFile from "./views/SingleFile.vue";
import MultipleFile from "./views/MultipleFile.vue";
import NotFound from "./views/NotFound.vue";
import BigFile from "./views/BigFile.vue";

/** @type {import('vue-router').RouterOptions['routes']} */
export const routes = [
  { path: "/", component: SingleFile, meta: { title: "单文件" } },
  {
    path: "/single",
    meta: { title: "单文件" },
    component: SingleFile,
  },
  {
    path: "/multiple",
    meta: { title: "多文件" },
    component: MultipleFile,
  },
  {
    path: "/bigfile",
    meta: { title: "大文件" },
    component: BigFile,
  },
  { path: "/:path(.*)", component: NotFound },
];
