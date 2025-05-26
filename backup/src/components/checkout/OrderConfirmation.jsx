import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { db } from '/src/firebase';
import { doc, getDoc } from 'firebase/firestore';

const OrderConfirmation = () => {
  const { state } = useLocation();
  const order = state?.order;
  const [orderItemsWithImages, setOrderItemsWithImages] = useState([]);

  useEffect(() => {
    if (!order) {
      toast.error('No order details found. Redirecting to homepage.', {
        position: 'top-right',
        autoClose: 3000,
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } else {
      const fetchItemImages = async () => {
        try {
          const itemsWithImages = await Promise.all(
            order.items.map(async (item) => {
              const productRef = doc(db, 'products', item.productId);
              const productSnap = await getDoc(productRef);
              let mainImage = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
              if (productSnap.exists()) {
                const productData = productSnap.data();
                console.log('Product data for', item.name, ':', productData);
                const imageUrls = Array.isArray(productData.imageUrls)
                  ? productData.imageUrls.filter(
                      (url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/')
                    )
                  : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://res.cloudinary.com/')
                  ? [productData.imageUrl]
                  : [];
                mainImage = imageUrls.length > 0 ? imageUrls[0] : mainImage;
                console.log('Selected main image for', item.name, ':', mainImage);
              } else {
                console.warn(`Product ${item.productId} not found for ${item.name}.`);
              }
              return {
                ...item,
                mainImage,
              };
            })
          );
          setOrderItemsWithImages(itemsWithImages);
        } catch (err) {
          console.error('Image fetch error:', err);
          toast.error('Failed to load item images.', { position: 'top-right', autoClose: 3000 });
          setOrderItemsWithImages(
            order.items.map((item) => ({
              ...item,
              mainImage: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
            }))
          );
        }
      };

      fetchItemImages();
    }
  }, [order]);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  const { total, date, shippingDetails, paymentGateway, paymentId } = order;

  const isStripe = paymentGateway === 'Stripe';
  const currency = isStripe ? 'USD' : 'NGN';
  const conversionRate = 0.0005;
  const displayTotal = isStripe ? total : total / conversionRate;

  console.log(currency)
  return (
    <div className="container mx-auto px-4 py-8 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Thank You!</h1>
      <p className="text-xl text-gray-600 mb-4">
        Your order #{paymentId} has been placed!
      </p>
      <p className="text-sm text-gray-600 mb-4">
        We sent an email to {shippingDetails.email} with your order confirmation and receipt. If the email hasn’t arrived within two minutes, please check your spam folder to see if the email was routed there.
      </p>
      <p className="text-sm text-gray-600 mb-4">Time Placed: {new Date(date).toLocaleString('en-US', { timeZone: 'America/New_York' })} EST</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Shipping</h3>
          <p className="text-sm">
            <strong>{shippingDetails.name}</strong>
          </p>
          <p className="text-sm">{shippingDetails.address}, {shippingDetails.city}, {shippingDetails.postalCode}</p>
          <p className="text-sm">US</p>
          <p className="text-sm">+1 {shippingDetails.phone}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Billing Details</h3>
          <p className="text-sm">
            <strong>{shippingDetails.name}</strong>
          </p>
          <p className="text-sm">{shippingDetails.address}, {shippingDetails.city}, {shippingDetails.postalCode}</p>
          <p className="text-sm">US</p>
          <p className="text-sm">+1 {shippingDetails.phone}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Shipping Method</h3>
          <p className="text-sm">Standard Method</p>
          <p className="text-sm">(normally 4-5 business days, unless otherwise noted)</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Order List</h3>
          {orderItemsWithImages.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm mb-2">
              <div className="flex items-center gap-3">
                <img
                  src={item.mainImage}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    console.error('Image failed to load, using default:', {
                      productId: item.productId,
                      failedUrl: e.target.src,
                      name: item.name,
                    });
                    e.target.src = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
                  }}
                  onLoad={() => {
                    console.log('Image loaded for', item.name, 'at URL:', item.mainImage);
                  }}
                />
                <span>{item.name} (x{item.quantity})</span>
              </div>
              <span>
                {isStripe
                  ? `$${item.price * item.quantity * conversionRate}`
                  : `$${item.price * item.quantity / conversionRate}`}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
          <p className="text-sm">Subtotal: ${displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm">Shipping & Handling: $0.95</p>
          <p className="text-sm">Est. Sales Tax: $0.95</p>
          <p className="text-sm font-bold">Total: ${(displayTotal + 0.95 + 0.95).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <Link
          to="/products"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          Continue Shopping
        </Link>
        <Link
          to="/"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition text-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmation;