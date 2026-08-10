<template>
  <div class="auth-page">
    <section class="auth-aside">
      <BrandLogo />
      <div class="aside-copy"><p class="eyebrow">Welcome back</p><h1>배움의 다음 경로가<br>기다리고 있어요.</h1><p>오늘도 작은 한 걸음으로 글로벌 역량을 이어가세요.</p></div>
      <div class="mini-route"><span class="route-node done"><Check :size="15" /></span><div><strong>나의 목표 설정</strong><small>글로벌 고객 미팅 준비</small></div><span class="route-line"></span><span class="route-node"><BookOpen :size="15" /></span><div><strong>오늘의 학습</strong><small>3차시 · 제품 가치 설명</small></div></div>
      <p class="quote">“개인의 목표와 회사의 성장이<br>같은 방향으로 이어지는 경험”</p>
    </section>
    <main class="auth-main">
      <router-link to="/" class="back"><ArrowLeft :size="16" /> 홈으로</router-link>
      <div class="auth-card animate-in">
        <div><p class="eyebrow">Sign in</p><h2>LinguaRoute 로그인</h2><p class="muted">회사에서 사용하는 이메일로 로그인하세요.</p></div>
        <div v-if="reasonMessage" class="login-notice"><TriangleAlert :size="17" />{{ reasonMessage }}</div>
        <form class="form-stack" @submit.prevent="login">
          <template v-if="!useLiveApi"><div class="field"><label for="email">이메일</label><div class="input-with-icon"><Mail :size="17" /><input id="email" v-model.trim="email" class="input" type="email" autocomplete="username" required /></div></div><div class="field"><div class="label-row"><label for="password">비밀번호</label><router-link to="/account/recovery">비밀번호를 잊으셨나요?</router-link></div><div class="input-with-icon"><LockKeyhole :size="17" /><input id="password" v-model="password" class="input" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required /><button type="button" aria-label="비밀번호 표시" @click="showPassword=!showPassword"><Eye :size="17" /></button></div></div><label class="check-row"><input type="checkbox" checked /> 로그인 상태 유지</label></template>
          <p v-else class="muted">계정 정보는 다음 Auth Server 로그인 화면에서 입력합니다.</p>
          <div v-if="loginError" class="login-notice"><TriangleAlert :size="17" />{{ loginError }}</div>
          <button class="button primary" type="submit" :disabled="isSubmitting">{{ isSubmitting ? '로그인 중...' : '로그인' }} <ArrowRight :size="17" /></button>
        </form>
        <div class="auth-divider"><span>처음이신가요?</span></div>
        <div class="signup-links"><router-link to="/signup/company"><Building2 :size="18" /><span><strong>기업 관리자 가입</strong><small>새로운 기업 학습 공간 만들기</small></span><ChevronRight :size="17" /></router-link><router-link to="/signup/employee"><TicketCheck :size="18" /><span><strong>직원 가입</strong><small>초대코드로 학습 공간 참여하기</small></span><ChevronRight :size="17" /></router-link></div>
        <router-link class="find-id" to="/account/recovery?tab=id">아이디 찾기</router-link>
      </div>
    </main>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { Check, BookOpen, ArrowLeft, Mail, LockKeyhole, Eye, ArrowRight, Building2, TicketCheck, ChevronRight, TriangleAlert } from '@lucide/vue'
import BrandLogo from '@/components/BrandLogo.vue'
const showPassword=ref(false)
const email=ref('employee@scalatech.co.kr'),password=ref('Password123!'),loginError=ref(''),isSubmitting=ref(false)
const route=useRoute(),router=useRouter(),auth=useAuthStore(); const useLiveApi=import.meta.env.VITE_USE_LIVE_API==='true'
const reasonMessage=computed(()=>route.query.reason==='session-expired'?'Access Token이 만료되었습니다. 다시 로그인해 주세요.':route.query.reason==='user-inactive'?'비활성 또는 탈퇴 계정은 서비스를 이용할 수 없습니다.':'')
const homeByRole={PLATFORM_ADMIN:'/admin',COMPANY_ADMIN:'/company',EMPLOYEE:'/app'}
async function login(){
  loginError.value=''
  if(!useLiveApi){router.push('/app');return}
  isSubmitting.value=true
  try{
    auth.startOAuthLogin()
  }catch(error){
    loginError.value=error.response?.data?.message||'이메일 또는 비밀번호를 확인해 주세요.'
  }finally{isSubmitting.value=false}
}
</script>
<style scoped>
.auth-page{min-height:100vh;display:grid;grid-template-columns:minmax(380px,43%) 1fr;background:var(--surface)}.auth-aside{position:relative;display:flex;flex-direction:column;padding:42px 9vw 50px 5vw;overflow:hidden;color:white;background:var(--forest)}.auth-aside::after{position:absolute;right:-150px;bottom:-170px;width:430px;height:430px;content:'';border:1px solid rgba(200,243,107,.25);border-radius:50%;box-shadow:0 0 0 70px rgba(200,243,107,.05),0 0 0 140px rgba(200,243,107,.035)}.auth-aside :deep(.brand-name){color:white}.auth-aside :deep(.brand-name span){color:var(--lime)}.aside-copy{margin:auto 0 40px}.aside-copy .eyebrow{color:var(--lime)}.aside-copy h1{margin:18px 0;font-family:var(--font-display);font-size:clamp(38px,4vw,56px);line-height:1.08;letter-spacing:-.055em}.aside-copy>p:last-child{max-width:390px;color:#b7ccbf;font-size:14px}.mini-route{position:relative;z-index:1;display:grid;grid-template-columns:auto 1fr;gap:11px 14px;padding:20px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:17px}.mini-route strong,.mini-route small{display:block}.mini-route strong{font-size:12px}.mini-route small{color:#91ad9c;font-size:10px}.route-node{width:30px;height:30px;display:grid;place-items:center;color:var(--lime);background:rgba(200,243,107,.1);border-radius:50%}.route-node.done{color:var(--ink);background:var(--lime)}.route-line{position:absolute;top:50px;left:34px;width:1px;height:14px;background:rgba(200,243,107,.4)}.quote{position:relative;z-index:1;margin-top:28px;color:#91ad9c;font-size:11px;line-height:1.7}.auth-main{position:relative;display:grid;place-items:center;padding:70px 28px;background:var(--paper)}.back{position:absolute;top:30px;right:34px;display:flex;align-items:center;gap:7px;color:var(--muted);font-size:12px}.auth-card{width:min(440px,100%);display:grid;gap:25px}.auth-card h2{margin:10px 0 7px;font-family:var(--font-display);font-size:30px;letter-spacing:-.04em}.input-with-icon{position:relative}.input-with-icon>svg{position:absolute;top:15px;left:14px;z-index:1;color:var(--subtle)}.input-with-icon .input{padding-left:42px}.input-with-icon button{position:absolute;top:11px;right:10px;width:30px;height:30px;display:grid;place-items:center;color:var(--subtle);background:transparent}.label-row{display:flex;justify-content:space-between}.label-row a{color:var(--forest-2);font-size:11px;font-weight:700}.check-row{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:11px}.auth-card .button{width:100%}.auth-divider{display:flex;align-items:center;gap:12px;color:var(--subtle);font-size:10px}.auth-divider::before,.auth-divider::after{height:1px;flex:1;content:'';background:var(--line)}.signup-links{display:grid;grid-template-columns:1fr 1fr;gap:9px}.signup-links a{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:12px;color:var(--forest-2);background:var(--surface);border:1px solid var(--line);border-radius:12px}.signup-links strong,.signup-links small{display:block}.signup-links strong{color:var(--ink);font-size:11px}.signup-links small{margin-top:2px;color:var(--muted);font-size:8px}.find-id{margin-top:-12px;color:var(--muted);font-size:11px;text-align:center;text-decoration:underline}
.login-notice{display:flex;align-items:center;gap:8px;padding:12px;color:var(--danger);background:var(--danger-soft);border-radius:10px;font-size:10px}
@media(max-width:820px){.auth-page{grid-template-columns:1fr}.auth-aside{display:none}.auth-main{min-height:100vh;padding:75px 24px 40px}}@media(max-width:480px){.signup-links{grid-template-columns:1fr}}
</style>
