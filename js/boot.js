// Point d'entrée : le site ne se charge qu'après connexion à Supabase (accès privé, un seul compte).
import { sessionActive, seConnecter, seDeconnecter, demarrerSync } from './sync.js?v=3';

const ecran = document.getElementById('login');

function afficherLogin() {
    ecran.hidden = false;
    document.getElementById('login-form').addEventListener('submit', async e => {
        e.preventDefault();
        const erreur = document.getElementById('login-erreur');
        const bouton = e.target.querySelector('button');
        erreur.textContent = '';
        bouton.disabled = true;
        try {
            await seConnecter(e.target.email.value.trim(), e.target.motdepasse.value);
            location.reload();
        } catch (err) {
            erreur.textContent = err.message;
            bouton.disabled = false;
        }
    });
}

async function demarrer() {
    let session = null;
    try { session = await sessionActive(); } catch { /* réseau absent */ }
    if (!session) { afficherLogin(); return; }
    document.body.classList.add('connecte');
    document.getElementById('btn-logout').addEventListener('click', seDeconnecter);
    await demarrerSync(session);
    await import('./app.js?v=13');
}

demarrer();
