import React from 'react';
import InventoryManagement from '../../components/Hospital/InventoryManagement';

const HospitalInventory = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600">Manage your blood and organ inventory levels.</p>
      </div>
      
      <InventoryManagement />
    </div>
  );
};

export default HospitalInventory;
