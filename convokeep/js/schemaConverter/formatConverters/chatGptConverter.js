/**
 * ChatGptConverter Module
 * 
 * Specialized converter for ChatGPT conversation format.
 */

import { BaseConverter } from './baseConverter.js';

export class ChatGptConverter extends BaseConverter {
  /**
   * Convert ChatGPT format to unified schema
   * @param {Object} conversation - The conversation to convert
   * @returns {Object} - Unified conversation object
   */
  convert(conversation) {
    // Extract messages from the mapping structure
    const messages = this.extractMessages(conversation);
    
    // Create unified conversation object
    return {
      conversation_id: conversation.conversation_id || conversation.id || this.generateId('conv'),
      title: conversation.title || 'Untitled Conversation',
      created_at: this.formatTimestamp(conversation.create_time),
      updated_at: this.formatTimestamp(conversation.update_time),
      source: 'chatgpt',
      model: this.extractModel(conversation),
      messages: messages,
      metadata: {
        is_archived: conversation.is_archived,
        default_model_slug: conversation.default_model_slug,
        original_id: conversation.id,
      },
    };
  }
  
  /**
   * Extract messages from the ChatGPT mapping structure
   * @param {Object} conversation - The conversation to extract messages from
   * @returns {Array} - Array of messages
   */
  extractMessages(conversation) {
    const messages = [];
    const mapping = conversation.mapping || {};
    
    // Find the root message
    let currentNodeId = conversation.current_node;
    let rootNodeId = currentNodeId;
    
    // Trace back to find the root
    while (mapping[rootNodeId]?.parent && mapping[mapping[rootNodeId].parent]) {
      rootNodeId = mapping[rootNodeId].parent;
    }
    
    // Walk the tree from root to build messages in order
    const visitedNodes = new Set();
    
    this.traverseMessages(rootNodeId, mapping, visitedNodes, messages);
    
    // If traversal failed or no messages, try fallback approach
    if (messages.length === 0) {
      this.fallbackExtractMessages(mapping, messages);
    }
    
    return messages;
  }
  
  /**
   * Traverse the message tree recursively
   * @param {string} nodeId - Current node ID
   * @param {Object} mapping - Mapping of node IDs to nodes
   * @param {Set} visitedNodes - Set of visited node IDs
   * @param {Array} messages - Array to store extracted messages
   */
  traverseMessages(nodeId, mapping, visitedNodes, messages) {
    if (!nodeId || visitedNodes.has(nodeId) || !mapping[nodeId]) return;
    
    visitedNodes.add(nodeId);
    const node = mapping[nodeId];
    
    if (node.message) {
      const message = node.message;
      
      // Extract content from message parts
      let content = '';
      if (message.content && Array.isArray(message.content.parts)) {
        content = message.content.parts.join('\n');
      }
      
      messages.push({
        id: message.id || nodeId,
        role: message.author?.role || 'unknown',
        content: content,
        created_at: this.formatTimestamp(message.create_time),
        metadata: {
          model_slug: message.metadata?.model_slug,
          weight: message.weight,
          status: message.status,
        },
      });
    }
    
    // Process children in order
    if (Array.isArray(node.children)) {
      for (const childId of node.children) {
        this.traverseMessages(childId, mapping, visitedNodes, messages);
      }
    }
  }
  
  /**
   * Fallback method to extract messages if tree traversal fails
   * @param {Object} mapping - Mapping of node IDs to nodes
   * @param {Array} messages - Array to store extracted messages
   */
  fallbackExtractMessages(mapping, messages) {
    for (const nodeId in mapping) {
      if (mapping[nodeId].message) {
        const message = mapping[nodeId].message;
        
        let content = '';
        if (message.content && Array.isArray(message.content.parts)) {
          content = message.content.parts.join('\n');
        }
        
        messages.push({
          id: message.id || nodeId,
          role: message.author?.role || 'unknown',
          content: content,
          created_at: this.formatTimestamp(message.create_time),
          metadata: {
            model_slug: message.metadata?.model_slug,
            status: message.status,
          },
        });
      }
    }
    
    // Sort by create_time
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  
  /**
   * Extract model info from ChatGPT conversation
   * @param {Object} conversation - The conversation to extract model from
   * @returns {string} - Model name
   */
  extractModel(conversation) {
    // Try to find model in messages
    if (conversation.mapping) {
      for (const nodeId in conversation.mapping) {
        const node = conversation.mapping[nodeId];
        if (node.message?.metadata?.model_slug) {
          return node.message.metadata.model_slug;
        }
      }
    }
    
    return conversation.default_model_slug || 'gpt-unknown';
  }
}
