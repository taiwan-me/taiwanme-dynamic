const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// ==========================================
// 1. 設定 View Engine
// ==========================================
app.set('view engine', 'ejs');

// ⚠️ 重要修改：因為 server.js 在 api/ 裡，必須用 '../views' 回到上一層找資料夾
app.set('views', path.join(__dirname, '../views'));

// ==========================================
// 2. 設定靜態檔案 (CSS, JS, Images)
// ==========================================
// ⚠️ 重要修改：回到上一層找 public
app.use(express.static(path.join(__dirname, '../public')));

// ==========================================
// 3. 靜態頁面路由 (Static Pages)
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
// ==========================================

// 縣市列表頁 (Feed)
app.get('/search_by_city/:city', (req, res) => {
    const city = req.params.city.toLowerCase();
    // ⚠️ 重要修改：回到上一層找 data
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
    // ⚠️ 重要修改：回到上一層找 data
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
// 5. Transport Guide (交通攻略)
// ==========================================

app.get('/transport', (req, res) => {
    res.render('transport_articles/transport_feed', { pageName: 'transport' });
});

app.get('/transport/:topic', (req, res) => {
    const topic = req.params.topic;
    // ⚠️ 重要修改：回到上一層找 data
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
// 6. Hidden Gems (隱藏景點)
// ==========================================

app.get('/hidden_gems', (req, res) => {
    res.render('hiddengems_articles/hiddengems_feed', { pageName: 'hidden_gems' });
});

app.get('/hidden_gems/:id', (req, res) => {
    const gemId = req.params.id;
    // ⚠️ 重要修改：回到上一層找 data
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
// 7. Dining & Entertainment
// ==========================================

// Dining
app.get('/dining', (req, res) => {
    // ⚠️ 重要修改：回到上一層找 data
    const diningPath = path.join(__dirname, '../data', 'dining.json');
    let diningData = [];
    if (fs.existsSync(diningPath)) {
        diningData = JSON.parse(fs.readFileSync(diningPath, 'utf8'));
    }
    // 建議：為了效能，這裡其實可以傳空陣列 []，讓前端 JS 去處理，但為了相容你的程式碼我保留了讀取邏輯
    res.render('dining_lists/dining_feed', { 
        pageName: 'dining',
        items: diningData 
    });
});

// Entertainment
app.get('/entertainment', (req, res) => {
    // ⚠️ 重要修改：回到上一層找 data
    const entPath = path.join(__dirname, '../data', 'entertainment.json');
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

// ⚠️ 重要修改：Vercel 不需要我們自己 listen port，它會自己接手
// 我們加上判斷，只有在本機開發時才執行 listen
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ TaiwanMe Server Running in: ${path.join(__dirname)}`);
        console.log(`🌍 URL: http://localhost:${PORT}`);
    });
}

// ⚠️ 非常重要：必須匯出 app 讓 Vercel 的 api 資料夾機制抓取
module.exports = app;