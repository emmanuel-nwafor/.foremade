import { Link } from 'react-router-dom';
import Help from '../common/Help';
import AddToCartButton from '/src/components/cart/AddToCartButton';

const ProductCard = ({ product }) => {
  if (!product || typeof product !== 'object') {
    console.error('Invalid product prop:', product);
    return null;
  }

  const truncateName = (name) => {
    if (!name) return '';
    return name.length > 17 ? name.slice(0, 14) + '...' : name;
  };

  const imageSrc =
    product.imageUrl &&
    typeof product.imageUrl === 'string' &&
    product.imageUrl.startsWith('https://') &&
    product.imageUrl.trim() !== ''
      ? product.imageUrl
      : '/images/placeholder.jpg';

  return (
    <div className="relative w-full max-w-[240px]">
      <Link to={`/product/${product.id}`} className="flex flex-col w-full">
        <div className="rounded-lg p-2 max-md:p-3 grid">
          <div className="relative">
            <img
              src={imageSrc}
              alt={product.name || 'Product'}
              className="h-[250px] w-[250px] border rounded-sm object-cover mb-1"
              onError={(e) => {
                if (e.target.src !== '/images/placeholder.jpg') {
                  console.warn('Image load error, falling back to placeholder:', {
                    productId: product.id,
                    imageUrl: product.imageUrl,
                    attemptedUrl: imageSrc,
                    name: product.name,
                  });
                  e.target.src = '/images/placeholder.jpg';
                }
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', {
                  productId: product.id,
                  imageUrl: imageSrc,
                  name: product.name,
                });
              }}
            />
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{truncateName(product.name)}</h3>
          <p className="text-gray-600">
            ₦{(product.price || 0).toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center mt-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`bx bxs-star text-sm sm:text-base md:text-lg ${
                    i < Math.floor(product.rating || 0) ? 'text-amber-400' : 'text-gray-400'
                  }`}
                ></i>
              ))}
            </div>
          </div>
          <span className="inline-block mt-2 text-[14px] bg-[url('https://i.pinimg.com/736x/73/d3/1f/73d31fc942fcca8178fb9c07a970dd61.jpg')] bg-cover bg-center text-white px-2 py-1 rounded">
            Brand Store
          </span>
        </div>
      </Link>
      <div className="absolute top-2 right-2 max-md:top-1 max-md:right-1">
        <AddToCartButton productId={product.id} />
      </div>
      <div className="absolute bottom-2 right-2 max-md:bottom-1 max-md:right-1">
        <Help />
      </div>
    </div>
  );
};

export default ProductCard;