import { Mail, Phone, GraduationCap, Hash } from 'lucide-react';

function LinkedinIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const TEAM = [
  { firstName: 'Shubham', lastName: 'Yedve',  seatNo: '23CE1017', phone: '9619723575', collegeEmail: 'shu.yed.rt23@dypatil.edu', personalEmail: 'yedveshubham@gmail.com',    initials: 'SY' },
  { firstName: 'Ali',     lastName: 'Bhatkar', seatNo: '23CE1247', phone: '8668918928', collegeEmail: 'ali.bha.rt23@dypatil.edu', personalEmail: 'alibhatkar.ab@gmail.com',  initials: 'AB' },
  { firstName: 'Aryan',   lastName: 'Bhanage', seatNo: '23CE1134', phone: '8591270210', collegeEmail: 'ary.bha.rt23@dypatil.edu', personalEmail: 'aryanbhanage4648@gmail.com', initials: 'AB' },
  { firstName: 'Jignesh', lastName: 'Parmar',  seatNo: '23CE1288', phone: '9321153856', collegeEmail: 'jig.par.rt23@dypatil.edu', personalEmail: 'jigneshparmar1024@gmail.com', initials: 'JP' },
];

function TeamCard({ m }) {
  return (
    <div style={{ border: '1px solid #1e1e1e', borderRadius: '8px', overflow: 'hidden', background: '#111' }}>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '6px',
            background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#ff5500', fontFamily: 'monospace',
          }}>
            {m.initials}
          </div>
          <a
            href={`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(m.firstName + ' ' + m.lastName + ' DY Patil')}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', border: '1px solid #222', borderRadius: '5px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ff5500'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ff5500'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#222'; }}
          >
            <LinkedinIcon size={15} />
          </a>
        </div>

        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', marginBottom: '2px' }}>
          {m.firstName} {m.lastName}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '14px' }}>
          <GraduationCap size={12} color="#333" />
          <span style={{ fontSize: '12px', color: '#444', fontFamily: 'monospace' }}>Computer Engineering, DY Patil</span>
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '2px 0' }}>
          {[
            { icon: Hash, label: 'Seat No',  value: m.seatNo,         href: null },
            { icon: Mail, label: 'College',  value: m.collegeEmail,   href: `mailto:${m.collegeEmail}` },
            { icon: Mail, label: 'Personal', value: m.personalEmail,  href: `mailto:${m.personalEmail}` },
            { icon: Phone,label: 'Phone',    value: `+91 ${m.phone}`, href: `tel:+91${m.phone}` },
          ].map(({ icon: Icon, label, value, href }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderBottom: '1px solid #1a1a1a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={11} color="#333" />
                <span style={{ fontSize: '11px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{label}</span>
              </div>
              {href
                ? <a href={href} style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => e.target.style.color = '#ff5500'}
                    onMouseLeave={e => e.target.style.color = '#666'}>{value}</a>
                : <span style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>{value}</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 32px' }}>
      <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'monospace' }}>About</p>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', letterSpacing: '-0.3px', color: '#f0f0f0' }}>NiceTry</h1>
      <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.75, maxWidth: '560px', marginBottom: '32px' }}>
        A multi-layer AI-powered phishing detection platform. Our 7-layer pipeline analyzes URLs
        in real-time to detect, explain, and prevent phishing attacks.
      </p>

      <div style={{
        display: 'flex', gap: '32px', padding: '20px 24px',
        border: '1px solid #1e1e1e', borderRadius: '8px',
        marginBottom: '40px', flexWrap: 'wrap', background: '#111',
      }}>
        {[
          { label: 'University', value: 'DY Patil College of Engineering' },
          { label: 'Department', value: 'Computer Engineering' },
          { label: 'Pipeline',   value: '7-Layer AI Detection' },
          { label: 'Status',     value: 'Active' },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: '11px', color: '#444', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: label === 'Status' ? '#ff5500' : '#ccc' }}>{value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#ccc', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>Team</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {TEAM.map(m => <TeamCard key={m.seatNo} m={m} />)}
      </div>
    </div>
  );
}
