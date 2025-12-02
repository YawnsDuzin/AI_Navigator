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
    /**
     * 카테고리 렌더링
     */
    renderCategory(category, services) {
        const serviceCount = dataManager.getServiceCountByCategory(category.id);
        const collapsedClass = category.collapsed ? 'collapsed' : '';
        const gridRowsClass = category.collapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]';
        const opacityClass = category.collapsed ? 'opacity-0 invisible' : 'opacity-100 visible';
        const overflowClass = category.collapsed ? 'overflow-hidden' : ''; // 접혀있을 때만 overflow-hidden 적용

        return `
            <section class="category-section mb-12 animate-fade-in group/section ${collapsedClass}" data-category-id="${category.id}">
                <div class="category-header flex items-center justify-between px-4 py-3 mb-2 cursor-pointer select-none transition-all rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div class="category-header-left flex items-center gap-3">
                        <span class="category-icon text-xl hidden">${category.icon}</span>
                        <span class="category-name text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">${this.escapeHtml(category.name)}</span>
                        <span class="category-count text-sm text-slate-400 hidden">(${serviceCount})</span>
                    </div>
                    <div class="category-header-right flex items-center gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity duration-300">
                        <button class="category-btn p-2 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-action="add-service" title="서비스 추가">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </button>
                        <button class="category-btn p-2 rounded-full text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-action="edit" title="카테고리 수정">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="category-btn p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" data-action="delete" title="카테고리 삭제">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                        <button class="category-btn collapse-icon p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-300 ${category.collapsed ? '-rotate-90' : ''}" title="접기/펼치기">
                            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="category-content-wrapper grid ${gridRowsClass} transition-[grid-template-rows] duration-300 ease-out ${overflowClass}">
                    <div class="category-content flex flex-wrap gap-4 min-h-0 transition-all duration-300 p-1 ${opacityClass}" data-category-id="${category.id}">
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
        const viewMode = dataManager.getSettings().viewMode;
        const isList = viewMode === 'list';

        const cardClasses = isList
            ? 'service-card group relative flex flex-row items-center w-full p-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md hover:bg-white/90 dark:hover:bg-slate-800/90 hover:z-10'
            : 'service-card group relative flex flex-col items-center w-20 p-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm hover:-translate-y-1 hover:shadow-xl hover:bg-white/90 dark:hover:bg-slate-800/90 hover:z-10';

        const iconSizeClasses = isList ? 'w-10 h-10 mr-3' : 'w-14 h-14 mb-3';
        const iconCommonClasses = `service-icon ${iconSizeClasses} rounded-full object-contain p-1 bg-white shadow-md border-2 border-white/50 transition-transform duration-500 group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-lg`;
        const emojiCommonClasses = `service-icon-emoji ${iconSizeClasses} rounded-full bg-white shadow-md border-2 border-white/50 items-center justify-center text-xl group-hover:scale-110 group-hover:border-primary/30 transition-transform duration-500`;

        const iconHtml = service.icon
            ? `<img src="${this.escapeHtml(service.icon)}" alt="${this.escapeHtml(service.name)}" class="${iconCommonClasses}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <span class="${emojiCommonClasses} hidden">🔗</span>`
            : `<span class="${emojiCommonClasses} flex">🔗</span>`;

        const nameClasses = isList
            ? 'service-name text-sm font-medium text-slate-600 dark:text-slate-300 text-left flex-1 truncate group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors'
            : 'service-name text-xs font-medium text-slate-500 dark:text-slate-400 text-center w-full truncate group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors';

        const menuClasses = isList
            ? 'service-menu relative ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200'
            : 'service-menu absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200';

        return `
            <div class="${cardClasses}" data-service-id="${service.id}" data-url="${this.escapeHtml(service.url)}" draggable="true">
                ${iconHtml}
                <span class="${nameClasses}">${this.escapeHtml(service.name)}</span>
                
                <div class="${menuClasses}">
                    <button class="service-menu-btn flex items-center justify-center w-6 h-6 rounded-full bg-white/50 dark:bg-black/20 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors shadow-sm" title="메뉴">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2"></circle>
                            <circle cx="12" cy="12" r="2"></circle>
                            <circle cx="12" cy="19" r="2"></circle>
                        </svg>
                    </button>
                    <div class="service-menu-dropdown hidden absolute top-full right-0 mt-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/50 dark:border-slate-700 rounded-xl shadow-xl min-w-[120px] overflow-hidden z-30 animate-fade-in">
                        <button class="service-menu-item edit w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left" data-action="edit">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            <span>수정</span>
                        </button>
                        <button class="service-menu-item delete w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors text-left" data-action="delete">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
        const viewMode = dataManager.getSettings().viewMode;
        const isList = viewMode === 'list';

        const cardClasses = isList
            ? 'add-service-card group flex flex-row items-center justify-center w-full p-3 h-auto bg-white/10 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer transition-all duration-300 hover:border-primary hover:bg-white/25 hover:shadow-md'
            : 'add-service-card group flex flex-col items-center justify-center w-20 h-[124px] bg-white/10 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-600 rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary hover:bg-white/25 hover:-translate-y-1 hover:shadow-md';

        const iconClasses = isList
            ? 'w-10 h-10 mr-3 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors'
            : 'w-14 h-14 mb-3 rounded-full border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400 group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary transition-colors';

        return `
            <div class="${cardClasses}" data-category-id="${categoryId}">
                <div class="${iconClasses}">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </div>
                <span class="text-xs font-medium text-slate-400 group-hover:text-primary transition-colors">추가</span>
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
    /**
     * 카테고리 접기/펼치기
     */
    toggleCategoryCollapse(categoryId) {
        const collapsed = dataManager.toggleCategoryCollapse(categoryId);

        const section = document.querySelector(`.category-section[data-category-id="${categoryId}"]`);
        if (!section) return;

        const wrapper = section.querySelector('.category-content-wrapper');
        const content = section.querySelector('.category-content');
        const icon = section.querySelector('.collapse-icon');

        if (collapsed) {
            // 접을 때: overflow-hidden 추가 -> 애니메이션 시작
            wrapper.classList.add('overflow-hidden');

            wrapper.classList.remove('grid-rows-[1fr]');
            wrapper.classList.add('grid-rows-[0fr]');

            content.classList.remove('opacity-100', 'visible');
            content.classList.add('opacity-0', 'invisible');

            if (icon) icon.classList.add('-rotate-90');
            section.classList.add('collapsed');
        } else {
            // 펼칠 때: 애니메이션 시작 -> 끝난 후 overflow-hidden 제거
            wrapper.classList.remove('grid-rows-[0fr]');
            wrapper.classList.add('grid-rows-[1fr]');

            content.classList.remove('opacity-0', 'invisible');
            content.classList.add('opacity-100', 'visible');

            if (icon) icon.classList.remove('-rotate-90');
            section.classList.remove('collapsed');

            // 애니메이션 시간(300ms) 후 overflow-hidden 제거
            setTimeout(() => {
                // 여전히 펼쳐진 상태인지 확인
                if (!wrapper.classList.contains('grid-rows-[0fr]')) {
                    wrapper.classList.remove('overflow-hidden');
                }
            }, 300);
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
        this.render(); // Re-render to apply new layout classes
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
            iconList.classList.add('hidden');
        } else {
            iconGrid.style.display = 'none';
            iconList.classList.remove('hidden');
        }

        // List view styles injection (Tailwind doesn't support data-attributes in arbitrary values easily for this dynamic switch without a wrapper class)
        // We can handle this by toggling a class on the body
        if (mode === 'list') {
            document.body.classList.add('view-list');
        } else {
            document.body.classList.remove('view-list');
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
            iconMoon.classList.add('hidden');
            document.documentElement.classList.remove('dark');
        } else {
            iconSun.style.display = 'none';
            iconMoon.classList.remove('hidden');
            document.documentElement.classList.add('dark');
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
                <small class="text-red-500">⚠️ 이 카테고리의 서비스 ${serviceCount}개도 함께 삭제됩니다.</small>`;
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
        const borderColor = type === 'success' ? 'border-green-500' : 'border-red-500';
        toast.className = `toast flex items-center gap-3 px-6 py-4 rounded-xl bg-white dark:bg-slate-800 shadow-2xl border-l-4 ${borderColor} animate-slide-up min-w-[300px]`;
        toast.innerHTML = `<span class="toast-message font-medium text-slate-800 dark:text-slate-100">${message}</span>`;
        this.toastContainer.appendChild(toast);

        // 3초 후 제거
        setTimeout(() => {
            toast.style.transition = 'all 0.3s ease';
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
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
    /**
     * 서비스 메뉴 토글
     */
    toggleServiceMenu(menu) {
        const wasActive = menu.classList.contains('active');
        this.closeAllServiceMenus();
        if (!wasActive) {
            menu.classList.add('active');
            const dropdown = menu.querySelector('.service-menu-dropdown');
            if (dropdown) dropdown.classList.remove('hidden');

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
            const dropdown = menu.querySelector('.service-menu-dropdown');
            if (dropdown) dropdown.classList.add('hidden');

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
