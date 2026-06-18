import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadRecentOrders();
});

async function loadDashboardStats() {
    try {
        // Total Products
        const productsSnap = await getDocs(collection(db, "products"));
        document.getElementById('stat-products').innerText = productsSnap.size;

        // Total Users
        const usersSnap = await getDocs(collection(db, "users"));
        document.getElementById('stat-users').innerText = usersSnap.size;

        // Total Orders & Revenue
        const ordersSnap = await getDocs(collection(db, "orders"));
        let totalOrders = ordersSnap.size;
        let totalRevenue = 0;

        ordersSnap.forEach(doc => {
            const data = doc.data();
            // Calculate revenue only for delivered/completed orders if preferred, 
            // but for overview we can show all non-cancelled
            if(data.orderStatus.toLowerCase() !== 'cancelled') {
                totalRevenue += parseFloat(data.totalAmount || 0);
            }
        });

        document.getElementById('stat-orders').innerText = totalOrders;
        document.getElementById('stat-revenue').innerText = `৳${totalRevenue.toLocaleString()}`;

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

async function loadRecentOrders() {
    const listBody = document.getElementById('recent-orders-list');
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(5));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            listBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No recent orders.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            
            let statusClass = 'pending';
            const s = data.orderStatus.toLowerCase();
            if(s.includes('process') || s.includes('pack')) statusClass = 'processing';
            if(s.includes('ship')) statusClass = 'shipped';
            if(s.includes('deliver')) statusClass = 'delivered';
            if(s.includes('cancel')) statusClass = 'cancelled';

            html += `
                <tr>
                    <td><strong>#${data.orderId}</strong></td>
                    <td>${data.customerName}</td>
                    <td>৳${data.totalAmount}</td>
                    <td>${data.paymentMethod} (${data.paymentStatus})</td>
                    <td><span class="badge ${statusClass}">${data.orderStatus}</span></td>
                    <td>
                        <a href="order-details.html?id=${docSnap.id}" class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;">View</a>
                    </td>
                </tr>
            `;
        });
        
        listBody.innerHTML = html;

    } catch (error) {
        console.error("Error loading recent orders:", error);
        listBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Failed to load orders. Check indexes.</td></tr>';
    }
}