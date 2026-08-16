import { useAuthStore } from '@/features/auth';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'


export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ location }) => {

        const waitForAuthChecked = () => {
            return new Promise<void>((resolve) => {
                if (!useAuthStore.getState().loading) {
                    resolve();
                    return;
                }

                const unsub = useAuthStore.subscribe((state) => {
                    if (!state.loading) {
                        unsub();
                        resolve();
                    }
                });
            });
        }

        await waitForAuthChecked();

        const { user } = useAuthStore.getState();

        if (!user) {
            throw redirect({
                to: '/auth',
                search: {
                    redirect: location.href
                }
            })
        }
    },
    component: () => <Outlet />,
})