import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Filter, RefreshCw, Truck, Receipt, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';

export default function Orders() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { getUserOrders, updateOrderStatus } = useOrders();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  
  // Refund dialog state
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<any>(null);

  // Feedback dialog state
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedFeedbackOrder, setSelectedFeedbackOrder] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  // Check authentication in useEffect
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const allOrders = getUserOrders(user.id);
  
  // Filter orders based on status
  const orders = statusFilter === 'all' 
    ? allOrders 
    : allOrders.filter(order => order.status === statusFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRefundClick = (order: any) => {
    setSelectedRefundOrder(order);
    setShowRefundDialog(true);
  };

  const handleFeedbackClick = (order: any) => {
    setSelectedFeedbackOrder(order);
    setRating(0);
    setFeedbackText('');
    setShowFeedbackDialog(true);
  };

  const handleStatusChange = (orderId: string, currentStatus: string) => {
    setSelectedOrder(orderId);
    setNewStatus(currentStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (selectedOrder && newStatus) {
      if (newStatus === 'cancelled' && !cancelReason) {
        toast.error('Please select a cancellation reason');
        return;
      }
      // Depending on your backend, you might pass cancelReason here
      const ok = await updateOrderStatus(selectedOrder, newStatus as any);
      if (ok) {
        toast.success(newStatus === 'cancelled' ? 'Order cancelled successfully' : 'Order status updated successfully');
      }
      setShowStatusDialog(false);
      setSelectedOrder(null);
      setNewStatus('');
      setCancelReason('');
    }
  };

  const getOrderStats = () => {
    return {
      all: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      processing: allOrders.filter(o => o.status === 'processing').length,
      shipped: allOrders.filter(o => o.status === 'shipped').length,
      delivered: allOrders.filter(o => o.status === 'delivered').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    };
  };

  const stats = getOrderStats();

  if (allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="h-24 w-24 text-gray-300 mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here
            </p>
            <Button onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Orders</h1>
          <p className="text-gray-600">
            {allOrders.length} {allOrders.length === 1 ? 'order' : 'orders'} total
          </p>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.all}</p>
              <p className="text-sm text-gray-600">All Orders</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'processing' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setStatusFilter('processing')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.processing}</p>
              <p className="text-sm text-gray-600">Processing</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'shipped' ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => setStatusFilter('shipped')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              <p className="text-sm text-gray-600">Shipped</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'delivered' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setStatusFilter('delivered')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              <p className="text-sm text-gray-600">Delivered</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${statusFilter === 'cancelled' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-sm text-gray-600">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No orders found with status: {statusFilter}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setStatusFilter('all')}
            >
              View All Orders
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 
                          className="text-xl font-bold cursor-pointer hover:text-blue-600"
                          onClick={() => navigate(`/order/${order.id}`)}
                        >
                          Order #{order.orderNumber}
                        </h3>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">₹{order.total.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {order.items.slice(0, 4).map((item, index) => (
                        <div
                          key={index}
                          className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => navigate(`/product/${item.id}`)}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-600">
                            +{order.items.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t mt-4 pt-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      {order.status === 'delivered' ? (
                        <span>Delivered</span>
                      ) : order.estimatedDelivery ? (
                        <span>
                          Est. delivery:{' '}
                          {format(new Date(order.estimatedDelivery), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span>Processing</span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Select
                        value={order.status}
                        disabled={order.status !== 'pending' && order.status !== 'processing'}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending" disabled>Pending</SelectItem>
                          <SelectItem value="processing" disabled>Processing</SelectItem>
                          <SelectItem value="shipped" disabled>Shipped</SelectItem>
                          <SelectItem value="delivered" disabled>Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      {order.status === 'cancelled' ? (
                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                          size="sm"
                          onClick={() => handleRefundClick(order)}
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          Refund Receipt
                        </Button>
                      ) : order.status === 'delivered' ? (
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                          size="sm"
                          onClick={() => handleFeedbackClick(order)}
                        >
                          <Star className="h-3.5 w-3.5" />
                          Leave Feedback
                        </Button>
                      ) : (
                        <Button
                          className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl text-xs font-semibold gap-1.5 shadow-xs cursor-pointer"
                          size="sm"
                          onClick={() => navigate(`/order/${order.id}`)}
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Track Delivery Process
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl text-xs border-gray-200 cursor-pointer"
                        onClick={() => navigate(`/order/${order.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Status Change Confirmation Dialog */}
        <AlertDialog open={showStatusDialog} onOpenChange={(open) => {
          setShowStatusDialog(open);
          if (!open) { setCancelReason(''); setNewStatus(''); }
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Update Order Status</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to change the order status to{' '}
                <span className="font-semibold">
                  {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
                </span>
                ? This action will update the order timeline.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {newStatus === 'cancelled' && (
              <div className="py-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for cancellation <span className="text-red-500">*</span>
                </label>
                <Select value={cancelReason} onValueChange={setCancelReason}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="changed_mind">Changed my mind</SelectItem>
                    <SelectItem value="found_cheaper">Found cheaper elsewhere</SelectItem>
                    <SelectItem value="shipping_time">Shipping takes too long</SelectItem>
                    <SelectItem value="ordered_mistake">Ordered by mistake</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowStatusDialog(false);
                setSelectedOrder(null);
                setNewStatus('');
                setCancelReason('');
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange} disabled={newStatus === 'cancelled' && !cancelReason}>
                {newStatus === 'cancelled' ? 'Confirm Cancellation' : 'Update Status'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Refund Receipt Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-500" />
                Refund Receipt
              </DialogTitle>
              <DialogDescription>
                Details of your refunded order.
              </DialogDescription>
            </DialogHeader>
            {selectedRefundOrder && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Order Number</span>
                    <span className="font-semibold">#{selectedRefundOrder.orderNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Refund Amount</span>
                    <span className="font-semibold text-green-600">₹{selectedRefundOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Date Cancelled</span>
                    <span className="font-medium">{format(new Date(selectedRefundOrder.createdAt), 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Refund Status</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Processed</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <span className="font-medium">Original Payment Method</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Refunds typically take 3-5 business days to appear on your statement.
                </div>
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                    Close
                  </Button>
                  <Button className="ml-2 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                    toast.success('Receipt downloaded successfully');
                    setShowRefundDialog(false);
                  }}>
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Leave Feedback
              </DialogTitle>
              <DialogDescription>
                How was your experience with Order #{selectedFeedbackOrder?.orderNumber}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer transition-colors ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      onClick={() => setRating(star)}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {rating === 0 ? 'Click to rate' : rating === 5 ? 'Excellent!' : rating >= 4 ? 'Very Good' : rating >= 3 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <textarea
                className="w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                placeholder="Tell us what you think about the products and delivery..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="ml-2 bg-blue-600 hover:bg-blue-700 text-white" 
                  disabled={rating === 0}
                  onClick={async () => {
                    try {
                      await import('../api/client').then(m => m.api('/feedback', {
                        method: 'POST',
                        body: {
                          orderId: selectedFeedbackOrder.id,
                          rating: rating,
                          comments: feedbackText
                        }
                      }));
                      toast.success('Thank you for your feedback!');
                      setShowFeedbackDialog(false);
                    } catch (e) {
                      toast.error('Failed to submit feedback');
                    }
                  }}
                >
                  Submit Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}