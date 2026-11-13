import { ref, watch } from 'vue'
export const locale = ref<'en' | 'ko'>(localStorage.getItem('maugo-language') === 'ko' ? 'ko' : 'en')
watch(locale, value => localStorage.setItem('maugo-language', value), {flush:'sync'})
const en = {
  settings: 'Settings', language: 'Language', notifications: 'Notifications', general: 'General',
  chooseLanguage: 'Choose the language that feels like home.', allowNotifications: 'Allow app notifications',
  incoming: 'Incoming letters', replies: 'Replies', system: 'System', haptics: 'Haptics',
  recommendations: 'Personalized recommendations', systemFont: 'Use system font',
  clearCache: 'Clear temporary cache', cacheConfirm: 'Clear temporary cache?',
  cacheNote: 'Your account, wallet, permissions, letters, messages and photos will be kept.',
  cacheCleared: 'No temporary cache is stored by this client.', cancel: 'Cancel',
  privacySettings: 'Privacy', profileVisibility: 'Profile visibility', unavailable: 'Unavailable',
  privacyUnavailable: 'Server visibility settings are not available yet. Your visibility has not been changed.',
  close: 'Close',
  welcome: 'Welcome to MauGo', tagline: 'Read everyday stories. Share your own.',
  email: 'Continue with email', apple: 'Continue with Apple', newHere: 'New here?',
  create: 'Create an account', explore: 'Explore preview',
  firstHello: 'Your first hello is just one message. More begins when they reply.',
  terms: 'Terms of Service', privacy: 'Privacy Policy', home: 'MauGo Home',
  note: 'Interactive preview. No real account, email or password change.', back: 'Back',
  placeholder: 'Your little corner is waiting for you.'
}
const ko: Partial<typeof en> = {
  settings: '설정', language: '언어', notifications: '알림', general: '일반',
  chooseLanguage: '편안한 언어를 선택해 주세요.', allowNotifications: '앱 알림 허용',
  incoming: '새 편지', replies: '답장', system: '시스템', haptics: '햅틱',
  recommendations: '맞춤 추천', systemFont: '시스템 글꼴 사용',
  clearCache: '임시 캐시 지우기', cacheConfirm: '임시 캐시를 지울까요?',
  cacheNote: '계정, 지갑, 권한, 편지, 메시지와 사진은 유지됩니다.',
  cacheCleared: '이 클라이언트에 저장된 임시 캐시가 없습니다.', cancel: '취소',
  privacySettings: '개인정보 보호', profileVisibility: '프로필 공개 범위', unavailable: '사용 불가',
  privacyUnavailable: '서버 공개 범위 설정을 아직 사용할 수 없습니다. 공개 범위는 변경되지 않았습니다.',
  close: '닫기', terms: '이용약관', privacy: '개인정보 처리방침', home: 'MauGo 홈', back: '뒤로',
  welcome: 'MauGo에 오신 것을 환영해요', tagline: '일상의 이야기를 읽고 나만의 이야기를 나눠 보세요.',
  email: '이메일로 계속하기', apple: 'Apple로 계속하기', newHere: '처음 오셨나요?',
  create: '계정 만들기', explore: '미리보기 둘러보기',
  firstHello: '첫 인사는 한 번만 보내요. 답장이 오면 대화를 이어갈 수 있어요.'
}
export function t(key: keyof typeof en): string { return locale.value === 'ko' ? ko[key] ?? en[key] : en[key] }
