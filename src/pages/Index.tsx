import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import FilterBar from "@/components/FilterBar";
import ArticleCard from "@/components/ArticleCard";
import LoadingSkeletons from "@/components/LoadingSkeletons";
import EmptyState from "@/components/EmptyState";
import { Article } from "@/lib/constants";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const source = searchParams.get("source") || "Tout";
  const tagAnatomique = searchParams.get("anatomie") || "Tout";
  const tagContenu = searchParams.get("contenu") || "Tout";

  const updateFilter = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === "Tout") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  const fetchArticles = useCallback(
    async (cursor?: string) => {
      try {
        const { data, error } = await supabase.functions.invoke("notion-articles", {
          body: {
            start_cursor: cursor || undefined,
            source: source !== "Tout" ? source : undefined,
            tag_anatomique: tagAnatomique !== "Tout" ? tagAnatomique : undefined,
            tag_contenu: tagContenu !== "Tout" ? tagContenu : undefined,
          },
        });

        if (error) throw error;

        if (cursor) {
          setArticles((prev) => [...prev, ...data.articles]);
        } else {
          setArticles(data.articles);
        }
        setHasMore(data.has_more);
        setNextCursor(data.next_cursor);
      } catch (err) {
        console.error("Error fetching articles:", err);
      }
    },
    [source, tagAnatomique, tagContenu]
  );

  useEffect(() => {
    setLoading(true);
    fetchArticles().finally(() => setLoading(false));
  }, [fetchArticles]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    await fetchArticles(nextCursor);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-[68px]" />

      <FilterBar
        source={source}
        tagAnatomique={tagAnatomique}
        tagContenu={tagContenu}
        onSourceChange={(v) => updateFilter("source", v)}
        onTagAnatomiqueChange={(v) => updateFilter("anatomie", v)}
        onTagContenuChange={(v) => updateFilter("contenu", v)}
      />

      {loading ? (
        <LoadingSkeletons />
      ) : articles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4 px-4 pt-4">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="font-body text-[14px] bg-primary text-primary-foreground rounded-pill px-6 py-3 transition-opacity disabled:opacity-60"
              >
                {loadingMore ? "Chargement…" : "Charger plus"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
