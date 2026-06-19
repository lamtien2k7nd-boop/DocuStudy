// controllers/adminController.js
const { query, get, run } = require('../config/database');

exports.getLogin = (req, res) => {
    if (req.session.admin) return res.redirect('/admin/dashboard');
    res.render('admin/login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.admin = { username: 'admin' };
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { error: 'Sai tài khoản hoặc mật khẩu' });
};

exports.logout = (req, res) => {
    delete req.session.admin;
    res.redirect('/admin/login');
};

exports.getDashboard = async (req, res) => {
    try {
        const stats = {
            docs: (await get('SELECT COUNT(*) as count FROM documents')).count,
            users: (await get('SELECT COUNT(*) as count FROM users')).count,
            downloads: (await get('SELECT SUM(download_count) as total FROM documents')).total || 0,
            visits: (await get('SELECT COUNT(*) as count FROM access_logs WHERE type = "view"')).count
        };

        const recentDocs = await query('SELECT * FROM documents ORDER BY created_at DESC LIMIT 5');
        const topDocs = await query('SELECT * FROM documents ORDER BY view_count DESC LIMIT 5');

        // Lấy top người dùng hoạt động (ví dụ qua log truy cập)
        const topUsers = await query(`
            SELECT u.username, COUNT(al.id) as activity_count
            FROM users u
            JOIN access_logs al ON u.id = al.user_id
            GROUP BY u.id
            ORDER BY activity_count DESC
            LIMIT 5
        `);

        res.render('admin/dashboard', { 
            stats, 
            recentDocs, 
            topDocs, 
            topUsers: topUsers || [],
            user: req.session.admin 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const { sub_cate, tag } = req.query;
        const subCate = sub_cate || '';
        const tagFilter = tag || '';

        let sql = `
            SELECT d.*, s.name as subcategory_name
            FROM documents d
            LEFT JOIN subcategories s ON d.subcategory_id = s.id
            WHERE 1=1
        `;
        const params = [];

        if (subCate) {
            sql += ` AND s.target_id = ?`;
            params.push(subCate);
        }
        if (tagFilter) {
            sql += ` AND d.id IN (
                SELECT t.document_id 
                FROM topics t 
                JOIN topic_items ti ON t.id = ti.topic_id 
                WHERE ti.content LIKE ?
            )`;
            params.push(`%${tagFilter}%`);
        }

        sql += ` ORDER BY s.name ASC, d.created_at DESC`;

        const documents = await query(sql, params);

        // Lấy tags cho từng document
        for (let doc of documents) {
            doc.tags = await query(`
                SELECT t.title as topic_title, ti.id as tag_id, ti.content as tag_content
                FROM topics t
                JOIN topic_items ti ON t.id = ti.topic_id
                WHERE t.document_id = ?
            `, [doc.id]);
        }

        // Group theo subcategory
        const groupedDocs = {};
        documents.forEach(doc => {
            const groupName = doc.subcategory_name || 'Khác';
            if (!groupedDocs[groupName]) {
                groupedDocs[groupName] = [];
            }
            groupedDocs[groupName].push(doc);
        });

        const subcategories = await query('SELECT * FROM subcategories ORDER BY name ASC');

        res.render('admin/documents', { 
            groupedDocs, 
            subcategories, 
            subCate, 
            tagFilter, 
            user: req.session.admin 
        });
    } catch (err) {
        console.error('getDocuments Error:', err);
        res.status(500).send('Server Error');
    }
};

exports.postUploadDocument = async (req, res) => {
    try {
        const { title, description, subcategory_id, badge } = req.body;
        const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const image_url = req.file ? '/uploads/' + req.file.filename : '/img/default-doc.jpg';
        
        await run(`
            INSERT INTO documents (title, slug, description, image_url, subcategory_id, badge, download_link, is_published)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `, [title, slug, description, image_url, subcategory_id, badge, '#']);
        
        res.redirect('/admin/documents');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        await run('DELETE FROM documents WHERE id = ?', [req.params.id]);
        res.redirect('/admin/documents');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.addTopicItem = async (req, res) => {
    try {
        const { document_id, topic_title, content } = req.body;
        
        // 1. Tìm hoặc tạo Topic
        let topic = await get('SELECT id FROM topics WHERE title = ? AND document_id = ?', [topic_title, document_id]);
        
        let topicId;
        if (!topic) {
            const result = await run('INSERT INTO topics (title, document_id) VALUES (?, ?)', [topic_title, document_id]);
            topicId = result.lastID;
        } else {
            topicId = topic.id;
        }

        // 2. Thêm Tag vào Topic đó
        await run('INSERT INTO topic_items (topic_id, content) VALUES (?, ?)', [topicId, content]);
        
        res.redirect('/admin/documents');
    } catch (err) {
        console.error('addTopicItem Error:', err);
        res.status(500).send('Server Error');
    }
};

// --- EXAM CONTENT STRUCTURE MANAGEMENT ---

exports.getStructure = async (req, res) => {
    try {
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

        const documents = await query('SELECT id, title FROM documents ORDER BY title ASC');

        res.render('admin/cau_truc_de', { 
            topics: topics || [],
            documents: documents || [],
            user: req.session.admin
        });
    } catch (error) {
        console.error('Admin Structure Error:', error);
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.addStructureTopic = async (req, res) => {
    try {
        const { title, document_id } = req.body;
        if (!title || !title.trim()) return res.redirect('/admin/structure?msg=Error');
        const docId = document_id && document_id !== '' ? parseInt(document_id) : null;
        await run('INSERT INTO topics (title, document_id) VALUES (?, ?)', [title.trim(), docId]);
        res.redirect('/admin/structure?msg=Success');
    } catch (error) { res.redirect('/admin/structure?msg=Error'); }
};

exports.deleteStructureTopic = async (req, res) => {
    try {
        await run('DELETE FROM topics WHERE id = ?', [req.params.id]);
        res.redirect('/admin/structure?msg=Deleted');
    } catch (error) { res.redirect('/admin/structure?msg=Error'); }
};

exports.addStructureItem = async (req, res) => {
    try {
        const { topic_id, content } = req.body;
        await run('INSERT INTO topic_items (topic_id, content) VALUES (?, ?)', [topic_id, content.trim()]);
        res.redirect('/admin/structure?msg=Added');
    } catch (error) { res.redirect('/admin/structure?msg=Error'); }
};

exports.deleteStructureItem = async (req, res) => {
    try {
        await run('DELETE FROM topic_items WHERE id = ?', [req.params.id]);
        res.redirect('/admin/structure?msg=Deleted');
    } catch (error) { res.redirect('/admin/structure?msg=Error'); }
};

// --- NEW TAG MANAGEMENT ---

exports.getTags = async (req, res) => {
    try {
        const documents = await query('SELECT id, title FROM documents ORDER BY title ASC');
        for (let doc of documents) {
            const tags = await query(`
                SELECT id, target_id, type FROM document_tags WHERE document_id = ?
            `, [doc.id]);
            
            for (let tag of tags) {
                if (tag.type === 'category') {
                    const cat = await get('SELECT name FROM categories WHERE slug = ?', [tag.target_id]);
                    tag.label = cat ? cat.name : tag.target_id;
                } else {
                    const sub = await get('SELECT name FROM subcategories WHERE target_id = ?', [tag.target_id]);
                    tag.label = sub ? sub.name : tag.target_id;
                }
            }
            doc.tags = tags;
        }

        const categories = await query('SELECT id, name, slug FROM categories');
        const subcategories = await query('SELECT id, name, target_id FROM subcategories');

        res.render('admin/tags', {
            documents,
            categories,
            subcategories,
            user: req.session.admin
        });
    } catch (error) {
        console.error('Admin Tags Error:', error);
        res.status(500).send('Lỗi máy chủ');
    }
};

exports.postAddTag = async (req, res) => {
    try {
        const { document_id, tag_data } = req.body;
        const [type, target_id] = tag_data.split(':');
        
        const exists = await get('SELECT id FROM document_tags WHERE document_id = ? AND target_id = ?', [document_id, target_id]);
        if (!exists) {
            await run('INSERT INTO document_tags (document_id, type, target_id) VALUES (?, ?, ?)', [document_id, type, target_id]);
        }
        res.redirect('/admin/tags?msg=Added');
    } catch (error) { res.redirect('/admin/tags?msg=Error'); }
};

exports.postDeleteTag = async (req, res) => {
    try {
        await run('DELETE FROM document_tags WHERE id = ?', [req.body.tag_id]);
        res.redirect('/admin/tags?msg=Deleted');
    } catch (error) { res.redirect('/admin/tags?msg=Error'); }
};
