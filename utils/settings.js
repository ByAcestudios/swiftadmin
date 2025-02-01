import api from '@/lib/api';

export const fetchOrderSettings = async () => {
  try {
    const response = await api.get('/api/settings/keys?keys=orderType,orderStatus,categories');
    return {
      orderTypes: response.data.orderType || [],
      orderStatuses: response.data.orderStatus || [],
      categories: response.data.categories || [],
      error: null
    };
  } catch (error) {
    console.error('Error fetching order settings:', error);
    return {
      orderTypes: [],
      orderStatuses: [],
      categories: [],
      error: 'Failed to load settings'
    };
  }
};

let categoriesCache = null;

export const getKeysByCategory = async () => {
    // Return cached data if available
    if (categoriesCache) {
      return categoriesCache;
    }

    try {
      const response = await api.get('/api/settings/keys?keys=categories');
      // Cache the response
      categoriesCache = {
        categories: response.data.categories || [],
        error: null
      };
      return categoriesCache;
    } catch (error) {
      console.error('Error fetching order settings:', error);
      return {
        categories: [],
        error: 'Failed to load settings'
      };
    }
};

// Optional: Add a method to clear cache if needed
export const clearCategoriesCache = () => {
  categoriesCache = null;
};

// Enhanced formatting function
export const formatSettingsForSelect = (items) => {
  return [
    { value: 'all', label: 'All' },
    ...items.map(item => ({
      value: item,
      label: item
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    }))
  ];
};

// Example outputs:
// "same-day" -> "Same Day"
// "in-transit" -> "In Transit"
// "electronics" -> "Electronics"

export const getStatusColor = (status) => {
  const statusMap = {
    'in-transit': 'bg-blue-500',
    'completed': 'bg-green-500',
    'pending': 'bg-yellow-500',
    'cancelled': 'bg-red-500',
    'rejected': 'bg-red-500',
    'expired': 'bg-gray-500',
    'accepted': 'bg-emerald-500'
  };
  return statusMap[status] || 'bg-gray-500';
}; 