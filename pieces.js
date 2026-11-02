/**
 * High-definition Vector SVG Chess Pieces
 * Completely standalone, responsive, and retina-ready.
 */

const PIECE_SVGS = {
  // WHITE PIECES
  P: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
          style="fill:#ffffff; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;"/>
  </svg>`,

  N: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 16,27 13,24 8,24 5.5,21 6.5,14 7.5,10 14,8 16,11 17,9 18.5,8 20,8 c 1.5,0 2,1 2,2 z"
          style="fill:#ffffff; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;"/>
    <path d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.04,-0.94 -1.41,-3.04 0,-3 1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.898,1.9 2,3.5 0.77,-1.5 2,-2.5 3,-2.5 1,0 2.55,1 2.55,2.5 0.5,-1 2.45,-1.5 4.45,-0.5 z"
          style="fill:#ffffff; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;"/>
    <circle cx="9.5" cy="15.5" r="1.25" style="fill:#1e293b; stroke:#1e293b; stroke-width:0.5;"/>
  </svg>`,

  B: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:none; fill-rule:evenodd; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <g style="fill:#ffffff; stroke:#1e293b; stroke-width:1.5;">
        <path d="M 9,36 C 12.39,35 14.19,34.23 16.5,33.5 C 19.65,32.5 21,32 22.5,32 C 24,32 25.35,32.5 28.5,33.5 C 30.81,34.23 32.61,35 36,36 C 36,36 37.65,36.5 39,38 C 38.32,38.97 37.35,39.5 36,39.5 C 33,39.5 31.65,39 28.5,38 C 25.35,37 24,36.5 22.5,36.5 C 21,36.5 19.65,37 16.5,38 C 13.35,39 12,39.5 9,39.5 C 7.65,39.5 6.68,38.97 6,38 C 7.35,36.5 9,36 9,36 z"/>
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
        <circle cx="22.5" cy="8" r="1.8"/>
      </g>
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="stroke:#1e293b; stroke-width:1.3;"/>
    </g>
  </svg>`,

  R: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:#ffffff; fill-rule:evenodd; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
      <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17" />
      <path d="M 14,16.5 L 31,16.5 M 11,14 L 34,14 M 14,29.5 L 31,29.5 M 12,32 L 33,32" style="stroke:#1e293b; stroke-width:1.2; fill:none;"/>
    </g>
  </svg>`,

  Q: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:#ffffff; fill-rule:evenodd; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 L 9,26 z"/>
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z"/>
      <circle cx="6" cy="12" r="1.7"/>
      <circle cx="14" cy="9" r="1.7"/>
      <circle cx="22.5" cy="8" r="1.7"/>
      <circle cx="31" cy="9" r="1.7"/>
      <circle cx="39" cy="12" r="1.7"/>
    </g>
  </svg>`,

  K: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:none; fill-rule:evenodd; stroke:#1e293b; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" style="stroke:#1e293b; stroke-width:1.5;"/>
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" style="fill:#ffffff; stroke:#1e293b; stroke-width:1.5;"/>
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,33 38,27.5 36.5,22 C 34,18 29,17.5 22.5,24.5 C 16,17.5 11,18 8.5,22 C 7,27.5 8.5,33 11.5,37 z" style="fill:#ffffff; stroke:#1e293b; stroke-width:1.5;"/>
      <path d="M 11.5,30 C 17,27 28,27 33.5,30 M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5 M 11.5,37 C 17,34 28,34 33.5,37" style="stroke:#1e293b; stroke-width:1.2;"/>
    </g>
  </svg>`,

  // BLACK PIECES
  p: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
          style="fill:#1e293b; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;"/>
    <path d="M 14,36 C 20,34 25,34 31,36" style="fill:none; stroke:#94a3b8; stroke-width:1;"/>
  </svg>`,

  n: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <path d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 16,27 13,24 8,24 5.5,21 6.5,14 7.5,10 14,8 16,11 17,9 18.5,8 20,8 c 1.5,0 2,1 2,2 z"
          style="fill:#1e293b; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;"/>
    <path d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.04,-0.94 -1.41,-3.04 0,-3 1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.898,1.9 2,3.5 0.77,-1.5 2,-2.5 3,-2.5 1,0 2.55,1 2.55,2.5 0.5,-1 2.45,-1.5 4.45,-0.5 z"
          style="fill:#1e293b; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;"/>
    <circle cx="9.5" cy="15.5" r="1.25" style="fill:#f8fafc; stroke:#f8fafc; stroke-width:0.5;"/>
    <path d="M 15,35 C 22,33 28,33 35,35" style="fill:none; stroke:#94a3b8; stroke-width:1;"/>
  </svg>`,

  b: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:none; fill-rule:evenodd; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <g style="fill:#1e293b; stroke:#0f172a; stroke-width:1.5;">
        <path d="M 9,36 C 12.39,35 14.19,34.23 16.5,33.5 C 19.65,32.5 21,32 22.5,32 C 24,32 25.35,32.5 28.5,33.5 C 30.81,34.23 32.61,35 36,36 C 36,36 37.65,36.5 39,38 C 38.32,38.97 37.35,39.5 36,39.5 C 33,39.5 31.65,39 28.5,38 C 25.35,37 24,36.5 22.5,36.5 C 21,36.5 19.65,37 16.5,38 C 13.35,39 12,39.5 9,39.5 C 7.65,39.5 6.68,38.97 6,38 C 7.35,36.5 9,36 9,36 z"/>
        <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"/>
        <circle cx="22.5" cy="8" r="1.8"/>
      </g>
      <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="stroke:#94a3b8; stroke-width:1.2;"/>
    </g>
  </svg>`,

  r: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:#1e293b; fill-rule:evenodd; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
      <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
      <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
      <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
      <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17" />
      <path d="M 14,16.5 L 31,16.5 M 11,14 L 34,14 M 14,29.5 L 31,29.5 M 12,32 L 33,32" style="stroke:#94a3b8; stroke-width:1; fill:none;"/>
    </g>
  </svg>`,

  q: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:#1e293b; fill-rule:evenodd; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 L 9,26 z"/>
      <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 36,37.5 34.5,36 C 34.5,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 L 9,26 z"/>
      <circle cx="6" cy="12" r="1.7"/>
      <circle cx="14" cy="9" r="1.7"/>
      <circle cx="22.5" cy="8" r="1.7"/>
      <circle cx="31" cy="9" r="1.7"/>
      <circle cx="39" cy="12" r="1.7"/>
      <path d="M 12,36 C 18,34.5 27,34.5 33,36" style="fill:none; stroke:#94a3b8; stroke-width:1;"/>
    </g>
  </svg>`,

  k: `<svg viewBox="0 0 45 45" class="chess-piece-svg">
    <g style="fill:none; fill-rule:evenodd; stroke:#0f172a; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round;">
      <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" style="stroke:#0f172a; stroke-width:1.5;"/>
      <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" style="fill:#1e293b; stroke:#0f172a; stroke-width:1.5;"/>
      <path d="M 11.5,37 C 17,40.5 28,40.5 33.5,37 C 36.5,33 38,27.5 36.5,22 C 34,18 29,17.5 22.5,24.5 C 16,17.5 11,18 8.5,22 C 7,27.5 8.5,33 11.5,37 z" style="fill:#1e293b; stroke:#0f172a; stroke-width:1.5;"/>
      <path d="M 11.5,30 C 17,27 28,27 33.5,30 M 11.5,33.5 C 17,30.5 28,30.5 33.5,33.5 M 11.5,37 C 17,34 28,34 33.5,37" style="stroke:#94a3b8; stroke-width:1.2;"/>
    </g>
  </svg>`
};
