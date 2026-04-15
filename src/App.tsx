import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, CreditCard, Briefcase, FileText, AlertTriangle, 
  ChevronRight, ArrowLeft, CheckCircle2, Clock, AlertCircle,
  History, Home, ShieldCheck, MessageSquare, Download,
  Upload, Phone, Check, Loader2, Calendar, Lock, HelpCircle
} from 'lucide-react';
import { CATEGORIES, PROBLEMS, QUESTIONS_BY_PROBLEM, BANKS, AVAILABLE_SLOTS } from './constants';
import { CategoryId, Problem, Case, LegalResponse, Bank, TimeSlot, PaymentInfo } from './types';
import { getLegalAdvice } from './services/geminiService';
import { jsPDF } from 'jspdf';

const IconMap: Record<string, any> = {
  Users, CreditCard, Briefcase, FileText, AlertTriangle, HelpCircle
};

export default function App() {
  const [view, setView] = useState<'home' | 'problems' | 'profile' | 'flow' | 'result' | 'history' | 'payment_wizard'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [userProfile, setUserProfile] = useState({ name: '', age: '', occupation: '', gender: '' });
  const [isFinalStep, setIsFinalStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legalResult, setLegalResult] = useState<LegalResponse | null>(null);
  const [history, setHistory] = useState<Case[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(true);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Payment Wizard State
  const [paymentStep, setPaymentStep] = useState<'bank' | 'schedule' | 'upload' | 'verifying' | 'confirmed' | 'contact_choice'>('bank');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [validationProgress, setValidationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history and profile from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('leyup_history') || localStorage.getItem('legal_facil_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedProfile = localStorage.getItem('leyup_user_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));
  }, []);

  const saveToHistory = (newCase: Case) => {
    const updated = [newCase, ...history.filter(c => c.id !== newCase.id)];
    setHistory(updated);
    localStorage.setItem('leyup_history', JSON.stringify(updated));
  };

  const resetFlow = () => {
    setView('home');
    setSelectedCategory(null);
    setSelectedProblem(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setAdditionalDetails('');
    setIsFinalStep(false);
    setLegalResult(null);
    setCurrentCaseId(null);
  };

  const handleCategorySelect = (id: CategoryId) => {
    setSelectedCategory(id);
    setView('problems');
  };

  const handleProblemSelect = (problem: Problem) => {
    setSelectedProblem(problem);
    setView('flow');
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleAnswer = (option: string) => {
    const questions = QUESTIONS_BY_PROBLEM[selectedProblem?.id || ''] || [];
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswers = { ...answers, [currentQuestion.text]: option };
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinalStep(true);
    }
  };

  const handleSubmit = async (finalAnswers: Record<string, string>) => {
    setLoading(true);
    try {
      const result = await getLegalAdvice(selectedProblem?.title || '', finalAnswers, additionalDetails, userProfile);
      setLegalResult(result);
      
      const caseId = Math.random().toString(36).substr(2, 9);
      setCurrentCaseId(caseId);

      const newCase: Case = {
        id: caseId,
        problemId: selectedProblem?.id || '',
        problemTitle: selectedProblem?.title || '',
        timestamp: Date.now(),
        answers: finalAnswers,
        response: result,
        status: 'completed'
      };
      saveToHistory(newCase);
      setView('result');
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Error al procesar tu consulta. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const startPaymentFlow = () => {
    setView('payment_wizard');
    setPaymentStep('bank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("El archivo es demasiado grande. Máximo 5MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitPayment = () => {
    setPaymentStep('verifying');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setValidationProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setPaymentStep('confirmed');
        updateCaseStatus('validated');
      }
    }, 100);
  };

  const updateCaseStatus = (status: 'pending' | 'completed' | 'validated', contactType?: 'call' | 'chat') => {
    if (!currentCaseId) return;
    const currentCase = history.find(c => c.id === currentCaseId);
    if (currentCase) {
      const updatedCase: Case = {
        ...currentCase,
        status,
        payment: {
          bankId: selectedBank?.id || '',
          slotId: selectedSlot?.id || '',
          proofUrl: proofImage || '',
          status: status === 'validated' ? 'verified' : 'pending',
          contactType
        }
      };
      saveToHistory(updatedCase);
    }
  };

  const selectContactType = (type: 'call' | 'chat') => {
    updateCaseStatus('validated', type);
    setInfoMessage(`Iniciando ${type === 'call' ? 'llamada' : 'chat'} con el abogado...`);
    resetFlow();
  };

  const downloadPDF = () => {
    if (!legalResult || !selectedProblem) return;

    const doc = new jsPDF();
    const margin = 20;
    let y = 20;

    // Header with Logo
    // Blue Icon Box
    doc.setFillColor(37, 99, 235); // blue-600
    doc.roundedRect(margin, y - 12, 14, 14, 3, 3, 'F');
    
    // White Shield Icon inside box
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.8);
    // Shield top
    doc.line(margin + 4, y - 8, margin + 10, y - 8);
    // Shield sides
    doc.line(margin + 4, y - 8, margin + 4, y - 4);
    doc.line(margin + 10, y - 8, margin + 10, y - 4);
    // Shield bottom point
    doc.line(margin + 4, y - 4, margin + 7, y - 1);
    doc.line(margin + 10, y - 4, margin + 7, y - 1);
    // Checkmark
    doc.setLineWidth(0.4);
    doc.line(margin + 5.5, y - 4.5, margin + 7, y - 3);
    doc.line(margin + 7, y - 3, margin + 8.5, y - 6);

    // Text "LeyUp"
    doc.setFontSize(26);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('LeyUp', margin + 18, y + 1);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Abogado al instante', margin + 18, y + 6);
    y += 15;

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.2);
    doc.line(margin, y, 190, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-HN')}`, margin, y);
    y += 10;

    // User Profile Card (Simulated)
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(margin, y, 170, 20, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.setFont('helvetica', 'bold');
    doc.text('PERFIL DEL CONSULTANTE', margin + 5, y + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Nombre: ${userProfile.name || 'Anónimo'}`, margin + 5, y + 14);
    doc.text(`Género: ${userProfile.gender || '-'}`, margin + 60, y + 14);
    doc.text(`Edad: ${userProfile.age || '-'} años`, margin + 100, y + 14);
    doc.text(`Ocupación: ${userProfile.occupation || '-'}`, margin + 135, y + 14);
    y += 30;

    // Case Title
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('ASUNTO:', margin, y);
    doc.setFont('helvetica', 'normal');
    const titleLines = doc.splitTextToSize(selectedProblem.title, 145);
    doc.text(titleLines, margin + 25, y);
    y += (titleLines.length * 7) + 10;

    // Diagnosis
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('1. DIAGNÓSTICO LEGAL', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // slate-700
    doc.setFontSize(10);
    const diagnosisLines = doc.splitTextToSize(legalResult.diagnosis, 170);
    doc.text(diagnosisLines, margin, y);
    y += diagnosisLines.length * 5 + 12;

    // Recommendations
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('2. RECOMENDACIONES ESTRATÉGICAS', margin, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(10);
    const whatToDoLines = doc.splitTextToSize(legalResult.whatToDo, 170);
    doc.text(whatToDoLines, margin, y);
    y += whatToDoLines.length * 5 + 12;

    // Steps
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('3. PASOS A SEGUIR', margin, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    legalResult.steps.forEach((step, i) => {
      const stepLines = doc.splitTextToSize(`${i + 1}. ${step}`, 160);
      if (y + stepLines.length * 5 > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(stepLines, margin + 5, y);
      y += stepLines.length * 5 + 3;
    });
    y += 10;

    // Costs and Time
    const timeText = `Tiempo estimado del proceso: ${legalResult.estimatedTime}`;
    const costsText = `Costos legales aproximados: ${legalResult.estimatedCosts}`;
    
    const timeLines = doc.splitTextToSize(timeText, 160);
    const costsLines = doc.splitTextToSize(costsText, 160);
    const boxHeight = (timeLines.length + costsLines.length) * 6 + 15;

    if (y + boxHeight > 270) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFillColor(239, 246, 255); // blue-50
    doc.roundedRect(margin, y, 170, boxHeight, 3, 3, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('ESTIMACIONES PRELIMINARES', margin + 5, y + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    let textY = y + 15;
    doc.text(timeLines, margin + 5, textY);
    textY += timeLines.length * 6;
    doc.text(costsLines, margin + 5, textY);
    y += boxHeight + 15;

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    const footerText = 'AVISO LEGAL: Este documento es una orientación preliminar generada por inteligencia artificial basada en las leyes de Honduras. No constituye una relación abogado-cliente formal. Se recomienda encarecidamente la validación de este diagnóstico con un profesional del derecho colegiado antes de tomar cualquier acción legal.';
    const footerLines = doc.splitTextToSize(footerText, 170);
    doc.text(footerLines, margin, 280);

    doc.save(`LeyUp_Diagnostico_${userProfile.name || 'Usuario'}_${selectedProblem.id}.pdf`);
  };

  if (showTerms) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-200">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center text-slate-900 mb-2">LeyUp</h1>
          <p className="text-blue-600 font-bold text-center mb-6 uppercase tracking-widest text-xs">Abogado al instante</p>
          <p className="text-slate-600 text-center mb-8 leading-relaxed">
            Obtén orientación legal inmediata con IA y conéctate con abogados reales para validación jurídica.
          </p>
          
          <div className="space-y-4 mb-8">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">
                Acepto los términos y condiciones y entiendo que la IA brinda orientación inicial.
              </span>
            </label>
          </div>

          <button
            disabled={!acceptedTerms}
            onClick={() => {
              setShowTerms(false);
              if (!userProfile.name) {
                setView('profile');
              }
            }}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 ${
              acceptedTerms ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Comenzar ahora
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetFlow}>
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-2xl text-slate-900 tracking-tighter">LeyUp</span>
          </div>
          <button 
            onClick={() => setView('history')}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors relative"
          >
            <History className="w-6 h-6 text-slate-600" />
            {history.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white"></span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">¿En qué problema legal necesitas ayuda?</h2>
                <p className="text-slate-500">Selecciona una categoría para comenzar tu asesoría gratuita.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map((cat) => {
                  const Icon = IconMap[cat.icon] || AlertCircle;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all text-left flex items-center gap-6"
                    >
                      <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-blue-50 transition-colors">
                        <Icon className="w-8 h-8 text-slate-600 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-slate-900">{cat.title}</h3>
                        <p className="text-slate-500 text-sm">{cat.description}</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {view === 'problems' && (
            <motion.div
              key="problems"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <button 
                onClick={() => setView('home')}
                className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" /> Volver a categorías
              </button>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.title}
                </h2>
                <p className="text-slate-500">Selecciona el problema específico que enfrentas.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {PROBLEMS.filter(p => p.categoryId === selectedCategory).map((prob) => (
                  <button
                    key={prob.id}
                    onClick={() => handleProblemSelect(prob)}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all text-left"
                  >
                    <h3 className="font-bold text-lg text-slate-900">{prob.title}</h3>
                    <p className="text-slate-500 text-sm mt-1">{prob.description}</p>
                  </button>
                ))}
                {PROBLEMS.filter(p => p.categoryId === selectedCategory).length === 0 && (
                  <div className="bg-blue-50 p-8 rounded-3xl text-center space-y-4 border border-blue-100">
                    <MessageSquare className="w-12 h-12 text-blue-400 mx-auto" />
                    <p className="text-blue-700 font-medium">Esta categoría estará disponible pronto.</p>
                    <button onClick={() => setView('home')} className="text-blue-600 underline">Elegir otra categoría</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-900">Datos básicos</h2>
                <p className="text-slate-500">Esta información ayudará a que el diagnóstico sea más preciso.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nombre completo</label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 transition-all text-slate-700 font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Edad</label>
                      <input
                        type="number"
                        value={userProfile.age}
                        onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
                        placeholder="Ej: 30"
                        className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 transition-all text-slate-700 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Género</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setUserProfile({ ...userProfile, gender: 'Hombre' })}
                          className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                            userProfile.gender === 'Hombre' 
                              ? 'border-blue-600 bg-blue-50 text-blue-600' 
                              : 'border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          Hombre
                        </button>
                        <button
                          onClick={() => setUserProfile({ ...userProfile, gender: 'Mujer' })}
                          className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                            userProfile.gender === 'Mujer' 
                              ? 'border-blue-600 bg-blue-50 text-blue-600' 
                              : 'border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          Mujer
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ocupación</label>
                    <input
                      type="text"
                      value={userProfile.occupation}
                      onChange={(e) => setUserProfile({ ...userProfile, occupation: e.target.value })}
                      placeholder="Ej: Empleado, Estudiante, Comerciante"
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 transition-all text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem('leyup_user_profile', JSON.stringify(userProfile));
                    if (!selectedProblem) {
                      setView('home');
                    } else {
                      setView('flow');
                    }
                  }}
                  disabled={!userProfile.name || !userProfile.age || !userProfile.gender}
                  className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                    userProfile.name && userProfile.age && userProfile.gender ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  {selectedProblem ? 'Siguiente' : 'Guardar y continuar'} <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button 
                onClick={() => {
                  if (selectedProblem) {
                    setView('problems');
                  } else {
                    setShowTerms(true);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium block mx-auto"
              >
                Volver atrás
              </button>
            </motion.div>
          )}

          {view === 'flow' && (
            <motion.div
              key="flow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                    {isFinalStep ? 'Paso Final' : `Paso ${currentQuestionIndex + 1} de ${QUESTIONS_BY_PROBLEM[selectedProblem?.id || '']?.length || 0}`}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">
                    {isFinalStep ? '95%' : `${Math.round(((currentQuestionIndex + 1) / (QUESTIONS_BY_PROBLEM[selectedProblem?.id || '']?.length || 1)) * 100)}%`} completado
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: isFinalStep ? '95%' : `${((currentQuestionIndex + 1) / (QUESTIONS_BY_PROBLEM[selectedProblem?.id || '']?.length || 1)) * 100}%` }}
                    className="h-full bg-blue-600"
                  />
                </div>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-8">
                <AnimatePresence mode="wait">
                  {!isFinalStep ? (
                    <motion.div
                      key="question"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                        {QUESTIONS_BY_PROBLEM[selectedProblem?.id || '']?.[currentQuestionIndex]?.text}
                      </h2>

                      <div className="space-y-3">
                        {QUESTIONS_BY_PROBLEM[selectedProblem?.id || '']?.[currentQuestionIndex]?.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleAnswer(option)}
                            className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-600 hover:bg-blue-50 transition-all text-left font-semibold text-slate-700 hover:text-blue-700 flex justify-between items-center group"
                          >
                            {option}
                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="final"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                          ¿Algo más que debamos saber?
                        </h2>
                        <p className="text-slate-500 text-sm">Agrega un detalle breve sobre tu caso (opcional).</p>
                      </div>

                      <div className="space-y-2">
                        <textarea
                          value={additionalDetails}
                          onChange={(e) => setAdditionalDetails(e.target.value.slice(0, 150))}
                          placeholder="Ej: Sucedió hace dos días en mi lugar de trabajo..."
                          className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 focus:ring-0 transition-all min-h-[120px] resize-none text-slate-700 font-medium"
                        />
                        <div className="flex justify-end">
                          <span className={`text-xs font-bold ${additionalDetails.length >= 150 ? 'text-red-500' : 'text-slate-400'}`}>
                            {additionalDetails.length}/150
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSubmit(answers)}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        Analizar mi caso ahora <ChevronRight className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button 
                onClick={() => {
                  if (isFinalStep) {
                    setIsFinalStep(false);
                  } else {
                    setView('problems');
                  }
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium"
              >
                {isFinalStep ? 'Volver a las preguntas' : 'Cancelar y volver'}
              </button>
            </motion.div>
          )}

          {loading && (
            <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-t-blue-600 rounded-full absolute top-0 left-0 animate-spin"></div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Analizando tu caso...</h3>
                <p className="text-slate-500">Nuestra IA está preparando tu diagnóstico legal.</p>
              </div>
            </div>
          )}

          {view === 'result' && legalResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-green-50 border border-green-100 p-6 rounded-3xl flex items-center gap-4">
                <div className="bg-green-500 p-2 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900">Diagnóstico completado</h3>
                  <p className="text-green-700 text-sm">Hemos analizado tu situación basándonos en tus respuestas.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-blue-600" /> Diagnóstico del caso
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{legalResult.diagnosis}</p>
                  </section>

                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-green-600" /> ¿Qué puedes hacer?
                    </h3>
                    <p className="text-slate-600 leading-relaxed">{legalResult.whatToDo}</p>
                  </section>

                  <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="text-xl font-bold text-slate-900">Pasos a seguir</h3>
                    <div className="space-y-4">
                      {Array.isArray(legalResult.steps) ? legalResult.steps.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">{i + 1}</span>
                          <p className="text-slate-600 pt-1">{step}</p>
                        </div>
                      )) : <p className="text-slate-600">{legalResult.steps}</p>}
                    </div>
                  </section>

                  <div className="flex justify-center pt-8">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={downloadPDF}
                      className="flex items-center gap-3 px-10 py-5 bg-white text-blue-700 border-2 border-blue-100 rounded-3xl font-black hover:bg-blue-50 hover:border-blue-200 transition-all shadow-xl shadow-blue-100/50 group"
                    >
                      <Download className="w-6 h-6 group-hover:bounce" /> 
                      <div className="text-left">
                        <p className="text-sm leading-none">Descargar Diagnóstico</p>
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Formato PDF Profesional</p>
                      </div>
                    </motion.button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-4">
                    <h4 className="font-bold text-amber-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Riesgos potenciales
                    </h4>
                    <ul className="space-y-2">
                      {Array.isArray(legalResult.risks) ? legalResult.risks.map((risk, i) => (
                        <li key={i} className="text-sm text-amber-800 flex gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0"></span>
                          {risk}
                        </li>
                      )) : <li className="text-sm text-amber-800">{legalResult.risks}</li>}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Tiempo estimado</p>
                        <p className="font-bold text-slate-900">{legalResult.estimatedTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">Costos estimados</p>
                        <p className="font-bold text-slate-900">{legalResult.estimatedCosts}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-amber-600 font-bold animate-pulse">
                      <span>🔥</span>
                      <span className="text-sm uppercase tracking-wider">Agenda limitada hoy</span>
                    </div>

                    <button 
                      onClick={startPaymentFlow}
                      className="w-full group relative overflow-hidden rounded-[20px] bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 p-8 text-white shadow-2xl shadow-blue-200 transition-all hover:scale-[1.03] hover:shadow-blue-300 active:scale-95 animate-shine"
                    >
                      <div className="relative z-10 space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-2xl">👨‍⚖️</span>
                          <h4 className="text-xl font-black tracking-tight">Hablar con un abogado</h4>
                        </div>
                        
                        <p className="text-blue-100 font-medium">Recibe 1 hora de asesoría personalizada</p>
                        
                        <div className="pt-2">
                          <div className="text-5xl font-black tracking-tighter">L599</div>
                          <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mt-1">Pago único</p>
                        </div>
                      </div>
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Pago seguro</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Sin costos ocultos</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Atención verificada</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={resetFlow}
                  className="px-8 py-3 bg-slate-200 text-slate-700 rounded-full font-bold hover:bg-slate-300 transition-colors"
                >
                  Nueva consulta
                </button>
              </div>
            </motion.div>
          )}

          {view === 'payment_wizard' && (
            <motion.div
              key="payment_wizard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setView('result')} className="p-2 hover:bg-slate-100 rounded-full">
                  <ArrowLeft className="w-6 h-6 text-slate-600" />
                </button>
                <div className="flex gap-2">
                  {['bank', 'schedule', 'upload'].includes(paymentStep) && [1, 2, 3].map((s) => (
                    <div key={s} className={`w-8 h-1.5 rounded-full ${
                      (paymentStep === 'bank' && s === 1) || 
                      (paymentStep === 'schedule' && s <= 2) || 
                      (paymentStep === 'upload' && s <= 3) ? 'bg-blue-600' : 'bg-slate-200'
                    }`} />
                  ))}
                </div>
                <div className="w-10"></div>
              </div>

              {paymentStep === 'bank' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Selecciona tu banco</h2>
                    <p className="text-slate-500">Elige el banco para realizar tu transferencia.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BANKS.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => { setSelectedBank(bank); setPaymentStep('schedule'); }}
                        className="bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-blue-600 transition-all text-left space-y-4 group"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-lg text-slate-900">{bank.name}</h3>
                          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50">
                            <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400 font-bold uppercase">Cuenta</p>
                          <p className="font-mono text-sm text-slate-600">{bank.accountNumber}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-50">
                          <p className="text-[10px] text-slate-400 font-medium">{bank.accountHolder}</p>
                          <p className="text-[10px] text-slate-400">{bank.accountType}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentStep === 'schedule' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">¿Cuándo deseas hablar?</h2>
                    <p className="text-slate-500">Selecciona un horario disponible para hoy.</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_SLOTS.map((slot) => (
                      <button
                        key={slot.id}
                        disabled={!slot.available}
                        onClick={() => { setSelectedSlot(slot); setPaymentStep('upload'); }}
                        className={`p-4 rounded-2xl border-2 transition-all text-center relative ${
                          slot.available 
                            ? 'border-slate-100 hover:border-blue-600 bg-white' 
                            : 'border-slate-50 bg-slate-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <p className={`font-bold ${slot.available ? 'text-slate-700' : 'text-slate-400'}`}>{slot.time}</p>
                        <span className={`text-[10px] font-bold uppercase ${slot.available ? 'text-green-600' : 'text-slate-400'}`}>
                          {slot.available ? 'Disponible' : 'Ocupado'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentStep === 'upload' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Sube tu comprobante</h2>
                    <p className="text-slate-500">Adjunta la captura de tu transferencia bancaria.</p>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-4">
                    {proofImage ? (
                      <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-slate-200">
                        <img src={proofImage} alt="Comprobante" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => setProofImage(null)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-lg"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="bg-blue-50 p-6 rounded-full">
                          <Upload className="w-10 h-10 text-blue-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-slate-700">Haz clic para subir</p>
                          <p className="text-xs text-slate-400">JPG o PNG (Máx 5MB)</p>
                        </div>
                      </>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {!proofImage && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                      >
                        Seleccionar archivo
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-100 p-4 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Tu pago será verificado manualmente por nuestro equipo administrativo. Este proceso toma entre 10 a 15 minutos.
                    </p>
                  </div>

                  <button
                    disabled={!proofImage}
                    onClick={submitPayment}
                    className={`w-full py-4 rounded-2xl font-bold text-white transition-all ${
                      proofImage ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Enviar para validación
                  </button>
                </div>
              )}

              {paymentStep === 'verifying' && (
                <div className="text-center space-y-8 py-12">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={377} strokeDashoffset={377 - (377 * validationProgress) / 100} className="text-blue-600 transition-all duration-100" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Pago en revisión</h2>
                    <p className="text-slate-500">Estamos validando tu comprobante...</p>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold mt-4">
                      <Clock className="w-3 h-3" /> Tiempo estimado: 10-15 min
                    </div>
                  </div>
                </div>
              )}

              {paymentStep === 'confirmed' && (
                <div className="text-center space-y-8 py-12">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-100"
                  >
                    <Check className="w-12 h-12 text-white" />
                  </motion.div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900">¡Pago confirmado!</h2>
                    <p className="text-slate-500">Tu asesoría legal ha sido activada con éxito.</p>
                  </div>
                  <button 
                    onClick={() => setPaymentStep('contact_choice')}
                    className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                  >
                    Continuar
                  </button>
                </div>
              )}

              {paymentStep === 'contact_choice' && (
                <div className="space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">¿Cómo deseas hablar con el abogado?</h2>
                    <p className="text-slate-500">Elige el medio de contacto de tu preferencia.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => selectContactType('call')}
                      className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-600 transition-all flex flex-col items-center gap-4 group"
                    >
                      <div className="bg-blue-50 p-6 rounded-full group-hover:bg-blue-600 transition-colors">
                        <Phone className="w-10 h-10 text-blue-600 group-hover:text-white" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-xl text-slate-900">Llamada</h3>
                        <p className="text-slate-400 text-sm">Conversación directa por voz</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => selectContactType('chat')}
                      className="bg-white p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-600 transition-all flex flex-col items-center gap-4 group"
                    >
                      <div className="bg-blue-50 p-6 rounded-full group-hover:bg-blue-600 transition-colors">
                        <MessageSquare className="w-10 h-10 text-blue-600 group-hover:text-white" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-bold text-xl text-slate-900">Chat</h3>
                        <p className="text-slate-400 text-sm">Mensajería instantánea</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Mis Consultas</h2>
                <button 
                  onClick={() => setView('home')}
                  className="text-blue-600 font-bold"
                >
                  Nueva consulta
                </button>
              </div>

              <div className="space-y-4">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-3 rounded-2xl">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{item.problemTitle}</h3>
                        <p className="text-slate-400 text-sm">{new Date(item.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setLegalResult(item.response || null);
                          setView('result');
                        }}
                        className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all"
                      >
                        Ver resultado
                      </button>
                    </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-20 space-y-4">
                    <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                      <History className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-medium">Aún no tienes consultas guardadas.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 md:hidden">
        <div className="max-w-md mx-auto flex justify-around">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Inicio</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-blue-600' : 'text-slate-400'}`}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Historial</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {(error || infoMessage) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-6"
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center ${error ? 'bg-red-50' : 'bg-blue-50'}`}>
                {error ? (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                ) : (
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {error ? 'Atención' : 'Información'}
                </h3>
                <div className="text-slate-600 leading-relaxed text-sm">
                  {error || infoMessage}
                </div>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setInfoMessage(null);
                }}
                className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 ${
                  error ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                } shadow-lg`}
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
