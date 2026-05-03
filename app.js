// ===================================================
// app.js  —  Kitap Kutusu
// Firebase v10 (modular) + Firestore + Google Auth
// ===================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfm1ANzzvyZGFiAksYlOzkzvbqg8KJnCU",
  authDomain: "mybookcase-a277f.firebaseapp.com",
  projectId: "mybookcase-a277f",
  storageBucket: "mybookcase-a277f.firebasestorage.app",
  messagingSenderId: "313022286313",
  appId: "1:313022286313:web:eb1eff757e42cca70e6378",
  measurementId: "G-WTR8J98FW2"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ── State ──
let currentUser = null;
let books = [];
let editingId = null;

// ── Elements ──
const authScreen = document.getElementById("auth-screen");
const app = document.getElementById("app");
const googleSigninBtn = document.getElementById("google-signin-btn");
const signoutBtn = document.getElementById("signout-btn");
const userNameEl = document.getElementById("user-name");
const userEmailEl = document.getElementById("user-email");
const userAvatarEl = document.getElementById("user-avatar");

// ── Auth ──
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    authScreen.classList.add("hidden");
    app.classList.remove("hidden");
    userNameEl.textContent = user.displayName || "Kullanıcı";
    userEmailEl.textContent = user.email || "";
    if (user.photoURL) {
      userAvatarEl.style.backgroundImage = `url(${user.photoURL})`;
    }
    await loadBooks();
  } else {
    currentUser = null;
    authScreen.classList.remove("hidden");
    app.classList.add("hidden");
  }
});

googleSigninBtn.addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    showToast("Giriş yapılamadı: " + e.message);
  }
});

signoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ── Load Books ──
async function loadBooks() {
  if (!currentUser) return;
  const q = query(
    collection(db, "books"),
    where("uid", "==", currentUser.uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  books = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderAll();
}

// ── Render ──
function renderAll() {
  renderStats();
  renderDashboard();
  renderLibrary();
  renderReading();
  renderWishlist();
  renderNotes();
  updateGenreFilter();
}

function renderStats() {
  const read = books.filter(b => b.status === "read");
  const reading = books.filter(b => b.status === "reading");
  const wishlist = books.filter(b => b.status === "wishlist");
  const rated = read.filter(b => b.rating > 0);
  const avg = rated.length ? (rated.reduce((s, b) => s + b.rating, 0) / rated.length).toFixed(1) : "—";
  document.getElementById("stat-read").textContent = read.length;
  document.getElementById("stat-reading").textContent = reading.length;
  document.getElementById("stat-wishlist").textContent = wishlist.length;
  document.getElementById("stat-avg").textContent = avg;
}

function renderDashboard() {
  const container = document.getElementById("recent-books");
  const recent = books.filter(b => b.status === "read").slice(0, 8);
  container.innerHTML = recent.length
    ? recent.map(bookCardHTML).join("")
    : emptyState("Henüz okunan kitap yok.", "Kitap ekle ve okuma serüvenini kaydet.");
  attachCardEvents(container);
}

function renderLibrary() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const genre = document.getElementById("genre-filter").value;
  const sort = document.getElementById("sort-select").value;

  let filtered = books.filter(b => b.status === "read");
  if (search) filtered = filtered.filter(b =>
    b.title.toLowerCase().includes(search) ||
    b.author.toLowerCase().includes(search)
  );
  if (genre) filtered = filtered.filter(b => b.genre === genre);

  filtered = sortBooks(filtered, sort);

  const container = document.getElementById("library-books");
  container.innerHTML = filtered.length
    ? filtered.map(bookCardHTML).join("")
    : emptyState("Kitap bulunamadı.", "Arama kriterlerini değiştir veya yeni kitap ekle.");
  attachCardEvents(container);
}

function renderReading() {
  const reading = books.filter(b => b.status === "reading");
  const container = document.getElementById("reading-books");
  container.innerHTML = reading.length
    ? reading.map(bookCardHTML).join("")
    : emptyState("Şu an okuduğun kitap yok.", "Yeni bir kitap başla!");
  attachCardEvents(container);
}

function renderWishlist() {
  const wishlist = books.filter(b => b.status === "wishlist");
  const container = document.getElementById("wishlist-books");
  container.innerHTML = wishlist.length
    ? wishlist.map(bookCardHTML).join("")
    : emptyState("Okuma listesi boş.", "Okumak istediğin kitapları buraya ekle.");
  attachCardEvents(container);
}

function renderNotes() {
  const withNotes = books.filter(b => b.notes && b.notes.trim());
  const container = document.getElementById("notes-list");
  if (!withNotes.length) {
    container.innerHTML = `<div class="empty-state"><strong>Henüz çıkarım yok.</strong>Kitaplara not ekledikçe burada görünür.</div>`;
    return;
  }
  container.innerHTML = withNotes.map(b => `
    <div class="note-card" data-id="${b.id}">
      <div class="note-card-title">${esc(b.title)}</div>
      <div class="note-card-author">${esc(b.author)}</div>
      ${b.rating ? `<div class="note-card-stars">${starsHTML(b.rating)}</div>` : ""}
      <div class="note-card-preview">${esc(b.notes)}</div>
    </div>
  `).join("");
  container.querySelectorAll(".note-card").forEach(el => {
    el.addEventListener("click", () => openDetail(el.dataset.id));
  });
}

function sortBooks(arr, sort) {
  return [...arr].sort((a, b) => {
    if (sort === "date-desc") return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    if (sort === "date-asc") return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
    if (sort === "rating-desc") return (b.rating || 0) - (a.rating || 0);
    if (sort === "title-asc") return a.title.localeCompare(b.title, "tr");
    return 0;
  });
}

function updateGenreFilter() {
  const genres = [...new Set(books.map(b => b.genre).filter(Boolean))].sort();
  const sel = document.getElementById("genre-filter");
  const cur = sel.value;
  sel.innerHTML = `<option value="">Tüm Türler</option>` +
    genres.map(g => `<option value="${esc(g)}" ${g === cur ? "selected" : ""}>${esc(g)}</option>`).join("");

  const dl = document.getElementById("genre-list");
  if (dl) dl.innerHTML = genres.map(g => `<option value="${esc(g)}">`).join("");
}

// ── Book Card HTML ──
function bookCardHTML(b) {
  const letter = b.title.charAt(0).toUpperCase();
  const color = b.color || colorFromStr(b.title);
  const badge = { read: "Okundu", reading: "Okunuyor", wishlist: "Listede" }[b.status];
  return `
    <div class="book-card" data-id="${b.id}">
      <div class="book-spine" style="background:${color}">
        <span class="book-spine-letter">${letter}</span>
        <span class="book-badge">${badge}</span>
      </div>
      <div class="book-info">
        <div class="book-title">${esc(b.title)}</div>
        <div class="book-author">${esc(b.author)}</div>
        ${b.rating ? `<div class="book-stars">${starsHTML(b.rating)}</div>` : ""}
      </div>
      ${b.notes ? `<div class="book-has-notes" title="Notlar var"></div>` : ""}
    </div>
  `;
}

function attachCardEvents(container) {
  container.querySelectorAll(".book-card").forEach(el => {
    el.addEventListener("click", () => openDetail(el.dataset.id));
  });
}

function emptyState(title, sub) {
  return `<div class="empty-state"><strong>${title}</strong>${sub}</div>`;
}

// ── Detail Modal ──
function openDetail(id) {
  const b = books.find(x => x.id === id);
  if (!b) return;
  document.getElementById("detail-title").textContent = b.title;
  document.getElementById("detail-author").textContent = b.author;
  document.getElementById("detail-stars").textContent = b.rating ? starsHTML(b.rating) : "";
  document.getElementById("detail-genre").textContent = b.genre || "";
  document.getElementById("detail-year").textContent = b.year ? `${b.year}` : "";
  document.getElementById("detail-date").textContent = b.finishDate ? `Bitirildi: ${b.finishDate}` : "";
  document.getElementById("detail-notes").textContent = b.notes || "Not eklenmemiş.";
  document.getElementById("detail-modal").classList.remove("hidden");

  document.getElementById("detail-edit").onclick = () => {
    closeDetail();
    openAddModal(b);
  };
  document.getElementById("detail-delete").onclick = async () => {
    if (!confirm(`"${b.title}" silinsin mi?`)) return;
    await deleteDoc(doc(db, "books", id));
    books = books.filter(x => x.id !== id);
    renderAll();
    closeDetail();
    showToast("Kitap silindi.");
  };
}
document.getElementById("detail-close").addEventListener("click", closeDetail);
document.getElementById("detail-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeDetail();
});
function closeDetail() {
  document.getElementById("detail-modal").classList.add("hidden");
}

// ── Add/Edit Modal ──
function openAddModal(book = null) {
  editingId = book?.id || null;
  document.getElementById("modal-title").textContent = book ? "Kitabı Düzenle" : "Kitap Ekle";
  document.getElementById("f-title").value = book?.title || "";
  document.getElementById("f-author").value = book?.author || "";
  document.getElementById("f-genre").value = book?.genre || "";
  document.getElementById("f-status").value = book?.status || "read";
  document.getElementById("f-year").value = book?.year || "";
  document.getElementById("f-date").value = book?.finishDate || "";
  document.getElementById("f-notes").value = book?.notes || "";
  document.getElementById("f-color").value = book?.color || "#1a1a1a";
  setStarValue(book?.rating || 0);
  document.getElementById("book-modal").classList.remove("hidden");
}

["add-book-btn","add-book-btn-2","add-book-btn-3","add-book-btn-4"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", () => openAddModal());
});
document.getElementById("modal-close").addEventListener("click", closeModal);
document.getElementById("cancel-btn").addEventListener("click", closeModal);
document.getElementById("book-modal").addEventListener("click", e => {
  if (e.target === e.currentTarget) closeModal();
});
function closeModal() {
  document.getElementById("book-modal").classList.add("hidden");
}

// ── Form Submit ──
document.getElementById("book-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;

  const data = {
    uid: currentUser.uid,
    title: document.getElementById("f-title").value.trim(),
    author: document.getElementById("f-author").value.trim(),
    genre: document.getElementById("f-genre").value.trim(),
    status: document.getElementById("f-status").value,
    year: document.getElementById("f-year").value ? parseInt(document.getElementById("f-year").value) : null,
    finishDate: document.getElementById("f-date").value || null,
    rating: parseInt(document.getElementById("f-rating").value) || 0,
    color: document.getElementById("f-color").value,
    notes: document.getElementById("f-notes").value.trim(),
    updatedAt: serverTimestamp()
  };

  try {
    if (editingId) {
      await setDoc(doc(db, "books", editingId), data, { merge: true });
      showToast("Kitap güncellendi ✓");
    } else {
      data.createdAt = serverTimestamp();
      const ref = await addDoc(collection(db, "books"), data);
      data.id = ref.id;
      showToast("Kitap eklendi ✓");
    }
    closeModal();
    await loadBooks();
  } catch (err) {
    showToast("Hata: " + err.message);
  }
});

// ── Star Input ──
function setStarValue(v) {
  document.getElementById("f-rating").value = v;
  document.querySelectorAll("#star-input .star").forEach(s => {
    s.classList.toggle("active", parseInt(s.dataset.v) <= v);
  });
}
document.getElementById("star-input").addEventListener("click", e => {
  if (e.target.classList.contains("star")) {
    setStarValue(parseInt(e.target.dataset.v));
  }
});
document.getElementById("star-input").addEventListener("mouseover", e => {
  if (e.target.classList.contains("star")) {
    const v = parseInt(e.target.dataset.v);
    document.querySelectorAll("#star-input .star").forEach(s => {
      s.style.color = parseInt(s.dataset.v) <= v ? "var(--star-on)" : "var(--star-off)";
    });
  }
});
document.getElementById("star-input").addEventListener("mouseleave", () => {
  const cur = parseInt(document.getElementById("f-rating").value);
  document.querySelectorAll("#star-input .star").forEach(s => {
    s.style.color = "";
    s.classList.toggle("active", parseInt(s.dataset.v) <= cur);
  });
});

// ── Navigation ──
document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const page = btn.dataset.page;
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${page}`).classList.add("active");
    // mobile: close sidebar
    document.querySelector(".sidebar").classList.remove("open");
  });
});

// ── Search & Filter ──
document.getElementById("search-input").addEventListener("input", renderLibrary);
document.getElementById("genre-filter").addEventListener("change", renderLibrary);
document.getElementById("sort-select").addEventListener("change", renderLibrary);

// ── Theme ──
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  const isDark = theme === "dark";
  document.getElementById("icon-sun").style.display = isDark ? "block" : "none";
  document.getElementById("icon-moon").style.display = isDark ? "none" : "block";
  document.getElementById("theme-label").textContent = isDark ? "Açık Mod" : "Koyu Mod";
}
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);
document.getElementById("theme-toggle").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});
document.getElementById("theme-toggle-mobile").addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// ── Mobile Sidebar ──
document.getElementById("menu-btn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});

// ── Helpers ──
function starsHTML(rating) {
  return "★".repeat(rating) + `<span class="empty">${"★".repeat(5 - rating)}</span>`;
}
function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function colorFromStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const paletteDark = ["#1a1a2e","#16213e","#0f3460","#1b2838","#212738","#2c2c54","#1a1a1a","#2d1b69","#1f2421","#0d1b2a"];
  const paletteLight = ["#2d3561","#c84b31","#ecb365","#393e46","#1b262c","#6b4226","#2c3e50","#4a4e69","#22333b","#3d405b"];
  const palette = document.documentElement.getAttribute("data-theme") === "light" ? paletteLight : paletteDark;
  return palette[Math.abs(hash) % palette.length];
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.classList.add("hidden"), 300);
  }, 2500);
}
