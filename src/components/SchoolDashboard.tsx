import React, { useState } from 'react';
import { School, UserSession, Activity } from '../types';
import MetricCard from './MetricCard';
import AlertCard from './AlertCard';
import PaymentHistoryChart from './PaymentHistoryChart';
import InteractiveDrawer from './InteractiveDrawer';
import { FORMAT_GNF } from '../data';
import { Clock, Plus, Users, GraduationCap, Building2, Wallet, PlusCircle, AlertCircle, FileSpreadsheet, RefreshCcw, Send } from 'lucide-react';

interface SchoolDashboardProps {
  school: School;
  session: UserSession;
  onUpdateSchool: (updatedSchool: School) => void;
  onShowNotification: (msg: string, type: 'success' | 'info') => void;
}

export default function SchoolDashboard({
  school,
  session,
  onUpdateSchool,
  onShowNotification
}: SchoolDashboardProps) {
  const [drawerType, setDrawerType] = useState<'payments' | 'evaluations' | 'bulletins' | null>(null);
  const [sentReminders, setSentReminders] = useState<string[]>([]);

  // Simulation form states
  const [simName, setSimName] = useState('');
  const [simAmount, setSimAmount] = useState('');
  const [simClass, setSimClass] = useState('10Ã¨me AnnÃ©e A');

  // Interactive: approve a pedagogical evaluation
  const handleApproveEvaluation = (evalId: string) => {
    const evaluation = school.pendingEvaluations.find(e => e.id === evalId);
    if (!evaluation) return;

    // Remove from pending, update school state
    const updatedEvaluations = school.pendingEvaluations.filter(e => e.id !== evalId);
    const newActivity: Activity = {
      id: `act-sim-${Date.now()}`,
      text: `Ã‰valuation de ${evaluation.course} par ${evaluation.teacherName} approuvÃ©e et publiÃ©e par ${session.name}`,
      type: 'admin',
      timeAgo: 'Ã  l\'instant',
      user: session.name
    };

    onUpdateSchool({
      ...school,
      pendingEvaluations: updatedEvaluations,
      recentActivities: [newActivity, ...school.recentActivities.slice(0, 4)]
    });

    onShowNotification(`L'Ã©valuation de ${evaluation.course} (${evaluation.className}) a Ã©tÃ© approuvÃ©e !`, 'success');
  };

  // Interactive: reject evaluation
  const handleRejectEvaluation = (evalId: string) => {
    const evaluation = school.pendingEvaluations.find(e => e.id === evalId);
    if (!evaluation) return;

    const updatedEvaluations = school.pendingEvaluations.filter(e => e.id !== evalId);
    const newActivity: Activity = {
      id: `act-sim-${Date.now()}`,
      text: `Ã‰valuation de ${evaluation.course} renvoyÃ©e pour modification Ã  ${evaluation.teacherName}`,
      type: 'admin',
      timeAgo: 'Ã  l\'instant',
      user: session.name
    };

    onUpdateSchool({
      ...school,
      pendingEvaluations: updatedEvaluations,
      recentActivities: [newActivity, ...school.recentActivities.slice(0, 4)]
    });

    onShowNotification(`Ã‰valuation renvoyÃ©e pour modification.`, 'info');
  };

  // Interactive: send SMS reminder to parent
  const handleSendReminder = (paymentId: string) => {
    const payment = school.latePayments.find(p => p.id === paymentId);
    if (!payment) return;

    setSentReminders([...sentReminders, paymentId]);
    onShowNotification(`Rappel SMS envoyÃ© avec succÃ¨s au parent d'Ã©lÃ¨ve : ${payment.studentName} (${payment.parentContact})`, 'success');
  };

  // Interactive simulation: add new client-side payment
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName || !simAmount) {
      alert('Veuillez remplir tous les champs de simulation.');
      return;
    }

    const amt = parseFloat(simAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Veuillez entrer un montant valide.');
      return;
    }

    // Update revenue and append history, add activity
    const updatedRevenue = school.monthlyRevenue + amt;
    const updatedHistory = [...school.paymentHistory];
    if (updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1].amount += amt;
    }

    const newActivity: Activity = {
      id: `act-sim-${Date.now()}`,
      text: `Paiement reÃ§u de ${simName} (${simClass}) : +${FORMAT_GNF(amt)}`,
      type: 'payment',
      timeAgo: 'Ã  l\'instant',
      user: session.name
    };

    // Remove this student from late payment list if they were on it
    const updatedLatePayments = school.latePayments.filter(
      p => p.studentName.toLowerCase() !== simName.toLowerCase()
    );

    onUpdateSchool({
      ...school,
      monthlyRevenue: updatedRevenue,
      paymentHistory: updatedHistory,
      latePayments: updatedLatePayments,
      recentActivities: [newActivity, ...school.recentActivities.slice(0, 4)]
    });

    onShowNotification(`Paiement de ${FORMAT_GNF(amt)} de ${simName} enregistrÃ© avec succÃ¨s !`, 'success');
    setSimName('');
    setSimAmount('');
  };

  // Interactive simulation: register new student
  const handleQuickAddStudent = () => {
    const updatedPupils = school.pupilsCount + 1;
    const newActivity: Activity = {
      id: `act-sim-${Date.now()}`,
      text: `Nouvel Ã©lÃ¨ve enregistrÃ© par le Directeur dans la base LAKOLI`,
      type: 'student',
      timeAgo: 'Ã  l\'instant',
      user: session.name
    };

    onUpdateSchool({
      ...school,
      pupilsCount: updatedPupils,
      recentActivities: [newActivity, ...school.recentActivities.slice(0, 4)]
    });

    onShowNotification(`Nouvel Ã©lÃ¨ve inscrit ! Total de l'Ã©tablissement : ${updatedPupils}`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          iconName="Users"
          title="Ã‰lÃ¨ves inscrits"
          value={school.pupilsCount}
          subtitle="Ã‰lÃ¨ves actifs"
          trend="+12 ce trimestre"
          trendType="up"
          color="text-blue-600 bg-blue-50"
        />
        <MetricCard
          iconName="GraduationCap"
          title="Enseignants actifs"
          value={school.teachersCount}
          subtitle="Enseignants agrÃ©Ã©s"
          trend="100% qualifiÃ©s"
          trendType="neutral"
          color="text-indigo-600 bg-indigo-50"
        />
        <MetricCard
          iconName="Building2"
          title="Classes"
          value={school.classesCount}
          subtitle="Divisions de cours"
          trend="Moyenne de 30/classe"
          trendType="neutral"
          color="text-slate-600 bg-slate-100"
        />
        <MetricCard
          iconName="Wallet"
          title="Paiements encaissÃ©s"
          value={FORMAT_GNF(school.monthlyRevenue)}
          subtitle="Revenus du mois en cours"
          trend="+15.3% vs juin"
          trendType="up"
          color="text-emerald-600 bg-emerald-50"
        />
      </div>

      {/* 3 Alerts / Actions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AlertCard
          iconName="AlertCircle"
          title="Paiements en retard"
          value={school.latePayments.length}
          badgeLabel={school.latePayments.length > 0 ? "URGENT" : "Ã€ jour"}
          badgeType={school.latePayments.length > 0 ? "error" : "success"}
          actionLabel="Voir le dÃ©tail"
          onActionClick={() => setDrawerType('payments')}
          statusText={`${FORMAT_GNF(school.latePayments.reduce((acc, p) => acc + p.amount, 0))} restant dÃ»`}
        />

        <AlertCard
          iconName="FileSpreadsheet"
          title="Ã‰valuations Ã  valider"
          value={school.pendingEvaluations.length}
          badgeLabel={school.pendingEvaluations.length > 0 ? "ATTENTION" : "TraitÃ©"}
          badgeType={school.pendingEvaluations.length > 0 ? "warning" : "success"}
          actionLabel="Ouvrir le module"
          onActionClick={() => setDrawerType('evaluations')}
          statusText="Saisies par les enseignants"
        />

        <AlertCard
          iconName="CheckCircle"
          title="Bulletins publiÃ©s"
          value={`${school.bulletinsPublished} / ${school.bulletinsExpected}`}
          badgeLabel={school.bulletinsPublished === school.bulletinsExpected ? "TERMINÃ‰" : "EN COURS"}
          badgeType="success"
          actionLabel="GÃ©rer les publications"
          onActionClick={() => setDrawerType('bulletins')}
          statusText={`Reste ${school.bulletinsExpected - school.bulletinsPublished} bulletins Ã  saisir`}
        />
      </div>

      {/* Charts & Actions layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 cols: Chart */}
        <div className="lg:col-span-2">
          <PaymentHistoryChart history={school.paymentHistory} />
        </div>

        {/* Right 1 col: Recent Activities & Simulation console */}
        <div className="space-y-6">
          {/* Recent Activity List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">ActivitÃ© rÃ©cente</h3>
                <p className="text-xs text-slate-500">DerniÃ¨res actions de l'Ã©cole</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-4 flex-1">
              {school.recentActivities.map((act) => {
                const getColors = (type: string) => {
                  switch (type) {
                    case 'evaluation':
                      return 'bg-amber-100 text-amber-800 border-amber-200';
                    case 'payment':
                      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
                    case 'student':
                      return 'bg-blue-100 text-blue-800 border-blue-200';
                    default:
                      return 'bg-slate-100 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <div key={act.id} className="flex gap-3 text-xs items-start p-2 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase shrink-0 border mt-0.5 ${getColors(act.type)}`}>
                      {act.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-700 leading-normal font-semibold">{act.text}</p>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                        <span className="font-bold text-slate-900">{act.user}</span>
                        <span>{act.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simulation Dashboard Panel */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase bg-slate-200/60 px-2.5 py-1 rounded">
                Console de Simulation LAKOLI
              </span>
              <h4 className="text-xs font-bold text-slate-800 mt-2">
                Simuler des flux scolaires en direct
              </h4>
            </div>

            {/* Simulated Payment */}
            <form onSubmit={handleSimulatePayment} className="space-y-2 border-t border-slate-200 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Recevoir un paiement :</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nom de l'Ã©lÃ¨ve"
                  value={simName}
                  onChange={(e) => setSimName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
                />
                <input
                  type="number"
                  placeholder="Montant en GNF"
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900 text-slate-800 placeholder-slate-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Enregistrer un encaissement
              </button>
            </form>

            {/* Simulated registration */}
            <div className="flex gap-2 border-t border-slate-200 pt-3">
              <button
                onClick={handleQuickAddStudent}
                className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                Simuler inscription Ã©lÃ¨ve
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sliding detail drawers */}
      <InteractiveDrawer
        isOpen={drawerType !== null}
        onClose={() => setDrawerType(null)}
        title={
          drawerType === 'payments' ? 'Frais de scolaritÃ© en retard' :
          drawerType === 'evaluations' ? 'Ã‰valuations en attente de validation' :
          'Bulletins scolaires publiÃ©s'
        }
        type={drawerType || 'payments'}
        school={school}
        onApproveEvaluation={handleApproveEvaluation}
        onRejectEvaluation={handleRejectEvaluation}
        onSendReminder={handleSendReminder}
        sentReminders={sentReminders}
      />
    </div>
  );
}

