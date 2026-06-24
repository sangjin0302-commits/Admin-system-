export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold" />
        <p className="font-serif text-sm tracking-wider text-text-muted">Loading...</p>
      </div>
    </div>
  );
}
