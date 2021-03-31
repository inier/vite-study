import { createApp } from "vue";
import App from "./App.vue";
import { log } from "./log.js";
import "./index.css";

log("vite 项目启动成功。");
createApp(App).mount("#app");
