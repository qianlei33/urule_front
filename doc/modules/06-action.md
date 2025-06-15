# 动作管理模块迁移计划

## 模块概述

动作管理模块负责管理规则引擎中可调用的动作定义。动作通常是Spring Bean中定义的方法，在规则执行过程中可以调用这些动作来执行具体的业务逻辑。模块采用三层结构：Bean -> 方法 -> 参数。

## 功能分析

根据老项目代码分析，动作管理模块包含以下功能：

1. **Bean管理**
   - 添加Spring Bean定义
   - 编辑Bean信息（ID、名称）
   - 删除Bean
   - Bean列表展示

2. **方法管理**
   - 在Bean下添加方法
   - 编辑方法信息（名称、方法名）
   - 删除方法
   - 从实际Bean中导入方法
   - 方法列表展示

3. **参数管理**
   - 为方法添加参数
   - 编辑参数信息（名称、类型）
   - 删除参数
   - 参数列表展示

4. **其他功能**
   - 保存动作库文件
   - 保存为新版本
   - 查看动作引用
   - 从Spring容器中选择方法

## 组件结构

```
src/views/action/
├── index.vue                    # 动作管理主页面
├── components/
│   ├── BeanList.vue            # Bean列表组件
│   ├── MethodList.vue          # 方法列表组件
│   ├── ParameterList.vue       # 参数列表组件
│   ├── BeanDialog.vue          # Bean编辑对话框
│   ├── MethodDialog.vue        # 方法编辑对话框
│   ├── ParameterDialog.vue     # 参数编辑对话框
│   └── SelectMethodDialog.vue  # 选择方法对话框
├── composables/
│   └── useAction.js            # 动作管理逻辑
└── stores/
    └── action.js               # 动作状态管理
```

## 详细设计

### 1. 主页面 (index.vue)

```vue
<template>
  <div class="action-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-button-group>
        <el-button type="primary" icon="Plus" @click="handleAddBean">
          添加Bean
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
      
      <el-button 
        type="info" 
        icon="Link" 
        :disabled="!currentMethod" 
        @click="handleViewReference"
      >
        查看引用
      </el-button>
    </div>
    
    <!-- 主内容区 -->
    <el-container class="main-container">
      <!-- 左侧Bean列表 -->
      <el-aside width="35%" class="bean-aside">
        <BeanList
          :data="beans"
          :loading="beanLoading"
          @select="handleBeanSelect"
          @edit="handleEditBean"
          @delete="handleDeleteBean"
          @import="handleImportMethods"
        />
      </el-aside>
      
      <!-- 分割条 -->
      <div class="splitter-vertical"></div>
      
      <!-- 右侧方法和参数区域 -->
      <el-main class="method-main">
        <el-row :gutter="10" class="method-row">
          <!-- 方法列表 -->
          <el-col :span="12">
            <div class="method-section">
              <div class="section-toolbar">
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="Plus"
                  :disabled="!currentBean"
                  @click="handleAddMethod"
                >
                  添加方法
                </el-button>
              </div>
              
              <MethodList
                :data="methods"
                :loading="methodLoading"
                @select="handleMethodSelect"
                @edit="handleEditMethod"
                @delete="handleDeleteMethod"
              />
            </div>
          </el-col>
          
          <!-- 参数列表 -->
          <el-col :span="12">
            <div class="parameter-section">
              <div class="section-toolbar">
                <el-button 
                  type="primary" 
                  size="small" 
                  icon="Plus"
                  :disabled="!currentMethod"
                  @click="handleAddParameter"
                >
                  添加参数
                </el-button>
              </div>
              
              <ParameterList
                :data="parameters"
                :loading="parameterLoading"
                @edit="handleEditParameter"
                @delete="handleDeleteParameter"
              />
            </div>
          </el-col>
        </el-row>
      </el-main>
    </el-container>
    
    <!-- Bean编辑对话框 -->
    <BeanDialog
      v-model="beanDialogVisible"
      :mode="beanDialogMode"
      :data="editingBean"
      @confirm="handleBeanConfirm"
    />
    
    <!-- 方法编辑对话框 -->
    <MethodDialog
      v-model="methodDialogVisible"
      :mode="methodDialogMode"
      :data="editingMethod"
      @confirm="handleMethodConfirm"
    />
    
    <!-- 参数编辑对话框 -->
    <ParameterDialog
      v-model="parameterDialogVisible"
      :mode="parameterDialogMode"
      :data="editingParameter"
      @confirm="handleParameterConfirm"
    />
    
    <!-- 选择方法对话框 -->
    <SelectMethodDialog
      v-model="selectMethodDialogVisible"
      :bean-id="currentBean?.id"
      @select="handleSelectMethod"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useActionStore } from './stores/action'
import BeanList from './components/BeanList.vue'
import MethodList from './components/MethodList.vue'
import ParameterList from './components/ParameterList.vue'
import BeanDialog from './components/BeanDialog.vue'
import MethodDialog from './components/MethodDialog.vue'
import ParameterDialog from './components/ParameterDialog.vue'
import SelectMethodDialog from './components/SelectMethodDialog.vue'

const props = defineProps({
  file: {
    type: String,
    required: true
  }
})

const actionStore = useActionStore()

// 状态
const beans = computed(() => actionStore.beans)
const methods = computed(() => currentBean.value?.methods || [])
const parameters = computed(() => currentMethod.value?.parameters || [])

const beanLoading = ref(false)
const methodLoading = ref(false)
const parameterLoading = ref(false)

// 当前选中
const currentBean = ref(null)
const currentMethod = ref(null)

// 对话框
const beanDialogVisible = ref(false)
const beanDialogMode = ref('add')
const editingBean = ref(null)

const methodDialogVisible = ref(false)
const methodDialogMode = ref('add')
const editingMethod = ref(null)

const parameterDialogVisible = ref(false)
const parameterDialogMode = ref('add')
const editingParameter = ref(null)

const selectMethodDialogVisible = ref(false)

// 初始化
onMounted(() => {
  loadData()
})

// 加载数据
const loadData = async () => {
  beanLoading.value = true
  try {
    await actionStore.loadActionData(props.file)
  } finally {
    beanLoading.value = false
  }
}

// Bean操作
const handleAddBean = () => {
  editingBean.value = {
    id: '',
    name: '',
    methods: []
  }
  beanDialogMode.value = 'add'
  beanDialogVisible.value = true
}

const handleBeanSelect = (bean) => {
  currentBean.value = bean
  currentMethod.value = null
}

const handleEditBean = (bean) => {
  editingBean.value = { ...bean }
  beanDialogMode.value = 'edit'
  beanDialogVisible.value = true
}

const handleDeleteBean = async (bean) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该Bean吗？删除后Bean下的所有方法也将被删除。',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    actionStore.deleteBean(bean)
    if (currentBean.value?.id === bean.id) {
      currentBean.value = null
      currentMethod.value = null
    }
  } catch {
    // 用户取消
  }
}

const handleBeanConfirm = (data) => {
  if (beanDialogMode.value === 'add') {
    actionStore.addBean(data)
  } else {
    actionStore.updateBean(data)
  }
  beanDialogVisible.value = false
}

// 导入方法
const handleImportMethods = (bean) => {
  if (!bean.id) {
    ElMessage.warning('请先指定Bean Id')
    return
  }
  currentBean.value = bean
  selectMethodDialogVisible.value = true
}

const handleSelectMethod = (method) => {
  actionStore.addMethod(currentBean.value, method)
  ElMessage.success('添加成功')
}

// 方法操作
const handleAddMethod = () => {
  editingMethod.value = {
    name: '',
    methodName: '',
    parameters: []
  }
  methodDialogMode.value = 'add'
  methodDialogVisible.value = true
}

const handleMethodSelect = (method) => {
  currentMethod.value = method
}

const handleEditMethod = (method) => {
  editingMethod.value = { ...method }
  methodDialogMode.value = 'edit'
  methodDialogVisible.value = true
}

const handleDeleteMethod = async (method) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该方法吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    actionStore.deleteMethod(currentBean.value, method)
    if (currentMethod.value?.methodName === method.methodName) {
      currentMethod.value = null
    }
  } catch {
    // 用户取消
  }
}

const handleMethodConfirm = (data) => {
  if (methodDialogMode.value === 'add') {
    actionStore.addMethod(currentBean.value, data)
  } else {
    actionStore.updateMethod(currentBean.value, data)
  }
  methodDialogVisible.value = false
}

// 参数操作
const handleAddParameter = () => {
  editingParameter.value = {
    name: '',
    type: 'String'
  }
  parameterDialogMode.value = 'add'
  parameterDialogVisible.value = true
}

const handleEditParameter = (parameter) => {
  editingParameter.value = { ...parameter }
  parameterDialogMode.value = 'edit'
  parameterDialogVisible.value = true
}

const handleDeleteParameter = async (parameter) => {
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
    actionStore.deleteParameter(currentBean.value, currentMethod.value, parameter)
  } catch {
    // 用户取消
  }
}

const handleParameterConfirm = (data) => {
  if (parameterDialogMode.value === 'add') {
    actionStore.addParameter(currentBean.value, currentMethod.value, data)
  } else {
    actionStore.updateParameter(currentBean.value, currentMethod.value, data)
  }
  parameterDialogVisible.value = false
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
      await actionStore.save(props.file, true, value)
    } else {
      await actionStore.save(props.file, false)
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
  if (!currentMethod.value) return
  
  const data = {
    path: props.file,
    beanName: currentBean.value.id,
    beanLabel: currentBean.value.name,
    methodName: currentMethod.value.methodName,
    methodLabel: currentMethod.value.name
  }
  
  // 触发查看引用事件
  actionStore.viewReference(data)
}

// 数据验证
const validateData = () => {
  for (const bean of beans.value) {
    if (!bean.name || bean.name.trim().length === 0) {
      return '动作名称不能为空'
    }
    if (!bean.id || bean.id.trim().length === 0) {
      return 'Bean Id不能为空'
    }
    if (!bean.methods || bean.methods.length === 0) {
      return `动作分类[${bean.name}]下未定义具体的动作方法`
    }
    
    for (const method of bean.methods) {
      if (!method.name || method.name.trim().length === 0) {
        return '方法名称不能为空'
      }
      if (!method.methodName || method.methodName.trim().length === 0) {
        return '方法名不能为空'
      }
      
      if (method.parameters) {
        for (const param of method.parameters) {
          if (!param.name || param.name.trim().length === 0) {
            return '参数名不能为空'
          }
          if (!param.type || param.type.trim().length === 0) {
            return '参数类型不能为空'
          }
        }
      }
    }
  }
  return null
}
</script>

<style lang="scss" scoped>
.action-container {
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
    
    .bean-aside {
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
    
    .method-main {
      padding: 0;
      
      .method-row {
        height: 100%;
        
        .method-section,
        .parameter-section {
          height: 100%;
          display: flex;
          flex-direction: column;
          border: 1px solid #e6e6e6;
          
          .section-toolbar {
            padding: 10px;
            border-bottom: 1px solid #e6e6e6;
            background: #fafafa;
          }
        }
      }
    }
  }
}
</style>
```

### 2. Bean列表组件 (BeanList.vue)

```vue
<template>
  <div class="bean-list">
    <el-table
      :data="data"
      :loading="loading"
      height="100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="id" label="Bean Id" min-width="120" />
      <el-table-column prop="name" label="动作名称" min-width="150" />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            icon="Upload"
            circle
            title="导入方法"
            @click.stop="handleImport(row)"
          />
          <el-button
            type="danger"
            size="small"
            icon="Delete"
            circle
            title="删除"
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

const emit = defineEmits(['select', 'edit', 'delete', 'import'])

const handleCurrentChange = (row) => {
  emit('select', row)
}

const handleImport = (row) => {
  emit('import', row)
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

### 3. 方法列表组件 (MethodList.vue)

```vue
<template>
  <div class="method-list">
    <el-table
      :data="data"
      :loading="loading"
      height="100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="name" label="方法名称" min-width="120" />
      <el-table-column prop="methodName" label="方法名" min-width="120" />
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

### 4. 参数列表组件 (ParameterList.vue)

```vue
<template>
  <div class="parameter-list">
    <el-table
      :data="data"
      :loading="loading"
      height="100%"
    >
      <el-table-column prop="name" label="参数名称" min-width="120" />
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

const emit = defineEmits(['edit', 'delete'])

const handleDelete = (row) => {
  emit('delete', row)
}
</script>
```

### 5. 选择方法对话框 (SelectMethodDialog.vue)

```vue
<template>
  <el-dialog
    v-model="visible"
    title="选择方法"
    width="600px"
    @open="handleOpen"
  >
    <el-table
      v-loading="loading"
      :data="methods"
      height="400px"
      @row-click="handleRowClick"
    >
      <el-table-column prop="methodName" label="方法名称" min-width="200" />
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="操作" width="100" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleSelect(row)"
          >
            选择此方法
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { loadBeanMethods } from '@/api/action'

const props = defineProps({
  modelValue: Boolean,
  beanId: String
})

const emit = defineEmits(['update:modelValue', 'select'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const methods = ref([])

const handleOpen = async () => {
  if (!props.beanId) return
  
  loading.value = true
  try {
    const data = await loadBeanMethods(props.beanId)
    methods.value = data.methods || []
  } finally {
    loading.value = false
  }
}

const handleRowClick = (row) => {
  handleSelect(row)
}

const handleSelect = (row) => {
  emit('select', row)
  visible.value = false
}

const handleClose = () => {
  visible.value = false
}
</script>
```

### 6. 状态管理 (stores/action.js)

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as actionAPI from '@/api/action'
import { generateXML } from '@/utils/actionUtils'

export const useActionStore = defineStore('action', () => {
  // 状态
  const beans = ref([])
  
  // 加载动作数据
  const loadActionData = async (file) => {
    try {
      const data = await actionAPI.loadActionFile(file)
      beans.value = data.beans || []
    } catch (error) {
      console.error('加载动作数据失败:', error)
      throw error
    }
  }
  
  // Bean操作
  const addBean = (bean) => {
    beans.value.push({
      ...bean,
      methods: []
    })
  }
  
  const updateBean = (bean) => {
    const index = beans.value.findIndex(b => b.id === bean.id)
    if (index > -1) {
      beans.value[index] = {
        ...beans.value[index],
        ...bean
      }
    }
  }
  
  const deleteBean = (bean) => {
    const index = beans.value.findIndex(b => b.id === bean.id)
    if (index > -1) {
      beans.value.splice(index, 1)
    }
  }
  
  // 方法操作
  const addMethod = (bean, method) => {
    const b = beans.value.find(item => item.id === bean.id)
    if (b) {
      if (!b.methods) {
        b.methods = []
      }
      b.methods.push({
        ...method,
        parameters: method.parameters || []
      })
    }
  }
  
  const updateMethod = (bean, method) => {
    const b = beans.value.find(item => item.id === bean.id)
    if (b && b.methods) {
      const index = b.methods.findIndex(m => m.methodName === method.methodName)
      if (index > -1) {
        b.methods[index] = method
      }
    }
  }
  
  const deleteMethod = (bean, method) => {
    const b = beans.value.find(item => item.id === bean.id)
    if (b && b.methods) {
      const index = b.methods.findIndex(m => m.methodName === method.methodName)
      if (index > -1) {
        b.methods.splice(index, 1)
      }
    }
  }
  
  // 参数操作
  const addParameter = (bean, method, parameter) => {
    const b = beans.value.find(item => item.id === bean.id)
    if (b && b.methods) {
      const m = b.methods.find(item => item.methodName === method.methodName)
      if (m) {
        if (!m.parameters) {
          m.parameters = []
        }
        m.parameters.push(parameter)
      }
    }
  }
  
  const updateParameter = (bean, method, parameter) => {
    const b = beans.value.find(item => item.id === bean.id)
    if (b && b.methods) {
      const m = b.methods.find(item => item.methodName === method.methodName)
      if (m && m.parameters) {
        const index = m.parameters.findIndex(p => p.name === parameter.name)
        if (index > -1) {
          m.parameters[index] = parameter
        }
      }
    }
  }
  
  const deleteParameter = (bean, method, parameter) => {
    const b = beans.value.find(item => item.id === bean.id)
    if (b && b.methods) {
      const m = b.methods.find(item => item.methodName === method.methodName)
      if (m && m.parameters) {
        const index = m.parameters.findIndex(p => p.name === parameter.name)
        if (index > -1) {
          m.parameters.splice(index, 1)
        }
      }
    }
  }
  
  // 保存
  const save = async (file, newVersion, versionComment) => {
    const xml = generateXML(beans.value)
    await actionAPI.saveActionFile({
      content: xml,
      file,
      newVersion,
      versionComment
    })
  }
  
  // 查看引用
  const viewReference = (data) => {
    // 触发查看引用的事件或打开对话框
    console.log('查看动作引用:', data)
  }
  
  return {
    beans,
    loadActionData,
    addBean,
    updateBean,
    deleteBean,
    addMethod,
    updateMethod,
    deleteMethod,
    addParameter,
    updateParameter,
    deleteParameter,
    save,
    viewReference
  }
})
```

### 7. API接口定义

```javascript
// src/api/action.js
import request from '@/api'

/**
 * 加载动作文件
 */
export function loadActionFile(file) {
  return request({
    url: '/xml',
    method: 'post',
    data: { files: file }
  }).then(res => res[0])
}

/**
 * 保存动作文件
 */
export function saveActionFile(data) {
  return request({
    url: '/common/saveFile',
    method: 'post',
    data
  })
}

/**
 * 加载Bean的方法列表
 */
export function loadBeanMethods(beanId) {
  return request({
    url: '/actioneditor/loadMethods',
    method: 'post',
    data: { beanId }
  })
}
```

### 8. 工具函数

```javascript
// src/utils/actionUtils.js

/**
 * 生成动作库XML
 */
export function generateXML(beans) {
  let xml = '<?xml version="1.0" encoding="utf-8"?>'
  xml += '<action-library>'
  
  beans.forEach(bean => {
    xml += `<spring-bean id='${bean.id}' name='${bean.name}'>`
    
    if (bean.methods && bean.methods.length > 0) {
      bean.methods.forEach(method => {
        xml += `<method name='${method.name}' method-name='${method.methodName}'>`
        
        if (method.parameters && method.parameters.length > 0) {
          method.parameters.forEach(param => {
            xml += `<parameter name='${param.name}' type='${param.type}'/>`
          })
        }
        
        xml += '</method>'
      })
    }
    
    xml += '</spring-bean>'
  })
  
  xml += '</action-library>'
  
  return encodeURIComponent(xml)
}
```

## 数据结构

### Bean数据结构
```javascript
{
  id: 'customerService',      // Bean ID
  name: '客户服务',           // Bean名称
  methods: [...]              // 方法数组
}
```

### 方法数据结构
```javascript
{
  name: '查询客户',           // 方法名称
  methodName: 'queryCustomer', // 方法名
  parameters: [...]           // 参数数组
}
```

### 参数数据结构
```javascript
{
  name: 'customerId',        // 参数名称
  type: 'String'             // 参数类型
}
```

## 测试要点

1. **Bean管理**
   - 添加、编辑、删除Bean
   - Bean ID唯一性验证
   - 删除Bean时的级联删除

2. **方法管理**
   - 添加、编辑、删除方法
   - 从Spring容器导入方法
   - 方法名称验证

3. **参数管理**
   - 添加、编辑、删除参数
   - 参数名称和类型验证

4. **数据保存**
   - 普通保存功能
   - 保存为新版本功能
   - 数据完整性验证

5. **界面交互**
   - 三级联动（Bean -> 方法 -> 参数）
   - 选中状态同步
   - 操作按钮状态控制

## 注意事项

1. Bean ID必须是有效的Spring Bean标识符
2. 保存时需要验证每个Bean至少有一个方法
3. 导入方法功能需要连接到实际的Spring容器
4. 三层结构的数据同步要保证一致性

## 依赖关系

- 依赖：项目初始化、主框架、公共组件库
- 被依赖：决策集编辑器、决策表编辑器等（动作调用）

## 预计工时

- 主页面开发：3小时
- 列表组件开发：3小时
- 编辑对话框：2小时
- 选择方法对话框：2小时
- 状态管理和API：2小时
- 测试和优化：3小时

**总计：15小时** 