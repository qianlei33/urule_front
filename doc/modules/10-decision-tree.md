# 决策树编辑器模块迁移计划

## 模块概述

决策树编辑器提供可视化的树形结构规则编辑功能。用户可以通过拖拽和点击的方式构建决策树，支持条件节点、变量节点、动作节点的创建和配置。

### 功能特性
- 可视化树形结构编辑
- 节点的增删改操作
- 条件和动作的配置
- 树形结构的自动布局
- 节点连线的自动绘制
- 规则属性配置

### 技术要求
- **预计工作量**: 28小时
- **优先级**: 中
- **依赖模块**: 公共组件库、变量管理、常量管理、动作管理
- **技术栈**: Vue 3 + Element Plus + SVG/Canvas绘图

## 老项目分析

### 核心功能分析

#### 1. 决策树类 (DecisionTree.js)
- **树形结构管理**: 管理整个决策树的结构
- **节点管理**: 创建、删除、编辑各种类型的节点
- **布局算法**: 自动计算节点位置和连线
- **属性配置**: 支持规则属性的配置

#### 2. 节点类型
- **VariableNode**: 变量节点，作为条件判断的起点
- **ConditionNode**: 条件节点，定义具体的判断条件
- **ActionNode**: 动作节点，定义执行的动作

#### 3. 节点操作
- **右键菜单**: 提供添加子节点、删除节点等操作
- **属性编辑**: 双击节点进行属性编辑
- **拖拽移动**: 支持节点的拖拽移动

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/decisionTree/
├── index.vue                   # 主编辑器页面
├── components/
│   ├── DecisionTreeToolbar.vue # 工具栏组件
│   ├── TreeCanvas.vue          # 树形画布组件
│   ├── TreeNode.vue            # 树节点组件
│   ├── VariableNode.vue        # 变量节点组件
│   ├── ConditionNode.vue       # 条件节点组件
│   ├── ActionNode.vue          # 动作节点组件
│   ├── NodeContextMenu.vue     # 节点右键菜单
│   └── PropertyPanel.vue       # 属性面板
├── composables/
│   ├── useDecisionTree.js      # 决策树逻辑
│   ├── useTreeLayout.js        # 树形布局逻辑
│   └── useNodeOperations.js    # 节点操作逻辑
├── stores/
│   └── decisionTreeStore.js    # 状态管理
└── utils/
    ├── treeLayoutEngine.js     # 布局引擎
    ├── treeXmlBuilder.js       # XML构建工具
    └── nodeFactory.js          # 节点工厂
```

### 2. 主编辑器页面 (index.vue)

```vue
<template>
  <div class="decision-tree-editor">
    <!-- 工具栏 -->
    <DecisionTreeToolbar
      @save="handleSave"
      @save-new-version="handleSaveNewVersion"
      @config-variable="handleConfigVariable"
      @config-constant="handleConfigConstant"
      @config-action="handleConfigAction"
      @config-parameter="handleConfigParameter"
    />

    <!-- 属性面板 -->
    <PropertyPanel
      :properties="treeProperties"
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

    <!-- 决策树画布 -->
    <div class="tree-container">
      <TreeCanvas
        :tree-data="treeData"
        :selected-node="selectedNode"
        @node-click="handleNodeClick"
        @node-double-click="handleNodeDoubleClick"
        @node-context-menu="handleNodeContextMenu"
        @canvas-click="handleCanvasClick"
      />
    </div>

    <!-- 节点右键菜单 -->
    <NodeContextMenu
      v-model="contextMenuVisible"
      :menu-items="contextMenuItems"
      :position="contextMenuPosition"
      @menu-click="handleContextMenuClick"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import DecisionTreeToolbar from './components/DecisionTreeToolbar.vue'
import TreeCanvas from './components/TreeCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import NodeContextMenu from './components/NodeContextMenu.vue'
import { useDecisionTree } from './composables/useDecisionTree'

/**
 * 决策树编辑器主页面
 */

// 路由参数
const route = useRoute()
const file = route.query.file
const version = route.query.version

// 组合式API
const {
  treeData,
  treeProperties,
  remarkContent,
  selectedNode,
  isDirty,
  loadDecisionTree,
  saveDecisionTree,
  addNode,
  deleteNode,
  updateNode
} = useDecisionTree()

// 响应式数据
const contextMenuVisible = ref(false)
const contextMenuItems = ref([])
const contextMenuPosition = ref({ x: 0, y: 0 })

// 生命周期
onMounted(() => {
  if (file) {
    loadDecisionTree(file, version)
  }
})

// 事件处理
const handleSave = async () => {
  try {
    await saveDecisionTree(false)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveNewVersion = async () => {
  try {
    await saveDecisionTree(true)
    ElMessage.success('保存新版本成功')
  } catch (error) {
    ElMessage.error('保存新版本失败')
  }
}

const handleNodeClick = (node) => {
  selectedNode.value = node
}

const handleNodeDoubleClick = (node) => {
  // 双击编辑节点
  editNode(node)
}

const handleNodeContextMenu = (node, event) => {
  selectedNode.value = node
  
  // 构建右键菜单项
  contextMenuItems.value = buildContextMenuItems(node)
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

const handleCanvasClick = () => {
  selectedNode.value = null
  contextMenuVisible.value = false
}

const handleContextMenuClick = (menuItem) => {
  contextMenuVisible.value = false
  
  switch (menuItem.action) {
    case 'addCondition':
      addNode(selectedNode.value, 'condition')
      break
    case 'addVariable':
      addNode(selectedNode.value, 'variable')
      break
    case 'addAction':
      addNode(selectedNode.value, 'action')
      break
    case 'delete':
      deleteNode(selectedNode.value)
      break
  }
}

const buildContextMenuItems = (node) => {
  const items = []
  
  if (node.type === 'variable' || node.type === 'condition') {
    items.push(
      { label: '添加条件', action: 'addCondition', icon: 'condition' },
      { label: '添加变量', action: 'addVariable', icon: 'variable' },
      { label: '添加动作', action: 'addAction', icon: 'action' }
    )
  }
  
  if (node.allowDelete !== false) {
    items.push({ label: '删除', action: 'delete', icon: 'delete' })
  }
  
  return items
}

const editNode = (node) => {
  // 打开节点编辑对话框
}

const handleAddProperty = (property) => {
  treeProperties.value.push(property)
}

const handleUpdateProperty = (property) => {
  const index = treeProperties.value.findIndex(p => p.id === property.id)
  if (index > -1) {
    treeProperties.value[index] = property
  }
}

const handleDeleteProperty = (propertyId) => {
  const index = treeProperties.value.findIndex(p => p.id === propertyId)
  if (index > -1) {
    treeProperties.value.splice(index, 1)
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
</script>

<style scoped>
.decision-tree-editor {
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

.tree-container {
  flex: 1;
  margin: 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  position: relative;
}
</style>
```

### 3. 树形画布组件 (TreeCanvas.vue)

```vue
<template>
  <div class="tree-canvas" @click="handleCanvasClick">
    <!-- SVG画布用于绘制连线 -->
    <svg class="tree-svg" :width="canvasWidth" :height="canvasHeight">
      <g class="connections">
        <path
          v-for="connection in connections"
          :key="connection.id"
          :d="connection.path"
          class="connection-line"
        />
      </g>
    </svg>

    <!-- 节点容器 -->
    <div class="nodes-container">
      <TreeNode
        v-for="node in flatNodes"
        :key="node.id"
        :node="node"
        :selected="selectedNode?.id === node.id"
        :style="getNodeStyle(node)"
        @click="handleNodeClick"
        @double-click="handleNodeDoubleClick"
        @context-menu="handleNodeContextMenu"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import TreeNode from './TreeNode.vue'
import { useTreeLayout } from '../composables/useTreeLayout'

/**
 * 决策树画布组件
 */

// Props
const props = defineProps({
  treeData: {
    type: Object,
    default: () => ({})
  },
  selectedNode: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits([
  'node-click',
  'node-double-click',
  'node-context-menu',
  'canvas-click'
])

// 组合式API
const {
  flatNodes,
  connections,
  calculateLayout,
  getNodePosition
} = useTreeLayout()

// 响应式数据
const canvasWidth = ref(800)
const canvasHeight = ref(600)

// 计算属性
const nodePositions = computed(() => {
  const positions = new Map()
  flatNodes.value.forEach(node => {
    positions.set(node.id, getNodePosition(node))
  })
  return positions
})

// 监听器
watch(() => props.treeData, (newData) => {
  if (newData) {
    calculateLayout(newData)
    updateCanvasSize()
  }
}, { deep: true, immediate: true })

// 生命周期
onMounted(() => {
  window.addEventListener('resize', updateCanvasSize)
  updateCanvasSize()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

// 方法
const updateCanvasSize = () => {
  const container = document.querySelector('.tree-canvas')
  if (container) {
    canvasWidth.value = container.clientWidth
    canvasHeight.value = container.clientHeight
  }
}

const getNodeStyle = (node) => {
  const position = nodePositions.value.get(node.id)
  if (!position) return {}
  
  return {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -50%)'
  }
}

const handleCanvasClick = (event) => {
  if (event.target.classList.contains('tree-canvas')) {
    emit('canvas-click')
  }
}

const handleNodeClick = (node, event) => {
  event.stopPropagation()
  emit('node-click', node)
}

const handleNodeDoubleClick = (node, event) => {
  event.stopPropagation()
  emit('node-double-click', node)
}

const handleNodeContextMenu = (node, event) => {
  event.preventDefault()
  event.stopPropagation()
  emit('node-context-menu', node, event)
}
</script>

<style scoped>
.tree-canvas {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
  background: #fafafa;
  background-image: 
    radial-gradient(circle, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
}

.tree-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
}

.nodes-container {
  position: relative;
  z-index: 2;
}

.connection-line {
  stroke: #4cae4c;
  stroke-width: 2;
  fill: none;
}
</style>
```

### 4. 树节点组件 (TreeNode.vue)

```vue
<template>
  <div
    class="tree-node"
    :class="[
      `node-${node.type}`,
      { 'node-selected': selected }
    ]"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleContextMenu"
  >
    <div class="node-content">
      <!-- 变量节点 -->
      <VariableNode
        v-if="node.type === 'variable'"
        :node="node"
        @update="handleUpdate"
      />
      
      <!-- 条件节点 -->
      <ConditionNode
        v-else-if="node.type === 'condition'"
        :node="node"
        @update="handleUpdate"
      />
      
      <!-- 动作节点 -->
      <ActionNode
        v-else-if="node.type === 'action'"
        :node="node"
        @update="handleUpdate"
      />
    </div>

    <!-- 节点操作按钮 -->
    <div class="node-operations" v-if="selected">
      <el-button
        type="primary"
        size="small"
        circle
        @click.stop="handleAddChild"
      >
        <el-icon><Plus /></el-icon>
      </el-button>
      <el-button
        v-if="node.allowDelete !== false"
        type="danger"
        size="small"
        circle
        @click.stop="handleDelete"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import VariableNode from './VariableNode.vue'
import ConditionNode from './ConditionNode.vue'
import ActionNode from './ActionNode.vue'

/**
 * 树节点组件
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
const emit = defineEmits(['click', 'double-click', 'context-menu', 'update'])

// 事件处理
const handleClick = (event) => {
  emit('click', props.node, event)
}

const handleDoubleClick = (event) => {
  emit('double-click', props.node, event)
}

const handleContextMenu = (event) => {
  emit('context-menu', props.node, event)
}

const handleUpdate = (updatedNode) => {
  emit('update', updatedNode)
}

const handleAddChild = () => {
  // 触发添加子节点操作
}

const handleDelete = () => {
  // 触发删除节点操作
}
</script>

<style scoped>
.tree-node {
  position: relative;
  min-width: 120px;
  min-height: 60px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tree-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.node-selected {
  border: 2px solid #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

.node-variable {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: white;
}

.node-condition {
  background: linear-gradient(135deg, #e6a23c, #f0c78a);
  color: white;
}

.node-action {
  background: linear-gradient(135deg, #f56c6c, #f89898);
  color: white;
}

.node-content {
  padding: 12px;
  text-align: center;
}

.node-operations {
  position: absolute;
  top: -15px;
  right: -15px;
  display: flex;
  gap: 5px;
}
</style>
```

### 5. 组合式API - useDecisionTree.js

```javascript
/**
 * 决策树管理组合式API
 */
import { ref, computed } from 'vue'
import { decisionTreeApi } from '@/api/decisionTree'
import { generateId } from '@/utils/common'
import { buildDecisionTreeXml } from '../utils/treeXmlBuilder'

export function useDecisionTree() {
  // 响应式数据
  const treeData = ref(null)
  const treeProperties = ref([])
  const remarkContent = ref('')
  const selectedNode = ref(null)
  const libraries = ref({
    variables: [],
    constants: [],
    actions: [],
    parameters: []
  })
  const isDirty = ref(false)
  const loading = ref(false)

  // 计算属性
  const rootNode = computed(() => treeData.value)
  const nodeCount = computed(() => {
    if (!treeData.value) return 0
    return countNodes(treeData.value)
  })

  /**
   * 加载决策树
   */
  const loadDecisionTree = async (file, version) => {
    try {
      loading.value = true
      const response = await decisionTreeApi.loadDecisionTree(file, version)
      const data = response.data

      parseDecisionTreeData(data)
      isDirty.value = false
    } catch (error) {
      console.error('Load decision tree error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存决策树
   */
  const saveDecisionTree = async (newVersion = false) => {
    try {
      loading.value = true
      
      const xml = buildDecisionTreeXml({
        treeData: treeData.value,
        properties: treeProperties.value,
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

      await decisionTreeApi.saveDecisionTree(params)
      isDirty.value = false
    } catch (error) {
      console.error('Save decision tree error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加节点
   */
  const addNode = (parentNode, nodeType) => {
    if (!parentNode) return

    const newNode = createNode(nodeType)
    
    if (!parentNode.children) {
      parentNode.children = []
    }
    
    parentNode.children.push(newNode)
    setDirty()
  }

  /**
   * 删除节点
   */
  const deleteNode = (node) => {
    if (!node || node.allowDelete === false) return

    const parentNode = findParentNode(treeData.value, node)
    if (parentNode && parentNode.children) {
      const index = parentNode.children.findIndex(child => child.id === node.id)
      if (index > -1) {
        parentNode.children.splice(index, 1)
        setDirty()
      }
    }
  }

  /**
   * 更新节点
   */
  const updateNode = (updatedNode) => {
    const node = findNodeById(treeData.value, updatedNode.id)
    if (node) {
      Object.assign(node, updatedNode)
      setDirty()
    }
  }

  /**
   * 创建节点
   */
  const createNode = (nodeType) => {
    const baseNode = {
      id: generateId(),
      type: nodeType,
      children: []
    }

    switch (nodeType) {
      case 'variable':
        return {
          ...baseNode,
          variableName: '',
          variableLabel: '',
          dataType: 'String'
        }
      case 'condition':
        return {
          ...baseNode,
          operator: 'eq',
          value: ''
        }
      case 'action':
        return {
          ...baseNode,
          actionType: 'assignment',
          config: {}
        }
      default:
        return baseNode
    }
  }

  /**
   * 解析决策树数据
   */
  const parseDecisionTreeData = (data) => {
    // 解析备注
    remarkContent.value = data.remark || ''

    // 解析属性
    treeProperties.value = parseTreeProperties(data)

    // 解析库引用
    libraries.value = {
      variables: data.variableLibraries || [],
      constants: data.constantLibraries || [],
      actions: data.actionLibraries || [],
      parameters: data.parameterLibraries || []
    }

    // 解析树结构
    treeData.value = parseTreeNode(data.variableTreeNode || data.rootNode)
  }

  /**
   * 解析树节点
   */
  const parseTreeNode = (nodeData) => {
    if (!nodeData) return null

    const node = {
      id: generateId(),
      type: getNodeType(nodeData),
      children: []
    }

    // 解析节点特定属性
    switch (node.type) {
      case 'variable':
        node.variableName = nodeData.left?.variableName || ''
        node.variableLabel = nodeData.left?.variableLabel || ''
        node.dataType = nodeData.left?.dataType || 'String'
        break
      case 'condition':
        node.operator = nodeData.op || 'eq'
        node.value = nodeData.value || ''
        break
      case 'action':
        node.actionType = nodeData.actionType || 'assignment'
        node.config = nodeData.config || {}
        break
    }

    // 递归解析子节点
    const childrenNodes = [
      ...(nodeData.conditionTreeNodes || []),
      ...(nodeData.variableTreeNodes || []),
      ...(nodeData.actionTreeNodes || [])
    ]

    node.children = childrenNodes.map(childData => parseTreeNode(childData))

    return node
  }

  /**
   * 获取节点类型
   */
  const getNodeType = (nodeData) => {
    if (nodeData.nodeType) return nodeData.nodeType
    if (nodeData.left) return 'variable'
    if (nodeData.op) return 'condition'
    if (nodeData.actionType) return 'action'
    return 'variable'
  }

  /**
   * 解析树属性
   */
  const parseTreeProperties = (data) => {
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

    // 其他属性...

    return properties
  }

  /**
   * 查找父节点
   */
  const findParentNode = (root, targetNode) => {
    if (!root || !root.children) return null

    for (const child of root.children) {
      if (child.id === targetNode.id) {
        return root
      }
      
      const parent = findParentNode(child, targetNode)
      if (parent) return parent
    }

    return null
  }

  /**
   * 根据ID查找节点
   */
  const findNodeById = (root, nodeId) => {
    if (!root) return null
    if (root.id === nodeId) return root

    if (root.children) {
      for (const child of root.children) {
        const found = findNodeById(child, nodeId)
        if (found) return found
      }
    }

    return null
  }

  /**
   * 统计节点数量
   */
  const countNodes = (node) => {
    if (!node) return 0
    
    let count = 1
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + countNodes(child), 0)
    }
    
    return count
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
    treeData,
    treeProperties,
    remarkContent,
    selectedNode,
    libraries,
    isDirty,
    loading,
    rootNode,
    nodeCount,
    loadDecisionTree,
    saveDecisionTree,
    addNode,
    deleteNode,
    updateNode,
    setDirty
  }
}
```

### 6. 树形布局引擎 (useTreeLayout.js)

```javascript
/**
 * 树形布局组合式API
 */
import { ref, computed } from 'vue'

export function useTreeLayout() {
  // 响应式数据
  const layoutData = ref(null)
  const nodePositions = ref(new Map())
  const connections = ref([])

  // 计算属性
  const flatNodes = computed(() => {
    if (!layoutData.value) return []
    return flattenTree(layoutData.value)
  })

  /**
   * 计算布局
   */
  const calculateLayout = (treeData) => {
    if (!treeData) return

    layoutData.value = treeData
    
    // 计算节点位置
    const positions = new Map()
    const connectionLines = []
    
    calculateNodePositions(treeData, 0, 0, positions, connectionLines)
    
    nodePositions.value = positions
    connections.value = connectionLines
  }

  /**
   * 计算节点位置
   */
  const calculateNodePositions = (node, level, index, positions, connections) => {
    const nodeWidth = 150
    const nodeHeight = 80
    const levelHeight = 120
    const nodeSpacing = 180

    // 计算当前节点位置
    const x = 100 + index * nodeSpacing
    const y = 100 + level * levelHeight

    positions.set(node.id, { x, y })

    // 递归计算子节点位置
    if (node.children && node.children.length > 0) {
      let childIndex = 0
      
      node.children.forEach(child => {
        calculateNodePositions(child, level + 1, childIndex, positions, connections)
        
        // 创建连接线
        const childPos = positions.get(child.id)
        if (childPos) {
          connections.push({
            id: `${node.id}-${child.id}`,
            path: createConnectionPath({ x, y }, childPos)
          })
        }
        
        childIndex++
      })
    }
  }

  /**
   * 创建连接路径
   */
  const createConnectionPath = (start, end) => {
    const midY = (start.y + end.y) / 2
    
    return `M ${start.x} ${start.y + 40} 
            L ${start.x} ${midY}
            L ${end.x} ${midY}
            L ${end.x} ${end.y - 40}`
  }

  /**
   * 扁平化树结构
   */
  const flattenTree = (node) => {
    const result = [node]
    
    if (node.children) {
      node.children.forEach(child => {
        result.push(...flattenTree(child))
      })
    }
    
    return result
  }

  /**
   * 获取节点位置
   */
  const getNodePosition = (node) => {
    return nodePositions.value.get(node.id) || { x: 0, y: 0 }
  }

  return {
    flatNodes,
    connections,
    calculateLayout,
    getNodePosition
  }
}
```

## 数据结构定义

### 决策树数据结构
```javascript
const DecisionTreeData = {
  id: 'string',                  // 节点ID
  type: 'variable|condition|action', // 节点类型
  children: [],                  // 子节点列表
  
  // 变量节点特有属性
  variableName: 'string',        // 变量名
  variableLabel: 'string',       // 变量标签
  dataType: 'string',            // 数据类型
  
  // 条件节点特有属性
  operator: 'string',            // 操作符
  value: 'any',                  // 比较值
  
  // 动作节点特有属性
  actionType: 'string',          // 动作类型
  config: {}                     // 动作配置
}
```

## API接口定义

```javascript
/**
 * 决策树编辑器API
 */
import request from '@/utils/request'

export const decisionTreeApi = {
  /**
   * 加载决策树
   */
  loadDecisionTree(file, version) {
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
   * 保存决策树
   */
  saveDecisionTree(data) {
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
// router/modules/decisionTree.js
export default {
  path: '/decision-tree-editor',
  name: 'DecisionTreeEditor',
  component: () => import('@/views/decisionTree/index.vue'),
  meta: {
    title: '决策树编辑器',
    icon: 'tree',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 节点的增删改操作
- [ ] 树形结构的正确显示
- [ ] 节点连线的正确绘制
- [ ] 右键菜单功能
- [ ] 保存和加载功能

### 2. 界面测试
- [ ] 树形布局正确
- [ ] 节点样式正确
- [ ] 交互操作流畅
- [ ] 响应式适配

### 3. 性能测试
- [ ] 大型决策树性能
- [ ] 布局计算效率
- [ ] 渲染性能

## 注意事项

### 1. 技术要点
- 实现自动布局算法
- 使用SVG绘制连接线
- 支持节点的拖拽移动
- 优化大型树的渲染性能

### 2. 用户体验
- 提供直观的可视化界面
- 支持快捷键操作
- 实现撤销/重做功能
- 优化编辑流程

---

**预计完成时间**: 28小时  
**测试时间**: 7小时  
**文档更新**: 2小时  
**总计**: 37小时 