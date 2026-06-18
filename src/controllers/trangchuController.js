// controllers/trangchuController.js
const { query, get } = require('../config/database');

// Helper: định dạng ngày tháng (VD: 12/05/2026)
function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// Helper: chia mảng document thành các page, mỗi page tối đa itemsPerPage (mặc định 4)
function paginateDocuments(docs, itemsPerPage = 4, subcategoryTargetId) {
    const pages = [];
    for (let i = 0; i < docs.length; i += itemsPerPage) {
        pages.push({
            cards: docs.slice(i, i + itemsPerPage).map(doc => ({
                image: doc.image_url || '/img/default-doc.jpg',
                badge: doc.badge || 'Tài liệu',
                title: doc.title,
                link: `/phanloai/${subcategoryTargetId}/${doc.slug}`,
                downloadCount: (doc.download_count / 1000).toFixed(1) // hiển thị dạng 8.4k
            }))
        });
    }
    // Nếu không có document nào, vẫn tạo một page rỗng để tránh lỗi
    if (pages.length === 0) pages.push({ cards: [] });
    return pages;
}

exports.getTrangchu = async (req, res) => {
    try {
        // ------------------- 1. Lấy tin tức -------------------
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
                description: allNews[0].description || '',
                date: formatDate(allNews[0].date),
                link: allNews[0].link || `/tin-tuc/${allNews[0].id}`
            };
            newsList = allNews.slice(1).map(item => ({
                image: item.image_url || '/img/default-news.jpg',
                title: item.title,
                date: formatDate(item.date),
                link: item.link || `/tin-tuc/${item.id}`
            }));
        } else {
            // Fallback nếu chưa có tin
            featuredNews = {
                image: '/img/default-news.jpg',
                title: 'DocuStudy ra mắt bộ đề thi thử',
                description: 'Hơn 5000+ học sinh đã tham gia luyện đề...',
                date: '01/01/2026',
                link: '#'
            };
            newsList = [];
        }

        // ------------------- 2. Exam Sections (HSA, TSA, V-ACT) -------------------
        const examCategoryNames = ['HSA - ĐHQGHN', 'TSA - ĐHBKHN', 'V-ACT ĐHQGHCM'];
        const examSections = [];

        for (const catName of examCategoryNames) {
            const category = await get(`
                SELECT id, name, section_class, inner_class, header_class
                FROM categories
                WHERE name = ? AND parent_id IS NULL
            `, [catName]);

            if (!category) continue;

            // Lấy subcategories (tabs)
            const subcategories = await query(`
                SELECT id, name, target_id
                FROM subcategories
                WHERE category_id = ?
                ORDER BY display_order ASC
            `, [category.id]);

            const tabs = [];
            for (const sub of subcategories) {
                // Lấy documents của subcategory này
                const docs = await query(`
                    SELECT id, title, slug, download_count, image_url, badge
                    FROM documents
                    WHERE subcategory_id = ?
                    ORDER BY created_at DESC
                    LIMIT 8
                `, [sub.id]);

                // Tạo pages (mỗi page 4 card) với subcategory target_id
                const pages = paginateDocuments(docs, 4, sub.target_id);

                tabs.push({
                    targetId: sub.target_id,
                    label: sub.name,
                    content: {
                        pages: pages,
                        label: sub.name   // dùng cho nút "Xem tất cả <label>"
                    }
                });
            }

            examSections.push({
                wrapperClass: category.section_class || `${catName.toLowerCase().replace(/ /g, '-')}-section`,
                innerClass: category.inner_class || 'container',
                headerClass: category.header_class || 'section-header',
                title: category.name,
                tabs: tabs
            });
        }

        // ------------------- 3. Simple Grid Sections (SPT, THPTQG) -------------------
        const simpleCategoryNames = ['SPT - ĐHSP', 'THPTQG'];
        const simpleGridSections = [];
        const simpleGridCards = [];

        for (const catName of simpleCategoryNames) {
            const category = await get(`
                SELECT id, name, section_class
                FROM categories
                WHERE name = ? AND parent_id IS NULL
            `, [catName]);

            if (!category) continue;

            // Lấy tất cả documents thuộc category này (qua subcategories)
            const docs = await query(`
                SELECT d.id, d.title, d.slug, d.download_count, d.image_url, d.badge, s.target_id as sub_target_id
                FROM documents d
                JOIN subcategories s ON d.subcategory_id = s.id
                WHERE s.category_id = ?
                ORDER BY d.created_at DESC
                LIMIT 8
            `, [category.id]);

            const cards = docs.map(doc => ({
                image: doc.image_url || '/img/default-doc.jpg',
                badge: doc.badge || 'Tài liệu',
                title: doc.title,
                link: `/phanloai/${doc.sub_target_id}/${doc.slug}`,
                downloadCount: (doc.download_count / 1000).toFixed(1)
            }));

            simpleGridSections.push({
                wrapperClass: category.section_class || `${catName.toLowerCase().replace(/ /g, '-')}-section`,
                title: category.name,
                subtitle: `${docs.length} đề thi mới nhất`,
                btnText: `Xem tất cả tài liệu ${category.name}`
            });
            simpleGridCards.push(cards);
        }

        // ------------------- 4. Grade Sections (Lớp 10, 11, 12) -------------------
        const gradeNames = ['Khối 12', 'Khối 11', 'Khối 10'];
        const gradeSections = [];

        for (const gradeName of gradeNames) {
            const gradeCat = await get(`
                SELECT id, name, section_class, inner_class, header_class
                FROM categories
                WHERE name = ? AND parent_id IS NULL
            `, [gradeName]);

            if (!gradeCat) continue;

            // Lấy các môn học (subcategories)
            const subjects = await query(`
                SELECT id, name, target_id
                FROM subcategories
                WHERE category_id = ?
                ORDER BY display_order ASC
            `, [gradeCat.id]);

            const subjectList = [];
            for (const sub of subjects) {
                const docs = await query(`
                    SELECT id, title, slug, download_count, image_url, badge
                    FROM documents
                    WHERE subcategory_id = ?
                    ORDER BY created_at DESC
                    LIMIT 8
                `, [sub.id]);

                const pages = paginateDocuments(docs, 4, sub.target_id);

                subjectList.push({
                    targetId: sub.target_id,
                    name: sub.name,
                    content: {
                        pages: pages,
                        label: sub.name   // cho nút "Xem tất cả môn học"
                    }
                });
            }

            gradeSections.push({
                wrapperClass: gradeCat.section_class || `${gradeName.toLowerCase().replace(/ /g, '-')}-section`,
                innerClass: gradeCat.inner_class || 'container',
                headerClass: gradeCat.header_class || 'section-header',
                title: gradeCat.name,
                subjects: subjectList
            });
        }

        // ------------------- Render view -------------------
        res.render('trangchu', {
            examSections,
            simpleGridSections,
            simpleGridCards,
            gradeSections,
            featuredNews,
            newsList
        });

    } catch (error) {
        console.error('Lỗi trang chủ:', error);
        // Fallback an toàn, không crash server
        res.render('trangchu', {
            examSections: [],
            simpleGridSections: [],
            simpleGridCards: [],
            gradeSections: [],
            featuredNews: {
                image: '/img/default-news.jpg',
                title: 'Đang cập nhật tin tức',
                description: 'Vui lòng quay lại sau',
                date: '',
                link: '#'
            },
            newsList: []
        });
    }
};