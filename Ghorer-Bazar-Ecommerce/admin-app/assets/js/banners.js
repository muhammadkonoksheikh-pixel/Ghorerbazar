import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dtmvxrmwg/image/upload';
const UPLOAD_PRESET = 'ghorer_bazar_preset'; // Replace if you changed your Cloudinary preset

const bannerForm = document.getElementById('add-banner-form');
const submitBtn = document.getElementById('btn-save-banner');
const listBody = document.getElementById('banners-list');

document.addEventListener('DOMContentLoaded', loadBanners);

async function loadBanners() {
    try {
        const q = query(collection(db, "banners"), orderBy("order", "asc"));
        const snapshot = await getDocs(q);
        
        if(snapshot.empty) {
            listBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No banners found.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            html += `
                <tr>
                    <td><img src="${data.imageUrl}" class="banner-img-td"></td>
                    <td><strong>${data.title}</strong><br><span style="font-size:0.8rem; color:#777;">${data.subtitle}</span></td>
                    <td>${data.order || 0}</td>
                    <td>
                        <button class="btn btn-danger btn-delete-banner" data-id="${docSnap.id}" style="padding: 5px 10px;"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        listBody.innerHTML = html;

        // Attach Delete Listeners
        document.querySelectorAll('.btn-delete-banner').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                if(confirm('Delete this banner from homepage?')) {
                    await deleteDoc(doc(db, "banners", id));
                    loadBanners();
                }
            });
        });

    } catch(e) {
        console.error(e);
        listBody.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Error loading banners.</td></tr>';
    }
}

bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = document.getElementById('b-image').files[0];
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    submitBtn.disabled = true;

    try {
        // Upload Image to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('folder', 'banners');

        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: formData });
        const data = await res.json();

        if (!data.secure_url) throw new Error('Image upload failed');

        // Save to Firestore
        await addDoc(collection(db, "banners"), {
            title: document.getElementById('b-title').value.trim(),
            subtitle: document.getElementById('b-subtitle').value.trim(),
            link: document.getElementById('b-link').value.trim(),
            imageUrl: data.secure_url,
            order: parseInt(document.getElementById('b-order').value),
            isActive: true
        });

        Swal.fire('Success', 'Banner uploaded successfully', 'success');
        bannerForm.reset();
        loadBanners();

    } catch (error) {
        Swal.fire('Error', error.message, 'error');
    } finally {
        submitBtn.innerHTML = 'Upload Banner';
        submitBtn.disabled = false;
    }
});
