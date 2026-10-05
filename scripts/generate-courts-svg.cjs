const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'images', 'courts');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 10 distinct professional color themes for badminton courts
const THEMES = [
  {
    name: 'Enlio Emerald Green',
    courtBg: '#0f5132',
    courtInner: '#198754',
    borderBg: '#083320',
    lines: '#ffffff',
    glow: '#34d399',
    accent: '#10b981',
    shuttleCork: '#ffffff',
    accentText: 'CHAMPIONSHIP MAT',
  },
  {
    name: 'Yonex French Open Blue',
    courtBg: '#1e3a8a',
    courtInner: '#2563eb',
    borderBg: '#0f172a',
    lines: '#ffffff',
    glow: '#60a5fa',
    accent: '#38bdf8',
    shuttleCork: '#fbbf24',
    accentText: 'PRO TOUR COURT',
  },
  {
    name: 'All England Royal Sapphire',
    courtBg: '#1e293b',
    courtInner: '#0284c7',
    borderBg: '#0f172a',
    lines: '#f8fafc',
    glow: '#38bdf8',
    accent: '#0ea5e9',
    shuttleCork: '#ffffff',
    accentText: 'ALL ENGLAND EDITION',
  },
  {
    name: 'World Championship Terracotta',
    courtBg: '#991b1b',
    courtInner: '#dc2626',
    borderBg: '#450a0a',
    lines: '#ffffff',
    glow: '#f87171',
    accent: '#fbbf24',
    shuttleCork: '#ffffff',
    accentText: 'WORLD TOUR ARENA',
  },
  {
    name: 'Olympic Purple Velvet',
    courtBg: '#4c1d95',
    courtInner: '#6d28d9',
    borderBg: '#2e1065',
    lines: '#ffffff',
    glow: '#c084fc',
    accent: '#e879f9',
    shuttleCork: '#ffffff',
    accentText: 'OLYMPIC ARENA',
  },
  {
    name: 'Premium Maple Hardwood',
    courtBg: '#78350f',
    courtInner: '#b45309',
    borderBg: '#451a03',
    lines: '#fef3c7',
    glow: '#fde68a',
    accent: '#f59e0b',
    shuttleCork: '#ffffff',
    accentText: 'PARQUET TIMBER',
  },
  {
    name: 'Modern Carbon Graphite',
    courtBg: '#18181b',
    courtInner: '#27272a',
    borderBg: '#09090b',
    lines: '#10b981',
    glow: '#34d399',
    accent: '#10b981',
    shuttleCork: '#ffffff',
    accentText: 'NIGHT PRO ARENA',
  },
  {
    name: 'BWF Classic Mint Jade',
    courtBg: '#064e3b',
    courtInner: '#047857',
    borderBg: '#022c22',
    lines: '#fef08a',
    glow: '#6ee7b7',
    accent: '#facc15',
    shuttleCork: '#ffffff',
    accentText: 'BWF CERTIFIED MAT',
  },
  {
    name: 'Pacific Azure Marine',
    courtBg: '#0e7490',
    courtInner: '#0891b2',
    borderBg: '#155e75',
    lines: '#ffffff',
    glow: '#67e8f9',
    accent: '#22d3ee',
    shuttleCork: '#ffffff',
    accentText: 'PREMIUM INDOOR CLUB',
  },
  {
    name: 'Crimson Elite Court',
    courtBg: '#831843',
    courtInner: '#be185d',
    borderBg: '#500724',
    lines: '#ffffff',
    glow: '#f472b6',
    accent: '#fb7185',
    shuttleCork: '#ffffff',
    accentText: 'ELITE SMASH CENTER',
  },
];

// 5 varied camera perspectives
const PERSPECTIVES = ['3d-center', 'isometric', 'top-down', 'net-action', 'wide-stadium'];

function generateCourtSvg(index, theme, perspective) {
  const courtNum = String(index).padStart(2, '0');
  const venueId = `venue-${index}`;

  if (perspective === '3d-center') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="hallGrad-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a0e17" />
      <stop offset="40%" stop-color="${theme.borderBg}" />
      <stop offset="100%" stop-color="#05080e" />
    </linearGradient>
    <radialGradient id="lightGlow-${index}" cx="50%" cy="45%" r="60%">
      <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.35" />
      <stop offset="50%" stop-color="${theme.glow}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="matGrad-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.courtBg}" />
      <stop offset="100%" stop-color="${theme.courtInner}" />
    </linearGradient>
    <linearGradient id="netTapeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#cbd5e1" />
    </linearGradient>
  </defs>

  <!-- Hall background & ambient floor -->
  <rect width="800" height="450" fill="url(#hallGrad-${index})" />
  <rect width="800" height="450" fill="url(#lightGlow-${index})" />

  <!-- Overhead Truss & Spotlights -->
  <g opacity="0.3" stroke="#94a3b8" stroke-width="1.5">
    <line x1="80" y1="20" x2="720" y2="20" />
    <line x1="120" y1="40" x2="680" y2="40" />
    <line x1="80" y1="20" x2="120" y2="40" />
    <line x1="200" y1="20" x2="220" y2="40" />
    <line x1="400" y1="20" x2="400" y2="40" />
    <line x1="600" y1="20" x2="580" y2="40" />
    <line x1="720" y1="20" x2="680" y2="40" />
  </g>
  <!-- Spotlights beam cones -->
  <polygon points="180,25 240,160 320,160" fill="${theme.glow}" opacity="0.06" />
  <polygon points="620,25 480,160 560,160" fill="${theme.glow}" opacity="0.06" />

  <!-- Surrounding Court Buffer Zone (Darker Mat) -->
  <polygon points="140,150 660,150 750,430 50,430" fill="${theme.borderBg}" stroke="#1e293b" stroke-width="2" />

  <!-- Main Playing Court (Perspective Polygon) -->
  <polygon points="200,165 600,165 680,410 120,410" fill="url(#matGrad-${index})" stroke="${theme.lines}" stroke-width="2.5" />

  <!-- Inner Singles Sidelines -->
  <line x1="230" y1="165" x2="160" y2="410" stroke="${theme.lines}" stroke-width="2" stroke-opacity="0.9" />
  <line x1="570" y1="165" x2="640" y2="410" stroke="${theme.lines}" stroke-width="2" stroke-opacity="0.9" />

  <!-- Service Boundaries & Center Lines -->
  <!-- Far court back service line -->
  <line x1="208" y1="180" x2="592" y2="180" stroke="${theme.lines}" stroke-width="1.8" />
  <!-- Far court short service line -->
  <line x1="235" y1="230" x2="565" y2="230" stroke="${theme.lines}" stroke-width="2" />
  <!-- Center line far -->
  <line x1="400" y1="165" x2="400" y2="230" stroke="${theme.lines}" stroke-width="1.8" />

  <!-- Near court short service line -->
  <line x1="175" y1="310" x2="625" y2="310" stroke="${theme.lines}" stroke-width="2" />
  <!-- Near court back doubles service line -->
  <line x1="135" y1="385" x2="665" y2="385" stroke="${theme.lines}" stroke-width="1.8" />
  <!-- Center line near -->
  <line x1="400" y1="310" x2="400" y2="410" stroke="${theme.lines}" stroke-width="2" />

  <!-- Net System (Center of Court) -->
  <g>
    <!-- Left Net Post -->
    <rect x="180" y="235" width="6" height="42" fill="#475569" rx="2" />
    <!-- Right Net Post -->
    <rect x="614" y="235" width="6" height="42" fill="#475569" rx="2" />
    <!-- Net Mesh Shadow -->
    <polygon points="186,252 614,252 614,282 186,282" fill="#000000" opacity="0.35" />
    <!-- Net Mesh pattern simulation -->
    <polygon points="186,242 614,242 614,272 186,272" fill="#1e293b" opacity="0.6" stroke="#475569" stroke-width="0.75" />
    <!-- White Top Cord Tape -->
    <polygon points="180,240 620,240 620,245 180,245" fill="url(#netTapeGrad)" stroke="#94a3b8" stroke-width="0.5" />
    <!-- Center strap -->
    <rect x="398" y="242" width="4" height="30" fill="#ffffff" opacity="0.8" />
  </g>

  <!-- Shuttlecock resting on near court -->
  <g transform="translate(460, 340) rotate(-25) scale(0.9)">
    <ellipse cx="0" cy="12" rx="14" ry="4" fill="#000000" opacity="0.35" />
    <!-- Feathers -->
    <polygon points="-12,-8 12,-8 6,8 -6,8" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.75" />
    <line x1="-8" y1="-8" x2="-3" y2="8" stroke="#94a3b8" stroke-width="0.6" />
    <line x1="0" y1="-8" x2="0" y2="8" stroke="#94a3b8" stroke-width="0.6" />
    <line x1="8" y1="-8" x2="3" y2="8" stroke="#94a3b8" stroke-width="0.6" />
    <line x1="-10" y1="0" x2="10" y2="0" stroke="#0284c7" stroke-width="1.2" />
    <!-- Cork head -->
    <circle cx="0" cy="10" r="5.5" fill="${theme.shuttleCork}" stroke="#cbd5e1" stroke-width="0.5" />
  </g>

  <!-- Badminton Racket -->
  <g transform="translate(300, 365) rotate(48) scale(0.65)">
    <!-- Racket Head -->
    <ellipse cx="0" cy="0" rx="34" ry="46" fill="none" stroke="${theme.accent}" stroke-width="4.5" />
    <!-- String Grid -->
    <ellipse cx="0" cy="0" rx="32" ry="44" fill="${theme.glow}" fill-opacity="0.08" stroke="#ffffff" stroke-width="0.8" stroke-dasharray="2,2" />
    <!-- Shaft & Throat -->
    <line x1="0" y1="46" x2="0" y2="125" stroke="#94a3b8" stroke-width="4" />
    <!-- Grip / Handle -->
    <rect x="-4.5" y="125" width="9" height="50" fill="#f8fafc" stroke="#334155" stroke-width="1" rx="2" />
    <rect x="-5" y="172" width="10" height="6" fill="${theme.accent}" rx="1" />
  </g>

  <!-- Court Badge & Info Header -->
  <rect x="25" y="22" width="180" height="34" rx="6" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1" />
  <circle cx="44" cy="39" r="10" fill="${theme.accent}" />
  <text x="44" y="43" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#0f172a" text-anchor="middle">${courtNum}</text>
  <text x="62" y="36" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">SÂN SỐ ${courtNum}</text>
  <text x="62" y="48" font-family="Arial, sans-serif" font-size="9" fill="${theme.accent}">${theme.accentText}</text>

  <!-- Watermark badge right bottom -->
  <g transform="translate(640, 25)">
    <rect width="135" height="28" rx="5" fill="#0f172a" fill-opacity="0.75" stroke="#334155" stroke-width="1" />
    <text x="67" y="18" font-family="Arial, sans-serif" font-size="10" font-weight="600" fill="#94a3b8" text-anchor="middle">TIÊU CHUẨN BWF</text>
  </g>
</svg>`;
  }

  if (perspective === 'isometric') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="isoBg-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="60%" stop-color="${theme.borderBg}" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <radialGradient id="isoGlow-${index}" cx="45%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="matIso-${index}" x1="0%" y1="0%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="${theme.courtBg}" />
      <stop offset="100%" stop-color="${theme.courtInner}" />
    </linearGradient>
  </defs>

  <rect width="800" height="450" fill="url(#isoBg-${index})" />
  <rect width="800" height="450" fill="url(#isoGlow-${index})" />

  <!-- Stadium Hall Structure -->
  <g stroke="#334155" stroke-width="1" opacity="0.4">
    <line x1="50" y1="120" x2="400" y2="30" />
    <line x1="400" y1="30" x2="750" y2="120" />
    <line x1="400" y1="30" x2="400" y2="180" />
  </g>

  <!-- Isometric Court Floor -->
  <!-- Outer Floor Surround -->
  <polygon points="400,90 730,220 400,410 70,280" fill="${theme.borderBg}" stroke="#1e293b" stroke-width="3" />

  <!-- Main Playing Surface (Isometric Diamond) -->
  <polygon points="400,120 680,230 400,380 120,270" fill="url(#matIso-${index})" stroke="${theme.lines}" stroke-width="2.5" />

  <!-- Singles Sidelines -->
  <polygon points="400,135 650,230 400,365 150,270" fill="none" stroke="${theme.lines}" stroke-width="1.8" stroke-opacity="0.9" />

  <!-- Short Service Lines -->
  <line x1="330" y1="195" x2="470" y2="250" stroke="${theme.lines}" stroke-width="1.8" />
  <line x1="470" y1="250" x2="330" y2="305" stroke="${theme.lines}" stroke-width="1.8" />
  <line x1="330" y1="305" x2="190" y2="250" stroke="${theme.lines}" stroke-width="1.8" />
  <line x1="190" y1="250" x2="330" y2="195" stroke="${theme.lines}" stroke-width="1.8" />

  <!-- Center service line -->
  <line x1="400" y1="135" x2="400" y2="225" stroke="${theme.lines}" stroke-width="1.8" />
  <line x1="400" y1="275" x2="400" y2="365" stroke="${theme.lines}" stroke-width="1.8" />

  <!-- Isometric Net -->
  <g>
    <!-- Left net post -->
    <rect x="250" y="200" width="5" height="45" fill="#64748b" transform="skewY(18)" />
    <!-- Right net post -->
    <rect x="545" y="320" width="5" height="45" fill="#64748b" transform="skewY(18)" />
    <!-- Net Body (Isometric mesh) -->
    <polygon points="255,200 545,315 545,345 255,230" fill="#0f172a" fill-opacity="0.65" stroke="#94a3b8" stroke-width="0.8" />
    <!-- White Top tape -->
    <polygon points="255,198 547,314 547,202 255,198" stroke="#ffffff" stroke-width="2.5" />
  </g>

  <!-- Action Elements: High Flight Shuttlecock & Shadow -->
  <g>
    <!-- Floor Shadow -->
    <ellipse cx="460" cy="330" rx="14" ry="6" fill="#000000" opacity="0.4" />
    <!-- Flying Shuttlecock -->
    <g transform="translate(440, 240) rotate(-40) scale(1.1)">
      <polygon points="-12,-8 12,-8 6,8 -6,8" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="${theme.accent}" stroke-width="1.5" />
      <circle cx="0" cy="11" r="5.5" fill="${theme.shuttleCork}" stroke="#94a3b8" stroke-width="0.6" />
      <!-- Motion speed lines -->
      <line x1="-2" y1="-12" x2="-2" y2="-24" stroke="${theme.glow}" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.8" />
      <line x1="5" y1="-10" x2="10" y2="-22" stroke="${theme.glow}" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.8" />
    </g>
  </g>

  <!-- Court Identifier Cards -->
  <g transform="translate(30, 30)">
    <rect width="210" height="44" rx="8" fill="#0f172a" fill-opacity="0.85" stroke="#334155" stroke-width="1.5" />
    <circle cx="28" cy="22" r="14" fill="${theme.courtInner}" />
    <text x="28" y="27" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${courtNum}</text>
    <text x="52" y="19" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#f8fafc">SÂN ĐẤU TIÊU CHUẨN ${courtNum}</text>
    <text x="52" y="34" font-family="Arial, sans-serif" font-size="10" fill="${theme.accent}">${theme.name.toUpperCase()}</text>
  </g>
</svg>`;
  }

  if (perspective === 'top-down') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="topHall-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="topMat-${index}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.courtBg}" />
      <stop offset="50%" stop-color="${theme.courtInner}" />
      <stop offset="100%" stop-color="${theme.courtBg}" />
    </linearGradient>
  </defs>

  <!-- Surround Hall Floor -->
  <rect width="800" height="450" fill="url(#topHall-${index})" />

  <!-- Outer Safe Margin Zone -->
  <rect x="70" y="45" width="660" height="360" rx="8" fill="${theme.borderBg}" stroke="#334155" stroke-width="2" />

  <!-- Main Playing Court (BWF Official Dimension Proportions) -->
  <!-- 13.4m x 6.1m (approx ratio 2.2:1) -->
  <rect x="130" y="80" width="540" height="290" fill="url(#topMat-${index})" stroke="${theme.lines}" stroke-width="3" />

  <!-- Singles Sidelines (0.46m inside each side) -->
  <line x1="130" y1="104" x2="670" y2="104" stroke="${theme.lines}" stroke-width="2" />
  <line x1="130" y1="346" x2="670" y2="346" stroke="${theme.lines}" stroke-width="2" />

  <!-- Long Service Lines for Doubles (0.76m inside each baseline) -->
  <line x1="165" y1="80" x2="165" y2="370" stroke="${theme.lines}" stroke-width="2" />
  <line x1="635" y1="80" x2="635" y2="370" stroke="${theme.lines}" stroke-width="2" />

  <!-- Short Service Lines (1.98m from net) -->
  <line x1="315" y1="80" x2="315" y2="370" stroke="${theme.lines}" stroke-width="2.5" />
  <line x1="485" y1="80" x2="485" y2="370" stroke="${theme.lines}" stroke-width="2.5" />

  <!-- Center Service Lines -->
  <line x1="130" y1="225" x2="315" y2="225" stroke="${theme.lines}" stroke-width="2" />
  <line x1="485" y1="225" x2="670" y2="225" stroke="${theme.lines}" stroke-width="2" />

  <!-- Center Net Line & Posts -->
  <line x1="400" y1="68" x2="400" y2="382" stroke="#ffffff" stroke-width="4" />
  <circle cx="400" cy="74" r="5" fill="#f59e0b" stroke="#1e293b" stroke-width="1.5" />
  <circle cx="400" cy="376" r="5" fill="#f59e0b" stroke="#1e293b" stroke-width="1.5" />

  <!-- Umpire Chair at Net -->
  <g transform="translate(385, 388)">
    <rect width="30" height="18" rx="3" fill="#334155" stroke="#94a3b8" stroke-width="1" />
    <text x="15" y="13" font-family="Arial, sans-serif" font-size="8" fill="#f8fafc" text-anchor="middle" font-weight="bold">TRỌNG TÀI</text>
  </g>

  <!-- Big Court Number Watermark Center Court -->
  <text x="270" y="245" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" fill-opacity="0.12" text-anchor="middle">COURT</text>
  <text x="530" y="245" font-family="Arial, sans-serif" font-size="64" font-weight="900" fill="#ffffff" fill-opacity="0.12" text-anchor="middle">${courtNum}</text>

  <!-- Top bar header -->
  <g transform="translate(30, 15)">
    <text x="0" y="16" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff">SÂN ${courtNum} — ${theme.accentText}</text>
  </g>
</svg>`;
  }

  if (perspective === 'net-action') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="actHall-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="60%" stop-color="${theme.borderBg}" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>
    <radialGradient id="smashGlow-${index}" cx="55%" cy="35%" r="45%">
      <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.45" />
      <stop offset="70%" stop-color="${theme.glow}" stop-opacity="0.05" />
      <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="800" height="450" fill="url(#actHall-${index})" />
  <rect width="800" height="450" fill="url(#smashGlow-${index})" />

  <!-- Low Perspective Court Floor -->
  <polygon points="0,220 800,220 800,450 0,450" fill="${theme.courtInner}" />
  <polygon points="40,240 760,240 800,450 0,450" fill="${theme.courtBg}" stroke="${theme.lines}" stroke-width="2" />

  <!-- Court lines rushing to baseline -->
  <line x1="400" y1="240" x2="400" y2="450" stroke="${theme.lines}" stroke-width="3" />
  <line x1="200" y1="240" x2="80" y2="450" stroke="${theme.lines}" stroke-width="2.5" />
  <line x1="600" y1="240" x2="720" y2="450" stroke="${theme.lines}" stroke-width="2.5" />
  <line x1="120" y1="360" x2="680" y2="360" stroke="${theme.lines}" stroke-width="2.5" />

  <!-- Foreground Dramatic Badminton Net -->
  <g>
    <!-- Net Body Across Screen -->
    <rect x="0" y="160" width="800" height="85" fill="#0f172a" fill-opacity="0.5" />
    <!-- White Net Top Tape (High tension cord) -->
    <rect x="0" y="156" width="800" height="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
    <!-- Net mesh pattern lines -->
    <line x1="0" y1="180" x2="800" y2="180" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
    <line x1="0" y1="200" x2="800" y2="200" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
    <line x1="0" y1="220" x2="800" y2="220" stroke="#94a3b8" stroke-width="0.8" opacity="0.6" />
    <!-- Vertical mesh lines -->
    ${Array.from({ length: 25 }, (_, i) => `<line x1="${i * 34}" y1="168" x2="${i * 34}" y2="245" stroke="#94a3b8" stroke-width="0.6" opacity="0.4" />`).join('\n    ')}
    <!-- Center white cord strap -->
    <rect x="396" y="156" width="8" height="89" fill="#ffffff" stroke="#e2e8f0" stroke-width="1" />
  </g>

  <!-- Smash Shuttlecock in High Speed Mid-Air Action -->
  <g transform="translate(480, 110) rotate(-65) scale(1.4)">
    <polygon points="-12,-8 12,-8 6,8 -6,8" fill="#ffffff" stroke="#cbd5e1" stroke-width="0.8" />
    <line x1="-10" y1="0" x2="10" y2="0" stroke="#ef4444" stroke-width="1.5" />
    <circle cx="0" cy="11" r="5.5" fill="${theme.shuttleCork}" stroke="#94a3b8" stroke-width="0.6" />
    <!-- Smash Glow Sparkle -->
    <circle cx="0" cy="11" r="10" fill="${theme.glow}" fill-opacity="0.3" />
  </g>

  <!-- Speed motion streaks behind shuttlecock -->
  <line x1="620" y1="50" x2="520" y2="100" stroke="${theme.glow}" stroke-width="3" stroke-linecap="round" opacity="0.8" />
  <line x1="650" y1="40" x2="540" y2="90" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.9" />
  <line x1="630" y1="65" x2="510" y2="115" stroke="${theme.glow}" stroke-width="2" stroke-linecap="round" opacity="0.6" />

  <!-- Badge Top Left -->
  <g transform="translate(25, 25)">
    <rect width="190" height="40" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="1.5" />
    <circle cx="26" cy="20" r="12" fill="${theme.accent}" />
    <text x="26" y="24" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a" text-anchor="middle">${courtNum}</text>
    <text x="48" y="18" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">SÂN THI ĐẤU ${courtNum}</text>
    <text x="48" y="32" font-family="Arial, sans-serif" font-size="9" fill="${theme.accent}">TỐC ĐỘ &amp; CHÍNH XÁC</text>
  </g>
</svg>`;
  }

  // perspective === 'wide-stadium'
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="800" height="450">
  <defs>
    <linearGradient id="wideHall-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="${theme.borderBg}" />
    </linearGradient>
    <radialGradient id="arenaLight-${index}" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="${theme.glow}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="wideMat-${index}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.courtBg}" />
      <stop offset="100%" stop-color="${theme.courtInner}" />
    </linearGradient>
  </defs>

  <rect width="800" height="450" fill="url(#wideHall-${index})" />
  <rect width="800" height="450" fill="url(#arenaLight-${index})" />

  <!-- Stadium Audience Stands / Silhouettes in Distance -->
  <g opacity="0.25">
    <rect x="0" y="80" width="800" height="70" fill="#1e293b" />
    <line x1="0" y1="100" x2="800" y2="100" stroke="#334155" stroke-width="1" />
    <line x1="0" y1="120" x2="800" y2="120" stroke="#334155" stroke-width="1" />
    <line x1="0" y1="140" x2="800" y2="140" stroke="#334155" stroke-width="1" />
  </g>

  <!-- LED Ribbon Banner -->
  <rect x="0" y="145" width="800" height="18" fill="#0f172a" stroke="#334155" stroke-width="1" />
  <text x="400" y="158" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${theme.accent}" text-anchor="middle" letter-spacing="4">SMASHBOOK ARENA • COURT ${courtNum} • BWF CERTIFIED MAT</text>

  <!-- Multi-Court Stadium Hall Floor -->
  <!-- Center Main Feature Court -->
  <polygon points="170,185 630,185 710,430 90,430" fill="url(#wideMat-${index})" stroke="${theme.lines}" stroke-width="2.5" />
  <!-- Left Side Adjacent Court Snippet -->
  <polygon points="0,195 110,195 30,430 0,430" fill="${theme.borderBg}" opacity="0.6" stroke="${theme.lines}" stroke-width="1.5" />
  <!-- Right Side Adjacent Court Snippet -->
  <polygon points="690,195 800,195 800,430 770,430" fill="${theme.borderBg}" opacity="0.6" stroke="${theme.lines}" stroke-width="1.5" />

  <!-- Center Court Lines -->
  <line x1="170" y1="290" x2="630" y2="290" stroke="${theme.lines}" stroke-width="2" />
  <line x1="130" y1="380" x2="670" y2="380" stroke="${theme.lines}" stroke-width="2" />
  <line x1="400" y1="185" x2="400" y2="430" stroke="${theme.lines}" stroke-width="2" />

  <!-- Net in Center Court -->
  <polygon points="160,285 640,285 640,305 160,305" fill="#020617" fill-opacity="0.7" stroke="#64748b" stroke-width="0.8" />
  <line x1="155" y1="285" x2="645" y2="285" stroke="#ffffff" stroke-width="2.5" />
  <rect x="155" y="278" width="5" height="30" fill="#f59e0b" />
  <rect x="640" y="278" width="5" height="30" fill="#f59e0b" />

  <!-- Badge Top Left -->
  <g transform="translate(30, 25)">
    <rect width="220" height="42" rx="8" fill="#0f172a" fill-opacity="0.9" stroke="#334155" stroke-width="1.5" />
    <circle cx="28" cy="21" r="13" fill="${theme.courtInner}" />
    <text x="28" y="26" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${courtNum}</text>
    <text x="50" y="18" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#ffffff">NHÀ THI ĐẤU QUỐC GIA</text>
    <text x="50" y="33" font-family="Arial, sans-serif" font-size="9" fill="${theme.accent}">SÂN SỐ ${courtNum} — ${theme.accentText}</text>
  </g>
</svg>`;
}

for (let i = 1; i <= 100; i++) {
  const theme = THEMES[(i - 1) % THEMES.length];
  const perspective = PERSPECTIVES[(i - 1) % PERSPECTIVES.length];
  const svg = generateCourtSvg(i, theme, perspective);
  const filePath = path.join(outputDir, `court-${i}.svg`);
  fs.writeFileSync(filePath, svg, 'utf8');
}

console.log('Successfully generated 100 unique badminton court SVGs in public/images/courts/');
