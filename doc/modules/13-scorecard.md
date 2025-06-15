# 评分卡编辑器模块迁移计划

## 模块概述

评分卡编辑器是URule系统中用于创建和编辑评分卡模型的专用工具。评分卡是一种常用的风险评估和信用评分工具，通过多个指标的加权计算得出最终评分。

### 功能特性
- 评分卡模型设计
- 指标权重配置
- 评分规则定义
- 分数计算逻辑
- 模型验证测试
- 评分卡导入导出

### 技术要求
- **预计工作量**: 20小时
- **优先级**: 低
- **依赖模块**: 公共组件库、变量管理
- **技术栈**: Vue 3 + Element Plus + 自定义评分卡组件

## 老项目分析

### 核心功能分析

#### 1. 评分卡结构
- **基本信息**: 评分卡名称、描述、版本等
- **指标定义**: 评分指标的配置和管理
- **权重设置**: 各指标的权重分配
- **评分规则**: 指标值到分数的映射规则

#### 2. 指标管理
- **指标类型**: 数值型、分类型、布尔型等
- **取值范围**: 指标的有效取值范围
- **分数映射**: 指标值对应的分数
- **权重配置**: 指标在总分中的权重

#### 3. 计算引擎
- **加权求和**: 基于权重的分数计算
- **分数归一化**: 将分数标准化到指定范围
- **结果输出**: 最终评分和等级判定

## Vue 3 实现方案

### 1. 目录结构设计
```
src/views/scorecard/
├── index.vue                   # 主编辑器页面
├── components/
│   ├── ScorecardToolbar.vue   # 工具栏组件
│   ├── ScorecardInfo.vue      # 基本信息组件
│   ├── IndicatorList.vue      # 指标列表组件
│   ├── IndicatorEditor.vue    # 指标编辑器
│   ├── WeightConfig.vue       # 权重配置组件
│   ├── ScoreRuleEditor.vue    # 评分规则编辑器
│   └── ScorecardTester.vue    # 评分卡测试组件
├── composables/
│   ├── useScorecard.js        # 评分卡逻辑
│   ├── useIndicator.js        # 指标管理逻辑
│   └── useScoreCalculator.js  # 分数计算逻辑
├── stores/
│   └── scorecardStore.js      # 状态管理
└── utils/
    ├── scorecardXmlBuilder.js # XML构建工具
    └── scoreCalculator.js     # 分数计算器
```

### 2. 主编辑器页面 (index.vue)

```vue
<template>
  <div class="scorecard-editor">
    <!-- 工具栏 -->
    <ScorecardToolbar
      @save="handleSave"
      @save-new-version="handleSaveNewVersion"
      @test="handleTest"
      @import="handleImport"
      @export="handleExport"
    />

    <div class="editor-content">
      <!-- 左侧面板 -->
      <div class="left-panel">
        <!-- 基本信息 -->
        <el-card class="info-card" header="基本信息">
          <ScorecardInfo
            :scorecard-info="scorecardInfo"
            @update="handleInfoUpdate"
          />
        </el-card>

        <!-- 指标列表 -->
        <el-card class="indicator-card" header="评分指标">
          <template #header>
            <div class="card-header">
              <span>评分指标</span>
              <el-button type="primary" size="small" @click="handleAddIndicator">
                <el-icon><Plus /></el-icon>
                添加指标
              </el-button>
            </div>
          </template>
          <IndicatorList
            :indicators="indicators"
            @select="handleSelectIndicator"
            @delete="handleDeleteIndicator"
          />
        </el-card>
      </div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- 指标编辑器 -->
        <el-card v-if="selectedIndicator" class="editor-card" header="指标配置">
          <IndicatorEditor
            :indicator="selectedIndicator"
            @update="handleIndicatorUpdate"
          />
        </el-card>

        <!-- 权重配置 -->
        <el-card class="weight-card" header="权重配置">
          <WeightConfig
            :indicators="indicators"
            @update="handleWeightUpdate"
          />
        </el-card>

        <!-- 总分配置 -->
        <el-card class="score-card" header="总分配置">
          <div class="score-config">
            <el-form label-width="100px">
              <el-form-item label="总分范围">
                <el-input-number
                  v-model="scorecardInfo.minScore"
                  :min="0"
                  placeholder="最低分"
                  style="width: 120px"
                />
                <span style="margin: 0 10px">-</span>
                <el-input-number
                  v-model="scorecardInfo.maxScore"
                  :min="scorecardInfo.minScore"
                  placeholder="最高分"
                  style="width: 120px"
                />
              </el-form-item>
              <el-form-item label="等级划分">
                <el-button size="small" @click="handleConfigGrades">
                  配置等级
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 指标编辑对话框 -->
    <el-dialog
      v-model="indicatorDialogVisible"
      :title="isEditIndicator ? '编辑指标' : '添加指标'"
      width="600px"
    >
      <IndicatorEditor
        :indicator="editingIndicator"
        @save="handleIndicatorSave"
        @cancel="handleIndicatorCancel"
      />
    </el-dialog>

    <!-- 评分卡测试对话框 -->
    <el-dialog
      v-model="testDialogVisible"
      title="评分卡测试"
      width="800px"
    >
      <ScorecardTester
        :scorecard="scorecardData"
        @close="testDialogVisible = false"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import ScorecardToolbar from './components/ScorecardToolbar.vue'
import ScorecardInfo from './components/ScorecardInfo.vue'
import IndicatorList from './components/IndicatorList.vue'
import IndicatorEditor from './components/IndicatorEditor.vue'
import WeightConfig from './components/WeightConfig.vue'
import ScorecardTester from './components/ScorecardTester.vue'
import { useScorecard } from './composables/useScorecard'

/**
 * 评分卡编辑器主页面
 */

// 路由参数
const route = useRoute()
const file = route.query.file
const version = route.query.version

// 组合式API
const {
  scorecardInfo,
  indicators,
  selectedIndicator,
  isDirty,
  loadScorecard,
  saveScorecard,
  addIndicator,
  updateIndicator,
  deleteIndicator,
  selectIndicator
} = useScorecard()

// 响应式数据
const indicatorDialogVisible = ref(false)
const testDialogVisible = ref(false)
const editingIndicator = ref(null)
const isEditIndicator = ref(false)

// 计算属性
const scorecardData = computed(() => ({
  info: scorecardInfo.value,
  indicators: indicators.value
}))

// 生命周期
onMounted(() => {
  if (file) {
    loadScorecard(file, version)
  }
})

// 事件处理
const handleSave = async () => {
  try {
    await saveScorecard(false)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveNewVersion = async () => {
  try {
    await saveScorecard(true)
    ElMessage.success('保存新版本成功')
  } catch (error) {
    ElMessage.error('保存新版本失败')
  }
}

const handleTest = () => {
  testDialogVisible.value = true
}

const handleImport = () => {
  // 导入评分卡
}

const handleExport = () => {
  // 导出评分卡
}

const handleInfoUpdate = (info) => {
  Object.assign(scorecardInfo.value, info)
}

const handleAddIndicator = () => {
  editingIndicator.value = {
    name: '',
    type: 'numeric',
    weight: 0,
    scoreRules: []
  }
  isEditIndicator.value = false
  indicatorDialogVisible.value = true
}

const handleSelectIndicator = (indicator) => {
  selectIndicator(indicator)
}

const handleDeleteIndicator = (indicatorId) => {
  deleteIndicator(indicatorId)
}

const handleIndicatorUpdate = (indicator) => {
  updateIndicator(indicator)
}

const handleWeightUpdate = (weights) => {
  // 更新权重配置
  weights.forEach(({ id, weight }) => {
    const indicator = indicators.value.find(ind => ind.id === id)
    if (indicator) {
      indicator.weight = weight
    }
  })
}

const handleIndicatorSave = (indicator) => {
  if (isEditIndicator.value) {
    updateIndicator(indicator)
  } else {
    addIndicator(indicator)
  }
  indicatorDialogVisible.value = false
}

const handleIndicatorCancel = () => {
  indicatorDialogVisible.value = false
}

const handleConfigGrades = () => {
  // 配置等级划分
}
</script>

<style scoped>
.scorecard-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.editor-content {
  flex: 1;
  display: flex;
  padding: 10px;
  gap: 10px;
}

.left-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-card {
  flex-shrink: 0;
}

.indicator-card {
  flex: 1;
  min-height: 300px;
}

.editor-card {
  flex: 1;
  min-height: 400px;
}

.weight-card,
.score-card {
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-config {
  padding: 10px 0;
}
</style>
```

### 3. 指标列表组件 (IndicatorList.vue)

```vue
<template>
  <div class="indicator-list">
    <div
      v-for="indicator in indicators"
      :key="indicator.id"
      class="indicator-item"
      :class="{ active: selectedId === indicator.id }"
      @click="handleSelect(indicator)"
    >
      <div class="indicator-info">
        <div class="indicator-name">{{ indicator.name }}</div>
        <div class="indicator-meta">
          <span class="indicator-type">{{ getTypeLabel(indicator.type) }}</span>
          <span class="indicator-weight">权重: {{ indicator.weight }}%</span>
        </div>
      </div>
      <div class="indicator-actions">
        <el-button
          type="danger"
          size="small"
          circle
          @click.stop="handleDelete(indicator.id)"
        >
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>

    <div v-if="indicators.length === 0" class="empty-state">
      <el-empty description="暂无指标，请添加指标" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'

/**
 * 指标列表组件
 */

// Props
const props = defineProps({
  indicators: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['select', 'delete'])

// 方法
const getTypeLabel = (type) => {
  const typeLabels = {
    numeric: '数值型',
    categorical: '分类型',
    boolean: '布尔型'
  }
  return typeLabels[type] || type
}

const handleSelect = (indicator) => {
  emit('select', indicator)
}

const handleDelete = (indicatorId) => {
  emit('delete', indicatorId)
}
</script>

<style scoped>
.indicator-list {
  max-height: 400px;
  overflow-y: auto;
}

.indicator-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.indicator-item:hover {
  border-color: #409eff;
  background: #f0f9ff;
}

.indicator-item.active {
  border-color: #409eff;
  background: #e6f7ff;
}

.indicator-info {
  flex: 1;
}

.indicator-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.indicator-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #909399;
}

.indicator-type {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 2px;
}

.indicator-actions {
  flex-shrink: 0;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}
</style>
```

### 4. 指标编辑器组件 (IndicatorEditor.vue)

```vue
<template>
  <div class="indicator-editor">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
    >
      <!-- 基本信息 -->
      <el-form-item label="指标名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入指标名称" />
      </el-form-item>

      <el-form-item label="指标类型" prop="type">
        <el-select v-model="formData.type" @change="handleTypeChange">
          <el-option label="数值型" value="numeric" />
          <el-option label="分类型" value="categorical" />
          <el-option label="布尔型" value="boolean" />
        </el-select>
      </el-form-item>

      <el-form-item label="权重" prop="weight">
        <el-input-number
          v-model="formData.weight"
          :min="0"
          :max="100"
          :precision="2"
          style="width: 150px"
        />
        <span style="margin-left: 8px">%</span>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="2"
          placeholder="请输入指标描述"
        />
      </el-form-item>

      <!-- 评分规则 -->
      <el-form-item label="评分规则">
        <div class="score-rules">
          <div class="rules-header">
            <span>评分规则配置</span>
            <el-button type="primary" size="small" @click="handleAddRule">
              添加规则
            </el-button>
          </div>

          <div class="rules-list">
            <div
              v-for="(rule, index) in formData.scoreRules"
              :key="index"
              class="rule-item"
            >
              <!-- 数值型规则 -->
              <template v-if="formData.type === 'numeric'">
                <el-input-number
                  v-model="rule.minValue"
                  placeholder="最小值"
                  style="width: 100px"
                />
                <span>-</span>
                <el-input-number
                  v-model="rule.maxValue"
                  placeholder="最大值"
                  style="width: 100px"
                />
                <span>=></span>
                <el-input-number
                  v-model="rule.score"
                  placeholder="分数"
                  style="width: 80px"
                />
              </template>

              <!-- 分类型规则 -->
              <template v-if="formData.type === 'categorical'">
                <el-input
                  v-model="rule.value"
                  placeholder="分类值"
                  style="width: 150px"
                />
                <span>=></span>
                <el-input-number
                  v-model="rule.score"
                  placeholder="分数"
                  style="width: 80px"
                />
              </template>

              <!-- 布尔型规则 -->
              <template v-if="formData.type === 'boolean'">
                <el-select v-model="rule.value" style="width: 100px">
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
                <span>=></span>
                <el-input-number
                  v-model="rule.score"
                  placeholder="分数"
                  style="width: 80px"
                />
              </template>

              <el-button
                type="danger"
                size="small"
                circle
                @click="handleDeleteRule(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <div class="editor-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { generateId } from '@/utils/common'

/**
 * 指标编辑器组件
 */

// Props
const props = defineProps({
  indicator: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['save', 'cancel'])

// 响应式数据
const formRef = ref()
const formData = ref({
  id: '',
  name: '',
  type: 'numeric',
  weight: 0,
  description: '',
  scoreRules: []
})

const formRules = {
  name: [
    { required: true, message: '请输入指标名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择指标类型', trigger: 'change' }
  ],
  weight: [
    { required: true, message: '请输入权重', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '权重范围为0-100', trigger: 'blur' }
  ]
}

// 监听器
watch(() => props.indicator, (newIndicator) => {
  if (newIndicator) {
    formData.value = {
      id: newIndicator.id || generateId(),
      name: newIndicator.name || '',
      type: newIndicator.type || 'numeric',
      weight: newIndicator.weight || 0,
      description: newIndicator.description || '',
      scoreRules: [...(newIndicator.scoreRules || [])]
    }
  }
}, { immediate: true, deep: true })

// 事件处理
const handleTypeChange = () => {
  // 清空评分规则
  formData.value.scoreRules = []
}

const handleAddRule = () => {
  const rule = createDefaultRule(formData.value.type)
  formData.value.scoreRules.push(rule)
}

const handleDeleteRule = (index) => {
  formData.value.scoreRules.splice(index, 1)
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    emit('save', { ...formData.value })
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

const handleCancel = () => {
  emit('cancel')
}

const createDefaultRule = (type) => {
  switch (type) {
    case 'numeric':
      return { minValue: 0, maxValue: 100, score: 0 }
    case 'categorical':
      return { value: '', score: 0 }
    case 'boolean':
      return { value: true, score: 0 }
    default:
      return { score: 0 }
  }
}
</script>

<style scoped>
.indicator-editor {
  padding: 20px;
}

.score-rules {
  width: 100%;
}

.rules-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.rules-list {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  min-height: 100px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.rule-item:last-child {
  margin-bottom: 0;
}

.editor-actions {
  margin-top: 20px;
  text-align: right;
}
</style>
```

### 5. 组合式API - useScorecard.js

```javascript
/**
 * 评分卡管理组合式API
 */
import { ref, computed } from 'vue'
import { scorecardApi } from '@/api/scorecard'
import { generateId } from '@/utils/common'
import { buildScorecardXml } from '../utils/scorecardXmlBuilder'

export function useScorecard() {
  // 响应式数据
  const scorecardInfo = ref({
    name: '',
    description: '',
    version: '1.0',
    minScore: 0,
    maxScore: 100,
    grades: []
  })

  const indicators = ref([])
  const selectedIndicator = ref(null)
  const isDirty = ref(false)
  const loading = ref(false)

  // 计算属性
  const totalWeight = computed(() => {
    return indicators.value.reduce((sum, indicator) => sum + (indicator.weight || 0), 0)
  })

  const isWeightValid = computed(() => {
    return Math.abs(totalWeight.value - 100) < 0.01
  })

  /**
   * 加载评分卡
   */
  const loadScorecard = async (file, version) => {
    try {
      loading.value = true
      const response = await scorecardApi.loadScorecard(file, version)
      const data = response.data

      parseScorecardData(data)
      isDirty.value = false
    } catch (error) {
      console.error('Load scorecard error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存评分卡
   */
  const saveScorecard = async (newVersion = false) => {
    try {
      // 验证权重
      if (!isWeightValid.value) {
        throw new Error('指标权重总和必须等于100%')
      }

      loading.value = true
      
      const xml = buildScorecardXml({
        info: scorecardInfo.value,
        indicators: indicators.value
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

      await scorecardApi.saveScorecard(params)
      isDirty.value = false
    } catch (error) {
      console.error('Save scorecard error:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加指标
   */
  const addIndicator = (indicatorData) => {
    const newIndicator = {
      id: generateId(),
      ...indicatorData
    }
    indicators.value.push(newIndicator)
    setDirty()
  }

  /**
   * 更新指标
   */
  const updateIndicator = (indicatorData) => {
    const index = indicators.value.findIndex(ind => ind.id === indicatorData.id)
    if (index > -1) {
      indicators.value[index] = { ...indicatorData }
      
      // 更新选中的指标
      if (selectedIndicator.value?.id === indicatorData.id) {
        selectedIndicator.value = indicators.value[index]
      }
      
      setDirty()
    }
  }

  /**
   * 删除指标
   */
  const deleteIndicator = (indicatorId) => {
    const index = indicators.value.findIndex(ind => ind.id === indicatorId)
    if (index > -1) {
      indicators.value.splice(index, 1)
      
      // 清除选择
      if (selectedIndicator.value?.id === indicatorId) {
        selectedIndicator.value = null
      }
      
      setDirty()
    }
  }

  /**
   * 选择指标
   */
  const selectIndicator = (indicator) => {
    selectedIndicator.value = indicator
  }

  /**
   * 计算评分
   */
  const calculateScore = (inputValues) => {
    let totalScore = 0
    let totalWeight = 0

    indicators.value.forEach(indicator => {
      const value = inputValues[indicator.id]
      if (value !== undefined && value !== null) {
        const score = calculateIndicatorScore(indicator, value)
        totalScore += score * (indicator.weight / 100)
        totalWeight += indicator.weight
      }
    })

    // 归一化到目标分数范围
    const normalizedScore = (totalScore / totalWeight) * 100
    const finalScore = scorecardInfo.value.minScore + 
      (normalizedScore / 100) * (scorecardInfo.value.maxScore - scorecardInfo.value.minScore)

    return Math.round(finalScore * 100) / 100
  }

  /**
   * 计算单个指标分数
   */
  const calculateIndicatorScore = (indicator, value) => {
    const rules = indicator.scoreRules || []
    
    for (const rule of rules) {
      if (indicator.type === 'numeric') {
        if (value >= rule.minValue && value <= rule.maxValue) {
          return rule.score
        }
      } else if (indicator.type === 'categorical') {
        if (value === rule.value) {
          return rule.score
        }
      } else if (indicator.type === 'boolean') {
        if (value === rule.value) {
          return rule.score
        }
      }
    }

    return 0 // 默认分数
  }

  /**
   * 解析评分卡数据
   */
  const parseScorecardData = (data) => {
    // 解析基本信息
    scorecardInfo.value = {
      name: data.name || '',
      description: data.description || '',
      version: data.version || '1.0',
      minScore: data.minScore || 0,
      maxScore: data.maxScore || 100,
      grades: data.grades || []
    }

    // 解析指标
    indicators.value = (data.indicators || []).map(indicatorData => ({
      id: indicatorData.id || generateId(),
      name: indicatorData.name || '',
      type: indicatorData.type || 'numeric',
      weight: indicatorData.weight || 0,
      description: indicatorData.description || '',
      scoreRules: indicatorData.scoreRules || []
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
    scorecardInfo,
    indicators,
    selectedIndicator,
    isDirty,
    loading,
    totalWeight,
    isWeightValid,
    loadScorecard,
    saveScorecard,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    selectIndicator,
    calculateScore,
    setDirty
  }
}
```

### 6. 评分卡XML构建工具 (scorecardXmlBuilder.js)

```javascript
/**
 * 评分卡XML构建工具
 */

/**
 * 构建评分卡XML
 */
export function buildScorecardXml({ info, indicators }) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<scorecard>\n'

  // 基本信息
  xml += `  <info>\n`
  xml += `    <name><![CDATA[${info.name}]]></name>\n`
  xml += `    <description><![CDATA[${info.description}]]></description>\n`
  xml += `    <version>${info.version}</version>\n`
  xml += `    <min-score>${info.minScore}</min-score>\n`
  xml += `    <max-score>${info.maxScore}</max-score>\n`
  xml += `  </info>\n`

  // 指标定义
  xml += `  <indicators>\n`
  indicators.forEach(indicator => {
    xml += buildIndicatorXml(indicator)
  })
  xml += `  </indicators>\n`

  // 等级定义
  if (info.grades && info.grades.length > 0) {
    xml += `  <grades>\n`
    info.grades.forEach(grade => {
      xml += `    <grade name="${grade.name}" min-score="${grade.minScore}" max-score="${grade.maxScore}" />\n`
    })
    xml += `  </grades>\n`
  }

  xml += '</scorecard>'
  return xml
}

/**
 * 构建指标XML
 */
function buildIndicatorXml(indicator) {
  let xml = `    <indicator id="${indicator.id}" type="${indicator.type}" weight="${indicator.weight}">\n`
  xml += `      <name><![CDATA[${indicator.name}]]></name>\n`
  
  if (indicator.description) {
    xml += `      <description><![CDATA[${indicator.description}]]></description>\n`
  }

  // 评分规则
  xml += `      <score-rules>\n`
  indicator.scoreRules.forEach(rule => {
    xml += buildScoreRuleXml(rule, indicator.type)
  })
  xml += `      </score-rules>\n`

  xml += `    </indicator>\n`
  return xml
}

/**
 * 构建评分规则XML
 */
function buildScoreRuleXml(rule, indicatorType) {
  let xml = `        <rule score="${rule.score}"`

  switch (indicatorType) {
    case 'numeric':
      xml += ` min-value="${rule.minValue}" max-value="${rule.maxValue}"`
      break
    case 'categorical':
    case 'boolean':
      xml += ` value="${rule.value}"`
      break
  }

  xml += ' />\n'
  return xml
}
```

## 数据结构定义

### 评分卡数据结构
```javascript
const ScorecardData = {
  info: {                        // 基本信息
    name: 'string',              // 评分卡名称
    description: 'string',       // 描述
    version: 'string',           // 版本
    minScore: 'number',          // 最低分
    maxScore: 'number',          // 最高分
    grades: [                    // 等级定义
      {
        name: 'string',          // 等级名称
        minScore: 'number',      // 最低分
        maxScore: 'number'       // 最高分
      }
    ]
  },
  indicators: [                  // 指标列表
    {
      id: 'string',              // 指标ID
      name: 'string',            // 指标名称
      type: 'numeric|categorical|boolean', // 指标类型
      weight: 'number',          // 权重(%)
      description: 'string',     // 描述
      scoreRules: [              // 评分规则
        {
          score: 'number',       // 分数
          // 数值型规则
          minValue: 'number',    // 最小值
          maxValue: 'number',    // 最大值
          // 分类型/布尔型规则
          value: 'any'           // 匹配值
        }
      ]
    }
  ]
}
```

## API接口定义

```javascript
/**
 * 评分卡API
 */
import request from '@/utils/request'

export const scorecardApi = {
  /**
   * 加载评分卡
   */
  loadScorecard(file, version) {
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
   * 保存评分卡
   */
  saveScorecard(data) {
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
// router/modules/scorecard.js
export default {
  path: '/scorecard-editor',
  name: 'ScorecardEditor',
  component: () => import('@/views/scorecard/index.vue'),
  meta: {
    title: '评分卡编辑器',
    icon: 'scorecard',
    requiresAuth: true
  }
}
```

## 测试要点

### 1. 功能测试
- [ ] 指标的增删改操作
- [ ] 权重配置和验证
- [ ] 评分规则配置
- [ ] 分数计算功能
- [ ] 保存和加载功能

### 2. 界面测试
- [ ] 编辑器界面正确显示
- [ ] 表单验证正确
- [ ] 交互操作流畅

### 3. 计算测试
- [ ] 评分算法正确性
- [ ] 权重计算准确性
- [ ] 边界值处理

## 注意事项

### 1. 技术要点
- 实现灵活的评分规则配置
- 支持多种指标类型
- 提供准确的分数计算
- 实现权重验证机制

### 2. 用户体验
- 提供直观的配置界面
- 支持实时预览和测试
- 提供详细的验证提示
- 优化编辑流程

---

**预计完成时间**: 20小时  
**测试时间**: 5小时  
**文档更新**: 1小时  
**总计**: 26小时 