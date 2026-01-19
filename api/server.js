const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ==========================================
// 1. 整合 Search API (解決本地端 404 問題)
// ==========================================
try {
    const searchHandler = require('./search');
    
    app.get('/api/search', async (req, res) => {
        // 處理 Vercel (export default) 與一般 Node.js (module.exports) 的相容性
        const handler = searchHandler.default || searchHandler;
        if (typeof handler === 'function') {
            await handler(req, res);
        } else {
            res.status(500).json({ error: "Search handler is not a function" });
        }
    });
    console.log('✅ Search API route initialized successfully.');
} catch (err) {
    console.warn('⚠️ Warning: Could not load search.js locally.', err.message);
}

// ==========================================
// 2. 整合 Sitemap (新增部分)
// ==========================================
// 讓本地端與 Vercel 都能透過 /sitemap.xml 存取動態生成的網站地圖
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
    console.log('✅ Sitemap route initialized successfully.');
} catch (err) {
    console.warn('⚠️ Warning: Could not load sitemap.js locally.', err.message);
}

// ==========================================
// 3. 設定 View Engine
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ==========================================
// 4. 設定靜態檔案 (CSS, JS, Images)
// ==========================================
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// 5. 靜態頁面路由 (Static Pages)
// ==========================================

// 首頁
app.get('/', (req, res) => {
    res.render('static_pages/index', { pageName: 'index' });
});

// 文化介紹
app.get('/culture', (req, res) => {
    res.render('static_pages/culture', { pageName: 'culture' });
});

// 節慶總覽
app.get('/festivals', (req, res) => {
    res.render('static_pages/festivals', { pageName: 'festivals' });
});

// 搜尋選擇頁 (地圖)
app.get('/search_by_city', (req, res) => {
    res.render('static_pages/search_by_city', { pageName: 'search_by_city' });
});

// ==========================================
// 6. City Guide (縣市旅遊)
// ==========================================

// 縣市列表頁 (Feed)
app.get('/search_by_city/:city', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, '../data', 'search_by_city', `${city}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            
            const displayCityName = city.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            res.render('city_articles/city_feed', { 
                pageName: 'search_by_city',
                cityName: displayCityName,
                cityData: cityData,
                citySlug: city
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Error parsing data');
        }
    } else {
        res.status(404).send('City Not Found');
    }
});

// 縣市文章內頁 (Article)
app.get('/search_by_city/:city/:id', (req, res) => {
    const city = req.params.city.toLowerCase();
    const articleId = req.params.id;
    const jsonPath = path.join(__dirname, '../data', 'search_by_city', `${city}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const foundArticle = cityData.find(item => item.id === articleId);

            if (foundArticle) {
                res.render('city_articles/city_article_page', { 
                    pageName: 'search_by_city',
                    article: foundArticle,
                    citySlug: city
                });
            } else {
                res.status(404).send('Article not found');
            }
        } catch (err) {
            console.error(err);
            res.status(500).send('Error loading article');
        }
    } else {
        res.status(404).send('City data not found');
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
    const jsonPath = path.join(__dirname, '../data', 'transport', `${topic}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const topicData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            res.render('transport_articles/transport_article_page', { 
                pageName: 'transport',
                data: topicData 
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Error parsing transport data');
        }
    } else {
        res.status(404).send(`
            <div style="text-align:center; padding:50px;">
                <h1>Topic Not Found</h1>
                <p>Sorry, the guide for "${topic}" is currently unavailable.</p>
                <a href="/transport">Back to Transport Hub</a>
            </div>
        `);
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
    const jsonPath = path.join(__dirname, '../data', 'hiddengems', `${gemId}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const gemData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            res.render('hiddengems_articles/hiddengems_article_page', { 
                pageName: 'hidden_gems',
                article: gemData 
            });
        } catch (err) {
            console.error(err);
            res.status(500).send('Error parsing gem data');
        }
    } else {
        res.status(404).send('Gem Not Found');
    }
});

// ==========================================
// 9. Dining & Entertainment
// ==========================================

// Dining
app.get('/dining', (req, res) => {
    const diningPath = path.join(__dirname, '../data', 'dining.json');
    let diningData = [];
    if (fs.existsSync(diningPath)) {
        try {
            diningData = JSON.parse(fs.readFileSync(diningPath, 'utf8'));
        } catch (e) { console.error(e); }
    }
    res.render('dining_lists/dining_feed', { 
        pageName: 'dining',
        items: diningData 
    });
});

// Entertainment
app.get('/entertainment', (req, res) => {
    const entPath = path.join(__dirname, '../data', 'entertainment.json');
    let entData = [];
    if (fs.existsSync(entPath)) {
        try {
            entData = JSON.parse(fs.readFileSync(entPath, 'utf8'));
        } catch (e) { console.error(e); }
    }
    res.render('entertainment_lists/entertainment_feed', { 
        pageName: 'entertainment',
        items: entData 
    });
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

// 啟動伺服器 (僅在本地端或非 Vercel 環境執行)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ TaiwanMe Server Running in: ${path.join(__dirname)}`);
        console.log(`🔍 Search API loaded at: http://localhost:${PORT}/api/search`);
        console.log(`🗺️ Sitemap loaded at:    http://localhost:${PORT}/sitemap.xml`);
        console.log(`🌍 Main URL: http://localhost:${PORT}`);
    });
}

// 匯出 App 給 Vercel
module.exports = app;