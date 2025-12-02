'use client';

import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import jsQR from 'jsqr';
import styles from './QRScanner.module.css';

interface QRScannerProps {
    onScan: (token: string) => void;
    isScanning: boolean;
}

export default function QRScanner({ onScan, isScanning }: QRScannerProps) {
    const webcamRef = useRef<Webcam>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Request camera permission
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(() => setHasPermission(true))
            .catch(() => setHasPermission(false));
    }, []);

    useEffect(() => {
        if (!isScanning || !hasPermission) {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
            return;
        }

        // Scan for QR codes every 300ms
        scanIntervalRef.current = setInterval(() => {
            const imageSrc = webcamRef.current?.getScreenshot();
            if (!imageSrc) return;

            const image = new Image();
            image.src = imageSrc;
            image.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                ctx.drawImage(image, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code && code.data) {
                    onScan(code.data);
                    if (scanIntervalRef.current) {
                        clearInterval(scanIntervalRef.current);
                        scanIntervalRef.current = null;
                    }
                }
            };
        }, 300);

        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [isScanning, hasPermission, onScan]);

    if (hasPermission === null) {
        return (
            <div className={styles.scanner}>
                <div className={styles.loading}>
                    <div className="spinner" />
                    <p>カメラを準備中...</p>
                </div>
            </div>
        );
    }

    if (hasPermission === false) {
        return (
            <div className={styles.scanner}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>📷</div>
                    <h3>カメラへのアクセスが必要です</h3>
                    <p>QRコードをスキャンするには、カメラの使用を許可してください。</p>
                    <p className="text-muted mt-sm">
                        Camera access is required to scan QR codes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.scanner}>
            <div className={styles.webcamContainer}>
                <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{
                        facingMode: 'environment',
                        width: 1280,
                        height: 720
                    }}
                    className={styles.webcam}
                />

                {isScanning && (
                    <div className={styles.scanOverlay}>
                        <div className={styles.scanBox}>
                            <div className={styles.corner} style={{ top: 0, left: 0 }} />
                            <div className={styles.corner} style={{ top: 0, right: 0 }} />
                            <div className={styles.corner} style={{ bottom: 0, left: 0 }} />
                            <div className={styles.corner} style={{ bottom: 0, right: 0 }} />
                        </div>
                        <div className={styles.scanLine} />
                    </div>
                )}
            </div>

            <div className={styles.instructions}>
                {isScanning ? (
                    <p className="pulse">QRコードをスキャン中...</p>
                ) : (
                    <p>QRコードをカメラに向けてください</p>
                )}
            </div>
        </div>
    );
}
