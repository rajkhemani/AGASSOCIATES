import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Practice } from "@/components/Practice";
import { ProcessExplorer } from "@/components/ProcessExplorer";
import { Technology } from "@/components/Technology";
import { Coverage } from "@/components/Coverage";
import { Empanelment } from "@/components/Empanelment";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Practice />
        <ProcessExplorer />
        <Technology />
        <Coverage />
        <Empanelment />
      </main>
      <Footer />
    </>
  );
}
