import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, doc, writeBatch, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const stepSelection = document.getElementById('step-selection');
const stepPayment = document.getElementById('step-payment');
const btnBack = document.getElementById('btn-back');

const methodCards = document.querySelectorAll('.method-card');
const methodLogoContainer = document.getElementById('method-logo-container');
const activeMethodImg = document.getElementById('active-method-img');
const displayAmount = document.getElementById('display-amount');

const instructionBlock = document.getElementById('instruction-block');
const codBlock = document.getElementById('cod-block');
const instMethodName = document.getElementById('inst-method-name');
const instMethodPin = document.getElementById('inst-method-pin');
const merchantNumberEl = document.getElementById('merchant-number');
const copyAmountText = document.getElementById('copy-amount-text');
const trxInput = document.getElementById('trx-id');
const verifyBtn = document.getElementById('verify-btn');

// State Variables
let pendingOrder = null;
let currentMethod = null;
let currentUser = null;

// Merchant Accounts (Ideally fetch from a Firestore settings doc, hardcoded for now)
const merchantAccounts = {
    'bkash': '01858599684',
    'nagad': '01858599684'
};

// Auth Guard
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initPaymentGateway();
    } else {
        window.location.href = 'login.html';
    }
});

function initPaymentGateway() {
    const savedOrder = sessionStorage.getItem('pendingOrder');
    if (!savedOrder) {
        window.location.href = 'cart.html';
        return;
    }
    pendingOrder = JSON.parse(savedOrder);
    
    // Set Amounts securely
    displayAmount.innerText = `${pendingOrder.totalAmount} BDT`;
    copyAmountText.innerText = pendingOrder.totalAmount;
}

// User selects a Payment Method
methodCards.forEach(card => {
    card.addEventListener('click', (e) => {
        currentMethod = e.currentTarget.getAttribute('data-method');
        
        // Setup Views Based on Method
        if (currentMethod === 'cod') {
            methodLogoContainer.innerHTML = '<i class="fas fa-hand-holding-usd" style="font-size: 3rem; color: #111;"></i>';
            instructionBlock.style.display = 'none';
            codBlock.style.display = 'block';
            
            verifyBtn.innerText = 'CONFIRM ORDER';
            verifyBtn.style.background = '#111'; // Brand Black for COD
        } else {
            // bKash or Nagad
            const isBkash = currentMethod === 'bkash';
            methodLogoContainer.innerHTML = `<img src="assets/images/${currentMethod}.png" alt="${currentMethod}" onerror="this.src='${isBkash ? 'https://seeklogo.com/images/B/bkash-logo-0C1572FBB4-seeklogo.com.png' : 'https://download.logo.wine/logo/Nagad/Nagad-Logo.wine.png'}'" style="height:45px;">`;
            
            instructionBlock.style.display = 'block';
            codBlock.style.display = 'none';
            
            const methodNameFormat = isBkash ? 'bKash' : 'Nagad';
            instMethodName.innerText = methodNameFormat;
            instMethodPin.innerText = methodNameFormat;
            merchantNumberEl.innerText = merchantAccounts[currentMethod];
            
            trxInput.value = ''; // Reset input
            
            verifyBtn.innerText = 'VERIFY';
            verifyBtn.style.background = '#0D6EFD'; // Gateway Blue
        }

        // Switch Screen
        stepSelection.classList.remove('active');
        stepPayment.classList.add('active');
    });
});

// Back Button Navigation
btnBack.addEventListener('click', () => {
    stepPayment.classList.remove('active');
    stepSelection.classList.add('active');
});

// Submit Payment (Verify / Confirm)
verifyBtn.addEventListener('click', async () => {
    let trxId = 'N/A';
    let paymentStatus = 'unpaid'; // default for COD

    if (currentMethod !== 'cod') {
        trxId = trxInput.value.trim().toUpperCase();
        if (!trxId) {
            Swal.fire('Required', 'Please enter your Transaction ID (TrxID) to verify payment.', 'warning');
            return;
        }
        paymentStatus = 'pending'; // Manual verification needed by admin
    }

    verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PROCESSING...';
    verifyBtn.disabled = true;
    btnBack.style.display = 'none';

    await executeOrderPlacement(currentMethod === 'cod' ? 'Cash on Delivery' : (currentMethod === 'bkash' ? 'bKash' : 'Nagad'), trxId, paymentStatus);
});

// Core Execution Function (Intact & Unchanged Logic)
async function executeOrderPlacement(finalMethodName, transactionId, paymentStatus) {
    try {
        const shortOrderId = 'GB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

        const orderData = {
            orderId: shortOrderId,
            userId: currentUser.uid,
            customerName: pendingOrder.customerName,
            customerPhone: pendingOrder.customerPhone,
            shippingAddress: `${pendingOrder.address}, ${pendingOrder.upazila}, ${pendingOrder.district}`,
            notes: pendingOrder.notes,
            subtotal: pendingOrder.subtotal,
            deliveryCharge: pendingOrder.deliveryCharge,
            totalAmount: pendingOrder.totalAmount,
            paymentMethod: finalMethodName,
            transactionId: transactionId,
            paymentStatus: paymentStatus,
            orderStatus: 'Pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Batch processing logic
        const batch = writeBatch(db);
        
        // 1. Order Creation
        const orderRef = doc(collection(db, "orders"));
        batch.set(orderRef, orderData);

        // 2. Insert Order Items
        pendingOrder.cartItems.forEach(item => {
            const itemRef = doc(collection(db, "order_items"));
            batch.set(itemRef, {
                orderDocId: orderRef.id,
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                size: item.size || null,
                color: item.color || null,
                image: item.image
            });
        });

        // 3. Clear Cart
        const cartQ = query(collection(db, "cart"), where("userId", "==", currentUser.uid));
        const cartSnapshot = await getDocs(cartQ);
        cartSnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });

        // Commit all requests at once
        await batch.commit();

        // Cleanup
        sessionStorage.removeItem('pendingOrder');
        sessionStorage.removeItem('checkoutTotal');
        sessionStorage.removeItem('checkoutCart');

        window.location.href = `order-success.html?orderId=${shortOrderId}`;

    } catch (error) {
        console.error("Order Placement Error:", error);
        Swal.fire('System Error', 'Failed to place order securely. Please try again.', 'error');
        
        verifyBtn.innerHTML = currentMethod === 'cod' ? 'CONFIRM ORDER' : 'VERIFY';
        verifyBtn.disabled = false;
        btnBack.style.display = 'block';
    }
}
