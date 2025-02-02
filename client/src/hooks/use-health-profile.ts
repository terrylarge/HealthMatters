import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, InsertHealthProfile, LabResult } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

export function useHealthProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery<HealthProfile | null>({
    queryKey: ['/api/health-profile'],
    staleTime: 0, // Allow refetching to get fresh data
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when window gets focus
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertHealthProfile>) => {
      const response = await fetch('/api/health-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { ok: false, message: result.message || 'Failed to update profile' };
      }

      return { ok: true, data: result };
    },
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ['/api/health-profile'] });
        toast({
          title: "Success",
          description: "Health profile updated successfully",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const uploadLabResults = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/lab-results', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/lab-results'] });
      toast({
        title: "Success",
        description: "Lab results uploaded and analyzed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const { data: labResults = [] } = useQuery<LabResult[]>({
    queryKey: ['/api/lab-results'],
    enabled: !!profile,
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: mutation.mutateAsync,
    uploadLabResults: uploadLabResults.mutateAsync,
    isUploading: uploadLabResults.isPending,
    labResults,
  };
}
