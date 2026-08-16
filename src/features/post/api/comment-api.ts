import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type CommentData } from '../components/CommentSection';

// Mock API functions
const fetchComments = async (postId: string): Promise<CommentData[]> => {
  // In a real app, this would be an actual API call
  return JSON.parse(localStorage.getItem(`comments-${postId}`) || '[]');
};

const saveComment = async (postId: string, comment: CommentData): Promise<void> => {
  const comments = await fetchComments(postId);
  localStorage.setItem(`comments-${postId}`, JSON.stringify([...comments, comment]));
};

export const useComments = (postId: string) => {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  });
};

export const useAddComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: CommentData) => saveComment(postId, comment),
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] });
      const previousComments = queryClient.getQueryData(['comments', postId]);
      queryClient.setQueryData(['comments', postId], (old: CommentData[] | undefined) => [...(old || []), newComment]);
      return { previousComments };
    },
    onError: (err, newComment, context) => {
      queryClient.setQueryData(['comments', postId], context?.previousComments);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });
};
