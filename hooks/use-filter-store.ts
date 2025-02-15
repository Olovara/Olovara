// Corrected use-filter-store.ts
import { ProductFilters } from '@/types'
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type FilterState = {
    filters: ProductFilters;
    setFilters: (filterName: keyof FilterState['filters'], value: any) => void;
}

const useFilterStore = create<FilterState>()(devtools((set) => ({
    filters: {
        priceRange: [5, 1000],
        category: [],  // Initialize category as an empty array
        orderBy: 'updated',
    },
    setFilters: (filterName, value) => set(state => {
        return {
            filters: { ...state.filters, [filterName]: value }
        }
    })
})))

export default useFilterStore;
