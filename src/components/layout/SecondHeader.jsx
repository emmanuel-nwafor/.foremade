export default function SecondHeader() {
  return (
    <div
      className="bg-white shadow-sm border-b border-gray-200 py-1 px-6 select-none pointer-events-none"
      style={{ opacity: 0, userSelect: "none" }}
      aria-hidden="true"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-lg font-semibold text-gray-900">Second Header</h1>
            <nav className="hidden md:flex space-x-4">
              <a href="#" className="text-gray-600">Link 1</a>
              <a href="#" className="text-gray-600">Link 2</a>
              <a href="#" className="text-gray-600">Link 3</a>
            </nav>
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm">
              Action Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}