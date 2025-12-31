const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ==========================================
// 1. 設定 View Engine (EJS 模板引擎)
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. 設定靜態檔案 (CSS, JS, Images)
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. 基礎頁面路由 (指向 static_pages 資料夾)
// ==========================================

// 首頁
app.get('/', (req, res) => {
    res.render('static_pages/index', { pageName: 'index' });
});

// 文化介紹頁
app.get('/culture', (req, res) => {
    res.render('static_pages/culture', { pageName: 'culture' });
});

// 節慶總覽頁
app.get('/festivals', (req, res) => {
    res.render('static_pages/festivals', { pageName: 'festivals' });
});

// 搜尋選擇頁 (地圖導航頁)
app.get('/search_by_city', (req, res) => {
    res.render('static_pages/search_by_city', { pageName: 'search_by_city' });
});

// ==========================================
// [核心功能 A] City Guide (動態文章)
// ==========================================

// 1. 縣市列表頁 (Feed)
app.get('/search_by_city/:city', (req, res) => {
    const city = req.params.city.toLowerCase();
    const jsonPath = path.join(__dirname, 'data', 'search_by_city', `${city}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const fileContent = fs.readFileSync(jsonPath, 'utf8');
            const cityData = JSON.parse(fileContent);
            
            // 格式化顯示名稱 (例如: new_taipei -> New Taipei)
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
            console.error('JSON Error:', err);
            res.status(500).send('Error parsing city data.');
        }
    } else {
        res.status(404).send(`
            <div style="text-align:center; padding:50px;">
                <h1>City Not Found</h1>
                <p>Sorry, we don't have a guide for "${city}" yet.</p>
                <a href="/search_by_city">Back to Map</a>
            </div>
        `);
    }
});

// 2. 縣市文章內文頁 (Article)
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
                res.status(404).send('Article not found.');
            }
        } catch (err) {
            console.error('Article Load Error:', err);
            res.status(500).send('Error loading article.');
        }
    } else {
        res.status(404).send('City data not found.');
    }
});

// ==========================================
// [核心功能 B] Transport Guide (交通專題)
// ==========================================

// 1. 交通總覽頁 (Feed)
app.get('/transport', (req, res) => {
    // 指向 transport_articles 資料夾下的 feed 檔案
    res.render('transport_articles/transport_feed', { pageName: 'transport' });
});

// 2. 交通攻略內文頁 (Article)
app.get('/transport/:topic', (req, res) => {
    const topic = req.params.topic;
    const jsonPath = path.join(__dirname, 'data', 'transport', `${topic}.json`);

    if (fs.existsSync(jsonPath)) {
        try {
            const fileContent = fs.readFileSync(jsonPath, 'utf8');
            const topicData = JSON.parse(fileContent);

            res.render('transport_articles/transport_article_page', { 
                pageName: 'transport',
                data: topicData 
            });
        } catch (err) {
            console.error('Transport JSON Error:', err);
            res.status(500).send('Error parsing transport data.');
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
// [核心功能 C] Hidden Gems (隱藏景點)
// ==========================================

// 1. 隱藏景點列表頁 (Feed) --> [本次修正]
app.get('/hidden_gems', (req, res) => {
    // 改為指向 hiddengems_articles 資料夾下的 feed
    res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' });
});

// 2. 隱藏景點內文頁 (Article)
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
            console.error('Gem JSON Error:', err);
            res.status(500).send('Error parsing gem data.');
        }
    } else {
        res.status(404).send(`
            <div style="text-align:center; padding:50px;">
                <h1>Gem Not Found</h1>
                <p>We haven't discovered this place yet.</p>
                <a href="/hidden_gems">Back to Hidden Gems</a>
            </div>
        `);
    }
});

// ==========================================
// [核心功能 D] Dining & Entertainment (清單模式)
// ==========================================

// 1. 美食列表 (Dining List)
app.get('/dining', (req, res) => {
    const diningPath = path.join(__dirname, 'data', 'dining.json');
    let diningData = [];
    
    if (fs.existsSync(diningPath)) {
        try {
            diningData = JSON.parse(fs.readFileSync(diningPath, 'utf8'));
        } catch (err) {
            console.error('Dining JSON Error:', err);
        }
    }
    
    // 指向 dining_lists 資料夾
    res.render('dining_lists/dining_feed', { 
        pageName: 'dining',
        items: diningData 
    });
});

// 2. 娛樂列表 (Entertainment List)
app.get('/entertainment', (req, res) => {
    const entPath = path.join(__dirname, 'data', 'entertainment.json');
    let entData = [];
    
    if (fs.existsSync(entPath)) {
        try {
            entData = JSON.parse(fs.readFileSync(entPath, 'utf8'));
        } catch (err) {
            console.error('Entertainment JSON Error:', err);
        }
    }
    
    // 指向 entertainment_lists 資料夾
    res.render('entertainment_lists/entertainment_feed', { 
        pageName: 'entertainment',
        items: entData 
    });
});

// ==========================================
// 4. 404 錯誤處理
// ==========================================
app.use((req, res) => {
    res.status(404).send(`
        <div style="text-align:center; padding:50px; font-family: sans-serif;">
            <h1>404 - Page Not Found</h1>
            <p>抱歉，找不到您要的頁面。</p>
            <a href="/" style="color: #E8A2A2; text-decoration: none; font-weight: bold;">回首頁 (Back to Home)</a>
        </div>
    `);
});

// ==========================================
// 5. 啟動伺服器
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`✅ TaiwanMe 伺服器運作中`);
    console.log(`   - 基礎頁面:       static_pages`);
    console.log(`   - City Guide:     city_articles`);
    console.log(`   - Transport:      transport_articles`);
    console.log(`   - Hidden Gems:    hiddengems_articles`);
    console.log(`   - Dining:         dining_lists`);
    console.log(`   - Entertainment:  entertainment_lists`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`=========================================`);
});