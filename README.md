# Beyond the Pitch — Women's Football Data Visualization

> *From Banned to Global — The Data Story of Women's International Football 1956–2025*

EPFL COM-480 · Data Visualization · Spring 2025  
Team DVP: Imane Oujja · Shyamala Vasireddy · Rim Abkari

---

## Live Demo

Open `index.html` directly in a browser — **no local server required**.  
All data is bundled in `data/bundle.js`. Works fully offline.

## Technical Setup

```bash
# Option 1 — Just open the file
open index.html   # macOS
start index.html  # Windows

# Option 2 — Local server (recommended for development)
python3 -m http.server 8080
# then open http://localhost:8080
```

**Requirements:** A modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).  
No Node.js, no npm, no build step.

## Project Structure

```
├── index.html              # Main single-page application
├── css/
│   └── style.css           # 1,200+ line design system
├── js/
│   ├── charts.js           # All 11 D3.js visualizations
│   ├── crossfilter.js      # Cross-chart filter (map → scatter/race)
│   ├── interactions.js     # Scroll, cursor, loader, nav
│   ├── background.js       # Canvas particle background
│   └── mapfix.js           # Extended country name aliases (150+)
├── data/
│   ├── bundle.js           # All datasets inlined (64KB)
│   └── processed/          # Source JSON files
│       ├── data.json        # Main dataset (teams, scorers, WC, timeline)
│       ├── race_data.json   # Cumulative wins per team per year
│       ├── chord_data.json  # Head-to-head matrix (top 10)
│       └── stream_data.json # Regional wins per year
├── img_marta.jpg           # Marta photo
├── img_prinz.webp          # Birgit Prinz photo
├── img_wambach.jpg         # Abby Wambach photo
├── img_salma.webp          # Salma Paralluelo photo
├── process_book.pdf        # Full process documentation
└── README.md               # This file
```

## Data Source

**Women's International Football Results** — Kaggle  
11,177 matches · 238 nations · 1956–2025  
Supplemented with FIFA World Cup prize money and attendance data.

## Visualizations

| Chapter | Chart Type | Key Insight |
|---------|-----------|-------------|
| 01 | Annotated area chart | Nations growth with historical events |
| 02 | Bar chart race (animated) | USA rise, Germany dominance |
| 03 | Animated choropleth map | World expansion post-1991 |
| 04 | D3 chord/ribbon diagram | Top 10 rivalry matrix |
| 05 | Streamgraph | Continental power shift |
| 06 | Dual bar chart | Men vs women prize money gap |
| 07 | Force bubble chart | Top scorers by goals |
| 08 | Radial clock | Goal timing patterns |
| 09 | Scatter plot | Win rate vs experience |
| 10 | Radar chart | Head-to-head comparison |

## Interactive Features

- **Cross-filtering**: Click any nation on the world map → highlights matching team in scatter plot and race chart
- **Bar chart race**: Play/pause/speed controls, animated 1956→2025
- **World map**: Year slider + play animation, hover for nation stats
- **Head-to-head explorer**: Select any two nations for radar comparison
- **Story guide chatbot**: 8 pre-scripted data stories accessible via floating button

## Process Book

See `process_book.pdf` for full documentation of design decisions, data cleaning pipeline, iterations, and team contributions.
