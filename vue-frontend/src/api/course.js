import api from './index.js'

export const courseApi = {
  getCourses(params) {
    return api.get('/api/courses', { params })
  },

  getAll(params) {
    return api.get('/api/courses', { params })
  },

  getByLanguage(language) {
    return api.get('/api/courses', { params: { language } })
  },

  getById(id) {
    return api.get(`/api/courses/${id}`)
  },

  getLessons(courseId) {
    return api.get(`/api/courses/${courseId}/lessons`)
  },

  create(data) {
    return api.post('/api/admin/courses', data)
  },

  update(id, data) {
    return api.patch(`/api/admin/courses/${id}`, data)
  },

  updateStatus(id, status) {
    return api.patch(`/api/admin/courses/${id}/status`, { status })
  },

  createLesson(courseId, data) {
    return api.post(`/api/admin/courses/${courseId}/lessons`, data)
  }
}
