import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // router/index.ts 局部片段
  routes: [
    {
      path: "/",
      name: "home",
      // 💡 建議改成指向新建立的 HomeView.vue
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/games",
      name: "games",
      component: () => import("../views/GamesView.vue"),
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
    },
  ],
});

export default router;
