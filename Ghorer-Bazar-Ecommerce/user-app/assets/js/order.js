import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ordersContainer = document.getElementById('orders-container');

onAuthStateChanged(auth, (user) => {
    if (user) {
        loadOrders(user.uid);
    } else {
        window.location.href = 'login.html';
    }
});

async function loadOrders(uid) {
    try {
        const q = query(
            collection(db, "orders"), 
            where("userId", "==", uid),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            ordersContainer.innerHTML = `
                <div class="no-orders">
                    <i class="fas fa-box-open"></i>
                    <h3>You haven't placed any orders yet.</h3>
                    <a href="index.html" class="btn btn-primary" style="margin-top:20px;">Shop Now</a>
                </div>
            `;
            return;
        }

        let html = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A';
            
            // Determine Status Class
            let statusClass = 'status-pending';
            const status = data.orderStatus.toLowerCase();
            if(status.includes('process')) statusClass = 'status-processing';
            if(status.includes('ship')) statusClass = 'status-shipped';
            if(status.includes('deliver')) statusClass = 'status-delivered';
            if(status.includes('cancel')) statusClass = 'status-cancelled';

            html += `
                <div class="order-card">
                    <div class="order-top">
                        <div>
                            <span class="order-id">#${data.orderId}</span>
                            <span class="order-date"> • ${date}</span>
                        </div>
                        <div class="status-badge ${statusClass}">${data.orderStatus}</div>
                    </div>
                    <div class="order-body">
                        <div class="order-info">
                            <p><strong>Payment:</strong> ${data.paymentMethod} (${data.paymentStatus})</p>
                            <p><strong>Shipped To:</strong> ${data.shippingAddress}</p>
                        </div>
                        <div class="order-total">
                            ৳${data.totalAmount}
                        </div>
                    </div>
                    <div class="order-actions">
                        <a href="track-order.html?id=${docSnap.id}" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">Track Order</a>
                    </div>
                </div>
            `;
        });
        
        ordersContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading orders:", error);
        // Sometimes Firestore requires an index for combined where() and orderBy()
        // If an index error occurs, show a friendly message or fallback.
        if(error.message.includes("index")) {
            ordersContainer.innerHTML = `<div class="no-orders">
                <i class="fas fa-exclamation-triangle" style="color:var(--secondary-color);"></i>
                <h3>Database index required. Please check Firestore console.</h3>
            </div>`;
        } else {
            ordersContainer.innerHTML = '<p style="text-align:center; color:red;">Error loading orders.</p>';
        }
    }
}