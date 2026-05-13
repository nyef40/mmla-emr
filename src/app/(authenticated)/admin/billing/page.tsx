"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminBillingRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/billing/claims"); }, [router]);
  return null;
}
