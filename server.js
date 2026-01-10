const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ==========================================
// 1. 設定 View Engine (使用絕對路徑)
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. 設定靜態檔案路徑
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. 頁面路由設定
// ==========================================

// 首頁與基礎頁面
app.get('/', (req, res) => res.render('static_pages/index', { pageName: 'index' }));
app.get('/culture', (req, res) => res.render('static_pages/culture', { pageName: 'culture' }));
app.get('/festivals', (req, res) => res.render('static_pages/festivals', { pageName: 'festivals' }));
app.get('/search_by_city', (req, res) => res.render('static_pages/search_by_city', { pageName: 'search_by_city' }));

// 縣市旅遊攻略 (City Guide)
app.get('/search_by_city/:city', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);
    if (fs.existsSync(jsonPath)) {
        const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const displayCityName = city.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        res.render('city_articles/city_feed', { pageName: 'search_by_city', cityName: displayCityName, cityData, citySlug: city });
    } else {
        res.status(404).send('City Not Found');
    }
});

app.get('/search_by_city/:city/:id', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);
    if (fs.existsSync(jsonPath)) {
        const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const article = cityData.find(item => item.id === req.params.id);
        article ? res.render('city_articles/city_article_page', { pageName: 'search_by_city', article, citySlug: city }) : res.status(404).send('Article not found');
    } else {
        res.status(404).send('City data not found');
    }
});

// 交通、隱藏景點、與娛樂
app.get('/transport', (req, res) => res.render('transport_articles/transport_feed', { pageName: 'transport' }));
app.get('/hidden_gems', (req, res) => res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' }));

// Dining (關鍵：使用前端渲染，減輕後端負擔)
app.get('/dining', (req, res) => {
    res.render('dining_lists/dining_feed', { pageName: 'dining', items: [] });
});

// ==========================================
// 4. 404 處理與匯出
// ==========================================
app.use((req, res) => {
    res.status(404).send('<div style="text-align:center; padding:50px;"><h1>404</h1><p>Page Not Found</p><a href="/">Back Home</a></div>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ TaiwanMe 伺服器運作中 - Port: ${PORT}`);
});

// 務必保留此行匯出給 Vercel
module.exports = app;