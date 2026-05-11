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
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'candidates',
        name: 'Candidates',
        component: () => import('../views/Candidates.vue')
      },
      {
        path: 'employee-management',
        name: 'Employees',
        component: () => import('../views/Employees.vue')
      },
      {
        path: 'candidates/:id',
        name: 'CandidateDetail',
        component: () => import('../views/CandidateDetail.vue'),
        props: true
      },
      {
        path: 'exam-stage',
        name: 'ExamStage',
        component: () => import('../views/ExamStage.vue')
      },
      {
        path: 'test-stage',
        name: 'TestStage',
        component: () => import('../views/TestStage.vue')
      },
      {
        path: 'interview-stage',
        name: 'InterviewStage',
        component: () => import('../views/InterviewStage.vue')
      },
      {
        path: 'settings/users',
        name: 'UserManagement',
        component: () => import('../views/UserManagement.vue')
      },
      {
        path: 'settings/business-lines',
        name: 'BusinessLineManagement',
        component: () => import('../views/BusinessLineManagement.vue')
      },
      {
        path: 'settings/exam-papers',
        name: 'ExamPaperManagement',
        component: () => import('../views/ExamPaperManagement.vue')
      },

      {
        path: 'stage-config',
        name: 'StageConfig',
        component: () => import('../views/StageConfig.vue')
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('../views/Statistics.vue')
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
  return true
})

export default router
