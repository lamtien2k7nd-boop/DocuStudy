/* public/js/search.js */
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchInputs.forEach(input => {
        const wrapper = input.closest('.search-wrapper');
        if (!wrapper) return;

        // Tạo container dropdown nếy chưa có
        let dropdown = wrapper.querySelector('.search-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'search-dropdown';
            wrapper.appendChild(dropdown);
        }

        let debounceTimer;

        input.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const q = this.value.trim();

            if (q.length < 2) {
                dropdown.classList.remove('active');
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/phanloai/api/search?q=${encodeURIComponent(q)}`);
                    const data = await res.json();

                    if (data.success) {
                        renderResults(dropdown, data);
                    }
                } catch (err) {
                    console.error('Search error:', err);
                }
            }, 300);
        });

        // Đóng dropdown khi click ngoài
        document.addEventListener('click', function(e) {
            if (!wrapper.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Mở lại dropdown nếu input có nội dung rôi focus vào
        input.addEventListener('focus', function() {
            if (this.value.trim().length >= 2 && dropdown.innerHTML !== '') {
                dropdown.classList.add('active');
            }
        });
    });

    function renderResults(dropdown, data) {
        const { documents, tags, structureMatches } = data;
        let html = '';

        if (documents.length === 0 && tags.length === 0 && structureMatches.length === 0) {
            html = '<div class="search-no-results">Không tìm thấy kết quả phù hợp</div>';
        } else {
            // Phần Documents
            if (documents.length > 0) {
                html += '<div class="search-section"><div class="search-section-title">Tài liệu & Đề thi</div>';
                documents.forEach(doc => {
                    html += `
                        <a href="${doc.link}" class="search-result-item">
                            <img src="${doc.image}" class="search-result-image" alt="">
                            <div class="search-result-info">
                                <div class="search-result-title">${doc.title}</div>
                            </div>
                        </a>
                    `;
                });
                html += '</div>';
            }

            // Phần Tags
            if (tags.length > 0) {
                html += '<div class="search-section"><div class="search-section-title">Danh mục & Tag</div>';
                html += '<div style="padding: 5px 10px;">';
                tags.forEach(tag => {
                    html += `<a href="${tag.link}" class="search-tag-item"># ${tag.label}</a>`;
                });
                html += '</div></div>';
            }

            // Phần Structure (Cấu trúc đề)
            if (structureMatches.length > 0) {
                html += '<div class="search-section"><div class="search-section-title">Cấu trúc đề thi tương ứng</div>';
                structureMatches.forEach(match => {
                    html += `
                        <a href="${match.link}" class="search-result-item">
                            <div class="search-result-info">
                                <div class="search-result-title" style="color: #6366f1;">• ${match.title}</div>
                            </div>
                        </a>
                    `;
                });
                html += '</div>';
            }
        }

        dropdown.innerHTML = html;
        dropdown.classList.add('active');
    }
});
