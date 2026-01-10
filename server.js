const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ==========================================
// 1. 設定 View Engine (使用絕對路徑)
// ==========================================
app.set('view engine', 'ejs');
// 確保在 Vercel Serverless 環境下能找到 views 資料夾
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. 設定靜態檔案路徑
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. 頁面路由設定
// ==========================================

// 首頁
app.get('/', (req, res) => {
    res.render('static_pages/index', { pageName: 'index' });
});

// 其他基礎頁面
app.get('/culture', (req, res) => res.render('static_pages/culture', { pageName: 'culture' }));
app.get('/festivals', (req, res) => res.render('static_pages/festivals', { pageName: 'festivals' }));
app.get('/search_by_city', (req, res) => res.render('static_pages/search_by_city', { pageName: 'search_by_city' }));

// 縣市旅遊攻略
app.get('/search_by_city/:city', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);
    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            const displayCityName = city.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            res.render('city_articles/city_feed', { pageName: 'search_by_city', cityName: displayCityName, cityData, citySlug: city });
        } catch (e) { res.status(500).send('Data Error'); }
    } else { res.status(404).send('City Not Found'); }
});

app.get('/search_by_city/:city/:id', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);
    if (fs.existsSync(jsonPath)) {
        const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const article = cityData.find(item => item.id === req.params.id);
        article ? res.render('city_articles/city_article_page', { pageName: 'search_by_city', article, citySlug: city }) : res.status(404).send('Article not found');
    } else { res.status(404).send('City data not found'); }
});

// 交通與隱藏景點
app.get('/transport', (req, res) => res.render('transport_articles/transport_feed', { pageName: 'transport' }));
app.get('/hidden_gems', (req, res) => res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' }));

// Dining (前端渲染)
app.get('/dining', (req, res) => {
    res.render('dining_lists/dining_feed', { pageName: 'dining', items: [] });
});

// ==========================================
// 4. 404 處理與啟動 (Vercel 專用)
// ==========================================
app.use((req, res) => {
    res.status(404).send('<div style="text-align:center; padding:50px;"><h1>404</h1><p>Page Not Found</p><a href="/">Back Home</a></div>');
});

// 僅在非 Vercel 環境執行 listen，避免衝突
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// 重要：必須匯出 app 給 Vercel 使用
module.exports = app;