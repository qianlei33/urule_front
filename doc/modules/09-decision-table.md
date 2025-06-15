# 决策表编辑器模块迁移计划

## 模块概述

决策表编辑器是URule系统中的重要编辑器，提供表格形式的规则编辑功能。用户可以通过类似Excel的界面创建和编辑决策表，支持条件列、动作列的配置，以及复杂的表格操作。

### 功能特性
- 类似Excel的表格编辑界面
- 条件列和动作列配置
- 单元格合并和拆分
- 行列的增删改操作
- 表格数据的导入导出
- 实时数据验证

### 技术要求
- **预计工作量**: 30小时
- **优先级**: 高
- **依赖模块**: 公共组件库、变量管理、常量管理、动作管理
- **技术栈**: Vue 3 + Element Plus + 自定义表格组件

## 老项目分析

### 核心功能分析

#### 1. 表格编辑器 (DecisionTable.js)
- **基于Handsontable**: 使用Handsontable库实现表格编辑
- **列类型管理**: 支持条件列、动作列、执行方法列等
- **单元格操作**: 合并、拆分、编辑单元格内容
- **行列操作**: 添加/删除行列、调整大小

#### 2. 工具栏功能
- **添加/删除条件**: 动态添加条件行
- **配置库**: 导入变量库、常量库、动作库、参数库
- **保存功能**: 支持保存和保存新版本

#### 3. 列配置
- **条件列**: 配置变量、操作符
- **动作列**: 配置动作类型、参数
- **执行方法列**: 配置方法调用
- **控制台输出列**: 配置输出内容

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/decisionTable/
├── index.vue                   # 主编辑器页面
├── components/
│   ├── DecisionTableToolbar.vue # 工具栏组件
│   ├── DecisionTableGrid.vue   # 表格组件
│   ├── ColumnConfigDialog.vue  # 列配置对话框
│   ├── CellEditor.vue          # 单元格编辑器
│   └── PropertyPanel.vue       # 属性面板
├── composables/
│   ├── useDecisionTable.js     # 决策表逻辑
│   ├── useTableGrid.js         # 表格操作逻辑
│   └── useColumnConfig.js      # 列配置逻辑
├── stores/
│   └── decisionTableStore.js   # 状态管理
└── utils/
    ├── tableXmlBuilder.js      # XML构建工具
    └── tableDataProcessor.js   # 数据处理工具
```

### 2. 主编辑器页面 (index.vue)

```vue
<template>
  <div class="decision-table-editor">
    <!-- 工具栏 -->
    <DecisionTableToolbar
      @save="handleSave"
      @save-new-version="handleSaveNewVersion"
      @add-criteria="handleAddCriteria"
      @delete-criteria="handleDeleteCriteria"
      @config-variable="handleConfigVariable"
      @config-constant="handleConfigConstant"
      @config-action="handleConfigAction"
      @config-parameter="handleConfigParameter"
    />

    <!-- 属性面板 -->
    <PropertyPanel
      :properties="tableProperties"
      @add-property="handleAddProperty"
      @update-property="handleUpdateProperty"
      @delete-property="handleDeleteProperty"
    />

    <!-- 备注区域 -->
    <div class="remark-section">
      <el-input
        v-model="remarkContent"
        type="textarea"
        placeholder="请输入备注信息..."
        :rows="2"
        resize="vertical"
      />
    </div>

    <!-- 决策表格 -->
    <div class="table-container">
      <DecisionTableGrid
        ref="tableGridRef"
        :table-data="tableData"
        :columns="columns"
        :rows="rows"
        :cells="cells"
        @cell-change="handleCellChange"
        @column-resize="handleColumnResize"
        @row-resize="handleRowResize"
        @selection-change="handleSelectionChange"
      />
    </div>

    <!-- 配置对话框 -->
    <ColumnConfigDialog
      v-model="columnConfigVisible"
      :column-data="editingColumn"
      @confirm="handleColumnConfig"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import DecisionTableToolbar from './components/DecisionTableToolbar.vue'
import DecisionTableGrid from './components/DecisionTableGrid.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import ColumnConfigDialog from './components/ColumnConfigDialog.vue'
import { useDecisionTable } from './composables/useDecisionTable'

/**
 * 决策表编辑器主页面
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
  tableProperties,
  remarkContent,
  isDirty,
  loadDecisionTable,
  saveDecisionTable,
  addCriteria,
  deleteCriteria
} = useDecisionTable()

// 响应式数据
const tableGridRef = ref()
const columnConfigVisible = ref(false)
const editingColumn = ref(null)

// 生命周期
onMounted(() => {
  if (file) {
    loadDecisionTable(file, version)
  }
})

// 事件处理
const handleSave = async () => {
  try {
    await saveDecisionTable(false)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveNewVersion = async () => {
  try {
    await saveDecisionTable(true)
    ElMessage.success('保存新版本成功')
  } catch (error) {
    ElMessage.error('保存新版本失败')
  }
}

const handleAddCriteria = () => {
  const selection = tableGridRef.value?.getSelection()
  if (selection && selection.col !== undefined) {
    addCriteria(selection.col)
  } else {
    ElMessage.warning('请先选择一个条件列')
  }
}

const handleDeleteCriteria = () => {
  const selection = tableGridRef.value?.getSelection()
  if (selection && selection.col !== undefined) {
    deleteCriteria(selection.col)
  } else {
    ElMessage.warning('请先选择要删除的条件')
  }
}

const handleCellChange = (row, col, oldValue, newValue) => {
  // 处理单元格变化
}

const handleColumnResize = (col, width) => {
  // 处理列宽调整
}

const handleRowResize = (row, height) => {
  // 处理行高调整
}

const handleSelectionChange = (selection) => {
  // 处理选择变化
}

const handleAddProperty = (property) => {
  tableProperties.value.push(property)
}

const handleUpdateProperty = (property) => {
  const index = tableProperties.value.findIndex(p => p.id === property.id)
  if (index > -1) {
    tableProperties.value[index] = property
  }
}

const handleDeleteProperty = (propertyId) => {
  const index = tableProperties.value.findIndex(p => p.id === propertyId)
  if (index > -1) {
    tableProperties.value.splice(index, 1)
  }
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

const handleColumnConfig = (columnData) => {
  // 处理列配置
  columnConfigVisible.value = false
}
</script>

<style scoped>
.decision-table-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.remark-section {
  margin: 10px;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
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

### 3. 决策表格组件 (DecisionTableGrid.vue)

```vue
<template>
  <div class="decision-table-grid">
    <div ref="gridContainer" class="grid-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { createTableGrid } from '../utils/tableGridFactory'

/**
 * 决策表格组件
 * 基于自定义表格实现，替代Handsontable
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
  'cell-change',
  'column-resize',
  'row-resize',
  'selection-change'
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
  gridInstance = createTableGrid(gridContainer.value, {
    data: props.tableData,
    columns: props.columns,
    rows: props.rows,
    cells: props.cells,
    onCellChange: (row, col, oldValue, newValue) => {
      emit('cell-change', row, col, oldValue, newValue)
    },
    onColumnResize: (col, width) => {
      emit('column-resize', col, width)
    },
    onRowResize: (row, height) => {
      emit('row-resize', row, height)
    },
    onSelectionChange: (selection) => {
      emit('selection-change', selection)
    }
  })
}

const getSelection = () => {
  return gridInstance?.getSelection()
}

const setSelection = (row, col) => {
  gridInstance?.setSelection(row, col)
}

const mergeCells = (row, col, rowspan, colspan) => {
  gridInstance?.mergeCells(row, col, rowspan, colspan)
}

const unmergeCells = (row, col) => {
  gridInstance?.unmergeCells(row, col)
}

// 暴露方法
defineExpose({
  getSelection,
  setSelection,
  mergeCells,
  unmergeCells
})
</script>

<style scoped>
.decision-table-grid {
  height: 100%;
  width: 100%;
}

.grid-container {
  height: 100%;
  width: 100%;
}
</style>
```

### 4. 组合式API - useDecisionTable.js

```javascript
/**
 * 决策表管理组合式API
 */
import { ref, computed } from 'vue'
import { decisionTableApi } from '@/api/decisionTable'
import { generateId } from '@/utils/common'
import { buildDecisionTableXml } from '../utils/tableXmlBuilder'

export function useDecisionTable() {
  // 响应式数据
  const tableData = ref({})
  const columns = ref([])
  const rows = ref([])
  const cells = ref([])
  const tableProperties = ref([])
  const remarkContent = ref('')
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

  /**
   * 加载决策表
   */
  const loadDecisionTable = async (file, version) => {
    try {
      loading.value = true
      const response = await decisionTableApi.loadDecisionTable(file, version)
      const data = response.data

      parseDecisionTableData(data)
      isDirty.value = false
    } catch (error) {
      console.error('Load decision table error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存决策表
   */
  const saveDecisionTable = async (newVersion = false) => {
    try {
      loading.value = true
      
      const xml = buildDecisionTableXml({
        tableData: tableData.value,
        columns: columns.value,
        rows: rows.value,
        cells: cells.value,
        properties: tableProperties.value,
        remark: remarkContent.value,
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

      await decisionTableApi.saveDecisionTable(params)
      isDirty.value = false
    } catch (error) {
      console.error('Save decision table error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加条件行
   */
  const addCriteria = (col) => {
    const column = columns.value.find(c => c.num === col)
    if (!column || column.type !== 'Criteria') {
      return
    }

    // 找到当前列的最后一行
    const columnCells = cells.value.filter(cell => cell.col === col)
    const lastRow = Math.max(...columnCells.map(cell => cell.row + cell.rowspan - 1))
    const newRow = lastRow + 1

    // 创建新行数据
    const newRowData = {
      num: newRow,
      height: 40
    }
    rows.value.push(newRowData)

    // 为所有列创建新的单元格
    columns.value.forEach(column => {
      const newCell = {
        row: newRow,
        col: column.num,
        rowspan: 1,
        content: ''
      }
      cells.value.push(newCell)
    })

    setDirty()
  }

  /**
   * 删除条件行
   */
  const deleteCriteria = (col) => {
    const column = columns.value.find(c => c.num === col)
    if (!column || column.type !== 'Criteria') {
      return
    }

    // 找到要删除的行
    const columnCells = cells.value.filter(cell => cell.col === col)
    if (columnCells.length <= 1) {
      return // 至少保留一行
    }

    const lastRow = Math.max(...columnCells.map(cell => cell.row))
    
    // 删除行数据
    const rowIndex = rows.value.findIndex(r => r.num === lastRow)
    if (rowIndex > -1) {
      rows.value.splice(rowIndex, 1)
    }

    // 删除该行的所有单元格
    cells.value = cells.value.filter(cell => cell.row !== lastRow)

    setDirty()
  }

  /**
   * 解析决策表数据
   */
  const parseDecisionTableData = (data) => {
    tableData.value = data

    // 解析备注
    remarkContent.value = data.remark || ''

    // 解析属性
    tableProperties.value = parseTableProperties(data)

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

    // 解析单元格数据
    cells.value = (data.cells || []).map(cell => ({
      row: cell.row,
      col: cell.col,
      rowspan: cell.rowspan || 1,
      content: cell.content || ''
    }))
  }

  /**
   * 解析表格属性
   */
  const parseTableProperties = (data) => {
    const properties = []
    
    if (data.salience) {
      properties.push({
        id: generateId(),
        name: 'salience',
        value: data.salience,
        type: 'number'
      })
    }

    if (data.enabled !== undefined) {
      properties.push({
        id: generateId(),
        name: 'enabled',
        value: data.enabled,
        type: 'boolean'
      })
    }

    if (data.effectiveDate) {
      properties.push({
        id: generateId(),
        name: 'effective-date',
        value: data.effectiveDate,
        type: 'date'
      })
    }

    if (data.expiresDate) {
      properties.push({
        id: generateId(),
        name: 'expires-date',
        value: data.expiresDate,
        type: 'date'
      })
    }

    if (data.debug !== undefined) {
      properties.push({
        id: generateId(),
        name: 'debug',
        value: data.debug,
        type: 'boolean'
      })
    }

    return properties
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
    tableProperties,
    remarkContent,
    libraries,
    isDirty,
    loading,
    columnCount,
    rowCount,
    loadDecisionTable,
    saveDecisionTable,
    addCriteria,
    deleteCriteria,
    setDirty
  }
}
```

### 5. 表格工厂类 (tableGridFactory.js)

```javascript
/**
 * 表格工厂类
 * 创建自定义表格组件，替代Handsontable
 */

export function createTableGrid(container, options) {
  return new DecisionTableGrid(container, options)
}

class DecisionTableGrid {
  constructor(container, options) {
    this.container = container
    this.options = options
    this.data = options.data || {}
    this.columns = options.columns || []
    this.rows = options.rows || []
    this.cells = options.cells || []
    this.selection = null
    
    this.init()
  }

  init() {
    this.createTable()
    this.bindEvents()
  }

  createTable() {
    // 创建表格DOM结构
    const table = document.createElement('table')
    table.className = 'decision-table'
    
    // 创建表头
    const thead = document.createElement('thead')
    const headerRow = document.createElement('tr')
    
    // 添加行号列
    const rowHeaderCell = document.createElement('th')
    rowHeaderCell.textContent = ''
    rowHeaderCell.className = 'row-header'
    headerRow.appendChild(rowHeaderCell)
    
    // 添加列头
    this.columns.forEach(column => {
      const th = document.createElement('th')
      th.textContent = this.getColumnHeader(column)
      th.className = 'column-header'
      th.dataset.col = column.num
      headerRow.appendChild(th)
    })
    
    thead.appendChild(headerRow)
    table.appendChild(thead)
    
    // 创建表体
    const tbody = document.createElement('tbody')
    this.rows.forEach(row => {
      const tr = document.createElement('tr')
      tr.dataset.row = row.num
      
      // 添加行号
      const rowHeaderCell = document.createElement('td')
      rowHeaderCell.textContent = row.num + 1
      rowHeaderCell.className = 'row-header'
      tr.appendChild(rowHeaderCell)
      
      // 添加数据单元格
      this.columns.forEach(column => {
        const cell = this.getCellData(row.num, column.num)
        const td = document.createElement('td')
        td.textContent = cell?.content || ''
        td.className = 'data-cell'
        td.dataset.row = row.num
        td.dataset.col = column.num
        
        if (cell?.rowspan > 1) {
          td.rowSpan = cell.rowspan
        }
        
        tr.appendChild(td)
      })
      
      tbody.appendChild(tr)
    })
    
    table.appendChild(tbody)
    this.container.appendChild(table)
    
    this.table = table
  }

  getColumnHeader(column) {
    const type = column.type
    const category = column.variableCategory === 'parameter' ? '参数' : column.variableCategory
    const variable = column.variableLabel
    
    let title = category && variable ? `${category}.${variable}` : ''
    let icon = ''
    
    switch (type) {
      case 'Criteria':
        icon = '🔍'
        break
      case 'ExecuteMethod':
        title = '执行方法'
        icon = '⚡'
        break
      case 'Assignment':
        icon = '📝'
        break
      case 'ConsolePrint':
        title = '控制台输出'
        icon = '🖨️'
        break
    }
    
    return `${icon} ${title}`
  }

  getCellData(row, col) {
    return this.cells.find(cell => cell.row === row && cell.col === col)
  }

  bindEvents() {
    // 绑定单元格点击事件
    this.table.addEventListener('click', (e) => {
      if (e.target.classList.contains('data-cell')) {
        const row = parseInt(e.target.dataset.row)
        const col = parseInt(e.target.dataset.col)
        this.setSelection(row, col)
      }
    })
    
    // 绑定单元格双击事件
    this.table.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('data-cell')) {
        this.editCell(e.target)
      }
    })
  }

  setSelection(row, col) {
    // 清除之前的选择
    const prevSelected = this.table.querySelector('.selected')
    if (prevSelected) {
      prevSelected.classList.remove('selected')
    }
    
    // 设置新的选择
    const cell = this.table.querySelector(`[data-row="${row}"][data-col="${col}"]`)
    if (cell) {
      cell.classList.add('selected')
      this.selection = { row, col }
      
      if (this.options.onSelectionChange) {
        this.options.onSelectionChange(this.selection)
      }
    }
  }

  getSelection() {
    return this.selection
  }

  editCell(cellElement) {
    const row = parseInt(cellElement.dataset.row)
    const col = parseInt(cellElement.dataset.col)
    const oldValue = cellElement.textContent
    
    // 创建输入框
    const input = document.createElement('input')
    input.type = 'text'
    input.value = oldValue
    input.className = 'cell-editor'
    
    // 替换单元格内容
    cellElement.innerHTML = ''
    cellElement.appendChild(input)
    input.focus()
    input.select()
    
    // 处理输入完成
    const finishEdit = () => {
      const newValue = input.value
      cellElement.textContent = newValue
      
      if (oldValue !== newValue) {
        // 更新数据
        const cellData = this.getCellData(row, col)
        if (cellData) {
          cellData.content = newValue
        }
        
        if (this.options.onCellChange) {
          this.options.onCellChange(row, col, oldValue, newValue)
        }
      }
    }
    
    input.addEventListener('blur', finishEdit)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        finishEdit()
      } else if (e.key === 'Escape') {
        cellElement.textContent = oldValue
      }
    })
  }

  mergeCells(row, col, rowspan, colspan) {
    // 实现单元格合并逻辑
  }

  unmergeCells(row, col) {
    // 实现单元格拆分逻辑
  }

  setData(data) {
    this.data = data
    // 重新渲染表格
    this.container.innerHTML = ''
    this.createTable()
    this.bindEvents()
  }

  destroy() {
    if (this.table) {
      this.table.remove()
    }
  }
}
```

## 数据结构定义

### 决策表数据结构
```javascript
const DecisionTableData = {
  remark: 'string',              // 备注信息
  properties: [                  // 表格属性
    {
      name: 'string',            // 属性名
      value: 'any',              // 属性值
      type: 'string'             // 属性类型
    }
  ],
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
  cells: [                       // 单元格数据
    {
      row: 'number',             // 行号
      col: 'number',             // 列号
      rowspan: 'number',         // 行跨度
      content: 'string'          // 单元格内容
    }
  ]
}
```

## API接口定义

```javascript
/**
 * 决策表编辑器API
 */
import request from '@/utils/request'

export const decisionTableApi = {
  /**
   * 加载决策表
   */
  loadDecisionTable(file, version) {
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
   * 保存决策表
   */
  saveDecisionTable(data) {
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
// router/modules/decisionTable.js
export default {
  path: '/decision-table-editor',
  name: 'DecisionTableEditor',
  component: () => import('@/views/decisionTable/index.vue'),
  meta: {
    title: '决策表编辑器',
    icon: 'table',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 表格的基本编辑功能
- [ ] 行列的增删改操作
- [ ] 单元格合并和拆分
- [ ] 列配置功能
- [ ] 保存和加载功能

### 2. 界面测试
- [ ] 表格正确渲染
- [ ] 响应式布局适配
- [ ] 交互操作流畅

### 3. 性能测试
- [ ] 大数据量表格性能
- [ ] 复杂操作响应速度
- [ ] 内存使用情况

## 注意事项

### 1. 技术要点
- 自定义表格组件替代Handsontable
- 实现复杂的单元格操作
- 支持表格数据的序列化和反序列化
- 优化大数据量时的性能

### 2. 用户体验
- 保持与Excel类似的操作体验
- 提供丰富的快捷键支持
- 实现撤销/重做功能
- 优化编辑流程

---

**预计完成时间**: 30小时  
**测试时间**: 8小时  
**文档更新**: 2小时  
**总计**: 40小时 