import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const userIcon = document.getElementById('user-icon');
const userDropdownContent = document.getElementById('user-dropdown-content');
const logoutBtn = document.getElementById('logout-btn');
const cartBadge = document.getElementById('cart-badge');
const mobileCartBadge = document.getElementById('mobile-cart-badge');
const wishlistBadge = document.getElementById('wishlist-badge');

let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        
        // Auto Avatar API fallback for broken images
        const nameFallback = user.displayName || 'User';
        const finalPhoto = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(nameFallback)}&background=111&color=fff&bold=true`;

        if (userIcon) {
            userIcon.innerHTML = `<img src="${finalPhoto}" alt="User" onerror="this.src='https://ui-avatars.com/api/?name=U&background=111&color=fff'" style="width:28px; height:28px; border-radius:50%; object-fit:cover; border: 1px solid #ccc;">`;
            userIcon.href = "javascript:void(0)"; 
            if(userDropdownContent) userDropdownContent.style.display = "block";
        }
        
        listenToUserCart(user.uid);
        listenToUserWishlist(user.uid);

    } else {
        currentUser = null;
        if (userIcon) {
            userIcon.innerHTML = `<i class="far fa-user"></i>`;
            userIcon.href = "login.html";
            if(userDropdownContent) userDropdownContent.style.display = "none";
        }
        if(cartBadge) cartBadge.innerText = "0";
        if(mobileCartBadge) mobileCartBadge.innerText = "0";
        if(wishlistBadge) wishlistBadge.innerText = "0";
    }
});

if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Sign Out?',
            text: "Are you sure you want to sign out?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#111',
            cancelButtonColor: '#e74c3c',
            confirmButtonText: 'Yes, Sign out'
        }).then((result) => {
            if (result.isConfirmed) {
                signOut(auth).then(() => {
                    window.location.href = 'index.html';
                });
            }
        })
    });
}

function listenToUserCart(uid) {
    const q = query(collection(db, "cart"), where("userId", "==", uid));
    onSnapshot(q, (snapshot) => {
        let totalItems = 0;
        snapshot.forEach((doc) => {
            totalItems += doc.data().quantity;
        });
        if(cartBadge) {
            cartBadge.innerText = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
        if(mobileCartBadge) {
            mobileCartBadge.innerText = totalItems;
            mobileCartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    });
}

function listenToUserWishlist(uid) {
    const q = query(collection(db, "wishlist"), where("userId", "==", uid));
    onSnapshot(q, (snapshot) => {
        if(wishlistBadge) {
            wishlistBadge.innerText = snapshot.size;
            wishlistBadge.style.display = snapshot.size > 0 ? 'flex' : 'none';
        }
    });
}

export { currentUser };
