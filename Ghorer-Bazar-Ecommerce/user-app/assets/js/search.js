import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const queryTerm = urlParams.get('q');

const displayQuery = document.getElementById('search-query-display');
const displayCount = document.getElementById('search-count-display');
const productGrid = document.getElementById('search-product-grid');
const noSearchMsg = document.getElementById('no-search-msg');
const searchInput = document.getElementById('search-page-input');

document.getElementById('search-page-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) window.location.href = `search.html?q=${encodeURIComponent(q)}`;
});

document.addEventListener('DOMContentLoaded', async () => {
    if (queryTerm) {
        searchInput.value = queryTerm;
        displayQuery.innerText = `"${queryTerm}"`;
        await executeSearch(queryTerm.toLowerCase());
    } else {
        displayQuery.innerText = `"Nothing"`;
        productGrid.style.display = 'none';
        noSearchMsg.style.display = 'block';
    }
});

async function executeSearch(term) {
    try {
        // In a real production app with large DB, use Algolia/Typesense.
        // For standard Firebase, we fetch all active products and filter client-side.
        const snapshot = await getDocs(collection(db, "products"));
        
        let results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Simple text search on name or category name
            if (
                (data.name && data.name.toLowerCase().includes(term)) ||
                (data.categoryName && data.categoryName.toLowerCase().includes(term))
            ) {
                results.push({ id: doc.id, ...data });
            }
        });

        displayCount.innerText = `${results.length} products found`;

        if (results.length === 0) {
            productGrid.style.display = 'none';
            noSearchMsg.style.display = 'block';
            return;
        }

        productGrid.style.display = 'grid';
        noSearchMsg.style.display = 'none';

        let html = '';
        results.forEach(data => {
            const imgUrl = (data.images && data.images.length > 0) ? data.images[0] : 'assets/images/placeholder.jpg';
            html += `
                <div class="product-card">
                    <div class="product-img-wrapper" onclick="window.location.href='product.html?id=${data.id}'">
                        <img src="${imgUrl}" alt="${data.name}" class="product-img">
                    </div>
                    <div class="product-info">
                        <div class="product-category">${data.categoryName || 'General'}</div>
                        <h3 class="product-title" onclick="window.location.href='product.html?id=${data.id}'">${data.name}</h3>
                        <div class="product-price">
                            <span class="new-price">৳${data.price}</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-add-cart" onclick="window.location.href='product.html?id=${data.id}'">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productGrid.innerHTML = html;

    } catch (error) {
        console.error("Search error:", error);
        productGrid.innerHTML = '<p style="color:red;">Error performing search.</p>';
    }
}