// ── STATE ──
const files = [];
let activeId = null;
let splitMethod = 'pages';
let proofLevel = 'normal';

// ── UTILS ──
function fmtSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}
function uid() { return Math.random().toString(36).slice(2, 9); }
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function toast(msg, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + escHtml(msg) + '</span>';
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── TABS ──
function switchTab(name) {
  ['split', 'proofread', 'result'].forEach(t => {
    document.getElementById('tab-' + t).classList.toggle('active', t === name);
    document.getElementById('content-' + t).classList.toggle('visible', t === name);
  });
  const f = files.find(x => x.id === activeId);
  renderActionRow(f, name);
}

// ── UPLOAD ──
function initUpload() {
  const zone = document.getElementById('uploadZone');
  const input = document.getElementById('fileInput');
  if (!zone || !input) return;

  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', e => handleFiles(e.target.files));
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
}

async function handleFiles(list) {
  for (const f of list) {
    if (!f.name.toLowerCase().endsWith('.pdf')) {
      toast(f.name + ': PDF 파일만 지원합니다', 'warning');
      continue;
    }
    await loadPDF(f);
  }
}

async function loadPDF(f) {
  try {
    const ab = await f.arrayBuffer();
    const doc = await PDFLib.PDFDocument.load(ab, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    const entry = { id: uid(), name: f.name, size: f.size, pageCount, arrayBuffer: ab, chunks: [], proofResults: [] };
    files.push(entry);
    renderFileList();
    selectFile(entry.id);
    updateTopbarMeta();
    toast(f.name + ' 로드 완료 (' + pageCount + '페이지)', 'success');
  } catch (e) {
    toast(f.name + ': 읽기 실패 — ' + e.message, 'error');
  }
}

// ── SIDEBAR ──
function renderFileList() {
  const list = document.getElementById('fileList');
  document.getElementById('fileCount').textContent = files.length;
  if (!files.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text3);font-size:12px;">업로드된 파일이 없습니다</div>';
    return;
  }
  list.innerHTML = files.map(f => {
    const done = f.proofResults.length > 0;
    return '<div class="file-item ' + (f.id === activeId ? 'active' : '') + '" onclick="selectFile(\'' + f.id + '\')">'
      + '<div class="file-icon ' + (done ? 'done' : '') + '">PDF</div>'
      + '<div class="file-info">'
      + '<div class="file-name">' + escHtml(f.name) + '</div>'
      + '<div class="file-meta">' + f.pageCount + 'p · ' + fmtSize(f.size) + (done ? ' · 교정완료' : '') + '</div>'
      + '</div>'
      + '<div class="file-status ' + (done ? 'status-done' : 'status-new') + '"></div>'
      + '</div>';
  }).join('');
}

// ── DETAIL ──
function selectFile(id) {
  activeId = id;
  renderFileList();
  const f = files.find(x => x.id === id);
  if (!f) return;
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('detailPanel').classList.add('visible');
  document.getElementById('detailName').textContent = f.name;
  const large = f.size > 10 * 1024 * 1024;
  document.getElementById('detailBadges').innerHTML =
    '<span class="badge badge-purple">' + f.pageCount + ' 페이지</span>'
    + '<span class="badge badge-purple">' + fmtSize(f.size) + '</span>'
    + (large ? '<span class="badge badge-amber">대용량</span>' : '')
    + (f.proofResults.length ? '<span class="badge badge-green">교정완료</span>' : '');
  renderSplitTab(f);
  renderProofreadTab(f);
  if (f.proofResults.length) renderResultTab(f);
  renderActionRow(f, 'split');
  // 분할 탭 활성화
  switchTab('split');
}

// ── TAB: 분할 ──
function renderSplitTab(f) {
  const el = document.getElementById('content-split');
  const large = f.size > 10 * 1024 * 1024;
  const methods = [
    { id: 'pages', icon: '📃', name: '페이지 수', desc: 'N페이지씩 균등 분할' },
    { id: 'size',  icon: '⚖️', name: '파일 크기', desc: 'MB 단위로 분할' },
    { id: 'range', icon: '🎯', name: '범위 지정', desc: '직접 페이지 범위 입력' },
    { id: 'all',   icon: '📑', name: '1페이지씩', desc: '모든 페이지 개별 분리' },
  ];
  el.innerHTML =
    (large ? '<div class="size-warning"><span>⚠️</span><span>파일 용량이 큽니다 (' + fmtSize(f.size) + '). 분할을 권장합니다.</span></div>' : '')
    + '<div class="section-title">분할 방식</div>'
    + '<div class="split-method-grid">'
    + methods.map(m =>
      '<div class="method-card ' + (splitMethod === m.id ? 'selected' : '') + '" onclick="setSplitMethod(\'' + m.id + '\',\'' + f.id + '\')">'
      + '<span class="method-icon">' + m.icon + '</span>'
      + '<div class="method-name">' + m.name + '</div>'
      + '<div class="method-desc">' + m.desc + '</div>'
      + '</div>'
    ).join('')
    + '</div>'
    + '<div id="splitOptions"></div>'
    + '<div class="divider"></div>'
    + '<div class="section-title">분할 미리보기</div>'
    + '<div id="splitPreview"><div style="color:var(--text3);font-size:12px;padding:8px 0;">분할 옵션을 설정하면 미리보기가 표시됩니다</div></div>'
    + '<div class="divider"></div>'
    + '<div id="progressSection" style="display:none;">'
    + '<div class="section-title">진행 상황</div>'
    + '<div class="progress-bar-wrap"><div class="progress-bar-fill" id="progressFill" style="width:0%"></div></div>'
    + '<div class="progress-text" id="progressText">준비 중...</div>'
    + '</div>';
  renderSplitOptions(f);
}

function setSplitMethod(m, fid) {
  splitMethod = m;
  const f = files.find(x => x.id === fid);
  if (f) renderSplitTab(f);
}

function renderSplitOptions(f) {
  const el = document.getElementById('splitOptions');
  if (!el) return;
  if (splitMethod === 'pages') {
    const rec = Math.max(1, Math.min(30, Math.ceil(f.pageCount / 5)));
    el.innerHTML = '<div class="form-row"><span class="form-label">분할 단위 (페이지)</span>'
      + '<div class="range-wrap">'
      + '<input type="range" id="splitPages" min="1" max="' + f.pageCount + '" value="' + rec + '" oninput="document.getElementById(\'splitPagesVal\').textContent=this.value;updatePreview(\'' + f.id + '\')">'
      + '<span class="range-value" id="splitPagesVal">' + rec + '</span>'
      + '</div></div>';
    setTimeout(() => updatePreview(f.id), 0);
  } else if (splitMethod === 'size') {
    const rec = Math.max(1, Math.round(f.size / f.pageCount / (1024 * 1024) * 10));
    el.innerHTML = '<div class="form-row"><span class="form-label">최대 크기 (MB)</span>'
      + '<input type="number" class="form-input" id="splitSize" min="0.5" max="500" step="0.5" value="' + (rec || 5) + '" oninput="updatePreview(\'' + f.id + '\')">'
      + '</div><div class="form-hint">파일 크기는 추정값입니다</div>';
    setTimeout(() => updatePreview(f.id), 0);
  } else if (splitMethod === 'range') {
    el.innerHTML = '<div class="form-row"><span class="form-label">페이지 범위</span>'
      + '<input type="text" class="form-input" id="splitRange" placeholder="예: 1-10, 11-25, 26-' + f.pageCount + '" oninput="updatePreview(\'' + f.id + '\')">'
      + '</div><div class="form-hint">쉼표로 구분, 총 ' + f.pageCount + '페이지</div>';
  } else {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);padding:4px 0 12px;">' + f.pageCount + '개의 파일로 분리됩니다</div>';
    setTimeout(() => updatePreview(f.id), 0);
  }
}

function computeChunks(f) {
  const chunks = [], total = f.pageCount;
  if (splitMethod === 'pages') {
    const n = parseInt(document.getElementById('splitPages')?.value || 10);
    for (let s = 1; s <= total; s += n) {
      const e = Math.min(s + n - 1, total);
      chunks.push({ label: '파트' + (chunks.length + 1), pages: s + '–' + e, count: e - s + 1, size: Math.round(f.size * (e - s + 1) / total), start: s, end: e });
    }
  } else if (splitMethod === 'size') {
    const mb = parseFloat(document.getElementById('splitSize')?.value || 5);
    const ppc = Math.max(1, Math.floor(mb * 1024 * 1024 * total / f.size));
    for (let s = 1; s <= total; s += ppc) {
      const e = Math.min(s + ppc - 1, total);
      chunks.push({ label: '파트' + (chunks.length + 1), pages: s + '–' + e, count: e - s + 1, size: Math.round(f.size * (e - s + 1) / total), start: s, end: e });
    }
  } else if (splitMethod === 'range') {
    const parts = (document.getElementById('splitRange')?.value || '').split(',').map(r => r.trim()).filter(Boolean);
    for (const p of parts) {
      const m = p.match(/^(\d+)-(\d+)$/);
      if (!m) continue;
      const s = +m[1], e = +m[2];
      if (s < 1 || e > total || s > e) continue;
      chunks.push({ label: '파트' + (chunks.length + 1), pages: s + '–' + e, count: e - s + 1, size: Math.round(f.size * (e - s + 1) / total), start: s, end: e });
    }
  } else {
    for (let i = 1; i <= total; i++) {
      chunks.push({ label: '페이지' + i, pages: '' + i, count: 1, size: Math.round(f.size / total), start: i, end: i });
    }
  }
  return chunks;
}

function updatePreview(fid) {
  const f = files.find(x => x.id === fid);
  if (!f) return;
  const chunks = computeChunks(f);
  const preview = document.getElementById('splitPreview');
  if (!preview) return;
  if (!chunks.length) {
    preview.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0;">유효한 분할 설정을 입력하세요</div>';
    return;
  }
  const show = (splitMethod === 'all' && chunks.length > 8) ? chunks.slice(0, 8) : chunks;
  const more = chunks.length - show.length;
  preview.innerHTML = '<div class="preview-box"><table class="preview-table">'
    + '<thead><tr><th>#</th><th>이름</th><th>범위</th><th>페이지</th><th>크기</th></tr></thead>'
    + '<tbody>'
    + show.map((c, i) => '<tr><td class="chunk-num">' + (i + 1) + '</td><td>' + c.label + '</td><td>' + c.pages + '</td><td>' + c.count + 'p</td><td>' + fmtSize(c.size) + '</td></tr>').join('')
    + (more > 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text3);">...외 ' + more + '개</td></tr>' : '')
    + '</tbody></table></div>'
    + '<div style="font-size:12px;color:var(--text2);">총 <strong style="color:var(--accent2);">' + chunks.length + '개</strong> 청크로 분할됩니다</div>';
}

// ── TAB: 교정 설정 ──
function renderProofreadTab(f) {
  const el = document.getElementById('content-proofread');
  const levels = [
    { id: 'light',  icon: '🔍', name: '가볍게', desc: '맞춤법·띄어쓰기만' },
    { id: 'normal', icon: '✏️', name: '보통',   desc: '어색한 표현 포함' },
    { id: 'deep',   icon: '🔬', name: '꼼꼼히', desc: '논리 흐름까지' },
  ];
  el.innerHTML = '<div class="section-title">교정 강도</div>'
    + '<div class="level-grid">'
    + levels.map(lv =>
      '<div class="level-card ' + (proofLevel === lv.id ? 'selected' : '') + '" onclick="setProofLevel(\'' + lv.id + '\')">'
      + '<span class="level-icon">' + lv.icon + '</span>'
      + '<div class="level-name">' + lv.name + '</div>'
      + '<div class="level-desc">' + lv.desc + '</div>'
      + '</div>'
    ).join('')
    + '</div>'
    + '<div class="divider"></div>'
    + '<div class="section-title">교정 대상</div>'
    + '<div style="font-size:13px;color:var(--text2);margin-bottom:12px;">분할된 청크 단위로 순차 교정합니다. 분할하지 않은 경우 전체를 한 번에 교정합니다.</div>'
    + '<div id="proofProgressSection" style="display:none;">'
    + '<div class="divider"></div>'
    + '<div class="section-title">교정 진행 상황</div>'
    + '<div class="progress-bar-wrap"><div class="progress-bar-fill" id="proofProgressFill" style="width:0%"></div></div>'
    + '<div class="progress-text" id="proofProgressText">준비 중...</div>'
    + '</div>';
}

function setProofLevel(lv) {
  proofLevel = lv;
  const f = files.find(x => x.id === activeId);
  if (f) renderProofreadTab(f);
}

// ── TAB: 결과 ──
function renderResultTab(f) {
  const el = document.getElementById('content-result');
  if (!f.proofResults.length) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:20px 0;">교정을 실행하면 결과가 여기에 표시됩니다</div>';
    return;
  }
  const allChanges = f.proofResults.flatMap(r => r.changes || []);
  const summaries = f.proofResults.map(r => r.summary).filter(Boolean);
  let html = '';
  if (summaries.length) {
    html += '<div class="summary-box"><strong>📝 교정 요약</strong><br>' + summaries.map(escHtml).join(' / ') + '</div>';
  }
  if (allChanges.length) {
    html += '<div class="section-title" style="margin-bottom:10px;">변경 사항 (' + allChanges.length + '건)</div>'
      + '<div class="preview-box" style="margin-bottom:20px;">'
      + '<table class="changes-table"><thead><tr><th>원문</th><th>교정</th><th>이유</th><th>유형</th></tr></thead><tbody>'
      + allChanges.map(c => {
        const tc = c.type === '맞춤법' ? 'tag-spell' : c.type === '띄어쓰기' ? 'tag-space' : 'tag-sent';
        return '<tr>'
          + '<td><mark class="del">' + escHtml(c.before || '') + '</mark></td>'
          + '<td><mark class="ins">' + escHtml(c.after || '') + '</mark></td>'
          + '<td style="color:var(--text2)">' + escHtml(c.reason || '') + '</td>'
          + '<td><span class="tag ' + tc + '">' + escHtml(c.type || '기타') + '</span></td>'
          + '</tr>';
      }).join('')
      + '</tbody></table></div>';
  }
  html += '<div class="section-title">원문 / 교정문 비교</div><div class="diff-container">';
  f.proofResults.forEach((r, i) => {
    html += '<div class="diff-chunk">'
      + '<div class="diff-chunk-header">📄 파트 ' + (i + 1) + ' <span style="font-weight:400;color:var(--text3)">(' + (r.changes?.length || 0) + '건 교정)</span></div>'
      + '<div class="diff-body">'
      + '<div class="diff-side diff-original"><div class="diff-side-label">원문</div>' + renderDiffText(r.original, r.changes, 'before') + '</div>'
      + '<div class="diff-side diff-corrected"><div class="diff-side-label">교정문</div>' + renderDiffText(r.corrected, r.changes, 'after') + '</div>'
      + '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

function renderDiffText(text, changes, side) {
  if (!text) return '<span style="color:var(--text3)">—</span>';
  let result = escHtml(text);
  if (changes && changes.length) {
    changes.forEach(c => {
      const word = escHtml(side === 'before' ? c.before : c.after);
      if (!word) return;
      const cls = side === 'before' ? 'del' : 'ins';
      result = result.replace(word, '<mark class="' + cls + '">' + word + '</mark>');
    });
  }
  return result;
}

// ── ACTION ROW ──
function renderActionRow(f, tab) {
  const row = document.getElementById('actionRow');
  if (!row || !f) return;
  const t = tab || (document.querySelector('.tab-btn.active')?.id?.replace('tab-', '') || 'split');
  if (t === 'split') {
    row.innerHTML = '<button class="btn btn-primary" id="btnSplit" onclick="doSplit(\'' + f.id + '\')">✂️ 분할 실행</button>'
      + (f.chunks.length ? '<button class="btn btn-secondary" onclick="doDownloadAll(\'' + f.id + '\')">⬇️ 전체 다운로드</button>' : '')
      + '<span style="flex:1"></span>'
      + '<button class="btn btn-danger" onclick="removeFile(\'' + f.id + '\')">🗑️ 제거</button>';
  } else if (t === 'proofread') {
    row.innerHTML = '<button class="btn btn-primary" id="btnProof" onclick="doProofread(\'' + f.id + '\')">✍️ 교정 실행</button>'
      + (f.proofResults.length ? '<button class="btn btn-secondary" onclick="switchTab(\'result\')">📋 결과 보기</button>' : '')
      + '<span style="flex:1"></span>'
      + '<button class="btn btn-danger" onclick="removeFile(\'' + f.id + '\')">🗑️ 제거</button>';
  } else {
    row.innerHTML = '<button class="btn btn-secondary" onclick="downloadResult(\'' + f.id + '\')">⬇️ 결과 다운로드</button>'
      + '<span style="flex:1"></span>'
      + '<button class="btn btn-danger" onclick="removeFile(\'' + f.id + '\')">🗑️ 제거</button>';
  }
}

// ── SPLIT ──
async function doSplit(fid) {
  const f = files.find(x => x.id === fid);
  if (!f) return;
  const chunks = computeChunks(f);
  if (!chunks.length) { toast('분할 설정을 확인하세요', 'warning'); return; }
  const ps = document.getElementById('progressSection');
  const pf = document.getElementById('progressFill');
  const pt = document.getElementById('progressText');
  if (ps) ps.style.display = 'block';
  const btn = document.getElementById('btnSplit');
  if (btn) btn.disabled = true;
  try {
    const srcDoc = await PDFLib.PDFDocument.load(f.arrayBuffer, { ignoreEncryption: true });
    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const newDoc = await PDFLib.PDFDocument.create();
      const pages = Array.from({ length: c.end - c.start + 1 }, (_, k) => c.start - 1 + k);
      const copied = await newDoc.copyPages(srcDoc, pages);
      copied.forEach(p => newDoc.addPage(p));
      const bytes = await newDoc.save();
      results.push({ name: f.name.replace('.pdf', '') + '_파트' + (i + 1) + '.pdf', bytes, start: c.start, end: c.end });
      const pct = Math.round((i + 1) / chunks.length * 100);
      if (pf) pf.style.width = pct + '%';
      if (pt) pt.textContent = (i + 1) + '/' + chunks.length + ' 처리 중... (' + pct + '%)';
      await new Promise(r => setTimeout(r, 0));
    }
    f.chunks = results;
    renderFileList();
    selectFile(fid);
    if (pt) pt.textContent = '✅ 분할 완료 — ' + results.length + '개 파일';
    toast('분할 완료: ' + results.length + '개 파일', 'success');
  } catch (e) {
    toast('분할 오류: ' + e.message, 'error');
  }
  const btn2 = document.getElementById('btnSplit');
  if (btn2) btn2.disabled = false;
}

async function doDownloadAll(fid) {
  const f = files.find(x => x.id === fid);
  if (!f || !f.chunks.length) return;
  for (const c of f.chunks) {
    const blob = new Blob([c.bytes], { type: 'application/pdf' });
    download(blob, c.name, 'application/pdf');
    await new Promise(r => setTimeout(r, 300));
  }
  toast(f.chunks.length + '개 파일 다운로드 완료', 'success');
}

// ── PROOFREAD ──
async function doProofread(fid) {
  const f = files.find(x => x.id === fid);
  if (!f) return;
  const btn = document.getElementById('btnProof');
  if (btn) btn.disabled = true;
  const ps = document.getElementById('proofProgressSection');
  const pf = document.getElementById('proofProgressFill');
  const pt = document.getElementById('proofProgressText');
  if (ps) ps.style.display = 'block';

  const targets = f.chunks.length
    ? f.chunks.map((c, i) => ({ label: '파트' + (i + 1), buffer: c.bytes }))
    : [{ label: '전체', buffer: f.arrayBuffer }];

  f.proofResults = [];
  try {
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      if (pt) pt.textContent = t.label + ' 텍스트 추출 중...';
      const text = await extractTextFromPDF(t.buffer);
      if (!text.trim() || text.startsWith('(')) {
        f.proofResults.push({ original: text, corrected: '(텍스트 추출 불가)', changes: [], summary: t.label + ': 텍스트 레이어 없음' });
        continue;
      }
      if (pt) pt.textContent = t.label + ' 교정 중... (' + (i + 1) + '/' + targets.length + ')';
      const res = await fetch('/api/proofread', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 4000), level: proofLevel })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'API 오류'); }
      const data = await res.json();
      f.proofResults.push({ original: text.slice(0, 4000), ...data });
      const pct = Math.round((i + 1) / targets.length * 100);
      if (pf) pf.style.width = pct + '%';
      if (pt) pt.textContent = (i + 1) + '/' + targets.length + ' 완료 (' + pct + '%)';
      await new Promise(r => setTimeout(r, 300));
    }
    renderFileList();
    renderResultTab(f);
    selectFile(fid);
    switchTab('result');
    toast('교정 완료!', 'success');
  } catch (e) {
    toast('교정 오류: ' + e.message, 'error');
    if (pt) pt.textContent = '❌ 오류: ' + e.message;
  }
  const btn2 = document.getElementById('btnProof');
  if (btn2) btn2.disabled = false;
}

async function extractTextFromPDF(buffer) {
  try {
    const ab = buffer instanceof ArrayBuffer ? buffer : await new Response(buffer).arrayBuffer();
    const uint8 = new Uint8Array(ab);
    const raw = new TextDecoder('latin1').decode(uint8);
    let text = '';
    const btEt = raw.match(/BT([\s\S]*?)ET/g) || [];
    for (const block of btEt) {
      const tjM = block.match(/\(([^)]*)\)\s*Tj/g) || [];
      for (const tj of tjM) { const m = tj.match(/\(([^)]*)\)/); if (m) text += m[1] + ' '; }
      const tfM = block.match(/\[([^\]]*)\]\s*TJ/g) || [];
      for (const tf of tfM) {
        const inner = tf.match(/\[([^\]]*)\]/)[1];
        const sp = inner.match(/\(([^)]*)\)/g) || [];
        for (const s of sp) text += s.slice(1, -1) + ' ';
      }
    }
    return text.trim() || '(텍스트 레이어 없음 — 스캔 PDF일 수 있습니다)';
  } catch (e) {
    return '(텍스트 추출 실패: ' + e.message + ')';
  }
}

function downloadResult(fid) {
  const f = files.find(x => x.id === fid);
  if (!f || !f.proofResults.length) return;
  let content = 'AI 초벌 교정 결과\n파일: ' + f.name + '\n날짜: ' + new Date().toLocaleString('ko-KR') + '\n' + '='.repeat(50) + '\n\n';
  f.proofResults.forEach((r, i) => {
    content += '[ 파트 ' + (i + 1) + ' ]\n요약: ' + (r.summary || '') + '\n\n교정문:\n' + (r.corrected || '') + '\n\n';
    if (r.changes?.length) { content += '변경 사항:\n'; r.changes.forEach(c => { content += '  · ' + c.before + ' → ' + c.after + ' (' + c.reason + ')\n'; }); }
    content += '\n' + '-'.repeat(40) + '\n\n';
  });
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  download(blob, f.name.replace('.pdf', '') + '_교정결과.txt', 'text/plain');
  toast('결과 파일 다운로드 완료', 'success');
}

function removeFile(fid) {
  const idx = files.findIndex(x => x.id === fid);
  if (idx === -1) return;
  files.splice(idx, 1);
  activeId = null;
  renderFileList();
  document.getElementById('detailPanel').classList.remove('visible');
  document.getElementById('emptyState').style.display = '';
  updateTopbarMeta();
  toast('파일이 제거되었습니다', 'info');
}

function updateTopbarMeta() {
  const meta = document.getElementById('topbarMeta');
  if (!files.length) { meta.textContent = 'PDF 파일을 업로드하여 시작하세요'; return; }
  meta.textContent = files.length + '개 파일 · '
    + files.reduce((a, f) => a + f.pageCount, 0) + '페이지 · '
    + fmtSize(files.reduce((a, f) => a + f.size, 0));
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', initUpload);
