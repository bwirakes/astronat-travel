import { getPostBySlug } from "@/lib/blog/api";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { ArrowLeft } from "lucide-react";

export const revalidate = 60;

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return notFound();
  }

  return (
    <div className="bg-[var(--bg)] min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-6 md:pt-8 pb-20 md:pb-32 px-6">
        <article className="max-w-5xl mx-auto">
          
          <div className="mb-4 md:mb-6">
            <Link href="/blog" className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-y2k-blue)] hover:opacity-70 transition-opacity">
              <ArrowLeft size={14} /> Back to Journal
            </Link>
          </div>

          <header className="mb-12 md:mb-16">
            <h1 className="font-primary text-[clamp(2.5rem,6vw,5rem)] leading-[0.85] text-[var(--text-primary)] uppercase tracking-tight mb-6">
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p className="font-secondary italic text-xl md:text-2xl text-[var(--text-secondary)] mb-8 border-l-2 border-[var(--color-y2k-blue)] pl-4 md:pl-6 leading-snug">
                {post.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest opacity-60 mt-8 border-t border-[var(--surface-border)] pt-8">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[var(--color-y2k-blue)] rounded-full"></span>
                {post.author || "Natalia H"}
              </div>
              {post.publishedDate && (
                <>
                  <span>·</span>
                  <time dateTime={post.publishedDate}>
                    {new Date(post.publishedDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </>
              )}
            </div>
          </header>

          {post.heroImage?.url && (
            <div className="w-full relative mb-16 md:mb-20">
              <div 
                className="w-full aspect-[16/9] md:aspect-[21/9] relative overflow-hidden"
                style={{ clipPath: "var(--cut-lg, polygon(0% 0%, 100% 0%, 100% 90%, 95% 100%, 0% 100%))" }}
              >
                <Image 
                  src={post.heroImage.url} 
                  alt={post.heroImage.alt || post.title} 
                  fill 
                  priority
                  className="object-cover" 
                />
              </div>
            </div>
          )}

          {/* Lexical Rich Text Content Wrapper with Styled Child Elements */}
          <div className="prose prose-lg dark:prose-invert max-w-none 
                          prose-headings:font-secondary prose-headings:font-normal prose-headings:leading-tight 
                          prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-6
                          prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:text-[var(--color-y2k-blue)]
                          prose-p:font-body prose-p:text-base md:prose-p:text-lg prose-p:leading-relaxed prose-p:opacity-85 prose-p:mb-8
                          prose-a:text-[var(--color-y2k-blue)] prose-a:underline-offset-4 hover:prose-a:opacity-80
                          prose-strong:font-semibold prose-strong:text-[var(--text-primary)]
                          prose-ul:list-disc prose-ul:font-body prose-ul:opacity-85
                          prose-ol:list-decimal prose-ol:font-body prose-ol:opacity-85
                          prose-blockquote:border-l-4 prose-blockquote:border-[var(--color-spiced-life)] prose-blockquote:pl-6 prose-blockquote:font-secondary prose-blockquote:italic
                          prose-img:rounded-2xl
                          text-[var(--text-primary)]">
            <RichText data={post.content} />
          </div>

        </article>
      </main>

      <Footer />


    </div>
  );
}
