## 项目规则

### 项目名称与描述
- **新项目名称**: `urule-console-js-vue`
- **老项目名称**: `urule-console-js`
- **描述**: 本项目是将一个基于 React 的老项目 `urule-console-js` 迁移到 Vue 3 技术栈。新项目 `urule-console-js-vue` 将使用 Vite 作为构建工具，Element Plus 作为 UI 框架，Pinia 进行状态管理，以及 Vue Router 实现路由功能。所有的迁移计划和进度将在项目根目录下的 `plan.md` 文件中进行维护。特别注意在 Windows 开发环境下的命令调用和路径问题。

### 目标架构
- **框架**: Vue 3 (Composition API, `<script setup>`)
- **构建工具**: Vite
- **开发语言**: JavaScript (非 TypeScript)
- **UI 库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP请求**: Axios

### 代码规范与风格
- **注释**: 使用 JSDoc 注释。
- **代码格式**: 严格遵循社区通用的 JavaScript 和 Vue 的代码格式标准。
- **代码风格**: 保持一致性和可读性。
- **命名规范**: 遵循有意义的驼峰命名法 (camelCase) 或帕斯卡命名法 (PascalCase)（用于类和组件）。
- **文件行数**: 单个文件行数尽量控制在 500 行以内。
- **DRY 原则**:  
  - 禁止复制粘贴相同或相似的代码块。若需复用逻辑，需封装为函数或组件。
  - 使用 Vue 3 的 `<script setup>` 和组合式 API 实现逻辑复用（如 `useFormValidation()` 钩子）。
- **组件命名与组织**:  
  - 自定义公共组件需按功能分类存放（如 `src/components/Dialog/`、`src/components/Frametab/`）。
  - 模块级组件需按功能分类存放（如 `src/views/ruleSetEditor/components/Action/`、`src/views/frame/components/ComponentContainer/`）。
  - 组件命名需遵循 `PascalCase`，如 `<CustomPagination />`。
  - 组件内的子组件命名需遵循 `kebab-case`，如 `<custom-pagination-item />`。


### 迁移目标
- 将 React 组件转换为 Vue 3 Composition API 写法。
- 使用 `<script setup>` 语法简化 Vue 组件结构。
- 使用 `defineProps` / `defineEmits` 明确组件接口。
- 使用 Pinia 替换 Redux 或 React Context API 进行状态管理。
- 使用 Vue Router 替换 React Router 进行路由管理。
- 使用 Element Plus 替换原有的 UI 组件库。
- 后台 API 路径和数据结构保持不变。
- 不使用jquery和bootstrap。
- **组件复用优先**:  
  - 在开发新功能前，需搜索现有组件库（如 `src/components/` 或第三方库如 Element Plus），确认是否有可复用的组件。
  - 优先使用 Element Plus 提供的 UI 组件（如 `el-button`、`el-table`），而非自行实现。

### 迁移计划文档
- **文件**: `plan.md` (位于根目录 `doc` 目录下)
- **结构**:
    - 标题: 迁移计划与进度
    - 项目概述: 对项目的简要介绍及其目标架构的描述。
    - 迁移步骤: 分阶段的迁移步骤，包括从 React 到 Vue 3 的具体转换策略。
    - 已完成任务: 列出已完成的迁移任务，并附带相关说明或链接至代码库中的具体更改。
    - 待办事项: 接下来需要处理的任务列表，按优先级排序。
    - 遇到的问题及解决方案: 记录迁移过程中遇到的技术难题及其解决方法。

### 开发环境注意事项 (Windows)
- 在 Windows 上使用 PowerShell 或 CMD 时，请注意命令格式的不同（例如：路径分隔符应为反斜杠 `\` 或双反斜杠 `\\`，或者使用正斜杠 `/`）。
- 考虑使用 WSL (Windows Subsystem for Linux) 来获得更一致的开发体验，尤其是在运行类 Unix 脚本或命令时。
- `package.json` 中的脚本命令应优先使用跨平台的路径分隔符 `/`。

### AI 交互指南
- **响应语言**: 中文。
- **任务理解**: 仔细阅读用户需求，确保理解迁移的核心目标和技术选型。
- **代码生成**: 生成的代码需严格遵循上述代码规范与风格。
- **问题处理**: 遇到不明确的需求或技术难题时，应主动向用户提问或寻求澄清。
- **进度跟踪**: 参考 `plan.md` 文件了解项目进度和待办事项。
