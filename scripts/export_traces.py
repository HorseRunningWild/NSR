"""Export the same recorded Nations activations used by prototype_visualize.py.

Run from this checkout: python scripts/export_traces.py /path/to/NSR_Visualize
Only load artifacts you trust; the research input is a Python pickle.
"""
import hashlib
import json
import pickle
import sys
from pathlib import Path
import numpy as np

source = Path(sys.argv[1])
raw = source / 'artifacts/trajectories.pkl'
traj = pickle.loads(raw.read_bytes())
maps = json.loads((source / 'artifacts/id_maps.json').read_text())
entities = [k.removeprefix('E_') for k, v in sorted(maps['ent2id'].items(), key=lambda x: x[1])]
relations = [k.removeprefix('R_') for k, v in sorted(maps['rel2id'].items(), key=lambda x: x[1])]
m = len(relations)

def clean(item):
    e = np.asarray(item['erz_steps'][-1]['X_E'])
    return int(e.argmax()) == item['query']['t'] and sum(e >= e.max() - 1e-12) == 1 and e.max() > .001

def margin(item):
    e = np.asarray(item['erz_steps'][-1]['X_E'])
    return float(e[item['query']['t']] - np.delete(e, item['query']['t']).max())

candidates = sorted([i for i in traj['items'] if clean(i) and i['r2'] == i['query']['r1'] + m], key=margin, reverse=True)
selected = []
for item in candidates:
    if not any(i['query']['h'] == item['query']['h'] for i in selected):
        selected.append(item)
    if len(selected) == 3:
        break

items = []
for item in selected:
    q = {k: int(v) for k,v in item['query'].items()}
    r2 = int(item['r2'])
    bases = {q['r1'] % m, r2 % m}
    for code in np.argsort(-np.asarray(item['erz_steps'][1]['X_R'])):
        if len(bases) == 12: break
        bases.add(int(code) % m)
    columns = sorted(bases) + [i + m for i in sorted(bases)]
    steps = [{k: np.asarray(s[k]).round(7).tolist() for k in ['X_E','X_R','X_Z']} for s in item['erz_steps']]
    items.append({'query':q,'r2':r2,'columns':columns,'steps':steps})

out = {'provenance': {'dataset':'Nations','source':'NSR_Dynamic/NSR_Visualize/artifacts/trajectories.pkl','sha256':hashlib.sha256(raw.read_bytes()).hexdigest(),'description':'Recorded E/R/Z activations, 5 discrete dynamics steps. Three illustrative traces selected for a unique correct top-1 unfiltered entity readout and an inverse-relation candidate, ordered by readout margin. These examples are not aggregate evaluation results. All entity/relation activations are included; the display uses 24 of 110 Z columns. Connecting curves illustrate the selected pathway; they are not a complete weight matrix. No C-layer activations are present in these traces.','precision':7},'entities':entities,'relations':relations,'items':items}
dest = Path(__file__).resolve().parents[1] / 'data/traces.json'
dest.write_text(json.dumps(out,separators=(',',':')))
print(f'Exported {len(items)} recorded queries to {dest}')
for i in items:
    q=i['query'];print(entities[q['h']], relations[q['r1']], entities[q['t']])
