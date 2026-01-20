const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// 取得專案根目錄
const rootDir = process.cwd();

// ==========================================
// 1. 整合 Search API
// ==========================================
try {
    // 嘗試載入 search.js，路徑可能在根目錄或 api/ 下
    let searchHandler;
    try {
        searchHandler = require('../search');
    } catch (e) {
        try {
            searchHandler = require('./search');
        } catch (e2) {
            console.warn('⚠️ Warning: search.js not found.');
        }
    }
    
    if (searchHandler) {
        app.get('/api/search', async (req, res) => {
            const handler = searchHandler.default || searchHandler;
            if (typeof handler === 'function') {
                await handler(req, res);
            } else {
                res.status(500).json({ error: "Search handler is not a function" });
            }
        });
        console.log('✅ Search API route initialized.');
    }
} catch (err) {
    console.warn('⚠️ Warning: Could not load search.js locally.', err.message);
}

// ==========================================
// 2. 整合 Sitemap 路由 (純讀取模式 - 解決轉圈圈問題)
// ==========================================
app.get('/sitemap.xml', (req, res) => {
    // Vercel 部署後，靜態檔案通常會在這裡
    const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
    
    // 🔍 檢查檔案是否存在
    if (fs.existsSync(sitemapPath)) {
        res.setHeader('Content-Type', 'application/xml');
        // 設定快取，讓 Google 下次讀取更快 (1小時)
        res.setHeader('Cache-Control', 'public, max-age=3600'); 
        res.sendFile(sitemapPath);
        console.log('✅ Sitemap served successfully.');
    } else {
        // ❌ 檔案不存在，直接回傳 404，不要嘗試生成 (避免卡死)
        console.error('❌ Sitemap file missing in Vercel environment! Check Build Logs.');
        res.status(404).send('Sitemap not found');
    }
});

// ==========================================
// 3. 設定 View Engine
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, 'views'));

// ==========================================
// 4. 設定靜態檔案
// ==========================================
app.use(express.static(path.join(rootDir, 'public')));

// ==========================================
// 5. 靜態頁面路由
// ==========================================
app.get('/', (req, res) => res.render('static_pages/index', { pageName: 'index' }));
app.get('/culture', (req, res) => res.render('static_pages/culture', { pageName: 'culture' }));
app.get('/festivals', (req, res) => res.render('static_pages/festivals', { pageName: 'festivals' }));
app.get('/search_by_city', (req, res) => res.render('static_pages/search_by_city', { pageName: 'search_by_city' }));

// ==========================================
// 6. City Guide (縣市旅遊)
// ==========================================
app.get('/search_by_city/:city', (req, res) => {
    const citySlug = req.params.city.toLowerCase();
    const jsonPath = path.join(rootDir, 'data', 'search_by_city', `${citySlug}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const displayCityName = citySlug.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            res.render('city_articles/city_feed', { 
                pageName: 'search_by_city',
                cityName: displayCityName,
                cityData: cityData,
                citySlug: citySlug
            });
        } catch (err) {
            console.error('JSON Error:', err);
            res.status(500).send('Error parsing data');
        }
    } else {
        res.status(404).send('City Not Found');
    }
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
                const displayCityName = citySlug.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                res.render('city_articles/city_article_page', { 
                    pageName: 'search_by_city',
                    article: foundArticle,
                    citySlug: citySlug,
                    cityName: displayCityName
                });
            } else {
                res.status(404).send('Article not found');
            }
        } catch (err) {
            res.status(500).send('Error loading article');
        }
    } else {
        res.status(404).send(`City data not found`);
    }
});

// ==========================================
// 7. Transport Guide
// ==========================================
app.get('/transport', (req, res) => {
    res.render('transport_articles/transport_feed', { pageName: 'transport' });
});

app.get('/transport/:topic', (req, res) => {
    const topic = req.params.topic;
    const jsonPath = path.join(rootDir, 'data', 'transport', `${topic}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const topicData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            res.render('transport_articles/transport_article_page', { 
                pageName: 'transport',
                data: topicData,
                article: topicData, 
                citySlug: 'transport',
                cityName: 'Transport Guide'
            });
        } catch (err) {
            res.status(500).send('Error parsing transport data');
        }
    } else {
        res.status(404).send(`Topic "${topic}" not found`);
    }
});

// ==========================================
// 8. Hidden Gems
// ==========================================
app.get('/hidden_gems', (req, res) => {
    res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' });
});

app.get('/hidden_gems/:id', (req, res) => {
    const gemId = req.params.id;
    const jsonPath = path.join(rootDir, 'data', 'hiddengems', `${gemId}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const gemData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            res.render('hiddengems_articles/hiddengems_article_page', { 
                pageName: 'hidden_gems',
                article: gemData,
                citySlug: 'hidden_gems',
                cityName: 'Hidden Gems'
            });
        } catch (err) {
            res.status(500).send('Error parsing gem data');
        }
    } else {
        res.status(404).send('Gem Not Found');
    }
});

// ==========================================
// 9. Dining & Entertainment
// ==========================================
app.get('/dining', (req, res) => {
    const diningPath = path.join(rootDir, 'data', 'dining.json');
    let diningData = [];
    if (fs.existsSync(diningPath)) {
        try {
            diningData = JSON.parse(fs.readFileSync(diningPath, 'utf8'));
        } catch (e) { console.error(e); }
    }
    res.render('dining_lists/dining_feed', { pageName: 'dining', items: diningData });
});

app.get('/entertainment', (req, res) => {
    const entPath = path.join(rootDir, 'data', 'entertainment.json');
    let entData = [];
    if (fs.existsSync(entPath)) {
        try {
            entData = JSON.parse(fs.readFileSync(entPath, 'utf8'));
        } catch (e) { console.error(e); }
    }
    res.render('entertainment_lists/entertainment_feed', { pageName: 'entertainment', items: entData });
});

// ==========================================
// 10. 404 & Server Start
// ==========================================
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

// ==========================================
// 11. 本地開發環境 (Dev Only) - 自動生成 Sitemap
// ==========================================
// 這段邏輯只會在您的電腦上執行，不會在 Vercel 執行
if (process.env.NODE_ENV !== 'production') {
    try {
        let generateSitemap;
        try { generateSitemap = require('../generate-sitemap'); } 
        catch (e) { generateSitemap = require('./generate-sitemap'); }

        if (generateSitemap) {
            console.log('🔧 Dev Mode: Monitoring data changes for Sitemap...');
            const dataDir = path.join(rootDir, 'data');
            if (fs.existsSync(dataDir)) {
                let sitemapTimeout;
                fs.watch(dataDir, { recursive: true }, (eventType, filename) => {
                    if (filename && filename.endsWith('.json') && !filename.includes('sitemap.xml')) {
                        if (sitemapTimeout) clearTimeout(sitemapTimeout);
                        sitemapTimeout = setTimeout(() => {
                            console.log(`📝 資料變更 (${filename}) -> 本地自動更新 sitemap.xml...`);
                            generateSitemap(); 
                        }, 500);
                    }
                });
            }
        }
    } catch(e) {
        console.warn('⚠️ Dev mode sitemap watcher failed to initialize.');
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ TaiwanMe Server Running in: ${rootDir}`);
        console.log(`🌍 Main URL: http://localhost:${PORT}`);
    });
}

module.exports = app;