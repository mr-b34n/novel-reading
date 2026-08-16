import { createFileRoute } from '@tanstack/react-router';
import { useTheme } from '@/shared/hooks/useTheme';
import { SquadList } from '@/features/squad';

const SquadPage = () => {
    useTheme("Squad");

    return <SquadList />;
};

export const Route = createFileRoute('/_layout/squad/')(
    { component: SquadPage }
);
