const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// 取得專案根目錄 (確保與 search.js 邏輯一致)
const rootDir = process.cwd();

// ==========================================
// 1. 整合 Search API
// ==========================================
try {
    const searchHandler = require('./search');
    
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
// 2. 整合 Sitemap
// ==========================================
try {
    const sitemapHandler = require('./sitemap');

    app.get('/sitemap.xml', async (req, res) => {
        const handler = sitemapHandler.default || sitemapHandler;
        if (typeof handler === 'function') {
            await handler(req, res);
        } else {
            res.status(500).send("Sitemap handler is not a function");
        }
    });
    console.log('✅ Sitemap route initialized.');
} catch (err) {
    console.warn('⚠️ Warning: Could not load sitemap.js locally.', err.message);
}

// ==========================================
// 3. 設定 View Engine
// ==========================================
app.set('view engine', 'ejs');
// 修正：使用 rootDir 確保路徑正確
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
// 6. City Guide (縣市旅遊) - ✅ 重點修正區
// ==========================================

// 縣市列表頁 (Feed)
app.get('/search_by_city/:city', (req, res) => {
    const citySlug = req.params.city.toLowerCase();
    // 使用 process.cwd() 統一抓取路徑
    const jsonPath = path.join(rootDir, 'data', 'search_by_city', `${citySlug}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            
            // 將 slug 轉為顯示名稱 (例如 "new_taipei" -> "New Taipei")
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
                // ✅ 修正：補上 cityName 變數，避免 EJS 報錯
                const displayCityName = citySlug.split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                res.render('city_articles/city_article_page', { 
                    pageName: 'search_by_city',
                    article: foundArticle,
                    citySlug: citySlug,
                    cityName: displayCityName // 新增這個
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
        // ✅ 加入詳細 Log，讓您知道它去哪裡找檔案失敗了
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
                data: topicData, // 注意：這裡 EJS 可能需要 'article' 或 'data'，請確認您的 EJS 變數
                article: topicData, // 為了保險，多傳一個 article 變數
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
    });
}

module.exports = app;