(function () {
  // عناصر عامة
  const steps = Array.from(document.querySelectorAll('#setupWizardModal .wiz-step'));
  const progress = document.getElementById('wizProgress');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnSave = document.getElementById('btnSave');
  const form = document.getElementById('wizardForm');
  const modalEl = document.getElementById('setupWizardModal');

  if (!modalEl || steps.length === 0) return;

  // مدخلات
  const uName = document.getElementById('universityName');
  const uCode = document.getElementById('universityCode');

  // البرامج
  const programName = document.getElementById('programName');
  const programCode = document.getElementById('programCode');
  const addProgramBtn = document.getElementById('addProgram');
  const programList = document.getElementById('programList');

  // الشُعب الرئيسية
  const mainTrackProgramSelect = document.getElementById('mainTrackProgramSelect');
  const mainTrackInput = document.getElementById('mainTrack');
  const addMainTrackBtn = document.getElementById('addMainTrack');
  const mainTrackList = document.getElementById('mainTrackList');

  // الشُعب الفرعية
  const subTrackMainSelect = document.getElementById('subTrackMainSelect');
  const subTrackInput = document.getElementById('subTrack');
  const addSubTrackBtn = document.getElementById('addSubTrack');
  const subTrackList = document.getElementById('subTrackList');

  // المراجعة والملخص على الصفحة
  const reviewBox = document.getElementById('reviewBox');
  const sumUniversity = document.getElementById('sumUniversity');
  const hierarchyContainer = document.getElementById('hierarchyContainer');

  // الحالة (هرمية)
  let autoId = 1;
  const newId = () => String(autoId++);
  const state = {
    university: { name: '', code: '' },
    programs: [] // [{id,name,code,mains:[{id,name,subs:[{id,name}]}]}]
  };

  /* ========== أدوات مساعدة ========== */
  function findProgram(pid) {
    return state.programs.find(p => p.id === pid);
  }
  function findMain(mid) {
    for (const p of state.programs) {
      const m = p.mains.find(x => x.id === mid);
      if (m) return { prog: p, main: m };
    }
    return null;
  }
  function findSub(sid) {
    for (const p of state.programs) {
      for (const m of p.mains) {
        const s = m.subs.find(x => x.id === sid);
        if (s) return { prog: p, main: m, sub: s };
      }
    }
    return null;
  }

  /* ========== عرض الخطوات ========== */
  let current = 0; // 0..4
  function showStep(i) {
    steps.forEach((s, idx) => s.classList.toggle('d-none', idx !== i));
    btnPrev.disabled = i === 0;
    const isLast = i === steps.length - 1;
    btnNext.classList.toggle('d-none', isLast);
    btnSave.classList.toggle('d-none', !isLast);
    if (progress) progress.style.width = ((i + 1) / steps.length) * 100 + '%';

    if (steps[i].getAttribute('data-step') === '3') populateProgramSelect();
    if (steps[i].getAttribute('data-step') === '4') populateMainSelect();
    if (isLast) buildReview();
  }

  /* ========== تحقق كل خطوة ========== */
  function validateStep(i) {
    const stepNo = Number(steps[i].getAttribute('data-step'));
    switch (stepNo) {
      case 1: { // الجامعة
        if (!uName.value.trim()) { uName.classList.add('is-invalid'); return false; }
        uName.classList.remove('is-invalid');
        state.university = { name: uName.value.trim(), code: uCode.value.trim() };
        return true;
      }
      case 2: { // البرامج
        if (state.programs.length === 0) {
          programName.classList.add('is-invalid'); return false;
        }
        programName.classList.remove('is-invalid');
        return true;
      }
      case 3: return true; // الشُعب الرئيسية
      case 4: return true; // الشُعب الفرعية
      case 5: return true; // المراجعة
      default: return true;
    }
  }

  /* ========== إدارة البرامج ========== */
  function renderPrograms() {
    programList.innerHTML = '';
    if (state.programs.length === 0) {
      programList.innerHTML = '<span class="text-muted">لا توجد برامج مضافة بعد.</span>';
      return;
    }
    state.programs.forEach((p, idx) => {
      const tag = document.createElement('span');
      tag.className = 'badge bg-secondary p-2';
      tag.innerHTML = `${p.name}${p.code ? ' <span class="opacity-75">(' + p.code + ')</span>' : ''} 
        <button type="button" class="btn btn-sm btn-link text-white ms-1" data-idx="${idx}" title="حذف"><i class="bi bi-x"></i></button>`;
      programList.appendChild(tag);
    });
  }

  addProgramBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const name = programName.value.trim();
    const code = programCode.value.trim();
    if (!name) { programName.classList.add('is-invalid'); return; }
    programName.classList.remove('is-invalid');
    state.programs.push({ id: newId(), name, code, mains: [] });
    programName.value = ''; programCode.value = '';
    renderPrograms();
    populateProgramSelect();
    rebuildHierarchy(); // عشان يظهر فورًا لو حفظت
  });

  programList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-idx]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    state.programs.splice(idx, 1);
    renderPrograms();
    populateProgramSelect();
    populateMainSelect();
    renderMainTrackList();
    renderSubTrackList();
    rebuildHierarchy();
  });

  function populateProgramSelect() {
    mainTrackProgramSelect.innerHTML = '<option value="">اختر برنامجًا</option>';
    state.programs.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id; opt.textContent = p.name + (p.code ? ` (${p.code})` : '');
      mainTrackProgramSelect.appendChild(opt);
    });
  }

  /* ========== إدارة الشُعب الرئيسية ========== */
  function renderMainTrackList() {
    mainTrackList.innerHTML = '';
    const items = [];
    state.programs.forEach(p => {
      p.mains.forEach(m => items.push({ progName: p.name, id: m.id, name: m.name }));
    });
    if (items.length === 0) {
      mainTrackList.innerHTML = '<span class="text-muted">لا توجد شُعب رئيسية مضافة بعد.</span>';
      return;
    }
    items.forEach((it) => {
      const tag = document.createElement('span');
      tag.className = 'badge bg-secondary p-2';
      tag.innerHTML = `${it.name} <span class="opacity-75">— ${it.progName}</span>
        <button type="button" class="btn btn-sm btn-link text-white ms-1" data-id="${it.id}" data-action="main-del" title="حذف"><i class="bi bi-x"></i></button>`;
      mainTrackList.appendChild(tag);
    });
  }

  addMainTrackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const pid = mainTrackProgramSelect.value;
    const name = mainTrackInput.value.trim();
    if (!pid) { mainTrackProgramSelect.classList.add('is-invalid'); return; }
    mainTrackProgramSelect.classList.remove('is-invalid');
    if (!name) { mainTrackInput.classList.add('is-invalid'); return; }
    mainTrackInput.classList.remove('is-invalid');

    const prog = findProgram(pid);
    if (!prog) return;
    prog.mains.push({ id: newId(), name, subs: [] });
    mainTrackInput.value = '';
    renderMainTrackList();
    populateMainSelect();
    rebuildHierarchy();
  });

  mainTrackList.addEventListener('click', (e) => {
    const delBtn = e.target.closest('button[data-action="main-del"]');
    if (!delBtn) return;
    const mid = delBtn.getAttribute('data-id');
    if (!confirm('هل تريد حذف هذه الشُعبة الرئيسية؟ سيتم حذف الشُعب الفرعية التابعة لها.')) return;
    for (const p of state.programs) {
      const idx = p.mains.findIndex(m => m.id === mid);
      if (idx >= 0) { p.mains.splice(idx, 1); break; }
    }
    renderMainTrackList();
    populateMainSelect();
    renderSubTrackList();
    rebuildHierarchy();
  });

  function populateMainSelect() {
    subTrackMainSelect.innerHTML = '<option value="">اختر الشُعبة الرئيسية</option>';
    state.programs.forEach(p => {
      p.mains.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; opt.textContent = `${m.name} — ${p.name}`;
        subTrackMainSelect.appendChild(opt);
      });
    });
  }

  /* ========== إدارة الشُعب الفرعية ========== */
  function renderSubTrackList() {
    subTrackList.innerHTML = '';
    const items = [];
    state.programs.forEach(p => {
      p.mains.forEach(m => {
        m.subs.forEach(s => items.push({ prog: p.name, main: m.name, id: s.id, name: s.name }));
      });
    });
    if (items.length === 0) {
      subTrackList.innerHTML = '<span class="text-muted">لا توجد شُعب فرعية مضافة بعد.</span>';
      return;
    }
    items.forEach(it => {
      const tag = document.createElement('span');
      tag.className = 'badge bg-secondary p-2';
      tag.innerHTML = `${it.name} <span class="opacity-75">— ${it.main} / ${it.prog}</span>
        <button type="button" class="btn btn-sm btn-link text-white ms-1" data-id="${it.id}" data-action="sub-del" title="حذف"><i class="bi bi-x"></i></button>`;
      subTrackList.appendChild(tag);
    });
  }

  addSubTrackBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const mid = subTrackMainSelect.value;
    const name = subTrackInput.value.trim();
    if (!mid) { subTrackMainSelect.classList.add('is-invalid'); return; }
    subTrackMainSelect.classList.remove('is-invalid');
    if (!name) return; // اختيارية
    const res = findMain(mid);
    if (!res) return;
    res.main.subs.push({ id: newId(), name });
    subTrackInput.value = '';
    renderSubTrackList();
    rebuildHierarchy();
  });

  subTrackList.addEventListener('click', (e) => {
    const delBtn = e.target.closest('button[data-action="sub-del"]');
    if (!delBtn) return;
    const sid = delBtn.getAttribute('data-id');
    if (!confirm('هل تريد حذف هذه الشُعبة الفرعية؟')) return;
    outer:
    for (const p of state.programs) {
      for (const m of p.mains) {
        const idx = m.subs.findIndex(s => s.id === sid);
        if (idx >= 0) { m.subs.splice(idx, 1); break outer; }
      }
    }
    renderSubTrackList();
    rebuildHierarchy();
  });

  /* ========== المراجعة ========== */
  function buildReview() {
    const lines = [];
    lines.push(`<div class="mb-2"><strong>الجامعة:</strong> ${state.university.name || '—'} ${state.university.code ? '('+state.university.code+')' : ''}</div>`);
    if (state.programs.length === 0) {
      lines.push(`<div class="text-muted">لا توجد برامج</div>`);
    } else {
      state.programs.forEach(p => {
        lines.push(`<div class="mb-1"><strong>البرنامج:</strong> ${p.name}${p.code ? ' ('+p.code+')':''}</div>`);
        if (p.mains.length === 0) {
          lines.push(`<div class="ms-3 text-muted">لا توجد شُعب رئيسية</div>`);
        } else {
          p.mains.forEach(m => {
            lines.push(`<div class="ms-3"><strong>الشُعبة الرئيسية:</strong> ${m.name}</div>`);
            if (m.subs.length === 0) {
              lines.push(`<div class="ms-5 text-muted">لا توجد شُعب فرعية</div>`);
            } else {
              m.subs.forEach(s => lines.push(`<div class="ms-5">- ${s.name}</div>`));
            }
          });
        }
      });
    }
    reviewBox.innerHTML = lines.join('');
  }

  /* ========== عرض هرمي مع تعديل/حذف داخل الـAccordion ========== */
  function rebuildHierarchy() {
    if (!hierarchyContainer) return;
    if (state.programs.length === 0) {
      hierarchyContainer.innerHTML = '<span class="text-muted">لا توجد بيانات بعد. اضغطي “بدء الإعداد”.</span>';
      return;
    }
    const accId = 'acc-programs';
    let html = `<div class="accordion" id="${accId}">`;
    state.programs.forEach((p) => {
      const pid = `p${p.id}`;
      html += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="h-${pid}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#c-${pid}" aria-expanded="false" aria-controls="c-${pid}">
            ${p.name}${p.code ? ' ('+p.code+')' : ''}
          </button>
        </h2>
        <div id="c-${pid}" class="accordion-collapse collapse" data-bs-parent="#${accId}">
          <div class="accordion-body">
            <div class="d-flex justify-content-end gap-2 mb-2">
              <button class="btn btn-sm btn-outline-secondary" data-action="prog-edit" data-id="${p.id}"><i class="bi bi-pencil-square ms-1"></i>تعديل البرنامج</button>
              <button class="btn btn-sm btn-outline-danger" data-action="prog-del" data-id="${p.id}"><i class="bi bi-trash ms-1"></i>حذف البرنامج</button>
            </div>
            ${p.mains.length === 0 ? '<div class="text-muted">لا توجد شُعب رئيسية.</div>' : ''}
            <div class="accordion" id="acc-mains-${pid}">
              ${p.mains.map(m => {
                const mid = `m${m.id}`;
                return `
                <div class="accordion-item">
                  <h2 class="accordion-header" id="h-${mid}">
                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#c-${mid}" aria-expanded="false" aria-controls="c-${mid}">
                      ${m.name}
                    </button>
                  </h2>
                  <div id="c-${mid}" class="accordion-collapse collapse" data-bs-parent="#acc-mains-${pid}">
                    <div class="accordion-body">
                      <div class="d-flex justify-content-end gap-2 mb-2">
                        <button class="btn btn-sm btn-outline-secondary" data-action="main-edit" data-id="${m.id}"><i class="bi bi-pencil-square ms-1"></i>تعديل الشُعبة</button>
                        <button class="btn btn-sm btn-outline-danger" data-action="main-del" data-id="${m.id}"><i class="bi bi-trash ms-1"></i>حذف الشُعبة</button>
                      </div>
                      ${m.subs.length === 0
                        ? '<div class="text-muted">لا توجد شُعب فرعية.</div>'
                        : `<ul class="mb-0 list-unstyled">
                            ${m.subs.map(s => `
                              <li class="d-flex align-items-center justify-content-between border-bottom py-1">
                                <span>${s.name}</span>
                                <span class="d-flex gap-2">
                                  <button class="btn btn-sm btn-outline-secondary" data-action="sub-edit" data-id="${s.id}"><i class="bi bi-pencil-square ms-1"></i>تعديل</button>
                                  <button class="btn btn-sm btn-outline-danger" data-action="sub-del" data-id="${s.id}"><i class="bi bi-trash ms-1"></i>حذف</button>
                                </span>
                              </li>`).join('')}
                          </ul>`
                      }
                    </div>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>
        </div>
      </div>`;
    });
    html += `</div>`;
    hierarchyContainer.innerHTML = html;
  }

  // التعامل مع أزرار التعديل/الحذف داخل العرض الهرمي (Event Delegation)
  hierarchyContainer && hierarchyContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');

    if (action === 'prog-edit') {
      const prog = findProgram(id);
      if (!prog) return;
      const newName = prompt('اسم البرنامج:', prog.name);
      if (newName === null) return;
      const newCode = prompt('كود البرنامج (اختياري):', prog.code || '');
      prog.name = newName.trim() || prog.name;
      prog.code = (newCode || '').trim();
      rebuildHierarchy();
      // تحديث شاشات الإضافة
      renderPrograms();
      populateProgramSelect();
      populateMainSelect();
      renderMainTrackList();
      renderSubTrackList();
    }

    if (action === 'prog-del') {
      if (!confirm('حذف البرنامج سيحذف كل الشُعب التابعة له. هل أنت متأكدة؟')) return;
      const idx = state.programs.findIndex(p => p.id === id);
      if (idx >= 0) state.programs.splice(idx, 1);
      rebuildHierarchy();
      renderPrograms();
      populateProgramSelect();
      populateMainSelect();
      renderMainTrackList();
      renderSubTrackList();
    }

    if (action === 'main-edit') {
      const res = findMain(id);
      if (!res) return;
      const newName = prompt('اسم الشُعبة الرئيسية:', res.main.name);
      if (newName === null) return;
      res.main.name = newName.trim() || res.main.name;
      rebuildHierarchy();
      renderMainTrackList();
      populateMainSelect();
      renderSubTrackList();
    }

    if (action === 'main-del') {
      if (!confirm('سيتم حذف الشُعبة الرئيسية وكل الشُعب الفرعية التابعة لها. متابعة؟')) return;
      for (const p of state.programs) {
        const idx = p.mains.findIndex(m => m.id === id);
        if (idx >= 0) { p.mains.splice(idx, 1); break; }
      }
      rebuildHierarchy();
      renderMainTrackList();
      populateMainSelect();
      renderSubTrackList();
    }

    if (action === 'sub-edit') {
      const res = findSub(id);
      if (!res) return;
      const newName = prompt('اسم الشُعبة الفرعية:', res.sub.name);
      if (newName === null) return;
      res.sub.name = newName.trim() || res.sub.name;
      rebuildHierarchy();
      renderSubTrackList();
    }

    if (action === 'sub-del') {
      if (!confirm('هل تريد حذف هذه الشُعبة الفرعية؟')) return;
      outer:
      for (const p of state.programs) {
        for (const m of p.mains) {
          const idx = m.subs.findIndex(s => s.id === id);
          if (idx >= 0) { m.subs.splice(idx, 1); break outer; }
        }
      }
      rebuildHierarchy();
      renderSubTrackList();
    }
  });

  /* ========== الملخص على الصفحة ========== */
  function fillSummaryOnPage() {
    if (sumUniversity) {
      sumUniversity.value = (state.university.name || '') + (state.university.code ? ` (${state.university.code})` : '');
    }
    rebuildHierarchy();
  }

  /* ========== تنقل ========== */
  btnNext.addEventListener('click', () => {
    if (!validateStep(current)) return;
    if (current < steps.length - 1) { current++; showStep(current); }
  });
  btnPrev.addEventListener('click', () => {
    if (current > 0) { current--; showStep(current); }
  });

  /* ========== حفظ ========== */
  btnSave.addEventListener('click', () => {
    buildReview();
    fillSummaryOnPage();
    console.log('Payload:', JSON.stringify(state, null, 2));
  });

  /* ========== تهيئة عند فتح المودال ========== */
  modalEl.addEventListener('shown.bs.modal', () => {
    current = 0;
    // اعرض أية بيانات سابقة في شاشات الإضافة
    renderPrograms();
    renderMainTrackList();
    renderSubTrackList();
    populateProgramSelect();
    populateMainSelect();
    showStep(current);
  });

})();

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();               // لو عندك تحقق بيانات، اعمله هنا
  window.location.href = 'home.html';
});

