'use client';

import Link from 'next/link';
import { categories, blogPosts } from '@/app/lib/blog-data';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { Button } from '../ui/Button';
import { useLanguage } from '@/app/context/LanguageContext';

export default function BlogSidebar() {
  const { language, t } = useLanguage();
  const recentPosts = blogPosts.slice(0, 3);
  const currentCategories = categories[language];

  return (
    <div className="space-y-8">
      {/* CTA Widget */}
      <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg">
        <h3 className="text-xl font-bold mb-2 text-white">{t.blog.cta.title}</h3>
        <p className="text-slate-300 text-sm mb-4">
          {t.blog.cta.desc}
        </p>
        <ul className="space-y-2 mb-6 text-sm text-slate-300">
          {t.blog.cta.features.map((feature, idx) => (
             <li key={idx} className="flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-amber-500" /> {feature}</li>
          ))}
        </ul>
        <Button variant="primary" className="w-full justify-center">
          {t.blog.cta.button}
        </Button>
      </div>

      {/* Newsletter Widget */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <div className="bg-amber-100 p-2 rounded-lg mr-3">
            <Mail className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.blog.newsletter.title}</h3>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          {t.blog.newsletter.desc}
        </p>
        <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder={t.blog.newsletter.placeholder}
            className="w-full px-4 py-2 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
          />
          <button className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg text-sm transition-colors">
            {t.blog.newsletter.button}
          </button>
        </form>
      </div>

      {/* Recent Posts Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          {t.blog.recent_posts}
        </h3>
        <div className="space-y-4">
          {recentPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
              <h4 className="text-sm font-medium text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-2 mb-1">
                {post.content[language].title}
              </h4>
              <span className="text-xs text-slate-400">{post.date}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Categories Widget */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          {t.blog.categories}
        </h3>
        <ul className="space-y-2">
          {currentCategories.map((category) => (
            <li key={category}>
              <Link href="#" className="flex items-center justify-between text-sm text-slate-600 hover:text-amber-600 group">
                <span>{category}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity transform -translate-x-2 group-hover:translate-x-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
