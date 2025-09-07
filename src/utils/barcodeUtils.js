export const generateShortBarcodeValue = async (db, collectionPath, sellerId) => {
  const q = query(collection(db, collectionPath), where('sellerId', '==', sellerId));
  const snapshot = await getDocs(q);
  const existingBarcodes = snapshot.docs.map(doc => doc.data().barcodeValue).filter(Boolean);
  
  let barcode;
  do {
    barcode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random number
  } while (existingBarcodes.includes(barcode));
  
  return barcode;
};