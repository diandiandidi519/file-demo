
<template>
  <div>
    <header class="bg-white shadow">
      <RouterLink to="/single"> 单文件上传</RouterLink>
      <RouterLink to="/multiple"> 多文件上传</RouterLink>
      <RouterLink to="/bigfile"> 大文件上传</RouterLink>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>
