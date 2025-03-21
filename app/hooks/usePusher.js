// app/hooks/usePusher.js
import { useEffect, useState } from 'react';
import { pusherClient, channelNames, eventNames } from '@/app/lib/pusher';
import { useSession } from 'next-auth/react';

export default function usePusher(quizId) {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  const [channel, setChannel] = useState(null);
  const [adminChannel, setAdminChannel] = useState(null);
  
  // Subscribe to channels
  useEffect(() => {
    if (!quizId || !session?.user) return;

    // Subscribe to quiz channel
    const quizChannel = pusherClient.subscribe(channelNames.quiz(quizId));
    setChannel(quizChannel);
    
    // If user is admin, subscribe to admin channel
    if (session.user.isAdmin) {
      const adminChan = pusherClient.subscribe(channelNames.admin(quizId));
      setAdminChannel(adminChan);
    }
    
    setConnected(true);
    
    return () => {
      // Unsubscribe on cleanup
      pusherClient.unsubscribe(channelNames.quiz(quizId));
      if (session.user.isAdmin) {
        pusherClient.unsubscribe(channelNames.admin(quizId));
      }
      setConnected(false);
    };
  }, [quizId, session]);
  
  // Function to bind to events
  const bind = (eventName, callback) => {
    if (!channel) return () => {};
    
    channel.bind(eventName, callback);
    return () => {
      channel.unbind(eventName, callback);
    };
  };
  
  // Function to bind to admin events
  const bindAdmin = (eventName, callback) => {
    if (!adminChannel) return () => {};
    
    adminChannel.bind(eventName, callback);
    return () => {
      adminChannel.unbind(eventName, callback);
    };
  };
  
  // Helper function for subscribing to events with useEffect
  const useEvent = (eventName, callback) => {
    useEffect(() => {
      if (!channel) return;
      
      channel.bind(eventName, callback);
      return () => {
        channel.unbind(eventName, callback);
      };
    }, [channel, eventName, callback]);
  };
  
  // Helper function for subscribing to admin events with useEffect
  const useAdminEvent = (eventName, callback) => {
    useEffect(() => {
      if (!adminChannel) return;
      
      adminChannel.bind(eventName, callback);
      return () => {
        adminChannel.unbind(eventName, callback);
      };
    }, [adminChannel, eventName, callback]);
  };
  
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