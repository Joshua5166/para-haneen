import { createClient } from '@supabase/supabase-js'
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import PhotoSwipe from 'photoswipe';
import 'photoswipe/style.css'; 

// 1. Configuración de Supabase
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

// 2. Referencias al DOM
const photoGrid = document.getElementById('photo-grid');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const categorySelect = document.getElementById('category-select');

let lightbox;

// 3. Función para inicializar el visualizador
function initLightbox() {
    console.log("Despertando PhotoSwipe... 🚀");
    
    if (lightbox) {
        lightbox.destroy();
    }

    lightbox = new PhotoSwipeLightbox({
        gallery: '#photo-grid',
        children: 'a.photo-link',
        pswpModule: PhotoSwipe,
        showHideAnimationType: 'zoom',
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
    });
    
    lightbox.init();
    console.log("PhotoSwipe listo ✅");
}

// 4. Cargar fotos de Supabase
async function loadPhotos(filter = 'all') {
    let query = supabase.from('fotos').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
        query = query.eq('categoria', filter);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error de Supabase:", error);
        return;
    }

    photoGrid.innerHTML = '';
    
    if (!data || data.length === 0) {
        photoGrid.innerHTML = '<p style="text-align:center; color:#ff4d94; grid-column: 1/-1; padding: 50px;">No memories found here yet ❤️</p>';
        if (lightbox) lightbox.destroy();
        return;
    }

    data.forEach(foto => {
        const catLabel = foto.categoria || 'Us';
        const card = document.createElement('div');
        card.className = `photo-card`;
        
        card.innerHTML = `
        <a href="${foto.url}" 
           class="photo-link" 
           onclick="event.preventDefault();" 
           data-pswp-width="1200" 
           data-pswp-height="1600">
            <img src="${foto.url}" alt="Memory" loading="lazy">
        </a>
        <div class="card-controls">
            <select class="edit-category" data-id="${foto.id}">
                <option value="Us" ${catLabel === 'Us' ? 'selected' : ''}>Us</option>
                <option value="Roblox" ${catLabel === 'Roblox' ? 'selected' : ''}>Roblox</option>
                <option value="Haneen" ${catLabel === 'Haneen' ? 'selected' : ''}>Haneen</option>
                <option value="Josh" ${catLabel === 'Josh' ? 'selected' : ''}>Josh</option>
                <option value="Movies" ${catLabel === 'Movies' ? 'selected' : ''}>Movies</option> 
            </select>
            <button class="delete-btn" data-id="${foto.id}">Delete</button>
        </div>
        `;
        photoGrid.appendChild(card);
    });

    setupCardEvents();
    
    // Pequeño delay para que el collage se renderice antes de activar PhotoSwipe
    setTimeout(() => {
        initLightbox();
    }, 100);
}

// 5. Eventos de las tarjetas (Borrar y Editar)
function setupCardEvents() {
    // Cambiar categoría
    document.querySelectorAll('.edit-category').forEach(select => {
        select.onchange = async (e) => {
            const id = e.target.dataset.id;
            const newCategory = e.target.value;
            await supabase.from('fotos').update({ categoria: newCategory }).eq('id', id);
            const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
            loadPhotos(currentFilter);
        };
    });

    // Borrar foto
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault(); 
            e.stopPropagation(); 
            if(confirm("Are you sure?")) {
                const { error } = await supabase.from('fotos').delete().eq('id', btn.dataset.id);
                if (!error) {
                    const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
                    loadPhotos(currentFilter);
                }
            }
        };
    });
}

// 6. Lógica de Subida Múltiple (Cloudinary + Supabase)
uploadBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    const selectedCategory = categorySelect.value;
    if (files.length === 0) return alert("Select photos first!");

    uploadBtn.innerText = "Uploading...";
    uploadBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
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
                    categoria: selectedCategory,
                    descripcion: 'A special memory'
                }]);
            }
        } catch (err) {
            console.error("Upload error", err);
        }
    }

    uploadBtn.innerText = "Upload Photos";
    uploadBtn.disabled = false;
    fileInput.value = '';
    loadPhotos('all');
});

// 7. Lógica de Filtros
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadPhotos(e.target.dataset.filter);
    });
});

// 8. Carga inicial
loadPhotos();