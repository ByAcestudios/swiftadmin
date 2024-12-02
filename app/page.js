'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };
    checkLoginStatus();
  }, [router]);

  // This component won't render anything visible
  // It just handles the initial routing
  return null;
}