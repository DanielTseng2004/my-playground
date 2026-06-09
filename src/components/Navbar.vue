<script setup lang="ts">
import { NMenu, NLayoutHeader } from "naive-ui";
import type { MenuOption } from "naive-ui";
import { h, ref, watchEffect } from "vue";
import { RouterLink, useRoute } from "vue-router";

const route = useRoute();

// 讓 activeKey 自動跟隨當前的路由名稱（name）
const activeKey = ref<string | null>("home");
watchEffect(() => {
  activeKey.value = (route.name as string) || "home";
});

const menuOptions: MenuOption[] = [
  {
    label: () =>
      h(RouterLink, { to: { name: "home" } }, { default: () => "首頁" }),
    key: "home",
  },
  {
    label: () =>
      h(RouterLink, { to: { name: "games" } }, { default: () => "遊戲空間" }),
    key: "games",
  },
  {
    label: () =>
      h(RouterLink, { to: { name: "about" } }, { default: () => "關於我們" }),
    key: "about",
  },
];
</script>

<template>
  <n-layout-header
    bordered
    class="navbar"
  >
    <div class="logo">Playground</div>
    <n-menu
      v-model:value="activeKey"
      mode="horizontal"
      :options="menuOptions"
    />
  </n-layout-header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  margin-right: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
