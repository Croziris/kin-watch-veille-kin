const ArticleSkeleton = () => (
  <div className="bg-card rounded-card shadow-card overflow-hidden animate-pulse-soft">
    <div className="w-full h-[180px] bg-muted" />
    <div className="px-4 py-3.5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-3 w-24 bg-muted rounded" />
        <div className="h-7 w-7 bg-muted rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-16 bg-muted rounded-pill" />
        <div className="h-5 w-20 bg-muted rounded-pill" />
      </div>
    </div>
  </div>
);

const LoadingSkeletons = () => (
  <div className="space-y-4 px-4 pt-4">
    <ArticleSkeleton />
    <ArticleSkeleton />
    <ArticleSkeleton />
  </div>
);

export default LoadingSkeletons;
