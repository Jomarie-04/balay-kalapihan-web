import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const adminId = 'admin-placeholder'; // TODO: Get from JWT
      
      const [{ data: sessions }, { data: auditLog }, { data: securityLog }] = await Promise.all([
        supabase.from('admin_sessions').select('*').eq('admin_id', adminId).order('login_time', { ascending: false }).limit(10),
        supabase.from('admin_audit_log').select('*').eq('admin_id', adminId).order('timestamp', { ascending: false }).limit(50),
        supabase.from('admin_security_log').select('*').eq('admin_id', adminId).single()
      ]);
      
      res.status(200).json({
        sessions: sessions || [],
        auditLog: auditLog || [],
        securityLog: securityLog || null
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
