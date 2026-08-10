import springImg from '@/assets/images/courses/spring_boot.png'
import vueImg from '@/assets/images/courses/vue_js.png'
import pythonImg from '@/assets/images/courses/python.png'
import dockerImg from '@/assets/images/courses/docker.png'
import genaiImg from '@/assets/images/courses/generative_ai.png'
import kubernetesImg from '@/assets/images/courses/kubernetes.png'

export const courses = [
  { id: 12, title: '해외 고객 미팅 영어', languageCode: 'ENGLISH', language: '영어', levelCode: 'INTERMEDIATE', level: '중급', situationCode: 'CUSTOMER_MEETING', situation: '고객 미팅', status: 'ACTIVE', duration: '4주 · 12차시', progress: 68, students: 284, image: springImg, tone: 'green', description: '회의의 시작부터 제품 설명, 이견 조율까지 실제 글로벌 미팅의 흐름으로 익히는 비즈니스 영어 과정입니다.' },
  { id: 13, title: '데이터 직군을 위한 실전 영어', languageCode: 'ENGLISH', language: '영어', levelCode: 'INTERMEDIATE', level: '중급', situationCode: 'PRESENTATION', situation: '업무 발표', status: 'ACTIVE', duration: '5주 · 16차시', progress: 24, students: 192, image: pythonImg, tone: 'blue', description: '분석 결과와 인사이트를 명확하게 전달하는 데이터 직군 맞춤 커뮤니케이션 과정입니다.' },
  { id: 14, title: '일본 출장 커뮤니케이션', languageCode: 'JAPANESE', language: '일본어', levelCode: 'ELEMENTARY', level: '초급', situationCode: 'BUSINESS_TRIP', situation: '출장', status: 'ACTIVE', duration: '6주 · 18차시', progress: 0, students: 146, image: vueImg, tone: 'amber', description: '첫 인사부터 일정 조율까지 일본 출장에 필요한 실무 표현을 단계적으로 학습합니다.' },
  { id: 15, title: '글로벌 개발팀 데일리 영어', languageCode: 'ENGLISH', language: '영어', levelCode: 'ELEMENTARY', level: '초급', situationCode: 'DAILY_CONVERSATION', situation: '일상 회화', status: 'ACTIVE', duration: '3주 · 10차시', progress: 92, students: 331, image: dockerImg, tone: 'purple', description: '업무 중 자주 나누는 짧은 대화와 상황 공유에 필요한 핵심 문장을 연습합니다.' },
  { id: 16, title: '중국 비즈니스 이메일 입문', languageCode: 'CHINESE', language: '중국어', levelCode: 'BEGINNER', level: '입문', situationCode: 'EMAIL', situation: '이메일', status: 'ACTIVE', duration: '4주 · 12차시', progress: 0, students: 98, image: kubernetesImg, tone: 'red', description: '중국 파트너에게 명확하고 정중하게 업무 내용을 전달하는 이메일 입문 과정입니다.' },
  { id: 17, title: 'AI 시대의 영어 프레젠테이션', languageCode: 'ENGLISH', language: '영어', levelCode: 'ADVANCED', level: '고급', situationCode: 'PRESENTATION', situation: '업무 발표', status: 'ACTIVE', duration: '5주 · 15차시', progress: 0, students: 213, image: genaiImg, tone: 'blue', description: '복잡한 기술과 AI 제품을 청중의 언어로 설득력 있게 풀어내는 발표 집중 과정입니다.' }
]

export const employees = [
  { name: '김민지', email: 'minji.kim@scalatech.co.kr', team: '글로벌사업팀', status: '활성', statusCode: 'ACTIVE', courses: 3, progress: 78, joined: '2026.07.12' },
  { name: '이준호', email: 'junho.lee@scalatech.co.kr', team: '개발플랫폼팀', status: '활성', statusCode: 'ACTIVE', courses: 2, progress: 54, joined: '2026.07.18' },
  { name: '박서연', email: 'seoyeon.park@scalatech.co.kr', team: '데이터전략팀', status: '활성', statusCode: 'ACTIVE', courses: 4, progress: 86, joined: '2026.07.22' },
  { name: '최도윤', email: 'doyun.choi@scalatech.co.kr', team: '프로덕트팀', status: '비활성', statusCode: 'INACTIVE', courses: 1, progress: 20, joined: '2026.06.03' },
  { name: '정하린', email: 'harin.jung@scalatech.co.kr', team: '해외영업팀', status: '활성', statusCode: 'ACTIVE', courses: 2, progress: 63, joined: '2026.08.01' }
]

export const invitations = [
  { code: 'A7K9-P2QM', status: '미사용', statusCode: 'UNUSED', expires: '2026.08.17', created: '2026.08.10' },
  { code: 'B4HF-91KR', status: '사용됨', statusCode: 'USED', expires: '2026.08.15', created: '2026.08.08' },
  { code: 'M8Q2-XC7L', status: '만료', statusCode: 'EXPIRED', expires: '2026.08.05', created: '2026.07.29' }
]

export const payments = [
  { id: 'PAY-8001', company: '스칼라테크', plan: 'Business 50 · 월간', amount: '₩299,000', date: '2026.08.10', status: '결제 완료', statusCode: 'SUCCESS' },
  { id: 'PAY-7998', company: '브릿지랩', plan: 'Business 100 · 연간', amount: '₩5,490,000', date: '2026.08.09', status: '결제 완료', statusCode: 'SUCCESS' },
  { id: 'PAY-7985', company: '노바웍스', plan: 'Business 50 · 월간', amount: '₩299,000', date: '2026.08.08', status: '결제 실패', statusCode: 'FAILED' },
  { id: 'PAY-7962', company: '이든소프트', plan: 'Business 30 · 월간', amount: '₩199,000', date: '2026.08.06', status: '결제 완료', statusCode: 'SUCCESS' }
]

export const companies = [
  { name: '스칼라테크', business: '123-45-67890', admin: '김관리', seats: '42 / 50', subscription: 'ACTIVE', joined: '2026.03.12' },
  { name: '브릿지랩', business: '245-17-90821', admin: '이수현', seats: '87 / 100', subscription: 'ACTIVE', joined: '2026.04.02' },
  { name: '노바웍스', business: '519-32-11209', admin: '박정우', seats: '29 / 50', subscription: 'PENDING', joined: '2026.05.21' },
  { name: '이든소프트', business: '654-80-33127', admin: '최예린', seats: '24 / 30', subscription: 'CANCELED', joined: '2026.06.10' }
]

export const lessons = [
  { id: 101, index: '01', title: '미팅 전, 관계를 여는 스몰토크', length: '18:24', status: '완료' },
  { id: 102, index: '02', title: '자연스럽게 안건 소개하기', length: '22:10', status: '완료' },
  { id: 103, index: '03', title: '제품의 핵심 가치를 설명하는 법', length: '26:05', status: '학습 중' },
  { id: 104, index: '04', title: '질문을 확인하고 정확히 답하기', length: '19:48', status: '대기' },
  { id: 105, index: '05', title: '이견을 조율하고 다음 단계 합의하기', length: '24:32', status: '대기' }
]
