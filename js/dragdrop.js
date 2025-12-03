/**
 * AI Service Hub - Drag and Drop
 * HTML5 드래그앤드롭 기능 구현
 */

let draggedElement = null;
let draggedType = null; // 'service' or 'category'
let sourceContainer = null;
let placeholder = null;

/**
 * 드래그앤드롭 초기화
 */
function initDragDrop() {
    // 서비스 카드 드래그앤드롭 설정
    document.querySelectorAll('.service-card[draggable="true"]').forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragend', handleDragEnd);
    });

    // 카테고리 컨텐츠 영역 드롭 설정
    document.querySelectorAll('.category-content').forEach(content => {
        content.addEventListener('dragover', handleDragOver);
        content.addEventListener('dragenter', handleDragEnter);
        content.addEventListener('dragleave', handleDragLeave);
        content.addEventListener('drop', handleDrop);
    });

    // 카테고리 섹션 드래그앤드롭 설정 (카테고리 순서 변경)
    document.querySelectorAll('.category-section').forEach(section => {
        const header = section.querySelector('.category-header');
        if (header) {
            header.setAttribute('draggable', 'true');
            header.addEventListener('dragstart', handleCategoryDragStart);
            header.addEventListener('dragend', handleCategoryDragEnd);
        }
        section.addEventListener('dragover', handleCategoryDragOver);
        section.addEventListener('drop', handleCategoryDrop);
    });

    // mainContent에 이벤트 위임 추가 (카테고리 드롭 영역 확장)
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.addEventListener('dragover', handleMainContentDragOver);
        mainContent.addEventListener('drop', handleMainContentDrop);
    }
}

/**
 * 메인 컨텐츠 영역 드래그 오버 (카테고리용 이벤트 위임)
 */
function handleMainContentDragOver(e) {
    if (draggedType !== 'category' || !draggedCategory) return;

    // 카테고리 섹션 위가 아닌 빈 공간에서도 드래그 허용
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const mainContent = e.currentTarget;
    const afterElement = getCategoryDragAfterElement(mainContent, e.clientY);

    if (categoryPlaceholder && categoryPlaceholder.parentNode !== mainContent) {
        // 플레이스홀더가 mainContent 안에 없으면 추가
        if (afterElement == null) {
            mainContent.appendChild(categoryPlaceholder);
        } else {
            mainContent.insertBefore(categoryPlaceholder, afterElement);
        }
    }
}

/**
 * 메인 컨텐츠 영역 드롭 (카테고리용 이벤트 위임)
 */
function handleMainContentDrop(e) {
    if (draggedType !== 'category' || !draggedCategory) return;

    // handleCategoryDrop이 처리하도록 위임
    handleCategoryDrop(e);
}

// ===== 서비스 카드 드래그앤드롭 =====

/**
 * 드래그 시작 핸들러
 */
function handleDragStart(e) {
    draggedElement = e.target.closest('.service-card');
    draggedType = 'service';
    sourceContainer = draggedElement.closest('.category-content');

    // 드래그 이미지 설정
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedElement.dataset.serviceId);

    // 드래그 스타일 적용 (약간의 지연 후)
    requestAnimationFrame(() => {
        draggedElement.classList.add('dragging');
    });

    // 플레이스홀더 생성
    createPlaceholder();
}

/**
 * 드래그 종료 핸들러
 */
function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }

    // 플레이스홀더 제거
    removePlaceholder();

    // 모든 드래그 오버 스타일 제거
    document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
    });

    draggedElement = null;
    draggedType = null;
    sourceContainer = null;
}

/**
 * 드래그 오버 핸들러
 */
/**
 * 드래그 오버 핸들러
 */
function handleDragOver(e) {
    if (draggedType !== 'service') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = e.target.closest('.category-content');
    if (!container) return;

    const afterElement = getDragAfterElement(container, e.clientX, e.clientY);
    const addCard = container.querySelector('.add-service-card');

    if (placeholder) {
        if (afterElement == null) {
            // 마지막에 추가 (add 카드 앞에)
            if (addCard) {
                container.insertBefore(placeholder, addCard);
            } else {
                container.appendChild(placeholder);
            }
        } else if (afterElement !== placeholder) {
            container.insertBefore(placeholder, afterElement);
        }
    }
}

/**
 * 드래그 엔터 핸들러
 */
function handleDragEnter(e) {
    if (draggedType !== 'service') return;

    e.preventDefault();
    const container = e.target.closest('.category-content');
    if (container) {
        container.classList.add('drag-over');
    }
}

/**
 * 드래그 리브 핸들러
 */
function handleDragLeave(e) {
    const container = e.target.closest('.category-content');
    if (container && !container.contains(e.relatedTarget)) {
        container.classList.remove('drag-over');
    }
}

/**
 * 드롭 핸들러
 */
function handleDrop(e) {
    if (draggedType !== 'service') return;

    e.preventDefault();

    const container = e.target.closest('.category-content');
    if (!container || !draggedElement) return;

    container.classList.remove('drag-over');

    const targetCategoryId = container.dataset.categoryId;
    const serviceId = draggedElement.dataset.serviceId;

    // 플레이스홀더 위치에 실제 요소 이동
    if (placeholder && placeholder.parentNode === container) {
        container.insertBefore(draggedElement, placeholder);
    }

    // 플레이스홀더 제거
    removePlaceholder();

    // 새로운 순서 계산
    const serviceCards = Array.from(container.querySelectorAll('.service-card[data-service-id]'));
    const newOrder = serviceCards.map(card => card.dataset.serviceId);

    // 데이터 업데이트
    dataManager.reorderServices(targetCategoryId, newOrder);

    // UI 새로고침 (부드러운 전환을 위해 약간의 지연)
    requestAnimationFrame(() => {
        if (typeof app !== 'undefined') {
            app.render();
        }
    });
}

/**
 * 플레이스홀더 생성
 */
/**
 * 플레이스홀더 생성
 */
function createPlaceholder() {
    placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';

    if (draggedElement) {
        const rect = draggedElement.getBoundingClientRect();
        placeholder.style.width = `${rect.width}px`;
        placeholder.style.height = `${rect.height}px`;
    }
}

/**
 * 플레이스홀더 제거
 */
function removePlaceholder() {
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;
}

/**
 * 드래그 후 요소 찾기 (삽입 위치 결정)
 * 그리드 레이아웃 지원을 위해 X, Y 좌표 모두 사용
 */
function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.service-card:not(.dragging):not(.drag-placeholder):not(.add-service-card)')];

    if (draggableElements.length === 0) return null;

    // 가장 가까운 요소 찾기
    const closest = draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const boxCenterX = box.left + box.width / 2;
        const boxCenterY = box.top + box.height / 2;
        const dist = Math.hypot(x - boxCenterX, y - boxCenterY);

        if (dist < closest.dist) {
            return { dist: dist, element: child, box: box };
        } else {
            return closest;
        }
    }, { dist: Number.POSITIVE_INFINITY });

    if (!closest.element) return null;

    // 그리드 레이아웃 로직
    // 1. 마우스가 요소보다 확실히 아래에 있으면 '다음' (다음 줄)
    if (y > closest.box.bottom) {
        return closest.element.nextElementSibling;
    }

    // 2. 마우스가 요소보다 확실히 위에 있으면 '이전' (이전 줄)
    if (y < closest.box.top) {
        return closest.element;
    }

    // 3. 같은 줄에 있는 경우 X축 기준으로 판단
    if (x > closest.box.left + closest.box.width / 2) {
        return closest.element.nextElementSibling;
    } else {
        return closest.element;
    }
}

// ===== 카테고리 드래그앤드롭 =====

let draggedCategory = null;
let categoryPlaceholder = null;
let isDraggingCategory = false;
let dragStartX = 0;
let dragStartY = 0;
const DRAG_THRESHOLD = 5; // 드래그로 인식하기 위한 최소 이동 거리

/**
 * 카테고리 드래그 시작
 */
function handleCategoryDragStart(e) {
    // 버튼, 입력 필드, 기타 인터랙티브 요소 클릭은 무시
    if (e.target.closest('.category-btn') ||
        e.target.closest('button') ||
        e.target.closest('input') ||
        e.target.closest('a') ||
        e.target.closest('[contenteditable]')) {
        e.preventDefault();
        return;
    }

    // 텍스트 선택 방지
    e.target.closest('.category-header').style.userSelect = 'none';

    draggedCategory = e.target.closest('.category-section');
    if (!draggedCategory) return;

    draggedType = 'category';
    isDraggingCategory = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    // 드래그 데이터 설정
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedCategory.dataset.categoryId);

    // 드래그 이미지 설정 (요소 전체를 사용)
    try {
        const rect = draggedCategory.getBoundingClientRect();
        e.dataTransfer.setDragImage(draggedCategory, e.clientX - rect.left, e.clientY - rect.top);
    } catch (err) {
        // setDragImage 실패 시 기본 동작 사용
    }

    // 드래그 중인 요소 스타일
    requestAnimationFrame(() => {
        if (draggedCategory) {
            draggedCategory.classList.add('dragging');
            draggedCategory.style.opacity = '0.4';
        }
    });

    // 카테고리 플레이스홀더 생성
    categoryPlaceholder = document.createElement('div');
    categoryPlaceholder.className = 'category-placeholder w-full rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 mb-12 transition-all duration-200';
    categoryPlaceholder.dataset.placeholder = 'true';
    categoryPlaceholder.style.height = `${draggedCategory.offsetHeight}px`;
}

/**
 * 카테고리 드래그 종료
 */
function handleCategoryDragEnd() {
    if (draggedCategory) {
        draggedCategory.classList.remove('dragging');
        draggedCategory.style.opacity = '1';

        // 텍스트 선택 다시 허용
        const header = draggedCategory.querySelector('.category-header');
        if (header) {
            header.style.userSelect = '';
        }
    }

    if (categoryPlaceholder && categoryPlaceholder.parentNode) {
        categoryPlaceholder.parentNode.removeChild(categoryPlaceholder);
    }

    draggedCategory = null;
    categoryPlaceholder = null;
    draggedType = null;
    isDraggingCategory = false;
}

/**
 * 카테고리 드래그 오버
 */
function handleCategoryDragOver(e) {
    if (draggedType !== 'category' || !draggedCategory) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // 마우스 Y 좌표를 기준으로 삽입 위치 계산
    const afterElement = getCategoryDragAfterElement(mainContent, e.clientY);

    if (categoryPlaceholder) {
        // 플레이스홀더가 이미 올바른 위치에 있으면 이동하지 않음
        const currentNext = categoryPlaceholder.nextElementSibling;
        if (currentNext === afterElement) return;

        if (afterElement == null) {
            // 마지막 위치로 이동
            if (categoryPlaceholder.parentNode !== mainContent ||
                categoryPlaceholder.nextElementSibling !== null) {
                mainContent.appendChild(categoryPlaceholder);
            }
        } else if (afterElement !== categoryPlaceholder) {
            mainContent.insertBefore(categoryPlaceholder, afterElement);
        }
    }
}

/**
 * 카테고리 드롭
 */
function handleCategoryDrop(e) {
    if (draggedType !== 'category' || !draggedCategory) return;

    e.preventDefault();
    e.stopPropagation();

    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;

    // 플레이스홀더 위치에 카테고리 이동
    if (categoryPlaceholder && categoryPlaceholder.parentNode === mainContent) {
        mainContent.insertBefore(draggedCategory, categoryPlaceholder);

        // 플레이스홀더 즉시 제거
        categoryPlaceholder.parentNode.removeChild(categoryPlaceholder);
        categoryPlaceholder = null;
    }

    // 드래그 스타일 즉시 제거
    if (draggedCategory) {
        draggedCategory.classList.remove('dragging');
        draggedCategory.style.opacity = '1';
    }

    // 새로운 순서 저장
    const categoryIds = [...mainContent.querySelectorAll('.category-section')]
        .map(section => section.dataset.categoryId)
        .filter(id => id); // undefined 필터링

    if (categoryIds.length > 0) {
        dataManager.reorderCategories(categoryIds);
    }

    // 상태 초기화
    draggedCategory = null;
    draggedType = null;
    isDraggingCategory = false;

    // UI 새로고침 (약간의 지연으로 부드러운 전환)
    requestAnimationFrame(() => {
        if (typeof app !== 'undefined') {
            app.render();
        }
    });
}

/**
 * 카테고리 드래그 위치 계산
 */
function getCategoryDragAfterElement(container, y) {
    // 드래그 중인 요소와 플레이스홀더 제외
    const draggableElements = [...container.querySelectorAll('.category-section:not(.dragging)')];

    if (draggableElements.length === 0) return null;

    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };

    for (const child of draggableElements) {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
            closest = { offset: offset, element: child };
        }
    }

    return closest.element;
}

// ===== 터치 지원 (모바일) =====

let touchStartY = 0;
let touchElement = null;

/**
 * 터치 이벤트 초기화 (간단한 구현)
 */
function initTouchDrag() {
    document.querySelectorAll('.service-card[draggable="true"]').forEach(card => {
        card.addEventListener('touchstart', handleTouchStart, { passive: false });
        card.addEventListener('touchmove', handleTouchMove, { passive: false });
        card.addEventListener('touchend', handleTouchEnd);
    });
}

function handleTouchStart(e) {
    touchElement = e.target.closest('.service-card');
    touchStartY = e.touches[0].clientY;
}

function handleTouchMove(e) {
    if (!touchElement) return;

    e.preventDefault();
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartY;

    touchElement.style.transform = `translateY(${deltaY}px)`;
    touchElement.style.opacity = '0.7';
    touchElement.style.zIndex = '1000';
}

function handleTouchEnd(e) {
    if (!touchElement) return;

    touchElement.style.transform = '';
    touchElement.style.opacity = '1';
    touchElement.style.zIndex = '';

    // 간단한 드롭 감지 (실제 구현에서는 더 정교한 로직 필요)
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    const container = dropTarget?.closest('.category-content');

    if (container && container !== touchElement.closest('.category-content')) {
        const categoryId = container.dataset.categoryId;
        const serviceId = touchElement.dataset.serviceId;
        dataManager.moveService(serviceId, categoryId);

        if (typeof app !== 'undefined') {
            app.render();
        }
    }

    touchElement = null;
}

// 페이지 로드 시 터치 지원 초기화
document.addEventListener('DOMContentLoaded', () => {
    if ('ontouchstart' in window) {
        // 터치 디바이스에서만 초기화
        setTimeout(initTouchDrag, 100);
    }
});
