import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

const videoGrid = document.getElementById('video-grid');
const videoInput = document.getElementById('video-input');
const uploadBtn = document.getElementById('upload-video-btn');

// --- LOAD VIDEOS ---
async function loadVideos() {
    const { data, error } = await supabase.from('videos').select('*').order('created_at', { ascending: false });
    if (error) return console.error(error);

    videoGrid.innerHTML = '';
    
    if (data.length === 0) {
        videoGrid.innerHTML = '<p style="text-align:center; color:#ff4d94; grid-column: 1/-1;">No video memories yet 🎥</p>';
    }

    data.forEach(vid => {
        const card = document.createElement('div');
        card.className = 'photo-card'; // Reutilizamos tu estilo de tarjeta
        card.innerHTML = `
            <video width="100%" controls style="border-radius: 10px; background: #000;">
                <source src="${vid.url}" type="video/mp4">
            </video>
            <div class="card-controls">
                <button class="delete-btn" data-id="${vid.id}">Delete</button>
            </div>
        `;
        videoGrid.appendChild(card);
    });

    // Evento borrar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if(confirm("Delete this video memory?")) {
                const { error } = await supabase.from('videos').delete().eq('id', btn.dataset.id);
                if (!error) loadVideos();
            }
        };
    });
}

// --- UPLOAD MULTIPLE VIDEOS ---
uploadBtn.addEventListener('click', async () => {
    const files = videoInput.files;
    if (files.length === 0) return alert("Select at least one video!");

    uploadBtn.disabled = true;
    const totalFiles = files.length;

    // Ciclo para subir cada video uno por uno
    for (let i = 0; i < totalFiles; i++) {
        uploadBtn.innerText = `Uploading (${i + 1}/${totalFiles})...`;
        
        const formData = new FormData();
        formData.append('file', files[i]);
        formData.append('upload_preset', 'ml_default_hj'); 

        try {
            // Importante: Endpoint de /video/upload
            const res = await fetch('https://api.cloudinary.com/v1_1/dgtnqy7zn/video/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.secure_url) {
                await supabase.from('videos').insert([{ 
                    url: data.secure_url,
                    categoria: 'General' // Puedes añadir un select de categoría si gustas
                }]);
            }
        } catch (err) {
            console.error("Error uploading file " + (i + 1), err);
        }
    }

    // Resetear interfaz
    uploadBtn.innerText = "Upload Videos";
    uploadBtn.disabled = false;
    videoInput.value = '';
    loadVideos();
});

loadVideos();