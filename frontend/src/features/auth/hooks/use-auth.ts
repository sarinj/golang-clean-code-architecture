"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { getProfile, login, logout, register } from "@/features/auth/api/auth";
import { profileKey } from "@/features/auth/api/queryKeys";
import { errorMessage } from "@/lib/api/error";

export function useProfile() {
  return useQuery({
    queryKey: profileKey,
    queryFn: ({ signal }) => getProfile(signal),
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      queryClient.clear();
      queryClient.setQueryData(profileKey, user);
      router.replace("/dashboard");
      router.refresh();
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success("Your account is ready. Sign in to continue.");
      router.replace("/login?registered=1");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
      toast.success("You have signed out.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
