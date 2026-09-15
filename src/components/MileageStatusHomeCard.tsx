import React from "react";
import { ArrowRight, Gauge } from "lucide-react";

interface MileageStatusHomeCardProps {
  onNavigate: () => void;
}

export const MileageStatusHomeCard: React.FC<MileageStatusHomeCardProps> = ({ onNavigate }) => (
  <button
    id="home-action-mileage-status-btn"
    type="button"
    onClick={onNavigate}
    className="w-full md:w-[calc((100%-2.5rem)/3)] group text-left bg-white hover:bg-violet-50/60 active:bg-violet-100/80 rounded-2xl p-6 sm:p-7 border-2 border-slate-200 hover:border-violet-600 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between min-h-[190px]"
  >
    <div>
      <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-md shadow-violet-600/25">
        <Gauge className="w-8 h-8" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
        4. Mileage Status
      </h3>
      <p className="text-sm text-slate-600 mt-1.5 leading-normal">
        Record starting and ending odometer readings with diesel litres and calculate vehicle mileage.
      </p>
    </div>
    <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-violet-700">
      <span>Open Mileage Status</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);
