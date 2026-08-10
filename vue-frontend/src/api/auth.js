import api from './index.js'

export const authApi = {
  login(email, password) { return api.post('/api/auth/login', { email, password }) },

  // 내 정보 조회
  getMe() {
    return api.get('/api/users/me')
  },

  updateMe(name) { return api.patch('/api/users/me', { name }) },
  withdrawMe() { return api.delete('/api/users/me') },
  getMyCompany() { return api.get('/api/companies/me') },
  updateMyCompany(name) { return api.patch('/api/companies/me', { name }) },
  registerCompany(data) { return api.post('/api/companies', data) },
  registerEmployee(data) { return api.post('/api/employees/signup', data) },
  getActiveTerms() { return api.get('/api/terms/active') },
  agreeToTerms(agreementIds) { return api.post('/api/users/me/agreements', { agreementIds }) },
  requestEmailVerification(email) { return api.post('/api/auth/email-verifications', { email, purpose: 'SIGNUP' }) },
  confirmEmailVerification(email, verificationCode) { return api.post('/api/auth/email-verifications/confirm', { email, verificationCode }) },
  requestPasswordReset(email) { return api.post('/api/auth/password-reset/requests', { email }) },
  confirmPasswordReset(resetToken, newPassword) { return api.post('/api/auth/password-reset/confirm', { resetToken, newPassword }) },
  requestIdFind(name, businessNumber) { return api.post('/api/auth/id-find/requests', { name, businessNumber }) },
  changePassword(currentPassword, newPassword) { return api.put('/api/auth/password', { currentPassword, newPassword }) }
}
