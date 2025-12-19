/**
 * FuzzyHealth - Fuzzy Logic Sugeno Engine
 * Implementasi lengkap metode Fuzzy Sugeno untuk penilaian risiko kesehatan
 */

class FuzzySugenoEngine {
    constructor() {
        // Definisi fungsi keanggotaan untuk setiap variabel input
        this.membershipFunctions = {
            bloodPressure: {
                rendah: { type: 'trapezoid', params: [70, 70, 90, 110] },
                normal: { type: 'triangular', params: [90, 120, 140] },
                tinggi: { type: 'trapezoid', params: [130, 150, 200, 200] }
            },
            bloodSugar: {
                rendah: { type: 'trapezoid', params: [50, 50, 60, 80] },
                normal: { type: 'triangular', params: [70, 100, 130] },
                tinggi: { type: 'trapezoid', params: [120, 150, 300, 300] }
            },
            bmi: {
                underweight: { type: 'trapezoid', params: [15, 15, 16, 18.5] },
                normal: { type: 'triangular', params: [18, 22, 25] },
                overweight: { type: 'triangular', params: [24, 27, 30] },
                obese: { type: 'trapezoid', params: [29, 32, 45, 45] }
            },
            age: {
                muda: { type: 'trapezoid', params: [1, 1, 20, 35] },
                dewasa: { type: 'triangular', params: [30, 45, 60] },
                lansia: { type: 'trapezoid', params: [55, 65, 100, 100] }
            }
        };

        // Aturan Sugeno (output: konstanta risiko 0-100)
        this.rules = [
            // Aturan untuk kondisi optimal (risiko rendah)
            { if: { bp: 'normal', bs: 'normal', bmi: 'normal', age: 'muda' }, then: 10 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'normal', age: 'dewasa' }, then: 20 },
            { if: { bp: 'rendah', bs: 'normal', bmi: 'normal', age: 'muda' }, then: 15 },
            { if: { bp: 'normal', bs: 'rendah', bmi: 'normal', age: 'muda' }, then: 20 },
            
            // Aturan sedang
            { if: { bp: 'normal', bs: 'normal', bmi: 'normal', age: 'lansia' }, then: 35 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'overweight', age: 'muda' }, then: 30 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'overweight', age: 'dewasa' }, then: 40 },
            { if: { bp: 'tinggi', bs: 'normal', bmi: 'normal', age: 'muda' }, then: 45 },
            { if: { bp: 'normal', bs: 'tinggi', bmi: 'normal', age: 'muda' }, then: 45 },
            { if: { bp: 'tinggi', bs: 'normal', bmi: 'normal', age: 'dewasa' }, then: 50 },
            { if: { bp: 'normal', bs: 'tinggi', bmi: 'normal', age: 'dewasa' }, then: 50 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'underweight', age: 'muda' }, then: 25 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'underweight', age: 'lansia' }, then: 45 },
            
            // Aturan risiko sedang-tinggi
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'normal', age: 'muda' }, then: 55 },
            { if: { bp: 'tinggi', bs: 'normal', bmi: 'overweight', age: 'muda' }, then: 50 },
            { if: { bp: 'normal', bs: 'tinggi', bmi: 'overweight', age: 'muda' }, then: 50 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'normal', age: 'dewasa' }, then: 60 },
            { if: { bp: 'tinggi', bs: 'normal', bmi: 'overweight', age: 'dewasa' }, then: 55 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'obese', age: 'muda' }, then: 50 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'obese', age: 'dewasa' }, then: 55 },
            
            // Aturan risiko tinggi
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'overweight', age: 'muda' }, then: 65 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'normal', age: 'lansia' }, then: 70 },
            { if: { bp: 'tinggi', bs: 'normal', bmi: 'obese', age: 'dewasa' }, then: 70 },
            { if: { bp: 'normal', bs: 'tinggi', bmi: 'obese', age: 'dewasa' }, then: 70 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'overweight', age: 'dewasa' }, then: 75 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'overweight', age: 'lansia' }, then: 80 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'obese', age: 'muda' }, then: 75 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'obese', age: 'dewasa' }, then: 85 },
            { if: { bp: 'tinggi', bs: 'tinggi', bmi: 'obese', age: 'lansia' }, then: 95 },
            
            // Aturan tambahan
            { if: { bp: 'normal', bs: 'normal', bmi: 'overweight', age: 'lansia' }, then: 50 },
            { if: { bp: 'normal', bs: 'normal', bmi: 'obese', age: 'lansia' }, then: 65 },
            { if: { bp: 'tinggi', bs: 'normal', bmi: 'normal', age: 'lansia' }, then: 60 },
            { if: { bp: 'normal', bs: 'tinggi', bmi: 'normal', age: 'lansia' }, then: 60 },
            { if: { bp: 'rendah', bs: 'rendah', bmi: 'underweight', age: 'muda' }, then: 30 },
            { if: { bp: 'rendah', bs: 'normal', bmi: 'underweight', age: 'lansia' }, then: 50 }
        ];
        
        this.calculationSteps = [];
    }

    // Fungsi keanggotaan triangular
    triangular(x, a, b, c) {
        if (x <= a || x >= c) return 0;
        if (x === b) return 1;
        if (x < b) return (x - a) / (b - a);
        return (c - x) / (c - b);
    }

    // Fungsi keanggotaan trapezoid
    trapezoid(x, a, b, c, d) {
        if (x <= a || x >= d) return 0;
        if (x >= b && x <= c) return 1;
        if (x < b) return (x - a) / (b - a);
        return (d - x) / (d - c);
    }

    // Hitung derajat keanggotaan untuk satu fungsi
    calculateMembership(value, mfConfig) {
        if (mfConfig.type === 'triangular') {
            const [a, b, c] = mfConfig.params;
            return this.triangular(value, a, b, c);
        } else if (mfConfig.type === 'trapezoid') {
            const [a, b, c, d] = mfConfig.params;
            return this.trapezoid(value, a, b, c, d);
        }
        return 0;
    }

    // Fuzzifikasi: hitung semua derajat keanggotaan untuk satu variabel
    fuzzify(variable, value) {
        const mfs = this.membershipFunctions[variable];
        const result = {};
        for (const [name, config] of Object.entries(mfs)) {
            result[name] = parseFloat(this.calculateMembership(value, config).toFixed(4));
        }
        return result;
    }

    // Fuzzifikasi semua input
    fuzzifyAll(inputs) {
        return {
            bloodPressure: this.fuzzify('bloodPressure', inputs.bloodPressure),
            bloodSugar: this.fuzzify('bloodSugar', inputs.bloodSugar),
            bmi: this.fuzzify('bmi', inputs.bmi),
            age: this.fuzzify('age', inputs.age)
        };
    }

    // Evaluasi aturan (gunakan operator AND = MIN)
    evaluateRule(rule, fuzzifiedInputs) {
        const bpDegree = fuzzifiedInputs.bloodPressure[rule.if.bp] || 0;
        const bsDegree = fuzzifiedInputs.bloodSugar[rule.if.bs] || 0;
        const bmiDegree = fuzzifiedInputs.bmi[rule.if.bmi] || 0;
        const ageDegree = fuzzifiedInputs.age[rule.if.age] || 0;
        
        // Operator AND menggunakan MIN
        const firingStrength = Math.min(bpDegree, bsDegree, bmiDegree, ageDegree);
        
        return {
            rule: rule,
            firingStrength: firingStrength,
            output: rule.then
        };
    }

    // Defuzzifikasi Sugeno: Weighted Average
    defuzzify(ruleResults) {
        let sumWeightedOutput = 0;
        let sumWeights = 0;
        
        for (const result of ruleResults) {
            if (result.firingStrength > 0) {
                sumWeightedOutput += result.firingStrength * result.output;
                sumWeights += result.firingStrength;
            }
        }
        
        if (sumWeights === 0) return 50; // Default jika tidak ada aturan yang aktif
        
        return sumWeightedOutput / sumWeights;
    }

    // Proses inferensi lengkap
    infer(inputs) {
        this.calculationSteps = [];
        
        // Step 1: Fuzzifikasi
        const fuzzifiedInputs = this.fuzzifyAll(inputs);
        this.calculationSteps.push({
            step: 'Fuzzifikasi',
            content: this.formatFuzzificationStep(inputs, fuzzifiedInputs)
        });
        
        // Step 2: Evaluasi Rules
        const ruleResults = [];
        const activeRules = [];
        
        for (const rule of this.rules) {
            const result = this.evaluateRule(rule, fuzzifiedInputs);
            ruleResults.push(result);
            if (result.firingStrength > 0) {
                activeRules.push(result);
            }
        }
        
        this.calculationSteps.push({
            step: 'Evaluasi Aturan',
            content: this.formatRulesStep(activeRules)
        });
        
        // Step 3: Defuzzifikasi (Weighted Average)
        const output = this.defuzzify(ruleResults);
        
        this.calculationSteps.push({
            step: 'Defuzzifikasi (Weighted Average)',
            content: this.formatDefuzzificationStep(activeRules, output)
        });
        
        return {
            riskScore: parseFloat(output.toFixed(2)),
            fuzzifiedInputs: fuzzifiedInputs,
            activeRules: activeRules,
            calculationSteps: this.calculationSteps
        };
    }

    formatFuzzificationStep(inputs, fuzzified) {
        let content = 'Input Values:\n';
        content += `  Tekanan Darah: ${inputs.bloodPressure} mmHg\n`;
        content += `  Gula Darah: ${inputs.bloodSugar} mg/dL\n`;
        content += `  BMI: ${inputs.bmi}\n`;
        content += `  Usia: ${inputs.age} tahun\n\n`;
        
        content += 'Derajat Keanggotaan:\n';
        content += `  Tekanan Darah: ${JSON.stringify(fuzzified.bloodPressure)}\n`;
        content += `  Gula Darah: ${JSON.stringify(fuzzified.bloodSugar)}\n`;
        content += `  BMI: ${JSON.stringify(fuzzified.bmi)}\n`;
        content += `  Usia: ${JSON.stringify(fuzzified.age)}`;
        
        return content;
    }

    formatRulesStep(activeRules) {
        if (activeRules.length === 0) {
            return 'Tidak ada aturan yang aktif (firing strength = 0)';
        }
        
        let content = `${activeRules.length} aturan aktif:\n\n`;
        
        // Urutkan berdasarkan firing strength tertinggi
        const sorted = [...activeRules].sort((a, b) => b.firingStrength - a.firingStrength);
        const top5 = sorted.slice(0, 5);
        
        for (const result of top5) {
            const rule = result.rule;
            content += `IF BP=${rule.if.bp} AND BS=${rule.if.bs} AND BMI=${rule.if.bmi} AND Age=${rule.if.age}\n`;
            content += `   THEN Risiko = ${rule.then}\n`;
            content += `   Firing Strength = ${result.firingStrength.toFixed(4)}\n\n`;
        }
        
        if (sorted.length > 5) {
            content += `... dan ${sorted.length - 5} aturan lainnya`;
        }
        
        return content;
    }

    formatDefuzzificationStep(activeRules, output) {
        let content = 'Metode: Weighted Average (Sugeno)\n\n';
        content += 'Formula:\n';
        content += '  Z = Σ(wi × zi) / Σ(wi)\n\n';
        content += 'Dimana:\n';
        content += '  wi = firing strength aturan ke-i\n';
        content += '  zi = output (konstanta) aturan ke-i\n\n';
        
        let sumWZ = 0;
        let sumW = 0;
        
        for (const result of activeRules) {
            if (result.firingStrength > 0) {
                sumWZ += result.firingStrength * result.output;
                sumW += result.firingStrength;
            }
        }
        
        content += `Perhitungan:\n`;
        content += `  Σ(wi × zi) = ${sumWZ.toFixed(4)}\n`;
        content += `  Σ(wi) = ${sumW.toFixed(4)}\n`;
        content += `  Z = ${sumWZ.toFixed(4)} / ${sumW.toFixed(4)}\n`;
        content += `  Z = ${output.toFixed(2)}\n\n`;
        content += `Hasil Akhir: ${output.toFixed(2)} (Skor Risiko 0-100)`;
        
        return content;
    }

    // Dapatkan risiko level
    getRiskLevel(score) {
        if (score <= 30) return { level: 'low', text: 'Risiko Rendah 🟢', class: 'low' };
        if (score <= 60) return { level: 'medium', text: 'Risiko Sedang 🟡', class: 'medium' };
        return { level: 'high', text: 'Risiko Tinggi 🔴', class: 'high' };
    }

    // Dapatkan saran kesehatan
    getHealthTips(score, inputs) {
        const tips = [];
        
        if (inputs.bloodPressure >= 140) {
            tips.push({
                icon: '🩺',
                title: 'Tekanan Darah Tinggi',
                text: 'Kurangi asupan garam, olahraga teratur, dan konsultasikan dengan dokter tentang pengelolaan hipertensi.'
            });
        }
        
        if (inputs.bloodSugar >= 126) {
            tips.push({
                icon: '🍬',
                title: 'Gula Darah Tinggi',
                text: 'Batasi konsumsi karbohidrat sederhana dan gula, perbanyak serat, dan pertimbangkan untuk cek HbA1c.'
            });
        }
        
        if (inputs.bmi >= 25) {
            tips.push({
                icon: '⚖️',
                title: 'Berat Badan Berlebih',
                text: 'Kombinasikan diet seimbang dengan olahraga 150 menit per minggu untuk mencapai berat badan ideal.'
            });
        } else if (inputs.bmi < 18.5) {
            tips.push({
                icon: '🍎',
                title: 'Berat Badan Kurang',
                text: 'Tingkatkan asupan kalori dengan makanan bergizi. Konsultasikan dengan ahli gizi jika diperlukan.'
            });
        }
        
        if (inputs.age >= 60) {
            tips.push({
                icon: '👴',
                title: 'Kesehatan Lansia',
                text: 'Lakukan pemeriksaan kesehatan rutin minimal 6 bulan sekali. Jaga aktivitas fisik dan sosial.'
            });
        }
        
        if (score <= 30) {
            tips.push({
                icon: '✨',
                title: 'Pertahankan Gaya Hidup Sehat',
                text: 'Kondisi kesehatan Anda cukup baik. Teruskan pola hidup sehat dengan diet seimbang dan olahraga teratur.'
            });
        }
        
        return tips;
    }
}

// Export untuk digunakan modul lain
window.FuzzySugenoEngine = FuzzySugenoEngine;
