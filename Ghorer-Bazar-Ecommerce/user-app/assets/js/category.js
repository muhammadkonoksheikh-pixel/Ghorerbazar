import { db } from './firebase-config.js';
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { auth } from './firebase-config.js'; // Needed if we import addToCart logic locally, but we rely on global or re-declare

const urlParams = new URLSearchParams(window.location.search);
const catId = urlParams.get('id');

const pageTitle = document.getElementById('page-cat-title');
const sidebarList = document.getElementById('sidebar-cat-list');
const productGrid = document.getElementById('cat-product-grid');
const noProductsMsg = document.getElementById('no-products-msg');

document.addEventListener('DOMContentLoaded', async () => {
    await loadSidebarCategories();
    await loadCategoryProducts();
});

async function loadSidebarCategories() {
    try {
        const q = query(collection(db, "categories"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        
        let html = `<li class="${!catId ? 'active' : ''}" onclick="window.location.href='category.html'">All Products</li>`;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const isActive = doc.id === catId ? 'active' : '';
            html += `<li class="${isActive}" onclick="window.location.href='category.html?id=${doc.id}'">${data.name}</li>`;
            
            if (doc.id === catId) {
                pageTitle.innerText = data.name;
            }
        });
        
        sidebarList.innerHTML = html;
    } catch (error) {
        console.error("Error loading categories:", error);
    }
}

async function loadCategoryProducts() {
    try {
        let q;
        if (catId) {
            q = query(collection(db, "products"), where("categoryId", "==", catId));
        } else {
            q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        }

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            productGrid.style.display = 'none';
            noProductsMsg.style.display = 'block';
            return;
        }

        productGrid.style.display = 'grid';
        noProductsMsg.style.display = 'none';

        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const id = doc.id;
            const imgUrl = (data.images && data.images.length > 0) ? data.images[0] : 'assets/images/placeholder.jpg';
            const discount = data.oldPrice ? Math.round(((data.oldPrice - data.price) / data.oldPrice) * 100) : 0;
            const badgeHTML = discount > 0 ? `<div class="product-badge">-${discount}%</div>` : '';

            html += `
                <div class="product-card">
                    ${badgeHTML}
                    <div class="product-img-wrapper" onclick="window.location.href='product.html?id=${id}'">
                        <img src="${imgUrl}" alt="${data.name}" class="product-img">
                    </div>
                    <div class="product-info">
                        <div class="product-category">${data.categoryName || 'General'}</div>
                        <h3 class="product-title" onclick="window.location.href='product.html?id=${id}'">${data.name}</h3>
                        <div class="product-price">
                            <span class="new-price">৳${data.price}</span>
                            ${data.oldPrice ? `<span class="old-price">৳${data.oldPrice}</span>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="btn-add-cart" onclick="window.location.href='product.html?id=${id}'">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productGrid.innerHTML = html;

    } catch (error) {
        console.error("Error loading products:", error);
        productGrid.innerHTML = '<p style="color:red;">Error loading products.</p>';
    }
}