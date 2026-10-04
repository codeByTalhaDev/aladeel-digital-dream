import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | Al Adeel Furniture" },
      { name: "description", content: "Terms and conditions for buying furniture from Al Adeel Furniture in the UAE." },
      { property: "og:title", content: "Terms & Conditions | Al Adeel Furniture" },
      { property: "og:description", content: "Terms and conditions for buying furniture from Al Adeel Furniture in the UAE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PolicyPage slug="terms" />,
});
