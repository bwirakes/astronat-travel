import { getPosts } from "@/lib/blog/api";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { InstagramReels } from "@/app/components/marketing/shared/blocks/UniversalBlocks";

export const revalidate = 60;

export default async function BlogIndex() {
  const posts = await getPosts();

  const instagramBlock = {
    kicker: "4.3M+ combined views · Follow The Journey",
    heading: "THE OFFICIAL FEED",
    profileHref: "https://www.instagram.com/astronatofficial/",
    reels: [
      {
        caption: "The Middle East predicted — watch what astrocartography actually reveals about geopolitical hotbeds.",
        href: "https://www.instagram.com/astronatofficial/",
        image: "/reels/reel1.gif",
        views: "2.1M views",
      },
      {
        caption: "Your Jupiter line is the upgrade you didn't know you needed. Here's what moving to it actually does.",
        href: "https://www.instagram.com/astronatofficial/",
        image: "/reels/reel2.gif",
        views: "890K views",
      },
      {
        caption: "Venus line vs. Sun line — tested both. Honest results after 6 months living the data.",
        href: "https://www.instagram.com/astronatofficial/",
        image: "/reels/reel3.gif",
        views: "1.3M views",
      },
    ],
  };

  return (
    <div className="bg-[var(--bg)] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-6 md:pt-8 pb-20 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-16 md:mb-24 text-center md:text-left">
            <h1 className="font-primary text-[clamp(3rem,8vw,6rem)] leading-[0.85] text-[var(--text-primary)] uppercase tracking-tight mb-4">
              THE JOURNAL
            </h1>
            <p className="font-body text-lg text-[var(--text-secondary)] max-w-xl opacity-80">
              Insights, guides, and stories on astrocartography and living aligned with your cosmic blueprint.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {posts.length > 0 ? (
              posts.map((post: any, index: number) => {
                // Determine an alternating Astro-Brand theme for cards
                const themes = [
                  { bg: "#F8F5EC", text: "#1B1B1B", accent: "var(--color-y2k-blue)", border: "rgba(0,0,0,0.1)" },
                  { bg: "#1B1B1B", text: "#F8F5EC", accent: "var(--color-acqua)", border: "rgba(255,255,255,0.1)" },
                  { bg: "#000000", text: "#F8F5EC", accent: "var(--color-spiced-life)", border: "rgba(255,255,255,0.1)" },
                ];
                const theme = themes[index % themes.length];

                return (
                  <Link href={`/blog/${post.slug || ""}`} key={post.id || index} className="group block relative w-full translate-y-0 hover:-translate-y-2 transition-transform duration-300">
                    <div 
                      className="p-6 md:p-8 relative overflow-hidden h-full flex flex-col items-start min-h-[460px] md:min-h-[500px]"
                      style={{
                        backgroundColor: theme.bg,
                        color: theme.text,
                        borderRadius: "var(--shape-asymmetric-md)",
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      {/* Optional hero image fallback to a shape */}
                      {post.heroImage?.url ? (
                        <div className="w-full aspect-[4/3] relative mb-8 overflow-hidden" style={{ borderRadius: "var(--shape-organic-1)" }}>
                          <Image src={post.heroImage.url} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      ) : (
                        <div className="w-full aspect-[4/3] relative mb-8 flex items-center justify-center overflow-hidden" style={{ borderRadius: "var(--shape-organic-1)", backgroundColor: 'rgba(128,128,128,0.1)' }}>
                          <span className="font-secondary text-5xl opacity-20">✦</span>
                        </div>
                      )}

                      <h3 className="font-primary text-[2.2rem] leading-[0.9] uppercase tracking-tight mb-4 transition-colors line-clamp-3" style={{ color: theme.text }}>
                        {post.title}
                      </h3>
                      
                      <p className="font-body text-sm leading-relaxed opacity-70 line-clamp-3 mb-6 flex-1" style={{ color: theme.text }}>
                        {post.excerpt}
                      </p>

                      <div className="w-full flex items-center justify-between mt-auto pt-4 border-t" style={{ borderColor: theme.border }}>
                        <span className="font-mono text-[9px] uppercase tracking-widest opacity-60" style={{ color: theme.text }}>
                          {post.author || "Natalia H"}
                        </span>
                        {post.publishedDate && (
                          <span className="font-mono text-[9px] uppercase tracking-widest opacity-60" style={{ color: theme.text }}>
                            {new Date(post.publishedDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="col-span-full py-20 text-center border border-[var(--surface-border)] rounded-[2rem]">
                <p className="font-secondary text-2xl text-[var(--text-secondary)] italic">No posts published yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Integrate the marketing Reels component as social proof at the bottom of the index */}
      <InstagramReels block={instagramBlock} />



      <Footer />
    </div>
  );
}
