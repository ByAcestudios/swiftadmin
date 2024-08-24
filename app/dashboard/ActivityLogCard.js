'use client';

import { useState, useEffect } from 'react';

const ActivityLogCard = ({ period, setPeriod }) => {
  const [activityData, setActivityData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulated data fetching based on period
    const fetchData = async () => {
      setIsLoading(true);
      // In a real application, this would be an API call
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulated different data for different periods
      const data = {
        daily: {
          rejectedOrders: { count: 5, value: 800 },
          inactiveRiders: 3,
          activeRiders: 20,
          ongoingOrders: 15,
          deliveredOrders: 45,
          cancelledOrders: 2,
          ordersOnHold: 1,
          idleRiders: { online: 5, offline: 2 },
          websiteEstimates: { entered: 25, booked: 8 }
        },
        weekly: {
          rejectedOrders: { count: 25, value: 4000 },
          inactiveRiders: 5,
          activeRiders: 35,
          ongoingOrders: 30,
          deliveredOrders: 200,
          cancelledOrders: 8,
          ordersOnHold: 3,
          idleRiders: { online: 8, offline: 4 },
          websiteEstimates: { entered: 120, booked: 40 }
        },
        monthly: {
          rejectedOrders: { count: 80, value: 15000 },
          inactiveRiders: 8,
          activeRiders: 42,
          ongoingOrders: 37,
          deliveredOrders: 800,
          cancelledOrders: 25,
          ordersOnHold: 5,
          idleRiders: { online: 12, offline: 6 },
          websiteEstimates: { entered: 450, booked: 150 }
        },
        yearly: {
          rejectedOrders: { count: 950, value: 180000 },
          inactiveRiders: 15,
          activeRiders: 50,
          ongoingOrders: 45,
          deliveredOrders: 9500,
          cancelledOrders: 300,
          ordersOnHold: 20,
          idleRiders: { online: 18, offline: 10 },
          websiteEstimates: { entered: 5400, booked: 1800 }
        }
      };

      setActivityData(data[period]);
      setIsLoading(false);
    };

    fetchData();
  }, [period]);

  const ActivityItem = ({ label, value, subValue }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="text-right">
        <span className="font-semibold text-gray-800">{value}</span>
        {subValue && <span className="text-xs text-gray-500 ml-1">({subValue})</span>}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Activity Log</h2>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#733E70] focus:border-[#733E70] p-2.5"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#733E70]"></div>
        </div>
      ) : (
        <div className="space-y-2">
          <ActivityItem 
            label="Rejected Orders" 
            value={activityData.rejectedOrders?.count} 
            subValue={`$${activityData.rejectedOrders?.value}`}
          />
          <ActivityItem label="Inactive Riders" value={activityData.inactiveRiders} />
          <ActivityItem label="Active Riders" value={activityData.activeRiders} />
          <ActivityItem label="Ongoing Orders" value={activityData.ongoingOrders} />
          <ActivityItem label="Delivered Orders" value={activityData.deliveredOrders} />
          <ActivityItem label="Cancelled Orders" value={activityData.cancelledOrders} />
          <ActivityItem label="Orders on Hold" value={activityData.ordersOnHold} />
          <ActivityItem 
            label="Idle Riders" 
            value={activityData.idleRiders?.online + activityData.idleRiders?.offline}
            subValue={`${activityData.idleRiders?.online} online, ${activityData.idleRiders?.offline} offline`}
          />
          <ActivityItem 
            label="Website Estimates" 
            value={activityData.websiteEstimates?.entered}
            subValue={`${activityData.websiteEstimates?.booked} booked`}
          />
        </div>
      )}
    </div>
  );
};

export default ActivityLogCard;