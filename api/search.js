const { Document } = require("flexsearch");
const fs = require('fs');
const path = require('path');

// [設定] 預設圖片路徑 (請確保 public/image/logo.png 存在)
// 如果 JSON 資料沒有 heroImage，就會自動使用這張圖
const DEFAULT_IMAGE = '/image/logo.png'; 

module.exports = async (req, res) => {
    try {
        const { q } = req.query;

        // 1. 驗證關鍵字
        if (!q || typeof q !== 'string' || q.trim() === '') {
            return res.json([]);
        }

        const query = q.toLowerCase().trim();
        const rootDir = process.cwd();
        
        // 用 Map 來儲存結果 (去重)
        const resultMap = new Map();

        console.log(`\n🔍 [Hybrid Search] 關鍵字: "${query}"`);

        // =================================================
        // 初始化 FlexSearch 引擎
        // =================================================
        const flexIndex = new Document({
            document: {
                id: "uniqueId",
                index: [
                    { field: "title", tokenize: "forward", resolution: 9 },
                    { field: "tags", tokenize: "forward", resolution: 5 },
                    { field: "intro", tokenize: "forward", resolution: 1 }
                ],
                store: ["id", "title", "url", "desc", "image", "category", "tags", "citySlug"]
            },
            tokenize: "forward"
        });

        // 輔助函式：處理圖片路徑 (防呆)
        const resolveImage = (img) => {
            return (img && img.trim() !== "") ? img : DEFAULT_IMAGE;
        };

        const addToResults = (item, source) => {
            if (!resultMap.has(item.url)) {
                resultMap.set(item.url, item);
            }
        };

        // =================================================
        // 1. 掃描 City Guide (縣市行程)
        // =================================================
        const cityDir = path.join(rootDir, 'data', 'search_by_city');
        if (fs.existsSync(cityDir)) {
            const files = fs.readdirSync(cityDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const citySlug = file.replace('.json', '');
                    try {
                        const content = fs.readFileSync(path.join(cityDir, file), 'utf8');
                        const articles = JSON.parse(content);

                        const isFileNameMatch = citySlug.includes(query) || query.includes(citySlug);

                        if (Array.isArray(articles)) {
                            articles.forEach(article => {
                                const itemData = {
                                    id: article.id,
                                    title: `[${article.type}] ${article.title}`,
                                    url: `/search_by_city/${citySlug}/${article.id}`,
                                    desc: article.subTitle || article.intro,
                                    // ✅ 確保這裡用到 resolveImage
                                    image: resolveImage(article.heroImage),
                                    tags: article.tags || [],
                                    category: 'City Guide',
                                    citySlug: citySlug 
                                };

                                if (isFileNameMatch) addToResults(itemData, 'Direct-File');

                                const tags = article.tags || [];
                                const isTagMatch = tags.some(t => t.toLowerCase().includes(query));
                                if (isTagMatch) addToResults(itemData, 'Direct-Tag');

                                flexIndex.add({
                                    uniqueId: itemData.url,
                                    title: article.title,
                                    intro: article.intro,
                                    tags: tags,
                                    ...itemData
                                });
                            });
                        }
                    } catch (e) { /* 忽略錯誤 */ }
                }
            });
        }

        // =================================================
        // 2. 掃描 Transport (交通)
        // =================================================
        const transDir = path.join(rootDir, 'data', 'transport');
        if (fs.existsSync(transDir)) {
            const files = fs.readdirSync(transDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const topicId = file.replace('.json', '');
                    try {
                        const content = fs.readFileSync(path.join(transDir, file), 'utf8');
                        const data = JSON.parse(content);
                        
                        const itemData = {
                            id: topicId,
                            title: data.title || topicId,
                            url: `/transport/${topicId}`,
                            desc: data.intro || "Transport guide",
                            // ✅ 確保這裡用到 resolveImage
                            image: resolveImage(data.heroImage),
                            category: 'Transport',
                            tags: ["Transport", "Traffic", topicId],
                            citySlug: null 
                        };

                        if (query.includes('transport') || query.includes('traffic') || topicId.includes(query)) {
                            addToResults(itemData, 'Direct-Transport');
                        }

                        flexIndex.add({
                            uniqueId: itemData.url,
                            title: itemData.title,
                            intro: JSON.stringify(data),
                            tags: itemData.tags,
                            ...itemData
                        });

                    } catch (e) { /* 忽略錯誤 */ }
                }
            });
        }

        // =================================================
        // 3. 掃描 Hidden Gems (隱藏景點)
        // =================================================
        const gemsDir = path.join(rootDir, 'data', 'hiddengems');
        if (fs.existsSync(gemsDir)) {
            const files = fs.readdirSync(gemsDir);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const gemId = file.replace('.json', '');
                    try {
                        const content = fs.readFileSync(path.join(gemsDir, file), 'utf8');
                        const data = JSON.parse(content);

                        if (!data || (Array.isArray(data) && data.length === 0)) return;

                        const itemData = {
                            id: gemId,
                            title: data.title,
                            url: `/hidden_gems/${gemId}`,
                            desc: data.intro,
                            // ✅ 確保這裡用到 resolveImage
                            image: resolveImage(data.heroImage),
                            tags: data.tags || [],
                            category: 'Hidden Gem',
                            citySlug: null
                        };

                        const isTagMatch = itemData.tags.some(t => t.toLowerCase().includes(query));
                        if (isTagMatch) addToResults(itemData, 'Direct-Gem');

                        flexIndex.add({
                            uniqueId: itemData.url,
                            title: itemData.title,
                            intro: itemData.intro,
                            tags: itemData.tags,
                            ...itemData
                        });

                    } catch (e) { /* 忽略錯誤 */ }
                }
            });
        }

        // =================================================
        // 4. 執行 FlexSearch 並合併結果
        // =================================================
        const flexResults = flexIndex.search(query, { limit: 20, enrich: true });

        if (flexResults.length > 0) {
            flexResults.forEach(category => {
                category.result.forEach(r => {
                    addToResults(r.doc, 'FlexSearch');
                });
            });
        }

        const finalResults = Array.from(resultMap.values());
        console.log(`📤 回傳 ${finalResults.length} 筆資料`);
        res.status(200).json(finalResults);

    } catch (error) {
        console.error('❌ Search API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};