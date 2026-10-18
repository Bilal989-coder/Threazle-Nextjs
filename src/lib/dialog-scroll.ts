/** A DOM-side lock shared by native dialogs. Nothing runs during server rendering. */
const locks = new WeakMap<Document, { count: number; overflow: string }>();
export function lockDialogScroll(document: Document): () => void {
    const state = locks.get(document) || { count: 0, overflow: document.body.style.overflow };
    state.count += 1;
    locks.set(document, state);
    document.body.style.overflow = 'hidden';
    let released = false;
    return () => {
        if (released) return;
        released = true;
        state.count -= 1;
        if (state.count === 0) {
            document.body.style.overflow = state.overflow;
            locks.delete(document);
        }
    };
}
