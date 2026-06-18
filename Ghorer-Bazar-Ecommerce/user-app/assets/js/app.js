import { db, auth } from './firebase-config.js';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Utility Functions
const formatPrice = (price) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT' }).format(price);
};

// ==========================================
// Load Home Page Data
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Only run these on index.html
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
        const q = query(collection(db, "categories"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = '<p>No categories found.</p>';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            html += `
                <div class="category-card" onclick="window.location.href='category.html?id=${doc.id}'" data-aos="zoom-in">
                    <img src="${data.image || 'assets/images/placeholder.jpg'}" alt="${data.name}" class="category-img" loading="lazy">
                    <h4>${data.name}</h4>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (error) {
        console.error("Error loading categories:", error);
        container.innerHTML = '<p>Error loading categories.</p>';
    }
}

// Load Hero Banners
async function loadBanners() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;

    try {
        const q = query(collection(db, "banners"), where("isActive", "==", true), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            // Placeholder Banner
            container.innerHTML = `
                <div class="swiper-slide hero-slide" style="background-image: url('https://res.cloudinary.com/dtmvxrmwg/image/upload/v1/banners/default-banner.jpg');">
                    <div class="hero-content">
                        <h1>Fresh & Organic Groceries</h1>
                        <p>Get up to 50% off on your first order. Quality guaranteed.</p>
                        <a href="category.html" class="btn btn-primary">Shop Now</a>
                    </div>
                </div>`;
        } else {
            let html = '';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                    <div class="swiper-slide hero-slide" style="background-image: url('${data.imageUrl}');">
                        <div class="hero-content">
                            <h1>${data.title}</h1>
                            <p>${data.subtitle}</p>
                            <a href="${data.link || 'category.html'}" class="btn btn-primary">Shop Now</a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }

        // Init Swiper for Hero
        new Swiper(".heroSwiper", {
            spaceBetween: 30,
            effect: "fade",
            loop: true,
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: true,
            },
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
        });

    } catch (error) {
        console.error("Error loading banners:", error);
    }
}

// Load Flash Sale Products
async function loadFlashSale() {
    const container = document.getElementById('flash-products-container');
    if (!container) return;

    try {
        const q = query(collection(db, "products"), where("isFlashSale", "==", true), limit(6));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            document.querySelector('.flash-sale-section').style.display = 'none';
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            html += generateProductCard(doc.id, doc.data(), true);
        });
        container.innerHTML = html;

        // Init Swiper for Flash Sale
        new Swiper(".flashSwiper", {
            slidesPerView: 1,
            spaceBetween: 10,
            breakpoints: {
                640: { slidesPerView: 2, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 30 },
                1024: { slidesPerView: 4, spaceBetween: 30 },
            }
        });

        // Simple Countdown
        startCountdown();

    } catch (error) {
        console.error("Error loading flash sale:", error);
    }
}

// Load Featured Products
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products-container');
    if (!container) return;

    try {
        const q = query(collection(db, "products"), where("isFeatured", "==", true), limit(8));
        const snapshot = await getDocs(q);
        
        let html = '';
        snapshot.forEach(doc => {
            html += generateProductCard(doc.id, doc.data());
        });
        container.innerHTML = html || '<p>No featured products available.</p>';
    } catch (error) {
        console.error("Error loading featured:", error);
    }
}

// Load Latest Products
async function loadLatestProducts() {
    const container = document.getElementById('latest-products-container');
    if (!container) return;

    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(12));
        const snapshot = await getDocs(q);
        
        let html = '';
        snapshot.forEach(doc => {
            html += generateProductCard(doc.id, doc.data());
        });
        container.innerHTML = html || '<p>No products available.</p>';
    } catch (error) {
        console.error("Error loading latest:", error);
    }
}

// HTML Generator for Product Card
function generateProductCard(id, data, isSwiperSlide = false) {
    const discount = data.oldPrice ? Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100) : 0;
    const badgeHTML = discount > 0 ? `<div class="product-badge">-${discount}%</div>` : '';
    const imgUrl = data.images && data.images.length > 0 ? data.images[0] : 'assets/images/placeholder.jpg';
    
    return `
        <div class="${isSwiperSlide ? 'swiper-slide' : ''} product-card" data-aos="fade-up">
            ${badgeHTML}
            <div class="product-wishlist" onclick="toggleWishlist('${id}')">
                <i class="fas fa-heart"></i>
            </div>
            <div class="product-img-wrapper" onclick="window.location.href='product.html?id=${id}'">
                <img src="${imgUrl}" alt="${data.name}" class="product-img" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-category">${data.categoryName || 'General'}</div>
                <h3 class="product-title" onclick="window.location.href='product.html?id=${id}'">${data.name}</h3>
                <div class="product-price">
                    <span class="new-price">৳${data.price}</span>
                    ${data.oldPrice ? `<span class="old-price">৳${data.oldPrice}</span>` : ''}
                </div>
                <div class="product-actions">
                    <button class="btn-add-cart" onclick="addToCart('${id}', '${data.name}', ${data.price}, '${imgUrl}')">
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Countdown Timer logic for Flash Sale
function startCountdown() {
    let hours = 23, minutes = 59, seconds = 59;
    const hEl = document.getElementById('hours');
    const mEl = document.getElementById('minutes');
    const sEl = document.getElementById('seconds');

    if(!hEl || !mEl || !sEl) return;

    setInterval(() => {
        seconds--;
        if (seconds < 0) { seconds = 59; minutes--; }
        if (minutes < 0) { minutes = 59; hours--; }
        if (hours < 0) { hours = 24; }

        hEl.innerText = hours < 10 ? '0' + hours : hours;
        mEl.innerText = minutes < 10 ? '0' + minutes : minutes;
        sEl.innerText = seconds < 10 ? '0' + seconds : seconds;
    }, 1000);
}

// Global Cart Function
window.addToCart = async function(productId, name, price, image) {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire({
            icon: 'info',
            title: 'Please Login',
            text: 'You need to login to add items to cart',
            showCancelButton: true,
            confirmButtonText: 'Login Now',
            confirmButtonColor: '#2e7d32'
        }).then((result) => {
            if (result.isConfirmed) window.location.href = 'login.html';
        });
        return;
    }

    try {
        // Check if item already in cart
        const cartRef = collection(db, "cart");
        const q = query(cartRef, where("userId", "==", user.uid), where("productId", "==", productId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Update quantity
            const docId = snapshot.docs[0].id;
            const currentQty = snapshot.docs[0].data().quantity;
            await setDoc(doc(db, "cart", docId), { quantity: currentQty + 1 }, { merge: true });
        } else {
            // Add new item
            await addDoc(cartRef, {
                userId: user.uid,
                productId: productId,
                name: name,
                price: price,
                image: image,
                quantity: 1,
                addedAt: serverTimestamp()
            });
        }

        Swal.fire({
            icon: 'success',
            title: 'Added to Cart',
            text: `${name} has been added to your cart.`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });

    } catch (error) {
        console.error("Error adding to cart:", error);
        Swal.fire('Error', 'Failed to add item to cart', 'error');
    }
}

// Global Wishlist Function
window.toggleWishlist = async function(productId) {
    const user = auth.currentUser;
    if (!user) {
        Swal.fire('Please Login', 'Login required to add to wishlist', 'info');
        return;
    }

    try {
        const wishlistRef = collection(db, "wishlist");
        const q = query(wishlistRef, where("userId", "==", user.uid), where("productId", "==", productId));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Remove from wishlist
            await deleteDoc(doc(db, "wishlist", snapshot.docs[0].id));
            Swal.fire({ icon: 'success', title: 'Removed', text: 'Item removed from wishlist', toast:true, position:'top-end', timer: 2000, showConfirmButton:false });
        } else {
            // Add to wishlist
            await addDoc(wishlistRef, {
                userId: user.uid,
                productId: productId,
                addedAt: serverTimestamp()
            });
            Swal.fire({ icon: 'success', title: 'Added', text: 'Item added to wishlist', toast:true, position:'top-end', timer: 2000, showConfirmButton:false });
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
    }
}