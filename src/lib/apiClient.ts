export async function getBackendHealth() {
  try {
    const res = await fetch('/api/health')
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline, using client-side engine:', err)
  }
  return null
}

export async function getBackendMetrics() {
  try {
    const res = await fetch('/api/metrics')
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline, using client-side engine:', err)
  }
  return null
}

export async function getBackendEvents() {
  try {
    const res = await fetch('/api/events')
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline, using client-side store:', err)
  }
  return null
}

export async function clearBackendEvents() {
  try {
    const res = await fetch('/api/events', { method: 'DELETE' })
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline:', err)
  }
  return null
}

export async function syncAttackToBackend(status: string, attempts: number = 0) {
  try {
    const res = await fetch('/api/attack/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, attempts }),
    })
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline:', err)
  }
  return null
}

export async function getBackendAttackState() {
  try {
    const res = await fetch('/api/attack/state')
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline:', err)
  }
  return null
}

export async function postEventToBackend(eventData: any) {
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    })
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend offline:', err)
  }
  return null
}

export async function dispatchEmailViaBackend(emailData: {
  targetHost: string
  targetUser: string
  sourceIp: string
  threatScore: number
  wazuhRuleId: string
  recipients?: string[]
  subject?: string
  bodyText?: string
}) {
  try {
    const res = await fetch('/api/email/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    })
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend email dispatch offline:', err)
  }
  return null
}

export async function getEmailDispatchHistory() {
  try {
    const res = await fetch('/api/email/history')
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Backend email history offline:', err)
  }
  return null
}

export async function saveSmtpConfig(user: string, pass: string) {
  try {
    const res = await fetch('/api/email/smtp-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass }),
    })
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Failed to save SMTP config:', err)
  }
  return null
}

export async function getSmtpConfigStatus() {
  try {
    const res = await fetch('/api/email/smtp-config')
    if (res.ok) return await res.json()
  } catch (err) {
    console.debug('Failed to get SMTP config status:', err)
  }
  return null
}

