// controllers/adminController.js
const { query, get, run } = require('../config/database');
const bcrypt = require('bcryptjs');

// --- AUTHENTICATION ---
exports.getLogin = (req, res) => {
    if (req.session.isAdmin) return res.redirect('/admin/dashboard');
    res.render('admin/login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await get('SELECT * FROM users WHERE username = ? AND role = "admin"', [username]);
        
        if (!user) {
            return res.render('admin/login', { error: 'Sai tài khoản hoặc mật khẩu quản trị!' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.render('admin/login', { error: 'Sai tài khoản hoặc mật khẩu quản trị!' });
        }

        req.session.isAdmin = true;
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            full_name: user.full_name || user.username,
            avatar_url: user.avatar_url || '/images/default-avatar.png'
        };

        return res.redirect('/admin/dashboard');
    } catch (err) {
        console.error('Admin login error:', err);
        res.render('admin/login', { error: 'Lỗi hệ thống' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
};

// --- DASHBOARD ---
exports.getDashboard = async (req, res) => {
    try {
        const totalVisitsResult = await get('SELECT SUM(view_count) as total FROM documents');
        const totalUsersResult = await get('SELECT COUNT(*) as total FROM users');
        const totalDocsResult = await get('SELECT COUNT(*) as total FROM documents');
        const totalDownloadsResult = await get('SELECT SUM(download_count) as total FROM documents');

        const topUsers = await query(`
            SELECT u.username, COUNT(c.id) as activity_count 
            FROM users u
            JOIN comments c ON u.id = c.user_id
            GROUP BY u.id
            ORDER BY activity_count DESC
            LIMIT 5
        `);

        const topDocs = await query(`
            SELECT title, view_count 
            FROM documents 
            ORDER BY view_count DESC 
            LIMIT 5
        `);

        res.render('admin/dashboard', {
            stats: {
                visits: totalVisitsResult?.total || 0,
                users: totalUsersResult?.total || 0,
                docs: totalDocsResult?.total || 0,
                downloads: totalDownloadsResult?.total || 0
            },
            topUsers: topUsers || [],
            topDocs: topDocs || [],
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Admin Dashboard Error:', error);
        res.status(500).render('error', {
            title: 'Lỗi Dashboard',
            message: 'Không thể tải dữ liệu dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// --- DOCUMENT MANAGEMENT ---
exports.getDocuments = async (req, res) => {
    try {
        const subCate = req.query.sub_cate;
        const tagFilter = req.query.tag;

        let sql = `
            SELECT DISTINCT d.*, s.name as sub_cate_name 
            FROM documents d
            JOIN subcategories s ON d.subcategory_id = s.id
            LEFT JOIN topics t ON d.id = t.document_id
            LEFT JOIN topic_items ti ON t.id = ti.topic_id
        `;
        let params = [];
        let conditions = [];

        if (subCate) {
            conditions.push(`s.target_id = ?`);
            params.push(subCate);
        }

        if (tagFilter) {
            conditions.push(`ti.content LIKE ?`);
            params.push(`%${tagFilter}%`);
        }

        if (conditions.length > 0) {
            sql += ` WHERE ` + conditions.join(' AND ');
        }

        const docs = await query(sql, params);

        // Lấy tags hiện tại cho mỗi document
        for (let doc of docs) {
            const docTags = await query(`
                SELECT t.title as topic_title, ti.content as tag_content, ti.id as tag_id
                FROM topics t
                JOIN topic_items ti ON t.id = ti.topic_id
                WHERE t.document_id = ?
                ORDER BY t.display_order ASC, ti.display_order ASC
            `, [doc.id]);
            doc.tags = docTags || [];
        }

        const groupedDocs = {};
        docs.forEach(doc => {
            if (!groupedDocs[doc.sub_cate_name]) {
                groupedDocs[doc.sub_cate_name] = [];
            }
            groupedDocs[doc.sub_cate_name].push(doc);
        });

        const subcategories = await query('SELECT * FROM subcategories');

        res.render('admin/documents', {
            groupedDocs,
            subcategories,
            subCate,
            tagFilter,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Admin Documents Error:', error);
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        await run('DELETE FROM documents WHERE id = ?', [id]);
        res.redirect('/admin/documents');
    } catch (error) {
        console.error('Delete Document Error:', error);
        res.status(500).send('Lỗi khi xóa tài liệu');
    }
};

exports.addTopicItem = async (req, res) => {
    try {
        const { document_id, topic_title, content } = req.body;
        
        let topic = await get('SELECT id FROM topics WHERE document_id = ? AND title = ?', [document_id, topic_title]);
        let topicId;
        if (!topic) {
            const result = await run('INSERT INTO topics (document_id, title) VALUES (?, ?)', [document_id, topic_title]);
            topicId = result.lastID;
        } else {
            topicId = topic.id;
        }

        await run('INSERT INTO topic_items (topic_id, content) VALUES (?, ?)', [topicId, content]);
        res.redirect('/admin/documents');
    } catch (error) {
        console.error('Add Topic Item Error:', error);
        res.status(500).send('Lỗi khi thêm tag/topic');
    }
};

// --- TAG MANAGEMENT ---

// GET /admin/tags — Trang quản lý tag: hiển thị Topics (tag lớn) chứa Topic Items (tag con)
exports.getTags = async (req, res) => {
    try {
        // Lấy tất cả topics cùng items
        const topics = await query(`
            SELECT t.id, t.title, t.document_id, t.display_order,
                   d.title as document_title
            FROM topics t
            LEFT JOIN documents d ON t.document_id = d.id
            ORDER BY t.display_order ASC, t.id DESC
        `);

        for (let topic of topics) {
            const items = await query(`
                SELECT id, content, display_order
                FROM topic_items
                WHERE topic_id = ?
                ORDER BY display_order ASC, id ASC
            `, [topic.id]);
            topic.items = items || [];
        }

        // Lấy danh sách documents để hiển thị trong dropdown
        const documents = await query('SELECT id, title FROM documents ORDER BY title ASC');

        res.render('admin/tags', { 
            topics: topics || [],
            documents: documents || [],
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Admin Tags Error:', error);
        res.status(500).send('Lỗi máy chủ');
    }
};

// POST /admin/tags/topic/add — Thêm Topic mới (tag lớn)
exports.addTopic = async (req, res) => {
    try {
        const { title, document_id } = req.body;
        
        if (!title || !title.trim()) {
            return res.redirect('/admin/tags?msg=' + encodeURIComponent('Tên topic không được trống') + '&type=error');
        }

        const docId = document_id && document_id !== '' ? parseInt(document_id) : null;
        
        // Kiểm tra nếu đã có topic trùng tên cho document này
        if (docId) {
            const existing = await get('SELECT id FROM topics WHERE title = ? AND document_id = ?', [title.trim(), docId]);
            if (existing) {
                return res.redirect('/admin/tags?msg=' + encodeURIComponent('Topic đã tồn tại cho tài liệu này') + '&type=error');
            }
        }

        await run('INSERT INTO topics (title, document_id) VALUES (?, ?)', [title.trim(), docId]);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Đã thêm topic "' + title.trim() + '"') + '&type=success');
    } catch (error) {
        console.error('Add Topic Error:', error);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Lỗi khi thêm topic') + '&type=error');
    }
};

// POST /admin/tags/topic/:id/delete — Xóa Topic (và tất cả tag con)
exports.deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Cascade delete: topic_items sẽ tự xóa do FK ON DELETE CASCADE
        await run('DELETE FROM topics WHERE id = ?', [id]);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Đã xóa topic thành công') + '&type=success');
    } catch (error) {
        console.error('Delete Topic Error:', error);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Lỗi khi xóa topic') + '&type=error');
    }
};

// POST /admin/tags/item/add — Thêm Tag con (Topic Item)
exports.addTagItem = async (req, res) => {
    try {
        const { topic_id, content } = req.body;

        if (!content || !content.trim()) {
            return res.redirect('/admin/tags?msg=' + encodeURIComponent('Nội dung tag không được trống') + '&type=error');
        }

        if (!topic_id) {
            return res.redirect('/admin/tags?msg=' + encodeURIComponent('Thiếu topic ID') + '&type=error');
        }

        // Kiểm tra trùng lặp
        const existing = await get('SELECT id FROM topic_items WHERE topic_id = ? AND content = ?', [topic_id, content.trim()]);
        if (existing) {
            return res.redirect('/admin/tags?msg=' + encodeURIComponent('Tag "' + content.trim() + '" đã tồn tại trong topic này') + '&type=error');
        }

        await run('INSERT INTO topic_items (topic_id, content) VALUES (?, ?)', [topic_id, content.trim()]);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Đã thêm tag "' + content.trim() + '"') + '&type=success');
    } catch (error) {
        console.error('Add Tag Item Error:', error);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Lỗi khi thêm tag') + '&type=error');
    }
};

// POST /admin/tags/item/:id/delete — Xóa Tag con (Topic Item)
exports.deleteTagItem = async (req, res) => {
    try {
        const { id } = req.params;
        await run('DELETE FROM topic_items WHERE id = ?', [id]);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Đã xóa tag thành công') + '&type=success');
    } catch (error) {
        console.error('Delete Tag Item Error:', error);
        res.redirect('/admin/tags?msg=' + encodeURIComponent('Lỗi khi xóa tag') + '&type=error');
    }
};