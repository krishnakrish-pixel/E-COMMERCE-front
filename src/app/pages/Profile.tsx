import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Edit, Save, Loader2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { api } from '../api/client';
import { SavedAddresses } from '../components/SavedAddresses';
import { useNavigate } from 'react-router-dom';

function ChangePasswordCard() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) return toast.error('New password must be at least 6 characters');
    if (next !== confirm) return toast.error('The new passwords do not match');
    setSaving(true);
    try {
      await api('/users/me/password', { method: 'PUT', body: { currentPassword: current, newPassword: next } });
      toast.success('Password changed');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err: any) {
      toast.error(err.message || 'Could not change your password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input id="currentPassword" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input id="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
  });

  // Check authentication in useEffect
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
      });
    }
  }, [user]);

  // Don't render until we have user data
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(formData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      city: user?.city || '',
      zipCode: user?.zipCode || '',
      country: user?.country || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mb-4">
                  <UserIcon className="h-12 w-12 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 text-sm mb-4">{user.email}</p>
                <Button
                  variant={isEditing ? 'secondary' : 'default'}
                  className="w-full gap-2"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                >
                  {isEditing ? (
                    <>
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {user.city}, {user.country}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={true}
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing || isLoading}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Address</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                      placeholder="123 Main St"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder="New York"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        disabled={!isEditing || isLoading}
                        placeholder="10001"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      disabled={!isEditing || isLoading}
                      placeholder="United States"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 gap-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          <SavedAddresses />

          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}