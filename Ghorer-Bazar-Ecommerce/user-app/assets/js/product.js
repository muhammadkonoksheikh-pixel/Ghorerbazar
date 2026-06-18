import { app, auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

const loadingEl = document.getElementById('product-loading');
const contentEl = document.getElementById('product-content');

let currentProduct = null;
let currentUser = null;
let selectedQuantity = 1;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

if (!productId) {
    window.location.href = 'index.html';
} else {
    fetchProductDetails(productId);
}

async function fetchProductDetails(id) {
    try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            currentProduct = { id: docSnap.id, ...docSnap.data() };
            renderProduct(currentProduct);
        } else {
            Swal.fire('Not Found', 'Product does not exist.', 'error').then(() => {
                window.location.href = 'index.html';
            });
        }
    } catch (error) {
        console.error("Error fetching product:", error);
        loadingEl.innerHTML = `<p style="color:red;">Failed to load product details.</p>`;
    }
}

function renderProduct(product) {
    loadingEl.style.display = 'none';
    contentEl.style.display = 'block';

    document.getElementById('pd-category').innerText = product.categoryName || 'General';
    document.getElementById('pd-title').innerText = product.name;
    document.getElementById('pd-price').innerText = `৳${product.price}`;
    
    if (product.oldPrice && product.oldPrice > product.price) {
        document.getElementById('pd-old-price').innerText = `৳${product.oldPrice}`;
        document.getElementById('pd-old-price').style.display = 'inline-block';
        
        const discount = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        document.getElementById('pd-discount').innerText = `-${discount}%`;
        document.getElementById('pd-discount').style.display = 'inline-block';
    }

    // Set Images
    const mainImg = document.getElementById('main-image');
    const thumbContainer = document.getElementById('thumb-gallery');
    
    let images = product.images || ['assets/images/placeholder.jpg'];
    if(images.length === 0) images = ['assets/images/placeholder.jpg'];

    mainImg.src = images[0];

    if (images.length > 1) {
        let thumbsHtml = '';
        images.forEach((img, index) => {
            thumbsHtml += `<div class="thumb-item ${index === 0 ? 'active' : ''}" data-src="${img}"><img src="${img}"></div>`;
        });
        thumbContainer.innerHTML = thumbsHtml;

        document.querySelectorAll('.thumb-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
                const target = e.currentTarget;
                target.classList.add('active');
                mainImg.src = target.getAttribute('data-src');
            });
        });
    }

    document.getElementById('pd-short-desc').innerText = product.description.substring(0, 150) + '...';
    document.getElementById('tab-desc').innerHTML = `<p>${product.description.replace(/\n/g, '<br>')}</p>`;
    
    setupActions();
}

function setupActions() {
    const qtyInput = document.getElementById('pd-qty-input');
    
    document.getElementById('pd-qty-plus').addEventListener('click', () => {
        selectedQuantity++;
        qtyInput.value = selectedQuantity;
    });
    
    document.getElementById('pd-qty-minus').addEventListener('click', () => {
        if (selectedQuantity > 1) {
            selectedQuantity--;
            qtyInput.value = selectedQuantity;
        }
    });

    document.getElementById('btn-add-to-cart').addEventListener('click', async () => {
        await handleAddToCart();
    });

    document.getElementById('btn-buy-now').addEventListener('click', async () => {
        await handleAddToCart(true);
    });

    document.getElementById('btn-wishlist').addEventListener('click', async () => {
        if (!currentUser) {
            Swal.fire('Login Required', 'Please login to save to wishlist', 'info');
            return;
        }
        
        try {
            const wishlistRef = collection(db, "wishlist");
            const q = query(wishlistRef, where("userId", "==", currentUser.uid), where("productId", "==", currentProduct.id));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                await addDoc(wishlistRef, {
                    userId: currentUser.uid,
                    productId: currentProduct.id,
                    addedAt: serverTimestamp()
                });
                Swal.fire({ icon: 'success', title: 'Added to Wishlist', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
                document.getElementById('btn-wishlist').style.color = 'var(--danger)';
                document.getElementById('btn-wishlist').style.borderColor = 'var(--danger)';
            } else {
                Swal.fire({ icon: 'info', title: 'Already in wishlist', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
            }
        } catch (e) {
            console.error(e);
        }
    });
}

async function handleAddToCart(isBuyNow = false) {
    if (!currentUser) {
        Swal.fire({
            title: 'Please Login',
            text: 'You need to login first.',
            icon: 'warning',
            confirmButtonText: 'Login'
        }).then((res) => {
            if(res.isConfirmed) window.location.href = 'login.html';
        });
        return;
    }

    try {
        const cartRef = collection(db, "cart");
        const q = query(cartRef, where("userId", "==", currentUser.uid), where("productId", "==", currentProduct.id));
        const snapshot = await getDocs(q);

        const imgUrl = (currentProduct.images && currentProduct.images.length > 0) ? currentProduct.images[0] : 'assets/images/placeholder.jpg';

        if (!snapshot.empty) {
            const docId = snapshot.docs[0].id;
            const currentQty = snapshot.docs[0].data().quantity;
            await updateDoc(doc(db, "cart", docId), { quantity: currentQty + selectedQuantity });
        } else {
            await addDoc(cartRef, {
                userId: currentUser.uid,
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                image: imgUrl,
                quantity: selectedQuantity,
                addedAt: serverTimestamp()
            });
        }

        if (isBuyNow) {
            window.location.href = 'cart.html';
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Added to Cart',
                text: `${selectedQuantity}x ${currentProduct.name} added.`,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    } catch (error) {
        console.error("Cart Error:", error);
        Swal.fire('Error', 'Failed to add to cart.', 'error');
    }
}