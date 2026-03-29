import Script from 'next/script';

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&family=Space+Grotesk:wght@400;500;600&display=swap');
        :root {
          --bg:#f5f6fa;--surface:#fff;--surface2:#f0f1f7;--surface3:#e8eaf2;
          --border:rgba(0,0,0,0.07);--border-accent:rgba(0,0,0,0.13);
          --accent:#5b52e8;--accent2:#7c6ff7;--accent-glow:rgba(91,82,232,0.08);
          --green:#16a34a;--amber:#d97706;--red:#dc2626;
          --text:#1a1a2e;--text2:#555570;--text3:#9898b0;
          --radius:12px;--radius-sm:8px;
        }
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:var(--bg);color:var(--text);font-family:'Noto Sans KR',sans-serif;font-size:14px;line-height:1.6;min-height:100vh;}
        .app-shell{display:grid;grid-template-columns:260px 1fr;grid-template-rows:56px 1fr;height:100vh;overflow:hidden;}
        .topbar{grid-column:1/-1;background:var(--surface);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 20px;gap:16px;z-index:10;}
        .topbar-logo{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px;}
        .logo-icon{width:28px;height:28px;background:var(--accent);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;}
        .topbar-sep{flex:1;}
        .topbar-meta{font-size:12px;color:var(--text3);}
        .sidebar{background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
        .sidebar-section{padding:16px;border-bottom:1px solid var(--border);}
        .sidebar-label{font-size:10px;font-weight:500;letter-spacing:1px;color:var(--text3);text-transform:uppercase;margin-bottom:10px;}
        .upload-zone{border:1.5px dashed var(--border-accent);border-radius:var(--radius);padding:20px 16px;text-align:center;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
        .upload-zone::before{content:'';position:absolute;inset:0;background:var(--accent-glow);opacity:0;transition:opacity 0.2s;}
        .upload-zone:hover::before,.upload-zone.drag-over::before{opacity:1;}
        .upload-zone:hover,.upload-zone.drag-over{border-color:var(--accent);}
        .upload-icon{font-size:28px;margin-bottom:8px;display:block;}
        .upload-text{font-size:12px;color:var(--text2);line-height:1.5;}
        .upload-text strong{color:var(--accent2);}
        .file-list{flex:1;overflow-y:auto;padding:8px;}
        .file-list::-webkit-scrollbar{width:4px;}
        .file-list::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:2px;}
        .file-item{display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--radius-sm);cursor:pointer;transition:background 0.15s;border:1px solid transparent;margin-bottom:4px;}
        .file-item:hover{background:var(--surface2);}
        .file-item.active{background:var(--accent-glow);border-color:rgba(91,82,232,0.3);}
        .file-icon{width:32px;height:36px;background:var(--surface3);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--accent2);flex-shrink:0;}
        .file-icon.done{color:var(--green);}
        .file-info{flex:1;min-width:0;}
        .file-name{font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:500;}
        .file-meta{font-size:11px;color:var(--text3);margin-top:1px;}
        .file-status{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .status-done{background:var(--green);}
        .status-new{background:#c8c8d8;}
        .main{display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}
        .empty-state{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text3);text-align:center;padding:40px;}
        .empty-icon{font-size:48px;opacity:0.4;}
        .empty-title{font-size:16px;color:var(--text2);font-weight:500;}
        .empty-sub{font-size:13px;max-width:280px;}
        .detail-panel{display:none;flex-direction:column;height:100%;overflow:hidden;}
        .detail-panel.visible{display:flex;}
        .detail-header{padding:20px 24px 16px;border-bottom:1px solid var(--border);background:var(--surface);}
        .detail-title{font-size:15px;font-weight:700;word-break:break-all;}
        .detail-badges{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}
        .tab-row{display:flex;gap:4px;padding:12px 24px 0;background:var(--surface);border-bottom:1px solid var(--border);}
        .tab-btn{padding:8px 18px;font-size:13px;font-weight:500;font-family:'Noto Sans KR',sans-serif;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;color:var(--text3);transition:all 0.15s;margin-bottom:-1px;}
        .tab-btn.active{color:var(--accent);border-bottom-color:var(--accent);}
        .tab-btn:hover:not(.active){color:var(--text2);}
        .tab-content{display:none;flex:1;overflow-y:auto;padding:20px 24px;}
        .tab-content.visible{display:block;}
        .tab-content::-webkit-scrollbar{width:4px;}
        .tab-content::-webkit-scrollbar-thumb{background:var(--surface3);border-radius:2px;}
        .badge{font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;}
        .badge-purple{background:rgba(91,82,232,0.10);color:var(--accent);border:1px solid rgba(91,82,232,0.22);}
        .badge-green{background:rgba(22,163,74,0.10);color:var(--green);border:1px solid rgba(22,163,74,0.25);}
        .badge-amber{background:rgba(217,119,6,0.10);color:var(--amber);border:1px solid rgba(217,119,6,0.25);}
        .section-title{font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--text3);margin-bottom:12px;}
        .divider{height:1px;background:var(--border);margin:18px 0;}
        .split-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
        .method-card{background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius);padding:14px;cursor:pointer;transition:all 0.15s;text-align:left;}
        .method-card:hover{border-color:var(--border-accent);background:var(--surface3);}
        .method-card.selected{border-color:var(--accent);background:var(--accent-glow);}
        .method-icon{font-size:18px;margin-bottom:6px;display:block;}
        .method-name{font-size:13px;font-weight:600;color:var(--text);}
        .method-desc{font-size:11px;color:var(--text3);margin-top:2px;line-height:1.4;}
        .form-row{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
        .form-label{font-size:13px;color:var(--text2);width:120px;flex-shrink:0;}
        .form-input{flex:1;background:var(--surface2);border:1px solid var(--border-accent);border-radius:var(--radius-sm);padding:8px 12px;color:var(--text);font-size:13px;font-family:'Noto Sans KR',sans-serif;outline:none;transition:border-color 0.15s;}
        .form-input:focus{border-color:var(--accent);}
        .form-hint{font-size:11px;color:var(--text3);margin-top:-8px;margin-bottom:14px;padding-left:132px;}
        .range-wrap{flex:1;display:flex;align-items:center;gap:10px;}
        input[type=range]{flex:1;-webkit-appearance:none;height:4px;background:var(--surface3);border-radius:2px;outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent);cursor:pointer;}
        .range-value{font-size:12px;color:var(--accent2);font-weight:600;min-width:36px;text-align:right;}
        .preview-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;margin-bottom:20px;}
        .preview-table{width:100%;border-collapse:collapse;}
        .preview-table th{padding:10px 14px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:var(--text3);background:var(--surface2);text-align:left;border-bottom:1px solid var(--border);}
        .preview-table td{padding:9px 14px;font-size:12px;color:var(--text2);border-bottom:1px solid var(--border);}
        .preview-table tr:last-child td{border-bottom:none;}
        .preview-table tr:hover td{background:var(--surface2);}
        .chunk-num{font-family:'Space Grotesk',monospace;font-weight:600;color:var(--accent2);}
        .progress-bar-wrap{background:var(--surface3);border-radius:4px;height:6px;overflow:hidden;margin:8px 0;}
        .progress-bar-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:4px;transition:width 0.3s ease;}
        .progress-text{font-size:11px;color:var(--text3);text-align:center;margin-top:6px;}
        .level-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px;}
        .level-card{background:var(--surface2);border:1.5px solid var(--border);border-radius:var(--radius);padding:12px;cursor:pointer;transition:all 0.15s;text-align:center;}
        .level-card:hover{border-color:var(--border-accent);}
        .level-card.selected{border-color:var(--accent);background:var(--accent-glow);}
        .level-icon{font-size:20px;margin-bottom:4px;display:block;}
        .level-name{font-size:12px;font-weight:600;color:var(--text);}
        .level-desc{font-size:10px;color:var(--text3);margin-top:2px;}
        .diff-container{display:flex;flex-direction:column;gap:16px;}
        .diff-chunk{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;}
        .diff-chunk-header{padding:10px 16px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:12px;font-weight:600;color:var(--text2);}
        .diff-body{display:grid;grid-template-columns:1fr 1fr;}
        .diff-side{padding:14px 16px;font-size:13px;line-height:1.8;}
        .diff-side-label{font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;}
        .diff-original{border-right:1px solid var(--border);}
        mark.del{background:rgba(220,38,38,0.12);color:var(--red);border-radius:3px;padding:0 2px;text-decoration:line-through;}
        mark.ins{background:rgba(22,163,74,0.12);color:var(--green);border-radius:3px;padding:0 2px;}
        .changes-table{width:100%;border-collapse:collapse;font-size:12px;}
        .changes-table th{padding:8px 12px;background:var(--surface2);color:var(--text3);font-size:10px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;border-bottom:1px solid var(--border);}
        .changes-table td{padding:9px 12px;border-bottom:1px solid var(--border);vertical-align:top;}
        .changes-table tr:last-child td{border-bottom:none;}
        .tag{display:inline-block;font-size:10px;padding:2px 7px;border-radius:10px;font-weight:600;}
        .tag-spell{background:rgba(220,38,38,0.1);color:var(--red);}
        .tag-space{background:rgba(217,119,6,0.1);color:var(--amber);}
        .tag-sent{background:rgba(91,82,232,0.1);color:var(--accent);}
        .summary-box{background:rgba(91,82,232,0.06);border:1px solid rgba(91,82,232,0.18);border-radius:var(--radius);padding:14px 16px;margin-bottom:20px;font-size:13px;color:var(--text2);}
        .summary-box strong{color:var(--accent);}
        .size-warning{background:rgba(217,119,6,0.06);border:1px solid rgba(217,119,6,0.22);border-radius:var(--radius);padding:12px 14px;margin-bottom:16px;font-size:12px;color:#92530a;display:flex;gap:10px;align-items:flex-start;}
        .action-row{display:flex;gap:10px;padding:16px 24px;border-top:1px solid var(--border);background:var(--surface);flex-shrink:0;}
        .btn{padding:9px 20px;border-radius:var(--radius-sm);font-size:13px;font-weight:600;font-family:'Noto Sans KR',sans-serif;cursor:pointer;border:none;transition:all 0.15s;display:flex;align-items:center;gap:6px;}
        .btn:disabled{opacity:0.4;cursor:not-allowed;}
        .btn-primary{background:var(--accent);color:#fff;}
        .btn-primary:not(:disabled):hover{background:#6c63ff;}
        .btn-secondary{background:var(--surface3);color:var(--text);border:1px solid var(--border-accent);}
        .btn-secondary:not(:disabled):hover{background:var(--surface2);}
        .btn-danger{background:rgba(220,38,38,0.07);color:var(--red);border:1px solid rgba(220,38,38,0.22);}
        .btn-danger:not(:disabled):hover{background:rgba(220,38,38,0.14);}
        .toast-container{position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:1000;}
        .toast{background:#fff;border:1px solid var(--border-accent);border-radius:var(--radius);padding:12px 16px;font-size:13px;color:var(--text);box-shadow:0 4px 20px rgba(0,0,0,0.12);max-width:300px;display:flex;align-items:center;gap:8px;animation:slideIn 0.2s ease;}
        .toast.success{border-color:rgba(22,163,74,0.4);}
        .toast.error{border-color:rgba(220,38,38,0.35);}
        @keyframes slideIn{from{transform:translateX(20px);opacity:0;}to{transform:translateX(0);opacity:1;}}
      `}</style>

      <div className="app-shell">
        <header className="topbar">
          <div className="topbar-logo">
            <div className="logo-icon">✦</div>
            AI 초벌 교정
          </div>
          <div className="topbar-sep"></div>
          <span className="topbar-meta" id="topbarMeta">PDF 파일을 업로드하여 시작하세요</span>
        </header>

        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-label">파일 업로드</div>
            <div className="upload-zone" id="uploadZone">
              <span className="upload-icon">📄</span>
              <div className="upload-text">
                <strong>클릭</strong>하거나<br />파일을 드래그하세요<br />
                <span style={{fontSize:'11px',marginTop:'4px',display:'block'}}>PDF · 최대 500MB</span>
              </div>
            </div>
            <input type="file" id="fileInput" accept=".pdf" multiple style={{display:'none'}} />
          </div>
          <div className="sidebar-section" style={{paddingBottom:'8px'}}>
            <div className="sidebar-label">파일 목록 (<span id="fileCount">0</span>)</div>
          </div>
          <div className="file-list" id="fileList">
            <div style={{padding:'20px',textAlign:'center',color:'var(--text3)',fontSize:'12px'}}>업로드된 파일이 없습니다</div>
          </div>
        </aside>

        <main className="main">
          <div className="empty-state" id="emptyState">
            <div className="empty-icon">🗂️</div>
            <div className="empty-title">파일을 선택하세요</div>
            <div className="empty-sub">왼쪽 사이드바에서 PDF 파일을 업로드하거나 목록에서 파일을 선택하세요</div>
          </div>

          <div className="detail-panel" id="detailPanel">
            <div className="detail-header">
              <div className="detail-title" id="detailName">—</div>
              <div className="detail-badges" id="detailBadges"></div>
            </div>
            <div className="tab-row">
              <button className="tab-btn active" id="tab-split" onClick={() => window.switchTab('split')}>✂️ 분할</button>
              <button className="tab-btn" id="tab-proofread" onClick={() => window.switchTab('proofread')}>✍️ 교정</button>
              <button className="tab-btn" id="tab-result" onClick={() => window.switchTab('result')}>📋 결과</button>
            </div>
            <div className="tab-content visible" id="content-split"></div>
            <div className="tab-content" id="content-proofread"></div>
            <div className="tab-content" id="content-result">
              <div style={{color:'var(--text3)',fontSize:'13px',padding:'20px 0'}}>교정을 실행하면 결과가 여기에 표시됩니다</div>
            </div>
            <div className="action-row" id="actionRow"></div>
          </div>
        </main>
      </div>

      <div className="toast-container" id="toastContainer"></div>

      {/* CDN → app.js 순서로 로드 보장 */}
      <Script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js" strategy="beforeInteractive" />
      <Script src="https://unpkg.com/downloadjs@1.4.7/download.min.js" strategy="beforeInteractive" />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
