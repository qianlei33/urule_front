# 权限管理模块迁移计划

## 模块概述
权限管理模块负责URule系统的用户权限控制，包括用户管理、角色管理、权限分配、登录认证等功能。该模块确保系统的安全性，控制不同用户对不同功能和资源的访问权限。

## 技术栈对比

### 老项目技术栈
- **框架**: React 16.3.1
- **状态管理**: Redux
- **UI组件**: Bootstrap 3 + 自定义组件
- **HTTP请求**: jQuery Ajax
- **权限控制**: 基于角色的访问控制(RBAC)

### 新项目技术栈
- **框架**: Vue 3 (Composition API)
- **状态管理**: Pinia
- **UI组件**: Element Plus
- **HTTP请求**: Axios
- **权限控制**: 基于角色的访问控制(RBAC) + Vue Router守卫

## 核心功能分析

### 1. 用户管理
- 用户的增删改查
- 用户状态管理(启用/禁用)
- 用户密码重置
- 用户角色分配

### 2. 角色管理
- 角色的增删改查
- 角色权限配置
- 角色继承关系
- 默认角色设置

### 3. 权限管理
- 权限点定义
- 权限树结构
- 权限分配给角色
- 权限检查机制

### 4. 登录认证
- 用户登录验证
- Token管理
- 会话超时处理
- 单点登录支持

## 组件设计

### 1. PermissionManager 主组件
```vue
<template>
  <div class="permission-manager">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- 用户管理标签页 -->
      <el-tab-pane label="用户管理" name="users">
        <UserManagement />
      </el-tab-pane>
      
      <!-- 角色管理标签页 -->
      <el-tab-pane label="角色管理" name="roles">
        <RoleManagement />
      </el-tab-pane>
      
      <!-- 权限管理标签页 -->
      <el-tab-pane label="权限管理" name="permissions">
        <PermissionManagement />
      </el-tab-pane>
      
      <!-- 系统设置标签页 -->
      <el-tab-pane label="系统设置" name="settings">
        <SystemSettings />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import UserManagement from './components/UserManagement.vue'
import RoleManagement from './components/RoleManagement.vue'
import PermissionManagement from './components/PermissionManagement.vue'
import SystemSettings from './components/SystemSettings.vue'

// 当前激活的标签页
const activeTab = ref('users')
</script>

<style scoped>
.permission-manager {
  height: 100%;
  padding: 20px;
}
</style>
```

### 2. UserManagement 用户管理组件
```vue
<template>
  <div class="user-management">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddUserDialog">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
      <el-button @click="refreshUsers">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
      
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名或邮箱"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>
    
    <!-- 用户列表表格 -->
    <el-table
      :data="filteredUsers"
      v-loading="loading"
      stripe
      border
      height="calc(100vh - 200px)"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="真实姓名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column label="角色" width="200">
        <template #default="{ row }">
          <el-tag
            v-for="role in row.roles"
            :key="role.id"
            size="small"
            class="mr-1"
          >
            {{ role.name }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.enabled"
            @change="handleUserStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editUser(row)">
            编辑
          </el-button>
          <el-button size="small" @click="resetPassword(row)">
            重置密码
          </el-button>
          <el-button
            size="small"
            type="danger"
            @click="deleteUser(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 添加/编辑用户对话框 -->
    <UserDialog
      v-model="showUserDialog"
      :user="currentUser"
      :roles="allRoles"
      @save="handleUserSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import UserDialog from './UserDialog.vue'

/**
 * 权限管理store
 */
const permissionStore = usePermissionStore()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const showUserDialog = ref(false)
const currentUser = ref(null)

// 计算属性
const filteredUsers = computed(() => {
  if (!searchKeyword.value) {
    return permissionStore.users
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return permissionStore.users.filter(user => 
    user.username.toLowerCase().includes(keyword) ||
    user.realName.toLowerCase().includes(keyword) ||
    user.email.toLowerCase().includes(keyword)
  )
})

const allRoles = computed(() => permissionStore.roles)

/**
 * 组件挂载时加载数据
 */
onMounted(() => {
  loadUsers()
  loadRoles()
})

/**
 * 加载用户列表
 */
const loadUsers = async () => {
  loading.value = true
  try {
    await permissionStore.loadUsers()
  } catch (error) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 加载角色列表
 */
const loadRoles = async () => {
  try {
    await permissionStore.loadRoles()
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

/**
 * 刷新用户列表
 */
const refreshUsers = () => {
  loadUsers()
}

/**
 * 搜索处理
 */
const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

/**
 * 显示添加用户对话框
 */
const showAddUserDialog = () => {
  currentUser.value = null
  showUserDialog.value = true
}

/**
 * 编辑用户
 */
const editUser = (user) => {
  currentUser.value = { ...user }
  showUserDialog.value = true
}

/**
 * 处理用户保存
 */
const handleUserSave = async (userData) => {
  try {
    if (currentUser.value) {
      // 更新用户
      await permissionStore.updateUser(userData)
      ElMessage.success('用户更新成功')
    } else {
      // 添加用户
      await permissionStore.addUser(userData)
      ElMessage.success('用户添加成功')
    }
    showUserDialog.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error('保存用户失败')
  }
}

/**
 * 处理用户状态变更
 */
const handleUserStatusChange = async (user) => {
  try {
    await permissionStore.updateUserStatus(user.id, user.enabled)
    ElMessage.success(`用户已${user.enabled ? '启用' : '禁用'}`)
  } catch (error) {
    ElMessage.error('更新用户状态失败')
    // 恢复原状态
    user.enabled = !user.enabled
  }
}

/**
 * 重置用户密码
 */
const resetPassword = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置用户 ${user.username} 的密码吗？`,
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const newPassword = await permissionStore.resetUserPassword(user.id)
    ElMessageBox.alert(
      `新密码：${newPassword}`,
      '密码重置成功',
      {
        confirmButtonText: '确定',
        type: 'success'
      }
    )
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置密码失败')
    }
  }
}

/**
 * 删除用户
 */
const deleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.username} 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await permissionStore.deleteUser(user.id)
    ElMessage.success('用户删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败')
    }
  }
}
</script>

<style scoped>
.user-management {
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  margin-left: auto;
  width: 300px;
}

.mr-1 {
  margin-right: 4px;
}
</style>
```

### 3. RoleManagement 角色管理组件
```vue
<template>
  <div class="role-management">
    <el-row :gutter="20">
      <!-- 左侧角色列表 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>角色列表</span>
              <el-button size="small" type="primary" @click="showAddRoleDialog">
                添加角色
              </el-button>
            </div>
          </template>
          
          <el-tree
            :data="roleTree"
            :props="treeProps"
            node-key="id"
            highlight-current
            @node-click="handleRoleSelect"
          >
            <template #default="{ node, data }">
              <div class="role-node">
                <span>{{ data.name }}</span>
                <div class="node-actions">
                  <el-button size="small" text @click.stop="editRole(data)">
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    text
                    @click.stop="deleteRole(data)"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>
      
      <!-- 右侧权限配置 -->
      <el-col :span="16">
        <el-card v-if="selectedRole">
          <template #header>
            <div class="card-header">
              <span>{{ selectedRole.name }} - 权限配置</span>
              <el-button size="small" @click="saveRolePermissions">
                保存权限
              </el-button>
            </div>
          </template>
          
          <el-tree
            ref="permissionTree"
            :data="permissionTree"
            :props="permissionTreeProps"
            node-key="id"
            show-checkbox
            check-strictly
            @check="handlePermissionCheck"
          >
            <template #default="{ node, data }">
              <div class="permission-node">
                <el-icon v-if="data.type === 'module'">
                  <Folder />
                </el-icon>
                <el-icon v-else>
                  <Key />
                </el-icon>
                <span class="ml-2">{{ data.name }}</span>
                <el-tag v-if="data.code" size="small" class="ml-2">
                  {{ data.code }}
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-card>
        
        <el-empty v-else description="请选择一个角色" />
      </el-col>
    </el-row>
    
    <!-- 添加/编辑角色对话框 -->
    <RoleDialog
      v-model="showRoleDialog"
      :role="currentRole"
      :parent-roles="parentRoles"
      @save="handleRoleSave"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermissionStore } from '@/stores/permission'
import RoleDialog from './RoleDialog.vue'

/**
 * 权限管理store
 */
const permissionStore = usePermissionStore()

// 响应式数据
const selectedRole = ref(null)
const showRoleDialog = ref(false)
const currentRole = ref(null)
const permissionTree = ref(null)

// 树形组件配置
const treeProps = {
  children: 'children',
  label: 'name'
}

const permissionTreeProps = {
  children: 'children',
  label: 'name'
}

// 计算属性
const roleTree = computed(() => permissionStore.roleTree)
const permissionTree = computed(() => permissionStore.permissionTree)
const parentRoles = computed(() => permissionStore.roles)

/**
 * 组件挂载时加载数据
 */
onMounted(() => {
  loadRoles()
  loadPermissions()
})

/**
 * 加载角色列表
 */
const loadRoles = async () => {
  try {
    await permissionStore.loadRoles()
  } catch (error) {
    ElMessage.error('加载角色列表失败')
  }
}

/**
 * 加载权限树
 */
const loadPermissions = async () => {
  try {
    await permissionStore.loadPermissions()
  } catch (error) {
    ElMessage.error('加载权限列表失败')
  }
}

/**
 * 处理角色选择
 */
const handleRoleSelect = async (role) => {
  selectedRole.value = role
  
  // 加载角色权限并设置选中状态
  try {
    const rolePermissions = await permissionStore.getRolePermissions(role.id)
    await nextTick()
    
    // 设置权限树选中状态
    if (permissionTree.value) {
      permissionTree.value.setCheckedKeys(rolePermissions.map(p => p.id))
    }
  } catch (error) {
    ElMessage.error('加载角色权限失败')
  }
}

/**
 * 显示添加角色对话框
 */
const showAddRoleDialog = () => {
  currentRole.value = null
  showRoleDialog.value = true
}

/**
 * 编辑角色
 */
const editRole = (role) => {
  currentRole.value = { ...role }
  showRoleDialog.value = true
}

/**
 * 处理角色保存
 */
const handleRoleSave = async (roleData) => {
  try {
    if (currentRole.value) {
      // 更新角色
      await permissionStore.updateRole(roleData)
      ElMessage.success('角色更新成功')
    } else {
      // 添加角色
      await permissionStore.addRole(roleData)
      ElMessage.success('角色添加成功')
    }
    showRoleDialog.value = false
    loadRoles()
  } catch (error) {
    ElMessage.error('保存角色失败')
  }
}

/**
 * 删除角色
 */
const deleteRole = async (role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 ${role.name} 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await permissionStore.deleteRole(role.id)
    ElMessage.success('角色删除成功')
    
    // 如果删除的是当前选中的角色，清空选择
    if (selectedRole.value && selectedRole.value.id === role.id) {
      selectedRole.value = null
    }
    
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除角色失败')
    }
  }
}

/**
 * 处理权限选择变化
 */
const handlePermissionCheck = (data, checked) => {
  // 权限选择变化处理逻辑
}

/**
 * 保存角色权限
 */
const saveRolePermissions = async () => {
  if (!selectedRole.value || !permissionTree.value) return
  
  try {
    const checkedKeys = permissionTree.value.getCheckedKeys()
    await permissionStore.saveRolePermissions(selectedRole.value.id, checkedKeys)
    ElMessage.success('权限保存成功')
  } catch (error) {
    ElMessage.error('保存权限失败')
  }
}
</script>

<style scoped>
.role-management {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.role-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.node-actions {
  display: none;
}

.role-node:hover .node-actions {
  display: block;
}

.permission-node {
  display: flex;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}
</style>
```

## 状态管理 (Pinia Store)

```javascript
// src/stores/permission.js

import { defineStore } from 'pinia'
import { permissionApi } from '@/api/permission'

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    /** 用户列表 */
    users: [],
    /** 角色列表 */
    roles: [],
    /** 角色树结构 */
    roleTree: [],
    /** 权限列表 */
    permissions: [],
    /** 权限树结构 */
    permissionTree: [],
    /** 当前登录用户信息 */
    currentUser: null,
    /** 当前用户权限 */
    userPermissions: [],
    /** 登录token */
    token: localStorage.getItem('token') || ''
  }),

  getters: {
    /**
     * 是否已登录
     */
    isLoggedIn: (state) => !!state.token,
    
    /**
     * 检查是否有指定权限
     */
    hasPermission: (state) => (permissionCode) => {
      return state.userPermissions.some(p => p.code === permissionCode)
    },
    
    /**
     * 检查是否有指定角色
     */
    hasRole: (state) => (roleCode) => {
      return state.currentUser?.roles?.some(r => r.code === roleCode) || false
    }
  },

  actions: {
    /**
     * 用户登录
     * @param {Object} loginData - 登录数据
     */
    async login(loginData) {
      try {
        const response = await permissionApi.login(loginData)
        const { token, user } = response.data
        
        this.token = token
        this.currentUser = user
        localStorage.setItem('token', token)
        
        // 加载用户权限
        await this.loadUserPermissions()
        
        return response
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    /**
     * 用户登出
     */
    async logout() {
      try {
        await permissionApi.logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        this.token = ''
        this.currentUser = null
        this.userPermissions = []
        localStorage.removeItem('token')
      }
    },

    /**
     * 加载用户列表
     */
    async loadUsers() {
      try {
        const response = await permissionApi.getUsers()
        this.users = response.data
      } catch (error) {
        console.error('加载用户列表失败:', error)
        throw error
      }
    },

    /**
     * 添加用户
     * @param {Object} userData - 用户数据
     */
    async addUser(userData) {
      try {
        const response = await permissionApi.addUser(userData)
        return response.data
      } catch (error) {
        console.error('添加用户失败:', error)
        throw error
      }
    },

    /**
     * 更新用户
     * @param {Object} userData - 用户数据
     */
    async updateUser(userData) {
      try {
        const response = await permissionApi.updateUser(userData)
        return response.data
      } catch (error) {
        console.error('更新用户失败:', error)
        throw error
      }
    },

    /**
     * 删除用户
     * @param {number} userId - 用户ID
     */
    async deleteUser(userId) {
      try {
        await permissionApi.deleteUser(userId)
      } catch (error) {
        console.error('删除用户失败:', error)
        throw error
      }
    },

    /**
     * 更新用户状态
     * @param {number} userId - 用户ID
     * @param {boolean} enabled - 是否启用
     */
    async updateUserStatus(userId, enabled) {
      try {
        await permissionApi.updateUserStatus(userId, enabled)
      } catch (error) {
        console.error('更新用户状态失败:', error)
        throw error
      }
    },

    /**
     * 重置用户密码
     * @param {number} userId - 用户ID
     */
    async resetUserPassword(userId) {
      try {
        const response = await permissionApi.resetUserPassword(userId)
        return response.data.newPassword
      } catch (error) {
        console.error('重置用户密码失败:', error)
        throw error
      }
    },

    /**
     * 加载角色列表
     */
    async loadRoles() {
      try {
        const response = await permissionApi.getRoles()
        this.roles = response.data
        this.roleTree = this.buildRoleTree(response.data)
      } catch (error) {
        console.error('加载角色列表失败:', error)
        throw error
      }
    },

    /**
     * 添加角色
     * @param {Object} roleData - 角色数据
     */
    async addRole(roleData) {
      try {
        const response = await permissionApi.addRole(roleData)
        return response.data
      } catch (error) {
        console.error('添加角色失败:', error)
        throw error
      }
    },

    /**
     * 更新角色
     * @param {Object} roleData - 角色数据
     */
    async updateRole(roleData) {
      try {
        const response = await permissionApi.updateRole(roleData)
        return response.data
      } catch (error) {
        console.error('更新角色失败:', error)
        throw error
      }
    },

    /**
     * 删除角色
     * @param {number} roleId - 角色ID
     */
    async deleteRole(roleId) {
      try {
        await permissionApi.deleteRole(roleId)
      } catch (error) {
        console.error('删除角色失败:', error)
        throw error
      }
    },

    /**
     * 加载权限列表
     */
    async loadPermissions() {
      try {
        const response = await permissionApi.getPermissions()
        this.permissions = response.data
        this.permissionTree = this.buildPermissionTree(response.data)
      } catch (error) {
        console.error('加载权限列表失败:', error)
        throw error
      }
    },

    /**
     * 获取角色权限
     * @param {number} roleId - 角色ID
     */
    async getRolePermissions(roleId) {
      try {
        const response = await permissionApi.getRolePermissions(roleId)
        return response.data
      } catch (error) {
        console.error('获取角色权限失败:', error)
        throw error
      }
    },

    /**
     * 保存角色权限
     * @param {number} roleId - 角色ID
     * @param {Array} permissionIds - 权限ID列表
     */
    async saveRolePermissions(roleId, permissionIds) {
      try {
        await permissionApi.saveRolePermissions(roleId, permissionIds)
      } catch (error) {
        console.error('保存角色权限失败:', error)
        throw error
      }
    },

    /**
     * 加载当前用户权限
     */
    async loadUserPermissions() {
      try {
        const response = await permissionApi.getUserPermissions()
        this.userPermissions = response.data
      } catch (error) {
        console.error('加载用户权限失败:', error)
        throw error
      }
    },

    /**
     * 构建角色树结构
     * @param {Array} roles - 角色列表
     */
    buildRoleTree(roles) {
      const roleMap = new Map()
      const rootRoles = []
      
      // 创建角色映射
      roles.forEach(role => {
        roleMap.set(role.id, { ...role, children: [] })
      })
      
      // 构建树结构
      roles.forEach(role => {
        const roleNode = roleMap.get(role.id)
        if (role.parentId) {
          const parent = roleMap.get(role.parentId)
          if (parent) {
            parent.children.push(roleNode)
          }
        } else {
          rootRoles.push(roleNode)
        }
      })
      
      return rootRoles
    },

    /**
     * 构建权限树结构
     * @param {Array} permissions - 权限列表
     */
    buildPermissionTree(permissions) {
      const permissionMap = new Map()
      const rootPermissions = []
      
      // 创建权限映射
      permissions.forEach(permission => {
        permissionMap.set(permission.id, { ...permission, children: [] })
      })
      
      // 构建树结构
      permissions.forEach(permission => {
        const permissionNode = permissionMap.get(permission.id)
        if (permission.parentId) {
          const parent = permissionMap.get(permission.parentId)
          if (parent) {
            parent.children.push(permissionNode)
          }
        } else {
          rootPermissions.push(permissionNode)
        }
      })
      
      return rootPermissions
    }
  }
})
```

## API接口设计

```javascript
// src/api/permission.js

import request from '@/utils/request'

/**
 * 权限管理相关API
 */
export const permissionApi = {
  /**
   * 用户登录
   * @param {Object} loginData - 登录数据
   */
  login(loginData) {
    return request({
      url: '/api/urule/auth/login',
      method: 'post',
      data: loginData
    })
  },

  /**
   * 用户登出
   */
  logout() {
    return request({
      url: '/api/urule/auth/logout',
      method: 'post'
    })
  },

  /**
   * 获取用户列表
   */
  getUsers() {
    return request({
      url: '/api/urule/users',
      method: 'get'
    })
  },

  /**
   * 添加用户
   * @param {Object} userData - 用户数据
   */
  addUser(userData) {
    return request({
      url: '/api/urule/users',
      method: 'post',
      data: userData
    })
  },

  /**
   * 更新用户
   * @param {Object} userData - 用户数据
   */
  updateUser(userData) {
    return request({
      url: `/api/urule/users/${userData.id}`,
      method: 'put',
      data: userData
    })
  },

  /**
   * 删除用户
   * @param {number} userId - 用户ID
   */
  deleteUser(userId) {
    return request({
      url: `/api/urule/users/${userId}`,
      method: 'delete'
    })
  },

  /**
   * 更新用户状态
   * @param {number} userId - 用户ID
   * @param {boolean} enabled - 是否启用
   */
  updateUserStatus(userId, enabled) {
    return request({
      url: `/api/urule/users/${userId}/status`,
      method: 'put',
      data: { enabled }
    })
  },

  /**
   * 重置用户密码
   * @param {number} userId - 用户ID
   */
  resetUserPassword(userId) {
    return request({
      url: `/api/urule/users/${userId}/resetPassword`,
      method: 'post'
    })
  },

  /**
   * 获取角色列表
   */
  getRoles() {
    return request({
      url: '/api/urule/roles',
      method: 'get'
    })
  },

  /**
   * 添加角色
   * @param {Object} roleData - 角色数据
   */
  addRole(roleData) {
    return request({
      url: '/api/urule/roles',
      method: 'post',
      data: roleData
    })
  },

  /**
   * 更新角色
   * @param {Object} roleData - 角色数据
   */
  updateRole(roleData) {
    return request({
      url: `/api/urule/roles/${roleData.id}`,
      method: 'put',
      data: roleData
    })
  },

  /**
   * 删除角色
   * @param {number} roleId - 角色ID
   */
  deleteRole(roleId) {
    return request({
      url: `/api/urule/roles/${roleId}`,
      method: 'delete'
    })
  },

  /**
   * 获取权限列表
   */
  getPermissions() {
    return request({
      url: '/api/urule/permissions',
      method: 'get'
    })
  },

  /**
   * 获取角色权限
   * @param {number} roleId - 角色ID
   */
  getRolePermissions(roleId) {
    return request({
      url: `/api/urule/roles/${roleId}/permissions`,
      method: 'get'
    })
  },

  /**
   * 保存角色权限
   * @param {number} roleId - 角色ID
   * @param {Array} permissionIds - 权限ID列表
   */
  saveRolePermissions(roleId, permissionIds) {
    return request({
      url: `/api/urule/roles/${roleId}/permissions`,
      method: 'post',
      data: { permissionIds }
    })
  },

  /**
   * 获取当前用户权限
   */
  getUserPermissions() {
    return request({
      url: '/api/urule/auth/permissions',
      method: 'get'
    })
  }
}
```

## 路由守卫配置

```javascript
// src/router/guards/permission.js

import { usePermissionStore } from '@/stores/permission'
import { ElMessage } from 'element-plus'

/**
 * 权限路由守卫
 */
export const setupPermissionGuard = (router) => {
  router.beforeEach(async (to, from, next) => {
    const permissionStore = usePermissionStore()
    
    // 检查是否需要登录
    if (to.meta.requiresAuth && !permissionStore.isLoggedIn) {
      ElMessage.warning('请先登录')
      next('/login')
      return
    }
    
    // 检查权限
    if (to.meta.permission && !permissionStore.hasPermission(to.meta.permission)) {
      ElMessage.error('没有访问权限')
      next('/403')
      return
    }
    
    // 检查角色
    if (to.meta.role && !permissionStore.hasRole(to.meta.role)) {
      ElMessage.error('角色权限不足')
      next('/403')
      return
    }
    
    next()
  })
}
```

## 测试要点

### 1. 功能测试
- [ ] 用户登录/登出功能
- [ ] 用户管理CRUD操作
- [ ] 角色管理CRUD操作
- [ ] 权限分配功能
- [ ] 权限验证机制
- [ ] 密码重置功能
- [ ] 用户状态管理

### 2. 安全测试
- [ ] SQL注入防护
- [ ] XSS攻击防护
- [ ] CSRF攻击防护
- [ ] 权限绕过测试
- [ ] 会话管理安全
- [ ] 密码安全策略

### 3. 性能测试
- [ ] 大量用户数据加载
- [ ] 权限检查性能
- [ ] 并发登录测试
- [ ] 内存泄漏检查

## 风险评估

### 高风险
- **权限绕过**: 前端权限控制可能被绕过，需要后端严格验证
- **会话安全**: Token管理和会话超时处理

### 中风险
- **数据一致性**: 用户、角色、权限数据的一致性维护
- **性能问题**: 大量权限数据的加载和检查性能

### 低风险
- **UI交互**: 基于Element Plus的界面实现相对简单
- **数据展示**: 表格和树形组件的数据展示

## 预计工作量
- **总工作量**: 30小时
- **用户管理模块**: 10小时
- **角色管理模块**: 8小时
- **权限管理模块**: 8小时
- **登录认证模块**: 4小时

## 迁移优先级
**优先级**: 高

权限管理是系统安全的基础，建议在项目初期就完成基础的登录认证功能，然后在其他模块开发过程中逐步完善用户和权限管理功能。