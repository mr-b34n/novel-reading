import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/shared/hooks/useTheme';
import { FeedList } from '@/features/feed';

const Home = () => {
	useTheme("Home");

	return <FeedList />;
}

export const Route = createFileRoute('/_layout/')(
	{ component: Home }
)