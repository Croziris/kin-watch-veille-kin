import { SearchX } from "lucide-react";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <SearchX className="w-12 h-12 text-secondary mb-4" />
    <p className="font-display font-semibold text-foreground text-lg">
      Aucun article trouvé
    </p>
    <p className="font-body text-secondary text-sm mt-1 text-center">
      Essayez de modifier vos filtres pour voir plus de résultats.
    </p>
  </div>
);

export default EmptyState;
