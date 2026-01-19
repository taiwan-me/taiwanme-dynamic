const fs = require('fs');
const path = require('path');

// ⚠️ 請將此處換成您的真實網址 (Vercel 網址或自訂網域)
// 注意：網址最後不要加斜線 /
const BASE_URL = 'https://taiwanme-dynamic.vercel.app';

module.exports = async function handler(req, res) {
    try {
        const rootDir = process.cwd();
        
        // 1. 定義靜態頁面 (這些是您確定固定存在的頁面)
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

        // 4. 動態生成：掃描 City Guide 文章
        const cityDir = path.join(rootDir, 'data', 'search_by_city');
        if (fs.existsSync(cityDir)) {
            const files = fs.readdirSync(cityDir);
            
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const citySlug = file.replace('.json', '');
                    
                    // A. 加入該城市的列表頁 (例如 /search_by_city/penghu)
                    xml += `
    <url>
        <loc>${BASE_URL}/search_by_city/${citySlug}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`;

                    // B. 讀取 JSON 內容，加入每一篇文章內頁
                    try {
                        const filePath = path.join(cityDir, file);
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        const articles = JSON.parse(fileContent);

                        if (Array.isArray(articles)) {
                            articles.forEach(article => {
                                // 例如 /search_by_city/penghu/ph-01
                                xml += `
    <url>
        <loc>${BASE_URL}/search_by_city/${citySlug}/${article.id}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>`;
                            });
                        }
                    } catch (err) {
                        console.error(`Error parsing ${file}:`, err);
                    }
                }
            });
        }

        // 5. 動態生成：掃描 Hidden Gems (如果有)
        const gemsDir = path.join(rootDir, 'data', 'hiddengems');
        if (fs.existsSync(gemsDir)) {
            const files = fs.readdirSync(gemsDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const gemId = file.replace('.json', '');
                    // 假設 Hidden Gems 的路徑結構
                    xml += `
    <url>
        <loc>${BASE_URL}/hidden_gems/${gemId}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
                }
            });
        }

        // 6. 結束 XML
        xml += `
</urlset>`;

        // 7. 設定 Header 並回傳 XML
        res.setHeader('Content-Type', 'application/xml');
        res.status(200).send(xml);

    } catch (e) {
        console.error(e);
        res.status(500).send('Error generating sitemap');
    }
};