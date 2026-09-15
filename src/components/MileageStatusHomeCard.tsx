import React from "react";
import { ArrowRight, Gauge } from "lucide-react";

interface MileageStatusHomeCardProps {
  onNavigate: () => void;
}

export const MileageStatusHomeCard: React.FC<MileageStatusHomeCardProps> = ({ onNavigate }) => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
    <button
      id="home-action-mileage-status-btn"
      type="button"
      onClick={onNavigate}
      className="w-full group text-left bg-white hover:bg-violet-50/60 active:bg-violet-100/80 rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-violet-600 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-violet-600/25">
          <Gauge className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
            4. Mileage Status
          </h3>
          <p className="text-sm text-slate-600 mt-1.5 leading-normal">
            Record starting and ending odometer readings with diesel litres and calculate vehicle mileage.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 sm:shrink-0">
        <span>Open Mileage Status</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  </div>
);
