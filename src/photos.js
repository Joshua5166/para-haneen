import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const uploadButton = document.getElementById('upload-widget');
const photoGrid = document.getElementById('photo-collage');

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// --- 1. CARGAR FOTOS Y ACTIVAR MASONRY ---
async function loadPhotos() {
  const { data, error } = await supabase
    .from('fotos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error(error);

  photoGrid.innerHTML = ''; 
  
  data.forEach(foto => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <img src="${foto.url}" alt="Memory">
      <p>${foto.descripcion || ''}</p>
      <button class="delete-btn" data-id="${foto.id}">Delete</button>
    `;
    photoGrid.appendChild(card);
  });

  // ASIGNAR BORRAR
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deletePhoto);
  });

  // INICIALIZAR MASONRY (Esperamos a que las imágenes carguen para que no se encimen)
  imagesLoaded(photoGrid, function() {
    new Masonry(photoGrid, {
      itemSelector: '.photo-card',
      columnWidth: '.photo-card',
      gutter: 20, // Espacio entre fotos
      percentPosition: true
    });
  });
}
// --- 2. ELIMINAR FOTO ---
async function deletePhoto(e) {
  const id = e.target.getAttribute('data-id');
  if (confirm("Are you sure you want to delete this memory?")) {
    const { error } = await supabase.from('fotos').delete().eq('id', id);
    if (!error) loadPhotos();
  }
}

// --- 3. SUBIR FOTO (Aquí está el fix del 401) ---
uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  uploadButton.innerText = 'Uploading...';
  uploadButton.disabled = true;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default_hj'); 
  // ESTA LÍNEA ES LA QUE EVITA EL ERROR 401:
  formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/joshua516/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (res.ok && data.secure_url) {
      await supabase.from('fotos').insert([{ url: data.secure_url, descripcion: 'A special memory' }]);
      loadPhotos();
    } else {
      alert("Cloudinary error: " + (data.error ? data.error.message : "Unauthorized"));
    }
  } catch (err) {
    alert("Upload failed.");
  } finally {
    uploadButton.innerText = 'Upload New Memory';
    uploadButton.disabled = false;
  }
});

loadPhotos();