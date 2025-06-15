# UL编辑器模块迁移计划

## 模块概述
UL编辑器是URule规则引擎的自然语言规则编辑器，允许用户使用类似自然语言的方式编写业务规则。该模块提供了一个富文本编辑器，支持规则语法高亮、智能提示、语法验证等功能。

## 技术栈对比

### 老项目技术栈
- **框架**: React 16.3.1
- **编辑器**: CodeMirror 5.x
- **状态管理**: Redux
- **UI组件**: Bootstrap 3 + 自定义组件
- **HTTP请求**: jQuery Ajax

### 新项目技术栈
- **框架**: Vue 3 (Composition API)
- **编辑器**: CodeMirror 6.x 或 Monaco Editor
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **HTTP请求**: Axios

## 核心功能分析

### 1. UL语法编辑器
- 基于CodeMirror的代码编辑器
- UL语法高亮显示
- 行号显示
- 代码折叠功能
- 搜索和替换功能

### 2. 智能提示功能
- 变量名自动完成
- 函数名自动完成
- 关键字提示
- 语法错误提示
- 实时语法检查

### 3. 工具栏功能
- 保存规则
- 语法验证
- 格式化代码
- 撤销/重做
- 全屏编辑

### 4. 规则管理
- 规则文件的增删改查
- 规则版本管理
- 规则导入导出
- 规则测试功能

## 组件设计

### 1. ULEditor 主组件
```vue
<template>
  <div class="ul-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <el-button-group>
        <el-button @click="saveRule" :loading="saving">
          <el-icon><Document /></el-icon>
          保存
        </el-button>
        <el-button @click="validateSyntax">
          <el-icon><Check /></el-icon>
          验证语法
        </el-button>
        <el-button @click="formatCode">
          <el-icon><Magic /></el-icon>
          格式化
        </el-button>
      </el-button-group>
      
      <el-button-group class="ml-2">
        <el-button @click="undo" :disabled="!canUndo">
          <el-icon><RefreshLeft /></el-icon>
          撤销
        </el-button>
        <el-button @click="redo" :disabled="!canRedo">
          <el-icon><RefreshRight /></el-icon>
          重做
        </el-button>
      </el-button-group>
      
      <el-button @click="toggleFullscreen" class="ml-2">
        <el-icon><FullScreen /></el-icon>
        全屏
      </el-button>
    </div>
    
    <!-- 编辑器容器 -->
    <div class="editor-container" ref="editorContainer">
      <div ref="editorElement"></div>
    </div>
    
    <!-- 状态栏 -->
    <div class="editor-status">
      <span>行: {{ currentLine }}</span>
      <span>列: {{ currentColumn }}</span>
      <span v-if="syntaxErrors.length > 0" class="error">
        错误: {{ syntaxErrors.length }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useULEditorStore } from '@/stores/ulEditor'
import { createULEditor } from '@/utils/ulEditor'

/**
 * UL编辑器组件属性
 */
const props = defineProps({
  /** 规则文件路径 */
  filePath: {
    type: String,
    required: true
  },
  /** 是否只读模式 */
  readonly: {
    type: Boolean,
    default: false
  }
})

/**
 * 组件事件
 */
const emit = defineEmits(['save', 'change'])

// 状态管理
const ulEditorStore = useULEditorStore()

// 响应式数据
const editorElement = ref(null)
const editorContainer = ref(null)
const editor = ref(null)
const saving = ref(false)
const currentLine = ref(1)
const currentColumn = ref(1)
const syntaxErrors = ref([])
const canUndo = ref(false)
const canRedo = ref(false)

/**
 * 初始化编辑器
 */
onMounted(async () => {
  try {
    // 创建UL编辑器实例
    editor.value = await createULEditor(editorElement.value, {
      readonly: props.readonly,
      onCursorChange: handleCursorChange,
      onContentChange: handleContentChange,
      onSyntaxError: handleSyntaxError
    })
    
    // 加载规则内容
    await loadRuleContent()
    
    // 设置编辑器主题
    setEditorTheme('default')
    
  } catch (error) {
    console.error('初始化UL编辑器失败:', error)
    ElMessage.error('编辑器初始化失败')
  }
})

/**
 * 组件卸载时清理资源
 */
onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

/**
 * 加载规则内容
 */
const loadRuleContent = async () => {
  try {
    const content = await ulEditorStore.loadRuleFile(props.filePath)
    if (editor.value) {
      editor.value.setValue(content)
    }
  } catch (error) {
    console.error('加载规则文件失败:', error)
    ElMessage.error('加载规则文件失败')
  }
}

/**
 * 保存规则
 */
const saveRule = async () => {
  if (!editor.value) return
  
  saving.value = true
  try {
    const content = editor.value.getValue()
    await ulEditorStore.saveRuleFile(props.filePath, content)
    ElMessage.success('保存成功')
    emit('save', content)
  } catch (error) {
    console.error('保存规则失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

/**
 * 验证语法
 */
const validateSyntax = async () => {
  if (!editor.value) return
  
  try {
    const content = editor.value.getValue()
    const errors = await ulEditorStore.validateULSyntax(content)
    syntaxErrors.value = errors
    
    if (errors.length === 0) {
      ElMessage.success('语法验证通过')
    } else {
      ElMessage.warning(`发现 ${errors.length} 个语法错误`)
      // 在编辑器中标记错误位置
      markSyntaxErrors(errors)
    }
  } catch (error) {
    console.error('语法验证失败:', error)
    ElMessage.error('语法验证失败')
  }
}

/**
 * 格式化代码
 */
const formatCode = () => {
  if (!editor.value) return
  
  try {
    const content = editor.value.getValue()
    const formatted = ulEditorStore.formatULCode(content)
    editor.value.setValue(formatted)
    ElMessage.success('代码格式化完成')
  } catch (error) {
    console.error('代码格式化失败:', error)
    ElMessage.error('代码格式化失败')
  }
}

/**
 * 撤销操作
 */
const undo = () => {
  if (editor.value && canUndo.value) {
    editor.value.undo()
  }
}

/**
 * 重做操作
 */
const redo = () => {
  if (editor.value && canRedo.value) {
    editor.value.redo()
  }
}

/**
 * 切换全屏模式
 */
const toggleFullscreen = () => {
  const container = editorContainer.value
  if (!container) return
  
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    container.requestFullscreen()
  }
}

/**
 * 处理光标位置变化
 */
const handleCursorChange = (line, column) => {
  currentLine.value = line
  currentColumn.value = column
}

/**
 * 处理内容变化
 */
const handleContentChange = (content) => {
  emit('change', content)
  // 更新撤销/重做状态
  updateUndoRedoState()
}

/**
 * 处理语法错误
 */
const handleSyntaxError = (errors) => {
  syntaxErrors.value = errors
}

/**
 * 更新撤销/重做状态
 */
const updateUndoRedoState = () => {
  if (editor.value) {
    canUndo.value = editor.value.canUndo()
    canRedo.value = editor.value.canRedo()
  }
}

/**
 * 在编辑器中标记语法错误
 */
const markSyntaxErrors = (errors) => {
  if (!editor.value) return
  
  errors.forEach(error => {
    editor.value.markError(error.line, error.column, error.message)
  })
}

/**
 * 设置编辑器主题
 */
const setEditorTheme = (theme) => {
  if (editor.value) {
    editor.value.setTheme(theme)
  }
}
</script>

<style scoped>
.ul-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
}

.editor-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.editor-status {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 12px;
  background-color: #f5f7fa;
  border-top: 1px solid #dcdfe6;
  font-size: 12px;
  color: #606266;
}

.editor-status .error {
  color: #f56c6c;
}

.ml-2 {
  margin-left: 8px;
}
</style>
```

### 2. UL语法高亮配置
```javascript
// src/utils/ulEditor.js

import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { StreamLanguage } from '@codemirror/language'
import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode'

/**
 * UL语言语法定义
 */
const ulLanguage = StreamLanguage.define(simpleMode({
  start: [
    // 关键字
    {
      regex: /\b(if|then|else|when|rule|end|and|or|not|true|false)\b/,
      token: 'keyword'
    },
    // 变量引用
    {
      regex: /\$[a-zA-Z_][a-zA-Z0-9_]*/,
      token: 'variable'
    },
    // 函数调用
    {
      regex: /[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\()/,
      token: 'function'
    },
    // 字符串
    {
      regex: /"(?:[^"\\]|\\.)*"/,
      token: 'string'
    },
    {
      regex: /'(?:[^'\\]|\\.)*'/,
      token: 'string'
    },
    // 数字
    {
      regex: /\b\d+(?:\.\d+)?\b/,
      token: 'number'
    },
    // 操作符
    {
      regex: /[+\-*\/=<>!&|]+/,
      token: 'operator'
    },
    // 注释
    {
      regex: /\/\/.*$/,
      token: 'comment'
    },
    {
      regex: /\/\*[\s\S]*?\*\//,
      token: 'comment'
    }
  ]
}))

/**
 * 创建UL编辑器实例
 * @param {HTMLElement} element - 编辑器容器元素
 * @param {Object} options - 编辑器选项
 * @returns {EditorView} 编辑器实例
 */
export const createULEditor = (element, options = {}) => {
  const {
    readonly = false,
    onCursorChange,
    onContentChange,
    onSyntaxError
  } = options

  // 创建编辑器状态
  const state = EditorState.create({
    doc: '',
    extensions: [
      basicSetup,
      ulLanguage,
      EditorView.theme({
        '&': {
          fontSize: '14px',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace'
        },
        '.cm-content': {
          padding: '12px',
          minHeight: '200px'
        },
        '.cm-focused': {
          outline: 'none'
        },
        '.cm-editor': {
          height: '100%'
        },
        '.cm-scroller': {
          height: '100%'
        }
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onContentChange) {
          onContentChange(update.state.doc.toString())
        }
        
        if (update.selectionSet && onCursorChange) {
          const cursor = update.state.selection.main.head
          const line = update.state.doc.lineAt(cursor)
          onCursorChange(line.number, cursor - line.from + 1)
        }
      }),
      EditorState.readOnly.of(readonly)
    ]
  })

  // 创建编辑器视图
  const view = new EditorView({
    state,
    parent: element
  })

  // 扩展编辑器方法
  return {
    ...view,
    
    /**
     * 设置编辑器内容
     */
    setValue(content) {
      const transaction = this.state.update({
        changes: {
          from: 0,
          to: this.state.doc.length,
          insert: content
        }
      })
      this.dispatch(transaction)
    },
    
    /**
     * 获取编辑器内容
     */
    getValue() {
      return this.state.doc.toString()
    },
    
    /**
     * 检查是否可以撤销
     */
    canUndo() {
      // 实现撤销检查逻辑
      return true
    },
    
    /**
     * 检查是否可以重做
     */
    canRedo() {
      // 实现重做检查逻辑
      return true
    },
    
    /**
     * 撤销操作
     */
    undo() {
      // 实现撤销逻辑
    },
    
    /**
     * 重做操作
     */
    redo() {
      // 实现重做逻辑
    },
    
    /**
     * 标记语法错误
     */
    markError(line, column, message) {
      // 实现错误标记逻辑
    },
    
    /**
     * 设置编辑器主题
     */
    setTheme(theme) {
      // 实现主题切换逻辑
    }
  }
}
```

## 状态管理 (Pinia Store)

```javascript
// src/stores/ulEditor.js

import { defineStore } from 'pinia'
import { ulEditorApi } from '@/api/ulEditor'

export const useULEditorStore = defineStore('ulEditor', {
  state: () => ({
    /** 当前打开的规则文件 */
    currentFile: null,
    /** 规则文件内容 */
    fileContent: '',
    /** 语法错误列表 */
    syntaxErrors: [],
    /** 编辑器配置 */
    editorConfig: {
      theme: 'default',
      fontSize: 14,
      tabSize: 2,
      wordWrap: true
    }
  }),

  getters: {
    /**
     * 是否有语法错误
     */
    hasSyntaxErrors: (state) => state.syntaxErrors.length > 0,
    
    /**
     * 错误数量
     */
    errorCount: (state) => state.syntaxErrors.length
  },

  actions: {
    /**
     * 加载规则文件
     * @param {string} filePath - 文件路径
     * @returns {Promise<string>} 文件内容
     */
    async loadRuleFile(filePath) {
      try {
        const response = await ulEditorApi.loadFile(filePath)
        this.currentFile = filePath
        this.fileContent = response.data.content
        return this.fileContent
      } catch (error) {
        console.error('加载规则文件失败:', error)
        throw error
      }
    },

    /**
     * 保存规则文件
     * @param {string} filePath - 文件路径
     * @param {string} content - 文件内容
     */
    async saveRuleFile(filePath, content) {
      try {
        await ulEditorApi.saveFile(filePath, content)
        this.fileContent = content
      } catch (error) {
        console.error('保存规则文件失败:', error)
        throw error
      }
    },

    /**
     * 验证UL语法
     * @param {string} content - UL代码内容
     * @returns {Promise<Array>} 语法错误列表
     */
    async validateULSyntax(content) {
      try {
        const response = await ulEditorApi.validateSyntax(content)
        this.syntaxErrors = response.data.errors || []
        return this.syntaxErrors
      } catch (error) {
        console.error('语法验证失败:', error)
        throw error
      }
    },

    /**
     * 格式化UL代码
     * @param {string} content - 原始代码
     * @returns {string} 格式化后的代码
     */
    formatULCode(content) {
      // 实现UL代码格式化逻辑
      return content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n')
    },

    /**
     * 更新编辑器配置
     * @param {Object} config - 配置对象
     */
    updateEditorConfig(config) {
      this.editorConfig = { ...this.editorConfig, ...config }
    }
  }
})
```

## API接口设计

```javascript
// src/api/ulEditor.js

import request from '@/utils/request'

/**
 * UL编辑器相关API
 */
export const ulEditorApi = {
  /**
   * 加载规则文件
   * @param {string} filePath - 文件路径
   */
  loadFile(filePath) {
    return request({
      url: '/api/urule/ul/loadFile',
      method: 'post',
      data: { filePath }
    })
  },

  /**
   * 保存规则文件
   * @param {string} filePath - 文件路径
   * @param {string} content - 文件内容
   */
  saveFile(filePath, content) {
    return request({
      url: '/api/urule/ul/saveFile',
      method: 'post',
      data: { filePath, content }
    })
  },

  /**
   * 验证UL语法
   * @param {string} content - UL代码内容
   */
  validateSyntax(content) {
    return request({
      url: '/api/urule/ul/validateSyntax',
      method: 'post',
      data: { content }
    })
  },

  /**
   * 获取智能提示
   * @param {string} content - 当前代码内容
   * @param {number} position - 光标位置
   */
  getAutoComplete(content, position) {
    return request({
      url: '/api/urule/ul/autoComplete',
      method: 'post',
      data: { content, position }
    })
  },

  /**
   * 格式化UL代码
   * @param {string} content - 原始代码
   */
  formatCode(content) {
    return request({
      url: '/api/urule/ul/formatCode',
      method: 'post',
      data: { content }
    })
  }
}
```

## 路由配置

```javascript
// src/router/modules/ulEditor.js

export default [
  {
    path: '/ul-editor',
    name: 'ULEditor',
    component: () => import('@/views/ulEditor/ULEditor.vue'),
    meta: {
      title: 'UL编辑器',
      icon: 'edit',
      requiresAuth: true
    }
  }
]
```

## 测试要点

### 1. 功能测试
- [ ] 编辑器初始化和销毁
- [ ] 文件加载和保存
- [ ] 语法高亮显示
- [ ] 智能提示功能
- [ ] 语法验证功能
- [ ] 代码格式化功能
- [ ] 撤销/重做功能
- [ ] 全屏模式切换

### 2. 性能测试
- [ ] 大文件加载性能
- [ ] 实时语法检查性能
- [ ] 内存使用情况
- [ ] 编辑器响应速度

### 3. 兼容性测试
- [ ] 不同浏览器兼容性
- [ ] 移动端适配
- [ ] 键盘快捷键支持

## 风险评估

### 高风险
- **CodeMirror 6迁移**: 从CodeMirror 5升级到6，API变化较大
- **UL语法解析**: 需要准确实现UL语言的语法高亮和验证

### 中风险
- **智能提示实现**: 需要与后端配合实现准确的代码提示
- **性能优化**: 大文件编辑时的性能问题

### 低风险
- **UI界面适配**: 使用Element Plus组件相对简单
- **基础编辑功能**: 标准的文本编辑功能

## 预计工作量
- **总工作量**: 25小时
- **编辑器核心功能**: 15小时
- **语法高亮和验证**: 6小时
- **智能提示功能**: 4小时

## 迁移优先级
**优先级**: 中等

UL编辑器作为规则编写的重要工具，需要在核心编辑功能完成后进行迁移。建议在决策集、决策表等主要编辑器完成后再进行此模块的迁移。 