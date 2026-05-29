### 概述

EdgeOne Pages Blob 是面向 Pages Functions 的分布式对象存储，适合存储图片、文档、用户上传文件等非结构化数据。默认提供最终一致的快速读取，写入后短暂时间内可读到最新值；如需立即读到最新值，可在单次读取时切换为强一致模式。

> **注意：**
> 
> - 免费版套餐下单账户存储容量为 1GB。
> - 当前提供 Node.js SDK（`@edgeone/pages-blob`），其他运行时的 SDK 正在开发中。
> - Blob 面向 Pages Functions 的运行时数据需要（如读写、查询、加工），不建议作为公网图床或 CDN 使用。


### 工作原理

#### 数据访问

Blob 数据持久化在云端的对象存储中，并通过边缘节点加速读取。读取请求由离用户最近的边缘节点响应，毫秒级返回。

#### 一致性模型

Blob 提供两种一致性模式，可按需选择：

|**模式**|**读取行为**|**适用场景**|
|---------|---------|---------|
|**最终一致**（默认）|走边缘缓存，速度最快；新写入的数据需要短暂时间（通常秒级）才能在所有节点上读到|内容展示、缓存读取、容忍短暂不一致的业务|
|**强一致**|跳过缓存直读主存储，保证读到最新值；读取耗时略高|计数器、状态机、必须立即读到最新写入值的业务|


调用 `store.get(key)` 时默认使用最终一致；传入 `{ consistency: "strong" }` 即切换到强一致。也可在 `getStore` 时统一指定整个 Store 的默认一致性。

> **注意：**
> 

> 强一致性会增加读取耗时，仅在确有必要时使用。
> 


### 使用场景

#### 用户文件上传

接收用户上传的头像、附件、图片等文件，存储到 Blob 中按用户或业务维度组织。

#### AI 生成内容

存储 AI 模型生成的图片、文档、报告，按批次或类型目录管理，方便检索和展示。

#### 结构化数据集

将多个 JSON 文件按目录组织存放，通过 `list` 遍历处理整个数据集。

### 快速开始

#### 1. 安装 SDK
``` bash
npm install @edgeone/pages-blob
```

#### 2. 在 Pages Functions 中使用
``` javascript
import { getStore } from "@edgeone/pages-blob";

export async function onRequest({ request }) {
  const store = getStore("my-store");

  // 写入
  await store.set("hello.txt", "Hello, EdgeOne Pages!");

  const content = await store.get("hello.txt");

  return new Response(content);
}
```

首次调用 `getStore("my-store")` 时，平台会自动为当前项目创建名为 `my-store` 的命名空间，后续调用直接使用已有的命名空间。

#### 3. 部署

部署 Pages 项目后，触发一次请求即可在控制台的 Blob 存储页面中看到已创建的命名空间和对象。

### 控制台使用

Blob 在控制台中仅支持**只读浏览**（查看命名空间列表、浏览对象目录结构）。命名空间的创建和所有数据操作均通过 SDK 完成，详见下方 API 章节。

### API
``` javascript
import { getStore, listStores } from "@edgeone/pages-blob";
```

#### getStore(name | options)

获取一个 Store 实例。`getStore` 接受两种入参：
- 直接传入命名空间名称字符串，如 `getStore("my-store")`

- 传入配置对象，如 `getStore({ name, projectId, token, consistency })`


   **在 Pages Functions 中**


   只需指定命名空间名称：

   ``` javascript
   const store = getStore("my-store");
   
   // 也可使用对象形式，便于同时指定默认一致性
   const store = getStore({ name: "my-store", consistency: "strong" });
   ```

   **在 Pages Functions 之外访问**（例如本地脚本、外部服务）


   需要额外提供项目 ID 和 API Token：

   ``` javascript
   const store = getStore({
     name: "my-store",
     projectId: "pages-urtsvuwmfvli",
     token: "your-api-token",
   });
   ```

   **参数**

   |参数|类型|必填|说明|
   |---------|---------|---------|---------|
   |`name`|`string`|是|命名空间名称|
   |`projectId`|`string`|在 Pages Functions 之外访问时必填|目标项目 ID|
   |`token`|`string`|在 Pages Functions 之外访问时必填|API Token|
   |`consistency`|`"eventual" \| "strong"`|否|默认读取一致性，默认 `"eventual"`|


#### store.set(key, value, options?)

写入一个对象。Key 已存在则覆盖。
``` javascript
await store.set("photos/cat.jpg", imageBuffer);
await store.set("notes/todo.txt", "Buy milk");

// 防覆盖：仅在 Key 不存在时写入
await store.set("init.json", data, { onlyIfNew: true });
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`key`|`string`|是|对象的 Key|
|`value`|`string \| ArrayBuffer \| Blob \| ReadableStream`|是|对象内容|
|`options.onlyIfNew`|`boolean`|否|设为 `true` 时仅在 Key 不存在时写入|


**返回值**

`Promise<void>`

#### store.setJSON(key, value, options?)

写入 JSON 对象，自动序列化。接受与 `store.set` 相同的 options。
``` javascript
await store.setJSON("user/preferences", { theme: "dark", lang: "zh-CN" });
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`key`|`string`|是|对象的 Key|
|`value`|`any`|是|可序列化为 JSON 的数据|
|`options.onlyIfNew`|`boolean`|否|设为 `true` 时仅在 Key 不存在时写入|


**返回值**

`Promise<void>`

#### store.get(key, options?)

读取一个对象。Key 不存在时返回 `null`。
``` javascript
const text = await store.get("hello.txt");
const json = await store.get("config.json", { type: "json" });
const buffer = await store.get("image.png", { type: "arrayBuffer" });
const blob = await store.get("video.mp4", { type: "blob" });
const stream = await store.get("large-file.zip", { type: "stream" });

// 强一致性读取
const fresh = await store.get("counter", { consistency: "strong" });
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`key`|`string`|是|对象的 Key|
|`options.type`|`"text" \| "json" \| "arrayBuffer" \| "blob" \| "stream"`|否|返回值类型，默认 `"text"`|
|`options.consistency`|`"eventual" \| "strong"`|否|本次读取的一致性级别|


**返回值**

`Promise<string | object | ArrayBuffer | Blob | ReadableStream | null>`

#### store.getWithHeaders(key, options?)

读取对象内容及其完整响应头。Key 不存在时返回 `null`。
``` javascript
const result = await store.getWithHeaders("document.pdf");
// result.body — 对象内容
// result.headers — 完整响应头（content-type, etag, cache-control 等）
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`key`|`string`|是|对象的 Key|
|`options.consistency`|`"eventual" \| "strong"`|否|本次读取的一致性级别|


**返回值**
``` typescript
Promise<{
  body: string;
  headers: Record<string, string>;
} | null>
```

#### store.delete(key)

删除一个对象。Key 不存在时不报错。
``` javascript
await store.delete("photos/cat.jpg");
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`key`|`string`|是|需要删除的 Key|


**返回值**

`Promise<void>`

#### store.list(options?)

列举命名空间中的对象。默认自动聚合所有分页。
``` javascript
// 列出所有对象
const { blobs } = await store.list();

// 按前缀过滤
const { blobs } = await store.list({ prefix: "photos/" });

// 按目录分组（只返回当前层级的文件和子目录）
const { blobs, directories } = await store.list({
  prefix: "photos/",
  directories: true,
});

// 强一致性
const { blobs } = await store.list({ consistency: "strong" });

// 手动分页
const page1 = await store.list({ paginate: false });
const page2 = await store.list({ paginate: false, cursor: page1.cursor });
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`options.prefix`|`string`|否|按 Key 前缀过滤|
|`options.directories`|`boolean`|否|设为 `true` 时按 `/` 分组，返回 `directories` 字段|
|`options.paginate`|`boolean`|否|设为 `false` 时返回单页结果（含 cursor）|
|`options.cursor`|`string`|否|从上一次分页的 cursor 继续列举|
|`options.consistency`|`"eventual" \| "strong"`|否|本次列举的一致性级别|


**返回值**
``` typescript
{
  blobs: Array<{ key: string; etag: string }>;
  directories?: string[];  // 仅 directories: true 时返回
  cursor?: string;         // 仅 paginate: false 时返回
}
```

#### store.createUploadUrl(key, options?)

生成一个预签名的 PUT URL，允许浏览器或客户端直接把文件上传到 Blob，文件数据无需经过 Pages Functions 中转。适合大文件上传或对函数耗时敏感的场景，函数只负责签发一个几十字节的 URL，文件字节流直接从客户端流向 Blob。
``` javascript
const store = getStore("user-uploads");

const { url, key, expiresAt } = await store.createUploadUrl("files/photo.jpg");
```

完整的客户端直传流程见下方客户端直传上传文件示例。

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`key`|`string`|是|上传后对象的 Key|
|`options.expireSeconds`|`number`|否|URL 有效期（秒），默认 3600|
|`options.contentType`|`string`|否|若提供，客户端 PUT 时必须携带相同的 Content-Type 头，否则 403|


**返回值**
``` typescript
{
  url: string;        // 预签名 URL
  key: string;        // 对象 Key
  expiresAt: number;  // 过期时间（Unix 时间戳，单位秒）
}
```

> **注意：**
> 

> 生成的 URL 绑定 `PUT` 方法、指定的 Key、有效期窗口，以及 `Content-Type`（若设置）。任何不匹配的请求（其他方法、其他 Key、超出有效期、Content-Type 不一致）均返回 `403`。
> 


#### listStores(options?)

列举当前项目下的所有命名空间。
``` javascript
import { listStores } from "@edgeone/pages-blob";

// 在 Pages Functions 中
const { stores } = await listStores();

// 外部访问
const { stores } = await listStores({
  projectId: "pages-urtsvuwmfvli",
  token: "your-api-token",
});
```

**参数**

|参数|类型|必填|说明|
|---------|---------|---------|---------|
|`options.projectId`|`string`|外部访问时必填|目标项目 ID|
|`options.token`|`string`|外部访问时必填|API Token|
|`options.consistency`|`"eventual" \| "strong"`|否|读取一致性级别|


**返回值**
``` typescript
{
  stores: Array<{ name: string }>;
}
```

### 示例

#### 客户端直传上传文件

通过预签名 URL 让浏览器直接把文件 PUT 到 Blob，函数只负责签发 URL，文件字节流不经过函数。适合大文件、批量上传等场景。
``` javascript
// 函数端：签发一次性上传 URL
import { getStore } from "@edgeone/pages-blob";

export async function onRequest({ request }) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { name, contentType } = await request.json();
  const store = getStore("user-uploads");

  const { url, key, expiresAt } = await store.createUploadUrl(
    `uploads/${Date.now()}-${name}`,
    {
      expireSeconds: 3600,
      contentType: contentType || "application/octet-stream",
    }
  );

  return new Response(JSON.stringify({ url, key, expiresAt }), {
    headers: { "Content-Type": "application/json" },
  });
}
```
``` javascript
// 浏览器端：取到 URL 后直接 PUT，无需 SDK
async function uploadFile(file) {
  // 1. 向函数申请上传 URL
  const { url, key } = await fetch("/api/get-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: file.name, contentType: file.type }),
  }).then((r) => r.json());

  // 2. 直接上传到 Blob
  await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  return key;
}
```

#### 按目录列出文件
``` javascript
import { getStore } from "@edgeone/pages-blob";

export async function onRequest({ request }) {
  const store = getStore("user-uploads");
  const url = new URL(request.url);
  const prefix = url.searchParams.get("path") || "";

  const { blobs, directories } = await store.list({
    prefix,
    directories: true,
  });

  return new Response(
    JSON.stringify({ files: blobs, folders: directories }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

#### 条件写入（防覆盖）
``` javascript
import { getStore } from "@edgeone/pages-blob";

export async function onRequest({ request }) {
  const store = getStore("configs");

  // 仅在 Key 不存在时写入，避免覆盖已有数据
  await store.setJSON("app/settings", { version: 1 }, { onlyIfNew: true });

  const settings = await store.get("app/settings", { type: "json" });
  return new Response(JSON.stringify(settings), {
    headers: { "Content-Type": "application/json" },
  });
}
```

### 示例模板

**Blob SDK 用法示例：**

[预览地址](https://pages-blob.edgeone.site)

[源码地址](https://github.com/TencentEdgeOne/pages-blob-template)