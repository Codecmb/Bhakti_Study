(function(global){
  function render(container,{program,scope,questions=[],bank=null}={}){
    if(!container||!global.QuestionEngine)return;

    const active=QuestionEngine.active(questions,program);
    const deleted=QuestionEngine.deletedQuestions(program).map(d=>{
      const current=questions.find(q=>q.id===d.qid);
      return current||d.question||{id:d.qid,question:'Deleted question',canonical_ref:''};
    });

    container.innerHTML=
      `<h3>${bank?.label||'Study Questions'}</h3>`+
      active.map((x,i)=>`<article class="question-card" data-qid="${x.id}">
        <p><strong>${i+1}. ${x.question}</strong></p>
        <textarea class="field qanswer" data-qid="${x.id}" placeholder="Answer from the primary source…"></textarea>
        <p><button class="button secondary clearAnswer" type="button" data-qid="${x.id}">Clear Answer</button></p>
        <div class="small">${x.canonical_ref||''}${bank?.provenance_label?' · '+bank.provenance_label:''}${x.kind?' · '+x.kind:''}${x.provenance?.title?' · Source: '+x.provenance.title:''}${x.provenance?.author?' · '+x.provenance.author:''}</div>
        <p>
          <button class="button secondary flagDuplicate" data-qid="${x.id}">
            ${QuestionEngine.isDuplicate(program,x.id)?'Unflag Duplicate':'Flag Duplicate'}
          </button>
          <button class="button secondary deleteQuestion" data-qid="${x.id}">Delete Question</button>
        </p>
      </article>`).join('')+
      '<p><button id="saveQuestions" class="button">Save Answers</button></p>'+
      (deleted.length?`<details>
        <summary><strong>Deleted Questions (${deleted.length})</strong></summary>
        ${deleted.map(x=>`<article class="question-card">
          <p>${x.question}</p>
          <button class="button secondary restoreQuestion" data-qid="${x.id}">Restore</button>
        </article>`).join('')}
      </details>`:'');

    container.querySelectorAll('.qanswer').forEach(el=>{
      el.value=QuestionEngine.load(program,scope,el.dataset.qid);
    });

    container.querySelectorAll('.clearAnswer').forEach(btn=>btn.onclick=()=>{
      const answer=container.querySelector(`.qanswer[data-qid="${btn.dataset.qid}"]`);
      if(!answer || !answer.value)return;
      if(!confirm('Clear this answer? The saved answer will remain unchanged until you save answers.'))return;
      answer.value='';
      answer.focus();
    });

    container.querySelectorAll('.flagDuplicate').forEach(btn=>btn.onclick=()=>{
      if(QuestionEngine.isDuplicate(program,btn.dataset.qid)){
        QuestionEngine.clearDuplicate(program,btn.dataset.qid);
        btn.textContent='Flag Duplicate';
      }else{
        QuestionEngine.flagDuplicate(program,btn.dataset.qid);
        btn.textContent='Unflag Duplicate';
      }
    });

    container.querySelectorAll('.deleteQuestion').forEach(btn=>btn.onclick=()=>{
      if(!confirm('Delete this question from your study collection? You can restore it later.'))return;
      const item=questions.find(x=>x.id===btn.dataset.qid);
      QuestionEngine.deleteQuestion(program,btn.dataset.qid,item||null);
      render(container,{program,scope,questions,bank});
    });

    container.querySelectorAll('.restoreQuestion').forEach(btn=>btn.onclick=()=>{
      QuestionEngine.restoreQuestion(program,btn.dataset.qid);
      render(container,{program,scope,questions,bank});
    });
  }

  global.QuestionManagementUI={render};
})(window);
