# 常量管理模块迁移计划

## 模块概述

常量管理模块负责管理规则引擎中使用的常量定义。采用分类管理的方式，每个分类下可以定义多个常量。常量可以在规则中直接引用，避免硬编码。

## 功能分析

根据老项目代码分析，常量管理模块包含以下功能：

1. **分类管理**
   - 添加常量分类
   - 编辑分类信息（名称、标题）
   - 删除分类
   - 分类列表展示

2. **常量管理**
   - 在分类下添加常量
   - 编辑常量信息（名称、标题、数据类型）
   - 删除常量
   - 常量列表展示

3. **数据类型支持**
   - 基础类型：String、Integer、Char、Double、Long、Float、BigDecimal、Boolean、Date
   - 集合类型：List、Set、Map
   - 复杂类型：Enum、Object

4. **其他功能**
   - 保存常量库文件
   - 保存为新版本
   - 查看常量引用

## 组件结构

```
src/views/constant/
├── index.vue                    # 常量管理主页面
├── components/
│   ├── CategoryList.vue        # 分类列表组件
│   ├── ConstantList.vue        # 常量列表组件
│   ├── CategoryDialog.vue      # 分类编辑对话框
│   └── ConstantDialog.vue      # 常量编辑对话框
├── composables/
│   └── useConstant.js          # 常量管理逻辑
└── stores/
    └── constant.js             # 常量状态管理
```

## 详细设计

### 1. 主页面 (index.vue)

```vue
<template>
  <div class="constant-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button type="primary" icon="Plus" @click="handleAddCategory">
          添加分类
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
      
      <el-button type="info" icon="Link" :disabled="!currentConstant" @click="handleViewReference">
        查看引用
      </el-button>
    </div>
    
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 左侧分类列表 -->
      <el-aside width="40%" class="category-aside">
        <CategoryList
          :data="categories"
          :loading="categoryLoading"
          @select="handleCategorySelect"
          @edit="handleEditCategory"
          @delete="handleDeleteCategory"
        />
      </el-aside>
      
      <!-- 分割条 -->
      <div class="splitter-vertical"></div>
      
      <!-- 右侧常量列表 -->
      <el-main class="constant-main">
        <div class="constant-toolbar">
          <el-button 
            type="primary" 
            size="small" 
            icon="Plus"
            :disabled="!currentCategory"
            @click="handleAddConstant"
          >
            添加常量
          </el-button>
        </div>
        
        <ConstantList
          :data="constants"
          :loading="constantLoading"
          @select="handleConstantSelect"
          @edit="handleEditConstant"
          @delete="handleDeleteConstant"
        />
      </el-main>
    </el-container>
    
    <!-- 分类编辑对话框 -->
    <CategoryDialog
      v-model="categoryDialogVisible"
      :mode="categoryDialogMode"
      :data="editingCategory"
      @confirm="handleCategoryConfirm"
    />
    
    <!-- 常量编辑对话框 -->
    <ConstantDialog
      v-model="constantDialogVisible"
      :mode="constantDialogMode"
      :data="editingConstant"
      @confirm="handleConstantConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConstantStore } from './stores/constant'
import CategoryList from './components/CategoryList.vue'
import ConstantList from './components/ConstantList.vue'
import CategoryDialog from './components/CategoryDialog.vue'
import ConstantDialog from './components/ConstantDialog.vue'

const props = defineProps({
  file: {
    type: String,
    required: true
  }
})

const constantStore = useConstantStore()

// 状态
const categories = computed(() => constantStore.categories)
const constants = computed(() => currentCategory.value?.constants || [])
const categoryLoading = ref(false)
const constantLoading = ref(false)

// 当前选中
const currentCategory = ref(null)
const currentConstant = ref(null)

// 对话框
const categoryDialogVisible = ref(false)
const categoryDialogMode = ref('add')
const editingCategory = ref(null)

const constantDialogVisible = ref(false)
const constantDialogMode = ref('add')
const editingConstant = ref(null)

// 初始化
onMounted(() => {
  loadData()
})

// 加载数据
const loadData = async () => {
  categoryLoading.value = true
  try {
    await constantStore.loadConstantData(props.file)
  } finally {
    categoryLoading.value = false
  }
}

// 分类操作
const handleAddCategory = () => {
  editingCategory.value = {
    name: '',
    label: '',
    constants: []
  }
  categoryDialogMode.value = 'add'
  categoryDialogVisible.value = true
}

const handleCategorySelect = (category) => {
  currentCategory.value = category
  currentConstant.value = null
}

const handleEditCategory = (category) => {
  editingCategory.value = { ...category }
  categoryDialogMode.value = 'edit'
  categoryDialogVisible.value = true
}

const handleDeleteCategory = async (category) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该分类吗？删除后分类下的所有常量也将被删除。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    constantStore.deleteCategory(category)
    if (currentCategory.value?.name === category.name) {
      currentCategory.value = null
      currentConstant.value = null
    }
  } catch {
    // 用户取消
  }
}

const handleCategoryConfirm = (data) => {
  if (categoryDialogMode.value === 'add') {
    constantStore.addCategory(data)
  } else {
    constantStore.updateCategory(data)
  }
  categoryDialogVisible.value = false
}

// 常量操作
const handleAddConstant = () => {
  editingConstant.value = {
    name: '',
    label: '',
    type: 'String'
  }
  constantDialogMode.value = 'add'
  constantDialogVisible.value = true
}

const handleConstantSelect = (constant) => {
  currentConstant.value = constant
}

const handleEditConstant = (constant) => {
  editingConstant.value = { ...constant }
  constantDialogMode.value = 'edit'
  constantDialogVisible.value = true
}

const handleDeleteConstant = async (constant) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该常量吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    constantStore.deleteConstant(currentCategory.value, constant)
    if (currentConstant.value?.name === constant.name) {
      currentConstant.value = null
    }
  } catch {
    // 用户取消
  }
}

const handleConstantConfirm = (data) => {
  if (constantDialogMode.value === 'add') {
    constantStore.addConstant(currentCategory.value, data)
  } else {
    constantStore.updateConstant(currentCategory.value, data)
  }
  constantDialogVisible.value = false
}

// 保存
const handleSave = async (newVersion) => {
  try {
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
      await constantStore.save(props.file, true, value)
    } else {
      await constantStore.save(props.file, false)
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
  if (!currentConstant.value) return
  
  const data = {
    path: props.file,
    constCategory: currentCategory.value.name,
    constCategoryLabel: currentCategory.value.label,
    constLabel: currentConstant.value.label,
    constName: currentConstant.value.name
  }
  
  // 触发查看引用事件
  constantStore.viewReference(data)
}
</script>

<style lang="scss" scoped>
.constant-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .toolbar {
    padding: 10px;
    background: #f5f5f5;
    border-bottom: 1px solid #e6e6e6;
    display: flex;
    gap: 10px;
  }
  
  .main-container {
    flex: 1;
    height: 0;
    
    .category-aside {
      border-right: 1px solid #e6e6e6;
    }
    
    .splitter-vertical {
      width: 4px;
      background: #e0e0e0;
      cursor: col-resize;
      
      &:hover {
        background: #bdbdbd;
      }
    }
    
    .constant-main {
      padding: 0;
      display: flex;
      flex-direction: column;
      
      .constant-toolbar {
        padding: 10px;
        border-bottom: 1px solid #e6e6e6;
      }
    }
  }
}
</style>
```

### 2. 分类列表组件 (CategoryList.vue)

```vue
<template>
  <div class="category-list">
    <el-table
      :data="data"
      :loading="loading"
      highlight-current-row
      height="100%"
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="name" label="名称" min-width="120" />
      <el-table-column prop="label" label="标题" min-width="150" />
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
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: Boolean
})

const emit = defineEmits(['select', 'edit', 'delete'])

const handleCurrentChange = (row) => {
  emit('select', row)
}

const handleDelete = (row) => {
  emit('delete', row)
}

// 支持行内编辑
const handleCellEdit = (row, column, cell) => {
  // 实现单元格编辑逻辑
}
</script>
```

### 3. 常量列表组件 (ConstantList.vue)

```vue
<template>
  <div class="constant-list">
    <el-table
      :data="data"
      :loading="loading"
      highlight-current-row
      height="100%"
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="name" label="名称" min-width="100" />
      <el-table-column prop="label" label="标题" min-width="120" />
      <el-table-column prop="type" label="数据类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ row.type }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="80" align="center">
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
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  loading: Boolean
})

const emit = defineEmits(['select', 'edit', 'delete'])

const handleCurrentChange = (row) => {
  emit('select', row)
}

const handleDelete = (row) => {
  emit('delete', row)
}
</script>
```

### 4. 分类编辑对话框 (CategoryDialog.vue)

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
          placeholder="请输入分类名称"
          :disabled="mode === 'edit'"
        />
      </el-form-item>
      <el-form-item label="标题" prop="label">
        <el-input
          v-model="formData.label"
          placeholder="请输入分类标题"
        />
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
  label: ''
})

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  return props.mode === 'add' ? '添加分类' : '编辑分类'
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '名称必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入分类标题', trigger: 'blur' }
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

### 5. 常量编辑对话框 (ConstantDialog.vue)

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
          placeholder="请输入常量名称"
          :disabled="mode === 'edit'"
        />
      </el-form-item>
      <el-form-item label="标题" prop="label">
        <el-input
          v-model="formData.label"
          placeholder="请输入常量标题"
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
  return props.mode === 'add' ? '添加常量' : '编辑常量'
})

const rules = {
  name: [
    { required: true, message: '请输入常量名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/, message: '名称必须以字母开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  label: [
    { required: true, message: '请输入常量标题', trigger: 'blur' }
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

### 6. 状态管理 (stores/constant.js)

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as constantAPI from '@/api/constant'
import { generateXML } from '@/utils/constantUtils'

export const useConstantStore = defineStore('constant', () => {
  // 状态
  const categories = ref([])
  
  // 加载常量数据
  const loadConstantData = async (file) => {
    try {
      const data = await constantAPI.loadConstantFile(file)
      categories.value = data.categories || []
    } catch (error) {
      console.error('加载常量数据失败:', error)
      throw error
    }
  }
  
  // 分类操作
  const addCategory = (category) => {
    categories.value.push({
      ...category,
      constants: []
    })
  }
  
  const updateCategory = (category) => {
    const index = categories.value.findIndex(c => c.name === category.name)
    if (index > -1) {
      categories.value[index] = {
        ...categories.value[index],
        ...category
      }
    }
  }
  
  const deleteCategory = (category) => {
    const index = categories.value.findIndex(c => c.name === category.name)
    if (index > -1) {
      categories.value.splice(index, 1)
    }
  }
  
  // 常量操作
  const addConstant = (category, constant) => {
    const cat = categories.value.find(c => c.name === category.name)
    if (cat) {
      if (!cat.constants) {
        cat.constants = []
      }
      cat.constants.push(constant)
    }
  }
  
  const updateConstant = (category, constant) => {
    const cat = categories.value.find(c => c.name === category.name)
    if (cat && cat.constants) {
      const index = cat.constants.findIndex(c => c.name === constant.name)
      if (index > -1) {
        cat.constants[index] = constant
      }
    }
  }
  
  const deleteConstant = (category, constant) => {
    const cat = categories.value.find(c => c.name === category.name)
    if (cat && cat.constants) {
      const index = cat.constants.findIndex(c => c.name === constant.name)
      if (index > -1) {
        cat.constants.splice(index, 1)
      }
    }
  }
  
  // 保存
  const save = async (file, newVersion, versionComment) => {
    const xml = generateXML(categories.value)
    await constantAPI.saveConstantFile({
      content: xml,
      file,
      newVersion,
      versionComment
    })
  }
  
  // 查看引用
  const viewReference = (data) => {
    // 触发查看引用的事件或打开对话框
    console.log('查看引用:', data)
  }
  
  return {
    categories,
    loadConstantData,
    addCategory,
    updateCategory,
    deleteCategory,
    addConstant,
    updateConstant,
    deleteConstant,
    save,
    viewReference
  }
})
```

### 7. API接口定义

```javascript
// src/api/constant.js
import request from '@/api'

/**
 * 加载常量文件
 */
export function loadConstantFile(file) {
  return request({
    url: '/xml',
    method: 'post',
    data: { files: file }
  }).then(res => res[0])
}

/**
 * 保存常量文件
 */
export function saveConstantFile(data) {
  return request({
    url: '/common/saveFile',
    method: 'post',
    data
  })
}
```

### 8. 工具函数

```javascript
// src/utils/constantUtils.js

/**
 * 生成常量库XML
 */
export function generateXML(categories) {
  let xml = '<?xml version="1.0" encoding="utf-8"?>'
  xml += '<constant-library>'
  
  categories.forEach(category => {
    xml += `<category name='${category.name}' label='${category.label}'>`
    
    if (category.constants && category.constants.length > 0) {
      category.constants.forEach(constant => {
        xml += `<constant name='${constant.name}' label='${constant.label}' type='${constant.type}'/>`
      })
    }
    
    xml += '</category>'
  })
  
  xml += '</constant-library>'
  
  return encodeURIComponent(xml)
}
```

## 数据结构

### 分类数据结构
```javascript
{
  name: 'customer',      // 分类名称
  label: '客户相关',     // 分类标题
  constants: [...]       // 常量数组
}
```

### 常量数据结构
```javascript
{
  name: 'vipLevel',     // 常量名称
  label: 'VIP等级',     // 常量标题
  type: 'String'        // 数据类型
}
```

## 测试要点

1. **分类管理**
   - 添加、编辑、删除分类
   - 分类名称唯一性验证
   - 删除分类时的确认提示

2. **常量管理**
   - 添加、编辑、删除常量
   - 常量名称唯一性验证
   - 数据类型选择

3. **数据保存**
   - 普通保存功能
   - 保存为新版本功能
   - 数据验证（分类和常量不能为空）

4. **界面交互**
   - 左右分栏布局
   - 选中状态高亮
   - 操作按钮的启用/禁用状态

## 注意事项

1. 常量名称和分类名称必须符合标识符规范（字母开头，只包含字母、数字、下划线）
2. 保存时需要验证每个分类下至少有一个常量
3. 支持的数据类型要与后端保持一致
4. 保存为新版本时需要输入版本描述

## 依赖关系

- 依赖：项目初始化、主框架、公共组件库
- 被依赖：决策集编辑器、决策表编辑器等（常量引用）

## 预计工时

- 主页面开发：2小时
- 分类列表组件：2小时
- 常量列表组件：2小时
- 编辑对话框：2小时
- 状态管理和API：2小时
- 测试和优化：2小时

**总计：12小时** 