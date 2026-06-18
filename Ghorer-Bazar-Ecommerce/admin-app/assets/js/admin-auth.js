import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Check if we are on the login page
const isLoginPage = window.location.pathname.includes('login.html');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in, verify if admin
        try {
            const adminDoc = await getDoc(doc(db, "admins", user.uid));
            
            if (adminDoc.exists()) {
                // User is an admin
                if (isLoginPage) {
                    window.location.href = 'dashboard.html';
                } else {
                    // Update profile info in topbar if elements exist
                    const adminNameEl = document.getElementById('admin-name');
                    if (adminNameEl) {
                        adminNameEl.innerText = adminDoc.data().name || user.email;
                    }
                }
            } else {
                // Not an admin
                await signOut(auth);
                if (!isLoginPage) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: 'You do not have administrative privileges.'
                    }).then(() => {
                        window.location.href = 'login.html';
                    });
                }
            }
        } catch (error) {
            console.error("Error verifying admin:", error);
            if (!isLoginPage) window.location.href = 'login.html';
        }
    } else {
        // No user signed in
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
    }
});

// Logout functionality
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('admin-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            Swal.fire({
                title: 'Logout',
                text: "Are you sure you want to log out of the admin panel?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#2e7d32',
                cancelButtonColor: '#dc3545',
                confirmButtonText: 'Yes, Logout'
            }).then((result) => {
                if (result.isConfirmed) {
                    signOut(auth).then(() => {
                        window.location.href = 'login.html';
                    });
                }
            });
        });
    }

    // Sidebar Toggle for Mobile
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
});