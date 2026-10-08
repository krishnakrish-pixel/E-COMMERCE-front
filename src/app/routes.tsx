import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import OrderStatus from './pages/OrderStatus';
import TrackOrder from './pages/TrackOrder';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'products', Component: Products },
      { path: 'product/:id', Component: ProductDetail },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'login', Component: Login },
      { path: 'signup', Component: Signup },
      { path: 'profile', Component: Profile },
      { path: 'orders', Component: Orders },
      { path: 'wishlist', Component: Wishlist },
      { path: 'order/:id', Component: OrderStatus },
      { path: 'track', Component: TrackOrder },
      { path: 'admin', Component: Admin },
      { path: '*', Component: NotFound },
    ],
  },
]);