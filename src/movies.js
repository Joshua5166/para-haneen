import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
)

const movieGrid = document.getElementById('movie-grid');
const addBtn = document.getElementById('add-movie-btn');

// --- 1. LOAD MOVIES ---
async function loadMovies() {
    const { data, error } = await supabase
        .from('movies')
        .select('*')
        .order('watch_date', { ascending: false });

    if (error) return console.error(error);

    movieGrid.innerHTML = '';
    data.forEach(movie => {
        const stars = '⭐'.repeat(movie.rating);
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <img src="${movie.poster_url}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Poster'">
            <div class="movie-info">
                <div class="stars">${stars}</div>
                <h3>${movie.title}</h3>
                <p class="comment">"${movie.comment}"</p>
                <button class="delete-movie" data-id="${movie.id}">×</button>
            </div>
        `;
        movieGrid.appendChild(card);
    });

    // Event: Delete Movie
    document.querySelectorAll('.delete-movie').forEach(btn => {
        btn.onclick = async () => {
            if(confirm("Delete this movie from our history?")) {
                await supabase.from('movies').delete().eq('id', btn.dataset.id);
                loadMovies();
            }
        };
    });
}

// --- 2. ADD MOVIE ---
addBtn.addEventListener('click', async () => {
    const title = document.getElementById('movie-title').value;
    const poster = document.getElementById('movie-poster').value;
    const rating = document.getElementById('movie-rating').value;
    const comment = document.getElementById('movie-comment').value;

    if (!title || !poster) return alert("Title and Poster URL are required!");

    addBtn.innerText = "Adding...";
    
    const { error } = await supabase.from('movies').insert([{
        title,
        poster_url: poster,
        rating: parseInt(rating),
        comment: comment || "Loved it!"
    }]);

    if (error) {
        console.error(error);
        alert("Error adding movie");
    } else {
        // Clear inputs and reload
        document.getElementById('movie-title').value = '';
        document.getElementById('movie-poster').value = '';
        document.getElementById('movie-rating').value = '';
        document.getElementById('movie-comment').value = '';
        loadMovies();
    }
    addBtn.innerText = "Add to our Gallery";
});

loadMovies();