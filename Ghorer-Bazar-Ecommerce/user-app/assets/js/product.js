import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const loaderUI = document.getElementById('fast-loader');
const contentUI = document.getElementById('fast-content');
const mainImage = document.getElementById('main-image');
const qtyInput = document.getElementById('qty-val');
const stockStatusText = document.getElementById('stock-status');

let currentProduct = null;
let sessionUser = null;
let currentQty = 1;
let selectedColor = null;
let selectedSize = null;

onAuthStateChanged(auth, (user) => sessionUser = user);

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

if (!productId) window.location.href = 'index.html';
else fetchProduct();

async function fetchProduct() {
    try {
        const productRef = doc(db, "products", productId);
        const docSnap = await getDoc(productRef);

        if (docSnap.exists()) {
            currentProduct = { id: docSnap.id, ...docSnap.data() };
            
            // Format Variants properly mapping new Admin App structure!
            let formattedVariants = currentProduct.variants || [];
            
            // Failsafe if it's an old product without variants
            if (formattedVariants.length === 0) {
                let fallbackColors = currentProduct.colors || ['Standard'];
                if(typeof fallbackColors === 'string') fallbackColors = fallbackColors.split(',');
                
                formattedVariants = fallbackColors.map(c => ({
                    colorName: c.trim(),
                    imageUrl: (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : 'assets/images/placeholder.jpg',
                    sizes: currentProduct.sizes || { S:10, M:10, L:10, XL:10, XXL:10 }
                }));
            }
            currentProduct.parsedVariants = formattedVariants;
            
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
    loaderUI.style.display = 'none';
    contentUI.style.display = 'grid';

    document.getElementById('product-category').innerText = product.categoryName || 'Apparel';
    document.getElementById('product-title').innerText = product.name;
    document.getElementById('product-price').innerText = `৳${product.price}`;
    
    if (product.oldPrice && product.oldPrice > product.price) {
        document.getElementById('product-old-price').innerText = `৳${product.oldPrice}`;
        document.getElementById('product-old-price').style.display = 'inline-block';
        let discountPercent = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        document.getElementById('product-discount').innerText = `-${discountPercent}%`;
        document.getElementById('product-discount').style.display = 'inline-block';
    }

    document.getElementById('product-desc').innerHTML = (product.description || 'No description').replace(/\n/g, '<br>');

    // Build Global Gallery (all images from all variants + extra images)
    let galleryImages = new Set();
    if (product.images) product.images.forEach(img => galleryImages.add(img));
    product.parsedVariants.forEach(v => { if(v.imageUrl) galleryImages.add(v.imageUrl) });
    
    let imagesArr = Array.from(galleryImages);
    if(imagesArr.length === 0) imagesArr = ['assets/images/placeholder.jpg'];
    
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

    document.querySelectorAll('.thumb-img').forEach(tBox => {
        tBox.addEventListener('click', (e) => {
            document.querySelectorAll('.thumb-img').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            mainImage.src = e.currentTarget.getAttribute('data-src');
        });
    });

    renderColorOptions();
    setupButtons();
}

function renderColorOptions() {
    let html = '';
    currentProduct.parsedVariants.forEach((variant, index) => {
        html += `<div class="select-btn color-btn" data-idx="${index}">${variant.colorName}</div>`;
    });
    document.getElementById('color-options').innerHTML = html;

    const btns = document.querySelectorAll('.color-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btns.forEach(b => b.classList.remove('active'));
            const targetBtn = e.currentTarget;
            targetBtn.classList.add('active');
            
            const variantIndex = parseInt(targetBtn.getAttribute('data-idx'));
            const chosenVariant = currentProduct.parsedVariants[variantIndex];
            
            selectedColor = chosenVariant.colorName;
            document.getElementById('disp-color-select').innerText = selectedColor;
            
            // Switch image dynamically based on chosen color!
            if (chosenVariant.imageUrl) {
                mainImage.src = chosenVariant.imageUrl;
                // Optional: sync active state in thumbnails
                document.querySelectorAll('.thumb-img').forEach(t => {
                    t.classList.remove('active');
                    if(t.getAttribute('data-src') === chosenVariant.imageUrl) t.classList.add('active');
                });
            }

            // Render sizes specific to THIS color!
            selectedSize = null;
            document.getElementById('disp-size-select').innerText = "Not Selected";
            renderSizeOptions(chosenVariant.sizes);
            
            checkStockMessage();
        });
    });

    if(btns.length > 0) btns[0].click();
}

function renderSizeOptions(sizesObj) {
    let html = '';
    const orderedSizes = ['S', 'M', 'L', 'XL', 'XXL'];

    orderedSizes.forEach(sz => {
        const availableStock = parseInt(sizesObj[sz] || 0);
        let outStockClass = availableStock <= 0 ? 'out-of-stock' : '';
        html += `<div class="select-btn size-btn ${outStockClass}" data-size="${sz}" data-stock="${availableStock}">${sz}</div>`;
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
        let variant = currentProduct.parsedVariants.find(v => v.colorName === selectedColor);
        let maxAvailable = variant ? parseInt(variant.sizes[selectedSize] || 0) : 0;
        
        stockStatusText.innerHTML = `<span style="color:var(--success);"><i class="fas fa-check-circle"></i> Excellent! We have ${maxAvailable} available in this combination.</span>`;
    } else {
        stockStatusText.innerHTML = `<span style="color:#777;"><i class="fas fa-info-circle"></i> Select Size & Color to add to bag.</span>`;
    }
}

function setupButtons() {
    document.getElementById('qty-plus').addEventListener('click', () => {
        if (!selectedSize || !selectedColor) {
            Swal.fire('Select Options', 'Please select color and size first.', 'info'); return;
        }
        let variant = currentProduct.parsedVariants.find(v => v.colorName === selectedColor);
        let maxLimit = variant ? parseInt(variant.sizes[selectedSize] || 0) : 0;

        if (currentQty < maxLimit) {
            currentQty++;
            qtyInput.value = currentQty;
        } else {
            Swal.fire('Limit Alert', `Only ${maxLimit} pieces available for this variant.`, 'warning');
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

async function processOrderAddition(goToCheckout) {
    if(!sessionUser) {
        Swal.fire({
            title: 'Please Login', text: 'You must login to proceed.', icon: 'info', confirmButtonText: 'Go to Login'
        }).then(r => { if(r.isConfirmed) window.location.href='login.html'; });
        return;
    }

    if(!selectedSize || !selectedColor) {
        Swal.fire('Select Options', 'Please choose both COLOR and SIZE!', 'error');
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
        
        let variant = currentProduct.parsedVariants.find(v => v.colorName === selectedColor);
        const imageUrlToSave = variant.imageUrl || (currentProduct.images ? currentProduct.images[0] : 'assets/images/placeholder.jpg');

        if (!snapshotData.empty) {
            let activeDoc = snapshotData.docs[0];
            let newTotalQty = activeDoc.data().quantity + currentQty;
            
            const limit = parseInt(variant.sizes[selectedSize]);
            if(newTotalQty > limit) {
                Swal.fire('Limit Error!', `Cannot add more. Limit is ${limit} pieces!`, 'warning');
                document.getElementById(btnId).innerHTML = goToCheckout ? '<i class="fas fa-bolt"></i> BUY NOW' : '<i class="fas fa-shopping-bag"></i> ADD TO BAG';
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
                icon: 'success', title: 'Added to Bag!', html: `Color: <b>${selectedColor}</b> | Size: <b>${selectedSize}</b>`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000
            });
            document.getElementById(btnId).innerHTML = '<i class="fas fa-shopping-bag"></i> ADD TO BAG';
            document.getElementById(btnId).disabled = false;
        }

    } catch(err) {
        console.error(err);
        Swal.fire("Failed", err.message, "error");
        document.getElementById(goToCheckout ? 'btn-buy' : 'btn-cart').disabled = false;
    }
}
