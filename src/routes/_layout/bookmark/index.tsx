import { createFileRoute } from '@tanstack/react-router'
import { useTheme } from '@/shared/hooks/useTheme';
import { BookmarkList } from '@/features/bookmark';

const Bookmark = () => {
	useTheme("Bookmark");

	return <BookmarkList />;
}

export const Route = createFileRoute('/_layout/bookmark/')(
	{ component: Bookmark }
)