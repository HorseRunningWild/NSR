# Neural Structural Reasoner — Project & Blog

Two complementary research pages for **Neural Structural Reasoner: A Brain-inspired Architecture for Reasoning over Structured Knowledge**, NeurIPS 2026.

- Academic Project: https://horserunningwild.github.io/NSR/project/
- Interactive Blog: https://horserunningwild.github.io/NSR/
- Paper: https://arxiv.org/abs/2609.36620
- Research code: https://github.com/navbrainlab/Neural-Structural-Reasoner-NSR

## Local preview

No build step or package installation is needed:

```sh
python -m http.server 8765
```

Open http://localhost:8765. Use an HTTP server rather than opening `index.html` as a file, because the reasoning demo fetches a local JSON file.

## Two versions

The **Project** (`project/index.html`) is the academic reading: full paper title and authors, collapsible affiliations, abstract, method overview, interactive triple encoding, paper figures, experimental comparisons and full tables, presentation, and citation. It uses a restrained blue-gray design and a section index (a sticky margin index on wide screens). Figures can be enlarged without leaving the page.

The **Blog** (`index.html`) retains the original animated, exploratory narrative and recorded neural replay. Both versions link to each other and share `encoding.js`, `encoding.css`, and `benchmarks.js` so encoding mechanics and benchmark values stay consistent.

## What is interactive (Blog)

- A brief neural-wiring introduction and a draggable, animated four-population illustration.
- A slider that illustrates explicit graph topology versus numerical representations.
- Keyboard-accessible E/Z/R/C tabs explaining the architecture and its biological inspirations. Population colors are consistent across the anatomy key, architecture, hero and replay: E/HPC blue, Z/EC orange, R/ATL green, C/PFC purple.
- An editable triple-to-circuit illustration in the architecture section: preset or custom facts, one-time automatic reveal, pause/replay/reset, four directly selectable stages, and keyboard/touch neuron inspection. Fixed E–Z connections are visible from the start; fact-specific R–Z and bidirectional Z–Z weights are assigned to 1. Self-loops share an entity neuron.
- A five-step replay of **recorded model activations** from Nations, with three queries, playback, scrubbing, neuron inspection and entity readouts.
- An accuracy–training-time scatter plot, dataset and accuracy-metric switches, selectable pairwise comparisons, and a complete accessible data table. The default YAGO3-10 / ConvE comparison shows 18 minutes versus 10.3 hours; ratios always identify their numerator and denominator and reverse honestly when NSR takes longer.
- Author homepage links and collapsible affiliations; the author talk, downloadable slides, original prototype GIF and copyable BibTeX.

Decorative motion respects the system's reduced-motion preference and can be paused. Recorded replay runs only when requested. Off-screen decorative canvases pause; playback pauses when the tab is hidden. Fonts are hosted locally. There are no analytics, trackers, external scripts or runtime dependencies.

## Content and provenance

- Project abstract, mechanism, and implementation qualifications: revised named-author arXiv manuscript (2609.36620v1), especially §§3–4 and Appendix A.2.1. NSR timings refer to the accelerated static-graph implementation, not stepwise online neural simulation.
- Project overview (`project/overview.svg`): original vector schematic; selected neurons and edges, no measured activations or invented performance values. `assets/paper-reasoning.png` is the unchanged reasoning figure extracted from the supplied paper (Figure 2), whose Brazil / embassy / UK example is retained in the revised manuscript.
- Narrative and exact benchmark values: supplied `Neurips_Slides.pptx`, especially slides 8–9; the public arXiv paper; supplied explanatory article `NeurIPS'26.pdf`.
- Brain-region, composition and clustering figures: original images extracted from the supplied author slides, encoded as WebP for the web. The brain figure was minimally edited with built-in imagegen to remove the four detached left-margin arrows; anatomy, region colors, leader labels and description panels are retained. The edit prompt is recorded in `assets/brain-edit.txt`.
- Video: supplied `Neurips_Author_Talk_EN_1.1x_animated_burned.mp4`; the poster is a frame from that video. An additional 1280px VP9/Opus WebM version provides a fallback for browsers without H.264 support. Clickable chapter cues use the video’s embedded chapter times. English subtitles are burned into the video.
- Prototype animation: supplied `NSR_Dynamic/NSR_Visualize/figures/prototype/prototype_anim.gif`.
- Trace data: `NSR_Dynamic/NSR_Visualize/artifacts/trajectories.pkl`, the same source as `prototype_visualize.py`. The JSON includes a SHA-256 digest of the source artifact and the selection criteria. All E/R/Z values are retained, rounded to seven decimal places; 24 of the 110 Z columns are displayed. Three inverse-relation examples with a unique correct top-1 unfiltered readout were selected for explanation, **not** to represent aggregate accuracy. The diagram uses one shared affine projection for parallel planes. Straight inter-population connections and curved intra-population connections illustrate the selected pathway and are not a complete weight matrix. There are no C-population activations in this recorded dataset.
- Triple encoding: paper §3.1.1 / Eq. 1 and §3.2 / Eq. 3, cross-checked against the supplied `NSR_Dynamic/NSR/NSR_Dynamic.py` (`__init__`, `z_idx`, `encode_triples`). The demo is a small schematic slice with other entities and a second relation as context. Its role highlights and edge-drawing order are an explanatory construction, not recorded training or activation data. R–Z connections are fact-encoded, not globally fixed; C and R–R weights remain unchanged by this demonstration.
- Hero motion, vector morph, and the father/grandfather rule are conceptual illustrations, not measured model outputs.
- Fonts: Newsreader and Inter, distributed under the SIL Open Font License; license files are in `assets/`.

To re-export trusted research artifacts (requires NumPy):

```sh
python scripts/export_traces.py /path/to/NSR_Dynamic/NSR_Visualize
```

## Maintenance and publishing

`index.html` contains the story, links and semantic controls; `style.css` the responsive design; `app.js` the Blog canvases and interactions; `benchmarks.js` the shared transcribed results and comparison controls; `project/` the academic page and its dedicated layout and controls; `data/traces.json` the measured activations; `encoding.js` and `encoding.css` the self-contained triple-encoding demonstration. Keep model outputs distinct from visual illustrations. Preserve metric units, reported-runtime qualifications and asterisks for quoted baseline values.

GitHub Pages serves the `main` branch at the repository root. `.nojekyll` keeps this a static site. Commit and push changes to `main` to publish. Asset URLs are relative so the site also works beneath a project subpath. Large media are loaded on demand.

The research assets remain attributable to their original authors. This repository is the presentation website; the linked research repository is the source of truth for the model implementation.
