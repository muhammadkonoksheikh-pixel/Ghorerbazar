import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// --- GET URL PARAMS ---
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// --- DOM ELEMENTS ---
const loadingUi = document.getElementById('loading-ui');
const contentUi = document.getElementById('content-ui');
const mainImage = document.getElementById('main-image');
const qtyInput = document.getElementById('qty-val');
const stockStatusText = document.getElementById('stock-status');

// --- STATE VARIABLES ---
let currentProduct = null;
let currentUser = null;
let selectedQty = 1;
let selectedColor = null;
let selectedSize = null;

// Ensure authentication listener active
onAuthStateChanged(auth, (user) => currentUser = user);

// Load Product on boot
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
            // Ensure compatibility variables
            if(!currentProduct.sizes) currentProduct.sizes = { S:0, M:0, L:0, XL:0, XXL:0 };
            if(!currentProduct.colors) currentProduct.colors = ['Default Color'];
            
            renderProductPage(currentProduct);
        } else {
            Swal.fire('Lost Item', 'This item was removed from the store.', 'error').then(()=> window.location.href = 'index.html');
        }
    } catch (error) {
        console.error("Error Fetching Data:", error);
        loadingUi.innerHTML = "<h3 style='color:red;'>Connection Error. Reload the page.</h3>";
    }
}

function renderProductPage(product) {
    loadingUi.style.display = 'none';
    contentUi.style.display = 'grid';

    // Texts
    document.getElementById('product-category').innerText = product.categoryName || 'Apparel';
    document.getElementById('product-title').innerText = product.name;
    document.getElementById('product-price').innerText = `৳${product.price}`;
    document.getElementById('product-desc').innerHTML = (product.description || 'No description provided').replace(/\n/g, '<br>');

    // Build Gallery Fast & Safe
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
    const thumbCon = document.getElementById('thumb-container');
    thumbCon.innerHTML = thumbHTML;

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

// COLORS Render
function renderColorOptions() {
    let colors = currentProduct.colors;
    if (typeof colors === 'string') {
        colors = colors.split(',').map(c => c.trim()); // For text input splits
    }
    
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
            checkStockMessage();
        });
    });

    // Auto-select if only 1 color exists
    if(btns.length === 1) btns[0].click();
}

// SIZES Render (Depends on DB exact Stock integer)
function renderSizeOptions() {
    const sizeMap = currentProduct.sizes; // Looks like { M: 5, L: 0, XL: 2 }
    let html = '';
    
    // Common sizes for Clothing 
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
            if(btnTarget.classList.contains('out-of-stock')) return; // Ignore click

            btns.forEach(b => b.classList.remove('active'));
            btnTarget.classList.add('active');
            
            selectedSize = btnTarget.getAttribute('data-size');
            
            // Validate Quantity against newly selected Size Max-Limit
            let maxLimit = parseInt(btnTarget.getAttribute('data-stock'));
            if(selectedQty > maxLimit) {
                selectedQty = 1;
                qtyInput.value = 1;
            }
            
            checkStockMessage();
        });
    });
}

function checkStockMessage() {
    if (selectedColor && selectedSize) {
        let maxLimit = parseInt(currentProduct.sizes[selectedSize] || 0);
        stockStatusText.innerHTML = `<span style="color:#2e7d32;"><i class="fas fa-check-circle"></i> We have <b>${maxLimit} in stock</b> for [${selectedSize}, ${selectedColor}]</span>`;
    } else {
        stockStatusText.innerHTML = `<span style="color:#777;"><i class="fas fa-info-circle"></i> Select Size & Color to add to cart</span>`;
    }
}

// Handlers for Add To Cart & Order Now
function setupButtons() {
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (!selectedSize) {
            Swal.fire('Oops!', 'Select your Size first!', 'info'); return;
        }
        let maxLimit = parseInt(currentProduct.sizes[selectedSize]);
        if(selectedQty < maxLimit) {
            selectedQty++;
            qtyInput.value = selectedQty;
        } else {
            Swal.fire('Limit Alert', `Only ${maxLimit} pieces available right now.`, 'warning');
        }
    });

    document.getElementById('qty-minus').addEventListener('click', () => {
        if (selectedQty > 1) {
            selectedQty--;
            qtyInput.value = selectedQty;
        }
    });

    // Submits
    document.getElementById('btn-cart').addEventListener('click', () => processOrderAddition(false));
    document.getElementById('btn-buy').addEventListener('click', () => processOrderAddition(true));
}

// Finally Process The Real Action safely
async function processOrderAddition(goToCheckoutDirectly) {
    // 1. User Safety Log
    if(!currentUser) {
        Swal.fire({
            title: 'Please Login',
            text: 'You must login before adding fashion items to your cart.',
            icon: 'info',
            confirmButtonText: 'Go to Login'
        }).then(r => {
            if(r.isConfirmed) window.location.href='login.html';
        });
        return;
    }

    // 2. Validate Variant Checks
    if(!selectedSize || !selectedColor) {
        Swal.fire('Select Options', 'Please ensure you selected a COLOR and a SIZE to proceed.', 'error');
        return;
    }

    try {
        const primaryBtnId = goToCheckoutDirectly ? 'btn-buy' : 'btn-cart';
        document.getElementById(primaryBtnId).innerHTML = 'Loading...';
        
        // Find if this specific cart variant exists using Composite Queries
        const cartRef = collection(db, "cart");
        const queryMatches = query(cartRef, 
            where("userId", "==", currentUser.uid),
            where("productId", "==", currentProduct.id),
            where("size", "==", selectedSize),
            where("color", "==", selectedColor)
        );

        const snapshotData = await getDocs(queryMatches);
        const imageUrlToSave = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : 'assets/images/placeholder.jpg';

        if (!snapshotData.empty) {
            // Already exist exactly as that size & color -> ADD Quantity together!
            let activeDocRef = snapshotData.docs[0];
            let mathQuantity = activeDocRef.data().quantity + selectedQty;
            
            // Do not cross stock rules!
            const limit = parseInt(currentProduct.sizes[selectedSize]);
            if(mathQuantity > limit) {
                Swal.fire('Limit Overload', `You are trying to cart ${mathQuantity}, but only ${limit} exist!`, 'warning');
                document.getElementById(primaryBtnId).innerHTML = goToCheckoutDirectly ? 'Order Now' : '<i class="fas fa-shopping-cart"></i> Add to Cart';
                return;
            }

            await updateDoc(doc(db, "cart", activeDocRef.id), { quantity: mathQuantity });
        } else {
            // Generate Complete New Item 
            await addDoc(cartRef, {
                userId: currentUser.uid,
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                image: imageUrlToSave,
                quantity: selectedQty,
                size: selectedSize,    // Explicit clothing saving rule
                color: selectedColor,  // Explicit clothing saving rule
                addedAt: serverTimestamp()
            });
        }

        if(goToCheckoutDirectly) {
            window.location.href = 'cart.html';
        } else {
            Swal.fire({
                icon: 'success', 
                title: 'Cart Updated!',
                html: `Size: <b>${selectedSize}</b> & Color: <b>${selectedColor}</b> saved securely.`,
                toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
            });
            document.getElementById('btn-cart').innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
        }

    } catch(errorsObj) {
        Swal.fire("Add Process Failed", errorsObj.message, "error");
        document.getElementById('btn-buy').innerHTML = 'Order Now';
        document.getElementById('btn-cart').innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart';
    }
}
