(function(global){
  const PROGRAMS=[
    {
      id:'bhakti-sastri',
      label:'Bhakti Śāstrī',
      books:[
        {id:'bg',label:'Bhagavad-gītā'},
        {id:'iso',label:'Śrī Īśopaniṣad'},
        {id:'nod',label:'Nectar of Devotion'},
        {id:'noi',label:'Nectar of Instruction'}
      ]
    },
    {
      id:'bhakti-vaibhava',
      label:'Bhakti Vaibhava',
      books:[
        {id:'sb1',label:'Śrīmad-Bhāgavatam · Canto 1'},
        {id:'sb2',label:'Śrīmad-Bhāgavatam · Canto 2'},
        {id:'sb3',label:'Śrīmad-Bhāgavatam · Canto 3'},
        {id:'sb4',label:'Śrīmad-Bhāgavatam · Canto 4'},
        {id:'sb5',label:'Śrīmad-Bhāgavatam · Canto 5'},
        {id:'sb6',label:'Śrīmad-Bhāgavatam · Canto 6'}
      ]
    },
    {
      id:'bhakti-vedanta',
      label:'Bhakti Vedānta',
      books:[
        {id:'sb7',label:'Śrīmad-Bhāgavatam · Canto 7'},
        {id:'sb8',label:'Śrīmad-Bhāgavatam · Canto 8'},
        {id:'sb9',label:'Śrīmad-Bhāgavatam · Canto 9'},
        {id:'sb10',label:'Śrīmad-Bhāgavatam · Canto 10'},
        {id:'sb11',label:'Śrīmad-Bhāgavatam · Canto 11'},
        {id:'sb12',label:'Śrīmad-Bhāgavatam · Canto 12'}
      ]
    },
    {
      id:'bhakti-sarvabhauma',
      label:'Bhakti Sārvabhauma',
      books:[
        {id:'cc-adi',label:'Śrī Caitanya-caritāmṛta · Ādi-līlā'},
        {id:'cc-madhya',label:'Śrī Caitanya-caritāmṛta · Madhya-līlā'},
        {id:'cc-antya',label:'Śrī Caitanya-caritāmṛta · Antya-līlā'}
      ]
    }
  ];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  async function loadRegistry(){
    const response=await fetch('../data/question-sheet-registry.json');
    if(!response.ok)throw new Error(`Question sheet registry: HTTP ${response.status}`);
    return response.json();
  }

  async function loadSheet(record){
    const response=await fetch('../'+record.data);
    if(!response.ok)throw new Error(`${record.id}: HTTP ${response.status}`);
    return response.json();
  }

  function coverageLabel(record){
    const c=record.coverage||{};
    if(c.type==='chapter-range' && c.start && c.end){
      return `Chapters ${c.start}–${c.end}`;
    }
    return '';
  }

  function renderBook(book,sheets,context={}){
    const selected=context.program===context.programId && context.book===book.id;
    const content=sheets.length
      ? `<div style="padding-top:.75rem">
          ${sheets.map(x=>`
            <p>
              <a class="button secondary"
                 href="sheet.html?sheet=${encodeURIComponent(x.record.id)}">
                ${esc(x.data.title||x.data.source_title||x.record.id)}
              </a>
              <span class="small">
                · ${esc(x.data.provider||'')}
                ${coverageLabel(x.record)?' · '+esc(coverageLabel(x.record)):''}
              </span>
            </p>
          `).join('')}
         </div>`
      : '<p class="small">No question sheets registered yet.</p>';

    return `
      <details class="card" data-question-book="${esc(book.id)}"${selected?' open':''}>
        <summary><strong>${esc(book.label)}</strong></summary>
        ${content}
      </details>
    `;
  }

  async function init(){
    const host=document.getElementById('questionBank');
    if(!host)return;

    try{
      const params=new URLSearchParams(location.search);
      const context={
        program:params.get('program')||'',
        book:params.get('book')||''
      };

      const registry=await loadRegistry();

      const loaded=await Promise.all(
        (registry.sheets||[]).map(async record=>({
          record,
          data:await loadSheet(record)
        }))
      );

      host.innerHTML=PROGRAMS.map(program=>{
        const programSheets=loaded.filter(
          x=>x.record.program===program.id
        );

        return `
          <section class="card">
            <h2>${esc(program.label)}</h2>
            ${program.books.map(book=>
              renderBook(
                book,
                programSheets.filter(x=>x.record.book===book.id),
                {...context,programId:program.id}
              )
            ).join('')}
          </section>
        `;
      }).join('');

      if(context.program && context.book){
        const target=[...host.querySelectorAll('[data-question-book]')]
          .find(el=>el.dataset.questionBook===context.book &&
            el.closest('section')?.querySelector('h2')?.textContent===
              PROGRAMS.find(p=>p.id===context.program)?.label);

        target?.scrollIntoView({block:'start'});
      }

    }catch(error){
      host.innerHTML=
        `<div class="card missing">Could not load Question Bank: ${esc(error.message)}</div>`;
    }
  }

  global.CentralQuestionBank={
    programs:PROGRAMS,
    loadRegistry,
    loadSheet,
    init
  };

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})(window);
