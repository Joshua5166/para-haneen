import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const songList = document.getElementById('songs-list');
const addBtn = document.getElementById('add-song');

// Referencias para el Modal
const modal = document.getElementById('video-modal');
const modalBody = document.getElementById('modal-video-body');
const closeModal = document.querySelector('.close-modal');

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
    // Usamos una miniatura y un icono de play en lugar del iframe directo
    card.innerHTML = `
      <h3>${song.titulo}</h3>
      <div class="video-thumbnail" data-id="${song.youtube_id}">
        <img src="https://img.youtube.com/vi/${song.youtube_id}/mqdefault.jpg" alt="Play Music">
        <div class="play-overlay">▶</div>
      </div>
      <button class="delete-btn" data-id="${song.id}" style="width:100%; margin-top:10px;">Remove Song</button>
    `;
    songList.appendChild(card);
  });

  // Evento para ABRIR el Modal al hacer clic en la miniatura
  document.querySelectorAll('.video-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const videoID = thumb.getAttribute('data-id');
      // Insertamos el video con autoplay
      modalBody.innerHTML = `
        <div class="video-container">
          <iframe src="https://www.youtube.com/embed/${videoID}?autoplay=1" frameborder="0" allowfullscreen allow="autoplay"></iframe>
        </div>`;
      modal.style.display = "block";
    });
  });

  // Evento para BORRAR canciones
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-id');
      if(confirm("Remove this song from our playlist?")) {
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
    alert("Please enter a title and a valid YouTube link ❤️");
    return;
  }

  const { error } = await supabase
    .from('canciones')
    .insert([{ 
      titulo: titleInput.value,
      youtube_id: videoID 
    }]);

  if (!error) {
    titleInput.value = '';
    linkInput.value = '';
    loadSongs();
  } else {
    alert("Error adding song to the database");
  }
});

// --- 3. LÓGICA PARA CERRAR EL MODAL ---
// Usamos addEventListener para mejor respuesta en móviles
closeModal.addEventListener('click', () => {
  modal.style.display = "none";
  modalBody.innerHTML = ""; // Limpiamos el video para que deje de sonar
});

// Cerrar si hace clic fuera del contenido (en el fondo oscuro)
window.addEventListener('click', (event) => {
  if (event.target == modal) {
    modal.style.display = "none";
    modalBody.innerHTML = "";
  }
});

// Arrancar cargando la lista
loadSongs();