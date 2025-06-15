# 脚本决策表模块迁移计划

## 模块概述

脚本决策表编辑器是决策表编辑器的扩展版本，支持在单元格中编写脚本代码。相比普通决策表，脚本决策表提供了更强的灵活性，允许用户在单元格中编写复杂的业务逻辑。

### 功能特性
- 基于脚本的单元格编辑
- 代码语法高亮和提示
- 脚本语法验证
- 表格结构管理
- 代码片段管理
- 调试功能支持

### 技术要求
- **预计工作量**: 22小时
- **优先级**: 中
- **依赖模块**: 决策表编辑器、公共组件库
- **技术栈**: Vue 3 + Element Plus + CodeMirror

## 老项目分析

### 核心功能分析

#### 1. 脚本决策表类 (ScriptDecisionTable.js)
- **基于决策表**: 继承普通决策表的基本功能
- **脚本编辑**: 单元格支持脚本代码编辑
- **语法验证**: 实时验证脚本语法
- **代码提示**: 提供变量和方法的自动完成

#### 2. 脚本单元格
- **代码编辑器**: 集成CodeMirror进行代码编辑
- **语法高亮**: 支持URule脚本语法高亮
- **自动完成**: 提供智能代码提示
- **错误提示**: 显示语法错误和警告

#### 3. 工具栏功能
- **库配置**: 导入变量库、常量库、动作库、参数库
- **保存功能**: 支持保存和保存新版本
- **调试功能**: 支持脚本调试和测试

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/scriptDecisionTable/
├── index.vue                   # 主编辑器页面
├── components/
│   ├── ScriptTableToolbar.vue  # 工具栏组件
│   ├── ScriptTableGrid.vue     # 脚本表格组件
│   ├── ScriptCellEditor.vue    # 脚本单元格编辑器
│   ├── CodeEditor.vue          # 代码编辑器组件
│   └── SyntaxHelper.vue        # 语法帮助组件
├── composables/
│   ├── useScriptTable.js       # 脚本表格逻辑
│   ├── useCodeEditor.js        # 代码编辑器逻辑
│   └── useSyntaxValidation.js  # 语法验证逻辑
├── stores/
│   └── scriptTableStore.js     # 状态管理
└── utils/
    ├── scriptParser.js         # 脚本解析器
    ├── syntaxValidator.js      # 语法验证器
    └── codeCompletion.js       # 代码补全
```

### 2. 主编辑器页面 (index.vue)

```vue
<template>
  <div class="script-decision-table-editor">
    <!-- 工具栏 -->
    <ScriptTableToolbar
      @save="handleSave"
      @save-new-version="handleSaveNewVersion"
      @config-variable="handleConfigVariable"
      @config-constant="handleConfigConstant"
      @config-action="handleConfigAction"
      @config-parameter="handleConfigParameter"
      @debug="handleDebug"
    />

    <!-- 脚本表格 -->
    <div class="table-container">
      <ScriptTableGrid
        ref="tableGridRef"
        :table-data="tableData"
        :columns="columns"
        :rows="rows"
        :cells="cells"
        @cell-edit="handleCellEdit"
        @cell-change="handleCellChange"
        @column-resize="handleColumnResize"
        @row-resize="handleRowResize"
      />
    </div>

    <!-- 脚本编辑对话框 -->
    <el-dialog
      v-model="scriptEditorVisible"
      title="编辑脚本"
      width="80%"
      :close-on-click-modal="false"
    >
      <ScriptCellEditor
        v-model="editingScript"
        :cell-info="editingCellInfo"
        @save="handleScriptSave"
        @cancel="handleScriptCancel"
      />
    </el-dialog>

    <!-- 语法帮助面板 -->
    <el-drawer
      v-model="syntaxHelpVisible"
      title="语法帮助"
      direction="rtl"
      size="400px"
    >
      <SyntaxHelper />
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import ScriptTableToolbar from './components/ScriptTableToolbar.vue'
import ScriptTableGrid from './components/ScriptTableGrid.vue'
import ScriptCellEditor from './components/ScriptCellEditor.vue'
import SyntaxHelper from './components/SyntaxHelper.vue'
import { useScriptTable } from './composables/useScriptTable'

/**
 * 脚本决策表编辑器主页面
 */

// 路由参数
const route = useRoute()
const file = route.query.file
const version = route.query.version

// 组合式API
const {
  tableData,
  columns,
  rows,
  cells,
  isDirty,
  loadScriptTable,
  saveScriptTable,
  updateCellScript
} = useScriptTable()

// 响应式数据
const tableGridRef = ref()
const scriptEditorVisible = ref(false)
const syntaxHelpVisible = ref(false)
const editingScript = ref('')
const editingCellInfo = ref(null)

// 生命周期
onMounted(() => {
  if (file) {
    loadScriptTable(file, version)
  }
})

// 事件处理
const handleSave = async () => {
  try {
    await saveScriptTable(false)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveNewVersion = async () => {
  try {
    await saveScriptTable(true)
    ElMessage.success('保存新版本成功')
  } catch (error) {
    ElMessage.error('保存新版本失败')
  }
}

const handleCellEdit = (row, col, cellData) => {
  editingCellInfo.value = { row, col, cellData }
  editingScript.value = cellData.script || ''
  scriptEditorVisible.value = true
}

const handleCellChange = (row, col, oldValue, newValue) => {
  updateCellScript(row, col, newValue)
}

const handleColumnResize = (col, width) => {
  // 处理列宽调整
}

const handleRowResize = (row, height) => {
  // 处理行高调整
}

const handleScriptSave = (script) => {
  if (editingCellInfo.value) {
    const { row, col } = editingCellInfo.value
    updateCellScript(row, col, script)
  }
  scriptEditorVisible.value = false
}

const handleScriptCancel = () => {
  scriptEditorVisible.value = false
}

const handleConfigVariable = () => {
  // 配置变量库
}

const handleConfigConstant = () => {
  // 配置常量库
}

const handleConfigAction = () => {
  // 配置动作库
}

const handleConfigParameter = () => {
  // 配置参数库
}

const handleDebug = () => {
  // 调试功能
  syntaxHelpVisible.value = true
}
</script>

<style scoped>
.script-decision-table-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.table-container {
  flex: 1;
  margin: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
}
</style>
```

### 3. 脚本表格组件 (ScriptTableGrid.vue)

```vue
<template>
  <div class="script-table-grid">
    <div ref="gridContainer" class="grid-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createScriptTableGrid } from '../utils/scriptTableFactory'

/**
 * 脚本表格组件
 */

// Props
const props = defineProps({
  tableData: {
    type: Object,
    default: () => ({})
  },
  columns: {
    type: Array,
    default: () => []
  },
  rows: {
    type: Array,
    default: () => []
  },
  cells: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'cell-edit',
  'cell-change',
  'column-resize',
  'row-resize'
])

// 响应式数据
const gridContainer = ref()
let gridInstance = null

// 生命周期
onMounted(() => {
  initGrid()
})

onBeforeUnmount(() => {
  if (gridInstance) {
    gridInstance.destroy()
  }
})

// 监听器
watch(() => props.tableData, () => {
  if (gridInstance) {
    gridInstance.setData(props.tableData)
  }
}, { deep: true })

// 方法
const initGrid = () => {
  gridInstance = createScriptTableGrid(gridContainer.value, {
    data: props.tableData,
    columns: props.columns,
    rows: props.rows,
    cells: props.cells,
    onCellEdit: (row, col, cellData) => {
      emit('cell-edit', row, col, cellData)
    },
    onCellChange: (row, col, oldValue, newValue) => {
      emit('cell-change', row, col, oldValue, newValue)
    },
    onColumnResize: (col, width) => {
      emit('column-resize', col, width)
    },
    onRowResize: (row, height) => {
      emit('row-resize', row, height)
    }
  })
}

// 暴露方法
defineExpose({
  getInstance: () => gridInstance
})
</script>

<style scoped>
.script-table-grid {
  height: 100%;
  width: 100%;
}

.grid-container {
  height: 100%;
  width: 100%;
}
</style>
```

### 4. 脚本单元格编辑器 (ScriptCellEditor.vue)

```vue
<template>
  <div class="script-cell-editor">
    <!-- 编辑器工具栏 -->
    <div class="editor-toolbar">
      <el-button-group>
        <el-button size="small" @click="handleFormat">
          <el-icon><Document /></el-icon>
          格式化
        </el-button>
        <el-button size="small" @click="handleValidate">
          <el-icon><Check /></el-icon>
          验证语法
        </el-button>
        <el-button size="small" @click="handleHelp">
          <el-icon><QuestionFilled /></el-icon>
          帮助
        </el-button>
      </el-button-group>
      
      <div class="toolbar-right">
        <el-button size="small" @click="handleCancel">取消</el-button>
        <el-button type="primary" size="small" @click="handleSave">保存</el-button>
      </div>
    </div>

    <!-- 代码编辑器 -->
    <div class="editor-container">
      <CodeEditor
        v-model="scriptContent"
        :options="editorOptions"
        @change="handleScriptChange"
        @cursor-activity="handleCursorActivity"
      />
    </div>

    <!-- 错误信息面板 -->
    <div v-if="validationErrors.length > 0" class="error-panel">
      <div class="error-title">语法错误:</div>
      <div
        v-for="error in validationErrors"
        :key="error.line"
        class="error-item"
        @click="goToError(error)"
      >
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        第 {{ error.line }} 行: {{ error.message }}
      </div>
    </div>

    <!-- 代码提示面板 -->
    <div v-if="showSuggestions" class="suggestions-panel">
      <div class="suggestions-title">代码提示:</div>
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.text"
        class="suggestion-item"
        @click="applySuggestion(suggestion)"
      >
        <span class="suggestion-text">{{ suggestion.text }}</span>
        <span class="suggestion-desc">{{ suggestion.description }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Document, Check, QuestionFilled, WarningFilled } from '@element-plus/icons-vue'
import CodeEditor from './CodeEditor.vue'
import { useCodeEditor } from '../composables/useCodeEditor'
import { useSyntaxValidation } from '../composables/useSyntaxValidation'

/**
 * 脚本单元格编辑器
 */

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  cellInfo: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// 组合式API
const {
  editorOptions,
  suggestions,
  showSuggestions,
  formatCode,
  getSuggestions
} = useCodeEditor()

const {
  validationErrors,
  validateScript
} = useSyntaxValidation()

// 响应式数据
const scriptContent = ref('')

// 计算属性
const hasErrors = computed(() => validationErrors.value.length > 0)

// 监听器
watch(() => props.modelValue, (newValue) => {
  scriptContent.value = newValue || ''
}, { immediate: true })

watch(scriptContent, (newValue) => {
  emit('update:modelValue', newValue)
})

// 事件处理
const handleScriptChange = (value) => {
  scriptContent.value = value
  // 实时语法验证
  validateScript(value)
  // 获取代码提示
  getSuggestions(value)
}

const handleCursorActivity = (cursor) => {
  // 处理光标活动，更新代码提示
}

const handleFormat = () => {
  scriptContent.value = formatCode(scriptContent.value)
}

const handleValidate = () => {
  validateScript(scriptContent.value)
  if (hasErrors.value) {
    ElMessage.error(`发现 ${validationErrors.value.length} 个语法错误`)
  } else {
    ElMessage.success('语法验证通过')
  }
}

const handleHelp = () => {
  // 显示帮助信息
}

const handleSave = () => {
  if (hasErrors.value) {
    ElMessage.warning('请先修复语法错误')
    return
  }
  emit('save', scriptContent.value)
}

const handleCancel = () => {
  emit('cancel')
}

const goToError = (error) => {
  // 跳转到错误行
}

const applySuggestion = (suggestion) => {
  // 应用代码提示
  scriptContent.value += suggestion.text
  showSuggestions.value = false
}
</script>

<style scoped>
.script-cell-editor {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.editor-container {
  flex: 1;
  position: relative;
}

.error-panel {
  max-height: 120px;
  overflow-y: auto;
  border-top: 1px solid #e4e7ed;
  background: #fef0f0;
  padding: 8px;
}

.error-title {
  font-weight: bold;
  color: #f56c6c;
  margin-bottom: 5px;
}

.error-item {
  display: flex;
  align-items: center;
  padding: 2px 0;
  cursor: pointer;
  color: #f56c6c;
}

.error-item:hover {
  background: rgba(245, 108, 108, 0.1);
}

.error-icon {
  margin-right: 5px;
}

.suggestions-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e4e7ed;
  border-top: none;
  z-index: 1000;
}

.suggestions-title {
  font-weight: bold;
  padding: 8px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.suggestion-item {
  padding: 8px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-item:hover {
  background: #f5f7fa;
}

.suggestion-text {
  font-weight: bold;
  color: #409eff;
}

.suggestion-desc {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
</style>
```

### 5. 代码编辑器组件 (CodeEditor.vue)

```vue
<template>
  <div ref="editorContainer" class="code-editor"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/default.css'
import 'codemirror/mode/javascript/javascript.js'
import 'codemirror/addon/hint/show-hint.js'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/lint/lint.js'
import 'codemirror/addon/lint/lint.css'

/**
 * 代码编辑器组件
 */

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  options: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'cursor-activity'])

// 响应式数据
const editorContainer = ref()
let editorInstance = null

// 生命周期
onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  if (editorInstance) {
    editorInstance.toTextArea()
  }
})

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (editorInstance && editorInstance.getValue() !== newValue) {
    editorInstance.setValue(newValue || '')
  }
})

// 方法
const initEditor = () => {
  const defaultOptions = {
    lineNumbers: true,
    mode: 'javascript',
    theme: 'default',
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 2,
    tabSize: 2,
    extraKeys: {
      'Ctrl-Space': 'autocomplete',
      'Alt-/': 'autocomplete'
    },
    hintOptions: {
      completeSingle: false
    },
    lint: {
      getAnnotations: validateScript,
      async: true
    }
  }

  const options = { ...defaultOptions, ...props.options }
  
  editorInstance = CodeMirror(editorContainer.value, {
    value: props.modelValue || '',
    ...options
  })

  // 绑定事件
  editorInstance.on('change', (instance) => {
    const value = instance.getValue()
    emit('update:modelValue', value)
    emit('change', value)
  })

  editorInstance.on('cursorActivity', (instance) => {
    const cursor = instance.getCursor()
    emit('cursor-activity', cursor)
  })

  // 自定义代码提示
  CodeMirror.registerHelper('hint', 'urule', getUruleHints)
}

/**
 * 脚本验证函数
 */
const validateScript = (text, callback) => {
  // 这里实现URule脚本的语法验证
  const errors = []
  
  // 简单的语法检查示例
  const lines = text.split('\n')
  lines.forEach((line, index) => {
    if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
      errors.push({
        message: '语句应以分号结尾',
        severity: 'warning',
        from: CodeMirror.Pos(index, 0),
        to: CodeMirror.Pos(index, line.length)
      })
    }
  })

  callback(errors)
}

/**
 * URule代码提示
 */
const getUruleHints = (editor, options) => {
  const cursor = editor.getCursor()
  const token = editor.getTokenAt(cursor)
  
  const hints = [
    'if',
    'else',
    'for',
    'while',
    'function',
    'return',
    'var',
    'let',
    'const',
    'true',
    'false',
    'null',
    'undefined'
  ]

  const filtered = hints.filter(hint => 
    hint.toLowerCase().startsWith(token.string.toLowerCase())
  )

  return {
    list: filtered,
    from: CodeMirror.Pos(cursor.line, token.start),
    to: CodeMirror.Pos(cursor.line, token.end)
  }
}

// 暴露方法
defineExpose({
  getInstance: () => editorInstance,
  focus: () => editorInstance?.focus(),
  setValue: (value) => editorInstance?.setValue(value),
  getValue: () => editorInstance?.getValue()
})
</script>

<style scoped>
.code-editor {
  height: 100%;
  width: 100%;
}

:deep(.CodeMirror) {
  height: 100%;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

:deep(.CodeMirror-lint-marker-warning) {
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJFhQXEbhTg7YAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAMklEQVQI12NkgIIvJ3QXMjAwdDN+OaEbysDA4MPAwNDNwMCwiOHLCd1zX07o6kBVGQEAKBANtobskNMAAAAASUVORK5CYII=");
}

:deep(.CodeMirror-lint-marker-error) {
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAYAAAC09K7GAAAAAXNSR0IArs4c6QAAAAZiS0dEAP8A/wD/oL2nkwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sJDw4cOCW1/KIAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAAAJklEQVQI12NggIL/DAz/GdA5/xkY/qPKMDAwAAX/M/xn+M/AwAAAhhkMAPcDTQQAAAAASUVORK5CYII=");
}
</style>
```

### 6. 组合式API - useScriptTable.js

```javascript
/**
 * 脚本表格管理组合式API
 */
import { ref, computed } from 'vue'
import { scriptTableApi } from '@/api/scriptTable'
import { generateId } from '@/utils/common'
import { buildScriptTableXml } from '../utils/scriptXmlBuilder'

export function useScriptTable() {
  // 响应式数据
  const tableData = ref({})
  const columns = ref([])
  const rows = ref([])
  const cells = ref([])
  const libraries = ref({
    variables: [],
    constants: [],
    actions: [],
    parameters: []
  })
  const isDirty = ref(false)
  const loading = ref(false)

  // 计算属性
  const columnCount = computed(() => columns.value.length)
  const rowCount = computed(() => rows.value.length)
  const cellCount = computed(() => cells.value.length)

  /**
   * 加载脚本表格
   */
  const loadScriptTable = async (file, version) => {
    try {
      loading.value = true
      const response = await scriptTableApi.loadScriptTable(file, version)
      const data = response.data

      parseScriptTableData(data)
      isDirty.value = false
    } catch (error) {
      console.error('Load script table error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存脚本表格
   */
  const saveScriptTable = async (newVersion = false) => {
    try {
      loading.value = true
      
      const xml = buildScriptTableXml({
        tableData: tableData.value,
        columns: columns.value,
        rows: rows.value,
        cells: cells.value,
        libraries: libraries.value
      })

      const params = {
        content: xml,
        file: window._file,
        newVersion
      }

      if (newVersion) {
        const versionComment = await getVersionComment()
        params.versionComment = versionComment
      }

      await scriptTableApi.saveScriptTable(params)
      isDirty.value = false
    } catch (error) {
      console.error('Save script table error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新单元格脚本
   */
  const updateCellScript = (row, col, script) => {
    const cell = cells.value.find(c => c.row === row && c.col === col)
    if (cell) {
      cell.script = script
      setDirty()
    } else {
      // 创建新单元格
      const newCell = {
        row,
        col,
        rowspan: 1,
        script
      }
      cells.value.push(newCell)
      setDirty()
    }
  }

  /**
   * 解析脚本表格数据
   */
  const parseScriptTableData = (data) => {
    tableData.value = data

    // 解析库引用
    libraries.value = {
      variables: data.variableLibraries || [],
      constants: data.constantLibraries || [],
      actions: data.actionLibraries || [],
      parameters: data.parameterLibraries || []
    }

    // 解析列数据
    columns.value = (data.columns || []).map(col => ({
      num: col.num,
      width: col.width || 120,
      type: col.type,
      variableCategory: col.variableCategory,
      variableLabel: col.variableLabel,
      variableName: col.variableName,
      datatype: col.datatype
    }))

    // 解析行数据
    rows.value = (data.rows || []).map(row => ({
      num: row.num,
      height: row.height || 40
    }))

    // 解析脚本单元格数据
    cells.value = (data.scriptCells || data.cells || []).map(cell => ({
      row: cell.row,
      col: cell.col,
      rowspan: cell.rowspan || 1,
      script: cell.script || ''
    }))
  }

  /**
   * 设置脏标记
   */
  const setDirty = () => {
    isDirty.value = true
  }

  /**
   * 获取版本注释
   */
  const getVersionComment = () => {
    return new Promise((resolve, reject) => {
      ElMessageBox.prompt('请输入新版本描述', '保存新版本', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(({ value }) => {
        resolve(value)
      }).catch(() => {
        reject(new Error('取消保存'))
      })
    })
  }

  return {
    tableData,
    columns,
    rows,
    cells,
    libraries,
    isDirty,
    loading,
    columnCount,
    rowCount,
    cellCount,
    loadScriptTable,
    saveScriptTable,
    updateCellScript,
    setDirty
  }
}
```

### 7. 脚本XML构建工具 (scriptXmlBuilder.js)

```javascript
/**
 * 脚本表格XML构建工具
 */

/**
 * 构建脚本决策表XML
 */
export function buildScriptTableXml({ tableData, columns, rows, cells, libraries }) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<script-decision-table>\n'

  // 添加库引用
  xml += buildLibraryImports(libraries)

  // 添加脚本单元格
  cells.forEach(cell => {
    xml += buildScriptCellXml(cell)
  })

  // 添加行定义
  rows.forEach(row => {
    xml += `  <row num="${row.num}" height="${row.height}" />\n`
  })

  // 添加列定义
  columns.forEach(col => {
    xml += buildColumnXml(col)
  })

  xml += '</script-decision-table>'
  return xml
}

/**
 * 构建库引用XML
 */
function buildLibraryImports(libraries) {
  let xml = ''

  // 变量库
  libraries.variables.forEach(lib => {
    xml += `  <import-variable-library path="${lib}" />\n`
  })

  // 常量库
  libraries.constants.forEach(lib => {
    xml += `  <import-constant-library path="${lib}" />\n`
  })

  // 动作库
  libraries.actions.forEach(lib => {
    xml += `  <import-action-library path="${lib}" />\n`
  })

  // 参数库
  libraries.parameters.forEach(lib => {
    xml += `  <import-parameter-library path="${lib}" />\n`
  })

  return xml
}

/**
 * 构建脚本单元格XML
 */
function buildScriptCellXml(cell) {
  let xml = `  <script-cell row="${cell.row}" col="${cell.col}"`
  
  if (cell.rowspan > 1) {
    xml += ` rowspan="${cell.rowspan}"`
  }
  
  xml += '>\n'
  xml += `    <![CDATA[${cell.script || ''}]]>\n`
  xml += '  </script-cell>\n'
  
  return xml
}

/**
 * 构建列定义XML
 */
function buildColumnXml(col) {
  let xml = `  <col num="${col.num}" width="${col.width}" type="${col.type}"`
  
  if (col.variableName) {
    xml += ` var-category="${col.variableCategory === 'parameter' ? '参数' : col.variableCategory}"`
    xml += ` var-label="${col.variableLabel}"`
    xml += ` var="${col.variableName}"`
    xml += ` datatype="${col.datatype}"`
  }
  
  xml += ' />\n'
  return xml
}
```

## 数据结构定义

### 脚本表格数据结构
```javascript
const ScriptTableData = {
  libraries: {                   // 库引用
    variables: ['string'],
    constants: ['string'],
    actions: ['string'],
    parameters: ['string']
  },
  columns: [                     // 列定义
    {
      num: 'number',             // 列号
      width: 'number',           // 列宽
      type: 'string',            // 列类型
      variableCategory: 'string', // 变量分类
      variableLabel: 'string',   // 变量标签
      variableName: 'string',    // 变量名
      datatype: 'string'         // 数据类型
    }
  ],
  rows: [                        // 行定义
    {
      num: 'number',             // 行号
      height: 'number'           // 行高
    }
  ],
  cells: [                       // 脚本单元格数据
    {
      row: 'number',             // 行号
      col: 'number',             // 列号
      rowspan: 'number',         // 行跨度
      script: 'string'           // 脚本内容
    }
  ]
}
```

## API接口定义

```javascript
/**
 * 脚本决策表API
 */
import request from '@/utils/request'

export const scriptTableApi = {
  /**
   * 加载脚本表格
   */
  loadScriptTable(file, version) {
    return request({
      url: '/api/urule/common/loadXml',
      method: 'post',
      data: {
        files: file,
        version
      }
    })
  },

  /**
   * 保存脚本表格
   */
  saveScriptTable(data) {
    return request({
      url: '/api/urule/common/saveFile',
      method: 'post',
      data
    })
  }
}
```

## 路由配置

```javascript
// router/modules/scriptTable.js
export default {
  path: '/script-decision-table-editor',
  name: 'ScriptDecisionTableEditor',
  component: () => import('@/views/scriptDecisionTable/index.vue'),
  meta: {
    title: '脚本决策表编辑器',
    icon: 'script-table',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 脚本编辑功能
- [ ] 语法验证功能
- [ ] 代码提示功能
- [ ] 保存和加载功能
- [ ] 表格操作功能

### 2. 界面测试
- [ ] 代码编辑器正确显示
- [ ] 语法高亮正确
- [ ] 错误提示正确
- [ ] 响应式布局适配

### 3. 性能测试
- [ ] 大型脚本编辑性能
- [ ] 语法验证效率
- [ ] 代码提示响应速度

## 注意事项

### 1. 技术要点
- 集成CodeMirror实现代码编辑
- 实现URule脚本语法支持
- 提供智能代码提示
- 支持实时语法验证

### 2. 用户体验
- 提供类似IDE的编辑体验
- 支持代码格式化
- 实现错误快速定位
- 优化编辑性能

---

**预计完成时间**: 22小时  
**测试时间**: 5小时  
**文档更新**: 2小时  
**总计**: 29小时 