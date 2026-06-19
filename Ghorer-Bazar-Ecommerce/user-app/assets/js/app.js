import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('categories-container')) {
        // Parallel fetching for faster load
        Promise.all([
            loadCategories(),
            loadBanners(),
            loadFeaturedProducts(),
            loadLatestProducts()
        ]);
    }
});

// 1. Categories - 1-Line Small UI
async function loadCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    try {
        const snapshot = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="cat-item-small" onclick="window.location.href='category.html?id=${doc.id}'">
                    <div class="cat-img-box">
                        <img src="${data.image || 'assets/images/placeholder.jpg'}" alt="${data.name}">
                    </div>
                    <span>${data.name}</span>
                </div>`;
        });
        container.innerHTML = html || '<p>No collections found.</p>';
    } catch (e) { console.error("Categories error:", e); container.innerHTML = ''; }
}

// 2. Banner Fix - Local Filter & Sort (NO INDEX REQUIRED!)
async function loadBanners() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;
    try {
        // Simple query without compound clauses to avoid index errors completely
        const snapshot = await getDocs(collection(db, "banners"));
        
        let bannersList = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            // Filter locally in Javascript
            if (data.isActive !== false) { 
                bannersList.push({ id: docSnap.id, ...data });
            }
        });

        // Sort locally in Javascript by order key
        bannersList.sort((a, b) => (a.order || 0) - (b.order || 0));

        let html = '';
        if (bannersList.length === 0) {
            // High quality fallback fashion banner
            html = `
                <div class="swiper-slide hero-slide" style="background-image: url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop'); background-color: #222;">
                    <div class="hero-content">
                        <h1 style="color:#fff;">New Arrival Extravaganza</h1>
                        <p style="color:#eee;">Discover our trending styles and upgrade your wardrobe today!</p>
                        <a href="category.html" class="btn btn-primary">Shop Collection</a>
                    </div>
                </div>`;
        } else {
            bannersList.forEach(data => {
                html += `
                    <div class="swiper-slide hero-slide" style="background-image: url('${data.imageUrl}'); background-color: #222;">
                        <div class="hero-content">
                            <h1 style="text-shadow: 2px 2px 8px rgba(0,0,0,0.5);">${data.title}</h1>
                            <p style="text-shadow: 1px 1px 5px rgba(0,0,0,0.5); font-weight: 500;">${data.subtitle}</p>
                            <a href="${data.link || 'category.html'}" class="btn btn-primary">Discover</a>
                        </div>
                    </div>`;
            });
        }
        
        container.innerHTML = html;

        // Initialize Swiper with observers
        new Swiper(".heroSwiper", { 
            spaceBetween: 0, 
            effect: "fade", 
            loop: true, 
            observer: true,             
            observeParents: true,       
            autoplay: { delay: 4000, disableOnInteraction: false }, 
            pagination: { el: ".swiper-pagination", clickable: true }, 
            navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" } 
        });

    } catch (e) {
        console.error("Banner loading process failed:", e);
    }
}

// General Product Card Generator
function generateProductCard(id, data, isSmall = false) {
    const discount = data.oldPrice ? Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100) : 0;
    const badgeHTML = discount > 0 ? `<div class="product-badge">-${discount}%</div>` : '';
    let imgUrl = 'assets/images/placeholder.jpg';
    
    if (data.variants && data.variants.length > 0 && data.variants[0].imageUrl) {
        imgUrl = data.variants[0].imageUrl;
    } else if (data.images && data.images.length > 0) {
        imgUrl = data.images[0];
    }
    
    let totalStock = 0;
    if(data.sizes) {
        totalStock = (data.sizes.S || 0) + (data.sizes.M || 0) + (data.sizes.L || 0) + (data.sizes.XL || 0) + (data.sizes.XXL || 0);
    }
    const outOfStockLabel = (totalStock === 0 && data.sizes) ? `<div style="color:var(--danger); font-size:0.8rem; font-weight:700;">SOLD OUT</div>` : '';

    return `
        <div class="product-card" data-aos="fade-up">
            ${badgeHTML}
            <div class="product-img-wrapper" onclick="window.location.href='product.html?id=${id}'">
                <img src="${imgUrl}" alt="${data.name}" class="product-img" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${data.categoryName || 'Apparel'}</div>
                <h3 class="product-title" onclick="window.location.href='product.html?id=${id}'">${data.name}</h3>
                ${outOfStockLabel}
                <div class="product-price">
                    <span class="new-price">৳${data.price}</span>
                    ${data.oldPrice ? `<span class="old-price">৳${data.oldPrice}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="window.location.href='product.html?id=${id}'">
                        <i class="fas fa-sliders-h"></i> View Options
                    </button>
                </div>
            </div>
        </div>`;
}

// 3. Trending Apparels 
async function loadFeaturedProducts() {
    const c = document.getElementById('featured-products-container'); 
    if(!c) return;
    try {
        const s = await getDocs(query(collection(db,"products"), where("isFeatured","==",true), limit(20)));
        let h=''; s.forEach(doc => h += generateProductCard(doc.id, doc.data(), false)); c.innerHTML=h;
    } catch(e){ console.error("Featured error:", e); }
}

// 4. New Arrivals
async function loadLatestProducts() {
    const c = document.getElementById('latest-products-container'); 
    if(!c) return;
    try{
        const s = await getDocs(query(collection(db,"products"), orderBy("createdAt","desc"), limit(4)));
        let h=''; s.forEach(doc => h += generateProductCard(doc.id, doc.data(), true)); c.innerHTML=h;
    } catch(e){ console.error("Latest error:", e); }
}
