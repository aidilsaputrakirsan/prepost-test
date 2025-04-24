// app/hooks/usePusher.js
import { useEffect, useState, useCallback, useRef } from 'react';
import { pusherClient, channelNames, eventNames } from '@/app/lib/pusher';
import { useSession } from 'next-auth/react';

export default function usePusher(quizId) {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState(null);
  const [adminChannel, setAdminChannel] = useState(null);
  
  // Use refs to track bound event handlers for better cleanup
  const boundEventsRef = useRef(new Map());
  const adminBoundEventsRef = useRef(new Map());
  
  // Subscribe to channels
  useEffect(() => {
    if (!quizId) {
      setConnected(false);
      return;
    }

    console.log("Subscribing to Pusher channel for quiz:", quizId);
    
    // Get user info - either from session or localStorage
    let isAdmin = false;
    if (session?.user?.isAdmin) {
      isAdmin = true;
    } else {
      try {
        const storedUser = typeof localStorage !== 'undefined' 
          ? localStorage.getItem('quiz_user') 
          : null;
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.isAdmin) {
            isAdmin = true;
          }
        }
      } catch (e) {
        console.error("Error checking stored user:", e);
      }
    }
    
    // Subscribe to quiz channel
    try {
      const channelName = channelNames.quiz(quizId);
      console.log("Subscribing to channel:", channelName);
      
      // First, unsubscribe if we're already subscribed
      try {
        // Clear event bindings on existing channel
        if (channel) {
          boundEventsRef.current.forEach((callback, eventName) => {
            channel.unbind(eventName, callback);
          });
          boundEventsRef.current.clear();
        }
        
        pusherClient.unsubscribe(channelName);
      } catch (e) {
        console.error("Error unsubscribing from channel:", e);
      }
      
      const quizChannel = pusherClient.subscribe(channelName);
      
      quizChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to ${channelName}`);
        setConnected(true);
      });
      
      quizChannel.bind('pusher:subscription_error', (error) => {
        console.error(`Error subscribing to ${channelName}:`, error);
        setConnected(false);
      });
      
      setChannel(quizChannel);
      
      // If user is admin, subscribe to admin channel
      if (isAdmin) {
        const adminChannelName = channelNames.admin(quizId);
        console.log("Admin subscribing to channel:", adminChannelName);
        
        // First, unsubscribe if we're already subscribed
        try {
          // Clear event bindings on existing admin channel
          if (adminChannel) {
            adminBoundEventsRef.current.forEach((callback, eventName) => {
              adminChannel.unbind(eventName, callback);
            });
            adminBoundEventsRef.current.clear();
          }
          
          pusherClient.unsubscribe(adminChannelName);
        } catch (e) {
          console.error("Error unsubscribing from admin channel:", e);
        }
        
        const adminChan = pusherClient.subscribe(adminChannelName);
        setAdminChannel(adminChan);
      } else {
        setAdminChannel(null);
      }
    } catch (error) {
      console.error("Error subscribing to Pusher channels:", error);
      setConnected(false);
    }
    
    // Return cleanup function
    return () => {
      try {
        // Clean up quiz channel
        if (channel) {
          boundEventsRef.current.forEach((callback, eventName) => {
            channel.unbind(eventName, callback);
          });
          boundEventsRef.current.clear();
          pusherClient.unsubscribe(channelNames.quiz(quizId));
        }
        
        // Clean up admin channel
        if (adminChannel) {
          adminBoundEventsRef.current.forEach((callback, eventName) => {
            adminChannel.unbind(eventName, callback);
          });
          adminBoundEventsRef.current.clear();
          pusherClient.unsubscribe(channelNames.admin(quizId));
        }
        
        setChannel(null);
        setAdminChannel(null);
        setConnected(false);
      } catch (error) {
        console.error("Error unsubscribing from channels:", error);
      }
    };
  }, [quizId, session]);
  
  // Function to bind to events, with better tracking for cleanup
  const bind = useCallback((eventName, callback) => {
    if (!channel) return () => {};
    
    console.log(`Binding to event '${eventName}' on channel:`, channel.name);
    
    // Unbind any existing callback for this event 
    if (boundEventsRef.current.has(eventName)) {
      const oldCallback = boundEventsRef.current.get(eventName);
      channel.unbind(eventName, oldCallback);
    }
    
    // Create a wrapped callback that logs the event
    const wrappedCallback = (data) => {
      console.log(`Received event '${eventName}':`, data);
      callback(data);
    };
    
    // Store the new callback in our ref Map
    boundEventsRef.current.set(eventName, wrappedCallback);
    
    // Bind the new callback
    channel.bind(eventName, wrappedCallback);
    
    // Return an unbind function
    return () => {
      channel.unbind(eventName, wrappedCallback);
      boundEventsRef.current.delete(eventName);
    };
  }, [channel]);
  
  // Function to bind to admin events
  const bindAdmin = useCallback((eventName, callback) => {
    if (!adminChannel) return () => {};
    
    console.log(`Binding to admin event '${eventName}' on channel:`, adminChannel.name);
    
    // Unbind any existing callback for this event
    if (adminBoundEventsRef.current.has(eventName)) {
      const oldCallback = adminBoundEventsRef.current.get(eventName);
      adminChannel.unbind(eventName, oldCallback);
    }
    
    // Create a wrapped callback that logs the event
    const wrappedCallback = (data) => {
      console.log(`Received admin event '${eventName}':`, data);
      callback(data);
    };
    
    // Store the new callback in our ref Map
    adminBoundEventsRef.current.set(eventName, wrappedCallback);
    
    // Bind the new callback
    adminChannel.bind(eventName, wrappedCallback);
    
    // Return an unbind function
    return () => {
      adminChannel.unbind(eventName, wrappedCallback);
      adminBoundEventsRef.current.delete(eventName);
    };
  }, [adminChannel]);
  
  // Improved helper function for subscribing to events with useEffect
  const useEvent = useCallback((eventName, eventCallback) => {
    useEffect(() => {
      if (!channel) return;
      
      console.log(`Setting up event listener for '${eventName}'`);
      
      const wrappedCallback = (data) => {
        console.log(`Received event '${eventName}':`, data);
        eventCallback(data);
      };
      
      // First unbind any existing callbacks to prevent duplicates
      if (boundEventsRef.current.has(eventName)) {
        const oldCallback = boundEventsRef.current.get(eventName);
        channel.unbind(eventName, oldCallback);
      }
      
      // Store and bind the new callback
      boundEventsRef.current.set(eventName, wrappedCallback);
      channel.bind(eventName, wrappedCallback);
      
      return () => {
        console.log(`Unbinding event '${eventName}'`);
        channel.unbind(eventName, wrappedCallback);
        boundEventsRef.current.delete(eventName);
      };
    }, [eventName, channel]);
  }, [channel]);
  
  // Improved helper function for subscribing to admin events with useEffect
  const useAdminEvent = useCallback((eventName, eventCallback) => {
    useEffect(() => {
      if (!adminChannel) return;
      
      console.log(`Setting up admin event listener for '${eventName}'`);
      
      const wrappedCallback = (data) => {
        console.log(`Received admin event '${eventName}':`, data);
        eventCallback(data);
      };
      
      // First unbind any existing callbacks to prevent duplicates
      if (adminBoundEventsRef.current.has(eventName)) {
        const oldCallback = adminBoundEventsRef.current.get(eventName);
        adminChannel.unbind(eventName, oldCallback);
      }
      
      // Store and bind the new callback
      adminBoundEventsRef.current.set(eventName, wrappedCallback);
      adminChannel.bind(eventName, wrappedCallback);
      
      return () => {
        console.log(`Unbinding admin event '${eventName}'`);
        adminChannel.unbind(eventName, wrappedCallback);
        adminBoundEventsRef.current.delete(eventName);
      };
    }, [eventName, adminChannel]);
  }, [adminChannel]);
  
  return {
    connected,
    channel,
    adminChannel,
    bind,
    bindAdmin,
    useEvent,
    useAdminEvent,
    eventNames,
  };
}