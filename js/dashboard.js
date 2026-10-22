import { Store } from './store.js';
import { renderTodayCard } from './today.js?v=4';
import { calcProgress, progressClass, escapeHtml, examInfo } from './utils.js?v=6';

// Palette de tons terre pour distinguer les matières sans sortir de la palette générale.
const SUBJECT_COLORS = [
    { color: '#c0492a', tint: '#f3e0d3' }, // terracotta
    { color: '#96712c', tint: '#f1ead0' }, // ocre
    { color: '#7a6f9e', tint: '#eae6f0' }, // prune muette
    { color: '#6b7a3d', tint: '#e8ecd0' }, // sauge / olive
    { color: '#b45d6b', tint: '#f3e1e4' }, // rose poudré
    { color: '#3f6f7a', tint: '#dde9ec' }, // bleu-vert profond
];

export function renderDashboard() {
    const app = document.getElementById('app');
    const subjects = Store.getSubjects();

    // Stats globales
    let globalTotal = 0, globalDone = 0;
    for (const s of subjects) {
        for (const cat of s.categories) {
            globalTotal += cat.items.length;
            globalDone += cat.items.filter(i => i.done).length;
        }
    }
    const globalProgress = globalTotal === 0 ? 0 : Math.round((globalDone / globalTotal) * 100);
    const globalPClass = progressClass(globalProgress);

    // Matières en retard (< 50% avec des éléments)
    const behindSubjects = subjects.filter(s => {
        const hasItems = s.categories.some(c => c.items.length > 0);
        return hasItems && calcProgress(s) < 50;
    });

    // Examens à venir (triés par proximité, passés exclus)
    const upcomingExams = [];
    for (const s of subjects) {
        if (!s.exams) continue;
        for (const exam of s.exams) {
            const info = examInfo(exam.date);
            if (info && info.days >= 0) {
                const checkDone = exam.checklist.filter(c => c.done).length;
                const checkTotal = exam.checklist.length;
                upcomingExams.push({ subject: s, exam, info, checkDone, checkTotal });
            }
        }
    }
    upcomingExams.sort((a, b) => a.info.days - b.info.days);

    // Ligne de résumé dynamique — remplace la description vague par un chiffre concret
    const summaryLine = subjects.length === 0
        ? ''
        : `${subjects.length} matière${subjects.length > 1 ? 's' : ''} · ${globalDone} sur ${globalTotal} cours coché${globalDone > 1 ? 's' : ''}`;

    const calendarHtml = `
                <section class="calendar-section${isCalendarCollapsed() ? ' is-collapsed' : ''}" id="calendar-section" aria-labelledby="calendar-title">
                    <div class="panel-heading">
                        <div class="panel-heading-icon" aria-hidden="true">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                        </div>
                        <div><h2 id="calendar-title">Agenda</h2>${getIcs() ? '' : '<p class="calendar-hint">Importe ton emploi du temps (.ics) : tes matières sont créées toutes seules.</p>'}</div>
                        <div class="calendar-actions">
                            <label class="btn btn-secondary btn-sm" title="Importer un fichier .ics">
                                Importer .ics
                                <input type="file" id="ics-import" accept=".ics,text/calendar" hidden>
                            </label>
                            ${getIcs() ? `<button type="button" class="btn btn-ghost btn-sm" id="ics-clear" title="Retirer l'agenda importé">Retirer</button>` : ''}
                            <button type="button" class="btn-icon calendar-toggle" id="calendar-toggle" aria-expanded="${!isCalendarCollapsed()}" aria-controls="calendar-body" aria-label="Réduire l'agenda" title="Réduire / déplier l'agenda">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>
                            </button>
                        </div>
                    </div>
                    <div class="calendar-body" id="calendar-body">
                        <div id="calendar" class="calendar"></div>
                    </div>
                </section>
    `;

    app.innerHTML = `
        <div class="dashboard">
            <section class="page-heading" aria-labelledby="dashboard-title">
                <div>
                    <h1 id="dashboard-title">Tes cours</h1>
                    ${summaryLine ? `<p>${summaryLine}</p>` : ''}
                </div>
                ${subjects.length > 0 ? `
                    <button class="btn btn-primary" id="add-subject-top">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                        Nouvelle matière
                    </button>
                ` : ''}
            </section>

            ${subjects.length > 0 ? `
                <section class="global-summary" aria-labelledby="progress-title">
                    <div class="summary-copy">
                        <h2 id="progress-title">Où tu en es</h2>
                    </div>
                    <div class="summary-progress">
                        <div class="summary-progress-heading">
                            <span>Semestre entier</span>
                            <strong>${globalProgress}<small>%</small></strong>
                        </div>
                        <div class="progress-bar progress-bar-lg" role="progressbar" aria-label="Progression sur le semestre entier" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${globalProgress}">
                            <div class="progress-fill ${globalPClass}" style="width: ${globalProgress}%"></div>
                        </div>
                    </div>
                </section>

                <div id="today-slot"></div>

                ${calendarHtml}

                ${upcomingExams.length > 0 ? `
                    <section class="exams-upcoming" aria-labelledby="upcoming-title">
                        <div class="panel-heading">
                            <div class="panel-heading-icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
                            </div>
                            <div><h2 id="upcoming-title">Prochains examens</h2></div>
                        </div>
                        <div class="exams-list">
                            ${upcomingExams.map(e => {
                                const dateFormatted = new Date(e.exam.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
                                const readyPct = e.checkTotal > 0 ? Math.round((e.checkDone / e.checkTotal) * 100) : null;
                                return `
                                <a class="exam-row exam-${e.info.urgency}" href="#/subject/${e.subject.id}" aria-label="${escapeHtml(e.subject.name)} — ${escapeHtml(e.exam.name)}, ${dateFormatted}, ${e.info.label}">
                                    <span class="exam-icon" aria-hidden="true">${e.info.icon}</span>
                                    <span class="exam-row-info">
                                        <span class="exam-name">${escapeHtml(e.subject.name)} <span class="exam-separator">·</span> ${escapeHtml(e.exam.name)}</span>
                                        ${readyPct !== null ? `<span class="exam-ready">Prêt à ${readyPct}%</span>` : ''}
                                    </span>
                                    <span class="exam-date">${dateFormatted}</span>
                                    <span class="exam-countdown">${e.info.label}</span>
                                    <svg class="exam-row-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
                                </a>
                                `;
                            }).join('')}
                        </div>
                    </section>
                ` : ''}

                ${behindSubjects.length > 0 ? `
                    <aside class="behind-alert">
                        <span class="behind-icon" aria-hidden="true">✦</span>
                        <span><strong>Un peu en retard :</strong><span class="focus-list">${behindSubjects.map(s => escapeHtml(s.name)).join(' · ')}</span></span>
                    </aside>
                ` : ''}

                <section class="subjects-section" aria-labelledby="subjects-title">
                    <div class="dashboard-header">
                        <div><h2 id="subjects-title">Mes matières</h2></div>
                        <span class="subject-total">${subjects.length} matière${subjects.length > 1 ? 's' : ''}</span>
                    </div>
                    <div class="subjects-grid">
                        ${subjects.map((s, i) => renderCard(s, i)).join('')}
                        <button class="add-card" id="add-subject-card" type="button">
                            <span class="add-card-icon" aria-hidden="true">+</span>
                            <span>Ajouter une matière</span>
                        </button>
                    </div>
                </section>
            ` : `
                <section class="welcome-card" aria-labelledby="welcome-title">
                    <div class="welcome-art" aria-hidden="true">
                        <div class="welcome-art-sheet sheet-back"></div>
                        <div class="welcome-art-sheet sheet-front">
                            <span></span><span></span><span></span>
                            <i><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4 4L19 6"/></svg></i>
                        </div>
                    </div>
                    <h2 id="welcome-title">Ton cahier est vide.</h2>
                    <p>Ajoute une matière. Ensuite tu pourras y déposer tes CM, TD, TP, et noter tes dates d'examens.</p>
                    <button class="btn btn-primary btn-welcome" id="add-subject-card" type="button">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                        Créer ma première matière
                    </button>
                </section>

                <div id="today-slot"></div>

                ${calendarHtml}
            `}
        </div>
    `;

    renderCalendar(subjects);
    setupCalendarControls();
    renderTodayCard(document.getElementById('today-slot'));

    // Events
    app.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Supprimer « ${btn.dataset.name} » ? Ses cours et fichiers partent avec.`)) {
                Store.deleteSubject(btn.dataset.id);
                renderDashboard();
                window.scrollTo(0, 0);
            }
        });
    });

    app.querySelectorAll('#add-subject-card, #add-subject-top').forEach(button => {
        button.addEventListener('click', showAddSubjectModal);
    });
}

// Calendrier FullCalendar : un événement par examen, coloré selon la matière.
function renderCalendar(subjects) {
    const el = document.getElementById('calendar');
    if (!el || typeof FullCalendar === 'undefined') {
        if (el) el.innerHTML = '<p class="calendar-empty">Le calendrier n\'a pas pu se charger (connexion ?).</p>';
        return;
    }

    const events = [];
    subjects.forEach((s, i) => {
        const colors = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
        (s.exams || []).forEach(exam => {
            if (!exam.date) return;
            events.push({
                id: exam.id,
                title: `${s.name} · ${exam.name}`,
                start: exam.date,
                allDay: true,
                url: `#/subject/${s.id}`,
                backgroundColor: colors.tint,
                borderColor: colors.color,
                textColor: colors.color,
            });
        });
    });

    const eventSources = [{ events }];
    const icsText = getIcs();
    if (icsText) {
        eventSources.push({
            backgroundColor: 'var(--paper-shade)',
            borderColor: 'var(--muted)',
            textColor: 'var(--ink-soft)',
            events(info, success, failure) {
                try { success(icsToEvents(icsText, info.start, info.end).filter(e => !EXAM_PREFIX.test(e.title))); }
                catch (err) { console.error('Lecture .ics impossible', err); failure(err); }
            },
        });
    }

    const calendar = new FullCalendar.Calendar(el, {
        locale: 'fr',
        initialView: 'timeGridWeek',
        firstDay: 1,
        height: 440,
        nowIndicator: true,
        slotMinTime: '08:00:00',
        slotMaxTime: '20:00:00',
        scrollTime: '08:00:00',
        expandRows: true,
        allDayText: 'Jour',
        slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
        eventSources,
        headerToolbar: { left: 'title', right: 'today prev,next' },
        buttonText: { today: "Aujourd'hui" },
        eventClick(info) {
            if (!info.event.url) return;
            info.jsEvent.preventDefault();
            location.hash = info.event.url.replace(/^.*#/, '#');
        },
        eventSourceFailure() { alert("Impossible de lire ce fichier .ics."); },
    });
    calendar.render();
}

// Transforme un fichier .ics en événements FullCalendar pour la période [start, end[.
function icsToEvents(text, start, end) {
    const root = new ICAL.Component(ICAL.parse(text));
    root.getAllSubcomponents('vtimezone').forEach(tz => {
        const name = tz.getFirstPropertyValue('tzid');
        if (name && !ICAL.TimezoneService.has(name)) ICAL.TimezoneService.register(name, new ICAL.Timezone(tz));
    });
    const vevents = root.getAllSubcomponents('vevent').map(v => new ICAL.Event(v));
    const masters = vevents.filter(e => !e.recurrenceId);
    vevents.filter(e => e.recurrenceId).forEach(ex => {
        const m = masters.find(x => x.uid === ex.uid);
        if (m) m.relateException(ex);
    });
    const toDate = (t) => t.zone && t.zone.tzid === 'floating' && !t.isDate
        ? new Date(t.year, t.month - 1, t.day, t.hour, t.minute, t.second)
        : t.isDate ? new Date(t.year, t.month - 1, t.day) : t.toJSDate();
    const out = [];
    const push = (ev, details) => {
        const s = details ? details.startDate : ev.startDate;
        const e = details ? details.endDate : ev.endDate;
        const item = details ? details.item : ev;
        const allDay = s.isDate;
        const sd = toDate(s), ed = e ? toDate(e) : null;
        if (ed ? (ed <= start && !(sd >= start)) || sd >= end : sd >= end || sd < start) return;
        out.push({
            id: ev.uid + '|' + sd.getTime(),
            title: item.summary || '(sans titre)',
            start: sd, end: ed, allDay,
            extendedProps: { location: item.location || '' },
        });
    };
    masters.forEach(ev => {
        if (ev.isRecurring()) {
            const it = ev.iterator();
            let next, n = 0;
            while ((next = it.next()) && n++ < 3000) {
                if (toDate(next) >= end) break;
                const d = ev.getOccurrenceDetails(next);
                if (d.item && d.item.component && d.item.component.getFirstPropertyValue('status') === 'CANCELLED') continue;
                push(ev, d);
            }
        } else push(ev);
    });
    return out;
}

// "TD2 Algorithmique 1 (SMINFL3C)" -> { name: "Algorithmique 1", code: "SMINFL3C" } ; null si le titre n'a pas de type d'enseignement.
// Gère aussi "TP 2A …" (groupe), "S3 406 -TP …" (salle) et les suffixes "(info)", "(1h + 20mn 1/3 temps)".
const TYPE_PREFIX = /^\s*(?:[A-Z]\d+\s+\d+\s*-\s*)?(CM|TD|TP|CC|CT|EXAM(?:EN)?|PARTIEL)\s*(\d*)(?:\s+(not[ée]e?s?|\d[A-Z]))?\s*[-:–]?\s+/i;
function parseCourseTitle(title) {
    if (!TYPE_PREFIX.test(title || '')) return null;
    const rest = title.replace(TYPE_PREFIX, '');
    const code = (rest.match(/\(([A-Z0-9]{5,})\)/) || [])[1] || null;
    const name = rest.split('(')[0].replace(/\s+/g, ' ').trim();
    return name ? { name, code } : null;
}

// Noms de matières distincts d'un .ics : le code (SINFL3E2) sert à regrouper les variantes d'un même nom,
// on garde alors le nom le plus complet.
function subjectNamesFromIcs(text) {
    const root = new ICAL.Component(ICAL.parse(text));
    const byCode = new Map();
    const noCode = new Map();
    for (const ve of root.getAllSubcomponents('vevent')) {
        const p = parseCourseTitle(ve.getFirstPropertyValue('summary'));
        if (!p) continue;
        if (p.code) {
            const prev = byCode.get(p.code);
            if (!prev || p.name.length > prev.length) byCode.set(p.code, p.name);
        } else if (!noCode.has(p.name.toLowerCase())) {
            noCode.set(p.name.toLowerCase(), p.name);
        }
    }
    const names = [...byCode.values()];
    const lower = new Set(names.map(n => n.toLowerCase()));
    for (const [key, name] of noCode) if (!lower.has(key)) names.push(name);
    return { names, byCode };
}

// Nom de matière d'un titre, aligné sur les matières existantes (par nom exact ou par code).
function subjectFor(title, { names, byCode }) {
    const p = parseCourseTitle(title);
    if (!p) return null;
    if (p.code && byCode.has(p.code)) return byCode.get(p.code);
    const lower = p.name.toLowerCase();
    const match = names.find(n => n.toLowerCase() === lower)
        || names.find(n => n.toLowerCase().startsWith(lower) || lower.startsWith(n.toLowerCase()));
    return match || p.name;
}

// Identifiant stable dérivé d'un texte : importer le même agenda sur deux appareils produit les mêmes ids, que la synchro fusionne.
const idStable = (...parties) => 'ics-' + parties.join('-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Crée les matières manquantes à partir d'un .ics ; renvoie le nombre de matières créées.
function createSubjectsFromIcs(text) {
    const known = new Set(Store.getSubjects().map(s => s.name.toLowerCase()));
    let created = 0;
    for (const name of subjectNamesFromIcs(text).names) {
        if (known.has(name.toLowerCase())) continue;
        Store.addSubject(name, idStable('matiere', name));
        known.add(name.toLowerCase());
        created++;
    }
    return created;
}

// Évaluations : titres commençant par CC, CT ou TP noté.
const EXAM_PREFIX = /^\s*(?:[A-Z]\d+\s+\d+\s*-\s*)?(CC|CT|TP\s+not[ée]e?s?)(?![A-Za-zÀ-ÿ])/i;

// Ajoute chaque évaluation de l'agenda comme examen de sa matière (sans doublon) ; renvoie le nombre ajouté.
function importExamsFromIcs(text) {
    const names = subjectNamesFromIcs(text);
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
    const to = new Date();
    to.setFullYear(to.getFullYear() + 2);
    const pad = n => String(n).padStart(2, '0');
    let added = 0;
    for (const ev of icsToEvents(text, from, to)) {
        if (!EXAM_PREFIX.test(ev.title)) continue;
        const subjectName = subjectFor(ev.title, names);
        const subject = subjectName && Store.getSubjects().find(x => x.name.toLowerCase() === subjectName.toLowerCase());
        if (!subject) continue;
        const m = ev.title.match(TYPE_PREFIX);
        const examName = m ? `${m[1].toUpperCase()}${m[2] || ''}${/^not/i.test(m[3] || '') ? ' noté' : ''}`.trim() : 'Examen';
        const date = `${ev.start.getFullYear()}-${pad(ev.start.getMonth() + 1)}-${pad(ev.start.getDate())}`;
        if ((subject.exams || []).some(x => x.date === date && x.name === examName)) continue;
        Store.addExam(subject.id, examName, date, idStable('examen', subject.id, date, examName));
        added++;
    }
    return added;
}

const ICS_KEY = 'cahier_ics';
const CAL_COLLAPSED_KEY = 'cahier_agenda_collapsed';

function getIcs() {
    try { return localStorage.getItem(ICS_KEY); } catch { return null; }
}

function isCalendarCollapsed() {
    try { return localStorage.getItem(CAL_COLLAPSED_KEY) === '1'; } catch { return false; }
}

function setupCalendarControls() {
    const section = document.getElementById('calendar-section');
    if (!section) return;
    const body = document.getElementById('calendar-body');
    const toggle = document.getElementById('calendar-toggle');
    const COLLAPSED_H = 96;

    if (section.classList.contains('is-collapsed')) body.style.maxHeight = COLLAPSED_H + 'px';

    toggle.addEventListener('click', () => {
        const collapsing = !section.classList.contains('is-collapsed');
        body.style.maxHeight = body.scrollHeight + 'px';
        void body.offsetHeight; // force le reflow pour que la transition démarre
        if (collapsing) {
            section.classList.add('is-collapsed');
            body.style.maxHeight = COLLAPSED_H + 'px';
        } else {
            section.classList.remove('is-collapsed');
            body.style.maxHeight = body.scrollHeight + 'px';
            body.addEventListener('transitionend', () => {
                if (!section.classList.contains('is-collapsed')) body.style.maxHeight = 'none';
            }, { once: true });
        }
        toggle.setAttribute('aria-expanded', String(!collapsing));
        try { localStorage.setItem(CAL_COLLAPSED_KEY, collapsing ? '1' : '0'); } catch { /* ignore */ }
    });

    document.getElementById('ics-import').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const text = await file.text();
        e.target.value = ''; // permet de réimporter le même fichier
        if (!text.includes('BEGIN:VCALENDAR')) {
            alert("Ce fichier ne ressemble pas à un calendrier .ics.");
            return;
        }
        try { localStorage.setItem(ICS_KEY, text); } catch { alert("Fichier trop volumineux pour être enregistré."); return; }
        try {
            const created = createSubjectsFromIcs(text);
            const exams = importExamsFromIcs(text);
            const parts = [];
            if (created > 0) parts.push(`${created} matière${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''}`);
            if (exams > 0) parts.push(`${exams} examen${exams > 1 ? 's' : ''} ajouté${exams > 1 ? 's' : ''}`);
            if (parts.length) alert(`${parts.join(' et ')} depuis l'agenda.`);
        } catch (err) { console.error('Import des matières et examens impossible', err); }
        renderDashboard();
    });

    const clear = document.getElementById('ics-clear');
    if (clear) clear.addEventListener('click', () => {
        if (confirm("Retirer l'agenda importé ?")) {
            try { localStorage.removeItem(ICS_KEY); } catch { /* ignore */ }
            renderDashboard();
        }
    });
}

function renderCard(subject, index) {
    const progress = calcProgress(subject);
    const pClass = progressClass(progress);
    const colors = SUBJECT_COLORS[index % SUBJECT_COLORS.length];

    let totalItems = 0, doneItems = 0;
    for (const cat of subject.categories) {
        totalItems += cat.items.length;
        doneItems += cat.items.filter(i => i.done).length;
    }
    const remaining = totalItems - doneItems;

    // Prochain examen à venir
    const exams = (subject.exams || [])
        .map(e => ({ exam: e, info: examInfo(e.date) }))
        .filter(e => e.info && e.info.days >= 0)
        .sort((a, b) => a.info.days - b.info.days);

    let examBadgeHtml = '';
    if (exams.length > 0) {
        const nearest = exams[0];
        const iconPart = nearest.info.icon ? `${nearest.info.icon} ` : '';
        examBadgeHtml = `<span class="exam-badge exam-badge-${nearest.info.urgency}">${iconPart}${nearest.info.label}</span>`;
        if (exams.length > 1) {
            examBadgeHtml += `<span class="exam-badge exam-badge-calm">+${exams.length - 1} examen${exams.length > 2 ? 's' : ''}</span>`;
        }
    }

    return `
        <article class="subject-card" style="--subject-color: ${colors.color}; --subject-tint: ${colors.tint}">
            <a class="subject-card-link" href="#/subject/${subject.id}">
                <div class="subject-card-top">
                    <span class="subject-mark" aria-hidden="true">${escapeHtml(subject.name.trim().charAt(0).toUpperCase() || 'M')}</span>
                    <span class="card-name">${escapeHtml(subject.name)}</span>
                </div>
                ${examBadgeHtml ? `<div class="card-exams">${examBadgeHtml}</div>` : ''}
                <div class="card-stats">
                    ${doneItems > 0 ? `<span class="stat-badge done">✓ ${doneItems} coché${doneItems > 1 ? 's' : ''}</span>` : ''}
                    ${remaining > 0 ? `<span class="stat-badge remaining">${remaining} à faire</span>` : ''}
                    ${totalItems === 0 ? `<span class="stat-badge remaining">Rien encore</span>` : ''}
                </div>
                <div class="card-footer">
                    <div class="card-progress-row">
                        <div class="progress-bar" role="progressbar" aria-label="Progression de ${escapeHtml(subject.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}">
                            <div class="progress-fill ${pClass}" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-pct">${progress}%</span>
                    </div>
                </div>
            </a>
            <button class="btn-icon danger delete-btn" data-id="${subject.id}" data-name="${escapeHtml(subject.name)}" aria-label="Supprimer ${escapeHtml(subject.name)}" title="Supprimer la matière">×</button>
        </article>
    `;
}

function showAddSubjectModal() {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = 'Nouvelle matière';
    document.getElementById('modal-body').innerHTML = `
        <label for="subject-name">Comment tu l'appelles ?</label>
        <input type="text" id="subject-name" placeholder="Maths, Algo, Anglais…" autofocus>
    `;

    overlay.classList.remove('hidden');
    setTimeout(() => document.getElementById('subject-name').focus(), 100);

    const cleanup = () => {
        overlay.classList.add('hidden');
        ['modal-confirm', 'modal-cancel', 'modal-close'].forEach(id => {
            const el = document.getElementById(id);
            el.replaceWith(el.cloneNode(true));
        });
    };

    const doConfirm = () => {
        const name = document.getElementById('subject-name').value.trim();
        if (name) {
            Store.addSubject(name);
            cleanup();
            renderDashboard();
        }
    };

    document.getElementById('modal-confirm').addEventListener('click', doConfirm);
    document.getElementById('modal-cancel').addEventListener('click', cleanup);
    document.getElementById('modal-close').addEventListener('click', cleanup);
    document.getElementById('subject-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doConfirm();
        if (e.key === 'Escape') cleanup();
    });
}
