import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Referencias a los elementos del DOM (IDs corregidos)
const songsGrid = document.getElementById('songs-grid');
const addBtn = document.getElementById('add-song-btn');
const modal = document.getElementById('songModal');
const modalTitle = document.getElementById('modalTitle');
const videoContainer = document.getElementById('videoContainer');
const closeModalBtn = document.getElementById('close-modal-btn');

// --- 1. FUNCIÓN PARA CARGAR Y MOSTRAR CANCIONES ---
async function loadSongs() {
    const { data, error } = await supabase
        .from('canciones')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error("Error cargando canciones:", error);

    // Guardamos los datos para el buscador
    window.allSongs = data;
    renderSongs(data);
}

// Función para renderizar las tarjetas en la pantalla
function renderSongs(songsToRender) {
    songsGrid.innerHTML = '';

    if (songsToRender.length === 0) {
        songsGrid.innerHTML = '<p style="text-align:center; color:#ff4d94; grid-column:1/-1;">No songs found ❤️</p>';
        return;
    }

    songsToRender.forEach(song => {
        const videoId = song.youtube_id; // Columna de tu Supabase
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="video-thumbnail">
                <img src="${thumbUrl}" alt="Thumbnail">
                <div class="play-overlay">▶</div>
            </div>
            <div class="song-footer">
                <span class="song-title">${song.titulo}</span>
                <button class="delete-song-btn" data-id="${song.id}">&times;</button>
            </div>
        `;

        // Evento para abrir el modal al hacer clic en la miniatura
        card.querySelector('.video-thumbnail').addEventListener('click', () => {
            openModal(videoId, song.titulo);
        });

        // Evento para borrar la canción
        card.querySelector('.delete-song-btn').addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`¿Quieres quitar "${song.titulo}" de la playlist?`)) {
                const { error } = await supabase.from('canciones').delete().eq('id', song.id);
                if (!error) loadSongs();
            }
        });

        songsGrid.appendChild(card);
    });
}

// --- 2. LÓGICA DEL BUSCADOR ---
document.getElementById('song-search')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = window.allSongs.filter(song => 
        song.titulo.toLowerCase().includes(searchTerm)
    );
    renderSongs(filtered);
});

// --- 3. BOTÓN DE CANCIÓN ALEATORIA ---
document.getElementById('random-song-btn')?.addEventListener('click', () => {
    if (window.allSongs && window.allSongs.length > 0) {
        const randomIdx = Math.floor(Math.random() * window.allSongs.length);
        const song = window.allSongs[randomIdx];
        openModal(song.youtube_id, song.titulo);
    }
});

// --- 4. AGREGAR NUEVA CANCIÓN ---
addBtn.addEventListener('click', async () => {
    const titleInput = document.getElementById('song-title-input');
    const urlInput = document.getElementById('song-url-input');
    
    // Extraer ID de YouTube (soporta links cortos, largos y de móvil)
    const url = urlInput.value;
    const videoID = url.split('v=')[1]?.split('&')[0] || url.split('/').pop().split('?')[0];

    if (!titleInput.value || !videoID || videoID.length !== 11) {
        alert("Josh, pon un nombre y un link de YouTube válido ❤️");
        return;
    }

    addBtn.innerText = "Adding...";
    addBtn.disabled = true;

    const { error } = await supabase.from('canciones').insert([
        { titulo: titleInput.value, youtube_id: videoID }
    ]);

    if (error) {
        console.error(error);
        alert("Error al guardar en Supabase");
    } else {
        titleInput.value = '';
        urlInput.value = '';
        loadSongs();
    }
    
    addBtn.innerText = "Add to Playlist";
    addBtn.disabled = false;
});

// --- 5. FUNCIONES DEL MODAL ---
function openModal(id, title) {
    modalTitle.innerText = title;
    videoContainer.innerHTML = `
        <div class="video-container">
            <iframe src="https://www.youtube.com/embed/${id}?autoplay=1" 
                    frameborder="0" allowfullscreen allow="autoplay"></iframe>
        </div>`;
    modal.style.display = "block";
}

window.closeModal = function() {
    modal.style.display = "none";
    videoContainer.innerHTML = ""; 
};

// Cerrar al hacer clic en la X
closeModalBtn?.addEventListener('click', closeModal);

// Cerrar al hacer clic fuera del modal
window.onclick = (event) => {
    if (event.target == modal) {
        closeModal();
    }
};

// Carga inicial
loadSongs();