import { createFileRoute } from '@tanstack/react-router'
import { ExplorePage } from '@/features/explore/components/ExplorePage'

export const Route = createFileRoute('/_layout/explore')({
    component: ExplorePage,
})
