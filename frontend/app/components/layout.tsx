import { AppHeader } from "~/components/header";
import { verifyAuth } from "~/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { userInfo } = verifyAuth();
  const orgName = userInfo?.organization?.name ?? "Organization";
  const userEmail = userInfo?.email ?? "";

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader orgName={orgName} userEmail={userEmail} />
      <main className="container mx-auto w-full flex-1 p-4">
        {children}
      </main>
    </div>
  );
}

