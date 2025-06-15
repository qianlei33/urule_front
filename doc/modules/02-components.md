# 公共组件库迁移计划

## 模块概述

公共组件库包含了项目中所有可复用的UI组件，这些组件在多个功能模块中被使用。需要将React组件转换为Vue 3组件，并适配Element Plus的设计风格。

## 组件清单

根据老项目分析，需要迁移的公共组件包括：

1. **Dialog** - 对话框组件
2. **Tree** - 树形控件组件
3. **Grid** - 数据表格组件
4. **Splitter** - 分割面板组件
5. **Menu** - 菜单组件
6. **Loading** - 加载遮罩组件
7. **FrameTab** - 框架标签页组件

## 组件目录结构

```
src/components/
├── Dialog/
│   ├── index.vue          # 对话框组件
│   └── README.md          # 组件文档
├── Tree/
│   ├── index.vue          # 树组件
│   ├── TreeNode.vue       # 树节点组件
│   └── README.md
├── Grid/
│   ├── index.vue          # 表格组件
│   ├── GridColumn.vue     # 表格列组件
│   └── README.md
├── Splitter/
│   ├── index.vue          # 分割器组件
│   └── README.md
├── Menu/
│   ├── index.vue          # 菜单组件
│   ├── MenuItem.vue       # 菜单项组件
│   └── README.md
├── Loading/
│   ├── index.vue          # 加载组件
│   └── README.md
├── FrameTab/
│   ├── index.vue          # 标签页组件
│   └── README.md
└── index.js               # 统一导出
```

## 详细设计

### 1. Dialog 对话框组件

基于Element Plus的el-dialog进行二次封装，提供统一的对话框样式和行为。

```vue
<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :close-on-click-modal="closeOnClickModal"
    :close-on-press-escape="closeOnPressEscape"
    :show-close="showClose"
    :before-close="handleClose"
    :custom-class="customClass"
    @open="handleOpen"
    @opened="handleOpened"
    @close="handleClose"
    @closed="handleClosed"
  >
    <!-- 对话框内容 -->
    <slot></slot>
    
    <!-- 对话框底部 -->
    <template #footer v-if="showFooter">
      <slot name="footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button type="primary" @click="handleConfirm">{{ confirmText }}</el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: {
    type: String,
    default: '提示'
  },
  width: {
    type: String,
    default: '50%'
  },
  showFooter: {
    type: Boolean,
    default: true
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  closeOnClickModal: {
    type: Boolean,
    default: false
  },
  closeOnPressEscape: {
    type: Boolean,
    default: true
  },
  showClose: {
    type: Boolean,
    default: true
  },
  customClass: String,
  beforeClose: Function
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'open', 'opened', 'close', 'closed'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  visible.value = false
}

const handleClose = (done) => {
  if (props.beforeClose) {
    props.beforeClose(done)
  } else {
    visible.value = false
  }
}

const handleOpen = () => emit('open')
const handleOpened = () => emit('opened')
const handleClosed = () => emit('closed')
</script>

<style scoped>
/* 自定义样式 */
</style>
```

### 2. Tree 树形控件组件

扩展Element Plus的el-tree组件，添加自定义功能。

```vue
<template>
  <div class="custom-tree">
    <!-- 搜索框 -->
    <el-input
      v-if="showSearch"
      v-model="filterText"
      placeholder="请输入关键字进行过滤"
      class="tree-search"
    />
    
    <!-- 树组件 -->
    <el-tree
      ref="treeRef"
      :data="data"
      :props="treeProps"
      :node-key="nodeKey"
      :default-expand-all="defaultExpandAll"
      :default-expanded-keys="defaultExpandedKeys"
      :show-checkbox="showCheckbox"
      :check-strictly="checkStrictly"
      :default-checked-keys="defaultCheckedKeys"
      :filter-node-method="filterNode"
      :draggable="draggable"
      :allow-drop="allowDrop"
      :allow-drag="allowDrag"
      :lazy="lazy"
      :load="loadNode"
      highlight-current
      @node-click="handleNodeClick"
      @node-contextmenu="handleNodeContextmenu"
      @check="handleCheck"
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
      @node-drag-start="handleDragStart"
      @node-drag-enter="handleDragEnter"
      @node-drag-leave="handleDragLeave"
      @node-drag-over="handleDragOver"
      @node-drag-end="handleDragEnd"
      @node-drop="handleDrop"
    >
      <template #default="{ node, data }">
        <span class="custom-tree-node">
          <span v-if="showIcon" class="node-icon">
            <el-icon v-if="data.icon">
              <component :is="data.icon" />
            </el-icon>
            <el-icon v-else-if="data.children && data.children.length">
              <Folder />
            </el-icon>
            <el-icon v-else>
              <Document />
            </el-icon>
          </span>
          <span class="node-label">{{ node.label }}</span>
          <span v-if="showNodeOps" class="node-operations">
            <slot name="node-ops" :node="node" :data="data"></slot>
          </span>
        </span>
      </template>
    </el-tree>
    
    <!-- 右键菜单 -->
    <div
      v-show="contextMenuVisible"
      :style="contextMenuStyle"
      class="tree-context-menu"
    >
      <slot name="context-menu" :node="currentNode" :data="currentNodeData">
        <div class="context-menu-item" @click="handleMenuAction('edit')">编辑</div>
        <div class="context-menu-item" @click="handleMenuAction('delete')">删除</div>
        <div class="context-menu-item" @click="handleMenuAction('add')">新增子节点</div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { Document, Folder } from '@element-plus/icons-vue'

const props = defineProps({
  data: Array,
  nodeKey: {
    type: String,
    default: 'id'
  },
  props: {
    type: Object,
    default: () => ({
      label: 'label',
      children: 'children'
    })
  },
  showSearch: {
    type: Boolean,
    default: false
  },
  showCheckbox: {
    type: Boolean,
    default: false
  },
  showIcon: {
    type: Boolean,
    default: true
  },
  showNodeOps: {
    type: Boolean,
    default: false
  },
  draggable: {
    type: Boolean,
    default: false
  },
  lazy: {
    type: Boolean,
    default: false
  },
  loadNode: Function,
  allowDrop: Function,
  allowDrag: Function,
  defaultExpandAll: Boolean,
  defaultExpandedKeys: Array,
  defaultCheckedKeys: Array,
  checkStrictly: Boolean
})

const emit = defineEmits([
  'node-click',
  'node-contextmenu',
  'check',
  'node-expand',
  'node-collapse',
  'node-drag-start',
  'node-drag-enter',
  'node-drag-leave',
  'node-drag-over',
  'node-drag-end',
  'node-drop',
  'menu-action'
])

const treeRef = ref()
const filterText = ref('')
const contextMenuVisible = ref(false)
const contextMenuStyle = ref({})
const currentNode = ref(null)
const currentNodeData = ref(null)

// 监听过滤文本
watch(filterText, (val) => {
  treeRef.value.filter(val)
})

// 过滤节点
const filterNode = (value, data) => {
  if (!value) return true
  const label = data[props.props.label || 'label']
  return label.includes(value)
}

// 节点点击
const handleNodeClick = (data, node, component) => {
  emit('node-click', data, node, component)
}

// 右键菜单
const handleNodeContextmenu = (event, data, node, component) => {
  event.preventDefault()
  currentNode.value = node
  currentNodeData.value = data
  
  contextMenuStyle.value = {
    left: event.clientX + 'px',
    top: event.clientY + 'px'
  }
  contextMenuVisible.value = true
  
  // 点击其他地方关闭菜单
  document.addEventListener('click', closeContextMenu)
  
  emit('node-contextmenu', event, data, node, component)
}

// 关闭右键菜单
const closeContextMenu = () => {
  contextMenuVisible.value = false
  document.removeEventListener('click', closeContextMenu)
}

// 处理菜单操作
const handleMenuAction = (action) => {
  emit('menu-action', action, currentNodeData.value, currentNode.value)
  closeContextMenu()
}

// 其他事件处理...
const handleCheck = (data, checked) => emit('check', data, checked)
const handleNodeExpand = (data, node, component) => emit('node-expand', data, node, component)
const handleNodeCollapse = (data, node, component) => emit('node-collapse', data, node, component)
const handleDragStart = (node, event) => emit('node-drag-start', node, event)
const handleDragEnter = (draggingNode, dropNode, event) => emit('node-drag-enter', draggingNode, dropNode, event)
const handleDragLeave = (draggingNode, dropNode, event) => emit('node-drag-leave', draggingNode, dropNode, event)
const handleDragOver = (draggingNode, dropNode, event) => emit('node-drag-over', draggingNode, dropNode, event)
const handleDragEnd = (draggingNode, dropNode, dropType, event) => emit('node-drag-end', draggingNode, dropNode, dropType, event)
const handleDrop = (draggingNode, dropNode, dropType, event) => emit('node-drop', draggingNode, dropNode, dropType, event)

// 暴露方法
defineExpose({
  filter: (val) => treeRef.value.filter(val),
  updateKeyChildren: (key, data) => treeRef.value.updateKeyChildren(key, data),
  getCheckedNodes: () => treeRef.value.getCheckedNodes(),
  setCheckedNodes: (nodes) => treeRef.value.setCheckedNodes(nodes),
  getCheckedKeys: () => treeRef.value.getCheckedKeys(),
  setCheckedKeys: (keys) => treeRef.value.setCheckedKeys(keys),
  setCurrentKey: (key) => treeRef.value.setCurrentKey(key),
  getCurrentNode: () => treeRef.value.getCurrentNode(),
  expandAll: () => {
    const allNodes = treeRef.value.store.nodesMap
    for (let key in allNodes) {
      allNodes[key].expanded = true
    }
  },
  collapseAll: () => {
    const allNodes = treeRef.value.store.nodesMap
    for (let key in allNodes) {
      if (allNodes[key].level !== 1) {
        allNodes[key].expanded = false
      }
    }
  }
})
</script>

<style scoped>
.custom-tree {
  height: 100%;
  overflow: auto;
}

.tree-search {
  margin-bottom: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-right: 8px;
}

.node-icon {
  margin-right: 5px;
}

.node-operations {
  margin-left: auto;
}

.tree-context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 5px 0;
  z-index: 3000;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.context-menu-item {
  padding: 5px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
}

.context-menu-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}
</style>
```

### 3. Grid 数据表格组件

基于Element Plus的el-table进行封装，提供更便捷的表格功能。

```vue
<template>
  <div class="custom-grid">
    <!-- 工具栏 -->
    <div v-if="showToolbar" class="grid-toolbar">
      <slot name="toolbar"></slot>
    </div>
    
    <!-- 表格 -->
    <el-table
      ref="tableRef"
      :data="tableData"
      :height="height"
      :max-height="maxHeight"
      :stripe="stripe"
      :border="border"
      :fit="fit"
      :show-header="showHeader"
      :highlight-current-row="highlightCurrentRow"
      :row-key="rowKey"
      :empty-text="emptyText"
      :default-expand-all="defaultExpandAll"
      :expand-row-keys="expandRowKeys"
      :default-sort="defaultSort"
      :show-summary="showSummary"
      :sum-text="sumText"
      :summary-method="summaryMethod"
      :span-method="spanMethod"
      :select-on-indeterminate="selectOnIndeterminate"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      @current-change="handleCurrentChange"
      @header-click="handleHeaderClick"
      @header-contextmenu="handleHeaderContextmenu"
      @row-click="handleRowClick"
      @row-contextmenu="handleRowContextmenu"
      @row-dblclick="handleRowDblclick"
      @cell-click="handleCellClick"
      @cell-dblclick="handleCellDblclick"
      @cell-mouse-enter="handleCellMouseEnter"
      @cell-mouse-leave="handleCellMouseLeave"
      @sort-change="handleSortChange"
      @filter-change="handleFilterChange"
      @expand-change="handleExpandChange"
    >
      <!-- 选择列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        :selectable="selectable"
        :reserve-selection="reserveSelection"
        align="center"
      />
      
      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        width="60"
        label="序号"
        align="center"
        :index="indexMethod"
      />
      
      <!-- 展开列 -->
      <el-table-column
        v-if="showExpand"
        type="expand"
      >
        <template #default="props">
          <slot name="expand" :row="props.row" :index="props.$index"></slot>
        </template>
      </el-table-column>
      
      <!-- 数据列 -->
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :fixed="column.fixed"
        :sortable="column.sortable"
        :sort-method="column.sortMethod"
        :sort-by="column.sortBy"
        :sort-orders="column.sortOrders"
        :resizable="column.resizable !== false"
        :formatter="column.formatter"
        :show-overflow-tooltip="column.showOverflowTooltip !== false"
        :align="column.align || 'left'"
        :header-align="column.headerAlign || column.align || 'left'"
        :class-name="column.className"
        :label-class-name="column.labelClassName"
        :filters="column.filters"
        :filter-placement="column.filterPlacement"
        :filter-multiple="column.filterMultiple"
        :filter-method="column.filterMethod"
        :filtered-value="column.filteredValue"
      >
        <template v-if="column.headerSlot" #header>
          <slot :name="column.headerSlot" :column="column"></slot>
        </template>
        
        <template #default="scope">
          <slot
            v-if="column.slot"
            :name="column.slot"
            :row="scope.row"
            :column="scope.column"
            :index="scope.$index"
          ></slot>
          <span v-else>{{ scope.row[column.prop] }}</span>
        </template>
      </el-table-column>
      
      <!-- 操作列 -->
      <el-table-column
        v-if="showOperation"
        label="操作"
        :width="operationWidth"
        :fixed="operationFixed"
        align="center"
      >
        <template #default="scope">
          <slot name="operation" :row="scope.row" :index="scope.$index">
            <el-button
              v-for="btn in operationButtons"
              :key="btn.key"
              :type="btn.type || 'primary'"
              :size="btn.size || 'small'"
              :disabled="typeof btn.disabled === 'function' ? btn.disabled(scope.row) : btn.disabled"
              @click="handleOperation(btn.key, scope.row, scope.$index)"
            >
              {{ btn.label }}
            </el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <el-pagination
      v-if="showPagination"
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :page-sizes="pageSizes"
      :layout="paginationLayout"
      :total="total"
      :background="paginationBackground"
      class="grid-pagination"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  // 数据相关
  data: Array,
  columns: {
    type: Array,
    required: true
  },
  loading: Boolean,
  
  // 表格配置
  height: [String, Number],
  maxHeight: [String, Number],
  stripe: {
    type: Boolean,
    default: true
  },
  border: Boolean,
  fit: {
    type: Boolean,
    default: true
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  highlightCurrentRow: Boolean,
  rowKey: [String, Function],
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  
  // 功能列
  showSelection: Boolean,
  showIndex: Boolean,
  showExpand: Boolean,
  showOperation: Boolean,
  
  // 选择相关
  selectable: Function,
  reserveSelection: Boolean,
  
  // 序号相关
  indexMethod: Function,
  
  // 操作列
  operationButtons: Array,
  operationWidth: {
    type: [String, Number],
    default: 150
  },
  operationFixed: {
    type: [String, Boolean],
    default: 'right'
  },
  
  // 展开相关
  defaultExpandAll: Boolean,
  expandRowKeys: Array,
  
  // 排序相关
  defaultSort: Object,
  
  // 合计相关
  showSummary: Boolean,
  sumText: String,
  summaryMethod: Function,
  spanMethod: Function,
  
  // 其他
  selectOnIndeterminate: {
    type: Boolean,
    default: true
  },
  showToolbar: Boolean,
  
  // 分页相关
  showPagination: Boolean,
  currentPage: Number,
  pageSize: Number,
  total: Number,
  pageSizes: {
    type: Array,
    default: () => [10, 20, 30, 50, 100]
  },
  paginationLayout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  paginationBackground: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'selection-change',
  'current-change',
  'header-click',
  'header-contextmenu',
  'row-click',
  'row-contextmenu',
  'row-dblclick',
  'cell-click',
  'cell-dblclick',
  'cell-mouse-enter',
  'cell-mouse-leave',
  'sort-change',
  'filter-change',
  'expand-change',
  'operation-click',
  'page-change',
  'size-change',
  'update:currentPage',
  'update:pageSize'
])

const tableRef = ref()
const tableData = computed(() => props.data || [])

// 处理操作按钮点击
const handleOperation = (key, row, index) => {
  emit('operation-click', key, row, index)
}

// 处理分页
const handlePageChange = (page) => {
  emit('update:currentPage', page)
  emit('page-change', page)
}

const handleSizeChange = (size) => {
  emit('update:pageSize', size)
  emit('size-change', size)
}

// 转发所有事件
const handleSelectionChange = (selection) => emit('selection-change', selection)
const handleCurrentChange = (currentRow, oldCurrentRow) => emit('current-change', currentRow, oldCurrentRow)
const handleHeaderClick = (column, event) => emit('header-click', column, event)
const handleHeaderContextmenu = (column, event) => emit('header-contextmenu', column, event)
const handleRowClick = (row, column, event) => emit('row-click', row, column, event)
const handleRowContextmenu = (row, column, event) => emit('row-contextmenu', row, column, event)
const handleRowDblclick = (row, column, event) => emit('row-dblclick', row, column, event)
const handleCellClick = (row, column, cell, event) => emit('cell-click', row, column, cell, event)
const handleCellDblclick = (row, column, cell, event) => emit('cell-dblclick', row, column, cell, event)
const handleCellMouseEnter = (row, column, cell, event) => emit('cell-mouse-enter', row, column, cell, event)
const handleCellMouseLeave = (row, column, cell, event) => emit('cell-mouse-leave', row, column, cell, event)
const handleSortChange = ({ column, prop, order }) => emit('sort-change', { column, prop, order })
const handleFilterChange = (filters) => emit('filter-change', filters)
const handleExpandChange = (row, expandedRows) => emit('expand-change', row, expandedRows)

// 暴露方法
defineExpose({
  clearSelection: () => tableRef.value.clearSelection(),
  toggleRowSelection: (row, selected) => tableRef.value.toggleRowSelection(row, selected),
  toggleAllSelection: () => tableRef.value.toggleAllSelection(),
  toggleRowExpansion: (row, expanded) => tableRef.value.toggleRowExpansion(row, expanded),
  setCurrentRow: (row) => tableRef.value.setCurrentRow(row),
  clearSort: () => tableRef.value.clearSort(),
  clearFilter: (columnKey) => tableRef.value.clearFilter(columnKey),
  doLayout: () => tableRef.value.doLayout(),
  sort: (prop, order) => tableRef.value.sort(prop, order)
})
</script>

<style scoped>
.custom-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-toolbar {
  padding: 10px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-bottom: none;
}

.el-table {
  flex: 1;
}

.grid-pagination {
  padding: 10px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-top: none;
}
</style>
```

### 4. Splitter 分割面板组件

实现可拖拽调整大小的分割面板。

```vue
<template>
  <div class="splitter-container" :class="containerClass">
    <div 
      class="splitter-pane" 
      :style="pane1Style"
    >
      <slot name="pane1"></slot>
    </div>
    
    <div 
      class="splitter-handle" 
      :class="handleClass"
      @mousedown="handleMouseDown"
    >
      <div class="splitter-handle-icon"></div>
    </div>
    
    <div 
      class="splitter-pane" 
      :style="pane2Style"
    >
      <slot name="pane2"></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  orientation: {
    type: String,
    default: 'horizontal',
    validator: (value) => ['horizontal', 'vertical'].includes(value)
  },
  initialSize: {
    type: [String, Number],
    default: '50%'
  },
  minSize: {
    type: Number,
    default: 100
  },
  maxSize: {
    type: Number,
    default: Infinity
  },
  handleWidth: {
    type: Number,
    default: 4
  }
})

const emit = defineEmits(['resize'])

const containerEl = ref(null)
const size = ref(props.initialSize)
const isDragging = ref(false)

const isHorizontal = computed(() => props.orientation === 'horizontal')

const containerClass = computed(() => ({
  'splitter-horizontal': isHorizontal.value,
  'splitter-vertical': !isHorizontal.value,
  'splitter-dragging': isDragging.value
}))

const handleClass = computed(() => ({
  'splitter-handle-horizontal': isHorizontal.value,
  'splitter-handle-vertical': !isHorizontal.value
}))

const pane1Style = computed(() => {
  const sizeValue = typeof size.value === 'number' ? `${size.value}px` : size.value
  
  if (isHorizontal.value) {
    return {
      width: sizeValue,
      height: '100%'
    }
  } else {
    return {
      width: '100%',
      height: sizeValue
    }
  }
})

const pane2Style = computed(() => {
  const handleSize = `${props.handleWidth}px`
  
  if (isHorizontal.value) {
    return {
      width: `calc(100% - ${size.value} - ${handleSize})`,
      height: '100%'
    }
  } else {
    return {
      width: '100%',
      height: `calc(100% - ${size.value} - ${handleSize})`
    }
  }
})

const handleMouseDown = (e) => {
  e.preventDefault()
  isDragging.value = true
  
  const startPos = isHorizontal.value ? e.clientX : e.clientY
  const startSize = typeof size.value === 'string' 
    ? (parseFloat(size.value) / 100) * getContainerSize()
    : size.value
  
  const handleMouseMove = (e) => {
    const currentPos = isHorizontal.value ? e.clientX : e.clientY
    const diff = currentPos - startPos
    let newSize = startSize + diff
    
    // 限制大小
    newSize = Math.max(props.minSize, Math.min(newSize, props.maxSize))
    
    // 限制在容器范围内
    const containerSize = getContainerSize()
    newSize = Math.min(newSize, containerSize - props.handleWidth - props.minSize)
    
    size.value = newSize
    emit('resize', newSize)
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
  
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const getContainerSize = () => {
  if (!containerEl.value) return 0
  return isHorizontal.value 
    ? containerEl.value.offsetWidth 
    : containerEl.value.offsetHeight
}

onMounted(() => {
  containerEl.value = document.querySelector('.splitter-container')
})
</script>

<style scoped>
.splitter-container {
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
}

.splitter-horizontal {
  flex-direction: row;
}

.splitter-vertical {
  flex-direction: column;
}

.splitter-pane {
  overflow: auto;
}

.splitter-handle {
  background-color: #e0e0e0;
  position: relative;
  user-select: none;
  transition: background-color 0.2s;
}

.splitter-handle:hover {
  background-color: #bdbdbd;
}

.splitter-handle-horizontal {
  width: 4px;
  height: 100%;
  cursor: col-resize;
}

.splitter-handle-vertical {
  width: 100%;
  height: 4px;
  cursor: row-resize;
}

.splitter-handle-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.splitter-dragging .splitter-handle {
  background-color: #9e9e9e;
}

.splitter-dragging {
  user-select: none;
}
</style>
```

### 5. Loading 加载组件

全局加载遮罩组件。

```vue
<template>
  <transition name="loading-fade">
    <div v-if="visible" class="loading-mask" :style="maskStyle">
      <div class="loading-spinner">
        <el-icon class="is-loading" :size="size">
          <Loading />
        </el-icon>
        <p v-if="text" class="loading-text">{{ text }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: '加载中...'
  },
  background: {
    type: String,
    default: 'rgba(0, 0, 0, 0.7)'
  },
  size: {
    type: Number,
    default: 42
  },
  fullscreen: {
    type: Boolean,
    default: true
  }
})

const maskStyle = computed(() => ({
  background: props.background,
  position: props.fullscreen ? 'fixed' : 'absolute'
}))
</script>

<style scoped>
.loading-mask {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-spinner {
  text-align: center;
}

.loading-text {
  margin-top: 10px;
  color: #409eff;
  font-size: 14px;
}

.loading-fade-enter-active,
.loading-fade-leave-active {
  transition: opacity 0.3s;
}

.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}
</style>
```

### 6. 组件统一导出

```javascript
// src/components/index.js
import Dialog from './Dialog/index.vue'
import Tree from './Tree/index.vue'
import Grid from './Grid/index.vue'
import Splitter from './Splitter/index.vue'
import Menu from './Menu/index.vue'
import Loading from './Loading/index.vue'
import FrameTab from './FrameTab/index.vue'

// 统一导出组件
export {
  Dialog,
  Tree,
  Grid,
  Splitter,
  Menu,
  Loading,
  FrameTab
}

// 安装函数
export default {
  install(app) {
    app.component('CustomDialog', Dialog)
    app.component('CustomTree', Tree)
    app.component('CustomGrid', Grid)
    app.component('CustomSplitter', Splitter)
    app.component('CustomMenu', Menu)
    app.component('CustomLoading', Loading)
    app.component('CustomFrameTab', FrameTab)
  }
}
```

## 使用示例

```vue
<template>
  <div>
    <!-- 对话框示例 -->
    <custom-dialog
      v-model="dialogVisible"
      title="编辑信息"
      width="600px"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    >
      <el-form>
        <!-- 表单内容 -->
      </el-form>
    </custom-dialog>
    
    <!-- 树组件示例 -->
    <custom-tree
      :data="treeData"
      show-checkbox
      show-search
      @node-click="handleNodeClick"
      @check="handleCheck"
    />
    
    <!-- 表格组件示例 -->
    <custom-grid
      :data="tableData"
      :columns="columns"
      :loading="loading"
      show-selection
      show-index
      show-operation
      show-pagination
      v-model:current-page="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      @selection-change="handleSelectionChange"
      @operation-click="handleOperation"
    />
  </div>
</template>
```

## 测试要点

1. **Dialog组件**
   - 打开/关闭功能
   - 事件触发
   - 插槽内容显示

2. **Tree组件**
   - 数据展示
   - 节点操作
   - 拖拽功能
   - 右键菜单

3. **Grid组件**
   - 数据展示
   - 分页功能
   - 排序过滤
   - 行选择

4. **Splitter组件**
   - 拖拽调整大小
   - 最小/最大限制
   - 横向/纵向切换

5. **Loading组件**
   - 显示/隐藏
   - 全屏/局部遮罩

## 注意事项

1. 组件命名使用 `Custom` 前缀，避免与Element Plus组件冲突
2. 保持与老项目相似的API设计，降低迁移成本
3. 充分利用Vue 3的Composition API特性
4. 确保组件的可扩展性和可维护性

## 依赖关系

- 依赖：项目初始化模块
- 被依赖：所有功能模块

## 预计工时

- Dialog组件：2小时
- Tree组件：4小时
- Grid组件：4小时
- Splitter组件：3小时
- Menu组件：2小时
- Loading组件：1小时
- FrameTab组件：2小时
- 测试和优化：2小时

**总计：20小时** 