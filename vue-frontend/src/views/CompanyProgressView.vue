<template><AppShell><PageHeader eyebrow="Learning analytics" title="직원별 학습 현황" description="직원별 수강 상태와 서버에서 계산된 진도율을 비교하세요."><button class="button"><Download :size="16"/> 리포트 내보내기</button></PageHeader><section class="metric-grid"><article v-for="item in stats" :key="item.label" class="metric card"><div class="metric-head"><span>{{ item.label }}</span><span class="metric-icon"><component :is="item.icon" :size="17"/></span></div><div><strong class="metric-value">{{ item.value }}</strong><p class="trend">{{ item.desc }}</p></div></article></section><section class="panel analytics-panel"><div class="analytics-head"><div><h2>부서별 평균 진도율</h2><p>2026년 8월 기준</p></div><select class="select"><option>이번 달</option><option>최근 3개월</option></select></div><div class="department-bars"><div v-for="item in departments" :key="item.name"><span>{{ item.name }}</span><div class="progress"><span :style="`width:${item.value}%`"></span></div><b>{{ item.value }}%</b></div></div></section><section class="panel data-panel"><div class="table-toolbar"><div class="table-search"><Search :size="16"/><input placeholder="직원 검색"/></div><select class="select"><option>전체 부서</option><option>글로벌사업팀</option></select><select class="select"><option>전체 수강 상태</option><option>학습 중</option><option>완료</option></select></div><div class="table-wrap"><table class="data-table"><thead><tr><th>직원</th><th>부서</th><th>수강 중</th><th>완료 강의</th><th>평균 진도율</th><th>최근 학습</th><th>학습 상태</th></tr></thead><tbody><tr v-for="employee in employees" :key="employee.email"><td><div class="person"><span class="avatar">{{ employee.name[0] }}</span><span><strong>{{ employee.name }}</strong><span>{{ employee.email }}</span></span></div></td><td>{{ employee.team }}</td><td>{{ employee.courses }}개</td><td>{{ Math.max(employee.courses-1,0) }}개</td><td><div class="progress-cell"><div class="progress"><span :style="`width:${employee.progress}%`"></span></div><b>{{ employee.progress }}%</b></div></td><td>{{ employee.joined }}</td><td><span class="tag" :class="employee.progress<40?'amber':employee.progress>80?'blue':''">{{ employee.progress<40?'학습 정체':employee.progress>80?'완료 임박':'정상 학습' }}</span></td></tr></tbody></table></div></section></AppShell></template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import { Download,UsersRound,GraduationCap,ChartNoAxesCombined,Trophy,Search } from '@lucide/vue'
import AppShell from '@/components/AppShell.vue'
import PageHeader from '@/components/PageHeader.vue'
import { employees as mockEmployees } from '@/data/mockData.js'
import { companyApi } from '@/api/company.js'

const useLiveApi = import.meta.env.VITE_USE_LIVE_API === 'true'
const employees = ref(useLiveApi ? [] : mockEmployees)
const departments = computed(() => employees.value.map((employee) => ({ name: employee.name, value: employee.progress })))
const stats = computed(() => {
  const items = employees.value
  const average = items.length ? Math.round(items.reduce((sum, item) => sum + Number(item.progress), 0) / items.length) : 0
  return [
    { label: '학습 참여 직원', value: `${new Set(items.map((item) => item.userId || item.email)).size}명`, desc: '수강 기록 기준', icon: UsersRound },
    { label: '진행 중 수강', value: `${items.filter((item) => item.progress < 100).length}건`, desc: '서버 수강 상태 기준', icon: GraduationCap },
    { label: '평균 진도율', value: `${average}%`, desc: '서버 계산 진도율', icon: ChartNoAxesCombined },
    { label: '수료 강의', value: `${items.filter((item) => item.progress === 100).length}건`, desc: '완료 처리 기준', icon: Trophy }
  ]
})

onMounted(async () => {
  if (!useLiveApi) return
  try {
    const response = await companyApi.getEnrollmentProgress()
    const content = response.data.data.content
    employees.value = content.map((enrollment) => ({
      userId: enrollment.userId, name: `직원 #${enrollment.userId}`, email: `user-${enrollment.userId}`,
      team: '-', courses: 1, progress: Number(enrollment.progressRate),
      joined: enrollment.completedAt || enrollment.startedAt || enrollment.enrolledAt || '-', status: enrollment.status
    }))
  } catch (_) {
    employees.value = []
  }
})
</script>
<style scoped>.analytics-panel{display:grid;grid-template-columns:220px minmax(0,1fr);gap:26px;margin:12px 0}.analytics-head h2{font-size:15px}.analytics-head p{margin:4px 0 16px;color:var(--muted);font-size:9px}.analytics-head .select{width:130px;min-height:36px;font-size:9px}.department-bars{display:grid;gap:11px}.department-bars>div{display:grid;grid-template-columns:110px minmax(0,1fr) 35px;align-items:center;gap:10px}.department-bars>div>span{font-size:9px}.department-bars b{font-size:9px;text-align:right}.data-panel{padding:0;overflow:hidden}.table-toolbar{display:flex;gap:8px;padding:12px 16px;border-bottom:1px solid var(--line)}.table-search{width:230px;height:38px;display:flex;align-items:center;gap:8px;padding:0 10px;background:var(--surface-2);border-radius:9px;color:var(--muted)}.table-search input{min-width:0;background:transparent;border:0;outline:0;font-size:10px}.table-toolbar .select{width:132px;min-height:38px;font-size:9px}.progress-cell{display:flex;align-items:center;gap:8px}.progress-cell .progress{width:80px}.progress-cell b{font-size:8px}@media(max-width:720px){.analytics-panel{grid-template-columns:1fr}.table-toolbar{flex-wrap:wrap}.table-search{width:100%}}</style>
