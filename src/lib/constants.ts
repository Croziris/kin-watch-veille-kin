export const SOURCE_LOGOS: Record<string, string> = {
  Kinesport: "/logos/kinesport.jpg",
  "Physio-Network": "/logos/physio-network.jpg",
  KineauTop: "/logos/kineautop.jpg",
  "Training Therapie": "/logos/training-therapie.png",
  Physiotutors: "/logos/physiotutors.png",
};

const normalizeSourceKey = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const canonicalSourceKey = (value: string): string =>
  normalizeSourceKey(value).replace(/[^a-z0-9]/g, "");

export const getSourceLogo = (source: string): string | undefined => {
  if (!source) return undefined;

  if (SOURCE_LOGOS[source]) {
    return SOURCE_LOGOS[source];
  }

  const normalized = normalizeSourceKey(source);
  const canonical = canonicalSourceKey(source);

  const directMatch = Object.entries(SOURCE_LOGOS).find(
    ([key]) =>
      normalizeSourceKey(key) === normalized || canonicalSourceKey(key) === canonical
  );

  return directMatch?.[1];
};

export const SOURCES = [
  "Tout",
  "Kinesport",
  "Physio-Network",
  "KineauTop",
  "Training Therapie",
  "Physiotutors",
];

export const TAGS_ANATOMIQUE = [
  "Tout",
  "Rachis",
  "Épaule",
  "Coude / Poignet / Main",
  "Hanche / Bassin",
  "Genou",
  "Cheville / Pied",
  "Muscle",
];

export const TAGS_CONTENU = [
  "Tout",
  "Technique",
  "Bilan / Évaluation",
  "Rééducation",
  "Prévention",
  "Revue de littérature",
  "Nutrition / Récupération",
  "Pratique pro",
];

export const getSourceDisplayName = (source: string): string => {
  if (!source) return "";

  if (SOURCE_LOGOS[source]) {
    return source;
  }

  const normalized = normalizeSourceKey(source);
  const canonical = canonicalSourceKey(source);

  const directMatch = Object.keys(SOURCE_LOGOS).find(
    (key) =>
      normalizeSourceKey(key) === normalized || canonicalSourceKey(key) === canonical
  );

  return directMatch || source;
};

export interface Article {
  id: string;
  titre: string;
  auteur: string;
  date_publication: string | null;
  lien: string;
  image_url: string | null;
  tags_anatomique: string[];
  tags_contenu: string[];
}
