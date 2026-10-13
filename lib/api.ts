const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

export const API_BASE_URL = configuredApiUrl.replace(/\/$/, "")

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
