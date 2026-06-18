// public/js/congdong.js
document.addEventListener('DOMContentLoaded', function() {
    const postForm = document.getElementById('postForm');
    if (!postForm) return;

    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const title = document.getElementById('postTitle')?.value.trim();
        const content = document.getElementById('postContent')?.value.trim();

        // Validate
        if (!title || !content) {
            showMessage('Vui lòng điền đầy đủ tiêu đề và nội dung!', 'error');
            return;
        }

        if (title.length < 5) {
            showMessage('Tiêu đề phải có ít nhất 5 ký tự!', 'error');
            return;
        }

        if (content.length < 10) {
            showMessage('Nội dung phải có ít nhất 10 ký tự!', 'error');
            return;
        }

        try {
            const response = await fetch('/congdong/dang-bai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title, content })
            });

            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
                document.getElementById('postTitle').value = '';
                document.getElementById('postContent').value = '';
                // Chuyển hướng đến bài viết mới
                if (result.redirect) {
                    setTimeout(() => {
                        window.location.href = result.redirect;
                    }, 1500);
                } else {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                }
            } else {
                showMessage(result.message || 'Đăng bài thất bại!', 'error');
            }
        } catch (error) {
            console.error('Lỗi:', error);
            showMessage('Đã xảy ra lỗi khi đăng bài!', 'error');
        }
    });
});

function showMessage(message, type) {
    const container = document.querySelector('.new-post-container');
    const existingAlert = container.querySelector('.alert');
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    container.insertBefore(alertDiv, container.querySelector('.new-post-form'));

    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}