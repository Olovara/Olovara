import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, ChangeEvent, useTransition } from 'react';
import useFilterStore from './useFilterStore';
import { Selection } from '@nextui-org/react';
import usePaginationStore from './usePaginationStore';

export const useFilters = () => {
    const pathname = usePathname();
    const router = useRouter();

    const { filters, setFilters } = useFilterStore();

    const { pageNumber, pageSize, setPage, totalCount } = usePaginationStore(state => ({
        pageNumber: state.pagination.pageNumber,
        pageSize: state.pagination.pageSize,
        setPage: state.setPage,
        totalCount: state.pagination.totalCount
    }))


    const { category, ageRange, orderBy, withPhoto } = filters;

    const [isPending, startTransition] = useTransition();


    useEffect(() => {
        if (category || ageRange || orderBy || withPhoto) {
            setPage(1);
        }
    }, [category, ageRange, orderBy, setPage, withPhoto])

    useEffect(() => {
        startTransition(() => {
            const searchParams = new URLSearchParams();

            if (category) searchParams.set('gender', category.join(','));
            if (ageRange) searchParams.set('ageRange', ageRange.toString());
            if (orderBy) searchParams.set('orderBy', orderBy);
            if (pageSize) searchParams.set('pageSize', pageSize.toString());
            if (pageNumber) searchParams.set('pageNumber', pageNumber.toString());
            searchParams.set('withPhoto', withPhoto.toString());

            router.replace(`${pathname}?${searchParams}`);
        })
    }, [ageRange, orderBy, category, router, pathname, withPhoto, pageNumber, pageSize])

    const orderByList = [
        { label: 'Lowest Price', value: 'updated' },
        { label: 'Highest Price', value: 'created' },
        { label: 'Newest', value: 'created' },
    ]

    const categoryList = [
        { value: 'male', icon: FaMale },
        { value: 'female', icon: FaFemale },
    ]

    const handleAgeSelect = (value: number[]) => {
        setFilters('ageRange', value);
    }

    const handleOrderSelect = (value: Selection) => {
        if (value instanceof Set) {
            setFilters('orderBy', value.values().next().value);
        }
    }

    const handleGenderSelect = (value: string) => {
        if (category.includes(value)) setFilters('gender', category.filter(categoryValue => categoryValue !== value));
        else setFilters('gender', [...category, value]);
    }

    const handleWithPhotoToggle = (e: ChangeEvent<HTMLInputElement>) => {
        setFilters('withPhoto', e.target.checked);
    }

    return {
        orderByList,
        categoryList,
        selectAge: handleAgeSelect,
        selectGender: handleGenderSelect,
        selectOrder: handleOrderSelect,
        selectWithPhoto: handleWithPhotoToggle,
        filters,
        totalCount,
        isPending
    }
}