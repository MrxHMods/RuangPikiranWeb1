import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";
import { getFirestore, enableIndexedDbPersistence, collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

// ============ AUTO CACHE CONTROL ============
const CACHE_VERSION = '1.0.3';
const CACHE_EXPIRY_DAYS = 7;
const MAX_CACHE_ENTRIES = 500;

// Service Worker Registration for Cache Control
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => registration.unregister());
            console.log('✅ Service workers unregistered for fresh content');
        });
    });
}

function getCacheMetadata() {
    try {
        const metadata = localStorage.getItem('rp_cache_metadata');
        return metadata ? JSON.parse(metadata) : { version: CACHE_VERSION, lastCleanup: null, totalEntries: 0 };
    } catch (e) {
        return { version: CACHE_VERSION, lastCleanup: null, totalEntries: 0 };
    }
}

function setCacheMetadata(metadata) {
    try {
        localStorage.setItem('rp_cache_metadata', JSON.stringify(metadata));
    } catch (e) {
        console.warn('Failed to save cache metadata:', e);
    }
}

function cleanExpiredCache() {
    const metadata = getCacheMetadata();
    const now = new Date();
    
    if (metadata.version !== CACHE_VERSION) {
        console.log('🔄 Cache version mismatch, clearing old cache...');
        localStorage.removeItem('rp_cache');
        metadata.version = CACHE_VERSION;
        metadata.lastCleanup = now.toISOString();
        metadata.totalEntries = 0;
        setCacheMetadata(metadata);
        return;
    }
    
    if (metadata.lastCleanup) {
        const lastCleanup = new Date(metadata.lastCleanup);
        const daysSinceCleanup = (now - lastCleanup) / (1000 * 60 * 60 * 24);
        
        if (daysSinceCleanup >= CACHE_EXPIRY_DAYS) {
            console.log('🧹 Cleaning expired cache...');
            const cachedEntries = JSON.parse(localStorage.getItem('rp_cache') || '[]');
            
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - CACHE_EXPIRY_DAYS);
            
            const validEntries = cachedEntries.filter(entry => {
                const entryDate = new Date(entry.date || entry.timestamp);
                return entryDate >= cutoffDate;
            });
            
            const trimmedEntries = validEntries.slice(0, MAX_CACHE_ENTRIES);
            
            localStorage.setItem('rp_cache', JSON.stringify(trimmedEntries));
            metadata.lastCleanup = now.toISOString();
            metadata.totalEntries = trimmedEntries.length;
            setCacheMetadata(metadata);
            
            console.log(`✅ Cache cleaned: ${cachedEntries.length - trimmedEntries.length} entries removed`);
        }
    } else {
        metadata.lastCleanup = now.toISOString();
        setCacheMetadata(metadata);
    }
}

function optimizeCache() {
    try {
        const cachedEntries = JSON.parse(localStorage.getItem('rp_cache') || '[]');
        if (cachedEntries.length > MAX_CACHE_ENTRIES) {
            console.log('📦 Cache optimization: trimming entries...');
            const trimmedEntries = cachedEntries.slice(0, MAX_CACHE_ENTRIES);
            localStorage.setItem('rp_cache', JSON.stringify(trimmedEntries));
            
            const metadata = getCacheMetadata();
            metadata.totalEntries = trimmedEntries.length;
            setCacheMetadata(metadata);
        }
    } catch (e) {
        console.warn('Cache optimization failed:', e);
    }
}

function clearAllCaches() {
    localStorage.removeItem('rp_cache');
    localStorage.removeItem('rp_cache_metadata');
    localStorage.removeItem('rp_read_notifications');
    console.log('🗑️ All caches cleared');
}

function addCacheBuster(url) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${CACHE_VERSION}&t=${Date.now()}`;
}

setInterval(() => {
    cleanExpiredCache();
    optimizeCache();
}, 60 * 60 * 1000);

cleanExpiredCache();
optimizeCache();

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        clearAllCaches();
        showToast('success', 'Cache berhasil dibersihkan! Refresh halaman untuk efek penuh.', 'Cache Cleared');
        setTimeout(() => location.reload(), 2000);
    }
});

// ============ FIREBASE CONFIG ============
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

    const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const toastTitle = title || toastTitles[type] || 'Notifikasi';
    const icon = toastIcons[type] || 'info';
    
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
    
    container.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    const duration = type === 'error' ? 5000 : 3500;
    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.add('hide');
            toast.addEventListener('transitionend', () => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, { once: true });
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 500);
        }
    }, duration);
    
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

function showAlert(message, type = 'warning') {
    showToast(type, message);
}

const originalAlert = window.alert;
window.alert = function(message) {
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

// ============ ENHANCED RAIN ANIMATION ============
const canvas = document.getElementById('rainCanvas');
let ctx = canvas.getContext('2d');
let width, height;
let drops = [];
let splashes = [];
let mistParticles = [];

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function createRaindrop() {
    const speed = Math.random() * 8 + 12;
    const length = Math.random() * 25 + 8;
    const opacity = Math.random() * 0.35 + 0.08;
    
    return {
        x: Math.random() * width * 1.2 - width * 0.1,
        y: Math.random() * -height - 50,
        length: length,
        speed: speed,
        opacity: opacity,
        width: Math.random() * 1.2 + 0.3,
        windDrift: (Math.random() - 0.5) * 1.5,
        wobble: Math.random() * 0.5,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        wobbleOffset: Math.random() * Math.PI * 2,
        trailLength: Math.floor(length * 0.6)
    };
}

function createSplash(x, y, speed) {
    const particles = [];
    const particleCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const velocity = Math.random() * speed * 0.3 + speed * 0.1;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            life: 1.0,
            decay: Math.random() * 0.06 + 0.04,
            size: Math.random() * 1.5 + 0.5,
            gravity: 0.08
        });
    }
    return particles;
}

function createMist(x, y) {
    return {
        x: x + (Math.random() - 0.5) * 20,
        y: y - Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.2 - 0.05,
        life: Math.random() * 0.5 + 0.3,
        size: Math.random() * 8 + 4
    };
}

for(let i = 0; i < 180; i++) {
    drops.push(createRaindrop());
}

function drawRain() {
    if(!ctx) return;
    
    ctx.clearRect(0, 0, width, height);
    
    const mistGradient = ctx.createLinearGradient(0, height * 0.75, 0, height);
    mistGradient.addColorStop(0, 'rgba(79, 70, 229, 0)');
    mistGradient.addColorStop(1, 'rgba(79, 70, 229, 0.015)');
    ctx.fillStyle = mistGradient;
    ctx.fillRect(0, 0, width, height);
    
    for (let i = splashes.length - 1; i >= 0; i--) {
        const splash = splashes[i];
        splash.life -= splash.decay;
        
        if (splash.life <= 0) {
            splashes.splice(i, 1);
            continue;
        }
        
        splash.vy += splash.gravity;
        splash.x += splash.vx;
        splash.y += splash.vy;
        
        const alpha = splash.life * 0.6;
        const size = splash.size * splash.life;
        
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, size, 0, Math.PI * 2);
        
        const splashGradient = ctx.createRadialGradient(splash.x, splash.y, 0, splash.x, splash.y, size);
        splashGradient.addColorStop(0, `rgba(180, 200, 255, ${alpha})`);
        splashGradient.addColorStop(0.5, `rgba(140, 170, 240, ${alpha * 0.6})`);
        splashGradient.addColorStop(1, `rgba(100, 140, 220, 0)`);
        
        ctx.fillStyle = splashGradient;
        ctx.fill();
    }
    
    for (let i = mistParticles.length - 1; i >= 0; i--) {
        const mist = mistParticles[i];
        mist.life -= 0.004;
        mist.x += mist.vx;
        mist.y += mist.vy;
        
        if (mist.life <= 0) {
            mistParticles.splice(i, 1);
            continue;
        }
        
        const alpha = mist.life * 0.06;
        ctx.beginPath();
        ctx.arc(mist.x, mist.y, mist.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 180, 220, ${alpha})`;
        ctx.fill();
    }
    
    const time = Date.now();
    
    for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        
        const wobbleX = Math.sin(time * drop.wobbleSpeed + drop.wobbleOffset) * drop.wobble;
        const x = drop.x + wobbleX;
        const y = drop.y;
        const fullLength = drop.length;
        const trailLength = fullLength * 0.4;
        
        const dropGradient = ctx.createLinearGradient(x, y, x, y + fullLength);
        const alpha = drop.opacity;
        dropGradient.addColorStop(0, `rgba(200, 215, 255, ${alpha * 0.2})`);
        dropGradient.addColorStop(0.3, `rgba(170, 195, 245, ${alpha * 0.5})`);
        dropGradient.addColorStop(0.7, `rgba(130, 165, 235, ${alpha * 0.8})`);
        dropGradient.addColorStop(1, `rgba(100, 145, 225, ${alpha})`);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + fullLength);
        ctx.strokeStyle = dropGradient;
        ctx.lineWidth = drop.width;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        const trailGradient = ctx.createLinearGradient(x, y - trailLength, x, y);
        trailGradient.addColorStop(0, `rgba(160, 190, 240, 0)`);
        trailGradient.addColorStop(1, `rgba(180, 200, 245, ${alpha * 0.25})`);
        
        ctx.beginPath();
        ctx.moveTo(x, y - trailLength);
        ctx.lineTo(x, y);
        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = drop.width * 0.7;
        ctx.stroke();
        
        if (drop.opacity > 0.28) {
            ctx.beginPath();
            ctx.moveTo(x, y + 2);
            ctx.lineTo(x, y + fullLength - 2);
            ctx.strokeStyle = `rgba(200, 220, 255, ${alpha * 0.1})`;
            ctx.lineWidth = drop.width + 1.5;
            ctx.stroke();
        }
        
        drop.y += drop.speed;
        drop.x += drop.windDrift;
        
        if (drop.y > height) {
            const newSplashes = createSplash(drop.x, height, drop.speed);
            splashes.push(...newSplashes);
            
            if (Math.random() < 0.4) {
                mistParticles.push(createMist(drop.x, height));
            }
            
            drop.y = -drop.length - Math.random() * 150;
            drop.x = Math.random() * width * 1.2 - width * 0.1;
            
            if (Math.random() < 0.25) {
                drop.speed = Math.random() * 8 + 12;
                drop.length = Math.random() * 25 + 8;
                drop.opacity = Math.random() * 0.35 + 0.08;
                drop.windDrift = (Math.random() - 0.5) * 1.5;
                drop.width = Math.random() * 1.2 + 0.3;
            }
        }
        
        if (drop.x > width + 20) drop.x = -20;
        if (drop.x < -20) drop.x = width + 20;
    }
    
    if (splashes.length > 100) splashes.splice(0, splashes.length - 100);
    if (mistParticles.length > 80) mistParticles.splice(0, mistParticles.length - 80);
    
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

// Notification variables
let notifications = [];
let unreadNotifications = [];
let notificationListener = null;

const today = () => new Date().toISOString().split('T')[0];
const moodEmoji = (m) => {
    const emojis = {1:"😭",2:"😞",3:"😟",4:"🙁",5:"😐",6:"🙂",7:"😊",8:"😃",9:"😍",10:"🤩"};
    return emojis[m] || "😐";
};

// ============ NOTIFICATION SYSTEM ============
function loadNotifications() {
    if (!currentUser) return;
    
    if (notificationListener) notificationListener();
    
    const notifRef = collection(db, 'global_notifications');
    const q = query(notifRef, orderBy('timestamp', 'desc'), limit(50));
    
    notificationListener = onSnapshot(q, (snap) => {
        notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const readIds = JSON.parse(localStorage.getItem('rp_read_notifications') || '[]');
        unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
        
        updateNotificationBadge();
        showLatestNotification();
    }, (error) => {
        console.error("Notification load error:", error);
    });
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const bell = document.getElementById('notificationBell');
    if (!badge || !bell) return;
    
    if (unreadNotifications.length > 0) {
        badge.style.display = 'flex';
        badge.textContent = unreadNotifications.length > 99 ? '99+' : unreadNotifications.length;
        bell.classList.add('has-unread');
    } else {
        badge.style.display = 'none';
        bell.classList.remove('has-unread');
    }
}

function showLatestNotification() {
    const banner = document.getElementById('notificationBanner');
    if (!banner) return;
    
    const readIds = JSON.parse(localStorage.getItem('rp_read_notifications') || '[]');
    const latestUnread = notifications.find(n => !readIds.includes(n.id));
    
    if (latestUnread) {
        const icon = document.getElementById('notificationIcon');
        const title = document.getElementById('notificationTitle');
        const message = document.getElementById('notificationMessage');
        const date = document.getElementById('notificationDate');
        
        const type = latestUnread.type || 'info';
        const icons = {
            urgent: 'emergency',
            warning: 'warning',
            info: 'info',
            success: 'check_circle',
            announcement: 'campaign'
        };
        
        if (icon) icon.textContent = icons[type] || 'campaign';
        
        banner.className = `notification-banner ${type}`;
        if (title) title.textContent = latestUnread.title || 'Notifikasi';
        if (message) message.textContent = latestUnread.message || '';
        if (date) {
            const notifDate = new Date(latestUnread.timestamp);
            date.textContent = notifDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        banner.style.display = 'block';
    } else {
        banner.style.display = 'none';
    }
}

function markNotificationAsRead(notifId) {
    const readIds = JSON.parse(localStorage.getItem('rp_read_notifications') || '[]');
    if (!readIds.includes(notifId)) {
        readIds.push(notifId);
        localStorage.setItem('rp_read_notifications', JSON.stringify(readIds));
    }
    unreadNotifications = notifications.filter(n => !readIds.includes(n.id));
    updateNotificationBadge();
    showLatestNotification();
    renderNotificationList();
}

function markAllNotificationsAsRead() {
    const allIds = notifications.map(n => n.id);
    localStorage.setItem('rp_read_notifications', JSON.stringify(allIds));
    unreadNotifications = [];
    updateNotificationBadge();
    showLatestNotification();
    renderNotificationList();
}

function renderNotificationList() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    const readIds = JSON.parse(localStorage.getItem('rp_read_notifications') || '[]');
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="notification-empty">
                <span class="material-symbols-rounded">notifications_off</span>
                <p>Belum ada notifikasi</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        ${notifications.map(n => {
            const isUnread = !readIds.includes(n.id);
            const type = n.type || 'info';
            const date = new Date(n.timestamp);
            
            return `
                <div class="notification-item ${type} ${isUnread ? 'unread' : ''}" onclick="window.markNotificationAsRead('${n.id}')">
                    <div class="notification-item-title">${n.title || 'Notifikasi'}</div>
                    <div class="notification-item-message">${n.message || ''}</div>
                    <div class="notification-item-date">
                        ${date.toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>
            `;
        }).join('')}
        <div class="notification-actions">
            <button class="btn-mark-read" onclick="event.stopPropagation(); window.markAllNotificationsAsRead();">
                <span class="material-symbols-rounded">done_all</span>
                Tandai Semua Dibaca
            </button>
        </div>
    `;
}

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
        loadNotifications();
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

// ============ NOTIFICATION EVENT LISTENERS ============
document.getElementById('notificationBell').addEventListener('click', () => {
    const modal = document.getElementById('notificationModal');
    renderNotificationList();
    modal.classList.add('show');
});

document.getElementById('closeNotificationModal').addEventListener('click', () => {
    document.getElementById('notificationModal').classList.remove('show');
});

document.getElementById('notificationModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('notificationModal')) {
        document.getElementById('notificationModal').classList.remove('show');
    }
});

document.getElementById('notificationCloseBtn').addEventListener('click', () => {
    const readIds = JSON.parse(localStorage.getItem('rp_read_notifications') || '[]');
    const latestUnread = notifications.find(n => !readIds.includes(n.id));
    if (latestUnread) {
        markNotificationAsRead(latestUnread.id);
    }
});

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

document.getElementById('loginBtn').onclick = async () => {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPassword').value;
    
    if(!email || !pass) {
        showError('Isi email dan password');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)) {
        showError('Format email tidak valid');
        return;
    }
    
    if(!isOnline()) return;
    
    const loginBtn = document.getElementById('loginBtn');
    const originalHTML = loginBtn.innerHTML;
    
    try {
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

document.getElementById('registerBtn').onclick = async () => {
    const email = document.getElementById('registerEmail').value.trim();
    const pass = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    
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

document.getElementById('logoutBtn').onclick = async () => {
    const confirmed = await confirmAction('Apakah Anda yakin ingin keluar?');
    
    if (confirmed) {
        try {
            if(unsub) unsub();
            if(notificationListener) notificationListener();
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
        
        const metadata = getCacheMetadata();
        metadata.totalEntries = entries.length;
        setCacheMetadata(metadata);
        
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
        optimizeCache();
    } catch(err) {
        console.error("Save error:", err);
        
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
    
    if (entry.dark.selfHarm || entry.dark.hopeless) {
        showToast('warning', 'Jurnal tersimpan. Jika Anda merasa sangat tertekan, jangan ragu untuk mencari bantuan profesional. 📞 119 ext 8', 'Perhatian');
    }
    
    const existingIndex = entries.findIndex(e => e.date === today());
    if(existingIndex !== -1) entries[existingIndex] = entry;
    else entries.unshift(entry);
    
    await saveEntry(entry);
    showToast('success', 'Jurnal berhasil disimpan!');
    
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
    const confirmed = await confirmAction('Hapus cache lokal? Data akan disinkronkan ulang dari cloud.');
    
    if (confirmed) {
        clearAllCaches();
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
        loadNotifications();
        renderProfile();
        showTab('dashboard');
    } else {
        currentUser = null;
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').classList.remove('show');
        if(unsub) unsub();
        if(notificationListener) notificationListener();
        entries = [];
        notifications = [];
        if(chart) {
            chart.destroy();
            chart = null;
        }
    }
});

// ============ INITIAL SYNC CHECK ============
updateSync();

// ============ EXPORT FUNCTIONS ============
window.showToast = showToast;
window.clearAllCaches = clearAllCaches;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.renderNotificationList = renderNotificationList;