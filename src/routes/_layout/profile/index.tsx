import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { UserProfile } from '@/features/profile';

export const Route = createFileRoute('/_layout/profile/')({
    component: ProfileIndexRoute,
});

function ProfileIndexRoute() {
    const navigate = useNavigate();
    useEffect(() => {
        navigate({ to: '/profile/$userId', params: { userId: 'me' }, replace: true });
    }, [navigate]);
    return <UserProfile userId="me" />;
}
