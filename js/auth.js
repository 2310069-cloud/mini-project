/** Adaptive SOC authentication backed by the local FastAPI service. */
const Auth = (() => {
  const SESSION_KEY = 'soc_session_token';

  // -------------------- Session --------------------
  let currentUser = null;
  let sessionToken = null;

  function getCurrentUser() {
    return currentUser;
  }

  function saveSession(employee, token) {
    currentUser = employee;
    sessionToken = token;
    try { localStorage.setItem(SESSION_KEY, token); } catch (_) { /* ignore */ }
  }

  function clearSession() {
    currentUser = null;
    sessionToken = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (_) { /* ignore */ }
  }

  /** Attempts to restore a previous session from localStorage. Returns the employee or null. */
  async function restoreSession() {
    let id = null;
    try { id = localStorage.getItem(SESSION_KEY); } catch (_) { id = null; }
    if (!id) return null;
    try {
      const result = await Tables.restoreAuthSession(id);
      if (result && result.user) {
        currentUser = result.user;
        sessionToken = id;
        return result.user;
      }
    } catch (_) { /* expired or invalid session */ }
    clearSession();
    return null;
  }

  // -------------------- Validation --------------------
  function validateRegistration({ employeeId, fullName, email, phone, department, password, confirmPassword }) {
    const errors = {};
    if (!employeeId || employeeId.trim().length < 3) errors.employeeId = 'Enter a valid Employee ID (min 3 characters).';
    if (!fullName || fullName.trim().length < 2) errors.fullName = 'Enter your full name.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Enter a valid email address.';
    const phoneCheck = Utils.validatePhoneNumber(phone);
    if (!phoneCheck.valid) errors.phone = phoneCheck.reason;
    if (!department || department.trim().length < 2) errors.department = 'Enter a role / department.';
    if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) errors.confirmPassword = 'Password confirmation does not match.';
    return { errors, phoneCleaned: phoneCheck.valid ? phoneCheck.cleaned : null };
  }

  async function register(fields) {
    const { errors, phoneCleaned } = validateRegistration(fields);
    if (Object.keys(errors).length) return { ok: false, errors };
    const result = await Tables.registerAccount({
      employee_id: fields.employeeId.trim(),
      full_name: fields.fullName.trim(),
      email: fields.email.trim(),
      phone: phoneCleaned,
      department: fields.department.trim(),
      password: fields.password,
      confirm_password: fields.confirmPassword,
    });
    return { ok: true, employee: result.user };
  }

  async function login({ identifier, password }) {
    if (!identifier || !identifier.trim()) return { ok: false, error: 'Enter your Employee ID or work email.' };
    if (!password) return { ok: false, error: 'Enter your password.' };
    const result = await Tables.loginAccount({ identifier: identifier.trim(), password });
    saveSession(result.user, result.token);
    return { ok: true, employee: result.user };
  }

  function logout() {
    const token = sessionToken;
    clearSession();
    return token ? Tables.logoutAccount(token).catch(() => null) : Promise.resolve(null);
  }

  return {
    getCurrentUser, restoreSession, register, login, logout,
    validateRegistration,
  };
})();

/**
 * AuthUI — renders the Login / Register screens into #app-root (replacing
 * the dashboard shell entirely while unauthenticated) and wires up form
 * handling, live phone-validation feedback, and switching between the two
 * forms.
 */
const AuthUI = (() => {
  function shellHtml(bodyHtml) {
    return `
      <div id="auth-shell">
        <div class="auth-card-wrap">
          <div class="auth-brand">
            <div class="brand-mark">SOC</div>
            <div class="brand-text">
              <div class="brand-title">${CONFIG.APP_NAME}</div>
              <div class="brand-sub">${CONFIG.APP_SUBTITLE}</div>
            </div>
          </div>
          <div class="auth-card">${bodyHtml}</div>
          <div class="auth-footnote">
            ${UI.icon('fa-lock')} Local account access &middot; Isolated lab environment &middot; No external services
          </div>
        </div>
      </div>`;
  }

  function fieldHtml({ id, label, type = 'text', placeholder = '', hint = '', autocomplete = '' }) {
    return `
      <div class="form-field" id="field-${id}">
        <label for="${id}">${Utils.escapeHtml(label)}</label>
        <input id="${id}" name="${id}" type="${type}" placeholder="${Utils.escapeHtml(placeholder)}" autocomplete="${autocomplete}">
        ${hint ? `<div class="field-hint">${hint}</div>` : ''}
        <div class="field-error" id="err-${id}"></div>
      </div>`;
  }

  function setFieldError(id, msg) {
    const wrap = document.getElementById(`field-${id}`);
    const err = document.getElementById(`err-${id}`);
    if (!wrap || !err) return;
    if (msg) { wrap.classList.add('has-error'); err.textContent = msg; }
    else { wrap.classList.remove('has-error'); err.textContent = ''; }
  }

  function clearErrors(ids) {
    ids.forEach((id) => setFieldError(id, ''));
  }

  // -------------------- Login --------------------
  function renderLogin(message = 'Sign in with your Employee ID or work email to access the Adaptive SOC dashboard.') {
    const body = `
      <div class="auth-tabs">
        <button class="auth-tab active" id="tab-login">Employee Login</button>
        <button class="auth-tab" id="tab-register">Register Account</button>
      </div>
      <h2 class="auth-title">${UI.icon('fa-user-shield')} SOC Employee Login</h2>
      <p class="auth-sub">${Utils.escapeHtml(message)}</p>
      <form id="login-form" novalidate>
        ${fieldHtml({ id: 'login-id', label: 'Employee ID or Work Email', placeholder: 'e.g. SOC-1042 or analyst@company.com', autocomplete: 'username' })}
        ${fieldHtml({ id: 'login-password', label: 'Password', type: 'password', placeholder: 'Enter your password', autocomplete: 'current-password' })}
        <div class="auth-error-banner" id="login-banner" style="display:none;"></div>
        <button type="submit" class="btn btn-primary btn-block" id="login-submit">${UI.icon('fa-right-to-bracket')} Login</button>
      </form>
      <p class="auth-switch">New here? <a href="#" id="go-register">Create an account</a></p>
    `;
    document.getElementById('app-root').innerHTML = shellHtml(body);
    mountLogin();
  }

  function mountLogin() {
    document.getElementById('tab-register').addEventListener('click', renderRegister);
    document.getElementById('go-register').addEventListener('click', (e) => { e.preventDefault(); renderRegister(); });
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors(['login-id', 'login-password']);
      const banner = document.getElementById('login-banner');
      banner.style.display = 'none';
      const btn = document.getElementById('login-submit');
      btn.disabled = true;
      btn.innerHTML = `${UI.icon('fa-spinner fa-spin')} Signing in…`;
      try {
        const identifier = document.getElementById('login-id').value;
        const password = document.getElementById('login-password').value;
        const result = await Auth.login({ identifier, password });
        if (!result.ok) {
          banner.textContent = result.error;
          banner.style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = `${UI.icon('fa-right-to-bracket')} Login`;
          return;
        }
        await App.startAuthenticatedApp();
      } catch (err) {
        banner.textContent = err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Could not reach the local API at http://127.0.0.1:8000. Confirm FastAPI is running and open the site from a localhost address.'
          : err.message;
        banner.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = `${UI.icon('fa-right-to-bracket')} Login`;
      }
    });
  }

  // -------------------- Register --------------------
  function renderRegister() {
    const body = `
      <div class="auth-tabs">
        <button class="auth-tab" id="tab-login">Employee Login</button>
        <button class="auth-tab active" id="tab-register">Register Account</button>
      </div>
      <h2 class="auth-title">${UI.icon('fa-user-plus')} Create Your Adaptive SOC Account</h2>
      <p class="auth-sub">Create an account to access the Adaptive SOC console.</p>
      <form id="register-form" novalidate>
        <div class="form-grid-2">
          ${fieldHtml({ id: 'reg-employee-id', label: 'Employee/User ID', placeholder: 'e.g. SOC-1001' })}
          ${fieldHtml({ id: 'reg-full-name', label: 'Full Name', placeholder: 'e.g. Priya Sharma' })}
        </div>
        ${fieldHtml({ id: 'reg-email', label: 'Email', type: 'email', placeholder: 'e.g. priya@example.com', autocomplete: 'email' })}
        ${fieldHtml({
    id: 'reg-phone', label: 'Mobile Number', type: 'tel', placeholder: '10-digit mobile number',
  })}
        ${fieldHtml({ id: 'reg-department', label: 'Role / Department', placeholder: 'e.g. SOC Tier-1 Analyst' })}
        <div class="form-grid-2">
          ${fieldHtml({ id: 'reg-password', label: 'Password', type: 'password', placeholder: 'Min 8 characters', autocomplete: 'new-password' })}
          ${fieldHtml({ id: 'reg-confirm-password', label: 'Confirm Password', type: 'password', placeholder: 'Re-enter password', autocomplete: 'new-password' })}
        </div>
        <div class="auth-error-banner" id="register-banner" style="display:none;"></div>
        <button type="submit" class="btn btn-primary btn-block" id="register-submit">${UI.icon('fa-user-plus')} Create Account</button>
      </form>
      <p class="auth-switch">Already have an account? <a href="#" id="go-login">Employee Login</a></p>
    `;
    document.getElementById('app-root').innerHTML = shellHtml(body);
    mountRegister();
  }

  function mountRegister() {
    document.getElementById('tab-login').addEventListener('click', renderLogin);
    document.getElementById('go-login').addEventListener('click', (e) => { e.preventDefault(); renderLogin(); });

    const phoneInput = document.getElementById('reg-phone');
    phoneInput.addEventListener('input', () => {
      const check = Utils.validatePhoneNumber(phoneInput.value);
      if (!phoneInput.value.trim()) { setFieldError('reg-phone', ''); return; }
      setFieldError('reg-phone', check.valid ? '' : check.reason);
    });

    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ids = ['reg-employee-id', 'reg-full-name', 'reg-email', 'reg-phone', 'reg-department', 'reg-password', 'reg-confirm-password'];
      clearErrors(ids);
      const banner = document.getElementById('register-banner');
      banner.style.display = 'none';

      const fields = {
        employeeId: document.getElementById('reg-employee-id').value,
        fullName: document.getElementById('reg-full-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        department: document.getElementById('reg-department').value,
        password: document.getElementById('reg-password').value,
        confirmPassword: document.getElementById('reg-confirm-password').value,
      };

      const btn = document.getElementById('register-submit');
      btn.disabled = true;
      btn.innerHTML = `${UI.icon('fa-spinner fa-spin')} Creating account…`;

      try {
        const result = await Auth.register(fields);
        if (!result.ok) {
          const fieldIdMap = {
            employeeId: 'reg-employee-id', fullName: 'reg-full-name', email: 'reg-email',
            phone: 'reg-phone', department: 'reg-department', password: 'reg-password',
            confirmPassword: 'reg-confirm-password',
          };
          Object.entries(result.errors).forEach(([key, msg]) => {
            const fid = fieldIdMap[key];
            if (fid) setFieldError(fid, msg);
          });
          banner.textContent = 'Please fix the highlighted fields.';
          banner.style.display = 'block';
          btn.disabled = false;
          btn.innerHTML = `${UI.icon('fa-user-plus')} Create Account`;
          return;
        }
        renderLogin('Account created successfully. Sign in with your new credentials to continue.');
      } catch (err) {
        banner.textContent = err instanceof TypeError && err.message === 'Failed to fetch'
          ? 'Could not reach the local API at http://127.0.0.1:8000. Confirm FastAPI is running and open the site from a localhost address.'
          : err.message;
        banner.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = `${UI.icon('fa-user-plus')} Create Account`;
      }
    });
  }

  return { renderLogin, renderRegister };
})();
