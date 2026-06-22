import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedShell>
      <Card className="w-full min-h-0 flex flex-col">
        <CardContent className="flex-1 pt-4 sm:pt-6 px-3 sm:px-6">{children}</CardContent>
      </Card>
    </ProtectedShell>
  );
}
