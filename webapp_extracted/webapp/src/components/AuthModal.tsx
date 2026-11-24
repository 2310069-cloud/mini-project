import React, { useState } from 'react'
import { ShieldCheck, User, Lock, Mail, Phone, Building, AlertCircle, CheckCircle, X } from 'lucide-react'
import { useSoc } from '../context/SocContext'
import type { EmployeeRegistrationPayload } from '../lib/api'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useSoc()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Login fields
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  // Register fields
  const [regForm, setRegForm] = useState<EmployeeRegistrationPayload>({
    employee_id: '',
    full_name: '',
    email: '',
    phone: '',
    department: '',
    password: '',
    confirm_password: '',
  })

  if (!open) return null

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!identifier.trim() || !password) {
      setError('Please provide your Employee ID or email, and password.')
      return
    }

    setLoading(true)
    try {
      await login(identifier.trim(), password)
      setSuccess('Successfully authenticated!')
      setTimeout(() => {
        onClose()
      }, 600)
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (regForm.employee_id.trim().length < 3) {
      setError('Employee ID must be at least 3 characters.')
      return
    }
    if (regForm.full_name.trim().length < 2) {
      setError('Full name is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (!/^[6-9]\d{9}$/.test(regForm.phone.trim())) {
      setError('Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.')
      return
    }
    if (regForm.department.trim().length < 2) {
      setError('Department / Role is required.')
      return
    }
    if (regForm.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (regForm.password !== regForm.confirm_password) {
      setError('Password confirmation does not match.')
      return
    }

    setLoading(true)
    try {
      await register({
        employee_id: regForm.employee_id.trim(),
        full_name: regForm.full_name.trim(),
        email: regForm.email.trim(),
        phone: regForm.phone.trim(),
        department: regForm.department.trim(),
        password: regForm.password,
        confirm_password: regForm.confirm_password,
      })
      setSuccess('Account created successfully! You can now sign in.')
      setIdentifier(regForm.employee_id.trim())
      setPassword('')
      setTimeout(() => {
        setMode('login')
        setSuccess(null)
      }, 1200)
    } catch (err: any) {
      setError(err?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-surface-2 border border-surface-border rounded-lg shadow-2xl w-full max-w-md overflow-hidden text-text-primary">
        {/* Header */}
        <div className="p-5 border-b border-surface-border flex items-center justify-between bg-surface-1">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold tracking-tight">
                {mode === 'login' ? 'Operator Sign In' : 'Register SOC Account'}
              </h2>
              <p className="text-[11.5px] text-text-muted">Adaptive SOC Local Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-surface-3 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-surface-border bg-surface-1/50 text-[13px] font-medium">
          <button
            onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'login'
                ? 'border-accent text-accent bg-surface-2'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              mode === 'register'
                ? 'border-accent text-accent bg-surface-2'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Register Employee
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded bg-sev-criticalBg border border-sev-critical/30 flex items-start gap-2.5 text-sev-critical text-[12px]">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded bg-status-successBg border border-status-success/30 flex items-start gap-2.5 text-status-success text-[12px]">
              <CheckCircle size={16} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Employee ID or Work Email
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-2.5 text-text-muted" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. EMP-001 or analyst@soc.lab"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded pl-9 pr-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-2.5 text-text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded pl-9 pr-3 py-2 text-[13px] text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-accent hover:bg-accent-dim text-white font-semibold text-[13px] py-2 px-4 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Console'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={regForm.employee_id}
                    onChange={(e) => setRegForm({ ...regForm, employee_id: e.target.value })}
                    placeholder="EMP-100"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={regForm.full_name}
                    onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                    placeholder="Jane Doe"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-2.5 top-2 text-text-muted" />
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="analyst@adaptive.lab"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded pl-8 pr-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    10-Digit Mobile
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-2.5 top-2 text-text-muted" />
                    <input
                      type="text"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                      placeholder="9876543210"
                      maxLength={10}
                      required
                      className="w-full bg-surface-3 border border-surface-borderLight rounded pl-8 pr-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent font-data"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Role / Dept
                  </label>
                  <div className="relative">
                    <Building size={14} className="absolute left-2.5 top-2 text-text-muted" />
                    <input
                      type="text"
                      value={regForm.department}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      placeholder="SOC Tier 1"
                      required
                      className="w-full bg-surface-3 border border-surface-borderLight rounded pl-8 pr-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min 8 chars"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-text-secondary mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={regForm.confirm_password}
                    onChange={(e) => setRegForm({ ...regForm, confirm_password: e.target.value })}
                    placeholder="Confirm"
                    required
                    className="w-full bg-surface-3 border border-surface-borderLight rounded px-2.5 py-1.5 text-[12.5px] text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-accent hover:bg-accent-dim text-white font-semibold text-[13px] py-2 px-4 rounded transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
