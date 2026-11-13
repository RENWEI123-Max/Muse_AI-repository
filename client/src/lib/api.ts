export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://127.0.0.1:3000')).replace(/\/$/, '')
export class ApiError extends Error { constructor(public status: number, message: string, public retryAfter = 0) { super(message) } }
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/${path.replace(/^\//, '')}`, { ...init, signal: init?.signal ?? AbortSignal.timeout(15000) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(response.status, data.message || `API ${response.status}`, Number(data.retryAfter || response.headers.get('Retry-After') || 0))
  return data as T
}
export const post = <T>(path: string, body: object, token?: string) => api<T>(path, {method:'POST', headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}, body:JSON.stringify(body)})
