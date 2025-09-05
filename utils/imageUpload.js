const supabase = require('../config/supabase');
const path = require('path');

/**
 * Upload a single image to Supabase Storage
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalName - Original filename
 * @param {string} folder - Folder name in storage bucket
 * @returns {Promise<string>} - Public URL of uploaded image
 */
const uploadImageToSupabase = async (fileBuffer, originalName, folder = 'products') => {
  try {
    const fileExtension = path.extname(originalName);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Supabase Storage
 * @param {Array} files - Array of file objects from multer
 * @param {string} folder - Folder name in storage bucket
 * @returns {Promise<Array>} - Array of public URLs
 */
const uploadMultipleImagesToSupabase = async (files, folder = 'products') => {
  try {
    const uploadPromises = files.map(file => 
      uploadImageToSupabase(file.buffer, file.originalname, folder)
    );
    
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Multiple image upload error:', error);
    throw error;
  }
};

module.exports = {
  uploadImageToSupabase,
  uploadMultipleImagesToSupabase
};
