(function(){
'use strict';

window.AcademyLibraryJournal = {
  update(context){
    const host = document.querySelector('#studyContext');
    if(!host)return;

    let actions = host.querySelector('.reader-actions');

    if(!actions){
      actions = document.createElement('div');
      actions.className = 'reader-actions';
      host.appendChild(actions);
    }

    const params = new URLSearchParams({
      program: context.program || 'Books & Library',
      unit: context.unit || 'library',
      book: context.book || '',
      bookTitle: context.bookTitle || '',
      section: context.section || '',
      ref: context.ref || ''
    });

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button secondary';
    button.textContent = 'Open Study Journal ↗';

    button.addEventListener('click', function(){
      const popup = window.open(
        '../student/journal.html?' + params.toString(),
        '_blank',
        'popup=yes,width=760,height=900,resizable=yes,scrollbars=yes'
      );
      if(popup)popup.focus();
    });

    actions.appendChild(button);

    try{
      const channel = new BroadcastChannel('academia-study-journal');
      channel.postMessage({
        type: 'reader-context',
        program: context.program || 'Books & Library',
        unit: context.unit || 'library',
        book: context.book,
        bookTitle: context.bookTitle,
        section: context.section,
        canonical: context.ref
      });
      channel.close();
    }catch(error){
      console.warn('Study Journal synchronization unavailable:', error);
    }
  }
};
})();
