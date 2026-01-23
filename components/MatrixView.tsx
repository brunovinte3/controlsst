
import React from 'react';
import { NR_COURSES } from '../constants';

const MatrixView: React.FC = () => {
  return (
    <div className="space-y-10 pb-20 animate-fadeIn">
      <header>
        <h2 className="text-4xl font-black text-gray-800 tracking-tighter italic">
          Matriz de <span className="text-emerald-600">Cursos & NRs</span>
        </h2>
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1 italic">Detalhamento Técnico e Carga Horária Normativa</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {NR_COURSES.map(course => (
          <div key={course.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-emerald-50 flex flex-col hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl font-black text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {course.id}
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-black text-gray-400 uppercase">Validade</span>
                <span className="font-black text-emerald-900 text-sm">
                  {course.validityYears ? `${course.validityYears} ${course.validityYears > 1 ? 'Anos' : 'Ano'}` : 'N/A (Pontual)'}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-black text-gray-800 mb-4 leading-tight">{course.name}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mb-6 flex-1">
              {course.description || 'Descrição normativa em processamento. Consulte o portal do MTE para mais detalhes técnicos.'}
            </p>

            <div className="pt-6 border-t border-emerald-50 flex justify-between items-center">
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Carga Horária</span>
                <span className="font-black text-emerald-600 text-sm">{course.workload || 'Consulte'}</span>
              </div>
              <div className="bg-emerald-50/50 px-3 py-1 rounded-full text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                Protocolo Ativo
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <h4 className="text-2xl font-black italic mb-2 tracking-tighter">Precisa de um treinamento customizado?</h4>
          <p className="text-emerald-300/70 text-sm font-medium">As cargas horárias e validades acima seguem o padrão ministerial. Para integrações específicas da empresa, consulte o SESMT.</p>
        </div>
        <button className="bg-emerald-400 text-emerald-950 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all">
          Abrir Chamado SESMT
        </button>
      </div>
    </div>
  );
};

export default MatrixView;
