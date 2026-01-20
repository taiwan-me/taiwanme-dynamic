const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// 取得專案根目錄
const rootDir = process.cwd();

// 引入 Sitemap 生成器
// 優先嘗試根目錄，失敗則嘗試 api/ 目錄
let generateSitemap;
try {
    generateSitemap = require('./generate-sitemap');
} catch (e) {
    try {
        generateSitemap = require('./api/generate-sitemap');
    } catch (err) {
        console.warn('⚠️ Warning: generate-sitemap.js not found.');
    }
}

// ==========================================
// 0. 自動更新 Sitemap 邏輯 (含防抖動優化)
// ==========================================
if (generateSitemap) {
    // 1. 伺服器啟動時先跑一次，確保檔案存在且最新
    console.log('🔄 Server Start: Generating sitemap...');
    generateSitemap();

    // 2. 偵測資料夾更動 (僅在本地開發環境執行)
    if (process.env.NODE_ENV !== 'production') {
        const dataDir = path.join(rootDir, 'data');
        if (fs.existsSync(dataDir)) {
            
            // 💡 定義計時器變數 (用於防抖動)
            let sitemapTimeout;

            // 監控 data 資料夾及其子資料夾
            fs.watch(dataDir, { recursive: true }, (eventType, filename) => {
                // 確保是 JSON 檔案變動，且排除 sitemap.xml 避免無限迴圈
                if (filename && filename.endsWith('.json') && !filename.includes('sitemap.xml')) {
                    
                    // 💡 如果有正在倒數的計時器，先清除它
                    if (sitemapTimeout) clearTimeout(sitemapTimeout);

                    // 💡 設定新的計時器，延遲 500ms 後才執行
                    sitemapTimeout = setTimeout(() => {
                        console.log(`📝 偵測到資料變更 (${filename}) -> 自動更新 sitemap.xml...`);
                        generateSitemap(); 
                    }, 500);
                }
            });
        }
    }
}

// ==========================================
// 1. 整合 Search API
// ==========================================
try {
    const searchHandler = require('./search'); // 或是 './api/search'
    
    app.get('/api/search', async (req, res) => {
        const handler = searchHandler.default || searchHandler;
        if (typeof handler === 'function') {
            await handler(req, res);
        } else {
            res.status(500).json({ error: "Search handler is not a function" });
        }
    });
    console.log('✅ Search API route initialized.');
} catch (err) {
    console.warn('⚠️ Warning: Could not load search.js locally.', err.message);
}

// ==========================================
// 2. 整合 Sitemap 路由 (優先讀取實體檔案)
// ==========================================
app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
    
    if (fs.existsSync(sitemapPath)) {
        res.setHeader('Content-Type', 'application/xml');
        res.sendFile(sitemapPath);
    } else {
        // 備案：如果實體檔案意外消失，嘗試現場生成
        if (generateSitemap) {
            generateSitemap();
            if (fs.existsSync(sitemapPath)) {
                res.setHeader('Content-Type', 'application/xml');
                res.sendFile(sitemapPath);
                return;
            }
        }
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

// 縣市列表頁 (Feed)
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
        console.error(`❌ Feed Not Found: ${jsonPath}`);
        res.status(404).send('City Not Found');
    }
});

// 縣市文章內頁 (Article)
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
                console.error(`❌ Article ID ${articleId} not found in ${citySlug}.json`);
                res.status(404).send('Article not found');
            }
        } catch (err) {
            console.error('❌ Article Loading Error:', err);
            res.status(500).send('Error loading article');
        }
    } else {
        console.error(`❌ File Not Found: ${jsonPath}`);
        res.status(404).send(`City data not found for "${citySlug}"`);
    }
});

// ==========================================
// 7. Transport Guide (交通攻略)
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
            console.error(err);
            res.status(500).send('Error parsing transport data');
        }
    } else {
        console.error(`❌ Transport Topic Not Found: ${jsonPath}`);
        res.status(404).send(`Topic "${topic}" not found`);
    }
});

// ==========================================
// 8. Hidden Gems (隱藏景點)
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
            console.error(err);
            res.status(500).send('Error parsing gem data');
        }
    } else {
        console.error(`❌ Gem Not Found: ${jsonPath}`);
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

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ TaiwanMe Server Running in: ${rootDir}`);
        console.log(`🔍 Search API loaded at: http://localhost:${PORT}/api/search`);
        console.log(`🌍 Main URL: http://localhost:${PORT}`);
        console.log(`🗺️  Sitemap URL: http://localhost:${PORT}/sitemap.xml`);
    });
}

module.exports = app;