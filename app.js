// ── Helpers ──────────────────────────────────────────────
function today() {
  return new Date().toISOString().split('T')[0];
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = (new Date(dateStr) - new Date(today())) / 86400000;
  return Math.ceil(diff);
}
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}

// ── State ─────────────────────────────────────────────────
const STORAGE_KEY = 'taskflow_tasks_v2';

const defaultTasks = [
  { id:1, title:'JWT kimlik doğrulama entegrasyonu', desc:'Access + refresh token akışı kurulacak.', priority:'high', column:'doing', progress:70, tags:['backend'], project:'E-Ticaret API', due:'2025-05-10', delay:0 },
  { id:2, title:"Ürün listeleme API endpoint'i", desc:'Sayfalama ve filtreleme desteklenecek.', priority:'mid',  column:'doing', progress:45, tags:['api'],     project:'E-Ticaret API', due:'2025-05-15', delay:1 },
  { id:3, title:'Responsive tasarım düzeltmeleri', desc:'Mobil kırılma noktaları gözden geçirilecek.', priority:'low',  column:'doing', progress:20, tags:['frontend'], project:'Mobil Uygulama', due:'2025-05-20', delay:2 },
  { id:4, title:'Veritabanı indeksleme optimizasyonu', desc:'Yavaş sorgu logları incelenecek.', priority:'high', column:'doing', progress:55, tags:['db'],  project:'E-Ticaret API', due:'2025-05-08', delay:3 },
  { id:5, title:'Birim testleri yazıldı', desc:'Jest ile servis katmanı kapsandı.', priority:'mid',  column:'done',  progress:100, tags:['test'],   project:'Veri Boru Hattı', due:'2025-04-20', delay:0 },
  { id:6, title:'CI/CD pipeline kurulumu', desc:'GitHub Actions ile otomatik deploy.', priority:'high', column:'done',  progress:100, tags:['devops'], project:'E-Ticaret API', due:'2025-04-18', delay:1 },
  { id:7, title:'API dokümantasyonu (Swagger)', desc:'Tüm endpoint\'ler dokümante edildi.', priority:'low',  column:'done',  progress:100, tags:['docs'],   project:'Mobil Uygulama', due:'2025-04-22', delay:2 },
  { id:8, title:'Performans testleri', desc:'k6 ile load test senaryoları hazırlanacak.', priority:'mid',  column:'todo',  progress:0,   tags:['test'],   project:'Mobil Uygulama', due:'2025-05-30', delay:0 },
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultTasks;
  } catch { return defaultTasks; }
}
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let tasks       = loadTasks();
let nextId      = Math.max(...tasks.map(t => t.id), 0) + 1;
let draggedId   = null;
let editMode    = false;
let priorityFilter  = 'all';
let projectFilter   = null;
let searchQuery     = '';

const avatarColors = ['#6c63ff','#ff6584','#43e97b','#ffd93d','#a78bfa'];
const initials     = ['AK','SY','BÇ','AÖ'];

function getAvatars(n) {
  let html = '<div class="avatar-group">';
  for (let i = 0; i < Math.min(n, 3); i++) {
    html += `<div class="avatar" style="background:${avatarColors[i]}">${initials[i]}</div>`;
  }
  return html + '</div>';
}

// ── Render ────────────────────────────────────────────────
function getVisibleTasks() {
  return tasks.filter(t => {
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (projectFilter && t.project !== projectFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q)
        || (t.desc || '').toLowerCase().includes(q)
        || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
    }
    return true;
  });
}

function renderTasks() {
  const visible = getVisibleTasks();

  ['todo','doing','done'].forEach(col => {
    const el = document.getElementById('tasks-' + col);
    const colTasks = visible.filter(t => t.column === col);
    document.getElementById('cnt-' + col).textContent = colTasks.length;

    if (colTasks.length === 0) {
      el.innerHTML = `<div class="col-empty">Görev yok</div>`;
    } else {
      el.innerHTML = colTasks.map((t, i) => {
        const priorityClass = t.priority === 'high' ? 'priority-high' : t.priority === 'mid' ? 'priority-mid' : 'priority-low';
        const priorityLabel = t.priority === 'high' ? 'Yüksek' : t.priority === 'mid' ? 'Orta' : 'Düşük';
        const tag  = (t.tags || [])[0] || '';
        const days = daysUntil(t.due);
        let dueBadge = '';
        if (t.due && t.column !== 'done') {
          const cls = days < 0 ? 'overdue' : days <= 3 ? 'soon' : '';
          const label = days < 0 ? `${Math.abs(days)}g gecikmiş` : days === 0 ? 'Bugün!' : `${days}g kaldı`;
          dueBadge = `<span class="deadline-badge ${cls}">📅 ${label}</span>`;
        }
        return `
          <div class="task-card" draggable="true"
            ondragstart="dragStart(event,${t.id})"
            style="animation-delay:${i * 0.06}s"
            onclick="openDetail(${t.id})">
            <div class="task-actions" onclick="event.stopPropagation()">
              <button class="task-action-btn edit" title="Düzenle" onclick="openEditModal(${t.id})">✏</button>
              <button class="task-action-btn"      title="Sil"     onclick="confirmDelete(${t.id})">✕</button>
            </div>
            <div class="task-title">${t.title}</div>
            <div class="task-meta">
              <span class="priority-tag ${priorityClass}">${priorityLabel}</span>
              ${tag ? `<span class="tag">${tag}</span>` : ''}
              ${dueBadge}
              ${getAvatars(Math.floor(Math.random()*2)+1)}
            </div>
            ${t.progress > 0 && t.progress < 100 ? `
            <div class="task-progress">
              <div class="task-progress-bar" style="width:${t.progress}%"></div>
            </div>` : ''}
          </div>`;
      }).join('');
    }
  });

  updateStats();
  updateDeadlineList();
  updateProjectCounts();
  saveTasks();
}

function updateStats() {
  const total   = tasks.length;
  const done    = tasks.filter(t => t.column === 'done').length;
  const doing   = tasks.filter(t => t.column === 'doing').length;
  const pct     = total ? Math.round(done / total * 100) : 0;
  const overdue = tasks.filter(t => t.column !== 'done' && daysUntil(t.due) < 0).length;

  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-done').textContent     = done;
  document.getElementById('stat-progress').textContent = doing;
  document.getElementById('total-count').textContent   = total;
  document.getElementById('stat-done-sub').textContent = `▲ %${pct} tamamlanma`;
  document.getElementById('stat-doing-sub').textContent = overdue > 0 ? `▼ ${overdue} gecikmiş` : '— gecikme yok';
  document.getElementById('stat-doing-sub').className  = 'stat-change ' + (overdue > 0 ? 'down' : 'up');
  document.getElementById('stat-total-sub').textContent = `▲ ${total} toplam görev`;

  const now = new Date();
  const days = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi'];
  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
  document.getElementById('page-subtitle').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} — 3 aktif proje`;
}

function updateDeadlineList() {
  const upcoming = tasks
    .filter(t => t.due && t.column !== 'done')
    .sort((a,b) => new Date(a.due) - new Date(b.due))
    .slice(0, 5);

  const el = document.getElementById('deadline-list');
  if (!upcoming.length) {
    el.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted)">Yaklaşan son tarih yok</div>';
    return;
  }
  el.innerHTML = upcoming.map(t => {
    const days = daysUntil(t.due);
    const cls  = days < 0 ? 'dl-overdue' : days <= 3 ? 'dl-soon' : '';
    const label = days < 0 ? `${Math.abs(days)}g geçti` : days === 0 ? 'Bugün' : `${days}g kaldı`;
    return `<div class="deadline-list-item ${cls}">
      <div class="dl-title">${t.title.slice(0,28)}${t.title.length>28?'…':''}</div>
      <div class="dl-date">${label}</div>
    </div>`;
  }).join('');
}

function updateProjectCounts() {
  const projects = ['E-Ticaret API','Mobil Uygulama','Veri Boru Hattı'];
  projects.forEach((p, i) => {
    const el = document.getElementById(`proj-count-${i}`);
    if (el) el.textContent = tasks.filter(t => t.project === p).length;
  });
}

// ── Drag & Drop ───────────────────────────────────────────
function dragStart(e, id) {
  draggedId = id;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => {
    const card = e.target.closest('.task-card');
    if (card) card.classList.add('dragging');
  }, 0);
}
function allowDrop(e, col) {
  e.preventDefault();
  col.classList.add('drag-over');
}
function dragLeave(col) {
  col.classList.remove('drag-over');
}
function drop(e, colName, colEl) {
  e.preventDefault();
  colEl.classList.remove('drag-over');
  document.querySelectorAll('.task-card').forEach(c => c.classList.remove('dragging'));
  if (draggedId === null) return;
  const task = tasks.find(t => t.id === draggedId);
  if (task && task.column !== colName) {
    task.column = colName;
    if (colName === 'done') task.progress = 100;
    if (colName === 'todo') task.progress = 0;
    renderTasks();
    const colLabel = colName === 'done' ? 'Tamamlandı' : colName === 'doing' ? 'Devam Ediyor' : 'Yapılacak';
    addActivity(`Görev taşındı: "${task.title.slice(0,22)}…" → ${colLabel}`);
    showToast(`✅ "${colLabel}" sütununa taşındı`);
  }
  draggedId = null;
}

// ── Modal (Add / Edit) ────────────────────────────────────
let defaultColumn = 'doing';

function openModal(col) {
  editMode = false;
  defaultColumn = col || 'doing';
  document.getElementById('modal-title').textContent = 'Yeni Görev Ekle';
  document.getElementById('modal-submit-btn').textContent = '+ Ekle';
  document.getElementById('edit-task-id').value = '';
  document.getElementById('task-title-input').value = '';
  document.getElementById('task-desc-input').value = '';
  document.getElementById('task-tag').value = '';
  document.getElementById('task-priority').value = 'mid';
  document.getElementById('task-column').value = defaultColumn;
  document.getElementById('task-project').value = 'E-Ticaret API';
  document.getElementById('task-due').value = '';
  const pi = document.getElementById('task-progress-input');
  pi.value = 0;
  document.getElementById('progress-label-val').textContent = '0%';
  document.getElementById('progress-val-display').textContent = '0%';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('task-title-input').focus(), 300);
}

function openEditModal(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  editMode = true;
  document.getElementById('modal-title').textContent = 'Görevi Düzenle';
  document.getElementById('modal-submit-btn').textContent = '💾 Kaydet';
  document.getElementById('edit-task-id').value = id;
  document.getElementById('task-title-input').value = t.title;
  document.getElementById('task-desc-input').value = t.desc || '';
  document.getElementById('task-tag').value = (t.tags || []).join(', ');
  document.getElementById('task-priority').value = t.priority;
  document.getElementById('task-column').value = t.column;
  document.getElementById('task-project').value = t.project || 'E-Ticaret API';
  document.getElementById('task-due').value = t.due || '';
  const pi = document.getElementById('task-progress-input');
  pi.value = t.progress;
  document.getElementById('progress-label-val').textContent = t.progress + '%';
  document.getElementById('progress-val-display').textContent = t.progress + '%';
  document.getElementById('modal').classList.add('open');
  setTimeout(() => document.getElementById('task-title-input').focus(), 300);
}

function closeModal() { document.getElementById('modal').classList.remove('open'); }
function closeModalOutside(e) { if (e.target.id === 'modal') closeModal(); }

function submitTask() {
  const title    = document.getElementById('task-title-input').value.trim();
  if (!title) { showToast('⚠️ Görev başlığı boş olamaz!'); return; }
  const priority = document.getElementById('task-priority').value;
  const column   = document.getElementById('task-column').value;
  const project  = document.getElementById('task-project').value;
  const due      = document.getElementById('task-due').value;
  const tag      = document.getElementById('task-tag').value.trim();
  const desc     = document.getElementById('task-desc-input').value.trim();
  const progress = parseInt(document.getElementById('task-progress-input').value, 10);
  const tags     = tag ? tag.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (editMode) {
    const id = parseInt(document.getElementById('edit-task-id').value, 10);
    const task = tasks.find(t => t.id === id);
    if (task) {
      Object.assign(task, { title, desc, priority, column, project, due, tags, progress });
      addActivity(`Görev güncellendi: "${title.slice(0,22)}…"`);
      showToast('💾 Görev güncellendi!');
    }
  } else {
    tasks.push({ id: nextId++, title, desc, priority, column, project, due, tags, progress: column==='done'?100:progress, delay:0 });
    addActivity(`Yeni görev eklendi: "${title.slice(0,22)}…"`);
    showToast('🎉 Görev eklendi!');
  }
  renderTasks();
  closeModal();
}

// ── Delete ────────────────────────────────────────────────
let pendingDeleteId = null;

function confirmDelete(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  pendingDeleteId = id;
  document.getElementById('confirm-text').innerHTML = `<strong>"${t.title}"</strong> görevi kalıcı olarak silinecek. Bu işlem geri alınamaz.`;
  document.getElementById('confirm-ok-btn').onclick = executeDelete;
  document.getElementById('confirm-modal').classList.add('open');
}
function executeDelete() {
  tasks = tasks.filter(t => t.id !== pendingDeleteId);
  pendingDeleteId = null;
  renderTasks();
  addActivity('Bir görev silindi');
  showToast('🗑 Görev silindi');
  closeConfirmModal();
  closeDetail();
}
function closeConfirmModal() { document.getElementById('confirm-modal').classList.remove('open'); }
function closeConfirmOutside(e) { if (e.target.id === 'confirm-modal') closeConfirmModal(); }

// ── Detail ────────────────────────────────────────────────
function openDetail(id) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const priorityLabel = t.priority === 'high' ? '🔴 Yüksek' : t.priority === 'mid' ? '🟡 Orta' : '🟢 Düşük';
  const colLabel = t.column === 'done' ? 'Tamamlandı' : t.column === 'doing' ? 'Devam Ediyor' : 'Yapılacak';
  const days = daysUntil(t.due);
  const dueText = t.due ? `${formatDate(t.due)} (${days < 0 ? Math.abs(days)+'g gecikmiş' : days===0 ? 'Bugün' : days+'g kaldı'})` : '—';

  document.getElementById('detail-title').textContent = t.title;
  document.getElementById('detail-body').innerHTML = `
    <div class="detail-row"><span class="detail-key">Proje</span><span class="detail-val">${t.project||'—'}</span></div>
    <div class="detail-row"><span class="detail-key">Öncelik</span><span class="detail-val">${priorityLabel}</span></div>
    <div class="detail-row"><span class="detail-key">Durum</span><span class="detail-val">${colLabel}</span></div>
    <div class="detail-row"><span class="detail-key">Son Tarih</span><span class="detail-val ${days!==null&&days<0?'':''}">📅 ${dueText}</span></div>
    <div class="detail-row"><span class="detail-key">Etiketler</span><span class="detail-val">${(t.tags||[]).map(g=>`<span class="tag">${g}</span>`).join(' ')||'—'}</span></div>
    ${t.desc ? `<div class="detail-row"><span class="detail-key">Açıklama</span><span class="detail-val">${t.desc}</span></div>` : ''}
    <div class="detail-progress-wrap">
      <div style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;">İlerleme — ${t.progress}%</div>
      <div class="detail-progress-bar-bg">
        <div class="detail-progress-bar-fill" style="width:${t.progress}%"></div>
      </div>
    </div>
    <div class="detail-actions">
      <button class="btn btn-ghost" onclick="openEditModal(${t.id});closeDetail()">✏ Düzenle</button>
      <button class="btn btn-ghost" onclick="moveTask(${t.id},'todo');closeDetail()">◁ Yapılacak</button>
      <button class="btn btn-ghost" onclick="moveTask(${t.id},'doing');closeDetail()">◈ Devam</button>
      <button class="btn btn-ghost" onclick="moveTask(${t.id},'done');closeDetail()">✓ Tamamla</button>
      <button class="btn btn-danger" onclick="confirmDelete(${t.id});closeDetail()">🗑 Sil</button>
    </div>`;
  document.getElementById('detail-modal').classList.add('open');
}
function closeDetail() { document.getElementById('detail-modal').classList.remove('open'); }
function closeDetailOutside(e) { if (e.target.id === 'detail-modal') closeDetail(); }

function moveTask(id, col) {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  t.column = col;
  if (col === 'done') t.progress = 100;
  if (col === 'todo') t.progress = 0;
  renderTasks();
  showToast(`✅ Görev taşındı`);
}

// ── Filters ───────────────────────────────────────────────
function setPriorityFilter(val, btn) {
  priorityFilter = val;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderTasks();
}

function filterByProject(name) {
  projectFilter = name;
  document.getElementById('active-project-label').style.display = 'flex';
  document.getElementById('active-project-name').textContent = name;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  renderTasks();
  showToast(`📂 "${name}" projesi filtrelendi`);
}
function clearProjectFilter() {
  projectFilter = null;
  document.getElementById('active-project-label').style.display = 'none';
  renderTasks();
}

function filterBySearch(q) {
  searchQuery = q.trim();
  renderTasks();
}

// ── Sort ──────────────────────────────────────────────────
function sortTasks() {
  const order = { high:0, mid:1, low:2 };
  tasks.sort((a,b) => order[a.priority] - order[b.priority]);
  renderTasks();
  showToast('⇅ Önceliğe göre sıralandı');
}

// ── Clear done ────────────────────────────────────────────
function clearAllDone() {
  const count = tasks.filter(t => t.column === 'done').length;
  if (!count) { showToast('ℹ Tamamlanmış görev yok'); return; }
  tasks = tasks.filter(t => t.column !== 'done');
  renderTasks();
  addActivity(`${count} tamamlanmış görev temizlendi`);
  showToast(`🗑 ${count} görev temizlendi`);
}

// ── Export ────────────────────────────────────────────────
function exportData() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `taskflow_${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📤 JSON olarak dışa aktarıldı!');
}

// ── New project (stub) ────────────────────────────────────
function openNewProjectModal() {
  showToast('🚧 Yeni proje özelliği yakında!');
}

// ── Activity ──────────────────────────────────────────────
function addActivity(text) {
  const feed = document.getElementById('activity-feed');
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-dot" style="background:var(--accent)"></div>
    <div>
      <div class="activity-text"><strong>Sen</strong> ${text}</div>
      <div class="activity-time">şimdi</div>
    </div>`;
  feed.prepend(item);
  if (feed.children.length > 8) feed.removeChild(feed.lastChild);
}

// ── Nav ───────────────────────────────────────────────────
function setNav(el, page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  clearProjectFilter();
  if (page !== 'dashboard' && page !== 'tasks') {
    showToast(`📂 "${page}" sayfası yakında aktif olacak`);
  }
}

// ── Toast ─────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeDetail();
    closeConfirmModal();
  }
  if (e.key === 'Enter' && document.getElementById('modal').classList.contains('open')) {
    submitTask();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('sidebar-search').focus();
    showToast('🔍 Arama moduna geçildi (⌘K)');
  }
  if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    document.getElementById('sidebar-search').focus();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
    e.preventDefault();
    openModal();
  }
});

// ── Init ──────────────────────────────────────────────────
renderTasks();
