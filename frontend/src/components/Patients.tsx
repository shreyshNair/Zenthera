import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Pencil, Trash2, X, Users, FileText, ShieldCheck } from 'lucide-react';
import Navbar from './Navbar';

type Status = 'ACTIVE' | 'CRITICAL' | 'RECOVERED' | 'INACTIVE';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  diagnosis: string;
  ward: string;
  status: Status;
}

const STATUS_COLORS: Record<Status, string> = {
  ACTIVE: 'bg-brand-orange/20 text-brand-orange border border-brand-orange/30',
  CRITICAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  RECOVERED: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  INACTIVE: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const SEED_PATIENTS: Patient[] = [
  { id: 1, name: 'kjhk',          age: 45, gender: 'Male',   diagnosis: 'Tuberculosis', ward: 'General',  status: 'ACTIVE'   },
  { id: 2, name: 'Tanmay',        age: 35, gender: 'Male',   diagnosis: 'XYZ',          ward: 'General',  status: 'ACTIVE'   },
  { id: 3, name: 'Tanmay',        age: 19, gender: 'Male',   diagnosis: 'UTI',          ward: 'General',  status: 'ACTIVE'   },
  { id: 4, name: 'Srushti Murade',age: 19, gender: 'Female', diagnosis: 'Pneumonia',    ward: 'General',  status: 'ACTIVE'   },
  { id: 5, name: 'Tanish Ingole', age: 19, gender: 'Male',   diagnosis: 'UTI',          ward: 'ICU',      status: 'CRITICAL' },
  { id: 6, name: 'Tanmay Mahajan',age: 19, gender: 'Male',   diagnosis: 'Cancer',       ward: 'Oncology', status: 'CRITICAL' },
  { id: 7, name: 'Charles Gonzalez', age: 30, gender: 'Female', diagnosis: 'Sepsis',   ward: 'ICU',      status: 'CRITICAL' },
  { id: 8, name: 'Aisha Sharma',  age: 52, gender: 'Female', diagnosis: 'E. coli AMR', ward: 'General',  status: 'RECOVERED'},
];

const WARDS = ['General', 'ICU', 'Oncology', 'Cardiology', 'Neurology'];
const STATUSES: Status[] = ['ACTIVE', 'CRITICAL', 'RECOVERED', 'INACTIVE'];

const emptyForm = { name: '', age: '', gender: 'Male' as Patient['gender'], diagnosis: '', ward: 'General', status: 'ACTIVE' as Status };

const Patients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>(SEED_PATIENTS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis.toLowerCase().includes(search.toLowerCase()) ||
    p.ward.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditId(p.id);
    setForm({ name: p.name, age: String(p.age), gender: p.gender, diagnosis: p.diagnosis, ward: p.ward, status: p.status });
    setShowModal(true);
  };

  const savePatient = () => {
    if (!form.name.trim() || !form.diagnosis.trim()) return;
    if (editId !== null) {
      setPatients(prev => prev.map(p => p.id === editId ? { ...p, ...form, age: Number(form.age) } : p));
    } else {
      const newId = Math.max(0, ...patients.map(p => p.id)) + 1;
      setPatients(prev => [...prev, { id: newId, ...form, age: Number(form.age) }]);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteId !== null) setPatients(prev => prev.filter(p => p.id !== deleteId));
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar variant="dashboard" />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-brand-orange" />
              <span className="text-xs font-semibold tracking-[0.2em] text-brand-orange uppercase">Patient Records</span>
            </div>
            <h1 className="font-display italic text-5xl sm:text-6xl font-bold text-text-primary">
              Patients
            </h1>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-brand-orange text-white rounded-full font-semibold text-sm hover:bg-brand-orange-dark transition-all shadow-lg shadow-brand-orange/25 w-full sm:w-fit"
          >
            <Plus className="w-4 h-4" />
            ADD PATIENT
          </button>
        </motion.div>

        {/* Divider */}
        <div className="border-b border-border-main mb-8" />

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-6 max-w-sm"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-bg-secondary border border-border-main text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/50"
          />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-bg-secondary border border-border-main rounded-2xl overflow-hidden"
        >
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-main">
                  {['Name','Age','Gender','Diagnosis','Ward','Status','Actions'].map(col => (
                    <th key={col} className="px-5 py-4 text-left text-[11px] font-semibold tracking-[0.1em] text-text-muted uppercase">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedPatient(p)}
                      className="border-b border-border-main last:border-0 hover:bg-bg-tertiary/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-4 font-semibold text-text-primary text-sm group-hover:text-brand-orange transition-colors">{p.name}</td>
                      <td className="px-5 py-4 text-text-secondary text-sm">{p.age}</td>
                      <td className="px-5 py-4 text-text-secondary text-sm">{p.gender}</td>
                      <td className="px-5 py-4 text-text-secondary text-sm capitalize">{p.diagnosis}</td>
                      <td className="px-5 py-4 text-text-muted text-sm font-mono text-xs">{p.ward}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider ${STATUS_COLORS[p.status]}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(p)} className="text-text-muted hover:text-brand-orange transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="text-text-muted hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-text-muted text-sm">
                      No patients found matching "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border-main">
            {filtered.map((p) => (
              <div key={p.id} className="p-4 hover:bg-bg-tertiary/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">{p.name}</p>
                    <p className="text-xs text-text-muted">{p.age} · {p.gender} · {p.ward}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${STATUS_COLORS[p.status]}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-text-secondary capitalize mb-3">{p.diagnosis}</p>
                <div className="flex items-center gap-4">
                  <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-orange transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="p-8 text-center text-text-muted text-sm">No patients found</p>
            )}
          </div>
        </motion.div>

        <p className="text-xs text-text-muted mt-3 text-right">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-bg-primary border border-border-main rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-text-primary">
                  {editId !== null ? 'Edit Patient' : 'Add New Patient'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-text-primary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Patient name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    placeholder="Age"
                    min={0} max={150}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm(f => ({ ...f, gender: e.target.value as Patient['gender'] }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/60"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Diagnosis *</label>
                  <input
                    value={form.diagnosis}
                    onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))}
                    placeholder="e.g. Tuberculosis, UTI…"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Ward</label>
                  <select
                    value={form.ward}
                    onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/60"
                  >
                    {WARDS.map(w => <option key={w}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-bg-secondary border border-border-main text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-brand-orange/60"
                  >
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border-main text-text-secondary text-sm font-medium hover:bg-bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePatient}
                  className="flex-1 py-2.5 rounded-xl bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-dark transition-colors"
                >
                  {editId !== null ? 'Save Changes' : 'Add Patient'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Details Modal (High Fidelity) */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => setSelectedPatient(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-3xl bg-bg-secondary border border-border-main rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] relative"
            >
              <button 
                onClick={() => setSelectedPatient(null)}
                className="absolute top-4 right-4 sm:top-8 sm:right-8 p-2 rounded-full hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 sm:mb-10 pr-8 sm:pr-12 gap-4">
                <div>
                  <h2 className="font-display italic text-4xl sm:text-6xl font-bold text-text-primary mb-2 sm:mb-3">
                    {selectedPatient.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 sm:gap-y-2 text-text-muted text-xs sm:text-sm font-medium">
                    <span className="flex items-center gap-1.5 capitalize">
                      <Search className="w-3.5 h-3.5" /> {selectedPatient.diagnosis}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                    <span>Age: {selectedPatient.age}</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                    <span>Gender: {selectedPatient.gender}</span>
                    <span className="w-1 h-1 rounded-full bg-text-muted/30" />
                    <span>Ward: {selectedPatient.ward}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-black tracking-[0.2em] shadow-sm mt-1 sm:mt-4 ${STATUS_COLORS[selectedPatient.status]}`}>
                    {selectedPatient.status}
                  </span>
                </div>
              </div>

              {/* Reports Section */}
              <div>
                <div className="flex items-center gap-2 mb-6 text-text-muted">
                  <FileText className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Associated ML Reports</span>
                </div>

                <div className="space-y-4">
                  {/* Mock Report Card */}
                  <div className="bg-bg-primary border border-border-main rounded-2xl sm:rounded-3xl p-5 sm:p-6 hover:border-brand-orange/30 transition-all group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-5 sm:mb-6 gap-3">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-brand-orange uppercase tracking-widest mb-1">4/29/2026</p>
                        <h4 className="text-lg sm:text-xl font-bold text-text-primary">Unknown Organism</h4>
                      </div>
                      <div className="text-left sm:text-right flex sm:block gap-4">
                        <p className="text-[9px] sm:text-[10px] font-mono text-text-muted uppercase">1.74 MBps</p>
                        <p className="text-[9px] sm:text-[10px] font-mono text-text-muted uppercase">31.33% GC</p>
                      </div>
                    </div>

                    <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 sm:mb-3">Resistance Profile</p>
                    <div className="flex flex-col sm:flex-row items-center gap-2 mb-5 sm:mb-6">
                      <div className="w-full flex-1 bg-red-500/5 border border-red-500/10 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-medium text-red-400">Resistant</span>
                        <span className="text-base sm:text-lg font-bold text-red-400">7</span>
                      </div>
                      <div className="w-full flex-1 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-medium text-emerald-400">Susceptible</span>
                        <span className="text-base sm:text-lg font-bold text-emerald-400">7</span>
                      </div>
                    </div>

                    <p className="text-[9px] sm:text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 sm:mb-3">Recommended Course</p>
                    <div className="bg-bg-secondary border border-border-main rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">Meropenem</span>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-bg-primary border border-border-main rounded-2xl p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-1">Delete Patient</h3>
              <p className="text-sm text-text-muted mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border-main text-text-secondary text-sm font-medium hover:bg-bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Patients;
