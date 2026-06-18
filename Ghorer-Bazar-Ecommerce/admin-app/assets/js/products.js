import { db } from './firebase-config.js';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const productsList = document.getElementById('products-list');
const searchInput = document.getElementById('search-product');
const productCount = document.getElementById('product-count');
let allProducts = [];

document.addEventListener('DOMContentLoaded', loadProducts);

async function loadProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allProducts = [];
        snapshot.forEach(docSnap => {
            allProducts.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        renderTable(allProducts);
    } catch (error) {
        console.error("Error loading products:", error);
        productsList.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load products.</td></tr>';
    }
}

function renderTable(products) {
    productCount.innerText = `Total Products: ${products.length}`;
    
    if (products.length === 0) {
        productsList.innerHTML = '<tr><td colspan="6" style="text-align: center;">No products found.</td></tr>';
        return;
    }

    let html = '';
    products.forEach(p => {
        const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : '../user-app/assets/images/placeholder.jpg';
        const badgeHTML = p.isFlashSale ? '<span class="badge warning" style="background:#ffc107; color:#333;">Flash Sale</span>' : '<span class="badge success">Active</span>';

        html += `
            <tr>
                <td><img src="${imgUrl}" alt="${p.name}" class="product-img-td"></td>
                <td style="max-width:250px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${p.name}</strong></td>
                <td>${p.categoryName || 'General'}</td>
                <td>৳${p.price}</td>
                <td>${badgeHTML}</td>
                <td>
                    <div class="action-btns">
                        <a href="edit-product.html?id=${p.id}" class="btn-icon btn-edit" title="Edit"><i class="fas fa-edit"></i></a>
                        <button class="btn-icon btn-delete" data-id="${p.id}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    productsList.innerHTML = html;
    attachDeleteListeners();
}

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderTable(filtered);
});

function attachDeleteListeners() {
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            Swal.fire({
                title: 'Are you sure?',
                text: "This product will be permanently deleted!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, delete it!'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await deleteDoc(doc(db, "products", id));
                        Swal.fire('Deleted!', 'Product has been deleted.', 'success');
                        loadProducts(); // Refresh list
                    } catch (error) {
                        Swal.fire('Error', 'Failed to delete product.', 'error');
                        console.error(error);
                    }
                }
            });
        });
    });
}