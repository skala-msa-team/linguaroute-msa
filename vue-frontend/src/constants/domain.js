export const LANGUAGE_OPTIONS = [
  { value: 'ENGLISH', label: '영어' },
  { value: 'JAPANESE', label: '일본어' },
  { value: 'CHINESE', label: '중국어' },
]

export const LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: '입문' },
  { value: 'ELEMENTARY', label: '초급' },
  { value: 'INTERMEDIATE', label: '중급' },
  { value: 'ADVANCED', label: '고급' },
]

export const SITUATION_OPTIONS = [
  { value: 'CUSTOMER_MEETING', label: '고객 미팅' },
  { value: 'PRESENTATION', label: '업무 발표' },
  { value: 'EMAIL', label: '이메일' },
  { value: 'BUSINESS_TRIP', label: '출장' },
  { value: 'DAILY_CONVERSATION', label: '일상 회화' },
]

export const USER_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'WITHDRAWN']
export const INVITATION_STATUS_OPTIONS = ['UNUSED', 'USED', 'EXPIRED', 'REVOKED']
export const COURSE_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE']
export const ENROLLMENT_STATUS_OPTIONS = ['ENROLLED', 'LEARNING', 'COMPLETED']
export const SUBSCRIPTION_STATUS_OPTIONS = ['PENDING', 'ACTIVE', 'CANCELED', 'EXPIRED']
export const PAYMENT_STATUS_OPTIONS = ['PENDING', 'SUCCESS', 'FAILED']

export const labelOf = (options, value) => options.find((option) => option.value === value)?.label ?? value
export const languageLabel = (value) => labelOf(LANGUAGE_OPTIONS, value)
export const levelLabel = (value) => labelOf(LEVEL_OPTIONS, value)
export const situationLabel = (value) => labelOf(SITUATION_OPTIONS, value)

export function unwrapApiData(response) {
  return response?.data?.data ?? response?.data ?? response
}

export function formatBusinessNumber(value = '') {
  const digits = String(value).replace(/\D/g, '').slice(0, 10)
  return digits.replace(/^(\d{3})(\d{2})(\d{0,5}).*$/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'))
}
