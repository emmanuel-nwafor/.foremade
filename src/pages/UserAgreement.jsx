import React, { useState } from 'react';
import '/src/theme.css';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Lock } from 'lucide-react';
import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path to your Firebase config
import CustomAlert, { useAlerts } from '../components/common/CustomAlert'; // Reusing CustomAlert from ProSellerForm

const DeleteAccountPopup = ({ isOpen, onClose, onConfirm, password, setPassword, isDeleting }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-orange-200 dark:border-gray-700"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-orange-800 dark:text-orange-400 text-center mb-4">
              Delete Your Account
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              You are about to delete your account. This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all border-gray-300"
                  disabled={isDeleting}
                />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={onConfirm}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base shadow-lg hover:from-red-600 hover:to-red-700 focus:ring-4 focus:ring-red-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isDeleting || !password}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-orange-100 text-orange-700 font-bold text-base shadow hover:bg-orange-200 transition border-2 border-orange-200"
                disabled={isDeleting}
              >
                No, Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const UserAgreement = () => {
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [password, setPassword, MAGNETIC_FIELD] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const auth = getAuth();

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      addAlert('No user is logged in.', 'error');
      return;
    }

    if (!password) {
      addAlert('Please enter your password to confirm deletion.', 'error');
      return;
    }

    setIsDeleting(true);
    try {
      // Step 1: Re-authenticate the user
      const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Step 2: Delete Firestore user data
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await deleteDoc(userDocRef).catch((err) => {
        console.error('Firestore deletion error:', err);
        throw new Error('Failed to delete user data.');
      });

      // Step 3: Delete Firebase Auth user
      await deleteUser(auth.currentUser).catch((err) => {
        console.error('Auth deletion error:', err);
        throw new Error('Failed to delete user account.');
      });

      // Step 4: Clear password and close popup
      setPassword('');
      setShowDeletePopup(false);
      addAlert('Your account has been successfully deleted.', 'success');
      navigate('/'); // Redirect to homepage
    } catch (error) {
      console.error('Account deletion error:', error);
      if (error.code === 'auth/wrong-password') {
        addAlert('Incorrect password. Please try again.', 'error');
      } else if (error.code === 'auth/requires-recent-login') {
        addAlert('Please log in again to authenticate this action.', 'error');
        navigate('/login');
      } else {
        addAlert(`Failed to delete account: ${error.message}`, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light py-8">
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      <DeleteAccountPopup
        isOpen={showDeletePopup}
        onClose={() => {
          setShowDeletePopup(false);
          setPassword('');
        }}
        onConfirm={handleDeleteAccount}
        password={password}
        setPassword={setPassword}
        isDeleting={isDeleting}
      />
      <div className="max-w-3xl mx-auto policy-card">
        <div className="policy-header text-primary">FOREMADE Marketplace & FOREMADEGo User Agreement</div>
        <div className="policy-content">
          <p className="mb-2 text-secondary"><strong>Effective Date:</strong> 30th July 2025</p>
          <p className="mb-2 text-secondary"><strong>Last Updated:</strong> 30th July 2025</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Scope of Agreement</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Buyers and sellers on the FOREMADE Marketplace;</li>
            <li>Delivery partners and riders using FOREMADEGo;</li>
            <li>Use of the FOREMADE Wallet for receiving, holding, and withdrawing funds;</li>
            <li>Any use of linked external websites and services.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Eligibility</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Be at least 18 years of age;</li>
            <li>Have the legal capacity to enter into contracts;</li>
            <li>Provide accurate and complete registration details.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Account Registration and Security</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>You must create an account to access key services.</li>
            <li>You are responsible for safeguarding your account credentials and all activity under your account.</li>
            <li>FOREMADE reserves the right to suspend or terminate accounts due to fraud, abuse, or policy violations.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Marketplace Use (Buying & Selling)</h2>
          <strong className="block mb-2 text-secondary">Buyers agree to:</strong>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Review product listings thoroughly before purchase;</li>
            <li>Use authorized payment methods only;</li>
            <li>Raise complaints or disputes through the Platform.</li>
          </ul>
          <strong className="block mb-2 text-secondary">Sellers agree to:</strong>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Provide accurate and honest product listings;</li>
            <li>Fulfill orders within the promised timeframe;</li>
            <li>Comply with all relevant product, tax, and business obligations;</li>
            <li>Accept returns and issue refunds in accordance with FOREMADE guidelines.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">FOREMADEGo (Delivery Network)</h2>
          <p className="mb-2 text-secondary">FOREMADEGo is our parcel delivery network connecting senders with approved delivery riders.</p>
          <strong className="block mb-2 text-secondary">Riders agree to:</strong>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Register via <a href="https://foremadego.com/rider/register.php" className="policy-link" target="_blank" rel="noopener noreferrer">Rider Registration</a>;</li>
            <li>Accept delivery jobs through the dashboard;</li>
            <li>Handle deliveries professionally and on time;</li>
            <li>Confirm delivery with required proof, including photos where applicable;</li>
            <li>Follow all safety and service standards.</li>
          </ul>
          <strong className="block mb-2 text-secondary">Senders and recipients agree to:</strong>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Provide accurate delivery information;</li>
            <li>Avoid sending prohibited, restricted, or illegal items;</li>
            <li>Cooperate with delivery personnel during handoffs.</li>
          </ul>
          <p className="mb-4 text-secondary">FOREMADE reserves the right to remove any rider or user for misconduct, policy violations, or misuse of the platform.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">FOREMADE Wallet – Fair Use and Security</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Automated System: Powered by integrated financial technology partners to ensure fast and secure processing.</li>
            <li>Regulatory Compliance: Operates in connection with financial regulations applicable in your local jurisdiction.</li>
            <li>Real-Time Tracking: Users can view their wallet balances and transaction history at any time.</li>
            <li>Instant Withdrawals: Earnings can be withdrawn at any time to a verified bank account. Processing times may vary based on the financial institution.</li>
            <li>Fair Use Policy:
              <ul className="list-disc ml-6 mb-2">
                <li>The Wallet is strictly for funds earned through transactions on FOREMADE or FOREMADEGo.</li>
                <li>Fraudulent activity or system manipulation may result in a freeze or closure of the account.</li>
                <li>FOREMADE may temporarily restrict wallet use during investigations or dispute resolution.</li>
              </ul>
            </li>
          </ul>
          <p className="mb-4 text-secondary">All wallet data is protected using secure encryption and authentication protocols.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Fees and Payments</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>FOREMADE may charge transaction, listing, or service fees as applicable.</li>
            <li>All fees will be clearly displayed during your transaction or use of a service.</li>
            <li>FOREMADE reserves the right to update its fee structure, with notice posted on the Platform.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Returns, Refunds, and Disputes</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Buyers may request returns or refunds in accordance with seller policies and FOREMADE standards.</li>
            <li>Disputes can be raised through the platform for moderation.</li>
            <li>FOREMADE acts as a neutral facilitator and may take appropriate action based on the evidence provided.</li>
            <li>Misuse of the dispute system may result in account restrictions.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">External Links and Third-Party Websites</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>FOREMADE and FOREMADEGo may include links to third-party services such as payment gateways or logistics tools.</li>
            <li>These links are provided for user convenience only.</li>
            <li>FOREMADE is not responsible for the content, policies, or services of any third-party website.</li>
            <li>Users should review third-party terms before engaging with those services.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Intellectual Property</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>All content, branding, and features on FOREMADE and FOREMADEGo are owned by or licensed to FOREMADE Ltd.</li>
            <li>Sellers retain ownership of their content but grant FOREMADE a non-exclusive, royalty-free license to use it for promotion and platform functionality.</li>
            <li>You may not copy, distribute, or reproduce platform content without prior written consent.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Termination and Suspension</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Violating this Agreement;</li>
            <li>Engaging in fraudulent, harmful, or illegal conduct;</li>
            <li>Abusing platform systems, wallets, or other users.</li>
          </ul>
          <p className="mb-4 text-secondary">You may close your account at any time. If eligible, your remaining wallet balance will be made available for withdrawal, subject to any pending investigations or disputes.</p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setShowDeletePopup(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-base shadow-lg hover:from-red-600 hover:to-red-700 focus:ring-4 focus:ring-red-200 transition"
            >
              Opt Out
            </button>
          </div>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Limitation of Liability</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>FOREMADE is not liable for indirect, incidental, or consequential damages;</li>
            <li>We are not responsible for the actions or failures of buyers, sellers, riders, or third parties;</li>
            <li>Platform services are provided “as is” without warranties of any kind.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Indemnity</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Your breach of this Agreement;</li>
            <li>Your use or misuse of the Platform;</li>
            <li>Any product or service you list, purchase, or deliver via FOREMADE or FOREMADEGo.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Governing Law</h2>
          <p className="mb-4 text-secondary">This Agreement shall be interpreted and enforced in accordance with applicable local laws, without reference to specific jurisdictions. Users are responsible for complying with laws in their region while using the platform.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Amendments</h2>
          <p className="mb-4 text-secondary">We may update or revise this Agreement from time to time. The latest version will be posted on the Platform, and continued use constitutes your acceptance of the updated terms.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">Contact Information</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>General Support: <a href="mailto:support@foremade.com" className="policy-link">support@foremade.com</a></li>
            <li>Privacy Questions: <a href="mailto:privacy@foremadego.com" className="policy-link">privacy@foremadego.com</a></li>
            <li>Marketplace: <a href="https://foremade.com" className="policy-link" target="_blank" rel="noopener noreferrer">foremade.com</a></li>
            <li>Delivery Platform (FOREMADEGo): <a href="https://foremadego.com" className="policy-link" target="_blank" rel="noopener noreferrer">foremadego.com</a></li>
            <li>Rider Registration: <a href="https://foremadego.com/rider/register.php" className="policy-link" target="_blank" rel="noopener noreferrer">foremadego.com/rider/register.php</a></li>
          </ul>
          <p className="mb-4 text-secondary font-semibold">By using FOREMADE and/or FOREMADEGo, you confirm that you have read, understood, and agreed to this User Agreement.</p>
        </div>
        <footer className="policy-footer">
          &copy; {new Date().getFullYear()} Foremade. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default UserAgreement;