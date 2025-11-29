'use client';

import { useEffect, useState } from 'react';
import liff from '@line/liff';

export default function LiffRegister() {
  const [profile, setProfile] = useState<any>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize LIFF
    liff.init({ liffId: '2008589623-XooNWxQN' })
      .then(() => {
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          // Get user profile
          liff.getProfile().then(profile => {
            setProfile(profile);
          });
        }
      })
      .catch(err => console.error('LIFF init failed', err));
  }, []);

  const handleRegister = async () => {
    if (!employeeId || !profile) return;

    setLoading(true);
    try {
      // บันทึก LINE User ID กับ Employee ID ลง Supabase
      const response = await fetch('/api/employees/register-line', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl
        })
      });

      if (response.ok) {
        alert('ลงทะเบียนสำเร็จ!');
        liff.closeWindow();
      } else {
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-md mx-auto mt-10 p-6 glass rounded-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">
          ลงทะเบียน LINE ID
        </h1>

        {profile && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
            <img
              src={profile.pictureUrl}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full mx-auto mb-2"
            />
            <p className="text-center text-white">{profile.displayName}</p>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            รหัสพนักงาน
          </label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="กรอกรหัสพนักงาน"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
          />
        </div>

        <button
          onClick={handleRegister}
          disabled={loading || !employeeId}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'กำลังลงทะเบียน...' : 'ลงทะเบียน'}
        </button>
      </div>
    </div>
  );
}
