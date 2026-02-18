import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const NOTION_API_URL = "https://api.notion.com/v1/databases";
const DATABASE_ID = "30b5bbbcdf1780298c67e585f3c49cdc";

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
    const { start_cursor, source, tag_anatomique, tag_contenu } = await req.json();

    // Build filters
    const filters: any[] = [];

    if (source && source !== "Tout") {
      filters.push({
        property: "Auteur",
        rich_text: { equals: source },
      });
    }

    if (tag_anatomique && tag_anatomique !== "Tout") {
      filters.push({
        property: "Tag anatomique",
        multi_select: { contains: tag_anatomique },
      });
    }

    if (tag_contenu && tag_contenu !== "Tout") {
      filters.push({
        property: "Tag contenu",
        multi_select: { contains: tag_contenu },
      });
    }

    const body: any = {
      page_size: 100,
      sorts: [{ property: "Date de publication", direction: "descending" }],
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
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error [${response.status}]: ${errorText}`);
    }

    const data = await response.json();

    // Transform results
    const articles = data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: page.id,
        titre: props["Titre"]?.title?.[0]?.plain_text || "",
        auteur: props["Auteur"]?.rich_text?.[0]?.plain_text || "",
        date_publication: props["Date de publication"]?.date?.start || null,
        lien: props["Lien"]?.url || "",
        image_url: props["URL de l'image"]?.url || null,
        tags_anatomique: props["Tag anatomique"]?.multi_select?.map((t: { name: string }) => t.name) ?? [],
        tags_contenu: props["Tag contenu"]?.multi_select?.map((t: { name: string }) => t.name) ?? [],
      };
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
