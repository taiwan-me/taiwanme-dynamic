const express = require('express');
const path = require('path');
const app = express();

// ==========================================
// 1. 設定 View Engine (EJS 模板引擎)
// ==========================================
app.set('view engine', 'ejs');
// 設定 EJS 檔案的存放位置 (views 資料夾)
app.set('views', path.join(__dirname, 'views'));

// ==========================================
// 2. 設定靜態檔案 (CSS, JS, Images)
// ==========================================
// 將 'public' 資料夾設為靜態資源目錄
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 3. 設定頁面路由 (Routes)
// ==========================================

// 首頁
app.get('/', (req, res) => {
    res.render('index', { pageName: 'index' });
});

// [修正] Hidden Gems 頁面
// 網址維持 /hidden_gems (配合 header 的連結)
// 但讀取檔案改為 'hiddengems' (配合你的 hiddengems.ejs 檔名)
app.get('/hidden_gems', (req, res) => {
    res.render('hiddengems', { pageName: 'hidden_gems' });
});

// 搜尋頁 (Search By City)
app.get('/search_by_city', (req, res) => {
    res.render('search_by_city', { pageName: 'search_by_city' });
});

// 節慶頁 (Festivals)
app.get('/festivals', (req, res) => {
    res.render('festivals', { pageName: 'festivals' });
});

// 交通頁 (Transport)
app.get('/transport', (req, res) => {
    res.render('transport', { pageName: 'transport' });
});

// 文化頁 (Culture)
app.get('/culture', (req, res) => {
    res.render('culture', { pageName: 'culture' });
});

// 餐飲頁 (Dining)
app.get('/dining', (req, res) => {
    res.render('dining', { pageName: 'dining' });
});

// 娛樂頁 (Entertainment)
app.get('/entertainment', (req, res) => {
    res.render('entertainment', { pageName: 'entertainment' });
});

// ==========================================
// 4. 404 錯誤處理 (找不到頁面時)
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
    console.log(`✅ TaiwanMe 伺服器已成功啟動！`);
    console.log(`🌍 請在瀏覽器輸入網址：http://localhost:${PORT}`);
    console.log(`=========================================`);
});