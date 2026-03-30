const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== TELEGRAM BOT CONFIGURATION ==========
const TELEGRAM_BOT_TOKEN = '8557487079:AAGpkyi_0IvFEZJ1m43tWxlaRj4YxsYxyNs';
const TELEGRAM_CHAT_IDS = [
    '451085872',  // Anvar (@anvarizzatovic)
    '699401224',  // Shohbek (@Shohbek1206)
    '1201542286', // @e404bb
];

// Send Telegram notification
function sendTelegramNotification(message) {
    TELEGRAM_CHAT_IDS.forEach(chatId => {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const data = JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(url, options, (res) => {
            if (res.statusCode === 200) {
                console.log(`Telegram notification sent to ${chatId}`);
            }
        });
        req.on('error', (e) => console.error('Telegram error:', e.message));
        req.write(data);
        req.end();
    });
}

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Database setup
const dbPath = path.join(__dirname, 'data', 'samanid.db');
const db = new Database(dbPath);

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        name TEXT,
        email TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT,
        email TEXT,
        phone TEXT,
        country TEXT,
        tourType TEXT,
        travelDate TEXT,
        travelers TEXT,
        message TEXT,
        status TEXT DEFAULT 'new',
        price REAL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        name_uz TEXT,
        name_ru TEXT,
        duration TEXT,
        category TEXT,
        description TEXT,
        description_uz TEXT,
        description_ru TEXT,
        image TEXT,
        badge TEXT,
        badgeType TEXT,
        highlights TEXT,
        highlights_uz TEXT,
        highlights_ru TEXT,
        price TEXT,
        currency TEXT DEFAULT 'EUR',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS destinations (
        id TEXT PRIMARY KEY,
        name TEXT,
        name_uz TEXT,
        name_ru TEXT,
        subtitle TEXT,
        subtitle_uz TEXT,
        subtitle_ru TEXT,
        description TEXT,
        description_uz TEXT,
        description_ru TEXT,
        image TEXT,
        tours INTEGER DEFAULT 0,
        tag TEXT,
        tagText TEXT,
        featured INTEGER DEFAULT 0,
        attractions TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT,
        rating INTEGER DEFAULT 5,
        text TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

// Migration: Add price column to existing bookings table if not exists
try {
    db.exec('ALTER TABLE bookings ADD COLUMN price REAL DEFAULT 0');
} catch (e) {}

// Migration: Add multilingual columns for destinations (de, es, zh)
const destLangColumns = [
    'name_de', 'name_es', 'name_zh',
    'subtitle_de', 'subtitle_es', 'subtitle_zh',
    'description_de', 'description_es', 'description_zh',
    'attractions_de', 'attractions_es', 'attractions_zh', 'attractions_ru', 'attractions_uz'
];
destLangColumns.forEach(col => {
    try {
        db.exec(`ALTER TABLE destinations ADD COLUMN ${col} TEXT`);
    } catch (e) {}
});

// Migration: Add image2, image3 columns to tours table
try {
    db.exec('ALTER TABLE tours ADD COLUMN image2 TEXT');
} catch (e) {}
try {
    db.exec('ALTER TABLE tours ADD COLUMN image3 TEXT');
} catch (e) {
    // Columns already exist, ignore error
}

// Seed default destinations if table is empty
const destCount = db.prepare('SELECT COUNT(*) as count FROM destinations').get();
if (destCount.count === 0) {
    const defaultDestinations = [
        { id: 'samarkand', name: 'Samarkand', subtitle: 'The Pearl of the East', description: 'The jewel of the Silk Road featuring the iconic Registan Square, Gur-e-Amir mausoleum, and Bibi-Khanym mosque.', image: 'images/destinations/samarkand-registan.jpg', tours: 4, tag: 'must_see', tagText: 'Must See', featured: 1, attractions: ['Registan Square', 'Gur-e-Amir Mausoleum', 'Shah-i-Zinda', 'Bibi-Khanym Mosque', 'Ulugh Beg Observatory'] },
        { id: 'bukhara', name: 'Bukhara', subtitle: 'The Noble City', description: 'A living museum with 140+ architectural monuments, ancient trading domes, and the majestic Kalyan Minaret.', image: 'images/destinations/bukhara-kalon.jpg', tours: 3, tag: 'unesco', tagText: 'UNESCO Site', featured: 0, attractions: ['Kalyan Minaret', 'Ark Fortress', 'Lyab-i Hauz', 'Chor Minor', 'Trading Domes'] },
        { id: 'khiva', name: 'Khiva', subtitle: 'The Open-Air Museum', description: 'Step back in time in this perfectly preserved ancient city, a UNESCO World Heritage Site frozen in the 18th century.', image: 'images/destinations/khiva-ichankala.jpg', tours: 2, tag: 'heritage', tagText: 'Heritage', featured: 0, attractions: ['Ichan Kala', 'Kalta Minor', 'Juma Mosque', 'Tosh-Hovli Palace', 'Islam Khodja'] },
        { id: 'tashkent', name: 'Tashkent', subtitle: 'The Modern Capital', description: 'A vibrant blend of Soviet architecture and Islamic heritage, featuring beautiful metro stations and bustling bazaars.', image: 'images/destinations/tashkent-minor.jpg', tours: 2, tag: 'capital', tagText: 'Capital', featured: 0, attractions: ['Chorsu Bazaar', 'Khast Imam Complex', 'Metro Stations', 'Minor Mosque', 'Amir Timur Square'] },
        { id: 'fergana', name: 'Fergana Valley', subtitle: 'The Craft Paradise', description: 'Discover ancient silk and ceramic traditions in the lush valley known for its master craftsmen and scenic beauty.', image: 'images/destinations/fergana-crafts.jpg', tours: 2, tag: 'crafts', tagText: 'Crafts', featured: 0, attractions: ['Rishtan Ceramics', 'Margilan Silk', 'Kokand Palace', 'Fergana City', 'Traditional Workshops'] },
        { id: 'nukus', name: 'Nukus & Aral Sea', subtitle: 'The Adventure Frontier', description: 'Experience the surreal landscapes of the Aral Sea and world-class Soviet avant-garde art at Savitsky Museum.', image: 'images/destinations/nukus-aral.jpg', tours: 1, tag: 'adventure', tagText: 'Adventure', featured: 0, attractions: ['Savitsky Museum', 'Aral Sea Ship Graveyard', 'Mizdakhan Necropolis', 'Ayaz-Kala Fortress'] }
    ];

    const insertStmt = db.prepare(`
        INSERT INTO destinations (id, name, subtitle, description, image, tours, tag, tagText, featured, attractions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    defaultDestinations.forEach(d => {
        insertStmt.run(d.id, d.name, d.subtitle, d.description, d.image, d.tours, d.tag, d.tagText, d.featured, JSON.stringify(d.attractions));
    });
    console.log('Default destinations seeded');
}

// ========== BOOKINGS API ==========

// Get all bookings
app.get('/api/bookings', (req, res) => {
    try {
        const bookings = db.prepare('SELECT * FROM bookings ORDER BY createdAt DESC').all();
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create booking
app.post('/api/bookings', (req, res) => {
    try {
        const { fullName, email, phone, country, tourType, travelDate, travelers, message } = req.body;
        const stmt = db.prepare(`
            INSERT INTO bookings (fullName, email, phone, country, tourType, travelDate, travelers, message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(fullName, email, phone, country, tourType, travelDate, travelers, message);

        // Send Telegram notification
        const tgMessage = `🎉 <b>Yangi Buyurtma!</b>

👤 <b>Ism:</b> ${fullName}
📧 <b>Email:</b> ${email}
📱 <b>Telefon:</b> ${phone || 'N/A'}
🌍 <b>Davlat:</b> ${country || 'N/A'}
🗺 <b>Tur:</b> ${tourType}
📅 <b>Sana:</b> ${travelDate}
👥 <b>Sayohatchilar:</b> ${travelers}
💬 <b>Xabar:</b> ${message || 'Yo\'q'}

🔗 Admin: https://samanidtraveluz.com/admin/`;
        sendTelegramNotification(tgMessage);

        res.json({ id: result.lastInsertRowid, message: 'Booking created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update booking
app.put('/api/bookings/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status, price } = req.body;

        // Build dynamic update query
        const updates = [];
        const values = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (price !== undefined) {
            updates.push('price = ?');
            values.push(price);
        }

        if (updates.length > 0) {
            values.push(id);
            db.prepare(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        res.json({ message: 'Booking updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete booking
app.delete('/api/bookings/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== TOURS API ==========

// Get all tours
app.get('/api/tours', (req, res) => {
    try {
        const tours = db.prepare('SELECT * FROM tours ORDER BY id').all();
        // Parse JSON fields
        const parsed = tours.map(t => ({
            ...t,
            highlights: t.highlights ? JSON.parse(t.highlights) : [],
            highlights_uz: t.highlights_uz ? JSON.parse(t.highlights_uz) : [],
            highlights_ru: t.highlights_ru ? JSON.parse(t.highlights_ru) : []
        }));
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create tour
app.post('/api/tours', (req, res) => {
    try {
        const { name, name_uz, name_ru, duration, category, description, description_uz, description_ru,
                image, image2, image3, badge, badgeType, highlights, highlights_uz, highlights_ru, price, currency } = req.body;
        const stmt = db.prepare(`
            INSERT INTO tours (name, name_uz, name_ru, duration, category, description, description_uz, description_ru,
                              image, image2, image3, badge, badgeType, highlights, highlights_uz, highlights_ru, price, currency)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const result = stmt.run(
            name, name_uz || '', name_ru || '', duration, category, description, description_uz || '', description_ru || '',
            image, image2 || '', image3 || '', badge || '', badgeType || '', JSON.stringify(highlights || []),
            JSON.stringify(highlights_uz || []), JSON.stringify(highlights_ru || []), price || '', currency || 'EUR'
        );
        res.json({ id: result.lastInsertRowid, message: 'Tour created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update tour
app.put('/api/tours/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, name_uz, name_ru, duration, category, description, description_uz, description_ru,
                image, image2, image3, badge, badgeType, highlights, highlights_uz, highlights_ru, price, currency } = req.body;
        db.prepare(`
            UPDATE tours SET name=?, name_uz=?, name_ru=?, duration=?, category=?, description=?, description_uz=?, description_ru=?,
                            image=?, image2=?, image3=?, badge=?, badgeType=?, highlights=?, highlights_uz=?, highlights_ru=?, price=?, currency=?
            WHERE id=?
        `).run(
            name, name_uz || '', name_ru || '', duration, category, description, description_uz || '', description_ru || '',
            image, image2 || '', image3 || '', badge || '', badgeType || '', JSON.stringify(highlights || []),
            JSON.stringify(highlights_uz || []), JSON.stringify(highlights_ru || []), price || '', currency || 'EUR', id
        );
        res.json({ message: 'Tour updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete tour
app.delete('/api/tours/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM tours WHERE id = ?').run(id);
        res.json({ message: 'Tour deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== DESTINATIONS API ==========

// Get all destinations
app.get('/api/destinations', (req, res) => {
    try {
        const destinations = db.prepare('SELECT * FROM destinations ORDER BY id').all();
        const parsed = destinations.map(d => {
            const result = { ...d, featured: d.featured === 1 };
            // Parse all attractions fields (JSON arrays)
            ['attractions', 'attractions_de', 'attractions_es', 'attractions_ru', 'attractions_zh', 'attractions_uz'].forEach(field => {
                if (d[field]) {
                    try { result[field] = JSON.parse(d[field]); } catch (e) { result[field] = []; }
                } else {
                    result[field] = [];
                }
            });
            return result;
        });
        res.json(parsed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create destination
app.post('/api/destinations', (req, res) => {
    try {
        const data = req.body;
        const stmt = db.prepare(`
            INSERT INTO destinations (id, name, name_de, name_es, name_ru, name_zh, name_uz,
                subtitle, subtitle_de, subtitle_es, subtitle_ru, subtitle_zh, subtitle_uz,
                description, description_de, description_es, description_ru, description_zh, description_uz,
                image, tours, tag, tagText, featured,
                attractions, attractions_de, attractions_es, attractions_ru, attractions_zh, attractions_uz)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
            data.id, data.name || '', data.name_de || '', data.name_es || '', data.name_ru || '', data.name_zh || '', data.name_uz || '',
            data.subtitle || '', data.subtitle_de || '', data.subtitle_es || '', data.subtitle_ru || '', data.subtitle_zh || '', data.subtitle_uz || '',
            data.description || '', data.description_de || '', data.description_es || '', data.description_ru || '', data.description_zh || '', data.description_uz || '',
            data.image || '', data.tours || 0, data.tag || '', data.tagText || '', data.featured ? 1 : 0,
            JSON.stringify(data.attractions || []), JSON.stringify(data.attractions_de || []), JSON.stringify(data.attractions_es || []),
            JSON.stringify(data.attractions_ru || []), JSON.stringify(data.attractions_zh || []), JSON.stringify(data.attractions_uz || [])
        );
        res.json({ id: data.id, message: 'Destination created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update destination
app.put('/api/destinations/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        db.prepare(`
            UPDATE destinations SET
                name=?, name_de=?, name_es=?, name_ru=?, name_zh=?, name_uz=?,
                subtitle=?, subtitle_de=?, subtitle_es=?, subtitle_ru=?, subtitle_zh=?, subtitle_uz=?,
                description=?, description_de=?, description_es=?, description_ru=?, description_zh=?, description_uz=?,
                image=?, tours=?, tag=?, tagText=?, featured=?,
                attractions=?, attractions_de=?, attractions_es=?, attractions_ru=?, attractions_zh=?, attractions_uz=?
            WHERE id=?
        `).run(
            data.name || '', data.name_de || '', data.name_es || '', data.name_ru || '', data.name_zh || '', data.name_uz || '',
            data.subtitle || '', data.subtitle_de || '', data.subtitle_es || '', data.subtitle_ru || '', data.subtitle_zh || '', data.subtitle_uz || '',
            data.description || '', data.description_de || '', data.description_es || '', data.description_ru || '', data.description_zh || '', data.description_uz || '',
            data.image || '', data.tours || 0, data.tag || '', data.tagText || '', data.featured ? 1 : 0,
            JSON.stringify(data.attractions || []), JSON.stringify(data.attractions_de || []), JSON.stringify(data.attractions_es || []),
            JSON.stringify(data.attractions_ru || []), JSON.stringify(data.attractions_zh || []), JSON.stringify(data.attractions_uz || []),
            id
        );
        res.json({ message: 'Destination updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete destination
app.delete('/api/destinations/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM destinations WHERE id = ?').run(id);
        res.json({ message: 'Destination deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== REVIEWS API ==========

// Get all reviews (admin)
app.get('/api/reviews', (req, res) => {
    try {
        const reviews = db.prepare('SELECT * FROM reviews ORDER BY createdAt DESC').all();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get approved reviews (public)
app.get('/api/reviews/approved', (req, res) => {
    try {
        const reviews = db.prepare("SELECT * FROM reviews WHERE status = 'approved' ORDER BY createdAt DESC").all();
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create review (public)
app.post('/api/reviews', (req, res) => {
    try {
        const { name, country, rating, text } = req.body;
        if (!name || !text) {
            return res.status(400).json({ error: 'Name and review text are required' });
        }
        const stmt = db.prepare('INSERT INTO reviews (name, country, rating, text) VALUES (?, ?, ?, ?)');
        const result = stmt.run(name, country || '', Math.min(5, Math.max(1, rating || 5)), text);

        // Send Telegram notification
        const stars = '⭐'.repeat(rating || 5);
        const tgMessage = `💬 <b>Yangi Sharh!</b>

${stars}
👤 <b>Ism:</b> ${name}
🌍 <b>Davlat:</b> ${country || 'N/A'}
📝 <b>Sharh:</b> ${text}

🔗 Admin: https://samanidtraveluz.com/admin/`;
        sendTelegramNotification(tgMessage);

        res.json({ id: result.lastInsertRowid, message: 'Review submitted successfully. It will appear after approval.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update review (admin)
app.put('/api/reviews/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, country, rating, text, status } = req.body;
        db.prepare('UPDATE reviews SET name=?, country=?, rating=?, text=?, status=? WHERE id=?')
            .run(name, country || '', rating || 5, text, status || 'pending', id);
        res.json({ message: 'Review updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete review (admin)
app.delete('/api/reviews/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== FILE UPLOAD API ==========
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileUrl = `/api/uploads/${req.file.filename}`;
        res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve uploads via API path
app.use('/api/uploads', express.static(uploadDir));

// ========== STATS API ==========
app.get('/api/stats', (req, res) => {
    try {
        const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
        const newBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'new'").get().count;
        const totalTours = db.prepare('SELECT COUNT(*) as count FROM tours').get().count;
        const totalDestinations = db.prepare('SELECT COUNT(*) as count FROM destinations').get().count;
        const totalReviews = db.prepare('SELECT COUNT(*) as count FROM reviews').get().count;
        const pendingReviews = db.prepare("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'").get().count;

        res.json({
            totalBookings,
            newBookings,
            totalTours,
            totalDestinations,
            totalReviews,
            pendingReviews
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// ========== AUTH API ==========

// Initialize default admin if not exists
const initAdmin = db.prepare('SELECT * FROM admins WHERE username = ?').get('admin');
if (!initAdmin) {
    db.prepare('INSERT INTO admins (username, password, name, email) VALUES (?, ?, ?, ?)').run(
        'admin', 'admin123', 'Administrator', 'admin@samanidtraveluz.com'
    );
}

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, password);
        if (admin) {
            res.json({ success: true, admin: { id: admin.id, username: admin.username, name: admin.name, email: admin.email } });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change password
app.post('/api/auth/change-password', (req, res) => {
    try {
        const { username, currentPassword, newPassword } = req.body;
        const admin = db.prepare('SELECT * FROM admins WHERE username = ? AND password = ?').get(username, currentPassword);
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }
        db.prepare('UPDATE admins SET password = ? WHERE username = ?').run(newPassword, username);
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all admins
app.get('/api/admins', (req, res) => {
    try {
        const admins = db.prepare('SELECT id, username, name, email, createdAt FROM admins').all();
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create admin
app.post('/api/admins', (req, res) => {
    try {
        const { username, password, name, email } = req.body;
        const stmt = db.prepare('INSERT INTO admins (username, password, name, email) VALUES (?, ?, ?, ?)');
        const result = stmt.run(username, password, name, email);
        res.json({ id: result.lastInsertRowid, message: 'Admin created successfully' });
    } catch (error) {
        if (error.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'Username already exists' });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Delete admin
app.delete('/api/admins/:id', (req, res) => {
    try {
        const { id } = req.params;
        const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
        if (adminCount <= 1) {
            return res.status(400).json({ error: 'Cannot delete the last admin' });
        }
        db.prepare('DELETE FROM admins WHERE id = ?').run(id);
        res.json({ message: 'Admin deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
