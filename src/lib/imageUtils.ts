import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File) => {
  const options = {
    maxSizeMB: 0.8,          // Tamaño máximo (800KB es excelente calidad/peso)
    maxWidthOrHeight: 1200,  // Resolución máxima (suficiente para web)
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    return file; // Si falla, devolvemos la original para no detener el proceso
  }
};