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
    // 1. 搜尋 Modal 功能 (Search Modal)
    // ==============================================
    const searchBtn = document.getElementById('searchBtn');
    const searchModal = document.getElementById('searchModal');
    const closeSearch = document.querySelector('.close-search');

    if (searchBtn && searchModal) {
        searchBtn.addEventListener('click', () => {
            searchModal.style.display = 'flex';
        });
        if (closeSearch) {
            closeSearch.addEventListener('click', () => searchModal.style.display = 'none');
        }
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
    // 6. 強力修復：手機版 MORE 選單 & Modal 綁定
    // ==============================================
    const mBtn = document.getElementById('mobileMoreBtn');
    const mMenu = document.getElementById('mobileMoreMenu');

    if (mBtn && mMenu) {
        // 先移除舊的監聽器 (防止重複綁定)
        const newBtn = mBtn.cloneNode(true);
        mBtn.parentNode.replaceChild(newBtn, mBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // 阻止事件冒泡
            console.log("Mobile More Clicked"); // 測試用

            if (mMenu.style.display === 'none' || mMenu.style.display === '') {
                mMenu.style.display = 'block';
                newBtn.innerText = 'CLOSE -';
                newBtn.style.color = '#333';
            } else {
                mMenu.style.display = 'none';
                newBtn.innerText = 'MORE +';
                newBtn.style.color = '';
            }
        });
    }

    // 手機版選單內的按鈕觸發彈窗
    const bindMobileModal = (btnId, modalId) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                // 點開 Modal 後自動收起 MORE 選單
                if (mMenu) mMenu.style.display = 'none';
                
                // 重新抓取按鈕 (因為上面可能被 cloneNode 換掉了)
                const currentBtn = document.getElementById('mobileMoreBtn');
                if (currentBtn) {
                    currentBtn.innerText = 'MORE +';
                    currentBtn.style.color = '';
                }
            });
        }
    };

    bindMobileModal('philosophyBtnMobile', 'philosophyModal');
    bindMobileModal('bizInquiryBtnMobile', 'businessInquiryModal');
    bindMobileModal('tippingBtnMobile', 'tippingModal');


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
        window.addEventListener('scroll', () => {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPosition = window.scrollY;
            if (scrollPosition > totalHeight / 2) {
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