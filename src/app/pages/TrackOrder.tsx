import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Search, 
  Package, 
  CheckCircle2, 
  MapPin, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function TrackOrder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useOrders();
  const [searchInput, setSearchInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const userOrders = user ? orders.filter((o) => o.userId === user.id) : orders;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim().replace('#', '').toLowerCase();

    if (!query) {
      toast.error('Please enter an Order ID or Tracking Number');
      return;
    }

    setHasSearched(true);
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === query ||
        o.id.toLowerCase() === query ||
        o.trackingNumber?.toLowerCase() === query
    );

    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchedOrder(null);
    }
  };

  const selectOrder = (order: any) => {
    navigate(`/order/${order.id}`);
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] py-12">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        
        {/* Header Banner */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="w-14 h-14 bg-[#1b5d4e]/10 text-[#1b5d4e] rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Truck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1c2c34] mb-2">
            Track Your Delivery
          </h1>
          <p className="text-sm text-gray-500">
            Real-time delivery progress, courier milestones, and live driver updates
          </p>
        </div>

        {/* Search Input Box */}
        <Card className="rounded-2xl border-gray-100 shadow-sm bg-white p-2 md:p-4 mb-8">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter Order # (e.g. 102938) or Tracking ID (e.g. TRK...)"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-10 h-12 rounded-xl text-sm border-gray-200"
                />
              </div>
              <Button
                type="submit"
                className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl h-12 px-6 font-semibold shadow-xs gap-2 cursor-pointer"
              >
                <Truck className="h-4 w-4" />
                Track Process
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search Result Box */}
        {hasSearched && (
          <div className="mb-10">
            {searchedOrder ? (
              <Card className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold mb-2">
                      Order Found
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900">
                      Order #{searchedOrder.orderNumber}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Tracking ID: <span className="font-mono font-bold text-gray-700">{searchedOrder.trackingNumber}</span> &bull; Status: <span className="capitalize font-bold text-[#1b5d4e]">{searchedOrder.status}</span>
                    </p>
                  </div>
                  <Button
                    className="bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl gap-2 font-semibold shadow-xs"
                    onClick={() => selectOrder(searchedOrder)}
                  >
                    View Live Delivery Process
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-red-900">No order found matching "{searchInput}"</p>
                <p className="text-xs text-red-700 mt-1">Please double-check your order number or tracking code.</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Orders for Signed-in User */}
        {userOrders.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Your Active Orders ({userOrders.length})
            </h2>
            <div className="space-y-3">
              {userOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => selectOrder(order)}
                  className="p-5 bg-white rounded-2xl border border-gray-100 hover:border-[#1b5d4e]/40 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-[#1b5d4e] flex-shrink-0">
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">Order #{order.orderNumber}</span>
                        <Badge className="bg-emerald-50 text-emerald-800 text-[10px] font-bold border-emerald-200 capitalize">
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {order.items.length} items &bull; Placed on {format(new Date(order.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-gray-400 block">Total</span>
                      <span className="text-sm font-extrabold text-gray-900">₹{order.total.toFixed(2)}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl text-xs gap-1 border-gray-200 hover:bg-[#1b5d4e] hover:text-white transition-colors"
                    >
                      Track <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
