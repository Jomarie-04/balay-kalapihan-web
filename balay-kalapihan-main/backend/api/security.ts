// pages/api/admin/security.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin authentication here
    const adminId = 'admin-id'; // Get from session/JWT
    
    if (req.method === 'GET') {
      // Get sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('admin_id', adminId)
        .order('login_time', { ascending: false })
        .limit(10);
      
      // Get audit log
      const { data: auditLog, error: auditError } = await supabase
        .from('admin_audit_log')
        .select('*')
        .eq('admin_id', adminId)
        .order('timestamp', { ascending: false })
        .limit(50);
      
      // Get security log
      const { data: securityLog, error: securityError } = await supabase
        .from('admin_security_log')
        .select('*')
        .eq('admin_id', adminId)
        .single();
      
      if (sessionsError || auditError || securityError) {
        throw sessionsError || auditError || securityError;
      }
      
      return res.status(200).json({
        sessions: sessions || [],
        auditLog: auditLog || [],
        securityLog: securityLog || null
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Security API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
