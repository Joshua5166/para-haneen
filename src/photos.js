import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

const photoGrid = document.getElementById('photo-grid');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const categorySelect = document.getElementById('category-select');

// Variable global para controlar el lightbox
let lightbox = null;

// --- FUNCIÓN PARA INICIALIZAR O REFRESCAR EL VISUALIZADOR (LIGHTBOX) ---
function initLightbox() {
    // Si ya existe, lo destruimos para limpiar memoria y eventos viejos
    if (lightbox) {
        lightbox.destroy();
    }
    
    // Creamos uno nuevo con la configuración para que se sienta como App
    lightbox = new PhotoSwipeLightbox({
        gallery: '#photo-grid',
        children: 'a.photo-link',
        pswpModule: PhotoSwipe,
        // Configuración de UI para que sea suave en móvil
        showHideAnimationType: 'zoom',
        padding: { top: 20, bottom: 20, left: 20, right: 20 },
        escKey: true,
        arrowKeys: true
    });
    lightbox.init();
}

// --- 1. CARGAR FOTOS ---
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
        // Incluso si no hay fotos, matamos el lightbox viejo si existe
        if (lightbox) lightbox.destroy();
        return;
    }

    data.forEach(foto => {
        const catLabel = foto.categoria || 'Us';
        
        const card = document.createElement('div');
        card.className = `photo-card`;
        
        // --- AQUÍ ESTÁ EL TRUCO PARA QUE NO SE ABRA EN OTRA PÁGINA ---
        // 1. Aseguramos que el link <a> tenga la clase 'photo-link'
        // 2. data-pswp-width/height genéricos para que PhotoSwipe los calcule al cargar
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

    // 3. ¡BLINDAJE TOTAL! Prevenimos el comportamiento por defecto de TODOS los enlaces photo-link
    // Esto asegura que NO se abran en otra pestaña.
    document.querySelectorAll('.photo-link').forEach(link => {
        link.addEventListener('click', (e) => {
            // Si PhotoSwipe está cargado, prevenimos que el navegador maneje el clic
            if (PhotoSwipe && PhotoSwipeLightbox) {
                e.preventDefault();
            }
        });
    });

    // Conectar eventos de los nuevos elementos (cambiar categoría y borrar)
    setupCardEvents();
    
    // 4. Inicializar el visualizador DESPUÉS de haber blindado los links
    initLightbox();
}

function setupCardEvents() {
    // Evento: Cambiar categoría
    document.querySelectorAll('.edit-category').forEach(select => {
        select.onchange = async (e) => {
            const id = e.target.dataset.id;
            const newCategory = e.target.value;
            await supabase.from('fotos').update({ categoria: newCategory }).eq('id', id);
            const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
            loadPhotos(currentFilter);
        };
    });

    // Evento: Borrar Foto
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            // e.preventDefault() aquí es crucial para que al borrar no se abra la foto
            e.preventDefault(); 
            e.stopPropagation(); // Previene que el evento suba al link <a>
            if(confirm("Are you sure?")) {
                await supabase.from('fotos').delete().eq('id', btn.dataset.id);
                const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
                loadPhotos(currentFilter);
            }
        };
    });
}

// --- 2. SUBIDA MÚLTIPLE ---
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
                    categoria: selectedCategory
                }]);
            }
        } catch (err) {
            console.error("Upload error", err);
        }
    }

    uploadBtn.innerText = "Upload Photos";
    uploadBtn.disabled = false;
    fileInput.value = '';
    // Después de subir, mostramos la categoría subida o 'Us'
    loadPhotos(selectedCategory);
});

// --- 3. FILTROS ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadPhotos(e.target.dataset.filter);
    });
});

// Carga inicial
loadPhotos();