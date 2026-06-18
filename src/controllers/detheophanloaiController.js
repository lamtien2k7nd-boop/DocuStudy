const { query, get } = require('../config/database');

exports.getDetheophanloai = async (req, res) => {
    try {
        const { target_id } = req.params;
        
        // 1. Lấy subcategory
        const subcategories = await query(`
            SELECT * FROM subcategories
            WHERE target_id = ?
        `, [target_id]);

        if (!subcategories || subcategories.length === 0) {
            return res.status(404).render('404', { message: 'Không tìm thấy danh mục' });
        }

        const subcategory = subcategories[0];

        // 2. Lấy category cha
        const category = await get(`
            SELECT * FROM categories
            WHERE id = ?
        `, [subcategory.category_id]);

        // 3. Lấy stats
        const statsResult = await query(`
            SELECT 
                COUNT(*) as totalDocs,
                COALESCE(SUM(view_count), 0) as totalViews,
                COALESCE(AVG(rating_avg), 0) as avgRating
            FROM documents
            WHERE subcategory_id = ? AND is_published = 1
        `, [subcategory.id]);

        const stats = statsResult[0] || { totalDocs: 0, totalViews: 0, avgRating: 0 };

        // 4. Lấy trending
        const trendingDocs = await query(`
            SELECT id, title, slug, download_count, image_url, badge
            FROM documents
            WHERE subcategory_id = ? AND is_published = 1
            ORDER BY view_count DESC
            LIMIT 10
        `, [subcategory.id]);

        // 5. Lấy favorite
        const favoriteDocs = await query(`
            SELECT id, title, slug, download_count, image_url, badge
            FROM documents
            WHERE subcategory_id = ? AND is_published = 1
            ORDER BY download_count DESC, rating_avg DESC
            LIMIT 10
        `, [subcategory.id]);

        // 6. Phân trang
        const page = parseInt(req.query.page) || 1;
        const limit = 100;
        const offset = (page - 1) * limit;

        const allDocs = await query(`
            SELECT id, title, slug, download_count, image_url, badge
            FROM documents 
            WHERE subcategory_id = ? AND is_published = 1 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [subcategory.id, limit, offset]);

        const totalDocs = stats.totalDocs || 0;
        const totalPages = Math.ceil(totalDocs / limit) || 1;

        // 7. Format card
        const formatCard = (doc) => ({
            image: doc.image_url || '/img/default-doc.jpg',
            badge: doc.badge || subcategory.name,
            title: doc.title,
            link: `/phanloai/${subcategory.target_id}/${doc.slug}`,
            downloadCount: (doc.download_count / 1000).toFixed(1)
        });

        const trendingItems = trendingDocs.map(formatCard);
        const favoriteItems = favoriteDocs.map(formatCard);
        const allItems = allDocs.map(formatCard);

        // 8. Breadcrumb
        const breadcrumb = {
            homeLink: '/',
            homeLabel: 'Trang chủ',
            categoryLink: '/phanloai',
            categoryLabel: category ? category.name : 'Tài liệu',
            subcategoryLink: `/phanloai/${target_id}`,
            subcategoryLabel: subcategory.name
        };

        // 9. Current category
        const currentCategory = {
            name: subcategory.name,
            documentCount: stats.totalDocs || 0,
            viewCount: stats.totalViews || 0,
            rating: stats.avgRating ? stats.avgRating.toFixed(1) : '0'
        };

        // 10. Render
        res.render('detheophanloai', {
            breadcrumb,
            currentCategory,
            trendingItems,
            favoriteItems,
            allItems,
            currentPage: page,
            totalPages: totalPages
        });

    } catch (error) {
        console.error("Lỗi tải tài liệu", error);
        res.render("detheophanloai", {
            breadcrumb: {
                homeLink: '/',
                homeLabel: 'Trang chủ',
                categoryLink: '/phanloai',
                categoryLabel: 'Tài liệu',
                subcategoryLink: null,
                subcategoryLabel: 'Không tìm thấy'
            },
            currentCategory: {
                name: 'Không tìm thấy',
                documentCount: 0,
                viewCount: 0,
                rating: '0'
            },
            trendingItems: [],
            favoriteItems: [],
            allItems: [],
            currentPage: 1,
            totalPages: 1,
            error: "Lỗi tải dữ liệu"
        });
    }
};