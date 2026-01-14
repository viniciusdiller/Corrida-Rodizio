export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-full" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Sintonizando arena...
        </span>
      </div>
    </div>
  );
}
