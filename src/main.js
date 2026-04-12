import { createClient } from '@supabase/supabase-js'

// Inicializamos Supabase con tus variables del .env
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const uploadButton = document.getElementById('upload-widget');

// Creamos un selector de archivos oculto
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// Al darle clic al botón rosa, se abre el selector de archivos
uploadButton.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Mostramos un mensaje de carga sencillo
  uploadButton.innerText = 'Uploading...';
  uploadButton.disabled = true;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default_hj'); // Tu preset Unsigned
  formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);

  try {
    // 1. Subida directa a Cloudinary
    const res = await fetch(`https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (data.secure_url) {
      console.log('Cloudinary Success:', data.secure_url);

      // 2. Guardar el link en Supabase
      const { error } = await supabase
        .from('fotos')
        .insert([{ 
          url: data.secure_url, 
          descripcion: 'A special memory' // Texto en inglés para Haneen
        }]);

      if (error) throw error;

      alert('SUCCESS! Memory saved for Haneen ❤️');
      location.reload(); 
    } else {
      throw new Error(data.error.message);
    }
  } catch (err) {
    console.error('Error:', err);
    alert('Upload failed: ' + err.message);
  } finally {
    uploadButton.innerText = 'Upload Photo';
    uploadButton.disabled = false;
  }
});
// 1. Función para obtener las fotos de Supabase
async function loadMemories() {
  const { data: fotos, error } = await supabase
    .from('fotos')
    .select('*')
    .order('created_at', { ascending: false }); // Las más nuevas primero

  if (error) {
    console.error('Error loading photos:', error);
    return;
  }

  const container = document.getElementById('photo-collage');
  container.innerHTML = ''; // Limpiamos el cargando

  fotos.forEach(foto => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
      <img src="${foto.url}" alt="Memory">
      <p>${foto.descripcion || ''}</p>
    `;
    container.appendChild(card);
  });
}

// 2. Ejecutar la función al cargar la página
loadMemories();