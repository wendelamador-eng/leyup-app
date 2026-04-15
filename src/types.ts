export type CategoryId = 'familiar' | 'deudas' | 'laboral' | 'contratos' | 'urgente' | 'otros';

export interface Category {
  id: CategoryId;
  title: string;
  icon: string;
  description: string;
}

export interface Problem {
  id: string;
  categoryId: CategoryId;
  title: string;
  description: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
}

export interface LegalResponse {
  diagnosis: string;
  whatToDo: string;
  steps: string[];
  risks: string[];
  estimatedCosts: string;
  estimatedTime: string;
}

export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
  accountType: string;
  logo?: string;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface Subscription {
  active: boolean;
  startDate: number;
  endDate: number;
  planId: 'ai_chat' | 'lawyer';
}

export interface PaymentInfo {
  bankId: string;
  slotId?: string; // Optional for AI Chat
  proofUrl: string;
  status: 'pending' | 'verified' | 'rejected';
  contactType?: 'call' | 'chat';
  planId: 'ai_chat' | 'lawyer';
}

export interface Case {
  id: string;
  problemId: string;
  problemTitle: string;
  timestamp: number;
  answers: Record<string, string>;
  response?: LegalResponse;
  status: 'pending' | 'completed' | 'validated';
  payment?: PaymentInfo;
  subscription?: Subscription;
  messages?: ChatMessage[];
}
