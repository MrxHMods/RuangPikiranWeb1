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

const today = () => new Date().toISOString().split('T')[0];
const moodEmoji = (m) => {
    const emojis = {1:"😭",2:"😞",3:"😟",4:"🙁",5:"😐",6:"🙂",7:"😊",8:"😃",9:"😍",10:"🤩"};
    return emojis[m] || "😐";
};

function showError(msg) {
    const el = document.getElementById('errorMessage');
    el.textContent = '❌ ' + msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
    showToast('error', msg);
}

// ============ SYNC INDICATOR ============
function updateSync() {
    const indicator = document.getElementById('syncIndicator');
    const banner = document.getElementById('offlineBanner');
    if(navigator.onLine) {
        indicator.className = 'sync-indicator online';
        indicator.innerHTML = '<span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle;margin-right:4px;">cloud_done</span> Online';
        banner.classList.remove('show');
        showToast('success', 'Koneksi pulih', 'Online');
    } else {
        indicator.className = 'sync-indicator offline';
        indicator.innerHTML = '<span class="material-symbols-rounded" style="font-size:12px;vertical-align:middle;margin-right:4px;">cloud_off</span> Offline';
        banner.classList.add('show');
        showToast('warning', 'Anda sedang offline', 'Offline');
    }
}

window.addEventListener('online', updateSync);
window.addEventListener('offline', updateSync);

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
        console.log("Offline mode");
        // Load from localStorage if available
        const localProfile = localStorage.getItem('rp_user_profile');
        if (localProfile) {
            try {
                userProfile = JSON.parse(localProfile);
            } catch(e) {
                userProfile = { displayName: currentUser.email?.split('@')[0] || 'Pengguna', gender: '', photoURL: '' };
            }
        }
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
        // Save to localStorage for offline access
        localStorage.setItem('rp_user_profile', JSON.stringify(userProfile));
    } catch(e) {
        // Save locally if offline
        localStorage.setItem('rp_user_profile', JSON.stringify(userProfile));
    }
}

function updateDisplayName() {
    const name = userProfile.displayName || currentUser?.email?.split('@')[0] || 'Pengguna';
    document.getElementById('userDisplay').textContent = name;
    document.getElementById('profileDisplayName').textContent = name;
}

// ============ PROFILE PHOTO FUNCTIONS ============
function renderProfilePhoto() {
    const avatarImg = document.getElementById('profileAvatarImg');
    const avatarIcon = document.getElementById('profileAvatarIcon');
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewIcon = document.getElementById('photoPreviewIcon');
    
    if (userProfile.photoURL && userProfile.photoURL.trim() !== '') {
        // Tampilkan gambar
        if (avatarImg) {
            avatarImg.src = userProfile.photoURL;
            avatarImg.style.display = 'block';
            avatarIcon.style.display = 'none';
            // Fallback jika gambar gagal dimuat
            avatarImg.onerror = () => {
                avatarImg.style.display = 'none';
                avatarIcon.style.display = 'flex';
            };
        }
        if (photoPreview) {
            photoPreview.src = userProfile.photoURL;
            photoPreview.style.display = 'block';
            if (photoPreviewIcon) photoPreviewIcon.style.display = 'none';
            // Fallback
            photoPreview.onerror = () => {
                photoPreview.style.display = 'none';
                if (photoPreviewIcon) photoPreviewIcon.style.display = 'flex';
            };
        }
    } else {
        // Tampilkan icon default
        if (avatarImg) {
            avatarImg.style.display = 'none';
            avatarIcon.style.display = 'flex';
        }
        if (photoPreview) {
            photoPreview.style.display = 'none';
            if (photoPreviewIcon) photoPreviewIcon.style.display = 'flex';
        }
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

// Preview image from URL
function previewPhotoFromUrl(url) {
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewIcon = document.getElementById('photoPreviewIcon');
    
    if (url && url.trim() !== '') {
        photoPreview.src = url;
        photoPreview.style.display = 'block';
        photoPreviewIcon.style.display = 'none';
        // Fallback
        photoPreview.onerror = () => {
            photoPreview.style.display = 'none';
            photoPreviewIcon.style.display = 'flex';
            showToast('error', 'URL gambar tidak valid atau tidak dapat diakses');
        };
    } else {
        photoPreview.style.display = 'none';
        photoPreviewIcon.style.display = 'flex';
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
    // Reset preview
    const photoPreview = document.getElementById('photoPreview');
    const photoPreviewIcon = document.getElementById('photoPreviewIcon');
    const photoUrlInput = document.getElementById('photoUrlInput');
    
    // Clear input
    photoUrlInput.value = '';
    
    // Show current photo as preview
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

// Preview URL when typing
document.getElementById('photoUrlInput').addEventListener('input', (e) => {
    previewPhotoFromUrl(e.target.value);
});

document.getElementById('savePhotoBtn').onclick = async () => {
    const urlInput = document.getElementById('photoUrlInput').value.trim();
    
    if (urlInput) {
        // Validate URL format
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
    await removeProfilePhoto();
    document.getElementById('editPhotoModal').classList.remove('show');
};

document.getElementById('cancelPhotoBtn').onclick = () => {
    document.getElementById('editPhotoModal').classList.remove('show');
};

// Close modals when clicking overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('show');
        }
    });
});

// ============ AUTH HANDLERS ============
document.getElementById('showRegister').onclick = () => {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('errorMessage').classList.remove('show');
};

document.getElementById('showLogin').onclick = () => {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('errorMessage').classList.remove('show');
};

// Handle Enter key for login
document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    if(!email || !pass) return showError('Isi email dan password');
    try {
        const btn = document.getElementById('loginBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">refresh</span> Masuk...';
        
        await signInWithEmailAndPassword(auth, email, pass);
        showToast('success', 'Selamat datang kembali!');
    } catch(err) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            showError('Email atau password salah');
        } else if (err.code === 'auth/too-many-requests') {
            showError('Terlalu banyak percobaan. Coba lagi nanti.');
        } else {
            showError('Gagal masuk. Periksa koneksi Anda.');
        }
    } finally {
        const btn = document.getElementById('loginBtn');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-rounded">login</span> Masuk';
    }
};

document.getElementById('registerBtn').onclick = async () => {
    const email = document.getElementById('registerEmail').value.trim();
    const pass = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    if(!email || !pass) return showError('Isi semua field');
    if(pass !== confirm) return showError('Password tidak cocok');
    if(pass.length < 6) return showError('Password minimal 6 karakter');
    try {
        const btn = document.getElementById('registerBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-rounded" style="animation: spin 1s linear infinite;">refresh</span> Mendaftar...';
        
        await createUserWithEmailAndPassword(auth, email, pass);
        showToast('success', 'Akun berhasil dibuat! Selamat datang.');
    } catch(err) {
        if (err.code === 'auth/email-already-in-use') {
            showError('Email sudah terdaftar');
        } else if (err.code === 'auth/weak-password') {
            showError('Password terlalu lemah');
        } else {
            showError('Registrasi gagal. Coba lagi.');
        }
    } finally {
        const btn = document.getElementById('registerBtn');
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-rounded">person_add</span> Daftar';
    }
};

document.getElementById('logoutBtn').onclick = async () => {
    const confirmed = await new Promise(resolve => {
        const toast = showToast('warning', 'Apakah Anda yakin ingin keluar?', 'Konfirmasi');
        toast.style.cursor = 'pointer';
        toast.onclick = () => {
            toast.remove();
            resolve(true);
        };
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
                resolve(false);
            }
        }, 5000);
    });
    
    if (confirmed) {
        if(unsub) unsub();
        await signOut(auth);
        showToast('info', 'Anda telah keluar');
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
        console.log("Offline mode, loading from cache");
        entries = JSON.parse(localStorage.getItem('rp_cache') || '[]');
        renderDashboard();
        renderProfile();
        if(!document.getElementById('historyPanel').classList.contains('hidden')) renderHistory();
    });
}

async function saveEntry(entry) {
    if(currentUser) {
        try {
            await setDoc(doc(db, 'users', currentUser.uid, 'journal_entries', entry.id.toString()), entry);
        } catch(e) {
            // Save locally if offline
            const localEntries = JSON.parse(localStorage.getItem('rp_cache') || '[]');
            const index = localEntries.findIndex(e => e.id === entry.id);
            if(index !== -1) {
                localEntries[index] = entry;
            } else {
                localEntries.unshift(entry);
            }
            localStorage.setItem('rp_cache', JSON.stringify(localEntries));
        }
    }
}

// ============ RENDER FUNCTIONS ============
function renderDashboard() {
    const todayEntry = entries.find(e => e.date === today());
    if(todayEntry) {
        document.getElementById('todayInsight').innerHTML = `
            <div style="background:var(--bg);padding:16px;border-radius:12px;">
                <div style="font-size:1.3rem;font-weight:bold;">${moodEmoji(todayEntry.mood)} Mood: ${todayEntry.mood}/10</div>
                <div>⚡ Energi: ${todayEntry.energy}/10</div>
                <div style="margin-top:8px;word-wrap:break-word;">"${todayEntry.text.substring(0,150)}${todayEntry.text.length > 150 ? '...' : ''}"</div>
            </div>
        `;
    } else {
        document.getElementById('todayInsight').innerHTML = '<div style="padding:20px;text-align:center;">✨ Belum ada jurnal hari ini. Yuk tulis!</div>';
    }
    
    const last7 = entries.slice(0, 7);
    if(last7.length > 0) {
        const avgMood = (last7.reduce((s, e) => s + e.mood, 0) / last7.length).toFixed(1);
        const darkDays = last7.filter(e => e.dark?.selfHarm || e.dark?.hopeless).length;
        document.getElementById('aiSummary').innerHTML = `
            <strong>🧠 7 Hari Terakhir:</strong><br>
            • Mood rata-rata: <strong>${avgMood}/10</strong><br>
            • ${darkDays} hari dengan pikiran gelap<br>
            ${darkDays >= 3 ? '⚠️ Pertimbangkan konsultasi profesional.' : darkDays > 0 ? '💡 Ada pikiran gelap, jangan ragu cerita ke orang terpercaya.' : '🌟 Mood cukup stabil, pertahankan!'}
        `;
    } else {
        document.getElementById('aiSummary').innerHTML = 'Belum ada data jurnal. Mulai tulis ya!';
    }
    
    document.getElementById('darkTracker').innerHTML = last7.length ? last7.map(e => `
        <div style="padding:10px;margin:5px 0;background:${(e.dark?.selfHarm || e.dark?.hopeless) ? 'var(--danger-soft)' : 'var(--secondary-soft)'};border-radius:8px;">
            <strong>${e.date}</strong>: ${(e.dark?.selfHarm || e.dark?.hopeless) ? '⚠️ Pikiran gelap terdeteksi' : '✅ Aman'}
        </div>
    `).join('') : 'Belum ada data.';
}

function renderHistory() {
    const filterDate = document.getElementById('filterDate').value;
    let filtered = filterDate ? entries.filter(e => e.date === filterDate) : [...entries];
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if(filtered.length === 0) {
        document.getElementById('historyList').innerHTML = '<p style="text-align:center;padding:20px;">Tidak ada jurnal.</p>';
        return;
    }
    
    document.getElementById('historyList').innerHTML = filtered.map(e => `
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
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            const confirmed = await new Promise(resolve => {
                const toast = showToast('warning', 'Hapus jurnal ini? Tindakan tidak dapat dibatalkan.', 'Konfirmasi Hapus');
                toast.style.cursor = 'pointer';
                toast.onclick = () => {
                    toast.remove();
                    resolve(true);
                };
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                        resolve(false);
                    }
                }, 5000);
            });
            
            if (confirmed) {
                try {
                    await deleteDoc(doc(db, 'users', currentUser.uid, 'journal_entries', btn.dataset.id));
                    showToast('success', 'Jurnal berhasil dihapus');
                } catch(e) {
                    showToast('error', 'Gagal menghapus jurnal');
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
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: lastDays.map(d => new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })),
            datasets: [
                { 
                    label: 'Mood', 
                    data: lastDays.map(d => d.mood), 
                    borderColor: '#6366f1', 
                    backgroundColor: 'rgba(99,102,241,0.1)', 
                    tension: 0.3, 
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                { 
                    label: 'Energi', 
                    data: lastDays.map(d => d.energy), 
                    borderColor: '#f59e0b', 
                    backgroundColor: 'rgba(245,158,11,0.1)', 
                    tension: 0.3, 
                    fill: true,
                    pointBackgroundColor: '#f59e0b',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: isDark ? '#94a3b8' : '#64748b'
                    }
                }
            },
            scales: {
                y: { 
                    min: 0, 
                    max: 10, 
                    ticks: { 
                        color: isDark ? '#94a3b8' : '#64748b',
                        stepSize: 1
                    },
                    grid: {
                        color: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                },
                x: { 
                    ticks: { color: isDark ? '#94a3b8' : '#64748b' },
                    grid: {
                        color: isDark ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.1)'
                    }
                }
            }
        }
    });
    
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
    document.getElementById('profileGenderDisplay').textContent = userProfile.gender || 'Belum diisi';
    document.getElementById('profileEmail').textContent = currentUser.email || '-';
    document.getElementById('profileTotalEntries').textContent = `${entries.length} entri`;
    const avg = entries.length ? (entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1) : '-';
    document.getElementById('profileAvgMood').textContent = avg !== '-' ? `${moodEmoji(Math.round(avg))} ${avg}/10` : '-';
    renderProfilePhoto();
}

function showTab(tabId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById(`${tabId}Panel`);
    if (targetPanel) targetPanel.classList.remove('hidden');
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // Save active tab to localStorage
    localStorage.setItem('rp_active_tab', tabId);
    
    if(tabId === 'history') renderHistory();
    if(tabId === 'analytics') renderAnalytics();
    if(tabId === 'dashboard') renderDashboard();
    if(tabId === 'export') document.getElementById('exportPreview').innerHTML = `📝 ${entries.length} jurnal siap diekspor.`;
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
    if(e.target.classList.contains('tag')) {
        e.target.classList.toggle('selected');
        // Haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
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
    
    const existingIndex = entries.findIndex(e => e.date === today());
    if(existingIndex !== -1) entries[existingIndex] = entry;
    else entries.unshift(entry);
    
    await saveEntry(entry);
    showToast('success', 'Jurnal berhasil disimpan!');
    
    // Haptic feedback
    if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
    }
    
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

document.getElementById('quickMoodBtn').onclick = () => showTab('journal');
document.getElementById('resetFilterBtn').onclick = () => {
    document.getElementById('filterDate').value = '';
    renderHistory();
};
document.getElementById('filterDate').onchange = renderHistory;

document.getElementById('exportBtn').onclick = () => {
    let report = entries.map(e => `📅 ${e.date}\nMood: ${e.mood}/10 | Energi: ${e.energy}/10\n${e.text}\n${'─'.repeat(40)}`).join('\n');
    const blob = new Blob([`LAPORAN JURNAL MENTAL\nTanggal: ${today()}\nTotal: ${entries.length} jurnal\n${'═'.repeat(50)}\n\n${report}`], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `laporan_mental_${today()}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('success', 'Laporan berhasil diunduh!');
};

document.getElementById('copyBtn').onclick = async () => {
    const text = entries.map(e => `📅 ${e.date}\nMood: ${e.mood}/10\n${e.text}`).join('\n---\n');
    try {
        await navigator.clipboard.writeText(text);
        showToast('success', 'Berhasil disalin ke clipboard!');
    } catch(e) {
        showToast('error', 'Gagal menyalin ke clipboard');
    }
};

document.getElementById('clearLocalCacheBtn').onclick = async () => {
    const confirmed = await new Promise(resolve => {
        const toast = showToast('warning', 'Hapus cache lokal? Data akan disinkronkan ulang dari cloud.', 'Konfirmasi');
        toast.style.cursor = 'pointer';
        toast.onclick = () => {
            toast.remove();
            resolve(true);
        };
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
                resolve(false);
            }
        }, 5000);
    });
    
    if (confirmed) {
        localStorage.removeItem('rp_cache');
        localStorage.removeItem('rp_user_profile');
        showToast('success', 'Cache lokal berhasil dihapus');
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
    
    // Get hours, minutes, seconds
    let hours = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    
    // Format with leading zeros
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.toString().padStart(2, '0');
    seconds = seconds.toString().padStart(2, '0');
    
    // Update time display
    const hoursElem = document.getElementById('hours');
    const minutesElem = document.getElementById('minutes');
    const secondsElem = document.getElementById('seconds');
    
    if (hoursElem) hoursElem.textContent = hours;
    if (minutesElem) minutesElem.textContent = minutes;
    if (secondsElem) secondsElem.textContent = seconds;
    
    // Format date in Indonesian
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

// Start digital clock - update every second
setInterval(updateDigitalClock, 1000);
updateDigitalClock(); // Initial call

// ============ PWA INSTALL HANDLER ============
let deferredPrompt;

// Check if app is already installed
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Show install prompt if needed
function showInstallPrompt() {
    if (!isAppInstalled() && deferredPrompt) {
        // Create a floating install button (optional)
        const existingBtn = document.getElementById('pwaInstallBtn');
        if (!existingBtn) {
            const installBtn = document.createElement('button');
            installBtn.id = 'pwaInstallBtn';
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                background: var(--primary);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 50px;
                font-family: inherit;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4);
                display: flex;
                align-items: center;
                gap: 8px;
                animation: slideUp 0.5s ease-out;
            `;
            installBtn.innerHTML = `
                <span class="material-symbols-rounded" style="font-size:20px;">download</span>
                Install Aplikasi
            `;
            installBtn.addEventListener('click', () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            showToast('success', 'Terima kasih! Aplikasi sedang di-install.');
                        }
                        deferredPrompt = null;
                        installBtn.remove();
                    });
                }
            });
            document.body.appendChild(installBtn);
            
            // Auto hide after 10 seconds
            setTimeout(() => {
                if (installBtn.parentNode) {
                    installBtn.style.animation = 'slideDown 0.5s ease-in';
                    setTimeout(() => installBtn.remove(), 500);
                }
            }, 10000);
        }
    }
}

// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button after 3 seconds
    setTimeout(showInstallPrompt, 3000);
});

// Track when app is installed
window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    const installBtn = document.getElementById('pwaInstallBtn');
    if (installBtn) installBtn.remove();
    showToast('success', 'Aplikasi berhasil di-install! 🎉');
    console.log('PWA installed successfully');
});

// Add CSS animation for install button
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100px); opacity: 0; }
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

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
        
        // Restore last active tab or default to dashboard
        const lastTab = localStorage.getItem('rp_active_tab') || 'dashboard';
        showTab(lastTab);
        
        // Show install prompt after login
        setTimeout(showInstallPrompt, 5000);
    } else {
        currentUser = null;
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').classList.remove('show');
        if(unsub) unsub();
        entries = [];
    }
});

// ============ INITIAL SYNC CHECK ============
updateSync();

// ============ HANDLE APP SHORTCUTS (PWA) ============
// Check for action parameter in URL (for PWA shortcuts)
function handleAppShortcuts() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action && currentUser) {
        switch(action) {
            case 'journal':
                showTab('journal');
                break;
            case 'dashboard':
                showTab('dashboard');
                break;
            case 'analytics':
                showTab('analytics');
                break;
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Check shortcuts after auth state is ready
const checkShortcutsInterval = setInterval(() => {
    if (currentUser !== undefined) {
        handleAppShortcuts();
        clearInterval(checkShortcutsInterval);
    }
}, 500);

// ============ PWA STANDALONE MODE OPTIMIZATIONS ============
if (window.matchMedia('(display-mode: standalone)').matches) {
    // Add standalone class to body
    document.body.classList.add('pwa-standalone');
    
    // Prevent overscroll/refresh
    document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.chart-container') || 
            e.target.closest('.history-list') ||
            e.target.closest('textarea')) {
            return;
        }
    }, { passive: false });
}

// ============ EXPORT FUNCTIONS ============
window.showToast = showToast;

// ============ NETWORK STATUS CHECK ============
// Periodic sync check
setInterval(() => {
    if (navigator.onLine && currentUser) {
        // Try to sync any unsynced data
        const cached = JSON.parse(localStorage.getItem('rp_cache') || '[]');
        if (cached.length > 0) {
            updateSync();
        }
    }
}, 30000); // Check every 30 seconds

console.log('🧠 Ruang Pikiran - PWA Ready');
console.log('📱 Installable:', isAppInstalled() ? 'Already installed' : 'Ready to install');
console.log('🌐 Online:', navigator.onLine);