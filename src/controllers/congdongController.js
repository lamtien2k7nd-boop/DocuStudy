// controllers/congdongController.js
const { query, get, run } = require('../config/database');

// Helper: định dạng ngày tháng
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Helper: giới hạn độ dài text
function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ==================== TRANG CHÍNH CỘNG ĐỒNG ====================
exports.getCongDong = async (req, res) => {
    try {
        // 1. Lấy danh sách bài viết (posts) mới nhất
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        const totalResult = await get(`
            SELECT COUNT(*) as total FROM posts WHERE is_published = 1
        `);
        const totalPosts = totalResult.total || 0;
        const totalPages = Math.ceil(totalPosts / limit) || 1;

        const posts = await query(`
            SELECT id, title, content, author_name, author_avatar, 
                   view_count, created_at
            FROM posts
            WHERE is_published = 1
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const formattedPosts = posts.map(post => ({
            id: post.id,
            title: post.title,
            content: truncateText(post.content, 300),
            authorName: post.author_name || 'Người dùng ẩn danh',
            authorAvatar: post.author_avatar || '/images/default-avatar.png',
            viewCount: post.view_count,
            createdAt: formatDate(post.created_at),
            link: `/congdong/bai-viet/${post.id}`
        }));

        // 2. Lấy bài viết ghim (nổi bật)
        const pinnedPosts = await query(`
            SELECT id, title, content, author_name, author_avatar, created_at
            FROM posts
            WHERE is_pinned = 1 AND is_published = 1
            ORDER BY created_at DESC
            LIMIT 3
        `);

        const formattedPinned = pinnedPosts.map(post => ({
            id: post.id,
            title: post.title,
            content: truncateText(post.content, 200),
            authorName: post.author_name || 'Người dùng ẩn danh',
            authorAvatar: post.author_avatar || '/images/default-avatar.png',
            createdAt: formatDate(post.created_at),
            link: `/congdong/bai-viet/${post.id}`
        }));

        // 3. Lấy bình luận mới nhất từ tài liệu (hiển thị bên cạnh)
        const commentPage = parseInt(req.query.cpage) || 1;
        const commentLimit = 5;
        const commentOffset = (commentPage - 1) * commentLimit;

        // Đếm tổng comment
        const totalCommentsResult = await get('SELECT COUNT(*) as total FROM comments WHERE is_approved = 1');
        const totalComments = totalCommentsResult.total || 0;
        const totalCommentPages = Math.ceil(totalComments / commentLimit) || 1;

        // Lấy comment mới nhất kèm thông tin subcategory
        const recentComments = await query(`
            SELECT c.id, c.content, c.created_at, 
                u.full_name as userName, u.avatar_url as userAvatar,
                d.id as documentId, d.title as documentTitle, d.slug as documentSlug,
                s.target_id as subcategorySlug
            FROM comments c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN documents d ON c.document_id = d.id
            LEFT JOIN subcategories s ON d.subcategory_id = s.id
            WHERE c.is_approved = 1
            ORDER BY c.created_at DESC
            LIMIT ? OFFSET ?
        `, [commentLimit, commentOffset]);

        // Format comment
        const formattedComments = recentComments.map(c => ({
            id: c.id,
            content: c.content,
            userName: c.userName || 'Người dùng ẩn danh',
            userAvatar: c.userAvatar || '/images/default-avatar.png',
            createdAt: formatDate(c.created_at),
            documentTitle: c.documentTitle || 'Tài liệu',
            documentLink: c.documentSlug && c.subcategorySlug 
                ? `/phanloai/${c.subcategorySlug}/${c.documentSlug}` 
                : '#'
        }));
        // 4. Lấy tin tức
        const allNews = await query(`
            SELECT id, title, description, image_url, link, date
            FROM news
            ORDER BY date DESC
            LIMIT 5
        `);

        let featuredNews = null;
        let newsList = [];

        if (allNews.length > 0) {
            featuredNews = {
                image: allNews[0].image_url || '/img/default-news.jpg',
                title: allNews[0].title,
                description: truncateText(allNews[0].description || '', 200),
                date: formatDate(allNews[0].date),
                link: allNews[0].link || `/tin-tuc/${allNews[0].id}`
            };
            newsList = allNews.slice(1).map(item => ({
                image: item.image_url || '/img/default-news.jpg',
                title: truncateText(item.title, 60),
                date: formatDate(item.date),
                link: item.link || `/tin-tuc/${item.id}`
            }));
        }

        // 5. Lấy thông tin user hiện tại (nếu đã đăng nhập)
        const currentUser = req.session?.user || null;
        const currentUserAvatar = currentUser?.avatar_url || '/images/default-avatar.png';
        const currentUserName = currentUser?.full_name || 'Bạn';

        // 6. Render view
        res.render('congdong', {
            title: 'Cộng đồng - DocuStudy',
            posts: formattedPosts,
            pinnedPosts: formattedPinned,
            recentComments: formattedComments,
            currentCommentPage: commentPage,
            totalCommentPages: totalCommentPages,
            featuredNews,
            newsList,
            currentPage: page,
            totalPages: totalPages,
            currentUser,
            currentUserAvatar,
            currentUserName,
            isLoggedIn: !!currentUser,
            newPost: {
                title: 'Bài viết mới',
                subtitle: 'Chia sẻ kiến thức và kinh nghiệm với cộng đồng',
                placeholder: 'Bạn đang nghĩ gì? Hãy chia sẻ với mọi người!',
                buttonText: 'Đăng bài'
            },
            successMessage: req.query.success || null,
            errorMessage: req.query.error || null,
            truncateText: truncateText
        });

    } catch (error) {
        console.error('Lỗi trang cộng đồng:', error);
        res.render('congdong', {
            title: 'Cộng đồng - DocuStudy',
            posts: [],
            pinnedPosts: [],
            recentComments: [],
            featuredNews: null,
            newsList: [],
            currentPage: 1,
            totalPages: 1,
            currentUser: null,
            currentUserAvatar: '/images/default-avatar.png',
            currentUserName: 'Bạn',
            isLoggedIn: false,
            newPost: {
                title: 'Bài viết mới',
                subtitle: 'Chia sẻ kiến thức và kinh nghiệm với cộng đồng',
                placeholder: 'Bạn đang nghĩ gì?',
                buttonText: 'Đăng bài'
            },
            successMessage: null,
            errorMessage: 'Không thể tải dữ liệu. Vui lòng thử lại sau.'
        });
    }
};

// ==================== ĐĂNG BÀI VIẾT (YÊU CẦU ĐĂNG NHẬP) ====================
exports.postBaiViet = async (req, res) => {
    try {
        // Kiểm tra đăng nhập (middleware đã làm, nhưng check lại)
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Vui lòng đăng nhập để đăng bài!' 
            });
        }

        const { title, content } = req.body;
        const user = req.session.user;

        // Validate dữ liệu
        if (!title || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Vui lòng điền đầy đủ tiêu đề và nội dung!' 
            });
        }

        if (title.length < 5 || title.length > 200) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tiêu đề phải từ 5-200 ký tự!' 
            });
        }

        if (content.length < 10 || content.length > 5000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nội dung phải từ 10-5000 ký tự!' 
            });
        }

        // Insert bài viết mới
        const result = await run(`
            INSERT INTO posts (title, content, author_name, author_avatar, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
            title.trim(), 
            content.trim(), 
            user.full_name || user.username,
            user.avatar_url || '/images/default-avatar.png',
            user.id
        ]);

        if (result && result.lastID) {
            return res.status(200).json({ 
                success: true, 
                message: 'Đăng bài thành công!',
                postId: result.lastID,
                redirect: `/congdong/bai-viet/${result.lastID}`
            });
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'Không thể đăng bài, vui lòng thử lại!' 
            });
        }

    } catch (error) {
        console.error('Lỗi đăng bài:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi đăng bài!' 
        });
    }
};

// ==================== XEM CHI TIẾT BÀI VIẾT ====================
exports.getChiTietBaiViet = async (req, res) => {
    try {
        const { id } = req.params;

        const post = await get(`
            SELECT id, title, content, author_name, author_avatar, 
                   view_count, created_at, updated_at, user_id
            FROM posts
            WHERE id = ? AND is_published = 1
        `, [id]);

        if (!post) {
            return res.status(404).render('404', { message: 'Không tìm thấy bài viết' });
        }

        // Tăng lượt xem
        run(`UPDATE posts SET view_count = view_count + 1 WHERE id = ?`, [id]);

        const formattedPost = {
            ...post,
            authorName: post.author_name || 'Người dùng ẩn danh',
            authorAvatar: post.author_avatar || '/images/default-avatar.png',
            createdAt: formatDate(post.created_at),
            viewCount: post.view_count + 1
        };

        // Lấy bài viết liên quan
        const relatedPosts = await query(`
            SELECT id, title, author_name, created_at
            FROM posts
            WHERE id != ? AND is_published = 1
            ORDER BY created_at DESC
            LIMIT 5
        `, [id]);

        res.render('baiviet', {
            title: post.title + ' - Cộng đồng DocuStudy',
            post: formattedPost,
            relatedPosts: relatedPosts.map(p => ({
                ...p,
                createdAt: formatDate(p.created_at)
            })),
            isLoggedIn: !!req.session.user,
            currentUser: req.session.user || null
        });

    } catch (error) {
        console.error('Lỗi chi tiết bài viết:', error);
        res.status(500).render('error', {
            title: 'Lỗi tải dữ liệu',
            message: 'Đã xảy ra lỗi khi tải bài viết',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};