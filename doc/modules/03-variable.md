# 变量管理模块迁移计划

## 模块概述

变量管理模块负责管理规则引擎中使用的变量定义，包括变量的创建、编辑、删除、分类管理等功能。这是规则引擎的基础模块之一。

## 功能分析

根据老项目代码分析，变量管理模块包含以下功能：

1. **变量列表展示**
   - 树形结构展示变量分类
   - 支持变量搜索
   - 支持拖拽排序

2. **变量编辑**
   - 变量基本信息编辑（名称、标签、类型等）
   - 变量成员管理（对于复杂类型）
   - 变量验证规则设置

3. **变量操作**
   - 新增变量/分类
   - 编辑变量/分类
   - 删除变量/分类
   - 复制粘贴变量

4. **数据类型支持**
   - 基础类型：String、Integer、Double、Boolean、Date等
   - 复杂类型：Object、List、Set、Map等
   - 自定义类型引用

## 组件结构

```
src/views/variable/
├── index.vue                    # 变量管理主页面
├── components/
│   ├── VariableTree.vue        # 变量树组件
│   ├── VariableEditor.vue      # 变量编辑器组件
│   ├── VariableTypeSelect.vue  # 变量类型选择组件
│   ├── MemberEditor.vue        # 成员编辑器组件
│   └── CategoryDialog.vue      # 分类管理对话框
├── composables/
│   ├── useVariable.js          # 变量管理逻辑
│   └── useVariableType.js      # 变量类型处理
└── stores/
    └── variable.js             # 变量状态管理
```

## 详细设计

### 1. 主页面 (index.vue)

```vue
<template>
  <div class="variable-container">
    <el-container>
      <!-- 左侧变量树 -->
      <el-aside width="300px" class="variable-aside">
        <div class="aside-header">
          <el-button type="primary" size="small" @click="handleAddCategory">
            新增分类
          </el-button>
          <el-button type="primary" size="small" @click="handleAddVariable">
            新增变量
          </el-button>
        </div>
        <VariableTree
          :data="treeData"
          :loading="treeLoading"
          @node-click="handleNodeClick"
          @node-command="handleNodeCommand"
        />
      </el-aside>
      
      <!-- 右侧编辑区 -->
      <el-main class="variable-main">
        <VariableEditor
          v-if="currentVariable"
          :variable="currentVariable"
          :readonly="readonly"
          @save="handleSaveVariable"
          @cancel="handleCancel"
        />
        <div v-else class="empty-placeholder">
          <el-empty description="请选择要编辑的变量" />
        </div>
      </el-main>
    </el-container>
    
    <!-- 分类管理对话框 -->
    <CategoryDialog
      v-model="categoryDialogVisible"
      :mode="categoryDialogMode"
      :category="currentCategory"
      @confirm="handleCategoryConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useVariableStore } from './stores/variable'
import VariableTree from './components/VariableTree.vue'
import VariableEditor from './components/VariableEditor.vue'
import CategoryDialog from './components/CategoryDialog.vue'

const variableStore = useVariableStore()

// 数据
const treeData = computed(() => variableStore.treeData)
const treeLoading = ref(false)
const currentVariable = ref(null)
const currentCategory = ref(null)
const readonly = ref(false)

// 对话框
const categoryDialogVisible = ref(false)
const categoryDialogMode = ref('add')

// 初始化
onMounted(() => {
  loadVariables()
})

// 加载变量数据
const loadVariables = async () => {
  treeLoading.value = true
  try {
    await variableStore.loadVariables()
  } finally {
    treeLoading.value = false
  }
}

// 节点点击
const handleNodeClick = (node) => {
  if (node.type === 'variable') {
    currentVariable.value = node.data
  }
}

// 节点命令
const handleNodeCommand = ({ command, node }) => {
  switch (command) {
    case 'edit':
      if (node.type === 'category') {
        editCategory(node)
      } else {
        editVariable(node)
      }
      break
    case 'delete':
      deleteNode(node)
      break
    case 'copy':
      copyVariable(node)
      break
    // 其他命令...
  }
}

// 新增分类
const handleAddCategory = () => {
  currentCategory.value = null
  categoryDialogMode.value = 'add'
  categoryDialogVisible.value = true
}

// 新增变量
const handleAddVariable = () => {
  currentVariable.value = {
    name: '',
    label: '',
    type: 'String',
    act: 'InOut',
    defaultValue: '',
    members: []
  }
}

// 保存变量
const handleSaveVariable = async (variable) => {
  try {
    await variableStore.saveVariable(variable)
    ElMessage.success('保存成功')
    loadVariables()
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  }
}
</script>

<style lang="scss" scoped>
.variable-container {
  height: 100%;
  
  .el-container {
    height: 100%;
  }
  
  .variable-aside {
    border-right: 1px solid #e6e6e6;
    display: flex;
    flex-direction: column;
    
    .aside-header {
      padding: 10px;
      border-bottom: 1px solid #e6e6e6;
      display: flex;
      gap: 10px;
    }
  }
  
  .variable-main {
    padding: 0;
    
    .empty-placeholder {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
```

### 2. 变量树组件 (VariableTree.vue)

```vue
<template>
  <div class="variable-tree">
    <el-input
      v-model="filterText"
      placeholder="搜索变量"
      prefix-icon="Search"
      clearable
      class="tree-search"
    />
    
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :filter-node-method="filterNode"
      :expand-on-click-node="false"
      :draggable="true"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
      node-key="id"
      highlight-current
      @node-click="handleNodeClick"
      @node-contextmenu="handleContextMenu"
      @node-drag-end="handleDragEnd"
    >
      <template #default="{ node, data }">
        <span class="tree-node">
          <el-icon class="node-icon">
            <Folder v-if="data.type === 'category'" />
            <Document v-else />
          </el-icon>
          <span class="node-label">{{ data.label || data.name }}</span>
          <span v-if="data.type === 'variable'" class="node-type">
            {{ data.variableType }}
          </span>
        </span>
      </template>
    </el-tree>
    
    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenuRef"
      trigger="contextmenu"
      :style="contextMenuStyle"
      @command="handleCommand"
    >
      <span></span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            v-if="contextNode?.type === 'category'"
            command="addVariable"
            icon="Plus"
          >
            新增变量
          </el-dropdown-item>
          <el-dropdown-item 
            v-if="contextNode?.type === 'category'"
            command="addCategory"
            icon="FolderAdd"
          >
            新增子分类
          </el-dropdown-item>
          <el-dropdown-item command="edit" icon="Edit">
            编辑
          </el-dropdown-item>
          <el-dropdown-item 
            v-if="contextNode?.type === 'variable'"
            command="copy"
            icon="CopyDocument"
          >
            复制
          </el-dropdown-item>
          <el-dropdown-item 
            command="delete"
            icon="Delete"
            divided
          >
            删除
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Folder, Document } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: Boolean
})

const emit = defineEmits(['node-click', 'node-command'])

const treeRef = ref()
const filterText = ref('')
const contextNode = ref(null)
const contextMenuRef = ref()
const contextMenuStyle = ref({})

const treeProps = {
  label: 'name',
  children: 'children'
}

// 过滤节点
watch(filterText, (val) => {
  treeRef.value?.filter(val)
})

const filterNode = (value, data) => {
  if (!value) return true
  const label = data.label || data.name
  return label.toLowerCase().includes(value.toLowerCase())
}

// 节点点击
const handleNodeClick = (data, node) => {
  emit('node-click', { data, node, type: data.type })
}

// 右键菜单
const handleContextMenu = (event, data, node) => {
  event.preventDefault()
  contextNode.value = { data, node, type: data.type }
  
  contextMenuStyle.value = {
    position: 'fixed',
    left: `${event.clientX}px`,
    top: `${event.clientY}px`,
    zIndex: 3000
  }
  
  contextMenuRef.value?.handleOpen()
}

// 处理命令
const handleCommand = (command) => {
  if (contextNode.value) {
    emit('node-command', { command, node: contextNode.value })
  }
}

// 拖拽控制
const allowDrop = (draggingNode, dropNode, type) => {
  // 只允许变量拖拽到分类下
  if (draggingNode.data.type === 'variable') {
    return dropNode.data.type === 'category' && type !== 'after'
  }
  // 分类可以拖拽到同级
  return draggingNode.data.type === 'category' && 
         dropNode.data.type === 'category' && 
         type !== 'inner'
}

const allowDrag = (draggingNode) => {
  // 根节点不允许拖拽
  return draggingNode.level > 1
}

const handleDragEnd = (draggingNode, dropNode, dropType) => {
  emit('node-command', {
    command: 'move',
    draggingNode,
    dropNode,
    dropType
  })
}
</script>

<style lang="scss" scoped>
.variable-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .tree-search {
    margin: 10px;
  }
  
  .el-tree {
    flex: 1;
    overflow: auto;
  }
  
  .tree-node {
    flex: 1;
    display: flex;
    align-items: center;
    font-size: 14px;
    padding-right: 8px;
    
    .node-icon {
      margin-right: 5px;
    }
    
    .node-label {
      flex: 1;
    }
    
    .node-type {
      color: #909399;
      font-size: 12px;
      margin-left: 5px;
    }
  }
}
</style>
```

### 3. 变量编辑器组件 (VariableEditor.vue)

```vue
<template>
  <div class="variable-editor">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :disabled="readonly"
      label-width="100px"
    >
      <el-card>
        <template #header>
          <div class="card-header">
            <span>变量信息</span>
            <div v-if="!readonly" class="header-actions">
              <el-button type="primary" @click="handleSave">保存</el-button>
              <el-button @click="handleCancel">取消</el-button>
            </div>
          </div>
        </template>
        
        <!-- 基本信息 -->
        <el-form-item label="变量名" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入变量名"
            :disabled="mode === 'edit'"
          />
        </el-form-item>
        
        <el-form-item label="显示名" prop="label">
          <el-input v-model="formData.label" placeholder="请输入显示名" />
        </el-form-item>
        
        <el-form-item label="数据类型" prop="type">
          <VariableTypeSelect 
            v-model="formData.type"
            @change="handleTypeChange"
          />
        </el-form-item>
        
        <el-form-item label="变量类型" prop="act">
          <el-radio-group v-model="formData.act">
            <el-radio label="InOut">输入/输出</el-radio>
            <el-radio label="In">输入</el-radio>
            <el-radio label="Out">输出</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="默认值" v-if="showDefaultValue">
          <el-input 
            v-if="isSimpleType"
            v-model="formData.defaultValue" 
            placeholder="请输入默认值" 
          />
          <el-switch 
            v-else-if="formData.type === 'Boolean'"
            v-model="formData.defaultValue"
          />
          <el-date-picker
            v-else-if="formData.type === 'Date'"
            v-model="formData.defaultValue"
            type="datetime"
            placeholder="选择日期时间"
          />
        </el-form-item>
      </el-card>
      
      <!-- 成员编辑 -->
      <el-card v-if="isComplexType" class="member-card">
        <template #header>
          <div class="card-header">
            <span>成员变量</span>
            <el-button 
              v-if="!readonly"
              type="primary" 
              size="small"
              @click="handleAddMember"
            >
              添加成员
            </el-button>
          </div>
        </template>
        
        <MemberEditor
          v-model="formData.members"
          :readonly="readonly"
          @edit="handleEditMember"
          @delete="handleDeleteMember"
        />
      </el-card>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import VariableTypeSelect from './VariableTypeSelect.vue'
import MemberEditor from './MemberEditor.vue'
import { useVariableType } from '../composables/useVariableType'

const props = defineProps({
  variable: Object,
  readonly: Boolean
})

const emit = defineEmits(['save', 'cancel'])

const formRef = ref()
const formData = ref({})
const mode = ref('add')

const { isSimpleType, isComplexType, getDefaultValue } = useVariableType()

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入变量名', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '变量名必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入显示名', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ],
  act: [
    { required: true, message: '请选择变量类型', trigger: 'change' }
  ]
}

// 是否显示默认值
const showDefaultValue = computed(() => {
  return formData.value.act !== 'Out' && isSimpleType(formData.value.type)
})

// 监听变量变化
watch(() => props.variable, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal }
    mode.value = newVal.name ? 'edit' : 'add'
  }
}, { immediate: true })

// 类型变化处理
const handleTypeChange = (type) => {
  formData.value.defaultValue = getDefaultValue(type)
  if (!isComplexType(type)) {
    formData.value.members = []
  }
}

// 保存
const handleSave = async () => {
  try {
    await formRef.value.validate()
    emit('save', formData.value)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

// 取消
const handleCancel = () => {
  emit('cancel')
}

// 添加成员
const handleAddMember = () => {
  if (!formData.value.members) {
    formData.value.members = []
  }
  formData.value.members.push({
    name: '',
    label: '',
    type: 'String',
    defaultValue: ''
  })
}

// 编辑成员
const handleEditMember = (index, member) => {
  formData.value.members[index] = member
}

// 删除成员
const handleDeleteMember = async (index) => {
  try {
    await ElMessageBox.confirm('确定要删除该成员变量吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    formData.value.members.splice(index, 1)
  } catch (error) {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.variable-editor {
  height: 100%;
  overflow: auto;
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .member-card {
    margin-top: 20px;
  }
}
</style>
```

### 4. 状态管理 (stores/variable.js)

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as variableAPI from '@/api/variable'

export const useVariableStore = defineStore('variable', () => {
  // 状态
  const variables = ref([])
  const categories = ref([])
  const treeData = ref([])

  // 加载变量数据
  const loadVariables = async () => {
    try {
      const data = await variableAPI.loadVariableCategories()
      categories.value = data.categories || []
      variables.value = data.variables || []
      treeData.value = buildTreeData(data)
    } catch (error) {
      console.error('加载变量数据失败:', error)
      throw error
    }
  }

  // 保存变量
  const saveVariable = async (variable) => {
    try {
      if (variable.id) {
        await variableAPI.updateVariable(variable)
      } else {
        await variableAPI.createVariable(variable)
      }
    } catch (error) {
      console.error('保存变量失败:', error)
      throw error
    }
  }

  // 删除变量
  const deleteVariable = async (variableId) => {
    try {
      await variableAPI.deleteVariable(variableId)
    } catch (error) {
      console.error('删除变量失败:', error)
      throw error
    }
  }

  // 保存分类
  const saveCategory = async (category) => {
    try {
      if (category.id) {
        await variableAPI.updateCategory(category)
      } else {
        await variableAPI.createCategory(category)
      }
    } catch (error) {
      console.error('保存分类失败:', error)
      throw error
    }
  }

  // 删除分类
  const deleteCategory = async (categoryId) => {
    try {
      await variableAPI.deleteCategory(categoryId)
    } catch (error) {
      console.error('删除分类失败:', error)
      throw error
    }
  }

  // 构建树形数据
  const buildTreeData = (data) => {
    const { categories = [], variables = [] } = data
    const categoryMap = {}
    
    // 构建分类映射
    categories.forEach(cat => {
      categoryMap[cat.name] = {
        ...cat,
        type: 'category',
        children: []
      }
    })
    
    // 将变量添加到对应分类
    variables.forEach(variable => {
      const category = variable.category || 'default'
      if (!categoryMap[category]) {
        categoryMap[category] = {
          name: category,
          label: '默认分类',
          type: 'category',
          children: []
        }
      }
      categoryMap[category].children.push({
        ...variable,
        type: 'variable'
      })
    })
    
    // 转换为树形数组
    return Object.values(categoryMap)
  }

  return {
    variables,
    categories,
    treeData,
    loadVariables,
    saveVariable,
    deleteVariable,
    saveCategory,
    deleteCategory
  }
})
```

### 5. API接口定义

```javascript
// src/api/variable.js
import request from '@/api'

/**
 * 加载变量分类数据
 */
export function loadVariableCategories() {
  return request({
    url: '/variable/loadVariableCategories',
    method: 'get'
  })
}

/**
 * 创建变量
 */
export function createVariable(data) {
  return request({
    url: '/variable/saveVariable',
    method: 'post',
    data
  })
}

/**
 * 更新变量
 */
export function updateVariable(data) {
  return request({
    url: '/variable/saveVariable',
    method: 'post',
    data
  })
}

/**
 * 删除变量
 */
export function deleteVariable(id) {
  return request({
    url: '/variable/deleteVariable',
    method: 'post',
    data: { id }
  })
}

/**
 * 创建分类
 */
export function createCategory(data) {
  return request({
    url: '/variable/saveCategory',
    method: 'post',
    data
  })
}

/**
 * 更新分类
 */
export function updateCategory(data) {
  return request({
    url: '/variable/saveCategory',
    method: 'post',
    data
  })
}

/**
 * 删除分类
 */
export function deleteCategory(id) {
  return request({
    url: '/variable/deleteCategory',
    method: 'post',
    data: { id }
  })
}
```

## 数据结构

### 变量数据结构
```javascript
{
  id: 'var_001',
  name: 'customer',
  label: '客户',
  type: 'Object',  // String, Integer, Double, Boolean, Date, Object, List, Set, Map
  act: 'InOut',    // In, Out, InOut
  defaultValue: null,
  category: 'business',
  members: [
    {
      name: 'name',
      label: '姓名',
      type: 'String',
      defaultValue: ''
    },
    {
      name: 'age',
      label: '年龄',
      type: 'Integer',
      defaultValue: 0
    }
  ]
}
```

### 分类数据结构
```javascript
{
  id: 'cat_001',
  name: 'business',
  label: '业务变量',
  parentId: null,
  order: 1
}
```

## 测试要点

1. **变量树功能**
   - 分类和变量的正确展示
   - 搜索过滤功能
   - 拖拽排序功能
   - 右键菜单操作

2. **变量编辑**
   - 表单验证
   - 不同类型变量的编辑
   - 成员变量的增删改
   - 保存和取消功能

3. **数据交互**
   - 数据加载
   - 数据保存
   - 错误处理
   - 加载状态显示

## 注意事项

1. 变量名验证规则要与后端保持一致
2. 复杂类型（Object、List等）需要支持成员编辑
3. 保持与老项目相同的数据结构，确保后端兼容
4. 拖拽操作需要考虑权限和业务规则

## 依赖关系

- 依赖：项目初始化、主框架、公共组件库
- 被依赖：决策集编辑器、决策表编辑器等

## 预计工时

- 主页面开发：2小时
- 变量树组件：3小时
- 变量编辑器：4小时
- 成员编辑器：2小时
- 状态管理和API：2小时
- 测试和优化：2小时

**总计：15小时** 