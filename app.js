import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJ532nHpPtBunCTM32JuCOY1uUN8tliK4",
    authDomain: "ruang-pikiran.firebaseapp.com",
    projectId: "ruang-pikiran",
    storageBucket: "ruang-pikiran.firebasestorage.app",
    messagingSenderId: "451081065318",
    appId: "1:451081065318:web:cce97c553e2d6219eb2ea7"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(err => console.log("Persistence error:", err));

// ============ CUSTOM TOAST SYSTEM ============
const toastIcons = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    info: 'info'
};

const toastTitles = {
    success: 'Berhasil',
    error: 'Gagal',
    warning: 'Perhatian',
    info: 'Informasi'
};

function showToast(type = 'info', message = '', title = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Generate unique ID for toast
    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // Set default title based on type if not provided
    const toastTitle = title || toastTitles[type] || 'Notifikasi';
    const icon = toastIcons[type] || 'info';
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <span class="material-symbols-rounded">${icon}</span>
        </div>
        <div class="toast-content">
            ${toastTitle ? `<div class="toast-title">${toastTitle}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="document.getElementById('${toastId}').remove()">
            <span class="material-symbols-rounded">close</span>
        </button>
        <div class="toast-progress">
            <div class="toast-progress-bar" style="animation-duration: ${type === 'error' ? '5s' : '3.5s'};"></div>
        </div>
    `;
    
    // Add to container
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto remove after duration
    const duration = type === 'error' ? 5000 : 3500;
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, { once: true });
            
            // Fallback remove
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 500);
        }
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', (e) => {
        if (!e.target.closest('.toast-close')) {
            if (toast.parentNode) {
                toast.classList.add('hide');
                setTimeout(() => {
                    if (toast.parentNode) toast.remove();
                }, 400);
            }
        }
    });
    
    return toast;
}

// Function to replace alert with toast
function showAlert(message, type = 'warning') {
    showToast(type, message);
}

// Override window.alert to use toast for better UX
const originalAlert = window.alert;
window.alert = function(message) {
    // Check if message contains success indicators
    if (message.includes('✅') || message.includes('berhasil') || message.includes('tersimpan') || message.includes('Disalin')) {
        showToast('success', message.replace('✅ ', ''));
    } else if (message.includes('❌') || message.includes('Gagal') || message.includes('gagal')) {
        showToast('error', message.replace('❌ ', ''));
    } else if (message.includes('⚠️') || message.includes('Yakin')) {
        showToast('warning', message.replace('⚠️ ', ''));
    } else {
        showToast('info', message);
    }
};

// ============ RAIN ANIMATION ============
const canvas = document.getElementById('rainCanvas');
let ctx = canvas.getContext('2d');
let width, height;
let drops = [];

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

for(let i = 0; i < 200; i++) {
    drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 20 + 10,
        speed: Math.random() * 5 + 3,
        opacity: Math.random() * 0.4 + 0.1
    });
}

function drawRain() {
    if(!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(79, 70, 229, 0.03)';
    ctx.fillRect(0, 0, width, height);
    
    for(let drop of drops) {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.strokeStyle = `rgba(100, 149, 237, ${drop.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drop.y += drop.speed;
        if(drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * width;
        }
    }
    requestAnimationFrame(drawRain);
}

drawRain();

// ============ THEME TOGGLE ============
const themeBtn = document.getElementById('themeToggle');
if(localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
    themeBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
} else {
    themeBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
}

themeBtn.addEventListener('click', () => {
    if(document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        themeBtn.innerHTML = '<span class="material-symbols-rounded">dark_mode</span>';
        showToast('info', 'Mode terang diaktifkan');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        themeBtn.innerHTML = '<span class="material-symbols-rounded">light_mode</span>';
        showToast('info', 'Mode gelap diaktifkan');
    }
    if(window.chart) window.chart.destroy();
    if(document.getElementById('analyticsPanel') && !document.getElementById('analyticsPanel').classList.contains('hidden')) {
        renderAnalytics();
    }
});

// ============ GLOBAL VARIABLES ============
let currentUser = null;
let entries = [];
let chart = null;
let currentPeriod = 7;
let unsub = null;
let userProfile = { displayName: '', gender: '', photoURL: '' };
let lastOfflineToast = null;

const today = () => new Date().toISOString().split('T')[0];
const moodEmoji = (m) => {
    const emojis = {1:"😭",2:"😞",3:"😟",4:"🙁",5:"😐",6:"🙂",7:"😊",8:"😃",9:"😍",10:"🤩"};
    return emojis[m] || "😐";
};

// ============ ERROR HANDLING FUNCTIONS ============
function showError(msg, code = '') {
    const el = document.getElementById('errorMessage');
    if (!el) return;
    const fullMessage = code ? `${msg} (Kode: ${code})` : msg;
    el.textContent = '❌ ' + fullMessage;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 5000);
    showToast('error', fullMessage);
}

function getFirebaseErrorMessage(error) {
    const errorMap = {
        // Auth errors
        'auth/invalid-email': 'Format email tidak valid',
        'auth/user-disabled': 'Akun ini telah dinonaktifkan. Hubungi dukungan',
        'auth/user-not-found': 'Email belum terdaftar. Silakan daftar terlebih dahulu',
        'auth/wrong-password': 'Password salah. Silakan coba lagi',
        'auth/invalid-credential': 'Email atau password salah',
        'auth/email-already-in-use': 'Email sudah terdaftar. Gunakan email lain atau masuk',
        'auth/operation-not-allowed': 'Metode login ini belum diaktifkan',
        'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Silakan coba lagi nanti',
        'auth/network-request-failed': 'Gangguan jaringan. Periksa koneksi internet Anda',
        'auth/requires-recent-login': 'Silakan login ulang untuk melanjutkan',
        'auth/account-exists-with-different-credential': 'Email sudah terdaftar dengan metode lain',
        
        // Firestore errors
        'unavailable': 'Layanan sedang sibuk. Menggunakan data lokal',
        'resource-exhausted': 'Server sibuk. Data disimpan sementara secara lokal',
        'permission-denied': 'Anda tidak memiliki izin untuk akses ini',
        'not-found': 'Data tidak ditemukan',
        'already-exists': 'Data sudah ada',
        'cancelled': 'Operasi dibatalkan',
        'deadline-exceeded': 'Waktu koneksi habis. Coba lagi',
        'unauthenticated': 'Silakan login terlebih dahulu'
    };
    
    return errorMap[error.code] || error.message || 'Terjadi kesalahan yang tidak diketahui';
}

// ============ CONNECTION CHECK ============
function isOnline() {
    if (!navigator.onLine) {
        showToast('warning', 'Anda sedang offline. Periksa koneksi internet Anda.', 'Offline');
        return false;
    }
    return true;
}

// ============ SYNC INDICATOR ============
function updateSync() {
    const indicator = document.getElementById('syncIndicator');
    const banner = document.getElementById('offlineBanner');
    
    if (!indicator || !banner) return;
    
    if(navigator.onLine) {
        indicator.className = 'sync-indicator online';
        indicator.innerHTML = '<span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle;margin-right:4px;">cloud_done</span> Online';
        banner.classList.remove('show');
        if(lastOfflineToast) {
            lastOfflineToast.remove();
            lastOfflineToast = null;
        }
    } else {
        indicator.className = 'sync-indicator offline';
        indicator.innerHTML = '<span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle;margin-right:4px;">cloud_off</span> Offline';
        banner.classList.add('show');
        if(!lastOfflineToast) {
            lastOfflineToast = showToast('warning', 'Anda sedang offline. Data akan disimpan lokal.', 'Offline');
        }
    }
}

window.addEventListener('online', () => {
    updateSync();
    if(currentUser) {
        loadData();
        showToast('success', 'Koneksi pulih. Data disinkronkan.', 'Online');
    }
});

window.addEventListener('offline', () => {
    updateSync();
});

// ============ USER PROFILE ============
async function loadUserProfile() {
    if(!currentUser) return;
    const profileRef = doc(db, 'users', currentUser.uid);
    try {
        const snap = await getDoc(profileRef);
        if(snap.exists() && snap.data().profile) {
            userProfile = snap.data().profile;
        } else {
            userProfile = { displayName: currentUser.email?.split('@')[0] || 'Pengguna', gender: '', photoURL: '' };
            await saveUserProfile();
        }
    } catch(e) {
        console.log("Offline mode - using cached profile");
    }
    updateDisplayName();
    renderProfilePhoto();
    renderProfile();
}

async function saveUserProfile() {
    if(!currentUser) return;
    const profileRef = doc(db, 'users', currentUser.uid);
    try {
        await setDoc(profileRef, { profile: userProfile }, { merge: true });
        if(userProfile.displayName) {
            try { await updateProfile(currentUser, { displayName: userProfile.displayName }); } catch(e) {}
        }
    } catch(e) {
        console.log("Failed to save profile:", e);
        showToast('warning', 'Profil disimpan lokal. Akan sync saat online.', 'Offline');
    }
}

function updateDisplayName() {
    const name = userProfile.displayName || currentUser?.email?.split('@')[0] || 'Pengguna';
    const userDisplayEl = document.getElementById('userDisplay');
    const profileDisplayNameEl = document.getElementById('profileDisplayName');
    if (userDisplayEl) userDisplayEl.textContent = name;
    if (profileDisplayNameEl) profileDisplayNameEl.textContent = name;
}

// ============ PROFILE PHOTO FUNCTIONS ============
function renderProfilePhoto() {
    const avatarImg = document.getElementById('profileAvatarImg');
    const avatarIcon = document.getElementById('profileAvatarIcon');
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewIcon = document.getElementById('photoPreviewIcon');
    
    if (userProfile.photoURL && userProfile.photoURL.trim() !== '') {
        if (avatarImg) {
            avatarImg.src = userProfile.photoURL;
            avatarImg.style.display = 'block';
        }
        if (avatarIcon) avatarIcon.style.display = 'none';
        if (photoPreview) {
            photoPreview.src = userProfile.photoURL;
            photoPreview.style.display = 'block';
        }
        if (photoPreviewIcon) photoPreviewIcon.style.display = 'none';
    } else {
        if (avatarImg) avatarImg.style.display = 'none';
        if (avatarIcon) avatarIcon.style.display = 'flex';
        if (photoPreview) photoPreview.style.display = 'none';
        if (photoPreviewIcon) photoPreviewIcon.style.display = 'flex';
    }
}

async function updateProfilePhoto(photoURL) {
    if (!currentUser) return;
    userProfile.photoURL = photoURL;
    await saveUserProfile();
    renderProfilePhoto();
    showToast('success', 'Foto profil berhasil diperbarui');
}

async function removeProfilePhoto() {
    if (!currentUser) return;
    userProfile.photoURL = '';
    await saveUserProfile();
    renderProfilePhoto();
    showToast('success', 'Foto profil berhasil dihapus');
}

function previewPhotoFromUrl(url) {
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewIcon = document.getElementById('photoPreviewIcon');
    
    if (url && url.trim() !== '') {
        photoPreview.src = url;
        photoPreview.style.display = 'block';
        if (photoPreviewIcon) photoPreviewIcon.style.display = 'none';
    } else {
        photoPreview.style.display = 'none';
        if (photoPreviewIcon) photoPreviewIcon.style.display = 'flex';
    }
}

// ============ MODAL HANDLERS ============
document.getElementById('editNameIcon').onclick = () => {
    document.getElementById('editNameInput').value = userProfile.displayName || '';
    document.getElementById('editNameModal').classList.add('show');
};

document.getElementById('saveNameBtn').onclick = async () => {
    const newName = document.getElementById('editNameInput').value.trim();
    if(newName) {
        userProfile.displayName = newName;
        await saveUserProfile();
        updateDisplayName();
        renderProfile();
        showToast('success', 'Nama berhasil diperbarui');
    }
    document.getElementById('editNameModal').classList.remove('show');
};

document.getElementById('cancelNameBtn').onclick = () => {
    document.getElementById('editNameModal').classList.remove('show');
};

document.getElementById('editGenderIcon').onclick = () => {
    const options = document.querySelectorAll('#modalGenderSelect .gender-option');
    options.forEach(opt => {
        if(opt.dataset.gender === userProfile.gender) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });
    document.getElementById('editGenderModal').classList.add('show');
};

document.querySelectorAll('#modalGenderSelect .gender-option').forEach(opt => {
    opt.onclick = function() {
        document.querySelectorAll('#modalGenderSelect .gender-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
    };
});

document.getElementById('saveGenderBtn').onclick = async () => {
    const selected = document.querySelector('#modalGenderSelect .gender-option.selected');
    if(selected) {
        userProfile.gender = selected.dataset.gender;
        await saveUserProfile();
        renderProfile();
        showToast('success', 'Jenis kelamin berhasil diperbarui');
    }
    document.getElementById('editGenderModal').classList.remove('show');
};

document.getElementById('cancelGenderBtn').onclick = () => {
    document.getElementById('editGenderModal').classList.remove('show');
};

// ============ PHOTO MODAL HANDLERS ============
document.getElementById('editPhotoBtn').onclick = () => {
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewIcon = document.getElementById('photoPreviewIcon');
    const photoUrlInput = document.getElementById('photoUrlInput');
    
    photoUrlInput.value = '';
    
    if (userProfile.photoURL && userProfile.photoURL.trim() !== '') {
        photoPreview.src = userProfile.photoURL;
        photoPreview.style.display = 'block';
        photoPreviewIcon.style.display = 'none';
    } else {
        photoPreview.style.display = 'none';
        photoPreviewIcon.style.display = 'flex';
    }
    
    document.getElementById('editPhotoModal').classList.add('show');
};

document.getElementById('photoUrlInput').addEventListener('input', (e) => {
    previewPhotoFromUrl(e.target.value);
});

document.getElementById('savePhotoBtn').onclick = async () => {
    const urlInput = document.getElementById('photoUrlInput').value.trim();
    
    if (urlInput) {
        try {
            new URL(urlInput);
            await updateProfilePhoto(urlInput);
            document.getElementById('editPhotoModal').classList.remove('show');
        } catch (e) {
            showToast('error', 'URL tidak valid');
        }
    } else {
        showToast('warning', 'Masukkan URL foto');
    }
};

document.getElementById('removePhotoBtn').onclick = async () => {
    const confirmed = await confirmAction('Hapus foto profil?');
    if (confirmed) {
        await removeProfilePhoto();
        document.getElementById('editPhotoModal').classList.remove('show');
    }
};

document.getElementById('cancelPhotoBtn').onclick = () => {
    document.getElementById('editPhotoModal').classList.remove('show');
};

// ============ CONFIRMATION HELPER ============
function confirmAction(message) {
    return new Promise(resolve => {
        const toast = showToast('warning', message, 'Konfirmasi');
        toast.style.cursor = 'pointer';
        
        const timeout = setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
                resolve(false);
            }
        }, 5000);
        
        toast.onclick = () => {
            clearTimeout(timeout);
            toast.remove();
            resolve(true);
        };
    });
}

// ============ AUTH HANDLERS ============
document.getElementById('showRegister').onclick = () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('errorMessage')?.classList.remove('show');
};

document.getElementById('showLogin').onclick = () => {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('errorMessage')?.classList.remove('show');
};

// Login Handler
document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    
    // Validasi input
    if(!email || !pass) {
        showError('Isi email dan password');
        return;
    }
    
    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        showError('Format email tidak valid');
        return;
    }
    
    // Cek koneksi
    if(!isOnline()) return;
    
    const loginBtn = document.getElementById('loginBtn');
    const originalHTML = loginBtn.innerHTML;
    
    try {
        // Loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> Memproses...';
        
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('success', 'Selamat datang kembali!', 'Berhasil');
        document.getElementById('errorMessage')?.classList.remove('show');
    } catch(err) {
        const errorMessage = getFirebaseErrorMessage(err);
        showError(errorMessage, err.code);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalHTML;
    }
};

// Register Handler
document.getElementById('registerBtn').onclick = async () => {
    const email = document.getElementById('registerEmail').value.trim();
    const pass = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
    // Validasi input
    if(!email || !pass) {
        showError('Isi semua field');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        showError('Format email tidak valid');
        return;
    }
    
    if(pass !== confirm) {
        showError('Password tidak cocok');
        return;
    }
    
    if(pass.length < 6) {
        showError('Password minimal 6 karakter');
        return;
    }
    
    if(!isOnline()) return;
    
    const registerBtn = document.getElementById('registerBtn');
    const originalHTML = registerBtn.innerHTML;
    
    try {
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<span class="material-symbols-rounded">hourglass_top</span> Mendaftar...';
        
        await createUserWithEmailAndPassword(auth, email, pass);
        showToast('success', 'Akun berhasil dibuat! Selamat datang.', 'Registrasi Berhasil');
        document.getElementById('errorMessage')?.classList.remove('show');
        
        // Reset form
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerConfirm').value = '';
    } catch(err) {
        const errorMessage = getFirebaseErrorMessage(err);
        showError(errorMessage, err.code);
    } finally {
        registerBtn.disabled = false;
        registerBtn.innerHTML = originalHTML;
    }
};

// Logout Handler
document.getElementById('logoutBtn').onclick = async () => {
    const confirmed = await confirmAction('Apakah Anda yakin ingin keluar?');
    
    if (confirmed) {
        try {
            if(unsub) unsub();
            await signOut(auth);
            showToast('info', 'Anda telah keluar', 'Logout');
        } catch(err) {
            showToast('error', 'Gagal keluar. Coba lagi.', 'Error');
        }
    }
};

document.getElementById('profileBtn').onclick = () => showTab('profile');

// ============ DATA FUNCTIONS ============
function loadData() {
    if(!currentUser) return;
    const ref = collection(db, 'users', currentUser.uid, 'journal_entries');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(200));
    if(unsub) unsub();
    
    unsub = onSnapshot(q, (snap) => {
        entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        localStorage.setItem('rp_cache', JSON.stringify(entries));
        renderDashboard();
        if(!document.getElementById('analyticsPanel').classList.contains('hidden')) renderAnalytics();
        renderProfile();
        if(!document.getElementById('historyPanel').classList.contains('hidden')) renderHistory();
    }, (error) => {
        console.error("Firestore error:", error);
        entries = JSON.parse(localStorage.getItem('rp_cache') || '[]');
        renderDashboard();
        renderProfile();
        
        const errorMessage = getFirebaseErrorMessage(error);
        showToast('warning', errorMessage, 'Sinkronisasi');
    });
}

async function saveEntry(entry) {
    if(!currentUser) return;
    
    try {
        await setDoc(doc(db, 'users', currentUser.uid, 'journal_entries', entry.id.toString()), entry);
    } catch(err) {
        console.error("Save error:", err);
        
        // Simpan ke localStorage sebagai backup
        const cacheEntries = JSON.parse(localStorage.getItem('rp_cache') || '[]');
        const index = cacheEntries.findIndex(e => e.id === entry.id);
        if(index !== -1) {
            cacheEntries[index] = entry;
        } else {
            cacheEntries.unshift(entry);
        }
        localStorage.setItem('rp_cache', JSON.stringify(cacheEntries));
        
        showToast('warning', 'Jurnal disimpan lokal. Akan sync saat online.', 'Offline');
    }
}

// ============ RENDER FUNCTIONS ============
function renderDashboard() {
    const todayEntry = entries.find(e => e.date === today());
    const todayInsightEl = document.getElementById('todayInsight');
    
    if(todayEntry) {
        todayInsightEl.innerHTML = `
            <div style="background:var(--bg);padding:16px;border-radius:12px;">
                <div style="font-size:1.3rem;font-weight:bold;">${moodEmoji(todayEntry.mood)} Mood: ${todayEntry.mood}/10</div>
                <div>⚡ Energi: ${todayEntry.energy}/10</div>
                <div style="margin-top:8px;word-wrap:break-word;">"${todayEntry.text.substring(0,150)}${todayEntry.text.length > 150 ? '...' : ''}"</div>
            </div>
        `;
    } else {
        todayInsightEl.innerHTML = '<div style="padding:20px;text-align:center;">✨ Belum ada jurnal hari ini. Yuk tulis!</div>';
    }
    
    const last7 = entries.slice(0, 7);
    const aiSummaryEl = document.getElementById('aiSummary');
    const darkTrackerEl = document.getElementById('darkTracker');
    
    if(last7.length > 0) {
        const avgMood = (last7.reduce((s, e) => s + e.mood, 0) / last7.length).toFixed(1);
        const darkDays = last7.filter(e => e.dark?.selfHarm || e.dark?.hopeless).length;
        
        aiSummaryEl.innerHTML = `
            <strong>🧠 7 Hari Terakhir:</strong><br>
            • Mood rata-rata: <strong>${avgMood}/10</strong><br>
            • ${darkDays} hari dengan pikiran gelap<br>
            ${darkDays >= 3 ? '⚠️ Pertimbangkan konsultasi profesional.' : darkDays > 0 ? '💡 Ada pikiran gelap, jangan ragu cerita ke orang terpercaya.' : '🌟 Mood cukup stabil, pertahankan!'}
        `;
        
        darkTrackerEl.innerHTML = last7.map(e => `
            <div style="padding:10px;margin:5px 0;background:${(e.dark?.selfHarm || e.dark?.hopeless) ? 'var(--danger-soft)' : 'var(--secondary-soft)'};border-radius:8px;">
                <strong>${e.date}</strong>: ${(e.dark?.selfHarm || e.dark?.hopeless) ? '⚠️ Pikiran gelap terdeteksi' : '✅ Aman'}
            </div>
        `).join('');
    } else {
        aiSummaryEl.innerHTML = 'Belum ada data jurnal. Mulai tulis ya!';
        darkTrackerEl.innerHTML = 'Belum ada data.';
    }
}

function renderHistory() {
    const filterDate = document.getElementById('filterDate').value;
    let filtered = filterDate ? entries.filter(e => e.date === filterDate) : [...entries];
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const historyListEl = document.getElementById('historyList');
    
    if(filtered.length === 0) {
        historyListEl.innerHTML = '<p style="text-align:center;padding:20px;">Tidak ada jurnal.</p>';
        return;
    }
    
    historyListEl.innerHTML = filtered.map(e => `
        <div class="history-item">
            <button class="delete-btn" data-id="${e.id}">
                <span class="material-symbols-rounded">delete</span> Hapus
            </button>
            <strong>📅 ${e.date}</strong> ${(e.dark?.selfHarm || e.dark?.hopeless) ? '<span style="background:#ef4444;color:white;padding:2px 8px;border-radius:12px;font-size:0.7rem;">⚠️</span>' : ''}
            <div>${moodEmoji(e.mood)} Mood: ${e.mood}/10 | ⚡ Energi: ${e.energy}/10</div>
            <div style="margin-top:8px;word-wrap:break-word;">${e.text}</div>
            ${e.thoughts?.length ? `<div style="margin-top:6px;">${e.thoughts.map(t => `<span class="tag" style="padding:2px 8px;font-size:0.7rem;">${t}</span>`).join(' ')}</div>` : ''}
        </div>
    `).join('');
    
    // Delete handlers
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const confirmed = await confirmAction('Hapus jurnal ini? Tindakan tidak dapat dibatalkan.');
            if (confirmed) {
                try {
                    await deleteDoc(doc(db, 'users', currentUser.uid, 'journal_entries', btn.dataset.id));
                    showToast('success', 'Jurnal berhasil dihapus');
                } catch(err) {
                    showToast('error', 'Gagal menghapus jurnal. Coba lagi.');
                }
            }
        };
    });
}

function renderAnalytics() {
    const days = currentPeriod;
    const lastDays = [];
    
    for(let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const found = entries.find(e => e.date === dateStr);
        lastDays.push({ date: dateStr, mood: found?.mood || null, energy: found?.energy || null });
    }
    
    const valid = lastDays.filter(d => d.mood !== null);
    const avgMood = valid.length ? (valid.reduce((s, d) => s + d.mood, 0) / valid.length).toFixed(1) : '-';
    const avgEnergy = valid.length ? (valid.reduce((s, d) => s + d.energy, 0) / valid.length).toFixed(1) : '-';
    const maxMood = valid.length ? Math.max(...valid.map(d => d.mood)) : '-';
    const minMood = valid.length ? Math.min(...valid.map(d => d.mood)) : '-';
    
    document.getElementById('moodSummary').innerHTML = `
        <div class="summary-card"><div class="big">${avgMood !== '-' ? moodEmoji(Math.round(avgMood)) + ' ' + avgMood : avgMood}</div><div>Rata Mood</div></div>
        <div class="summary-card"><div class="big">${avgEnergy !== '-' ? '⚡ ' + avgEnergy : avgEnergy}</div><div>Rata Energi</div></div>
        <div class="summary-card"><div class="big">${maxMood !== '-' ? moodEmoji(maxMood) + ' ' + maxMood : maxMood}</div><div>Tertinggi</div></div>
        <div class="summary-card"><div class="big">${minMood !== '-' ? moodEmoji(minMood) + ' ' + minMood : minMood}</div><div>Terendah</div></div>
    `;
    
    const ctx = document.getElementById('moodChart').getContext('2d');
    if(chart) chart.destroy();
    const isDark = document.documentElement.classList.contains('dark');
    
    try {
        chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: lastDays.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
                datasets: [
                    { label: 'Mood', data: lastDays.map(d => d.mood), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.3, fill: true },
                    { label: 'Energi', data: lastDays.map(d => d.energy), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.3, fill: true }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 10, ticks: { color: isDark ? '#94a3b8' : '#64748b' } },
                    x: { ticks: { color: isDark ? '#94a3b8' : '#64748b' } }
                }
            }
        });
    } catch(err) {
        console.error("Chart error:", err);
    }
    
    const darkDays = entries.slice(0, days).filter(e => e.dark?.selfHarm || e.dark?.hopeless).length;
    document.getElementById('negativeStats').innerHTML = `
        <div style="padding:16px;background:${darkDays > 0 ? 'var(--danger-soft)' : 'var(--secondary-soft)'};border-radius:12px;">
            <div style="font-size:1.2rem;font-weight:bold;">${darkDays} hari dengan pikiran gelap</div>
            ${darkDays >= 3 ? '<div style="margin-top:10px;"><strong>⚠️ Disarankan konsultasi profesional. 📞 119 ext 8</strong></div>' : ''}
        </div>
    `;
}

function renderProfile() {
    if(!currentUser) return;
    updateDisplayName();
    
    const profileGenderEl = document.getElementById('profileGenderDisplay');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileTotalEntriesEl = document.getElementById('profileTotalEntries');
    const profileAvgMoodEl = document.getElementById('profileAvgMood');
    
    if (profileGenderEl) profileGenderEl.textContent = userProfile.gender || 'Belum diisi';
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email || '-';
    if (profileTotalEntriesEl) profileTotalEntriesEl.textContent = `${entries.length} entri`;
    
    const avg = entries.length ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : '-';
    if (profileAvgMoodEl) {
        profileAvgMoodEl.textContent = avg !== '-' ? `${moodEmoji(Math.round(avg))} ${avg}/10` : '-';
    }
    
    renderProfilePhoto();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`${tabId}Panel`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    if(tabId === 'history') renderHistory();
    if(tabId === 'analytics') renderAnalytics();
    if(tabId === 'dashboard') renderDashboard();
    if(tabId === 'export') {
        const exportPreviewEl = document.getElementById('exportPreview');
        if (exportPreviewEl) exportPreviewEl.innerHTML = `📝 ${entries.length} jurnal siap diekspor.`;
    }
    if(tabId === 'profile') renderProfile();
}

// ============ EVENT LISTENERS ============
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPeriod = parseInt(btn.dataset.period);
        renderAnalytics();
    });
});

document.getElementById('thoughtTags').addEventListener('click', (e) => {
    if(e.target.classList.contains('tag')) e.target.classList.toggle('selected');
});

document.getElementById('moodSlider').oninput = function() {
    document.getElementById('moodEmoji').textContent = moodEmoji(parseInt(this.value));
};

document.getElementById('energySlider').oninput = function() {
    document.getElementById('energyVal').textContent = this.value;
};

document.getElementById('darkIntensity').oninput = function() {
    document.getElementById('intensityLabel').textContent = this.value;
};

// Save Journal Handler
document.getElementById('saveJournalBtn').onclick = async () => {
    const text = document.getElementById('journalText').value.trim();
    if(!text) {
        showToast('warning', 'Tulis sesuatu dulu ya', 'Jurnal Kosong');
        return;
    }
    
    const entry = {
        id: Date.now(),
        date: today(),
        timestamp: new Date().toISOString(),
        text: text,
        mood: parseInt(document.getElementById('moodSlider').value),
        energy: parseInt(document.getElementById('energySlider').value),
        thoughts: Array.from(document.querySelectorAll('#thoughtTags .tag.selected')).map(el => el.dataset.thought),
        dark: {
            selfHarm: document.getElementById('selfHarmCheck').checked,
            hopeless: document.getElementById('hopelessCheck').checked,
            intensity: parseInt(document.getElementById('darkIntensity').value)
        }
    };
    
    // Check for dark thoughts warning
    if (entry.dark.selfHarm || entry.dark.hopeless) {
        showToast('warning', 'Jurnal tersimpan. Jika Anda merasa sangat tertekan, jangan ragu untuk mencari bantuan profesional. 📞 119 ext 8', 'Perhatian');
    }
    
    // Update local entries
    const existingIndex = entries.findIndex(e => e.date === today());
    if(existingIndex !== -1) entries[existingIndex] = entry;
    else entries.unshift(entry);
    
    await saveEntry(entry);
    showToast('success', 'Jurnal berhasil disimpan!');
    
    // Clear form
    document.getElementById('journalText').value = '';
    document.querySelectorAll('#thoughtTags .tag.selected').forEach(t => t.classList.remove('selected'));
    document.getElementById('selfHarmCheck').checked = false;
    document.getElementById('hopelessCheck').checked = false;
    document.getElementById('darkIntensity').value = 1;
    document.getElementById('intensityLabel').textContent = '1';
    document.getElementById('moodSlider').value = 6;
    document.getElementById('moodEmoji').textContent = '😐';
    document.getElementById('energySlider').value = 5;
    document.getElementById('energyVal').textContent = '5';
    
    showTab('dashboard');
};

// Other event listeners
document.getElementById('quickMoodBtn').onclick = () => showTab('journal');

document.getElementById('resetFilterBtn').onclick = () => {
    document.getElementById('filterDate').value = '';
    renderHistory();
};

document.getElementById('filterDate').onchange = renderHistory;

// Export handler
document.getElementById('exportBtn').onclick = () => {
    if(!entries.length) {
        showToast('warning', 'Tidak ada jurnal untuk diekspor', 'Kosong');
        return;
    }
    
    try {
        let report = entries.map(e => `📅 ${e.date}\nMood: ${e.mood}/10 | Energi: ${e.energy}/10\n${e.text}\n${'─'.repeat(40)}`).join('\n');
        const blob = new Blob([`LAPORAN JURNAL MENTAL\nTanggal: ${today()}\nTotal: ${entries.length} jurnal\n${'═'.repeat(50)}\n\n${report}`], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `laporan_mental_${today()}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('success', 'Laporan berhasil diunduh!');
    } catch(err) {
        showToast('error', 'Gagal mengekspor laporan');
    }
};

// Copy to clipboard handler
document.getElementById('copyBtn').onclick = async () => {
    const text = entries.map(e => `📅 ${e.date}\nMood: ${e.mood}/10\n${e.text}`).join('\n---\n');
    try {
        await navigator.clipboard.writeText(text);
        showToast('success', 'Berhasil disalin ke clipboard!');
    } catch(e) {
        showToast('error', 'Gagal menyalin ke clipboard');
    }
};

// Clear cache handler
document.getElementById('clearLocalCacheBtn').onclick = async () => {
    const confirmed = await confirmAction('Hapus cache lokal? Data akan disinkronkan ulang dari cloud.');
    
    if (confirmed) {
        localStorage.removeItem('rp_cache');
        showToast('success', 'Cache lokal berhasil dihapus');
        if(currentUser) loadData();
    }
};

// ============ PASSWORD TOGGLE ============
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function() {
        const target = document.getElementById(this.dataset.target);
        if(target.type === 'password') {
            target.type = 'text';
            this.innerHTML = '<span class="material-symbols-rounded">visibility_off</span>';
        } else {
            target.type = 'password';
            this.innerHTML = '<span class="material-symbols-rounded">visibility</span>';
        }
    });
});

// ============ DIGITAL CLOCK FUNCTION ============
function updateDigitalClock() {
    const now = new Date();
    
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');
    
    const hoursElem = document.getElementById('hours');
    const minutesElem = document.getElementById('minutes');
    const secondsElem = document.getElementById('seconds');
    
    if (hoursElem) hoursElem.textContent = hours;
    if (minutesElem) minutesElem.textContent = minutes;
    if (secondsElem) secondsElem.textContent = seconds;
    
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    
    const dateString = `${dayName}, ${day} ${month} ${year}`;
    const clockDateElem = document.getElementById('clockDate');
    if (clockDateElem) clockDateElem.textContent = dateString;
}

setInterval(updateDigitalClock, 1000);
updateDigitalClock();

// ============ AUTH STATE ============
onAuthStateChanged(auth, async (user) => {
    if(user) {
        currentUser = user;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').classList.add('show');
        updateSync();
        await loadUserProfile();
        loadData();
        renderProfile();
        showTab('dashboard');
    } else {
        currentUser = null;
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').classList.remove('show');
        if(unsub) unsub();
        entries = [];
        if(chart) {
            chart.destroy();
            chart = null;
        }
    }
});

// ============ INITIAL SYNC CHECK ============
updateSync();

// ============ EXPORT TOAST FUNCTION ============
window.showToast = showToast;