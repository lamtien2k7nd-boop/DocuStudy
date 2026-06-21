const {query, get} = require ('../config/database');

exports.getPhanloai = async (req, res) => {
    try {
        const categories = await query (`
            SELECT * FROM categories
            WHERE parent_id IS NULL
            ORDER BY display_order ASC`);
        for (let cat of categories) {
            const subcategories = await query (`
                SELECT * FROM subcategories 
                WHERE category_id = ? 
                ORDER BY display_order ASC`, [cat.id]);
                cat.subcategories = subcategories;
        }
        const formattedCategories = categories.map (cat => ({
            title: cat.name,
            sectionClass: cat.section_class,
            subcategories: cat.subcategories.map (sub => ({
                id: sub.target_id,
                name: sub.name,
                link: `/phanloai/${sub.target_id}`
            }))
        }));
        res.render ('phanloai',{
            title: 'DocuStudy - Phân loại',
            categories: formattedCategories,            
        });
    } catch (error) {
        console.error("Lỗi tải tài liệu",error);
        res.render("phanloai",{
            categories: [],
            error: "Lỗi tải dữ liệu"
        });        
    }
};
