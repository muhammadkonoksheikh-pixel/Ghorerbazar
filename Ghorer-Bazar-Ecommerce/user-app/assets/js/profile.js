import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
// এখানে updateDoc এর বদলে setDoc ব্যবহার করা হয়েছে
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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
        loggedInContainer.style.display = 'grid';
        loggedOutContainer.style.display = 'none';
        
        await loadUserData(user.uid);
    } else {
        currentUserUid = null;
        loggedInContainer.style.display = 'none';
        loggedOutContainer.style.display = 'block';
    }
});

async function loadUserData(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        let userData = {};

        if (docSnap.exists()) {
            userData = docSnap.data();
        }

        // Display Name & Email fallback
        const displayName = userData.name || auth.currentUser.displayName || 'User';
        const displayEmail = userData.email || auth.currentUser.email || 'user@example.com';
        
        // Auto Avatar Generation (Using UI-Avatars API) based on user name
        const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2e7d32&color=fff&size=150&bold=true`;

        // Populate Sidebar
        sidebarName.innerText = displayName;
        sidebarEmail.innerText = displayEmail;
        sidebarPhoto.src = userData.photoURL || autoAvatar;

        // Populate Profile Fields
        formName.value = displayName;
        formEmail.value = displayEmail;
        formPhone.value = userData.phone || '';
        formDistrict.value = userData.district || '';
        formUpazila.value = userData.upazila || '';
        formAddress.value = userData.address || '';

    } catch (error) {
        console.error("Error loading user profile:", error);
        if(error.code === 'permission-denied') {
            Swal.fire('Database Locked', 'Please update your Firestore Security Rules to allow access.', 'error');
        }
        applyFallbackData();
    }
}

function applyFallbackData() {
    const name = auth.currentUser.displayName || 'User';
    sidebarName.innerText = name;
    sidebarEmail.innerText = auth.currentUser.email || 'user@example.com';
    sidebarPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2e7d32&color=fff&bold=true`;
    formName.value = name;
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
            const updatedName = formName.value.trim();
            
            // Generate auto avatar if name changed
            const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(updatedName)}&background=2e7d32&color=fff&bold=true`;

            // We use setDoc with { merge: true } so it forces save even if doc is missing
            await setDoc(userRef, {
                name: updatedName,
                phone: formPhone.value.trim(),
                district: formDistrict.value.trim(),
                upazila: formUpazila.value.trim(),
                address: formAddress.value.trim(),
                photoURL: autoAvatar
            }, { merge: true });

            // Sync with active UI
            sidebarName.innerText = updatedName;
            sidebarPhoto.src = autoAvatar;

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Your profile details have been updated successfully.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            Swal.fire('Update Failed', error.message, 'error');
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
