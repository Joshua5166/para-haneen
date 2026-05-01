import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const memoryInput = document.getElementById('memory-input');
const memoryAuthor = document.getElementById('memory-author');
const saveBtn = document.getElementById('save-memory-btn');
const surpriseBtn = document.getElementById('surprise-btn');
const modal = document.getElementById('memoryModal');
const memoriesList = document.getElementById('memories-list');

// --- 1. GUARDAR RECUERDO ---
saveBtn.addEventListener('click', async () => {
    const content = memoryInput.value.trim();
    const author = memoryAuthor.value;

    if (!content) return alert("You can't drop an empty memory! ❤️");

    saveBtn.innerText = "Saving...";
    const { error } = await supabase.from('memories').insert([{ content, author }]);

    if (!error) {
        memoryInput.value = '';
        alert("Memory dropped into the box! 📥✨");
        loadAllMemories(); // Recargamos el listado de cartas
    } else {
        alert("Error saving memory.");
    }
    saveBtn.innerText = "Drop in the Box 📥";
});

// --- 2. SURPRISE ME ---
surpriseBtn.addEventListener('click', async () => {
    const { data, error } = await supabase.from('memories').select('*');
    
    if (error || !data || data.length === 0) {
        return alert("The box is empty! Let's write some memories first. ❤️");
    }

    const randomIdx = Math.floor(Math.random() * data.length);
    const memory = data[randomIdx];

    openModal(memory.content, memory.author, memory.created_at);
});

// --- 3. MOSTRAR TODAS LAS MEMORIAS EN FORMATO CARTA ---
async function loadAllMemories() {
    const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading memories:", error);
        return;
    }

    memoriesList.innerHTML = '';

    if (!data || data.length === 0) {
        memoriesList.innerHTML = '<p style="grid-column: 1/-1; color: #888;">No letters in the box yet. 📪</p>';
        return;
    }

    data.forEach(memory => {
        // Formateamos la fecha a algo legible (ej: May 1, 2026)
        const dateObj = new Date(memory.created_at);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'letter-card';
        card.innerHTML = `
            <div class="letter-icon">✉️</div>
            <div class="letter-to">For: Both of Us</div>
            <div class="letter-from">From: <strong>${memory.author}</strong></div>
            <div class="letter-date">${formattedDate}</div>
        `;

        // Al hacer clic, abre la carta
        card.addEventListener('click', () => {
            openModal(memory.content, memory.author, memory.created_at);
        });

        memoriesList.appendChild(card);
    });
}

// --- FUNCIONES DE CONTROL DEL MODAL ---
function openModal(content, author, date) {
    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    document.getElementById('memory-text').innerText = `"${content}"`;
    document.getElementById('memory-info').innerText = `- Written by ${author} on ${formattedDate}`;
    modal.style.display = "block";
}

window.closeMemoryModal = () => {
    modal.style.display = "none";
};

// Cerrar si hace clic fuera del modal
window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = "none";
    }
};

// Carga inicial
loadAllMemories();