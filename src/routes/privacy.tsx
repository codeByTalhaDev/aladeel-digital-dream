import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Al Adeel Furniture" },
      { name: "description", content: "How Al Adeel Furniture collects and protects your personal information." },
      { property: "og:title", content: "Privacy Policy | Al Adeel Furniture" },
      { property: "og:description", content: "How Al Adeel Furniture collects and protects your personal information." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PolicyPage slug="privacy" />,
});
