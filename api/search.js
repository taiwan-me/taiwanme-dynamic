// api/search.js
const { Document } = require("flexsearch");
const fs = require("fs");
const path = require("path");

// ⚠️ 重要修改：將 export default 改為 module.exports
// 這樣您的 server.js (使用 require) 才能正確讀取它，解決本地端沒反應的問題
module.exports = async function handler(req, res) {
    
    // 1. 取得並驗證搜尋關鍵字
    const { q } = req.query;

    // 🔍 Debug: 讓您在終端機確認請求是否有進來
    console.log(`🔍 [Search API] 收到請求: q=${q}`);

    if (!q || typeof q !== "string" || q.trim().length === 0) {
        return res.status(200).json([]);
    }

    try {
        // 2. 初始化 FlexSearch 搜尋引擎
        const index = new Document({
            document: {
                id: "uniqueId",
                index: [
                    { field: "title", tokenize: "forward", resolution: 9 }, // 標題權重最高
                    { field: "tags", tokenize: "forward", resolution: 5 },
                    { field: "intro", tokenize: "forward", resolution: 1 }
                ],
                store: ["id", "title", "type", "intro", "heroImage", "citySlug", "tags"]
            },
            tokenize: "forward",
            charset: "latin:extra",
            worker: false
        });

        // 3. 定義資料來源
        const rootDir = process.cwd();
        // 🔍 Debug: 確認讀取路徑是否正確 (特別是 Vercel vs 本地端)
        console.log(`📂 [Search API] 資料根目錄: ${rootDir}`);
        
        const dataFolders = ["search_by_city", "hiddengems"];

        // 4. 讀取資料並建立索引
        let loadedCount = 0; // 計算總共載入了幾筆資料

        dataFolders.forEach(folderName => {
            const folderPath = path.join(rootDir, "data", folderName);

            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);

                files.forEach(file => {
                    if (file.endsWith(".json")) {
                        const citySlug = file.replace(".json", "");
                        const filePath = path.join(folderPath, file);
                        
                        try {
                            const fileContent = fs.readFileSync(filePath, "utf8");
                            const jsonData = JSON.parse(fileContent);

                            if (Array.isArray(jsonData)) {
                                jsonData.forEach(item => {
                                    index.add({
                                        ...item,
                                        uniqueId: `${folderName}-${citySlug}-${item.id}`,
                                        citySlug: citySlug,
                                        tags: Array.isArray(item.tags) ? item.tags : []
                                    });
                                    loadedCount++;
                                });
                            }
                        } catch (err) {
                            console.error(`⚠️ Error parsing file ${file}:`, err.message);
                        }
                    }
                });
            } else {
                console.warn(`⚠️ 資料夾不存在: ${folderPath}`);
            }
        });

        console.log(`✅ [Search API] 索引建立完成，共載入 ${loadedCount} 筆資料`);

        // 5. 執行搜尋
        const results = index.search(q.trim(), { limit: 10, enrich: true });

        // 6. 整理回傳結果
        let formattedResults = [];
        
        if (results.length > 0) {
            const uniqueItems = new Map();
            results.forEach(fieldResult => {
                fieldResult.result.forEach(item => {
                    if (!uniqueItems.has(item.id)) {
                        uniqueItems.set(item.id, item.doc);
                    }
                });
            });
            formattedResults = Array.from(uniqueItems.values());
        }

        console.log(`📤 [Search API] 回傳 ${formattedResults.length} 筆結果`);
        
        // 7. 回傳 JSON
        res.status(200).json(formattedResults);

    } catch (error) {
        console.error("❌ Search API Error:", error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
};