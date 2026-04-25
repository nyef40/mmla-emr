import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-8 w-8" />
            <CardTitle className="text-2xl">403 Forbidden</CardTitle>
          </div>
          <CardDescription>You don&apos;t have permission to access this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/home">Back to Home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Sign in with a different account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
