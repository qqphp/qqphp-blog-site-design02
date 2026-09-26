import './investment-pond.css';

type KoiColor = 'coral' | 'gold' | 'blue';

function Koi({ color }: { color: KoiColor }) {
  const bodyGradient = `pond-body-${color}`;
  const finGradient = `pond-fin-${color}`;

  return <svg viewBox="0 0 240 110" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id={bodyGradient} x1="105" y1="19" x2="116" y2="92" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--koi-highlight)" />
        <stop offset=".52" stopColor="var(--koi-base)" />
        <stop offset="1" stopColor="var(--koi-shade)" />
      </linearGradient>
      <linearGradient id={finGradient} x1="22" y1="32" x2="104" y2="85" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--koi-fin)" stopOpacity=".9" />
        <stop offset="1" stopColor="var(--koi-fin)" stopOpacity=".35" />
      </linearGradient>
    </defs>
    <g className="pond-koi-tail">
      <path d="M48 55C31 51 19 35 6 22C10 39 17 49 27 55C17 62 10 73 6 89C21 76 32 60 48 55Z" fill={`url(#${finGradient})`} stroke="var(--koi-edge)" strokeWidth="1.5" />
      <path d="M43 55C29 55 20 45 12 34M43 55C27 58 19 69 12 79M39 55L16 48M39 55L15 64" stroke="var(--koi-line)" strokeWidth="1.2" strokeLinecap="round" />
    </g>
    <path d="M91 40C82 23 66 16 53 17C61 31 68 41 84 48M88 65C79 83 65 91 52 92C59 77 68 67 85 59" fill={`url(#${finGradient})`} stroke="var(--koi-edge)" strokeWidth="1.5" />
    <path d="M168 38C158 24 155 14 162 8C173 17 179 27 180 41M169 73C158 86 156 97 163 103C174 93 180 83 181 69" fill={`url(#${finGradient})`} stroke="var(--koi-edge)" strokeWidth="1.5" />
    <path d="M39 55C54 36 90 24 130 27C168 29 198 39 215 49C223 54 223 59 215 64C196 75 166 81 130 83C89 86 54 74 39 55Z" fill={`url(#${bodyGradient})`} stroke="var(--koi-edge)" strokeWidth="2" />
    <path d="M45 55C78 41 121 41 161 48" stroke="var(--koi-highlight)" strokeOpacity=".56" strokeWidth="2" strokeLinecap="round" />
    {color === 'coral' && <g fill="var(--koi-mark)">
      <path d="M72 39C84 30 105 29 116 34C119 44 113 49 102 51C88 53 77 49 72 39Z" />
      <path d="M125 63C133 51 153 46 165 51C174 56 171 68 159 72C145 77 131 73 125 63Z" />
      <path d="M182 42C191 43 202 49 207 55C200 60 189 62 180 58C176 51 178 45 182 42Z" />
    </g>}
    {color === 'gold' && <g>
      <path d="M68 37C85 28 101 30 113 35C111 50 99 58 78 56C70 50 68 45 68 37Z" fill="var(--koi-mark)" />
      <path d="M120 31C137 28 153 31 164 37C164 46 157 52 146 54C130 53 123 44 120 31Z" fill="var(--koi-dark-mark)" />
      <path d="M120 71C136 58 157 59 174 67C160 78 138 83 120 71Z" fill="var(--koi-mark)" />
      <path d="M183 42C194 43 206 49 210 55C203 65 191 67 181 61C178 54 180 47 183 42Z" fill="var(--koi-dark-mark)" />
    </g>}
    {color === 'blue' && <g fill="var(--koi-mark)">
      <path d="M65 45C77 32 91 29 103 33C106 42 99 51 90 53C80 54 70 52 65 45Z" />
      <path d="M109 67C119 53 137 47 150 51C157 59 151 69 139 73C128 76 116 73 109 67Z" />
      <path d="M164 37C178 35 191 39 199 46C193 54 181 59 170 55C163 50 161 43 164 37Z" />
    </g>}
    <g stroke="var(--koi-line)" strokeWidth=".9" strokeOpacity=".28" fill="none">
      <path d="M82 44Q88 48 82 52M82 57Q88 61 82 65M96 37Q103 42 96 47M96 49Q103 55 96 61M96 64Q103 70 96 74M112 34Q119 40 112 46M112 49Q119 55 112 61M112 64Q119 70 112 77M128 35Q135 41 128 47M128 50Q135 55 128 60M128 64Q135 70 128 76M144 37Q151 43 144 49M144 53Q151 59 144 65M144 67Q150 72 144 76M160 40Q166 45 160 50M160 56Q166 62 160 67" />
    </g>
    <path d="M180 41Q174 47 175 51M180 69Q174 63 175 59M203 51Q212 46 217 47M203 59Q213 64 217 63" stroke="var(--koi-line)" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M194 54C199 54 204 54 210 55" stroke="var(--koi-line)" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="192" cy="47" r="2.7" fill="var(--koi-eye)" />
    <circle cx="192.8" cy="46.2" r=".75" fill="#fff" />
    <circle cx="192" cy="63" r="2.7" fill="var(--koi-eye)" />
    <circle cx="192.8" cy="62.2" r=".75" fill="#fff" />
  </svg>;
}

function Lotus({ bloom = true }: { bloom?: boolean }) {
  return <svg viewBox="0 0 160 120" fill="none" aria-hidden="true">
    <path d="M79 63L105 21C130 24 149 39 152 60C155 85 137 104 108 109C75 114 33 106 16 90C-3 70 7 45 35 32C57 21 82 19 105 21L79 63Z" fill="var(--lotus-pad)" stroke="var(--lotus-edge)" strokeWidth="2" />
    <path d="M79 63C59 53 38 45 20 49M79 63C63 77 52 88 41 99M79 63C98 79 115 92 133 97M79 63C102 59 128 57 151 61" stroke="var(--lotus-vein)" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
    {bloom && <g className="pond-lotus-flower">
      <path d="M107 54C95 48 88 36 88 25C101 29 110 37 114 48C117 35 127 26 138 24C138 38 130 50 119 55C132 47 145 48 153 55C145 64 133 68 120 63C111 69 99 69 91 64C95 59 101 56 107 54Z" fill="var(--lotus-petal-back)" stroke="var(--lotus-petal-edge)" strokeWidth="1.3" />
      <path d="M116 57C105 50 103 38 108 27C117 34 121 43 119 52C122 39 130 33 140 32C139 46 132 57 121 60C116 64 110 63 105 60Z" fill="var(--lotus-petal)" stroke="var(--lotus-petal-edge)" strokeWidth="1.3" />
      <ellipse cx="117" cy="59" rx="7" ry="4" fill="var(--lotus-heart)" />
    </g>}
  </svg>;
}

export function InvestmentPond() {
  return <div className="investment-pond" aria-hidden="true">
    <svg className="pond-water-lines" viewBox="0 0 1200 190" preserveAspectRatio="none" fill="none">
      <path d="M-40 69C106 12 201 95 357 54C487 19 595 83 738 46C890 7 1024 96 1240 34" />
      <path d="M-80 131C101 99 210 165 352 124C522 76 625 158 790 117C925 84 1086 150 1260 109" />
      <path d="M155 167C290 138 347 174 449 153M832 174C946 145 1039 166 1150 147" />
    </svg>
    <span className="pond-ripple pond-ripple-one" />
    <span className="pond-ripple pond-ripple-two" />
    <span className="pond-ripple pond-ripple-three" />
    <span className="pond-lotus pond-lotus-one"><Lotus /></span>
    <span className="pond-lotus pond-lotus-two"><Lotus bloom={false} /></span>
    <span className="pond-lotus pond-lotus-three"><Lotus /></span>
    <span className="pond-lotus pond-lotus-four"><Lotus bloom={false} /></span>
    <span className="pond-lotus pond-lotus-five"><Lotus /></span>
    <span className="pond-koi pond-koi-coral"><Koi color="coral" /></span>
    <span className="pond-koi pond-koi-gold"><Koi color="gold" /></span>
    <span className="pond-koi pond-koi-blue"><Koi color="blue" /></span>
  </div>;
}
