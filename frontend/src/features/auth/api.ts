import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAdapter } from '@/lib/headless';
import { queryKeys } from '@/lib/query/keys';

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.me,
    enabled,
    queryFn: async () => {
      const res = await authAdapter.me();
      return res;
    },
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const res = await authAdapter.login(payload);
      return res;
    },
  });
}

export function useSocialProvidersQuery() {
  return useQuery({
    queryKey: ['auth', 'socialProviders'],
    queryFn: async () => {
      const providers = await authAdapter.socialProviders();
      return providers as string[];
    },
  });
}

export function getSocialLoginRedirectUrl(provider: string) {
  return authAdapter.socialLoginRedirectUrl(provider);
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string; password_confirmation: string }) => {
      const res = await authAdapter.register(payload);
      return res;
    },
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await authAdapter.logout();
      return res;
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { email: string }) => {
      const res = await authAdapter.forgotPassword(payload);
      return res;
    },
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { token: string; email: string; password: string; password_confirmation: string }) => {
      const res = await authAdapter.resetPassword(payload);
      return res;
    },
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; email: string; phone?: string }) => {
      const res = await authAdapter.updateProfile(payload);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (payload: { current_password: string; password: string; password_confirmation: string }) => {
      const res = await authAdapter.changePassword(payload);
      return res;
    },
  });
}

export function useUploadAvatarMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const res = await authAdapter.uploadAvatar(file);
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.auth.me }),
  });
}
