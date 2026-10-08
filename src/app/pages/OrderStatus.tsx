import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Clock, 
  ShieldCheck, 
  Phone, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  HelpCircle,
  Navigation,
  KeyRound
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { format } from 'date-fns';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { toast } from 'sonner';
import { printInvoice } from '../lib/invoice';
import { OrderTimeline, ReturnSection } from '../components/OrderExtras';

export default function OrderStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getOrderById, loading: ordersLoading, refreshOrders } = useOrders();
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  React.useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const order = getOrderById(id || '');

  if (!order && ordersLoading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading your order...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#fafaf9] py-16 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-4">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Order not found</h1>
          <p className="text-sm text-gray-500 mb-6">
            We couldn't locate this order in your account. It may have expired or was placed under a different account.
          </p>
          <Button 
            className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl"
            onClick={() => navigate('/orders')}
          >
            Back to My Orders
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyTracking = () => {
    if (order.trackingNumber) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopiedTracking(true);
      toast.success('Tracking Number copied to clipboard');
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshOrders().then(() => {
      setIsRefreshing(false);
      toast.success('Order status refreshed');
    });
  };

  // Compute status step index
  // 0: Order Placed, 1: Processing/Packed, 2: Shipped, 3: Out for Delivery, 4: Delivered
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  const deliverySteps = [
    {
      title: 'Order Placed',
      description: 'Order confirmed & authorized',
      icon: CheckCircle2,
      time: order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : 'Completed',
    },
    {
      title: 'Packed & Inspected',
      description: 'Dispatched from Central Warehouse',
      icon: Package,
      time: currentStepIdx >= 1 ? 'Quality Check Passed' : 'Pending',
    },
    {
      title: 'In Transit with Courier',
      description: 'BlueDart Express Air Priority',
      icon: Truck,
      time: currentStepIdx >= 2 ? 'In transit via regional cargo' : 'Scheduled',
    },
    {
      title: 'Out for Delivery',
      description: 'Assigned to local delivery associate',
      icon: Navigation,
      time: currentStepIdx >= 3 ? 'Arriving today' : 'Pending dispatch',
    },
    {
      title: 'Delivered',
      description: 'Handed over at doorstep',
      icon: CheckCircle2,
      time: order.status === 'delivered' ? format(new Date(order.updatedAt), 'MMM d, h:mm a') : (order.estimatedDelivery ? `Est: ${format(new Date(order.estimatedDelivery), 'MMM d')}` : 'Upcoming'),
    },
  ];

  // Simulated transit logs
  const transitLogs = [
    {
      time: 'Today, 08:30 AM',
      location: `${order.shippingAddress.city} Central Delivery Hub`,
      message: currentStepIdx >= 3 
        ? 'Package out for delivery with executive Rajesh Kumar. Delivery OTP sent.'
        : currentStepIdx >= 2
        ? 'Package arrived at city sorting facility, awaiting final route dispatch.'
        : 'Order processed and ready for courier pickup.'
    },
    {
      time: 'Yesterday, 04:15 PM',
      location: 'National Air Cargo Gateway (BOM-02)',
      message: 'Air transit scan completed. Forwarded to destination regional sorting center.'
    },
    {
      time: order.createdAt ? format(new Date(order.createdAt), 'MMM d, h:mm a') : 'Recent',
      location: 'ShopHub Fulfillment Center 1',
      message: 'Package verified, packed in tamper-proof eco-box, and barcoded.'
    }
  ];

  // OTP for delivery security
  const deliveryOtp = (parseInt(order.orderNumber.slice(-4)) || 4892).toString().padStart(4, '7');

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        
        {/* Navigation & Actions */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button
            variant="ghost"
            className="gap-2 text-gray-700 hover:text-gray-900 rounded-full px-4"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-gray-200 text-xs font-semibold"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-gray-200 text-xs font-semibold flex"
              onClick={() => { if (!printInvoice(order)) toast.error('Allow pop-ups to print the invoice'); }}
            >
              <FileText className="h-3.5 w-3.5" />
              Invoice
            </Button>
          </div>
        </div>

        {/* Live Delivery Hero Banner */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Live Delivery Process
                </span>
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-bold gap-1.5 py-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Tracking
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy h:mm a')}
              </p>
            </div>

            {/* Estimated Delivery Highlight */}
            <div className="bg-[#1b5d4e]/10 border border-[#1b5d4e]/20 p-4 rounded-2xl text-left md:text-right w-full md:w-auto">
              <span className="text-[11px] font-bold text-[#1b5d4e] uppercase tracking-wider block">
                Estimated Delivery
              </span>
              <p className="text-lg md:text-xl font-extrabold text-gray-900 mt-0.5">
                {order.status === 'delivered' ? (
                  <span className="text-emerald-700 flex items-center md:justify-end gap-1">
                    <CheckCircle2 className="h-5 w-5" /> Successfully Delivered
                  </span>
                ) : order.estimatedDelivery ? (
                  format(new Date(order.estimatedDelivery), 'EEEE, MMMM d')
                ) : (
                  'Within 3-5 Business Days'
                )}
              </p>
              {order.status !== 'delivered' && (
                <p className="text-xs text-gray-600 mt-0.5">By 6:00 PM (Standard Hours)</p>
              )}
            </div>
          </div>

          {/* VISUAL 5-STEP DELIVERY PROGRESS BAR */}
          <div className="py-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">
              Delivery Milestones
            </h3>

            {/* Desktop Horizontal Stepper */}
            <div className="hidden md:grid grid-cols-5 gap-2 relative">
              {/* Connecting background bar */}
              <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-0">
                <div 
                  className="h-full bg-[#1b5d4e] transition-all duration-700"
                  style={{
                    width: order.status === 'cancelled'
                      ? '0%'
                      : `${Math.min(100, Math.max(0, (currentStepIdx / 4) * 100))}%`
                  }}
                />
              </div>

              {deliverySteps.map((step, idx) => {
                const isCompleted = currentStepIdx >= idx && order.status !== 'cancelled';
                const isCurrent = currentStepIdx === idx && order.status !== 'cancelled';
                const Icon = step.icon;

                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center text-center px-1">
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? 'bg-[#1b5d4e] text-white shadow-lg ring-4 ring-[#1b5d4e]/20 scale-110'
                          : isCompleted
                          ? 'bg-[#1b5d4e] text-white shadow-xs'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className={`text-xs font-bold mt-3 ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono mt-1">
                      {step.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical Stepper */}
            <div className="md:hidden space-y-6">
              {deliverySteps.map((step, idx) => {
                const isCompleted = currentStepIdx >= idx && order.status !== 'cancelled';
                const isCurrent = currentStepIdx === idx && order.status !== 'cancelled';
                const Icon = step.icon;

                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="relative flex flex-col items-center">
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          isCurrent
                            ? 'bg-[#1b5d4e] text-white shadow-md ring-4 ring-[#1b5d4e]/20'
                            : isCompleted
                            ? 'bg-[#1b5d4e] text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {idx < deliverySteps.length - 1 && (
                        <div 
                          className={`w-0.5 h-12 my-1 ${
                            currentStepIdx > idx ? 'bg-[#1b5d4e]' : 'bg-gray-200'
                          }`} 
                        />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className={`text-sm font-bold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">{step.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Delivery Info: Courier & Live Timeline Logs */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Courier & Executive Card */}
            <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#1b5d4e]" />
                  Courier Partner & Delivery Associate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50/70 rounded-2xl border border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold uppercase">Assigned Carrier</span>
                    <p className="font-bold text-gray-900 text-base">BlueDart Express (Air Priority)</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 font-mono">
                        AWB: {order.trackingNumber || 'TRK-9824021948'}
                      </span>
                      <button 
                        onClick={handleCopyTracking}
                        className="text-[#1b5d4e] hover:text-[#14473b] p-1 cursor-pointer"
                        title="Copy Tracking ID"
                      >
                        {copiedTracking ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Delivery OTP Badge */}
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center justify-center gap-1">
                      <KeyRound className="h-3 w-3" /> Delivery OTP
                    </span>
                    <span className="font-mono text-xl font-extrabold text-amber-900 tracking-widest">
                      {deliveryOtp}
                    </span>
                    <p className="text-[10px] text-amber-700 mt-0.5">Share with driver upon arrival</p>
                  </div>
                </div>

                {/* Driver Info */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1b5d4e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      RK
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Rajesh Kumar</p>
                      <p className="text-xs text-gray-500">Verified Delivery Associate &bull; 4.9 ★</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-xl border-gray-200 text-xs text-gray-700 hover:text-gray-900"
                    onClick={() => toast.info('Connecting to delivery partner helpline...')}
                  >
                    <Phone className="h-3.5 w-3.5 text-emerald-600" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Real order history + returns */}
            <OrderTimeline order={order} />
            <ReturnSection order={order} isOwner={order.userId === user.id} />

            {/* Ordered Items List */}
            <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#1b5d4e]" />
                  Items in this Package ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {order.items.map((item, index) => (
                    <div key={index} className="py-3 flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.category} &bull; Qty: {item.quantity}</p>
                      </div>
                      <span className="font-extrabold text-sm text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Address, Payment & Support */}
          <div className="space-y-6">
            
            {/* Delivery Address Card */}
            <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#1b5d4e]" />
                  Shipping Destination
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-900 text-sm">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p className="leading-relaxed">{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                <p className="font-medium text-gray-900">{order.shippingAddress.country}</p>
                <div className="pt-2 text-[11px] text-gray-400">
                  Delivery instructions: <span className="text-gray-700">Call before arrival, leave with security if unavailable.</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card className="rounded-2xl border border-gray-100 shadow-xs bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[#1b5d4e]" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{order.subtotal.toFixed(2)}</span>
                </div>
                {!!order.discount && order.discount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span className="font-medium text-emerald-600">-₹{order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">
                    {order.shipping === 0 ? <span className="text-emerald-600 font-bold">Free</span> : `₹${order.shipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span className="font-medium text-gray-900">₹{order.tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-gray-900 text-sm">
                    {order.paymentMethod === 'cod' ? 'Total to Pay' : 'Total Paid'}
                  </span>
                  <span className="font-extrabold text-base text-[#1b5d4e]">
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Helpline Card */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <HelpCircle className="h-4 w-4 text-emerald-700" />
                Need Help with this Delivery?
              </div>
              <p className="text-emerald-800 leading-relaxed text-[11px]">
                Our 24/7 logistics support team is ready to assist with rescheduling or address corrections.
              </p>
              <Button
                variant="outline"
                className="w-full bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50 rounded-xl text-xs font-semibold py-4"
                onClick={() => toast.info('Logistics support agent will contact you shortly.')}
              >
                Call Support: 1800-SHOP-HUB
              </Button>
            </div>

            <Button
              className="w-full bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-semibold shadow-xs"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
