import { ImageIcon } from "lucide-react";
import { Article, SOURCE_LOGOS } from "@/lib/constants";

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const months = [
    "Jan.", "Fév.", "Mars", "Avr.", "Mai", "Juin",
    "Juil.", "Août", "Sep.", "Oct.", "Nov.", "Déc.",
  ];
  const day = date.getDate().toString().padStart(2, "0");
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const ArticleCard = ({ article }: { article: Article }) => {
  const logoSrc = SOURCE_LOGOS[article.auteur];

  return (
    <a
      href={article.lien}
      target="_blank"
      rel="noopener noreferrer"
      className="block card-press animate-fade-in"
    >
      <div className="bg-card rounded-card shadow-card overflow-hidden">
        {/* Cover image */}
        {article.image_url ? (
          <img
            src={article.image_url}
            alt=""
            className="w-full h-[180px] object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        {!article.image_url && (
          <div className="w-full h-[180px] bg-muted flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-secondary" />
          </div>
        )}
        {/* Hidden placeholder for broken images */}
        {article.image_url && (
          <div className="hidden w-full h-[180px] bg-muted flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-secondary" />
          </div>
        )}

        {/* Card body */}
        <div className="px-4 py-3.5">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <span className="font-body text-[12px] text-secondary">
              {formatDate(article.date_publication)}
            </span>
            {logoSrc && (
              <img
                src={logoSrc}
                alt={article.auteur}
                className="w-7 h-7 rounded-full border border-border object-cover"
              />
            )}
          </div>

          {/* Title */}
          <h2 className="font-display font-semibold text-[16px] leading-[1.4] text-foreground mt-2 line-clamp-3">
            {article.titre}
          </h2>

          {/* Tags */}
          {(article.tags_anatomique.length > 0 || article.tags_contenu.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {article.tags_anatomique.map((tag) => (
                <span
                  key={tag}
                  className="inline-block font-body text-[11px] bg-accent-anatomique text-accent-anatomique-foreground px-2.5 py-1 rounded-pill"
                >
                  {tag}
                </span>
              ))}
              {article.tags_contenu.map((tag) => (
                <span
                  key={tag}
                  className="inline-block font-body text-[11px] bg-accent-contenu text-accent-contenu-foreground px-2.5 py-1 rounded-pill"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;
