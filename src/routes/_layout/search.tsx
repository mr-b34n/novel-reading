import { createFileRoute } from '@tanstack/react-router';
import { SearchResultsPage } from '@/features/search';
import { z } from 'zod';

const searchSchema = z.object({
    q: z.string().optional().catch(''),
    tab: z.enum(['all', 'games', 'communities', 'posts', 'users']).optional().catch('all'),
    type: z.enum(['all', 'games', 'communities', 'posts', 'users']).optional().catch('all'),
    page: z.number().optional().catch(1),
    size: z.number().optional().catch(10),
});

export const Route = createFileRoute('/_layout/search')({
    validateSearch: searchSchema,
    component: SearchResultsPage,
});
