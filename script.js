// --- SEZIONE AUTENTICAZIONE ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password';

function openLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.getElementById('username').focus();
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        sessionStorage.setItem('isLoggedIn', 'true');
        closeLoginModal();
        updateUIForAuthState();
        showMessage('✅ Login effettuato!', 'success');
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
}

function logout() {
    sessionStorage.removeItem('isLoggedIn');
    updateUIForAuthState();
    showMessage('Logout effettuato.', 'success');
}

function updateUIForAuthState() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    document.body.classList.toggle('logged-in', isLoggedIn);
    document.getElementById('loginBtn').style.display = isLoggedIn ? 'none' : 'block';
    document.getElementById('logoutBtn').style.display = isLoggedIn ? 'block' : 'none';
    const emptyStateText = document.querySelector('#emptyState p');
    if (emptyStateText) {
        emptyStateText.textContent = isLoggedIn 
            ? 'Clicca su "Aggiungi Formula" per iniziare!' 
            : 'Effettua il login per aggiungere e gestire le formule.';
    }
    displayFormulas();
}


// --- VARIABILI GLOBALI ---
let formulas = [];
let editingFormulaId = null;

// --- GESTIONE INTERFACCIA (TABS, MODALS) ---
function switchTab(tabName, element) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    element.classList.add('active');
}

function openFormulaModal() {
    editingFormulaId = null;
    document.getElementById('modalTitle').textContent = 'Aggiungi Nuova Formula';
    document.getElementById('saveButton').textContent = '💾 Salva';
    // Pulisci il form
    document.getElementById('formulaTitle').value = '';
    document.getElementById('formulaCategory').value = '';
    document.getElementById('formulaLatex').value = '';
    document.getElementById('formulaDescription').value = '';
    document.getElementById('formulaUsage').value = '';
    document.getElementById('formulaExample').value = '';
    updatePreview();
    document.getElementById('formulaModal').style.display = 'block';
}

function closeFormulaModal() {
    document.getElementById('formulaModal').style.display = 'none';
}

// --- GESTIONE FORMULE (CRUD) ---
function loadFormulas() {
    const saved = localStorage.getItem('mathFormulas');
    formulas = saved ? JSON.parse(saved) : [];
    updateCategories();
    displayFormulas();
}

function saveFormulas() {
    localStorage.setItem('mathFormulas', JSON.stringify(formulas));
    loadFormulas(); 
}

function saveFormula() {
    const formulaData = {
        id: editingFormulaId || Date.now(),
        title: document.getElementById('formulaTitle').value.trim(),
        category: document.getElementById('formulaCategory').value.trim(),
        latex: document.getElementById('formulaLatex').value.trim(),
        description: document.getElementById('formulaDescription').value.trim(),
        usage: document.getElementById('formulaUsage').value.trim(),
        example: document.getElementById('formulaExample').value.trim(),
    };

    if (!formulaData.title || !formulaData.category || !formulaData.latex) {
        return showMessage('Nome, Categoria e Formula sono campi obbligatori!', 'error-message');
    }

    if (editingFormulaId) {
        const index = formulas.findIndex(f => f.id === editingFormulaId);
        formulas[index] = formulaData;
        showMessage('✅ Formula aggiornata!', 'success');
    } else {
        formulas.push(formulaData);
        showMessage('✅ Formula aggiunta!', 'success');
    }
    
    saveFormulas();
    closeFormulaModal();
}

function editFormula(id) {
    const formula = formulas.find(f => f.id === id);
    if (!formula) return;

    editingFormulaId = id;
    document.getElementById('modalTitle').textContent = 'Modifica Formula';
    document.getElementById('saveButton').textContent = '💾 Aggiorna';

    document.getElementById('formulaTitle').value = formula.title;
    document.getElementById('formulaCategory').value = formula.category;
    document.getElementById('formulaLatex').value = formula.latex;
    document.getElementById('formulaDescription').value = formula.description;
    document.getElementById('formulaUsage').value = formula.usage;
    document.getElementById('formulaExample').value = formula.example;
    
    updatePreview();
    document.getElementById('formulaModal').style.display = 'block';
}

function deleteFormula(id) {
    if (confirm('Sei sicuro di voler eliminare questa formula?')) {
        formulas = formulas.filter(f => f.id !== id);
        saveFormulas();
        showMessage('🗑️ Formula eliminata.', 'success');
    }
}

// --- RENDERING E FILTRI ---
function displayFormulas() {
    const grid = document.getElementById('formulasGrid');
    const empty = document.getElementById('emptyState');
    const activeCategory = document.querySelector('.category-tag.active')?.dataset.category || 'all';
    const query = document.getElementById('searchBox').value.toLowerCase();

    let filtered = formulas;

    if (activeCategory !== 'all') {
        filtered = filtered.filter(f => f.category === activeCategory);
    }
    if (query) {
        filtered = filtered.filter(f => Object.values(f).some(val => String(val).toLowerCase().includes(query)));
    }

    if (filtered.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        empty.style.display = 'none';
        grid.innerHTML = filtered.map(createFormulaCard).join('');
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }
}

function createFormulaCard(formula) {
    return `
        <div class="formula-card">
            <div class="formula-title">${formula.title}</div>
            <div class="category-tag">${formula.category}</div>
            <div class="formula-latex">\\[${formula.latex}\\]</div>
            <div class="formula-description">${formula.description}</div>
            <div class="formula-usage"><strong>📌 Quando si usa:</strong><br>${formula.usage}</div>
            <div class="formula-example"><strong>📝 Esempio:</strong><br>${formula.example}</div>
            <div class="formula-actions">
                <button class="edit-btn" onclick="editFormula(${formula.id})">✏️ Modifica</button>
                <button class="delete-btn" onclick="deleteFormula(${formula.id})">🗑️ Elimina</button>
            </div>
        </div>`;
}

function updateCategories() {
    const filter = document.getElementById('categoryFilter');
    const categories = ['all', ...new Set(formulas.map(f => f.category))];
    const activeCategory = document.querySelector('.category-tag.active')?.dataset.category || 'all';

    filter.innerHTML = categories.map(cat =>
        `<div class="category-tag ${cat === activeCategory ? 'active' : ''}" data-category="${cat}" onclick="filterByCategory('${cat}', this)">
            ${cat === 'all' ? 'Tutte' : cat}
        </div>`
    ).join('');
}

function filterByCategory(category, element) {
    document.querySelectorAll('.category-tag').forEach(tag => tag.classList.remove('active'));
    element.classList.add('active');
    displayFormulas();
}

function searchFormulas() {
    displayFormulas();
}

function updatePreview() {
    const latex = document.getElementById('formulaLatex').value;
    const preview = document.getElementById('latexPreview');
    preview.innerHTML = latex ? `\\[${latex}\\]` : '';
    if (window.MathJax) MathJax.typesetPromise([preview]);
}

// --- UTILITIES ---
function showMessage(message, type = 'success') {
    const container = document.getElementById('messageContainer');
    const div = document.createElement('div');
    div.className = `${type === 'error' ? 'error' : 'success'}-message`;
    div.textContent = message;
    container.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

function extractYouTubeId(url) {
    if(!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// --- IMPORT/EXPORT ---
function exportFormulas() {
    if (formulas.length === 0) return showMessage("Nessuna formula da esportare", "error");
    const dataStr = JSON.stringify(formulas, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `formulario_matematica.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importFormulas() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (confirm(`Vuoi importare ${imported.length} formule? Saranno aggiunte a quelle esistenti.`)) {
                formulas.push(...imported.map(f => ({...f, id: Date.now() + Math.random() })));
                saveFormulas();
            }
        } catch (err) {
            showMessage("Errore nell'importazione del file.", "error");
        }
    };
    reader.readAsText(file);
}

function printFormulas() { window.print(); }

// --- EVENT LISTENERS GLOBALI ---
window.addEventListener('DOMContentLoaded', () => {
    loadFormulas();
    updateUIForAuthState();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeFormulaModal();
    }
});