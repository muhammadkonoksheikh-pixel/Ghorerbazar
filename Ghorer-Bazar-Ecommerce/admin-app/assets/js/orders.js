import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const ordersList = document.getElementById('orders-list');
const filterBtns = document.querySelectorAll('.filter-tab');

let allOrders = [];

document.addEventListener('DOMContentLoaded', loadOrders);

async function loadOrders() {
    try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allOrders = [];
        snapshot.forEach(docSnap => {
            allOrders.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        renderOrders(allOrders);
    } catch (error) {
        console.error("Error loading orders:", error);
        ordersList.innerHTML = '<tr><td colspan="7" style="text-align:center; color:red;">Failed to load orders. Please check Firestore Indexes.</td></tr>';
    }
}

function renderOrders(ordersArray) {
    if (ordersArray.length === 0) {
        ordersList.innerHTML = '<tr><td colspan="7" style="text-align:center;">No orders found.</td></tr>';
        return;
    }

    let html = '';
    ordersArray.forEach(data => {
        let statusClass = 'pending';
        const s = data.orderStatus.toLowerCase();
        if(s.includes('process') || s.includes('pack')) statusClass = 'processing';
        if(s.includes('ship')) statusClass = 'shipped';
        if(s.includes('deliver')) statusClass = 'delivered';
        if(s.includes('cancel')) statusClass = 'cancelled';

        const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A';

        html += `
            <tr>
                <td><strong>#${data.orderId}</strong></td>
                <td>${date}</td>
                <td>
                    ${data.customerName}<br>
                    <span style="font-size:0.8rem; color:#777;">${data.customerPhone}</span>
                </td>
                <td><strong>৳${data.totalAmount}</strong></td>
                <td>${data.paymentMethod}</td>
                <td><span class="badge ${statusClass}">${data.orderStatus}</span></td>
                <td>
                    <a href="order-details.html?id=${data.id}" class="btn btn-primary" style="padding: 5px 12px; font-size: 0.85rem;">View & Update</a>
                </td>
            </tr>
        `;
    });
    
    ordersList.innerHTML = html;
}

// Filtering
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        const filterVal = e.currentTarget.getAttribute('data-filter');
        if(filterVal === 'All') {
            renderOrders(allOrders);
        } else {
            const filtered = allOrders.filter(o => o.orderStatus === filterVal);
            renderOrders(filtered);
        }
    });
});