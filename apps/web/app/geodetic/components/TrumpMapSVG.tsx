export default function TrumpMapSVG({ className }: { className?: string }) {
  return (
    <svg className={`case-map-svg ${className || ""}`} viewBox="0 0 480 260" xmlns="http://www.w3.org/2000/svg">
          <defs><style>{`
            .cc{fill:var(--text-primary);opacity:0.08;stroke:var(--surface-border);strokeWidth:0.6;}
            .cgl{stroke:var(--surface-border);strokeWidth:0.6;opacity:0.2;}
          `}</style></defs>
          <rect width="480" height="260" fill="var(--bg)"/>
          {/* Graticule */}
          <line x1="0" y1="130" x2="480" y2="130" stroke="var(--surface-border)" strokeWidth="0.5" opacity="0.12"/>
          {/* Lon lines every 30° */}
          <line className="cgl" x1="40" y1="0" x2="40" y2="260"/>
          <line className="cgl" x1="80" y1="0" x2="80" y2="260"/>
          <line className="cgl" x1="120" y1="0" x2="120" y2="260"/>
          <line className="cgl" x1="160" y1="0" x2="160" y2="260"/>
          <line className="cgl" x1="200" y1="0" x2="200" y2="260"/>
          <line x1="240" y1="0" x2="240" y2="260" stroke="var(--color-spiced-life)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
          <line className="cgl" x1="280" y1="0" x2="280" y2="260"/>
          <line className="cgl" x1="320" y1="0" x2="320" y2="260"/>
          <line className="cgl" x1="360" y1="0" x2="360" y2="260"/>
          <line className="cgl" x1="400" y1="0" x2="400" y2="260"/>
          <line className="cgl" x1="440" y1="0" x2="440" y2="260"/>

          {/* Continents */}
          <path className="cc" d="M155,148 L164,144 L172,148 L178,160 L178,180 L172,198 L162,210 L150,208 L142,194 L140,178 L144,162 Z"/>
          <path className="cc" d="M143,35 L160,32 L174,38 L180,50 L178,65 L168,75 L155,80 L142,78 L132,70 L128,58 L134,44 Z"/>
          <path className="cc" d="M148,80 L156,82 L158,88 L152,92 L146,88 Z"/>
          <path className="cc" d="M234,44 L246,40 L258,44 L262,54 L255,62 L242,65 L232,60 L228,50 Z"/>
          <path className="cc" d="M245,28 L254,25 L260,32 L255,40 L246,38 Z"/>
          <path className="cc" d="M240,75 L254,70 L268,75 L274,88 L272,105 L265,122 L254,132 L242,130 L232,118 L228,105 L230,88 Z"/>
          <path className="cc" d="M270,65 L285,62 L294,70 L292,80 L278,82 L268,76 Z"/>
          <path className="cc" d="M268,28 L320,22 L380,20 L415,25 L420,35 L408,42 L370,44 L330,42 L295,44 L272,40 Z"/>
          <path className="cc" d="M309,60 L320,56 L330,62 L328,78 L318,90 L308,86 L303,74 Z"/>
          <path className="cc" d="M342,65 L358,62 L365,70 L360,80 L346,78 Z"/>
          <path className="cc" d="M332,44 L370,40 L385,48 L385,60 L370,66 L350,64 L336,56 Z"/>
          <path className="cc" d="M394,45 L401,42 L405,50 L400,56 L393,53 Z"/>
          <path className="cc" d="M374,152 L400,146 L418,150 L424,164 L418,178 L402,184 L385,178 L374,166 Z"/>
          <path className="cc" d="M196,14 L214,10 L225,16 L222,26 L208,28 L197,22 Z"/>

          {/* Lines */}
          <line x1="142" y1="0" x2="142" y2="260" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>
          <line x1="349" y1="0" x2="349" y2="260" stroke="#FFD700" strokeWidth="1.5" opacity="0.8"/>
          <line x1="108" y1="0" x2="108" y2="260" stroke="rgba(220,220,255,0.7)" strokeWidth="1.2" opacity="0.75"/>
          <line x1="435" y1="0" x2="435" y2="260" stroke="var(--color-spiced-life)" strokeWidth="1.5" opacity="0.85"/>
          <line x1="391" y1="0" x2="391" y2="260" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="23" y1="0" x2="23" y2="260" stroke="#a78bfa" strokeWidth="1.2" opacity="0.7"/>

          {/* Dots */}
          <circle cx="142" cy="75" r="4" fill="var(--color-eggshell)" stroke="var(--color-charcoal)" strokeWidth="1"/>
          <text x="146" y="73" fill="var(--text-secondary)" fontSize="7" fontFamily="'DM Sans',sans-serif">New York (birth + empire)</text>

          <circle cx="137" cy="77" r="3.5" fill="var(--color-y2k-blue)" opacity="0.9"/>
          <text x="99" y="87" fill="var(--color-y2k-blue)" fontSize="7" fontFamily="'DM Sans',sans-serif" opacity="0.9">Washington D.C.</text>

          <circle cx="133" cy="106" r="3" fill="var(--color-acqua)" opacity="0.8"/>
          <text x="107" y="104" fill="var(--color-acqua)" fontSize="6.5" fontFamily="'DM Sans',sans-serif" opacity="0.75">Mar-a-Lago</text>

          <circle cx="427" cy="82" r="3" fill="var(--color-spiced-life)" opacity="0.8"/>
          <text x="410" y="78" fill="var(--color-spiced-life)" fontSize="6.5" fontFamily="'DM Sans',sans-serif" opacity="0.75">Japan</text>

          <circle cx="408" cy="80" r="2.5" fill="var(--text-tertiary)" opacity="0.8"/>
          <text x="380" y="78" fill="var(--text-tertiary)" fontSize="6.5" fontFamily="'DM Sans',sans-serif" opacity="0.75">Korea (Saturn)</text>

          <circle cx="290" cy="47" r="2.5" fill="#FFD700" opacity="0.7"/>
          <text x="294" y="45" fill="#FFD700" fontSize="6.5" fontFamily="'DM Sans',sans-serif" opacity="0.6">Moscow (Sun band)</text>

          <circle cx="30" cy="116" r="2.5" fill="#a78bfa" opacity="0.7"/>
          <text x="4" y="114" fill="#a78bfa" fontSize="6.5" fontFamily="'DM Sans',sans-serif" opacity="0.65">Hawaii</text>

          {/* Legend */}
          <line x1="4" y1="240" x2="18" y2="240" stroke="#FFD700" strokeWidth="1.5" opacity="0.8"/>
          <text x="22" y="243" fill="var(--text-tertiary)" fontSize="6" fontFamily="sans-serif">Sun</text>
          <line x1="48" y1="240" x2="62" y2="240" stroke="rgba(220,220,255,0.7)" strokeWidth="1.2"/>
          <text x="66" y="243" fill="var(--text-tertiary)" fontSize="6" fontFamily="sans-serif">Moon</text>
          <line x1="92" y1="240" x2="106" y2="240" stroke="var(--color-spiced-life)" strokeWidth="1.5" opacity="0.85"/>
          <text x="110" y="243" fill="var(--text-tertiary)" fontSize="6" fontFamily="sans-serif">Mars</text>
          <line x1="132" y1="240" x2="146" y2="240" stroke="var(--text-tertiary)" strokeWidth="1.2" opacity="0.7"/>
          <text x="150" y="243" fill="var(--text-tertiary)" fontSize="6" fontFamily="sans-serif">Saturn</text>
          <line x1="174" y1="240" x2="188" y2="240" stroke="#a78bfa" strokeWidth="1.2" opacity="0.7"/>
          <text x="192" y="243" fill="var(--text-tertiary)" fontSize="6" fontFamily="sans-serif">Jupiter</text>
          <line x1="216" y1="240" x2="230" y2="240" stroke="var(--text-secondary)" strokeWidth="1" strokeDasharray="4,3" opacity="0.4"/>
          <text x="234" y="243" fill="var(--text-tertiary)" fontSize="6" fontFamily="sans-serif">Birth location</text>
    </svg>
  );
}