import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useLikeInteraction = (postId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (liked: boolean) => {
      // Mock API call
      console.log(`Post ${postId} liked: ${liked}`);
      return liked;
    },
    onMutate: async (liked) => {
      // Optimistic update logic could go here if posts were also in React Query
      return { liked };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });
};

export const useBookmarkInteraction = (postId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookmarked: boolean) => {
      // Mock API call
      console.log(`Post ${postId} bookmarked: ${bookmarked}`);
      return bookmarked;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
};
