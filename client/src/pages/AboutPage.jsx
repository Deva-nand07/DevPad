import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Code2, Layers, Database, Cpu } from 'lucide-react';

function useForceDark() {
  useEffect(() => {
    document.body.classList.remove('light-mode');
    return () => {
      const saved = localStorage.getItem('devpad_theme');
      if (saved === 'light') document.body.classList.add('light-mode');
    };
  }, []);
}

const STACK = [
  { icon: Code2,     label: 'React.js 19',          desc: 'Frontend UI with hooks & routing', color: '#00d4ff' },
  { icon: Layers,   label: 'Node.js + Express 5',  desc: 'RESTful backend API', color: '#10b981' },
  { icon: Database, label: 'MongoDB + Mongoose 9',  desc: 'NoSQL database for users, notes & code', color: '#a855f7' },
  { icon: Cpu,      label: 'Judge0 CE',             desc: 'Open-source sandboxed code execution', color: '#f59e0b' },
];

export default function AboutPage() {
  useForceDark();
  const navigate = useNavigate();

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#e8e8f0', paddingBottom: 60 }}>
      <nav style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 48px',borderBottom:'1px solid #1e1e35' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,cursor:'pointer' }} onClick={() => navigate('/')}>
          <img src="/devpad_logo.png" alt="DevPad" style={{ width:32,height:32,borderRadius:8,objectFit:'cover' }} />
          <span style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:20,color:'#fff' }}>Dev<span style={{ background:'linear-gradient(135deg,#00d4ff,#a855f7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>Pad</span></span>
        </div>
        <button onClick={() => navigate('/')} style={{ display:'flex',alignItems:'center',gap:6,background:'transparent',border:'1px solid #1e1e35',borderRadius:8,padding:'8px 16px',color:'#8888aa',cursor:'pointer',fontFamily:'Space Grotesk,sans-serif',fontSize:14,transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='#a855f7';e.currentTarget.style.color='#e8e8f0';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e35';e.currentTarget.style.color='#8888aa';}}
        ><ArrowLeft size={14}/> Back</button>
      </nav>

      <div style={{ maxWidth:900,margin:'0 auto',padding:'60px 48px' }}>
        <div style={{ textAlign:'center',marginBottom:64 }}>
          <div style={{ fontFamily:'JetBrains Mono,monospace',color:'#00d4ff',fontSize:12,letterSpacing:3,marginBottom:16 }}>// ABOUT</div>
          <h1 style={{ fontFamily:'Syne,sans-serif',fontSize:'clamp(36px,6vw,60px)',fontWeight:800,color:'#fff',marginBottom:16 }}>
            About <span style={{ background:'linear-gradient(135deg,#00d4ff,#a855f7)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent' }}>DevPad</span>
          </h1>
          <p style={{ color:'#8888aa',fontSize:17,lineHeight:1.8,maxWidth:600,margin:'0 auto' }}>
            DevPad is a MERN stack web application built as a Six Months Industrial Training project at MITS Academy, Amritsar — a division of MITS Solutions Pvt. Ltd., Bangalore.
          </p>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:24,marginBottom:64 }}>
          {[
            { title:'The Problem', text:'Students preparing for coding interviews constantly switch between multiple tools — a code editor, a notes app, and an online compiler. This fragmented workflow destroys focus and productivity.', color:'#ef4444' },
            { title:'The Solution', text:'DevPad consolidates everything into one authenticated workspace. Write code, take notes, execute programs, and track your time — all without switching tabs.', color:'#10b981' },
            { title:"Who It's For", text:'DevPad is designed for CS students, self-taught developers, and anyone preparing for technical interviews who wants a clean, distraction-free coding environment.', color:'#00d4ff' },
            { title:'Open Source', text:'The project is open source and hosted on GitHub. Contributions, suggestions, and feedback are always welcome. Check out the repository and give it a star!', color:'#a855f7' },
          ].map(card => (
            <div key={card.title} style={{ background:'#13131f',border:'1px solid #1e1e35',borderRadius:16,padding:28,transition:'all 0.3s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=card.color+'44';e.currentTarget.style.transform='translateY(-3px)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e35';e.currentTarget.style.transform='translateY(0)';}}
            >
              <h3 style={{ fontWeight:700,fontSize:17,color:'#fff',marginBottom:12,borderLeft:`3px solid ${card.color}`,paddingLeft:12 }}>{card.title}</h3>
              <p style={{ color:'#8888aa',fontSize:14,lineHeight:1.7 }}>{card.text}</p>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:64 }}>
          <h2 style={{ fontFamily:'Syne,sans-serif',fontSize:28,fontWeight:800,color:'#fff',textAlign:'center',marginBottom:32 }}>Tech Stack</h2>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16 }}>
            {STACK.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ background:'#13131f',border:'1px solid #1e1e35',borderRadius:12,padding:20,textAlign:'center',transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=s.color+'44';e.currentTarget.style.transform='translateY(-3px)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e35';e.currentTarget.style.transform='translateY(0)';}}
                >
                  <div style={{ width:44,height:44,borderRadius:10,background:s.color+'1a',border:`1px solid ${s.color}33`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px' }}>
                    <Icon size={20} style={{ color:s.color }} />
                  </div>
                  <div style={{ fontWeight:700,fontSize:14,color:'#e8e8f0',marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:12,color:'#8888aa' }}>{s.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background:'linear-gradient(135deg,rgba(0,212,255,0.05),rgba(168,85,247,0.05))',border:'1px solid #2a2a4a',borderRadius:20,padding:40,textAlign:'center' }}>
          <div style={{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#00d4ff,#a855f7)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:24,color:'#0a0a0f' }}>D</div>
          <h3 style={{ fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:'#fff',marginBottom:4 }}>Deva Nand</h3>
          <p style={{ color:'#8888aa',fontSize:14,marginBottom:16 }}>B.Tech Computer Science & Engineering<br/>Guru Nanak Dev University, Amritsar</p>
          <p style={{ color:'#8888aa',fontSize:13,marginBottom:20 }}>Industrial Training @ MITS Academy, Amritsar</p>
          <a href="https://github.com/Deva-nand07/DevPad" target="_blank" rel="noreferrer"
            style={{ display:'inline-flex',alignItems:'center',gap:8,background:'#13131f',border:'1px solid #2a2a4a',borderRadius:8,padding:'10px 20px',color:'#e8e8f0',textDecoration:'none',fontSize:14,fontWeight:600,transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#a855f7';e.currentTarget.style.color='#a855f7';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#2a2a4a';e.currentTarget.style.color='#e8e8f0';}}
          ><GitBranch size={16}/> View on GitHub</a>
        </div>
      </div>
    </div>
  );
}
