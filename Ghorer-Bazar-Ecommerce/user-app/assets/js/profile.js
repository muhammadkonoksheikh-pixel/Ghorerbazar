import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// Layout Containers
const loadingIndicator = document.getElementById('profile-loading');
const loggedOutContainer = document.getElementById('profile-logged-out-container');
const loggedInContainer = document.getElementById('profile-logged-in-container');

// DOM Form Elements
const sidebarName = document.getElementById('sidebar-name');
const sidebarEmail = document.getElementById('sidebar-email');
const sidebarPhoto = document.getElementById('sidebar-photo');

const formName = document.getElementById('prof-name');
const formPhone = document.getElementById('prof-phone');
const formEmail = document.getElementById('prof-email');
const formDistrict = document.getElementById('prof-district');
const formUpazila = document.getElementById('prof-upazila');
const formAddress = document.getElementById('prof-address');

const profileForm = document.getElementById('profile-form');
const logoutBtn = document.getElementById('profile-logout-btn');

let currentUserUid = null;

// Real-time Authentication Gate
onAuthStateChanged(auth, async (user) => {
    loadingIndicator.style.display = 'none';

    if (user) {
        currentUserUid = user.uid;
        // Show actual profile layout and hide fallback
        loggedInContainer.style.display = 'grid';
        loggedOutContainer.style.display = 'none';
        
        await loadUserData(user.uid);
    } else {
        currentUserUid = null;
        // Show clean Login/Register placeholder card, hide dashboard
        loggedInContainer.style.display = 'none';
        loggedOutContainer.style.display = 'block';
    }
});

async function loadUserData(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Populate Sidebar
            sidebarName.innerText = data.name || auth.currentUser.displayName || 'User';
            sidebarEmail.innerText = data.email || auth.currentUser.email;
            if(data.photoURL) sidebarPhoto.src = data.photoURL;

            // Populate Profile Fields
            formName.value = data.name || auth.currentUser.displayName || '';
            formEmail.value = data.email || auth.currentUser.email || '';
            formPhone.value = data.phone || '';
            formDistrict.value = data.district || '';
            formUpazila.value = data.upazila || '';
            formAddress.value = data.address || '';
        } else {
            // Fallback if document doesn't exist yet but user is logged in
            applyFallbackData();
        }
    } catch (error) {
        console.error("Error loading user profile:", error);
        
        // If Firestore rules deny access, show a clear message
        if(error.code === 'permission-denied') {
            Swal.fire('Database Locked', 'Please update your Firestore Security Rules to allow access.', 'error');
        }
        
        // Apply fallback data so the page isn't stuck on "Loading..."
        applyFallbackData();
    }
}

function applyFallbackData() {
    sidebarName.innerText = auth.currentUser.displayName || 'Ghorer Bazar User';
    sidebarEmail.innerText = auth.currentUser.email || 'user@example.com';
    formName.value = auth.currentUser.displayName || '';
    formEmail.value = auth.currentUser.email || '';
}

// Update profile details handler
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('save-profile-btn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const userRef = doc(db, "users", currentUserUid);
            await updateDoc(userRef, {
                name: formName.value.trim(),
                phone: formPhone.value.trim(),
                district: formDistrict.value.trim(),
                upazila: formUpazila.value.trim(),
                address: formAddress.value.trim()
            });

            // Sync with active UI
            sidebarName.innerText = formName.value.trim();

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Your profile details have been updated successfully.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            if(error.code === 'permission-denied') {
                Swal.fire('Update Failed', 'Permission denied. Check Firestore Rules.', 'error');
            } else {
                Swal.fire('Update Failed', error.message, 'error');
            }
        } finally {
            btn.innerHTML = 'Save Changes';
            btn.disabled = false;
        }
    });
}

// Action Sign Out handler
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be signed out of your account session.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2e7d32',
            cancelButtonColor: '#dc3545',
            confirmButtonText: 'Yes, Sign Out'
        }).then((result) => {
            if (result.isConfirmed) {
                signOut(auth).then(() => {
                    window.location.href = 'index.html';
                });
            }
        });
    });
}
