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

// --- GUARDAR RECUERDO ---
saveBtn.addEventListener('click', async () => {
    const content = memoryInput.value.trim();
    const author = memoryAuthor.value;

    if (!content) return alert("You can't drop an empty memory! ❤️");

    saveBtn.innerText = "Saving...";
    const { error } = await supabase.from('memories').insert([{ content, author }]);

    if (!error) {
        memoryInput.value = '';
        alert("Memory dropped into the box! 📥✨");
    } else {
        alert("Error saving memory.");
    }
    saveBtn.innerText = "Drop in the Box 📥";
});

// --- SURPRISE ME (LOGICA RANDOM) ---
surpriseBtn.addEventListener('click', async () => {
    // 1. Obtenemos todos los recuerdos
    const { data, error } = await supabase.from('memories').select('*');
    
    if (error || data.length === 0) {
        return alert("The box is empty! Let's write some memories first. ❤️");
    }

    // 2. Elegimos uno al azar
    const randomIdx = Math.floor(Math.random() * data.length);
    const memory = data[randomIdx];

    // 3. Lo mostramos en el modal
    document.getElementById('memory-text').innerText = `"${memory.content}"`;
    document.getElementById('memory-info').innerText = `- Written by ${memory.author}`;
    modal.style.display = "block";
});

window.closeMemoryModal = () => {
    modal.style.display = "none";
};