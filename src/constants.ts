import { Category, Problem, Bank, TimeSlot } from './types';

export const BANKS: Bank[] = [
  {
    id: 'banpais',
    name: 'Banpaís',
    accountNumber: '21-001-004567-8',
    accountHolder: 'LeyUp Legal S.A.',
    accountType: 'Cuenta de Cheques'
  },
  {
    id: 'bac',
    name: 'BAC Credomatic',
    accountNumber: '745612309',
    accountHolder: 'LeyUp Legal S.A.',
    accountType: 'Cuenta de Ahorros'
  },
  {
    id: 'occidente',
    name: 'Banco de Occidente',
    accountNumber: '11-401-009821-0',
    accountHolder: 'LeyUp Legal S.A.',
    accountType: 'Cuenta de Ahorros'
  },
  {
    id: 'atlantida',
    name: 'Banco Atlántida',
    accountNumber: '010120345678',
    accountHolder: 'LeyUp Legal S.A.',
    accountType: 'Cuenta de Cheques'
  }
];

export const TIME_SLOTS: TimeSlot[] = [
  { id: 's1', time: '09:00 AM', available: true },
  { id: 's2', time: '09:30 AM', available: false },
  { id: 's3', time: '10:00 AM', available: true },
  { id: 's4', time: '10:30 AM', available: true }, // Fixed typo in property name
  { id: 's5', time: '11:00 AM', available: true },
  { id: 's6', time: '11:30 AM', available: true },
  { id: 's7', time: '02:00 PM', available: true },
  { id: 's8', time: '02:30 PM', available: false },
  { id: 's9', time: '03:00 PM', available: true },
  { id: 's10', time: '03:30 PM', available: true },
];

// Re-fixing the typo in TIME_SLOTS to be consistent
export const AVAILABLE_SLOTS: TimeSlot[] = [
  { id: 's1', time: '09:00 AM', available: true },
  { id: 's2', time: '09:30 AM', available: false },
  { id: 's3', time: '10:00 AM', available: true },
  { id: 's4', time: '10:30 AM', available: true },
  { id: 's5', time: '11:00 AM', available: true },
  { id: 's6', time: '11:30 AM', available: true },
  { id: 's7', time: '02:00 PM', available: true },
  { id: 's8', time: '02:30 PM', available: false },
  { id: 's9', time: '03:00 PM', available: true },
  { id: 's10', time: '03:30 PM', available: true },
];

export const CATEGORIES: Category[] = [
  {
    id: 'familiar',
    title: 'Familiar',
    icon: 'Users',
    description: 'Divorcios, pensiones, custodia y más.'
  },
  {
    id: 'deudas',
    title: 'Deudas',
    icon: 'CreditCard',
    description: 'Cobros indebidos, embargos, préstamos.'
  },
  {
    id: 'laboral',
    title: 'Laboral',
    icon: 'Briefcase',
    description: 'Despidos, contratos, prestaciones.'
  },
  {
    id: 'contratos',
    title: 'Contratos',
    icon: 'FileText',
    description: 'Alquileres, compraventa, servicios.'
  },
  {
    id: 'urgente',
    title: 'Urgencias',
    icon: 'AlertTriangle',
    description: 'Problemas que requieren atención inmediata.'
  },
  {
    id: 'otros',
    title: 'Otros',
    icon: 'HelpCircle',
    description: 'Cualquier otro asunto legal no categorizado.'
  }
];

export const PROBLEMS: Problem[] = [
  // Familiar
  { id: 'divorcio', categoryId: 'familiar', title: 'Quiero divorciarme', description: 'Asesoría sobre el proceso de separación legal.' },
  { id: 'pension', categoryId: 'familiar', title: 'Pensión alimenticia', description: 'Cálculo y solicitud de pensión para hijos.' },
  { id: 'custodia', categoryId: 'familiar', title: 'Custodia de hijos', description: 'Derechos y deberes sobre el cuidado de menores.' },
  
  // Deudas
  { id: 'embargo', categoryId: 'deudas', title: 'Amenaza de embargo', description: 'Qué hacer ante una notificación de embargo.' },
  { id: 'cobro_indebido', categoryId: 'deudas', title: 'Cobro indebido', description: 'Reclamación por cargos no reconocidos.' },
  
  // Laboral
  { id: 'despido', categoryId: 'laboral', title: 'Despido injustificado', description: 'Cálculo de liquidación y pasos legales.' },
  { id: 'prestaciones', categoryId: 'laboral', title: 'Pago de prestaciones', description: 'Reclamo de vacaciones, aguinaldo, etc.' },
  
  // Contratos
  { id: 'alquiler', categoryId: 'contratos', title: 'Problema de alquiler', description: 'Conflictos con el arrendador o arrendatario.' },
  { id: 'compraventa', categoryId: 'contratos', title: 'Incumplimiento de contrato', description: 'Problemas con compra de bienes o servicios.' },

  // Urgencias
  { id: 'detencion', categoryId: 'urgente', title: 'Detención policial', description: 'Asesoría inmediata ante una detención.' },
  { id: 'violencia', categoryId: 'urgente', title: 'Violencia doméstica', description: 'Medidas de protección y denuncia inmediata.' },

  // Otros
  { id: 'otros_asuntos', categoryId: 'otros', title: 'Otros asuntos legales', description: 'Consulta general sobre temas diversos.' }
];

export const QUESTIONS_BY_PROBLEM: Record<string, any[]> = {
  'divorcio': [
    { id: 'q1', text: '¿Es un divorcio de mutuo acuerdo?', options: ['Sí, ambos estamos de acuerdo', 'No, hay conflicto'] },
    { id: 'q2', text: '¿Tienen hijos menores de edad?', options: ['Sí', 'No'] },
    { id: 'q3', text: '¿Tienen bienes en común (casa, autos)?', options: ['Sí', 'No'] }
  ],
  'pension': [
    { id: 'q1', text: '¿Ya existe una demanda previa?', options: ['Sí', 'No'] },
    { id: 'q2', text: '¿Cuántos hijos menores tienen?', options: ['1', '2', '3 o más'] },
    { id: 'q3', text: '¿Conoce los ingresos aproximados de la otra parte?', options: ['Sí', 'No'] }
  ],
  'custodia': [
    { id: 'q1', text: '¿Existe riesgo inmediato para el menor?', options: ['Sí', 'No'] },
    { id: 'q2', text: '¿Hay un acuerdo previo de visitas?', options: ['Sí', 'No'] },
    { id: 'q3', text: '¿El otro padre/madre está de acuerdo con el cambio?', options: ['Sí', 'No'] }
  ],
  'embargo': [
    { id: 'q1', text: '¿Ya recibió una notificación judicial?', options: ['Sí, tengo el documento', 'No, solo son llamadas/mensajes'] },
    { id: 'q2', text: '¿La deuda es con un banco o una persona particular?', options: ['Banco / Financiera', 'Persona particular / Comercio'] },
    { id: 'q3', text: '¿Sabe si ya existe una orden de retención de salario?', options: ['Sí', 'No', 'No estoy seguro'] }
  ],
  'cobro_indebido': [
    { id: 'q1', text: '¿Ha intentado reclamar directamente a la institución?', options: ['Sí, y me rechazaron', 'No he reclamado aún'] },
    { id: 'q2', text: '¿Tiene comprobantes de que el cobro es incorrecto?', options: ['Sí, tengo recibos/contratos', 'No tengo documentos'] },
    { id: 'q3', text: '¿El monto es mayor a L5,000?', options: ['Sí', 'No'] }
  ],
  'despido': [
    { id: 'q1', text: '¿Recibió una carta de despido?', options: ['Sí', 'No'] },
    { id: 'q2', text: '¿Cuánto tiempo trabajó en la empresa?', options: ['Menos de 1 año', '1-5 años', 'Más de 5 años'] },
    { id: 'q3', text: '¿Le pagaron su liquidación?', options: ['Nada', 'Parcialmente', 'Sí, pero creo que está mal'] }
  ],
  'prestaciones': [
    { id: 'q1', text: '¿Renunció o fue despedido?', options: ['Renuncié voluntariamente', 'Fui despedido'] },
    { id: 'q2', text: '¿Recibía su salario de forma puntual?', options: ['Sí', 'No siempre'] },
    { id: 'q3', text: '¿Estaba inscrito en el IHSS (Seguro Social)?', options: ['Sí', 'No'] }
  ],
  'alquiler': [
    { id: 'q1', text: '¿Existe un contrato escrito firmado?', options: ['Sí', 'No, fue trato verbal'] },
    { id: 'q2', text: '¿El problema es por falta de pago o por desalojo?', options: ['Falta de pago', 'Desalojo / Reparaciones'] },
    { id: 'q3', text: '¿Ha recibido alguna nota de desahucio?', options: ['Sí', 'No'] }
  ],
  'compraventa': [
    { id: 'q1', text: '¿El bien es mueble (carro, equipo) o inmueble (casa, terreno)?', options: ['Mueble', 'Inmueble'] },
    { id: 'q2', text: '¿Ya realizó algún pago parcial o total?', options: ['Sí', 'No'] },
    { id: 'q3', text: '¿Tiene el contrato o promesa de venta?', options: ['Sí', 'No'] }
  ],
  'detencion': [
    { id: 'q1', text: '¿La persona ya está en una posta o centro de detención?', options: ['Sí', 'No lo sé aún'] },
    { id: 'q2', text: '¿Se le han leído sus derechos?', options: ['Sí', 'No', 'No lo sé'] },
    { id: 'q3', text: '¿Es por una falta administrativa o un supuesto delito?', options: ['Falta (escándalo, etc)', 'Delito', 'No lo sé'] }
  ],
  'violencia': [
    { id: 'q1', text: '¿Se encuentra en un lugar seguro en este momento?', options: ['Sí', 'No, necesito ayuda ya'] },
    { id: 'q2', text: '¿Desea interponer una denuncia formal?', options: ['Sí', 'No estoy seguro/a'] },
    { id: 'q3', text: '¿Hay menores de edad involucrados?', options: ['Sí', 'No'] }
  ],
  'otros_asuntos': [
    { id: 'q1', text: '¿Su consulta es sobre una persona física o una empresa?', options: ['Persona física', 'Empresa'] },
    { id: 'q2', text: '¿Existe algún documento firmado relacionado?', options: ['Sí', 'No'] },
    { id: 'q3', text: '¿Es un asunto urgente?', options: ['Sí', 'No'] }
  ]
};
