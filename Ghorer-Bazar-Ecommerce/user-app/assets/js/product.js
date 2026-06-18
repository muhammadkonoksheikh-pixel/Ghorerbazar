import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const loadingBox = document.getElementById('loading-box');
const contentBox = document.getElementById('content-box');
const mainImg = document.getElementById('main-image');
const qtyInput = document.getElementById('qty-input');
const stockNotice = document.getElementById('stock-notice');

// States
let currentProduct = null;
let sessionUser = null;
let currentQty = 1;
let selectedColor = null;
let selectedSize = null;

// Auth check
onAuthStateChanged(auth, (user) => {
    sessionUser = user;
});

// URL ID get
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) {
    window.location.href = 'index.html';
} else {
    loadData(productId);
}

// Fetch DB Function
async function loadData(id) {
    try {
        const productRef = doc(db, "products", id);
        const snapshot = await getDoc(productRef);

        if (snapshot.exists()) {
            currentProduct = { id: snapshot.id, ...snapshot.data() };
            
            // Fashion properties mapping if missing
            if (!currentProduct.colors) currentProduct.colors = ['Original'];
            if (!currentProduct.sizes) currentProduct.sizes = { S:0, M:0, L:0, XL:0, XXL:0 };
            
            renderData(currentProduct);
        } else {
            Swal.fire('Out of Stock', 'Product not found', 'error').then(()=> window.location.href='index.html');
        }
    } catch (e) {
        console.error(e);
        loadingBox.innerHTML = "<h3 style='color:red;'>Failed to connect database.</h3>";
    }
}

// UI Mapping
function renderData(data) {
    loadingBox.style.display = 'none';
    contentBox.style.display = 'grid';

    document.getElementById('product-cat').innerText = data.categoryName || 'Apparel';
    document.getElementById('product-title').innerText = data.name;
    document.getElementById('product-price').innerText = `৳${data.price}`;
    
    if (data.oldPrice && data.oldPrice > data.price) {
        document.getElementById('product-oldPrice').innerText = `৳${data.oldPrice}`;
        document.getElementById('product-oldPrice').style.display = 'inline-block';
    }

    document.getElementById('product-desc').innerHTML = (data.description || '').replace(/\n/g, '<br>');

    // Gallery Render
    let imagesList = (data.images && data.images.length > 0) ? data.images : ['assets/images/placeholder.jpg'];
    mainImg.src = imagesList[0];
    
    let thumbsHtml = '';
    imagesList.forEach((srcLink, idx) => {
        let active = idx === 0 ? 'active' : '';
        thumbsHtml += `
            <div class="thumb-img ${active}" data-src="${srcLink}">
                <img src="${srcLink}">
            </div>`;
    });
    document.getElementById('thumb-container').innerHTML = thumbsHtml;

    document.querySelectorAll('.thumb-img').forEach(tBox => {
        tBox.addEventListener('click', (e) => {
            document.querySelectorAll('.thumb-img').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            mainImg.src = e.currentTarget.getAttribute('data-src');
        });
    });

    renderVariants();
    setupButtons();
}

// Draw Size & Colors
function renderVariants() {
    // Render Colors
    let rawColors = currentProduct.colors;
    if(typeof rawColors === 'string') rawColors = rawColors.split(',').map(s=>s.trim());
    
    let cHtml = '';
    rawColors.forEach(c => {
        if(c) cHtml += `<div class="select-btn color-btn" data-color="${c}">${c}</div>`;
    });
    document.getElementById('color-options').innerHTML = cHtml;

    // Attach click to colors
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.color-btn').forEach(b=>b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedColor = e.currentTarget.getAttribute('data-color');
            checkInventory();
        });
    });

    // Auto click color if only one exists
    const colorBtnElements = document.querySelectorAll('.color-btn');
    if(colorBtnElements.length === 1) colorBtnElements[0].click();


    // Render Sizes based on Stock
    const standardSizes = ['S', 'M', 'L', 'XL', 'XXL'];
    let sHtml = '';
    standardSizes.forEach(sz => {
        let stkLimit = parseInt(currentProduct.sizes[sz] || 0);
        let blockClass = stkLimit > 0 ? '' : 'disabled';
        sHtml += `<div class="select-btn size-btn ${blockClass}" data-size="${sz}" data-max="${stkLimit}">${sz}</div>`;
    });
    document.getElementById('size-options').innerHTML = sHtml;

    // Attach click to sizes
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            let el = e.currentTarget;
            if(el.classList.contains('disabled')) return;
            
            document.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));
            el.classList.add('active');
            selectedSize = el.getAttribute('data-size');
            
            // Adjust running qty to size max bound
            let szMax = parseInt(el.getAttribute('data-max'));
            if(currentQty > szMax) {
                currentQty = 1; 
                qtyInput.value = currentQty;
            }
            checkInventory();
        });
    });
}

function checkInventory() {
    if(selectedSize && selectedColor) {
        let maxAvailable = parseInt(currentProduct.sizes[selectedSize] || 0);
        stockNotice.innerHTML = `<div><i class="fas fa-check-circle"></i> Excellent! We have ${maxAvailable} available.</div>`;
    }
}

// User Actions Controller
function setupButtons() {
    // Plus
    document.getElementById('btn-plus').addEventListener('click', () => {
        if(!selectedSize) { Swal.fire('Select Size', 'Please click a size block first.', 'info'); return; }
        
        let stockMaxLimit = parseInt(currentProduct.sizes[selectedSize] || 0);
        if (currentQty < stockMaxLimit) {
            currentQty++;
            qtyInput.value = currentQty;
        } else {
            Swal.fire('Limit Reached', `Only ${stockMaxLimit} unit(s) left in stock for size ${selectedSize}`, 'warning');
        }
    });

    // Minus
    document.getElementById('btn-minus').addEventListener('click', () => {
        if (currentQty > 1) {
            currentQty--;
            qtyInput.value = currentQty;
        }
    });

    document.getElementById('btn-add-cart').addEventListener('click', () => pushDataToCartDB(false));
    document.getElementById('btn-buy-now').addEventListener('click', () => pushDataToCartDB(true));
}

async function pushDataToCartDB(redirectDirectly) {
    if(!sessionUser) {
        Swal.fire({icon: 'info', title: 'Login', text:'Login to secure your outfit selection.'}).then(r=> {
            if(r.isConfirmed) window.location.href = 'login.html';
        });
        return;
    }
    if(!selectedSize || !selectedColor) {
        Swal.fire('Incomplete', 'Please select both COLOR and SIZE variations!', 'error');
        return;
    }

    try {
        const domTargetBtn = document.getElementById(redirectDirectly ? 'btn-buy-now' : 'btn-add-cart');
        domTargetBtn.innerText = 'Working...';
        domTargetBtn.disabled = true;

        // Checking existing exact composite document via standard JS logic without glitches
        const collRef = collection(db, "cart");
        const compositeFindQuery = query(collRef, 
            where("userId", "==", sessionUser.uid), 
            where("productId", "==", currentProduct.id),
            where("size", "==", selectedSize),
            where("color", "==", selectedColor)
        );

        const dataResponse = await getDocs(compositeFindQuery);
        let finalDisplayPic = (currentProduct.images && currentProduct.images.length>0) ? currentProduct.images[0] : 'assets/images/placeholder.jpg';

        if(!dataResponse.empty) {
            const documentTargetRef = dataResponse.docs[0];
            let activeDbValueQty = documentTargetRef.data().quantity;
            let sumNewCalc = activeDbValueQty + currentQty;
            
            let safeStockMaxForSpecificVarient = parseInt(currentProduct.sizes[selectedSize]);
            if(sumNewCalc > safeStockMaxForSpecificVarient) {
                Swal.fire('Maxed Out!', `Cannot add more. Limit is ${safeStockMaxForSpecificVarient} pieces overall per person on this stock!`, 'warning');
                domTargetBtn.innerText = redirectDirectly ? 'Order Now' : 'Add To Bag';
                domTargetBtn.disabled = false;
                return;
            }

            await updateDoc(doc(db, "cart", documentTargetRef.id), { quantity: sumNewCalc });
        } else {
            await addDoc(collRef, {
                userId: sessionUser.uid,
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                size: selectedSize,
                color: selectedColor,
                image: finalDisplayPic,
                quantity: currentQty,
                addedAt: serverTimestamp()
            });
        }

        if(redirectDirectly) {
            window.location.href = 'cart.html';
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Done',
                text: 'Successfully inserted to cart collection!',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000
            });
            domTargetBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Added!';
            domTargetBtn.disabled = false;
            setTimeout(()=>{ domTargetBtn.innerHTML = '<i class="fas fa-shopping-cart"></i> Add to Cart'; }, 2000);
        }
    } catch(errOutputSafeView){
        console.error(errOutputSafeView);
        Swal.fire('Database Err', errOutputSafeView.message, 'error');
        document.getElementById(redirectDirectly ? 'btn-buy-now' : 'btn-add-cart').disabled = false;
    }
}
