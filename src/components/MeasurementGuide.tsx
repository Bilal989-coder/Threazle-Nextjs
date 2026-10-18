'use client';
import { useId, useState } from 'react';
import { Check, Lightbulb } from 'lucide-react';
import type { MeasurementFieldDef } from '@/types';
import { MEASURE_PREP, guideSteps, silhouetteFor } from '@/lib/measure-points';
import { safeImageSource } from '@/lib/config';
import { MeasurementCloseUp, MeasurementDiagram } from './measure/MeasurementDiagram';

/**
 * Visual measuring guide for one category: an annotated garment drawing with numbered points,
 * the matching step-by-step instructions, and a strip of close-ups. Fields, order, labels, units
 * and help text all come from the category's measurement fields configured by staff.
 */
export function MeasurementGuide({ fields, compact = false, categoryName = '' }: { fields: MeasurementFieldDef[]; compact?: boolean; categoryName?: string }) {
    const titleId = useId();
    const [active, setActive] = useState<number | undefined>();
    const silhouette = silhouetteFor(fields, categoryName);
    const steps = guideSteps(fields, silhouette);
    if (!steps.length) {
        return <p className='measure-note'>Measurement guidance for this garment is being prepared. Contact us and our tailor will help you measure.</p>;
    }
    return (
        <div className={`measure-guide ${compact ? 'measure-guide--compact' : ''}`}>
            <div className='measure-board'>
                <figure className='measure-figure'>
                    <MeasurementDiagram steps={steps} silhouette={silhouette} active={active} onActivate={setActive} label={`${categoryName || 'Garment'} measuring points, numbered 1 to ${steps.length}`} />
                    <figcaption>Tap a number to see where to measure.</figcaption>
                </figure>
                <section className='measure-details' aria-labelledby={titleId}>
                    <h3 id={titleId}>Measurement details</h3>
                    <ol className='measure-detail-list'>
                        {steps.map(step => (
                            <li
                                key={step.field.key}
                                className={active === step.number ? 'is-active' : undefined}
                                onMouseEnter={() => setActive(step.number)}
                                onMouseLeave={() => setActive(undefined)}
                                onFocus={() => setActive(step.number)}
                                onBlur={() => setActive(undefined)}
                                tabIndex={0}
                            >
                                <span className='measure-num' aria-hidden='true'>{step.number}</span>
                                <div>
                                    <h4>{step.field.label}<span>{step.field.unit === 'cm' ? 'centimetres' : 'inches'}</span></h4>
                                    <p>{step.instruction}</p>
                                    {step.tip && <p className='measure-tip'><Lightbulb size={13} aria-hidden='true' />{step.tip}</p>}
                                    {step.field.min != null && step.field.max != null && <small>Usual range {step.field.min}–{step.field.max} {step.field.unit}</small>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
            <ul className='measure-strip' aria-label='Close-up of each measuring point'>
                {steps.map(step => {
                    const photo = step.field.image ? safeImageSource(step.field.image) : '';
                    const closeUp = photo && !photo.endsWith('placeholder.svg')
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={photo} alt='' loading='lazy' />
                        : <MeasurementCloseUp step={step} silhouette={silhouette} />;
                    return (
                        <li key={step.field.key} className={active === step.number ? 'is-active' : undefined} onMouseEnter={() => setActive(step.number)} onMouseLeave={() => setActive(undefined)}>
                            <span className='measure-strip-art'>{closeUp ?? <span className='measure-strip-empty'>{step.number}</span>}</span>
                            <span className='measure-strip-label'><span className='measure-num' aria-hidden='true'>{step.number}</span>{step.field.label}</span>
                        </li>
                    );
                })}
            </ul>
            <section className='measure-prep' aria-label='Before you begin'>
                <h3>Before you begin</h3>
                <ul>{MEASURE_PREP.map(tip => <li key={tip}><Check size={15} aria-hidden='true' />{tip}</li>)}</ul>
            </section>
            <p className='measure-note'>These are <strong>body measurements</strong>. Don’t add extra room: our tailor adds the right ease for each design. Unsure about a point? Contact us before ordering.</p>
        </div>
    );
}
