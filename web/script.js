let chartBidangInstance = null;
let chartTahunInstance = null;

async function loadData() {
    try {
        const result = await eel.ambil_data_osn()();
        if (!result.success) {
            alert(result.message);
            return;
        }

        document.getElementById("jumlahPeserta").textContent = result.jumlah.toLocaleString("id-ID");
        document.getElementById("jumlahLaki").textContent = result.laki.toLocaleString("id-ID");
        document.getElementById("jumlahPerempuan").textContent = result.perempuan.toLocaleString("id-ID");
        document.getElementById("jumlahEmas").textContent = result.emas.toLocaleString("id-ID");
        document.getElementById("emas").textContent = result.emas.toLocaleString("id-ID");
        document.getElementById("perak").textContent = result.perak.toLocaleString("id-ID");
        document.getElementById("perunggu").textContent = result.perunggu.toLocaleString("id-ID");

        const tabel = document.getElementById("tabelPeserta");
        tabel.innerHTML = "";
        result.data.forEach(function (peserta) {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${peserta.No}</td>
                <td>${peserta["Nama Peserta"]}</td>
                <td>${peserta.Gender}</td>
                <td>${peserta.Sekolah}</td>
                <td>${peserta.Provinsi}</td>
                <td>${peserta.Bidang}</td>
                <td>${peserta.Medali}</td>
                <td>${peserta.Tahun}</td>
            `;
            tabel.appendChild(row);
        });

        renderCharts(result.bidang, result.tahun);

    } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat mengambil data.");
    }
}

function renderCharts(dataBidang, dataTahun) {
    const ctxBidang = document.getElementById('chartBidang').getContext('2d');

    if (chartBidangInstance) {
        chartBidangInstance.destroy();
    }

    chartBidangInstance = new Chart(ctxBidang, {
        type: 'bar',
        data: {
            labels: dataBidang.labels,
            datasets: [{
                label: 'Jumlah Peserta',
                data: dataBidang.values,
                backgroundColor: 'rgba(117, 104, 232, 0.85)',
                borderColor: '#5548ca',
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    const ctxTahun = document.getElementById('chartTahun').getContext('2d');

    if (chartTahunInstance) {
        chartTahunInstance.destroy();
    }

    chartTahunInstance = new Chart(ctxTahun, {
        type: 'line',
        data: {
            labels: dataTahun.labels,
            datasets: [{
                label: 'Jumlah Peserta',
                data: dataTahun.values,
                borderColor: '#8174ed',
                backgroundColor: 'rgba(129, 116, 237, 0.15)',
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#6457d9',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

window.onload = function () { 
    loadData();
};