import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Bot, Send, X, Sparkles, Loader2, Code2, Palette, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudio } from '../contexts/StudioContext';
import { showToast } from './Toast';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function AIAssistant() {
  const { config, updateConfig } = useStudio();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Bonjour ! Je suis l\'Architecte IA de MarketVibe. Je peux modifier le design, le contenu et le style du site en temps réel. Que souhaitez-vous changer ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (directText?: string) => {
    const textToSend = directText || input;
    if (!textToSend.trim() || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: textToSend }]);
    setLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: textToSend,
        config: {
          systemInstruction: `Tu es l'Architecte IA de MarketVibe. Ta mission est de modifier le site en temps réel selon les désirs de l'utilisateur.
          Tu as accès à des outils pour changer le thème (couleurs, arrondis, polices), le contenu (titres, textes) et injecter du CSS personnalisé.
          Sois créatif et audacieux. Si l'utilisateur demande un style "Cyberpunk" ou "Minimaliste", utilise les outils pour transformer le site.
          Explique toujours brièvement ce que tu as modifié.`,
          tools: [
            {
              functionDeclarations: [
                {
                  name: 'updateTheme',
                  description: 'Met à jour les couleurs et le style visuel global du site.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      primaryColor: { type: Type.STRING, description: 'Couleur principale (hex)' },
                      secondaryColor: { type: Type.STRING, description: 'Couleur secondaire (hex)' },
                      accentColor: { type: Type.STRING, description: 'Couleur d\'accent (hex)' },
                      borderRadius: { type: Type.STRING, description: 'Arrondi des éléments (ex: 0.5rem, 2rem, 0px)' },
                      fontFamily: { type: Type.STRING, description: 'Police de caractères (ex: Inter, serif, monospace)' },
                      darkMode: { type: Type.BOOLEAN, description: 'Activer le mode sombre' }
                    }
                  }
                },
                {
                  name: 'updateContent',
                  description: 'Modifie les textes principaux du site.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      siteName: { type: Type.STRING },
                      heroTitle: { type: Type.STRING },
                      heroSubtitle: { type: Type.STRING },
                      footerText: { type: Type.STRING }
                    }
                  }
                },
                {
                  name: 'injectStyles',
                  description: 'Ajoute du CSS personnalisé pour des modifications avancées.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      css: { type: Type.STRING, description: 'Code CSS valide' }
                    },
                    required: ['css']
                  }
                }
              ]
            }
          ]
        }
      });

      const functionCalls = response.functionCalls;
      if (functionCalls) {
        for (const call of functionCalls) {
          if (call.name === 'updateTheme') {
            await updateConfig({ theme: { ...config.theme, ...call.args } });
            showToast('Design mis à jour !');
          } else if (call.name === 'updateContent') {
            await updateConfig({ content: { ...config.content, ...call.args } });
            showToast('Contenu mis à jour !');
          } else if (call.name === 'injectStyles') {
            await updateConfig({ customStyles: call.args.css as string });
            showToast('Styles injectés !');
          }
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "Modifications appliquées avec succès !" }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', text: "Une erreur est survenue lors de la modification du site." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:bg-indigo-700 transition-all z-[100] group"
      >
        <Bot className="w-8 h-8 group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 w-96 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 z-[100] overflow-hidden flex flex-col h-[600px]"
          >
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Architecte IA</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Mode Édition Temps Réel</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-700 rounded-tl-none border border-gray-100 shadow-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">L'IA modifie le site...</span>
                  </div>
                </div>
              )}
              
              {messages.length === 1 && !loading && (
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {[
                    { text: "Change le thème en 'Cyberpunk'", icon: Palette },
                    { text: "Rends le site minimaliste et épuré", icon: Layout },
                    { text: "Change le titre en 'VibeMarket'", icon: Code2 },
                    { text: "Ajoute une bordure néon à tout le site", icon: Sparkles }
                  ].map((action, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(action.text)}
                      className="text-left p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
                    >
                      <action.icon className="w-4 h-4" />
                      {action.text}
                    </button>
                  ))}
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <div className="p-6 border-t border-gray-50 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Décrivez les changements..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={loading}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
