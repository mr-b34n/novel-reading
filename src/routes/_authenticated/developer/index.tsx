import { createFileRoute } from '@tanstack/react-router'

const Developer = () => {

	return (
		<div>Developer</div>
	)
}
export const Route = createFileRoute('/_authenticated/developer/')({
	component: Developer,
})

