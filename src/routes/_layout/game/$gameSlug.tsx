import { createFileRoute } from '@tanstack/react-router'
import { GameDetail } from '@/features/game'

const GamePage = () => {
	const { gameSlug } = Route.useParams();

	return (
		<div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4">
			<GameDetail slug={gameSlug} />
		</div>
	)
}

export const Route = createFileRoute('/_layout/game/$gameSlug')({
	component: GamePage,
})

