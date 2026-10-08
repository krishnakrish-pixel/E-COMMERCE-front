import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Truck, CheckCircle2, Banknote, QrCode, Tag, X, Building } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { toast } from 'sonner';
import { api } from '../api/client';
import { useAddresses } from '../lib/useAddresses';
import type { Product } from '../context/CartContext';
import {
  formatCardNumber, cleanCardName, cleanPersonName, cleanCvv, formatExpiry, cleanZip,
  validateCardNumber, validateCardName, validateCvv, validateExpiry, validateUpi,
  validateEmail, validateRequired, validateZip,
} from '../lib/validation';

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs text-red-600 mt-1" role="alert">{message}</p> : null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart } = useCart();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { createOrder } = useOrders();

  // "Buy Now" sends just that one product here; otherwise we check out the whole cart
  const buyNow = (location.state as { buyNow?: { product: Product; quantity: number } } | null)?.buyNow;
  const items = buyNow ? [{ ...buyNow.product, quantity: buyNow.quantity }] : cart;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'upi' | 'netbanking'>('card');
  const [upiMethod, setUpiMethod] = useState<'id' | 'qr'>('id');

  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'India',
    cardNumber: '',
    cardName: cleanCardName(user?.firstName ? `${user.firstName} ${user.lastName}` : ''),
    expiryDate: '',
    cvv: '',
    upiId: '',
    bankName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // saved addresses: pick one to fill the form, or save the one typed in
  const { addresses, create: saveAddress } = useAddresses();
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [pickedAddressId, setPickedAddressId] = useState('');
  const usedDefault = React.useRef(false);

  const applySavedAddress = (id: string) => {
    setPickedAddressId(id);
    const a = addresses.find((x) => x.id === id);
    if (!a) return;
    setFormData((prev) => ({
      ...prev,
      firstName: a.firstName,
      lastName: a.lastName || '',
      address: a.address,
      city: a.city,
      zipCode: a.zipCode,
      country: a.country,
    }));
    setErrors({});
  };

  // pre-fill with the default address once, as soon as the list has loaded
  useEffect(() => {
    if (usedDefault.current || addresses.length === 0) return;
    usedDefault.current = true;
    const d = addresses.find((a) => a.defaultAddress) || addresses[0];
    applySavedAddress(d.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please sign in to checkout');
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Sync user info if loaded
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        address: user.address || prev.address,
        city: user.city || prev.city,
        zipCode: user.zipCode || prev.zipCode,
        country: user.country || prev.country,
        cardName: prev.cardName || cleanCardName(`${user.firstName} ${user.lastName}`),
      }));
    }
  }, [user]);

  // Each field only accepts what it should: card number = digits, card name = letters, CVV = 3 digits ...
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let next = value;
    switch (name) {
      case 'cardNumber': next = formatCardNumber(value); break;
      case 'cardName': next = cleanCardName(value); break;
      case 'expiryDate': next = formatExpiry(value); break;
      case 'cvv': next = cleanCvv(value); break;
      case 'firstName':
      case 'lastName': next = cleanPersonName(value); break;
      case 'zipCode': next = cleanZip(value, formData.country); break;
      default: break;
    }
    setFormData((prev) => ({ ...prev, [name]: next }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const shippingErrors = () => {
    const e: Record<string, string> = {
      email: validateEmail(formData.email),
      firstName: validateRequired(formData.firstName, 'First name'),
      lastName: validateRequired(formData.lastName, 'Last name'),
      address: validateRequired(formData.address, 'Address'),
      city: validateRequired(formData.city, 'City'),
      zipCode: validateZip(formData.zipCode, formData.country),
      country: validateRequired(formData.country, 'Country'),
    };
    return Object.fromEntries(Object.entries(e).filter(([, m]) => m));
  };

  const paymentErrors = () => {
    let e: Record<string, string> = {};
    if (paymentMethod === 'card') {
      e = {
        cardNumber: validateCardNumber(formData.cardNumber),
        cardName: validateCardName(formData.cardName),
        expiryDate: validateExpiry(formData.expiryDate),
        cvv: validateCvv(formData.cvv),
      };
    } else if (paymentMethod === 'upi') {
      if (upiMethod === 'id') {
        e = { upiId: validateUpi(formData.upiId) };
      }
    } else if (paymentMethod === 'netbanking') {
      e = { bankName: validateRequired(formData.bankName, 'Bank Name') };
    }
    return Object.fromEntries(Object.entries(e).filter(([, m]) => m));
  };

  const goToPayment = () => {
    const found = shippingErrors();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted shipping details');
      return;
    }
    setStep(2);
  };

  const goToReview = () => {
    const found = paymentErrors();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error('Please fix the highlighted payment details');
      return;
    }
    setStep(3);
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // ---- coupon (the server re-checks it when the order is placed) ----
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number; description?: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const res = await api<{ code: string; discount: number; description?: string }>('/coupons/validate', {
        method: 'POST',
        body: { code: couponInput.trim(), subtotal },
      });
      setCoupon({ code: res.code, discount: Number(res.discount), description: res.description });
      toast.success(`Coupon ${res.code} applied`);
    } catch (e: any) {
      setCoupon(null);
      toast.error(e.message || 'Could not apply this coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // if the cart changes, the saved discount could be wrong, so ask the server again
  useEffect(() => {
    if (!coupon) return;
    api<{ code: string; discount: number }>('/coupons/validate', {
      method: 'POST',
      body: { code: coupon.code, subtotal },
    })
      .then((res) => setCoupon((c) => (c ? { ...c, discount: Number(res.discount) } : c)))
      .catch((e: any) => {
        setCoupon(null);
        toast.error(e.message || 'Your coupon no longer applies');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const discount = coupon?.discount ?? 0;
  const taxable = Math.max(0, subtotal - discount);
  const shipping = taxable >= 999 ? 0 : 99;
  const tax = taxable * 0.1;
  const total = taxable + shipping + tax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // never trust the earlier steps: check everything again before the order is sent
    const shipErr = shippingErrors();
    const found = { ...shipErr, ...paymentErrors() };
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setStep(Object.keys(shipErr).length > 0 ? 1 : 2);
      toast.error('Please fix the highlighted details before placing your order');
      return;
    }
    setIsSubmitting(true);

    try {
    // Create the order in the backend (prices / totals are re-calculated on the server)
    const order = await createOrder({
      items,
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country || 'India',
      },
      paymentMethod,
      couponCode: coupon?.code,
    });

    toast.success('Order placed successfully!', {
      description: `Order #${order.orderNumber} has been confirmed.`,
    });
    if (saveThisAddress && !pickedAddressId) {
      // best effort: the order is already placed, so a failure here must not matter
      saveAddress({
        label: 'Home',
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: '',
        address: formData.address,
        city: formData.city,
        zipCode: formData.zipCode,
        country: formData.country || 'India',
      }).catch(() => {});
    }
    if (buyNow) removeFromCart(buyNow.product.id);   // only the bought item leaves the cart
    else clearCart();
    navigate(`/order/${order.id}`, { replace: true });
    } catch (error) {
      toast.error('Could not place your order', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-4">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Your cart is empty</h2>
          <p className="text-gray-600 mb-6 text-sm">
            Add some products before checking out!
          </p>
          <Button 
            className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl px-6"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] py-8">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1c2c34] mb-4">
            Checkout
          </h1>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 max-w-md">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 1
                    ? 'bg-[#1b5d4e] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > 1 ? <CheckCircle2 className="h-4 w-4" /> : '1'}
              </div>
              <span className="text-sm font-semibold text-gray-900">Shipping</span>
            </div>
            <div className="h-0.5 bg-gray-200 flex-1" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 2
                    ? 'bg-[#1b5d4e] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > 2 ? <CheckCircle2 className="h-4 w-4" /> : '2'}
              </div>
              <span className="text-sm font-semibold text-gray-900">Payment</span>
            </div>
            <div className="h-0.5 bg-gray-200 flex-1" />
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  step >= 3
                    ? 'bg-[#1b5d4e] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                3
              </div>
              <span className="text-sm font-semibold text-gray-900">Review</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                      <Truck className="h-5 w-5 text-[#1b5d4e]" />
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses.length > 0 && (
                      <div>
                        <Label htmlFor="savedAddress" className="text-xs font-semibold text-gray-700">Deliver to a saved address</Label>
                        <select
                          id="savedAddress"
                          value={pickedAddressId}
                          onChange={(e) => (e.target.value ? applySavedAddress(e.target.value) : setPickedAddressId(''))}
                          className="mt-1 w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                        >
                          <option value="">Enter a new address</option>
                          {addresses.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.label}: {a.firstName} {a.lastName}, {a.address}, {a.city} {a.zipCode}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your@email.com"
                        className="mt-1 rounded-xl border-gray-200"
                        autoComplete="email"
/>
                        <FieldError message={errors.email} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-xs font-semibold text-gray-700">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="mt-1 rounded-xl border-gray-200"
                          autoComplete="given-name"
/>
                        <FieldError message={errors.firstName} />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs font-semibold text-gray-700">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="mt-1 rounded-xl border-gray-200"
                          autoComplete="family-name"
/>
                        <FieldError message={errors.lastName} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-xs font-semibold text-gray-700">Delivery Address</Label>
                      <Input
                        id="address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-1 rounded-xl border-gray-200"
                        autoComplete="street-address"
/>
                        <FieldError message={errors.address} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-xs font-semibold text-gray-700">City</Label>
                        <Input
                          id="city"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleInputChange}
                          className="mt-1 rounded-xl border-gray-200"
                          autoComplete="address-level2"
/>
                        <FieldError message={errors.city} />
                      </div>
                      <div>
                        <Label htmlFor="zipCode" className="text-xs font-semibold text-gray-700">Postal / ZIP Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          required
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="mt-1 rounded-xl border-gray-200"
                          inputMode={formData.country.trim().toLowerCase() === "india" ? "numeric" : "text"}
                          autoComplete="postal-code"
/>
                        <FieldError message={errors.zipCode} />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="country" className="text-xs font-semibold text-gray-700">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        required
                        value={formData.country}
                        onChange={handleInputChange}
                        className="mt-1 rounded-xl border-gray-200"
                        autoComplete="country-name"
/>
                        <FieldError message={errors.country} />
                    </div>

                    {!pickedAddressId && (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={saveThisAddress} onChange={(e) => setSaveThisAddress(e.target.checked)} />
                        Save this address for next time
                      </label>
                    )}

                    <Button
                      type="button"
                      className="w-full bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-semibold mt-4 shadow-sm"
                      onClick={goToPayment}
                    >
                      Continue to Payment
                    </Button>
                  </CardContent>
                </Card>
              )}

              {step === 2 && (
                <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                      <CreditCard className="h-5 w-5 text-[#1b5d4e]" />
                      Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Method Selector */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3.5 rounded-xl border text-center font-medium text-xs flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'border-[#1b5d4e] bg-[#1b5d4e]/5 text-[#1b5d4e] font-bold shadow-xs'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <CreditCard className="h-5 w-5" />
                        Card
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`p-3.5 rounded-xl border text-center font-medium text-xs flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'upi'
                            ? 'border-[#1b5d4e] bg-[#1b5d4e]/5 text-[#1b5d4e] font-bold shadow-xs'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <QrCode className="h-5 w-5" />
                        UPI
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('netbanking')}
                        className={`p-3.5 rounded-xl border text-center font-medium text-xs flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'netbanking'
                            ? 'border-[#1b5d4e] bg-[#1b5d4e]/5 text-[#1b5d4e] font-bold shadow-xs'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Building className="h-5 w-5" />
                        Net Banking
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-3.5 rounded-xl border text-center font-medium text-xs flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          paymentMethod === 'cod'
                            ? 'border-[#1b5d4e] bg-[#1b5d4e]/5 text-[#1b5d4e] font-bold shadow-xs'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Banknote className="h-5 w-5" />
                        COD
                      </button>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="space-y-4 p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div>
                          <Label htmlFor="cardNumber" className="text-xs font-semibold text-gray-700">Card Number</Label>
                          <Input
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            placeholder="1234 5678 9012 3456"
                            className="mt-1 rounded-xl border-gray-200 bg-white"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength={19}
/>
                        <FieldError message={errors.cardNumber} />
                        </div>

                        <div>
                          <Label htmlFor="cardName" className="text-xs font-semibold text-gray-700">Name on Card</Label>
                          <Input
                            id="cardName"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            className="mt-1 rounded-xl border-gray-200 bg-white"
                            autoComplete="cc-name"
/>
                        <FieldError message={errors.cardName} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiryDate" className="text-xs font-semibold text-gray-700">Expiry Date</Label>
                            <Input
                              id="expiryDate"
                              name="expiryDate"
                              value={formData.expiryDate}
                              onChange={handleInputChange}
                              placeholder="MM/YY"
                              className="mt-1 rounded-xl border-gray-200 bg-white"
                              inputMode="numeric"
                              autoComplete="cc-exp"
                              maxLength={5}
/>
                        <FieldError message={errors.expiryDate} />
                          </div>
                          <div>
                            <Label htmlFor="cvv" className="text-xs font-semibold text-gray-700">CVV</Label>
                            <Input
                              id="cvv"
                              name="cvv"
                              type="password"
                              maxLength={3}
                              inputMode="numeric"
                              autoComplete="cc-csc"
                              value={formData.cvv}
                              onChange={handleInputChange}
                              placeholder="123"
                              className="mt-1 rounded-xl border-gray-200 bg-white"
                            />
                            <FieldError message={errors.cvv} />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'upi' && (
                      <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 text-sm text-emerald-900">
                        <div className="flex gap-2 mb-4 p-1 bg-emerald-100/50 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setUpiMethod('id')}
                            className={`flex-1 py-2 px-3 text-xs font-bold rounded-md transition-colors ${upiMethod === 'id' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600 hover:text-emerald-800'}`}
                          >
                            Enter UPI ID
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpiMethod('qr')}
                            className={`flex-1 py-2 px-3 text-xs font-bold rounded-md transition-colors ${upiMethod === 'qr' ? 'bg-white text-emerald-700 shadow-sm' : 'text-emerald-600 hover:text-emerald-800'}`}
                          >
                            Scan QR Code
                          </button>
                        </div>

                        {upiMethod === 'id' ? (
                          <div className="flex items-start gap-3">
                            <QrCode className="h-8 w-8 text-emerald-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <p className="font-bold">Instant UPI Payment</p>
                              <p className="text-xs text-emerald-700 mb-3">Enter your UPI ID, then approve the request on your UPI app.</p>
                              <Input
                                id="upiId"
                                name="upiId"
                                value={formData.upiId}
                                onChange={handleInputChange}
                                placeholder="yourname@okbank"
                                autoComplete="off"
                                className="rounded-xl border-emerald-200 bg-white"
                              />
                              <FieldError message={errors.upiId} />
                              
                              <div className="flex flex-wrap gap-2 mt-3">
                                <span className="text-[10px] font-bold text-emerald-600 w-full uppercase tracking-wider">Quick Extensions</span>
                                {['@okaxis', '@okhdfcbank', '@okicici', '@oksbi', '@paytm', '@ybl', '@apl'].map((ext) => (
                                  <button
                                    key={ext}
                                    type="button"
                                    onClick={() => {
                                      const base = formData.upiId.split('@')[0];
                                      setFormData(prev => ({ ...prev, upiId: `${base}${ext}` }));
                                    }}
                                    className="px-2 py-1 bg-white border border-emerald-200 rounded-md text-xs text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer"
                                  >
                                    {ext}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-4">
                            <div className="bg-white p-3 rounded-xl border-2 border-emerald-200 shadow-sm mb-3">
                              <QrCode className="h-32 w-32 text-emerald-800" strokeWidth={1} />
                            </div>
                            <p className="font-bold text-emerald-800">Scan to Pay</p>
                            <p className="text-xs text-emerald-600 text-center max-w-[200px] mt-1">Open GPay, PhonePe, or Paytm and scan this code</p>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'netbanking' && (
                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900 flex items-center gap-3">
                        <Building className="h-8 w-8 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-bold">Select Your Bank</p>
                          <p className="text-xs text-blue-700">You will be redirected to your bank's secure portal to complete the payment.</p>
                          <select
                            id="bankName"
                            name="bankName"
                            value={formData.bankName}
                            onChange={(e) => {
                               setFormData((prev) => ({ ...prev, bankName: e.target.value }));
                               if (errors.bankName) setErrors((prev) => ({ ...prev, bankName: '' }));
                            }}
                            className="mt-2 w-full rounded-xl border border-blue-200 bg-white h-10 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Choose a bank...</option>
                            <option value="HDFC Bank">HDFC Bank</option>
                            <option value="State Bank of India (SBI)">State Bank of India (SBI)</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                            <option value="Punjab National Bank">Punjab National Bank</option>
                            <option value="Bank of Baroda">Bank of Baroda</option>
                          </select>
                          <FieldError message={errors.bankName} />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cod' && (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-900 flex items-center gap-3">
                        <Banknote className="h-8 w-8 text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="font-bold">Cash on Delivery Available</p>
                          <p className="text-xs text-amber-700">Pay conveniently with cash or card upon package delivery at your doorstep.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-xl py-6"
                        onClick={() => setStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-semibold"
                        onClick={goToReview}
                      >
                        Review Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {step === 3 && (
                <Card className="rounded-2xl border border-gray-100 shadow-sm bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold mb-2 text-sm text-gray-900">Shipping Details</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {formData.firstName} {formData.lastName}
                        <br />
                        {formData.address}
                        <br />
                        {formData.city}, {formData.zipCode}
                        <br />
                        {formData.country}
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold mb-2 text-sm text-gray-900">Payment Option</h3>
                      <p className="text-gray-600 text-sm capitalize">
                        {paymentMethod === 'card' && `Credit / Debit Card (Ending in •••• ${formData.cardNumber.replace(/\D/g, '').slice(-4) || '----'})`}
                        {paymentMethod === 'upi' && 'UPI / Instant QR'}
                        {paymentMethod === 'netbanking' && `Net Banking (${formData.bankName})`}
                        {paymentMethod === 'cod' && 'Cash on Delivery (Pay at doorstep)'}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 text-sm text-gray-900">Items ({items.length})</h3>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-sm py-2 border-b border-gray-100"
                          >
                            <span className="text-gray-700">
                              {item.name} <span className="text-gray-400 font-medium">× {item.quantity}</span>
                            </span>
                            <span className="font-bold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 rounded-xl py-6"
                        onClick={() => setStep(2)}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="flex-1 bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-bold shadow-md"
                      >
                        Confirm & Place Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 rounded-2xl border border-gray-100 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-gray-600 truncate max-w-[180px]">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Coupon */}
                {coupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                      <Tag className="h-3.5 w-3.5" /> {coupon.code} applied
                    </span>
                    <button
                      type="button"
                      onClick={() => { setCoupon(null); setCouponInput(''); }}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      aria-label="Remove coupon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                      placeholder="Coupon code"
                      className="h-9 text-xs rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl text-xs font-semibold"
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponInput.trim()}
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </Button>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount ({coupon?.code})</span>
                      <span className="font-semibold text-emerald-600">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {shipping === 0 ? (
                        <span className="text-emerald-600 font-bold">Free</span>
                      ) : (
                        `₹${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span className="font-semibold text-gray-900">₹{tax.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="text-2xl font-extrabold text-[#1b5d4e]">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}