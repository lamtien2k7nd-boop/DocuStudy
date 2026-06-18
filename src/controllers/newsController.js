// controllers/newsController.js
const { query, get } = require('../config/database');

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function truncateText(text, maxLength = 150) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// ==================== DANH SÁCH TIN TỨC ====================
exports.getNewsList = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;

        // Bỏ điều kiện is_published nếu chưa có cột
        const totalResult = await get('SELECT COUNT(*) as total FROM news');
        const totalNews = totalResult?.total || 0;
        const totalPages = Math.ceil(totalNews / limit) || 1;

        const newsList = await query(`
            SELECT id, title, slug, description, image_url, date, is_featured
            FROM news
            ORDER BY date DESC
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        const formattedNews = newsList.map(item => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            description: truncateText(item.description || '', 150),
            image: item.image_url || '/img/default-news.jpg',
            date: formatDate(item.date),
            isFeatured: item.is_featured === 1,
            link: `/tin-tuc/${item.slug || item.id}`
        }));

        res.render('news/list', {
            title: 'Tin tức - DocuStudy',
            newsList: formattedNews,
            currentPage: page,
            totalPages: totalPages,
            isLoggedIn: !!req.session.user,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Lỗi danh sách tin tức:', error);
        res.render('news/list', {
            title: 'Tin tức - DocuStudy',
            newsList: [],
            currentPage: 1,
            totalPages: 1,
            isLoggedIn: !!req.session.user,
            user: req.session.user || null,
            error: 'Không thể tải dữ liệu'
        });
    }
};

// ==================== CHI TIẾT TIN TỨC ====================
exports.getNewsDetail = async (req, res) => {
    try {
        const { slug } = req.params;

        // Bỏ điều kiện is_published
        const news = await get(`
            SELECT id, title, slug, description, content, image_url, date, is_featured
            FROM news
            WHERE slug = ? OR id = ?
        `, [slug, slug]);

        if (!news) {
            return res.status(404).render('404', { message: 'Không tìm thấy tin tức' });
        }

        const relatedNews = await query(`
            SELECT id, title, slug, image_url, date
            FROM news
            WHERE id != ?
            ORDER BY date DESC
            LIMIT 5
        `, [news.id]);

        const formattedNews = {
            ...news,
            date: formatDate(news.date),
            content: news.content || news.description || ''
        };

        const formattedRelated = relatedNews.map(item => ({
            id: item.id,
            title: item.title,
            slug: item.slug,
            image: item.image_url || '/img/default-news.jpg',
            date: formatDate(item.date),
            link: `/tin-tuc/${item.slug || item.id}`
        }));

        res.render('news/detail', {
            title: news.title + ' - Tin tức DocuStudy',
            news: formattedNews,
            relatedNews: formattedRelated,
            isLoggedIn: !!req.session.user,
            user: req.session.user || null
        });
    } catch (error) {
        console.error('Lỗi chi tiết tin tức:', error);
        res.status(500).render('error', {
            title: 'Lỗi tải dữ liệu',
            message: 'Không thể tải tin tức',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};