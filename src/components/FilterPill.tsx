import { getSourceLogo } from "@/lib/constants";

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  variant: "source" | "anatomique" | "contenu";
  showLogo?: boolean;
}

const FilterPill = ({ label, active, onClick, variant, showLogo }: FilterPillProps) => {
  const logoSrc = getSourceLogo(label);

  const activeClasses = {
    source: "bg-primary text-primary-foreground border-transparent",
    anatomique: "bg-accent-anatomique text-accent-anatomique-foreground border-transparent",
    contenu: "bg-accent-contenu text-accent-contenu-foreground border-transparent",
  };

  const inactiveClass = "bg-card text-secondary border border-border";

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-3.5 py-2 text-[13px] font-body transition-colors shrink-0 ${
        active ? activeClasses[variant] : inactiveClass
      }`}
    >
      {showLogo && label !== "Tout" && logoSrc && (
        <img
          src={logoSrc}
          alt=""
          className="w-4 h-4 rounded-full object-cover"
        />
      )}
      {label}
    </button>
  );
};

export default FilterPill;
