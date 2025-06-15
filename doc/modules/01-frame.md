# 主框架模块迁移计划

## 模块概述

主框架模块是整个应用的核心骨架，负责应用的整体布局、导航树、标签页管理、权限菜单等核心功能。这是用户进入系统后看到的主界面。

## 功能清单

1. **整体布局**
   - 左侧导航树区域
   - 右侧内容区域（标签页）
   - 可拖拽的分割条

2. **导航树功能**
   - 知识库文件树展示
   - 支持分类/集中展示切换
   - 项目过滤
   - 文件类型过滤
   - 文件搜索
   - 右键菜单操作
   - 拖拽排序

3. **标签页管理**
   - 多标签页支持
   - 标签页切换
   - 标签页关闭
   - 欢迎页面

4. **工具栏功能**
   - 展示方式切换（分类/集中）
   - 项目过滤下拉菜单
   - 文件类型过滤下拉菜单
   - 权限配置入口

## 组件结构

```
src/views/frame/
├── index.vue                 # 主框架入口组件
├── components/
│   ├── NavigationTree.vue   # 导航树组件
│   ├── Toolbar.vue          # 工具栏组件
│   ├── TabsContainer.vue    # 标签页容器组件
│   └── ComponentLoader.vue  # 动态组件加载器
├── composables/
│   ├── useTreeData.js       # 树数据管理
│   ├── useTabsManager.js    # 标签页管理
│   └── useFilter.js         # 过滤功能
└── stores/
    └── frame.js             # 框架状态管理
```

## 详细设计

### 1. 主框架布局 (index.vue)

```vue
<template>
  <el-container class="frame-container">
    <!-- 左侧导航区 -->
    <el-aside :width="asideWidth" class="frame-aside">
      <Toolbar 
        v-model:displayMode="displayMode"
        v-model:projectFilter="projectFilter"
        v-model:typeFilter="typeFilter"
        @search="handleSearch"
      />
      <NavigationTree 
        :display-mode="displayMode"
        :project-filter="projectFilter"
        :type-filter="typeFilter"
        :search-keyword="searchKeyword"
        @node-click="handleNodeClick"
      />
    </el-aside>
    
    <!-- 分割条 -->
    <div 
      class="frame-splitter" 
      @mousedown="handleSplitterMouseDown"
    ></div>
    
    <!-- 右侧内容区 -->
    <el-main class="frame-main">
      <TabsContainer 
        :tabs="tabs"
        :active-tab="activeTab"
        @tab-change="handleTabChange"
        @tab-close="handleTabClose"
      />
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFrameStore } from '@/stores/frame'
import Toolbar from './components/Toolbar.vue'
import NavigationTree from './components/NavigationTree.vue'
import TabsContainer from './components/TabsContainer.vue'

const frameStore = useFrameStore()

// 布局相关
const asideWidth = ref('20%')
const displayMode = ref('classify') // classify | concentrate
const projectFilter = ref(null)
const typeFilter = ref('all')
const searchKeyword = ref('')

// 标签页相关
const tabs = computed(() => frameStore.tabs)
const activeTab = computed(() => frameStore.activeTab)

// 初始化
onMounted(() => {
  frameStore.loadTreeData()
})

// 事件处理
const handleNodeClick = (node) => {
  frameStore.openTab(node)
}

const handleTabChange = (tabId) => {
  frameStore.setActiveTab(tabId)
}

const handleTabClose = (tabId) => {
  frameStore.closeTab(tabId)
}

// 分割条拖拽
const handleSplitterMouseDown = (e) => {
  // 实现拖拽逻辑
}
</script>
```

### 2. 工具栏组件 (Toolbar.vue)

```vue
<template>
  <div class="toolbar">
    <!-- 展示方式 -->
    <el-dropdown @command="handleDisplayModeChange">
      <span class="toolbar-btn">
        <el-icon><Grid /></el-icon>
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item 
            command="classify"
            :icon="displayMode === 'classify' ? Check : null"
          >
            分类展示
          </el-dropdown-item>
          <el-dropdown-item 
            command="concentrate"
            :icon="displayMode === 'concentrate' ? Check : null"
          >
            集中展示
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 项目过滤 -->
    <el-dropdown @command="handleProjectFilterChange">
      <span class="toolbar-btn">
        <el-icon><List /></el-icon>
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="all">
            <el-icon v-if="!projectFilter"><Check /></el-icon>
            显示所有产品
          </el-dropdown-item>
          <el-dropdown-item 
            v-for="project in projects"
            :key="project"
            :command="project"
          >
            <el-icon v-if="projectFilter === project"><Check /></el-icon>
            {{ project }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 文件类型过滤 -->
    <el-dropdown @command="handleTypeFilterChange">
      <span class="toolbar-btn">
        <el-icon><Files /></el-icon>
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="all">
            <el-icon v-if="typeFilter === 'all'"><Check /></el-icon>
            <span class="filter-icon rf rf-all"></span> 显示所有文件
          </el-dropdown-item>
          <el-dropdown-item command="lib">
            <el-icon v-if="typeFilter === 'lib'"><Check /></el-icon>
            <span class="filter-icon rf rf-library"></span> 库文件
          </el-dropdown-item>
          <el-dropdown-item command="rule">
            <el-icon v-if="typeFilter === 'rule'"><Check /></el-icon>
            <span class="filter-icon rf rf-rule"></span> 决策集
          </el-dropdown-item>
          <!-- 其他类型... -->
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 权限配置 -->
    <el-dropdown>
      <span class="toolbar-btn">
        <el-icon><Lock /></el-icon>
        <el-icon><ArrowDown /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="openPermissionConfig">
            资源权限配置
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 搜索框 -->
    <div class="toolbar-search">
      <el-input
        v-model="searchText"
        placeholder="输入要查询的文件名..."
        size="small"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>
```

### 3. 导航树组件 (NavigationTree.vue)

```vue
<template>
  <div class="navigation-tree">
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      :expand-on-click-node="false"
      :default-expanded-keys="expandedKeys"
      :filter-node-method="filterNode"
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
            <component :is="getNodeIcon(data)" />
          </el-icon>
          <span>{{ node.label }}</span>
        </span>
      </template>
    </el-tree>

    <!-- 右键菜单 -->
    <el-dropdown
      ref="contextMenuRef"
      trigger="manual"
      :style="contextMenuStyle"
      @command="handleMenuCommand"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="open">打开</el-dropdown-item>
          <el-dropdown-item command="copy">复制</el-dropdown-item>
          <el-dropdown-item command="paste">粘贴</el-dropdown-item>
          <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useTreeData } from '../composables/useTreeData'

const props = defineProps({
  displayMode: String,
  projectFilter: String,
  typeFilter: String,
  searchKeyword: String
})

const emit = defineEmits(['node-click'])

const { treeData, loadTreeData, filterTreeData } = useTreeData()

// 树配置
const treeProps = {
  label: 'name',
  children: 'children'
}

// 监听过滤条件变化
watch(
  () => [props.displayMode, props.projectFilter, props.typeFilter, props.searchKeyword],
  () => {
    filterTreeData(props)
  }
)

// 节点点击
const handleNodeClick = (data) => {
  if (!data.folder) {
    emit('node-click', data)
  }
}

// 右键菜单
const handleContextMenu = (event, data, node) => {
  // 显示右键菜单
}

// 拖拽相关
const allowDrop = (draggingNode, dropNode, type) => {
  // 判断是否允许拖拽
}

const allowDrag = (draggingNode) => {
  // 判断节点是否可拖拽
}

const handleDragEnd = (draggingNode, dropNode, dropType) => {
  // 处理拖拽结束
}
</script>
```

### 4. 标签页容器组件 (TabsContainer.vue)

```vue
<template>
  <div class="tabs-container">
    <el-tabs
      v-model="activeTabName"
      type="card"
      closable
      @tab-click="handleTabClick"
      @tab-remove="handleTabRemove"
    >
      <el-tab-pane
        v-for="tab in tabs"
        :key="tab.id"
        :label="tab.name"
        :name="tab.id"
      >
        <component 
          :is="tab.component"
          v-bind="tab.props"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 欢迎页面 -->
    <div v-if="tabs.length === 0" class="welcome-page">
      <h1>欢迎使用 URule Console</h1>
      <p>请从左侧导航树选择要编辑的文件</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { defineAsyncComponent } from 'vue'

const props = defineProps({
  tabs: Array,
  activeTab: String
})

const emit = defineEmits(['tab-change', 'tab-close'])

// 动态加载组件
const componentMap = {
  'variable': defineAsyncComponent(() => import('@/views/variable/index.vue')),
  'constant': defineAsyncComponent(() => import('@/views/constant/index.vue')),
  'parameter': defineAsyncComponent(() => import('@/views/parameter/index.vue')),
  // 其他组件...
}

const activeTabName = computed({
  get: () => props.activeTab,
  set: (val) => emit('tab-change', val)
})

const handleTabClick = (tab) => {
  emit('tab-change', tab.props.name)
}

const handleTabRemove = (tabName) => {
  emit('tab-close', tabName)
}
</script>
```

### 5. 状态管理 (stores/frame.js)

```javascript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as frameAPI from '@/api/frame'

export const useFrameStore = defineStore('frame', () => {
  // 状态
  const treeData = ref([])
  const tabs = ref([])
  const activeTab = ref('')
  const projects = ref([])

  // 加载树数据
  const loadTreeData = async (classify = true, project = null, types = 'all', searchText = '') => {
    try {
      const data = await frameAPI.loadResourceTreeData({
        classify,
        project,
        types,
        searchText
      })
      treeData.value = data.repo || []
      projects.value = data.projects || []
    } catch (error) {
      console.error('加载树数据失败:', error)
    }
  }

  // 打开标签页
  const openTab = (node) => {
    const existTab = tabs.value.find(tab => tab.id === node.fullPath)
    
    if (existTab) {
      activeTab.value = existTab.id
      return
    }

    const newTab = {
      id: node.fullPath,
      name: node.name,
      component: getComponentByPath(node.path),
      props: {
        path: node.path,
        file: node.fullPath
      }
    }

    tabs.value.push(newTab)
    activeTab.value = newTab.id
  }

  // 关闭标签页
  const closeTab = (tabId) => {
    const index = tabs.value.findIndex(tab => tab.id === tabId)
    if (index > -1) {
      tabs.value.splice(index, 1)
      
      // 如果关闭的是当前标签页，切换到其他标签页
      if (activeTab.value === tabId && tabs.value.length > 0) {
        activeTab.value = tabs.value[Math.max(0, index - 1)].id
      }
    }
  }

  // 设置当前标签页
  const setActiveTab = (tabId) => {
    activeTab.value = tabId
  }

  // 根据路径获取组件类型
  const getComponentByPath = (path) => {
    if (path.includes('/variableeditor')) return 'variable'
    if (path.includes('/constanteditor')) return 'constant'
    if (path.includes('/parametereditor')) return 'parameter'
    // 其他组件映射...
    return 'default'
  }

  return {
    treeData,
    tabs,
    activeTab,
    projects,
    loadTreeData,
    openTab,
    closeTab,
    setActiveTab
  }
})
```

## API接口

```javascript
// src/api/frame.js
import request from '@/api'

/**
 * 加载资源树数据
 */
export function loadResourceTreeData(params) {
  return request({
    url: '/frame/loadResourceTreeData',
    method: 'get',
    params
  })
}

/**
 * 加载项目列表
 */
export function loadProjects() {
  return request({
    url: '/frame/loadProjects',
    method: 'get'
  })
}
```

## 样式设计

```scss
// 主框架样式
.frame-container {
  height: 100vh;
  
  .frame-aside {
    background: #f5f5f5;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
  }
  
  .frame-splitter {
    width: 4px;
    background: #e0e0e0;
    cursor: col-resize;
    
    &:hover {
      background: #bbb;
    }
  }
  
  .frame-main {
    padding: 0;
    background: #fff;
  }
}

// 工具栏样式
.toolbar {
  height: 40px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  .toolbar-btn {
    cursor: pointer;
    padding: 5px 8px;
    border-radius: 3px;
    
    &:hover {
      background: #e0e0e0;
    }
  }
  
  .toolbar-search {
    flex: 1;
    max-width: 300px;
    margin-left: auto;
  }
}

// 导航树样式
.navigation-tree {
  flex: 1;
  overflow: auto;
  padding: 10px;
  
  .tree-node {
    display: flex;
    align-items: center;
    gap: 5px;
    
    .node-icon {
      font-size: 16px;
    }
  }
}

// 标签页样式
.tabs-container {
  height: 100%;
  
  .el-tabs {
    height: 100%;
    
    .el-tabs__content {
      height: calc(100% - 40px);
      
      .el-tab-pane {
        height: 100%;
      }
    }
  }
  
  .welcome-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #666;
  }
}
```

## 测试要点

1. 导航树功能测试
   - 树节点展开/折叠
   - 节点点击打开标签页
   - 右键菜单功能
   - 拖拽排序功能

2. 过滤功能测试
   - 分类/集中展示切换
   - 项目过滤
   - 文件类型过滤
   - 搜索功能

3. 标签页管理测试
   - 标签页打开
   - 标签页切换
   - 标签页关闭
   - 多标签页管理

4. 布局测试
   - 分割条拖拽
   - 响应式布局

## 依赖关系

- 依赖：项目初始化模块
- 被依赖：所有功能模块

## 预计工时

- 主框架布局：3小时
- 工具栏组件：2小时
- 导航树组件：4小时
- 标签页管理：3小时
- 状态管理：2小时
- API对接：2小时
- 样式调整：2小时
- 测试调试：2小时

**总计：20小时** 