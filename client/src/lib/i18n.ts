import { ref } from 'vue'
export const locale = ref<'en' | 'ko'>('en')
const en = {
  welcome: 'Welcome to MauGo', tagline: 'Read everyday stories. Share your own.',
  email: 'Continue with email', apple: 'Continue with Apple', newHere: 'New here?',
  create: 'Create an account', explore: 'Explore preview',
  firstHello: 'Your first hello is just one message. More begins when they reply.',
  terms: 'Terms of Service', privacy: 'Privacy Policy', home: 'MauGo Home',
  note: 'Interactive preview. No real account, email or password change.', back: 'Back',
  placeholder: 'Your little corner is waiting for you.'
}
// Only the welcome screen is translated in C1. Extend this dictionary in later tasks.
const ko: Partial<typeof en> = {
  welcome: 'MauGo에 오신 것을 환영해요', tagline: '일상의 이야기를 읽고 나만의 이야기를 나눠 보세요.',
  email: '이메일로 계속하기', apple: 'Apple로 계속하기', newHere: '처음 오셨나요?',
  create: '계정 만들기', explore: '미리보기 둘러보기',
  firstHello: '첫 인사는 한 번만 보내요. 답장이 오면 대화를 이어갈 수 있어요.'
}
export function t(key: keyof typeof en): string { return locale.value === 'ko' ? ko[key] ?? en[key] : en[key] }
