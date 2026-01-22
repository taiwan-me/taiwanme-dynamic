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
            'businessInquiryModal',
            'authorModal' // ✅ 新增：關於作者 Modal
        ];
        
        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) modal.style.display = 'none';
        });
        document.body.style.overflow = ''; // 恢復背景捲動
    };

    // ==============================================
    // 1. 搜尋 Modal 開關 (Search Modal UI)
    // ==============================================
    const searchBtnDesktop = document.getElementById('desktop-search-trigger');
    const searchBtnMobile = document.getElementById('mobile-search-trigger');
    const searchModal = document.getElementById('searchModal');
    const closeSearch = document.getElementById('closeSearchBtn');

    const openSearch = (e) => {
        e.preventDefault();
        if (searchModal) {
            searchModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                const input = document.getElementById('modal-search-input');
                if (input) input.focus();
            }, 100);
        }
    };

    if (searchBtnDesktop) searchBtnDesktop.addEventListener('click', openSearch);
    if (searchBtnMobile) searchBtnMobile.addEventListener('click', openSearch);
    
    if (closeSearch) {
        closeSearch.addEventListener('click', () => {
            if (searchModal) {
                searchModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }

    // ==============================================
    // 1.5 全域搜尋邏輯 (Global Search Logic)
    // ==============================================
    const searchInput = document.getElementById('modal-search-input');
    const searchResults = document.getElementById('modal-results-container');
    let debounceTimer;

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);

            if (query.length === 0) {
                searchResults.innerHTML = '';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&t=${Date.now()}`);
                    const data = await res.json();
                    renderSearchResults(data);
                } catch (error) {
                    console.error('Search error:', error);
                }
            }, 300);
        });
    }

    function renderSearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div style="padding:20px; color:#999; text-align:center;">No results found.</div>';
            return;
        }

        const html = results.map(item => {
            const imageUrl = (item.heroImage && item.heroImage.trim() !== "") 
                ? item.heroImage 
                : '/image/default_thumb.jpg'; 

            // 判斷連結路徑
            let link = `/search_by_city/${item.citySlug}/${item.id}`;
            if (item.id.startsWith('hg-') || item.folder === 'hiddengems') link = `/hidden_gems/${item.id}`;
            if (item.folder === 'entertainment') link = `/entertainment/${item.id}`; // ✅ 新增娛樂類別連結

            return `
                <a href="${link}" class="result-item" onclick="document.body.style.overflow=''">
                    <img src="${imageUrl}" class="result-img" alt="${item.title}" onerror="this.src='https://placehold.co/100x100/eee/999?text=Error'">
                    <div>
                        <div class="result-type">${item.type || 'Article'}</div>
                        <div class="result-title">${item.title}</div>
                    </div>
                </a>
            `;
        }).join('');

        searchResults.innerHTML = html;
    }

    // ==============================================
    // 2. Philosophy & Author Modal
    // ==============================================
    const setupModal = (triggerClass, modalId, closeClass) => {
        const triggers = document.querySelectorAll(triggerClass);
        const modal = document.getElementById(modalId);
        const closeBtn = document.querySelector(closeClass);

        if (modal) {
            triggers.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    
                    // 如果是在手機側邊欄開啟，順便關閉側邊欄
                    const drawer = document.getElementById('mobileDrawer');
                    if (drawer && drawer.classList.contains('active')) {
                        drawer.classList.remove('active');
                        document.getElementById('mobileDrawerOverlay').classList.remove('active');
                    }
                });
            });

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.style.display = 'none';
                    document.body.style.overflow = '';
                });
            }
        }
    };

    setupModal('.philosophy-trigger', 'philosophyModal', '.close-poster'); // Philosophy
    setupModal('#authorModalBtn', 'authorModal', '.close-author');         // Author (Footer Link)

    // ==============================================
    // 3. Business Inquiry Modal
    // ==============================================
    const bizBtn = document.getElementById('bizInquiryBtn');
    const bizModal = document.getElementById('businessInquiryModal');
    const closeBiz = document.querySelector('.close-biz');

    if (bizBtn && bizModal) {
        bizBtn.addEventListener('click', (e) => {
            e.preventDefault();
            bizModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
        if (closeBiz) {
            closeBiz.addEventListener('click', () => {
                bizModal.style.display = 'none';
                document.body.style.overflow = '';
            });
        }
    }

    // ==============================================
    // 4. 打賞 (Tipping) Modal & 複製功能
    // ==============================================
    const tippingBtn = document.getElementById('tippingBtn');
    const tippingModal = document.getElementById('tippingModal');
    const closeTipping = document.querySelector('.close-tipping');

    if (tippingBtn && tippingModal) {
        tippingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            tippingModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
        if (closeTipping) {
            closeTipping.addEventListener('click', () => {
                tippingModal.style.display = 'none';
                document.body.style.overflow = '';
            });
        }
    }

    const copyButtons = document.querySelectorAll('.copy-btn');
    if (copyButtons.length > 0) {
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const address = btn.getAttribute('data-addr');
                try {
                    await navigator.clipboard.writeText(address);
                    handleCopyFeedback(btn);
                } catch (err) {
                    // Fallback for older browsers
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
                        alert('Manual copy required.');
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
        setTimeout(() => {
            btn.textContent = originalText;
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
            e.target.classList.contains('biz-modal') ||
            e.target.classList.contains('author-modal')) {
            closeAllModals();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // ==============================================
    // 6. 手機版側邊抽屜 (Mobile Drawer)
    // ==============================================
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const drawer = document.getElementById('mobileDrawer');
    const overlay = document.getElementById('mobileDrawerOverlay');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');

    function toggleDrawer(isOpen) {
        if (drawer && overlay) {
            if (isOpen) {
                drawer.classList.add('active');
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                drawer.classList.remove('active');
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
    }

    if (hamburgerBtn) hamburgerBtn.addEventListener('click', () => toggleDrawer(true));
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', () => toggleDrawer(false));
    if (overlay) overlay.addEventListener('click', () => toggleDrawer(false));

    // 點擊連結自動關閉
    document.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', () => toggleDrawer(false));
    });

    // ==============================================
    // 7. 首頁自動輪播圖 (Hero Slider)
    // ==============================================
    const slides = document.querySelectorAll('.slide');
    const nextSlideBtn = document.querySelector('.next-btn');
    const prevSlideBtn = document.querySelector('.prev-btn');
    let currentSlide = 0;
    let slideInterval;

    if (slides.length > 0) {
        const showSlide = (index) => {
            slides.forEach((slide, i) => {
                slide.classList.remove('active');
                if (i === index) slide.classList.add('active');
            });
        };

        const nextSlide = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        };

        const startSlideShow = () => {
            if (slideInterval) clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000); 
        };

        showSlide(0);
        startSlideShow();

        if (nextSlideBtn) {
            nextSlideBtn.addEventListener('click', () => {
                nextSlide();
                startSlideShow(); // Reset timer
            });
        }
        
        if (prevSlideBtn) {
            prevSlideBtn.addEventListener('click', () => {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
                startSlideShow(); // Reset timer
            });
        }
    }

    // ==============================================
    // 8. Load More 按鈕 (首頁文章)
    // ==============================================
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const hiddenCards = document.querySelectorAll('.hidden-card');
            hiddenCards.forEach(card => {
                card.style.display = 'block';
                setTimeout(() => card.style.opacity = '1', 10);
            });
            loadMoreBtn.style.display = 'none';
        });
    }

    // ==============================================
    // 9. Back to Top 按鈕
    // ==============================================
    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==============================================
    // 10. Fun Fact Modal (Search by City 頁面)
    // ==============================================
    const openFactBtn = document.getElementById('openFactBtn');
    const factModal = document.getElementById('factModal');
    const closeFactBtn = document.getElementById('closeFactBtn');

    if (openFactBtn && factModal) {
        openFactBtn.addEventListener('click', () => {
            factModal.style.display = 'flex';
            setTimeout(() => factModal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        });

        const closeFact = () => {
            factModal.classList.remove('show');
            setTimeout(() => {
                factModal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        };

        if (closeFactBtn) closeFactBtn.addEventListener('click', closeFact);
        factModal.addEventListener('click', (e) => {
            if (e.target === factModal) closeFact();
        });
    }

});