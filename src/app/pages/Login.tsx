import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, Loader2, ShieldCheck, User, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const { login, adminLogin } = useAuth();
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');
  const [isLoading, setIsLoading] = useState(false);

  // Customer form state
  const [customerData, setCustomerData] = useState({
    email: "",
    password: "",
  });

  // Admin form state
  const [adminData, setAdminData] = useState({
    email: "admin@shophub.com",
    password: "admin123",
  });

  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(customerData.email, customerData.password);
      toast.success("Welcome back!", {
        description: "You have signed in successfully.",
      });
      navigate("/");
    } catch (error) {
      toast.error("Sign in failed", {
        description:
          error instanceof Error ? error.message : "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(adminData.email, adminData.password);
      toast.success("Administrator Access Granted", {
        description: "Logged in to Admin Dashboard.",
      });
      navigate("/admin");
    } catch (error) {
      toast.error("Admin sign in failed", {
        description:
          error instanceof Error ? error.message : "Invalid admin credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCustomerDemo = async () => {
    setIsLoading(true);
    try {
      await login("demo@shophub.com", "demo123");
      toast.success("Customer Demo Sign In Successful", {
        description: "Signed in as Alex Sharma.",
      });
      navigate("/");
    } catch {
      toast.error("Demo sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminDemo = async () => {
    setIsLoading(true);
    try {
      await adminLogin();
      toast.success("Administrator Access Granted", {
        description: "Welcome to ShopHub Admin Portal.",
      });
      navigate("/admin");
    } catch {
      toast.error("Admin sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9] py-12 px-4">
      <Card className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        
        {/* Sign In Mode Switch Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-gray-100/80 m-4 mb-0 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="h-4 w-4 text-[#1b5d4e]" />
            Customer Sign In
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Login
          </button>
        </div>

        {/* CUSTOMER TAB */}
        {activeTab === 'customer' && (
          <>
            <CardHeader className="space-y-1 pb-4 pt-6">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-[#1b5d4e]/10 p-3 rounded-2xl text-[#1b5d4e]">
                  <LogIn className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-2xl font-extrabold text-center text-gray-900">
                Sign In to Your Account
              </CardTitle>
              <CardDescription className="text-center text-xs text-gray-500">
                Access your orders, wishlist, and personalized recommendations
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleCustomerSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      className="pl-10 rounded-xl border-gray-200"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
                    <span className="text-xs text-gray-400">Default demo: demo123</span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={customerData.password}
                      onChange={(e) => setCustomerData({ ...customerData, password: e.target.value })}
                      className="pl-10 rounded-xl border-gray-200"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#1b5d4e] hover:bg-[#14473b] text-white rounded-xl py-6 font-semibold shadow-sm cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Instant 1-Click Demo Login */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl py-5 text-xs font-medium cursor-pointer"
                  onClick={handleQuickCustomerDemo}
                  disabled={isLoading}
                >
                  ⚡ One-Click Demo Customer Sign In
                </Button>

                <p className="text-center text-xs text-gray-500 pt-2">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-[#1b5d4e] font-semibold hover:underline"
                  >
                    Create Account
                  </Link>
                </p>
              </form>
            </CardContent>
          </>
        )}

        {/* ADMIN TAB */}
        {activeTab === 'admin' && (
          <>
            <CardHeader className="space-y-1 pb-4 pt-6">
              <div className="flex items-center justify-center mb-2">
                <div className="bg-purple-100 p-3 rounded-2xl text-purple-700">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-2xl font-extrabold text-center text-gray-900">
                Administrator Portal
              </CardTitle>
              <CardDescription className="text-center text-xs text-gray-500">
                Manage inventory, order processing, and store analytics
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* How to login admin explanation banner */}
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 mb-5 text-xs space-y-1">
                <p className="font-bold text-purple-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-purple-700" />
                  Default Admin Credentials:
                </p>
                <div className="text-purple-800 space-y-0.5 pl-5 font-mono text-[11px]">
                  <p>Email: <span className="font-bold select-all">admin@shophub.com</span></p>
                  <p>Password: <span className="font-bold select-all">admin123</span></p>
                </div>
              </div>

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-email" className="text-xs font-semibold text-gray-700">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      required
                      className="pl-10 rounded-xl border-gray-200"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-password" className="text-xs font-semibold text-gray-700">Admin Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      required
                      className="pl-10 rounded-xl border-gray-200"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-purple-700 hover:bg-purple-800 text-white rounded-xl py-6 font-semibold shadow-sm cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating Admin...
                    </>
                  ) : (
                    "Sign In as Administrator"
                  )}
                </Button>

                {/* Instant 1-Click Admin Login */}
                <Button
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-5 text-xs font-bold shadow-xs cursor-pointer gap-1.5"
                  onClick={handleQuickAdminDemo}
                  disabled={isLoading}
                >
                  ⚡ One-Click Instant Admin Sign In
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>

                <p className="text-center text-[11px] text-gray-400 pt-1">
                  Access restricted to authorized store administrators only.
                </p>
              </form>
            </CardContent>
          </>
        )}

      </Card>
    </div>
  );
}