'use client';

import { useState } from 'react';
import OrdersCard from './OrdersCard';
import DashboardCard from './DashboardCard';
import SalesCard from './SalesCard';
import VisitorsCard from './VisitorsCard';
import ActivityLogCard from './ActivityLogCard';
import SalesDistributionCard from './SalesDistributionCard';
import ShipmentsCard from './ShipmentsCard';

export default function Dashboard() {
    const [period, setPeriod] = useState('monthly');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-600">A summary of all activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OrdersCard period={period} setPeriod={setPeriod} />
        <SalesCard period={period} setPeriod={setPeriod} />
        <VisitorsCard period={period} setPeriod={setPeriod} />
        <ActivityLogCard period={period} setPeriod={setPeriod} />
        <SalesDistributionCard period={period} setPeriod={setPeriod} />
        <ShipmentsCard period={period} setPeriod={setPeriod} />
      </div>
    </div>
  );
}