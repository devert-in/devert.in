import { notFound } from "next/navigation";
import { HackathonDetailView } from "@/components/hackathons/hackathon-detail-view";
import { hackathonStaticParams, hackathonForSlug, buildHackathonMetadata, hackathonJsonLd } from "@/lib/hackathon-seo";
import { jsonLdHtml } from "@/lib/jsonLd";

export async function generateStaticParams() {
  return hackathonStaticParams();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const hackathon = await hackathonForSlug(slug);
  if (!hackathon) return { title: "Hackathon not found" };
  return buildHackathonMetadata(hackathon, slug);
}

export default async function HackathonPage({ params }) {
  const { slug } = await params;
  const hackathon = await hackathonForSlug(slug);
  if (!hackathon) notFound();

  const jsonLd = hackathonJsonLd(hackathon, slug);

  return (
    <>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(obj) }} />
      ))}
      <HackathonDetailView slug={slug} />
    </>
  );
}
