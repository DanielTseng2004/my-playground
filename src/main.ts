import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // 💡 確保路徑正確指向你的 index.ts 路由設定

const app = createApp(App);

app.use(router); // 💡 這行絕對不能漏掉，必須在 mount 之前

app.mount("#app");
