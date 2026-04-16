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
    data.forEach(vid => {
        const card = document.createElement('div');
        card.className = 'photo-card'; // Reutilizamos tu estilo de tarjeta
        card.innerHTML = `
            <video width="100%" controls style="border-radius: 10px;">
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
            if(confirm("Delete video?")) {
                await supabase.from('videos').delete().eq('id', btn.dataset.id);
                loadVideos();
            }
        };
    });
}

// --- UPLOAD VIDEO ---
uploadBtn.addEventListener('click', async () => {
    const file = videoInput.files[0];
    if (!file) return alert("Select a video!");

    uploadBtn.innerText = "Uploading...";
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default_hj'); 

    try {
        // OJO: Aquí usamos /video/upload en lugar de /image/upload
        const res = await fetch('https://api.cloudinary.com/v1_1/dgtnqy7zn/video/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.secure_url) {
            await supabase.from('videos').insert([{ url: data.secure_url }]);
            loadVideos();
        }
    } catch (err) {
        console.error(vid);
    }
    uploadBtn.innerText = "Upload Video";
    videoInput.value = '';
});

loadVideos();