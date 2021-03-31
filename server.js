// 用最传统的方式

const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const compilerSfc = require("@vue/compiler-sfc");
const compilerDom = require("@vue/compiler-dom");

const app = new Koa();

function rewriteImport(content) {
  // from 'xx'
  // from "xx"
  // 第三方模块做语法解析，仕最靠谱的
  return content.replace(/from ['"]([^'"]+)['"]/g, function (s0, s1) {
    // import a from './c.js'不需要改写
    // 只改写需要去node_module找的
    if (s1[0] !== "." && s1[0] !== "/") {
      return `from '/@modules/${s1}'`;
    }
    return s0;
  });
}

// html
function htmlAction(ctx, url) {
  ctx.type = "text/html";
  ctx.body = fs.readFileSync("./index.html", "utf-8");
}

// modules
function moduleAction(ctx, url, query) {
  // 找到 node_modules 内的文件夹
  const prefix = path.resolve(
    __dirname,
    "node_modules",
    url.replace("/@modules/", "")
  );
  // 获取 package.json 内的 module 属性
  const module = require(prefix + "/package.json").module;
  const p = path.resolve(prefix, module);
  console.log("p", p);
  // 读取文件
  const res = fs.readFileSync(p, "utf-8");
  ctx.type = "application/javascript";
  // 读取的文件内还通过 import 导入了其他的依赖，继续把路径替换为 /@modules/
  ctx.body = rewriteImport(res);
}

// style: css
function styleActionCss(ctx, url) {
  const p = path.resolve(__dirname, url.slice(1));
  const file = fs.readFileSync(p, "utf-8");
  const content = `
    const css = ${JSON.stringify(file.replace(/\n/g, ""))};
    let link = document.createElement('style');
    link.setAttribute('type','text/css');
    document.head.appendChild(link);
    link.innerHTML = css;
    export default css;
  `;

  ctx.type = "application/javascript";
  ctx.body = content;
}

// script: js
function scriptActionJs(ctx, url, query) {
  // 处理 js 文件
  const p = path.resolve(__dirname, url.slice(1));
  const content = fs.readFileSync(p, "utf-8");
  ctx.type = "application/javascript";
  // 返回替换路径后的文件
  // import xx ffrom 'vue'; 改造成 import xx from '/@module/vue'
  ctx.body = rewriteImport(content);
}

// script: vue单文件组件
function scriptActionVue(ctx, url, query) {
  const p = path.resolve(__dirname, url.split("?")[0].slice(1));
  const { descriptor } = compilerSfc.parse(fs.readFileSync(p, "utf-8"));

  // 这是script
  if (!query.type) {
    ctx.type = "application/javascript";
    ctx.body = `
      // 拿到 script 的内容
      ${rewriteImport(descriptor.script.content).replace(
        "export default",
        "const __script= "
      )}

      // 如果有 style 就发送请求获取 style 的部分
      ${descriptor.styles.length ? `import "${url}?type=style";` : ""}

      // 发送请求获取 template 的部分
      import { render as __render } from "${url}?type=template";

      // 渲染 template 的内容
      __script.render = __render;    

      export default __script;
    `;
  }

  // 处理template
  if (query.type == "template") {
    const template = descriptor.template;
    // 在服务端编译 template 并且返回
    const render = compilerDom.compile(template.content, {
      mode: "module",
    }).code;
    // template=>render才能执行
    ctx.type = "application/javascript";
    ctx.body = rewriteImport(render);
  }

  // 处理style
  if (query.type === "style") {
    const styleBlock = descriptor.styles[0];
    ctx.type = "application/javascript";
    ctx.body = `
    const css = ${JSON.stringify(styleBlock.content)};
    updateStyle(css);
    export default css;
  `;
  }
}

app.use(async (ctx) => {
  // 不能直接用static，因为要编译.vue
  const {
    request: { url, query },
  } = ctx;

  if (url == "/") {
    htmlAction(ctx, url);
  } else if (url.startsWith("/@modules/")) {
    moduleAction(ctx, url);
  } else if (url.endsWith(".css")) {
    styleActionCss(ctx, url);
  } else if (url.endsWith(".js")) {
    scriptActionJs(ctx, url);
  } else if (url.indexOf(".vue") > -1) {
    scriptActionVue(ctx, url, query);
  }
  // TODO:支持ts
  // TODO:支持scss
  // TODO:支持less
  // TODO:支持xx
  // }else if(url.endsWith('.scss')){}
  // }else if(url.endsWith('.less')){}
  // }else if(url.endsWith('.ts')){}
  else {
    ctx.body = "body";
  }
});

app.listen(3001, () => {
  console.log("3001");
});
