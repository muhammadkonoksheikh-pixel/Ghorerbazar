import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const cartContent = document.getElementById('cart-content');
const emptyCartMsg = document.getElementById('empty-cart-msg');
const cartItemsContainer = document.getElementById('cart-items-container');
const totalItemsEl = document.getElementById('total-items');
const subtotalAmountEl = document.getElementById('subtotal-amount');
const totalAmountEl = document.getElementById('total-amount');
const checkoutBtn = document.getElementById('checkout-btn');

let currentCart = [];

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadCart(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

function loadCart(uid) {
    const q = query(collection(db, "cart"), where("userId", "==", uid));
    
    // Realtime update
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            cartContent.style.display = 'none';
            emptyCartMsg.style.display = 'block';
            currentCart = [];
        } else {
            cartContent.style.display = 'grid';
            emptyCartMsg.style.display = 'none';
            
            let html = '';
            let subtotal = 0;
            let totalItems = 0;
            currentCart = [];

            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const docId = docSnap.id;
                currentCart.push({ id: docId, ...data });

                const itemTotal = data.price * data.quantity;
                subtotal += itemTotal;
                totalItems += data.quantity;

                html += `
                    <div class="cart-item">
                        <img src="${data.image}" alt="${data.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <h4 class="cart-item-title">${data.name}</h4>
                            <div class="cart-item-price">৳${data.price}</div>
                        </div>
                        <div class="quantity-control">
                            <button class="qty-btn minus" data-id="${docId}" data-qty="${data.quantity}">-</button>
                            <input type="text" class="qty-input" value="${data.quantity}" readonly>
                            <button class="qty-btn plus" data-id="${docId}" data-qty="${data.quantity}">+</button>
                        </div>
                        <div style="font-weight:600; width:80px; text-align:right;">
                            ৳${itemTotal}
                        </div>
                        <button class="remove-btn" data-id="${docId}"><i class="fas fa-trash"></i></button>
                    </div>
                `;
            });

            cartItemsContainer.innerHTML = html;
            totalItemsEl.innerText = totalItems;
            subtotalAmountEl.innerText = `৳${subtotal}`;
            totalAmountEl.innerText = `৳${subtotal}`;
            
            // Save to sessionStorage for Checkout
            sessionStorage.setItem('checkoutTotal', subtotal);
            sessionStorage.setItem('checkoutCart', JSON.stringify(currentCart));

            attachEventListeners();
        }
    });
}

function attachEventListeners() {
    // Plus Buttons
    document.querySelectorAll('.plus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const qty = parseInt(e.target.getAttribute('data-qty'));
            await updateDoc(doc(db, "cart", id), { quantity: qty + 1 });
        });
    });

    // Minus Buttons
    document.querySelectorAll('.minus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const qty = parseInt(e.target.getAttribute('data-qty'));
            if (qty > 1) {
                await updateDoc(doc(db, "cart", id), { quantity: qty - 1 });
            } else {
                deleteItem(id);
            }
        });
    });

    // Remove Buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            deleteItem(id);
        });
    });
}

function deleteItem(id) {
    Swal.fire({
        title: 'Remove Item?',
        text: "Do you want to remove this item from the cart?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await deleteDoc(doc(db, "cart", id));
            Swal.fire({ icon: 'success', title: 'Removed', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
        }
    });
}

checkoutBtn.addEventListener('click', () => {
    window.location.href = 'checkout.html';
});