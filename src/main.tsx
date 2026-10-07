import {lazy,Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';
const Author=lazy(()=>import('./AuthorApp'));
const Runtime=lazy(()=>import('./Runtime').then(m=>({default:m.Runtime})));
const match=/^\/view\/([a-f0-9-]{36})$/.exec(location.pathname);
createRoot(document.getElementById('root')!).render(<Suspense fallback={<p className="application-loading" role="status">Loading studio…</p>}>{match?<Runtime releaseId={match[1]}/>:<Author/>}</Suspense>);
