import { createFileRoute } from '@tanstack/react-router';
import { useTheme } from '@/shared/hooks/useTheme';
import { CommunityList } from '@/features/community';

const Community = () => {
    useTheme("Community");

    return (
        <CommunityList />
    );
};

export const Route = createFileRoute('/_layout/community/')({
    component: Community,
});

