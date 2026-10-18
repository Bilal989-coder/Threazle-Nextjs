'use client';
import type { ReactNode } from 'react';
import type { GuideStep, MeasurePoint, Silhouette } from '@/lib/measure-points';

/**
 * Original line drawings of each garment type with numbered measuring points (circumference
 * rings and length arrows), in the house navy / gold palette. The same drawing is cropped to make
 * the close-up thumbnails, so a step and its picture can never disagree.
 */

type Ring = { kind: 'ring'; cx: number; cy: number; rx: number; ry: number; bx?: number; by?: number };
type Line = { kind: 'line'; x1: number; y1: number; x2: number; y2: number; bx?: number; by?: number };
type Marker = Ring | Line;

const VIEW_W = 580;
const VIEW_H = 720;

/* ── garment outlines ─────────────────────────────────────────────────────────────── */

function Kameez() {
    return (
        <g>
            {/* shalwar (behind the kameez) */}
            <path className='g-fill' d='M138,470 C118,560 114,624 130,664 L190,664 C192,616 196,560 200,520 C204,560 208,616 210,664 L270,664 C286,624 282,560 262,470 Z' />
            <path className='g-fill' d='M128,664 h64 v14 h-64 Z M208,664 h64 v14 h-64 Z' />
            <path className='g-detail' d='M140,600 q20,8 44,0 M216,600 q20,8 44,0' />
            {/* kameez body + sleeves */}
            <path className='g-fill' d='M176,60 L112,80 L66,338 L98,346 L134,152 L128,430 L122,486 Q200,500 278,486 L272,430 L266,152 L302,346 L334,338 L288,80 L224,60 Q200,68 176,60 Z' />
            <path className='g-detail' d='M128,430 L134,486 M272,430 L266,486 M66,338 L98,346 M302,346 L334,338 M70,316 L100,324 M300,324 L330,316' />
            {/* band collar + placket */}
            <path className='g-fill' d='M178,46 Q200,40 222,46 L224,62 Q200,56 176,62 Z' />
            <path className='g-detail' d='M200,62 L200,204' />
            {[92, 126, 160, 194].map(y => <circle key={y} className='g-button' cx={200} cy={y} r={3} />)}
        </g>
    );
}

function Sherwani() {
    return (
        <g>
            <path className='g-fill' d='M150,574 L156,690 L186,690 L196,604 L204,604 L214,690 L244,690 L250,574 Z' />
            <path className='g-detail' d='M158,664 q12,5 26,0 M216,664 q12,5 26,0 M157,676 q13,5 28,0 M215,676 q13,5 28,0' />
            <path className='g-fill' d='M176,62 L114,84 L70,340 L102,348 L136,156 L134,470 L130,584 Q200,592 270,584 L266,470 L264,156 L298,348 L330,340 L286,84 L224,62 Q200,70 176,62 Z' />
            <path className='g-detail' d='M70,340 L102,348 M298,348 L330,340 M74,318 L104,326 M296,326 L326,318 M200,64 L200,586 M150,250 h26 M224,250 h26' />
            <path className='g-fill' d='M178,40 Q200,34 222,40 L226,64 Q200,58 174,64 Z' />
            {[92, 138, 184, 230, 276, 322, 368, 414, 460, 506, 552].map(y => <circle key={y} className='g-button' cx={200} cy={y} r={3} />)}
        </g>
    );
}

function Coat() {
    return (
        <g>
            <path className='g-fill' d='M140,414 L136,690 L190,690 L200,476 L210,690 L264,690 L260,414 Z' />
            <path className='g-detail' d='M163,690 L168,430 M237,690 L232,430' />
            <path className='g-fill' d='M176,62 L114,84 L70,340 L102,348 L136,156 L134,330 L130,424 Q200,432 270,424 L266,330 L264,156 L298,348 L330,340 L286,84 L224,62 Q200,70 176,62 Z' />
            <path className='g-detail' d='M70,340 L102,348 M298,348 L330,340 M74,318 L104,326 M296,326 L326,318 M200,64 L200,426 M148,300 h28 M224,300 h28 M222,140 l20,0' />
            <path className='g-fill' d='M178,40 Q200,34 222,40 L226,64 Q200,58 174,64 Z' />
            {[96, 150, 204, 258, 312, 366].map(y => <circle key={y} className='g-button' cx={200} cy={y} r={3} />)}
        </g>
    );
}

function Waistcoat() {
    return (
        <g>
            <path className='g-fill' d='M178,62 L140,82 Q154,128 150,176 L146,330 L150,368 L200,384 L250,368 L254,330 L250,176 Q246,128 260,82 L222,62 L200,196 Z' />
            <path className='g-detail' d='M200,196 L200,384 M160,290 h26 M214,290 h26 M214,214 h22' />
            <path className='g-fill' d='M180,46 Q200,40 220,46 L222,62 L200,92 L178,62 Z' />
            {[226, 262, 298, 334].map(y => <circle key={y} className='g-button' cx={200} cy={y} r={3} />)}
        </g>
    );
}

/** Bottom garment drawn on its own (right-hand inset) for the waist and length of the shalwar / trouser. */
function BottomInset({ silhouette }: { silhouette: Silhouette }) {
    const shape = silhouette === 'kameez'
        ? 'M434,490 C420,560 420,630 432,676 L480,676 C482,630 484,580 486,550 C488,580 490,630 492,676 L540,676 C552,630 552,560 538,490 Z'
        : silhouette === 'sherwani'
            ? 'M434,490 L446,690 L478,690 L486,560 L494,690 L526,690 L538,490 Z'
            : 'M434,490 L432,690 L480,690 L486,548 L492,690 L540,690 L538,490 Z';
    return (
        <g>
            <rect className='g-panel' x={404} y={420} width={170} height={290} rx={10} />
            <path className='g-fill' d='M432,474 h108 v16 h-108 Z' />
            <path className='g-fill' d={shape} />
            <path className='g-detail' d='M486,482 v10' />
            <text className='g-caption' x={489} y={442} textAnchor='middle'>{silhouette === 'kameez' ? 'SHALWAR' : 'TROUSER'}</text>
        </g>
    );
}

/* ── marker positions per garment ─────────────────────────────────────────────────── */

const BOTTOM_MARKERS: Partial<Record<MeasurePoint, Marker>> = {
    bottomWaist: { kind: 'ring', cx: 486, cy: 482, rx: 62, ry: 8, bx: 486, by: 462 },
    bottomLength: { kind: 'line', x1: 562, y1: 482, x2: 562, y2: 686 },
};

const MARKERS: Record<Silhouette, Partial<Record<MeasurePoint, Marker>>> = {
    kameez: {
        neck: { kind: 'ring', cx: 200, cy: 52, rx: 34, ry: 8, bx: 150, by: 34 },
        shoulder: { kind: 'line', x1: 114, y1: 86, x2: 286, y2: 86 },
        chest: { kind: 'ring', cx: 200, cy: 162, rx: 72, ry: 9 },
        waist: { kind: 'ring', cx: 200, cy: 258, rx: 72, ry: 9 },
        hip: { kind: 'ring', cx: 200, cy: 350, rx: 76, ry: 9 },
        sleeve: { kind: 'line', x1: 96, y1: 82, x2: 50, y2: 336 },
        garmentLength: { kind: 'line', x1: 356, y1: 58, x2: 356, y2: 492 },
        ...BOTTOM_MARKERS,
    },
    sherwani: {
        neck: { kind: 'ring', cx: 200, cy: 50, rx: 34, ry: 8, bx: 150, by: 32 },
        shoulder: { kind: 'line', x1: 116, y1: 90, x2: 284, y2: 90 },
        chest: { kind: 'ring', cx: 200, cy: 168, rx: 70, ry: 9 },
        waist: { kind: 'ring', cx: 200, cy: 270, rx: 70, ry: 9 },
        hip: { kind: 'ring', cx: 200, cy: 366, rx: 72, ry: 9 },
        sleeve: { kind: 'line', x1: 100, y1: 86, x2: 54, y2: 338 },
        garmentLength: { kind: 'line', x1: 356, y1: 56, x2: 356, y2: 588 },
        ...BOTTOM_MARKERS,
    },
    coat: {
        neck: { kind: 'ring', cx: 200, cy: 50, rx: 34, ry: 8, bx: 150, by: 32 },
        shoulder: { kind: 'line', x1: 116, y1: 90, x2: 284, y2: 90 },
        chest: { kind: 'ring', cx: 200, cy: 168, rx: 70, ry: 9 },
        waist: { kind: 'ring', cx: 200, cy: 262, rx: 70, ry: 9 },
        hip: { kind: 'ring', cx: 200, cy: 350, rx: 72, ry: 9 },
        sleeve: { kind: 'line', x1: 100, y1: 86, x2: 54, y2: 338 },
        garmentLength: { kind: 'line', x1: 356, y1: 56, x2: 356, y2: 428 },
        ...BOTTOM_MARKERS,
    },
    waistcoat: {
        neck: { kind: 'ring', cx: 200, cy: 54, rx: 30, ry: 7, bx: 154, by: 36 },
        shoulder: { kind: 'line', x1: 140, y1: 90, x2: 260, y2: 90, bx: 200, by: 112 },
        chest: { kind: 'ring', cx: 200, cy: 182, rx: 62, ry: 8 },
        waist: { kind: 'ring', cx: 200, cy: 270, rx: 62, ry: 8 },
        hip: { kind: 'ring', cx: 200, cy: 342, rx: 64, ry: 8 },
        sleeve: { kind: 'line', x1: 128, y1: 84, x2: 92, y2: 300 },
        garmentLength: { kind: 'line', x1: 300, y1: 56, x2: 300, y2: 380 },
        ...BOTTOM_MARKERS,
    },
};

export function markerFor(silhouette: Silhouette, point?: MeasurePoint): Marker | undefined {
    return point ? MARKERS[silhouette][point] : undefined;
}

function badgePosition(marker: Marker): { x: number; y: number } {
    if (marker.bx != null && marker.by != null) return { x: marker.bx, y: marker.by };
    if (marker.kind === 'ring') return { x: marker.cx, y: marker.cy };
    return { x: (marker.x1 + marker.x2) / 2, y: (marker.y1 + marker.y2) / 2 };
}

function MarkerShape({ marker, number, state }: { marker: Marker; number: number; state: 'idle' | 'active' | 'dim' }) {
    const badge = badgePosition(marker);
    return (
        <g className={`m-marker m-${state}`}>
            {marker.kind === 'ring'
                ? <ellipse className='m-ring' cx={marker.cx} cy={marker.cy} rx={marker.rx} ry={marker.ry} />
                : <line className='m-line' x1={marker.x1} y1={marker.y1} x2={marker.x2} y2={marker.y2} markerStart='url(#m-arrow)' markerEnd='url(#m-arrow)' />}
            <circle className='m-badge' cx={badge.x} cy={badge.y} r={12} />
            <text className='m-badge-text' x={badge.x} y={badge.y + 4.2} textAnchor='middle'>{number}</text>
        </g>
    );
}

function Garment({ silhouette }: { silhouette: Silhouette }) {
    return silhouette === 'sherwani' ? <Sherwani /> : silhouette === 'coat' ? <Coat /> : silhouette === 'waistcoat' ? <Waistcoat /> : <Kameez />;
}

function Defs() {
    return (
        <defs>
            <marker id='m-arrow' viewBox='0 0 10 10' refX='5' refY='5' markerWidth='7' markerHeight='7' orient='auto-start-reverse'>
                <path d='M0,1 L9,5 L0,9 Z' className='m-arrowhead' />
            </marker>
        </defs>
    );
}

/** A view box tightly around one marker, for the close-up thumbnail. */
function cropFor(marker: Marker): string {
    const [minX, minY, maxX, maxY] = marker.kind === 'ring'
        ? [marker.cx - marker.rx, marker.cy - marker.ry - 20, marker.cx + marker.rx, marker.cy + marker.ry + 20]
        : [Math.min(marker.x1, marker.x2), Math.min(marker.y1, marker.y2), Math.max(marker.x1, marker.x2), Math.max(marker.y1, marker.y2)];
    const size = Math.max(maxX - minX, maxY - minY) + 70;
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return `${cx - size / 2} ${cy - size / 2} ${size} ${size}`;
}

interface DiagramProps {
    steps: GuideStep[];
    silhouette: Silhouette;
    active?: number;
    onActivate?: (number: number | undefined) => void;
    label: string;
}

/** The full annotated drawing. Hovering or focusing a number highlights its step. */
export function MeasurementDiagram({ steps, silhouette, active, onActivate, label }: DiagramProps) {
    const showBottom = steps.some(step => step.point === 'bottomWaist' || step.point === 'bottomLength');
    const width = showBottom ? VIEW_W : 400;
    // A waistcoat drawing is short; crop the empty space below it.
    const height = silhouette === 'waistcoat' && !showBottom ? 410 : VIEW_H;
    return (
        <svg className='measure-diagram' viewBox={`0 0 ${width} ${height}`} role='img' aria-label={label}>
            <Defs />
            <Garment silhouette={silhouette} />
            {showBottom && <BottomInset silhouette={silhouette} />}
            {steps.map(step => {
                const marker = markerFor(silhouette, step.point);
                if (!marker) return null;
                const state = active === undefined ? 'idle' : active === step.number ? 'active' : 'dim';
                return (
                    <g key={step.number} onMouseEnter={() => onActivate?.(step.number)} onMouseLeave={() => onActivate?.(undefined)} onClick={() => onActivate?.(step.number)} style={{ cursor: onActivate ? 'pointer' : undefined }}>
                        <MarkerShape marker={marker} number={step.number} state={state} />
                    </g>
                );
            })}
        </svg>
    );
}

/** A square close-up of one measuring point (used in the thumbnail strip). */
export function MeasurementCloseUp({ step, silhouette }: { step: GuideStep; silhouette: Silhouette }): ReactNode {
    const marker = markerFor(silhouette, step.point);
    if (!marker) return null;
    return (
        <svg className='measure-closeup' viewBox={cropFor(marker)} aria-hidden='true' preserveAspectRatio='xMidYMid meet'>
            <Defs />
            <Garment silhouette={silhouette} />
            {(step.point === 'bottomWaist' || step.point === 'bottomLength') && <BottomInset silhouette={silhouette} />}
            <MarkerShape marker={marker} number={step.number} state='active' />
        </svg>
    );
}
