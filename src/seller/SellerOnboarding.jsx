import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "/src/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import axios from "axios";
import SellerSidebar from "./SellerSidebar";

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    country: "Nigeria",
    idNumber: "",
    bankName: "",
    bankCode: "",
    accountNumber: "",
    iban: "",
    email: auth.currentUser?.email || "",
  });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // Stepper state

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
    if (formData.country === "Nigeria") {
      if (!formData.bankCode) newErrors.bankCode = "Select a bank.";
      if (!formData.accountNumber.match(/^\d{10}$/))
        newErrors.accountNumber = "Enter a valid 10-digit account number.";
    } else {
      if (!formData.idNumber.trim()) newErrors.idNumber = "Enter a valid ID number.";
      if (!formData.iban.match(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/))
        newErrors.iban = "Enter a valid IBAN.";
      if (!formData.email.match(/\S+@\S+\.\S+/)) newErrors.email = "Enter a valid email.";
      if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required.";
    }
    return newErrors;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!auth.currentUser) {
          setError("Please log in to onboard.");
          navigate("/login");
          return;
        }
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().isOnboarded) {
          console.log(`User ${auth.currentUser.uid} already onboarded`);
          setShowModal(true);
          return;
        }
        if (formData.country === "Nigeria") {
          const response = await axios.get("https://foremade-backend.onrender.com/fetch-banks");
          setBanks(response.data);
        }
      } catch (err) {
        console.error(`Initialization error for ${auth.currentUser.uid}:`, err);
        setError("Initialization error: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [formData.country, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    // Update step based on filled fields
    if (name === "fullName" && value.trim() && step < 2) setStep(2);
    if (
      (formData.country === "Nigeria" && name === "bankCode" && value && formData.accountNumber) ||
      (formData.country === "United Kingdom" && name === "idNumber" && value)
    )
      setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }
    try {
      const payload = {
        userId: auth.currentUser.uid,
        country: formData.country,
        fullName: formData.fullName,
        email: formData.email,
        bankCode: formData.country === "Nigeria" ? formData.bankCode : undefined,
        accountNumber: formData.country === "Nigeria" ? formData.accountNumber : undefined,
        iban: formData.country === "United Kingdom" ? formData.iban : undefined,
        bankName: formData.country === "United Kingdom" ? formData.bankName : undefined,
        idNumber: formData.country === "United Kingdom" ? formData.idNumber : undefined,
      };
      console.log(`Submitting onboarding for ${auth.currentUser.uid}:`, payload);
      const response = await axios.post("https://foremade-backend.onrender.com/onboard-seller", payload);
      if (response.data.error) throw new Error(response.data.error);

      if (formData.country === "United Kingdom") {
        window.location.href = response.data.redirectUrl;
        return;
      }

      const currentDate = new Date().toISOString();
      const sellerData = {
        fullName: formData.fullName,
        country: formData.country,
        idNumber: "",
        bankName: banks.find((b) => b.code === formData.bankCode)?.name || "",
        bankCode: formData.country === "Nigeria" ? formData.bankCode : "",
        accountNumber: formData.country === "Nigeria" ? formData.accountNumber : "",
        iban: "",
        email: "",
        paystackRecipientCode: response.data.recipientCode || "",
        createdAt: currentDate,
        updatedAt: currentDate,
      };

      await setDoc(doc(db, "sellers", auth.currentUser.uid), sellerData, { merge: true });

      await setDoc(doc(db, "users", auth.currentUser.uid), {
        role: "seller",
        isOnboarded: true,
        updatedAt: currentDate,
      }, { merge: true });

      console.log(`Onboarding successful for ${auth.currentUser.uid}, role set to seller`);
      alert("Onboarding successful!");
      navigate("/smile");
    } catch (error) {
      console.error(`Onboarding failed for ${auth.currentUser.uid}:`, error);
      setError("Failed to onboard: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300 animate-pulse">
            <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            <span className="text-lg">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-xl shadow-lg max-w-md">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          {/* Stepper */}
          <div className="mb-8 flex justify-between items-center">
            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div
                className="h-1 bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>
            <div className="flex space-x-4 ml-4">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-300 ${
                    step >= s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              Seller Onboarding
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Complete your profile to start selling on FOREMADE.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full p-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                    errors.fullName ? "border-red-500" : ""
                  }`}
                  disabled={loading}
                  placeholder="e.g., John Doe"
                  aria-label="Full Name"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <i className="bx bx-user"></i>
                </span>
              </div>
              {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                disabled={loading}
                aria-label="Country"
              >
                <option value="Nigeria">Nigeria</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>
            {formData.country === "Nigeria" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={handleChange}
                    className={`mt-1 w-full p-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                      errors.bankCode ? "border-red-500" : ""
                    }`}
                    disabled={loading}
                    aria-label="Bank Name"
                  >
                    <option value="">Select a bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  {errors.bankCode && <p className="text-red-600 text-xs mt-1">{errors.bankCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="e.g., 0123456789"
                      className={`w-full p-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.accountNumber ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                      aria-label="Account Number"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <i className="bx bx-bank"></i>
                    </span>
                  </div>
                  {errors.accountNumber && <p className="text-red-600 text-xs mt-1">{errors.accountNumber}</p>}
                </div>
              </>
            )}
            {formData.country === "United Kingdom" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                      placeholder="e.g., AB123456C"
                      className={`w-full p-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.idNumber ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                      aria-label="ID Number"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <i className="bx bx-id-card"></i>
                    </span>
                  </div>
                  {errors.idNumber && <p className="text-red-600 text-xs mt-1">{errors.idNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g., Barclays"
                      className={`w-full p-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.bankName ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                      aria-label="Bank Name"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <i className="bx bx-bank"></i>
                    </span>
                  </div>
                  {errors.bankName && <p className="text-red-600 text-xs mt-1">{errors.bankName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    IBAN <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      placeholder="e.g., GB33BUKB20201555555555"
                      className={`w-full p-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.iban ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                      aria-label="IBAN"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <i className="bx bx-credit-card"></i>
                    </span>
                  </div>
                  {errors.iban && <p className="text-red-600 text-xs mt-1">{errors.iban}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g., seller@example.com"
                      className={`w-full p-3 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      disabled={loading}
                      aria-label="Email"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                      <i className="bx bx-envelope"></i>
                    </span>
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
              </>
            )}
            <button
              type="submit"
              className={`w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 transition duration-300 ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              disabled={loading}
              aria-label="Complete Onboarding"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                  Complete Onboarding
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md mx-4 sm:mx-0 transform transition-all duration-500 ease-out animate-fadeInUp">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Already Onboarded</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">You’re already set as a seller! Ready to manage your wallet?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate("/sell")}
                className="py-2 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                aria-label="Go to Dashboard"
              >
                Yes
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="py-2 px-6 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200"
                aria-label="Close Modal"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}