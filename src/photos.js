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
                    <option value="Movies" ${catLabel === 'Movies' ? 'selected' : ''}>Movies 🍿</option> 
                </select>
                <button class="delete-btn" data-id="${foto.id}">Delete</button>
            </div>
        `;
        photoGrid.appendChild(card);
    });

    // Event: Quick category update from the card
    document.querySelectorAll('.edit-category').forEach(select => {
        select.onchange = async (e) => {
            const id = e.target.dataset.id;
            const newCategory = e.target.value;

            const { error } = await supabase
                .from('fotos')
                .update({ categoria: newCategory })
                .eq('id', id);

            if (error) {
                alert("Error moving photo");
            } else {
                // Refresh the current view
                const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
                loadPhotos(currentFilter);
            }
        };
    });

    // Event: Delete Photo
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if(confirm("Are you sure you want to delete this memory?")) {
                const { error } = await supabase.from('fotos').delete().eq('id', btn.dataset.id);
                if (!error) {
                    const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
                    loadPhotos(currentFilter);
                }
            }
        };
    });
}

// --- 2. MULTIPLE UPLOAD TO CLOUDINARY & SUPABASE ---
uploadBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    const selectedCategory = categorySelect.value;

    if (files.length === 0) return alert("Please select some photos first!");

    uploadBtn.innerText = "Uploading...";
    uploadBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('upload_preset', 'ml_default_hj'); // Your verified preset

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/dgtnqy7zn/image/upload', {
                method: 'POST',
                body: formData
            });
            const fileData = await res.json();

            if (fileData.secure_url) {
                // Inserting only existing columns in your Supabase table
                await supabase.from('fotos').insert([{
                    url: fileData.secure_url,
                    categoria: selectedCategory,
                    descripcion: 'A special memory'
                }]);
            }
        } catch (err) {
            console.error("Upload error at index " + i, err);
        }
    }

    uploadBtn.innerText = "Upload Photos";
    uploadBtn.disabled = false;
    fileInput.value = '';
    
    // Refresh to show new photos in the 'all' or selected filter
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    loadPhotos(activeFilter);
});

// --- 3. FILTER BUTTONS LOGIC ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadPhotos(e.target.dataset.filter);
    });
});

// Initial load
loadPhotos();