import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Truck,
  User,
  Calendar,
  MapPin,
  IndianRupee,
  Fuel,
  Calculator,
  Save,
  CheckCircle2,
  AlertCircle,
  Building,
  Check,
  Radio,
  Zap,
  Loader2,
  Clock,
  Settings,
  Compass,
  Route,
  Gauge,
} from "lucide-react";
import { Trip, Vehicle, Driver, DriverBetaType } from "../types";
import {
  calculateDriverBeta,
  calculateMileage,
  calculateTripNetProfit,
  formatINR,
} from "../lib/calculations";
import {
  ALL_INDIAN_STATES,
  searchStates,
  searchCities,
} from "../lib/indianPlaces";
import { BlackBuckSettingsModal } from "./BlackBuckSettingsModal";
import { getHighwayDistanceKm } from "../lib/routeDistances";

interface EditTripModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onTripUpdated: (updatedTrip: Trip) => Promise<void>;
  vehicles: Vehicle[];
  drivers: Driver[];
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  isOpen,
  onClose,
  onTripUpdated,
  vehicles,
  drivers,
}) => {
  // Form State
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [tripDate, setTripDate] = useState("");

  // Route
  const [fromState, setFromState] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toState, setToState] = useState("");
  const [toCity, setToCity] = useState("");

  // Route dropdowns / search
  const [showFromStateDropdown, setShowFromStateDropdown] = useState(false);
  const [showFromCityDropdown, setShowFromCityDropdown] = useState(false);
  const [showToStateDropdown, setShowToStateDropdown] = useState(false);
  const [showToCityDropdown, setShowToCityDropdown] = useState(false);

  // Distance & Fuel
  const [tripRunningKms, setTripRunningKms] = useState("");
  const [startingOdometer, setStartingOdometer] = useState("");
  const [endingOdometer, setEndingOdometer] = useState("");
  const [dieselLitres, setDieselLitres] = useState("");
  const [dieselExpense, setDieselExpense] = useState("");

  // GPS & Timestamps
  const [tripStartDateTime, setTripStartDateTime] = useState("");
  const [tripEndDateTime, setTripEndDateTime] = useState("");
  const [gpsSource, setGpsSource] = useState<"blackbuck" | "manual" | "odometer">("manual");
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [showBlackbuckSettings, setShowBlackbuckSettings] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [routeEstimateStatus, setRouteEstimateStatus] = useState<{
    type: "success" | "info" | null;
    message: string;
    distanceKm?: number;
  }>({ type: null, message: "" });

  // Fares & Allowances
  const [tripFare, setTripFare] = useState("");
  const [brokerFare, setBrokerFare] = useState("");
  const [driverBetaType, setDriverBetaType] = useState<DriverBetaType>("percentage");
  const [manualDriverBeta, setManualDriverBeta] = useState("");

  // Additional Expenses
  const [tollCharges, setTollCharges] = useState("");
  const [loadingExpense, setLoadingExpense] = useState("");
  const [unloadingExpense, setUnloadingExpense] = useState("");
  const [otherExpenses, setOtherExpenses] = useState("");

  // Halting Details
  const [haltingDays, setHaltingDays] = useState("");
  const [haltingChargePerDay, setHaltingChargePerDay] = useState("");

  // Advance & Balance Collections
  const [advanceReceived, setAdvanceReceived] = useState("");
  const [advanceReceivedDate, setAdvanceReceivedDate] = useState("");
  const [balanceReceivedDate, setBalanceReceivedDate] = useState("");

  // Driver Settlement Payments
  const [amountPaidToDriver, setAmountPaidToDriver] = useState("");
  const [driverPaymentDate, setDriverPaymentDate] = useState("");

  // Status & Validation
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state whenever trip changes or modal opens
  useEffect(() => {
    if (trip && isOpen) {
      setVehicleId(trip.vehicle_id || "");
      setDriverId(trip.driver_id || "");
      setTransporterName(trip.transporter_name || "");
      setTripDate(trip.trip_date || "");

      setFromState(trip.from_state || "");
      setFromCity(trip.from_city || "");
      setToState(trip.to_state || "");
      setToCity(trip.to_city || "");

      setTripRunningKms(String(trip.trip_running_kms ?? ""));
      setStartingOdometer(
        trip.starting_odometer !== undefined && trip.starting_odometer !== null
          ? String(trip.starting_odometer)
          : ""
      );
      setEndingOdometer(
        trip.ending_odometer !== undefined && trip.ending_odometer !== null
          ? String(trip.ending_odometer)
          : ""
      );
      setDieselLitres(String(trip.diesel_litres ?? ""));
      setDieselExpense(String(trip.diesel_expense ?? ""));

      setTripFare(String(trip.trip_fare ?? ""));
      setBrokerFare(String(trip.broker_fare ?? "0"));
      setDriverBetaType(trip.driver_beta_type || "percentage");
      setManualDriverBeta(
        trip.driver_beta_type === "manual" ? String(trip.driver_beta ?? "") : ""
      );

      setTollCharges(String(trip.toll_charges ?? "0"));
      setLoadingExpense(String(trip.loading_expense ?? "0"));
      setUnloadingExpense(String(trip.unloading_expense ?? "0"));
      setOtherExpenses(String(trip.other_expenses ?? "0"));

      // Sync Halting Details
      setHaltingDays(
        trip.halting_days !== undefined && trip.halting_days !== null
          ? String(trip.halting_days)
          : "0"
      );
      setHaltingChargePerDay(
        trip.halting_charge_per_day !== undefined && trip.halting_charge_per_day !== null
          ? String(trip.halting_charge_per_day)
          : "0"
      );

      // Sync Advance & Driver Payments
      setAdvanceReceived(
        trip.advance_received !== undefined && trip.advance_received !== null
          ? String(trip.advance_received)
          : ""
      );
      setAdvanceReceivedDate(trip.advance_received_date || "");
      setBalanceReceivedDate(trip.balance_received_date || "");
      setAmountPaidToDriver(
        trip.amount_paid_to_driver !== undefined && trip.amount_paid_to_driver !== null
          ? String(trip.amount_paid_to_driver)
          : ""
      );
      setDriverPaymentDate(trip.driver_payment_date || "");

      // Sync GPS & Timestamps
      setTripStartDateTime(
        trip.trip_start_datetime || (trip.trip_date ? `${trip.trip_date}T06:00` : "")
      );
      setTripEndDateTime(
        trip.trip_end_datetime || (trip.trip_date ? `${trip.trip_date}T20:00` : "")
      );
      setGpsSource(trip.gps_source || "manual");
      setGpsStatus({ type: null, message: "" });
      setRouteEstimateStatus({ type: null, message: "" });

      setErrors({});
      setSuccessMessage(null);
    }
  }, [trip, isOpen]);

  // Calculate duration between Start and End time in hours
  const tripDurationHours = useMemo(() => {
    if (!tripStartDateTime || !tripEndDateTime) return null;
    const s = new Date(tripStartDateTime).getTime();
    const e = new Date(tripEndDateTime).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) return null;
    return Math.round(((e - s) / (1000 * 60 * 60)) * 10) / 10;
  }, [tripStartDateTime, tripEndDateTime]);

  // Handle manual odometer input updates
  const handleOdometerChange = (startVal: string, endVal: string) => {
    setStartingOdometer(startVal);
    setEndingOdometer(endVal);
    const s = parseFloat(startVal);
    const e = parseFloat(endVal);
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      const diff = Math.round((e - s) * 10) / 10;
      setTripRunningKms(String(diff));
      setGpsSource("odometer");
    }
  };

  // Suggest highway route distance based on Origin and Destination
  const handleSuggestHighwayDistance = () => {
    const dist = getHighwayDistanceKm(fromCity, toCity);
    if (dist !== null) {
      setRouteEstimateStatus({
        type: "success",
        message: `Verified highway route between ${fromCity} and ${toCity}: ~${dist} KM (Reference)`,
        distanceKm: dist,
      });
    } else {
      setRouteEstimateStatus({
        type: "info",
        message: `Direct highway route between ${fromCity} and ${toCity} not found in matrix.`,
      });
    }
  };

  // Fetch running KMs directly from BlackBuck GPS
  const handleFetchBlackbuckGps = async () => {
    const v = vehicles.find((x) => x.id === vehicleId);
    const vehNum = v?.vehicle_number || trip?.vehicle_number || "";
    if (!vehNum) {
      setGpsStatus({ type: "error", message: "Please select a vehicle first." });
      return;
    }
    if (!tripStartDateTime || !tripEndDateTime) {
      setGpsStatus({
        type: "error",
        message: "Please specify both Start and End Date & Time.",
      });
      return;
    }
    const s = new Date(tripStartDateTime).getTime();
    const e = new Date(tripEndDateTime).getTime();
    if (isNaN(s) || isNaN(e) || e <= s) {
      setGpsStatus({
        type: "error",
        message: "Trip End Date/Time must be later than Start Date/Time.",
      });
      return;
    }

    setIsFetchingGps(true);
    setGpsStatus({
      type: "info",
      message: `Connecting to BlackBuck GPS tracking for ${vehNum}...`,
    });

    try {
      const res = await fetch("/api/gps/blackbuck/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleNumber: vehNum,
          startDateTime: tripStartDateTime,
          endDateTime: tripEndDateTime,
          fromCity,
          toCity,
          startingOdometer: startingOdometer ? Number(startingOdometer) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch GPS distance");

      if (data.success && data.distance_km !== undefined) {
        setTripRunningKms(String(data.distance_km));
        setGpsSource("blackbuck");
        if (data.starting_odometer && !startingOdometer) {
          setStartingOdometer(String(data.starting_odometer));
        }
        if (data.ending_odometer && !endingOdometer) {
          setEndingOdometer(String(data.ending_odometer));
        }
        setGpsStatus({
          type: "success",
          message:
            data.message ||
            `Detected ${data.distance_km} KM from BlackBuck GPS (${data.duration_hours} hrs)`,
        });
      } else if (data.not_configured) {
        setGpsStatus({
          type: "error",
          message:
            data.message ||
            "BlackBuck API key not configured. Click 'GPS Settings' to configure credentials.",
        });
      }
    } catch (err: any) {
      setGpsStatus({
        type: "error",
        message: err.message || "Failed to retrieve GPS distance from BlackBuck.",
      });
    } finally {
      setIsFetchingGps(false);
    }
  };

  if (!isOpen || !trip) return null;

  // -------------------------------------------------------------
  // Live Calculations
  // -------------------------------------------------------------
  const runningKms = parseFloat(tripRunningKms) || 0;
  const numTripFare = parseFloat(tripFare) || 0;
  const numBrokerFare = parseFloat(brokerFare) || 0;
  const numManualBeta = parseFloat(manualDriverBeta) || 0;
  const calculatedDriverBeta = calculateDriverBeta(
    numTripFare,
    driverBetaType,
    numManualBeta
  );

  // Halting Fare = Halting days * Halting charge/day
  const numHaltingDays = parseFloat(haltingDays) || 0;
  const numHaltingChargePerDay = parseFloat(haltingChargePerDay) || 0;
  const haltingFare = numHaltingDays * numHaltingChargePerDay;

  // Derived Advance & Balance Calculation
  // Formula: balance amount = trip fare - broker fare - advance received + halting fare
  const numAdvanceReceived = parseFloat(advanceReceived) || 0;
  const balanceAmount =
    numTripFare - numBrokerFare - numAdvanceReceived + haltingFare;

  // Derived Driver Payment & Remaining Calculation
  const numAmountPaidToDriver = parseFloat(amountPaidToDriver) || 0;
  const remainingAmountToDriver = calculatedDriverBeta - numAmountPaidToDriver;

  const numDieselExpense = parseFloat(dieselExpense) || 0;
  const numDieselLitres = parseFloat(dieselLitres) || 0;
  const mileageInfo = calculateMileage(runningKms, numDieselLitres);

  const numToll = parseFloat(tollCharges) || 0;
  const numLoading = parseFloat(loadingExpense) || 0;
  const numUnloading = parseFloat(unloadingExpense) || 0;
  const numOther = parseFloat(otherExpenses) || 0;

  const totalOperationalCosts =
    numBrokerFare +
    calculatedDriverBeta +
    numLoading +
    numUnloading +
    numToll +
    numDieselExpense +
    numOther;

  const calculatedNetProfit = calculateTripNetProfit({
    tripFare: numTripFare,
    haltingFare: haltingFare,
    brokerFare: numBrokerFare,
    driverBeta: calculatedDriverBeta,
    loadingExpense: numLoading,
    unloadingExpense: numUnloading,
    tollCharges: numToll,
    dieselExpense: numDieselExpense,
    otherExpenses: numOther,
  });

  // -------------------------------------------------------------
  // Validation and Save
  // -------------------------------------------------------------
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!vehicleId) errs.vehicle = "Vehicle selection is required.";
    if (!driverId) errs.driver = "Driver selection is required.";
    if (!transporterName.trim()) errs.transporter = "Transporter/party name is required.";
    if (!tripDate) errs.date = "Trip date is required.";

    if (!fromState.trim()) errs.fromState = "Starting state is required.";
    if (!fromCity.trim()) errs.fromCity = "Starting city is required.";
    if (!toState.trim()) errs.toState = "Destination state is required.";
    if (!toCity.trim()) errs.toCity = "Destination city is required.";

    if (!tripRunningKms || runningKms <= 0) {
      errs.tripRunningKms = "Valid trip running kilometers is required.";
    }

    if (!tripFare || numTripFare <= 0) {
      errs.tripFare = "Trip freight fare must be greater than zero.";
    }

    if (numBrokerFare < 0) {
      errs.brokerFare = "Broker fare cannot be negative.";
    }

    if (driverBetaType === "manual" && numManualBeta < 0) {
      errs.manualBeta = "Driver beta cannot be negative.";
    }

    if (numDieselLitres < 0) {
      errs.dieselLitres = "Diesel litres cannot be negative.";
    }

    if (numDieselExpense < 0) {
      errs.dieselExpense = "Diesel expense cannot be negative.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
      const selectedDriver = drivers.find((d) => d.id === driverId);

      const updatedTripData: Trip = {
        ...trip,
        vehicle_id: vehicleId,
        vehicle_number: selectedVehicle?.vehicle_number || trip.vehicle_number,
        driver_id: driverId,
        driver_name: selectedDriver?.name || trip.driver_name,
        transporter_name: transporterName.trim(),
        trip_date: tripDate,
        trip_start_datetime: tripStartDateTime || undefined,
        trip_end_datetime: tripEndDateTime || undefined,
        gps_source: gpsSource,
        gps_distance_km: tripRunningKms ? Number(tripRunningKms) : undefined,
        starting_odometer: startingOdometer ? Number(startingOdometer) : undefined,
        ending_odometer: endingOdometer ? Number(endingOdometer) : undefined,
        from_state: fromState.trim(),
        from_city: fromCity.trim(),
        to_state: toState.trim(),
        to_city: toCity.trim(),
        trip_running_kms: runningKms,
        trip_fare: numTripFare,
        broker_fare: numBrokerFare,
        driver_beta: calculatedDriverBeta,
        driver_beta_type: driverBetaType,
        halting_days: numHaltingDays,
        halting_charge_per_day: numHaltingChargePerDay,
        halting_fare: haltingFare,
        diesel_litres: numDieselLitres,
        diesel_expense: numDieselExpense,
        mileage: mileageInfo.mileage,
        toll_charges: numToll,
        loading_expense: numLoading,
        unloading_expense: numUnloading,
        other_expenses: numOther,
        net_profit: calculatedNetProfit,
        advance_received: numAdvanceReceived,
        advance_received_date: advanceReceivedDate || undefined,
        balance_amount: balanceAmount,
        balance_received_date: balanceReceivedDate || undefined,
        amount_paid_to_driver: numAmountPaidToDriver,
        driver_payment_date: driverPaymentDate || undefined,
        remaining_amount_to_driver: remainingAmountToDriver,
        updated_at: new Date().toISOString(),
      };

      await onTripUpdated(updatedTripData);
      setSuccessMessage("Updated sucessfuly");
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to save edited trip:", err);
      setErrors({ form: "Failed to update trip. Please try again." });
      setIsSaving(false);
    }
  };

  // Filtered lists for State & City lookups
  const filteredFromStates = searchStates(fromState);
  const filteredFromCities = searchCities(fromState, fromCity);
  const filteredToStates = searchStates(toState);
  const filteredToCities = searchCities(toState, toCity);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Edit Saved Trip</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/40">
                  {trip.vehicle_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Correct any mistaken particulars or expenses, then save changes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-800 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form error */}
        {errors.form && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-800 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Vehicle, Driver & Date */}
          <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>1. Vehicle, Driver &amp; Date Particulars</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Vehicle Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle <span className="text-red-500">*</span>
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicle_number} ({v.model})
                    </option>
                  ))}
                </select>
                {errors.vehicle && (
                  <p className="text-xs text-red-600 mt-1">{errors.vehicle}</p>
                )}
              </div>

              {/* Driver Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver <span className="text-red-500">*</span>
                </label>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.driver && (
                  <p className="text-xs text-red-600 mt-1">{errors.driver}</p>
                )}
              </div>

              {/* Transporter / Party */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transporter / Party <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ABC Logistics"
                  value={transporterName}
                  onChange={(e) => setTransporterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.transporter && (
                  <p className="text-xs text-red-600 mt-1">{errors.transporter}</p>
                )}
              </div>

              {/* Trip Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={tripDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setTripDate(newDate);
                    if (newDate && !tripStartDateTime) {
                      setTripStartDateTime(`${newDate}T06:00`);
                      setTripEndDateTime(`${newDate}T20:00`);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.date && (
                  <p className="text-xs text-red-600 mt-1">{errors.date}</p>
                )}
              </div>
            </div>

            {/* Trip Start & End Timestamps with BlackBuck GPS Integration */}
            <div className="mt-4 pt-3 border-t border-slate-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {/* Trip Start Date & Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trip Start Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={tripStartDateTime}
                    onChange={(e) => setTripStartDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Departure timestamp</p>
                </div>

                {/* Trip End Date & Time */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trip End Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={tripEndDateTime}
                    onChange={(e) => setTripEndDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Arrival timestamp</p>
                </div>
              </div>

              {/* BlackBuck GPS Quick-Sync Bar */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>BlackBuck GPS KM Sync</span>
                      {tripDurationHours !== null && (
                        <span className="text-[11px] font-normal text-amber-300">
                          ({tripDurationHours} hrs duration)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Query GPS device odometer difference for this vehicle &amp; timeframe
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBlackbuckSettings(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                    title="Configure BlackBuck API credentials"
                  >
                    <Settings className="w-3.5 h-3.5 text-amber-400" />
                    <span>Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSuggestHighwayDistance}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
                    title="Check highway route distance"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-400" />
                    <span>Highway Distance</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFetchBlackbuckGps}
                    disabled={isFetchingGps}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs tracking-wide transition cursor-pointer disabled:opacity-50"
                  >
                    {isFetchingGps ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Fetch GPS KM</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {gpsStatus.type && (
                <div
                  className={`mt-2 p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                    gpsStatus.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                      : gpsStatus.type === "error"
                      ? "bg-rose-50 border border-rose-200 text-rose-800"
                      : "bg-blue-50 border border-blue-200 text-blue-800"
                  }`}
                >
                  {gpsStatus.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : gpsStatus.type === "error" ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span>{gpsStatus.message}</span>
                    {gpsStatus.type === "error" && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => setShowBlackbuckSettings(true)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 underline hover:text-rose-900 cursor-pointer"
                        >
                          <Settings className="w-3 h-3" />
                          Configure BlackBuck API Credentials
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Highway Route Distance Suggestion */}
              {routeEstimateStatus.message && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-800 text-slate-200 text-xs flex items-center justify-between gap-2 border border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{routeEstimateStatus.message}</span>
                  </div>
                  {routeEstimateStatus.distanceKm && (
                    <button
                      type="button"
                      onClick={() => {
                        setTripRunningKms(String(routeEstimateStatus.distanceKm));
                        setGpsSource("manual");
                      }}
                      className="shrink-0 px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px]"
                    >
                      Apply {routeEstimateStatus.distanceKm} KM
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Route Origin & Destination */}
          <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>2. Route: Origin &amp; Destination</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* From State */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type state..."
                  value={fromState}
                  onChange={(e) => {
                    setFromState(e.target.value);
                    setShowFromStateDropdown(true);
                  }}
                  onFocus={() => setShowFromStateDropdown(true)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showFromStateDropdown && filteredFromStates.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 max-h-40 overflow-y-auto">
                    {filteredFromStates.slice(0, 15).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setFromState(st);
                          setShowFromStateDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-900 flex items-center justify-between"
                      >
                        <span>{st}</span>
                        {fromState === st && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
                {errors.fromState && (
                  <p className="text-xs text-red-600 mt-1">{errors.fromState}</p>
                )}
              </div>

              {/* From City */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type city..."
                  value={fromCity}
                  onChange={(e) => {
                    setFromCity(e.target.value);
                    setShowFromCityDropdown(true);
                  }}
                  onFocus={() => setShowFromCityDropdown(true)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showFromCityDropdown && filteredFromCities.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 max-h-40 overflow-y-auto">
                    {filteredFromCities.slice(0, 15).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => {
                          setFromCity(ct);
                          setShowFromCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-900 flex items-center justify-between"
                      >
                        <span>{ct}</span>
                        {fromCity === ct && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
                {errors.fromCity && (
                  <p className="text-xs text-red-600 mt-1">{errors.fromCity}</p>
                )}
              </div>

              {/* To State */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type state..."
                  value={toState}
                  onChange={(e) => {
                    setToState(e.target.value);
                    setShowToStateDropdown(true);
                  }}
                  onFocus={() => setShowToStateDropdown(true)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showToStateDropdown && filteredToStates.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 max-h-40 overflow-y-auto">
                    {filteredToStates.slice(0, 15).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setToState(st);
                          setShowToStateDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-900 flex items-center justify-between"
                      >
                        <span>{st}</span>
                        {toState === st && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
                {errors.toState && (
                  <p className="text-xs text-red-600 mt-1">{errors.toState}</p>
                )}
              </div>

              {/* To City */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Type city..."
                  value={toCity}
                  onChange={(e) => {
                    setToCity(e.target.value);
                    setShowToCityDropdown(true);
                  }}
                  onFocus={() => setShowToCityDropdown(true)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showToCityDropdown && filteredToCities.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-slate-200 max-h-40 overflow-y-auto">
                    {filteredToCities.slice(0, 15).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => {
                          setToCity(ct);
                          setShowToCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 text-slate-700 hover:text-blue-900 flex items-center justify-between"
                      >
                        <span>{ct}</span>
                        {toCity === ct && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
                {errors.toCity && (
                  <p className="text-xs text-red-600 mt-1">{errors.toCity}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Trip Running KMs & Diesel Performance */}
          <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-orange-600" />
              <span>3. Distance &amp; Fuel Performance</span>
            </h3>

            {/* Odometer Inputs (Start & End) */}
            <div className="p-3.5 mb-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    Odometer Readings (Dashboard / App)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Auto-calculates distance difference
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Starting Odometer (KM)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 142050"
                    value={startingOdometer}
                    onChange={(e) => handleOdometerChange(e.target.value, endingOdometer)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ending Odometer (KM)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 142560"
                    value={endingOdometer}
                    onChange={(e) => handleOdometerChange(startingOdometer, e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {startingOdometer && endingOdometer && Number(endingOdometer) >= Number(startingOdometer) && (
                <div className="mt-2 text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Odometer Distance:{" "}
                    <strong className="font-mono">
                      {Math.round((Number(endingOdometer) - Number(startingOdometer)) * 10) / 10} KM
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Trip Running KMs */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Trip Running KMs <span className="text-red-500">*</span>
                  </label>
                  {gpsSource === "blackbuck" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ BlackBuck GPS
                    </span>
                  ) : gpsSource === "odometer" ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                      ✓ Odometer
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Manual Entry</span>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 450"
                  value={tripRunningKms}
                  onChange={(e) => {
                    setTripRunningKms(e.target.value);
                    setGpsSource("manual");
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.tripRunningKms && (
                  <p className="text-xs text-red-600 mt-1">{errors.tripRunningKms}</p>
                )}
              </div>

              {/* Diesel Litres */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diesel Fuel (Litres)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 110"
                  value={dieselLitres}
                  onChange={(e) => setDieselLitres(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.dieselLitres && (
                  <p className="text-xs text-red-600 mt-1">{errors.dieselLitres}</p>
                )}
              </div>

              {/* Diesel Expense */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diesel Expense (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 10450"
                  value={dieselExpense}
                  onChange={(e) => setDieselExpense(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.dieselExpense && (
                  <p className="text-xs text-red-600 mt-1">{errors.dieselExpense}</p>
                )}
              </div>
            </div>

            {/* Live Mileage indicator */}
            <div className="mt-3 p-3 rounded-xl bg-orange-50/80 border border-orange-200/80 flex items-center justify-between">
              <div className="text-xs text-orange-950 font-medium flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-orange-600" />
                <span>Calculated Fuel Mileage:</span>
              </div>
              <div className="font-mono font-bold text-sm text-orange-950">
                {mileageInfo.isValid ? mileageInfo.formatted : "Awaiting Litres & Distance"}
              </div>
            </div>
          </div>

          {/* Section 4: Fares, Driver Beta & Expenses */}
          <div className="bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3.5 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>4. Freight Fares, Driver Beta &amp; Operational Costs</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Trip Fare */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trip Freight Fare (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 32000"
                  value={tripFare}
                  onChange={(e) => setTripFare(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.tripFare && (
                  <p className="text-xs text-red-600 mt-1">{errors.tripFare}</p>
                )}
              </div>

              {/* Broker Fare */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Broker Commission Fare (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 1000"
                  value={brokerFare}
                  onChange={(e) => setBrokerFare(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Driver Beta Configuration */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Driver Beta (Allowance)
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDriverBetaType("percentage")}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${
                        driverBetaType === "percentage"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      15%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDriverBetaType("manual")}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${
                        driverBetaType === "manual"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>

                {driverBetaType === "percentage" ? (
                  <div className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/70 text-sm font-mono font-bold text-blue-950 flex items-center justify-between">
                    <span className="text-xs text-blue-700">15% of Fare:</span>
                    <span>{formatINR(calculatedDriverBeta)}</span>
                  </div>
                ) : (
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 3500"
                    value={manualDriverBeta}
                    onChange={(e) => setManualDriverBeta(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            </div>

            {/* Operational Expenses */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Toll Charges */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Toll Charges (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={tollCharges}
                  onChange={(e) => setTollCharges(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Loading Expense */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Loading Expense (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={loadingExpense}
                  onChange={(e) => setLoadingExpense(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Unloading Expense */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Unloading Expense (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={unloadingExpense}
                  onChange={(e) => setUnloadingExpense(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Other Expenses */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Other Expenses (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="0"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Halting Details (Days, Charge/Day & Halting Fare) */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md inline-block mb-3">
                Halting &amp; Detention Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                {/* Halting days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Halting days
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={haltingDays}
                    onChange={(e) => setHaltingDays(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Halting charge / day */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Halting charge / day (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    value={haltingChargePerDay}
                    onChange={(e) => setHaltingChargePerDay(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Halting fare = Halting days * Halting charge/day */}
                <div>
                  <label className="block text-xs font-semibold text-purple-900 mb-1">
                    Halting fare (₹)
                  </label>
                  <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-300 flex items-center justify-between text-xs">
                    <span className="text-purple-800 font-medium">Days × Charge/day:</span>
                    <span className="font-mono font-black text-purple-950">
                      {formatINR(haltingFare)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advance Received & Balance Collection */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md inline-block mb-3">
                Party Freight Collection (Advance &amp; Balance)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Received (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 15000"
                    value={advanceReceived}
                    onChange={(e) => setAdvanceReceived(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Received Date
                  </label>
                  <input
                    type="date"
                    value={advanceReceivedDate}
                    onChange={(e) => setAdvanceReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Balance Amount (₹)
                  </label>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between text-xs">
                    <span className="text-amber-800 font-medium" title="Trip Fare - Broker Fare - Advance Received + Halting Fare">
                      Fare-Broker-Adv+Halt:
                    </span>
                    <span className="font-mono font-black text-amber-950">
                      {formatINR(balanceAmount)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Balance Received Date
                  </label>
                  <input
                    type="date"
                    value={balanceReceivedDate}
                    onChange={(e) => setBalanceReceivedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Driver Settlement Payments */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md inline-block mb-3">
                Driver Wage Settlement (Amount Paid &amp; Remaining)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid to Driver (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 5000"
                    value={amountPaidToDriver}
                    onChange={(e) => setAmountPaidToDriver(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Paid to Driver
                  </label>
                  <input
                    type="date"
                    value={driverPaymentDate}
                    onChange={(e) => setDriverPaymentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Remaining Amount to Driver (₹)
                  </label>
                  <div
                    className={`px-3 py-1.5 rounded-xl border flex items-center justify-between text-xs ${
                      remainingAmountToDriver > 0
                        ? "bg-rose-50 border-rose-300 text-rose-950"
                        : "bg-emerald-50 border-emerald-300 text-emerald-950"
                    }`}
                  >
                    <span className="font-medium">Beta - Paid:</span>
                    <span className="font-mono font-black">
                      {formatINR(remainingAmountToDriver)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Real-time Net Profit Calculation Preview */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                Updated Net Profit Preview
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Fare ({formatINR(numTripFare)}) &minus; Total Costs ({formatINR(totalOperationalCosts)})
              </div>
            </div>

            <div className="text-right">
              <div
                className={`text-2xl font-mono font-black ${
                  calculatedNetProfit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatINR(calculatedNetProfit)}
              </div>
              <div className="text-[11px] text-slate-400">
                {calculatedNetProfit >= 0 ? "Profitable Trip" : "Loss Incurred"}
              </div>
            </div>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving Changes..." : "Save Updated Trip"}</span>
          </button>
        </div>
      </div>

      {/* BlackBuck API & GPS Settings Modal */}
      <BlackBuckSettingsModal
        isOpen={showBlackbuckSettings}
        onClose={() => setShowBlackbuckSettings(false)}
      />
    </div>
  );
};
