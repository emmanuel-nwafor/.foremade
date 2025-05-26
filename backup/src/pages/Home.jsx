import BuyerBanner from '../components/home/BuyerBanner';
import Carousel from '../components/home/Carousel';
import Category from '../components/home/Category';
import SellerBanner from '../components/home/SellerBanner';
import RecommendedForYou from '../components/product/RecommendedForYou';
import TrendingFashion from '../components/product/TrendingFashion';
import TrendingGadgets from '../components/product/TrendingGadgets';
import TopStores from '../components/store/TopStore';

const Home = () => {
  return (
    <div>
      <Carousel />
      <TrendingGadgets  />
      <TrendingFashion /> 
      <Category />
      <RecommendedForYou />
      <SellerBanner />
      <BuyerBanner />
      <TopStores />
    </div>
  );
};

export default Home;