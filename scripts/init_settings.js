const { run } = require('./src/config/database');

async function initSettings() {
    try {
        await run(`
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                site_name VARCHAR(255) DEFAULT 'DocuStudy',
                logo_url VARCHAR(255) DEFAULT '/images/logo.png',
                favicon_url VARCHAR(255) DEFAULT '/favicon.ico',
                phone VARCHAR(20) DEFAULT '',
                email VARCHAR(100) DEFAULT '',
                address TEXT DEFAULT '',
                description TEXT DEFAULT '',
                slogan TEXT DEFAULT '',
                facebook_url VARCHAR(255) DEFAULT '',
                youtube_url VARCHAR(255) DEFAULT '',
                tiktok_url VARCHAR(255) DEFAULT '',
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await run(`
            INSERT INTO settings (id, site_name) 
            SELECT 1, 'DocuStudy' 
            WHERE NOT EXISTS (SELECT 1 FROM settings WHERE id = 1)
        `);
        
        console.log('Settings table created and initialized.');
    } catch (err) {
        console.error('Error initializing settings:', err);
    }
}

initSettings();
