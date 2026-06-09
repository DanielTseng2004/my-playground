<script setup lang="ts">
import {
  NConfigProvider,
  NLayout,
  NLayoutContent,
  NMessageProvider,
} from "naive-ui";
import { RouterView } from "vue-router"; // 💡 引入 RouterView
import Navbar from "./components/Navbar.vue";
</script>

<template>
  <n-config-provider>
    <n-message-provider>
      <n-layout class="app-layout">
        <Navbar />

        <n-layout-content class="main-content">
          <router-view />
        </n-layout-content>
      </n-layout>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* 全域樣式重置 */
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

body {
  font-family:
    v-sans,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.app-layout {
  min-height: 100vh;
  width: 100vw;
}

.main-content {
  width: 100%;
  min-height: calc(100vh - 64px);
}

.page-wrapper {
  width: 100%;
  margin: 0;
  padding: 0;
}

.placeholder {
  text-align: center;
  padding: 100px 0;
  color: #666;
  background-color: #f5f7f9;
  min-height: 100vh;
}
</style>
