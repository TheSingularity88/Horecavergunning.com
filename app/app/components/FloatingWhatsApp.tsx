import { MessageCircle } from 'lucide-react';

export function FloatingWhatsApp() {
  return (
    <a 
      href="https://wa.me/31612345678"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center gap-2"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="font-bold hidden md:inline">WhatsApp Us</span>
    </a>
  );
}
