import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { priceColor, priceNorm, dynamicMax } from '../utils/priceScale';

const SIZE = 440;
const CX = SIZE / 2;
const CY = SIZE / 2;
const INNER_R = 55;
const OUTER_R = 180;
const LABEL_R = 210;
const SELECTED_RED = '#e03a4a';

function ang(i, segments) {
  return ((i - 0.5) / segments) * Math.PI * 2 - Math.PI / 2;
}

function barPath(i, t, segments) {
  const gap = segments === 96 ? 0.002 : 0.008;
  const a0 = ang(i, segments) + gap;
  const a1 = ang(i + 1, segments) - gap;
  const R = INNER_R + Math.max(0.04, t) * (OUTER_R - INNER_R);
  const x0i = CX + INNER_R * Math.cos(a0),
    y0i = CY + INNER_R * Math.sin(a0);
  const x1i = CX + INNER_R * Math.cos(a1),
    y1i = CY + INNER_R * Math.sin(a1);
  const x0o = CX + R * Math.cos(a0),
    y0o = CY + R * Math.sin(a0);
  const x1o = CX + R * Math.cos(a1),
    y1o = CY + R * Math.sin(a1);
  return `M ${x0i} ${y0i} L ${x0o} ${y0o} A ${R} ${R} 0 0 1 ${x1o} ${y1o} L ${x1i} ${y1i} A ${INNER_R} ${INNER_R} 0 0 0 ${x0i} ${y0i} Z`;
}

function guideValues(max) {
  if (max <= 5) return [1, 2.5, 4];
  if (max <= 10) return [2, 5, 8];
  if (max <= 20) return [5, 10, 15];
  if (max <= 30) return [10, 20, 25];
  return [max * 0.25, max * 0.5, max * 0.75];
}

const PriceClockface = ({
  prices = [],
  quarters = [],
  now = 0,
  colorMode = 'absolute',
  showLabels = true,
  showNow = true,
  defaultGranularity = 'hourly',
}) => {
  const [gran, setGran] = useState(defaultGranularity);
  const [selected, setSelected] = useState(null); // { idx, isQ } | null

  const isQ = gran === 'quarterly';
  const segments = isQ ? 96 : 24;
  const data = isQ ? quarters : prices;
  const nowIdx = isQ ? now * 4 : now;

  const handleEnter = (i) => setSelected({ idx: i, isQ });
  const handleLeave = () => setSelected(null);

  useEffect(() => {
    setSelected(null);
  }, [gran]);

  const isSelected = selected && selected.isQ === isQ;
  const displayIdx = isSelected ? selected.idx : nowIdx;
  const displayValue = data[displayIdx];

  const displayLabel = (() => {
    if (isQ) {
      const h = Math.floor(displayIdx / 4);
      const m = (displayIdx % 4) * 15;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    return `${String(displayIdx).padStart(2, '0')}:00`;
  })();

  const max = dynamicMax(prices);
  const guides = guideValues(max);

  return (
    <div style={styles.frame}>
      <div style={styles.content}>
      <div style={styles.header}>
        <div style={styles.key}>snt/kWh · 24h bars</div>
        <div style={styles.tabs}>
          <button
            onClick={() => setGran('hourly')}
            style={{ ...styles.tab, ...(!isQ ? styles.tabOn : {}) }}
          >
            Tunneittain
          </button>
          <button
            onClick={() => setGran('quarterly')}
            style={{ ...styles.tab, ...(isQ ? styles.tabOn : {}) }}
            disabled={quarters.length === 0}
          >
            Vartin tarkkuus
          </button>
        </div>
      </div>

      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }}
      >
        {/* Guide rings */}
        {guides.map((v) => {
          const t = priceNorm(v, prices);
          const R = INNER_R + t * (OUTER_R - INNER_R);
          return (
            <g key={v}>
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke="#4a5558"
                strokeDasharray="3 4"
                strokeWidth="1.5"
              />
              <text x={CX + 4} y={CY - R - 2} style={styles.guideText}>
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((p, i) => {
          const isSel = isSelected && selected.idx === i;
          const isNow = i === nowIdx && showNow;
          const fill = isSel ? SELECTED_RED : priceColor(p, colorMode, prices);
          const timeLabel = isQ
            ? `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`
            : `${String(i).padStart(2, '0')}:00`;
          const ariaLabel = `${timeLabel}, ${typeof p === 'number' ? p.toFixed(2) : '–'} snt per kilowattitunti`;
          return (
            <path
              key={i}
              d={barPath(i, priceNorm(p, prices), segments)}
              fill={fill}
              opacity={isNow ? 1 : 0.92}
              stroke={isNow ? '#fff' : 'none'}
              strokeWidth="1.5"
              role="button"
              tabIndex={0}
              aria-label={ariaLabel}
              style={{ cursor: 'pointer', transition: 'fill 120ms' }}
              onMouseEnter={() => handleEnter(i)}
              onMouseLeave={handleLeave}
            />
          );
        })}

        {/* Hour labels on rim */}
        {Array.from({ length: 24 }, (_, h) => {
          const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
          const lx = CX + LABEL_R * Math.cos(a);
          const ly = CY + LABEL_R * Math.sin(a);
          const major = h % 3 === 0;
          return (
            <text
              key={h}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                ...styles.hourText,
                fontSize: major ? 14 : 11,
                fill: major ? '#cfd5d7' : '#626a6d',
              }}
            >
              {String(h).padStart(2, '0')}
            </text>
          );
        })}

        {/* Price labels — hourly only, on bars tall enough to hold text */}
        {showLabels &&
          !isQ &&
          prices.map((p, h) => {
            if (p < 1.5) return null;
            const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
            const t = priceNorm(p, prices);
            const R = INNER_R + t * (OUTER_R - INNER_R) - 14;
            const tx = CX + R * Math.cos(a);
            const ty = CY + R * Math.sin(a);
            return (
              <text
                key={h}
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                style={styles.priceText}
              >
                {p.toFixed(p < 10 ? 1 : 0)}
              </text>
            );
          })}

        {/* Center circle + readout */}
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R - 3}
          fill="#1a1d1e"
          stroke={isSelected ? SELECTED_RED : '#2a2f30'}
          strokeWidth={isSelected ? 1.5 : 1}
        />
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          style={{
            ...styles.centerLabel,
            fill: isSelected ? SELECTED_RED : styles.centerLabel.fill,
          }}
        >
          {displayLabel}
        </text>
        <text
          x={CX}
          y={CY + 18}
          textAnchor="middle"
          style={{
            ...styles.centerValue,
            fill: isSelected ? SELECTED_RED : styles.centerValue.fill,
          }}
        >
          {typeof displayValue === 'number' ? displayValue.toFixed(2) : '–'}
        </text>
      </svg>
      </div>
    </div>
  );
};

const styles = {
  frame: {
    background: '#314b6162',
    width: 'fit-content',
    margin: '0 auto',
  },
  content: {
    background: '#232727',
    padding: '24px 40px 32px',
    color: '#dcdcdc',
    fontFamily: 'Courier, monospace',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 16,
  },
  key: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: '0.08em',
  },
  tabs: {
    display: 'inline-flex',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    overflow: 'hidden',
    background: '#1a1d1e',
  },
  tab: {
    background: 'transparent',
    color: '#9aa3a6',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.08)',
    fontFamily: 'Courier, monospace',
    fontSize: 12,
    padding: '6px 12px',
    cursor: 'pointer',
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap',
  },
  tabOn: {
    background: '#395f7c',
    color: '#fff',
  },
  hourText: {
    fontFamily: 'Courier, monospace',
    fontWeight: 400,
  },
  guideText: {
    fontFamily: 'Courier, monospace',
    fontSize: 10,
    fill: '#8a9396',
  },
  priceText: {
    fontFamily: 'Courier, monospace',
    fontSize: 11,
    fontWeight: 700,
    fill: 'rgba(10,12,14,0.9)',
    pointerEvents: 'none',
  },
  centerLabel: {
    fontFamily: 'Courier, monospace',
    fontSize: 12,
    fill: '#9aa3a6',
    letterSpacing: '0.1em',
  },
  centerValue: {
    fontFamily: 'Courier, monospace',
    fontSize: 24,
    fontWeight: 700,
    fill: '#f2f2f2',
  },
};

PriceClockface.propTypes = {
  prices: PropTypes.arrayOf(PropTypes.number),
  quarters: PropTypes.arrayOf(PropTypes.number),
  now: PropTypes.number,
  colorMode: PropTypes.oneOf(['absolute', 'relative']),
  showLabels: PropTypes.bool,
  showNow: PropTypes.bool,
  defaultGranularity: PropTypes.oneOf(['hourly', 'quarterly']),
};

export default PriceClockface;
