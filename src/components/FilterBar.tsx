import FilterPill from "./FilterPill";
import { SOURCES, TAGS_ANATOMIQUE, TAGS_CONTENU } from "@/lib/constants";

interface FilterBarProps {
  source: string;
  tagAnatomique: string;
  tagContenu: string;
  onSourceChange: (v: string) => void;
  onTagAnatomiqueChange: (v: string) => void;
  onTagContenuChange: (v: string) => void;
}

const FilterRow = ({
  label,
  items,
  active,
  onChange,
  variant,
  showLogo,
}: {
  label: string;
  items: string[];
  active: string;
  onChange: (v: string) => void;
  variant: "source" | "anatomique" | "contenu";
  showLogo?: boolean;
}) => (
  <div className="py-1.5">
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4">
      <span className="text-[12px] font-body text-secondary shrink-0">{label}</span>
      {items.map((item) => (
        <FilterPill
          key={item}
          label={item}
          active={active === item}
          onClick={() => onChange(item)}
          variant={variant}
          showLogo={showLogo}
        />
      ))}
    </div>
  </div>
);

const FilterBar = ({
  source,
  tagAnatomique,
  tagContenu,
  onSourceChange,
  onTagAnatomiqueChange,
  onTagContenuChange,
}: FilterBarProps) => {
  return (
    <div className="sticky top-[68px] z-40 bg-background border-b border-border pb-1.5 pt-1">
      <FilterRow
        label="Source :"
        items={SOURCES}
        active={source}
        onChange={onSourceChange}
        variant="source"
        showLogo
      />
      <FilterRow
        label="Anatomie :"
        items={TAGS_ANATOMIQUE}
        active={tagAnatomique}
        onChange={onTagAnatomiqueChange}
        variant="anatomique"
      />
      <FilterRow
        label="Contenu :"
        items={TAGS_CONTENU}
        active={tagContenu}
        onChange={onTagContenuChange}
        variant="contenu"
      />
    </div>
  );
};

export default FilterBar;
