export function AppHeader({ orgName, userEmail }: { orgName: string; userEmail: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="font-semibold">{orgName}</div>
        <div className="text-sm text-muted-foreground">{userEmail}</div>
      </div>
    </header>
  );
}
