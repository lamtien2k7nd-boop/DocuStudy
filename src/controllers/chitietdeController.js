// controllers/chitietdeController.js
const { query, get, run } = require('../config/database');

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function formatCount(count) {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
}

exports.getChiTietDe = async (req, res) => {
    try {
        const { subcategorySlug, docSlug } = req.params;

        // 1. Lấy document theo slug
        const document = await get(`
            SELECT id, title, slug, description, image_url, badge, 
                   download_link, download_count, view_count, rating_avg, 
                   subcategory_id, created_at
            FROM documents
            WHERE slug = ? AND is_published = 1
        `, [docSlug]);

        if (!document) {
            return res.status(404).render('404', { message: 'Không tìm thấy tài liệu' });
        }

        // 2. Lấy subcategory để kiểm tra slug
        const subcategory = await get(`
            SELECT id, name, target_id, category_id
            FROM subcategories
            WHERE id = ?
        `, [document.subcategory_id]);

        // 3. Nếu subcategory slug không khớp → redirect đến URL đúng
        if (subcategory && subcategory.target_id !== subcategorySlug) {
            return res.redirect(`/phanloai/${subcategory.target_id}/${docSlug}`);
        }

        // 4. Tăng view_count
        run(`UPDATE documents SET view_count = view_count + 1 WHERE id = ?`, [document.id]);
        
        // Log access if user is logged in
        if (req.session.user) {
            run(`INSERT INTO access_logs (user_id, document_id, type) VALUES (?, ?, 'view')`, 
                [req.session.user.id, document.id]);
        }

        // 5. Lấy category cho breadcrumb
        let category = null;
        if (subcategory) {
            category = await get(`SELECT id, name FROM categories WHERE id = ?`, [subcategory.category_id]);
        }

        // 6. Lấy topics và items
        const topics = await query(`
            SELECT id, title, display_order
            FROM topics
            WHERE document_id = ?
            ORDER BY display_order ASC
        `, [document.id]);

        for (let topic of topics) {
            const items = await query(`
                SELECT id, content, display_order
                FROM topic_items
                WHERE topic_id = ?
                ORDER BY display_order ASC
            `, [topic.id]);
            topic.items = items;
        }

        // 7. Lấy bình luận
        // Lấy tham số page cho comment
        const commentPage = parseInt(req.query.cpage) || 1;
        const commentLimit = 5;
        const commentOffset = (commentPage - 1) * commentLimit;

        // Đếm tổng số comment của document
        const totalCommentsResult = await get(`
        SELECT COUNT(*) as total FROM comments 
        WHERE document_id = ? AND is_approved = 1
        `, [document.id]);
        const totalComments = totalCommentsResult.total || 0;
        const totalCommentPages = Math.ceil(totalComments / commentLimit) || 1;

        // Lấy danh sách comment
        const comments = await query(`
        SELECT c.id, c.content, c.created_at, 
                u.full_name as userName, u.avatar_url as userAvatar
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.document_id = ? AND c.is_approved = 1
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
        `, [document.id, commentLimit, commentOffset]);

        // Format comment
        const formattedComments = comments.map(c => ({
        id: c.id,
        content: c.content,
        userName: c.userName || 'Người dùng ẩn danh',
        userAvatar: c.userAvatar || '/images/default-avatar.png',
        createdAt: formatDate(c.created_at),
        documentId: document.id
        }));

        // 8. Lấy tài liệu liên quan
        let relatedDocs = [];
        if (subcategory) {
            relatedDocs = await query(`
                SELECT id, title, slug, image_url, download_count
                FROM documents
                WHERE subcategory_id = ? AND id != ? AND is_published = 1
                ORDER BY created_at DESC
                LIMIT 6
            `, [subcategory.id, document.id]);
        }

        // 9. Format dữ liệu
        const formattedDocument = {
            ...document,
            created_at: formatDate(document.created_at),
            download_count: formatCount(document.download_count),
            view_count: formatCount(document.view_count),
            rating_avg: document.rating_avg ? document.rating_avg.toFixed(1) : '0'
        };

        const formattedRelated = relatedDocs.map(doc => ({
            ...doc,
            download_count: formatCount(doc.download_count)
        }));

        // 10. Xây dựng breadcrumb
        const breadcrumb = {
            homeLink: '/',
            homeLabel: 'Trang chủ',
            categoryLink: '/phanloai',
            categoryLabel: category ? category.name : 'Tài liệu',
            subcategoryLink: subcategory ? `/phanloai/${subcategory.target_id}` : '#',
            subcategoryLabel: subcategory ? subcategory.name : '',
            documentTitle: document.title
        };

        // 11. Render view
        res.render('chitietde', {
            title: document.title || 'Chi tiết tài liệu',
            document: formattedDocument,
            subcategory,
            category,
            topics,
            comments,
            relatedDocs: formattedRelated,
            breadcrumb,
            postCategory: subcategory ? subcategory.name : 'Tài liệu',
            entryTitle: {
                main: document.title,
                sub: document.badge || null
            },
            postDescription: document.description || '',
            downloadLink: document.download_link || '#',
            downloadHint: 'Định dạng PDF • Bản chuẩn gốc',
            comments: formattedComments,
            currentCommentPage: commentPage,
            totalCommentPages: totalCommentPages,
            totalComments: totalComments,
            isLoggedIn: !!req.session.user,  // <-- thêm dòng này
            currentUser: req.session.user || null       
        });

    } catch (error) {
        console.error('Lỗi trang chi tiết đề:', error);
        res.status(500).render('error', {
            title: 'Lỗi tải dữ liệu',
            message: 'Đã xảy ra lỗi khi tải dữ liệu',
            error: process.env.NODE_ENV === 'development' ? error : {},
            postCategory: 'Tài liệu',
            entryTitle: { main: 'Lỗi tải dữ liệu', sub: null },
            postDescription: 'Không thể tải mô tả tài liệu',
            downloadLink: '#'
        });
    }
};
exports.postComment = async (req, res) => {
  try {
    const { slug } = req.params;
    const { content } = req.body;
    const userId = req.session.user.id;

    if (!content || content.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Nội dung quá ngắn!' });
    }

    // Tìm document theo slug
    const doc = await get('SELECT id FROM documents WHERE slug = ?', [slug]);
    if (!doc) return res.status(404).json({ success: false, message: 'Tài liệu không tồn tại' });

    // Thêm comment
    await run(`
      INSERT INTO comments (document_id, user_id, content, created_at, is_approved)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
    `, [doc.id, userId, content.trim()]);

    res.redirect(`/phanloai/${slug}`); // hoặc reload trang
  } catch (error) {
    console.error('Lỗi thêm comment:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};