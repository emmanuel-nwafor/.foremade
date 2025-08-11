import React from 'react';
import SellerSidebar from "./SellerSidebar";

export default function SettingsPage() {

  return (
    <div className="flex min-h-screen bg-gray-50">
        <SellerSidebar />   
        {/* Contents */}
        <main className="flex-1 ml-0 md:ml-64 flex flex-col p-6">
            <div className="">
                <p> Seller Settings</p>
            </div>
        </main>
    </div>
  );
}