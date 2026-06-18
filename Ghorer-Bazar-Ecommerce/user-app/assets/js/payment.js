import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, doc, writeBatch, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM
const payAmountEl = document.getElementById('pay-amount');
const methodBtns = document.querySelectorAll('.method-btn');
const manualPaymentArea = document.getElementById('manual-payment-area');
const codArea = document.getElementById('cod-area');
const methodNameText = document.getElementById('method-name-text');
const merchantNumberEl = document.getElementById('merchant-number');
const paymentForm = document.getElementById('payment-form');
const trxInput = document.getElementById('trx-id');
const confirmBtn = document.getElementById('confirm-order-btn');
const codConfirmBtn = document.getElementById('cod-confirm-btn');

let pendingOrder = null;
let currentMethod = 'bKash';
let currentUser = null;

// Mock Merchant Numbers (Ideally fetched from a 'settings' collection in Firestore)
const paymentNumbers = {
    'bKash': '01711223344',
    'Nagad': '01999887766'
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        initPayment();
    } else {
        window.location.href = 'login.html';
    }
});

function initPayment() {
    const savedOrder = sessionStorage.getItem('pendingOrder');
    if (!savedOrder) {
        window.location.href = 'cart.html';
        return;
    }
    pendingOrder = JSON.parse(savedOrder);
    payAmountEl.innerText = `৳${pendingOrder.totalAmount}`;
    merchantNumberEl.innerText = paymentNumbers['bKash'];
}

// Switch Payment Method
methodBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        methodBtns.forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        
        currentMethod = targetBtn.getAttribute('data-method');
        
        if (currentMethod === 'cod') {
            manualPaymentArea.style.display = 'none';
            codArea.style.display = 'block';
        } else {
            manualPaymentArea.style.display = 'block';
            codArea.style.display = 'none';
            
            const methodLabel = currentMethod === 'bkash' ? 'bKash' : 'Nagad';
            methodNameText.innerText = methodLabel;
            merchantNumberEl.innerText = paymentNumbers[methodLabel];
            trxInput.value = '';
            trxInput.placeholder = `Enter ${methodLabel} TrxID`;
        }
    });
});

// Submit Manual Payment
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const trxId = trxInput.value.trim().toUpperCase();
    if (!trxId) return;

    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    confirmBtn.disabled = true;

    await processOrder(currentMethod, trxId, 'pending'); // Payment status pending for manual verification
});

// Submit COD Payment
codConfirmBtn.addEventListener('click', async () => {
    codConfirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    codConfirmBtn.disabled = true;
    
    await processOrder('Cash on Delivery', 'N/A', 'unpaid'); // COD means payment is unpaid until delivery
});

async function processOrder(method, transactionId, paymentStatus) {
    try {
        // Generate short Order ID
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
            paymentMethod: method,
            transactionId: transactionId,
            paymentStatus: paymentStatus,
            orderStatus: 'Pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // 1. Save Order Document
        const orderRef = await addDoc(collection(db, "orders"), orderData);

        // 2. Save Order Items & Delete Cart Items via Batch
        const batch = writeBatch(db);
        
        // Add items to order_items
        pendingOrder.cartItems.forEach(item => {
            const itemRef = doc(collection(db, "order_items"));
            batch.set(itemRef, {
                orderDocId: orderRef.id,
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            });
        });

        // Query user's cart to delete
        const cartQ = query(collection(db, "cart"), where("userId", "==", currentUser.uid));
        const cartSnapshot = await getDocs(cartQ);
        cartSnapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
        });

        // 3. Add Notification for Admin
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
            title: 'New Order Received',
            message: `Order ${shortOrderId} received from ${pendingOrder.customerName}.`,
            type: 'order',
            isRead: false,
            createdAt: serverTimestamp()
        });

        // Commit batch
        await batch.commit();

        // Clear Session
        sessionStorage.removeItem('pendingOrder');
        sessionStorage.removeItem('checkoutTotal');
        sessionStorage.removeItem('checkoutCart');

        // Redirect to Success Page
        window.location.href = `order-success.html?orderId=${shortOrderId}`;

    } catch (error) {
        console.error("Error processing order:", error);
        Swal.fire('Error', 'Failed to place order. Please try again.', 'error');
        confirmBtn.innerHTML = 'Verify & Confirm Order <i class="fas fa-check-circle"></i>';
        confirmBtn.disabled = false;
        codConfirmBtn.innerHTML = 'Confirm COD Order';
        codConfirmBtn.disabled = false;
    }
}