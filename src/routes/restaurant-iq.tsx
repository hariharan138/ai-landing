import { createFileRoute } from "@tanstack/react-router";
import { AgorixNav } from "@/components/AgorixNav";
import { Hero } from "@/components/restaurant-iq/Hero";
import { StatsBar } from "@/components/restaurant-iq/StatsBar";
import { Features } from "@/components/restaurant-iq/Features";
import { Objectives } from "@/components/restaurant-iq/Objectives";
import { TargetUsers } from "@/components/restaurant-iq/TargetUsers";
import { Integrations } from "@/components/restaurant-iq/Integrations";
import { HowItWorks } from "@/components/restaurant-iq/HowItWorks";
import { AiHumanLoop } from "@/components/restaurant-iq/AiHumanLoop";
import { Testimonials } from "@/components/restaurant-iq/Testimonials";
import { Pricing } from "@/components/restaurant-iq/Pricing";
import { CtaBottom } from "@/components/restaurant-iq/CtaBottom";
import { Footer } from "@/components/restaurant-iq/Footer";

export const Route = createFileRoute("/restaurant-iq")({
  component: RestaurantIQ,
  head: () => ({
    meta: [
      { title: "RestaurantIQ — The AI Operating System for Restaurants" },
      {
        name: "description",
        content:
          "Connect Tally ERP and POS in minutes. Real-time food cost analysis, leakage detection, and AI-generated daily reports — without spreadsheets.",
      },
      { property: "og:title", content: "RestaurantIQ — AI OS for Restaurants" },
      {
        property: "og:description",
        content: "Eliminate inventory leakage. Optimize food costs. Powered by AI.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
      },
    ],
  }),
});

function RestaurantIQ() {
  return (
    <div
      className="min-h-screen restaurant-iq"
      style={{ background: "#111113", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <AgorixNav
        sticky
        links={[
          { label: "Product", dropdown: [{ label: "Restaurant IQ", href: "/restaurant-iq" }] },
          { label: "Pricing", href: "#pricing" },
          { label: "Resources", href: "/software" },
        ]}
      />
      <main>
        <Hero />
        {/* <StatsBar /> */}
        <Features />
        <Objectives />
        <HowItWorks />
        <AiHumanLoop />
        <Integrations />
        <TargetUsers />
        {/* <Testimonials />   */}
        {/* <Pricing /> */}
        <CtaBottom />
      </main>
      <Footer />
    </div>
  );
}
