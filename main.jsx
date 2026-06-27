import React, {useEffect, useMemo, useRef, useState} from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Star, Plus, Music, Mic2, Settings, Play, Pause, Upload, Download, Minus, PlusCircle } from 'lucide-react';
import './style.css';

const STORAGE_KEY = 'alex_guitar_songbook_v1';
const NOTE_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_TO_SHARP = {Db:'C#', Eb:'D#', Gb:'F#', Ab:'G#', Bb:'A#'};
const demoData = {
  artists: [
    { id:'a1', name:'Παράδειγμα Τραγουδιστής', songs:[
      { id:'s1', title:'Το πρώτο μου τραγούδι', key:'Am', bpm:78, favorite:true, body:`[Am]Στίχος γραμμένος εδώ για [G]προσωπική χρήση\n[F]Και οι συγχορδίες μπαίνουν [E]μέσα στη γραμμή\n\n[Am]Ρεφρέν εδώ [G]με μεγάλα γράμματα\n[F]Για να φαίνεται καθαρά στο [E]live` },
      { id:'s2', title:'Ζεϊμπέκικο Demo', key:'Dm', bpm:64, favorite:false, body:`[Dm]Πρώτη γραμμή τραγουδιού\n[Gm]Δεύτερη γραμμή με συγχορδία\n[A]Κλείσιμο στο ρεφρέν [Dm]ξανά` }
    ]}
  ]
};
function loadData(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || demoData } catch { return demoData }}
function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function transposeChord(chord, steps){
  return chord.replace(/([A-G](?:#|b)?)(m|maj|min|dim|aug|sus|add|7|9|11|13|\/)?/g, (m, root, suffix='') => {
    const clean = FLAT_TO_SHARP[root] || root;
    const idx = NOTE_ORDER.indexOf(clean); if(idx < 0) return m;
    return NOTE_ORDER[(idx + steps + 120) % 12] + suffix;
  });
}
function renderChordLine(text, steps){
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((p,i)=> p.startsWith('[') ? <span key={i} className="chord">{transposeChord(p.slice(1,-1), steps)}</span> : <span key={i}>{p}</span>);
}
function App(){
  const [data,setData] = useState(loadData);
  const [query,setQuery]=useState('');
  const [artistId,setArtistId]=useState(data.artists[0]?.id||'');
  const [songId,setSongId]=useState(data.artists[0]?.songs[0]?.id||'');
  const [steps,setSteps]=useState(0);
  const [tab,setTab]=useState('songs');
  const [auto,setAuto]=useState(false);
  const [speed,setSpeed]=useState(1.2);
  const viewerRef=useRef(null);
  useEffect(()=>saveData(data),[data]);
  useEffect(()=>{ if(!auto) return; const t=setInterval(()=>{ viewerRef.current?.scrollBy({top:speed, behavior:'auto'}); }, 45); return()=>clearInterval(t);},[auto,speed]);
  const artist=data.artists.find(a=>a.id===artistId) || data.artists[0];
  const songs = artist?.songs || [];
  const song=songs.find(s=>s.id===songId) || songs[0];
  const filteredArtists=data.artists.filter(a=>a.name.toLowerCase().includes(query.toLowerCase()));
  function toggleFav(){ updateSong({...song, favorite:!song.favorite}); }
  function updateSong(newSong){ setData(d=>({artists:d.artists.map(a=>a.id===artist.id?{...a,songs:a.songs.map(s=>s.id===song.id?newSong:s)}:a)})); }
  function addArtist(){ const name=prompt('Όνομα τραγουδιστή;'); if(!name) return; const id=crypto.randomUUID(); setData(d=>({artists:[...d.artists,{id,name,songs:[]}]})); setArtistId(id); setSongId(''); }
  function addSong(){ if(!artist) return; const title=prompt('Τίτλος τραγουδιού;'); if(!title) return; const ns={id:crypto.randomUUID(), title, key:'', bpm:'', favorite:false, body:'[Am]Γράψε εδώ στίχους και συγχορδίες'}; setData(d=>({artists:d.artists.map(a=>a.id===artist.id?{...a,songs:[...a.songs,ns]}:a)})); setSongId(ns.id); setTab('edit'); }
  function importJson(e){ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{setData(JSON.parse(r.result)); alert('Έγινε εισαγωγή.')}catch{alert('Λάθος αρχείο JSON')}}; r.readAsText(f); }
  function exportJson(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='songbook-backup.json'; a.click(); }
  return <div className="app">
    <aside className="sidebar">
      <h1><Music/> Live Songbook</h1>
      <div className="search"><Search size={18}/><input placeholder="Αναζήτηση τραγουδιστή" value={query} onChange={e=>setQuery(e.target.value)}/></div>
      <button className="add" onClick={addArtist}><Plus size={16}/> Νέος τραγουδιστής</button>
      <div className="artistList">{filteredArtists.map(a=><button key={a.id} className={a.id===artist?.id?'active':''} onClick={()=>{setArtistId(a.id); setSongId(a.songs[0]?.id||'')}}><Mic2 size={16}/>{a.name}</button>)}</div>
    </aside>
    <main>
      <nav className="top"><button onClick={()=>setTab('songs')} className={tab==='songs'?'on':''}>Τραγούδια</button><button onClick={()=>setTab('live')} className={tab==='live'?'on':''}>Live</button><button onClick={()=>setTab('edit')} className={tab==='edit'?'on':''}>Επεξεργασία</button><button onClick={()=>setTab('settings')} className={tab==='settings'?'on':''}><Settings size={16}/></button></nav>
      {tab==='songs'&&<section><div className="sectionHeader"><h2>{artist?.name||'Δεν υπάρχει τραγουδιστής'}</h2><button className="primary" onClick={addSong}><Plus size={16}/> Νέο τραγούδι</button></div><div className="songGrid">{songs.map(s=><button key={s.id} onClick={()=>{setSongId(s.id); setTab('live')}} className="songCard"><b>{s.favorite?'⭐ ':''}{s.title}</b><span>{s.key||'Χωρίς τόνο'} {s.bpm?`• ${s.bpm} bpm`:''}</span></button>)}</div></section>}
      {tab==='live'&&song&&<section className="live"><div className="liveBar"><div><h2>{song.title}</h2><p>{artist.name} • τόνος {song.key||'-'}</p></div><button onClick={toggleFav}><Star fill={song.favorite?'currentColor':'none'}/></button></div><div className="controls"><button onClick={()=>setSteps(steps-1)}><Minus/> Transpose</button><b>{steps>0?`+${steps}`:steps}</b><button onClick={()=>setSteps(steps+1)}><PlusCircle/> Transpose</button><button className="primary" onClick={()=>setAuto(!auto)}>{auto?<Pause/>:<Play/>}{auto?'Παύση':'Auto scroll'}</button><input type="range" min="0.4" max="5" step="0.2" value={speed} onChange={e=>setSpeed(Number(e.target.value))}/></div><article className="viewer" ref={viewerRef}>{song.body.split('\n').map((line,i)=><p key={i}>{renderChordLine(line,steps)}</p>)}</article></section>}
      {tab==='edit'&&song&&<section><h2>Επεξεργασία</h2><input className="bigInput" value={song.title} onChange={e=>updateSong({...song,title:e.target.value})}/><input className="bigInput" placeholder="Τόνος π.χ. Am" value={song.key} onChange={e=>updateSong({...song,key:e.target.value})}/><textarea value={song.body} onChange={e=>updateSong({...song,body:e.target.value})}/><p className="hint">Γράψε συγχορδίες μέσα σε αγκύλες: [Am]Στίχος [G]εδώ</p></section>}
      {tab==='settings'&&<section><h2>Backup / Hosting</h2><button onClick={exportJson}><Download/> Εξαγωγή JSON</button><label className="file"><Upload/> Εισαγωγή JSON<input type="file" accept=".json" onChange={importJson}/></label><p className="hint">Ανεβαίνει σε Vercel/Netlify σαν hosted web app. Για κανονικό Apple Watch app χρειάζεται Xcode project και TestFlight/App Store.</p></section>}
    </main>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
