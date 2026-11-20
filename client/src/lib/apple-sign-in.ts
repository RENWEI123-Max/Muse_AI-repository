import { registerPlugin } from '@capacitor/core'

type AppleAuthorization = {
  identityToken: string
  email?: string
  givenName?: string
  familyName?: string
}

const AppleSignIn = registerPlugin<{ authorize(): Promise<AppleAuthorization> }>('AppleSignIn')

export function authorizeApple(): Promise<AppleAuthorization> {
  return AppleSignIn.authorize()
}
