#!/usr/bin/env python3
"""Generic Sandarbha source adapter.

Never silently renumbers a source. It extracts source-local anuccheda/text labels,
records duplicates/gaps/order anomalies, and emits records that can later be mapped
to stable academy canonical IDs through an edition-specific alias map.
"""
import argparse, json, re
from pathlib import Path

HEADING_PATTERNS = [
    re.compile(r'^\s*Anuccheda\s+(\d+)\b', re.I),
    re.compile(r'^\s*TEXT\s+(\d+)(?:[.](\d+))?\b', re.I),
]

def parse(text):
    lines=text.splitlines(); hits=[]
    for i,line in enumerate(lines):
        for kind,rx in enumerate(HEADING_PATTERNS):
            m=rx.match(line)
            if m:
                label=m.group(0).strip(); n=int(m.group(1)); sub=int(m.group(2)) if m.lastindex and m.lastindex>1 and m.group(2) else None
                hits.append({'line':i,'number':n,'sub':sub,'sourceLabel':label,'headingType':'anuccheda' if kind==0 else 'text'})
                break
    records=[]
    for j,h in enumerate(hits):
        end=hits[j+1]['line'] if j+1<len(hits) else len(lines)
        records.append({k:v for k,v in h.items() if k!='line'} | {'sourceStartLine':h['line']+1,'content':'\\n'.join(lines[h['line']+1:end]).strip()})
    nums=[h['number'] for h in hits]
    seen=set(); dup=[]
    for n in nums:
        if n in seen and n not in dup: dup.append(n)
        seen.add(n)
    backwards=[{'from':nums[i-1],'to':nums[i]} for i in range(1,len(nums)) if nums[i]<nums[i-1]]
    return records, {'headings':len(hits),'min':min(nums) if nums else None,'max':max(nums) if nums else None,'duplicates':dup,'backwardJumps':backwards,'requiresReview':bool(dup or backwards or not hits)}

def parse_sequential_text(text, expected_count):
    """Parse editions whose top-level anucchedas are headed TEXT N/TEXT N.1.

    Accept only the next expected integer. This deliberately ignores incidental
    cross-references such as \"TEXT 9)\" inside commentary and preserves all
    subordinate TEXT N.x material inside its parent anuccheda.
    """
    lines=text.splitlines(); hits=[]; expected=1
    rx=re.compile(r'^\s*TEXT\s+(\d+)(?:\.1)?\.?\s*$', re.I)
    for i,line in enumerate(lines):
        m=rx.match(line)
        if m and int(m.group(1)) == expected:
            hits.append({'line':i,'number':expected,'sourceLabel':line.strip(),'headingType':'text'})
            expected += 1
            if expected > expected_count: break
    records=[]
    for j,h in enumerate(hits):
        end=hits[j+1]['line'] if j+1<len(hits) else len(lines)
        n=h['number']
        records.append({
            'canonicalId': None,
            'sourceLocalNumber': n,
            'sourceLabel': h['sourceLabel'],
            'sourceStartLine': h['line']+1,
            'content':'\\n'.join(lines[h['line']+1:end]).strip()
        })
    found=[h['number'] for h in hits]
    missing=[n for n in range(1,expected_count+1) if n not in found]
    validation={'mode':'sequential-text','expected':expected_count,'found':len(found),'min':min(found) if found else None,'max':max(found) if found else None,'missing':missing,'requiresReview':bool(missing or len(found)!=expected_count)}
    return records, validation

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('source'); ap.add_argument('--work',required=True); ap.add_argument('--prefix',required=True); ap.add_argument('--source-id',required=True); ap.add_argument('--out',required=True); ap.add_argument('--sequential-text',type=int,default=None)
    a=ap.parse_args(); text=Path(a.source).read_text(errors='replace'); records,validation=(parse_sequential_text(text,a.sequential_text) if a.sequential_text else parse(text))
    if a.sequential_text and not validation['requiresReview']:
        for r in records: r['canonicalId']=f"{a.prefix}.{r['sourceLocalNumber']}"
    out={'schema':'bhakti-study.sandarbha-source.v1','workId':a.work,'canonicalPrefix':a.prefix,'sourceId':a.source_id,'mappingStatus':'validated-canonical-map' if a.sequential_text and not validation['requiresReview'] else 'pending-reviewed-alias-map','validation':validation,'records':records}
    Path(a.out).write_text(json.dumps(out,ensure_ascii=False,indent=2))
    print(json.dumps(validation,indent=2))
if __name__=='__main__': main()
