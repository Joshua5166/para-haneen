import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const photoGrid = document.getElementById('photo-grid');
const fileInput = document.getElementById('file-input');
const uploadBtn = document.getElementById('upload-btn');
const categorySelect = document.getElementById('category-select');

// --- 1. CARGAR FOTOS CON FILTRO ---
async function loadPhotos(filter = 'all') {
    let query = supabase.from('fotos').select('*').order('created_at', { ascending: false });
    
    if (filter !== 'all') {
        query = query.eq('categoria', filter);
    }

    const { data, error } = await query;
    if (error) return console.error(error);

    photoGrid.innerHTML = '';
    data.forEach(foto => {
        const card = document.createElement('div');
        card.className = `photo-card`;
        
        // Aquí agregamos el selector de categoría directamente en la tarjeta
        card.innerHTML = `
            <img src="${foto.url}" alt="Momento">
            <div class="card-controls">
                <select class="edit-category" data-id="${foto.id}">
                    <option value="Us" ${foto.categoria === 'Us' ? 'selected' : ''}>Us</option>
                    <option value="Roblox" ${foto.categoria === 'Roblox' ? 'selected' : ''}>Roblox</option>
                    <option value="Haneen" ${foto.categoria === 'Haneen' ? 'selected' : ''}>Haneen</option>
                    <option value="Josh" ${foto.categoria === 'Josh' ? 'selected' : ''}>Josh</option>
                </select>
                <button class="delete-btn" data-id="${foto.id}">×</button>
            </div>
        `;
        photoGrid.appendChild(card);
    });

    // EVENTO PARA EDITAR / MOVER CATEGORÍA
    document.querySelectorAll('.edit-category').forEach(select => {
        select.onchange = async (e) => {
            const id = e.target.dataset.id;
            const nuevaCategoria = e.target.value;

            const { error } = await supabase
                .from('fotos')
                .update({ categoria: nuevaCategoria })
                .eq('id', id);

            if (error) {
                alert("Error al mover la foto");
            } else {
                // Si estamos en un filtro específico, quitamos la foto de la vista
                const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;
                if (currentFilter !== 'all') {
                    loadPhotos(currentFilter);
                }
            }
        };
    });

    // EVENTO PARA BORRAR
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if(confirm("¿Seguro que quieres borrar este recuerdo?")) {
                await supabase.from('fotos').delete().eq('id', btn.dataset.id);
                loadPhotos(document.querySelector('.filter-btn.active').dataset.filter);
            }
        };
    });
}

// --- 2. SUBIDA MÚLTIPLE ---
uploadBtn.addEventListener('click', async () => {
    const files = fileInput.files;
    const categoriaSeleccionada = categorySelect.value;

    if (files.length === 0) return alert("Selecciona fotos primero");

    uploadBtn.innerText = "Subiendo...";
    uploadBtn.disabled = true;

    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('upload_preset', 'TU_PRESET_AQUI'); 

        try {
            const res = await fetch('https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/image/upload', {
                method: 'POST',
                body: formData
            });
            const fileData = await res.json();

            await supabase.from('fotos').insert([{
                url: fileData.secure_url,
                public_id: fileData.public_id,
                categoria: categoriaSeleccionada 
            }]);
        } catch (err) {
            console.error("Error al subir:", err);
        }
    }

    uploadBtn.innerText = "Subir Fotos";
    uploadBtn.disabled = false;
    fileInput.value = '';
    loadPhotos(document.querySelector('.filter-btn.active').dataset.filter);
});

// --- 3. LÓGICA DE FILTROS ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        loadPhotos(e.target.dataset.filter);
    });
});

loadPhotos();