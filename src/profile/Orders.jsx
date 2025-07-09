import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import Sidebar from '/src/profile/Sidebar';
import Spinner from '../components/common/Spinner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Form validation for product creation (for sellers)
  const validateForm = (formData, imageFiles, videoFiles, categories, customSubcategories, customSubSubcategories) => {
    const newErrors = {};
    const MAX_IMAGES = 5;
    const MAX_VIDEOS = 1;

    if (!formData.sellerName.trim()) newErrors.sellerName = 'Please enter your full name.';
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0)
      newErrors.price = 'Enter a valid price greater than 0.';
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = 'Enter a valid stock quantity (0 or more).';
    if (!formData.category || !categories.includes(formData.category))
      newErrors.category = 'Select a valid category.';
    if (imageFiles.length === 0) newErrors.images = 'At least one image is required.';
    if (imageFiles.length > MAX_IMAGES) newErrors.images = `Maximum ${MAX_IMAGES} images allowed.`;
    if (videoFiles.length > MAX_VIDEOS) newErrors.videos = `Maximum ${MAX_VIDEOS} video allowed.`;
    if (formData.colors.length === 0) newErrors.colors = 'Select at least one color.';
    if (
      formData.category === 'Clothing' &&
      formData.subcategory &&
      formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for clothing products.';
    }
    if (
      formData.category === 'Footwear' &&
      formData.subcategory &&
      formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for footwear products.';
    }
    if (
      formData.category === 'Perfumes' &&
      formData.subcategory &&
      formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for perfume products.';
    }
    if (!formData.manualSize) newErrors.manualSize = 'Please select a product size.';
    return newErrors;
  };

  const validateLocationForm = (locationData) => {
    return {};
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!auth.currentUser) {
          setError('Please sign in to view your orders.');
          setLoading(false);
          return;
        }

        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', auth.currentUser.uid));
        const ordersSnap = await getDocs(ordersQuery);

        const fetchedOrders = await Promise.all(
          ordersSnap.docs.map(async (orderDoc) => {
            const orderData = orderDoc.data();
            const items = Array.isArray(orderData.items) ? orderData.items : [];
            const total = orderData.total || 0;
            const trackingId = orderData.paymentId || `TRK-${orderDoc.id.slice(0, 8)}`;
            const status = orderData.status || 'Pending';

            let seller = { sellerId: null, displayName: 'Unknown Seller', avatar: null };
            if (items.length > 0 && items[0].productId) {
              try {
                const productRef = doc(db, 'products', items[0].productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                  const productData = productSnap.data();
                  const sellerId = productData.sellerId;
                  if (sellerId) {
                    const sellerRef = doc(db, 'users', sellerId);
                    const sellerSnap = await getDoc(sellerRef);
                    if (sellerSnap.exists()) {
                      const sellerData = sellerSnap.data();
                      seller = {
                        sellerId,
                        displayName: sellerData.displayName || 'Unknown Seller',
                        avatar: sellerData.avatar || 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff&size=40',
                      };
                    }
                  }
                }
              } catch (err) {
                console.error('Error fetching seller data:', err.message);
              }
            }

            return {
              orderId: orderDoc.id,
              trackingId,
              total,
              status,
              date: orderData.date || new Date().toISOString(),
              items,
              seller,
            };
          })
        );

        setOrders(fetchedOrders);
      } catch (err) {
        setError(`Failed to load orders: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchOrders();
      else {
        setError('Please sign in to view your orders.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatPrice = (price) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const handleChatWithSeller = (order) => {
    navigate(`/chat/${order.orderId}`, {
      state: {
        sellerId: order.seller.sellerId,
        productName: order.items[0]?.name || 'Product',
        orderId: order.orderId,
        role: 'buyer',
      },
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error}</p>
        <Link to="/login" className="text-blue-600 hover:underline">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Orders</h1>
      {orders.length === 0 ? (
        <p className="text-gray-600">
          No orders found.{' '}
          <Link to="/products" className="text-blue-600 hover:underline">Start shopping</Link>
        </p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.orderId} className="p-4 bg-white rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Order #{order.orderId}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600">{order.status}</span>
                  <button
                    onClick={() => handleChatWithSeller(order)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Chat with Seller
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">Tracking ID: {order.trackingId}</p>
              <p className="text-sm text-gray-600 mb-2">Date: {new Date(order.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 mb-2">Seller: {order.seller.displayName}</p>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <p key={index} className="text-sm text-gray-600">
                    {item.name} x{item.quantity} - {formatPrice(item.price * item.quantity)}
                  </p>
                ))}
              </div>
              <p className="text-sm font-semibold text-gray-800 mt-4">
                Total: {formatPrice(order.total)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;