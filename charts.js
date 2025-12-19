/**
 * FuzzyHealth - Charts Module
 * Visualisasi fungsi keanggotaan menggunakan Chart.js
 */

class MembershipCharts {
    constructor() {
        this.charts = {};
        this.colorScheme = {
            low: 'rgba(34, 197, 94, 0.7)',
            normal: 'rgba(59, 130, 246, 0.7)',
            high: 'rgba(239, 68, 68, 0.7)',
            medium: 'rgba(245, 158, 11, 0.7)',
            underweight: 'rgba(168, 85, 247, 0.7)',
            overweight: 'rgba(245, 158, 11, 0.7)',
            obese: 'rgba(239, 68, 68, 0.7)',
            muda: 'rgba(34, 197, 94, 0.7)',
            dewasa: 'rgba(59, 130, 246, 0.7)',
            lansia: 'rgba(168, 85, 247, 0.7)',
            rendah: 'rgba(34, 197, 94, 0.7)',
            tinggi: 'rgba(239, 68, 68, 0.7)'
        };
    }

    // Generate data points untuk fungsi keanggotaan
    generateMFData(mfConfig, min, max, steps = 100) {
        const data = [];
        const step = (max - min) / steps;

        for (let x = min; x <= max; x += step) {
            let y = 0;
            if (mfConfig.type === 'triangular') {
                const [a, b, c] = mfConfig.params;
                if (x <= a || x >= c) y = 0;
                else if (x === b) y = 1;
                else if (x < b) y = (x - a) / (b - a);
                else y = (c - x) / (c - b);
            } else if (mfConfig.type === 'trapezoid') {
                const [a, b, c, d] = mfConfig.params;
                if (x <= a || x >= d) y = 0;
                else if (x >= b && x <= c) y = 1;
                else if (x < b) y = (x - a) / (b - a);
                else y = (d - x) / (d - c);
            }
            data.push({ x: x, y: Math.max(0, y) });
        }
        return data;
    }

    // Inisialisasi chart untuk satu variabel
    initChart(canvasId, variable, mfs, min, max, currentValue) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        const datasets = [];

        for (const [name, config] of Object.entries(mfs)) {
            datasets.push({
                label: name.charAt(0).toUpperCase() + name.slice(1),
                data: this.generateMFData(config, min, max),
                borderColor: this.colorScheme[name] || 'rgba(99, 102, 241, 0.7)',
                backgroundColor: (this.colorScheme[name] || 'rgba(99, 102, 241, 0.7)').replace('0.7', '0.1'),
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 0
            });
        }

        // Tambahkan garis vertikal untuk nilai saat ini
        datasets.push({
            label: 'Nilai Saat Ini',
            data: [{ x: currentValue, y: 0 }, { x: currentValue, y: 1 }],
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
        });

        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#cbd5e1' : '#475569';

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        min: min,
                        max: max,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    y: {
                        min: 0,
                        max: 1,
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: textColor, boxWidth: 12, padding: 10 }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Update garis nilai saat ini
    updateCurrentValue(canvasId, value) {
        const chart = this.charts[canvasId];
        if (!chart) return;

        // Dataset terakhir adalah garis nilai saat ini
        const lastDatasetIndex = chart.data.datasets.length - 1;
        chart.data.datasets[lastDatasetIndex].data = [
            { x: value, y: 0 },
            { x: value, y: 1 }
        ];
        chart.update('none');
    }

    // Inisialisasi semua chart
    initAllCharts(engine, inputs) {
        // Blood Pressure Chart
        this.initChart('chartBP', 'bloodPressure',
            engine.membershipFunctions.bloodPressure, 70, 200, inputs.bloodPressure);

        // Blood Sugar Chart
        this.initChart('chartBS', 'bloodSugar',
            engine.membershipFunctions.bloodSugar, 50, 300, inputs.bloodSugar);

        // BMI Chart
        this.initChart('chartBMI', 'bmi',
            engine.membershipFunctions.bmi, 15, 45, inputs.bmi);

        // Age Chart
        this.initChart('chartAge', 'age',
            engine.membershipFunctions.age, 1, 100, inputs.age);
    }

    // Update semua chart
    updateAllCharts(inputs) {
        this.updateCurrentValue('chartBP', inputs.bloodPressure);
        this.updateCurrentValue('chartBS', inputs.bloodSugar);
        this.updateCurrentValue('chartBMI', inputs.bmi);
        this.updateCurrentValue('chartAge', inputs.age);
    }

    // Update tema chart
    updateTheme() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDarkMode ? '#cbd5e1' : '#475569';

        for (const chart of Object.values(this.charts)) {
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.ticks.color = textColor;
            chart.options.plugins.legend.labels.color = textColor;
            chart.update();
        }
    }

    // Destroy semua chart
    destroyAll() {
        for (const chart of Object.values(this.charts)) {
            chart.destroy();
        }
        this.charts = {};
    }
}

window.MembershipCharts = MembershipCharts;
