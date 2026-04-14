import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const photoGrid = document.getElementById('photo-grid');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const categorySelect = document.getElementById('category-select');

// --- 1. LOAD PHOTOS ---
async function loadPhotos(filter = 'all') {
    let query = supabase.from('fotos').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
        query = query.eq('categoria', filter);
    }

    const { data, error } = await query;
    if (error) return console.error(error);

    photoGrid.innerHTML = '';
    
    if (data.length === 0) {
        photoGrid.innerHTML = '<p style="text-align:center; color:#ff4d94; grid-column: 1/-1;">No memories found here yet ❤️</p>';
    }

    data.forEach(foto => {
        const catLabel = foto.categoria || 'Us';
        const card = document.createElement('div');
        card.className = `photo-card`;
        card.innerHTML = `
            <img src="${foto.url}" alt="Memory">
            <div class="card-controls">
                <select class="edit-category" data-id="${foto.id}">
                    <option value="Us" ${catLabel === 'Us' ? 'selected' : ''}>Us</option>
                    <option value="Roblox" ${catLabel === 'Roblox' ? 'selected' : ''}>Roblox</option>
                    <option value="Haneen" ${catLabel === 'Haneen' ? 'selected' : ''}>Haneen</option>
                    <option value="Josh" ${catLabel === 'Josh' ? 'selected' : ''}>Josh</option>
                </select>
                <button class="delete-btn" data-id="${foto.id}">Delete</button>
            </div>
        `;
        photoGrid.appendChild(card);
    });

    // Event: Update Category
    document.querySelectorAll('.edit-category').forEach(select => {
        select.onchange = async (e) => {
            const { error } = await supabase
                .from('fotos')
                .update({ categoria: e.target.value })
                .eq('id', e.target.dataset.id);
            if (!error) loadPhotos(document.querySelector('.filter-btn.active').dataset.filter);
        };
    });

    // Event: Delete Photo
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if(confirm("Are you sure you want to delete this memory?")) {
                await supabase.from('fotos').delete().eq('id', btn.dataset.id);
                loadPhotos(document.querySelector('.filter-btn.active').dataset.filter);
            }
        };
    });
}

// --- 2. MULTIPLE UPLOAD ---
uploadBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    const selectedCategory = categorySelect.value;

    if (files.length === 0) return alert("Please select some photos first!");

    uploadBtn.innerText = "Uploading...";
    uploadBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        // CAMBIA ESTO POR TUS DATOS REALES DE CLOUDINARY
        formData.append('upload_preset', 'ml_default_hj'); 

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dgtnqy7zn/image/upload', {
                method: 'POST',
                body: formData
            });
            const fileData = await res.json();

            if (fileData.secure_url) {
                await supabase.from('fotos').insert([{
                    url: fileData.secure_url,
                    public_id: fileData.public_id,
                    categoria: selectedCategory 
                }]);
            }
        } catch (err) {
            console.error("Upload error:", err);
        }
    }

    uploadBtn.innerText = "Upload Photos";
    uploadBtn.disabled = false;
    fileInput.value = '';
    loadPhotos();
});

// --- 3. FILTERS ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadPhotos(e.target.dataset.filter);
    });
});

loadPhotos();