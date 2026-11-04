Horizonte austral — local cartographic dependencies

Existing dependencies were inspected; no geographic projection engine was installed.
The approved globe needs spherical clipping at the horizon and date line. The exploratory
prototype approximated this and cannot safely serve as the production clipping algorithm.

Use only d3-geo 3.1.1 (36,329 bytes) and its required d3-array 3.2.4 (17,204 bytes).
Both are pinned and vendored locally with their ISC license files; no CDN requests run in
the browser. Total uncompressed JavaScript: 53,533 bytes. No complete D3 distribution,
map tiles, third-party API, API key or paid service is needed.

Existing assets/world-countries.js remains the single source of country outlines.
Its original 179 geometries and old flat-renderer branch are retained. The globe recovers
spherical coordinates from that same data; no replacement geographic dataset was added.

Primary references:
https://d3js.org/d3-geo/projection
https://d3js.org/d3-geo/azimuthal#geoOrthographic
https://cdn.jsdelivr.net/npm/d3-geo@3.1.1/dist/d3-geo.min.js
https://cdn.jsdelivr.net/npm/d3-array@3.2.4/dist/d3-array.min.js
