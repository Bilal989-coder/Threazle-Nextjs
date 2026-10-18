import type { Category } from '@/types';

export interface NavigationCollection {
    category: Category;
    children: Category[];
}

/** Root categories and real child links; never duplicate every child as a root. */
export function navigationCollections(categories: Category[]): NavigationCollection[] {
    const unique = [...new Map(categories.filter(c => c.id && c.slug).map(c => [c.id, c])).values()];
    const ids = new Set(unique.map(c => c.id));
    const sorted = [...unique].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    return sorted.filter(c => !c.parentId || !ids.has(c.parentId)).map(category => ({
        category,
        children: sorted.filter(c => c.parentId === category.id && c.id !== category.id),
    }));
}

export function badgeCount(count: number): string {
    const safe = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
    return safe > 99 ? '99+' : String(safe);
}

export function searchHref(query: string): string | null {
    const value = query.trim().slice(0, 150);
    return value ? `/search?q=${encodeURIComponent(value)}` : null;
}
