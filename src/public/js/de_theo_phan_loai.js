document.addEventListener('DOMContentLoaded', () => {
    // 1. All Section Grid 4x2 Pagination
    const allSection = document.querySelector('.all-section');
    if (allSection) {
        const itemsContainer = allSection.querySelector('.items');
        const allItems = Array.from(itemsContainer.querySelectorAll('.card'));
        
        // Clear container
        itemsContainer.innerHTML = '';
        
        const itemsPerPage = 8; // 4x2 grid
        const totalPages = Math.ceil(allItems.length / itemsPerPage);
        let currentPage = 0;
        
        // Create pages
        for (let i = 0; i < totalPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.classList.add('items-page');
            
            const start = i * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = allItems.slice(start, end);
            
            pageItems.forEach(item => {
                pageDiv.appendChild(item);
            });
            
            itemsContainer.appendChild(pageDiv);
        }
        
        // update pagination dots/buttons
        const prevBtn = allSection.querySelector('.prev-page');
        const nextBtn = allSection.querySelector('.next-page');
        const paginationContainer = allSection.querySelector('.pagination-btns');
        
        // Insert dots
        let dots = [];
        if (totalPages > 1) {
            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('div');
                dot.classList.add('page-dot');
                if (i === 0) dot.classList.add('active');
                dot.addEventListener('click', () => goToPage(i));
                
                // insert before nextBtn
                paginationContainer.insertBefore(dot, nextBtn);
                dots.push(dot);
            }
        }
        
        const updatePagination = () => {
             // translateX based on currentPage
             const pages = itemsContainer.querySelectorAll('.items-page');
             pages.forEach(p => p.style.transform = `translateX(-${currentPage * 100}%)`);
             
             // buttons
             if (prevBtn) prevBtn.disabled = currentPage === 0;
             if (nextBtn) nextBtn.disabled = currentPage === totalPages - 1;
             
             // dots
             dots.forEach((dot, index) => {
                 dot.classList.toggle('active', index === currentPage);
             });
        };
        
        const goToPage = (pageIndex) => {
             currentPage = pageIndex;
             updatePagination();
        };
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (currentPage > 0) goToPage(currentPage - 1);
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages - 1) goToPage(currentPage + 1);
            });
        }
        
        updatePagination();
    }
    
    // 2. Carousel for Trending and Favourite Sections
    const carousels = document.querySelectorAll('.trending-section, .favourite-section');
    carousels.forEach(section => {
        const container = section.querySelector('.carousel-container');
        const prevBtn = section.querySelector('.carousel-btn.prev');
        const nextBtn = section.querySelector('.carousel-btn.next');
        
        if (container && prevBtn && nextBtn) {
            // Need to wait out for layous to update
            const updateButtons = () => {
                const maxScrollLeft = container.scrollWidth - container.clientWidth;
                prevBtn.style.display = container.scrollLeft <= 0 ? 'none' : 'flex';
                nextBtn.style.display = container.scrollLeft >= maxScrollLeft - 10 ? 'none' : 'flex';
            };
            
            container.addEventListener('scroll', updateButtons);
            
            prevBtn.addEventListener('click', () => {
                const itemWidth = container.querySelector('.card')?.offsetWidth + 24 || 200;
                container.scrollBy({ left: -itemWidth * 2, behavior: 'smooth' });
            });
            nextBtn.addEventListener('click', () => {
                const itemWidth = container.querySelector('.card')?.offsetWidth + 24 || 200;
                container.scrollBy({ left: itemWidth * 2, behavior: 'smooth' });
            });
            
            // init
            setTimeout(updateButtons, 100);
            window.addEventListener('resize', updateButtons);
        }
    });
});

