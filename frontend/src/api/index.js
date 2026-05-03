import api from '../utils/api'

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (oldPassword, newPassword) =>
    api.post('/auth/change-password', { oldPassword, newPassword })
}

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
}

export const productLineApi = {
  getAll: (params) => api.get('/product-lines', { params }),
  getById: (id) => api.get(`/product-lines/${id}`),
  create: (data) => api.post('/product-lines', data),
  update: (id, data) => api.put(`/product-lines/${id}`, data),
  delete: (id) => api.delete(`/product-lines/${id}`)
}

export const examPaperApi = {
  getAll: (params) => api.get('/exam-papers', { params }),
  getById: (id) => api.get(`/exam-papers/${id}`),
  create: (data) => api.post('/exam-papers', data),
  update: (id, data) => api.put(`/exam-papers/${id}`, data),
  delete: (id) => api.delete(`/exam-papers/${id}`)
}

export const testTypeApi = {
  getAll: (params) => api.get('/test-types', { params }),
  getById: (id) => api.get(`/test-types/${id}`),
  create: (data) => api.post('/test-types', data),
  update: (id, data) => api.put(`/test-types/${id}`, data),
  delete: (id) => api.delete(`/test-types/${id}`)
}

export const examPassLineApi = {
  getAll: (params) => api.get('/exam-pass-lines', { params }),
  getById: (id) => api.get(`/exam-pass-lines/${id}`),
  create: (data) => api.post('/exam-pass-lines', data),
  update: (id, data) => api.put(`/exam-pass-lines/${id}`, data),
  delete: (id) => api.delete(`/exam-pass-lines/${id}`)
}

export const candidateApi = {
  getAll: (params) => api.get('/candidates', { params }),
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  advance: (id, data) => api.put(`/candidates/${id}/advance`, data),
  rollback: (id, data) => api.put(`/candidates/${id}/rollback`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  getAvailableProductLines: (id) => api.get(`/candidates/${id}/available-product-lines`),
  canRecommend: (id) => api.get(`/candidates/${id}/can-recommend`),
  pushInterview: (id, data) => api.post(`/candidates/${id}/push-interview`, data)
}

export const employeeApi = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  update: (id, data) => api.put(`/employees/${id}`, data),
  advance: (id, data) => api.put(`/employees/${id}/advance`, data),
  rollback: (id, data) => api.put(`/employees/${id}/rollback`, data),
  delete: (id) => api.delete(`/employees/${id}`)
}

export const statisticsApi = {
  byConsultant: (params) => api.get('/statistics/by-consultant', { params }),
  byStage: (params) => api.get('/statistics/by-stage', { params }),
  processEfficiency: (params) => api.get('/statistics/process-efficiency', { params }),
  summary: () => api.get('/statistics/summary')
}

export const examApi = {
  getAll: (params) => api.get('/exams', { params }),
  getByCandidate: (candidateId) => api.get(`/exams/candidate/${candidateId}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`)
}

export const testApi = {
  getAll: (params) => api.get('/tests', { params }),
  getByCandidate: (candidateId) => api.get(`/tests/candidate/${candidateId}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`)
}

export const interviewApi = {
  getAll: (params) => api.get('/interviews', { params }),
  getByCandidate: (candidateId, params) => api.get(`/interviews/candidate/${candidateId}`, { params }),
  getById: (id) => api.get(`/interviews/${id}`),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
  // 新增的接口
  createRound: (data) => api.post('/interviews/rounds', data),
  updateRound: (id, data) => api.put(`/interviews/rounds/${id}`, data),
  advance: (interviewId) => api.post(`/interviews/advance/${interviewId}`)
}

export const stageConfigApi = {
  getAll: () => api.get('/stage-configs'),
  getByModule: (module) => api.get(`/stage-configs/${module}`),
  update: (module, data) => api.put(`/stage-configs/${module}`, data),
  create: (data) => api.post('/stage-configs', data),
  delete: (module) => api.delete(`/stage-configs/${module}`)
}
