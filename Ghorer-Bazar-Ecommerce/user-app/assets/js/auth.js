import { auth, db } from './firebase-config.js';
import { 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    doc, 
    getDoc, 
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
        // User is signed in
        if (userIcon) {
            userIcon.innerHTML = `<img src="${user.photoURL || 'assets/images/default-avatar.png'}" alt="User" style="width:25px; height:25px; border-radius:50%; object-fit:cover;">`;
            userIcon.href = "javascript:void(0)"; // Prevent navigating to login
            if(userDropdownContent) userDropdownContent.style.display = "block";
        }
        
        // Listen to Cart & Wishlist counts in Realtime
        listenToUserCart(user.uid);
        listenToUserWishlist(user.uid);

    } else {
        currentUser = null;
        // User is signed out
        if (userIcon) {
            userIcon.innerHTML = `<i class="far fa-user"></i>`;
            userIcon.href = "login.html";
            if(userDropdownContent) userDropdownContent.style.display = "none";
        }
        
        // Reset badges
        if(cartBadge) cartBadge.innerText = "0";
        if(mobileCartBadge) mobileCartBadge.innerText = "0";
        if(wishlistBadge) wishlistBadge.innerText = "0";
    }
    
    // Hide page loader if it exists
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }
});

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out of your account.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2e7d32',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Yes, log out!'
        }).then((result) => {
            if (result.isConfirmed) {
                signOut(auth).then(() => {
                    Swal.fire('Logged Out!', 'You have been successfully logged out.', 'success')
                    .then(() => {
                        window.location.href = 'index.html';
                    });
                }).catch((error) => {
                    Swal.fire('Error', error.message, 'error');
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
        if(cartBadge) cartBadge.innerText = totalItems;
        if(mobileCartBadge) mobileCartBadge.innerText = totalItems;
    });
}

function listenToUserWishlist(uid) {
    const q = query(collection(db, "wishlist"), where("userId", "==", uid));
    onSnapshot(q, (snapshot) => {
        if(wishlistBadge) wishlistBadge.innerText = snapshot.size;
    });
}

export { currentUser };