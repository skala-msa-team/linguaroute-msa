import { defineStore } from 'pinia'
import { ref } from 'vue'
import { courseApi } from '@/api/course.js'
import { languageLabel, levelLabel, situationLabel, unwrapApiData } from '@/constants/domain.js'
import springImg from '@/assets/images/courses/spring_boot.png'

export const useCourseStore = defineStore('course', () => {
  const courses = ref([])
  const selectedCourse = ref(null)
  const loading = ref(false)
  const error = ref(null)

  function normalizeCourse(course) {
    if (!course || typeof course !== 'object') return course
    return {
      ...course,
      id: course.courseId ?? course.id,
      languageCode: course.language,
      levelCode: course.level,
      situationCode: course.situation,
      language: languageLabel(course.language),
      level: levelLabel(course.level),
      situation: situationLabel(course.situation),
      image: course.image || springImg,
      tone: course.tone || 'green',
    }
  }

  async function fetchCourses(params = {}) {
    loading.value = true
    error.value = null
    try {
      const payload = unwrapApiData(await courseApi.getAll(params))
      const rawCourses = Array.isArray(payload) ? payload : payload?.content ?? []
      courses.value = rawCourses.map(normalizeCourse)
    } catch (requestError) {
      error.value = requestError.response?.data?.message || requestError.message || '강의 목록을 불러오지 못했습니다.'
      courses.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchCourse(id) {
    loading.value = true
    error.value = null
    try {
      selectedCourse.value = normalizeCourse(unwrapApiData(await courseApi.getById(id)))
    } catch (requestError) {
      error.value = requestError.response?.data?.message || requestError.message || '강의 정보를 불러오지 못했습니다.'
      selectedCourse.value = null
    } finally {
      loading.value = false
    }
  }

  return { courses, selectedCourse, loading, error, normalizeCourse, fetchCourses, fetchCourse }
})
