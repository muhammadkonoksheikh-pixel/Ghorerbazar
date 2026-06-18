import { db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('categories-container')) {
        await loadCategories();
        await loadBanners();
        await loadFlashSale();
        await loadFeaturedProducts();
        await loadLatestProducts();
    }
});

// Load Categories
async function loadCategories() {
    const container = document.getElementById('categories-container');
    if (!container) return;
    try {
        const snapshot = await getDocs(query(collection(db, "categories"), orderBy("order", "asc")));
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="category-card" onclick="window.location.href='category.html?id=${doc.id}'" data-aos="zoom-in">
                    <img src="${data.image || 'assets/images/placeholder.jpg'}" alt="${data.name}" class="category-img">
                    <h4>${data.name}</h4>
                </div>`;
        });
        container.innerHTML = html || '<p>No collections found.</p>';
    } catch (e) { container.innerHTML = ''; }
}

// Load Hero Banners (Fallback Updated to Fashion Theme)
async function loadBanners() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;
    try {
        const snapshot = await getDocs(query(collection(db, "banners"), where("isActive", "==", true), orderBy("order", "asc")));
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="swiper-slide hero-slide" style="background-image: url('https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1200&auto=format&fit=crop');">
                    <div class="hero-content">
                        <h1 style="color:#fff;">New Arrival Extravaganza</h1>
                        <p style="color:#eee;">Discover our trending styles and upgrade your wardrobe today!</p>
                        <a href="category.html" class="btn btn-primary">Shop Collection</a>
                    </div>
                </div>`;
        } else {
            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                    <div class="swiper-slide hero-slide" style="background-image: url('${data.imageUrl}');">
                        <div class="hero-content">
                            <h1 style="text-shadow: 2px 2px 8px rgba(0,0,0,0.5);">${data.title}</h1>
                            <p style="text-shadow: 1px 1px 5px rgba(0,0,0,0.5); font-weight: 500;">${data.subtitle}</p>
                            <a href="${data.link || 'category.html'}" class="btn btn-primary">Discover</a>
                        </div>
                    </div>`;
            });
            container.innerHTML = html;
        }
        new Swiper(".heroSwiper", { spaceBetween:30, effect:"fade", loop:true, autoplay:{delay:4000, disableOnInteraction:false}, pagination:{el:".swiper-pagination",clickable:true}, navigation:{nextEl:".swiper-button-next", prevEl:".swiper-button-prev"} });
    } catch (e) { }
}

// Global Products UI Structure (Updated "Add to Cart" to "Select Options" to enforce size picking)
function generateProductCard(id, data, isSwiperSlide = false) {
    const discount = data.oldPrice ? Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100) : 0;
    const badgeHTML = discount > 0 ? `<div class="product-badge">-${discount}%</div>` : '';
    const imgUrl = data.images && data.images.length > 0 ? data.images[0] : 'assets/images/placeholder.jpg';
    
    // Quick stock checking for card logic (Sum of sizes if they exist, or normal stock check)
    let totalStock = 0;
    if(data.sizes) {
        totalStock = (data.sizes.S || 0) + (data.sizes.M || 0) + (data.sizes.L || 0) + (data.sizes.XL || 0) + (data.sizes.XXL || 0);
    }
    const outOfStockLabel = (totalStock === 0 && data.sizes) ? `<div style="color:var(--danger); font-size:0.8rem; font-weight:700;">SOLD OUT</div>` : '';

    return `
        <div class="${isSwiperSlide ? 'swiper-slide' : ''} product-card" data-aos="fade-up">
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

// Fetchers (Same exact queries as before but invoking new design)
async function loadFlashSale() {
    const c = document.getElementById('flash-products-container');
    if (!c) return;
    try {
        const s = await getDocs(query(collection(db,"products"), where("isFlashSale","==",true), limit(6)));
        if (s.empty) { document.querySelector('.flash-sale-section').style.display='none'; return; }
        let h = ''; s.forEach(doc => h += generateProductCard(doc.id, doc.data(), true));
        c.innerHTML = h;
        new Swiper(".flashSwiper", { slidesPerView:1, spaceBetween:10, breakpoints:{640:{slidesPerView:2, spaceBetween:20},768:{slidesPerView:3, spaceBetween:30},1024:{slidesPerView:4, spaceBetween:30}}});
    } catch(e){}
}
async function loadFeaturedProducts() {
    const c = document.getElementById('featured-products-container'); if(!c) return;
    try {
        const s = await getDocs(query(collection(db,"products"), where("isFeatured","==",true), limit(8)));
        let h=''; s.forEach(doc=>h+=generateProductCard(doc.id, doc.data())); c.innerHTML=h;
    }catch(e){}
}
async function loadLatestProducts() {
    const c = document.getElementById('latest-products-container'); if(!c) return;
    try{
        const s = await getDocs(query(collection(db,"products"), orderBy("createdAt","desc"), limit(12)));
        let h=''; s.forEach(doc=>h+=generateProductCard(doc.id, doc.data())); c.innerHTML=h;
    }catch(e){}
}
