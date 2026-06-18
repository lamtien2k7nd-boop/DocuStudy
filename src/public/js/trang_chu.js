// ========== LOGIN/SIGNUP POPUP LOGIC ==========
let currentViewId = 'view-general';
let isAnimating = false;
lucide.createIcons(); // Khởi tạo icon Lucide (nếu có sử dụng)
function openModal() {
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.classList.add('active');
}

function closeModal() {
    const overlay = document.getElementById('overlay');
    if (!overlay) return;
    
    overlay.classList.remove('active');
    
    // Reset to general page after closing
    setTimeout(() => {
        if(currentViewId !== 'view-general') {
            resetToGeneral();
        }
    }, 500);
}

function switchView(targetViewId) {
    const modal = document.getElementById('mainModal');
    const backBtn = document.getElementById('back-btn');
    
    if (!modal || isAnimating || currentViewId === targetViewId) return;
    
    isAnimating = true;
    const currentView = document.getElementById(currentViewId);
    const targetView = document.getElementById(targetViewId);

    if (!currentView || !targetView) {
        isAnimating = false;
        return;
    }

    // 1. FADE OUT current view
    currentView.style.opacity = '0';
    if (backBtn) backBtn.style.opacity = '0';

    setTimeout(() => {
        // Fix current height for smooth resize
        const startHeight = modal.offsetHeight;
        modal.style.height = startHeight + 'px';

        // Toggle display
        currentView.style.display = 'none';
        
        if (targetViewId === 'view-general') {
            targetView.style.display = 'flex';
            modal.classList.remove('mode-form');
            if (backBtn) backBtn.style.display = 'none';
        } else {
            targetView.style.display = 'block';
            modal.classList.add('mode-form');
            if (backBtn) backBtn.style.display = 'block';
        }

        // Calculate new height
        modal.style.height = 'auto';
        const endHeight = modal.offsetHeight;
        
        // Return to old height for animation start
        modal.style.height = startHeight + 'px';
        void modal.offsetHeight; // force reflow

        // 2. RESIZE BOX
        modal.style.height = endHeight + 'px';

        setTimeout(() => {
            // 3. FADE IN new view
            modal.style.height = 'auto';
            targetView.style.opacity = '1';
            
            if (targetViewId !== 'view-general' && backBtn) {
                backBtn.style.opacity = '1';
            }

            currentViewId = targetViewId;
            isAnimating = false;

        }, 500);
    }, 300);
}

function resetToGeneral() {
    const modal = document.getElementById('mainModal');
    const backBtn = document.getElementById('back-btn');
    
    const currentView = document.getElementById(currentViewId);
    const generalView = document.getElementById('view-general');
    
    if (currentView) {
        currentView.style.display = 'none';
        currentView.style.opacity = '0';
    }
    
    if (generalView) {
        generalView.style.display = 'flex';
        generalView.style.opacity = '1';
    }
    
    if (modal) modal.classList.remove('mode-form');
    if (backBtn) {
        backBtn.style.display = 'none';
        backBtn.style.opacity = '0';
    }
    
    currentViewId = 'view-general';
}

function initLoginPopup() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });
    }
    
    // Gán vào window để dùng trong onclick
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.switchView = switchView;
    // window.toggleGuestForm = toggleGuestForm;
}
// ========== HÀM DÙNG CHUNG: TAB SWITCHING & PAGINATION ==========
// Áp dụng cho mọi section có cấu trúc: tab-btn, tab-content, card-page, view-more-page
function initSectionPagination(section) {
    const tabBtns = section.querySelectorAll('.tab-btn');
    const tabContents = section.querySelectorAll('.tab-content');
    const btnPrevPage = section.querySelector('.btn-prev-page');
    const btnNextPage = section.querySelector('.btn-next-page');

    // --- CHUYỂN TAB ---
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Bỏ active tất cả nút
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Ẩn tất cả tab content, hiện tab được chọn
            const targetId = btn.getAttribute('data-target');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetId) {
                    content.classList.add('active');
                    // Reset về trang đầu tiên (có thẻ)
                    resetToFirstCardPage(content);
                }
            });
        });
    });

    // --- LẬT TRANG ---
    function resetToFirstCardPage(contentEl) {
        const pages = contentEl.querySelectorAll('.card-page');
        const viewMore = contentEl.querySelector('.view-more-page');
        // Ẩn tất cả
        pages.forEach(p => p.classList.remove('active'));
        if (viewMore) viewMore.classList.remove('active');
        // Kích hoạt trang đầu tiên
        if (pages.length > 0) {
            pages[0].classList.add('active');
        }
    }

    function goToPage(contentEl, direction) {
        const pages = Array.from(contentEl.querySelectorAll('.card-page'));
        const viewMore = contentEl.querySelector('.view-more-page');
        if (pages.length === 0) return;

        // Tìm trang đang active
        let currentIndex = pages.findIndex(p => p.classList.contains('active'));
        // Nếu đang ở view-more-page thì coi như đang ở vị trí "sau trang cuối cùng"
        if (currentIndex === -1 && viewMore && viewMore.classList.contains('active')) {
            currentIndex = pages.length; // pages.length tượng trưng cho view-more
        }

        // Xoá active hiện tại
        pages.forEach(p => p.classList.remove('active'));
        if (viewMore) viewMore.classList.remove('active');

        let newIndex = currentIndex;
        if (direction === 'next') {
            newIndex++;
        } else {
            newIndex--;
        }

        // Xử lý biên
        if (newIndex < 0) newIndex = pages.length - 1; // Quay lại trang cuối có thẻ
        if (newIndex >= pages.length) {
            // Vượt quá số trang thẻ => hiện view-more-page
            if (viewMore) {
                viewMore.classList.add('active');
            } else {
                // Nếu không có view-more-page thì quay về trang cuối
                pages[pages.length - 1].classList.add('active');
            }
        } else {
            // Hiện trang thẻ tương ứng
            pages[newIndex].classList.add('active');
        }
    }

    // Gắn sự kiện cho nút phân trang
    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            const activeContent = section.querySelector('.tab-content.active');
            if (activeContent) goToPage(activeContent, 'prev');
        });
    }
    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            const activeContent = section.querySelector('.tab-content.active');
            if (activeContent) goToPage(activeContent, 'next');
        });
    }

    // --- CUỘN DANH SÁCH TAB (nếu có nhiều tab) ---
    const scrollLeft = section.querySelector('.tab-scroll-left');
    const scrollRight = section.querySelector('.tab-scroll-right');
    const tabList = section.querySelector('.tab-list');
    if (scrollLeft && tabList) {
        scrollLeft.addEventListener('click', () => {
            tabList.scrollBy({ left: -150, behavior: 'smooth' });
        });
    }
    if (scrollRight && tabList) {
        scrollRight.addEventListener('click', () => {
            tabList.scrollBy({ left: 150, behavior: 'smooth' });
        });
    }
}

// ========== CHUYỂN ACTIVE TRÊN NAVBAR ==========
function initNavActive() {
    const navLinks = document.querySelectorAll('.nav-link');
    if (!navLinks.length) return;

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') {
                e.preventDefault();
            }            
            // Xóa active tất cả link
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Thêm active cho link vừa click
            this.classList.add('active');
        });
    });
}

// ========== CẬP NHẬT ACTIVE THEO URL ==========
function updateActiveNav() {
    const currentPath = window.location.pathname; // "/phanloai"
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Xóa active tất cả
        link.classList.remove('active');
        
        // Trang chủ
        if (href === '/') {
            if (currentPath === '/') {
                link.classList.add('active');
            }
        }
        // Các link khác (phanloai, congdong)
        else {
            // Tạo path chuẩn: thêm dấu / nếu chưa có
            const path = href.startsWith('/') ? href : '/' + href;
            // So sánh chính xác hoặc path con
            if (currentPath === path || currentPath.startsWith(path + '/')) {
                link.classList.add('active');
            }
        }
    });
}

// ========== KHỞI TẠO TẤT CẢ SAU KHI DOM SẴN SÀNG ==========
document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo modal login (nếu có)
    if (typeof initLoginPopup === 'function') {
        initLoginPopup();
    }

    // --- Áp dụng cho từng section ---
    // Section HSA
    const hsaSection = document.querySelector('.hsa-section');
    if (hsaSection) {
        initSectionPagination(hsaSection);
    }
    //Section TSA
    const tsaSection = document.querySelector('.tsa-section');
    if (tsaSection) {
        initSectionPagination(tsaSection);
    }
    //Section V-ACT
    const vactSection = document.querySelector('.vact-section');
    if (vactSection) {
        initSectionPagination(vactSection);
    }
    //Section Lớp 12
    const g12Section = document.querySelector('.g12-section');
    if (g12Section) {
        initSectionPagination(g12Section);
    }
    //Section Lớp 11
    const g11Section = document.querySelector('.g11-section');
    if (g11Section) {
        initSectionPagination(g11Section);
    }
    //Section Lớp 10
    const g10Section = document.querySelector('.g10-section');
    if (g10Section) {
        initSectionPagination(g10Section);
    }

    // Section TSA (ví dụ, bạn hãy copy HTML tương tự và bỏ comment)
    // const tsaSection = document.querySelector('.tsa-section');
    // if (tsaSection) initSectionPagination(tsaSection);

    // Section Lớp 12 (id hoặc class tùy bạn đặt)
    // const g12Section = document.querySelector('.g12-section');
    // if (g12Section) initSectionPagination(g12Section);

    // Section Lớp 11
    // const g11Section = document.querySelector('.g11-section');
    // if (g11Section) initSectionPagination(g11Section);

    // Section Lớp 10
    // const g10Section = document.querySelector('.g10-section');
    // if (g10Section) initSectionPagination(g10Section);

    // Khởi tạo active cho navbar
    // initNavActive();

    // Cập nhật active navbar dựa trên URL hiện tại
    updateActiveNav();
    // Các hàm khác (carousel, dropdown) nếu có, giữ nguyên ở đây
});
