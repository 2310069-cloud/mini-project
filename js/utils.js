/**
 * Adaptive SOC - shared utilities
 */
const Utils = (() => {
  function uuid() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function round(n, d = 1) {
    const f = 10 ** d;
    return Math.round(n * f) / f;
  }

  function fmtTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  }

  function fmtShortTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function severityRank(sev) {
    return { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 }[sev] ?? -1;
  }

  function severityColor(sev) {
    return {
      LOW: 'sev-low', MEDIUM: 'sev-medium', HIGH: 'sev-high', CRITICAL: 'sev-critical',
    }[sev] || 'sev-low';
  }

  function statusColor(st) {
    return {
      DETECTED: 'st-detected', ANALYZING: 'st-analyzing', CONTAINING: 'st-containing',
      CREDENTIAL_SECURITY: 'st-credential', VERIFYING: 'st-verifying',
      RESOLVED: 'st-resolved', ESCALATED: 'st-escalated',
    }[st] || 'st-detected';
  }

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** Cryptographically strong local temporary password generator. Never sent anywhere. */
  function generateTempPassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%^&*-_+=';
    const all = upper + lower + digits + symbols;
    const bytes = new Uint32Array(16);
    crypto.getRandomValues(bytes);
    let pw = '';
    pw += upper[bytes[0] % upper.length];
    pw += lower[bytes[1] % lower.length];
    pw += digits[bytes[2] % digits.length];
    pw += symbols[bytes[3] % symbols.length];
    for (let i = 4; i < 16; i++) pw += all[bytes[i] % all.length];
    // shuffle
    const arr = pw.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / 4294967295) * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------- Phone number validation --------------------
  function normalizePhone(raw) {
    let s = String(raw || '').replace(/[\s\-().]/g, '');
    // Only strip an India country-code prefix when it is unambiguous:
    // an explicit "+91" prefix, or a 12/13-digit string starting with "91"/"0"
    // followed by 10 digits. Never strip when the remainder would not be a
    // valid 10-digit number (avoids mangling genuine numbers like 9123456789).
    if (s.startsWith('+91') && s.length === 13) {
      s = s.slice(3);
    } else if (/^91\d{10}$/.test(s)) {
      s = s.slice(2);
    } else if (/^0\d{10}$/.test(s)) {
      s = s.slice(1);
    }
    return s;
  }

  function validatePhoneNumber(raw) {
    const cleaned = normalizePhone(raw);
    if (!/^\d{10}$/.test(cleaned)) {
      return { valid: false, reason: 'Enter a valid 10-digit mobile number.' };
    }
    if (!/^[6-9]/.test(cleaned)) {
      return { valid: false, reason: 'Mobile number must start with 6, 7, 8 or 9.' };
    }
    return { valid: true, cleaned };
  }

  return {
    uuid, nowIso, clamp, round, fmtTime, fmtShortTime,
    severityRank, severityColor, statusColor, escapeHtml,
    generateTempPassword, sleep, validatePhoneNumber,
  };
})();
