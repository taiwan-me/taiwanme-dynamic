/* script.js - TaiwanMe Official Logic */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==============================================
    // 0. 輔助函式：統一管理 Modal 關閉
    // ==============================================
    const closeAllModals = () => {
        const modalIds = [
            'searchModal', 
            'philosophyModal', 
            'tippingModal', 
            'businessInquiryModal'
        ];
        
        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) modal.style.display = 'none';
        });
    };

    // ==============================================
    // 1. 搜尋 Modal 開關 (Search Modal UI)
    // ==============================================
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearch = document.querySelector('.close-search');

    if (searchBtn && searchModal) {
        searchBtn.addEventListener('click', () => {
            searchModal.style.display = 'flex';
            // 開啟時自動聚焦搜尋框
            setTimeout(() => {
                const input = document.getElementById('search-input');
                if (input) input.focus();
            }, 100);
        });
        if (closeSearch) {
            closeSearch.addEventListener('click', () => searchModal.style.display = 'none');
        }
    }

    // ==============================================
    // 1.5 [NEW] 全域搜尋邏輯 (Global Search Logic)
    // ==============================================
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let debounceTimer;

    if (searchInput && searchResults) {
        // 監聽輸入事件
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // 清除舊的計時器 (防抖動 Debounce)
            clearTimeout(debounceTimer);

            if (query.length === 0) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
                return;
            }

            // 設定 300ms 後才發送請求，減少伺服器負擔
            debounceTimer = setTimeout(async () => {
                try {
                    // ✅ 修正：加上時間戳記 &t=... 強制清除快取，確保拿到最新圖片資料
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&t=${Date.now()}`);
                    const data = await res.json();

                    renderSearchResults(data);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });

        // 點擊外部時關閉搜尋結果
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

    // ✅ 渲染搜尋結果函式 (強制顯示圖片 & 除錯版)
    function renderSearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-result">No results found</div>';
            searchResults.style.display = 'block';
            return;
        }

        const html = results.map(item => {
            // 偵錯用：在 Console 印出圖片路徑，確認資料是否正確
            // console.log(`[Search Debug] Title: ${item.title}, Image: ${item.image}`);

            // 1. 確保圖片網址有效，否則使用預設圖 (Placeholder)
            // 如果 item.image 有值，就用它；否則顯示預設的灰底圖
            const imageUrl = (item.image && item.image.trim() !== "") 
                ? item.image 
                : 'https://placehold.co/100x100/eee/999?text=TaiwanMe'; 

            return `
                <a href="${item.url}" class="search-item">
                    <div class="result-img">
                        <img src="${imageUrl}" 
                             alt="${item.title}" 
                             onerror="console.log('Image Load Error:', '${imageUrl}'); this.src='https://placehold.co/100x100/eee/999?text=Error'">
                    </div>
                    <div class="result-content">
                        <div class="result-title">${item.title}</div>
                        <div class="result-desc">${item.desc ? item.desc.substring(0, 60) + '...' : ''}</div>
                        <div class="result-tags">
                            ${item.category ? `<span class="tag-cat">${item.category}</span>` : ''}
                        </div>
                    </div>
                </a>
            `;
        }).join('');

        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    }

    // ==============================================
    // 2. Philosophy 海報彈窗功能
    // ==============================================
    const philosophyBtn = document.getElementById('philosophyBtn');
    const philosophyModal = document.getElementById('philosophyModal');
    const closePoster = document.querySelector('.close-poster');

    if (philosophyBtn && philosophyModal) {
        philosophyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            philosophyModal.style.display = 'flex';
        });
        if (closePoster) {
            closePoster.addEventListener('click', () => philosophyModal.style.display = 'none');
        }
    }

    // ==============================================
    // 3. Business Inquiry 彈窗功能
    // ==============================================
    const bizBtn = document.getElementById('bizInquiryBtn');
    const bizModal = document.getElementById('businessInquiryModal');
    const closeBiz = document.querySelector('.close-biz');

    if (bizBtn && bizModal) {
        bizBtn.addEventListener('click', (e) => {
            e.preventDefault();
            bizModal.style.display = 'flex';
        });
        if (closeBiz) {
            closeBiz.addEventListener('click', () => bizModal.style.display = 'none');
        }
    }

    // ==============================================
    // 4. 打賞 (Tipping) 彈窗邏輯 & 複製功能
    // ==============================================
    const tippingBtn = document.getElementById('tippingBtn');
    const tippingModal = document.getElementById('tippingModal');
    const closeTipping = document.querySelector('.close-tipping');

    if (tippingBtn && tippingModal) {
        tippingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tippingModal.style.display = 'flex';
        });
        if (closeTipping) {
            closeTipping.addEventListener('click', () => tippingModal.style.display = 'none');
        }
    }

    // --- 複製地址功能 ---
    const copyButtons = document.querySelectorAll('.copy-btn');
    if (copyButtons.length > 0) {
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const address = btn.getAttribute('data-addr');
                
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(address);
                        handleCopyFeedback(btn);
                    } else {
                        throw new Error('Clipboard API unavailable');
                    }
                } catch (err) {
                    const textArea = document.createElement("textarea");
                    textArea.value = address;
                    textArea.style.position = "fixed"; 
                    textArea.style.left = "-9999px";
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        handleCopyFeedback(btn);
                    } catch (e) {
                        alert('Unable to copy automatically. Please copy manually.');
                    }
                    document.body.removeChild(textArea);
                }
            });
        });
    }

    function handleCopyFeedback(btn) {
        const originalText = btn.textContent;
        if (btn.classList.contains('copy-success')) return;

        btn.classList.add('copy-success');
        btn.textContent = 'Copied!';
        btn.style.backgroundColor = '#4CAF50';
        btn.style.color = '#fff';
        btn.style.borderColor = '#4CAF50';

        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.borderColor = '';
            btn.classList.remove('copy-success');
        }, 2000);
    }

    // ==============================================
    // 5. 全域點擊背景與 ESC 鍵關閉功能
    // ==============================================
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('search-modal') || 
            e.target.classList.contains('philosophy-modal') || 
            e.target.classList.contains('tipping-modal') ||
            e.target.classList.contains('biz-modal')) {
            closeAllModals();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // ==============================================
    // 6. 手機版側邊抽屜 (Mobile Drawer) 邏輯
    // ==============================================
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');

    // 開啟抽屜
    function openDrawer() {
        if (drawer && overlay) {
            drawer.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // 鎖定背景捲動
        }
    }

    // 關閉抽屜
    function closeDrawer() {
        if (drawer && overlay) {
            drawer.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = ''; // 恢復背景捲動
        }
    }

    // 事件綁定
    if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    // 點擊抽屜內的連結後自動關閉抽屜
    const drawerLinks = document.querySelectorAll('.drawer-link');
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });

    const interceptDrawerModalLinks = () => {
        const linkMap = {
            '/philosophy': 'philosophyModal',
            '/support': 'tippingModal',
            '/contact': 'businessInquiryModal'
        };

        drawerLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (linkMap[href]) {
                link.addEventListener('click', (e) => {
                    e.preventDefault(); // 阻止跳轉
                    closeDrawer();      // 關閉抽屜
                    const targetModal = document.getElementById(linkMap[href]);
                    if (targetModal) targetModal.style.display = 'flex'; // 開啟 Modal
                });
            }
        });
    };
    interceptDrawerModalLinks();


    // ==============================================
    // 7. 自動輪播圖 (Hero Slider) - 只在首頁運作
    // ==============================================
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) slide.classList.add('active');
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    if (slides.length > 0) {
        const startSlideShow = () => {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000); 
        };

        const resetSlideShow = () => {
            startSlideShow();
        };

        showSlide(0); 
        startSlideShow();

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                resetSlideShow();
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
                resetSlideShow();
            });
        }
    }

    // ==============================================
    // 8. 展開更多文章 (Load More)
    // ==============================================
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const hiddenCards = document.querySelectorAll('.hidden-card');
            
            hiddenCards.forEach(card => {
                card.style.display = 'block';
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                });
            });
            
            loadMoreBtn.style.display = 'none';
        });
    }

    // ==============================================
    // 10. 導覽列 "Hidden Gems" 連結邏輯 (首頁捲動)
    // ==============================================
    const hiddenGemLinks = document.querySelectorAll('.scroll-to-map'); 
    const mapSection = document.getElementById('mapSection');           

    if (hiddenGemLinks.length > 0) {
        hiddenGemLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (mapSection) {
                    e.preventDefault();
                    mapSection.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                } 
            });
        });
    }

    // ==============================================
    // 11. Dining Page 篩選與搜尋功能
    // ==============================================
    const diningSearchInput = document.getElementById('diningSearchInput');
    const diningSearchBtn = document.getElementById('diningSearchBtn');
    const dietCheckboxes = document.querySelectorAll('.diet-checkbox');
    const restaurantGrid = document.getElementById('restaurantGrid');
    const noResultsMsg = document.getElementById('noResults');

    if (restaurantGrid) {
        const filterRestaurants = () => {
            const keyword = diningSearchInput.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.res-card');
            const selectedDiets = Array.from(dietCheckboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            let visibleCount = 0;
            cards.forEach(card => {
                const areaData = card.getAttribute('data-area') || '';
                const dietData = card.getAttribute('data-diet') || '';
                const dietList = dietData.split(' '); 

                const matchesKeyword = areaData.toLowerCase().includes(keyword);
                const matchesDiet = selectedDiets.every(tag => dietList.includes(tag));

                if (matchesKeyword && matchesDiet) {
                    card.style.display = 'block';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (noResultsMsg) {
                noResultsMsg.style.display = (visibleCount === 0) ? 'block' : 'none';
            }
        };

        if (diningSearchBtn) diningSearchBtn.addEventListener('click', filterRestaurants);
        if (diningSearchInput) diningSearchInput.addEventListener('keyup', filterRestaurants);
        dietCheckboxes.forEach(cb => cb.addEventListener('change', filterRestaurants));
    }

    // ==============================================
    // 12. Back to Top Button Logic
    // ==============================================
    const backToTopBtn = document.getElementById('backToTopBtn');

    if (backToTopBtn) {
        const calculateThreshold = () => {
            const header = document.getElementById('header');
            const nav = document.querySelector('.desktop-nav');
            
            let totalHeight = 0;
            if (header) totalHeight += header.offsetHeight;
            if (nav) totalHeight += nav.offsetHeight;

            return totalHeight > 0 ? (totalHeight * 0.5) : 75;
        };

        let threshold = calculateThreshold();

        window.addEventListener('scroll', () => {
            if (window.scrollY > threshold) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        window.addEventListener('resize', () => {
            threshold = calculateThreshold();
        });

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==============================================
    // 13. 處理跨頁面錨點平滑捲動
    // ==============================================
    window.addEventListener('load', () => {
        if (window.location.hash) {
            const targetId = window.location.hash.substring(1); 
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                }, 300);
            }
        }
    });

});