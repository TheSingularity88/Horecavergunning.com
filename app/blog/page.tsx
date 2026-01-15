'use client';

import { Navbar } from '@/app/components/Navbar';
import { Footer } from '@/app/components/Footer';
import BlogCard from '@/app/components/blog/BlogCard';
import { blogPosts, categories } from '@/app/lib/blog-data';
import { Search } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

export default function BlogIndex() {
  const { language, t } = useLanguage();
  const currentCategories = categories[language];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-slate-900 text-white pt-32 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
            {language === 'nl' ? (
              <>Horeca<span className="text-amber-500">Kennis</span> & Nieuws</>
            ) : (
              <>Hospitality <span className="text-amber-500">Knowledge</span> & News</>
            )}
          </h1>
          <p className="text-slate-300 text-center text-lg mb-8 max-w-2xl mx-auto">
            {t.blog.subtitle}
          </p>

          {/* Search & Filter Bar */}
          <div className="max-w-3xl mx-auto bg-white rounded-lg p-2 flex shadow-lg">
            <div className="flex-grow flex items-center px-4 border-r border-slate-100">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input 
                type="text" 
                placeholder={t.blog.search_placeholder}
                className="w-full py-2 bg-transparent focus:outline-none text-slate-900"
              />
            </div>
            <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-md transition-colors">
              {t.blog.search_button}
            </button>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {currentCategories.map((cat) => (
              <button 
                key={cat}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-sm font-medium transition-colors border border-slate-700 hover:border-amber-500/50"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow py-16 container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
          {/* Duplicate posts to fill grid for demo */}
          {blogPosts.map((post) => (
            <BlogCard key={`${post.slug}-copy`} post={{...post, slug: `${post.slug}-copy`}} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-16 flex justify-center">
          <button className="px-6 py-3 bg-white border border-slate-200 text-slate-900 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            {t.blog.load_more}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
