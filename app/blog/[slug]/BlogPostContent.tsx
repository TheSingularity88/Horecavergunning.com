'use client';

import Link from 'next/link';
import { BlogPost, blogPosts } from '@/app/lib/blog-data';
import { Calendar, User, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';
import BlogSidebar from '@/app/components/blog/BlogSidebar';
import ShareButtons from '@/app/components/blog/ShareButtons';
import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';

interface BlogPostContentProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

export default function BlogPostContent({ post, relatedPosts }: BlogPostContentProps) {
  const { language, t } = useLanguage();
  const content = post.content[language];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-grow pt-24 pb-12 container mx-auto px-4 max-w-6xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/" className="hover:text-amber-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link href="/blog" className="hover:text-amber-600 transition-colors">Blog</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-slate-900 font-medium truncate max-w-[200px] md:max-w-md">{content.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content Column */}
            <article className="lg:col-span-8 bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100">
                <header className="mb-8">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                            {content.category}
                        </span>
                        <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5" />
                            {post.date}
                        </div>
                        <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {content.readTime}
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-6">
                        {content.title}
                    </h1>

                    <div className="flex items-center border-b border-slate-100 pb-8">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 mr-4">
                             <User className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-slate-900 font-bold">{post.author}</div>
                            <div className="text-slate-500 text-sm">Redacteur HorecaVergunning</div>
                        </div>
                    </div>
                </header>

                <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-img:rounded-xl">
                    <div dangerouslySetInnerHTML={{ __html: content.body }} />
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100">
                    <ShareButtons />
                    
                    {/* Author Bio Box */}
                    <div className="bg-slate-50 p-6 rounded-xl mt-8 flex items-start">
                        <div className="w-16 h-16 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400 mr-6">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{t.blog.about_author} {post.author}</h3>
                            <p className="text-slate-600 text-sm">
                                {post.author} is specialist in horecawetgeving en exploitatievergunningen. Hij schrijft regelmatig over de laatste ontwikkelingen en tips voor ondernemers.
                            </p>
                        </div>
                    </div>
                    
                    {/* Related Articles Section */}
                    <div className="mt-12">
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">{t.blog.related_articles}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relatedPosts.map((relatedPost) => {
                                const relatedContent = relatedPost.content[language];
                                return (
                                  <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="group block bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-amber-200 transition-colors">
                                      <div className="h-32 bg-slate-200 rounded-lg mb-4 relative overflow-hidden">
                                          {/* Placeholder for image */}
                                          <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                              {relatedContent.category}
                                          </div>
                                      </div>
                                      <h4 className="font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors line-clamp-2">
                                          {relatedContent.title}
                                      </h4>
                                      <span className="text-xs text-slate-500 flex items-center">
                                          <Calendar className="w-3 h-3 mr-1" />
                                          {relatedPost.date}
                                      </span>
                                  </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                   <Link href="/blog" className="inline-flex items-center font-bold text-amber-600 hover:text-amber-700 transition-colors">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      {t.blog.back_to_overview}
                   </Link>
                </div>
            </article>

            {/* Sidebar Column */}
            <aside className="lg:col-span-4 space-y-8">
                <BlogSidebar />
            </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
