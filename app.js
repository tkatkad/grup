// Konfigurasi
const CONFIG = {
    adminPass: 'proyekadmin123', // Password admin
    countdownSeconds: 3,
    xorKey: 123 // Kunci enkripsi (Angka)
};

let groupsData = [];
let currentGroup = null;
let isAdmin = false;
let captchaResult = 0;
let redirectUrl = '';

// --- Core Functions ---

async function init() {
    setupTheme();
    await loadGroups();
    setupEventListeners();
    checkAdminSession();
}

async function loadGroups() {
    try {
        const response = await fetch('groups.json');
        if (!response.ok) throw new Error('Gagal load JSON');
        groupsData = await response.json();
        renderGroups(groupsData);
    } catch (error) {
        console.error(error);
        document.getElementById('app').innerHTML = `
            <div class="text-center py-10 text-red-500">
                <p class="font-bold">⚠️ Gagal memuat data grup.</p>
                <p class="text-xs mt-2 opacity-75">Pastikan file groups.json ada di folder yang sama.</p>
                <p class="text-[10px] mt-1 font-mono bg-red-50 p-2 rounded inline-block">${error.message}</p>
            </div>`;
    }
}

function renderGroups(data) {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    
    if (loading) loading.style.display = 'none';
    
    if (data.length === 0) {
        app.innerHTML = '<div class="text-center py-10 text-gray-500 text-sm">Tidak ada grup ditemukan.</div>';
        return;
    }

    // Group by Category
    const grouped = data.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    let html = '';
    
    Object.keys(grouped).sort().forEach(category => {
        html += `
            <div class="category-group mb-6 fade-in">
                <h2 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1 ml-1">
                    ${category}
                </h2>
                <div class="space-y-3">
                    ${grouped[category].map(group => createCardHTML(group)).join('')}
                </div>
            </div>
        `;
    });

    app.innerHTML = html;
}

function createCardHTML(group) {
    const statusBadge = getStatusBadge(group.status);
    return `
        <div onclick="openModal(${group.id})" class="bg-white dark:bg-darkCard p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-[0.98] transition-transform cursor-pointer flex items-center gap-4 hover:shadow-md">
            <div class="text-3xl bg-gray-50 dark:bg-gray-800 w-14 h-14 flex items-center justify-center rounded-2xl flex-shrink-0 shadow-inner">
                ${group.icon}
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 truncate text-base">${group.name}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-1 line-clamp-2">${group.description}</p>
                <div class="flex items-center gap-2 mt-2">
                    ${statusBadge}
                </div>
            </div>
            <div class="text-gray-300 dark:text-gray-600 flex-shrink-0">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">Aktif 🟢</span>',
        'new': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Baru 🔵</span>',
        'hot': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">Ramai 🔥</span>',
        'trending': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">Trending 🟣</span>',
        'developing': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">Berkembang 🟡</span>'
    };
    
    if (status && status.startsWith('members_')) {
        const count = status.split('_')[1];
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">👥 ${count}+</span>`;
    }

    return badges[status] || badges['active'];
}

// --- Modal & Security Logic ---

window.openModal = (id) => {
    // Pastikan id dibandingkan sebagai number atau string secara konsisten
    currentGroup = groupsData.find(g => g.id == id);
    if (!currentGroup) {
        console.error("Grup tidak ditemukan:", id);
        return;
    }

    try {
        redirectUrl = xorDecrypt(currentGroup.encoded);
        if (!redirectUrl.startsWith('http')) {
             // Fallback jika hasil decrypt aneh, coba asumsikan base64 biasa (untuk data lama)
             try { redirectUrl = atob(currentGroup.encoded); } catch(e) {}
        }
    } catch (e) {
        alert("Link error! Hubungi admin.");
        return;
    }

    document.getElementById('modalIcon').textContent = currentGroup.icon;
    document.getElementById('modalTitle').textContent = currentGroup.name;
    document.getElementById('modalCategory').textContent = currentGroup.category;
    document.getElementById('modalDesc').textContent = currentGroup.description;
    
    document.getElementById('captchaInput').value = '';
    document.getElementById('captchaError').classList.add('hidden');
    setupCaptcha();
    
    document.getElementById('modalOverlay').classList.remove('hidden');
    // Small delay for animation
    setTimeout(() => {
        document.getElementById('bottomSheet').classList.remove('translate-y-full');
    }, 10);
};

window.closeModal = () => {
    document.getElementById('bottomSheet').classList.add('translate-y-full');
    setTimeout(() => {
        document.getElementById('modalOverlay').classList.add('hidden');
    }, 300);
};

function setupCaptcha() {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    captchaResult = n1 + n2;
    document.getElementById('captchaQuestion').textContent = `${n1} + ${n2} = ?`;
    
    const btn = document.getElementById('actionBtn');
    btn.disabled = true;
    btn.className = "w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-not-allowed";
    document.getElementById('btnText').textContent = "Selesaikan Captcha";
}

document.getElementById('captchaInput').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (val === captchaResult) {
        startCountdown();
    } else {
        document.getElementById('captchaError').classList.add('hidden');
        // Jangan reset button kalau belum selesai, biarkan user mencoba lagi
        const btn = document.getElementById('actionBtn');
        if(btn.disabled) {
             btn.className = "w-full bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-not-allowed";
             document.getElementById('btnText').textContent = "Selesaikan Captcha";
        }
    }
});

function startCountdown() {
    const btn = document.getElementById('actionBtn');
    const txt = document.getElementById('btnText');
    let timeLeft = CONFIG.countdownSeconds;

    btn.disabled = true; // Tetap disable selama countdown
    btn.className = "w-full bg-waDark text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg scale-105";
    
    const timer = setInterval(() => {
        txt.textContent = `Redirect dalam ${timeLeft}s...`;
        timeLeft--;
        
        if (timeLeft < 0) {
            clearInterval(timer);
            window.location.href = redirectUrl;
            txt.textContent = "Membuka WhatsApp...";
        }
    }, 1000);
}

window.copyInvite = async () => {
    if(!redirectUrl) return;
    try {
        await navigator.clipboard.writeText(redirectUrl);
        const originalText = event.currentTarget.innerHTML;
        event.currentTarget.innerHTML = "✅ Tersalin!";
        setTimeout(() => event.currentTarget.innerHTML = originalText, 2000);
    } catch (err) {
        alert("Gagal menyalin link.");
    }
};

window.shareGroup = async () => {
    if (!currentGroup) return;
    if (navigator.share) {
        try {
            await navigator.share({
                title: currentGroup.name,
                text: `Join grup ${currentGroup.name}: ${currentGroup.description}`,
                url: window.location.href
            });
        } catch (err) {}
    } else {
        copyInvite();
    }
};

// --- Utilities ---

function setupTheme() {
    const toggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
        toggle.textContent = '☀️';
    } else {
        html.classList.remove('dark');
        toggle.textContent = '🌙';
    }

    toggle.onclick = () => {
        html.classList.toggle('dark');
        localStorage.theme = html.classList.contains('dark') ? 'dark' : 'light';
        toggle.textContent = html.classList.contains('dark') ? '☀️' : '🌙';
    };
}

function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = groupsData.filter(g => 
            g.name.toLowerCase().includes(term) || 
            g.category.toLowerCase().includes(term) ||
            g.description.toLowerCase().includes(term)
        );
        renderGroups(filtered);
    });

    // Admin Login Logic (Click footer version 5 times)
    let clickCount = 0;
    const loginTrigger = document.getElementById('adminLoginHint');
    
    if (loginTrigger) {
        loginTrigger.addEventListener('click', () => {
            clickCount++;
            // Reset counter jika jeda klik terlalu lama (opsional, disini simple saja)
            if (clickCount === 5) {
                const pass = prompt("🔒 Masukkan Password Admin:");
                if (pass === CONFIG.adminPass) {
                    isAdmin = true;
                    localStorage.setItem('wa_admin', 'true');
                    alert("✅ Login Berhasil!\n\nTombol Gear (⚙️) muncul di pojok kanan atas.");
                    checkAdminSession();
                } else if (pass !== null) {
                    alert("❌ Password Salah!");
                }
                clickCount = 0;
            }
        });
    } else {
        console.warn("Elemen adminLoginHint tidak ditemukan di HTML");
    }
}

function checkAdminSession() {
    if (localStorage.getItem('wa_admin') === 'true') {
        isAdmin = true;
        const btn = document.getElementById('adminTrigger');
        if(btn) btn.classList.remove('hidden');
    }
}

// --- Encryption Helper (XOR Simple) ---
function xorEncrypt(str) {
    return str.split('').map(char => {
        return String.fromCharCode(char.charCodeAt(0) ^ CONFIG.xorKey);
    }).join('');
}

function xorDecrypt(encoded) {
    // Cek apakah string terlihat seperti hasil XOR (biasanya ada karakter unik)
    // Atau kita coba decode langsung. Jika gagal/error, anggap bukan XOR.
    try {
        // Jika encoded masih base64 (data lama), coba decode base64 dulu
        if (/^[A-Za-z0-9+/=]+$/.test(encoded) && encoded.length > 10) {
             const decodedBase64 = atob(encoded);
             // Jika hasil base64 valid URL, kembalikan
             if (decodedBase64.startsWith('http')) return decodedBase64;
        }
        
        // Proses XOR
        return encoded.split('').map(char => {
            return String.fromCharCode(char.charCodeAt(0) ^ CONFIG.xorKey);
        }).join('');
    } catch (e) {
        return encoded; // Return apa adanya jika error
    }
}

// --- ADMIN PANEL FUNCTIONS ---

// Pastikan fungsi ini tersedia di window scope
window.toggleAdminPanel = () => {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;
    
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
        panel.classList.remove('hidden');
        renderAdminList();
        updateJsonOutput();
    } else {
        panel.classList.add('hidden');
    }
};

function renderAdminList() {
    const list = document.getElementById('adminList');
    if (!list) return;

    if (groupsData.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 text-sm py-4">Belum ada data grup.</p>';
        return;
    }

    list.innerHTML = groupsData.map((g, index) => `
        <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
            <div class="flex items-center gap-3 overflow-hidden">
                <span class="text-xl">${g.icon}</span>
                <div class="min-w-0">
                    <p class="text-sm font-bold truncate text-gray-800 dark:text-gray-200">${g.name}</p>
                    <p class="text-[10px] text-gray-500 truncate">${g.category}</p>
                </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
                <button onclick="editGroup(${index})" class="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-blue-200 transition">Edit</button>
                <button onclick="deleteGroup(${index})" class="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-200 transition">Hapus</button>
            </div>
        </div>
    `).join('');
}

window.deleteGroup = (index) => {
    if(confirm('Yakin ingin menghapus grup ini dari daftar?')) {
        groupsData.splice(index, 1);
        renderAdminList();
        updateJsonOutput();
    }
};

window.editGroup = (index) => {
    const g = groupsData[index];
    const newName = prompt("Nama Grup:", g.name);
    if(!newName) return;
    
    const newDesc = prompt("Deskripsi:", g.description);
    const newStatus = prompt("Status (active, new, hot, trending, developing, members_XXX):", g.status);
    const newLink = prompt("Link WhatsApp Asli (akan dienkripsi otomatis):", "https://chat.whatsapp.com/...");
    
    if(newLink && newLink.startsWith('http')) {
        groupsData[index] = {
            ...g,
            name: newName,
            description: newDesc || g.description,
            status: newStatus || g.status,
            encoded: xorEncrypt(newLink) // Encrypt sebelum simpan
        };
        renderAdminList();
        updateJsonOutput();
        alert("✅ Data terupdate di memori!\nJangan lupa klik 'Copy JSON Result' untuk menyimpan permanen.");
    } else if (newLink !== null) {
        alert("❌ Link tidak valid (harus dimulai dengan http/https)");
    }
};

window.openEditor = () => {
    const name = prompt("Nama Grup Baru:");
    if(!name) return;
    const category = prompt("Kategori (contoh: Pendidikan, Umum):", "Umum");
    const icon = prompt("Emoji Icon:", "📢");
    const desc = prompt("Deskripsi:", "");
    const status = prompt("Status (active, new, hot, dll):", "new");
    const link = prompt("Masukkan Link WhatsApp Lengkap:", "https://chat.whatsapp.com/");
    
    if(link && link.startsWith('http')) {
        const newId = groupsData.length > 0 ? Math.max(...groupsData.map(g => g.id)) + 1 : 1;
        groupsData.push({
            id: newId,
            name, 
            category: category || "Umum", 
            icon: icon || "📢", 
            description: desc, 
            status,
            encoded: xorEncrypt(link)
        });
        renderAdminList();
        updateJsonOutput();
        alert("✅ Grup ditambahkan!\nSilakan scroll ke bawah dan klik 'Copy JSON Result'.");
    } else if (link !== null) {
        alert("❌ Link tidak valid.");
    }
};

function updateJsonOutput() {
    const output = document.getElementById('jsonOutput');
    if(output) {
        output.value = JSON.stringify(groupsData, null, 2);
    }
}

window.copyJsonResult = () => {
    const output = document.getElementById('jsonOutput');
    if(!output) return;
    
    output.select();
    output.setSelectionRange(0, 99999); // Mobile support
    
    try {
        document.execCommand('copy');
        alert("✅ JSON berhasil dicopy!\n\nLANGKAH SELANJUTNYA:\n1. Buka repository GitHub Anda.\n2. Buka file groups.json.\n3. Klik ikon Pensil (Edit).\n4. Hapus semua isi, Paste JSON ini.\n5. Commit changes.");
    } catch (err) {
        alert("Gagal menyalin otomatis. Silakan blok teks di kotak hitam dan copy manual.");
    }
};

// Start App
document.addEventListener('DOMContentLoaded', init);
