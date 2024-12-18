import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthProfile, InsertHealthProfile } from "@db/schema";
import { useToast } from '@/hooks/use-toast';

export function useHealthProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<HealthProfile | null>({
    queryKey: ['/api/health-profile'],
    staleTime: Infinity,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<InsertHealthProfile>) => {
      const response = await fetch('/api/health-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/health-profile'] });
      toast({
        title: "Success",
        description: "Health profile updated successfully",
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

  const { data: labResults = [] } = useQuery({
    queryKey: ['/api/lab-results'],
    enabled: !!profile,
  });

  return {
    profile,
    isLoading,
    updateProfile: mutation.mutateAsync,
    uploadLabResults: uploadLabResults.mutateAsync,
    isUploading: uploadLabResults.isPending,
    labResults,
  };
}
