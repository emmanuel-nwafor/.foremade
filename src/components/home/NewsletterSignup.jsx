import { useState } from 'react';
import { toast } from 'react-toastify';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '/src/firebase';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if already subscribed (if we had a more complex system)
      // const q = query(collection(db, 'newsletter_subscribers'), where('email', '==', email));
      // const querySnapshot = await getDocs(q);
      
      // if (!querySnapshot.empty) {
      //   toast.info('You are already subscribed!');
      //   setLoading(false);
      //   return;
      // }
      
      // Add to subscribers collection
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email,
        subscribedAt: new Date(),
        active: true
      });
      
      toast.success('Thanks for subscribing!');
      setEmail('');
      
      // Store in localStorage to remember the user subscribed
      localStorage.setItem('newsletter_subscribed', 'true');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check if already subscribed via localStorage
  const isAlreadySubscribed = localStorage.getItem('newsletter_subscribed') === 'true';

  return (
    <div className="bg-gray-100 py-6 sm:py-8 w-full overflow-hidden mb-8 sm:mb-12 lg:mb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Stay Connected</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
            {isAlreadySubscribed 
              ? 'Thanks for subscribing! You\'ll receive our best deals and updates.' 
              : 'Subscribe to our newsletter for exclusive deals and updates'}
          </p>
          
          {!isAlreadySubscribed && (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 sm:gap-0 max-w-md mx-auto mb-8 sm:mb-12 px-4">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address" 
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md sm:rounded-l-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                disabled={loading}
                required
              />
              <button 
                type="submit"
                className={`${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-4 py-2 rounded-md sm:rounded-l-none sm:rounded-r-md transition-colors whitespace-nowrap w-full sm:w-auto`}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <i className="bx bx-loader-alt animate-spin mr-2"></i>
                    Subscribing...
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
          )}
          
          {isAlreadySubscribed && (
            <button 
              onClick={() => {
                localStorage.removeItem('newsletter_subscribed');
                window.location.reload();
              }}
              className="text-blue-600 hover:text-blue-800 underline text-sm mt-2"
            >
              Change your email preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterSignup;