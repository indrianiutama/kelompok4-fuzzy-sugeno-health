/**
 * FuzzyHealth - Profile Manager
 * Kelola profil pengguna dengan localStorage
 */

class ProfileManager {
    constructor() {
        this.storageKey = 'fuzzyhealth_profiles';
        this.profiles = this.loadProfiles();
        this.selectedProfileId = null;
    }

    // Load profiles dari localStorage
    loadProfiles() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading profiles:', e);
            return [];
        }
    }

    // Simpan profiles ke localStorage
    saveProfiles() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.profiles));
        } catch (e) {
            console.error('Error saving profiles:', e);
        }
    }

    // Tambah profil baru
    addProfile(profileData) {
        const profile = {
            id: Date.now().toString(),
            name: profileData.name,
            age: parseInt(profileData.age),
            gender: profileData.gender,
            phone: profileData.phone || '',
            createdAt: new Date().toISOString(),
            healthHistory: []
        };

        this.profiles.push(profile);
        this.saveProfiles();
        return profile;
    }

    // Hapus profil
    deleteProfile(profileId) {
        this.profiles = this.profiles.filter(p => p.id !== profileId);
        if (this.selectedProfileId === profileId) {
            this.selectedProfileId = null;
        }
        this.saveProfiles();
    }

    // Get profil by ID
    getProfile(profileId) {
        return this.profiles.find(p => p.id === profileId);
    }

    // Get semua profil
    getAllProfiles() {
        return this.profiles;
    }

    // Set profil aktif
    setActiveProfile(profileId) {
        this.selectedProfileId = profileId;
    }

    // Get profil aktif
    getActiveProfile() {
        if (!this.selectedProfileId) return null;
        return this.getProfile(this.selectedProfileId);
    }

    // Tambah health record ke profil
    addHealthRecord(profileId, record) {
        const profile = this.getProfile(profileId);
        if (profile) {
            profile.healthHistory.push({
                ...record,
                date: new Date().toISOString()
            });
            this.saveProfiles();
        }
    }

    // Render profiles list
    renderProfilesList() {
        const container = document.getElementById('profilesList');
        const countEl = document.getElementById('profileCount');

        if (!container) return;

        if (this.profiles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-icon">👥</span>
                    <p>Belum ada profil. Tambahkan profil baru untuk memulai.</p>
                </div>
            `;
            if (countEl) countEl.textContent = '0 profil';
            return;
        }

        if (countEl) countEl.textContent = `${this.profiles.length} profil`;

        container.innerHTML = this.profiles.map(profile => {
            const isActive = profile.id === this.selectedProfileId;
            const avatar = profile.gender === 'male' ? '👨' : '👩';

            return `
                <div class="profile-item ${isActive ? 'active' : ''}" data-id="${profile.id}">
                    <div class="profile-avatar">${avatar}</div>
                    <div class="profile-info">
                        <div class="profile-name">${this.escapeHtml(profile.name)}</div>
                        <div class="profile-meta">${profile.age} tahun • ${profile.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</div>
                    </div>
                    <div class="profile-actions">
                        <button class="profile-btn select-profile" data-id="${profile.id}" title="Pilih profil">
                            ✓
                        </button>
                        <button class="profile-btn delete delete-profile" data-id="${profile.id}" title="Hapus profil">
                            ✕
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        container.querySelectorAll('.select-profile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                this.setActiveProfile(id);
                this.renderProfilesList();
                this.updateActiveProfileSelector();
                this.syncAgeWithProfile(id);
            });
        });

        container.querySelectorAll('.delete-profile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (confirm('Hapus profil ini?')) {
                    this.deleteProfile(id);
                    this.renderProfilesList();
                    this.updateActiveProfileSelector();
                }
            });
        });
    }

    // Update dropdown selector di calculator
    updateActiveProfileSelector() {
        const selector = document.getElementById('activeProfile');
        if (!selector) return;

        const currentValue = selector.value;

        selector.innerHTML = '<option value="">-- Tanpa Profil --</option>' +
            this.profiles.map(profile => `
                <option value="${profile.id}" ${profile.id === this.selectedProfileId ? 'selected' : ''}>
                    ${this.escapeHtml(profile.name)} (${profile.age} thn)
                </option>
            `).join('');
    }

    // Sync usia dengan profil yang dipilih
    syncAgeWithProfile(profileId) {
        const profile = this.getProfile(profileId);
        if (profile) {
            const ageSlider = document.getElementById('age');
            const ageValue = document.getElementById('ageValue');
            if (ageSlider && ageValue) {
                ageSlider.value = profile.age;
                ageValue.textContent = profile.age;
                // Trigger input event untuk update
                ageSlider.dispatchEvent(new Event('input'));
            }
        }
    }

    // Escape HTML untuk keamanan
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Setup form handler
    setupFormHandler() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('profileName').value.trim();
            const age = document.getElementById('profileAge').value;
            const gender = document.getElementById('profileGender').value;
            const phone = document.getElementById('profilePhone').value.trim();

            if (!name || !age || !gender) {
                alert('Mohon lengkapi data profil!');
                return;
            }

            this.addProfile({ name, age, gender, phone });
            this.renderProfilesList();
            this.updateActiveProfileSelector();

            // Reset form
            form.reset();
        });
    }

    // Setup selector handler
    setupSelectorHandler() {
        const selector = document.getElementById('activeProfile');
        if (!selector) return;

        selector.addEventListener('change', (e) => {
            const profileId = e.target.value;
            this.setActiveProfile(profileId || null);
            this.renderProfilesList();
            if (profileId) {
                this.syncAgeWithProfile(profileId);
            }
        });
    }

    // Initialize
    init() {
        this.setupFormHandler();
        this.setupSelectorHandler();
        this.renderProfilesList();
        this.updateActiveProfileSelector();
    }
}

window.ProfileManager = ProfileManager;
