export interface PaginatedResult<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}
export interface ApiError {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string>;
}
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'best_selling';
export const SORT_OPTIONS: {
    value: SortOption;
    label: string;
}[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'best_selling', label: 'Best Selling' },
];
