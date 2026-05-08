// src/pages/Home.jsx
import Hero from "../components/home/Hero";
import Features from "../components/home/Features";
import ProblemsPreview from "../components/home/ProblemsPreview";
import CtaSection from "../components/home/CtaSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <ProblemsPreview />
      <CtaSection />
    </main>
  );
}