// Corrected use-filter-store.ts
import { ProductFilters } from '@/types'
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type FilterState = {
    filters: ProductFilters;
    setFilters: (filterName: keyof FilterState['filters'], value: any) => void;
    resetFilters: () => void;
}

const useFilterStore = create<FilterState>()(devtools((set) => ({
    filters: {
        priceRange: [5, 1000],
        category: [],  // This will store category IDs
        orderBy: 'updatedAt_desc',
    },
    setFilters: (filterName, value) => set(state => {
        return {
            filters: { ...state.filters, [filterName]: value }
        }
    }),
    // Add a reset function
    resetFilters: () => set({
        filters: {
            priceRange: [5, 1000],
            category: [],
            orderBy: 'updatedAt_desc'
        }
    })
})))

export default useFilterStore;
