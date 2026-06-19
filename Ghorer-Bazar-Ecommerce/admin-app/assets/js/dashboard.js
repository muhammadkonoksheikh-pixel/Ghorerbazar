import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search-input');
const statusFilter = document.getElementById('status-filter');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const pageInfo = document.getElementById('page-info');

// State Variables
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

async function initializeDashboard() {
    try {
        // 1. Fetch Basic Collections
        const usersSnap = await getDocs(collection(db, "users"));
        const productsSnap = await getDocs(collection(db, "products"));
        
        // 2. Fetch All Orders for Accurate Math & Analytics
        const ordersQ = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const ordersSnap = await getDocs(ordersQ);

        // Variables for calculations
        let totalUsers = usersSnap.size;
        let totalProducts = productsSnap.size;
        
        let totalOrders = 0;
        let completedCount = 0;
        let processingCount = 0;
        let cancelledCount = 0;
        let totalRevenue = 0;
        
        let uniqueCustomers = new Set();
        let chartDataMap = {}; // Will hold data for last 6 months

        // Initialize last 6 months keys for chart
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const d = new Date();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            let tempDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
            let mName = monthNames[tempDate.getMonth()] + ' ' + tempDate.getFullYear().toString().substr(-2);
            last6Months.push(mName);
            chartDataMap[mName] = { revenue: 0, orders: 0 };
        }

        // 3. Process Orders Data
        ordersSnap.forEach(docSnap => {
            const data = { id: docSnap.id, ...docSnap.data() };
            allOrders.push(data);
            totalOrders++;
            
            if(data.userId) uniqueCustomers.add(data.userId);

            // Grouping Logic for precise Dashboard display
            const rawStatus = data.orderStatus ? data.orderStatus.toLowerCase() : 'pending';
            
            // Map status logic
            let normalizedStatus = 'Pending';
            if(rawStatus.includes('deliver') || rawStatus.includes('complet')) {
                normalizedStatus = 'Completed';
                completedCount++;
            } else if(rawStatus.includes('process') || rawStatus.includes('pack') || rawStatus.includes('ship')) {
                normalizedStatus = 'Processing';
                processingCount++;
            } else if(rawStatus.includes('cancel')) {
                normalizedStatus = 'Cancelled';
                cancelledCount++;
            }
            
            data.normalizedStatus = normalizedStatus; // Save for table filtering

            // Revenue Math (Exclude Cancelled)
            if (normalizedStatus !== 'Cancelled') {
                totalRevenue += parseFloat(data.totalAmount || 0);
            }

            // Chart Math (Group by Month)
            if(data.createdAt) {
                const orderDate = data.createdAt.toDate();
                const label = monthNames[orderDate.getMonth()] + ' ' + orderDate.getFullYear().toString().substr(-2);
                if(chartDataMap[label] !== undefined) {
                    chartDataMap[label].orders += 1;
                    if(normalizedStatus !== 'Cancelled') {
                        chartDataMap[label].revenue += parseFloat(data.totalAmount || 0);
                    }
                }
            }
        });

        // 4. Update UI 8 Summary Cards
        document.getElementById('c-users').innerText = totalUsers;
        document.getElementById('c-customers').innerText = uniqueCustomers.size;
        document.getElementById('c-revenue').innerText = `৳${totalRevenue.toLocaleString('en-IN')}`;
        document.getElementById('c-orders').innerText = totalOrders;
        document.getElementById('c-completed').innerText = completedCount;
        document.getElementById('c-processing').innerText = processingCount;
        document.getElementById('c-cancelled').innerText = cancelledCount;
        document.getElementById('c-products').innerText = totalProducts;

        // 5. Render Mixed Chart
        const revenueArray = last6Months.map(m => chartDataMap[m].revenue);
        const ordersArray = last6Months.map(m => chartDataMap[m].orders);
        renderMixedChart(last6Months, revenueArray, ordersArray);

        // 6. Initialize Data Table
        filteredOrders = [...allOrders];
        renderTablePage();

    } catch (error) {
        console.error("Initialization Error:", error);
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Error loading dashboard data. Check Firestore rules/indexes.</td></tr>';
    }
}

// ==========================================
// Chart.js Advanced Implementation
// ==========================================
function renderMixedChart(labels, revenueData, orderData) {
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Revenue (৳)',
                    data: revenueData,
                    type: 'line',
                    borderColor: '#3B82F6', // Info Blue
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#3B82F6',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Order Count',
                    data: orderData,
                    type: 'bar',
                    backgroundColor: '#E5E7EB', // Neutral Gray for bars behind
                    borderRadius: 4,
                    barPercentage: 0.5,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'end', labels: { usePointStyle: true, font: {family: 'Plus Jakarta Sans', weight: '600'} } },
                tooltip: { padding: 12, cornerRadius: 8, titleFont: {family: 'Plus Jakarta Sans', size: 14}, bodyFont: {family: 'Plus Jakarta Sans', size: 13} }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: {family: 'Plus Jakarta Sans', weight: '500'}, color: '#6B7280' } },
                y: { 
                    type: 'linear', display: true, position: 'left',
                    grid: { color: '#F3F4F6', borderDash: [5, 5] },
                    ticks: { callback: function(value) { return '৳' + value; }, font: {family: 'Plus Jakarta Sans'}, color: '#6B7280' },
                    border: {display: false}
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { stepSize: 1, font: {family: 'Plus Jakarta Sans'}, color: '#6B7280' },
                    border: {display: false}
                }
            }
        }
    });
}

// ==========================================
// Table Pagination, Filter & Render Logic
// ==========================================
searchInput.addEventListener('input', applyFilters);
statusFilter.addEventListener('change', applyFilters);

function applyFilters() {
    const term = searchInput.value.toLowerCase();
    const status = statusFilter.value;

    filteredOrders = allOrders.filter(order => {
        const matchSearch = (order.orderId && order.orderId.toLowerCase().includes(term)) || 
                            (order.customerName && order.customerName.toLowerCase().includes(term));
        const matchStatus = status === 'All' ? true : order.normalizedStatus === status;
        
        return matchSearch && matchStatus;
    });

    currentPage = 1;
    renderTablePage();
}

btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTablePage(); } });
btnNext.addEventListener('click', () => { if ((currentPage * itemsPerPage) < filteredOrders.length) { currentPage++; renderTablePage(); } });

async function renderTablePage() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSlice = filteredOrders.slice(startIndex, endIndex);

    if (currentSlice.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-secondary);">No orders match your criteria.</td></tr>';
        updatePaginationInfo();
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Rendering rows...</td></tr>';

    // To be perfectly optimized, fetch "Product Count" from order_items ONLY for the displayed rows concurrently
    let html = '';
    
    const rowPromises = currentSlice.map(async (order) => {
        // Optimized query to fetch items count for this specific order
        const itemsQ = query(collection(db, "order_items"), where("orderDocId", "==", order.id));
        const itemsSnap = await getDocs(itemsQ);
        let totalItemsInOrder = 0;
        itemsSnap.forEach(i => { totalItemsInOrder += (i.data().quantity || 1); });

        const dateStr = order.createdAt ? order.createdAt.toDate().toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A';
        
        // Define color badge based on normalized status requested in prompt
        let badgeClass = 'bg-blue'; // Default Pending
        if(order.normalizedStatus === 'Completed') badgeClass = 'bg-green';
        if(order.normalizedStatus === 'Processing') badgeClass = 'bg-orange';
        if(order.normalizedStatus === 'Cancelled') badgeClass = 'bg-red';

        return `
            <tr>
                <td><strong>#${order.orderId || order.id.substring(0,6)}</strong></td>
                <td>
                    <div style="font-weight:600; color:var(--text-primary);">${order.customerName || 'Unknown'}</div>
                    <div style="font-size:0.8rem; color:var(--text-tertiary);">${order.customerPhone || 'N/A'}</div>
                </td>
                <td style="text-align:center;">
                    <span style="background:var(--bg-body); padding:2px 8px; border-radius:12px; font-size:0.85rem; font-weight:600; border:1px solid var(--border-color);">${totalItemsInOrder}</span>
                </td>
                <td style="font-weight:700;">৳${order.totalAmount}</td>
                <td><span style="font-size:0.85rem; color:var(--text-secondary); font-weight:500;">${order.paymentMethod}</span></td>
                <td><span class="badge ${badgeClass}">${order.orderStatus}</span></td>
                <td style="font-size:0.85rem; color:var(--text-secondary);">${dateStr}</td>
                <td>
                    <a href="order-details.html?id=${order.id}" class="btn-icon btn-edit" title="View Details">
                        <i class="fas fa-eye"></i>
                    </a>
                </td>
            </tr>
        `;
    });

    const rows = await Promise.all(rowPromises);
    tableBody.innerHTML = rows.join('');
    updatePaginationInfo();
}

function updatePaginationInfo() {
    const total = filteredOrders.length;
    const start = total === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    
    pageInfo.innerText = `Showing ${start} to ${end} of ${total} entries`;
    
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = end >= total;
}
