export const SOURCE_LOGOS: Record<string, string> = {
  Kinesport: "/logos/kinesport.jpg",
  "Physio-Network": "/logos/physio-network.jpg",
  KinéauTop: "/logos/kineautop.jpg",
  "Training Thérapie": "/logos/training-therapie.png",
  Physiotutors: "/logos/physiotutors.png",
};

export const SOURCES = [
  "Tout",
  "Kinesport",
  "Physio-Network",
  "KinéauTop",
  "Training Thérapie",
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
