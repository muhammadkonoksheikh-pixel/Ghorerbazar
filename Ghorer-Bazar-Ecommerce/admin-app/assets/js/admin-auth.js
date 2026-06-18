import { app, auth } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// Check if current page is the login page
const isLoginPage = window.location.pathname.includes('login.html');

// Initialize Realtime Database Instance using existing app
const database = getDatabase(app);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 1. CHECK RULE 1: If it's your primary admin email, allow access instantly
        if (user.email === 'admin@ghorerbazar.com') {
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
            } else {
                // Update profile info in topbar
                const adminNameEl = document.getElementById('admin-name');
                if (adminNameEl) {
                    adminNameEl.innerText = "Super Admin";
                }
            }
            return; // Exit checking since primary admin is always valid
        }

        // 2. CHECK RULE 2: Fallback to Realtime Database verification for other admins
        try {
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, `admins/${user.uid}`));
            
            if (snapshot.exists()) {
                const adminData = snapshot.val();
                
                if (adminData.role === 'admin') {
                    // Valid Admin User
                    if (isLoginPage) {
                        window.location.href = 'dashboard.html';
                    } else {
                        // Update profile info in topbar
                        const adminNameEl = document.getElementById('admin-name');
                        if (adminNameEl) {
                            adminNameEl.innerText = adminData.name || user.email;
                        }
                    }
                } else {
                    throw new Error("Access Denied: Invalid admin role.");
                }
            } else {
                throw new Error("Access Denied: UID not found in Realtime Database.");
            }
        } catch (error) {
            console.error("Error verifying admin credentials:", error);
            
            // Log out unauthorized attempts
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
    } else {
        // No user signed in
        if (!isLoginPage) {
            window.location.href = 'login.html';
        }
    }
});

// Logout action listener
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
