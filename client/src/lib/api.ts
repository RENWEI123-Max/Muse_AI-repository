// All backend requests share this entry point. No credentials belong in VITE_*.
export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/${path.replace(/^\//, '')}`, init)
  if (!response.ok) throw new Error(`API ${response.status}`)
  return response.json() as Promise<T>
}
