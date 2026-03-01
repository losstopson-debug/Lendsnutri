import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { Apple, History, Sparkles, ChevronRight } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import { analyzeFoodImage, FoodAnalysis } from './services/gemini';

const EXAMPLES = [
  { name: 'Salada Fresh', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Avocado Toast', url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80' },
  { name: 'Bowl de Frutas', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Poke Bowl', url: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=400&q=80' },
  { name: 'Hambúrguer', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sushi', url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80' },
  { name: 'Pasta', url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=400&q=80' },
  { name: 'Steak', url: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=400&q=80' },
  { name: 'Tacos', url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
  { name: 'Panquecas', url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7bb7445?auto=format&fit=crop&w=400&q=80' },
  { name: 'Salmão', url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=400&q=80' },
  { name: 'Ramen', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sanduíche', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80' },
  { name: 'Omelete', url: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=400&q=80' },
  { name: 'Sopa', url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Smoothie', url: 'https://images.unsplash.com/photo-1494390248081-4e521a5940db?auto=format&fit=crop&w=400&q=80' },
  { name: 'Frango Grelhado', url: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80' },
  { name: 'Salada Frutas', url: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Arroz e Feijão', url: 'https://images.unsplash.com/photo-1512058560366-cd2427ff56f3?auto=format&fit=crop&w=400&q=80' },
];

export default function App() {
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'nutrition' | 'health'>('nutrition');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; result: FoodAnalysis; date: string }[]>([]);

  const handleImageSelect = async (base64: string) => {
    setPreview(base64);
    setIsAnalyzing(true);
    setAnalysis(null);
    setActiveTab('nutrition');
    try {
      const result = await analyzeFoodImage(base64);
      setAnalysis(result);
      setHistory(prev => [{
        id: Date.now().toString(),
        result,
        date: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis({
        name: "Erro na análise",
        nutritionalInfo: "Ocorreu um problema ao tentar analisar a imagem. Por favor, tente novamente.",
        healthInsights: "Não foi possível gerar insights de saúde."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleClick = async (url: string) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        handleImageSelect(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to fetch example image:", error);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <Apple className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-800">NutriLens</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-10">
        <div className="relative rounded-[2.5rem] overflow-hidden mb-12 bg-emerald-900 h-[300px] flex items-center px-12">
          <img 
            src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1200&q=80" 
            alt="Healthy Food" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 max-w-lg">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Sua saúde começa no prato.
            </h2>
            <p className="text-emerald-50/80 text-lg">
              Analise instantaneamente o que você come e tome decisões mais conscientes.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
          
          {/* Left Column: Upload & Results */}
          <div className="space-y-8">
            <section>
              <ImageUpload 
                onImageSelect={handleImageSelect} 
                isAnalyzing={isAnalyzing} 
                externalPreview={preview}
                onReset={() => {
                  setPreview(null);
                  setAnalysis(null);
                }}
              />

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Experimente um exemplo</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {EXAMPLES.map((example) => (
                    <button
                      key={example.name}
                      onClick={() => handleExampleClick(example.url)}
                      disabled={isAnalyzing}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 hover:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img
                        src={example.url}
                        alt={example.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                        <span className="text-[8px] font-bold text-white uppercase tracking-tighter leading-none">{example.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-zinc-100 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-zinc-50 rounded animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-full h-4 bg-zinc-100 rounded animate-pulse" />
                    <div className="w-full h-4 bg-zinc-100 rounded animate-pulse" />
                    <div className="w-3/4 h-4 bg-zinc-100 rounded animate-pulse" />
                    <div className="pt-4 space-y-3">
                      <div className="w-full h-20 bg-zinc-50 rounded-2xl animate-pulse" />
                      <div className="w-full h-20 bg-zinc-50 rounded-2xl animate-pulse" />
                    </div>
                  </div>
                </motion.section>
              )}

              {analysis && !isAnalyzing && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100"
                >
                  <div className="flex items-center gap-2 mb-6 text-emerald-600">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-xs">Análise Inteligente</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-zinc-800 mb-6">{analysis.name}</h2>

                  <div className="flex border-b border-zinc-200 mb-6">
                    <button
                      onClick={() => setActiveTab('nutrition')}
                      className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                        activeTab === 'nutrition' ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Informações Nutricionais
                      {activeTab === 'nutrition' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('health')}
                      className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                        activeTab === 'health' ? 'text-emerald-600' : 'text-zinc-500 hover:text-zinc-700'
                      }`}
                    >
                      Insights de Saúde
                      {activeTab === 'health' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                      )}
                    </button>
                  </div>
                  
                  <div className="markdown-body prose prose-zinc max-w-none">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Markdown>
                          {activeTab === 'nutrition' ? analysis.nutritionalInfo : analysis.healthInsights}
                        </Markdown>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: History & Stats */}
          <aside className="space-y-8 sticky top-28">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-zinc-400" />
                  Recentes
                </h3>
              </div>
              
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAnalysis(item.result)}
                      className="w-full text-left p-4 rounded-2xl border border-zinc-50 hover:bg-zinc-50 hover:border-zinc-200 transition-all group flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-800">
                          {item.result.name || 'Análise de Alimento'}
                        </p>
                        <p className="text-xs text-zinc-400">{item.date}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400">Nenhuma análise recente.</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      {/* Mobile Navigation Placeholder */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-8 py-4 flex justify-around items-center z-50">
        <button className="text-emerald-500 flex flex-col items-center gap-1">
          <Apple className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button className="text-zinc-400 flex flex-col items-center gap-1">
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Histórico</span>
        </button>
      </nav>
    </div>
  );
}
