import React from 'react';
import SellerSidebar from './SellerSidebar';

export default function Overview() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      {/* Contents */}
      <main className="flex-1 ml-0 md:ml-64 flex flex-col">
        <div className="p-6">
          Overview
          <p className="text-8xl"></p>
        </div>
      </main>
    </div>
  );
}