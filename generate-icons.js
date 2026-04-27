// ============ ICON GENERATOR UNTUK PWA ============
// Script ini akan membuat icon PWA secara dinamis menggunakan Canvas API
// Jalankan script ini sekali untuk membuat semua icon yang dibutuhkan

function generatePwaIcons() {
    const sizes = [48, 72, 96, 144, 192, 512];
    const colors = {
        primary: '#4f46e5',
        primaryLight: '#6366f1',
        white: '#ffffff',
        dark: '#1e1b4b',
        accent: '#a5b4fc'
    };

    sizes.forEach(size => {
        // Icon reguler
        generateIcon(size, colors.primary, colors.white, false);
        
        // Icon maskable (dengan padding aman)
        if (size === 512 || size === 192) {
            generateIcon(size, '#1e1b4b', colors.primaryLight, true);
        }
    });

    // Icon untuk shortcuts
    generateShortcutIcon(96, colors.primary, colors.white, '✏️');
    generateShortcutIcon(96, '#10b981', colors.white, '📊');
}

function generateIcon(size, bgColor, iconColor, isMaskable) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const padding = isMaskable ? size * 0.2 : size * 0.1;
    const safeWidth = size - (padding * 2);
    const safeHeight = size - (padding * 2);
    const centerX = size / 2;
    const centerY = size / 2;

    // Background dengan rounded rectangle
    ctx.fillStyle = bgColor;
    roundRect(ctx, padding, padding, safeWidth, safeHeight, size * 0.2);
    ctx.fill();

    // Gambar ikon otak/psychology
    drawBrainIcon(ctx, centerX, centerY, size * 0.4, iconColor);

    // Tambahkan border subtle
    if (!isMaskable) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = size * 0.02;
        roundRect(ctx, padding, padding, safeWidth, safeHeight, size * 0.2);
        ctx.stroke();
    }

    // Download icon
    downloadIcon(canvas, `icon-${size}${isMaskable ? '-maskable' : ''}.png`);
}

function generateShortcutIcon(size, bgColor, iconColor, emoji) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background circle
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw emoji as text
    ctx.fillStyle = iconColor;
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, centerX, centerY);

    downloadIcon(canvas, `icon-shortcut-${size}.png`);
}

function drawBrainIcon(ctx, centerX, centerY, scale, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = scale * 0.08;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Gambar bentuk sederhana otak menggunakan path
    const brainPath = new Path2D();
    
    // Left hemisphere
    brainPath.moveTo(centerX - scale * 0.3, centerY - scale * 0.8);
    brainPath.bezierCurveTo(
        centerX - scale * 0.9, centerY - scale * 0.8,
        centerX - scale * 0.9, centerY + scale * 0.8,
        centerX - scale * 0.3, centerY + scale * 0.8
    );
    brainPath.bezierCurveTo(
        centerX - scale * 0.5, centerY + scale * 0.5,
        centerX - scale * 0.5, centerY - scale * 0.5,
        centerX - scale * 0.3, centerY - scale * 0.8
    );

    // Right hemisphere
    brainPath.moveTo(centerX + scale * 0.3, centerY - scale * 0.8);
    brainPath.bezierCurveTo(
        centerX + scale * 0.9, centerY - scale * 0.8,
        centerX + scale * 0.9, centerY + scale * 0.8,
        centerX + scale * 0.3, centerY + scale * 0.8
    );
    brainPath.bezierCurveTo(
        centerX + scale * 0.5, centerY + scale * 0.5,
        centerX + scale * 0.5, centerY - scale * 0.5,
        centerX + scale * 0.3, centerY - scale * 0.8
    );

    // Center line
    brainPath.moveTo(centerX - scale * 0.15, centerY - scale * 0.5);
    brainPath.bezierCurveTo(
        centerX, centerY - scale * 0.3,
        centerX, centerY + scale * 0.3,
        centerX + scale * 0.15, centerY + scale * 0.5
    );

    ctx.fill(brainPath);
    ctx.stroke(brainPath);

    // Tambahkan garis-garis dalam (gyri)
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 0.5, centerY - scale * 0.3);
    ctx.quadraticCurveTo(centerX - scale * 0.4, centerY - scale * 0.1, centerX - scale * 0.5, centerY + scale * 0.1);
    
    ctx.moveTo(centerX - scale * 0.2, centerY - scale * 0.2);
    ctx.quadraticCurveTo(centerX - scale * 0.1, centerY, centerX - scale * 0.2, centerY + scale * 0.2);
    
    ctx.moveTo(centerX + scale * 0.2, centerY - scale * 0.2);
    ctx.quadraticCurveTo(centerX + scale * 0.3, centerY, centerX + scale * 0.2, centerY + scale * 0.2);
    
    ctx.moveTo(centerX + scale * 0.5, centerY - scale * 0.3);
    ctx.quadraticCurveTo(centerX + scale * 0.4, centerY - scale * 0.1, centerX + scale * 0.5, centerY + scale * 0.1);
    
    ctx.stroke();

    ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function downloadIcon(canvas, filename) {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log(`✅ Generated: ${filename}`);
    }, 'image/png', 1.0);
}

// Auto-generate saat script dimuat
console.log('🎨 Generating PWA icons...');
generatePwaIcons();
console.log('✨ All icons generated! Save them to /icons/ folder');