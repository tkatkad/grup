// Konfigurasi
const CONFIG = {
    adminPass: 'admin123', // Password default
    countdownSeconds: 3,
    xorKey: 123 // Kunci enkripsi sederhana (XOR)
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
        document.getElementById('app').innerHTML = `
            <div class="text-center py-10 text-red-500">
                <p>⚠️ Gagal memuat data grup.</p>
                <p class="text-xs mt-2">Pastikan file groups.json ada dan valid.</p>
            </div>`;
    }
}

function renderGroups(data) {
    const app = document.getElementById('app');
    const loading = document.getElementById('loading');
    
    if (loading) loading.style.display = 'none';
    
    // Group by Category
    const grouped = data.reduce((acc, item) => {
        (acc[item.category] = acc[item.category] || []).push(item);
        return acc;
    }, {});

    let html = '';
    
    Object.keys(grouped).sort().forEach(category => {
        html += `
            <div class="category-group mb-6 fade-in">
                <h2 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
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
        <div onclick="openModal('${group.id}')" class="bg-white dark:bg-darkCard p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 active:scale-95 transition-transform cursor-pointer flex items-center gap-4">
            <div class="text-3xl bg-gray-50 dark:bg-gray-800 w-14 h-14 flex items-center justify-center rounded-2xl flex-shrink-0">
                ${group.icon}
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 dark:text-gray-100 truncate">${group.name}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">${group.description}</p>
                <div class="flex items-center gap-2 mt-2">
                    ${statusBadge}
                </div>
            </div>
            <div class="text-gray-300 dark:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
        </div>
    `;
}

function getStatusBadge(status) {
    const badges = {
        'active': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Aktif 🟢</span>',
        'new': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Baru 🔵</span>',
        'hot': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Ramai 🔥</span>',
        'trending': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Trending 🟣</span>',
        'developing': '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Berkembang 🟡</span>'
    };
    
    // Handle member count badges dynamically if string starts with "members_"
    if (status && status.startsWith('members_')) {
        const count = status.split('_')[1];
        return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">👥 ${count}+</span>`;
    }

    return badges[status] || badges['active'];
}

// --- Modal & Security Logic ---

window.openModal = (id) => {
    currentGroup = groupsData.find(g => g.id == id);
    if (!currentGroup) return;

    // Decode Link (XOR Decrypt)
    try {
        redirectUrl = xorDecrypt(currentGroup.encoded);
    } catch (e) {
        alert("Link error!");
        return;
    }

    // Populate Modal
    document.getElementById('modalIcon').textContent = currentGroup.icon;
    document.getElementById('modalTitle').textContent = currentGroup.name;
    document.getElementById('modalCategory').textContent = currentGroup.category;
    document.getElementById('modalDesc').textContent = currentGroup.description;
    
    // Reset State
    document.getElementById('captchaInput').value = '';
    document.getElementById('captchaError').classList.add('hidden');
    setupCaptcha();
    
    // Show Modal
    document.getElementById('modalOverlay').classList.remove('hidden');
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
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    captchaResult = n1 + n2;
    document.getElementById('captchaQuestion').textContent = `${n1} + ${n2} = ?`;
    
    const btn = document.getElementById('actionBtn');
    btn.disabled = true;
    btn.className = "w-full bg-gray-300 dark:bg-gray-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-not-allowed";
    document.getElementById('btnText').textContent = "Selesaikan Captcha";
}

document.getElementById('captchaInput').addEventListener('input', (e) => {
    if (parseInt(e.target.value) === captchaResult) {
        startCountdown();
    } else {
        document.getElementById('captchaError').classList.add('hidden');
        resetButton();
    }
});

function startCountdown() {
    const btn = document.getElementById('actionBtn');
    const txt = document.getElementById('btnText');
    let timeLeft = CONFIG.countdownSeconds;

    btn.disabled = true;
    btn.className = "w-full bg-waDark text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300";
    
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

function resetButton() {
    const btn = document.getElementById('actionBtn');
    btn.disabled = true;
    btn.className = "w-full bg-gray-300 dark:bg-gray-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-not-allowed";
    document.getElementById('btnText').textContent = "Selesaikan Captcha";
}

window.copyInvite = async () => {
    try {
        await navigator.clipboard.writeText(redirectUrl);
        alert("Link invite berhasil disalin!");
    } catch (err) {
        alert("Gagal menyalin link.");
    }
};

window.shareGroup = async () => {
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
    
    // Check system pref
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
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = groupsData.filter(g => 
            g.name.toLowerCase().includes(term) || 
            g.category.toLowerCase().includes(term)
        );
        renderGroups(filtered);
    });

    // Admin Login Logic (Click footer 5 times)
    let clickCount = 0;
    document.getElementById('adminLoginHint').addEventListener('click', () => {
        clickCount++;
        if (clickCount === 5) {
            const pass = prompt("Masukkan Password Admin:");
            if (pass === CONFIG.adminPass) {
                isAdmin = true;
                localStorage.setItem('wa_admin', 'true');
                alert("Login Berhasil! Tombol gear muncul di atas.");
                checkAdminSession();
            } else {
                alert("Password Salah!");
            }
            clickCount = 0;
        }
    });
}

function checkAdminSession() {
    if (localStorage.getItem('wa_admin') === 'true') {
        isAdmin = true;
        document.getElementById('adminTrigger').classList.remove('hidden');
    }
}

// --- Encryption Helper (XOR Simple) ---
// Note: Ini bukan security tingkat tinggi, tapi cukup untuk hindari scraper bodoh.
function xorEncrypt(str) {
    return str.split('').map(char => {
        return String.fromCharCode(char.charCodeAt(0) ^ CONFIG.xorKey);
    }).join('');
}

function xorDecrypt(encoded) {
    // Jika encoded masih base64/plain (untuk backward compat demo), cek dulu
    if (!encoded.includes(String.fromCharCode(CONFIG.xorKey))) {
         // Fallback jika data belum dienkripsi dengan XOR (misal data dummy awal)
         // Dalam produksi, semua data di JSON harus sudah di-XOR
         return atob(encoded); // Asumsi dummy base64
    }
    
    return encoded.split('').map(char => {
        return String.fromCharCode(char.charCodeAt(0) ^ CONFIG.xorKey);
    }).join('');
}

// --- ADMIN PANEL FUNCTIONS ---

window.toggleAdminPanel = () => {
    const panel = document.getElementById('adminPanel');
    panel.classList.toggle('hidden');
    if (!panel.classList.contains('hidden')) renderAdminList();
};

function renderAdminList() {
    const list = document.getElementById('adminList');
    list.innerHTML = groupsData.map((g, index) => `
        <div class="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div class="flex items-center gap-2 overflow-hidden">
                <span>${g.icon}</span>
                <span class="text-sm font-bold truncate">${g.name}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="editGroup(${index})" class="text-blue-500 text-xs font-bold">Edit</button>
                <button onclick="deleteGroup(${index})" class="text-red-500 text-xs font-bold">Hapus</button>
            </div>
        </div>
    `).join('');
}

window.deleteGroup = (index) => {
    if(confirm('Yakin hapus grup ini?')) {
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
            description: newDesc,
            status: newStatus,
            encoded: xorEncrypt(newLink) // Encrypt sebelum simpan di array sementara
        };
        renderAdminList();
        updateJsonOutput();
        alert("Terupdate! Jangan lupa Copy JSON Result.");
    } else {
        alert("Link tidak valid");
    }
};

window.openEditor = () => {
    const name = prompt("Nama Grup Baru:");
    if(!name) return;
    const category = prompt("Kategori:", "Umum");
    const icon = prompt("Emoji Icon:", "📢");
    const desc = prompt("Deskripsi:", "");
    const status = prompt("Status:", "new");
    const link = prompt("Masukkan Link WhatsApp Lengkap:", "https://chat.whatsapp.com/");
    
    if(link && link.startsWith('http')) {
        const newId = groupsData.length > 0 ? Math.max(...groupsData.map(g => g.id)) + 1 : 1;
        groupsData.push({
            id: newId,
            name, category, icon, description: desc, status,
            encoded: xorEncrypt(link)
        });
        renderAdminList();
        updateJsonOutput();
        alert("Grup ditambahkan! Copy JSON Result untuk disimpan.");
    }
};

function updateJsonOutput() {
    const output = document.getElementById('jsonOutput');
    output.value = JSON.stringify(groupsData, null, 2);
}

window.copyJsonResult = () => {
    const output = document.getElementById('jsonOutput');
    output.select();
    document.execCommand('copy');
    alert("JSON berhasil dicopy! Sekarang paste ke file groups.json di GitHub kamu.");
};

// Start App
init();
