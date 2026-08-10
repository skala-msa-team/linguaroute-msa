import api from './index.js'

export const adminApi = {
  getUsers(params) { return api.get('/api/admin/users', { params }) },
  getCompanies(params) { return api.get('/api/admin/companies', { params }) },
  getPayments(params) { return api.get('/api/admin/payments', { params }) },
  getEnrollments(params) { return api.get('/api/admin/enrollments', { params }) },
}
