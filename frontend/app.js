const API = '/api';

const Auth = {
  getToken:  ()      => localStorage.getItem('dv_token'),
  getUser:   ()      => JSON.parse(localStorage.getItem('dv_user') || 'null'),
  setSession:(token, user) => {
    localStorage.setItem('dv_token', token);
    localStorage.setItem('dv_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('dv_token');
    localStorage.removeItem('dv_user');
  },
  isLoggedIn: () => !!localStorage.getItem('dv_token'),
};

async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const res = await fetch(API + endpoint, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  // Auto logout if token expired or invalid
  if (res.status === 401) {
    Auth.clear();
    alert('Your session has expired. Please log in again.');
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function showAlert(id, message, type = 'danger') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.textContent = message;
  setTimeout(() => el.classList.remove('show'), 5000);
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function typeBadge(mime) {
  if (!mime) return `<span class="badge-type badge-other">file</span>`;
  if (mime === 'application/pdf') return `<span class="badge-type badge-pdf">PDF</span>`;
  if (mime.includes('word'))      return `<span class="badge-type badge-docx">DOCX</span>`;
  if (mime.startsWith('image/'))  return `<span class="badge-type badge-image">Image</span>`;
  return `<span class="badge-type badge-other">File</span>`;
}

function requireAuth() {
  if (!Auth.isLoggedIn()) { window.location.href = 'login.html'; }
}

function redirectIfAuth() {
  if (Auth.isLoggedIn()) { window.location.href = 'documents.html'; }
}

function logout() {
  Auth.clear();
  window.location.href = 'index.html';
}

function injectNav(activePage) {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const user = Auth.getUser();
  nav.innerHTML = `
    <div class="brand">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div>DOCVAULT <span>SECURE STORAGE</span></div>
    </div>
    <button class="nav-toggle" id="nav-toggle" onclick="toggleNav()" aria-label="Menu">
      <span></span><span></span><span></span>
    </button>
    <div class="nav-links" id="nav-links">
      ${Auth.isLoggedIn() ? `
        <a href="documents.html" data-page="documents" ${activePage==='documents'?'class="active"':''}>My Docs</a>
        <a href="upload.html"    data-page="upload"    ${activePage==='upload'?'class="active"':''}>Upload</a>
        <span class="text-muted text-xs" style="padding:0 0.5rem">${user?.name || ''}</span>
        <a href="#" class="btn-nav btn" onclick="logout()">Logout</a>
      ` : `
        <a href="index.html"    data-page="home"     ${activePage==='home'?'class="active"':''}>Home</a>
        <a href="login.html"    data-page="login"    ${activePage==='login'?'class="active"':''}>Login</a>
        <a href="register.html" class="btn-nav btn">Register</a>
      `}
    </div>`;
}

function toggleNav() {
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (toggle) toggle.classList.toggle('open');
  if (links)  links.classList.toggle('open');
}

document.addEventListener('click', (e) => {
  const nav    = document.getElementById('main-nav');
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  if (nav && !nav.contains(e.target)) {
    if (toggle) toggle.classList.remove('open');
    if (links)  links.classList.remove('open');
  }
});
