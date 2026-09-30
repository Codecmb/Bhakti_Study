(function(){
  const PREFIX='bhakti-study.imported-questions.';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid=()=>`IQ.${Date.now().toString(36)}.${Math.random().toString(36).slice(2,8)}`;
  const key=program=>PREFIX+program;
  const readAll=program=>{try{return JSON.parse(localStorage.getItem(key(program))||'[]')}catch{return []}};
  const writeAll=(program,items)=>localStorage.setItem(key(program),JSON.stringify(items));
  const rtfToText=s=>s.replace(/\\par[d]?\b/g,'\n').replace(/\\'[0-9a-fA-F]{2}/g,' ').replace(/\\[a-zA-Z]+-?\d* ?/g,'').replace(/[{}]/g,'').replace(/\r/g,'');
  function batches(program){
    const groups=new Map();

    readAll(program).forEach(item=>{
      if(item.provider!=='student-import')return;

      const provenance=item.provenance||{};
      const legacyKey=[
        provenance.imported_at||'',
        provenance.source_file||'',
        provenance.title||'',
        provenance.author||''
      ].join('|');

      const importId=item.import_id||(
        provenance.imported_at
          ? `legacy.${legacyKey}`
          : `legacy.${item.id}`
      );
      if(!groups.has(importId)){
        groups.set(importId,{
          id:importId,
          title:item.provenance?.title||'Imported question sheet',
          author:item.provenance?.author||'',
          source_file:item.provenance?.source_file||'',
          imported_at:item.provenance?.imported_at||'',
          legacy:!item.import_id,
          questions:[]
        });
      }

      groups.get(importId).questions.push(item);
    });

    return [...groups.values()];
  }

  function removeBatch(program,importId){
    if(!program||!importId)return 0;

    const items=readAll(program);
    const legacy=String(importId).startsWith('legacy.');

    const matches=item=>{
      if(item.provider!=='student-import')return false;

      if(!legacy)return item.import_id===importId;
      if(item.import_id)return false;

      const provenance=item.provenance||{};
      if(!provenance.imported_at)return `legacy.${item.id}`===importId;

      const legacyKey=[
        provenance.imported_at||'',
        provenance.source_file||'',
        provenance.title||'',
        provenance.author||''
      ].join('|');

      return `legacy.${legacyKey}`===importId;
    };

    const kept=items.filter(item=>!matches(item));
    const removed=items.length-kept.length;

    if(removed)writeAll(program,kept);
    return removed;
  }

  function update(program,id,patch={}){
    if(!program||!id)return null;
    const items=readAll(program);
    const index=items.findIndex(x=>x.id===id&&x.provider==='student-import');
    if(index<0)return null;

    const current=items[index];
    const next={
      ...current,
      ...patch,
      id:current.id,
      provider:current.provider,
      provenance:current.provenance
    };

    items[index]=next;
    writeAll(program,items);
    return next;
  }

  function detect(text){
    const src=String(text||'').replace(/\r/g,'\n').replace(/\n{3,}/g,'\n\n').trim(); if(!src)return [];
    const lines=src.split(/\n+/).map(x=>x.trim()).filter(Boolean),out=[];let current='';
    const starts=/^(?:question\s*)?(?:\d{1,4}|[A-Za-z])[.)\-:]\s+(.+)/i;
    for(const line of lines){const m=line.match(starts);if(m){if(current)out.push(current.trim());current=m[1].trim();continue}if(current){current+=' '+line;if(/[?]$/.test(line)){out.push(current.trim());current=''};continue}if(/[?]$/.test(line))out.push(line)}
    if(current)out.push(current.trim());return [...new Set(out.map(x=>x.replace(/^[-•]\s*/,'')))].filter(x=>x.length>=8);
  }
  function parseCSV(raw){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<raw.length;i++){const c=raw[i],n=raw[i+1];if(c==='"'){if(quoted&&n==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell=''}else cell+=c}
    row.push(cell);if(row.some(x=>x.trim()))rows.push(row);return rows;
  }
  function csvQuestions(raw){
    const rows=parseCSV(raw);if(!rows.length)return [];
    const headers=rows[0].map(x=>x.trim().toLowerCase());
    const aliases=['question','questions','prompt','study question','study_question','question_text','text'];
    let qi=headers.findIndex(h=>aliases.includes(h));let start=1;
    if(qi<0){const firstLooksHeader=headers.some(h=>/question|prompt|chapter|canto|verse|id|answer/.test(h));start=firstLooksHeader?1:0;qi=rows.reduce((best,r)=>r.length>best? r.length:best,0)===1?0:-1}
    let qs=[];
    if(qi>=0)qs=rows.slice(start).map(r=>(r[qi]||'').trim()).filter(Boolean);
    else qs=rows.slice(start).flatMap(r=>r.map(x=>x.trim()).filter(x=>x.endsWith('?')));
    return [...new Set(qs)].filter(x=>x.length>=8);
  }
  async function pdfText(file){
    const pdfjsLib=await import('./vendor/pdfjs/pdf.mjs');
    const worker='../../shared/vendor/pdfjs/pdf.worker.mjs';
    pdfjsLib.GlobalWorkerOptions.workerSrc=worker;
    const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;const pages=[];
    for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),content=await page.getTextContent();pages.push(content.items.map(x=>x.str).join(' '))}
    return pages.join('\n');
  }
  async function odtText(file){
    if(!window.JSZip)throw new Error('JSZip is not loaded.');
    const zip=await JSZip.loadAsync(await file.arrayBuffer());
    const entry=zip.file('content.xml');
    if(!entry)throw new Error('ODT content.xml was not found.');

    const xml=await entry.async('string');
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.querySelector('parsererror'))throw new Error('ODT content.xml could not be parsed.');

    return Array.from(doc.getElementsByTagName('*'))
      .filter(el=>el.localName==='p'||el.localName==='h')
      .map(el=>el.textContent.trim())
      .filter(Boolean)
      .join('\n');
  }

  async function fileText(file){
    const ext=(file.name.split('.').pop()||'').toLowerCase();
    if(ext==='csv'){const raw=await file.text(),questions=csvQuestions(raw);return {text:questions.map((q,i)=>`${i+1}. ${q}`).join('\n'),automatic:true,questions,note:`Read ${questions.length} question${questions.length===1?'':'s'} from CSV.`}}
    if(['txt','md','rtf'].includes(ext)){const raw=await file.text();return {text:ext==='rtf'?rtfToText(raw):raw,automatic:true}}
    if(ext==='pdf'){try{const text=await pdfText(file);return {text,automatic:true,note:'PDF text extracted locally in your browser.'}}catch(e){return {text:'',automatic:false,reason:e.message+' The file was not uploaded. Install the bundled PDF.js files, then drop it again.'}}}
    if(ext==='odt'){try{const text=await odtText(file);return {text,automatic:true,note:'LibreOffice ODT text extracted locally in your browser.'}}catch(e){return {text:'',automatic:false,reason:'Unable to read this ODT file: '+e.message}}}
    return {text:'',automatic:false,reason:`${ext.toUpperCase()||'This file type'} extraction is not installed yet. The source filename is retained; paste question text below if you want to continue.`};
  }
  function list(program,scopes=[]){const S=new Set(scopes.filter(Boolean));return readAll(program).filter(q=>!q.canonical_ref||S.has(q.canonical_ref)||S.has(q.unit));}
  function renderBatchManagement(host,{program,onRemoved=()=>location.reload()}={}){
    if(!host||!program)return;

    const items=batches(program);

    if(!items.length){
      host.innerHTML='';
      return;
    }

    host.innerHTML=`<div class="imported-sheet-management">
      <h4>Imported Sheets</h4>
      ${items.map(batch=>`
        <div class="notice" style="margin:.5rem 0">
          <strong>${esc(batch.title)}</strong>
          <div class="small">${batch.questions.length} question${batch.questions.length===1?'':'s'}${batch.source_file?` · ${esc(batch.source_file)}`:''}</div>
          <p><button class="button secondary qsiRemoveManagedBatch" type="button" data-import-id="${esc(batch.id)}">Remove Imported Sheet</button></p>
        </div>
      `).join('')}
    </div>`;

    host.querySelectorAll('.qsiRemoveManagedBatch').forEach(btn=>btn.onclick=()=>{
      const batch=items.find(x=>x.id===btn.dataset.importId);
      if(!batch)return;

      if(!confirm(`Remove "${batch.title}" and its ${batch.questions.length} imported question${batch.questions.length===1?'':'s'}?`))return;

      const removed=removeBatch(program,batch.id);
      if(removed)onRemoved({batch,removed});
    });
  }

  function render(host,opts={}){
    const program=opts.program,unit=opts.unit||'',canonical=opts.canonical||'',onImported=opts.onImported||(()=>location.reload());
    host.innerHTML=`<details class="question-importer"><summary><strong>Import Question Sheet</strong></summary><div style="padding-top:.75rem"><p class="small">Drag and drop a question sheet or choose a file. CSV, PDF, TXT, Markdown and RTF are extracted locally in the browser. Nothing is uploaded.</p><div id="qsiDrop" class="notice" style="border:2px dashed currentColor;text-align:center;padding:1.25rem;cursor:pointer">Drop question sheet here<br><span class="small">or click to choose a file</span><input id="qsiFile" type="file" accept=".csv,.txt,.md,.rtf,.pdf,.odt,.docx" hidden></div><p id="qsiFileName" class="small"></p><label class="small">Source title</label><input id="qsiTitle" class="field" placeholder="e.g. Bhakti Vaibhava Study Guide"><label class="small">Teacher / author (leave blank if unknown)</label><input id="qsiAuthor" class="field" placeholder="Name"><label class="small">Question text</label><textarea id="qsiText" class="field" rows="8" placeholder="Extracted text appears here. You may also paste questions here."></textarea><p><button id="qsiPreview" class="button secondary" type="button">Preview Questions</button></p><div id="qsiPreviewBox"></div><p id="qsiMsg" class="small"></p><div id="qsiBatches"></div></div></details>`;
    const $=s=>host.querySelector(s),drop=$('#qsiDrop'),fileInput=$('#qsiFile'),text=$('#qsiText'),msg=$('#qsiMsg'),preview=$('#qsiPreviewBox'),batchBox=$('#qsiBatches');
