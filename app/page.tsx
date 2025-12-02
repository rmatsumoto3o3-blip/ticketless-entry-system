'use client';

import { useState, useCallback } from 'react';
import Dashboard from '@/components/Dashboard';
import QRScanner from '@/components/QRScanner';
import CheckInStatus from '@/components/CheckInStatus';
import ManualCheckIn from '@/components/ManualCheckIn';
import { checkIn, type CheckInResponse } from '@/lib/gasApi';

export default function Home() {
  const [checkInResult, setCheckInResult] = useState<CheckInResponse | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = useCallback(async (token: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setIsScanning(false);

    // Play beep sound
    const audio = new Audio('/beep.mp3'); // Optional: Add a beep sound file to public/
    audio.play().catch(() => { });

    try {
      const result = await checkIn(token);
      setCheckInResult(result);
    } catch (error) {
      setCheckInResult({
        success: false,
        status: 'ERROR',
        message: 'システムエラーが発生しました / System Error'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const handleManualCheckIn = (result: CheckInResponse) => {
    setCheckInResult(result);
    setIsScanning(false);
  };

  const handleDismiss = () => {
    setCheckInResult(null);
    setIsScanning(true);
  };

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-primary">
          Ticketless Entry System
        </h1>
        <p className="text-muted">QRコードをスキャンしてチェックイン</p>
      </header>

      <div className="space-y-8">
        <Dashboard />

        <div className="card">
          <QRScanner onScan={handleScan} isScanning={isScanning} />
          <ManualCheckIn onCheckIn={handleManualCheckIn} />
        </div>
      </div>

      <CheckInStatus
        result={checkInResult}
        onDismiss={handleDismiss}
      />

      <footer className="mt-12 text-center text-sm text-muted">
        &copy; 2025 Ticketless Entry System
      </footer>
    </main>
  );
}
