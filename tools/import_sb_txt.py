#!/usr/bin/env python3
import re,json,sys,hashlib
from pathlib import Path

def clean(lines):
    out=[]
    for x in lines:
        s=x.rstrip('\n\r')
        if re.fullmatch(r'\s*--- Page \d+ ---\s*',s): continue
        if re.fullmatch(r'\s*\d+\s*',s): continue
        out.append(s.strip())
    while out and not out[0]: out.pop(0)
    while out and not out[-1]: out.pop()
    return '\n'.join(out).strip()

def toc_titles(lines,canto):
    titles={}
    # only early TOC before first narrative chapter body
    for s in lines[:120]:
        m=re.match(r'^\(?\d+\)?\s*(\d+)\.\s*(?:\(\d+\))?\s*(.+?)\s*$',s.strip())
        if m:
            n=int(m.group(1)); title=m.group(2).strip()
            if 1<=n<=100 and title and not title.startswith('Translations'):
                titles.setdefault(n,title)
    # fix wrapped known TOC titles by later body title detection if needed
    return titles

def import_book(src,outdir,canto):
    raw=Path(src).read_text(encoding='utf-8',errors='replace')
    lines=raw.splitlines()
    titles=toc_titles(lines,canto)
    heading_re=re.compile(r'^TEXT(S)?\s+(\d+)(?:-(\d+))?\s*$',re.I)
    heads=[(i,heading_re.match(s.strip())) for i,s in enumerate(lines) if heading_re.match(s.strip())]
    sections=[]; chapter=0; last_start=None
    sec=None
    for idx,(pos,m) in enumerate(heads):
        start=int(m.group(2)); end=int(m.group(3) or start)
        if start==1 and (last_start is not None): chapter+=1
        elif chapter==0: chapter=1
        last_start=start
        if sec is None or sec['chapter']!=chapter:
            sec={'chapter':chapter,'id':f'chapter-{chapter}','kind':'study-section','title':f'Chapter {chapter}: {titles.get(chapter,"Untitled chapter")}', 'source_href':Path(src).name, 'verses':[]}
            sections.append(sec)
        block=lines[pos+1:(heads[idx+1][0] if idx+1<len(heads) else len(lines))]
        # stop chapter-summary material before next TEXT naturally; labels delimit fields
        def find(label):
            for j,x in enumerate(block):
                if x.strip().upper()==label:return j
            return None
        syn=find('SYNONYMS'); trans=find('TRANSLATION'); pur=find('PURPORT')
        pre=block[:syn if syn is not None else (trans if trans is not None else len(block))]
        # Preserve the source's pre-synonym block exactly as source_text; do not guess Sanskrit/transliteration split.
        synonyms=clean(block[syn+1:trans] if syn is not None and trans is not None else [])
        translation=clean(block[trans+1:pur if pur is not None else len(block)] if trans is not None else [])
        purport=clean(block[pur+1:] if pur is not None else [])
        ref=f'{canto}.{chapter}.{start}' + (f'-{end}' if end!=start else '')
        rec={
          'id':f'SB.{ref}', 'reference':ref, 'source_heading':m.group(0).strip(),
          'source_text':clean(pre), 'devanagari':'', 'transliteration':'',
          'synonyms':synonyms,'translation':translation,'purport':purport
        }
        sec['verses'].append(rec)
    out=Path(outdir); out.mkdir(parents=True,exist_ok=True)
    book={
      'schema':'bhakti-study.book.v1','id':f'SB.{canto}',
      'title':f'Śrīmad-Bhāgavatam — Canto {canto}',
      'creator':'Contributor attribution not stated in source file',
      'publisher':'Not stated in source file','language':'en','source_format':'TXT','source_file':Path(src).name,
      'source_sha256':hashlib.sha256(Path(src).read_bytes()).hexdigest(),
      'import_notes':'TXT source preserved without silently correcting legacy character encoding. Pre-SYNONYMS text is retained in source_text because the export does not reliably distinguish Sanskrit glyph text from transliteration.',
      'sections':sections
    }
    json.dump(book,open(out/'book.json','w'),ensure_ascii=False,indent=2)
    summary={'id':f'SB.{canto}','sections':len(sections),'records':sum(len(s['verses']) for s in sections),'chapter_records':{str(s['chapter']):len(s['verses']) for s in sections},'source':Path(src).name}
    json.dump(summary,open(out/'import-summary.json','w'),ensure_ascii=False,indent=2)
    return summary

if __name__=='__main__':
    if len(sys.argv)!=4: raise SystemExit('usage: import_sb_txt.py SOURCE OUTDIR CANTO')
    print(json.dumps(import_book(sys.argv[1],sys.argv[2],int(sys.argv[3])),indent=2))
