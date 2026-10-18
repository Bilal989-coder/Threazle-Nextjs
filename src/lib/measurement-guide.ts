/**
 * Customer-facing measuring instructions.
 * Used whenever the backend does not supply its own help text for a field.
 * These are general BODY-measurement prompts, not a tailor-approved size chart.
 * Backend help text takes precedence; never infer allowances or a garment fit.
 */
export interface MeasureHelp { how: string; tip: string }

export const MEASURE_BEFORE_YOU_BEGIN = [
    'Use a soft tailor’s tape, not a metal tape.',
    'Wear a thin shirt or kurta, not a jacket or thick sweater.',
    'Stand straight and relaxed, feet together, arms at your sides. Breathe normally.',
    'Ask someone to help if you can. Shoulders and lengths are hard to measure on yourself.',
    'Keep the tape level without pulling it tight. Follow any field-specific instructions from your tailor.',
    'Measure twice from the same points. If the results differ, remeasure or ask your tailor rather than choosing a number.',
];

const GUIDE: Record<string, MeasureHelp> = {
    chest: {
        how: 'Wrap the tape around the fullest part of your chest, just under the armpits and across the shoulder blades. Keep it level all the way round.',
        tip: 'Don’t puff out your chest or hold your breath.',
    },
    waist: {
        how: 'Measure around the waist level specified by the garment’s guide. A body-waist measurement and a trouser-waist measurement can use different positions; ask your tailor when the label is unclear.',
        tip: 'Keep the tape level at the back and don’t pull your stomach in.',
    },
    hip: {
        how: 'Stand with feet together and measure around the widest part of your hips and seat.',
        tip: 'Keep the tape parallel to the floor.',
    },
    shoulder: {
        how: 'Measure across your back from the tip of one shoulder bone to the tip of the other, following the natural curve just below the collar.',
        tip: 'The shoulder tip is where the arm meets the shoulder. Ask a helper for this one.',
    },
    sleeve: {
        how: 'With your arm relaxed at your side, measure from the shoulder tip down over the elbow to where you want the cuff to finish, usually the wrist bone.',
        tip: 'For a sherwani or formal kurta, most people prefer the cuff just past the wrist bone.',
    },
    length: {
        how: 'Measure from the highest point of the shoulder, beside the neck, straight down the front to where you want the garment to end.',
        tip: 'Typical lengths: kurta just above the knee, sherwani at or just below the knee, waistcoat at the hip.',
    },
    neck: {
        how: 'Measure around the base of your neck, where the collar sits, with the tape over your Adam’s apple.',
        tip: 'Record the measurement requested by the guide; do not add an allowance unless your tailor asks for one.',
    },
    trouser: {
        how: 'Measure from your natural waist straight down the outside of your leg to where you want the shalwar to end, usually the ankle bone.',
        tip: 'Wear the shoes you plan to wear with the outfit for the most accurate length.',
    },
    bicep: {
        how: 'Measure around the fullest part of your upper arm with the arm relaxed.',
        tip: 'Keep the tape horizontal around the arm.',
    },
    wrist: {
        how: 'Measure around your wrist just above the wrist bone.',
        tip: 'Mention a watch in your order notes instead of changing the measurement without guidance.',
    },
    armhole: {
        how: 'Measure around your arm where it joins the shoulder, passing under the armpit.',
        tip: 'Keep your arm relaxed at your side.',
    },
    inseam: {
        how: 'Measure from the top of the inner thigh down the inside of the leg to the ankle.',
        tip: 'Stand straight with feet slightly apart.',
    },
    thigh: {
        how: 'Measure around the fullest part of your upper thigh.',
        tip: 'Keep the tape level and relaxed.',
    },
};

const ALIASES: [RegExp, string][] = [
    [/\b(inseam|inside leg)\b/i, 'inseam'],
    [/\b(shalwar|trouser|pajama|pyjama|pant|pants|bottom)\b.*\blength\b|^\b(shalwar|trouser|pajama|pyjama|pant|pants|bottom)\b$/i, 'trouser'],
    [/\b(sleeve|arm length)\b/i, 'sleeve'],
    [/\bshoulder\b/i, 'shoulder'],
    [/\b(chest|bust)\b/i, 'chest'],
    [/\b(waist|belly|stomach)\b/i, 'waist'],
    [/\b(hip|hips|seat)\b/i, 'hip'],
    [/\b(neck|collar)\b/i, 'neck'],
    [/\b(bicep|biceps|upper arm)\b/i, 'bicep'],
    [/\b(wrist|cuff)\b/i, 'wrist'],
    [/\b(armhole|arm hole)\b/i, 'armhole'],
    [/\bthigh\b/i, 'thigh'],
    [/\blength\b/i, 'length'],
];

/** A machine key takes precedence; normalize snake/kebab/camel-case before matching. */
export function measureHelp(key: string, label = ''): MeasureHelp | undefined {
    if (GUIDE[key]) return GUIDE[key];
    for (const candidate of [key, label]) {
        const normalized = candidate.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').trim();
        for (const [pattern, target] of ALIASES) if (pattern.test(normalized)) return GUIDE[target];
    }
    return undefined;
}
