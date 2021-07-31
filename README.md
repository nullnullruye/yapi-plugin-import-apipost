## yapi-plugin-import-apipost

支持导入 apipost 的 json 数据，生成接口文档

### 安装插件

安装 `ykit`（已安装请忽略）

```
npm install -g ykit
```

安装 `yapi-cli`（已安装请忽略）

```
npm install -g yapi-cli --registry https://registry.npm.taobao.org
```

安装插件

```
yapi plugin --name yapi-plugin-import-apipost
```

使用 `yapi plugin` 命令会自动在 config.json 添加

```json
   "plugins" : [
      {
         "name": "import-apipost"
      }
   ]
```
