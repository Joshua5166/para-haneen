import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const songList = document.getElementById('songs-list');
const addBtn = document.getElementById('add-song');

// Referencias del Modal (Coincidiendo con tu HTML)
const modal = document.getElementById('songModal');
const modalTitle = document.getElementById('modalTitle');
const videoContainer = document.getElementById('videoContainer');

// Función para extraer el ID de YouTube
function getYouTubeID(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- 1. CARGAR CANCIONES ---
async function loadSongs() {
  const { data, error } = await supabase
    .from('canciones')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return console.error(error);

  songList.innerHTML = '';
  data.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <h3>${song.titulo}</h3>
      <div class="video-thumbnail" data-id="${song.youtube_id}" data-title="${song.titulo}">
        <img src="https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg" alt="Play">
        <div class="play-overlay">▶</div>
      </div>
      <button class="delete-btn" data-id="${song.id}">Remove Song</button>
    `;
    songList.appendChild(card);
  });

  // Evento para ABRIR el Modal
  document.querySelectorAll('.video-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const videoID = thumb.getAttribute('data-id');
      const title = thumb.getAttribute('data-title');
      
      modalTitle.innerText = title;
      videoContainer.innerHTML = `
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/${videoID}?autoplay=1" frameborder="0" allowfullscreen allow="autoplay"></iframe>
        </div>`;
      modal.style.display = "block";
    });
  });

  // Evento para BORRAR
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if(confirm("Remove from playlist?")) {
        await supabase.from('canciones').delete().eq('id', id);
        loadSongs();
      }
    });
  });
}

// --- 2. AGREGAR CANCIÓN ---
addBtn.addEventListener('click', async () => {
  const titleInput = document.getElementById('song-title');
  const linkInput = document.getElementById('youtube-link');
  const videoID = getYouTubeID(linkInput.value);

  if (!titleInput.value || !videoID) {
    alert("Please enter a title and a valid link ❤️");
    return;
  }

  const { error } = await supabase
    .from('canciones')
    .insert([{ titulo: titleInput.value, youtube_id: videoID }]);

  if (!error) {
    titleInput.value = '';
    linkInput.value = '';
    loadSongs();
  }
});

// --- 3. LÓGICA PARA CERRAR (Global para que el onclick del HTML funcione) ---
window.closeModal = function() {
  modal.style.display = "none";
  videoContainer.innerHTML = ""; 
};

window.onclick = (event) => {
  if (event.target == modal) {
    closeModal();
  }
};

loadSongs();