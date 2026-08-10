import api from './index.js'

export const enrollmentApi = {
  getMyEnrollments() {
    return api.get('/api/enrollments/me').catch((error) => {
      if (error.response?.status === 404) return api.get('/api/enrollments/my')
      throw error
    })
  },
  enroll(courseId) {
    return api.post('/api/enrollments', { courseId })
  },
  getById(enrollmentId) {
    return api.get(`/api/enrollments/${enrollmentId}`)
  },
  startLesson(enrollmentId, lessonId) {
    return api.post(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/start`)
  },
  completeLesson(enrollmentId, lessonId) {
    return api.post(`/api/enrollments/${enrollmentId}/lessons/${lessonId}/complete`)
  },
  recommend(payload) {
    return api.post('/api/courses/recommendations', payload)
  },
  getLegacyRecommendations(userId) {
    return api.get(`/api/recommend/${userId}`)
  }
}
