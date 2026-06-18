import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const wishlistContainer = document.getElementById('wishlist-container');
const emptyMsg = document.getElementById('empty-wishlist-msg');

let currentUser = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadWishlist();
    } else {
        window.location.href = 'login.html';
    }
});

async function loadWishlist() {
    try {
        const q = query(collection(db, "wishlist"), where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            wishlistContainer.style.display = 'none';
            emptyMsg.style.display = 'block';
            return;
        }

        wishlistContainer.style.display = 'grid';
        emptyMsg.style.display = 'none';
        
        let html = '';
        
        // Use Promise.all to fetch all product details concurrently
        const fetchPromises = snapshot.docs.map(async (wishlistDoc) => {
            const data = wishlistDoc.data();
            const pDocRef = doc(db, "products", data.productId);
            const pDocSnap = await getDoc(pDocRef);
            
            if (pDocSnap.exists()) {
                return { wishlistId: wishlistDoc.id, productId: data.productId, ...pDocSnap.data() };
            }
            return null; // Product might have been deleted by admin
        });

        const products = await Promise.all(fetchPromises);
        
        products.forEach(p => {
            if (!p) return;
            const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : 'assets/images/placeholder.jpg';
            
            html += `
                <div class="product-card wishlist-card">
                    <button class="btn-remove-wishlist" data-wid="${p.wishlistId}"><i class="fas fa-trash"></i></button>
                    <div class="product-img-wrapper" onclick="window.location.href='product.html?id=${p.productId}'">
                        <img src="${imgUrl}" alt="${p.name}" class="product-img">
                    </div>
                    <div class="product-info">
                        <h3 class="product-title" onclick="window.location.href='product.html?id=${p.productId}'">${p.name}</h3>
                        <div class="product-price">
                            <span class="new-price">৳${p.price}</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-add-cart" onclick="window.location.href='product.html?id=${p.productId}'">View Details</button>
                        </div>
                    </div>
                </div>
            `;
        });

        wishlistContainer.innerHTML = html;

        // Attach remove listeners
        document.querySelectorAll('.btn-remove-wishlist').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const wId = e.currentTarget.getAttribute('data-wid');
                await removeFromWishlist(wId);
            });
        });

    } catch (error) {
        console.error("Error loading wishlist:", error);
        wishlistContainer.innerHTML = '<p style="color:red;">Error loading wishlist.</p>';
    }
}

async function removeFromWishlist(wishlistId) {
    try {
        await deleteDoc(doc(db, "wishlist", wishlistId));
        Swal.fire({ icon: 'success', title: 'Removed', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        loadWishlist(); // Refresh list
    } catch (e) {
        console.error(e);
        Swal.fire('Error', 'Could not remove item.', 'error');
    }
}