'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
/** Key changes invalidate old results; late responses cannot replace newer data. */
export function useResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>, initial?: T) {
    const loader = useRef(load);
    loader.current = load;
    const [revision, setRevision] = useState(0);
    const [state, setState] = useState<{
        key: string | null;
        data?: T;
        error?: Error;
        loading: boolean;
    }>({ key, data: initial, loading: !!key && initial === undefined });
    useEffect(() => {
        if (key === null) {
            setState({ key, data: undefined, loading: false });
            return;
        }
        const controller = new AbortController();
        const loadForThisKey = loader.current;
        let active = true;
        setState(prev => ({ key, data: prev.key === key ? prev.data : undefined, loading: true }));
        Promise.resolve().then(() => {
            if (!active) throw new DOMException('Request superseded', 'AbortError');
            return loadForThisKey(controller.signal);
        }).then(data => {
            if (active)
                setState({ key, data, loading: false });
        }).catch(error => {
            if (active && !controller.signal.aborted)
                setState({ key, loading: false, error: error instanceof Error ? error : new Error('Could not load data.') });
        });
        return () => { active = false; controller.abort(); };
    }, [key, revision]);
    const current = state.key === key ? state : { key, data: undefined, error: undefined, loading: !!key };
    const refresh = useCallback(() => setRevision(n => n + 1), []);
    return { ...current, refresh };
}
