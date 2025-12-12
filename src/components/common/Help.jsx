import { useState, useEffect, useRef } from 'react';

// ThreeDotMenu Component
const Help = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Toggle Popup Visibility
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close Popup When Clicking Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle Help Click
  const handleHelpClick = () => {
    console.log('Help clicked');
    setIsOpen(false);
    // Add your help functionality here (e.g., redirect to a help page)
  };

  // Handle Report Click
  const handleReportClick = () => {
    console.log('Report clicked');
    setIsOpen(false);
    // Add your report functionality here (e.g., open a report form)
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Three-Dot Menu Button */}
      <button
        onClick={toggleMenu}
        className="text-2xl text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <i className="bx bx-dots-vertical-rounded"></i>
      </button>

      {/* Popup (Shown when isOpen is true) */}
      {isOpen && (
        <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="flex flex-col items-center justify-center">
            {/* Help Option */}
            <button
              onClick={handleHelpClick}
              className="p-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg focus:outline-none"
            >
              Help
            </button>
            {/* Report Option */}
            <button
              onClick={handleReportClick}
              className="p-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg focus:outline-none"
            >
              Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Help;