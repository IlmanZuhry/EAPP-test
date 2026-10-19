const PAGE_META = {
    dashboard: ["Dashboard", "Ringkasan data Olimpiade Sains Nasional"],
    peserta: ["Data Peserta", "Telusuri dan saring seluruh data peserta"],
    analisis: ["Analisis", "Visualisasi dan ringkasan statistik dataset"],
    pengaturan: ["Pengaturan", "Pengaturan tampilan dan informasi dataset"]
};

let dataset = [];
let columns = [];
let stats = {};
let analysis = {};
let currentPage = 1;
const pageSize = 12;
const charts = {};
let toastTimer = null;

const $ = (id) => document.getElementById(id);
const fmt = (value) => Number(value || 0).toLocaleString("id-ID");
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));

function showToast(message) {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

function navigate(page) {
    if (!PAGE_META[page]) return;
    document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
    const target = $("page-" + page);
    if (target) target.classList.add("active");
    document.querySelectorAll(".menu").forEach(el => el.classList.toggle("active", el.dataset.page === page));
    $("pageTitle").textContent = PAGE_META[page][0];
    $("pageSubtitle").textContent = PAGE_META[page][1];
    if (page === "analisis") renderAnalysis();
    if (page === "peserta") renderParticipants();
}

document.querySelectorAll(".menu").forEach(button => button.addEventListener("click", () => navigate(button.dataset.page)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.go)));

function findColumn(candidates) {
    const lower = columns.map(c => [String(c).toLowerCase(), c]);
    for (const candidate of candidates) {
        const found = lower.find(([key]) => key === candidate.toLowerCase());
        if (found) return found[1];
    }
    for (const candidate of candidates) {
        const found = lower.find(([key]) => key.includes(candidate.toLowerCase()));
        if (found) return found[1];
    }
    return null;
}

function groupCounts(column) {
    if (!column) return {};
    const result = {};
    dataset.forEach(row => {
        const value = String(row[column] ?? "").trim();
        if (value) result[value] = (result[value] || 0) + 1;
    });
    return Object.fromEntries(Object.entries(result).sort((a,b) => b[1] - a[1]));
}

function fillSelect(id, values, firstLabel) {
    const select = $(id);
    const old = select.value;
    select.innerHTML = `<option value="">${esc(firstLabel)}</option>` +
        values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join("");
    if (values.includes(old)) select.value = old;
}

function renderStats() {
    $("statPeserta").textContent = fmt(stats.total_peserta);
    $("statBidang").textContent = fmt(stats.total_bidang);
    $("statTahun").textContent = fmt(stats.total_tahun);
    $("statProvinsi").textContent = fmt(stats.total_provinsi);
    $("medalEmas").textContent = fmt(stats.emas);
    $("medalPerak").textContent = fmt(stats.perak);
    $("medalPerunggu").textContent = fmt(stats.perunggu);
    $("analysisTotal").textContent = fmt(stats.total_peserta);
    $("analysisMedals").textContent = fmt((stats.emas || 0) + (stats.perak || 0) + (stats.perunggu || 0));

    const fields = groupCounts(findColumn(["bidang", "cabang", "field", "kategori"]));
    const years = groupCounts(findColumn(["tahun", "year"]));
    $("analysisTopField").textContent = Object.keys(fields)[0] || "—";
    $("analysisTopYear").textContent = Object.keys(years)[0] || "—";
}

function renderTableHead(targetId, cols) {
    $(targetId).innerHTML = `<tr>${cols.map(col => `<th>${esc(col)}</th>`).join("")}</tr>`;
}

function renderTableBody(targetId, rows, cols, emptyMessage = "Tidak ada data yang cocok.") {
    const body = $(targetId);
    if (!rows.length) {
        body.innerHTML = `<tr><td class="empty" colspan="${Math.max(cols.length, 1)}">${esc(emptyMessage)}</td></tr>`;
        return;
    }
    body.innerHTML = rows.map(row => `<tr>${cols.map(col => `<td>${esc(row[col]) || '<span class="muted">—</span>'}</td>`).join("")}</tr>`).join("");
}

function renderPreview() {
    const cols = columns.slice(0, 6);
    renderTableHead("previewHead", cols);
    renderTableBody("previewBody", dataset.slice(0, 8), cols, "Dataset belum berisi data.");
}

function filteredRows() {
    const q = $("searchInput").value.trim().toLowerCase();
    const field = $("fieldFilter").value;
    const year = $("yearFilter").value;
    const medal = $("medalFilter").value;
    const fieldCol = findColumn(["bidang", "cabang", "field", "kategori"]);
    const yearCol = findColumn(["tahun", "year"]);
    const medalCol = findColumn(["medali", "medal", "penghargaan"]);
    return dataset.filter(row => {
        const matchSearch = !q || columns.some(col => String(row[col] ?? "").toLowerCase().includes(q));
        const matchField = !field || String(row[fieldCol] ?? "") === field;
        const matchYear = !year || String(row[yearCol] ?? "") === year;
        const matchMedal = !medal || String(row[medalCol] ?? "") === medal;
        return matchSearch && matchField && matchYear && matchMedal;
    });
}

function renderParticipants() {
    const fieldCol = findColumn(["bidang", "cabang", "field", "kategori"]);
    const yearCol = findColumn(["tahun", "year"]);
    const medalCol = findColumn(["medali", "medal", "penghargaan"]);
    fillSelect("fieldFilter", fieldCol ? Object.keys(groupCounts(fieldCol)).sort() : [], "Semua bidang");
    fillSelect("yearFilter", yearCol ? Object.keys(groupCounts(yearCol)).sort((a,b) => String(b).localeCompare(String(a), undefined, {numeric:true})) : [], "Semua tahun");
    fillSelect("medalFilter", medalCol ? Object.keys(groupCounts(medalCol)).sort() : [], "Semua medali");

    const rows = filteredRows();
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    renderTableHead("participantsHead", columns);
    renderTableBody("participantsBody", rows.slice(start, start + pageSize), columns);
    $("participantCount").textContent = `${fmt(rows.length)} data`;
    $("tableInfo").textContent = rows.length ? `Menampilkan ${start + 1}–${Math.min(start + pageSize, rows.length)} dari ${fmt(rows.length)} data` : "Tidak ada data untuk ditampilkan";
    $("pageInfo").textContent = `Halaman ${currentPage} dari ${totalPages}`;
    $("prevPage").disabled = currentPage <= 1;
    $("nextPage").disabled = currentPage >= totalPages;
}

["searchInput", "fieldFilter", "yearFilter", "medalFilter"].forEach(id => {
    $(id).addEventListener(id === "searchInput" ? "input" : "change", () => { currentPage = 1; renderParticipants(); });
});
$("resetFilters").addEventListener("click", () => {
    $("searchInput").value = "";
    ["fieldFilter", "yearFilter", "medalFilter"].forEach(id => $(id).value = "");
    currentPage = 1;
    renderParticipants();
});
$("prevPage").addEventListener("click", () => { if (currentPage > 1) { currentPage--; renderParticipants(); } });
$("nextPage").addEventListener("click", () => { currentPage++; renderParticipants(); });

function destroyChart(key) {
    if (charts[key]) {
        charts[key].destroy();
        delete charts[key];
    }
}

function makeChart(key, canvasId, type, labels, values, label, colors) {
    if (!window.Chart) return;
    destroyChart(key);
    const canvas = $(canvasId);
    if (!canvas) return;
    charts[key] = new Chart(canvas, {
        type,
        data: {
            labels,
            datasets: [{
                label,
                data: values,
                backgroundColor: colors || ["#7669e8", "#5da9e9", "#ed8ab5", "#f2c45e", "#59b99b", "#a995e8", "#f29a70"],
                borderColor: type === "line" ? "#7669e8" : undefined,
                borderWidth: type === "line" ? 2 : 0,
                borderRadius: type === "bar" ? 6 : 0,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: type === "doughnut" || type === "pie" } },
            scales: (type === "doughnut" || type === "pie") ? {} : {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { grid: { display: false } }
            }
        }
    });
}

function topEntries(counts, limit = 10) {
    const entries = Object.entries(counts || {}).slice(0, limit);
    return { labels: entries.map(x => x[0]), values: entries.map(x => x[1]) };
}

function renderDashboardCharts() {
    const fields = topEntries(groupCounts(findColumn(["bidang", "cabang", "field", "kategori"])), 8);
    makeChart("dashField", "dashboardBidangChart", "bar", fields.labels, fields.values, "Peserta");
    const years = groupCounts(findColumn(["tahun", "year"]));
    const yearEntries = Object.entries(years).sort((a,b) => String(a[0]).localeCompare(String(b[0]), undefined, {numeric:true}));
    makeChart("dashYear", "dashboardTahunChart", "line", yearEntries.map(x => x[0]), yearEntries.map(x => x[1]), "Peserta");
}

function renderAnalysis() {
    const fields = topEntries(groupCounts(findColumn(["bidang", "cabang", "field", "kategori"])), 12);
    const medals = groupCounts(findColumn(["medali", "medal", "penghargaan"]));
    const years = groupCounts(findColumn(["tahun", "year"]));
    const provinces = topEntries(groupCounts(findColumn(["provinsi", "province"])), 10);
    makeChart("analysisField", "analysisFieldChart", "bar", fields.labels, fields.values, "Peserta");
    makeChart("analysisMedal", "analysisMedalChart", "doughnut", Object.keys(medals), Object.values(medals), "Medali");
    const yearEntries = Object.entries(years).sort((a,b) => String(a[0]).localeCompare(String(b[0]), undefined, {numeric:true}));
    makeChart("analysisYear", "analysisYearChart", "line", yearEntries.map(x => x[0]), yearEntries.map(x => x[1]), "Peserta");
    makeChart("analysisProvince", "analysisProvinceChart", "bar", provinces.labels, provinces.values, "Peserta");
    const missing = [];
    if (!findColumn(["bidang", "cabang", "field", "kategori"])) missing.push("bidang");
    if (!findColumn(["tahun", "year"])) missing.push("tahun");
    if (!findColumn(["medali", "medal", "penghargaan"])) missing.push("medali");
    if (!findColumn(["provinsi", "province"])) missing.push("provinsi");
    $("analysisNote").textContent = missing.length
        ? `Kolom ${missing.join(", ")} tidak ditemukan atau memiliki nama berbeda pada CSV. Grafik terkait mungkin kosong.`
        : "Grafik dihitung langsung dari seluruh baris dataset yang berhasil dimuat. Jumlah baris pada setiap kategori tidak selalu berarti jumlah orang unik jika dataset memiliki data duplikat.";
}

function renderSettings() {
    $("settingsStatus").textContent = "Berhasil dimuat";
    $("settingsRows").textContent = fmt(dataset.length);
    $("settingsColumns").textContent = fmt(columns.length);
    $("columnChips").innerHTML = columns.length
        ? columns.map(col => `<span class="chip">${esc(col)}</span>`).join("")
        : '<span class="muted">Tidak ada kolom yang terdeteksi.</span>';
}

async function loadData() {
    $("dataStatus").textContent = "Memuat data...";
    $("dataStatus").classList.remove("error");
    $("refreshBtn").disabled = true;
    try {
        if (typeof eel === "undefined" || typeof eel.ambil_data !== "function") {
            throw new Error("Eel tidak tersedia. Jalankan aplikasi melalui python main.py.");
        }
        const result = await eel.ambil_data()();
        if (!result || !result.success) throw new Error(result?.message || "Data gagal dimuat.");
        dataset = Array.isArray(result.data) ? result.data : [];
        columns = Array.isArray(result.columns) ? result.columns : (dataset[0] ? Object.keys(dataset[0]) : []);
        stats = result.statistik || {};
        analysis = result.analisis || {};
        $("dataStatus").textContent = "Data terhubung";
        renderStats();
        renderPreview();
        renderDashboardCharts();
        renderParticipants();
        renderSettings();
        if ($("page-analisis").classList.contains("active")) renderAnalysis();
        showToast("Dataset berhasil dimuat.");
    } catch (error) {
        $("dataStatus").textContent = "Gagal memuat data";
        $("dataStatus").classList.add("error");
        $("settingsStatus").textContent = "Gagal dimuat";
        $("previewBody").innerHTML = `<tr><td class="empty" colspan="6">${esc(error.message)}</td></tr>`;
        $("participantsBody").innerHTML = `<tr><td class="empty" colspan="6">${esc(error.message)}</td></tr>`;
        showToast(error.message || "Terjadi kesalahan saat memuat data.");
    } finally {
        $("refreshBtn").disabled = false;
    }
}

$("refreshBtn").addEventListener("click", loadData);
$("settingsRefresh").addEventListener("click", loadData);
$("darkModeToggle").addEventListener("change", event => {
    document.body.classList.toggle("dark-mode", event.target.checked);
    showToast(event.target.checked ? "Tema gelap diaktifkan." : "Tema terang diaktifkan.");
});

loadData();
