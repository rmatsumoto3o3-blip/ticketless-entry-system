'use client';

import { useEffect, useState } from 'react';
import { getDashboard, type DashboardData } from '@/lib/gasApi';
import styles from './Dashboard.module.css';

export default function Dashboard() {
    const [data, setData] = useState<DashboardData>({
        total: 0,
        checkedIn: 0,
        notCheckedIn: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const result = await getDashboard();
        setData(result);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchData, 5000);

        return () => clearInterval(interval);
    }, []);

    const percentage = data.total > 0
        ? Math.round((data.checkedIn / data.total) * 100)
        : 0;

    return (
        <div className={styles.dashboard}>
            <h2 className={styles.title}>入場状況 / Check-in Status</h2>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statValue}>{data.total}</div>
                    <div className={styles.statLabel}>総参加者 / Total</div>
                </div>

                <div className={`${styles.statCard} ${styles.success}`}>
                    <div className={styles.statValue}>{data.checkedIn}</div>
                    <div className={styles.statLabel}>入場済 / Checked In</div>
                </div>

                <div className={`${styles.statCard} ${styles.pending}`}>
                    <div className={styles.statValue}>{data.notCheckedIn}</div>
                    <div className={styles.statLabel}>未入場 / Pending</div>
                </div>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            <div className={styles.percentage}>{percentage}% 入場完了</div>

            {loading && (
                <div className={styles.refreshIndicator}>
                    <div className="spinner" />
                </div>
            )}
        </div>
    );
}
