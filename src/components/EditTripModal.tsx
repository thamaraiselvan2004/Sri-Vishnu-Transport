import React, { useEffect, useMemo, useState } from "react";
import { X, Save, Trash2 } from "lucide-react";
import { Trip, Vehicle, Driver, DriverBetaType } from "../types";
import { deleteTrip } from "../lib/database";
import { calculateDriverBeta, calculateMileage, calculateTripNetProfit, formatINR } from "../lib/calculations";

interface EditTripModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: (updatedTrip: Trip) => Promise<void>;
  vehicles: Vehicle[];
  drivers: Driver[];
}

const numberValue = (value: string) => Number(value) || 0;

export const EditTripModal: React.FC<EditTripModalProps> = ({ trip, isOpen, onClose, onTripUpdated, vehicles, drivers }) => {
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [tripDate, setTripDate] = useState("");
  const [fromState, setFromState] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toState, setToState] = useState("");
  const [toCity, setToCity] = useState("");
  const [tripRunningKms, setTripRunningKms] = useState("");
  const [dieselLitres, setDieselLitres] = useState("");
  const [dieselExpense, setDieselExpense] = useState("");
  const [tripFare, setTripFare] = useState("");
  const [brokerFare, setBrokerFare] = useState("");
  const [driverBetaType, setDriverBetaType] = useState<DriverBetaType>("percentage");
  const [manualDriverBeta, setManualDriverBeta] = useState("");
  const [tollCharges, setTollCharges] = useState("");
  const [loadingExpense, setLoadingExpense] = useState("");
  const [unloadingExpense, setUnloadingExpense] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");
  const [loadingHaltingDays, setLoadingHaltingDays] = useState("0");
  const [loadingHaltingChargePerDay, setLoadingHaltingChargePerDay] = useState("0");
  const [unloadingHaltingDays, setUnloadingHaltingDays] = useState("0");
  const [unloadingHaltingChargePerDay, setUnloadingHaltingChargePerDay] = useState("0");
  const [advanceReceived, setAdvanceReceived] = useState("");
  const [advanceReceivedDate, setAdvanceReceivedDate] = useState("");
  const [balanceReceivedDate, setBalanceReceivedDate] = useState("");
  const [amountPaidToDriver, setAmountPaidToDriver] = useState("");
  const [driverPaymentDate, setDriverPaymentDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!trip || !isOpen) return;
    setVehicleId(trip.vehicle_id || ""); setDriverId(trip.driver_id || "");
    setTransporterName(trip.transporter_name || ""); setTripDate(trip.trip_date || "");
    setFromState(trip.from_state || ""); setFromCity(trip.from_city || "");
    setToState(trip.to_state || ""); setToCity(trip.to_city || "");
    setTripRunningKms(String(trip.trip_running_kms ?? "")); setDieselLitres(String(trip.diesel_litres ?? ""));
    setDieselExpense(String(trip.diesel_expense ?? "")); setTripFare(String(trip.trip_fare ?? ""));
    setBrokerFare(String(trip.broker_fare ?? "0")); setDriverBetaType(trip.driver_beta_type || "percentage");
    setManualDriverBeta(trip.driver_beta_type === "manual" ? String(trip.driver_beta ?? "") : "");
    setTollCharges(String(trip.toll_charges ?? "0")); setLoadingExpense(String(trip.loading_expense ?? "0"));
    setUnloadingExpense(String(trip.unloading_expense ?? "0")); setOtherExpenses(String(trip.other_expenses ?? "0"));
    setLoadingHaltingDays(String(trip.loading_halting_days ?? "0")); setLoadingHaltingChargePerDay(String(trip.loading_halting_charge_per_day ?? "0"));
    setUnloadingHaltingDays(String(trip.unloading_halting_days ?? "0")); setUnloadingHaltingChargePerDay(String(trip.unloading_halting_charge_per_day ?? "0"));
    setAdvanceReceived(String(trip.advance_received ?? "")); setAdvanceReceivedDate(trip.advance_received_date || "");
    setBalanceReceivedDate(trip.balance_received_date || ""); setAmountPaidToDriver(String(trip.amount_paid_to_driver ?? ""));
    setDriverPaymentDate(trip.driver_payment_date || ""); setError("");
  }, [trip, isOpen]);

  const runningKms = numberValue(tripRunningKms);
  const diesel = numberValue(dieselLitres);
  const mileage = calculateMileage(runningKms, diesel);
  const loadingHaltingFare = numberValue(loadingHaltingDays) * numberValue(loadingHaltingChargePerDay);
  const unloadingHaltingFare = numberValue(unloadingHaltingDays) * numberValue(unloadingHaltingChargePerDay);
  const totalHaltingDays = numberValue(loadingHaltingDays) + numberValue(unloadingHaltingDays);
  const haltingFare = loadingHaltingFare + unloadingHaltingFare;
  const driverBeta = calculateDriverBeta(numberValue(tripFare), driverBetaType, numberValue(manualDriverBeta));
  const balanceAmount = numberValue(tripFare) - numberValue(brokerFare) - numberValue(advanceReceived) + haltingFare;
  const remainingDriverAmount = driverBeta - numberValue(amountPaidToDriver);
  const netProfit = calculateTripNetProfit({ tripFare: numberValue(tripFare), haltingFare, brokerFare: numberValue(brokerFare), driverBeta, loadingExpense: numberValue(loadingExpense), unloadingExpense: numberValue(unloadingExpense), tollCharges: numberValue(tollCharges), dieselExpense: numberValue(dieselExpense), otherExpenses: numberValue(otherExpenses) });
  const selectedVehicle = useMemo(() => vehicles.find(v => v.id === vehicleId), [vehicles, vehicleId]);
  const selectedDriver = useMemo(() => drivers.find(d => d.id === driverId), [drivers, driverId]);
  const inputClass = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  const labelClass = "block text-xs font-semibold text-slate-600 mb-1.5";

  const save = async () => {
    if (!trip) return;
    if (!vehicleId || !driverId || !tripDate || !tripFare) { setError("Please fill Vehicle, Driver, Trip Date and Trip Fare."); return; }
    setIsSaving(true); setError("");
    try {
      const updatedTrip: Trip = {
        ...trip, vehicle_id: vehicleId, driver_id: driverId, transporter_name: transporterName, trip_date: tripDate,
        from_state: fromState, from_city: fromCity, to_state: toState, to_city: toCity, trip_running_kms: runningKms,
        diesel_litres: diesel, diesel_expense: numberValue(dieselExpense), mileage: mileage.mileage, trip_fare: numberValue(tripFare),
        broker_fare: numberValue(brokerFare), driver_beta: driverBeta, driver_beta_type: driverBetaType,
        toll_charges: numberValue(tollCharges), loading_expense: numberValue(loadingExpense), unloading_expense: numberValue(unloadingExpense), other_expenses: numberValue(otherExpenses),
        halting_days: totalHaltingDays, halting_charge_per_day: totalHaltingDays > 0 ? haltingFare / totalHaltingDays : 0, halting_fare: haltingFare,
        loading_halting_days: numberValue(loadingHaltingDays), loading_halting_charge_per_day: numberValue(loadingHaltingChargePerDay), loading_halting_fare: loadingHaltingFare,
        unloading_halting_days: numberValue(unloadingHaltingDays), unloading_halting_charge_per_day: numberValue(unloadingHaltingChargePerDay), unloading_halting_fare: unloadingHaltingFare,
        advance_received: numberValue(advanceReceived), advance_received_date: advanceReceivedDate || undefined, balance_amount: balanceAmount,
        balance_received_date: balanceReceivedDate || undefined, amount_paid_to_driver: numberValue(amountPaidToDriver), driver_payment_date: driverPaymentDate || undefined,
        remaining_amount_to_driver: remainingDriverAmount, net_profit: netProfit, vehicle_number: selectedVehicle?.vehicle_number || trip.vehicle_number,
        driver_name: selectedDriver?.driver_name || trip.driver_name, updated_at: new Date().toISOString(),
      };
      await onTripUpdated(updatedTrip); onClose();
    } catch (err: any) { setError(err?.message || "Failed to update trip."); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!trip || isDeleting || isSaving) return;
    const confirmed = window.confirm(`Delete this trip permanently?\n\n${trip.vehicle_number || "Vehicle"} • ${trip.trip_date || "Trip"}`);
    if (!confirmed) return;
    setIsDeleting(true); setError("");
    try {
      await deleteTrip(trip.id);
      onClose();
      window.dispatchEvent(new Event("focus"));
    } catch (err: any) { setError(err?.message || "Failed to delete trip."); }
    finally { setIsDeleting(false); }
  };

  if (!isOpen || !trip) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 overflow-y-auto">
      <div className="my-6 w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 px-6 py-5 text-white">
          <div><h2 className="text-lg font-bold">Edit Trip</h2><p className="text-xs text-slate-400">Update trip, expense and payment details</p></div>
          <button onClick={onClose} disabled={isDeleting} className="rounded-lg p-2 hover:bg-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-6 space-y-6">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Trip Details</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label><span className={labelClass}>Vehicle</span><select className={inputClass} value={vehicleId} onChange={e=>setVehicleId(e.target.value)}>{vehicles.map(v=><option key={v.id} value={v.id}>{v.vehicle_number}</option>)}</select></label>
            <label><span className={labelClass}>Driver</span><select className={inputClass} value={driverId} onChange={e=>setDriverId(e.target.value)}>{drivers.map(d=><option key={d.id} value={d.id}>{d.driver_name}</option>)}</select></label>
            <label><span className={labelClass}>Transporter Name</span><input className={inputClass} value={transporterName} onChange={e=>setTransporterName(e.target.value)} /></label>
            <label><span className={labelClass}>Trip Date</span><input type="date" className={inputClass} value={tripDate} onChange={e=>setTripDate(e.target.value)} /></label>
            <label><span className={labelClass}>From State</span><input className={inputClass} value={fromState} onChange={e=>setFromState(e.target.value)} /></label>
            <label><span className={labelClass}>From City</span><input className={inputClass} value={fromCity} onChange={e=>setFromCity(e.target.value)} /></label>
            <label><span className={labelClass}>To State</span><input className={inputClass} value={toState} onChange={e=>setToState(e.target.value)} /></label>
            <label><span className={labelClass}>To City</span><input className={inputClass} value={toCity} onChange={e=>setToCity(e.target.value)} /></label>
          </div></section>
          <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Distance & Fuel</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label><span className={labelClass}>Trip Running KMs</span><input type="number" min="0" className={inputClass} value={tripRunningKms} onChange={e=>setTripRunningKms(e.target.value)} /></label>
            <label><span className={labelClass}>Diesel Litres</span><input type="number" min="0" className={inputClass} value={dieselLitres} onChange={e=>setDieselLitres(e.target.value)} /></label>
            <label><span className={labelClass}>Diesel Expense</span><input type="number" min="0" className={inputClass} value={dieselExpense} onChange={e=>setDieselExpense(e.target.value)} /></label>
          </div><div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Mileage: <b>{mileage.mileage ? `${mileage.mileage} km/L` : "—"}</b></div></section>
          <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Fare & Driver Beta</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label><span className={labelClass}>Trip Fare</span><input type="number" min="0" className={inputClass} value={tripFare} onChange={e=>setTripFare(e.target.value)} /></label>
            <label><span className={labelClass}>Broker Fare</span><input type="number" min="0" className={inputClass} value={brokerFare} onChange={e=>setBrokerFare(e.target.value)} /></label>
            <label><span className={labelClass}>Driver Beta Type</span><select className={inputClass} value={driverBetaType} onChange={e=>setDriverBetaType(e.target.value as DriverBetaType)}><option value="percentage">15%</option><option value="manual">Manual</option></select></label>
            {driverBetaType === "manual" ? <label><span className={labelClass}>Manual Beta</span><input type="number" min="0" className={inputClass} value={manualDriverBeta} onChange={e=>setManualDriverBeta(e.target.value)} /></label> : <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Driver Beta<br/><b>{formatINR(driverBeta)}</b></div>}
          </div></section>
          <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Halting / Detention</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4"><div className="mb-3 text-sm font-bold text-purple-900">Loading Halting</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label><span className={labelClass}>Days</span><input type="number" min="0" className={inputClass} value={loadingHaltingDays} onChange={e=>setLoadingHaltingDays(e.target.value)} /></label><label><span className={labelClass}>Charge / Day</span><input type="number" min="0" className={inputClass} value={loadingHaltingChargePerDay} onChange={e=>setLoadingHaltingChargePerDay(e.target.value)} /></label><div className="rounded-xl bg-white border border-purple-200 p-3 text-sm text-purple-800">Fare<br/><b>{formatINR(loadingHaltingFare)}</b></div></div></div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4"><div className="mb-3 text-sm font-bold text-indigo-900">Unloading Halting</div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label><span className={labelClass}>Days</span><input type="number" min="0" className={inputClass} value={unloadingHaltingDays} onChange={e=>setUnloadingHaltingDays(e.target.value)} /></label><label><span className={labelClass}>Charge / Day</span><input type="number" min="0" className={inputClass} value={unloadingHaltingChargePerDay} onChange={e=>setUnloadingHaltingChargePerDay(e.target.value)} /></label><div className="rounded-xl bg-white border border-indigo-200 p-3 text-sm text-indigo-800">Fare<br/><b>{formatINR(unloadingHaltingFare)}</b></div></div></div>
          </div><div className="mt-3 rounded-xl bg-purple-100 p-3 text-sm text-purple-900 flex items-center justify-between"><span><b>Total Halting:</b> {totalHaltingDays} days</span><b>{formatINR(haltingFare)}</b></div></section>
          <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Other Expenses</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label><span className={labelClass}>Toll Charges</span><input type="number" min="0" className={inputClass} value={tollCharges} onChange={e=>setTollCharges(e.target.value)} /></label>
            <label><span className={labelClass}>Loading</span><input type="number" min="0" className={inputClass} value={loadingExpense} onChange={e=>setLoadingExpense(e.target.value)} /></label>
            <label><span className={labelClass}>Unloading</span><input type="number" min="0" className={inputClass} value={unloadingExpense} onChange={e=>setUnloadingExpense(e.target.value)} /></label>
            <label><span className={labelClass}>Other</span><input type="number" min="0" className={inputClass} value={otherExpenses} onChange={e=>setOtherExpenses(e.target.value)} /></label>
          </div></section>
          <section><h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Collections & Driver Settlement</h3><div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label><span className={labelClass}>Advance Received</span><input type="number" min="0" className={inputClass} value={advanceReceived} onChange={e=>setAdvanceReceived(e.target.value)} /></label>
            <label><span className={labelClass}>Advance Date</span><input type="date" className={inputClass} value={advanceReceivedDate} onChange={e=>setAdvanceReceivedDate(e.target.value)} /></label>
            <label><span className={labelClass}>Balance Received Date</span><input type="date" className={inputClass} value={balanceReceivedDate} onChange={e=>setBalanceReceivedDate(e.target.value)} /></label>
            <label><span className={labelClass}>Amount Paid to Driver</span><input type="number" min="0" className={inputClass} value={amountPaidToDriver} onChange={e=>setAmountPaidToDriver(e.target.value)} /></label>
            <label><span className={labelClass}>Driver Payment Date</span><input type="date" className={inputClass} value={driverPaymentDate} onChange={e=>setDriverPaymentDate(e.target.value)} /></label>
          </div><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Balance Amount<br/><b>{formatINR(balanceAmount)}</b></div>
            <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">Remaining Driver Amount<br/><b>{formatINR(remainingDriverAmount)}</b></div>
            <div className={`rounded-xl p-3 text-sm ${netProfit >= 0 ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>Net Trip Profit<br/><b>{formatINR(netProfit)}</b></div>
          </div></section>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button id="delete-trip-btn" type="button" onClick={handleDelete} disabled={isDeleting || isSaving} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4"/>{isDeleting ? "Deleting..." : "Delete Trip"}</button>
          <div className="flex items-center gap-3"><button onClick={onClose} disabled={isDeleting} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button onClick={save} disabled={isSaving || isDeleting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4"/>{isSaving ? "Saving..." : "Save Changes"}</button></div>
        </div>
      </div>
    </div>
  );
};
