import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  User,
  Building,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Calculator,
  HelpCircle,
} from "lucide-react";
import { Vehicle, Driver, Trip, DriverBetaType } from "../types";
import {
  searchStates,
  searchCities,
  getCitiesForState,
} from "../lib/indianPlaces";
import {
  calculateDriverBeta,
  calculateMileage,
  calculateTripNetProfit,
  formatINR,
} from "../lib/calculations";
import { addVehicle, addDriver, addTrip } from "../lib/database";

interface AddTripPageProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  onTripAdded: () => Promise<void>;
  onNavigateHome: () => void;
  onRefreshMasterData: () => Promise<void>;
}

export const AddTripPage: React.FC<AddTripPageProps> = ({
  vehicles,
  drivers,
  onTripAdded,
  onNavigateHome,
  onRefreshMasterData,
}) => {
  // -------------------------------------------------------------
  // Form State
  // -------------------------------------------------------------
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [isNewVehicleMode, setIsNewVehicleMode] = useState(false);
  const [newVehicleNumber, setNewVehicleNumber] = useState("");

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isNewDriverMode, setIsNewDriverMode] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");

  const [transporterName, setTransporterName] = useState("");
  const [tripDate, setTripDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  // Route State
  const [fromState, setFromState] = useState("Tamil Nadu");
  const [fromCity, setFromCity] = useState("Chennai");
  const [fromStateQuery, setFromStateQuery] = useState("Tamil Nadu");
  const [fromCityQuery, setFromCityQuery] = useState("Chennai");
  const [showFromStateDropdown, setShowFromStateDropdown] = useState(false);
  const [showFromCityDropdown, setShowFromCityDropdown] = useState(false);

  const [toState, setToState] = useState("Tamil Nadu");
  const [toCity, setToCity] = useState("Coimbatore");
  const [toStateQuery, setToStateQuery] = useState("Tamil Nadu");
  const [toCityQuery, setToCityQuery] = useState("Coimbatore");
  const [showToStateDropdown, setShowToStateDropdown] = useState(false);
  const [showToCityDropdown, setShowToCityDropdown] = useState(false);

  // Running KMs
  const [tripRunningKms, setTripRunningKms] = useState<string>("");

  // Fares
  const [tripFare, setTripFare] = useState<string>("");
  const [brokerFare, setBrokerFare] = useState<string>("0");
  const [driverBetaType, setDriverBetaType] =
    useState<DriverBetaType>("percentage");
  const [manualDriverBeta, setManualDriverBeta] = useState<string>("");

  // Fuel
  const [dieselExpense, setDieselExpense] = useState<string>("0");
  const [dieselLitres, setDieselLitres] = useState<string>("0");

  // Halting Details
  const [haltingDays, setHaltingDays] = useState<string>("0");
  const [haltingChargePerDay, setHaltingChargePerDay] = useState<string>("0");
  const [loadingHaltingDays, setLoadingHaltingDays] = useState<string>("0");
  const [loadingHaltingChargePerDay, setLoadingHaltingChargePerDay] = useState<string>("0");
  const [unloadingHaltingDays, setUnloadingHaltingDays] = useState<string>("0");
  const [unloadingHaltingChargePerDay, setUnloadingHaltingChargePerDay] = useState<string>("0");

  // Advance & Balance Details
  const [advanceReceived, setAdvanceReceived] = useState<string>("");
  const [advanceReceivedDate, setAdvanceReceivedDate] = useState<string>("");
  const [balanceReceivedDate, setBalanceReceivedDate] = useState<string>("");

  // Driver Settlement Payments
  const [amountPaidToDriver, setAmountPaidToDriver] = useState<string>("");
  const [driverPaymentDate, setDriverPaymentDate] = useState<string>("");

  // Other Expenses
  const [tollCharges, setTollCharges] = useState<string>("0");
  const [loadingExpense, setLoadingExpense] = useState<string>("0");
  const [unloadingExpense, setUnloadingExpense] = useState<string>("0");
  const [otherExpenses, setOtherExpenses] = useState<string>("0");

  // Status & Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Active drivers only for selection
  const activeDrivers = useMemo(
    () => drivers.filter((d) => d.active),
    [drivers]
  );
  const activeVehicles = useMemo(
    () => vehicles.filter((v) => v.active),
    [vehicles]
  );

  // Initial defaults
  useEffect(() => {
    if (!selectedVehicleId && activeVehicles.length > 0) {
      setSelectedVehicleId(activeVehicles[0].id);
    }
  }, [activeVehicles, selectedVehicleId]);

  useEffect(() => {
    if (!selectedDriverId && activeDrivers.length > 0) {
      setSelectedDriverId(activeDrivers[0].id);
    }
  }, [activeDrivers, selectedDriverId]);

  // -------------------------------------------------------------
  // Derived Live Calculations
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
  const numLoadingHaltingDays = parseFloat(loadingHaltingDays) || 0;
  const numLoadingHaltingChargePerDay = parseFloat(loadingHaltingChargePerDay) || 0;
  const loadingHaltingFare = numLoadingHaltingDays * numLoadingHaltingChargePerDay;
  const numUnloadingHaltingDays = parseFloat(unloadingHaltingDays) || 0;
  const numUnloadingHaltingChargePerDay = parseFloat(unloadingHaltingChargePerDay) || 0;
  const unloadingHaltingFare = numUnloadingHaltingDays * numUnloadingHaltingChargePerDay;
  const numHaltingDays = numLoadingHaltingDays + numUnloadingHaltingDays;
  const haltingFare = loadingHaltingFare + unloadingHaltingFare;
  const numHaltingChargePerDay = numHaltingDays > 0 ? haltingFare / numHaltingDays : 0;

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

  const netProfit = calculateTripNetProfit({
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
  // Dynamic Master Data Handlers
  // -------------------------------------------------------------
  const handleAddNewDriver = async () => {
    if (!newDriverName.trim()) {
      setErrors((prev) => ({ ...prev, newDriver: "Driver name cannot be empty" }));
      return;
    }
    try {
      const added = await addDriver(newDriverName.trim());
      await onRefreshMasterData();
      setSelectedDriverId(added.id);
      setIsNewDriverMode(false);
      setNewDriverName("");
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.newDriver;
        delete copy.driver;
        return copy;
      });
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, newDriver: "Failed to add driver" }));
    }
  };

  const handleAddNewVehicle = async () => {
    if (!newVehicleNumber.trim()) {
      setErrors((prev) => ({ ...prev, newVehicle: "Vehicle number cannot be empty" }));
      return;
    }
    try {
      const added = await addVehicle(newVehicleNumber.trim());
      await onRefreshMasterData();
      setSelectedVehicleId(added.id);
      setIsNewVehicleMode(false);
      setNewVehicleNumber("");
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.newVehicle;
        delete copy.vehicle;
        return copy;
      });
    } catch (err) {
      console.error(err);
      setErrors((prev) => ({ ...prev, newVehicle: "Failed to add vehicle" }));
    }
  };

  // -------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedVehicleId && !isNewVehicleMode) {
      newErrors.vehicle = "Vehicle must be selected.";
    }
    if (isNewVehicleMode && !newVehicleNumber.trim()) {
      newErrors.newVehicle = "Enter the new vehicle registration number.";
    }

    if (!selectedDriverId && !isNewDriverMode) {
      newErrors.driver = "Driver must be selected.";
    }
    if (isNewDriverMode && !newDriverName.trim()) {
      newErrors.newDriver = "Enter the new driver name.";
    }

    if (!tripDate) {
      newErrors.tripDate = "Trip date is required.";
    }

    if (!fromCity.trim()) {
      newErrors.fromCity = "From city is required.";
    }
    if (!toCity.trim()) {
      newErrors.toCity = "To city is required.";
    }

    if (!tripRunningKms) {
      newErrors.tripRunningKms = "Trip running KMs is required.";
    } else if (runningKms <= 0) {
      newErrors.tripRunningKms = "Trip running KMs must be greater than zero.";
    }

    if (!tripFare || numTripFare <= 0) {
      newErrors.tripFare = "Trip fare must be greater than zero.";
    }

    if (numBrokerFare < 0) {
      newErrors.brokerFare = "Broker fare cannot be negative.";
    }

    if (driverBetaType === "manual" && numManualBeta < 0) {
      newErrors.manualDriverBeta = "Driver beta cannot be negative.";
    }

    if (numDieselExpense < 0) {
      newErrors.dieselExpense = "Diesel expense cannot be negative.";
    }

    if (numDieselLitres < 0) {
      newErrors.dieselLitres = "Diesel litres cannot be negative.";
    }

    if (numToll < 0) newErrors.toll = "Toll charges cannot be negative.";
    if (numLoading < 0) newErrors.loading = "Loading charges cannot be negative.";
    if (numUnloading < 0)
      newErrors.unloading = "Unloading charges cannot be negative.";
    if (numOther < 0) newErrors.other = "Other charges cannot be negative.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------------------------------------------------
  // Form Submission
  // -------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Scroll to the first error
      window.scrollTo({ top: 100, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      // Resolve vehicle ID & number
      let finalVehicleId = selectedVehicleId;
      let finalVehicleNumber = "";

      if (isNewVehicleMode && newVehicleNumber.trim()) {
        const addedV = await addVehicle(newVehicleNumber.trim());
        finalVehicleId = addedV.id;
        finalVehicleNumber = addedV.vehicle_number;
      } else {
        const v = vehicles.find((item) => item.id === selectedVehicleId);
        finalVehicleNumber = v ? v.vehicle_number : "";
      }

      // Resolve driver ID & name
      let finalDriverId = selectedDriverId;
      let finalDriverName = "";

      if (isNewDriverMode && newDriverName.trim()) {
        const addedD = await addDriver(newDriverName.trim());
        finalDriverId = addedD.id;
        finalDriverName = addedD.driver_name;
      } else {
        const d = drivers.find((item) => item.id === selectedDriverId);
        finalDriverName = d ? d.driver_name : "";
      }

      const tripPayload = {
        trip_date: tripDate,
        vehicle_id: finalVehicleId,
        driver_id: finalDriverId,
        transporter_name: transporterName.trim() || "Direct Transporter",
        trip_fare: numTripFare,
        broker_fare: numBrokerFare,
        driver_beta: calculatedDriverBeta,
        driver_beta_type: driverBetaType,
        halting_days: numHaltingDays,
        halting_charge_per_day: numHaltingChargePerDay,
        halting_fare: haltingFare,
        loading_halting_days: numLoadingHaltingDays,
        loading_halting_charge_per_day: numLoadingHaltingChargePerDay,
        loading_halting_fare: loadingHaltingFare,
        unloading_halting_days: numUnloadingHaltingDays,
        unloading_halting_charge_per_day: numUnloadingHaltingChargePerDay,
        unloading_halting_fare: unloadingHaltingFare,
        from_state: fromState,
        from_city: fromCity,
        to_state: toState,
        to_city: toCity,
        trip_running_kms: runningKms,
        toll_charges: numToll,
        diesel_expense: numDieselExpense,
        diesel_litres: numDieselLitres,
        mileage: mileageInfo.mileage,
        loading_expense: numLoading,
        unloading_expense: numUnloading,
        other_expenses: numOther,
        net_profit: netProfit,
        vehicle_number: finalVehicleNumber,
        driver_name: finalDriverName,
        advance_received: numAdvanceReceived,
        advance_received_date: advanceReceivedDate || undefined,
        balance_amount: balanceAmount,
        balance_received_date: balanceReceivedDate || undefined,
        amount_paid_to_driver: numAmountPaidToDriver,
        driver_payment_date: driverPaymentDate || undefined,
        remaining_amount_to_driver: remainingAmountToDriver,
      };

      await addTrip(tripPayload);
      await onTripAdded();

      setSuccessMessage("Trip saved sucessfully");
      setSubmitSuccess(true);

      // Return user to Home page after a short confirmation
      setTimeout(() => {
        onNavigateHome();
      }, 1500);
    } catch (err: any) {
      console.error("Trip submit error:", err);
      setErrors({
        submit:
          "Unable to save the trip. Please check your connection and try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Top Navigation & Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          Trip Entry Form
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Enter Transportation Trip
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Record all trip particulars, trip running distance, freight fare, and expenses.
          Driver beta and net profit calculate automatically.
        </p>
      </div>

      {/* Success Notification */}
      {submitSuccess && (
        <div className="mb-8 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-900 flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
          <div>
            <div className="text-lg font-bold">{successMessage}</div>
            <p className="text-xs text-emerald-700 mt-0.5">
              Trip saved to database. Returning to home page...
            </p>
          </div>
        </div>
      )}

      {/* Top Level Submit Error */}
      {errors.submit && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-300 text-red-800 text-sm flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================ */}
        {/* SECTION A: VEHICLE & DRIVER */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                A. Vehicle &amp; Driver
              </h2>
              <p className="text-xs text-slate-500">
                Select registered vehicle and active driver
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Vehicle Selection */}
            <div>
              <label
                htmlFor="vehicle-select"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Vehicle Number <span className="text-red-500">*</span>
              </label>

              {!isNewVehicleMode ? (
                <div className="space-y-2">
                  <select
                    id="vehicle-select"
                    value={selectedVehicleId}
                    onChange={(e) => {
                      if (e.target.value === "NEW_VEHICLE") {
                        setIsNewVehicleMode(true);
                      } else {
                        setSelectedVehicleId(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      -- Select Vehicle --
                    </option>
                    {activeVehicles.map((veh) => (
                      <option key={veh.id} value={veh.id}>
                        {veh.vehicle_number}
                      </option>
                    ))}
                    <option value="NEW_VEHICLE">+ New vehicle (manual entry)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="new-vehicle-input"
                      type="text"
                      placeholder="e.g. TN 25 AK 4061"
                      value={newVehicleNumber}
                      onChange={(e) => setNewVehicleNumber(e.target.value.toUpperCase())}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewVehicle}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewVehicleMode(false);
                        setNewVehicleNumber("");
                      }}
                      className="px-2.5 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  {errors.newVehicle && (
                    <p className="text-xs text-red-600">{errors.newVehicle}</p>
                  )}
                </div>
              )}
              {errors.vehicle && (
                <p className="text-xs text-red-600 mt-1">{errors.vehicle}</p>
              )}
            </div>

            {/* Driver Selection */}
            <div>
              <label
                htmlFor="driver-select"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Driver Name <span className="text-red-500">*</span>
              </label>

              {!isNewDriverMode ? (
                <div className="space-y-2">
                  <select
                    id="driver-select"
                    value={selectedDriverId}
                    onChange={(e) => {
                      if (e.target.value === "NEW_DRIVER") {
                        setIsNewDriverMode(true);
                      } else {
                        setSelectedDriverId(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      -- Select Driver --
                    </option>
                    {activeDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.driver_name}
                      </option>
                    ))}
                    <option value="NEW_DRIVER">+ Enter New Name</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      id="new-driver-name-input"
                      type="text"
                      placeholder="New Driver Name"
                      value={newDriverName}
                      onChange={(e) => setNewDriverName(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      id="add-driver-btn"
                      type="button"
                      onClick={handleAddNewDriver}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Add Driver
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewDriverMode(false);
                        setNewDriverName("");
                      }}
                      className="px-2.5 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                  {errors.newDriver && (
                    <p className="text-xs text-red-600">{errors.newDriver}</p>
                  )}
                </div>
              )}
              {errors.driver && (
                <p className="text-xs text-red-600 mt-1">{errors.driver}</p>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION B: TRANSPORTER */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                B. Transporter
              </h2>
              <p className="text-xs text-slate-500">
                Client or logistics transport company
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="transporter-name-input"
              className="block text-sm font-semibold text-slate-700 mb-1.5"
            >
              Transporter Name
            </label>
            <input
              id="transporter-name-input"
              type="text"
              placeholder="e.g. ABC Roadways / VRL Logistics / Sri Murugan Transports"
              value={transporterName}
              onChange={(e) => setTransporterName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION C: ROUTE INFORMATION */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                C. Route Information
              </h2>
              <p className="text-xs text-slate-500">
                Searchable Indian states and state-dependent city suggestions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* FROM ROUTE */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Origin (From)
              </div>

              {/* From State Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From State
                </label>
                <input
                  id="from-state-input"
                  type="text"
                  value={fromStateQuery}
                  onChange={(e) => {
                    setFromStateQuery(e.target.value);
                    setShowFromStateDropdown(true);
                  }}
                  onFocus={() => setShowFromStateDropdown(true)}
                  placeholder="Type state (e.g. Tamil Nadu)"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showFromStateDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchStates(fromStateQuery).slice(0, 8).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setFromState(st);
                          setFromStateQuery(st);
                          setShowFromStateDropdown(false);
                          // Suggest first city of that state if not set
                          const cities = getCitiesForState(st);
                          if (cities.length > 0) {
                            setFromCity(cities[0]);
                            setFromCityQuery(cities[0]);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* From City Autocomplete (State-dependent) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  From City / Town
                </label>
                <input
                  id="from-city-input"
                  type="text"
                  value={fromCityQuery}
                  onChange={(e) => {
                    setFromCityQuery(e.target.value);
                    setFromCity(e.target.value); // Allows manual city if typed
                    setShowFromCityDropdown(true);
                  }}
                  onFocus={() => setShowFromCityDropdown(true)}
                  placeholder={`Search ${fromState} cities...`}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showFromCityDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchCities(fromState, fromCityQuery).slice(0, 10).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => {
                          setFromCity(ct);
                          setFromCityQuery(ct);
                          setShowFromCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800"
                      >
                        {ct}
                      </button>
                    ))}
                    {fromCityQuery.trim() && !searchCities(fromState, fromCityQuery).includes(fromCityQuery.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFromCity(fromCityQuery.trim());
                          setShowFromCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-slate-100 hover:bg-blue-100 text-blue-800 font-semibold"
                      >
                        Use &quot;{fromCityQuery.trim()}&quot; as custom city
                      </button>
                    )}
                  </div>
                )}
                {errors.fromCity && (
                  <p className="text-xs text-red-600 mt-1">{errors.fromCity}</p>
                )}
              </div>
            </div>

            {/* TO ROUTE */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Destination (To)
              </div>

              {/* To State Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To State
                </label>
                <input
                  id="to-state-input"
                  type="text"
                  value={toStateQuery}
                  onChange={(e) => {
                    setToStateQuery(e.target.value);
                    setShowToStateDropdown(true);
                  }}
                  onFocus={() => setShowToStateDropdown(true)}
                  placeholder="Type state (e.g. Tamil Nadu)"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showToStateDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchStates(toStateQuery).slice(0, 8).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setToState(st);
                          setToStateQuery(st);
                          setShowToStateDropdown(false);
                          const cities = getCitiesForState(st);
                          if (cities.length > 0) {
                            setToCity(cities[0]);
                            setToCityQuery(cities[0]);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800"
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* To City Autocomplete (State-dependent) */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  To City / Town
                </label>
                <input
                  id="to-city-input"
                  type="text"
                  value={toCityQuery}
                  onChange={(e) => {
                    setToCityQuery(e.target.value);
                    setToCity(e.target.value);
                    setShowToCityDropdown(true);
                  }}
                  onFocus={() => setShowToCityDropdown(true)}
                  placeholder={`Search ${toState} cities...`}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showToCityDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchCities(toState, toCityQuery).slice(0, 10).map((ct) => (
                      <button
                        key={ct}
                        type="button"
                        onClick={() => {
                          setToCity(ct);
                          setToCityQuery(ct);
                          setShowToCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 text-slate-800"
                      >
                        {ct}
                      </button>
                    ))}
                    {toCityQuery.trim() && !searchCities(toState, toCityQuery).includes(toCityQuery.trim()) && (
                      <button
                        type="button"
                        onClick={() => {
                          setToCity(toCityQuery.trim());
                          setShowToCityDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs bg-slate-100 hover:bg-blue-100 text-blue-800 font-semibold"
                      >
                        Use &quot;{toCityQuery.trim()}&quot; as custom city
                      </button>
                    )}
                  </div>
                )}
                {errors.toCity && (
                  <p className="text-xs text-red-600 mt-1">{errors.toCity}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION D: TRIP DATE & RUNNING DISTANCE */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                D. Trip Date &amp; Running Distance
              </h2>
              <p className="text-xs text-slate-500">
                Specify the trip date and total actual running kilometers
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            {/* Trip Date */}
            <div>
              <label
                htmlFor="trip-date-input"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Trip Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="trip-date-input"
                  type="date"
                  value={tripDate}
                  onChange={(e) => setTripDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.tripDate && (
                <p className="text-xs text-red-600 mt-1">{errors.tripDate}</p>
              )}
            </div>

            {/* Running KMs Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="trip-running-kms-input"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Trip Running KMs <span className="text-red-500">*</span>
                </label>
              </div>
              <div className="relative">
                <input
                  id="trip-running-kms-input"
                  type="number"
                  step="any"
                  min="0"
                  placeholder="e.g. 450"
                  value={tripRunningKms}
                  onChange={(e) => setTripRunningKms(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  KM
                </span>
              </div>
              {errors.tripRunningKms && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.tripRunningKms}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                Total actual kilometers travelled for this trip
              </p>
            </div>
          </div>

          {/* Running Distance Confirmation Banner */}
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between self-start">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Active Trip Distance:
                </span>
                <p className="text-xs text-blue-700">
                  Used for fuel economy and route analytics
                </p>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-blue-900">
              {runningKms} KM
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION E: FARE DETAILS & DRIVER BETA */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                E. Fare Details &amp; Driver Beta
              </h2>
              <p className="text-xs text-slate-500">
                Automatic 15% Driver Beta calculation or manual amount entry
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* Trip Fare */}
            <div>
              <label
                htmlFor="trip-fare-input"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Trip Fare (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                  ₹
                </span>
                <input
                  id="trip-fare-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 50000"
                  value={tripFare}
                  onChange={(e) => setTripFare(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.tripFare && (
                <p className="text-xs text-red-600 mt-1">{errors.tripFare}</p>
              )}
            </div>

            {/* Broker Fare */}
            <div>
              <label
                htmlFor="broker-fare-input"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Broker Fare (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                  ₹
                </span>
                <input
                  id="broker-fare-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 2000"
                  value={brokerFare}
                  onChange={(e) => setBrokerFare(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.brokerFare && (
                <p className="text-xs text-red-600 mt-1">{errors.brokerFare}</p>
              )}
            </div>
          </div>

          {/* Driver Beta Selection */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Driver Beta Calculation Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <select
                  id="driver-beta-type-select"
                  value={driverBetaType}
                  onChange={(e) =>
                    setDriverBetaType(e.target.value as DriverBetaType)
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="percentage">15% of Trip Fare</option>
                  <option value="manual">Enter Amount</option>
                </select>
              </div>

              {driverBetaType === "manual" ? (
                <div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                      ₹
                    </span>
                    <input
                      id="manual-driver-beta-input"
                      type="number"
                      step="any"
                      placeholder="Enter Driver Beta Amount"
                      value={manualDriverBeta}
                      onChange={(e) => setManualDriverBeta(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {errors.manualDriverBeta && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.manualDriverBeta}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl">
                  <span className="text-xs font-semibold text-emerald-900">
                    Auto calculated (15%):
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-800">
                    {formatINR(calculatedDriverBeta)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* HALTING DETAILS — SEPARATE LOADING & UNLOADING */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-md">Halting / Detention Details</span>
              <span className="text-[11px] text-slate-500">Loading and unloading halting are stored separately.</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-extrabold text-purple-900">Loading Halting</h3><span className="text-[10px] font-bold uppercase tracking-wide text-purple-600">Loading point</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Days</span><input type="number" min="0" step="any" value={loadingHaltingDays} onChange={(e) => setLoadingHaltingDays(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></label>
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Charge / Day (₹)</span><input type="number" min="0" step="any" value={loadingHaltingChargePerDay} onChange={(e) => setLoadingHaltingChargePerDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></label>
                  <div className="rounded-xl bg-white border border-purple-200 px-3 py-2"><div className="text-[10px] text-purple-700 font-semibold">Loading Halting Fare</div><div className="font-mono font-black text-sm text-purple-950">{formatINR(loadingHaltingFare)}</div></div>
                </div>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-extrabold text-indigo-900">Unloading Halting</h3><span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600">Unloading point</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Days</span><input type="number" min="0" step="any" value={unloadingHaltingDays} onChange={(e) => setUnloadingHaltingDays(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                  <label><span className="block text-xs font-bold text-slate-700 mb-1">Charge / Day (₹)</span><input type="number" min="0" step="any" value={unloadingHaltingChargePerDay} onChange={(e) => setUnloadingHaltingChargePerDay(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                  <div className="rounded-xl bg-white border border-indigo-200 px-3 py-2"><div className="text-[10px] text-indigo-700 font-semibold">Unloading Halting Fare</div><div className="font-mono font-black text-sm text-indigo-950">{formatINR(unloadingHaltingFare)}</div></div>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-purple-100 border border-purple-200 px-4 py-3 flex items-center justify-between"><div><div className="text-xs font-bold text-purple-900">Total Halting</div><div className="text-[11px] text-purple-700">{numHaltingDays} days · Loading + Unloading</div></div><div className="font-mono font-black text-lg text-purple-950">{formatINR(haltingFare)}</div></div>
          </div>

          {/* ADVANCE & BALANCE COLLECTION (PARTY / TRANSPORTER) */}
          {/* ============================================================ */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md">
                Party Freight Collection (Advance &amp; Balance)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Advance Received */}
              <div>
                <label
                  htmlFor="advance-received-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Advance Received (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    id="advance-received-input"
                    type="number"
                    step="any"
                    placeholder="Enter advance amount"
                    value={advanceReceived}
                    onChange={(e) => setAdvanceReceived(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Advance Received Date */}
              <div>
                <label
                  htmlFor="advance-received-date-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Advance Received Date
                </label>
                <input
                  id="advance-received-date-input"
                  type="date"
                  value={advanceReceivedDate}
                  onChange={(e) => setAdvanceReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Balance Amount (Trip Fare - Broker Fare - Advance Received + Halting Fare) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Balance Amount (₹)
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-300 flex items-center justify-between">
                  <span className="text-[10px] text-amber-800 font-semibold" title="Trip Fare - Broker Fare - Advance Received + Halting Fare">
                    Fare-Broker-Adv+Halt:
                  </span>
                  <span className="font-mono font-black text-sm text-amber-950">
                    {formatINR(balanceAmount)}
                  </span>
                </div>
              </div>

              {/* Balance Received Date */}
              <div>
                <label
                  htmlFor="balance-received-date-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Balance Received Date
                </label>
                <input
                  id="balance-received-date-input"
                  type="date"
                  value={balanceReceivedDate}
                  onChange={(e) => setBalanceReceivedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* DRIVER PAYMENT & REMAINING AMOUNT SETTLEMENT */}
          {/* ============================================================ */}
          <div className="mt-5 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-2.5 py-0.5 rounded-md">
                Driver Wage Settlement (Amount Paid &amp; Remaining)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              {/* Amount Paid to Driver */}
              <div>
                <label
                  htmlFor="amount-paid-to-driver-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Amount Paid to Driver (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    id="amount-paid-to-driver-input"
                    type="number"
                    step="any"
                    placeholder="Enter amount paid"
                    value={amountPaidToDriver}
                    onChange={(e) => setAmountPaidToDriver(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Amount Paid Date */}
              <div>
                <label
                  htmlFor="driver-payment-date-input"
                  className="block text-xs font-bold text-slate-700 mb-1"
                >
                  Payment Date to Driver
                </label>
                <input
                  id="driver-payment-date-input"
                  type="date"
                  value={driverPaymentDate}
                  onChange={(e) => setDriverPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Remaining Amount to Driver (Driver Beta - Amount Paid to Driver) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Remaining Amount to Driver (₹)
                </label>
                <div
                  className={`px-3.5 py-2 rounded-xl border flex items-center justify-between ${
                    remainingAmountToDriver > 0
                      ? "bg-rose-50 border-rose-300 text-rose-950"
                      : "bg-emerald-50 border-emerald-300 text-emerald-950"
                  }`}
                >
                  <span className="text-xs font-semibold">
                    Beta - Paid:
                  </span>
                  <span className="font-mono font-black text-sm">
                    {formatINR(remainingAmountToDriver)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION F: FUEL INFORMATION */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                F. Fuel Information &amp; Mileage
              </h2>
              <p className="text-xs text-slate-500">
                Diesel expenditure and automated km/litre calculation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
            <div>
              <label
                htmlFor="diesel-expense-input"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Diesel Expense (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 font-bold">
                  ₹
                </span>
                <input
                  id="diesel-expense-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 10000"
                  value={dieselExpense}
                  onChange={(e) => setDieselExpense(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.dieselExpense && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.dieselExpense}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="diesel-litres-input"
                className="block text-sm font-semibold text-slate-700 mb-1.5"
              >
                Total Diesel in Litres
              </label>
              <input
                id="diesel-litres-input"
                type="number"
                step="any"
                placeholder="e.g. 60"
                value={dieselLitres}
                onChange={(e) => setDieselLitres(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.dieselLitres && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.dieselLitres}
                </p>
              )}
            </div>
          </div>

          {/* Mileage Display */}
          <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-orange-950 uppercase tracking-wide">
                Automated Mileage:
              </span>
              <p className="text-xs text-orange-800">
                Formula: Trip Running KMs / Total Diesel Litres
              </p>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-orange-900">
              {mileageInfo.formatted}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION G: OTHER TRIP EXPENSES */}
        {/* ============================================================ */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                G. Other Trip Expenses
              </h2>
              <p className="text-xs text-slate-500">
                Toll fees, loading, unloading, and misc charges
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="toll-charges-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Toll Charges (₹)
              </label>
              <input
                id="toll-charges-input"
                type="number"
                step="any"
                value={tollCharges}
                onChange={(e) => setTollCharges(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="loading-expense-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Loading (₹)
              </label>
              <input
                id="loading-expense-input"
                type="number"
                step="any"
                value={loadingExpense}
                onChange={(e) => setLoadingExpense(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="unloading-expense-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Unloading (₹)
              </label>
              <input
                id="unloading-expense-input"
                type="number"
                step="any"
                value={unloadingExpense}
                onChange={(e) => setUnloadingExpense(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="other-expenses-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Other Expenses (₹)
              </label>
              <input
                id="other-expenses-input"
                type="number"
                step="any"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION H: LIVE NET PROFIT SUMMARY & SUBMIT */}
        {/* ============================================================ */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Live Trip Calculation
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                Net Trip Profit
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md">
                Fare &minus; Broker &minus; Driver Beta &minus; Diesel &minus; Toll &minus; Loading &minus; Unloading &minus; Other
              </p>
            </div>

            <div className="text-right">
              <div
                className={`text-3xl sm:text-4xl font-black font-mono ${
                  netProfit >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {formatINR(netProfit)}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {netProfit >= 0 ? "Profitable Trip" : "Loss Incurred"}
              </div>
            </div>
          </div>

          {/* Quick Expense Breakdown Pill Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300 mb-6">
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <div className="text-slate-400">Trip Fare:</div>
              <div className="font-mono font-bold text-white text-sm">
                {formatINR(numTripFare)}
              </div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <div className="text-slate-400">Driver Beta:</div>
              <div className="font-mono font-bold text-white text-sm">
                {formatINR(calculatedDriverBeta)}
              </div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <div className="text-slate-400">Diesel:</div>
              <div className="font-mono font-bold text-white text-sm">
                {formatINR(numDieselExpense)}
              </div>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl">
              <div className="text-slate-400">Tolls &amp; Misc:</div>
              <div className="font-mono font-bold text-white text-sm">
                {formatINR(numToll + numLoading + numUnloading + numOther)}
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            id="submit-trip-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-base sm:text-lg tracking-wide shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Saving Trip to Database...</span>
            ) : (
              <>
                <span>SUBMIT TRIP</span>
                <CheckCircle2 className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
