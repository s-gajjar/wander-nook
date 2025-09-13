"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tags: string;
  note: string;
  created_at: string;
  verified_email: boolean;
  state: string;
  orders_count: number;
  total_spent: string;
  plan_type_from_note?: string;
  addresses: Array<{
    id: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
    phone: string;
    company?: string;
    default?: boolean;
  }>;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'print' | 'digital'>('all');

  // Client-side admin check (similar to blog page)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const data = await res.json();
        if (mounted && !data?.isAdmin) {
          const next = encodeURIComponent("/admin/customers");
          window.location.replace(`/admin/login?next=${next}`);
          return;
        }
        // If authenticated, fetch customers
        if (mounted) {
          fetchCustomers();
        }
      } catch {
        if (mounted) {
          window.location.replace("/admin/login");
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      } else {
        toast.error('Failed to fetch customers');
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    if (filterType === 'all') return customer.tags.includes('subscription');
    if (filterType === 'print') return customer.tags.includes('Print Edition');
    if (filterType === 'digital') return customer.tags.includes('Digital Explorer');
    return false;
  });

  const exportAddresses = () => {
    const printCustomers = customers.filter(c => c.tags.includes('Print Edition'));
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Verified', 'Address Line 1', 'Address Line 2', 'City', 'State', 'Pincode', 'Country', 'Company', 'Alt Phone', 'Subscription Date', 'Order Count', 'Total Spent', 'Customer Status', 'Notes'].join(','),
      ...printCustomers.map(customer => {
        const address = customer.addresses[0];
        return [
          `"${customer.first_name} ${customer.last_name}"`,
          customer.email,
          customer.phone,
          customer.verified_email ? 'Yes' : 'No',
          `"${address?.address1 || ''}"`,
          `"${address?.address2 || ''}"`,
          address?.city || '',
          address?.province || '',
          address?.zip || '',
          address?.country || '',
          `"${address?.company || ''}"`,
          address?.phone || '',
          new Date(customer.created_at).toLocaleDateString(),
          customer.orders_count,
          customer.total_spent,
          customer.state,
          `"${customer.note || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `print-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Print customer addresses exported with complete details!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Admin Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <a
              href="/admin/article/new"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Article Admin
            </a>
            <span className="text-gray-300">|</span>
            <span className="text-gray-900 font-medium">Customer Management</span>
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Customer Subscriptions</h1>
                <p className="text-gray-600">Manage and view customer subscription data from Shopify</p>
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Some customer details may be limited due to Shopify API restrictions. 
                    For complete customer information including email and phone numbers, please check individual 
                    customer records in your{' '}
                    <a 
                      href="https://876a76-de.myshopify.com/admin/customers" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-900"
                    >
                      Shopify Admin Dashboard
                    </a>.
                  </p>
                </div>
              </div>
              <button
                onClick={exportAddresses}
                disabled={customers.filter(c => c.tags.includes('Print Edition')).length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Export Print Addresses ({customers.filter(c => c.tags.includes('Print Edition')).length})
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="mt-4 flex space-x-1">
              {[
                { key: 'all', label: 'All Subscriptions', count: customers.filter(c => c.tags.includes('subscription')).length },
                { key: 'print', label: 'Print Edition', count: customers.filter(c => c.tags.includes('Print Edition')).length },
                { key: 'digital', label: 'Digital Explorer', count: customers.filter(c => c.tags.includes('Digital Explorer')).length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterType(tab.key as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterType === tab.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const address = customer.addresses[0];
                  const subscriptionType = customer.tags.includes('Print Edition') ? 'Print Edition' : 'Digital Explorer';
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.first_name || customer.last_name ? 
                              `${customer.first_name} ${customer.last_name}` : 
                              <span className="text-gray-400 italic">Name not available</span>
                            }
                          </div>
                          <div className="text-sm text-gray-500">ID: {customer.id}</div>
                          <div className="text-sm text-gray-500">
                            Orders: {customer.orders_count} | ₹{customer.total_spent}
                          </div>
                          <a 
                            href={`https://876a76-de.myshopify.com/admin/customers/${customer.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            View in Shopify →
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.email || <span className="text-gray-400 italic">Email not available</span>}
                          {customer.verified_email && customer.email && (
                            <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.phone || <span className="text-gray-400 italic">Phone not available</span>}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">Status: {customer.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          subscriptionType === 'Print Edition' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {subscriptionType}
                        </span>
                        {customer.note && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={customer.note}>
                            {customer.note}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {address ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">{address.address1}</div>
                            {address.address2 && (
                              <div className="text-gray-600">{address.address2}</div>
                            )}
                            <div className="text-gray-500">
                              {address.city}, {address.province} {address.zip}
                            </div>
                            <div className="text-gray-500">{address.country}</div>
                            {address.company && (
                              <div className="text-gray-600 text-xs">Company: {address.company}</div>
                            )}
                            {address.phone && address.phone !== customer.phone && (
                              <div className="text-gray-600 text-xs">Alt Phone: {address.phone}</div>
                            )}
                            {address.default && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                Default
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No address</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredCustomers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">No customers found for the selected filter.</div>
                {customers.length === 0 && (
                  <div className="text-sm text-gray-400 mt-2">
                    Make sure your Shopify admin token is configured and customers have the "subscription" tag.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {customers.filter(c => c.tags.includes('subscription')).length}
                </div>
                <div className="text-sm text-gray-600">Total Subscribers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {customers.filter(c => c.tags.includes('Print Edition')).length}
                </div>
                <div className="text-sm text-gray-600">Print Subscribers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.tags.includes('Digital Explorer')).length}
                </div>
                <div className="text-sm text-gray-600">Digital Subscribers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 