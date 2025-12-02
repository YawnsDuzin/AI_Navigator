/**
 * AI Service Hub - Main Application
 * 렌더링, CRUD, 검색, 이벤트 핸들링
 */

class App {
    constructor() {
        this.currentSearch = '';
        this.deleteTarget = null; // { type: 'category' | 'service', id: string }

        this.init();
    }

    /**
     * 앱 초기화
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.applySettings();
        this.render();
    }

    /**
     * DOM 요소 캐싱
     */
    cacheElements() {
        // Main elements
        this.mainContent = document.getElementById('mainContent');
        this.emptyState = document.getElementById('emptyState');
        this.searchEmpty = document.getElementById('searchEmpty');

        // Header elements
        this.searchInput = document.getElementById('searchInput');
        this.searchClear = document.getElementById('searchClear');
        this.viewToggle = document.getElementById('viewToggle');
        this.themeToggle = document.getElementById('themeToggle');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.addCategoryBtn = document.getElementById('addCategoryBtn');
        this.emptyAddBtn = document.getElementById('emptyAddBtn');

        // Modals
        this.categoryModal = document.getElementById('categoryModal');
        this.serviceModal = document.getElementById('serviceModal');
        this.deleteModal = document.getElementById('deleteModal');
        this.settingsModal = document.getElementById('settingsModal');

        // Forms
        this.categoryForm = document.getElementById('categoryForm');
        this.serviceForm = document.getElementById('serviceForm');

        // Toast container
        this.toastContainer = document.getElementById('toastContainer');
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // Search
        this.searchInput.addEventListener('input', this.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300));

        this.searchClear.addEventListener('click', () => {
            this.searchInput.value = '';
            this.handleSearch('');
        });

        // View toggle
        this.viewToggle.addEventListener('click', () => this.toggleViewMode());

        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Settings
        this.settingsBtn.addEventListener('click', () => this.openModal('settings'));

        // Add category buttons
        this.addCategoryBtn.addEventListener('click', () => this.openCategoryModal());
        this.emptyAddBtn.addEventListener('click', () => this.openCategoryModal());

        // Category form
        this.categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategorySubmit();
        });

        // Service form
        this.serviceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleServiceSubmit();
        });

        // Emoji suggestions
        document.querySelectorAll('.emoji-suggestions button').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('categoryIcon').value = btn.dataset.emoji;
            });
        });

        // Delete confirmation
        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.handleDelete();
        });

        // Settings actions
        document.getElementById('exportData').addEventListener('click', () => this.exportData());
        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
        document.getElementById('resetData').addEventListener('click', () => this.resetData());

        // Modal close handlers
        document.querySelectorAll('.modal').forEach(modal => {
            modal.querySelector('.modal-backdrop').addEventListener('click', () => {
                this.closeModal(modal.id);
            });
            modal.querySelectorAll('[data-close]').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.closeModal(modal.id);
                });
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            // Ctrl/Cmd + K for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
        });

        // Main content click handler (delegation)
        this.mainContent.addEventListener('click', (e) => this.handleMainClick(e));

        // Close service menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.service-menu')) {
                this.closeAllServiceMenus();
            }
        });
    }

    /**
     * 메인 컨텐츠 클릭 핸들러 (이벤트 위임)
     */
    handleMainClick(e) {
        const target = e.target;

        // Category header click (toggle collapse)
        const categoryHeader = target.closest('.category-header');
        if (categoryHeader && !target.closest('.category-btn')) {
            const categoryId = categoryHeader.closest('.category-section').dataset.categoryId;
            this.toggleCategoryCollapse(categoryId);
            return;
        }

        // Category buttons
        const categoryBtn = target.closest('.category-btn');
        if (categoryBtn) {
            e.stopPropagation();
            const categorySection = categoryBtn.closest('.category-section');
            const categoryId = categorySection.dataset.categoryId;
            const action = categoryBtn.dataset.action;

            switch (action) {
                case 'add-service':
                    this.openServiceModal(categoryId);
                    break;
                case 'edit':
                    this.openCategoryModal(categoryId);
                    break;
                case 'delete':
                    this.confirmDelete('category', categoryId);
                    break;
            }
            return;
        }

        // Service menu button
        const menuBtn = target.closest('.service-menu-btn');
        if (menuBtn) {
            e.stopPropagation();
            const menu = menuBtn.closest('.service-menu');
            this.toggleServiceMenu(menu);
            return;
        }

        // Service menu items
        const menuItem = target.closest('.service-menu-item');
        if (menuItem) {
            e.stopPropagation();
            const serviceCard = menuItem.closest('.service-card');
            const serviceId = serviceCard.dataset.serviceId;
            const action = menuItem.dataset.action;

            this.closeAllServiceMenus();

            switch (action) {
                case 'edit':
                    this.openServiceModal(null, serviceId);
                    break;
                case 'delete':
                    this.confirmDelete('service', serviceId);
                    break;
            }
            return;
        }

        // Service card click (navigate to URL)
        const serviceCard = target.closest('.service-card');
        if (serviceCard && !target.closest('.service-action-btn') && !target.closest('.add-service-card') && !target.closest('.service-menu')) {
            const url = serviceCard.dataset.url;
            if (url) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        // Add service card
        const addServiceCard = target.closest('.add-service-card');
        if (addServiceCard) {
            const categoryId = addServiceCard.dataset.categoryId;
            this.openServiceModal(categoryId);
            return;
        }
    }

    /**
     * 렌더링
     */
    render() {
        const categories = dataManager.getCategories();

        if (categories.length === 0 && !this.currentSearch) {
            this.mainContent.innerHTML = '';
            this.emptyState.style.display = 'flex';
            this.searchEmpty.style.display = 'none';
            return;
        }

        this.emptyState.style.display = 'none';

        let html = '';
        let hasVisibleContent = false;

        categories.forEach(category => {
            const services = this.currentSearch
                ? dataManager.searchServices(this.currentSearch).filter(s => s.categoryId === category.id)
                : dataManager.getServicesByCategory(category.id);

            // 검색 중일 때 서비스가 없는 카테고리는 숨김
            if (this.currentSearch && services.length === 0) {
                return;
            }

            hasVisibleContent = true;

            html += this.renderCategory(category, services);
        });

        if (this.currentSearch && !hasVisibleContent) {
            this.mainContent.innerHTML = '';
            this.searchEmpty.style.display = 'flex';
        } else {
            this.searchEmpty.style.display = 'none';
            this.mainContent.innerHTML = html;

            // 드래그앤드롭 초기화
            if (typeof initDragDrop === 'function') {
                initDragDrop();
            }
        }
    }

    /**
     * 카테고리 렌더링
     */
    renderCategory(category, services) {
        const serviceCount = dataManager.getServiceCountByCategory(category.id);
        const collapsedClass = category.collapsed ? 'collapsed' : '';

        return `
            <section class="category-section ${collapsedClass}" data-category-id="${category.id}">
                <div class="category-header">
                    <div class="category-header-left">
                        <span class="category-icon">${category.icon}</span>
                        <span class="category-name">${this.escapeHtml(category.name)}</span>
                        <span class="category-count">(${serviceCount})</span>
                    </div>
                    <div class="category-header-right">
                        <button class="category-btn" data-action="add-service" title="서비스 추가">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <button class="category-btn" data-action="edit" title="카테고리 수정">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="category-btn" data-action="delete" title="카테고리 삭제">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button class="category-btn collapse-icon" title="접기/펼치기">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="category-content-wrapper">
                    <div class="category-content" data-category-id="${category.id}">
                        ${services.map(service => this.renderServiceCard(service)).join('')}
                        ${!this.currentSearch ? this.renderAddServiceCard(category.id) : ''}
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * 서비스 카드 렌더링
     */
    renderServiceCard(service) {
        const iconHtml = service.icon
            ? `<img src="${this.escapeHtml(service.icon)}" alt="${this.escapeHtml(service.name)}" class="service-icon" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
               <span class="service-icon-emoji" style="display:none;">🔗</span>`
            : `<span class="service-icon-emoji">🔗</span>`;

        return `
            <div class="service-card" data-service-id="${service.id}" data-url="${this.escapeHtml(service.url)}" draggable="true">
                ${iconHtml}
                <span class="service-name">${this.escapeHtml(service.name)}</span>
                <div class="service-menu">
                    <button class="service-menu-btn" title="메뉴">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                            <circle cx="12" cy="19" r="2"></circle>
                        </svg>
                    </button>
                    <div class="service-menu-dropdown">
                        <button class="service-menu-item edit" data-action="edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span>수정</span>
                        </button>
                        <button class="service-menu-item delete" data-action="delete">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            <span>삭제</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 서비스 추가 카드 렌더링
     */
    renderAddServiceCard(categoryId) {
        return `
            <div class="add-service-card" data-category-id="${categoryId}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>추가</span>
            </div>
        `;
    }

    /**
     * 검색 처리
     */
    handleSearch(query) {
        this.currentSearch = query.trim();
        this.searchClear.style.display = this.currentSearch ? 'flex' : 'none';
        this.render();
    }

    /**
     * 카테고리 접기/펼치기
     */
    toggleCategoryCollapse(categoryId) {
        const collapsed = dataManager.toggleCategoryCollapse(categoryId);
        const section = document.querySelector(`[data-category-id="${categoryId}"]`);
        if (section) {
            section.classList.toggle('collapsed', collapsed);
        }
    }

    /**
     * 뷰 모드 토글
     */
    toggleViewMode() {
        const settings = dataManager.getSettings();
        const newMode = settings.viewMode === 'grid' ? 'list' : 'grid';
        dataManager.updateSettings({ viewMode: newMode });
        this.applyViewMode(newMode);
    }

    /**
     * 뷰 모드 적용
     */
    applyViewMode(mode) {
        document.body.dataset.view = mode;
        const iconGrid = this.viewToggle.querySelector('.icon-grid');
        const iconList = this.viewToggle.querySelector('.icon-list');

        if (mode === 'grid') {
            iconGrid.style.display = 'block';
            iconList.style.display = 'none';
        } else {
            iconGrid.style.display = 'none';
            iconList.style.display = 'block';
        }
    }

    /**
     * 테마 토글
     */
    toggleTheme() {
        const settings = dataManager.getSettings();
        const newTheme = settings.theme === 'light' ? 'dark' : 'light';
        dataManager.updateSettings({ theme: newTheme });
        this.applyTheme(newTheme);
    }

    /**
     * 테마 적용
     */
    applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        const iconSun = this.themeToggle.querySelector('.icon-sun');
        const iconMoon = this.themeToggle.querySelector('.icon-moon');

        if (theme === 'light') {
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
        } else {
            iconSun.style.display = 'none';
            iconMoon.style.display = 'block';
        }
    }

    /**
     * 설정 적용
     */
    applySettings() {
        const settings = dataManager.getSettings();
        this.applyTheme(settings.theme);
        this.applyViewMode(settings.viewMode);
    }

    // ===== 모달 관리 =====

    /**
     * 모달 열기
     */
    openModal(type) {
        const modalMap = {
            category: this.categoryModal,
            service: this.serviceModal,
            delete: this.deleteModal,
            settings: this.settingsModal
        };
        const modal = modalMap[type];
        if (modal) {
            modal.classList.add('active');
            // 첫 번째 입력 필드에 포커스
            const firstInput = modal.querySelector('input:not([type="hidden"]), select');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * 모달 닫기
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * 카테고리 모달 열기
     */
    openCategoryModal(categoryId = null) {
        const modal = this.categoryModal;
        const title = document.getElementById('categoryModalTitle');
        const nameInput = document.getElementById('categoryName');
        const iconInput = document.getElementById('categoryIcon');
        const idInput = document.getElementById('categoryId');

        if (categoryId) {
            // 수정 모드
            const category = dataManager.getCategoryById(categoryId);
            if (category) {
                title.textContent = '카테고리 수정';
                nameInput.value = category.name;
                iconInput.value = category.icon;
                idInput.value = category.id;
            }
        } else {
            // 추가 모드
            title.textContent = '카테고리 추가';
            nameInput.value = '';
            iconInput.value = '';
            idInput.value = '';
        }

        this.openModal('category');
    }

    /**
     * 서비스 모달 열기
     */
    openServiceModal(categoryId = null, serviceId = null) {
        const modal = this.serviceModal;
        const title = document.getElementById('serviceModalTitle');
        const nameInput = document.getElementById('serviceName');
        const urlInput = document.getElementById('serviceUrl');
        const iconInput = document.getElementById('serviceIcon');
        const categorySelect = document.getElementById('serviceCategory');
        const idInput = document.getElementById('serviceId');

        // 카테고리 옵션 업데이트
        const categories = dataManager.getCategories();
        categorySelect.innerHTML = categories.map(cat =>
            `<option value="${cat.id}">${cat.icon} ${this.escapeHtml(cat.name)}</option>`
        ).join('');

        if (serviceId) {
            // 수정 모드
            const service = dataManager.getServiceById(serviceId);
            if (service) {
                title.textContent = '서비스 수정';
                nameInput.value = service.name;
                urlInput.value = service.url;
                iconInput.value = service.icon || '';
                categorySelect.value = service.categoryId;
                idInput.value = service.id;
            }
        } else {
            // 추가 모드
            title.textContent = '서비스 추가';
            nameInput.value = '';
            urlInput.value = '';
            iconInput.value = '';
            if (categoryId) {
                categorySelect.value = categoryId;
            }
            idInput.value = '';
        }

        this.openModal('service');
    }

    /**
     * 삭제 확인 모달 열기
     */
    confirmDelete(type, id) {
        this.deleteTarget = { type, id };
        const message = document.getElementById('deleteMessage');

        if (type === 'category') {
            const category = dataManager.getCategoryById(id);
            const serviceCount = dataManager.getServiceCountByCategory(id);
            message.innerHTML = `<strong>"${this.escapeHtml(category.name)}"</strong> 카테고리를 삭제하시겠습니까?<br><br>
                <small style="color: var(--color-danger);">⚠️ 이 카테고리의 서비스 ${serviceCount}개도 함께 삭제됩니다.</small>`;
        } else {
            const service = dataManager.getServiceById(id);
            message.innerHTML = `<strong>"${this.escapeHtml(service.name)}"</strong> 서비스를 삭제하시겠습니까?`;
        }

        this.openModal('delete');
    }

    // ===== 폼 처리 =====

    /**
     * 카테고리 폼 제출 처리
     */
    handleCategorySubmit() {
        const name = document.getElementById('categoryName').value.trim();
        const icon = document.getElementById('categoryIcon').value.trim() || '📁';
        const id = document.getElementById('categoryId').value;

        if (!name) {
            this.showToast('카테고리 이름을 입력해주세요.', 'error');
            return;
        }

        if (id) {
            // 수정
            dataManager.updateCategory(id, { name, icon });
            this.showToast('카테고리가 수정되었습니다.', 'success');
        } else {
            // 추가
            dataManager.addCategory(name, icon);
            this.showToast('카테고리가 추가되었습니다.', 'success');
        }

        this.closeModal('categoryModal');
        this.render();
    }

    /**
     * 서비스 폼 제출 처리
     */
    handleServiceSubmit() {
        const name = document.getElementById('serviceName').value.trim();
        const url = document.getElementById('serviceUrl').value.trim();
        const icon = document.getElementById('serviceIcon').value.trim();
        const categoryId = document.getElementById('serviceCategory').value;
        const id = document.getElementById('serviceId').value;

        if (!name || !url) {
            this.showToast('이름과 URL을 입력해주세요.', 'error');
            return;
        }

        // URL 유효성 검사
        try {
            new URL(url);
        } catch {
            this.showToast('유효한 URL을 입력해주세요.', 'error');
            return;
        }

        if (id) {
            // 수정
            dataManager.updateService(id, { name, url, icon, categoryId });
            this.showToast('서비스가 수정되었습니다.', 'success');
        } else {
            // 추가
            dataManager.addService(categoryId, name, url, icon);
            this.showToast('서비스가 추가되었습니다.', 'success');
        }

        this.closeModal('serviceModal');
        this.render();
    }

    /**
     * 삭제 처리
     */
    handleDelete() {
        if (!this.deleteTarget) return;

        const { type, id } = this.deleteTarget;

        if (type === 'category') {
            dataManager.deleteCategory(id);
            this.showToast('카테고리가 삭제되었습니다.', 'success');
        } else {
            dataManager.deleteService(id);
            this.showToast('서비스가 삭제되었습니다.', 'success');
        }

        this.deleteTarget = null;
        this.closeModal('deleteModal');
        this.render();
    }

    // ===== 데이터 내보내기/가져오기 =====

    /**
     * 데이터 내보내기
     */
    exportData() {
        const data = dataManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-service-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('데이터가 내보내기되었습니다.', 'success');
    }

    /**
     * 데이터 가져오기
     */
    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const success = dataManager.importData(event.target.result);
            if (success) {
                this.showToast('데이터를 성공적으로 가져왔습니다.', 'success');
                this.applySettings();
                this.render();
            } else {
                this.showToast('데이터 가져오기에 실패했습니다. 파일 형식을 확인해주세요.', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // 같은 파일 다시 선택 가능하도록
    }

    /**
     * 데이터 초기화
     */
    resetData() {
        if (confirm('정말 기본 데이터로 초기화하시겠습니까?\n현재 데이터는 모두 삭제됩니다.')) {
            dataManager.resetToDefault();
            this.applySettings();
            this.render();
            this.closeModal('settingsModal');
            this.showToast('기본 데이터로 초기화되었습니다.', 'success');
        }
    }

    // ===== 유틸리티 =====

    /**
     * 토스트 메시지 표시
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        this.toastContainer.appendChild(toast);

        // 3초 후 제거
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 디바운스
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    /**
     * 서비스 메뉴 토글
     */
    toggleServiceMenu(menu) {
        const wasActive = menu.classList.contains('active');
        this.closeAllServiceMenus();
        if (!wasActive) {
            menu.classList.add('active');
            const card = menu.closest('.service-card');
            if (card) card.classList.add('menu-active');
        }
    }

    /**
     * 모든 서비스 메뉴 닫기
     */
    closeAllServiceMenus() {
        document.querySelectorAll('.service-menu.active').forEach(menu => {
            menu.classList.remove('active');
            const card = menu.closest('.service-card');
            if (card) card.classList.remove('menu-active');
        });
    }
}

// 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new App();
});
