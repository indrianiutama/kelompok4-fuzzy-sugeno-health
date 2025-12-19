/**
 * FuzzyHealth - History Manager
 * Kelola riwayat analisis dan export PDF
 */

class HistoryManager {
    constructor() {
        this.storageKey = 'fuzzyhealth_history';
        this.history = this.loadHistory();
    }

    loadHistory() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading history:', e);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
        } catch (e) {
            console.error('Error saving history:', e);
        }
    }

    addRecord(record) {
        const historyItem = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            profileId: record.profileId || null,
            profileName: record.profileName || 'Anonymous',
            inputs: record.inputs,
            riskScore: record.riskScore,
            riskLevel: record.riskLevel,
            fuzzifiedInputs: record.fuzzifiedInputs
        };

        this.history.unshift(historyItem); // Tambah di awal

        // Batasi maksimal 50 record
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.saveHistory();
        return historyItem;
    }

    deleteRecord(recordId) {
        this.history = this.history.filter(h => h.id !== recordId);
        this.saveHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    getHistory() {
        return this.history;
    }

    formatDate(isoString) {
        const date = new Date(isoString);
        const day = date.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const month = months[date.getMonth()];
        const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        return { day, month, time };
    }

    renderHistory() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (this.history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">📭</span>
                    <p>Belum ada riwayat analisis. Lakukan analisis pertama Anda!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.history.map(item => {
            const { day, month, time } = this.formatDate(item.timestamp);
            const levelClass = item.riskLevel.class;

            return `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-date">
                        <span class="day">${day}</span>
                        <span class="month">${month}</span>
                    </div>
                    <div class="history-info">
                        <div class="history-profile">${this.escapeHtml(item.profileName)}</div>
                        <div class="history-params">
                            TD: ${item.inputs.bloodPressure} mmHg • 
                            GD: ${item.inputs.bloodSugar} mg/dL • 
                            BMI: ${item.inputs.bmi} • 
                            Usia: ${item.inputs.age} thn
                        </div>
                        <div class="history-time" style="font-size: 0.7rem; color: var(--text-muted);">${time}</div>
                    </div>
                    <div class="history-score ${levelClass}">
                        <span class="score">${item.riskScore}</span>
                        <span class="label">${item.riskLevel.text}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export ke PDF menggunakan jsPDF
    exportToPDF(result, inputs, profileName) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(99, 102, 241);
        doc.text('FuzzyHealth', pageWidth / 2, y, { align: 'center' });
        y += 8;

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Laporan Penilaian Risiko Kesehatan', pageWidth / 2, y, { align: 'center' });
        y += 15;

        // Info
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Nama: ${profileName || 'Anonymous'}`, 20, y);
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, pageWidth - 60, y);
        y += 10;

        // Garis pemisah
        doc.setDrawColor(200);
        doc.line(20, y, pageWidth - 20, y);
        y += 15;

        // Input Parameters
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Parameter Input', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text(`Tekanan Darah Sistolik: ${inputs.bloodPressure} mmHg`, 25, y); y += 7;
        doc.text(`Gula Darah Puasa: ${inputs.bloodSugar} mg/dL`, 25, y); y += 7;
        doc.text(`Body Mass Index (BMI): ${inputs.bmi}`, 25, y); y += 7;
        doc.text(`Usia: ${inputs.age} tahun`, 25, y); y += 15;

        // Hasil Analisis
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Hasil Analisis Fuzzy Sugeno', 20, y);
        y += 10;

        doc.setFontSize(12);
        const riskColor = result.riskLevel.level === 'low' ? [34, 197, 94] :
            result.riskLevel.level === 'medium' ? [245, 158, 11] : [239, 68, 68];
        doc.setTextColor(...riskColor);
        doc.text(`Skor Risiko: ${result.riskScore}`, 25, y); y += 7;
        doc.text(`Level: ${result.riskLevel.text}`, 25, y); y += 15;

        // Fuzzifikasi
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Derajat Keanggotaan (Fuzzifikasi)', 20, y);
        y += 10;

        doc.setFontSize(9);
        doc.setTextColor(0);

        const fuzz = result.fuzzifiedInputs;
        doc.text(`Tekanan Darah: Rendah=${fuzz.bloodPressure.rendah.toFixed(2)}, Normal=${fuzz.bloodPressure.normal.toFixed(2)}, Tinggi=${fuzz.bloodPressure.tinggi.toFixed(2)}`, 25, y); y += 6;
        doc.text(`Gula Darah: Rendah=${fuzz.bloodSugar.rendah.toFixed(2)}, Normal=${fuzz.bloodSugar.normal.toFixed(2)}, Tinggi=${fuzz.bloodSugar.tinggi.toFixed(2)}`, 25, y); y += 6;
        doc.text(`BMI: Underweight=${fuzz.bmi.underweight.toFixed(2)}, Normal=${fuzz.bmi.normal.toFixed(2)}, Overweight=${fuzz.bmi.overweight.toFixed(2)}, Obese=${fuzz.bmi.obese.toFixed(2)}`, 25, y); y += 6;
        doc.text(`Usia: Muda=${fuzz.age.muda.toFixed(2)}, Dewasa=${fuzz.age.dewasa.toFixed(2)}, Lansia=${fuzz.age.lansia.toFixed(2)}`, 25, y); y += 15;

        // Metode
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Metode Inferensi', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.text('Metode: Fuzzy Sugeno (Weighted Average)', 25, y); y += 6;
        doc.text('Operator AND: Minimum', 25, y); y += 6;
        doc.text('Defuzzifikasi: Z = Σ(wi × zi) / Σ(wi)', 25, y); y += 20;

        // Disclaimer
        doc.setFillColor(255, 240, 240);
        doc.rect(20, y, pageWidth - 40, 25, 'F');
        doc.setFontSize(9);
        doc.setTextColor(200, 0, 0);
        doc.text('DISCLAIMER:', 25, y + 8);
        doc.setTextColor(100);
        doc.text('Hasil analisis ini adalah simulator edukasi untuk pembelajaran Fuzzy Logic.', 25, y + 15);
        doc.text('Bukan pengganti diagnosis medis profesional. Selalu konsultasikan dengan dokter.', 25, y + 21);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('FuzzyHealth - Sistem Penilaian Risiko Kesehatan dengan Fuzzy Logic Sugeno', pageWidth / 2, 285, { align: 'center' });

        // Download
        doc.save(`FuzzyHealth_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    }

    // Setup event handlers
    init() {
        // Clear history button
        const clearBtn = document.getElementById('btnClearHistory');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Hapus semua riwayat analisis?')) {
                    this.clearHistory();
                    this.renderHistory();
                }
            });
        }

        this.renderHistory();
    }
}

window.HistoryManager = HistoryManager;
