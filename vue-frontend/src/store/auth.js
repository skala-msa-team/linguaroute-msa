import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(sessionStorage.getItem('access_token') || null)
  const user = ref(JSON.parse(sessionStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!accessToken.value)
  const businessRole = computed(() => user.value?.businessRole ?? null)
  const isPlatformAdmin = computed(() => businessRole.value === 'PLATFORM_ADMIN')
  const isCompanyAdmin = computed(() => businessRole.value === 'COMPANY_ADMIN')
  const isEmployee = computed(() => businessRole.value === 'EMPLOYEE')
  const isActive = computed(() => user.value?.status === 'ACTIVE')

  function setToken(token) {
    accessToken.value = token
    sessionStorage.setItem('access_token', token)
  }

  function setUser(userData) {
    user.value = userData
    sessionStorage.setItem('user', JSON.stringify(userData))
  }

  async function fetchUser() {
    try {
      const res = await authApi.getMe()
      console.log('[AuthStore] /me response =', res.data)

      const userData = res?.data?.data ?? res?.data

      if (!userData || typeof userData !== 'object') {
        throw new Error('사용자 정보 형식이 올바르지 않습니다.')
      }

      setUser(userData)
      return userData
    } catch (error) {
      console.error('[AuthStore] 사용자 정보 조회 실패:', error)
      logout(false)
      throw error
    }
  }

  function logout(redirect = true) {
    accessToken.value = null
    user.value = null
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')

    if (redirect) {
      window.location.href = '/login'
    }
  }

  async function login(email, password) {
    const res = await authApi.login(email, password)
    const payload = res?.data?.data ?? res?.data
    const token = payload?.accessToken

    if (!token) {
      throw new Error('액세스 토큰을 받지 못했습니다.')
    }

    setToken(token)
    return fetchUser()
  }

  return {
    accessToken,
    user,
    isAuthenticated,
    businessRole,
    isPlatformAdmin,
    isCompanyAdmin,
    isEmployee,
    isActive,
    setToken,
    setUser,
    fetchUser,
    logout,
    login
  }
})
