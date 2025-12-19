/**
 * FuzzyHealth - Main Application
 * Controller utama untuk semua modul
 */

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi modul
    const fuzzyEngine = new FuzzySugenoEngine();
    const charts = new MembershipCharts();
    const profileManager = new ProfileManager();
    const historyManager = new HistoryManager();

    // State
    let currentResult = null;
    let currentInputs = {
        bloodPressure: 120,
        bloodSugar: 100,
        bmi: 22,
        age: 30
    };

    // ========================================
    // Theme Toggle
    // ========================================
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle?.querySelector('.theme-icon');

    // Load saved theme
    const savedTheme = localStorage.getItem('fuzzyhealth_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fuzzyhealth_theme', newTheme);
        if (themeIcon) themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

        // Update chart colors
        charts.updateTheme();
    });

    // ========================================
    // Mobile Navigation Toggle
    // ========================================
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNav = document.getElementById('mobileNav');

    mobileMenuToggle?.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        mobileNav?.classList.toggle('active');
    });

    // Close mobile nav when clicking a link
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle?.classList.remove('active');
            mobileNav?.classList.remove('active');
        });
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
        if (mobileNav?.classList.contains('active') &&
            !mobileNav.contains(e.target) &&
            !mobileMenuToggle?.contains(e.target)) {
            mobileMenuToggle?.classList.remove('active');
            mobileNav?.classList.remove('active');
        }
    });

    // ========================================
    // Slider Updates
    // ========================================
    const sliders = {
        bloodPressure: { element: document.getElementById('bloodPressure'), display: document.getElementById('bpValue'), preview: document.getElementById('bpMembership') },
        bloodSugar: { element: document.getElementById('bloodSugar'), display: document.getElementById('bsValue'), preview: document.getElementById('bsMembership') },
        bmi: { element: document.getElementById('bmi'), display: document.getElementById('bmiValue'), preview: document.getElementById('bmiMembership') },
        age: { element: document.getElementById('age'), display: document.getElementById('ageValue'), preview: document.getElementById('ageMembership') }
    };

    function updateMembershipPreview(variable, value) {
        const preview = sliders[variable].preview;
        if (!preview) return;

        const memberships = fuzzyEngine.fuzzify(variable, value);

        preview.innerHTML = Object.entries(memberships)
            .filter(([_, degree]) => degree > 0)
            .map(([name, degree]) => `
                <span class="membership-tag">
                    ${name}: <span class="degree">${degree.toFixed(2)}</span>
                </span>
            `).join('');

        if (preview.innerHTML === '') {
            preview.innerHTML = '<span class="membership-tag">-</span>';
        }
    }

    function handleSliderInput(variable) {
        const slider = sliders[variable].element;
        const display = sliders[variable].display;

        if (!slider || !display) return;

        slider.addEventListener('input', () => {
            const value = parseFloat(slider.value);
            currentInputs[variable] = value;

            // Update display
            if (variable === 'bmi') {
                display.textContent = value.toFixed(1);
            } else {
                display.textContent = value;
            }

            // Update preview
            updateMembershipPreview(variable, value);

            // Update chart marker
            const chartIdMap = {
                bloodPressure: 'chartBP',
                bloodSugar: 'chartBS',
                bmi: 'chartBMI',
                age: 'chartAge'
            };
            charts.updateCurrentValue(chartIdMap[variable], value);
        });

        // Initial update
        updateMembershipPreview(variable, parseFloat(slider.value));
    }

    // Setup all sliders
    Object.keys(sliders).forEach(variable => handleSliderInput(variable));

    // ========================================
    // Form Submit - Fuzzy Analysis
    // ========================================
    const form = document.getElementById('fuzzyForm');

    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        runAnalysis();
    });

    function runAnalysis() {
        // Get inputs
        currentInputs = {
            bloodPressure: parseFloat(document.getElementById('bloodPressure').value),
            bloodSugar: parseFloat(document.getElementById('bloodSugar').value),
            bmi: parseFloat(document.getElementById('bmi').value),
            age: parseInt(document.getElementById('age').value)
        };

        // Run fuzzy inference
        currentResult = fuzzyEngine.infer(currentInputs);
        currentResult.riskLevel = fuzzyEngine.getRiskLevel(currentResult.riskScore);

        // Update UI
        displayResults(currentResult);

        // Scroll to results
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }

    function displayResults(result) {
        // Update gauge
        const gauge = document.querySelector('.gauge');
        const gaugeValue = document.getElementById('riskValue');

        if (gauge && gaugeValue) {
            gauge.classList.add('active');
            gaugeValue.textContent = result.riskScore.toFixed(0);

            // Update gauge fill based on score
            const fill = document.getElementById('gaugeFill');
            if (fill) {
                const angle = (result.riskScore / 100) * 240;
                fill.style.background = `conic-gradient(
                    ${result.riskLevel.level === 'low' ? 'var(--success)' :
                        result.riskLevel.level === 'medium' ? 'var(--warning)' : 'var(--danger)'} 0deg,
                    ${result.riskLevel.level === 'low' ? 'var(--success)' :
                        result.riskLevel.level === 'medium' ? 'var(--warning)' : 'var(--danger)'} ${angle}deg,
                    var(--bg-tertiary) ${angle}deg
                )`;
            }
        }

        // Update risk badge
        const riskLevel = document.getElementById('riskLevel');
        if (riskLevel) {
            riskLevel.innerHTML = `<span class="risk-badge ${result.riskLevel.class}">${result.riskLevel.text}</span>`;
        }

        // Update details
        const details = document.getElementById('resultDetails');
        if (details) {
            const profileName = profileManager.getActiveProfile()?.name || 'N/A';
            details.innerHTML = `
                <p><strong>Profil:</strong> ${profileName}</p>
                <p><strong>Skor Risiko:</strong> ${result.riskScore.toFixed(2)} dari 100</p>
                <p><strong>Aturan Aktif:</strong> ${result.activeRules.length} aturan</p>
            `;
        }

        // Show calculation steps
        const stepsCard = document.getElementById('stepsCard');
        const stepsContent = document.getElementById('stepsContent');

        if (stepsCard && stepsContent) {
            stepsCard.style.display = 'block';
            stepsContent.innerHTML = result.calculationSteps.map(step => `
                <div class="step-item">
                    <h4>${step.step}</h4>
                    <pre>${step.content}</pre>
                </div>
            `).join('');
        }

        // Show health tips
        const tipsCard = document.getElementById('tipsCard');
        const tipsContent = document.getElementById('tipsContent');
        const tips = fuzzyEngine.getHealthTips(result.riskScore, currentInputs);

        if (tipsCard && tipsContent && tips.length > 0) {
            tipsCard.style.display = 'block';
            tipsContent.innerHTML = tips.map(tip => `
                <div class="tip-item">
                    <span class="tip-icon">${tip.icon}</span>
                    <div class="tip-text">
                        <h4>${tip.title}</h4>
                        <p>${tip.text}</p>
                    </div>
                </div>
            `).join('');
        }

        // Show action buttons
        const actions = document.getElementById('resultActions');
        if (actions) {
            actions.style.display = 'flex';
        }
    }

    // ========================================
    // Save to History
    // ========================================
    document.getElementById('btnSaveHistory')?.addEventListener('click', () => {
        if (!currentResult) {
            alert('Lakukan analisis terlebih dahulu!');
            return;
        }

        const activeProfile = profileManager.getActiveProfile();

        historyManager.addRecord({
            profileId: activeProfile?.id,
            profileName: activeProfile?.name || 'Anonymous',
            inputs: currentInputs,
            riskScore: currentResult.riskScore,
            riskLevel: currentResult.riskLevel,
            fuzzifiedInputs: currentResult.fuzzifiedInputs
        });

        // Also add to profile history if profile selected
        if (activeProfile) {
            profileManager.addHealthRecord(activeProfile.id, {
                inputs: currentInputs,
                riskScore: currentResult.riskScore,
                riskLevel: currentResult.riskLevel
            });
        }

        historyManager.renderHistory();
        alert('Hasil analisis berhasil disimpan!');
    });

    // ========================================
    // Export PDF
    // ========================================
    document.getElementById('btnExportPDF')?.addEventListener('click', () => {
        if (!currentResult) {
            alert('Lakukan analisis terlebih dahulu!');
            return;
        }

        const profileName = profileManager.getActiveProfile()?.name || 'Anonymous';
        historyManager.exportToPDF(currentResult, currentInputs, profileName);
    });

    // ========================================
    // Initialize Charts
    // ========================================
    setTimeout(() => {
        charts.initAllCharts(fuzzyEngine, currentInputs);
    }, 100);

    // ========================================
    // Initialize Modules
    // ========================================
    profileManager.init();
    historyManager.init();

    // ========================================
    // Smooth Scroll for Navigation
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    console.log('FuzzyHealth initialized successfully!');
});
