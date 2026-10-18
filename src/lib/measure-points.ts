/**
 * Measurement points shown on the size guide diagram.
 *
 * A category's measurement fields (configured by staff in the admin) are mapped onto these points
 * by key, so the guide can number and highlight each one on the garment drawing. Field keys that
 * are not recognised are still listed (with the staff-written help text), just without a marker.
 */
import type { MeasurementFieldDef } from '@/types';

export type MeasurePoint = 'neck' | 'shoulder' | 'chest' | 'waist' | 'hip' | 'sleeve' | 'garmentLength' | 'bottomWaist' | 'bottomLength';
export type Silhouette = 'kameez' | 'sherwani' | 'coat' | 'waistcoat';

const POINT_BY_KEY: Record<string, MeasurePoint> = {
    neck: 'neck', collar: 'neck', neckcollar: 'neck',
    shoulder: 'shoulder', shoulders: 'shoulder',
    chest: 'chest',
    waist: 'waist', stomach: 'waist', belly: 'waist',
    hip: 'hip', hips: 'hip', seat: 'hip',
    sleeve: 'sleeve', sleevelength: 'sleeve', armlength: 'sleeve',
    length: 'garmentLength', kameezlength: 'garmentLength', qameezlength: 'garmentLength', kurtalength: 'garmentLength', dresslength: 'garmentLength',
    sherwanilength: 'garmentLength', coatlength: 'garmentLength', waistcoatlength: 'garmentLength', jacketlength: 'garmentLength',
    shalwarwaist: 'bottomWaist', trouserwaist: 'bottomWaist', pajamawaist: 'bottomWaist', bottomwaist: 'bottomWaist',
    shalwarlength: 'bottomLength', trouserlength: 'bottomLength', pajamalength: 'bottomLength', bottomlength: 'bottomLength',
};

/** Which drawing point a field belongs to (by key; case, underscores and hyphens are ignored). */
export function pointForField(field: Pick<MeasurementFieldDef, 'key'>): MeasurePoint | undefined {
    return POINT_BY_KEY[field.key.toLowerCase().replace(/[^a-z]/g, '')];
}

/** The garment drawing that fits a category, chosen from its configured fields (then its name). */
export function silhouetteFor(fields: MeasurementFieldDef[], categoryName = ''): Silhouette {
    const keys = fields.map(field => field.key.toLowerCase().replace(/[^a-z]/g, ''));
    const name = categoryName.toLowerCase();
    if (keys.includes('sherwanilength') || /sherwani|achkan/.test(name)) return 'sherwani';
    if (keys.includes('waistcoatlength') || /waistcoat|vest|jacket/.test(name)) return 'waistcoat';
    if (keys.includes('coatlength') || /hyderabadi|coat|suit/.test(name)) return 'coat';
    return 'kameez';
}

const GARMENT_WORD: Record<Silhouette, string> = { kameez: 'kameez', sherwani: 'sherwani', coat: 'coat', waistcoat: 'waistcoat' };
const BOTTOM_WORD: Record<Silhouette, string> = { kameez: 'shalwar', sherwani: 'trouser', coat: 'trouser', waistcoat: 'trouser' };

/** Clear, step-by-step instructions for each point (used when staff have not written their own). */
export function pointInstruction(point: MeasurePoint, silhouette: Silhouette): string {
    const garment = GARMENT_WORD[silhouette], bottom = BOTTOM_WORD[silhouette];
    switch (point) {
        case 'neck': return 'Wrap the measuring tape around the base of your neck, where the collar sits. Keep one finger under the tape so it is comfortable, not tight.';
        case 'shoulder': return 'Measure across your back from one shoulder point to the other, where the arm meets the shoulder.';
        case 'chest': return 'Measure around the fullest part of your chest, under the armpits and across the shoulder blades. Keep the tape level.';
        case 'waist': return 'Measure around your natural waist (just above the navel) without pulling the tape tight or holding your breath.';
        case 'hip': return 'Stand with your feet together and measure around the fullest part of your hips and seat.';
        case 'sleeve': return 'With your arm relaxed at your side, measure from the shoulder point down to where you want the sleeve to end, usually the wrist bone.';
        case 'garmentLength': return `Measure from the highest point of your shoulder, beside the neck, straight down the front to where you want the ${garment} to end.`;
        case 'bottomWaist': return `Measure around your natural waist where the ${bottom} will be tied or fastened.`;
        case 'bottomLength': return `Measure from your waistline straight down the outside of the leg to where you want the ${bottom} to end, usually the ankle.`;
    }
}

/** Short tip under each instruction. */
export const POINT_TIP: Partial<Record<MeasurePoint, string>> = {
    neck: 'Measure over the Adam’s apple.',
    shoulder: 'Ask someone to help: this one is hard to measure on yourself.',
    chest: 'Breathe normally; don’t puff out your chest.',
    waist: 'Don’t pull your stomach in.',
    hip: 'Keep the tape parallel to the floor.',
    sleeve: 'Keep a slight bend at the elbow for a natural length.',
    garmentLength: 'Stand straight and look ahead while someone measures.',
    bottomLength: 'Wear the shoes you’ll wear with the outfit.',
};

export const MEASURE_PREP = [
    'Use a soft tailor’s tape, not a metal one.',
    'Wear a thin kurta or shirt, not a jacket.',
    'Stand straight and relaxed, arms at your sides.',
    'Keep the tape level and snug, never tight.',
    'Measure twice. If the numbers differ, measure again.',
];

export interface GuideStep {
    number: number;
    field: MeasurementFieldDef;
    point?: MeasurePoint;
    instruction: string;
    tip?: string;
}

/** Numbered steps for a category, in the order staff configured the fields. */
export function guideSteps(fields: MeasurementFieldDef[], silhouette: Silhouette): GuideStep[] {
    return fields.map((field, index) => {
        const point = pointForField(field);
        return {
            number: index + 1,
            field,
            point,
            instruction: field.helpText?.trim() || (point ? pointInstruction(point, silhouette) : 'Measure this point as described by our tailor, then enter the result in the unit shown.'),
            tip: field.helpText?.trim() ? undefined : point ? POINT_TIP[point] : undefined,
        };
    });
}
