import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return & Exchange Policy | Al Adeel Furniture" },
      { name: "description", content: "Return and exchange policy for furniture bought from Al Adeel Furniture, UAE." },
      { property: "og:title", content: "Return & Exchange Policy | Al Adeel Furniture" },
      { property: "og:description", content: "Return and exchange policy for furniture bought from Al Adeel Furniture, UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PolicyPage slug="returns" />,
});
