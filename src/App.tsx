import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';
import { Apple, History, Sparkles, ChevronRight, Search, Download, ChefHat, Send, Sun, Moon, LogIn, LogOut } from 'lucide-react';
import ImageUpload from './components/ImageUpload';
import { analyzeFoodImage, analyzeFoodText, askFoodQuestion, generateRecipe, FoodAnalysis, RecipeAnalysis } from './services/gemini';
import { supabase, loginWithGoogle, logout, saveAnalysisToHistory, getUserHistory } from './lib/supabase';
import { User } from '@supabase/supabase-js';

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
  const [activeTab, setActiveTab] = useState<'nutrition' | 'health' | 'recipe'>('nutrition');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [history, setHistory] = useState<{ id: string; result: FoodAnalysis; date: string }[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recipe, setRecipe] = useState<RecipeAnalysis | null>(null);
  const [isGeneratingRecipe, setIsGeneratingRecipe] = useState(false);
  
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getUserHistory(session.user.id).then(setHistory);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const userHistory = await getUserHistory(session.user.id);
        setHistory(userHistory);
      } else {
        setHistory([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const resetState = () => {
    setAnalysis(null);
    setActiveTab('nutrition');
    setRecipe(null);
    setAnswer(null);
    setQuestion('');
  };

  const handleImageSelect = async (base64: string) => {
    setPreview(base64);
    setSearchQuery('');
    setIsAnalyzing(true);
    resetState();
    try {
      const result = await analyzeFoodImage(base64);
      setAnalysis(result);
      
      let historyId = Date.now().toString();
      if (user) {
        historyId = await saveAnalysisToHistory(user.id, result);
      }
      
      setHistory(prev => [{
        id: historyId,
        result,
        date: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]); // Keep up to 20 items locally
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis({
        nomePrato: "Erro na análise",
        descricao: "Ocorreu um problema ao tentar analisar a imagem. Por favor, tente novamente.",
        calorias: { totalEstimado_kcal: "-", porPorcao_kcal: "-" },
        macronutrientes: { proteinas_g: "-", carboidratos_g: "-", gorduras_g: "-", fibras_g: "-" },
        micronutrientesPrincipais: [],
        beneficiosSaude: [],
        riscosOuAlertas: [],
        sugestaoParaMelhorar: ""
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setPreview(null);
    setIsAnalyzing(true);
    resetState();
    
    try {
      const result = await analyzeFoodText(searchQuery);
      setAnalysis(result);
      
      let historyId = Date.now().toString();
      if (user) {
        historyId = await saveAnalysisToHistory(user.id, result);
      }
      
      setHistory(prev => [{
        id: historyId,
        result,
        date: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 19)]);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis({
        nomePrato: "Erro na análise",
        descricao: "Ocorreu um problema ao pesquisar o alimento. Por favor, tente novamente.",
        calorias: { totalEstimado_kcal: "-", porPorcao_kcal: "-" },
        macronutrientes: { proteinas_g: "-", carboidratos_g: "-", gorduras_g: "-", fibras_g: "-" },
        micronutrientesPrincipais: [],
        beneficiosSaude: [],
        riscosOuAlertas: [],
        sugestaoParaMelhorar: ""
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateRecipe = async () => {
    if (!analysis) return;
    setIsGeneratingRecipe(true);
    setActiveTab('recipe');
    try {
      const res = await generateRecipe(analysis.nomePrato);
      setRecipe(res);
    } catch (error) {
      setRecipe(null);
      console.error("Erro ao gerar receita:", error);
    } finally {
      setIsGeneratingRecipe(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis || !question.trim()) return;
    setIsAsking(true);
    try {
      const res = await askFoodQuestion(analysis, question);
      setAnswer(res);
      setQuestion('');
    } catch (error) {
      setAnswer("Erro ao responder a pergunta. Tente novamente.");
    } finally {
      setIsAsking(false);
    }
  };

  const downloadImage = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image", error);
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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 transition-colors duration-300">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20">
              <Apple className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">NutriLens</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden sm:block">
                  {user.user_metadata?.full_name || user.email}
                </span>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Sair</span>
                </button>
              </div>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar</span>
              </button>
            )}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
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
              <div className="mb-8">
                <form onSubmit={handleTextSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Pesquise por qualquer alimento (ex: Maçã, Pizza de Calabresa)..."
                    className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-all"
                    disabled={isAnalyzing}
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isAnalyzing}
                    className="absolute inset-y-2 right-2 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Analisar
                  </button>
                </form>
              </div>

              <ImageUpload 
                onImageSelect={handleImageSelect} 
                isAnalyzing={isAnalyzing} 
                externalPreview={preview}
                onReset={() => {
                  setPreview(null);
                  resetState();
                }}
              />

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4">Experimente um exemplo</h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {EXAMPLES.map((example) => (
                    <div key={example.name} className="group relative aspect-square rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all">
                      <button
                        onClick={() => handleExampleClick(example.url)}
                        disabled={isAnalyzing}
                        className="w-full h-full disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadImage(example.url, example.name);
                        }}
                        className="absolute top-1 right-1 p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-full text-zinc-700 dark:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-zinc-800 hover:text-emerald-600 dark:hover:text-emerald-400"
                        title="Baixar imagem"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
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
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl animate-pulse" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                      <div className="w-20 h-3 bg-zinc-50 dark:bg-zinc-800/50 rounded animate-pulse" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="w-3/4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                    <div className="pt-4 space-y-3">
                      <div className="w-full h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
                      <div className="w-full h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl animate-pulse" />
                    </div>
                  </div>
                </motion.section>
              )}

              {analysis && !isAnalyzing && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-sm border border-zinc-100 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2 mb-6 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                    <span className="font-semibold uppercase tracking-wider text-xs">Análise Inteligente</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">{analysis.nomePrato}</h2>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">{analysis.descricao}</p>

                  <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6">
                    <button
                      onClick={() => setActiveTab('nutrition')}
                      className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                        activeTab === 'nutrition' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
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
                        activeTab === 'health' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      Insights de Saúde
                      {activeTab === 'health' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        if (!recipe && !isGeneratingRecipe) {
                          handleGenerateRecipe();
                        } else {
                          setActiveTab('recipe');
                        }
                      }}
                      className={`pb-3 px-4 text-sm font-medium transition-colors relative flex items-center gap-1 ${
                        activeTab === 'recipe' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                      }`}
                    >
                      <ChefHat className="w-4 h-4" /> Receita
                      {activeTab === 'recipe' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
                      )}
                    </button>
                  </div>
                  
                  <div className="markdown-body prose prose-zinc dark:prose-invert max-w-none">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {activeTab === 'nutrition' ? (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Calorias (Total)</p>
                                <p className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{analysis.calorias.totalEstimado_kcal} kcal</p>
                              </div>
                              <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Calorias (Porção)</p>
                                <p className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{analysis.calorias.porPorcao_kcal} kcal</p>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-3">Macronutrientes</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Proteínas</p>
                                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{analysis.macronutrientes.proteinas_g}g</p>
                                </div>
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">Carboidratos</p>
                                  <p className="text-lg font-bold text-orange-900 dark:text-orange-100">{analysis.macronutrientes.carboidratos_g}g</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Gorduras</p>
                                  <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{analysis.macronutrientes.gorduras_g}g</p>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-1">Fibras</p>
                                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{analysis.macronutrientes.fibras_g}g</p>
                                </div>
                              </div>
                            </div>

                            {analysis.micronutrientesPrincipais.length > 0 && (
                              <div>
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-3">Micronutrientes Principais</h3>
                                <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
                                  {analysis.micronutrientesPrincipais.map((micro, i) => (
                                    <li key={i}>{micro}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : activeTab === 'health' ? (
                          <div className="space-y-6">
                            {analysis.beneficiosSaude.length > 0 && (
                              <div>
                                <h3 className="font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4" /> Benefícios
                                </h3>
                                <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
                                  {analysis.beneficiosSaude.map((ben, i) => (
                                    <li key={i}>{ben}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {analysis.riscosOuAlertas.length > 0 && (
                              <div>
                                <h3 className="font-bold text-red-600 dark:text-red-400 mb-3">Alertas</h3>
                                <ul className="list-disc pl-5 space-y-1 text-zinc-700 dark:text-zinc-300">
                                  {analysis.riscosOuAlertas.map((risco, i) => (
                                    <li key={i}>{risco}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {analysis.sugestaoParaMelhorar && (
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                                <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-2">Sugestão para Melhorar</h3>
                                <p className="text-emerald-900 dark:text-emerald-100 text-sm">{analysis.sugestaoParaMelhorar}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {isGeneratingRecipe ? (
                              <div className="flex flex-col items-center justify-center py-12 text-emerald-600 dark:text-emerald-400">
                                <ChefHat className="w-12 h-12 animate-bounce mb-4" />
                                <p className="font-medium">O chef IA está preparando a receita...</p>
                              </div>
                            ) : recipe ? (
                              <div className="space-y-8">
                                <div className="flex gap-4">
                                  <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-4 py-3 rounded-2xl flex-1 text-center border border-orange-100 dark:border-orange-900/30">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">Tempo de Preparo</p>
                                    <p className="text-lg font-semibold">{recipe.tempoPreparo}</p>
                                  </div>
                                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-2xl flex-1 text-center border border-blue-100 dark:border-blue-900/30">
                                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">Rendimento</p>
                                    <p className="text-lg font-semibold">{recipe.rendimento}</p>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">🛒</span>
                                    Ingredientes
                                  </h3>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {recipe.ingredientes.map((ing, i) => (
                                      <li key={i} className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                                        <span className="text-zinc-700 dark:text-zinc-300 text-sm">{ing}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div>
                                  <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">👨‍🍳</span>
                                    Modo de Preparo
                                  </h3>
                                  <div className="space-y-4">
                                    {recipe.modoPreparo.map((passo, i) => (
                                      <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex gap-4">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold flex items-center justify-center flex-shrink-0">
                                          {i + 1}
                                        </div>
                                        <p className="text-zinc-700 dark:text-zinc-300 pt-1 text-sm leading-relaxed">{passo}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Q&A Section */}
                  <div className="mt-10 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                      Ficou com alguma dúvida?
                    </h3>
                    
                    {answer && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="markdown-body prose prose-zinc dark:prose-invert prose-sm max-w-none">
                          <Markdown>{answer}</Markdown>
                        </div>
                      </motion.div>
                    )}

                    <form onSubmit={handleAskQuestion} className="relative">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Pergunte algo sobre este alimento..."
                        className="block w-full pl-4 pr-12 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
                        disabled={isAsking}
                      />
                      <button
                        type="submit"
                        disabled={!question.trim() || isAsking}
                        className="absolute inset-y-1.5 right-1.5 p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAsking ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: History & Stats */}
          <aside className="space-y-8 sticky top-28">
            <section className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                  <History className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  Recentes
                </h3>
              </div>
              
              {history.length > 0 ? (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setAnalysis(item.result)}
                      className="w-full text-left p-4 rounded-2xl border border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700 transition-all group flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                          {item.result.nomePrato || 'Análise de Alimento'}
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">{item.date}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-500 dark:group-hover:text-zinc-400 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">Nenhuma análise recente.</p>
                  {!user && (
                    <button
                      onClick={loginWithGoogle}
                      className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                      Faça login para salvar seu histórico
                    </button>
                  )}
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>

      {/* Mobile Navigation Placeholder */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-8 py-4 flex justify-around items-center z-50 transition-colors duration-300">
        <button className="text-emerald-500 flex flex-col items-center gap-1">
          <Apple className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button className="text-zinc-400 dark:text-zinc-500 flex flex-col items-center gap-1">
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Histórico</span>
        </button>
      </nav>
    </div>
  );
}
