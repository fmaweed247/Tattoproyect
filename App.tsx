
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  User, Mail, Pencil, Image as ImageIcon, Maximize, MapPin, Send,
  Calendar as CalendarIcon, Check, X, ChevronDown, ChevronUp, Briefcase,
  BookOpen, Eye, UserCog, Phone
} from 'lucide-react';

// --- TYPES ---
interface Consultation {
  id: number;
  fullName: string;
  email: string;
  telephone: string;
  idea: string;
  size: string;
  placement: string;
  referenceImageName: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

interface ApprovedAppointment extends Consultation {
  date: string; // YYYY-MM-DD format
}

type View = 'booking' | 'admin';

// --- MOCK DATA ---
const initialConsultations: Consultation[] = [
  { id: 1, fullName: 'Elena Rodriguez (Ejemplo)', email: 'elena@example.com', telephone: '611223344', idea: 'Un fénix resurgiendo de las cenizas en acuarela, cubriendo el omóplato derecho.', size: '15cm x 20cm', placement: 'Omóplato derecho', referenceImageName: 'phoenix-concept.jpg', status: 'pending' },
  { id: 2, fullName: 'Carlos Sanchez (Ejemplo)', email: 'carlos@example.com', telephone: '622334455', idea: 'Brújula de estilo vintage con un mapa del mundo de fondo. Líneas finas y detalladas.', size: '10cm de diámetro', placement: 'Antebrazo', referenceImageName: 'compass-map.png', status: 'pending' },
  { id: 3, fullName: 'Sofia Vergara (Ejemplo)', email: 'sofia@example.com', telephone: '633445566', idea: 'Una pequeña constelación de Lira en el tobillo. Minimalista.', size: '5cm', placement: 'Tobillo', referenceImageName: null, status: 'pending' },
];

const initialAppointments: ApprovedAppointment[] = [
    {
        id: 4, fullName: 'Marco Diaz', email: 'marco@example.com', telephone: '644556677', idea: 'Serpiente enrollada en una daga', size: '18cm', placement: 'Antebrazo',
        referenceImageName: 'snake-dagger.jpg', status: 'approved',
        date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0]
    },
    {
        id: 5, fullName: 'Laura Fernandez', email: 'laura@example.com', telephone: '655667788', idea: 'Retrato de mascota (gato)', size: '12cm', placement: 'Pantorrilla',
        referenceImageName: 'cat-portrait.jpg', status: 'approved',
        date: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0]
    }
];


// --- HELPER COMPONENTS (Defined outside main App component) ---

const IconWrapper: React.FC<{ icon: React.ElementType; className?: string }> = ({ icon: Icon, className }) => (
  <Icon className={`inline-block h-5 w-5 mr-3 text-dark-text-secondary ${className}`} />
);

// FIX: Aliased the `icon` prop to `Icon` during destructuring. React requires component names to be capitalized for JSX.
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ElementType }> = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
      <Icon className="w-5 h-5 text-dark-text-secondary" />
    </div>
    <input
      {...props}
      className="w-full pl-10 p-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all duration-300"
    />
  </div>
);

// FIX: Aliased the `icon` prop to `Icon` during destructuring. React requires component names to be capitalized for JSX.
const TextareaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { icon: React.ElementType }> = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <div className="absolute top-3 left-0 flex items-center pl-3 pointer-events-none">
      <Icon className="w-5 h-5 text-dark-text-secondary" />
    </div>
    <textarea
      {...props}
      className="w-full pl-10 p-3 bg-dark-surface border border-dark-border rounded-lg text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all duration-300 min-h-[120px]"
    ></textarea>
  </div>
);

const FileInputField: React.FC<{ icon: React.ElementType; label: string; fileName: string | null; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ icon: Icon, label, fileName, onChange }) => (
    <div className="relative w-full p-3 bg-dark-surface border-2 border-dashed border-dark-border rounded-lg text-dark-text-primary hover:border-brand-primary transition-all duration-300">
        <input type="file" id="file-upload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onChange} />
        <label htmlFor="file-upload" className="flex flex-col items-center justify-center text-center cursor-pointer">
            <Icon className="w-8 h-8 text-dark-text-secondary mb-2" />
            <span className="font-semibold text-brand-secondary">{label}</span>
            {fileName ? (
                <span className="text-sm text-dark-text-secondary mt-1">{fileName}</span>
            ) : (
                <span className="text-sm text-dark-text-secondary mt-1">Sube una imagen de referencia</span>
            )}
        </label>
    </div>
);


const BookingForm: React.FC = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        telephone: '',
        idea: '',
        size: '',
        placement: '',
    });
    const [referenceFile, setReferenceFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReferenceFile(e.target.files[0]);
        }
    };

    const isFormValid = () => {
        return Object.values(formData).every(value => value.trim() !== '');
    };
    
    const resetForm = () => {
        setFormData({ fullName: '', email: '', telephone: '', idea: '', size: '', placement: '' });
        setReferenceFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid()) {
            setErrorMessage('Por favor, completa todos los campos requeridos.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');

        const submissionData = {
            ...formData,
            referenceImageName: referenceFile?.name || null,
        };

        try {
            const response = await fetch('https://n8n.iswstudioweb.com/webhook/1844fc2e-7878-4e7c-a5fa-c1c12b3147ea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            if (!response.ok) {
                throw new Error(`Error en la red: ${response.statusText}`);
            }
            
            setStatus('success');
            resetForm();
            setTimeout(() => setStatus('idle'), 5000); // Reset status after 5s
        } catch (error) {
            console.error('Error al enviar la consulta:', error);
            setErrorMessage('No se pudo enviar la consulta. Por favor, inténtalo de nuevo más tarde.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000); // Reset status after 5s
        }
    };
    
    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-dark-surface rounded-xl shadow-2xl shadow-black/30 border border-dark-border">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-dark-text-primary tracking-tight">Solicita tu Cita</h1>
                <p className="text-dark-text-secondary mt-2">Cuéntanos tu idea y demos vida a tu próximo tatuaje.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField icon={User} name="fullName" type="text" placeholder="Nombre Completo" value={formData.fullName} onChange={handleInputChange} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField icon={Mail} name="email" type="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required />
                    <InputField icon={Phone} name="telephone" type="tel" placeholder="Teléfono" value={formData.telephone} onChange={handleInputChange} required />
                </div>
                <TextareaField icon={Pencil} name="idea" placeholder="Describe tu idea detalladamente..." value={formData.idea} onChange={handleInputChange} required />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField icon={Maximize} name="size" type="text" placeholder="Tamaño aproximado (cm)" value={formData.size} onChange={handleInputChange} required />
                    <InputField icon={MapPin} name="placement" type="text" placeholder="Ubicación en el cuerpo" value={formData.placement} onChange={handleInputChange} required />
                </div>
                <FileInputField icon={ImageIcon} label="Adjuntar archivo" fileName={referenceFile?.name || null} onChange={handleFileChange} />
                
                <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center p-4 bg-brand-primary text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                    <Send className="w-5 h-5 mr-2"/>
                    {status === 'loading' ? 'Enviando...' : 'Enviar Consulta'}
                </button>
            </form>
            {status === 'success' && (
                <div className="mt-4 p-4 bg-green-500/20 border border-green-500 text-green-300 rounded-lg text-center">
                    ¡Consulta enviada con éxito! Nos pondremos en contacto contigo pronto.
                </div>
            )}
            {status === 'error' && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500 text-red-300 rounded-lg text-center">
                    {errorMessage}
                </div>
            )}
        </div>
    );
};


const ConsultationItem: React.FC<{ 
    consultation: Consultation;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}> = ({ consultation, onApprove, onReject }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-dark-surface rounded-lg border border-dark-border transition-all duration-300">
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div>
                    <p className="font-semibold text-dark-text-primary">{consultation.fullName}</p>
                    <p className="text-sm text-dark-text-secondary truncate max-w-xs">{consultation.idea}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex gap-4">
                        <button onClick={(e) => { e.stopPropagation(); onApprove(consultation.id); }} className="p-2 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors"><Check size={18}/></button>
                        <button onClick={(e) => { e.stopPropagation(); onReject(consultation.id); }} className="p-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors"><X size={18}/></button>
                    </div>
                    {isExpanded ? <ChevronUp className="text-dark-text-secondary" /> : <ChevronDown className="text-dark-text-secondary" />}
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-dark-border p-4 space-y-3 text-sm">
                    <p><strong className="text-dark-text-secondary">Email:</strong> {consultation.email}</p>
                    <p><strong className="text-dark-text-secondary">Teléfono:</strong> {consultation.telephone}</p>
                    <p><strong className="text-dark-text-secondary">Idea Completa:</strong> {consultation.idea}</p>
                    <p><strong className="text-dark-text-secondary">Tamaño:</strong> {consultation.size}</p>
                    <p><strong className="text-dark-text-secondary">Ubicación:</strong> {consultation.placement}</p>
                    <p><strong className="text-dark-text-secondary">Referencia:</strong> {consultation.referenceImageName || 'No adjuntada'}</p>
                    <div className="flex sm:hidden gap-4 pt-4">
                        <button onClick={(e) => { e.stopPropagation(); onApprove(consultation.id); }} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/40 transition-colors">
                            <Check size={16}/>Aprobar
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onReject(consultation.id); }} className="flex-1 text-sm flex items-center justify-center gap-2 p-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors">
                            <X size={16}/>Rechazar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CalendarView: React.FC<{ 
    appointments: ApprovedAppointment[]; 
    onSelectAppointment: (appointment: ApprovedAppointment | null) => void;
}> = ({ appointments, onSelectAppointment }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(), [currentDate]);
    const firstDayOfMonth = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(), [currentDate]);

    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const appointmentsByDate = useMemo(() => {
        return appointments.reduce((acc, app) => {
            const date = app.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(app);
            return acc;
        }, {} as Record<string, ApprovedAppointment[]>);
    }, [appointments]);

    const renderCalendar = () => {
        const calendarDays = [];
        const emptySlots = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth -1); // Assuming Monday as start of week

        for (let i = 0; i < emptySlots; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-dark-border"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAppointments = appointmentsByDate[dateStr] || [];

            calendarDays.push(
                <div key={day} className="p-2 border-r border-b border-dark-border min-h-[100px] flex flex-col">
                    <span className="font-semibold text-dark-text-primary">{day}</span>
                    <div className="flex-grow mt-1 space-y-1">
                        {dayAppointments.map(app => (
                            <div key={app.id} onClick={() => onSelectAppointment(app)} className="bg-brand-primary/80 text-white text-xs p-1 rounded cursor-pointer hover:bg-brand-primary">
                                {app.fullName.split(' ')[0]}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return calendarDays;
    };
    
    return (
        <div className="bg-dark-surface p-6 rounded-lg border border-dark-border">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-dark-text-secondary hover:text-white">&lt;</button>
                <h3 className="text-xl font-bold text-dark-text-primary">
                    {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </h3>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-dark-text-secondary hover:text-white">&gt;</button>
            </div>
            <div className="grid grid-cols-7">
                {weekDays.map(day => <div key={day} className="text-center font-bold text-dark-text-secondary text-sm p-2 border-b border-dark-border">{day}</div>)}
                {renderCalendar()}
            </div>
        </div>
    );
};


const AdminDashboard: React.FC = () => {
    const [consultations, setConsultations] = useState<Consultation[]>(initialConsultations);
    const [approvedAppointments, setApprovedAppointments] = useState<ApprovedAppointment[]>(initialAppointments);
    const [selectedAppointment, setSelectedAppointment] = useState<ApprovedAppointment | null>(null);

    const handleApprove = (id: number) => {
        const consultationToApprove = consultations.find(c => c.id === id);
        if (consultationToApprove) {
            // Simulate adding to calendar with a placeholder date
            const appointmentDate = new Date();
            appointmentDate.setDate(appointmentDate.getDate() + 14); // 2 weeks from now
            
            const newAppointment: ApprovedAppointment = {
                ...consultationToApprove,
                status: 'approved',
                date: appointmentDate.toISOString().split('T')[0],
            };

            setApprovedAppointments(prev => [...prev, newAppointment]);
            setConsultations(prev => prev.filter(c => c.id !== id));
            alert(`Consulta aprobada para ${consultationToApprove.fullName}. Se ha enviado un enlace de pago y el formulario de consentimiento al cliente (simulado).`);
        }
    };
    
    const handleReject = (id: number) => {
        setConsultations(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <h1 className="text-4xl font-bold text-dark-text-primary tracking-tight">Panel de Administración</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-2xl font-semibold text-dark-text-primary flex items-center gap-2"><Briefcase /> Bandeja de Entrada</h2>
                    <div className="bg-dark-surface p-4 rounded-lg border border-dark-border max-h-[70vh] overflow-y-auto space-y-3">
                        {consultations.length > 0 ? (
                           consultations.map(c => (
                            <ConsultationItem key={c.id} consultation={c} onApprove={handleApprove} onReject={handleReject} />
                           ))
                        ) : (
                            <p className="text-dark-text-secondary text-center p-4">No hay consultas pendientes.</p>
                        )}
                    </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-2xl font-semibold text-dark-text-primary flex items-center gap-2"><CalendarIcon /> Calendario de Citas</h2>
                    <CalendarView appointments={approvedAppointments} onSelectAppointment={setSelectedAppointment} />
                </div>
            </div>
             {selectedAppointment && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setSelectedAppointment(null)}>
                    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border w-full max-w-md shadow-2xl shadow-black/50" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-brand-primary mb-4">Detalles de la Cita</h3>
                        <div className="space-y-2 text-dark-text-primary">
                            <p><strong className="text-dark-text-secondary">Cliente:</strong> {selectedAppointment.fullName}</p>
                            <p><strong className="text-dark-text-secondary">Email:</strong> {selectedAppointment.email}</p>
                            <p><strong className="text-dark-text-secondary">Teléfono:</strong> {selectedAppointment.telephone}</p>
                            <p><strong className="text-dark-text-secondary">Fecha:</strong> {new Date(selectedAppointment.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</p>
                            <p><strong className="text-dark-text-secondary">Idea:</strong> {selectedAppointment.idea}</p>
                            <p><strong className="text-dark-text-secondary">Tamaño:</strong> {selectedAppointment.size}</p>
                            <p><strong className="text-dark-text-secondary">Ubicación:</strong> {selectedAppointment.placement}</p>
                        </div>
                        <button onClick={() => setSelectedAppointment(null)} className="mt-6 w-full p-2 bg-dark-border text-dark-text-primary rounded-lg hover:bg-gray-600 transition-colors">Cerrar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [view, setView] = useState<View>('booking');

  return (
    <main className="min-h-screen text-dark-text-primary p-4 sm:p-6 lg:p-8 relative">
        <div className="absolute top-4 right-4 z-10">
            <button
                onClick={() => setView(v => v === 'booking' ? 'admin' : 'booking')}
                className="p-3 bg-dark-surface border border-dark-border rounded-full shadow-lg hover:bg-brand-primary/20 transition-all duration-300"
                title={view === 'booking' ? "Ir a Vista de Admin" : "Ir a Vista de Cliente"}
            >
                {view === 'booking' ? <UserCog className="text-dark-text-secondary"/> : <Eye className="text-dark-text-secondary"/>}
            </button>
        </div>
      
        <div className="container mx-auto flex items-center justify-center py-10">
            {view === 'booking' ? <BookingForm /> : <AdminDashboard />}
        </div>
    </main>
  );
}
