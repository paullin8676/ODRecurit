import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { permission: 'menu_dashboard' }
      },
      {
        path: 'candidates',
        name: 'Candidates',
        component: () => import('../views/Candidates.vue'),
        meta: { permission: 'menu_candidates' }
      },
      {
        path: 'employee-management',
        name: 'Employees',
        component: () => import('../views/Employees.vue'),
        meta: { permission: 'menu_employee' }
      },
      {
        path: 'candidates/:id',
        name: 'CandidateDetail',
        component: () => import('../views/CandidateDetail.vue'),
        props: true,
        meta: { permission: 'menu_candidates' }
      },
      {
        path: 'exam-stage',
        name: 'ExamStage',
        component: () => import('../views/ExamStage.vue'),
        meta: { permission: 'menu_exam' }
      },
      {
        path: 'test-stage',
        name: 'TestStage',
        component: () => import('../views/TestStage.vue'),
        meta: { permission: 'menu_test' }
      },
      {
        path: 'interview-stage',
        name: 'InterviewStage',
        component: () => import('../views/InterviewStage.vue'),
        meta: { permission: 'menu_interview' }
      },
      {
        path: 'settings/users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue'),
        meta: { permission: 'menu_users' }
      },
      {
        path: 'settings/business-lines',
        name: 'BusinessLineManagement',
        component: () => import('../views/BusinessLineManagement.vue'),
        meta: { permission: 'menu_business_lines' }
      },
      {
        path: 'settings/exam-papers',
        name: 'ExamPaperManagement',
        component: () => import('../views/ExamPaperManagement.vue'),
        meta: { permission: 'menu_exam_papers' }
      },
      {
        path: 'stage-config',
        name: 'StageConfig',
        component: () => import('../views/StageConfig.vue'),
        meta: { permission: 'menu_stage_config' }
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue'),
        meta: { permission: 'menu_statistics' }
      },
      {
        path: 'duration-analysis',
        name: 'DurationAnalysis',
        component: () => import('../views/DurationAnalysis.vue'),
        meta: { permission: 'menu_statistics_duration' }
      },
      {
        path: 'duration-records',
        name: 'DurationRecords',
        component: () => import('../views/DurationRecords.vue'),
        meta: { permission: 'menu_statistics_records' }
      },
      {
        path: 'settings/roles',
        name: 'RoleManagement',
        component: () => import('../views/RoleManagement.vue'),
        meta: { permission: 'menu_role_management' }
      },
      {
        path: 'settings/permissions',
        name: 'PermissionManagement',
        component: () => import('../views/PermissionManagement.vue'),
        meta: { permission: 'menu_permission_management' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()

  if (to.path === '/user-info' || to.path === '/change-password' || to.path === '/logout') {
    return false
  }

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    return '/login'
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    return '/'
  }

  if (to.meta.permission) {
    const permissions = authStore.permissions
    if (!permissions || permissions.length === 0) {
      return true
    }
    if (!authStore.hasPermission(to.meta.permission)) {
      if (to.path === '/' || to.path === '') {
        return false
      }
      return '/'
    }
  }

  return true
})

export default router
