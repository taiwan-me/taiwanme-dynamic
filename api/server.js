const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression'); // ✅ 效能優化
const { SitemapStream, streamToPromise } = require('sitemap'); // ✅ 動態 Sitemap
const app = express();

// 取得專案根目錄
const rootDir = process.cwd();
const BASE_URL = 'https://taiwanme-dynamic.vercel.app'; // ⚠️ 請確認這是您的正式網址

// ==========================================
// 1. 啟用 Gzip 壓縮 (提升 SEO 效能分數)
// ==========================================
app.use(compression());

// ==========================================
// 2. 整合 Search API
// ==========================================
try {
    let searchHandler;
    try { searchHandler = require('../search'); } 
    catch (e) { try { searchHandler = require('./search'); } catch (e2) {} }
    
    if (searchHandler) {
        app.get('/api/search', async (req, res) => {
            const handler = searchHandler.default || searchHandler;
            if (typeof handler === 'function') await handler(req, res);
            else res.status(500).json({ error: "Search handler is not a function" });
        });
        console.log('✅ Search API route initialized.');
    }
} catch (err) { console.warn('⚠️ Warning: search.js not found.'); }

// ==========================================
// 3. 動態 Sitemap 路由 (✅ 使用 sitemap 套件)
// ==========================================
// 這個路由必須在 express.static 之前，確保優先處理
app.get('/sitemap.xml', async (req, res) => {
    try {
        const smStream = new SitemapStream({ hostname: BASE_URL });
        
        // --- A. 加入靜態頁面 ---
        const staticPages = [
            '', '/culture', '/festivals', '/search_by_city', 
            '/transport', '/dining', '/entertainment', 
            '/souvenirs', '/philosophy'
        ];
        
        staticPages.forEach(page => {
            smStream.write({ url: page, changefreq: 'weekly', priority: 0.8 });
        });

        // --- B. 讀取 City Guide 資料 ---
        const cityDir = path.join(rootDir, 'data', 'search_by_city');
        if (fs.existsSync(cityDir)) {
            const files = fs.readdirSync(cityDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const citySlug = file.replace('.json', '');
                    // 加入城市主頁
                    smStream.write({ url: `/search_by_city/${citySlug}`, changefreq: 'weekly', priority: 0.8 });

                    // 讀取文章
                    try {
                        const filePath = path.join(cityDir, file);
                        const articles = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        if (Array.isArray(articles)) {
                            articles.forEach(article => {
                                smStream.write({ 
                                    url: `/search_by_city/${citySlug}/${article.id}`, 
                                    changefreq: 'monthly', 
                                    priority: 0.6 
                                });
                            });
                        }
                    } catch (e) { console.error(`Error parsing ${file}:`, e); }
                }
            });
        }

        // --- C. 讀取 Hidden Gems 資料 ---
        const gemsDir = path.join(rootDir, 'data', 'hiddengems');
        if (fs.existsSync(gemsDir)) {
            const files = fs.readdirSync(gemsDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const gemId = file.replace('.json', '');
                    smStream.write({ url: `/hidden_gems/${gemId}`, changefreq: 'monthly', priority: 0.7 });
                }
            });
        }

        // --- D. 結束串流並回傳 ---
        smStream.end();
        const sitemapXml = await streamToPromise(smStream);

        res.header('Content-Type', 'application/xml');
        res.send(sitemapXml);
        console.log('✅ Dynamic Sitemap generated successfully via sitemap package.');

    } catch (error) {
        console.error('❌ Sitemap generation failed:', error);
        res.status(500).end();
    }
});

// ==========================================
// 4. 設定 View Engine & Static Files
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));
app.use(express.static(path.join(rootDir, 'public')));

// ==========================================
// 5. 頁面路由
// ==========================================
app.get('/', (req, res) => res.render('static_pages/index', { pageName: 'index' }));
app.get('/culture', (req, res) => res.render('static_pages/culture', { pageName: 'culture' }));
app.get('/festivals', (req, res) => res.render('static_pages/festivals', { pageName: 'festivals' }));
app.get('/search_by_city', (req, res) => res.render('static_pages/search_by_city', { pageName: 'search_by_city' }));

// City Guide
app.get('/search_by_city/:city', (req, res) => {
    const citySlug = req.params.city.toLowerCase();
    const jsonPath = path.join(rootDir, 'data', 'search_by_city', `${citySlug}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const displayCityName = citySlug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            res.render('city_articles/city_feed', { pageName: 'search_by_city', cityName: displayCityName, cityData, citySlug });
        } catch (err) { res.status(500).send('Error parsing data'); }
    } else { res.status(404).send('City Not Found'); }
});

app.get('/search_by_city/:city/:id', (req, res) => {
    const citySlug = req.params.city.toLowerCase();
    const articleId = req.params.id;
    const jsonPath = path.join(rootDir, 'data', 'search_by_city', `${citySlug}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const foundArticle = cityData.find(item => item.id === articleId);
            if (foundArticle) {
                const displayCityName = citySlug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                res.render('city_articles/city_article_page', { pageName: 'search_by_city', article: foundArticle, citySlug, cityName: displayCityName });
            } else { res.status(404).send('Article not found'); }
        } catch (err) { res.status(500).send('Error loading article'); }
    } else { res.status(404).send(`City data not found`); }
});

// Transport & Hidden Gems & Dining
app.get('/transport', (req, res) => res.render('transport_articles/transport_feed', { pageName: 'transport' }));
app.get('/transport/:topic', (req, res) => {
    const topic = req.params.topic;
    const jsonPath = path.join(rootDir, 'data', 'transport', `${topic}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const topicData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            res.render('transport_articles/transport_article_page', { pageName: 'transport', data: topicData, article: topicData, citySlug: 'transport', cityName: 'Transport Guide' });
        } catch (err) { res.status(500).send('Error'); }
    } else { res.status(404).send('Topic not found'); }
});

app.get('/hidden_gems', (req, res) => res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' }));
app.get('/hidden_gems/:id', (req, res) => {
    const gemId = req.params.id;
    const jsonPath = path.join(rootDir, 'data', 'hiddengems', `${gemId}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const gemData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            res.render('hiddengems_articles/hiddengems_article_page', { pageName: 'hidden_gems', article: gemData, citySlug: 'hidden_gems', cityName: 'Hidden Gems' });
        } catch (err) { res.status(500).send('Error'); }
    } else { res.status(404).send('Gem Not Found'); }
});

app.get('/dining', (req, res) => {
    const diningPath = path.join(rootDir, 'data', 'dining.json');
    let diningData = [];
    if (fs.existsSync(diningPath)) { try { diningData = JSON.parse(fs.readFileSync(diningPath, 'utf8')); } catch (e) {} }
    res.render('dining_lists/dining_feed', { pageName: 'dining', items: diningData });
});
app.get('/entertainment', (req, res) => {
    const entPath = path.join(rootDir, 'data', 'entertainment.json');
    let entData = [];
    if (fs.existsSync(entPath)) { try { entData = JSON.parse(fs.readFileSync(entPath, 'utf8')); } catch (e) {} }
    res.render('entertainment_lists/entertainment_feed', { pageName: 'entertainment', items: entData });
});

// 404
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align:center; padding:50px; font-family: sans-serif;">
            <h1 style="font-size: 3rem; color: #333;">404</h1>
            <h2>Page Not Found</h2>
            <p>Oops! The page you are looking for does not exist.</p>
            <a href="/" style="color: #E8A2A2; text-decoration: none; font-weight: bold;">Back to Home</a>
        </div>
    `);
});

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ TaiwanMe Server Running in: ${rootDir}`);
        console.log(`🌍 Main URL: http://localhost:${PORT}`);
        console.log(`🗺️  Sitemap: http://localhost:${PORT}/sitemap.xml`);
    });
}

module.exports = app;