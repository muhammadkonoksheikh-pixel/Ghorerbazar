import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
        // ফায়ারবেস ইনডেক্স এরর এড়াতে শুধু where() দিয়ে ডাটা আনা হলো
        const q = query(
            collection(db, "orders"), 
            where("userId", "==", uid)
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

        // ডাটাগুলো একটি অ্যারেতে রাখা হচ্ছে
        let ordersArray = [];
        snapshot.forEach(docSnap => {
            ordersArray.push({ id: docSnap.id, ...docSnap.data() });
        });

        // জাভাস্ক্রিপ্ট দিয়ে নতুন অর্ডারগুলো (Date অনুযায়ী) সবার ওপরে সাজানো হচ্ছে (Sorting)
        ordersArray.sort((a, b) => {
            const timeA = a.createdAt ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt ? b.createdAt.toMillis() : 0;
            return timeB - timeA; // Descending order (নতুনগুলো আগে)
        });

        let html = '';
        ordersArray.forEach(data => {
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A';
            
            // Determine Status Class
            let statusClass = 'status-pending';
            const status = data.orderStatus ? data.orderStatus.toLowerCase() : '';
            if(status.includes('process')) statusClass = 'status-processing';
            if(status.includes('ship')) statusClass = 'status-shipped';
            if(status.includes('deliver')) statusClass = 'status-delivered';
            if(status.includes('cancel')) statusClass = 'status-cancelled';

            html += `
                <div class="order-card">
                    <div class="order-top">
                        <div>
                            <span class="order-id">#${data.orderId || data.id.substring(0,6)}</span>
                            <span class="order-date"> • ${date}</span>
                        </div>
                        <div class="status-badge ${statusClass}">${data.orderStatus || 'Pending'}</div>
                    </div>
                    <div class="order-body">
                        <div class="order-info">
                            <p><strong>Payment:</strong> ${data.paymentMethod || 'N/A'} (${data.paymentStatus || 'Pending'})</p>
                            <p><strong>Shipped To:</strong> ${data.shippingAddress || 'N/A'}</p>
                        </div>
                        <div class="order-total">
                            ৳${data.totalAmount || 0}
                        </div>
                    </div>
                    <div class="order-actions">
                        <a href="track-order.html?id=${data.id}" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">Track Order</a>
                    </div>
                </div>
            `;
        });
        
        ordersContainer.innerHTML = html;

    } catch (error) {
        console.error("Error loading orders:", error);
        ordersContainer.innerHTML = '<p style="text-align:center; color:red; padding:30px;">Error loading orders. Please check your connection.</p>';
    }
}
