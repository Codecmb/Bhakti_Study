#!/usr/bin/env python3
import json,re,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
S=ROOT/'sandarbhas'
works={
'paramatma':('PAS','Paramātma Sandarbha',109,Path('/mnt/data/param_full.txt'),'Paramatma Total with Sanskrit.doc'),
'krsna':('KS','Kṛṣṇa Sandarbha',190,Path('/mnt/data/krsna_full.txt'),'Krsna Sandarbha.pdf'),
'bhakti':('BHS','Bhakti Sandarbha',340,Path('/mnt/data/bhakti_full.txt'),'Bhakti Sandarbha.pdf'),
'priti':('PS','Prīti Sandarbha',429,Path('/mnt/data/priti_full.txt'),'Priti sandarbha 2.doc'),
}
summary={}
for wid,(prefix,title,end,path,source_name) in works.items():
    text=path.read_text(errors='replace'); lines=text.splitlines(); occurrences={}
    for i,l in enumerate(lines,1):
        m=re.match(r'^\s*Anuccheda\s+(\d+)\b',l,re.I)
        if m:
            n=int(m.group(1)); occurrences.setdefault(n,[]).append(i)
    units=[]
    for n in range(1,end+1):
        locs=occurrences.get(n,[])
        units.append({'canonicalId':f'{prefix}.{n}','sourceLocalNumber':n,'sourceHeadingFound':bool(locs),'sourceHeadingLines':locs})
    missing=[n for n in range(1,end+1) if n not in occurrences]
    out={'schema':'bhakti-study.sandarbha-manifest.v2','workId':wid,'title':title,'canonicalPrefix':prefix,
         'sourceEdition':{'fileName':source_name,'topLevelRangeObserved':f'1–{end}','sha256OfExtractedText':hashlib.sha256(text.encode()).hexdigest()},
         'mappingPolicy':'Canonical IDs are stable academy identities. Source-local headings are evidence; absent extracted headings are never fabricated.',
         'canonicalRange':f'{prefix}.1–{prefix}.{end}','unitCount':end,'sourceHeadingCoverage':{'found':end-len(missing),'missing':missing},'units':units}
    (S/f'{wid}-manifest.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
    summary[wid]={'canonicalRange':out['canonicalRange'],'unitCount':end,'headingCoverage':end-len(missing),'missingExtractedHeadings':missing,'status':'validated-complete-sequence' if not missing else 'registered-with-source-heading-gaps'}
# preserve explicit modern-edition aliases as external crosswalk metadata only
cross={'schema':'bhakti-study.sandarbha-edition-crosswalk.v1','policy':'Never renumber source editions silently. External edition structures are aliases/crosswalks only.',
       'notes':{'paramatma':'This source has top-level Anuccheda headings through 109. A literal Text 110 occurs inside Anuccheda 105 and is not promoted to a top-level unit.',
                'krsna':'This source contains a complete top-level sequence 1–190.',
                'bhakti':'Source reaches 340; extracted heading gaps are retained as validation metadata.',
                'priti':'Source reaches 429; many extracted heading gaps are retained as validation metadata.'}}
(S/'edition-crosswalk.json').write_text(json.dumps(cross,ensure_ascii=False,indent=2))
(S/'final-validation.json').write_text(json.dumps({'works':summary},ensure_ascii=False,indent=2))
print(json.dumps(summary,ensure_ascii=False,indent=2))
