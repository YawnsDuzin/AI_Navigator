/**
 * AI Service Hub - Data Management
 * 기본 데이터 및 LocalStorage 관리
 */

const STORAGE_KEY = 'aiServiceHub_data';

// 기본 데이터
const defaultData = {
    categories: [
        { id: 'cat-agent', name: 'AI Agent', icon: '🤖', order: 0, collapsed: false },
        { id: 'cat-image', name: 'Image', icon: '🖼️', order: 1, collapsed: false },
        { id: 'cat-video', name: 'Video', icon: '🎬', order: 2, collapsed: false },
        { id: 'cat-voice', name: 'Voice/Lip-Sync', icon: '🎤', order: 3, collapsed: false },
        { id: 'cat-coding', name: 'Vibe Coding', icon: '💻', order: 4, collapsed: false },
        { id: 'cat-music', name: 'Music', icon: '🎵', order: 5, collapsed: false },
        { id: 'cat-edit', name: 'Edit', icon: '✂️', order: 6, collapsed: false },
        { id: 'cat-business', name: 'Business', icon: '💼', order: 7, collapsed: false }
    ],
    services: [
        // AI Agent
        { id: 'svc-001', categoryId: 'cat-agent', name: 'ChatGPT', url: 'https://chat.openai.com', icon: '', order: 0 },
        { id: 'svc-002', categoryId: 'cat-agent', name: 'Perplexity', url: 'https://perplexity.ai', icon: '', order: 1 },
        { id: 'svc-003', categoryId: 'cat-agent', name: 'Gemini', url: 'https://gemini.google.com', icon: '', order: 2 },
        { id: 'svc-004', categoryId: 'cat-agent', name: 'Claude', url: 'https://claude.ai', icon: '', order: 3 },
        { id: 'svc-005', categoryId: 'cat-agent', name: 'Grok', url: 'https://grok.x.ai', icon: '', order: 4 },
        { id: 'svc-006', categoryId: 'cat-agent', name: 'Genspark', url: 'https://genspark.ai', icon: '', order: 5 },
        { id: 'svc-007', categoryId: 'cat-agent', name: 'Flowith', url: 'https://flowith.io', icon: '', order: 6 },

        // Image
        { id: 'svc-010', categoryId: 'cat-image', name: 'Midjourney', url: 'https://midjourney.com', icon: '', order: 0 },
        { id: 'svc-011', categoryId: 'cat-image', name: 'Nano Banana', url: 'https://nanobanana.com', icon: '', order: 1 },
        { id: 'svc-012', categoryId: 'cat-image', name: 'Imagine Art', url: 'https://imagine.art', icon: '', order: 2 },
        { id: 'svc-013', categoryId: 'cat-image', name: 'Sora', url: 'https://openai.com/sora', icon: '', order: 3 },
        { id: 'svc-014', categoryId: 'cat-image', name: 'Flux', url: 'https://flux.ai', icon: '', order: 4 },
        { id: 'svc-015', categoryId: 'cat-image', name: 'Whisk', url: 'https://labs.google/whisk', icon: '', order: 5 },
        { id: 'svc-016', categoryId: 'cat-image', name: 'Dreamina', url: 'https://dreamina.capcut.com', icon: '', order: 6 },
        { id: 'svc-017', categoryId: 'cat-image', name: 'Qwen', url: 'https://qwen.ai', icon: '', order: 7 },

        // Video
        { id: 'svc-030', categoryId: 'cat-video', name: 'Sora 2', url: 'https://openai.com/sora', icon: '', order: 0 },
        { id: 'svc-031', categoryId: 'cat-video', name: 'VEO 3', url: 'https://deepmind.google/technologies/veo', icon: '', order: 1 },
        { id: 'svc-032', categoryId: 'cat-video', name: 'Midjourney', url: 'https://midjourney.com', icon: '', order: 2 },
        { id: 'svc-033', categoryId: 'cat-video', name: 'Hailuo', url: 'https://hailuoai.video', icon: '', order: 3 },
        { id: 'svc-034', categoryId: 'cat-video', name: 'Higgsfield', url: 'https://higgsfield.ai', icon: '', order: 4 },
        { id: 'svc-035', categoryId: 'cat-video', name: 'Kling', url: 'https://klingai.com', icon: '', order: 5 },
        { id: 'svc-036', categoryId: 'cat-video', name: 'Runway', url: 'https://runwayml.com', icon: '', order: 6 },
        { id: 'svc-037', categoryId: 'cat-video', name: 'Pika Labs', url: 'https://pika.art', icon: '', order: 7 },
        { id: 'svc-038', categoryId: 'cat-video', name: 'Luma AI', url: 'https://lumalabs.ai', icon: '', order: 8 },
        { id: 'svc-039', categoryId: 'cat-video', name: 'Topaz', url: 'https://topazlabs.com', icon: '', order: 9 },
        { id: 'svc-040', categoryId: 'cat-video', name: 'Freepik', url: 'https://freepik.com', icon: '', order: 10 },

        // Voice/Lip-Sync
        { id: 'svc-050', categoryId: 'cat-voice', name: 'ElevenLabs', url: 'https://elevenlabs.io', icon: '', order: 0 },
        { id: 'svc-051', categoryId: 'cat-voice', name: 'Perso', url: 'https://perso.ai', icon: '', order: 1 },
        { id: 'svc-052', categoryId: 'cat-voice', name: 'Supertone', url: 'https://supertone.ai', icon: '', order: 2 },
        { id: 'svc-053', categoryId: 'cat-voice', name: 'Typecast', url: 'https://typecast.ai', icon: '', order: 3 },
        { id: 'svc-054', categoryId: 'cat-voice', name: 'HeyGen', url: 'https://heygen.com', icon: '', order: 4 },
        { id: 'svc-055', categoryId: 'cat-voice', name: 'Hedra', url: 'https://hedra.com', icon: '', order: 5 },

        // Vibe Coding
        { id: 'svc-060', categoryId: 'cat-coding', name: 'Google AI Studio', url: 'https://aistudio.google.com', icon: '', order: 0 },
        { id: 'svc-061', categoryId: 'cat-coding', name: 'Lovable', url: 'https://lovable.dev', icon: '', order: 1 },
        { id: 'svc-062', categoryId: 'cat-coding', name: 'Replit AI', url: 'https://replit.com', icon: '', order: 2 },
        { id: 'svc-063', categoryId: 'cat-coding', name: 'Cursor', url: 'https://cursor.sh', icon: '', order: 3 },
        { id: 'svc-064', categoryId: 'cat-coding', name: 'Claude', url: 'https://claude.ai', icon: '', order: 4 },
        { id: 'svc-065', categoryId: 'cat-coding', name: 'Base44', url: 'https://base44.com', icon: '', order: 5 },
        { id: 'svc-066', categoryId: 'cat-coding', name: 'Bolt', url: 'https://bolt.new', icon: '', order: 6 },

        // Music
        { id: 'svc-070', categoryId: 'cat-music', name: 'Suno AI', url: 'https://suno.ai', icon: '', order: 0 },
        { id: 'svc-071', categoryId: 'cat-music', name: 'Udio', url: 'https://udio.com', icon: '', order: 1 },
        { id: 'svc-072', categoryId: 'cat-music', name: 'AIVA', url: 'https://aiva.ai', icon: '', order: 2 },

        // Edit
        { id: 'svc-080', categoryId: 'cat-edit', name: 'vrew', url: 'https://vrew.voyagerx.com', icon: '', order: 0 },
        { id: 'svc-081', categoryId: 'cat-edit', name: 'Cutback', url: 'https://cutback.video', icon: '', order: 1 },
        { id: 'svc-082', categoryId: 'cat-edit', name: 'Capcut', url: 'https://www.capcut.com', icon: '', order: 2 },

        // Business
        { id: 'svc-090', categoryId: 'cat-business', name: 'Gamma', url: 'https://gamma.app', icon: '', order: 0 },
        { id: 'svc-091', categoryId: 'cat-business', name: 'NotebookLM', url: 'https://notebooklm.google.com', icon: '', order: 1 }
    ],
    settings: {
        theme: 'light',
        viewMode: 'grid',
        lastUpdated: new Date().toISOString()
    }
};

/**
 * 데이터 관리 클래스
 */
class DataManager {
    constructor() {
        this.data = this.loadData();
    }

    /**
     * LocalStorage에서 데이터 로드
     */
    loadData() {
        let data;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 데이터 유효성 검사
                if (parsed.categories && parsed.services && parsed.settings) {
                    data = parsed;
                }
            }
        } catch (e) {
            console.error('데이터 로드 실패:', e);
        }

        // 저장된 데이터가 없거나 유효하지 않으면 기본 데이터 사용
        if (!data) {
            data = JSON.parse(JSON.stringify(defaultData));
        }

        // 아이콘이 없는 서비스에 자동으로 파비콘 적용
        if (data.services) {
            data.services.forEach(svc => {
                if (!svc.icon && svc.url) {
                    svc.icon = this.getFaviconUrl(svc.url);
                }
            });
        }

        return data;
    }

    /**
     * LocalStorage에 데이터 저장
     */
    saveData() {
        try {
            this.data.settings.lastUpdated = new Date().toISOString();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            return true;
        } catch (e) {
            console.error('데이터 저장 실패:', e);
            return false;
        }
    }

    /**
     * 고유 ID 생성
     */
    generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 파비콘 URL 가져오기
     */
    getFaviconUrl(url) {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return '';
        }
    }

    // ===== 카테고리 CRUD =====

    /**
     * 모든 카테고리 가져오기
     */
    getCategories() {
        return [...this.data.categories].sort((a, b) => a.order - b.order);
    }

    /**
     * 카테고리 ID로 가져오기
     */
    getCategoryById(id) {
        return this.data.categories.find(cat => cat.id === id);
    }

    /**
     * 카테고리 추가
     */
    addCategory(name, icon = '📁') {
        const maxOrder = Math.max(...this.data.categories.map(c => c.order), -1);
        const category = {
            id: this.generateId('cat'),
            name: name.trim(),
            icon: icon || '📁',
            order: maxOrder + 1,
            collapsed: false
        };
        this.data.categories.push(category);
        this.saveData();
        return category;
    }

    /**
     * 카테고리 수정
     */
    updateCategory(id, updates) {
        const index = this.data.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            this.data.categories[index] = { ...this.data.categories[index], ...updates };
            this.saveData();
            return this.data.categories[index];
        }
        return null;
    }

    /**
     * 카테고리 삭제
     */
    deleteCategory(id) {
        const index = this.data.categories.findIndex(cat => cat.id === id);
        if (index !== -1) {
            // 해당 카테고리의 서비스도 삭제
            this.data.services = this.data.services.filter(svc => svc.categoryId !== id);
            this.data.categories.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    /**
     * 카테고리 순서 변경
     */
    reorderCategories(categoryIds) {
        categoryIds.forEach((id, index) => {
            const cat = this.data.categories.find(c => c.id === id);
            if (cat) cat.order = index;
        });
        this.saveData();
    }

    /**
     * 카테고리 접기/펼치기 토글
     */
    toggleCategoryCollapse(id) {
        const category = this.getCategoryById(id);
        if (category) {
            category.collapsed = !category.collapsed;
            this.saveData();
            return category.collapsed;
        }
        return null;
    }

    // ===== 서비스 CRUD =====

    /**
     * 카테고리별 서비스 가져오기
     */
    getServicesByCategory(categoryId) {
        return this.data.services
            .filter(svc => svc.categoryId === categoryId)
            .sort((a, b) => a.order - b.order);
    }

    /**
     * 모든 서비스 가져오기
     */
    getAllServices() {
        return [...this.data.services].sort((a, b) => a.order - b.order);
    }

    /**
     * 서비스 ID로 가져오기
     */
    getServiceById(id) {
        return this.data.services.find(svc => svc.id === id);
    }

    /**
     * 서비스 추가
     */
    addService(categoryId, name, url, icon = '') {
        const categoryServices = this.getServicesByCategory(categoryId);
        const maxOrder = categoryServices.length > 0
            ? Math.max(...categoryServices.map(s => s.order))
            : -1;

        const service = {
            id: this.generateId('svc'),
            categoryId,
            name: name.trim(),
            url: url.trim(),
            icon: icon || this.getFaviconUrl(url),
            order: maxOrder + 1
        };
        this.data.services.push(service);
        this.saveData();
        return service;
    }

    /**
     * 서비스 수정
     */
    updateService(id, updates) {
        const index = this.data.services.findIndex(svc => svc.id === id);
        if (index !== -1) {
            // URL이 변경되면 아이콘도 업데이트
            if (updates.url && !updates.icon) {
                updates.icon = this.getFaviconUrl(updates.url);
            }
            this.data.services[index] = { ...this.data.services[index], ...updates };
            this.saveData();
            return this.data.services[index];
        }
        return null;
    }

    /**
     * 서비스 삭제
     */
    deleteService(id) {
        const index = this.data.services.findIndex(svc => svc.id === id);
        if (index !== -1) {
            this.data.services.splice(index, 1);
            this.saveData();
            return true;
        }
        return false;
    }

    /**
     * 서비스 순서 변경
     */
    reorderServices(categoryId, serviceIds) {
        serviceIds.forEach((id, index) => {
            const svc = this.data.services.find(s => s.id === id);
            if (svc) {
                svc.categoryId = categoryId;
                svc.order = index;
            }
        });
        this.saveData();
    }

    /**
     * 서비스를 다른 카테고리로 이동
     */
    moveService(serviceId, targetCategoryId, targetIndex = null) {
        const service = this.getServiceById(serviceId);
        if (!service) return false;

        const targetServices = this.getServicesByCategory(targetCategoryId);

        service.categoryId = targetCategoryId;
        service.order = targetIndex !== null
            ? targetIndex
            : (targetServices.length > 0 ? Math.max(...targetServices.map(s => s.order)) + 1 : 0);

        this.saveData();
        return true;
    }

    // ===== 검색 =====

    /**
     * 서비스 검색
     */
    searchServices(query) {
        if (!query || !query.trim()) {
            return this.getAllServices();
        }
        const term = query.toLowerCase().trim();
        return this.data.services.filter(svc =>
            svc.name.toLowerCase().includes(term) ||
            svc.url.toLowerCase().includes(term)
        );
    }

    // ===== 설정 =====

    /**
     * 설정 가져오기
     */
    getSettings() {
        return { ...this.data.settings };
    }

    /**
     * 설정 업데이트
     */
    updateSettings(updates) {
        this.data.settings = { ...this.data.settings, ...updates };
        this.saveData();
        return this.data.settings;
    }

    // ===== 내보내기/가져오기 =====

    /**
     * 데이터 내보내기
     */
    exportData() {
        return JSON.stringify(this.data, null, 2);
    }

    /**
     * 데이터 가져오기
     */
    importData(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            if (imported.categories && imported.services && imported.settings) {
                this.data = imported;
                this.saveData();
                return true;
            }
            throw new Error('유효하지 않은 데이터 형식');
        } catch (e) {
            console.error('데이터 가져오기 실패:', e);
            return false;
        }
    }

    /**
     * 기본 데이터로 초기화
     */
    resetToDefault() {
        this.data = JSON.parse(JSON.stringify(defaultData));

        // 아이콘이 없는 서비스에 자동으로 파비콘 적용
        if (this.data.services) {
            this.data.services.forEach(svc => {
                if (!svc.icon && svc.url) {
                    svc.icon = this.getFaviconUrl(svc.url);
                }
            });
        }

        this.saveData();
        return true;
    }

    /**
     * 카테고리별 서비스 수 가져오기
     */
    getServiceCountByCategory(categoryId) {
        return this.data.services.filter(svc => svc.categoryId === categoryId).length;
    }
}

// 전역 데이터 매니저 인스턴스
const dataManager = new DataManager();
