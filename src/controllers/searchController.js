// controllers/searchController.js
const { query } = require('../config/database');

exports.apiSearch = async (req, res) => {
    try {
        const q = req.query.q;
        if (!q || q.trim().length < 2) {
            return res.json({ success: true, documents: [], tags: [] });
        }

        const searchTerm = `%${q}%`;

        // 1. Tìm tài liệu theo tiêu đề HOẶC tag gán thủ công
        const documents = await query(`
            SELECT DISTINCT d.id, d.title, d.slug, d.image_url, s.target_id as sub_target_id
            FROM documents d
            JOIN subcategories s ON d.subcategory_id = s.id
            LEFT JOIN document_tags dt ON d.id = dt.document_id
            WHERE d.title LIKE ? 
               OR d.description LIKE ?
               OR dt.target_id LIKE ?
            LIMIT 6
        `, [searchTerm, searchTerm, searchTerm]);

        // 2. Tìm danh mục & tiểu mục (trả về link lọc)
        const tags = await query(`
            SELECT name as label, target_id, 'subcategory' as type FROM subcategories WHERE name LIKE ?
            UNION
            SELECT name as label, slug as target_id, 'category' as type FROM categories WHERE name LIKE ?
            LIMIT 5
        `, [searchTerm, searchTerm]);

        // 3. Tìm theo structure (topics/items) - Optional but good for context
        const structureMatches = await query(`
            SELECT DISTINCT d.id, d.title, d.slug, s.target_id as sub_target_id
            FROM documents d
            JOIN subcategories s ON d.subcategory_id = s.id
            JOIN topics t ON d.id = t.document_id
            LEFT JOIN topic_items ti ON t.id = ti.topic_id
            WHERE t.title LIKE ? OR ti.content LIKE ?
            LIMIT 3
        `, [searchTerm, searchTerm]);

        res.json({
            success: true,
            documents: documents.map(d => ({
                id: d.id,
                title: d.title,
                link: `/phanloai/${d.sub_target_id}/${d.slug}`,
                image: d.image_url || '/img/default-doc.jpg'
            })),
            tags: tags.map(t => ({
                label: t.label,
                link: t.type === 'category' ? `/phanloai?cat=${t.target_id}` : `/phanloai/${t.target_id}`
            })),
            structureMatches: structureMatches.map(d => ({
                title: d.title,
                link: `/phanloai/${d.sub_target_id}/${d.slug}`
            }))
        });
    } catch (error) {
        console.error('API Search Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};
