# 决策流设计器模块迁移计划

## 模块概述

决策流设计器是URule系统中的可视化流程编辑器，允许用户通过拖拽的方式创建复杂的业务流程。支持多种节点类型，包括开始节点、结束节点、决策节点、知识包节点等，并提供连线、属性配置等功能。

### 功能特性
- 可视化流程设计
- 多种节点类型支持
- 拖拽式操作界面
- 节点连线管理
- 流程验证功能
- 流程导入导出

### 技术要求
- **预计工作量**: 35小时
- **优先级**: 中
- **依赖模块**: 公共组件库、知识包管理
- **技术栈**: Vue 3 + Element Plus + 自定义流程设计器

## 老项目分析

### 核心功能分析

#### 1. 流程设计器 (FlowDesigner)
- **画布管理**: 提供可拖拽的设计画布
- **节点工具箱**: 包含各种类型的节点
- **连线工具**: 支持节点间的连线操作
- **属性面板**: 配置节点和连线的属性

#### 2. 节点类型
- **StartTool**: 开始节点
- **EndTool**: 结束节点
- **DecisionTool**: 决策节点
- **PackageTool**: 知识包节点
- **RuleTool**: 规则节点
- **ScriptTool**: 脚本节点

#### 3. 流程操作
- **节点拖拽**: 从工具箱拖拽节点到画布
- **节点连接**: 通过连接点连接节点
- **属性编辑**: 双击节点编辑属性
- **流程验证**: 检查流程的完整性和正确性

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/flowDesigner/
├── index.vue                   # 主设计器页面
├── components/
│   ├── FlowToolbar.vue        # 工具栏组件
│   ├── NodeToolbox.vue        # 节点工具箱
│   ├── FlowCanvas.vue         # 流程画布
│   ├── FlowNode.vue           # 流程节点组件
│   ├── NodeConnection.vue     # 节点连线组件
│   ├── PropertyPanel.vue      # 属性面板
│   └── nodes/                 # 各种节点组件
│       ├── StartNode.vue      # 开始节点
│       ├── EndNode.vue        # 结束节点
│       ├── DecisionNode.vue   # 决策节点
│       ├── PackageNode.vue    # 知识包节点
│       ├── RuleNode.vue       # 规则节点
│       └── ScriptNode.vue     # 脚本节点
├── composables/
│   ├── useFlowDesigner.js     # 流程设计器逻辑
│   ├── useNodeOperations.js   # 节点操作逻辑
│   ├── useConnectionManager.js # 连线管理逻辑
│   └── useFlowValidation.js   # 流程验证逻辑
├── stores/
│   └── flowDesignerStore.js   # 状态管理
└── utils/
    ├── flowXmlBuilder.js      # 流程XML构建
    ├── nodeFactory.js         # 节点工厂
    └── connectionUtils.js     # 连线工具
```

### 2. 主设计器页面 (index.vue)

```vue
<template>
  <div class="flow-designer">
    <!-- 工具栏 -->
    <FlowToolbar
      @save="handleSave"
      @save-new-version="handleSaveNewVersion"
      @validate="handleValidate"
      @clear="handleClear"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
      @fit-canvas="handleFitCanvas"
    />

    <div class="designer-content">
      <!-- 节点工具箱 -->
      <div class="toolbox-panel">
        <NodeToolbox
          :node-types="nodeTypes"
          @node-drag-start="handleNodeDragStart"
        />
      </div>

      <!-- 流程画布 -->
      <div class="canvas-panel">
        <FlowCanvas
          ref="canvasRef"
          :nodes="flowNodes"
          :connections="flowConnections"
          :zoom="canvasZoom"
          @node-add="handleNodeAdd"
          @node-select="handleNodeSelect"
          @node-move="handleNodeMove"
          @node-delete="handleNodeDelete"
          @connection-add="handleConnectionAdd"
          @connection-delete="handleConnectionDelete"
          @canvas-click="handleCanvasClick"
        />
      </div>

      <!-- 属性面板 -->
      <div class="property-panel">
        <PropertyPanel
          :selected-item="selectedItem"
          @property-change="handlePropertyChange"
        />
      </div>
    </div>

    <!-- 验证结果对话框 -->
    <el-dialog
      v-model="validationDialogVisible"
      title="流程验证结果"
      width="600px"
    >
      <div class="validation-results">
        <div v-if="validationErrors.length === 0" class="success-message">
          <el-icon class="success-icon"><SuccessFilled /></el-icon>
          流程验证通过，没有发现错误！
        </div>
        <div v-else>
          <div class="error-summary">
            发现 {{ validationErrors.length }} 个错误：
          </div>
          <div
            v-for="error in validationErrors"
            :key="error.id"
            class="error-item"
          >
            <el-icon class="error-icon"><WarningFilled /></el-icon>
            {{ error.message }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { SuccessFilled, WarningFilled } from '@element-plus/icons-vue'
import FlowToolbar from './components/FlowToolbar.vue'
import NodeToolbox from './components/NodeToolbox.vue'
import FlowCanvas from './components/FlowCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import { useFlowDesigner } from './composables/useFlowDesigner'
import { useFlowValidation } from './composables/useFlowValidation'

/**
 * 决策流设计器主页面
 */

// 路由参数
const route = useRoute()
const file = route.query.file
const version = route.query.version

// 组合式API
const {
  flowNodes,
  flowConnections,
  selectedItem,
  isDirty,
  loadFlow,
  saveFlow,
  addNode,
  selectNode,
  moveNode,
  deleteNode,
  addConnection,
  deleteConnection,
  updateNodeProperty,
  clearFlow
} = useFlowDesigner()

const {
  validationErrors,
  validateFlow
} = useFlowValidation()

// 响应式数据
const canvasRef = ref()
const canvasZoom = ref(1)
const validationDialogVisible = ref(false)

// 节点类型定义
const nodeTypes = ref([
  { type: 'start', label: '开始', icon: 'start', color: '#67c23a' },
  { type: 'end', label: '结束', icon: 'end', color: '#f56c6c' },
  { type: 'decision', label: '决策', icon: 'decision', color: '#e6a23c' },
  { type: 'package', label: '知识包', icon: 'package', color: '#409eff' },
  { type: 'rule', label: '规则', icon: 'rule', color: '#909399' },
  { type: 'script', label: '脚本', icon: 'script', color: '#9c27b0' }
])

// 生命周期
onMounted(() => {
  if (file) {
    loadFlow(file, version)
  }
})

// 事件处理
const handleSave = async () => {
  try {
    await saveFlow(false)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveNewVersion = async () => {
  try {
    await saveFlow(true)
    ElMessage.success('保存新版本成功')
  } catch (error) {
    ElMessage.error('保存新版本失败')
  }
}

const handleValidate = () => {
  const errors = validateFlow(flowNodes.value, flowConnections.value)
  validationErrors.value = errors
  validationDialogVisible.value = true
}

const handleClear = () => {
  clearFlow()
}

const handleZoomIn = () => {
  canvasZoom.value = Math.min(canvasZoom.value + 0.1, 2)
}

const handleZoomOut = () => {
  canvasZoom.value = Math.max(canvasZoom.value - 0.1, 0.5)
}

const handleFitCanvas = () => {
  canvasZoom.value = 1
  canvasRef.value?.fitToContent()
}

const handleNodeDragStart = (nodeType) => {
  // 处理节点拖拽开始
}

const handleNodeAdd = (nodeData) => {
  addNode(nodeData)
}

const handleNodeSelect = (node) => {
  selectNode(node)
}

const handleNodeMove = (nodeId, position) => {
  moveNode(nodeId, position)
}

const handleNodeDelete = (nodeId) => {
  deleteNode(nodeId)
}

const handleConnectionAdd = (connectionData) => {
  addConnection(connectionData)
}

const handleConnectionDelete = (connectionId) => {
  deleteConnection(connectionId)
}

const handleCanvasClick = () => {
  selectNode(null)
}

const handlePropertyChange = (property, value) => {
  if (selectedItem.value) {
    updateNodeProperty(selectedItem.value.id, property, value)
  }
}
</script>

<style scoped>
.flow-designer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.designer-content {
  flex: 1;
  display: flex;
  height: calc(100% - 60px);
}

.toolbox-panel {
  width: 200px;
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
}

.canvas-panel {
  flex: 1;
  background: white;
  position: relative;
  overflow: hidden;
}

.property-panel {
  width: 300px;
  background: white;
  border-left: 1px solid #e4e7ed;
  overflow-y: auto;
}

.validation-results {
  padding: 20px;
}

.success-message {
  display: flex;
  align-items: center;
  color: #67c23a;
  font-size: 16px;
}

.success-icon {
  margin-right: 8px;
  font-size: 20px;
}

.error-summary {
  font-weight: bold;
  margin-bottom: 15px;
  color: #f56c6c;
}

.error-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  color: #f56c6c;
}

.error-icon {
  margin-right: 8px;
  font-size: 16px;
}
</style>
```

### 3. 流程画布组件 (FlowCanvas.vue)

```vue
<template>
  <div
    ref="canvasContainer"
    class="flow-canvas"
    :style="{ transform: `scale(${zoom})` }"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @click="handleCanvasClick"
  >
    <!-- 网格背景 -->
    <div class="canvas-grid"></div>

    <!-- SVG连线层 -->
    <svg class="connections-layer" :width="canvasWidth" :height="canvasHeight">
      <NodeConnection
        v-for="connection in connections"
        :key="connection.id"
        :connection="connection"
        :nodes="nodeMap"
        @delete="handleConnectionDelete"
      />
    </svg>

    <!-- 节点层 -->
    <div class="nodes-layer">
      <FlowNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :selected="selectedNodeId === node.id"
        @select="handleNodeSelect"
        @move="handleNodeMove"
        @delete="handleNodeDelete"
        @connection-start="handleConnectionStart"
        @connection-end="handleConnectionEnd"
      />
    </div>

    <!-- 临时连线 -->
    <svg v-if="tempConnection" class="temp-connection-layer" :width="canvasWidth" :height="canvasHeight">
      <path
        :d="tempConnection.path"
        stroke="#409eff"
        stroke-width="2"
        fill="none"
        stroke-dasharray="5,5"
      />
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import FlowNode from './FlowNode.vue'
import NodeConnection from './NodeConnection.vue'
import { generateId } from '@/utils/common'

/**
 * 流程画布组件
 */

// Props
const props = defineProps({
  nodes: {
    type: Array,
    default: () => []
  },
  connections: {
    type: Array,
    default: () => []
  },
  zoom: {
    type: Number,
    default: 1
  }
})

// Emits
const emit = defineEmits([
  'node-add',
  'node-select',
  'node-move',
  'node-delete',
  'connection-add',
  'connection-delete',
  'canvas-click'
])

// 响应式数据
const canvasContainer = ref()
const canvasWidth = ref(2000)
const canvasHeight = ref(1500)
const selectedNodeId = ref(null)
const tempConnection = ref(null)
const connectionStart = ref(null)

// 计算属性
const nodeMap = computed(() => {
  const map = new Map()
  props.nodes.forEach(node => {
    map.set(node.id, node)
  })
  return map
})

// 生命周期
onMounted(() => {
  updateCanvasSize()
  window.addEventListener('resize', updateCanvasSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

// 方法
const updateCanvasSize = () => {
  if (canvasContainer.value) {
    const rect = canvasContainer.value.getBoundingClientRect()
    canvasWidth.value = Math.max(rect.width, 2000)
    canvasHeight.value = Math.max(rect.height, 1500)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  
  const nodeType = event.dataTransfer.getData('nodeType')
  if (!nodeType) return

  const rect = canvasContainer.value.getBoundingClientRect()
  const x = (event.clientX - rect.left) / props.zoom
  const y = (event.clientY - rect.top) / props.zoom

  const newNode = {
    id: generateId(),
    type: nodeType,
    x,
    y,
    width: 120,
    height: 60,
    properties: getDefaultProperties(nodeType)
  }

  emit('node-add', newNode)
}

const handleDragOver = (event) => {
  event.preventDefault()
}

const handleCanvasClick = (event) => {
  if (event.target === canvasContainer.value || event.target.classList.contains('canvas-grid')) {
    selectedNodeId.value = null
    emit('canvas-click')
  }
}

const handleNodeSelect = (node) => {
  selectedNodeId.value = node.id
  emit('node-select', node)
}

const handleNodeMove = (nodeId, position) => {
  emit('node-move', nodeId, position)
}

const handleNodeDelete = (nodeId) => {
  emit('node-delete', nodeId)
}

const handleConnectionStart = (nodeId, portType) => {
  connectionStart.value = { nodeId, portType }
}

const handleConnectionEnd = (nodeId, portType) => {
  if (connectionStart.value && connectionStart.value.nodeId !== nodeId) {
    const connection = {
      id: generateId(),
      sourceNodeId: connectionStart.value.nodeId,
      sourcePort: connectionStart.value.portType,
      targetNodeId: nodeId,
      targetPort: portType
    }
    
    emit('connection-add', connection)
  }
  
  connectionStart.value = null
  tempConnection.value = null
}

const handleConnectionDelete = (connectionId) => {
  emit('connection-delete', connectionId)
}

const getDefaultProperties = (nodeType) => {
  const defaults = {
    start: { name: '开始' },
    end: { name: '结束' },
    decision: { name: '决策', script: '' },
    package: { name: '知识包', packageId: '' },
    rule: { name: '规则', file: '', version: 'LATEST' },
    script: { name: '脚本', script: '' }
  }
  
  return defaults[nodeType] || { name: '节点' }
}

// 暴露方法
defineExpose({
  fitToContent: () => {
    // 实现适应内容的缩放逻辑
  }
})
</script>

<style scoped>
.flow-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  transform-origin: 0 0;
  cursor: default;
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(to right, #f0f0f0 1px, transparent 1px),
    linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
}

.connections-layer,
.temp-connection-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.nodes-layer {
  position: relative;
  z-index: 2;
}
</style>
```

### 4. 流程节点组件 (FlowNode.vue)

```vue
<template>
  <div
    class="flow-node"
    :class="[
      `node-${node.type}`,
      { 'node-selected': selected }
    ]"
    :style="nodeStyle"
    @mousedown="handleMouseDown"
    @click="handleClick"
    @dblclick="handleDoubleClick"
  >
    <!-- 节点内容 -->
    <div class="node-content">
      <div class="node-icon">
        <component :is="getNodeIcon(node.type)" />
      </div>
      <div class="node-label">{{ node.properties.name || node.type }}</div>
    </div>

    <!-- 连接点 -->
    <div class="connection-ports">
      <!-- 输入端口 -->
      <div
        v-if="hasInputPort(node.type)"
        class="port input-port"
        @mousedown.stop="handlePortMouseDown('input')"
        @mouseup.stop="handlePortMouseUp('input')"
      ></div>
      
      <!-- 输出端口 -->
      <div
        v-if="hasOutputPort(node.type)"
        class="port output-port"
        @mousedown.stop="handlePortMouseDown('output')"
        @mouseup.stop="handlePortMouseUp('output')"
      ></div>
    </div>

    <!-- 删除按钮 -->
    <div v-if="selected && node.type !== 'start'" class="delete-button" @click.stop="handleDelete">
      <el-icon><Close /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Close } from '@element-plus/icons-vue'

/**
 * 流程节点组件
 */

// Props
const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits([
  'select',
  'move',
  'delete',
  'connection-start',
  'connection-end'
])

// 响应式数据
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 计算属性
const nodeStyle = computed(() => ({
  left: `${props.node.x}px`,
  top: `${props.node.y}px`,
  width: `${props.node.width}px`,
  height: `${props.node.height}px`
}))

// 方法
const getNodeIcon = (nodeType) => {
  const icons = {
    start: 'PlayCircleFilled',
    end: 'StopFilled',
    decision: 'QuestionFilled',
    package: 'FolderFilled',
    rule: 'DocumentFilled',
    script: 'CodeFilled'
  }
  return icons[nodeType] || 'CircleFilled'
}

const hasInputPort = (nodeType) => {
  return nodeType !== 'start'
}

const hasOutputPort = (nodeType) => {
  return nodeType !== 'end'
}

const handleClick = (event) => {
  event.stopPropagation()
  emit('select', props.node)
}

const handleDoubleClick = (event) => {
  event.stopPropagation()
  // 双击编辑节点属性
}

const handleMouseDown = (event) => {
  if (event.target.classList.contains('port')) return
  
  isDragging.value = true
  dragStart.value = {
    x: event.clientX - props.node.x,
    y: event.clientY - props.node.y
  }

  const handleMouseMove = (moveEvent) => {
    if (!isDragging.value) return
    
    const newX = moveEvent.clientX - dragStart.value.x
    const newY = moveEvent.clientY - dragStart.value.y
    
    emit('move', props.node.id, { x: newX, y: newY })
  }

  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handlePortMouseDown = (portType) => {
  emit('connection-start', props.node.id, portType)
}

const handlePortMouseUp = (portType) => {
  emit('connection-end', props.node.id, portType)
}

const handleDelete = () => {
  emit('delete', props.node.id)
}
</script>

<style scoped>
.flow-node {
  position: absolute;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  background: white;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
}

.flow-node:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-selected {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2) !important;
}

.node-start {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: white;
}

.node-end {
  background: linear-gradient(135deg, #f56c6c, #f89898);
  color: white;
}

.node-decision {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  color: white;
}

.node-package {
  background: linear-gradient(135deg, #409eff, #79bbff);
  color: white;
}

.node-rule {
  background: linear-gradient(135deg, #909399, #b1b3b8);
  color: white;
}

.node-script {
  background: linear-gradient(135deg, #9c27b0, #ba68c8);
  color: white;
}

.node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
}

.node-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.node-label {
  font-size: 12px;
  text-align: center;
  word-break: break-all;
}

.connection-ports {
  position: relative;
}

.port {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #409eff;
  border-radius: 50%;
  background: white;
  cursor: crosshair;
}

.input-port {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.output-port {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.port:hover {
  background: #409eff;
  transform: translateX(-50%) scale(1.2);
}

.delete-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f56c6c;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
}

.delete-button:hover {
  background: #f78989;
}
</style>
```

### 5. 组合式API - useFlowDesigner.js

```javascript
/**
 * 流程设计器组合式API
 */
import { ref, computed } from 'vue'
import { flowDesignerApi } from '@/api/flowDesigner'
import { generateId } from '@/utils/common'
import { buildFlowXml } from '../utils/flowXmlBuilder'

export function useFlowDesigner() {
  // 响应式数据
  const flowNodes = ref([])
  const flowConnections = ref([])
  const selectedItem = ref(null)
  const isDirty = ref(false)
  const loading = ref(false)

  // 计算属性
  const nodeCount = computed(() => flowNodes.value.length)
  const connectionCount = computed(() => flowConnections.value.length)

  /**
   * 加载流程
   */
  const loadFlow = async (file, version) => {
    try {
      loading.value = true
      const response = await flowDesignerApi.loadFlow(file, version)
      const data = response.data

      parseFlowData(data)
      isDirty.value = false
    } catch (error) {
      console.error('Load flow error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存流程
   */
  const saveFlow = async (newVersion = false) => {
    try {
      loading.value = true
      
      const xml = buildFlowXml({
        nodes: flowNodes.value,
        connections: flowConnections.value
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

      await flowDesignerApi.saveFlow(params)
      isDirty.value = false
    } catch (error) {
      console.error('Save flow error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加节点
   */
  const addNode = (nodeData) => {
    flowNodes.value.push(nodeData)
    setDirty()
  }

  /**
   * 选择节点
   */
  const selectNode = (node) => {
    selectedItem.value = node
  }

  /**
   * 移动节点
   */
  const moveNode = (nodeId, position) => {
    const node = flowNodes.value.find(n => n.id === nodeId)
    if (node) {
      node.x = position.x
      node.y = position.y
      setDirty()
    }
  }

  /**
   * 删除节点
   */
  const deleteNode = (nodeId) => {
    // 删除节点
    const nodeIndex = flowNodes.value.findIndex(n => n.id === nodeId)
    if (nodeIndex > -1) {
      flowNodes.value.splice(nodeIndex, 1)
    }

    // 删除相关连线
    flowConnections.value = flowConnections.value.filter(
      conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
    )

    // 清除选择
    if (selectedItem.value?.id === nodeId) {
      selectedItem.value = null
    }

    setDirty()
  }

  /**
   * 添加连线
   */
  const addConnection = (connectionData) => {
    // 检查是否已存在相同连线
    const exists = flowConnections.value.some(conn =>
      conn.sourceNodeId === connectionData.sourceNodeId &&
      conn.targetNodeId === connectionData.targetNodeId
    )

    if (!exists) {
      flowConnections.value.push(connectionData)
      setDirty()
    }
  }

  /**
   * 删除连线
   */
  const deleteConnection = (connectionId) => {
    const index = flowConnections.value.findIndex(conn => conn.id === connectionId)
    if (index > -1) {
      flowConnections.value.splice(index, 1)
      setDirty()
    }
  }

  /**
   * 更新节点属性
   */
  const updateNodeProperty = (nodeId, property, value) => {
    const node = flowNodes.value.find(n => n.id === nodeId)
    if (node) {
      if (!node.properties) {
        node.properties = {}
      }
      node.properties[property] = value
      setDirty()
    }
  }

  /**
   * 清空流程
   */
  const clearFlow = () => {
    flowNodes.value = []
    flowConnections.value = []
    selectedItem.value = null
    setDirty()
  }

  /**
   * 解析流程数据
   */
  const parseFlowData = (data) => {
    // 解析节点
    flowNodes.value = (data.nodes || []).map(nodeData => ({
      id: nodeData.id || generateId(),
      type: nodeData.type,
      x: nodeData.x || 0,
      y: nodeData.y || 0,
      width: nodeData.width || 120,
      height: nodeData.height || 60,
      properties: nodeData.properties || {}
    }))

    // 解析连线
    flowConnections.value = (data.connections || []).map(connData => ({
      id: connData.id || generateId(),
      sourceNodeId: connData.sourceNodeId,
      sourcePort: connData.sourcePort || 'output',
      targetNodeId: connData.targetNodeId,
      targetPort: connData.targetPort || 'input'
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
    flowNodes,
    flowConnections,
    selectedItem,
    isDirty,
    loading,
    nodeCount,
    connectionCount,
    loadFlow,
    saveFlow,
    addNode,
    selectNode,
    moveNode,
    deleteNode,
    addConnection,
    deleteConnection,
    updateNodeProperty,
    clearFlow,
    setDirty
  }
}
```

### 6. 流程验证逻辑 (useFlowValidation.js)

```javascript
/**
 * 流程验证组合式API
 */
import { ref } from 'vue'

export function useFlowValidation() {
  // 响应式数据
  const validationErrors = ref([])

  /**
   * 验证流程
   */
  const validateFlow = (nodes, connections) => {
    const errors = []

    // 检查是否有开始节点
    const startNodes = nodes.filter(node => node.type === 'start')
    if (startNodes.length === 0) {
      errors.push({
        id: 'no-start-node',
        message: '流程必须包含一个开始节点'
      })
    } else if (startNodes.length > 1) {
      errors.push({
        id: 'multiple-start-nodes',
        message: '流程只能包含一个开始节点'
      })
    }

    // 检查是否有结束节点
    const endNodes = nodes.filter(node => node.type === 'end')
    if (endNodes.length === 0) {
      errors.push({
        id: 'no-end-node',
        message: '流程必须包含至少一个结束节点'
      })
    }

    // 检查孤立节点
    const connectedNodeIds = new Set()
    connections.forEach(conn => {
      connectedNodeIds.add(conn.sourceNodeId)
      connectedNodeIds.add(conn.targetNodeId)
    })

    const isolatedNodes = nodes.filter(node => 
      node.type !== 'start' && !connectedNodeIds.has(node.id)
    )

    isolatedNodes.forEach(node => {
      errors.push({
        id: `isolated-node-${node.id}`,
        message: `节点 "${node.properties.name || node.type}" 没有连接到流程中`
      })
    })

    // 检查节点属性
    nodes.forEach(node => {
      const nodeErrors = validateNodeProperties(node)
      errors.push(...nodeErrors)
    })

    // 检查流程连通性
    const connectivityErrors = validateFlowConnectivity(nodes, connections)
    errors.push(...connectivityErrors)

    return errors
  }

  /**
   * 验证节点属性
   */
  const validateNodeProperties = (node) => {
    const errors = []

    switch (node.type) {
      case 'package':
        if (!node.properties.packageId) {
          errors.push({
            id: `package-no-id-${node.id}`,
            message: `知识包节点 "${node.properties.name}" 未配置知识包ID`
          })
        }
        break
      case 'rule':
        if (!node.properties.file) {
          errors.push({
            id: `rule-no-file-${node.id}`,
            message: `规则节点 "${node.properties.name}" 未配置规则文件`
          })
        }
        break
      case 'script':
        if (!node.properties.script) {
          errors.push({
            id: `script-no-content-${node.id}`,
            message: `脚本节点 "${node.properties.name}" 未配置脚本内容`
          })
        }
        break
      case 'decision':
        if (!node.properties.script) {
          errors.push({
            id: `decision-no-script-${node.id}`,
            message: `决策节点 "${node.properties.name}" 未配置决策脚本`
          })
        }
        break
    }

    return errors
  }

  /**
   * 验证流程连通性
   */
  const validateFlowConnectivity = (nodes, connections) => {
    const errors = []
    
    // 构建图结构
    const graph = new Map()
    nodes.forEach(node => {
      graph.set(node.id, { node, outgoing: [], incoming: [] })
    })

    connections.forEach(conn => {
      const source = graph.get(conn.sourceNodeId)
      const target = graph.get(conn.targetNodeId)
      
      if (source && target) {
        source.outgoing.push(conn.targetNodeId)
        target.incoming.push(conn.sourceNodeId)
      }
    })

    // 检查从开始节点是否能到达所有节点
    const startNode = nodes.find(node => node.type === 'start')
    if (startNode) {
      const reachableNodes = new Set()
      const visited = new Set()
      
      const dfs = (nodeId) => {
        if (visited.has(nodeId)) return
        visited.add(nodeId)
        reachableNodes.add(nodeId)
        
        const nodeData = graph.get(nodeId)
        if (nodeData) {
          nodeData.outgoing.forEach(targetId => dfs(targetId))
        }
      }

      dfs(startNode.id)

      // 检查不可达节点
      nodes.forEach(node => {
        if (!reachableNodes.has(node.id)) {
          errors.push({
            id: `unreachable-node-${node.id}`,
            message: `节点 "${node.properties.name || node.type}" 从开始节点不可达`
          })
        }
      })
    }

    return errors
  }

  return {
    validationErrors,
    validateFlow
  }
}
```

## 数据结构定义

### 流程数据结构
```javascript
const FlowData = {
  nodes: [                       // 节点列表
    {
      id: 'string',              // 节点ID
      type: 'string',            // 节点类型
      x: 'number',               // X坐标
      y: 'number',               // Y坐标
      width: 'number',           // 宽度
      height: 'number',          // 高度
      properties: {}             // 节点属性
    }
  ],
  connections: [                 // 连线列表
    {
      id: 'string',              // 连线ID
      sourceNodeId: 'string',    // 源节点ID
      sourcePort: 'string',      // 源端口
      targetNodeId: 'string',    // 目标节点ID
      targetPort: 'string'       // 目标端口
    }
  ]
}
```

## API接口定义

```javascript
/**
 * 流程设计器API
 */
import request from '@/utils/request'

export const flowDesignerApi = {
  /**
   * 加载流程
   */
  loadFlow(file, version) {
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
   * 保存流程
   */
  saveFlow(data) {
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
// router/modules/flowDesigner.js
export default {
  path: '/flow-designer',
  name: 'FlowDesigner',
  component: () => import('@/views/flowDesigner/index.vue'),
  meta: {
    title: '决策流设计器',
    icon: 'flow',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 节点的拖拽添加
- [ ] 节点的移动和删除
- [ ] 连线的创建和删除
- [ ] 属性的编辑和保存
- [ ] 流程验证功能
- [ ] 保存和加载功能

### 2. 界面测试
- [ ] 画布正确渲染
- [ ] 节点样式正确
- [ ] 连线绘制正确
- [ ] 交互操作流畅

### 3. 性能测试
- [ ] 大型流程性能
- [ ] 拖拽操作流畅度
- [ ] 渲染性能

## 注意事项

### 1. 技术要点
- 实现自定义的流程设计器
- 使用SVG绘制连线
- 支持节点的拖拽和连接
- 实现流程验证算法

### 2. 用户体验
- 提供直观的可视化界面
- 支持快捷键操作
- 实现撤销/重做功能
- 优化大型流程的性能

---

**预计完成时间**: 35小时  
**测试时间**: 8小时  
**文档更新**: 2小时  
**总计**: 45小时 