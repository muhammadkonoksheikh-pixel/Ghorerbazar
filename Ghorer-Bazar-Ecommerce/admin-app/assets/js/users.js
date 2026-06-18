import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const usersList = document.getElementById('users-list');

document.addEventListener('DOMContentLoaded', loadUsers);

async function loadUsers() {
    try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            usersList.innerHTML = '<tr><td colspan="4" style="text-align:center;">No customers found.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('en-GB') : 'N/A';
            const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=2e7d32&color=fff`;

            html += `
                <tr>
                    <td>
                        <div class="user-info-td">
                            <img src="${data.photoURL || defaultAvatar}" alt="${data.name}" class="user-img">
                            <div>
                                <div class="user-name">${data.name || 'No Name'}</div>
                                <div class="user-email">${data.email || 'No Email'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${data.phone || '<span style="color:#aaa;">Not provided</span>'}</td>
                    <td>${data.district || 'N/A'}${data.upazila ? ', ' + data.upazila : ''}</td>
                    <td>${date}</td>
                </tr>
            `;
        });
        
        usersList.innerHTML = html;

    } catch (error) {
        console.error("Error loading users:", error);
        usersList.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red;">Failed to load data.</td></tr>';
    }
}
