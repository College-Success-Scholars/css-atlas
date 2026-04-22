import React from 'react'
import { redirect } from 'next/navigation';
import { backendGet } from '@/lib/server/api-client';

export default async function MemoLayout({ children }: { children: React.ReactNode }) {
  // Backend checks team_leader+ role
  const result = await backendGet("/api/auth/me").catch(() => null);
  if (!result) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
