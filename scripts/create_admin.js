const { get, run } = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    console.log('Hash:', hash);
    
    // Kiểm tra user đã tồn tại
    const existing = await get('SELECT * FROM users WHERE username = "admin"');
    if (existing) {
        console.log('Admin already exists, updating password...');
        await run('UPDATE users SET password_hash = ? WHERE username = "admin"', [hash]);
    } else {
        console.log('Creating new admin...');
        await run(`
            INSERT INTO users (username, email, password_hash, full_name, role, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?)
        `, ['admin', 'admin@docustudy.com', hash, 'Quản trị viên', 'admin', '/images/default-avatar.png']);
    }
    console.log('✅ Admin created/updated successfully!');
}

createAdmin().catch(console.error);