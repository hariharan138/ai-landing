import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  healthApi,
  posSalesApi,
  tallyApi,
  type PosSalesParams,
  type TallyParams,
} from "../lib/api";
import { login, register, logout, getMe, sendOtp, verifyOtp, verifyEmail } from "../lib/auth";

// ── Query Keys ────────────────────────────────────────────
export const KEYS = {
  health: ["health"] as const,
  me: ["me"] as const,
  posSales: (p: PosSalesParams) => ["pos-sales", p] as const,
  tally: (p: TallyParams) => ["tally-vouchers", p] as const,
};

// ── Health ────────────────────────────────────────────────
export function useHealth() {
  return useQuery({
    queryKey: KEYS.health,
    queryFn: healthApi.check,
    refetchInterval: 30_000,
  });
}

// ── Auth ──────────────────────────────────────────────────
export function useMe() {
  return useQuery({
    queryKey: KEYS.me,
    queryFn: getMe,
    retry: false,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      full_name,
      email,
      password,
    }: {
      full_name: string;
      email: string;
      password: string;
    }) => register(full_name, email, password),
    onSuccess: (data) => {
      qc.setQueryData(KEYS.me, data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.clear();
    },
  });
}

export function useSendOtp() {
  return useMutation({
    mutationFn: ({ email, purpose }: { email: string; purpose: "login" | "verify" }) =>
      sendOtp(email, purpose),
  });
}

export function useVerifyOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      email,
      otp,
      purpose,
    }: {
      email: string;
      otp: string;
      purpose: "login" | "verify";
    }) => verifyOtp(email, otp, purpose),
    onSuccess: (data) => {
      qc.setQueryData(KEYS.me, data.user);
    },
  });
}

export function useVerifyEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) => verifyEmail(email, otp),
    onSuccess: (data) => {
      qc.setQueryData(KEYS.me, data.user);
    },
  });
}

// ── POS Sales ─────────────────────────────────────────────
export function usePosSales(params: PosSalesParams = {}) {
  return useQuery({
    queryKey: KEYS.posSales(params),
    queryFn: () => posSalesApi.list(params),
  });
}

// ── Tally Vouchers ────────────────────────────────────────
export function useTallyVouchers(params: TallyParams = {}) {
  return useQuery({
    queryKey: KEYS.tally(params),
    queryFn: () => tallyApi.list(params),
  });
}
