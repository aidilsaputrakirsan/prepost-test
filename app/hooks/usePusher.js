// app/hooks/usePusher.js
import { useEffect, useState, useCallback } from 'react';
import { pusherClient, channelNames, eventNames } from '@/app/lib/pusher';
import { useSession } from 'next-auth/react';

export default function usePusher(quizId) {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState(null);
  const [adminChannel, setAdminChannel] = useState(null);
  
  // Subscribe to channels
  useEffect(() => {
    if (!quizId) return;

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
      
      const quizChannel = pusherClient.subscribe(channelName);
      quizChannel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to ${channelName}`);
        setConnected(true);
      });
      
      quizChannel.bind('pusher:subscription_error', (error) => {
        console.error(`Error subscribing to ${channelName}:`, error);
      });
      
      setChannel(quizChannel);
      
      // If user is admin, subscribe to admin channel
      if (isAdmin) {
        const adminChannelName = channelNames.admin(quizId);
        console.log("Admin subscribing to channel:", adminChannelName);
        
        const adminChan = pusherClient.subscribe(adminChannelName);
        setAdminChannel(adminChan);
      }
    } catch (error) {
      console.error("Error subscribing to Pusher channels:", error);
    }
    
    return () => {
      // Unsubscribe on cleanup
      try {
        pusherClient.unsubscribe(channelNames.quiz(quizId));
        if (isAdmin) {
          pusherClient.unsubscribe(channelNames.admin(quizId));
        }
        setConnected(false);
      } catch (error) {
        console.error("Error unsubscribing from channels:", error);
      }
    };
  }, [quizId, session]);
  
  // Function to bind to events
  const bind = useCallback((eventName, callback) => {
    if (!channel) return () => {};
    
    console.log(`Binding to event '${eventName}' on channel:`, channel.name);
    
    const wrappedCallback = (data) => {
      console.log(`Received event '${eventName}':`, data);
      callback(data);
    };
    
    channel.bind(eventName, wrappedCallback);
    return () => {
      channel.unbind(eventName, wrappedCallback);
    };
  }, [channel]);
  
  // Function to bind to admin events
  const bindAdmin = useCallback((eventName, callback) => {
    if (!adminChannel) return () => {};
    
    adminChannel.bind(eventName, callback);
    return () => {
      adminChannel.unbind(eventName, callback);
    };
  }, [adminChannel]);
  
  // Helper function for subscribing to events with useEffect
  const useEvent = useCallback((eventName, callback) => {
    useEffect(() => {
      if (!channel) return;
      
      console.log(`Setting up event listener for '${eventName}'`);
      
      const eventCallback = (data) => {
        console.log(`Received event '${eventName}':`, data);
        callback(data);
      };
      
      channel.bind(eventName, eventCallback);
      
      return () => {
        console.log(`Unbinding event '${eventName}'`);
        channel.unbind(eventName, eventCallback);
      };
    }, [channel, eventName]);
  }, [channel]);
  
  // Helper function for subscribing to admin events with useEffect
  const useAdminEvent = useCallback((eventName, callback) => {
    useEffect(() => {
      if (!adminChannel) return;
      
      adminChannel.bind(eventName, callback);
      
      return () => {
        adminChannel.unbind(eventName, callback);
      };
    }, [adminChannel, eventName]);
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