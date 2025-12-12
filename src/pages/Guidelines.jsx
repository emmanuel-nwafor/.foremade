import React from 'react';

export default function Guidelines() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-extrabold text-blue-700 mb-6">FOREMADE Product Upload Guidelines</h1>
      <p className="mb-6 text-gray-700">To ensure quality and consistency across our marketplace, please follow these standards when uploading products:</p>
      <hr className="my-6" />
      <section className="mb-8">
        <h2 className="text-xl font-bold text-blue-600 mb-2">1. Product Images & Videos</h2>
        <ul className="list-disc ml-6 text-gray-800 space-y-2">
          <li>Upload at least 4 different images of your product.</li>
          <li>You may add up to 8 images plus 1 video per product.</li>
          <li>Images must be clear, sharp, and high-quality.</li>
          <li>Use a plain, neutral background (preferably white or light).</li>
          <li>Show multiple angles: front, back, side, and close-up.</li>
          <li>If possible, add a 360° video to enhance customer trust.</li>
          <li>Display the product in use (e.g., worn, hanging, or placed naturally) where relevant.</li>
        </ul>
      </section>
      <hr className="my-6" />
      <section className="mb-8">
        <h2 className="text-xl font-bold text-blue-600 mb-2">2. Product Description</h2>
        <ul className="list-disc ml-6 text-gray-800 space-y-2">
          <li>Provide a detailed and accurate description.</li>
          <li>Include size, color, material, weight, and key features.</li>
          <li>Write in a way that gives buyers full clarity about the item.</li>
          <li>Avoid vague terms – always be specific and transparent.</li>
        </ul>
      </section>
      <hr className="my-6" />
      <section className="mb-8">
        <h2 className="text-xl font-bold text-blue-600 mb-2">3. Compliance for Consumable Goods</h2>
        <ul className="list-disc ml-6 text-gray-800 space-y-2">
          <li>All consumables (food, beverages, cosmetics, etc.) must meet food safety standards.</li>
          <li>NAFDAC registration number (or equivalent certification in your country) must be clearly printed on packaging.</li>
          <li>Products without proper certification will not be approved for sale.</li>
        </ul>
      </section>
      <hr className="my-6" />
      <section className="mb-8">
        <h2 className="text-xl font-bold text-blue-600 mb-2">4. General Standards</h2>
        <ul className="list-disc ml-6 text-gray-800 space-y-2">
          <li>Only upload products you own or are authorized to sell.</li>
          <li>All content (images, text, videos) must be original.</li>
          <li>Products must be authentic and not counterfeit.</li>
        </ul>
      </section>
      <hr className="my-6" />
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mt-8">
        <span className="text-green-700 font-semibold">✅ By following these guidelines, your products will gain better visibility, higher approval chances, and increased customer trust on FOREMADE.</span>
      </div>
    </div>
  );
}
