'use client';

import { useState } from 'react';
import { manualCheckIn } from '@/lib/gasApi';
import styles from './ManualCheckIn.module.css';

interface ManualCheckInProps {
    onCheckIn: (result: any) => void;
}

export default function ManualCheckIn({ onCheckIn }: ManualCheckInProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [memberId, setMemberId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId.trim()) return;

        setLoading(true);
        try {
            const result = await manualCheckIn(memberId);
            onCheckIn(result);
            setMemberId('');
            setIsOpen(false);
        } catch (error) {
            console.error('Manual check-in error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                className="btn-secondary"
                onClick={() => setIsOpen(true)}
                style={{ width: '100%', marginTop: '1rem' }}
            >
                手動チェックイン / Manual Check-in
            </button>
        );
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h3 className={styles.title}>手動チェックイン</h3>

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="memberId">会員ID / Member ID</label>
                        <input
                            id="memberId"
                            type="text"
                            value={memberId}
                            onChange={(e) => setMemberId(e.target.value)}
                            placeholder="例: M001"
                            autoFocus
                        />
                    </div>

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setIsOpen(false)}
                            disabled={loading}
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !memberId.trim()}
                        >
                            {loading ? '処理中...' : 'チェックイン'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
