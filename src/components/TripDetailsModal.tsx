import React, { useState } from "react";
import {
  X,
  MapPin,
  Calendar,
  User,
  Truck,
  Building,
  Gauge,
  Fuel,
  IndianRupee,
  Trash2,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { Trip } from "../types";
import { formatINR, formatIndianDate } from "../lib/calculations";

interface TripDetailsModalProps {
  trip: Trip | null;
  onClose: () => void;
  onDeleteTrip: (id: string) => Promise<void>;
  onEditTrip?: (trip: Trip) => void;
}

export const TripDetailsModal: React.FC<TripDetailsModalProps> = ({
  trip,
  onClose,
  onDeleteTrip,
  onEditTrip,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!trip) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteTrip(trip.id);
      onClose();
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-mono font-bold text-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono font-bold text-base text-white">
                {trip.vehicle_number}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatIndianDate(trip.trip_date)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditTrip && (
              <button
                id="modal-header-edit-trip-btn"
                type="button"
                onClick={() => {
                  onEditTrip(trip);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Trip</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Route & Driver Highlights */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Route Details
              </div>
              <div className="text-lg font-extrabold text-blue-950 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>
                  {trip.from_city} ({trip.from_state}) &rarr; {trip.to_city} ({trip.to_state})
                </span>
              </div>
              <div className="text-xs text-blue-700 mt-1">
                Transporter: <span className="font-semibold">{trip.transporter_name}</span>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-blue-200">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-800">
                Driver
              </div>
              <div className="text-base font-bold text-slate-900 mt-0.5 flex sm:justify-end items-center gap-1.5">
                <User className="w-4 h-4 text-slate-600" />
                <span>{trip.driver_name}</span>
              </div>
            </div>
          </div>

          {/* Distance & Fuel Performance Stats */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Distance &amp; Fuel Performance
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="text-xs text-blue-700 font-semibold flex items-center justify-between">
                  <span>Trip Running KMs</span>
                </div>
                <div className="text-sm font-mono font-black text-blue-950 mt-0.5">
                  {trip.trip_running_kms} KM
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-semibold">Diesel Fuel</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {trip.diesel_litres || 0} Litres
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500 font-semibold">Diesel Expense</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                  {formatINR(trip.diesel_expense)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                <div className="text-xs text-orange-800 font-semibold">Fuel Mileage</div>
                <div className="text-sm font-mono font-black text-orange-950 mt-0.5">
                  {trip.mileage} km/L
                </div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Fare &amp; Expense Breakdown
            </h4>
            <div className="rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between p-3 bg-slate-50/50 font-medium">
                <span className="text-slate-700">Trip Fare (Freight)</span>
                <span className="font-mono font-bold text-blue-700">
                  {formatINR(trip.trip_fare)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">Broker Fare</span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.broker_fare)}
                </span>
              </div>

              {(Boolean(trip.halting_days) || Boolean(trip.halting_fare)) && (
                <div className="flex items-center justify-between p-3 bg-purple-50/60">
                  <span className="text-purple-900 font-medium">
                    Halting Fare ({trip.halting_days || 0} days @ {formatINR(trip.halting_charge_per_day || 0)}/day)
                  </span>
                  <span className="font-mono font-bold text-purple-800">
                    +{formatINR(trip.halting_fare || 0)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">
                  Driver Beta ({trip.driver_beta_type === "percentage" ? "15%" : "Manual"})
                </span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.driver_beta)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">
                  Diesel Expense ({trip.diesel_litres} Litres)
                </span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.diesel_expense)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">Toll Charges</span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.toll_charges)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">Loading Expense</span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.loading_expense)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">Unloading Expense</span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.unloading_expense)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3">
                <span className="text-slate-600">Other Expenses</span>
                <span className="font-mono text-slate-800">
                  {formatINR(trip.other_expenses)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white font-bold">
                <span className="text-sm uppercase tracking-wide text-blue-300">
                  Net Trip Profit
                </span>
                <span
                  className={`text-lg font-mono font-black ${
                    trip.net_profit >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatINR(trip.net_profit)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Settlement Summaries */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Party Advance & Balance */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                <span>Party Freight Collections</span>
                <span className="text-[10px] font-semibold text-amber-700">Customer</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Advance Received:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatINR(trip.advance_received ?? 0)}
                  {trip.advance_received_date && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({formatIndianDate(trip.advance_received_date)})
                    </span>
                  )}
                </span>
              </div>
              {(Boolean(trip.halting_days) || Boolean(trip.halting_fare)) && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-purple-800 font-medium">Halting ({trip.halting_days || 0}d @ {formatINR(trip.halting_charge_per_day || 0)}):</span>
                  <span className="font-mono font-bold text-purple-900">
                    +{formatINR(trip.halting_fare || 0)}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-amber-200">
                <span className="text-slate-700 font-semibold" title="Trip Fare - Broker Fare - Advance Received + Halting Fare">
                  Balance Amount:
                </span>
                <span className="font-mono font-black text-amber-900">
                  {formatINR(
                    trip.balance_amount ??
                      trip.trip_fare - (trip.broker_fare || 0) - (trip.advance_received ?? 0) + (trip.halting_fare ?? 0)
                  )}
                  {trip.balance_received_date && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({formatIndianDate(trip.balance_received_date)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Driver Beta & Settlement */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center justify-between">
                <span>Driver Wage Settlement</span>
                <span className="text-[10px] font-semibold text-indigo-700">{trip.driver_name}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Amount Paid to Driver:</span>
                <span className="font-mono font-bold text-indigo-800">
                  {formatINR(trip.amount_paid_to_driver ?? 0)}
                  {trip.driver_payment_date && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      ({formatIndianDate(trip.driver_payment_date)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1 border-t border-indigo-200">
                <span className="text-slate-700 font-semibold">Remaining Amount to Driver:</span>
                <span
                  className={`font-mono font-black ${
                    (trip.remaining_amount_to_driver ??
                      trip.driver_beta - (trip.amount_paid_to_driver ?? 0)) > 0
                      ? "text-rose-700"
                      : "text-emerald-700"
                  }`}
                >
                  {formatINR(
                    trip.remaining_amount_to_driver ??
                      trip.driver_beta - (trip.amount_paid_to_driver ?? 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Secure Delete */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Trip</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs text-red-800 font-semibold">
                Permanently delete?
              </span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-2.5 py-1 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {onEditTrip && (
              <button
                id="modal-footer-edit-trip-btn"
                type="button"
                onClick={() => {
                  onEditTrip(trip);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Trip Particulars</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
