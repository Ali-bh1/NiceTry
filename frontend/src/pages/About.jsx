import { Mail, Phone, GraduationCap, Hash } from 'lucide-react';

function LinkedinIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const TEAM_MEMBERS = [
  {
    firstName: 'Shubham',
    lastName: 'Yedve',
    seatNo: '23CE1017',
    phone: '9619723575',
    collegeEmail: 'shu.yed.rt23@dypatil.edu',
    personalEmail: 'yedveshubham@gmail.com',
    department: 'Computer Engineering',
    initials: 'SY',
    gradient: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
  },
  {
    firstName: 'Ali',
    lastName: 'Bhatkar',
    seatNo: '23CE1247',
    phone: '8668918928',
    collegeEmail: 'ali.bha.rt23@dypatil.edu',
    personalEmail: 'alibhatkar.ab@gmail.com',
    department: 'Computer Engineering',
    initials: 'AB',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  },
  {
    firstName: 'Aryan',
    lastName: 'Bhanage',
    seatNo: '23CE1134',
    phone: '8591270210',
    collegeEmail: 'ary.bha.rt23@dypatil.edu',
    personalEmail: 'aryanbhanage4648@gmail.com',
    department: 'Computer Engineering',
    initials: 'AB',
    gradient: 'linear-gradient(135deg, #10b981, #3b82f6)',
  },
  {
    firstName: 'Jignesh',
    lastName: 'Parmar',
    seatNo: '23CE1288',
    phone: '9321153856',
    collegeEmail: 'jig.par.rt23@dypatil.edu',
    personalEmail: 'jigneshparmar1024@gmail.com',
    department: 'Computer Engineering',
    initials: 'JP',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
];

function linkedInSearchUrl(firstName, lastName) {
  return `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${firstName} ${lastName} DY Patil`)}`;
}

function TeamCard({ member }) {
  const fullName = `${member.firstName} ${member.lastName}`;

  return (
    <div className="glass-card group" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Gradient header strip */}
      <div
        style={{
          height: '6px',
          background: member.gradient,
          transition: 'height 0.3s ease',
        }}
        className="group-hover:h-2"
      />

      <div style={{ padding: '1.5rem' }}>
        {/* Avatar + LinkedIn */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="flex items-center justify-center rounded-xl text-white font-bold text-lg"
            style={{
              width: '56px',
              height: '56px',
              background: member.gradient,
              boxShadow: `0 8px 24px ${member.gradient.includes('#3b82f6') ? 'rgba(59,130,246,0.3)' : 'rgba(139,92,246,0.3)'}`,
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            }}
          >
            {member.initials}
          </div>
          <a
            href={linkedInSearchUrl(member.firstName, member.lastName)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Find ${fullName} on LinkedIn`}
            className="flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
              width: '40px',
              height: '40px',
              background: 'rgba(10, 102, 194, 0.15)',
              border: '1px solid rgba(10, 102, 194, 0.3)',
              color: '#0a66c2',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#0a66c2';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(10,102,194,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(10, 102, 194, 0.15)';
              e.currentTarget.style.color = '#0a66c2';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <LinkedinIcon size={20} />
          </a>
        </div>

        {/* Name */}
        <h3
          className="text-lg font-bold tracking-tight mb-1"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {fullName}
        </h3>

        {/* Department */}
        <div className="flex items-center gap-1.5 mb-4">
          <GraduationCap size={13} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {member.department}
          </span>
        </div>

        {/* Info grid */}
        <div
          className="rounded-lg"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            padding: '0.75rem',
          }}
        >
          {/* Seat number */}
          <div
            className="flex items-center justify-between py-1.5"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <Hash size={12} style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Seat No</span>
            </div>
            <span
              className="text-xs font-mono font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {member.seatNo}
            </span>
          </div>

          {/* College email */}
          <div
            className="flex items-center justify-between py-1.5"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>College</span>
            </div>
            <a
              href={`mailto:${member.collegeEmail}`}
              className="text-xs font-mono hover:underline"
              style={{ color: 'var(--color-accent-hover)' }}
            >
              {member.collegeEmail}
            </a>
          </div>

          {/* Personal email */}
          <div
            className="flex items-center justify-between py-1.5"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: 'var(--color-risk-caution)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Personal</span>
            </div>
            <a
              href={`mailto:${member.personalEmail}`}
              className="text-xs font-mono hover:underline"
              style={{ color: 'var(--color-accent-hover)' }}
            >
              {member.personalEmail}
            </a>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <Phone size={12} style={{ color: 'var(--color-risk-safe)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Phone</span>
            </div>
            <a
              href={`tel:+91${member.phone}`}
              className="text-xs font-mono hover:underline"
              style={{ color: 'var(--color-accent-hover)' }}
            >
              +91 {member.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          About NiceTry
        </h1>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
          NiceTry is a multi-layer AI-powered phishing detection platform built to protect users
          from sophisticated online threats. Our 7-layer pipeline analyzes URLs in real-time to
          detect, explain, and prevent phishing attacks before they succeed.
        </p>
      </div>

      {/* Project info card */}
      <div
        className="glass-card"
        style={{ padding: '1.25rem' }}
      >
        <div className="flex flex-wrap items-center gap-6">
          {[
            { label: 'Domain', value: 'nicetry.site' },
            { label: 'University', value: 'DY Patil College of Engineering' },
            { label: 'Department', value: 'Computer Engineering' },
            { label: 'Pipeline', value: '7-Layer AI Detection' },
          ].map(({ label, value }) => (
            <div key={label}>
              <span className="text-xs block" style={{ color: 'var(--color-text-muted)' }}>
                {label}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Team Section */}
      <div>
        <h2
          className="text-lg font-semibold tracking-tight mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Our Team
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEAM_MEMBERS.map((member) => (
            <TeamCard key={member.seatNo} member={member} />
          ))}
        </div>
      </div>
    </div>
  );
}
