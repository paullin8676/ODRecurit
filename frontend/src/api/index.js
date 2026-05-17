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

export const businessLineApi = {
  getAll: (params) => api.get('/business-lines', { params }),
  getById: (id) => api.get(`/business-lines/${id}`),
  create: (data) => api.post('/business-lines', data),
  update: (id, data) => api.put(`/business-lines/${id}`, data),
  delete: (id) => api.delete(`/business-lines/${id}`)
}

export const examPaperApi = {
  getAll: (params) => api.get('/exam-papers', { params }),
  getById: (id) => api.get(`/exam-papers/${id}`),
  create: (data) => api.post('/exam-papers', data),
  update: (id, data) => api.put(`/exam-papers/${id}`, data),
  delete: (id) => api.delete(`/exam-papers/${id}`)
}

export const candidateApi = {
  getAll: (params) => {
    // 处理数组参数，转为逗号分隔的字符串
    const processedParams = { ...params };
    if (processedParams.stages && Array.isArray(processedParams.stages)) {
      processedParams.stages = processedParams.stages.join(',');
    }
    return api.get('/candidates', { params: processedParams });
  },
  getById: (id) => api.get(`/candidates/${id}`),
  create: (data) => api.post('/candidates', data),
  update: (id, data) => api.put(`/candidates/${id}`, data),
  advance: (id, data) => api.put(`/candidates/${id}/advance`, data),
  rollback: (id, data) => api.put(`/candidates/${id}/rollback`, data),
  delete: (id) => api.delete(`/candidates/${id}`),
  getAvailableBusinessLines: (id) => api.get(`/candidates/${id}/available-business-lines`),
  canRecommend: (id) => api.get(`/candidates/${id}/can-recommend`),
  pushInterview: (id, data) => api.post(`/candidates/${id}/push-interview`, data)
}

export const employeeApi = {
  getAll: (params) => {
    // 处理数组参数，转为逗号分隔的字符串
    const processedParams = { ...params };
    if (processedParams.stages && Array.isArray(processedParams.stages)) {
      processedParams.stages = processedParams.stages.join(',');
    }
    return api.get('/employees', { params: processedParams });
  },
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
  summary: () => api.get('/statistics/summary'),
  getStageDurationRecords: (params) => api.get('/statistics/stage-duration-records', { params }),
  getStageDurationAgg: (params) => api.get('/statistics/stage-duration-agg', { params }),
  getCandidateTotalDurations: () => api.get('/statistics/candidate-total-durations'),
  getStageTrend: (params) => api.get('/statistics/stage-trend', { params }),
  getTotalFlowTrend: (params) => api.get('/statistics/total-flow-trend', { params })
}

export const examApi = {
  getAll: (params) => {
    // 处理数组参数，转为逗号分隔的字符串
    const processedParams = { ...params };
    if (processedParams.stages && Array.isArray(processedParams.stages)) {
      processedParams.stages = processedParams.stages.join(',');
    }
    return api.get('/exams', { params: processedParams });
  },
  getByCandidate: (candidateId) => api.get(`/exams/candidate/${candidateId}`),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  delete: (id) => api.delete(`/exams/${id}`)
}

export const testApi = {
  getAll: (params) => {
    // 处理数组参数，转为逗号分隔的字符串
    const processedParams = { ...params };
    if (processedParams.stages && Array.isArray(processedParams.stages)) {
      processedParams.stages = processedParams.stages.join(',');
    }
    return api.get('/tests', { params: processedParams });
  },
  getByCandidate: (candidateId) => api.get(`/tests/candidate/${candidateId}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/tests/${id}`)
}

export const interviewApi = {
  getAll: (params) => {
    // 处理数组参数，转为逗号分隔的字符串
    const processedParams = { ...params };
    if (processedParams.stages && Array.isArray(processedParams.stages)) {
      processedParams.stages = processedParams.stages.join(',');
    }
    return api.get('/interviews', { params: processedParams });
  },
  getByCandidate: (candidateId, params) => api.get(`/interviews/candidate/${candidateId}`, { params }),
  getById: (id) => api.get(`/interviews/${id}`),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  delete: (id) => api.delete(`/interviews/${id}`),
  // 新增的接口
  createRound: (data) => api.post('/interviews/rounds', data),
  updateRound: (id, data) => api.put(`/interviews/rounds/${id}`, data),
  advance: (interviewId, data) => api.post(`/interviews/advance/${interviewId}`, data)
}

export const stageConfigApi = {
  getAll: () => api.get('/stage-configs'),
  getByModule: (module) => api.get(`/stage-configs/${module}`),
  update: (module, data) => api.put(`/stage-configs/${module}`, data),
  create: (data) => api.post('/stage-configs', data),
  delete: (module) => api.delete(`/stage-configs/${module}`)
}
