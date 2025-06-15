# 项目初始化模块迁移计划

## 模块概述

项目初始化是整个迁移工作的第一步，需要搭建Vue 3项目的基础架构，包括项目结构、构建配置、基础依赖安装等。

## 目标

1. 创建标准的Vue 3 + Vite项目结构
2. 配置开发环境和构建工具
3. 安装和配置核心依赖
4. 迁移公共资源（图标、工具类等）
5. 设置项目规范和约定

## 详细任务

### 1. 创建Vue 3项目

```bash
# 使用Vite创建Vue 3项目
npm create vite@latest urule-console-js-vue -- --template vue

# 进入项目目录
cd urule-console-js-vue

# 安装基础依赖
npm install
```

### 2. 项目目录结构

```
urule-console-js-vue/
├── public/                  # 静态资源目录
│   ├── favicon.ico         # 网站图标（从老项目复制）
│   └── fonts/              # 字体文件目录
├── src/
│   ├── api/                # API接口定义
│   │   ├── index.js       # API入口文件
│   │   ├── frame.js       # 框架相关API
│   │   ├── variable.js    # 变量管理API
│   │   ├── constant.js    # 常量管理API
│   │   └── ...           # 其他模块API
│   ├── assets/            # 项目资源
│   │   ├── css/          # 样式文件
│   │   ├── fonts/        # 字体文件
│   │   └── images/       # 图片资源
│   ├── components/        # 公共组件
│   │   ├── Dialog/       # 对话框组件
│   │   ├── Tree/         # 树组件
│   │   ├── Grid/         # 网格组件
│   │   ├── Splitter/     # 分割器组件
│   │   └── ...          # 其他公共组件
│   ├── composables/      # 组合式函数
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia状态管理
│   ├── utils/            # 工具函数
│   ├── views/            # 页面组件
│   │   ├── frame/        # 主框架
│   │   ├── variable/     # 变量管理
│   │   ├── constant/     # 常量管理
│   │   └── ...          # 其他功能模块
│   ├── App.vue          # 根组件
│   └── main.js          # 入口文件
├── .gitignore
├── index.html           # HTML模板
├── package.json
├── README.md
└── vite.config.js       # Vite配置文件
```

### 3. 核心依赖安装

```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.5.0",
    "element-plus": "^2.3.0",
    "@element-plus/icons-vue": "^2.1.0",
    "dayjs": "^1.11.0",
    "lodash-es": "^4.17.21"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "vite": "^4.4.0",
    "sass": "^1.63.0",
    "unplugin-auto-import": "^0.16.0",
    "unplugin-vue-components": "^0.25.0"
  }
}
```

### 4. Vite配置

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  server: {
    port: 5000,
    proxy: {
      '/api/urule': {
        target: 'http://127.0.0.1:8009/ebu-rule-server/urule/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/urule/, '')
      }
    }
  }
})
```

### 5. 迁移静态资源

#### 5.1 图标字体迁移
- 从 `urule-console-js/src/css/iconfont.*` 复制到 `src/assets/fonts/`
- 更新iconfont.css中的路径引用

#### 5.2 项目图标
- 从老项目中提取favicon.ico
- 放置到public目录

#### 5.3 第三方资源
- 评估哪些第三方CSS/JS需要保留
- 寻找对应的Vue版本或NPM包

### 6. 工具类迁移

#### 6.1 Utils.js迁移
将 `urule-console-js/src/Utils.js` 迁移到 `src/utils/index.js`，并改造为ES6模块：

```javascript
// src/utils/index.js

/**
 * 格式化日期时间
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  // 实现日期格式化逻辑
}

/**
 * 生成UUID
 */
export function generateUUID() {
  // 实现UUID生成逻辑
}

/**
 * 深拷贝对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// ... 其他工具函数
```

### 7. API封装

创建统一的API请求封装：

```javascript
// src/api/index.js
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
  baseURL: '/api/urule',
  timeout: 15000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 可以在这里添加token等
    return config
  },
  error => {
    console.error('请求错误：', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.error) {
      ElMessage.error(res.error)
      return Promise.reject(new Error(res.error))
    }
    return res
  },
  error => {
    ElMessage.error('网络错误，请稍后重试')
    return Promise.reject(error)
  }
)

export default request
```

### 8. 全局样式设置

```scss
// src/assets/css/global.scss

// 引入图标字体
@import './iconfont.css';

// 全局变量
:root {
  --primary-color: #409EFF;
  --success-color: #67C23A;
  --warning-color: #E6A23C;
  --danger-color: #F56C6C;
  --info-color: #909399;
}

// 重置样式
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}

#app {
  height: 100%;
}

// 滚动条样式
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: #f5f5f5;
}
```

### 9. 环境配置

创建环境变量文件：

```bash
# .env.development
VITE_API_BASE_URL=/api/urule
VITE_APP_TITLE=URule Console

# .env.production  
VITE_API_BASE_URL=/api/urule
VITE_APP_TITLE=URule Console
```

### 10. ESLint和代码规范配置

安装和配置ESLint以保证代码质量：

```bash
npm install -D eslint eslint-plugin-vue @vue/eslint-config-standard
```

## 测试要点

1. 项目能正常启动，无报错
2. 代理配置正确，能访问后端API
3. 静态资源加载正常
4. 图标字体显示正常
5. 开发热更新功能正常

## 注意事项

1. **Windows环境兼容**: 确保所有路径使用正斜杠或path.join
2. **字符编码**: 所有文件使用UTF-8编码
3. **图标资源**: 保持与老项目相同的图标类名，便于后续迁移
4. **API路径**: 确保代理配置与老项目保持一致

## 依赖关系

此模块是所有其他模块的基础，必须首先完成。

## 预计工时

- 项目创建和基础配置：2小时
- 依赖安装和配置：1小时  
- 资源迁移：2小时
- 工具类和API封装：3小时
- 测试和调整：2小时

**总计：10小时** 