# 决策集编辑器模块迁移计划

## 模块概述

决策集编辑器是URule系统中的核心编辑器之一，提供向导式的规则编辑功能。用户可以通过可视化界面创建和编辑业务规则，包括条件设置、动作定义、规则属性配置等。

### 功能特性
- 可视化规则编辑
- 条件和动作的拖拽式构建
- 规则属性配置（优先级、生效日期等）
- 规则排序和组织
- 实时语法验证
- 规则导入导出

### 技术要求
- **预计工作量**: 25小时
- **优先级**: 高
- **依赖模块**: 公共组件库、变量管理、常量管理、动作管理
- **技术栈**: Vue 3 + Element Plus + 自定义规则编辑器

## 老项目分析

### 目录结构
```
src/editor/urule/
├── RuleFactory.js              # 规则工厂类
├── Rule.js                     # 单个规则类
├── LoopRule.js                 # 循环规则类
├── RuleProperty.js             # 规则属性类
├── ActionType.js               # 动作类型类
├── ConditionType.js            # 条件类型类
├── Join.js                     # 条件连接类
├── ruleset.css                 # 样式文件
└── 其他辅助类...
```

### 核心功能分析

#### 1. 规则工厂 (RuleFactory.js)
- **规则容器管理**: 管理多个规则的容器
- **工具栏功能**: 配置变量库、常量库、动作库、参数库
- **保存功能**: 支持保存和保存新版本
- **规则排序**: 支持拖拽排序规则

#### 2. 单个规则 (Rule.js)
- **规则头部**: 规则名称编辑、删除按钮
- **规则属性**: 优先级、生效日期、失效日期等
- **条件部分**: "如果"条件的可视化编辑
- **动作部分**: "那么"和"否则"动作的编辑

#### 3. 条件编辑
- **条件连接**: AND、OR逻辑连接
- **比较操作**: 等于、不等于、大于、小于等
- **值类型**: 变量值、常量值、参数值等

#### 4. 动作编辑
- **动作类型**: 赋值、方法调用、控制台输出等
- **参数设置**: 动作参数的配置
- **执行顺序**: 动作的执行顺序管理

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/rulesetEditor/
├── index.vue                   # 主编辑器页面
├── components/
│   ├── RulesetToolbar.vue     # 工具栏组件
│   ├── RuleContainer.vue      # 规则容器组件
│   ├── RuleItem.vue           # 单个规则组件
│   ├── RuleHeader.vue         # 规则头部组件
│   ├── RuleProperties.vue     # 规则属性组件
│   ├── ConditionEditor.vue    # 条件编辑器组件
│   ├── ActionEditor.vue       # 动作编辑器组件
│   ├── ConditionJoin.vue      # 条件连接组件
│   └── ActionItem.vue         # 动作项组件
├── composables/
│   ├── useRuleset.js          # 规则集管理逻辑
│   ├── useRule.js             # 单个规则逻辑
│   ├── useCondition.js        # 条件编辑逻辑
│   └── useAction.js           # 动作编辑逻辑
├── stores/
│   └── rulesetStore.js        # 规则集状态管理
└── utils/
    ├── ruleXmlBuilder.js      # XML构建工具
    └── ruleValidator.js       # 规则验证工具
```

### 2. 主编辑器页面 (index.vue)

```vue
<template>
  <div class="ruleset-editor">
    <!-- 工具栏 -->
    <RulesetToolbar
      @save="handleSave"
      @save-new-version="handleSaveNewVersion"
      @config-variable="handleConfigVariable"
      @config-constant="handleConfigConstant"
      @config-action="handleConfigAction"
      @config-parameter="handleConfigParameter"
    />

    <!-- 备注区域 -->
    <div class="remark-section">
      <el-input
        v-model="remarkContent"
        type="textarea"
        placeholder="请输入备注信息..."
        :rows="3"
        resize="vertical"
      />
    </div>

    <!-- 规则容器 -->
    <RuleContainer
      :rules="rules"
      @add-rule="handleAddRule"
      @update-rule="handleUpdateRule"
      @delete-rule="handleDeleteRule"
      @sort-rules="handleSortRules"
    />

    <!-- 配置对话框 -->
    <VariableConfigDialog
      v-model="variableDialogVisible"
      @confirm="handleVariableConfig"
    />
    
    <ConstantConfigDialog
      v-model="constantDialogVisible"
      @confirm="handleConstantConfig"
    />
    
    <ActionConfigDialog
      v-model="actionDialogVisible"
      @confirm="handleActionConfig"
    />
    
    <ParameterConfigDialog
      v-model="parameterDialogVisible"
      @confirm="handleParameterConfig"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import RulesetToolbar from './components/RulesetToolbar.vue'
import RuleContainer from './components/RuleContainer.vue'
import VariableConfigDialog from '@/components/dialog/VariableConfigDialog.vue'
import ConstantConfigDialog from '@/components/dialog/ConstantConfigDialog.vue'
import ActionConfigDialog from '@/components/dialog/ActionConfigDialog.vue'
import ParameterConfigDialog from '@/components/dialog/ParameterConfigDialog.vue'
import { useRuleset } from './composables/useRuleset'

/**
 * 决策集编辑器主页面
 */

// 路由参数
const route = useRoute()
const file = route.query.file
const version = route.query.version

// 组合式API
const {
  rules,
  remarkContent,
  isDirty,
  loadRuleset,
  saveRuleset,
  addRule,
  updateRule,
  deleteRule,
  sortRules
} = useRuleset()

// 响应式数据
const variableDialogVisible = ref(false)
const constantDialogVisible = ref(false)
const actionDialogVisible = ref(false)
const parameterDialogVisible = ref(false)

// 生命周期
onMounted(() => {
  if (file) {
    loadRuleset(file, version)
  }
  
  // 监听页面关闭事件
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

// 事件处理
const handleBeforeUnload = (event) => {
  if (isDirty.value) {
    event.preventDefault()
    event.returnValue = '您有未保存的更改，确定要离开吗？'
  }
}

const handleSave = async () => {
  try {
    await saveRuleset(false)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveNewVersion = async () => {
  try {
    await saveRuleset(true)
    ElMessage.success('保存新版本成功')
  } catch (error) {
    ElMessage.error('保存新版本失败')
  }
}

const handleAddRule = () => {
  addRule()
}

const handleUpdateRule = (ruleData) => {
  updateRule(ruleData)
}

const handleDeleteRule = (ruleId) => {
  deleteRule(ruleId)
}

const handleSortRules = (newOrder) => {
  sortRules(newOrder)
}

const handleConfigVariable = () => {
  variableDialogVisible.value = true
}

const handleConfigConstant = () => {
  constantDialogVisible.value = true
}

const handleConfigAction = () => {
  actionDialogVisible.value = true
}

const handleConfigParameter = () => {
  parameterDialogVisible.value = true
}

const handleVariableConfig = (selectedVariables) => {
  // 处理变量库配置
  variableDialogVisible.value = false
}

const handleConstantConfig = (selectedConstants) => {
  // 处理常量库配置
  constantDialogVisible.value = false
}

const handleActionConfig = (selectedActions) => {
  // 处理动作库配置
  actionDialogVisible.value = false
}

const handleParameterConfig = (selectedParameters) => {
  // 处理参数库配置
  parameterDialogVisible.value = false
}
</script>

<style scoped>
.ruleset-editor {
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
</style>
```

### 3. 规则容器组件 (RuleContainer.vue)

```vue
<template>
  <div class="rule-container">
    <div class="container-header">
      <el-button type="primary" @click="handleAddRule">
        <el-icon><Plus /></el-icon>
        添加规则
      </el-button>
    </div>

    <draggable
      v-model="ruleList"
      class="rule-list"
      item-key="id"
      @end="handleSortEnd"
    >
      <template #item="{ element: rule }">
        <RuleItem
          :key="rule.id"
          :rule="rule"
          @update="handleUpdateRule"
          @delete="handleDeleteRule"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import RuleItem from './RuleItem.vue'

/**
 * 规则容器组件
 */

// Props
const props = defineProps({
  rules: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['add-rule', 'update-rule', 'delete-rule', 'sort-rules'])

// 响应式数据
const ruleList = computed({
  get: () => props.rules,
  set: (value) => emit('sort-rules', value)
})

// 事件处理
const handleAddRule = () => {
  emit('add-rule')
}

const handleUpdateRule = (ruleData) => {
  emit('update-rule', ruleData)
}

const handleDeleteRule = (ruleId) => {
  emit('delete-rule', ruleId)
}

const handleSortEnd = () => {
  // 拖拽排序完成
}
</script>

<style scoped>
.rule-container {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}

.container-header {
  margin-bottom: 10px;
}

.rule-list {
  min-height: 200px;
}
</style>
```

### 4. 单个规则组件 (RuleItem.vue)

```vue
<template>
  <div class="rule-item">
    <el-card class="rule-card" shadow="hover">
      <!-- 规则头部 -->
      <RuleHeader
        :rule="rule"
        @update-name="handleUpdateName"
        @delete="handleDelete"
      />

      <!-- 规则属性 -->
      <RuleProperties
        :properties="rule.properties"
        @add-property="handleAddProperty"
        @update-property="handleUpdateProperty"
        @delete-property="handleDeleteProperty"
      />

      <!-- 条件部分 -->
      <div class="rule-section">
        <div class="section-title">如果</div>
        <ConditionEditor
          :condition="rule.condition"
          @update="handleUpdateCondition"
        />
      </div>

      <!-- 动作部分 -->
      <div class="rule-section">
        <div class="section-title">那么</div>
        <ActionEditor
          :actions="rule.actions"
          @add="handleAddAction"
          @update="handleUpdateAction"
          @delete="handleDeleteAction"
        />
      </div>

      <!-- 否则动作部分 -->
      <div class="rule-section" v-if="rule.elseActions && rule.elseActions.length > 0">
        <div class="section-title">否则</div>
        <ActionEditor
          :actions="rule.elseActions"
          @add="handleAddElseAction"
          @update="handleUpdateElseAction"
          @delete="handleDeleteElseAction"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import RuleHeader from './RuleHeader.vue'
import RuleProperties from './RuleProperties.vue'
import ConditionEditor from './ConditionEditor.vue'
import ActionEditor from './ActionEditor.vue'

/**
 * 单个规则组件
 */

// Props
const props = defineProps({
  rule: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update', 'delete'])

// 事件处理
const handleUpdateName = (name) => {
  emit('update', { ...props.rule, name })
}

const handleDelete = () => {
  emit('delete', props.rule.id)
}

const handleAddProperty = (property) => {
  const properties = [...(props.rule.properties || []), property]
  emit('update', { ...props.rule, properties })
}

const handleUpdateProperty = (property) => {
  const properties = props.rule.properties.map(p => 
    p.id === property.id ? property : p
  )
  emit('update', { ...props.rule, properties })
}

const handleDeleteProperty = (propertyId) => {
  const properties = props.rule.properties.filter(p => p.id !== propertyId)
  emit('update', { ...props.rule, properties })
}

const handleUpdateCondition = (condition) => {
  emit('update', { ...props.rule, condition })
}

const handleAddAction = (action) => {
  const actions = [...(props.rule.actions || []), action]
  emit('update', { ...props.rule, actions })
}

const handleUpdateAction = (action) => {
  const actions = props.rule.actions.map(a => 
    a.id === action.id ? action : a
  )
  emit('update', { ...props.rule, actions })
}

const handleDeleteAction = (actionId) => {
  const actions = props.rule.actions.filter(a => a.id !== actionId)
  emit('update', { ...props.rule, actions })
}

const handleAddElseAction = (action) => {
  const elseActions = [...(props.rule.elseActions || []), action]
  emit('update', { ...props.rule, elseActions })
}

const handleUpdateElseAction = (action) => {
  const elseActions = props.rule.elseActions.map(a => 
    a.id === action.id ? action : a
  )
  emit('update', { ...props.rule, elseActions })
}

const handleDeleteElseAction = (actionId) => {
  const elseActions = props.rule.elseActions.filter(a => a.id !== actionId)
  emit('update', { ...props.rule, elseActions })
}
</script>

<style scoped>
.rule-item {
  margin-bottom: 20px;
}

.rule-card {
  border-left: 4px solid #409eff;
}

.rule-section {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
  font-size: 16px;
}
</style>
```

### 5. 条件编辑器组件 (ConditionEditor.vue)

```vue
<template>
  <div class="condition-editor">
    <div class="condition-container">
      <ConditionJoin
        :join="condition"
        @update="handleUpdateCondition"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'
import ConditionJoin from './ConditionJoin.vue'

/**
 * 条件编辑器组件
 */

// Props
const props = defineProps({
  condition: {
    type: Object,
    default: () => ({
      type: 'join',
      joinType: 'and',
      conditions: []
    })
  }
})

// Emits
const emit = defineEmits(['update'])

// 事件处理
const handleUpdateCondition = (condition) => {
  emit('update', condition)
}
</script>

<style scoped>
.condition-editor {
  min-height: 60px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  padding: 10px;
}

.condition-container {
  min-height: 40px;
}
</style>
```

### 6. 组合式API - useRuleset.js

```javascript
/**
 * 规则集管理组合式API
 */
import { ref, computed } from 'vue'
import { rulesetApi } from '@/api/ruleset'
import { generateId } from '@/utils/common'
import { buildRulesetXml } from '../utils/ruleXmlBuilder'

export function useRuleset() {
  // 响应式数据
  const rules = ref([])
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
  const ruleCount = computed(() => rules.value.length)

  /**
   * 加载规则集
   */
  const loadRuleset = async (file, version) => {
    try {
      loading.value = true
      const response = await rulesetApi.loadRuleset(file, version)
      const data = response.data

      // 解析规则数据
      parseRulesetData(data)
      
      isDirty.value = false
    } catch (error) {
      console.error('Load ruleset error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存规则集
   */
  const saveRuleset = async (newVersion = false) => {
    try {
      loading.value = true
      
      // 构建XML
      const xml = buildRulesetXml({
        rules: rules.value,
        remark: remarkContent.value,
        libraries: libraries.value
      })

      const params = {
        content: xml,
        file: window._file,
        newVersion
      }

      if (newVersion) {
        // 获取版本描述
        const versionComment = await getVersionComment()
        params.versionComment = versionComment
      }

      await rulesetApi.saveRuleset(params)
      isDirty.value = false
    } catch (error) {
      console.error('Save ruleset error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加规则
   */
  const addRule = () => {
    const newRule = {
      id: generateId(),
      name: `rule${rules.value.length + 1}`,
      properties: [],
      condition: {
        type: 'join',
        joinType: 'and',
        conditions: []
      },
      actions: [],
      elseActions: []
    }
    
    rules.value.push(newRule)
    setDirty()
  }

  /**
   * 更新规则
   */
  const updateRule = (ruleData) => {
    const index = rules.value.findIndex(r => r.id === ruleData.id)
    if (index > -1) {
      rules.value[index] = { ...ruleData }
      setDirty()
    }
  }

  /**
   * 删除规则
   */
  const deleteRule = (ruleId) => {
    const index = rules.value.findIndex(r => r.id === ruleId)
    if (index > -1) {
      rules.value.splice(index, 1)
      setDirty()
    }
  }

  /**
   * 排序规则
   */
  const sortRules = (newOrder) => {
    rules.value = [...newOrder]
    setDirty()
  }

  /**
   * 解析规则集数据
   */
  const parseRulesetData = (data) => {
    // 解析备注
    remarkContent.value = data.remark || ''

    // 解析库引用
    libraries.value = {
      variables: data.variableLibraries || [],
      constants: data.constantLibraries || [],
      actions: data.actionLibraries || [],
      parameters: data.parameterLibraries || []
    }

    // 解析规则
    rules.value = (data.rules || []).map(ruleData => ({
      id: ruleData.uuid || generateId(),
      name: ruleData.name || 'rule',
      properties: parseRuleProperties(ruleData.properties || []),
      condition: parseCondition(ruleData.lhs),
      actions: parseActions(ruleData.rhs?.actions || []),
      elseActions: parseActions(ruleData.rhs?.elseActions || [])
    }))
  }

  /**
   * 解析规则属性
   */
  const parseRuleProperties = (properties) => {
    return properties.map(prop => ({
      id: generateId(),
      name: prop.name,
      value: prop.value,
      type: prop.type
    }))
  }

  /**
   * 解析条件
   */
  const parseCondition = (lhs) => {
    if (!lhs) {
      return {
        type: 'join',
        joinType: 'and',
        conditions: []
      }
    }

    // 递归解析条件结构
    return parseConditionNode(lhs)
  }

  /**
   * 解析动作
   */
  const parseActions = (actions) => {
    return actions.map(action => ({
      id: generateId(),
      type: action.type,
      config: action.config || {}
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
      // 使用Element Plus的输入框获取版本注释
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
    rules,
    remarkContent,
    libraries,
    isDirty,
    loading,
    ruleCount,
    loadRuleset,
    saveRuleset,
    addRule,
    updateRule,
    deleteRule,
    sortRules,
    setDirty
  }
}
```

### 7. XML构建工具 (ruleXmlBuilder.js)

```javascript
/**
 * 规则集XML构建工具
 */

/**
 * 构建规则集XML
 */
export function buildRulesetXml({ rules, remark, libraries }) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<rule-set>\n'

  // 添加备注
  if (remark) {
    xml += `  <remark><![CDATA[${remark}]]></remark>\n`
  }

  // 添加库引用
  xml += buildLibraryImports(libraries)

  // 添加规则
  rules.forEach(rule => {
    xml += buildRuleXml(rule)
  })

  xml += '</rule-set>'
  return xml
}

/**
 * 构建库引用XML
 */
function buildLibraryImports(libraries) {
  let xml = ''

  // 变量库
  libraries.variables.forEach(lib => {
    xml += `  <import-variable-library path="${lib}" />\n`
  })

  // 常量库
  libraries.constants.forEach(lib => {
    xml += `  <import-constant-library path="${lib}" />\n`
  })

  // 动作库
  libraries.actions.forEach(lib => {
    xml += `  <import-action-library path="${lib}" />\n`
  })

  // 参数库
  libraries.parameters.forEach(lib => {
    xml += `  <import-parameter-library path="${lib}" />\n`
  })

  return xml
}

/**
 * 构建单个规则XML
 */
function buildRuleXml(rule) {
  let xml = `  <rule name="${rule.name}"`

  // 添加规则属性
  rule.properties.forEach(prop => {
    xml += ` ${prop.name}="${prop.value}"`
  })

  xml += '>\n'

  // 添加条件部分
  xml += '    <if>\n'
  xml += buildConditionXml(rule.condition, 6)
  xml += '    </if>\n'

  // 添加动作部分
  xml += '    <then>\n'
  rule.actions.forEach(action => {
    xml += buildActionXml(action, 6)
  })
  xml += '    </then>\n'

  // 添加否则动作部分
  if (rule.elseActions && rule.elseActions.length > 0) {
    xml += '    <else>\n'
    rule.elseActions.forEach(action => {
      xml += buildActionXml(action, 6)
    })
    xml += '    </else>\n'
  }

  xml += '  </rule>\n'
  return xml
}

/**
 * 构建条件XML
 */
function buildConditionXml(condition, indent = 0) {
  const spaces = ' '.repeat(indent)
  let xml = ''

  if (condition.type === 'join') {
    xml += `${spaces}<join type="${condition.joinType}">\n`
    condition.conditions.forEach(subCondition => {
      xml += buildConditionXml(subCondition, indent + 2)
    })
    xml += `${spaces}</join>\n`
  } else if (condition.type === 'condition') {
    xml += `${spaces}<condition>\n`
    xml += buildConditionContentXml(condition, indent + 2)
    xml += `${spaces}</condition>\n`
  }

  return xml
}

/**
 * 构建动作XML
 */
function buildActionXml(action, indent = 0) {
  const spaces = ' '.repeat(indent)
  let xml = ''

  switch (action.type) {
    case 'assignment':
      xml += `${spaces}<assignment>\n`
      xml += buildAssignmentXml(action.config, indent + 2)
      xml += `${spaces}</assignment>\n`
      break
    case 'method':
      xml += `${spaces}<execute-method>\n`
      xml += buildMethodXml(action.config, indent + 2)
      xml += `${spaces}</execute-method>\n`
      break
    case 'console':
      xml += `${spaces}<console-print>\n`
      xml += buildConsolePrintXml(action.config, indent + 2)
      xml += `${spaces}</console-print>\n`
      break
  }

  return xml
}

// 其他辅助函数...
```

## 数据结构定义

### 规则集数据结构
```javascript
const RulesetData = {
  remark: 'string',              // 备注信息
  libraries: {                  // 库引用
    variables: ['string'],       // 变量库路径列表
    constants: ['string'],       // 常量库路径列表
    actions: ['string'],         // 动作库路径列表
    parameters: ['string']       // 参数库路径列表
  },
  rules: [                       // 规则列表
    {
      id: 'string',              // 规则ID
      name: 'string',            // 规则名称
      properties: [              // 规则属性
        {
          id: 'string',
          name: 'string',        // 属性名
          value: 'any',          // 属性值
          type: 'string'         // 属性类型
        }
      ],
      condition: {               // 条件
        type: 'join|condition',
        joinType: 'and|or',     // 连接类型
        conditions: []           // 子条件
      },
      actions: [                 // 动作列表
        {
          id: 'string',
          type: 'string',        // 动作类型
          config: {}             // 动作配置
        }
      ],
      elseActions: []            // 否则动作列表
    }
  ]
}
```

### 条件数据结构
```javascript
const ConditionData = {
  type: 'condition',             // 条件类型
  left: {                        // 左值
    type: 'variable|constant|parameter',
    value: 'any'
  },
  operator: 'string',            // 操作符
  right: {                       // 右值
    type: 'variable|constant|parameter|value',
    value: 'any'
  }
}
```

### 动作数据结构
```javascript
const ActionData = {
  id: 'string',                  // 动作ID
  type: 'assignment|method|console', // 动作类型
  config: {                      // 动作配置
    // 根据动作类型不同而不同
  }
}
```

## API接口定义

```javascript
/**
 * 规则集编辑器API
 */
import request from '@/utils/request'

export const rulesetApi = {
  /**
   * 加载规则集
   */
  loadRuleset(file, version) {
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
   * 保存规则集
   */
  saveRuleset(data) {
    return request({
      url: '/api/urule/common/saveFile',
      method: 'post',
      data
    })
  },

  /**
   * 获取变量库列表
   */
  getVariableLibraries() {
    return request({
      url: '/api/urule/ruleseteditor/loadVariableLibraries',
      method: 'get'
    })
  },

  /**
   * 获取常量库列表
   */
  getConstantLibraries() {
    return request({
      url: '/api/urule/ruleseteditor/loadConstantLibraries',
      method: 'get'
    })
  }
}
```

## 路由配置

```javascript
// router/modules/ruleset.js
export default {
  path: '/ruleset-editor',
  name: 'RulesetEditor',
  component: () => import('@/views/rulesetEditor/index.vue'),
  meta: {
    title: '决策集编辑器',
    icon: 'ruleset',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 规则的增删改查操作
- [ ] 条件的可视化编辑
- [ ] 动作的配置和管理
- [ ] 规则属性的设置
- [ ] 规则排序功能
- [ ] 保存和保存新版本

### 2. 界面测试
- [ ] 规则编辑器界面正确显示
- [ ] 拖拽排序功能正常
- [ ] 对话框正常弹出和关闭
- [ ] 响应式布局适配

### 3. 数据测试
- [ ] XML解析和生成正确
- [ ] 数据状态管理正确
- [ ] 表单验证正确
- [ ] 错误处理正确

### 4. 性能测试
- [ ] 大量规则时的性能表现
- [ ] 复杂条件编辑的响应速度
- [ ] 内存使用情况

## 注意事项

### 1. 技术要点
- 使用Vue 3的Composition API实现复杂的编辑器逻辑
- 使用拖拽库实现规则排序功能
- 实现自定义的条件和动作编辑器
- 支持实时的语法验证

### 2. 用户体验
- 保持与老项目相同的编辑体验
- 提供丰富的快捷键支持
- 实现撤销/重做功能
- 优化大数据量时的性能

### 3. 数据安全
- 实时保存编辑状态
- 提供数据恢复机制
- 支持版本管理
- 防止数据丢失

### 4. 扩展性
- 支持自定义条件类型
- 支持自定义动作类型
- 支持插件化扩展
- 支持主题定制

---

**预计完成时间**: 25小时  
**测试时间**: 6小时  
**文档更新**: 2小时  
**总计**: 33小时 