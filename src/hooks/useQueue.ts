import { useState } from 'react';
import { apiPath } from '../config/api';

// Interfaces mapping to Backend DTOs
export interface IQueueAction {
  code: string;
  label: string;
  color?: string;
  actionType?: string;
}

// ใช้ apiPath เพื่ออิง BASE จาก .env และหลีกเลี่ยงการฮาร์ดโค้ดพอร์ต

export const useQueue = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch allowed next states based on current state
  const getNextActions = async (docNo: string, industry: string): Promise<IQueueAction[]> => {
    try {
      const response = await fetch(apiPath(`/api/staff/console/actions?docNo=${docNo}&industry=${industry}`));
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      // Map backend response to frontend interface
      return data.actions.map((a: any) => ({
        code: a.targetState,
        label: a.label,
        color: a.color,
        actionType: a.actionType
      }));
    } catch (err) {
      console.error(err);
      setError('Failed to fetch actions');
      return [];
    }
  };

  const updateState = async (docNo: string, targetState: string, industry: string) => {
    setLoading(true);
    try {
      console.log(`Updating ${docNo} to ${targetState}`);
      const response = await fetch(apiPath('/api/staff/console/execute'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docNo,
          action: targetState,
          industry
        }),
      });
      
      if (!response.ok) throw new Error('Update failed');
      return true;
    } catch (err) {
      setError('Update failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    getNextActions,
    updateState,
    loading,
    error
  };
};
