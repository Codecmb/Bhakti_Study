#!/usr/bin/env python3
"""Bhakti Study EPUB adapter.
Normalizes EPUB package/spine/XHTML into stable JSON without course-specific logic.
Usage: python import_epub.py book.epub output_dir [canonical_id]
"""
from pathlib import Path
import json, zipfile, sys, re
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup

def txt(node): return node.get_text("\\n", strip=True) if node else ""
def norm_id(s):
    return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')

def import_epub(epub_path, out_dir, canonical_id=None):
    epub_path=Path(epub_path); out_dir=Path(out_dir); out_dir.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(epub_path) as z:
        c=ET.fromstring(z.read('META-INF/container.xml'))
        opf_path=c.find('.//{*}rootfile').attrib['full-path']
        opf=ET.fromstring(z.read(opf_path)); base=Path(opf_path).parent
        def dc(tag):
            e=opf.find(f'.//{{http://purl.org/dc/elements/1.1/}}{tag}')
            return (e.text or '').strip() if e is not None else ''
        manifest={e.attrib['id']:e.attrib for e in opf.findall('.//{*}manifest/{*}item')}
        spine=[e.attrib['idref'] for e in opf.findall('.//{*}spine/{*}itemref')]
        bid=canonical_id or norm_id(dc('title'))
        book={'schema':'bhakti-study.book.v1','id':bid,'title':dc('title'),'creator':dc('creator'),'publisher':dc('publisher'),'language':dc('language'),'source_format':'EPUB','source_file':epub_path.name,'sections':[]}
        for idref in spine:
            item=manifest.get(idref,{}); href=item.get('href','')
            if not href.lower().endswith(('.xhtml','.html','.htm')): continue
            path=(base/Path(href)).as_posix()
            soup=BeautifulSoup(z.read(path),'xml')
            verses=[]
            for sec in soup.select('section.verse-page'):
                ref=txt(sec.select_one('.verse-heading'))
                if not ref: continue
                blocks=sec.select('.sanskrit-verse blockquote.verse')
                verses.append({'id':f'{bid}.{ref}','reference':ref,'devanagari':txt(blocks[0]) if len(blocks)>1 else '', 'transliteration':txt(blocks[-1]) if blocks else '', 'synonyms':txt(sec.select_one('.synonyms-section p')),'translation':txt(sec.select_one('.translation-section .translation-body, .translation-section p')),'purport':txt(sec.select_one('.purport-section'))})
            heading=txt(soup.select_one('.chapter-heading')) or txt(soup.title) or href
            if verses:
                # Preserve publisher reading order, but distinguish numbered study units from front/back matter.
                refs=[v['reference'] for v in verses]
                numbered=any(re.search(r'(?i)(?:adi|madhya|antya)\.\d+\.\d+|\d+\.\d+\.\d+|^\d+$', r) for r in refs)
                kind='study-section' if numbered else 'front-back-matter'
                book['sections'].append({'id':norm_id(heading), 'kind':kind, 'title':heading,'source_href':href,'verses':verses})
        (out_dir/'book.json').write_text(json.dumps(book,ensure_ascii=False,indent=2),encoding='utf-8')
        summary={'id':bid,'title':book['title'],'creator':book['creator'],'publisher':book['publisher'],'sections':len(book['sections']),'verses':sum(len(s['verses']) for s in book['sections']),'source_format':'EPUB'}
        (out_dir/'import-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
        return summary
if __name__=='__main__':
    if len(sys.argv)<3: raise SystemExit('Usage: import_epub.py book.epub output_dir [canonical_id]')
    print(json.dumps(import_epub(sys.argv[1],sys.argv[2],sys.argv[3] if len(sys.argv)>3 else None),ensure_ascii=False,indent=2))
