const TOKEN_KEY = "whisper_token";
const USER_KEY = "whisper_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t);
}
function getUser() {
  const s = localStorage.getItem(USER_KEY);
  return s ? JSON.parse(s) : null;
}
function setUser(u) {
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function api(method, path, { body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(
      (data && data.error?.message) || `HTTP ${res.status}`,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

function renderNav() {
  const user = getUser();
  const el = document.getElementById("nav");
  if (!el) return;
  el.innerHTML = `
    <div class="navbar bg-base-100 shadow">
      <div class="flex-1">
        <a href="/" class="btn btn-ghost text-xl">🤫 Whisper</a>
      </div>
      <div class="flex-none gap-2">
        <a href="/feed.html" class="btn btn-ghost btn-sm">Feed</a>
        ${
          user
            ? `
          <a href="/inbox.html" class="btn btn-ghost btn-sm">Inbox</a>
          <a href="/profile.html" class="btn btn-ghost btn-sm">Profile</a>
          <a href="/user.html?u=${user.username}" class="btn btn-ghost btn-sm">My page</a>
          <button id="logoutBtn" class="btn btn-sm btn-outline">Logout (@${user.username})</button>
        `
            : `
          <a href="/login.html" class="btn btn-ghost btn-sm">Login</a>
          <a href="/signup.html" class="btn btn-primary btn-sm">Sign up</a>
        `
        }
      </div>
    </div>
  `;
  const lb = document.getElementById("logoutBtn");
  if (lb)
    lb.addEventListener("click", () => {
      clearAuth();
      location.href = "/";
    });
}

function requireAuth() {
  if (!getToken()) {
    location.href = "/login.html";
    return false;
  }
  return true;
}

function toast(msg, kind = "info") {
  const div = document.createElement("div");
  div.className = "toast toast-top toast-end";
  div.innerHTML = `<div class="alert alert-${kind}"><span>${escapeHtml(msg)}</span></div>`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", renderNav);
