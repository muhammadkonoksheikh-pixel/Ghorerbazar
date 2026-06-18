import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

const loadingEl = document.getElementById('product-loading');
const contentEl = document.getElementById('product-content');

let currentProduct = null;
let currentUser = null;
let selectedQuantity = 1;
let selectedSize = null;    // Newly added property
let stockAvailability = {}; // E.g., {S:10, M:0, L:5...}

onAuthStateChanged(auth, (user) => currentUser = user);

if (!productId) window.location.href = 'index.html';
else fetchProductDetails(productId);

async function fetchProductDetails(id) {
    try {
        const pRef = doc(db, "products", id);
        const snap = await getDoc(pRef);

        if (snap.exists()) {
            currentProduct = { id: snap.id, ...snap.data() };
            // Ensure compatibility (if it's old grocery without sizes, pretend it has an XL just for UI to work)
            stockAvailability = currentProduct.sizes || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
            renderProduct(currentProduct);
        } else {
            Swal.fire('Oops!', 'Product no longer exists.', 'error').then(()=>window.location.href='index.html');
        }
    } catch (e) { console.error(e); }
}

function renderProduct(p) {
    loadingEl.style.display = 'none'; contentEl.style.display = 'block';

    document.getElementById('pd-category').innerText = p.categoryName || 'Apparel';
    document.getElementById('pd-title').innerText = p.name;
    document.getElementById('pd-price').innerText = `৳${p.price}`;

    // Images Processing
    const mainImg = document.getElementById('main-image');
    let images = p.images || ['assets/images/placeholder.jpg'];
    if(images.length===0) images = ['assets/images/placeholder.jpg'];
    mainImg.src = images[0];

    const thumbCon = document.getElementById('thumb-gallery');
    if(images.length > 1) {
        images.forEach((img, i) => {
            thumbCon.innerHTML += `<div class="thumb-item ${i===0?'active':''}" data-src="${img}"><img src="${img}"></div>`;
        });
        document.querySelectorAll('.thumb-item').forEach(item => {
            item.addEventListener('click', e => {
                document.querySelectorAll('.thumb-item').forEach(t=>t.classList.remove('active'));
                const tar = e.currentTarget; tar.classList.add('active');
                mainImg.src = tar.getAttribute('data-src');
            });
        });
    }

    document.getElementById('pd-short-desc').innerText = (p.description||'').substring(0, 150) + '...';
    document.getElementById('tab-desc').innerHTML = `<h3>Description</h3><br><p>${(p.description||'').replace(/\n/g, '<br>')}</p>`;

    renderSizes();
    setupCartActions();
}

function renderSizes() {
    const sizeCon = document.getElementById('size-options-container');
    const liveStockText = document.getElementById('live-stock-text');
    let sizeHTML = '';

    // Generating [S] [M] [L] Buttons based on what Admin filled. 
    ['S', 'M', 'L', 'XL', 'XXL'].forEach(size => {
        let quantityAvailable = parseInt(stockAvailability[size] || 0);
        let extraClass = quantityAvailable > 0 ? '' : 'out-of-stock';
        
        sizeHTML += `<button class="size-btn ${extraClass}" data-size="${size}" data-qty="${quantityAvailable}">${size}</button>`;
    });

    sizeCon.innerHTML = sizeHTML;

    // Handle User click on Sizes
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            if(e.currentTarget.classList.contains('out-of-stock')) return;

            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            const b = e.currentTarget;
            b.classList.add('active');
            selectedSize = b.getAttribute('data-size');
            let q = parseInt(b.getAttribute('data-qty'));

            // Live Update label
            liveStockText.innerHTML = `<span class="stock-ok"><i class="fas fa-check-circle"></i> Item Available (${q} in stock for ${selectedSize})</span>`;
            
            // If they had quantity typed as '5' but only 3 left in L size
            const qtyInput = document.getElementById('pd-qty-input');
            if (parseInt(qtyInput.value) > q) {
                selectedQuantity = 1;
                qtyInput.value = 1;
                Swal.fire('Notice', `Quantity reduced. Only ${q} pieces available for size ${selectedSize}.`, 'info');
            }
        });
    });
}

function setupCartActions() {
    const qtyInput = document.getElementById('pd-qty-input');
    
    document.getElementById('pd-qty-plus').addEventListener('click', () => {
        if (!selectedSize) { Swal.fire('Wait', 'Select a size first!', 'warning'); return; }
        let maxLimit = stockAvailability[selectedSize];
        
        if (selectedQuantity < maxLimit) {
            selectedQuantity++; qtyInput.value = selectedQuantity;
        } else {
            Swal.fire('Stock Limit', `Only ${maxLimit} piece(s) available in this size.`, 'warning');
        }
    });
    
    document.getElementById('pd-qty-minus').addEventListener('click', () => {
        if (selectedQuantity > 1) { selectedQuantity--; qtyInput.value = selectedQuantity; }
    });

    document.getElementById('btn-add-to-cart').addEventListener('click', async () => handleAdd(false));
    document.getElementById('btn-buy-now').addEventListener('click', async () => handleAdd(true));
}

async function handleAdd(isBuyNow = false) {
    if(!currentUser) {
        Swal.fire({icon: 'info', title: 'Login Required', confirmButtonText: 'Go to Login'})
        .then(()=> window.location.href='login.html'); 
        return;
    }

    if (!selectedSize) {
        Swal.fire('Size Required', 'Please select a clothing size (S, M, L...) to continue.', 'error');
        return;
    }

    try {
        const btnId = isBuyNow ? 'btn-buy-now' : 'btn-add-to-cart';
        document.getElementById(btnId).innerHTML = 'Loading...';

        const cartRef = collection(db, "cart");
        // We match exactly Product AND Specific Size inside the query to keep variants separated!
        const q = query(cartRef, where("userId", "==", currentUser.uid), where("productId", "==", currentProduct.id), where("size", "==", selectedSize));
        const snap = await getDocs(q);

        const imgUrl = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : 'assets/images/placeholder.jpg';

        if (!snap.empty) {
            const currentQty = snap.docs[0].data().quantity;
            let checkMax = currentQty + selectedQuantity;
            
            if (checkMax > stockAvailability[selectedSize]) {
                Swal.fire('Limit Reached', `You can't add more. Only ${stockAvailability[selectedSize]} left for Size ${selectedSize} & it's already in your cart!`, 'error');
                document.getElementById(btnId).innerHTML = isBuyNow ? 'Order Now' : 'Add To Bag';
                return;
            }
            await updateDoc(doc(db, "cart", snap.docs[0].id), { quantity: checkMax });
        } else {
            await addDoc(cartRef, {
                userId: currentUser.uid,
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                size: selectedSize,       // The vital element saved here
                image: imgUrl,
                quantity: selectedQuantity,
                addedAt: serverTimestamp()
            });
        }

        if (isBuyNow) window.location.href = 'cart.html';
        else {
            Swal.fire({ icon:'success', title:'Added to Cart', html:`Added <b>${currentProduct.name} - Size ${selectedSize}</b> successfully.`, toast:true, position:'top-end', timer:3000, showConfirmButton:false });
            document.getElementById(btnId).innerHTML = '<i class="fas fa-shopping-bag"></i> Add To Bag';
        }
    } catch (e) {
        console.error(e);
        Swal.fire('Error', e.message, 'error');
    }
}
