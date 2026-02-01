// Firebase Storage Service
import { storage } from "../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

/**
 * Upload an image file to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder name in Firebase Storage (e.g., 'restaurants')
 * @param {string} fileName - Optional custom file name, otherwise generates a unique name
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export async function uploadImage(file, folder = "restaurants", fileName = null) {
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size too large. Maximum size is 5MB.");
  }

  // Generate unique file name if not provided
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split(".").pop();
  const finalFileName = fileName || `${timestamp}-${randomStr}.${extension}`;

  // Create storage reference
  const storageRef = ref(storage, `${folder}/${finalFileName}`);

  // Upload file
  const snapshot = await uploadBytes(storageRef, file);

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - The download URL of the image to delete
 * @returns {Promise<void>}
 */
export async function deleteImage(imageUrl) {
  if (!imageUrl) {
    return;
  }

  try {
    // Extract the path from the URL
    // Firebase Storage URLs typically look like:
    // https://firebasestorage.googleapis.com/v0/b/project-id.appspot.com/o/folder%2Ffilename?token=...
    const urlObj = new URL(imageUrl);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+?)(\?|$)/);

    if (pathMatch && pathMatch[1]) {
      // Decode the path (URL encoded)
      const decodedPath = decodeURIComponent(pathMatch[1]);
      // Replace %2F with / to get the actual path
      const filePath = decodedPath.replace(/%2F/g, '/');

      // Create a reference and delete
      const imageRef = ref(storage, filePath);
      await deleteObject(imageRef);
      console.log('Image deleted from Firebase Storage:', filePath);
    }
  } catch (error) {
    // Log the error but don't throw - we don't want to fail restaurant deletion
    // if image deletion fails (e.g., image already doesn't exist)
    console.error('Error deleting image from Firebase Storage:', error.message);
  }
}

/**
 * Upload multiple images to Firebase Storage
 * @param {File[]} files - Array of image files
 * @param {string} folder - The folder name in Firebase Storage
 * @returns {Promise<string[]>} - Array of download URLs
 */
export async function uploadMultipleImages(files, folder = "restaurants") {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}
