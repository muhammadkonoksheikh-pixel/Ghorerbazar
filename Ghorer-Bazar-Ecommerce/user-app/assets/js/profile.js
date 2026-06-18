import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
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
    if (loadingIndicator) loadingIndicator.style.display = 'none';

    if (user) {
        currentUserUid = user.uid;
        if (loggedInContainer) loggedInContainer.style.display = 'grid';
        if (loggedOutContainer) loggedOutContainer.style.display = 'none';
        
        await loadUserData(user.uid);
    } else {
        currentUserUid = null;
        if (loggedInContainer) loggedInContainer.style.display = 'none';
        if (loggedOutContainer) loggedOutContainer.style.display = 'block';
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

        const displayName = userData.name || auth.currentUser?.displayName || 'User';
        const displayEmail = userData.email || auth.currentUser?.email || 'user@example.com';
        
        // Auto Avatar API
        const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2e7d32&color=fff&size=150&bold=true`;

        // Update Sidebar
        if (sidebarName) sidebarName.innerText = displayName;
        if (sidebarEmail) sidebarEmail.innerText = displayEmail;
        if (sidebarPhoto) sidebarPhoto.src = userData.photoURL || autoAvatar;

        // Populate Fields Safely (Checking if elements exist in HTML)
        if (formName) formName.value = displayName;
        if (formEmail) formEmail.value = displayEmail;
        if (formPhone) formPhone.value = userData.phone || '';
        if (formDistrict) formDistrict.value = userData.district || '';
        if (formUpazila) formUpazila.value = userData.upazila || '';
        if (formAddress) formAddress.value = userData.address || '';

    } catch (error) {
        console.error("Error loading user profile:", error);
        applyFallbackData();
    }
}

function applyFallbackData() {
    const name = auth.currentUser?.displayName || 'User';
    if (sidebarName) sidebarName.innerText = name;
    if (sidebarEmail) sidebarEmail.innerText = auth.currentUser?.email || 'user@example.com';
    if (sidebarPhoto) sidebarPhoto.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2e7d32&color=fff&bold=true`;
    if (formName) formName.value = name;
    if (formEmail) formEmail.value = auth.currentUser?.email || '';
}

// Update profile details with Defensive Programming
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('save-profile-btn');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;
        }

        // Failsafe: Checking each element separately to avoid "Cannot read properties of null" error
        const nameVal = formName ? formName.value.trim() : (auth.currentUser?.displayName || "User");
        const phoneVal = formPhone ? formPhone.value.trim() : "";
        const districtVal = formDistrict ? formDistrict.value.trim() : "";
        const upazilaVal = formUpazila ? formUpazila.value.trim() : "";
        const addressVal = formAddress ? formAddress.value.trim() : "";

        try {
            if (!currentUserUid) {
                throw new Error("User session not found. Please log in again.");
            }

            const userRef = doc(db, "users", currentUserUid);
            const autoAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameVal)}&background=2e7d32&color=fff&bold=true`;

            // Force write document even if it is completely new or missing
            await setDoc(userRef, {
                uid: currentUserUid,
                name: nameVal,
                phone: phoneVal,
                district: districtVal,
                upazila: upazilaVal,
                address: addressVal,
                photoURL: autoAvatar
            }, { merge: true });

            // Sync with active UI
            if (sidebarName) sidebarName.innerText = nameVal;
            if (sidebarPhoto) sidebarPhoto.src = autoAvatar;

            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Your profile details have been updated successfully.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Firestore Write Failed:", error);
            
            // Displays the exact raw error code and message so you know exactly why it failed
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: `Reason: ${error.message} (Code: ${error.code || 'JS_ERROR'})`,
                confirmButtonColor: '#2e7d32'
            });
        } finally {
            if (btn) {
                btn.innerHTML = 'Save Changes';
                btn.disabled = false;
            }
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
