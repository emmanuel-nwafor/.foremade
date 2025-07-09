import React from 'react';

const chatterTemplates = {
  buyer: {
    'Acknowledged Receipt': "Hi, just confirming that I've received the item. Thank you!",
    'Not As Described': "Hi, I received the item but it's a bit different from what I expected. The [describe issue] isn't quite as shown.",
    'Significantly Not as Described': "Hello, I've received the item, but it's significantly different from the description. It doesn't match the images or details listed.",
    'Product is Damaged': "Hi, the item I received is damaged. It looks like it got affected during delivery. Please advise on next steps.",
    'Not Received': "Hi, I haven't received my item yet. The delivery window has passed.",
    'Marked Delivered But Not Received': "My order says it's been delivered, but I didn't receive anything.",
    'No Shipping Update': "Hi, I placed an order and haven't seen any shipping updates. Has the item been sent?",
    'Request Photos': "Could you please share some photos of the actual item?",
    'Thank You': "Thank you for your help!",
    'Following Up': "Hi, just following up on my previous message. Any updates?"
  },
  seller: {
    'Order Confirmation': "Thanks for your order! We've received it and are preparing your item for dispatch. You'll receive tracking details once it ships.",
    'Item Dispatched': "Hi! Your order has been dispatched via [Courier Name]. Tracking number: [Tracking ID]. Let us know when it arrives!",
    'Confirm Delivery': "Hi, just checking in to confirm if you've received your item. We hope everything's in order!",
    'Response: Minor Issue': "Thanks for reaching out. Sorry to hear that. Could you please share a photo of the issue? We'll look into it right away.",
    'Response: Significant Issue': "We're really sorry about this. Please send us a photo or video of what you received so we can escalate it for review. If confirmed, a refund or return can be processed.",
    'Response: Damaged': "Oh no! We're really sorry to hear that. Please send us photos of the damage (including packaging if possible), and we'll help sort this out quickly.",
    'Response: Not Received': "Thanks for reaching out. Let me check the tracking and follow up with the courier. We'll update you shortly.",
    'Response: Marked Delivered': "We're sorry to hear that. Sometimes items may be left with a neighbour or reception. Could you kindly check? If not, we'll raise this with the courier and update you.",
    'Response: No Tracking Update': "Thanks for checking in. Let me confirm the dispatch status and get back to you shortly. We'll ensure this is resolved quickly.",
    'Apology': "We sincerely apologize for the inconvenience caused.",
    'Processing Refund': "We're processing your refund now. You should see it in 3-5 business days.",
    'Escalating Issue': "I'm escalating this to our senior team for immediate resolution."
  }
};

const ChatTemplates = ({ role, onSelect, selectedTemplate }) => {
  return (
    <select
      value={selectedTemplate}
      onChange={(e) => onSelect(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    >
      <option value="">Choose a message...</option>
      {Object.keys(chatterTemplates[role]).map((key) => (
        <option key={key} value={key}>
          {key}
        </option>
      ))}
    </select>
  );
};

export default ChatTemplates;