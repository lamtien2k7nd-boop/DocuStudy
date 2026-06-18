const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.sqlite');
const sqlPath = path.join(__dirname, '../src/init_sqlite_final.sql');

// Đảm bảo thư mục database tồn tại
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Xóa file cũ nếu có để khởi tạo mới hoàn toàn
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath);

console.log('Đang đọc file SQL...');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('Đang thực thi SQL (quá trình này có thể mất vài phút)...');

// SQLite node driver không hỗ trợ chạy nhiều câu lệnh cùng lúc qua .run()
// Chúng ta sẽ sử dụng .exec()
db.exec(sql, (err) => {
    if (err) {
        console.error('Lỗi khi khởi tạo database:', err.message);
        process.exit(1);
    }
    console.log('Khởi tạo database thành công!');
    console.log(`File database đã được tạo tại: ${dbPath}`);
    db.close();
});
