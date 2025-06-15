# 知识包管理模块迁移计划

## 模块概述

知识包管理模块是URule系统中的核心功能之一，负责管理知识包的创建、编辑、部署和测试。知识包是将多个规则文件（变量库、常量库、决策集、决策表等）组织在一起的逻辑单元，便于统一管理和部署。

### 功能特性
- 知识包的增删改查
- 知识包文件管理（添加/删除规则文件）
- 知识包发布和缓存刷新
- 仿真测试功能
- 批量测试功能
- 知识包导入导出

### 技术要求
- **预计工作量**: 18小时
- **优先级**: 高
- **依赖模块**: 公共组件库、主框架模块
- **技术栈**: Vue 3 + Element Plus + Pinia

## 老项目分析

### 目录结构
```
src/package/
├── components/
│   ├── PackageEditor.jsx          # 主编辑器组件
│   ├── PackageDialog.jsx          # 知识包编辑对话框
│   ├── ItemDialog.jsx             # 知识文件编辑对话框
│   ├── SimulatorPage.jsx          # 仿真测试页面
│   ├── ReteDiagramDialog.jsx      # Rete图表对话框
│   ├── FlowDialog.jsx             # 流程对话框
│   ├── ImportExcelDataDialog.jsx  # Excel数据导入对话框
│   └── BatchTestDialog.jsx        # 批量测试对话框
├── action.js                      # Redux actions
├── event.js                       # 事件定义
└── reducer.js                     # Redux reducer
```

### 核心功能分析

#### 1. 主编辑器界面
- **上下分栏布局**: 上方为知识包列表，下方为选中知识包的文件列表
- **知识包操作**: 添加包、保存、发布、仿真测试
- **文件操作**: 添加文件、编辑文件、删除文件

#### 2. 知识包管理
- **基本信息**: ID、名称、创建日期
- **文件管理**: 支持多种文件类型（rs.xml、dt.xml、ul等）
- **版本控制**: 支持文件版本管理

#### 3. 发布功能
- **缓存刷新**: 发布知识包到服务器缓存
- **客户端推送**: 支持推送到配置的客户端
- **发布验证**: 检查文件完整性

#### 4. 仿真测试
- **测试环境**: 模拟规则执行环境
- **参数输入**: 支持多种数据类型输入
- **结果展示**: 显示执行结果和日志

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/package/
├── index.vue                      # 主页面
├── components/
│   ├── PackageList.vue           # 知识包列表组件
│   ├── PackageFileList.vue       # 知识包文件列表组件
│   ├── PackageDialog.vue         # 知识包编辑对话框
│   ├── PackageFileDialog.vue     # 知识文件编辑对话框
│   ├── SimulatorDialog.vue       # 仿真测试对话框
│   ├── BatchTestDialog.vue       # 批量测试对话框
│   └── ImportExcelDialog.vue     # Excel导入对话框
├── composables/
│   ├── usePackage.js             # 知识包管理逻辑
│   ├── usePackageFile.js         # 文件管理逻辑
│   └── useSimulator.js           # 仿真测试逻辑
└── stores/
    └── packageStore.js           # Pinia状态管理
```

### 2. 主页面组件 (index.vue)

```vue
<template>
  <div class="package-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAddPackage">
        <el-icon><Plus /></el-icon>
        添加包
      </el-button>
      <el-button type="success" @click="handleSave">
        <el-icon><Document /></el-icon>
        保存
      </el-button>
      <el-button 
        type="warning" 
        @click="handlePublish"
        :disabled="!currentPackage"
      >
        <el-icon><Upload /></el-icon>
        发布当前知识包
      </el-button>
      <el-button 
        type="danger" 
        @click="handleSimulator"
        :disabled="!currentPackage"
      >
        <el-icon><VideoPlay /></el-icon>
        仿真测试
      </el-button>
    </div>

    <!-- 分割面板 -->
    <el-container class="main-container">
      <el-container direction="vertical">
        <!-- 知识包列表 -->
        <el-header height="50%">
          <div class="section-title">知识包列表</div>
          <PackageList
            :packages="packages"
            :current-package="currentPackage"
            @select="handleSelectPackage"
            @edit="handleEditPackage"
            @delete="handleDeletePackage"
          />
        </el-header>

        <!-- 知识包文件列表 -->
        <el-main>
          <div class="section-title">
            知识文件列表
            <span v-if="currentPackage" class="package-name">
              - {{ currentPackage.name }}
            </span>
          </div>
          <div class="file-toolbar">
            <el-button 
              type="primary" 
              size="small"
              @click="handleAddFile"
              :disabled="!currentPackage"
            >
              <el-icon><Plus /></el-icon>
              添加文件
            </el-button>
          </div>
          <PackageFileList
            :files="currentPackageFiles"
            @edit="handleEditFile"
            @delete="handleDeleteFile"
          />
        </el-main>
      </el-container>
    </el-container>

    <!-- 对话框组件 -->
    <PackageDialog
      v-model="packageDialogVisible"
      :package-data="editingPackage"
      :is-edit="isEditPackage"
      @confirm="handlePackageDialogConfirm"
    />

    <PackageFileDialog
      v-model="fileDialogVisible"
      :file-data="editingFile"
      :is-edit="isEditFile"
      :project="project"
      @confirm="handleFileDialogConfirm"
    />

    <SimulatorDialog
      v-model="simulatorDialogVisible"
      :package-data="currentPackage"
    />

    <BatchTestDialog
      v-model="batchTestDialogVisible"
      :package-data="currentPackage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document, Upload, VideoPlay } from '@element-plus/icons-vue'
import PackageList from './components/PackageList.vue'
import PackageFileList from './components/PackageFileList.vue'
import PackageDialog from './components/PackageDialog.vue'
import PackageFileDialog from './components/PackageFileDialog.vue'
import SimulatorDialog from './components/SimulatorDialog.vue'
import BatchTestDialog from './components/BatchTestDialog.vue'
import { usePackage } from './composables/usePackage'
import { usePackageFile } from './composables/usePackageFile'

/**
 * 知识包管理主页面
 */

// 组合式API
const {
  packages,
  currentPackage,
  loadPackages,
  savePackages,
  publishPackage,
  deletePackage
} = usePackage()

const {
  currentPackageFiles,
  addPackageFile,
  updatePackageFile,
  deletePackageFile
} = usePackageFile()

// 响应式数据
const project = ref(window._project || '')
const packageDialogVisible = ref(false)
const fileDialogVisible = ref(false)
const simulatorDialogVisible = ref(false)
const batchTestDialogVisible = ref(false)
const editingPackage = ref(null)
const editingFile = ref(null)
const isEditPackage = ref(false)
const isEditFile = ref(false)

// 生命周期
onMounted(() => {
  loadPackages()
})

// 事件处理
const handleSelectPackage = (packageData) => {
  currentPackage.value = packageData
}

const handleAddPackage = () => {
  editingPackage.value = null
  isEditPackage.value = false
  packageDialogVisible.value = true
}

const handleEditPackage = (packageData) => {
  editingPackage.value = { ...packageData }
  isEditPackage.value = true
  packageDialogVisible.value = true
}

const handleDeletePackage = async (packageData) => {
  try {
    await ElMessageBox.confirm('真的要删除当前记录？', '确认删除', {
      type: 'warning'
    })
    await deletePackage(packageData)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSave = async () => {
  try {
    await savePackages()
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handlePublish = async () => {
  if (!currentPackage.value) {
    ElMessage.warning('请先选择一个知识包')
    return
  }

  if (!currentPackage.value.resourceItems || 
      currentPackage.value.resourceItems.length === 0) {
    ElMessage.warning('当前知识包没有定义具体文件，不能进行此操作')
    return
  }

  // 检查文件路径完整性
  const invalidItems = currentPackage.value.resourceItems.filter(item => !item.path)
  if (invalidItems.length > 0) {
    ElMessage.warning('当前知识包有未定义具体文件的项目，不能进行此操作')
    return
  }

  try {
    await publishPackage(currentPackage.value)
    ElMessage.success('发布成功')
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

const handleSimulator = () => {
  if (!currentPackage.value) {
    ElMessage.warning('请先选择一个知识包')
    return
  }
  simulatorDialogVisible.value = true
}

const handleAddFile = () => {
  if (!currentPackage.value) {
    ElMessage.warning('请先选择一个知识包')
    return
  }
  editingFile.value = null
  isEditFile.value = false
  fileDialogVisible.value = true
}

const handleEditFile = (fileData) => {
  editingFile.value = { ...fileData }
  isEditFile.value = true
  fileDialogVisible.value = true
}

const handleDeleteFile = async (fileData) => {
  try {
    await ElMessageBox.confirm('真的要删除当前记录？', '确认删除', {
      type: 'warning'
    })
    await deletePackageFile(fileData)
    ElMessage.success('删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handlePackageDialogConfirm = (packageData) => {
  // 处理知识包对话框确认
  packageDialogVisible.value = false
}

const handleFileDialogConfirm = (fileData) => {
  // 处理文件对话框确认
  fileDialogVisible.value = false
}
</script>

<style scoped>
.package-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid #e4e7ed;
  background: #f5f7fa;
}

.main-container {
  flex: 1;
  height: calc(100% - 60px);
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  padding: 8px;
  background: #f0f2f5;
  border-left: 4px solid #409eff;
}

.package-name {
  color: #409eff;
  font-weight: normal;
}

.file-toolbar {
  padding: 8px;
  border-bottom: 1px solid #e4e7ed;
}
</style>
```

### 3. 知识包列表组件 (PackageList.vue)

```vue
<template>
  <div class="package-list">
    <el-table
      :data="packages"
      height="100%"
      highlight-current-row
      @current-change="handleCurrentChange"
    >
      <el-table-column prop="id" label="编码" width="200" />
      <el-table-column prop="name" label="名称" width="200" />
      <el-table-column 
        prop="createDate" 
        label="创建日期" 
        width="180"
        :formatter="formatDate"
      />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { formatDateTime } from '@/utils/dateUtils'

/**
 * 知识包列表组件
 */

// Props
const props = defineProps({
  packages: {
    type: Array,
    default: () => []
  },
  currentPackage: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['select', 'edit', 'delete'])

// 事件处理
const handleCurrentChange = (row) => {
  emit('select', row)
}

const handleEdit = (row) => {
  emit('edit', row)
}

const handleDelete = (row) => {
  emit('delete', row)
}

const formatDate = (row, column, cellValue) => {
  return formatDateTime(cellValue)
}
</script>

<style scoped>
.package-list {
  height: 100%;
}
</style>
```

### 4. 知识包文件列表组件 (PackageFileList.vue)

```vue
<template>
  <div class="package-file-list">
    <el-table
      :data="files"
      height="100%"
    >
      <el-table-column prop="name" label="名称" width="250" />
      <el-table-column prop="path" label="资源文件路径" />
      <el-table-column prop="version" label="版本" width="100" />
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            type="danger"
            size="small"
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

/**
 * 知识包文件列表组件
 */

// Props
const props = defineProps({
  files: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['edit', 'delete'])

// 事件处理
const handleEdit = (row) => {
  emit('edit', row)
}

const handleDelete = (row) => {
  emit('delete', row)
}
</script>

<style scoped>
.package-file-list {
  height: 100%;
}
</style>
```

### 5. 知识包编辑对话框 (PackageDialog.vue)

```vue
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑知识包' : '添加知识包'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <el-form-item label="知识包编码" prop="id">
        <el-input
          v-model="formData.id"
          placeholder="请输入知识包编码"
          :disabled="isEdit"
        />
      </el-form-item>
      <el-form-item label="知识包名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入知识包名称"
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
import { ElMessage } from 'element-plus'

/**
 * 知识包编辑对话框
 */

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  packageData: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'confirm'])

// 响应式数据
const formRef = ref()
const formData = ref({
  id: '',
  name: ''
})

const formRules = {
  id: [
    { required: true, message: '知识包编码不能为空', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '知识包名称不能为空', trigger: 'blur' }
  ]
}

// 计算属性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听器
watch(() => props.packageData, (newData) => {
  if (newData) {
    formData.value = { ...newData }
  } else {
    formData.value = {
      id: '',
      name: ''
    }
  }
}, { immediate: true })

// 事件处理
const handleClose = () => {
  formRef.value?.resetFields()
}

const handleCancel = () => {
  dialogVisible.value = false
}

const handleConfirm = async () => {
  try {
    await formRef.value.validate()
    emit('confirm', { ...formData.value })
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('请检查表单输入')
  }
}
</script>
```

### 6. 组合式API - usePackage.js

```javascript
/**
 * 知识包管理组合式API
 */
import { ref, computed } from 'vue'
import { packageApi } from '@/api/package'
import { ElMessage } from 'element-plus'

export function usePackage() {
  // 响应式数据
  const packages = ref([])
  const currentPackage = ref(null)
  const loading = ref(false)

  // 计算属性
  const currentPackageFiles = computed(() => {
    return currentPackage.value?.resourceItems || []
  })

  /**
   * 加载知识包列表
   */
  const loadPackages = async () => {
    try {
      loading.value = true
      const response = await packageApi.getPackages()
      packages.value = response.data || []
    } catch (error) {
      ElMessage.error('加载知识包列表失败')
      console.error('Load packages error:', error)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存知识包
   */
  const savePackages = async () => {
    try {
      loading.value = true
      await packageApi.savePackages(packages.value)
    } catch (error) {
      ElMessage.error('保存知识包失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 发布知识包
   */
  const publishPackage = async (packageData) => {
    try {
      loading.value = true
      
      // 构建文件列表
      const files = packageData.resourceItems.map(item => {
        let path = item.path
        if (item.version !== 'LATEST') {
          path += ':' + item.version
        }
        return path
      }).join(';')

      const response = await packageApi.publishPackage({
        project: window._project,
        packageId: packageData.id,
        files
      })

      // 处理客户端推送
      if (response.clientInfo) {
        const shouldPush = await ElMessageBox.confirm(
          `发布操作成功！产品[${window._project}]中配置了如下客户端：${response.clientInfo}是否将此次更新的知识包推送到这些客户端中？`,
          '发布成功',
          {
            type: 'success',
            dangerouslyUseHTMLString: true
          }
        )

        if (shouldPush) {
          await packageApi.pushToClients({
            project: window._project,
            packageId: packageData.id
          })
          ElMessage.success('推送到客户端成功')
        }
      } else {
        ElMessage.success(`刷新知识包[${packageData.id}]操作成功!`)
      }
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('发布知识包失败')
        throw error
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除知识包
   */
  const deletePackage = async (packageData) => {
    try {
      const index = packages.value.findIndex(p => p.id === packageData.id)
      if (index > -1) {
        packages.value.splice(index, 1)
      }
      
      // 如果删除的是当前选中的包，清空选择
      if (currentPackage.value?.id === packageData.id) {
        currentPackage.value = null
      }
    } catch (error) {
      ElMessage.error('删除知识包失败')
      throw error
    }
  }

  return {
    packages,
    currentPackage,
    currentPackageFiles,
    loading,
    loadPackages,
    savePackages,
    publishPackage,
    deletePackage
  }
}
```

### 7. API接口定义

```javascript
/**
 * 知识包管理API
 */
import request from '@/utils/request'

export const packageApi = {
  /**
   * 获取知识包列表
   */
  getPackages() {
    return request({
      url: '/api/urule/packageeditor/loadPackages',
      method: 'get',
      params: {
        project: window._project
      }
    })
  },

  /**
   * 保存知识包
   */
  savePackages(packages) {
    return request({
      url: '/api/urule/packageeditor/save',
      method: 'post',
      data: {
        project: window._project,
        packages
      }
    })
  },

  /**
   * 发布知识包
   */
  publishPackage(data) {
    return request({
      url: '/api/urule/packageeditor/refreshKnowledgeCache',
      method: 'post',
      data
    })
  },

  /**
   * 推送到客户端
   */
  pushToClients(data) {
    return request({
      url: '/api/urule/packageeditor/pushKnowledgePackageToClients',
      method: 'post',
      data
    })
  },

  /**
   * 加载仿真测试数据
   */
  loadSimulatorData(files) {
    return request({
      url: '/api/urule/packageeditor/loadSimulatorCategoryData',
      method: 'post',
      data: { files }
    })
  }
}
```

### 8. Pinia状态管理

```javascript
/**
 * 知识包状态管理
 */
import { defineStore } from 'pinia'
import { packageApi } from '@/api/package'

export const usePackageStore = defineStore('package', {
  state: () => ({
    packages: [],
    currentPackage: null,
    loading: false
  }),

  getters: {
    currentPackageFiles: (state) => {
      return state.currentPackage?.resourceItems || []
    },

    packageById: (state) => {
      return (id) => state.packages.find(p => p.id === id)
    }
  },

  actions: {
    /**
     * 设置当前知识包
     */
    setCurrentPackage(packageData) {
      this.currentPackage = packageData
    },

    /**
     * 添加知识包
     */
    addPackage(packageData) {
      this.packages.push({
        ...packageData,
        createDate: new Date().toISOString(),
        resourceItems: []
      })
    },

    /**
     * 更新知识包
     */
    updatePackage(packageData) {
      const index = this.packages.findIndex(p => p.id === packageData.id)
      if (index > -1) {
        this.packages[index] = { ...this.packages[index], ...packageData }
      }
    },

    /**
     * 删除知识包
     */
    removePackage(packageId) {
      const index = this.packages.findIndex(p => p.id === packageId)
      if (index > -1) {
        this.packages.splice(index, 1)
      }
      
      if (this.currentPackage?.id === packageId) {
        this.currentPackage = null
      }
    },

    /**
     * 添加知识包文件
     */
    addPackageFile(packageId, fileData) {
      const packageData = this.packageById(packageId)
      if (packageData) {
        if (!packageData.resourceItems) {
          packageData.resourceItems = []
        }
        packageData.resourceItems.push(fileData)
      }
    },

    /**
     * 更新知识包文件
     */
    updatePackageFile(packageId, fileData) {
      const packageData = this.packageById(packageId)
      if (packageData && packageData.resourceItems) {
        const index = packageData.resourceItems.findIndex(f => f.id === fileData.id)
        if (index > -1) {
          packageData.resourceItems[index] = { ...packageData.resourceItems[index], ...fileData }
        }
      }
    },

    /**
     * 删除知识包文件
     */
    removePackageFile(packageId, fileId) {
      const packageData = this.packageById(packageId)
      if (packageData && packageData.resourceItems) {
        const index = packageData.resourceItems.findIndex(f => f.id === fileId)
        if (index > -1) {
          packageData.resourceItems.splice(index, 1)
        }
      }
    }
  }
})
```

## 数据结构定义

### 知识包数据结构
```javascript
const PackageData = {
  id: 'string',              // 知识包ID
  name: 'string',            // 知识包名称
  createDate: 'string',      // 创建日期
  resourceItems: [           // 资源文件列表
    {
      id: 'string',          // 文件ID
      name: 'string',        // 文件名称
      path: 'string',        // 文件路径
      version: 'string'      // 文件版本
    }
  ]
}
```

### 知识包文件数据结构
```javascript
const PackageFileData = {
  id: 'string',              // 文件ID
  name: 'string',            // 文件名称
  path: 'string',            // 文件路径
  version: 'string',         // 文件版本 (LATEST/具体版本号)
  type: 'string'             // 文件类型
}
```

## 路由配置

```javascript
// router/modules/package.js
export default {
  path: '/package',
  name: 'Package',
  component: () => import('@/views/package/index.vue'),
  meta: {
    title: '知识包管理',
    icon: 'package',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 知识包的增删改查操作
- [ ] 知识包文件的管理操作
- [ ] 知识包发布功能
- [ ] 仿真测试功能
- [ ] 批量测试功能

### 2. 界面测试
- [ ] 上下分栏布局正确显示
- [ ] 表格数据正确展示
- [ ] 对话框正常弹出和关闭
- [ ] 按钮状态正确切换

### 3. 数据测试
- [ ] API接口调用正确
- [ ] 数据状态管理正确
- [ ] 表单验证正确
- [ ] 错误处理正确

### 4. 兼容性测试
- [ ] 不同浏览器兼容性
- [ ] 响应式布局适配
- [ ] 键盘操作支持

## 注意事项

### 1. 技术要点
- 使用Element Plus的表格组件实现数据展示
- 使用Pinia进行状态管理
- 使用组合式API封装业务逻辑
- 支持文件版本管理

### 2. 用户体验
- 保持与老项目相同的操作流程
- 提供清晰的操作反馈
- 支持快捷键操作
- 优化加载性能

### 3. 数据安全
- 发布前验证文件完整性
- 提供操作确认机制
- 支持操作撤销
- 记录操作日志

### 4. 扩展性
- 支持新的文件类型
- 支持自定义发布策略
- 支持插件化扩展
- 支持多环境部署

---

**预计完成时间**: 18小时  
**测试时间**: 4小时  
**文档更新**: 1小时  
**总计**: 23小时 