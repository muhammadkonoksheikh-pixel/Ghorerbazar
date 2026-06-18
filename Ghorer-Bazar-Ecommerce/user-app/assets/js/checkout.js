import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const checkoutForm = document.getElementById('checkout-form');
const districtSelect = document.getElementById('c-district');
const deliveryRadios = document.getElementsByName('deliveryCharge');
const insideDhakaOpt = document.getElementById('inside-dhaka-opt');
const outsideDhakaOpt = document.getElementById('outside-dhaka-opt');

const cSubtotalEl = document.getElementById('c-subtotal');
const cDeliveryChargeEl = document.getElementById('c-delivery-charge');
const cTotalEl = document.getElementById('c-total');
const checkoutItemsList = document.getElementById('checkout-items-list');

let subtotal = 0;
let deliveryCharge = 0;
let cartItems = [];
let currentUser = null;

// Initialization
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await prefillUserData(user.uid);
        loadCartSummary();
    } else {
        window.location.href = 'login.html';
    }
});

async function prefillUserData(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if(data.name) document.getElementById('c-name').value = data.name;
            if(data.phone) document.getElementById('c-phone').value = data.phone;
            if(data.upazila) document.getElementById('c-upazila').value = data.upazila;
            if(data.address) document.getElementById('c-address').value = data.address;
            
            // Handle district
            if (data.district) {
                if (data.district.toLowerCase().includes("dhaka")) {
                    districtSelect.value = "Dhaka";
                    updateDeliveryMethod("Dhaka");
                } else {
                    districtSelect.value = "Outside Dhaka";
                    updateDeliveryMethod("Outside Dhaka");
                }
            }
        }
    } catch (error) {
        console.error("Error prefilling user data:", error);
    }
}

function loadCartSummary() {
    const savedSubtotal = sessionStorage.getItem('checkoutTotal');
    const savedCart = sessionStorage.getItem('checkoutCart');

    if (!savedSubtotal || !savedCart || JSON.parse(savedCart).length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    subtotal = parseFloat(savedSubtotal);
    cartItems = JSON.parse(savedCart);

    cSubtotalEl.innerText = `৳${subtotal}`;
    
    let itemsHtml = '';
    cartItems.forEach(item => {
        itemsHtml += `
            <div class="summary-item">
                <span class="summary-item-title">${item.quantity}x ${item.name}</span>
                <span>৳${item.price * item.quantity}</span>
            </div>
        `;
    });
    checkoutItemsList.innerHTML = itemsHtml;
    
    updateTotals();
}

// Logic for Delivery Charge based on District Selection
districtSelect.addEventListener('change', (e) => {
    updateDeliveryMethod(e.target.value);
});

function updateDeliveryMethod(district) {
    if (district === "Dhaka") {
        deliveryRadios[0].checked = true; // Inside Dhaka (70)
        insideDhakaOpt.classList.add('active');
        outsideDhakaOpt.classList.remove('active');
        deliveryCharge = 70;
    } else if (district === "Outside Dhaka") {
        deliveryRadios[1].checked = true; // Outside Dhaka (130)
        outsideDhakaOpt.classList.add('active');
        insideDhakaOpt.classList.remove('active');
        deliveryCharge = 130;
    } else {
        deliveryCharge = 0;
        deliveryRadios.forEach(r => r.checked = false);
        insideDhakaOpt.classList.remove('active');
        outsideDhakaOpt.classList.remove('active');
    }
    updateTotals();
}

// Manual radio selection fallback
deliveryRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        deliveryCharge = parseFloat(e.target.value);
        if(deliveryCharge === 70) {
            insideDhakaOpt.classList.add('active');
            outsideDhakaOpt.classList.remove('active');
            districtSelect.value = "Dhaka";
        } else {
            outsideDhakaOpt.classList.add('active');
            insideDhakaOpt.classList.remove('active');
            districtSelect.value = "Outside Dhaka";
        }
        updateTotals();
    });
});

function updateTotals() {
    cDeliveryChargeEl.innerText = `৳${deliveryCharge}`;
    cTotalEl.innerText = `৳${subtotal + deliveryCharge}`;
}

// Form Submission - Go to Payment
checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (deliveryCharge === 0) {
        Swal.fire('Delivery Method Required', 'Please select a district to apply delivery charges.', 'warning');
        return;
    }

    const orderData = {
        customerName: document.getElementById('c-name').value.trim(),
        customerPhone: document.getElementById('c-phone').value.trim(),
        district: document.getElementById('c-district').value,
        upazila: document.getElementById('c-upazila').value.trim(),
        address: document.getElementById('c-address').value.trim(),
        notes: document.getElementById('c-notes').value.trim(),
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        totalAmount: subtotal + deliveryCharge,
        cartItems: cartItems
    };

    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    window.location.href = 'payment.html';
});