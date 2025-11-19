/**
 * Core FileProcessor Module
 * 
 * Orchestrates the file extraction process using more specialized components.
 * Handles progress updates and delegates specific tasks to other modules.
 */

import { processConversations } from '../schemaConverter/index.js';
import { FileReader } from './fileReader.js';
import { ZipExtractor } from './zipExtractor.js';
import { ConversationExtractor } from './conversationExtractor.js';

/**
 * Process an uploaded zip/dms file and extract conversation data
 * @param {File} file - The uploaded file
 * @param {Function} progressCallback - Callback for progress updates (0-100)
 * @returns {Promise<Array>} - Promise resolving to an array of conversations
 */
export async function processFile(file, progressCallback = () => {}) {
  try {
    progressCallback(5);
    
    
    // Create components
    const fileReader = new FileReader();
    const zipExtractor = new ZipExtractor();
    const conversationExtractor = new ConversationExtractor();
    
    // Step 1: Read the file as ArrayBuffer
    progressCallback(10);
    const fileData = await fileReader.readAsArrayBuffer(file);
    
    // Step 2: Extract the zip content
    progressCallback(30);
    const zipData = await zipExtractor.extractZip(fileData);
    
    
    // Step 3: Extract conversations JSON
    progressCallback(50);
    const jsonText = await conversationExtractor.extractConversationsJson(zipData);
    
    // Step 4: Parse the JSON and extract raw conversations
    progressCallback(70);
    const rawConversations = conversationExtractor.parseConversations(jsonText);
    
    if (!rawConversations || !rawConversations.length) {
      throw new Error('No valid conversations found in the file');
    }
    
    progressCallback(80);
    
    // Step 5: Convert to unified schema
    const conversations = processConversations(rawConversations);
    
    
    progressCallback(100);
    return conversations;
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

