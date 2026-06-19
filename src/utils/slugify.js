function slugify(text) {
    return text.toString().toLowerCase().trim()
        .normalize('NFD')                     // Chuyển về dạng chuẩn
        .replace(/[\u0300-\u036f]/g, '')      // Xóa các dấu tiếng Việt
        .replace(/[đĐ]/g, 'd')                // Xóa chữ đ
        .replace(/\s+/g, '-')                 // Thay khoảng trắng bằng -
        .replace(/[^\w-]+/g, '')              // Xóa ký tự đặc biệt
        .replace(/--+/g, '-')                 // Thay -- bằng -
        .replace(/^-+/, '')                   // Xóa - ở đầu
        .replace(/-+$/, '');                  // Xóa - ở cuối
}

module.exports = slugify;
