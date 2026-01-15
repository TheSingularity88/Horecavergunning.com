'use client';

import Link from 'next/link';
import { BlogPost } from '@/app/lib/blog-data';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const { language, t } = useLanguage();
  const content = post.content[language];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
      {/* Placeholder Image Area - In a real app, use Next.js Image component */}
      <div className="h-48 bg-slate-100 relative overflow-hidden group">
        <div className="absolute inset-0 bg-slate-200 animate-pulse" /> 
        {/* We would render post.image here */}
        <div className="absolute top-4 left-4 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
          {content.category}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center text-xs text-slate-500 mb-3 space-x-4">
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {post.date}
          </div>
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1" />
            {post.author}
          </div>
        </div>

        <Link href={`/blog/${post.slug}`} className="group">
          <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-amber-600 transition-colors line-clamp-2">
            {content.title}
          </h2>
        </Link>

        <p className="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
          {content.excerpt}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <Link 
              href={`/blog/${post.slug}`} 
              className="text-amber-600 font-semibold text-sm flex items-center hover:text-amber-700 transition-colors"
            >
              {t.blog.read_more}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <span className="text-xs text-slate-400">{content.readTime}</span>
        </div>
      </div>
    </div>
  );
}
