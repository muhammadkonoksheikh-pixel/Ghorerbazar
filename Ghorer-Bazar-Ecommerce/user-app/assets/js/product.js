import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- DOM ELEMENTS ---
const loaderUI = document.getElementById('fast-loader');
const contentUI = document.getElementById('fast-content');
const mainImage = document.getElementById('main-image');
const qtyInput = document.getElementById('qty-val');
const stockStatusText = document.getElementById('stock-status');

// --- STATE VARIABLES ---
let currentProduct = null;
let sessionUser = null;
let currentQty = 1;
let selectedColor = null;
let selectedSize = null;

// Auth check
onAuthStateChanged(auth, (user) => sessionUser = user);

// Load Product
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) {
    window.location.href = 'index.html';
} else {
    fetchProduct();
}

async function fetchProduct() {
    try {
        const productRef = doc(db, "products", productId);
        const docSnap = await getDoc(productRef);

        if (docSnap.exists()) {
            currentProduct = { id: docSnap.id, ...docSnap.data() };
            
            // Failsafe for older products without variants
            if (!currentProduct.colors) currentProduct.colors = ['Original'];
            if (!currentProduct.sizes) currentProduct.sizes = { S:10, M:10, L:10, XL:10, XXL:10 };
            
            renderProductPage(currentProduct);
        } else {
            Swal.fire('Not Found', 'Product removed or unavailable.', 'error').then(()=> window.location.href = 'index.html');
        }
    } catch (error) {
        console.error("Error Fetching Data:", error);
        loaderUI.innerHTML = "<h3 style='color:red;'>Connection Error. Reload the page.</h3>";
    }
}

function renderProductPage(product) {
    // Instant Display Switch (No loading delay)
    loaderUI.style.display = 'none';
    contentUI.style.display = 'grid';

    // Texts
    document.getElementById('product-category').innerText = product.categoryName || 'Apparel';
    document.getElementById('product-title').innerText = product.name;
    document.getElementById('product-price').innerText = `৳${product.price}`;
    
    // Discount Logic
    if (product.oldPrice && product.oldPrice > product.price) {
        document.getElementById('product-old-price').innerText = `৳${product.oldPrice}`;
        document.getElementById('product-old-price').style.display = 'inline-block';
        
        let discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        document.getElementById('product-discount').innerText = `-${discountPercent}%`;
        document.getElementById('product-discount').style.display = 'inline-block';
    }

    document.getElementById('product-desc').innerHTML = (product.description || 'No description').replace(/\n/g, '<br>');

    // Build Gallery Fast
    let imagesArr = product.images && product.images.length > 0 ? product.images : ['assets/images/placeholder.jpg'];
    mainImage.src = imagesArr[0];
    
    let thumbHTML = '';
    imagesArr.forEach((imgLink, i) => {
        let activeClass = i === 0 ? 'active' : '';
        thumbHTML += `
            <div class="thumb-img ${activeClass}" data-src="${imgLink}">
                <img src="${imgLink}">
            </div>`;
    });
    document.getElementById('thumb-container').innerHTML = thumbHTML;

    // Attach click events to thumbs
    const allThumbs = document.querySelectorAll('.thumb-img');
    allThumbs.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            allThumbs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            mainImage.src = e.currentTarget.getAttribute('data-src');
        });
    });

    renderColorOptions();
    renderSizeOptions();
    setupButtons();
}

// COLORS
function renderColorOptions() {
    let colors = currentProduct.colors;
    if (typeof colors === 'string') colors = colors.split(',').map(c => c.trim());
    
    let html = '';
    colors.forEach(col => {
        if(col) html += `<div class="select-btn color-btn" data-color="${col}">${col}</div>`;
    });
    document.getElementById('color-options').innerHTML = html;

    const btns = document.querySelectorAll('.color-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedColor = e.currentTarget.getAttribute('data-color');
            document.getElementById('disp-color-select').innerText = selectedColor;
            checkStockMessage();
        });
    });

    // Auto-select if only 1 color exists
    if(btns.length === 1) btns[0].click();
}

// SIZES
function renderSizeOptions() {
    const sizeMap = currentProduct.sizes;
    let html = '';
    const orderedSizes = ['S', 'M', 'L', 'XL', 'XXL'];

    orderedSizes.forEach(s => {
        const availableStock = parseInt(sizeMap[s] || 0);
        let outStockClass = availableStock <= 0 ? 'out-of-stock' : '';
        html += `<div class="select-btn size-btn ${outStockClass}" data-size="${s}" data-stock="${availableStock}">${s}</div>`;
    });
    document.getElementById('size-options').innerHTML = html;

    const btns = document.querySelectorAll('.size-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnTarget = e.currentTarget;
            if(btnTarget.classList.contains('out-of-stock')) return; 

            btns.forEach(b => b.classList.remove('active'));
            btnTarget.classList.add('active');
            
            selectedSize = btnTarget.getAttribute('data-size');
            document.getElementById('disp-size-select').innerText = selectedSize;
            
            let maxLimit = parseInt(btnTarget.getAttribute('data-stock'));
            if(currentQty > maxLimit) {
                currentQty = 1;
                qtyInput.value = 1;
            }
            checkStockMessage();
        });
    });
}

function checkStockMessage() {
    if (selectedColor && selectedSize) {
        let maxLimit = parseInt(currentProduct.sizes[selectedSize] || 0);
        stockStatusText.innerHTML = `<span style="color:var(--success);"><i class="fas fa-check-circle"></i> Item Available (${maxLimit} in stock)</span>`;
    } else {
        stockStatusText.innerHTML = `<span style="color:#777;"><i class="fas fa-info-circle"></i> Select Size & Color to add to cart</span>`;
    }
}

// ACTIONS
function setupButtons() {
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (!selectedSize) {
            Swal.fire('Oops!', 'Select your Size first!', 'info'); return;
        }
        let maxLimit = parseInt(currentProduct.sizes[selectedSize]);
        if(currentQty < maxLimit) {
            currentQty++;
            qtyInput.value = currentQty;
        } else {
            Swal.fire('Limit Alert', `Only ${maxLimit} pieces available.`, 'warning');
        }
    });

    document.getElementById('qty-minus').addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            qtyInput.value = currentQty;
        }
    });

    document.getElementById('btn-cart').addEventListener('click', () => processOrderAddition(false));
    document.getElementById('btn-buy').addEventListener('click', () => processOrderAddition(true));
}

// CART ADD PROCESS
async function processOrderAddition(goToCheckout) {
    if(!sessionUser) {
        Swal.fire({
            title: 'Please Login', text: 'You must login before adding items to cart.', icon: 'info', confirmButtonText: 'Go to Login'
        }).then(r => { if(r.isConfirmed) window.location.href='login.html'; });
        return;
    }

    if(!selectedSize || !selectedColor) {
        Swal.fire('Select Options', 'Please select both COLOR and SIZE variations!', 'error');
        return;
    }

    try {
        const btnId = goToCheckout ? 'btn-buy' : 'btn-cart';
        document.getElementById(btnId).innerText = 'Processing...';
        document.getElementById(btnId).disabled = true;
        
        const cartRef = collection(db, "cart");
        const queryMatches = query(cartRef, 
            where("userId", "==", sessionUser.uid),
            where("productId", "==", currentProduct.id),
            where("size", "==", selectedSize),
            where("color", "==", selectedColor)
        );

        const snapshotData = await getDocs(queryMatches);
        const imageUrlToSave = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : 'assets/images/placeholder.jpg';

        if (!snapshotData.empty) {
            let activeDoc = snapshotData.docs[0];
            let newTotalQty = activeDoc.data().quantity + currentQty;
            
            const limit = parseInt(currentProduct.sizes[selectedSize]);
            if(newTotalQty > limit) {
                Swal.fire('Maxed Out!', `Cannot add more. Limit is ${limit} pieces!`, 'warning');
                document.getElementById(btnId).innerHTML = goToCheckout ? 'BUY NOW' : 'ADD TO BAG';
                document.getElementById(btnId).disabled = false;
                return;
            }

            await updateDoc(doc(db, "cart", activeDoc.id), { quantity: newTotalQty });
        } else {
            await addDoc(cartRef, {
                userId: sessionUser.uid,
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                image: imageUrlToSave,
                quantity: currentQty,
                size: selectedSize,    
                color: selectedColor,  
                addedAt: serverTimestamp()
            });
        }

        if(goToCheckout) {
            window.location.href = 'cart.html';
        } else {
            Swal.fire({
                icon: 'success', title: 'Added to Bag!', html: `Size: <b>${selectedSize}</b> | Color: <b>${selectedColor}</b>`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
            });
            document.getElementById(btnId).innerHTML = '<i class="fas fa-shopping-bag"></i> ADD TO BAG';
            document.getElementById(btnId).disabled = false;
        }

    } catch(err) {
        console.error(err);
        Swal.fire("Add Process Failed", err.message, "error");
        document.getElementById(goToCheckout ? 'btn-buy' : 'btn-cart').disabled = false;
    }
}
