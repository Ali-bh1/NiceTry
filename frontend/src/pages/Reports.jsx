// import { useState } from 'react';
// import { Flag, Send, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
// import { api } from '../services/api.js';

// const CATEGORIES = [
//   { value: 'credential_harvesting', label: 'Credential Harvesting', desc: 'Fake login pages stealing passwords' },
//   { value: 'brand_impersonation', label: 'Brand Impersonation', desc: 'Sites posing as known companies' },
//   { value: 'scam', label: 'Scam / Fraud', desc: 'Financial scams or fake offers' },
//   { value: 'malware', label: 'Malware Distribution', desc: 'Sites distributing malicious software' },
//   { value: 'other', label: 'Other', desc: 'Other suspicious activity' },
// ];

// export default function Reports() {
//   const [url, setUrl] = useState('');
//   const [category, setCategory] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [result, setResult] = useState(null);
//   const [error, setError] = useState('');

//   async function handleSubmit(e) {
//     e.preventDefault();
//     if (!url.trim() || !category) return;
//     setLoading(true);
//     setError('');
//     setResult(null);

//     try {
//       const data = await api.reportDomain(url.trim(), category);
//       setResult(data);
//       setUrl('');
//       setCategory('');
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
//       {/* ── Header ── */}
//       <div className="text-center">
//         <div
//           className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
//           style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-start), var(--color-brand-gradient-end))' }}
//         >
//           <Flag size={24} className="text-white" />
//         </div>
//         <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Report Phishing Domain</h2>
//         <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
//           Help protect the community by reporting suspected phishing sites.
//           Your reports are scored by our ML trust algorithm and reviewed by analysts.
//         </p>
//       </div>

//       {/* ── Report Form ── */}
//       <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
//         {/* URL */}
//         <div>
//           <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
//             Suspicious URL
//           </label>
//           <input
//             type="text"
//             value={url}
//             onChange={(e) => setUrl(e.target.value)}
//             placeholder="https://suspicious-site.example.com"
//             className="input-dark"
//             disabled={loading}
//             required
//           />
//         </div>

//         {/* Category */}
//         <div>
//           <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
//             Threat Category
//           </label>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
//             {CATEGORIES.map((cat) => (
//               <button
//                 key={cat.value}
//                 type="button"
//                 onClick={() => setCategory(cat.value)}
//                 className="text-left p-3 rounded-lg transition-all duration-200"
//                 style={{
//                   background: category === cat.value ? 'var(--color-accent-glow)' : 'var(--color-bg-primary)',
//                   border: `1px solid ${category === cat.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
//                 }}
//               >
//                 <p className="text-sm font-medium" style={{ color: category === cat.value ? 'var(--color-accent-hover)' : 'var(--color-text-primary)' }}>
//                   {cat.label}
//                 </p>
//                 <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{cat.desc}</p>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Submit */}
//         <button
//           type="submit"
//           className="btn-primary w-full flex items-center justify-center gap-2"
//           disabled={loading || !url.trim() || !category}
//         >
//           {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
//           {loading ? 'Submitting...' : 'Submit Report'}
//         </button>
//       </form>

//       {/* ── Error ── */}
//       {error && (
//         <div className="glass-card p-4 flex items-center gap-3" style={{ borderColor: 'var(--color-risk-danger)' }}>
//           <AlertTriangle size={18} style={{ color: 'var(--color-risk-danger)' }} />
//           <p className="text-sm" style={{ color: 'var(--color-risk-danger)' }}>{error}</p>
//         </div>
//       )}

//       {/* ── Success ── */}
//       {result && (
//         <div className="glass-card p-6" style={{ borderColor: 'var(--color-risk-safe)' }}>
//           <div className="flex items-center gap-3 mb-4">
//             <CheckCircle size={24} style={{ color: 'var(--color-risk-safe)' }} />
//             <h3 className="text-base font-semibold" style={{ color: 'var(--color-risk-safe)' }}>Report Submitted</h3>
//           </div>
//           <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
//             <p>Report ID: <strong className="font-mono" style={{ color: 'var(--color-text-primary)' }}>#{result.report_id}</strong></p>
//             <p>Trust Score: <strong style={{ color: 'var(--color-risk-caution)' }}>{(result.trust_score * 100).toFixed(0)}%</strong></p>
//             <p>Status: <strong style={{ color: 'var(--color-risk-caution)' }}>{result.status}</strong></p>
//             <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>{result.message}</p>
//           </div>
//         </div>
//       )}

//       {/* ── How it works ── */}
//       <div className="glass-card p-5">
//         <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>How Report Scoring Works</h3>
//         <div className="space-y-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
//           <div className="flex gap-3">
//             <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)' }}>1</span>
//             <p><strong style={{ color: 'var(--color-text-secondary)' }}>ML Confidence</strong> — Our 7-layer pipeline analyzes the URL independently</p>
//           </div>
//           <div className="flex gap-3">
//             <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)' }}>2</span>
//             <p><strong style={{ color: 'var(--color-text-secondary)' }}>Reporter History</strong> — Your past reporting accuracy contributes to trust</p>
//           </div>
//           <div className="flex gap-3">
//             <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)' }}>3</span>
//             <p><strong style={{ color: 'var(--color-text-secondary)' }}>Community Corroboration</strong> — Multiple reports from different users increase confidence</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export default function Reports() {
  return <ComingSoon title="Reports" description="Detailed phishing reports, export options, and community-submitted threat data." />;
}

function ComingSoon({ title, description }) {
  return (
    <div style={{ maxWidth: '600px', margin: '120px auto', padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: '12px', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
        Coming soon
      </div>
      <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.5px', color: '#111', marginBottom: '14px' }}>{title}</h1>
      <p style={{ fontSize: '15px', color: '#888', lineHeight: 1.7 }}>{description}</p>
      <div style={{ marginTop: '32px', width: '40px', height: '2px', background: '#e5e5e5', margin: '32px auto 0' }} />
    </div>
  );
}