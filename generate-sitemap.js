const fs = require('fs');
const path = require('path');

// ⚠️ 這是您的基礎網址
const BASE_URL = 'https://taiwanme-dynamic.vercel.app';

/**
 * 核心功能：掃描資料夾並生成實體 sitemap.xml 到 public 資料夾
 */
function generateSitemap() {
    console.log('🚀 開始生成實體 sitemap.xml...');

    try {
        const rootDir = process.cwd();
        const publicDir = path.join(rootDir, 'public');

        // 確保 public 資料夾存在，若不存在則建立
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir);
        }

        // 1. 定義靜態頁面
        const staticPages = [
            '',
            '/culture',
            '/festivals',
            '/search_by_city',
            '/transport',
            '/dining',
            '/entertainment',
            '/souvenirs',
            '/philosophy'
        ];

        // 2. 初始化 XML 內容
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // 3. 加入靜態頁面
        staticPages.forEach(page => {
            xml += `
    <url>
        <loc>${BASE_URL}${page}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;
        });

        // 4. 動態偵測：掃描 City Guide 所有的 JSON 資料
        const cityDir = path.join(rootDir, 'data', 'search_by_city');
        if (fs.existsSync(cityDir)) {
            const files = fs.readdirSync(cityDir);
            
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const citySlug = file.replace('.json', '');
                    
                    // 加入城市列表頁
                    xml += `
    <url>
        <loc>${BASE_URL}/search_by_city/${citySlug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;

                    // 讀取 JSON 加入每一篇文章
                    try {
                        const filePath = path.join(cityDir, file);
                        const articles = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                        if (Array.isArray(articles)) {
                            articles.forEach(article => {
                                xml += `
    <url>
        <loc>${BASE_URL}/search_by_city/${citySlug}/${article.id}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
                            });
                        }
                    } catch (err) {
                        console.error(`解析 ${file} 出錯:`, err);
                    }
                }
            });
        }

        // 5. 動態偵測：掃描 Hidden Gems
        const gemsDir = path.join(rootDir, 'data', 'hiddengems');
        if (fs.existsSync(gemsDir)) {
            const files = fs.readdirSync(gemsDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const gemId = file.replace('.json', '');
                    xml += `
    <url>
        <loc>${BASE_URL}/hidden_gems/${gemId}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
                }
            });
        }

        xml += `
</urlset>`;

        // 6. ✅ 寫入檔案：writeFileSync 會自動複寫原本的 sitemap.xml
        fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
        console.log('✅ sitemap.xml 已更新並儲存至 public/ 資料夾！');

    } catch (e) {
        console.error('❌ Sitemap 生成錯誤:', e);
    }
}

// 執行生成邏輯
generateSitemap();

// 導出函式，供 server.js 調用
module.exports = generateSitemap;