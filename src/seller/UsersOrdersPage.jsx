import SellerSidebar from "./SellerSidebar";

export default function UsersOrdersPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
       <SellerSidebar />
       <main className="flex-1 ml-0 md:ml-64 flex flex-col">
          <div className="p-6">
            <p>Users others</p>
          </div>
        </main>
    </div>
  );
}