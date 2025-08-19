// Utility: Create ZIP file
export const createZip = async (files) => {
  const LOCAL_FILE_HEADER = 0x04034b50;
  const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
  const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
  
  const encoder = new TextEncoder();
  const date = new Date();
  const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
  
  const fileDataArray = [];
  const centralDirectory = [];
  let offset = 0;
  
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = file.content instanceof Uint8Array ? file.content : encoder.encode(file.content);
    
    const header = new ArrayBuffer(30);
    const headerView = new DataView(header);
    headerView.setUint32(0, LOCAL_FILE_HEADER, true);
    headerView.setUint16(4, 0x0014, true);
    headerView.setUint16(6, 0, true);
    headerView.setUint16(8, 0, true);
    headerView.setUint16(10, dosTime, true);
    headerView.setUint16(12, dosDate, true);
    headerView.setUint32(14, 0, true);
    headerView.setUint32(18, contentBytes.length, true);
    headerView.setUint32(22, contentBytes.length, true);
    headerView.setUint16(26, nameBytes.length, true);
    headerView.setUint16(28, 0, true);
    
    centralDirectory.push({ offset, nameBytes, contentSize: contentBytes.length, dosTime, dosDate });
    
    fileDataArray.push(new Uint8Array(header), nameBytes, contentBytes);
    offset += header.byteLength + nameBytes.length + contentBytes.length;
  }
  
  const cdStart = offset;
  for (const entry of centralDirectory) {
    const cdHeader = new ArrayBuffer(46);
    const cdView = new DataView(cdHeader);
    cdView.setUint32(0, CENTRAL_DIRECTORY_HEADER, true);
    cdView.setUint16(4, 0x0014, true);
    cdView.setUint16(6, 0x0014, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, entry.dosTime, true);
    cdView.setUint16(14, entry.dosDate, true);
    cdView.setUint32(16, 0, true);
    cdView.setUint32(20, entry.contentSize, true);
    cdView.setUint32(24, entry.contentSize, true);
    cdView.setUint16(28, entry.nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(32, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, entry.offset, true);
    
    fileDataArray.push(new Uint8Array(cdHeader), entry.nameBytes);
    offset += cdHeader.byteLength + entry.nameBytes.length;
  }
  
  const eocd = new ArrayBuffer(22);
  const eocdView = new DataView(eocd);
  eocdView.setUint32(0, END_OF_CENTRAL_DIRECTORY, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, offset - cdStart, true);
  eocdView.setUint32(16, cdStart, true);
  eocdView.setUint16(20, 0, true);
  
  fileDataArray.push(new Uint8Array(eocd));
  
  const totalSize = fileDataArray.reduce((sum, arr) => sum + arr.length, 0);
  const zipFile = new Uint8Array(totalSize);
  let position = 0;
  for (const arr of fileDataArray) {
    zipFile.set(arr, position);
    position += arr.length;
  }
  
  return zipFile;
};
