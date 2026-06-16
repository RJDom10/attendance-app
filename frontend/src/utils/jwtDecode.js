/**
 * Mini decodificador JWT — solo lee el payload (no verifica firma).
 * La verificación real la hace el backend.
 */
export function jwtDecode(token) {
  try {
    const base64 = token.split('.')[1]
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return {}
  }
}
