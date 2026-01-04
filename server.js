const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ==========================================
// 1. 設定 View Engine
// ==========================================
app.set('view engine', 'ejs');
// 設定 views 的根目錄
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. 設定靜態檔案 (CSS, JS, Images)
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. 靜態頁面路由 (Static Pages)
// 對應資料夾: views/static_pages/
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
// 4. City Guide (縣市旅遊)
// 對應資料夾: views/city_articles/
// ==========================================

// 縣市列表頁 (Feed)
app.get('/search_by_city/:city', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const cityData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            
            // 格式化顯示名稱 (如: new_taipei -> New Taipei)
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
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);

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
// 5. Transport Guide (交通攻略)
// 對應資料夾: views/transport_articles/
// ==========================================

// 交通總覽頁
app.get('/transport', (req, res) => {
    res.render('transport_articles/transport_feed', { pageName: 'transport' });
});

// 交通文章內頁
app.get('/transport/:topic', (req, res) => {
    const topic = req.params.topic;
    const jsonPath = path.join(__dirname, 'data', 'transport', `${topic}.json`);

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
        res.status(404).send('Transport Guide Not Found');
    }
});

// ==========================================
// 6. Hidden Gems (隱藏景點)
// 對應資料夾: views/hiddengems_articles/
// ==========================================

// 隱藏景點列表
app.get('/hidden_gems', (req, res) => {
    res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' });
});

// 隱藏景點內頁
app.get('/hidden_gems/:id', (req, res) => {
    const gemId = req.params.id;
    const jsonPath = path.join(__dirname, 'data', 'hiddengems', `${gemId}.json`);

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
// 7. Dining & Entertainment (列表)
// 對應資料夾: views/dining_lists/ & views/entertainment_lists/
// ==========================================

// Dining
app.get('/dining', (req, res) => {
    const diningPath = path.join(__dirname, 'data', 'dining.json');
    let diningData = [];
    if (fs.existsSync(diningPath)) {
        diningData = JSON.parse(fs.readFileSync(diningPath, 'utf8'));
    }
    res.render('dining_lists/dining_feed', { 
        pageName: 'dining',
        items: diningData 
    });
});

// Entertainment
app.get('/entertainment', (req, res) => {
    const entPath = path.join(__dirname, 'data', 'entertainment.json');
    let entData = [];
    if (fs.existsSync(entPath)) {
        entData = JSON.parse(fs.readFileSync(entPath, 'utf8'));
    }
    res.render('entertainment_lists/entertainment_feed', { 
        pageName: 'entertainment',
        items: entData 
    });
});

// ==========================================
// 8. 404 & Server Start
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ TaiwanMe 伺服器運作中: http://localhost:${PORT}`);
    console.log(`📁 請確認您的 views 資料夾已依照結構分類完畢`);
});