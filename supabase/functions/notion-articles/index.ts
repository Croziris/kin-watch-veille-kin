import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const DATABASE_ID = "30b5bbbcdf1780298c67e585f3c49cdc";
const NOTION_VERSION = "2022-06-28";

interface NotionTextFragment {
  plain_text?: string | null;
}

interface NotionSelectOption {
  name?: string | null;
}

interface NotionPropertyValue {
  type?: string;
  title?: NotionTextFragment[];
  rich_text?: NotionTextFragment[];
  select?: NotionSelectOption | null;
  date?: { start?: string | null } | null;
  url?: string | null;
  multi_select?: NotionSelectOption[];
}

interface NotionDatabaseProperty {
  type?: string;
  multi_select?: {
    options?: NotionSelectOption[];
  };
}

interface ArticlePayload {
  id: string;
  titre: string;
  auteur: string;
  date_publication: string | null;
  lien: string;
  image_url: string | null;
  tags_anatomique: string[];
  tags_contenu: string[];
}

const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const canonicalText = (value: string): string =>
  normalizeText(value).replace(/[^a-z0-9]/g, "");

const extractTitleValue = (property?: NotionPropertyValue): string =>
  property?.title?.[0]?.plain_text?.trim() || "";

const extractTextValue = (property?: NotionPropertyValue): string =>
  property?.rich_text?.[0]?.plain_text?.trim() || property?.select?.name?.trim() || "";

const extractDateValue = (property?: NotionPropertyValue): string | null =>
  property?.date?.start || null;

const extractUrlValue = (property?: NotionPropertyValue): string =>
  property?.url?.trim() || "";

const findPropertyName = (
  properties: Record<string, NotionDatabaseProperty>,
  preferredNames: string[],
  keywords: string[],
  types: string[]
): string | undefined => {
  for (const name of preferredNames) {
    const prop = properties[name];
    if (prop && types.includes(prop.type || "")) {
      return name;
    }
  }

  const canonicalKeywords = keywords.map(canonicalText);
  for (const [name, prop] of Object.entries(properties)) {
    if (!types.includes(prop.type || "")) continue;
    const candidate = canonicalText(name);
    if (canonicalKeywords.every((kw) => candidate.includes(kw))) {
      return name;
    }
  }

  return undefined;
};

const resolveMultiSelectOption = (requested: string, options: NotionSelectOption[]): string => {
  const cleanRequested = requested.trim();
  if (!cleanRequested || options.length === 0) return cleanRequested;

  const exact = options.find((option) => option.name === cleanRequested)?.name;
  if (exact) return exact;

  const normalizedRequested = normalizeText(cleanRequested);
  const normalizedMatch = options.find(
    (option) => normalizeText(option.name || "") === normalizedRequested
  )?.name;
  if (normalizedMatch) return normalizedMatch;

  const canonicalRequested = canonicalText(cleanRequested);
  const canonicalMatch = options.find(
    (option) => canonicalText(option.name || "") === canonicalRequested
  )?.name;
  if (canonicalMatch) return canonicalMatch;

  return cleanRequested;
};

const collectMultiSelectValues = (
  properties: Record<string, NotionPropertyValue>,
  preferredNames: Array<string | undefined>,
  keywords: string[]
): string[] => {
  const targetKeys = new Set<string>();
  const keywordTokens = keywords.map(canonicalText);

  for (const name of preferredNames) {
    if (name) targetKeys.add(name);
  }

  for (const [name, prop] of Object.entries(properties)) {
    if (prop?.type !== "multi_select") continue;
    const canonicalName = canonicalText(name);
    if (keywordTokens.every((kw) => canonicalName.includes(kw))) {
      targetKeys.add(name);
    }
  }

  const tags = new Set<string>();
  for (const key of targetKeys) {
    const prop = properties[key];
    if (!prop || prop.type !== "multi_select" || !Array.isArray(prop.multi_select)) continue;
    for (const item of prop.multi_select) {
      const tag = item?.name?.trim();
      if (tag) tags.add(tag);
    }
  }

  return Array.from(tags);
};

const matchesTagFilter = (tags: string[], selectedTag: string | undefined): boolean => {
  if (!selectedTag || selectedTag === "Tout") return true;
  const selectedCanonical = canonicalText(selectedTag);
  if (!selectedCanonical) return true;
  return tags.some((tag) => canonicalText(tag) === selectedCanonical);
};

const matchesSourceFilter = (author: string, source: string | undefined): boolean => {
  if (!source || source === "Tout") return true;
  return canonicalText(author) === canonicalText(source);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
  if (!NOTION_API_KEY) {
    return new Response(JSON.stringify({ error: "NOTION_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload = await req.json();
    const start_cursor = typeof payload?.start_cursor === "string" ? payload.start_cursor : undefined;
    const source = typeof payload?.source === "string" ? payload.source : undefined;
    const tag_anatomique =
      typeof payload?.tag_anatomique === "string" ? payload.tag_anatomique : undefined;
    const tag_contenu =
      typeof payload?.tag_contenu === "string" ? payload.tag_contenu : undefined;

    const notionHeaders = {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    };

    const databaseResponse = await fetch(`${NOTION_API_URL}/${DATABASE_ID}`, {
      method: "GET",
      headers: notionHeaders,
    });

    if (!databaseResponse.ok) {
      const errorText = await databaseResponse.text();
      throw new Error(`Notion database error [${databaseResponse.status}]: ${errorText}`);
    }

    const databaseData = await databaseResponse.json();
    const dbProperties = (databaseData.properties || {}) as Record<string, NotionDatabaseProperty>;

    const titlePropertyName =
      findPropertyName(dbProperties, ["Titre"], ["titre"], ["title"]) || "Titre";
    const authorPropertyName =
      findPropertyName(dbProperties, ["Auteur"], ["auteur"], ["rich_text", "select"]) || "Auteur";
    const datePropertyName =
      findPropertyName(
        dbProperties,
        ["Date de publication"],
        ["date", "publication"],
        ["date"]
      ) || "Date de publication";
    const linkPropertyName =
      findPropertyName(dbProperties, ["Lien"], ["lien"], ["url"]) || "Lien";
    const imagePropertyName =
      findPropertyName(
        dbProperties,
        ["URL de l'image", "Image"],
        ["image"],
        ["url", "files"]
      ) || "URL de l'image";
    const anatomyPropertyName =
      findPropertyName(
        dbProperties,
        ["Tag anatomique", "Tags anatomiques", "Tags Anatomique"],
        ["anatom"],
        ["multi_select"]
      ) || "Tag anatomique";
    const contentPropertyName =
      findPropertyName(
        dbProperties,
        ["Tag contenu", "Tags contenu", "Tags Contenu"],
        ["contenu"],
        ["multi_select"]
      ) || "Tag contenu";

    const anatomyOptions = dbProperties[anatomyPropertyName]?.multi_select?.options || [];
    const contentOptions = dbProperties[contentPropertyName]?.multi_select?.options || [];

    const resolvedAnatomyTag =
      tag_anatomique && tag_anatomique !== "Tout"
        ? resolveMultiSelectOption(tag_anatomique, anatomyOptions)
        : undefined;
    const resolvedContentTag =
      tag_contenu && tag_contenu !== "Tout"
        ? resolveMultiSelectOption(tag_contenu, contentOptions)
        : undefined;

    // Build filters
    const filters: Record<string, unknown>[] = [];
    let notionSourceFilterApplied = false;
    let notionAnatomyFilterApplied = false;
    let notionContentFilterApplied = false;

    const authorPropertyType = dbProperties[authorPropertyName]?.type;
    if (source && source !== "Tout" && authorPropertyType === "rich_text") {
      filters.push({ property: authorPropertyName, rich_text: { equals: source } });
      notionSourceFilterApplied = true;
    } else if (source && source !== "Tout" && authorPropertyType === "select") {
      filters.push({ property: authorPropertyName, select: { equals: source } });
      notionSourceFilterApplied = true;
    }

    if (resolvedAnatomyTag && dbProperties[anatomyPropertyName]?.type === "multi_select") {
      filters.push({
        property: anatomyPropertyName,
        multi_select: { contains: resolvedAnatomyTag },
      });
      notionAnatomyFilterApplied = true;
    }

    if (resolvedContentTag && dbProperties[contentPropertyName]?.type === "multi_select") {
      filters.push({
        property: contentPropertyName,
        multi_select: { contains: resolvedContentTag },
      });
      notionContentFilterApplied = true;
    }

    const body: Record<string, unknown> = {
      page_size: 100,
      sorts: [{ property: datePropertyName, direction: "descending" }],
    };

    if (filters.length === 1) {
      body.filter = filters[0];
    } else if (filters.length > 1) {
      body.filter = { and: filters };
    }

    if (start_cursor) {
      body.start_cursor = start_cursor;
    }

    const response = await fetch(`${NOTION_API_URL}/${DATABASE_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error [${response.status}]: ${errorText}`);
    }

    const data = await response.json() as {
      results: Array<{ id: string; properties: Record<string, NotionPropertyValue> }>;
      has_more: boolean;
      next_cursor: string | null;
    };

    // Transform results
    const articles = data.results.map((page) => {
      const props = page.properties;
      const tagsAnatomique = collectMultiSelectValues(
        props,
        [anatomyPropertyName, "Tag anatomique", "Tags anatomiques", "Tags Anatomique"],
        ["anatom"]
      );
      const tagsContenu = collectMultiSelectValues(
        props,
        [contentPropertyName, "Tag contenu", "Tags contenu", "Tags Contenu"],
        ["contenu"]
      );

      return {
        id: page.id,
        titre: extractTitleValue(props[titlePropertyName]) || extractTitleValue(props["Titre"]),
        auteur: extractTextValue(props[authorPropertyName]) || extractTextValue(props["Auteur"]),
        date_publication:
          extractDateValue(props[datePropertyName]) || extractDateValue(props["Date de publication"]),
        lien: extractUrlValue(props[linkPropertyName]) || extractUrlValue(props["Lien"]),
        image_url: extractUrlValue(props[imagePropertyName]) || extractUrlValue(props["URL de l'image"]) || null,
        tags_anatomique: tagsAnatomique,
        tags_contenu: tagsContenu,
      } as ArticlePayload;
    }).filter((article) => {
      const sourceMatches = notionSourceFilterApplied
        ? true
        : matchesSourceFilter(article.auteur, source);
      const anatomyMatches = notionAnatomyFilterApplied
        ? true
        : matchesTagFilter(article.tags_anatomique, tag_anatomique);
      const contentMatches = notionContentFilterApplied
        ? true
        : matchesTagFilter(article.tags_contenu, tag_contenu);
      return sourceMatches && anatomyMatches && contentMatches;
    });

    return new Response(
      JSON.stringify({
        articles,
        has_more: data.has_more,
        next_cursor: data.next_cursor,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error fetching from Notion:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
