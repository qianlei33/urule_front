# 参数管理模块迁移计划

## 模块概述

参数管理模块负责管理规则引擎中使用的参数定义。参数是规则执行时的输入输出变量，与变量不同的是，参数通常在规则执行时由外部传入，作为规则执行的上下文。

## 功能分析

根据老项目代码分析，参数管理模块包含以下功能：

1. **参数列表管理**
   - 参数列表展示（表格形式）
   - 支持过滤搜索
   - 单行选中高亮

2. **参数编辑**
   - 添加参数
   - 编辑参数信息（名称、标题、数据类型）
   - 删除参数
   - 表格内直接编辑

3. **数据类型支持**
   - 基础类型：String、Integer、Char、Double、Long、Float、BigDecimal、Boolean、Date
   - 集合类型：List、Set、Map
   - 复杂类型：Enum、Object

4. **其他功能**
   - 保存参数库文件
   - 保存为新版本
   - 查看参数引用

## 组件结构

```
src/views/parameter/
├── index.vue                    # 参数管理主页面
├── components/
│   ├── ParameterTable.vue      # 参数表格组件
│   └── ParameterDialog.vue     # 参数编辑对话框
├── composables/
│   └── useParameter.js         # 参数管理逻辑
└── stores/
    └── parameter.js            # 参数状态管理
```

## 详细设计

### 1. 主页面 (index.vue)

```vue
<template>
  <div class="parameter-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button type="primary" icon="Plus" @click="handleAdd">
          添加
        </el-button>
      </el-button-group>
      
      <el-button-group>
        <el-button type="danger" icon="Check" @click="handleSave(false)">
          保存
        </el-button>
        <el-button type="danger" icon="DocumentCopy" @click="handleSave(true)">
          保存为新版本
        </el-button>
      </el-button-group>
      
      <el-button type="info" icon="Link" :disabled="!currentRow" @click="handleViewReference">
        查看引用
      </el-button>
    </div>
    
    <!-- 参数表格 -->
    <div class="table-container">
      <ParameterTable
        :data="parameters"
        :loading="loading"
        @row-click="handleRowClick"
        @cell-edit="handleCellEdit"
        @delete="handleDelete"
      />
    </div>
    
    <!-- 参数编辑对话框 -->
    <ParameterDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :data="editingData"
      @confirm="handleDialogConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useParameterStore } from './stores/parameter'
import ParameterTable from './components/ParameterTable.vue'
import ParameterDialog from './components/ParameterDialog.vue'

const props = defineProps({
  file: {
    type: String,
    required: true
  }
})

const parameterStore = useParameterStore()

// 状态
const parameters = computed(() => parameterStore.parameters)
const loading = ref(false)
const currentRow = ref(null)

// 对话框
const dialogVisible = ref(false)
const dialogMode = ref('add')
const editingData = ref(null)

// 初始化
onMounted(() => {
  loadData()
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    await parameterStore.loadParameterData(props.file)
  } finally {
    loading.value = false
  }
}

// 添加参数
const handleAdd = () => {
  editingData.value = {
    name: '',
    label: '',
    type: 'String'
  }
  dialogMode.value = 'add'
  dialogVisible.value = true
}

// 行点击
const handleRowClick = (row) => {
  currentRow.value = row
}

// 单元格编辑
const handleCellEdit = ({ row, column, value }) => {
  const field = column.property
  if (field && row[field] !== value) {
    row[field] = value
    parameterStore.updateParameter(row)
  }
}

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该参数吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    parameterStore.deleteParameter(row)
    if (currentRow.value?.name === row.name) {
      currentRow.value = null
    }
  } catch {
    // 用户取消
  }
}

// 对话框确认
const handleDialogConfirm = (data) => {
  if (dialogMode.value === 'add') {
    parameterStore.addParameter(data)
  } else {
    parameterStore.updateParameter(data)
  }
  dialogVisible.value = false
}

// 保存
const handleSave = async (newVersion) => {
  try {
    // 验证数据
    const error = validateData()
    if (error) {
      ElMessage.error(error)
      return
    }
    
    if (newVersion) {
      const { value } = await ElMessageBox.prompt(
        '请输入新版本描述',
        '保存为新版本',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputPattern: /.+/,
          inputErrorMessage: '版本描述不能为空'
        }
      )
      await parameterStore.save(props.file, true, value)
    } else {
      await parameterStore.save(props.file, false)
    }
    ElMessage.success('保存成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存失败：' + error.message)
    }
  }
}

// 查看引用
const handleViewReference = () => {
  if (!currentRow.value) return
  
  const data = {
    path: props.file,
    varLabel: currentRow.value.label,
    varName: currentRow.value.name
  }
  
  // 触发查看引用事件
  parameterStore.viewReference(data)
}

// 数据验证
const validateData = () => {
  for (const param of parameters.value) {
    if (!param.name || param.name.trim().length === 0) {
      return '参数名称不能为空'
    }
    if (!param.label || param.label.trim().length === 0) {
      return '参数标题不能为空'
    }
    if (!param.type) {
      return '参数数据类型不能为空'
    }
  }
  return null
}
</script>

<style lang="scss" scoped>
.parameter-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px;
  
  .toolbar {
    padding: 10px;
    background: #f5f5f5;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    margin-bottom: 10px;
    display: flex;
    gap: 10px;
  }
  
  .table-container {
    flex: 1;
    border: 1px solid #e6e6e6;
    border-radius: 4px;
    overflow: hidden;
  }
}
</style>
```

### 2. 参数表格组件 (ParameterTable.vue)

```vue
<template>
  <el-table
    :data="data"
    :loading="loading"
    height="100%"
    highlight-current-row
    @row-click="handleRowClick"
  >
    <el-table-column type="index" label="序号" width="60" />
    
    <el-table-column prop="name" label="名称" min-width="200">
      <template #default="{ row }">
        <el-input
          v-if="editingCell.row === row && editingCell.field === 'name'"
          v-model="editingCell.value"
          size="small"
          @blur="handleEditComplete"
          @keyup.enter="handleEditComplete"
          @keyup.esc="handleEditCancel"
        />
        <span 
          v-else 
          class="cell-text"
          @dblclick="handleCellDblClick(row, 'name')"
        >
          {{ row.name }}
        </span>
      </template>
    </el-table-column>
    
    <el-table-column prop="label" label="标题" min-width="200">
      <template #default="{ row }">
        <el-input
          v-if="editingCell.row === row && editingCell.field === 'label'"
          v-model="editingCell.value"
          size="small"
          @blur="handleEditComplete"
          @keyup.enter="handleEditComplete"
          @keyup.esc="handleEditCancel"
        />
        <span 
          v-else 
          class="cell-text"
          @dblclick="handleCellDblClick(row, 'label')"
        >
          {{ row.label }}
        </span>
      </template>
    </el-table-column>
    
    <el-table-column prop="type" label="数据类型" width="180">
      <template #default="{ row }">
        <el-select
          v-if="editingCell.row === row && editingCell.field === 'type'"
          v-model="editingCell.value"
          size="small"
          @change="handleEditComplete"
          @blur="handleEditComplete"
        >
          <el-option
            v-for="type in dataTypes"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>
        <el-tag 
          v-else 
          size="small"
          class="cell-text"
          @dblclick="handleCellDblClick(row, 'type')"
        >
          {{ row.type }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column label="操作" width="100" align="center">
      <template #default="{ row }">
        <el-button
          type="danger"
          size="small"
          icon="Delete"
          circle
          @click.stop="handleDelete(row)"
        />
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: Boolean
})

const emit = defineEmits(['row-click', 'cell-edit', 'delete'])

// 数据类型选项
const dataTypes = [
  'String', 'Integer', 'Char', 'Double', 'Long', 'Float',
  'BigDecimal', 'Boolean', 'Date', 'List', 'Set', 'Map',
  'Enum', 'Object'
]

// 编辑状态
const editingCell = reactive({
  row: null,
  field: null,
  value: null
})

// 行点击
const handleRowClick = (row) => {
  emit('row-click', row)
}

// 双击单元格进入编辑
const handleCellDblClick = (row, field) => {
  // 名称字段在编辑模式下不允许修改
  if (field === 'name' && row.name) {
    return
  }
  
  editingCell.row = row
  editingCell.field = field
  editingCell.value = row[field]
  
  nextTick(() => {
    const input = document.querySelector('.el-input__inner')
    if (input) {
      input.focus()
      input.select()
    }
  })
}

// 完成编辑
const handleEditComplete = () => {
  if (editingCell.row && editingCell.field) {
    emit('cell-edit', {
      row: editingCell.row,
      column: { property: editingCell.field },
      value: editingCell.value
    })
  }
  resetEditing()
}

// 取消编辑
const handleEditCancel = () => {
  resetEditing()
}

// 重置编辑状态
const resetEditing = () => {
  editingCell.row = null
  editingCell.field = null
  editingCell.value = null
}

// 删除
const handleDelete = (row) => {
  emit('delete', row)
}
</script>

<style lang="scss" scoped>
.cell-text {
  display: inline-block;
  width: 100%;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
}

.el-input,
.el-select {
  width: 100%;
}
</style>
```

### 3. 参数编辑对话框 (ParameterDialog.vue)

```vue
<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入参数名称"
          :disabled="mode === 'edit'"
        />
      </el-form-item>
      <el-form-item label="标题" prop="label">
        <el-input
          v-model="formData.label"
          placeholder="请输入参数标题"
        />
      </el-form-item>
      <el-form-item label="数据类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择数据类型">
          <el-option
            v-for="type in dataTypes"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  mode: {
    type: String,
    default: 'add'
  },
  data: Object
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const formRef = ref()
const formData = ref({
  name: '',
  label: '',
  type: 'String'
})

const dataTypes = [
  'String', 'Integer', 'Char', 'Double', 'Long', 'Float',
  'BigDecimal', 'Boolean', 'Date', 'List', 'Set', 'Map',
  'Enum', 'Object'
]

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  return props.mode === 'add' ? '添加参数' : '编辑参数'
})

const rules = {
  name: [
    { required: true, message: '请输入参数名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '名称必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入参数标题', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ]
}

watch(() => props.data, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal }
  }
}, { immediate: true })

const handleConfirm = async () => {
  try {
    await formRef.value.validate()
    emit('confirm', { ...formData.value })
  } catch {
    // 验证失败
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleClose = () => {
  formRef.value?.resetFields()
}
</script>
```

### 4. 状态管理 (stores/parameter.js)

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as parameterAPI from '@/api/parameter'
import { generateXML } from '@/utils/parameterUtils'

export const useParameterStore = defineStore('parameter', () => {
  // 状态
  const parameters = ref([])
  
  // 加载参数数据
  const loadParameterData = async (file) => {
    try {
      const data = await parameterAPI.loadParameterFile(file)
      parameters.value = data.parameters || []
    } catch (error) {
      console.error('加载参数数据失败:', error)
      throw error
    }
  }
  
  // 添加参数
  const addParameter = (parameter) => {
    parameters.value.push({
      ...parameter,
      act: 'InOut' // 参数默认为输入输出类型
    })
  }
  
  // 更新参数
  const updateParameter = (parameter) => {
    const index = parameters.value.findIndex(p => p.name === parameter.name)
    if (index > -1) {
      parameters.value[index] = {
        ...parameters.value[index],
        ...parameter
      }
    }
  }
  
  // 删除参数
  const deleteParameter = (parameter) => {
    const index = parameters.value.findIndex(p => p.name === parameter.name)
    if (index > -1) {
      parameters.value.splice(index, 1)
    }
  }
  
  // 保存
  const save = async (file, newVersion, versionComment) => {
    const xml = generateXML(parameters.value)
    await parameterAPI.saveParameterFile({
      content: xml,
      file,
      newVersion,
      versionComment
    })
  }
  
  // 查看引用
  const viewReference = (data) => {
    // 触发查看引用的事件或打开对话框
    console.log('查看参数引用:', data)
  }
  
  return {
    parameters,
    loadParameterData,
    addParameter,
    updateParameter,
    deleteParameter,
    save,
    viewReference
  }
})
```

### 5. API接口定义

```javascript
// src/api/parameter.js
import request from '@/api'

/**
 * 加载参数文件
 */
export function loadParameterFile(file) {
  return request({
    url: '/xml',
    method: 'post',
    data: { files: file }
  }).then(res => res[0])
}

/**
 * 保存参数文件
 */
export function saveParameterFile(data) {
  return request({
    url: '/common/saveFile',
    method: 'post',
    data
  })
}
```

### 6. 工具函数

```javascript
// src/utils/parameterUtils.js

/**
 * 生成参数库XML
 */
export function generateXML(parameters) {
  let xml = '<?xml version="1.0" encoding="utf-8"?>'
  xml += '<parameter-library>'
  
  parameters.forEach(param => {
    xml += `<parameter name='${param.name}' label='${param.label}' type='${param.type}' act='InOut'/>`
  })
  
  xml += '</parameter-library>'
  
  return encodeURIComponent(xml)
}
```

## 数据结构

### 参数数据结构
```javascript
{
  name: 'customerId',    // 参数名称
  label: '客户ID',       // 参数标题
  type: 'String',        // 数据类型
  act: 'InOut'           // 固定为InOut（输入输出）
}
```

## 测试要点

1. **参数管理**
   - 添加、编辑、删除参数
   - 参数名称唯一性验证
   - 表格内直接编辑功能

2. **数据验证**
   - 参数名称、标题非空验证
   - 参数名称格式验证（标识符规范）
   - 数据类型必选验证

3. **数据保存**
   - 普通保存功能
   - 保存为新版本功能
   - 保存前的数据验证

4. **界面交互**
   - 双击单元格进入编辑模式
   - 回车确认编辑，ESC取消编辑
   - 行选中高亮
   - 工具栏按钮状态控制

## 注意事项

1. 参数名称必须符合标识符规范（字母开头，只包含字母、数字、下划线）
2. 参数的act属性固定为'InOut'，表示既可输入也可输出
3. 参数名称一旦创建不允许修改（编辑模式下禁用）
4. 支持表格内直接编辑，提升用户体验

## 依赖关系

- 依赖：项目初始化、主框架、公共组件库
- 被依赖：决策集编辑器、决策表编辑器等（参数引用）

## 预计工时

- 主页面开发：2小时
- 表格组件开发：3小时
- 编辑对话框：1小时
- 状态管理和API：2小时
- 测试和优化：2小时

**总计：10小时** 