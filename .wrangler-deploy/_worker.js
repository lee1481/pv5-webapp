var Ct=Object.defineProperty;var We=e=>{throw TypeError(e)};var Dt=(e,t,r)=>t in e?Ct(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r;var h=(e,t,r)=>Dt(e,typeof t!="symbol"?t+"":t,r),Fe=(e,t,r)=>t.has(e)||We("Cannot "+r);var o=(e,t,r)=>(Fe(e,t,"read from private field"),r?r.call(e):t.get(e)),x=(e,t,r)=>t.has(e)?We("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),f=(e,t,r,n)=>(Fe(e,t,"write to private field"),n?n.call(e,r):t.set(e,r),r),P=(e,t,r)=>(Fe(e,t,"access private method"),r);var Ye=(e,t,r,n)=>({set _(s){f(e,t,s,r)},get _(){return o(e,t,n)}});var Qe=(e,t,r)=>(n,s)=>{let a=-1;return i(0);async function i(d){if(d<=a)throw new Error("next() called multiple times");a=d;let c,l=!1,u;if(e[d]?(u=e[d][0][0],n.req.routeIndex=d):u=d===e.length&&s||void 0,u)try{c=await u(n,()=>i(d+1))}catch(p){if(p instanceof Error&&t)n.error=p,c=await t(p,n),l=!0;else throw p}else n.finalized===!1&&r&&(c=await r(n));return c&&(n.finalized===!1||l)&&(n.res=c),n}},Mt=Symbol(),It=async(e,t=Object.create(null))=>{const{all:r=!1,dot:n=!1}=t,a=(e instanceof mt?e.raw.headers:e.headers).get("Content-Type");return a!=null&&a.startsWith("multipart/form-data")||a!=null&&a.startsWith("application/x-www-form-urlencoded")?$t(e,{all:r,dot:n}):{}};async function $t(e,t){const r=await e.formData();return r?Ht(r,t):{}}function Ht(e,t){const r=Object.create(null);return e.forEach((n,s)=>{t.all||s.endsWith("[]")?Vt(r,s,n):r[s]=n}),t.dot&&Object.entries(r).forEach(([n,s])=>{n.includes(".")&&(Ft(r,n,s),delete r[n])}),r}var Vt=(e,t,r)=>{e[t]!==void 0?Array.isArray(e[t])?e[t].push(r):e[t]=[e[t],r]:t.endsWith("[]")?e[t]=[r]:e[t]=r},Ft=(e,t,r)=>{let n=e;const s=t.split(".");s.forEach((a,i)=>{i===s.length-1?n[a]=r:((!n[a]||typeof n[a]!="object"||Array.isArray(n[a])||n[a]instanceof File)&&(n[a]=Object.create(null)),n=n[a])})},lt=e=>{const t=e.split("/");return t[0]===""&&t.shift(),t},Lt=e=>{const{groups:t,path:r}=Ut(e),n=lt(r);return Bt(n,t)},Ut=e=>{const t=[];return e=e.replace(/\{[^}]+\}/g,(r,n)=>{const s=`@${n}`;return t.push([s,r]),s}),{groups:t,path:e}},Bt=(e,t)=>{for(let r=t.length-1;r>=0;r--){const[n]=t[r];for(let s=e.length-1;s>=0;s--)if(e[s].includes(n)){e[s]=e[s].replace(n,t[r][1]);break}}return e},Ae={},Kt=(e,t)=>{if(e==="*")return"*";const r=e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);if(r){const n=`${e}#${t}`;return Ae[n]||(r[2]?Ae[n]=t&&t[0]!==":"&&t[0]!=="*"?[n,r[1],new RegExp(`^${r[2]}(?=/${t})`)]:[e,r[1],new RegExp(`^${r[2]}$`)]:Ae[n]=[e,r[1],!0]),Ae[n]}return null},Ke=(e,t)=>{try{return t(e)}catch{return e.replace(/(?:%[0-9A-Fa-f]{2})+/g,r=>{try{return t(r)}catch{return r}})}},Gt=e=>Ke(e,decodeURI),ct=e=>{const t=e.url,r=t.indexOf("/",t.indexOf(":")+4);let n=r;for(;n<t.length;n++){const s=t.charCodeAt(n);if(s===37){const a=t.indexOf("?",n),i=t.slice(r,a===-1?void 0:a);return Gt(i.includes("%25")?i.replace(/%25/g,"%2525"):i)}else if(s===63)break}return t.slice(r,n)},zt=e=>{const t=ct(e);return t.length>1&&t.at(-1)==="/"?t.slice(0,-1):t},ce=(e,t,...r)=>(r.length&&(t=ce(t,...r)),`${(e==null?void 0:e[0])==="/"?"":"/"}${e}${t==="/"?"":`${(e==null?void 0:e.at(-1))==="/"?"":"/"}${(t==null?void 0:t[0])==="/"?t.slice(1):t}`}`),dt=e=>{if(e.charCodeAt(e.length-1)!==63||!e.includes(":"))return null;const t=e.split("/"),r=[];let n="";return t.forEach(s=>{if(s!==""&&!/\:/.test(s))n+="/"+s;else if(/\:/.test(s))if(/\?/.test(s)){r.length===0&&n===""?r.push("/"):r.push(n);const a=s.replace("?","");n+="/"+a,r.push(n)}else n+="/"+s}),r.filter((s,a,i)=>i.indexOf(s)===a)},Le=e=>/[%+]/.test(e)?(e.indexOf("+")!==-1&&(e=e.replace(/\+/g," ")),e.indexOf("%")!==-1?Ke(e,pt):e):e,ut=(e,t,r)=>{let n;if(!r&&t&&!/[%+]/.test(t)){let i=e.indexOf("?",8);if(i===-1)return;for(e.startsWith(t,i+1)||(i=e.indexOf(`&${t}`,i+1));i!==-1;){const d=e.charCodeAt(i+t.length+1);if(d===61){const c=i+t.length+2,l=e.indexOf("&",c);return Le(e.slice(c,l===-1?void 0:l))}else if(d==38||isNaN(d))return"";i=e.indexOf(`&${t}`,i+1)}if(n=/[%+]/.test(e),!n)return}const s={};n??(n=/[%+]/.test(e));let a=e.indexOf("?",8);for(;a!==-1;){const i=e.indexOf("&",a+1);let d=e.indexOf("=",a);d>i&&i!==-1&&(d=-1);let c=e.slice(a+1,d===-1?i===-1?void 0:i:d);if(n&&(c=Le(c)),a=i,c==="")continue;let l;d===-1?l="":(l=e.slice(d+1,i===-1?void 0:i),n&&(l=Le(l))),r?(s[c]&&Array.isArray(s[c])||(s[c]=[]),s[c].push(l)):s[c]??(s[c]=l)}return t?s[t]:s},Jt=ut,Wt=(e,t)=>ut(e,t,!0),pt=decodeURIComponent,Xe=e=>Ke(e,pt),pe,D,K,ft,ht,Be,z,rt,mt=(rt=class{constructor(e,t="/",r=[[]]){x(this,K);h(this,"raw");x(this,pe);x(this,D);h(this,"routeIndex",0);h(this,"path");h(this,"bodyCache",{});x(this,z,e=>{const{bodyCache:t,raw:r}=this,n=t[e];if(n)return n;const s=Object.keys(t)[0];return s?t[s].then(a=>(s==="json"&&(a=JSON.stringify(a)),new Response(a)[e]())):t[e]=r[e]()});this.raw=e,this.path=t,f(this,D,r),f(this,pe,{})}param(e){return e?P(this,K,ft).call(this,e):P(this,K,ht).call(this)}query(e){return Jt(this.url,e)}queries(e){return Wt(this.url,e)}header(e){if(e)return this.raw.headers.get(e)??void 0;const t={};return this.raw.headers.forEach((r,n)=>{t[n]=r}),t}async parseBody(e){var t;return(t=this.bodyCache).parsedBody??(t.parsedBody=await It(this,e))}json(){return o(this,z).call(this,"text").then(e=>JSON.parse(e))}text(){return o(this,z).call(this,"text")}arrayBuffer(){return o(this,z).call(this,"arrayBuffer")}blob(){return o(this,z).call(this,"blob")}formData(){return o(this,z).call(this,"formData")}addValidatedData(e,t){o(this,pe)[e]=t}valid(e){return o(this,pe)[e]}get url(){return this.raw.url}get method(){return this.raw.method}get[Mt](){return o(this,D)}get matchedRoutes(){return o(this,D)[0].map(([[,e]])=>e)}get routePath(){return o(this,D)[0].map(([[,e]])=>e)[this.routeIndex].path}},pe=new WeakMap,D=new WeakMap,K=new WeakSet,ft=function(e){const t=o(this,D)[0][this.routeIndex][1][e],r=P(this,K,Be).call(this,t);return r&&/\%/.test(r)?Xe(r):r},ht=function(){const e={},t=Object.keys(o(this,D)[0][this.routeIndex][1]);for(const r of t){const n=P(this,K,Be).call(this,o(this,D)[0][this.routeIndex][1][r]);n!==void 0&&(e[r]=/\%/.test(n)?Xe(n):n)}return e},Be=function(e){return o(this,D)[1]?o(this,D)[1][e]:e},z=new WeakMap,rt),Yt={Stringify:1},gt=async(e,t,r,n,s)=>{typeof e=="object"&&!(e instanceof String)&&(e instanceof Promise||(e=e.toString()),e instanceof Promise&&(e=await e));const a=e.callbacks;return a!=null&&a.length?(s?s[0]+=e:s=[e],Promise.all(a.map(d=>d({phase:t,buffer:s,context:n}))).then(d=>Promise.all(d.filter(Boolean).map(c=>gt(c,t,!1,n,s))).then(()=>s[0]))):Promise.resolve(e)},Qt="text/plain; charset=UTF-8",Ue=(e,t)=>({"Content-Type":e,...t}),Ee,Pe,F,me,L,A,Re,fe,he,re,Ne,qe,J,de,st,Xt=(st=class{constructor(e,t){x(this,J);x(this,Ee);x(this,Pe);h(this,"env",{});x(this,F);h(this,"finalized",!1);h(this,"error");x(this,me);x(this,L);x(this,A);x(this,Re);x(this,fe);x(this,he);x(this,re);x(this,Ne);x(this,qe);h(this,"render",(...e)=>(o(this,fe)??f(this,fe,t=>this.html(t)),o(this,fe).call(this,...e)));h(this,"setLayout",e=>f(this,Re,e));h(this,"getLayout",()=>o(this,Re));h(this,"setRenderer",e=>{f(this,fe,e)});h(this,"header",(e,t,r)=>{this.finalized&&f(this,A,new Response(o(this,A).body,o(this,A)));const n=o(this,A)?o(this,A).headers:o(this,re)??f(this,re,new Headers);t===void 0?n.delete(e):r!=null&&r.append?n.append(e,t):n.set(e,t)});h(this,"status",e=>{f(this,me,e)});h(this,"set",(e,t)=>{o(this,F)??f(this,F,new Map),o(this,F).set(e,t)});h(this,"get",e=>o(this,F)?o(this,F).get(e):void 0);h(this,"newResponse",(...e)=>P(this,J,de).call(this,...e));h(this,"body",(e,t,r)=>P(this,J,de).call(this,e,t,r));h(this,"text",(e,t,r)=>!o(this,re)&&!o(this,me)&&!t&&!r&&!this.finalized?new Response(e):P(this,J,de).call(this,e,t,Ue(Qt,r)));h(this,"json",(e,t,r)=>P(this,J,de).call(this,JSON.stringify(e),t,Ue("application/json",r)));h(this,"html",(e,t,r)=>{const n=s=>P(this,J,de).call(this,s,t,Ue("text/html; charset=UTF-8",r));return typeof e=="object"?gt(e,Yt.Stringify,!1,{}).then(n):n(e)});h(this,"redirect",(e,t)=>{const r=String(e);return this.header("Location",/[^\x00-\xFF]/.test(r)?encodeURI(r):r),this.newResponse(null,t??302)});h(this,"notFound",()=>(o(this,he)??f(this,he,()=>new Response),o(this,he).call(this,this)));f(this,Ee,e),t&&(f(this,L,t.executionCtx),this.env=t.env,f(this,he,t.notFoundHandler),f(this,qe,t.path),f(this,Ne,t.matchResult))}get req(){return o(this,Pe)??f(this,Pe,new mt(o(this,Ee),o(this,qe),o(this,Ne))),o(this,Pe)}get event(){if(o(this,L)&&"respondWith"in o(this,L))return o(this,L);throw Error("This context has no FetchEvent")}get executionCtx(){if(o(this,L))return o(this,L);throw Error("This context has no ExecutionContext")}get res(){return o(this,A)||f(this,A,new Response(null,{headers:o(this,re)??f(this,re,new Headers)}))}set res(e){if(o(this,A)&&e){e=new Response(e.body,e);for(const[t,r]of o(this,A).headers.entries())if(t!=="content-type")if(t==="set-cookie"){const n=o(this,A).headers.getSetCookie();e.headers.delete("set-cookie");for(const s of n)e.headers.append("set-cookie",s)}else e.headers.set(t,r)}f(this,A,e),this.finalized=!0}get var(){return o(this,F)?Object.fromEntries(o(this,F)):{}}},Ee=new WeakMap,Pe=new WeakMap,F=new WeakMap,me=new WeakMap,L=new WeakMap,A=new WeakMap,Re=new WeakMap,fe=new WeakMap,he=new WeakMap,re=new WeakMap,Ne=new WeakMap,qe=new WeakMap,J=new WeakSet,de=function(e,t,r){const n=o(this,A)?new Headers(o(this,A).headers):o(this,re)??new Headers;if(typeof t=="object"&&"headers"in t){const a=t.headers instanceof Headers?t.headers:new Headers(t.headers);for(const[i,d]of a)i.toLowerCase()==="set-cookie"?n.append(i,d):n.set(i,d)}if(r)for(const[a,i]of Object.entries(r))if(typeof i=="string")n.set(a,i);else{n.delete(a);for(const d of i)n.append(a,d)}const s=typeof t=="number"?t:(t==null?void 0:t.status)??o(this,me);return new Response(e,{status:s,headers:n})},st),q="ALL",Zt="all",er=["get","post","put","delete","options","patch"],bt="Can not add a route since the matcher is already built.",yt=class extends Error{},tr="__COMPOSED_HANDLER",rr=e=>e.text("404 Not Found",404),Ze=(e,t)=>{if("getResponse"in e){const r=e.getResponse();return t.newResponse(r.body,r)}return console.error(e),t.text("Internal Server Error",500)},I,j,vt,$,ee,Te,Ce,ge,sr=(ge=class{constructor(t={}){x(this,j);h(this,"get");h(this,"post");h(this,"put");h(this,"delete");h(this,"options");h(this,"patch");h(this,"all");h(this,"on");h(this,"use");h(this,"router");h(this,"getPath");h(this,"_basePath","/");x(this,I,"/");h(this,"routes",[]);x(this,$,rr);h(this,"errorHandler",Ze);h(this,"onError",t=>(this.errorHandler=t,this));h(this,"notFound",t=>(f(this,$,t),this));h(this,"fetch",(t,...r)=>P(this,j,Ce).call(this,t,r[1],r[0],t.method));h(this,"request",(t,r,n,s)=>t instanceof Request?this.fetch(r?new Request(t,r):t,n,s):(t=t.toString(),this.fetch(new Request(/^https?:\/\//.test(t)?t:`http://localhost${ce("/",t)}`,r),n,s)));h(this,"fire",()=>{addEventListener("fetch",t=>{t.respondWith(P(this,j,Ce).call(this,t.request,t,void 0,t.request.method))})});[...er,Zt].forEach(a=>{this[a]=(i,...d)=>(typeof i=="string"?f(this,I,i):P(this,j,ee).call(this,a,o(this,I),i),d.forEach(c=>{P(this,j,ee).call(this,a,o(this,I),c)}),this)}),this.on=(a,i,...d)=>{for(const c of[i].flat()){f(this,I,c);for(const l of[a].flat())d.map(u=>{P(this,j,ee).call(this,l.toUpperCase(),o(this,I),u)})}return this},this.use=(a,...i)=>(typeof a=="string"?f(this,I,a):(f(this,I,"*"),i.unshift(a)),i.forEach(d=>{P(this,j,ee).call(this,q,o(this,I),d)}),this);const{strict:n,...s}=t;Object.assign(this,s),this.getPath=n??!0?t.getPath??ct:zt}route(t,r){const n=this.basePath(t);return r.routes.map(s=>{var i;let a;r.errorHandler===Ze?a=s.handler:(a=async(d,c)=>(await Qe([],r.errorHandler)(d,()=>s.handler(d,c))).res,a[tr]=s.handler),P(i=n,j,ee).call(i,s.method,s.path,a)}),this}basePath(t){const r=P(this,j,vt).call(this);return r._basePath=ce(this._basePath,t),r}mount(t,r,n){let s,a;n&&(typeof n=="function"?a=n:(a=n.optionHandler,n.replaceRequest===!1?s=c=>c:s=n.replaceRequest));const i=a?c=>{const l=a(c);return Array.isArray(l)?l:[l]}:c=>{let l;try{l=c.executionCtx}catch{}return[c.env,l]};s||(s=(()=>{const c=ce(this._basePath,t),l=c==="/"?0:c.length;return u=>{const p=new URL(u.url);return p.pathname=p.pathname.slice(l)||"/",new Request(p,u)}})());const d=async(c,l)=>{const u=await r(s(c.req.raw),...i(c));if(u)return u;await l()};return P(this,j,ee).call(this,q,ce(t,"*"),d),this}},I=new WeakMap,j=new WeakSet,vt=function(){const t=new ge({router:this.router,getPath:this.getPath});return t.errorHandler=this.errorHandler,f(t,$,o(this,$)),t.routes=this.routes,t},$=new WeakMap,ee=function(t,r,n){t=t.toUpperCase(),r=ce(this._basePath,r);const s={basePath:this._basePath,path:r,method:t,handler:n};this.router.add(t,r,[n,s]),this.routes.push(s)},Te=function(t,r){if(t instanceof Error)return this.errorHandler(t,r);throw t},Ce=function(t,r,n,s){if(s==="HEAD")return(async()=>new Response(null,await P(this,j,Ce).call(this,t,r,n,"GET")))();const a=this.getPath(t,{env:n}),i=this.router.match(s,a),d=new Xt(t,{path:a,matchResult:i,env:n,executionCtx:r,notFoundHandler:o(this,$)});if(i[0].length===1){let l;try{l=i[0][0][0][0](d,async()=>{d.res=await o(this,$).call(this,d)})}catch(u){return P(this,j,Te).call(this,u,d)}return l instanceof Promise?l.then(u=>u||(d.finalized?d.res:o(this,$).call(this,d))).catch(u=>P(this,j,Te).call(this,u,d)):l??o(this,$).call(this,d)}const c=Qe(i[0],this.errorHandler,o(this,$));return(async()=>{try{const l=await c(d);if(!l.finalized)throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");return l.res}catch(l){return P(this,j,Te).call(this,l,d)}})()},ge),xt=[];function nr(e,t){const r=this.buildAllMatchers(),n=((s,a)=>{const i=r[s]||r[q],d=i[2][a];if(d)return d;const c=a.match(i[0]);if(!c)return[[],xt];const l=c.indexOf("",1);return[i[1][l],c]});return this.match=n,n(e,t)}var Me="[^/]+",we=".*",ke="(?:|/.*)",ue=Symbol(),ar=new Set(".\\+*[^]$()");function ir(e,t){return e.length===1?t.length===1?e<t?-1:1:-1:t.length===1||e===we||e===ke?1:t===we||t===ke?-1:e===Me?1:t===Me?-1:e.length===t.length?e<t?-1:1:t.length-e.length}var se,ne,H,oe,or=(oe=class{constructor(){x(this,se);x(this,ne);x(this,H,Object.create(null))}insert(t,r,n,s,a){if(t.length===0){if(o(this,se)!==void 0)throw ue;if(a)return;f(this,se,r);return}const[i,...d]=t,c=i==="*"?d.length===0?["","",we]:["","",Me]:i==="/*"?["","",ke]:i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);let l;if(c){const u=c[1];let p=c[2]||Me;if(u&&c[2]&&(p===".*"||(p=p.replace(/^\((?!\?:)(?=[^)]+\)$)/,"(?:"),/\((?!\?:)/.test(p))))throw ue;if(l=o(this,H)[p],!l){if(Object.keys(o(this,H)).some(m=>m!==we&&m!==ke))throw ue;if(a)return;l=o(this,H)[p]=new oe,u!==""&&f(l,ne,s.varIndex++)}!a&&u!==""&&n.push([u,o(l,ne)])}else if(l=o(this,H)[i],!l){if(Object.keys(o(this,H)).some(u=>u.length>1&&u!==we&&u!==ke))throw ue;if(a)return;l=o(this,H)[i]=new oe}l.insert(d,r,n,s,a)}buildRegExpStr(){const r=Object.keys(o(this,H)).sort(ir).map(n=>{const s=o(this,H)[n];return(typeof o(s,ne)=="number"?`(${n})@${o(s,ne)}`:ar.has(n)?`\\${n}`:n)+s.buildRegExpStr()});return typeof o(this,se)=="number"&&r.unshift(`#${o(this,se)}`),r.length===0?"":r.length===1?r[0]:"(?:"+r.join("|")+")"}},se=new WeakMap,ne=new WeakMap,H=new WeakMap,oe),Ie,je,nt,lr=(nt=class{constructor(){x(this,Ie,{varIndex:0});x(this,je,new or)}insert(e,t,r){const n=[],s=[];for(let i=0;;){let d=!1;if(e=e.replace(/\{[^}]+\}/g,c=>{const l=`@\\${i}`;return s[i]=[l,c],i++,d=!0,l}),!d)break}const a=e.match(/(?::[^\/]+)|(?:\/\*$)|./g)||[];for(let i=s.length-1;i>=0;i--){const[d]=s[i];for(let c=a.length-1;c>=0;c--)if(a[c].indexOf(d)!==-1){a[c]=a[c].replace(d,s[i][1]);break}}return o(this,je).insert(a,t,n,o(this,Ie),r),n}buildRegExp(){let e=o(this,je).buildRegExpStr();if(e==="")return[/^$/,[],[]];let t=0;const r=[],n=[];return e=e.replace(/#(\d+)|@(\d+)|\.\*\$/g,(s,a,i)=>a!==void 0?(r[++t]=Number(a),"$()"):(i!==void 0&&(n[Number(i)]=++t),"")),[new RegExp(`^${e}`),r,n]}},Ie=new WeakMap,je=new WeakMap,nt),cr=[/^$/,[],Object.create(null)],De=Object.create(null);function wt(e){return De[e]??(De[e]=new RegExp(e==="*"?"":`^${e.replace(/\/\*$|([.\\+*[^\]$()])/g,(t,r)=>r?`\\${r}`:"(?:|/.*)")}$`))}function dr(){De=Object.create(null)}function ur(e){var l;const t=new lr,r=[];if(e.length===0)return cr;const n=e.map(u=>[!/\*|\/:/.test(u[0]),...u]).sort(([u,p],[m,k])=>u?1:m?-1:p.length-k.length),s=Object.create(null);for(let u=0,p=-1,m=n.length;u<m;u++){const[k,R,b]=n[u];k?s[R]=[b.map(([E])=>[E,Object.create(null)]),xt]:p++;let v;try{v=t.insert(R,p,k)}catch(E){throw E===ue?new yt(R):E}k||(r[p]=b.map(([E,w])=>{const y=Object.create(null);for(w-=1;w>=0;w--){const[C,S]=v[w];y[C]=S}return[E,y]}))}const[a,i,d]=t.buildRegExp();for(let u=0,p=r.length;u<p;u++)for(let m=0,k=r[u].length;m<k;m++){const R=(l=r[u][m])==null?void 0:l[1];if(!R)continue;const b=Object.keys(R);for(let v=0,E=b.length;v<E;v++)R[b[v]]=d[R[b[v]]]}const c=[];for(const u in i)c[u]=r[i[u]];return[a,c,s]}function le(e,t){if(e){for(const r of Object.keys(e).sort((n,s)=>s.length-n.length))if(wt(r).test(t))return[...e[r]]}}var W,Y,$e,kt,at,pr=(at=class{constructor(){x(this,$e);h(this,"name","RegExpRouter");x(this,W);x(this,Y);h(this,"match",nr);f(this,W,{[q]:Object.create(null)}),f(this,Y,{[q]:Object.create(null)})}add(e,t,r){var d;const n=o(this,W),s=o(this,Y);if(!n||!s)throw new Error(bt);n[e]||[n,s].forEach(c=>{c[e]=Object.create(null),Object.keys(c[q]).forEach(l=>{c[e][l]=[...c[q][l]]})}),t==="/*"&&(t="*");const a=(t.match(/\/:/g)||[]).length;if(/\*$/.test(t)){const c=wt(t);e===q?Object.keys(n).forEach(l=>{var u;(u=n[l])[t]||(u[t]=le(n[l],t)||le(n[q],t)||[])}):(d=n[e])[t]||(d[t]=le(n[e],t)||le(n[q],t)||[]),Object.keys(n).forEach(l=>{(e===q||e===l)&&Object.keys(n[l]).forEach(u=>{c.test(u)&&n[l][u].push([r,a])})}),Object.keys(s).forEach(l=>{(e===q||e===l)&&Object.keys(s[l]).forEach(u=>c.test(u)&&s[l][u].push([r,a]))});return}const i=dt(t)||[t];for(let c=0,l=i.length;c<l;c++){const u=i[c];Object.keys(s).forEach(p=>{var m;(e===q||e===p)&&((m=s[p])[u]||(m[u]=[...le(n[p],u)||le(n[q],u)||[]]),s[p][u].push([r,a-l+c+1]))})}}buildAllMatchers(){const e=Object.create(null);return Object.keys(o(this,Y)).concat(Object.keys(o(this,W))).forEach(t=>{e[t]||(e[t]=P(this,$e,kt).call(this,t))}),f(this,W,f(this,Y,void 0)),dr(),e}},W=new WeakMap,Y=new WeakMap,$e=new WeakSet,kt=function(e){const t=[];let r=e===q;return[o(this,W),o(this,Y)].forEach(n=>{const s=n[e]?Object.keys(n[e]).map(a=>[a,n[e][a]]):[];s.length!==0?(r||(r=!0),t.push(...s)):e!==q&&t.push(...Object.keys(n[q]).map(a=>[a,n[q][a]]))}),r?ur(t):null},at),Q,U,it,mr=(it=class{constructor(e){h(this,"name","SmartRouter");x(this,Q,[]);x(this,U,[]);f(this,Q,e.routers)}add(e,t,r){if(!o(this,U))throw new Error(bt);o(this,U).push([e,t,r])}match(e,t){if(!o(this,U))throw new Error("Fatal error");const r=o(this,Q),n=o(this,U),s=r.length;let a=0,i;for(;a<s;a++){const d=r[a];try{for(let c=0,l=n.length;c<l;c++)d.add(...n[c]);i=d.match(e,t)}catch(c){if(c instanceof yt)continue;throw c}this.match=d.match.bind(d),f(this,Q,[d]),f(this,U,void 0);break}if(a===s)throw new Error("Fatal error");return this.name=`SmartRouter + ${this.activeRouter.name}`,i}get activeRouter(){if(o(this,U)||o(this,Q).length!==1)throw new Error("No active router has been determined yet.");return o(this,Q)[0]}},Q=new WeakMap,U=new WeakMap,it),xe=Object.create(null),X,_,ae,be,O,B,te,ye,fr=(ye=class{constructor(t,r,n){x(this,B);x(this,X);x(this,_);x(this,ae);x(this,be,0);x(this,O,xe);if(f(this,_,n||Object.create(null)),f(this,X,[]),t&&r){const s=Object.create(null);s[t]={handler:r,possibleKeys:[],score:0},f(this,X,[s])}f(this,ae,[])}insert(t,r,n){f(this,be,++Ye(this,be)._);let s=this;const a=Lt(r),i=[];for(let d=0,c=a.length;d<c;d++){const l=a[d],u=a[d+1],p=Kt(l,u),m=Array.isArray(p)?p[0]:l;if(m in o(s,_)){s=o(s,_)[m],p&&i.push(p[1]);continue}o(s,_)[m]=new ye,p&&(o(s,ae).push(p),i.push(p[1])),s=o(s,_)[m]}return o(s,X).push({[t]:{handler:n,possibleKeys:i.filter((d,c,l)=>l.indexOf(d)===c),score:o(this,be)}}),s}search(t,r){var c;const n=[];f(this,O,xe);let a=[this];const i=lt(r),d=[];for(let l=0,u=i.length;l<u;l++){const p=i[l],m=l===u-1,k=[];for(let R=0,b=a.length;R<b;R++){const v=a[R],E=o(v,_)[p];E&&(f(E,O,o(v,O)),m?(o(E,_)["*"]&&n.push(...P(this,B,te).call(this,o(E,_)["*"],t,o(v,O))),n.push(...P(this,B,te).call(this,E,t,o(v,O)))):k.push(E));for(let w=0,y=o(v,ae).length;w<y;w++){const C=o(v,ae)[w],S=o(v,O)===xe?{}:{...o(v,O)};if(C==="*"){const V=o(v,_)["*"];V&&(n.push(...P(this,B,te).call(this,V,t,o(v,O))),f(V,O,S),k.push(V));continue}const[G,Oe,Z]=C;if(!p&&!(Z instanceof RegExp))continue;const M=o(v,_)[G],He=i.slice(l).join("/");if(Z instanceof RegExp){const V=Z.exec(He);if(V){if(S[Oe]=V[0],n.push(...P(this,B,te).call(this,M,t,o(v,O),S)),Object.keys(o(M,_)).length){f(M,O,S);const ve=((c=V[0].match(/\//))==null?void 0:c.length)??0;(d[ve]||(d[ve]=[])).push(M)}continue}}(Z===!0||Z.test(p))&&(S[Oe]=p,m?(n.push(...P(this,B,te).call(this,M,t,S,o(v,O))),o(M,_)["*"]&&n.push(...P(this,B,te).call(this,o(M,_)["*"],t,S,o(v,O)))):(f(M,O,S),k.push(M)))}}a=k.concat(d.shift()??[])}return n.length>1&&n.sort((l,u)=>l.score-u.score),[n.map(({handler:l,params:u})=>[l,u])]}},X=new WeakMap,_=new WeakMap,ae=new WeakMap,be=new WeakMap,O=new WeakMap,B=new WeakSet,te=function(t,r,n,s){const a=[];for(let i=0,d=o(t,X).length;i<d;i++){const c=o(t,X)[i],l=c[r]||c[q],u={};if(l!==void 0&&(l.params=Object.create(null),a.push(l),n!==xe||s&&s!==xe))for(let p=0,m=l.possibleKeys.length;p<m;p++){const k=l.possibleKeys[p],R=u[l.score];l.params[k]=s!=null&&s[k]&&!R?s[k]:n[k]??(s==null?void 0:s[k]),u[l.score]=!0}}return a},ye),ie,ot,hr=(ot=class{constructor(){h(this,"name","TrieRouter");x(this,ie);f(this,ie,new fr)}add(e,t,r){const n=dt(t);if(n){for(let s=0,a=n.length;s<a;s++)o(this,ie).insert(e,n[s],r);return}o(this,ie).insert(e,t,r)}match(e,t){return o(this,ie).search(e,t)}},ie=new WeakMap,ot),Et=class extends sr{constructor(e={}){super(e),this.router=e.router??new mr({routers:[new pr,new hr]})}},gr=e=>{const r={...{origin:"*",allowMethods:["GET","HEAD","PUT","POST","DELETE","PATCH"],allowHeaders:[],exposeHeaders:[]},...e},n=(a=>typeof a=="string"?a==="*"?()=>a:i=>a===i?i:null:typeof a=="function"?a:i=>a.includes(i)?i:null)(r.origin),s=(a=>typeof a=="function"?a:Array.isArray(a)?()=>a:()=>[])(r.allowMethods);return async function(i,d){var u;function c(p,m){i.res.headers.set(p,m)}const l=await n(i.req.header("origin")||"",i);if(l&&c("Access-Control-Allow-Origin",l),r.credentials&&c("Access-Control-Allow-Credentials","true"),(u=r.exposeHeaders)!=null&&u.length&&c("Access-Control-Expose-Headers",r.exposeHeaders.join(",")),i.req.method==="OPTIONS"){r.origin!=="*"&&c("Vary","Origin"),r.maxAge!=null&&c("Access-Control-Max-Age",r.maxAge.toString());const p=await s(i.req.header("origin")||"",i);p.length&&c("Access-Control-Allow-Methods",p.join(","));let m=r.allowHeaders;if(!(m!=null&&m.length)){const k=i.req.header("Access-Control-Request-Headers");k&&(m=k.split(/\s*,\s*/))}return m!=null&&m.length&&(c("Access-Control-Allow-Headers",m.join(",")),i.res.headers.append("Vary","Access-Control-Request-Headers")),i.res.headers.delete("Content-Length"),i.res.headers.delete("Content-Type"),new Response(null,{headers:i.res.headers,status:204,statusText:"No Content"})}await d(),r.origin!=="*"&&i.header("Vary","Origin",{append:!0})}},br=/^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i,et=(e,t=vr)=>{const r=/\.([a-zA-Z0-9]+?)$/,n=e.match(r);if(!n)return;let s=t[n[1]];return s&&s.startsWith("text")&&(s+="; charset=utf-8"),s},yr={aac:"audio/aac",avi:"video/x-msvideo",avif:"image/avif",av1:"video/av1",bin:"application/octet-stream",bmp:"image/bmp",css:"text/css",csv:"text/csv",eot:"application/vnd.ms-fontobject",epub:"application/epub+zip",gif:"image/gif",gz:"application/gzip",htm:"text/html",html:"text/html",ico:"image/x-icon",ics:"text/calendar",jpeg:"image/jpeg",jpg:"image/jpeg",js:"text/javascript",json:"application/json",jsonld:"application/ld+json",map:"application/json",mid:"audio/x-midi",midi:"audio/x-midi",mjs:"text/javascript",mp3:"audio/mpeg",mp4:"video/mp4",mpeg:"video/mpeg",oga:"audio/ogg",ogv:"video/ogg",ogx:"application/ogg",opus:"audio/opus",otf:"font/otf",pdf:"application/pdf",png:"image/png",rtf:"application/rtf",svg:"image/svg+xml",tif:"image/tiff",tiff:"image/tiff",ts:"video/mp2t",ttf:"font/ttf",txt:"text/plain",wasm:"application/wasm",webm:"video/webm",weba:"audio/webm",webmanifest:"application/manifest+json",webp:"image/webp",woff:"font/woff",woff2:"font/woff2",xhtml:"application/xhtml+xml",xml:"application/xml",zip:"application/zip","3gp":"video/3gpp","3g2":"video/3gpp2",gltf:"model/gltf+json",glb:"model/gltf-binary"},vr=yr,xr=(...e)=>{let t=e.filter(s=>s!=="").join("/");t=t.replace(new RegExp("(?<=\\/)\\/+","g"),"");const r=t.split("/"),n=[];for(const s of r)s===".."&&n.length>0&&n.at(-1)!==".."?n.pop():s!=="."&&n.push(s);return n.join("/")||"."},Pt={br:".br",zstd:".zst",gzip:".gz"},wr=Object.keys(Pt),kr="index.html",Er=e=>{const t=e.root??"./",r=e.path,n=e.join??xr;return async(s,a)=>{var u,p,m,k;if(s.finalized)return a();let i;if(e.path)i=e.path;else try{if(i=decodeURIComponent(s.req.path),/(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(i))throw new Error}catch{return await((u=e.onNotFound)==null?void 0:u.call(e,s.req.path,s)),a()}let d=n(t,!r&&e.rewriteRequestPath?e.rewriteRequestPath(i):i);e.isDir&&await e.isDir(d)&&(d=n(d,kr));const c=e.getContent;let l=await c(d,s);if(l instanceof Response)return s.newResponse(l.body,l);if(l){const R=e.mimes&&et(d,e.mimes)||et(d);if(s.header("Content-Type",R||"application/octet-stream"),e.precompressed&&(!R||br.test(R))){const b=new Set((p=s.req.header("Accept-Encoding"))==null?void 0:p.split(",").map(v=>v.trim()));for(const v of wr){if(!b.has(v))continue;const E=await c(d+Pt[v],s);if(E){l=E,s.header("Content-Encoding",v),s.header("Vary","Accept-Encoding",{append:!0});break}}}return await((m=e.onFound)==null?void 0:m.call(e,d,s)),s.body(l)}await((k=e.onNotFound)==null?void 0:k.call(e,d,s)),await a()}},Pr=async(e,t)=>{let r;t&&t.manifest?typeof t.manifest=="string"?r=JSON.parse(t.manifest):r=t.manifest:typeof __STATIC_CONTENT_MANIFEST=="string"?r=JSON.parse(__STATIC_CONTENT_MANIFEST):r=__STATIC_CONTENT_MANIFEST;let n;t&&t.namespace?n=t.namespace:n=__STATIC_CONTENT;const s=r[e];if(!s)return null;const a=await n.get(s,{type:"stream"});return a||null},Rr=e=>async function(r,n){return Er({...e,getContent:async a=>Pr(a,{manifest:e.manifest,namespace:e.namespace?e.namespace:r.env?r.env.__STATIC_CONTENT:void 0})})(r,n)},Nr=e=>Rr(e);const qr=[{id:"milwaukee-workstation",brand:"milwaukee",name:"PV5 밀워키 워크스테이션",fullName:"PV5 기아 밀워키 워크스테이션",description:"격벽타공판 + 격벽2단선반 + 워크스페이스 + 툴박스",price:485e4,image:"/static/images/milwaukee-workstation.jpg",sections:[{title:"기초자재",items:[{name:"태고합판 / 알루미늄체크판 / 논슬립",quantity:"1식"}]},{title:"격벽타공판",items:[{name:"M 격벽타공판",quantity:1},{name:"M 타공판보강대",quantity:3},{name:"브라켓 (상/중/하)",quantity:"각 2"}]},{title:"격벽2단선반",items:[{name:"M 2단 트레이",quantity:1},{name:"M 2단 트레이 로고",quantity:1},{name:"M 2단 프레임",quantity:2},{name:"M 트레이보강대",quantity:4}]},{title:"워크스페이스",items:[{name:"M 워크 타공판",quantity:1},{name:"M 워크 프레임 / 로고",quantity:"각 1"},{name:"M 워크 상판로고",quantity:1},{name:"M 3단 트레이/워크트레이",quantity:1},{name:"M 워크 세로보강대 (좌,우측)",quantity:2},{name:"M 워크 조명커버",quantity:1},{name:"M 트레이보강대",quantity:2},{name:"M 워크 트렁크브라켓",quantity:1},{name:"M 도어브라켓 - 우",quantity:1}]},{title:"툴박스",items:[{name:"팩아웃 거치대",quantity:4},{name:"팩아웃 라지 툴박스",quantity:1},{name:"오픈형 툴박스",quantity:1}]}]},{id:"milwaukee-smart",brand:"milwaukee",name:"PV5 밀워키 스마트 에디션",fullName:"PV5 기아 밀워키 스마트 에디션",description:"격벽타공판 + 격벽2단선반 + 3단선반 + 툴박스",price:449e4,image:"/static/images/milwaukee-smart.jpg",hasPositionOption:!0,sections:[{title:"기초자재",items:[{name:"태고합판 / 알루미늄체크판 / 논슬립",quantity:"1식"}]},{title:"격벽타공판",items:[{name:"M 격벽타공판",quantity:1},{name:"M 타공판보강대",quantity:3},{name:"브라켓 (상/중/하)",quantity:"각 2"}]},{title:"격벽2단선반",items:[{name:"M 2단 트레이",quantity:1},{name:"M 2단 트레이 로고",quantity:1},{name:"M 2단 프레임",quantity:2},{name:"M 트레이보강대",quantity:4}]},{title:"3단선반 (좌/우측)",items:[{name:"M 3단 트레이/워크트레이",quantity:2},{name:"M 3단 트레이 로고",quantity:1},{name:"M 3단 프레임 로고 (좌/우측)",quantity:"각 1"},{name:"M 3단 프레임",quantity:1},{name:"M 트레이보강대",quantity:6},{name:"M 트렁크 브라켓",quantity:1},{name:"M 도어브라켓 (좌)",quantity:1},{name:"M 도어브라켓 (우)",quantity:1}]},{title:"툴박스",items:[{name:"팩아웃 거치대",quantity:8},{name:"팩아웃 라지 툴박스",quantity:1},{name:"오픈형 툴박스",quantity:1}]}]},{id:"milwaukee-3shelf-parts",brand:"milwaukee",name:"PV5 밀워키 3단 부품선반",fullName:"PV5 기아 밀워키 3단 부품선반 (좌/우측)",description:"밀워키 단품 - 3단 부품선반",price:968e3,image:"/static/images/milwaukee-3shelf-parts.jpg",hasPositionOption:!0,sections:[{title:"3단 부품선반 (좌/우측)",items:[{name:"M 부품 트레이",quantity:2},{name:"M 부품 트레이 로고",quantity:1},{name:"M 부품 프레임 (일반)",quantity:1},{name:"M 부품 프레임 (좌측/우측)",quantity:"각 1"},{name:"M 부품 보강대",quantity:6},{name:"M 트렁크 브라켓",quantity:1},{name:"M 도어브라켓 (좌/우)",quantity:"각 1"}]}]},{id:"milwaukee-3shelf-standard",brand:"milwaukee",name:"PV5 밀워키 3단 선반",fullName:"PV5 기아 밀워키 3단 선반 (좌/우측)",description:"밀워키 단품 - 3단 선반",price:183e4,image:"/static/images/milwaukee-3shelf-standard.jpg",hasPositionOption:!0,sections:[{title:"3단 선반 (좌/우측)",items:[{name:"M 3단 트레이/워크트레이",quantity:2},{name:"M 3단 트레이 로고",quantity:1},{name:"M 3단 프레임 로고 (좌/우측)",quantity:"각 1"},{name:"M 3단 프레임",quantity:1},{name:"M 트레이 보강대",quantity:6},{name:"M 트렁크 브라켓",quantity:1},{name:"M 도어브라켓 (좌/우)",quantity:"각 1"}]}]},{id:"milwaukee-2shelf-partition",brand:"milwaukee",name:"PV5 밀워키 2단 선반",fullName:"PV5 카고 밀워키 2단 선반",description:"밀워키 단품 - 2단 선반",price:15e5,image:"/static/images/milwaukee-2shelf-partition.jpg",sections:[{title:"격벽 2단선반",items:[{name:"M 2단 트레이",quantity:1},{name:"M 2단 트레이 로고",quantity:1},{name:"M 2단 프레임",quantity:2},{name:"M 트레이보강대",quantity:4}]}]},{id:"milwaukee-partition-panel",brand:"milwaukee",name:"PV5 밀워키 격벽타공판",fullName:"PV5 카고 밀워키 격벽타공판",description:"밀워키 단품 - 격벽타공판",price:12e5,image:"/static/images/milwaukee-partition-panel.jpg",sections:[{title:"격벽타공판",items:[{name:"M 격벽타공판",quantity:1},{name:"M 타공판보강대",quantity:3},{name:"브라켓 (상/중/하)",quantity:"각 2"}]}]},{id:"milwaukee-floor-board",brand:"milwaukee",name:"적재함 평탄화 보드",fullName:"적재함 평탄화 보드 (태고합판 + 알루미늄체크판 + 논슬립)",description:"공통 단품 - 적재함 평탄화 보드",price:8e5,image:"/static/images/floor-board.jpg",sections:[{title:"적재함 평탄화 보드",items:[{name:"태고합판",quantity:1},{name:"알루미늄체크판",quantity:1},{name:"논슬립",quantity:1}]}]}],jr=[{id:"kia-workstation",brand:"kia",name:"기아 PV5 워크스테이션",fullName:"기아 PV5 순정형 워크스테이션",description:"격벽타공판 + 3단부품선반 + 워크스페이스",price:339e4,image:"/static/images/kia-workstation.jpg",sections:[{title:"기초자재",items:[{name:"태고합판 / 알루미늄체크판 / 논슬립",quantity:"1식"}]},{title:"격벽타공판",items:[{name:"격벽타공판",quantity:1},{name:"타공판보강대",quantity:3},{name:"브라켓 (상/중/하)",quantity:"각 2"}]},{title:"3단부품선반",items:[{name:"부품 트레이",quantity:2},{name:"부품 트레이 로고",quantity:1},{name:"부품 프레임 (일반)",quantity:1},{name:"부품 프레임 (좌측)",quantity:1},{name:"부품 보강대",quantity:6},{name:"트렁크 브라켓",quantity:1},{name:"도어브라켓 (좌측/우측)",quantity:1}]},{title:"워크스페이스",items:[{name:"워크 타공판",quantity:1},{name:"워크 프레임 / 로고",quantity:"각 1"},{name:"워크 상판로고",quantity:1},{name:"3단 트레이/워크트레이",quantity:1},{name:"워크 세로보강대",quantity:2},{name:"워크 조명커버",quantity:1},{name:"트레이보강대",quantity:2},{name:"트렁크보강대",quantity:1},{name:"도어브라켓 - 우",quantity:1},{name:"트렁크 브라켓",quantity:1}]}]},{id:"kia-smart",brand:"kia",name:"기아 PV5 스마트 패키지",fullName:"기아 PV5 순정형 스마트 패키지",description:"격벽타공판 + 2단선반 + 3단선반",price:36e5,image:"/static/images/kia-smart.jpg",hasPositionOption:!0,sections:[{title:"기초자재",items:[{name:"태고합판 / 알루미늄체크판 / 논슬립",quantity:"1식"}]},{title:"격벽타공판",items:[{name:"격벽타공판",quantity:1},{name:"타공판보강대",quantity:3},{name:"브라켓 (상/중/하)",quantity:"각 2"}]},{title:"2단선반",items:[{name:"2단 트레이",quantity:1},{name:"2단 트레이 로고",quantity:1},{name:"2단 프레임",quantity:2},{name:"트레이보강대",quantity:4}]},{title:"3단선반 (좌/우측)",items:[{name:"3단 트레이/워크트레이",quantity:2},{name:"3단 트레이 로고",quantity:1},{name:"3단 프레임 로고 (좌/우측)",quantity:"각 1"},{name:"3단 프레임",quantity:1},{name:"트레이보강대",quantity:6},{name:"트렁크보강대",quantity:1},{name:"도어브라켓 (좌)",quantity:1},{name:"도어브라켓 (우)",quantity:1},{name:"트렁크브라켓 (좌,우)",quantity:1}]}]},{id:"kia-3shelf-parts",brand:"kia",name:"기아 PV5 3단 부품선반",fullName:"기아 PV5 순정형 3단 부품선반 (좌/우측)",description:"기아 단품 - 3단 부품선반",price:88e4,image:"/static/images/kia-3shelf-parts.jpg",hasPositionOption:!0,sections:[{title:"3단 부품선반 (좌/우측)",items:[{name:"부품 트레이",quantity:2},{name:"부품 트레이 로고",quantity:1},{name:"부품 프레임 (일반)",quantity:1},{name:"부품 프레임 (좌측/우측)",quantity:"각 1"},{name:"부품 보강대",quantity:6},{name:"트렁크 브라켓",quantity:1},{name:"도어브라켓 (좌)",quantity:1},{name:"도어브라켓 (우)",quantity:1}]}]},{id:"kia-3shelf-standard",brand:"kia",name:"기아 PV5 3단 선반",fullName:"기아 PV5 순정형 3단 선반 (좌/우측)",description:"기아 단품 - 3단 선반",price:121e4,image:"/static/images/kia-3shelf-standard.jpg",hasPositionOption:!0,sections:[{title:"3단 선반 (좌/우측)",items:[{name:"3단 트레이/워크트레이",quantity:2},{name:"3단 트레이 로고",quantity:1},{name:"3단 프레임 로고 (좌/우측)",quantity:"각 1"},{name:"3단 프레임",quantity:1},{name:"트레이 보강대",quantity:6},{name:"트렁크 보강대",quantity:1},{name:"도어브라켓 (좌)",quantity:1},{name:"도어브라켓 (우)",quantity:1},{name:"트렁크브라켓 (좌,우)",quantity:1}]}]},{id:"kia-2shelf-partition",brand:"kia",name:"PV5 카고 격벽 2단선반",fullName:"PV5 카고 격벽 2단선반",description:"기아 단품 - 격벽 2단선반",price:14e5,image:"/static/images/kia-2shelf-partition.jpg",sections:[{title:"격벽 2단선반",items:[{name:"2단 트레이",quantity:1},{name:"2단 트레이 로고",quantity:1},{name:"2단 프레임",quantity:2},{name:"트레이보강대",quantity:4}]}]},{id:"kia-partition-panel",brand:"kia",name:"기아 PV5 격벽타공판",fullName:"기아 PV5 순정형 격벽타공판",description:"기아 단품 - 격벽타공판",price:11e5,image:"/static/images/kia-partition-panel.jpg",sections:[{title:"격벽타공판",items:[{name:"격벽타공판",quantity:1},{name:"타공판보강대",quantity:3},{name:"브라켓 (상/중/하)",quantity:"각 2"}]}]},{id:"kia-floor-board",brand:"kia",name:"적재함 평탄화 보드",fullName:"적재함 평탄화 보드 (태고합판 + 알루미늄체크판 + 논슬립)",description:"공통 단품 - 적재함 평탄화 보드",price:8e5,image:"/static/images/floor-board.jpg",sections:[{title:"적재함 평탄화 보드",items:[{name:"태고합판",quantity:1},{name:"알루미늄체크판",quantity:1},{name:"논슬립",quantity:1}]}]}],Rt=[...qr,...jr];function Nt(e){return Rt.find(t=>t.id===e)}const T=new Et;T.use("/api/*",gr());T.use("/static/*",Nr({root:"./public"}));T.get("/api/packages",e=>e.json({packages:Rt}));T.get("/api/packages/:id",e=>{const t=e.req.param("id"),r=Nt(t);return r?e.json({package:r}):e.json({error:"Package not found"},404)});T.post("/api/ocr",async e=>{var t,r,n;try{const a=(await e.req.parseBody()).file;if(!a)return e.json({error:"No file uploaded"},400);console.log("OCR request received:",a.name,a.type,a.size);const i=await a.arrayBuffer(),d=Buffer.from(i).toString("base64"),c=(t=e.env)==null?void 0:t.GOOGLE_VISION_API_KEY;if(!c)return console.error("GOOGLE_VISION_API_KEY not found in environment"),e.json({success:!1,data:{customerName:"",phone:"",address:"",productName:"",productCode:"",orderNumber:"",orderDate:new Date().toLocaleDateString("ko-KR"),ocrRawText:"",aiSuccess:!1,recognitionSuccess:!1},message:"OCR 서비스 설정이 필요합니다. 관리자에게 문의하세요."},200);console.log("Calling Google Cloud Vision API...");const l=await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${c}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({requests:[{image:{content:d},features:[{type:"DOCUMENT_TEXT_DETECTION",maxResults:1}]}]})});if(!l.ok){const w=await l.text();throw console.error("Google Vision API error:",l.status,w),new Error(`Google Vision API error: ${l.status}`)}const u=await l.json();console.log("Google Vision API response received");const p=(n=(r=u.responses)==null?void 0:r[0])==null?void 0:n.fullTextAnnotation,m=(p==null?void 0:p.text)||"",k=!!m;if(console.log("Extracted OCR text length:",m.length),console.log("OCR text preview:",m.substring(0,200)),!m||m.length<10)return console.warn("No text detected in image"),e.json({success:!1,data:{customerName:"",phone:"",address:"",productName:"",productCode:"",orderNumber:"",orderDate:new Date().toLocaleDateString("ko-KR"),ocrRawText:m,aiSuccess:!0,recognitionSuccess:!1},message:"이미지에서 텍스트를 인식할 수 없습니다. 이미지 품질을 확인해주세요."},200);const b=m?(w=>{var Je;const y={outputDate:"",deliveryNumber:"",receiverName:"",ordererName:"",receiverAddress:"",receiverPhone:"",deliveryMemo:"",orderNumber:"",productCode:"",productName:""};if(!w||w.length<5)return y;console.log("Parsing OCR text (우측 수령자 정보만):",w);const C=w.match(/(?:수령자|받는사람|수령인)([\s\S]*?)(?:공급자|SEQ\.|이하여백|$)/i),S=C?C[1]:w;console.log("Target text (수령자 영역):",S);const G=[/출력일자[\s\n:：]*(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/i,/출력일[\s\n:：]*(\d{4})[.-](\d{1,2})[.-](\d{1,2})/i,/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/i];for(const N of G){const g=w.match(N);if(g){y.outputDate=`${g[1]}년 ${g[2].padStart(2,"0")}월 ${g[3].padStart(2,"0")}일`,console.log("Output date found:",y.outputDate);break}}const Oe=[/배송번호[\s\n]+(\d{8})/i];for(const N of Oe){const g=w.match(N);if(g&&g[1]){y.deliveryNumber=g[1].trim(),console.log("Delivery number found:",y.deliveryNumber);break}}const Z=[/수령자명[\s\n]+([가-힣]{2,10})(?:\s|\n|$)/i];for(const N of Z){const g=w.match(N);if(g&&g[1]){y.receiverName=g[1].trim(),console.log("Receiver name found:",y.receiverName);break}}const M=[/주문자명[\s\n]+([가-힣]{2,10})(?:\s|\n|\(|수|$)/i];for(const N of M){const g=w.match(N);if(g&&g[1]){y.ordererName=g[1].trim(),console.log("Orderer name found:",y.ordererName);break}}!y.ordererName&&y.receiverName&&(y.ordererName=y.receiverName);const He=[/수령자\s*주소[\s\n]+(\(\d{5}\)\s*[^\n]+)[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i,/수령자\s*주소[\s\n]+(\(\d{5}\)\s*[^\n]+)/i,/수령자\s*주소[\s\n]+([^\n]+)[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i,/수령자\s*주소[\s\n]+([^\n]+?)(?=\n0|\n수령자|$)/i,/주소[\s\n]+([^\n]+(?:\n[^\n]+)?)/i];for(const N of He){const g=w.match(N);if(g){if(g[2]){const At=g[1].trim(),Tt=g[2].trim();y.receiverAddress=`${At} ${Tt}`}else g[1]&&(y.receiverAddress=g[1].trim());console.log("Receiver address found:",y.receiverAddress);break}}const V=[/(010)[-\s]*(\d{4})[-\s]*\n수령자\s*연락처1[\s\n]+수령자\s*연락처2[\s\n]+(\d{4})/i,/수령자\s*연락처1[\s\n]+(010[-\s]?\d{3,4}[-\s]?\d{4})/i];for(const N of V){const g=w.match(N);if(g){g[3]?y.receiverPhone=`${g[1]}-${g[2]}-${g[3]}`:g[1]&&(y.receiverPhone=g[1].replace(/\s/g,"")),console.log("Receiver phone found:",y.receiverPhone);break}}const ve=[/배송메모[\s\n]+([가-힣\w\s]{3,50})(?=\n상품명|\n주문번호|$)/i];for(const N of ve){const g=w.match(N);if(g&&g[1]&&!g[1].includes("상품명")&&!g[1].includes("주문")){y.deliveryMemo=g[1].trim(),console.log("Delivery memo found:",y.deliveryMemo);break}}const Ge=[/주문번호[\s\n]+(\d{18,20})/i,/(\d{18,20})/];for(const N of Ge){const g=w.match(N);if(g&&g[1]){y.orderNumber=g[1].trim(),console.log("Order number found:",y.orderNumber);break}}const ze=w.match(/사업자등록번호[\s\n:：]+(\d{10})/i),Ve=ze?ze[1]:null,jt=/1\/1[\s\n]+(\d{9})(?!\d)/i,Ot=/상품번호[\s\n:：]+(\d{8,10})/i,_t=/(?:^|\n)(\d{9})(?!\d)/gm,_e=w.match(jt),Se=w.match(Ot);if(_e&&_e[1]&&_e[1]!==Ve)y.productCode=_e[1],console.log("Product code found (pattern 1):",y.productCode);else if(Se&&Se[1]&&Se[1]!==Ve)y.productCode=Se[1],console.log("Product code found (pattern 2):",y.productCode);else{let N;for(;(N=_t.exec(w))!==null;)if(N[1]!==Ve&&!((Je=y.deliveryNumber)!=null&&Je.includes(N[1]))){y.productCode=N[1],console.log("Product code found (pattern 3):",y.productCode);break}}const St=[/(?:상품명|제품명|품명)[\s:：]*([^\n]{5,100})/i,/PV5[\s가-힣\w]+(?:워크스테이션|스마트|선반|격벽|밀워키|카고)/i];for(const N of St){const g=w.match(N);if(g){y.productName=(g[1]||g[0]).trim(),console.log("Product name found:",y.productName);break}}return console.log("Final parsed data:",y),y})(m):{},v=b.receiverName&&b.receiverName.length>=2||b.receiverPhone&&b.receiverPhone.length>=10||b.receiverAddress&&b.receiverAddress.length>=10||b.orderNumber&&b.orderNumber.length>=8;console.log("Validation result:",{hasValidData:v,receiverName:b.receiverName,receiverPhone:b.receiverPhone,receiverAddress:b.receiverAddress,orderNumber:b.orderNumber});const E={outputDate:b.outputDate||"",deliveryNumber:b.deliveryNumber||"",receiverName:b.receiverName||"",ordererName:b.ordererName||"",receiverAddress:b.receiverAddress||"",receiverPhone:b.receiverPhone||"",deliveryMemo:b.deliveryMemo||"",orderNumber:b.orderNumber||"",productCode:b.productCode||"",productName:b.productName||"",ocrRawText:m,aiSuccess:k,recognitionSuccess:v};return console.log("Final OCR result:",E),!v&&k?(console.warn("OCR recognition failed - no valid data extracted"),e.json({success:!1,data:E,message:"OCR 인식에 실패했습니다. 이미지 품질을 확인하거나 수동으로 입력해주세요."},200)):k?e.json({success:!0,data:E}):(console.warn("AI binding not available or failed"),e.json({success:!1,data:E,message:"OCR 서비스를 사용할 수 없습니다. Cloudflare Pages에 배포 후 사용 가능합니다."},200))}catch(s){return console.error("OCR Error:",s),e.json({error:"OCR processing failed",message:s instanceof Error?s.message:"Unknown error",suggestion:"수동으로 입력해주세요."},500)}});T.post("/api/generate-report",async e=>{try{const t=await e.req.json(),{customerInfo:r,packageId:n,installDate:s,installAddress:a,installTime:i,notes:d}=t,c=Nt(n);if(!c)return e.json({error:"Invalid package ID"},400);const l={id:`INSTALL-${Date.now()}`,createdAt:new Date().toISOString(),customerInfo:r,package:c,installDate:s,installAddress:a,installTime:i,notes:d,status:"pending"};return e.json({success:!0,report:l})}catch(t){return console.error("Report Generation Error:",t),e.json({error:"Failed to generate report"},500)}});T.post("/api/send-email",async e=>{try{const{env:t}=e,r=await e.req.json(),{recipientEmail:n,customerInfo:s,packages:a,installDate:i,installTime:d,installAddress:c,notes:l,attachmentImage:u,attachmentFileName:p,attachmentContentType:m}=r;if(!t.RESEND_API_KEY)return console.warn("RESEND_API_KEY not configured"),e.json({success:!1,message:"이메일 서비스가 설정되지 않았습니다. 관리자에게 문의하세요."},200);const k=a.map(w=>`
      <li><strong>${w.fullName||w.name}</strong></li>
    `).join(""),R=`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 25px; background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .info-row { margin: 8px 0; }
          .label { font-weight: bold; color: #4b5563; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          ul { list-style-type: none; padding-left: 0; }
          li { padding: 5px 0; }
        </style>
        <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"><\/script>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 PV5 시공(예약) 확인서</h1>
          </div>
          <div class="content">
            <div class="section">
              <div class="section-title">👤 고객 정보</div>
              <div class="info-row"><span class="label">고객명:</span> ${(s==null?void 0:s.receiverName)||"-"}</div>
              <div class="info-row"><span class="label">연락처:</span> ${(s==null?void 0:s.receiverPhone)||"-"}</div>
              <div class="info-row"><span class="label">주소:</span> ${(s==null?void 0:s.receiverAddress)||"-"}</div>
              <div class="info-row"><span class="label">주문번호:</span> ${(s==null?void 0:s.orderNumber)||"-"}</div>
            </div>
            
            <div class="section">
              <div class="section-title">📦 선택 제품</div>
              <ul>${k}</ul>
            </div>
            
            <div class="section">
              <div class="section-title">📅 설치 정보</div>
              <div class="info-row"><span class="label">설치 날짜:</span> ${i||"-"}</div>
              <div class="info-row"><span class="label">설치 시간:</span> ${d||"-"}</div>
              <div class="info-row"><span class="label">설치 주소:</span> ${c||"-"}</div>
              ${l?`<div class="info-row"><span class="label">특이사항:</span> ${l}</div>`:""}
            </div>
          </div>
          <div class="footer">
            <p>© 2026 사인마스터 PV5 시공관리 시스템</p>
            <p>이 메일은 PV5 시공 확인 점검표 시스템에서 자동으로 발송되었습니다.</p>
          </div>
        </div>
      </body>
      </html>
    `,b={from:"PV5 시공관리 <onboarding@resend.dev>",to:[n],subject:`[PV5 시공(예약) 확인서] ${(s==null?void 0:s.receiverName)||"고객"}님 시공(예약) 확인서`,html:R};u&&p&&(console.log("Adding attachment to email:",p),b.attachments=[{filename:p,content:u,content_type:m||"image/png"}]);const v=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${t.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify(b)}),E=await v.json();return v.ok?(console.log("Email sent successfully:",E),e.json({success:!0,message:"이메일이 성공적으로 발송되었습니다!",emailId:E.id})):(console.error("Resend API Error:",E),e.json({success:!1,message:"이메일 발송에 실패했습니다. 다시 시도해주세요.",error:E},200))}catch(t){return console.error("Email sending error:",t),e.json({success:!1,message:"이메일 발송 중 오류가 발생했습니다.",error:t instanceof Error?t.message:"Unknown error"},500)}});T.post("/api/upload-image",async e=>{try{const{env:t}=e,n=(await e.req.formData()).get("image");if(!n)return e.json({success:!1,message:"이미지 파일이 없습니다."},400);const s=`images/${Date.now()}-${Math.random().toString(36).substring(7)}-${n.name}`;return await t.R2.put(s,n.stream()),e.json({success:!0,imageKey:s,filename:n.name})}catch(t){return console.error("Image upload error:",t),e.json({success:!1,message:"이미지 업로드 실패",error:t instanceof Error?t.message:"Unknown error"},500)}});T.post("/api/reports/save",async e=>{try{const{env:t}=e;if(!t.DB)return console.error("❌ D1 binding not found!",Object.keys(t)),e.json({success:!1,message:"D1 데이터베이스가 연결되지 않았습니다.",error:"D1 binding missing"},500);const r=await e.req.json(),{reportId:n,customerInfo:s,packages:a,packagePositions:i,installDate:d,installTime:c,installAddress:l,notes:u,installerName:p,attachmentImage:m,attachmentFileName:k}=r,R=n||`REPORT-${Date.now()}`,b=R.replace(/[^a-zA-Z0-9-_]/g,"_");console.log("Original reportId:",R),console.log("Sanitized finalReportId:",b);let v=null;if(m&&t.R2)try{v=`images/${Date.now()}-${b.replace(/[^a-zA-Z0-9-]/g,"_")}-${(k||"attachment.jpg").replace(/[^a-zA-Z0-9.-]/g,"_")}`,console.log("Saving image to R2:",v);const C=atob(m),S=new Uint8Array(C.length);for(let G=0;G<C.length;G++)S[G]=C.charCodeAt(G);await t.R2.put(v,S),console.log("Image saved to R2 successfully")}catch(C){console.error("R2 save error (continuing without image):",C),v=null}console.log("Preparing to save to D1..."),console.log("env.DB type:",typeof t.DB),console.log("env.DB:",t.DB),console.log("finalReportId:",b);const E=`INSERT OR REPLACE INTO reports (
      report_id, customer_info, packages, package_positions,
      install_date, install_time, install_address, notes,
      installer_name, image_key, image_filename,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`;console.log("SQL Query:",E),console.log("Calling env.DB.prepare()...");const w=t.DB.prepare(E);console.log("Statement prepared successfully"),console.log("Binding values...");const y=[b,JSON.stringify(s||{}),JSON.stringify(a||[]),JSON.stringify(i||{}),d||null,c||null,l||null,u||null,p||null,v||null,k||null];return console.log("Bind values count:",y.length),console.log("Bind values:",JSON.stringify(y,null,2)),await w.bind(...y).run(),console.log("Report saved to D1:",b),e.json({success:!0,message:"시공 확인서가 저장되었습니다!",reportId:b})}catch(t){return console.error("Report save error:",t),console.error("Error stack:",t instanceof Error?t.stack:"No stack"),console.error("Error details:",JSON.stringify(t,null,2)),e.json({success:!1,message:"저장 중 오류가 발생했습니다.",error:t instanceof Error?t.message:"Unknown error",errorStack:t instanceof Error?t.stack:void 0},500)}});T.get("/api/reports/list",async e=>{try{const{env:t}=e,r=t.DB.prepare(`
      SELECT 
        id, report_id, customer_info, packages, package_positions,
        install_date, install_time, install_address, notes,
        installer_name, image_key, image_filename,
        created_at, updated_at
      FROM reports
      ORDER BY created_at DESC
      LIMIT 100
    `),{results:n}=await r.all(),s=n.map(a=>({reportId:a.report_id,id:a.report_id,customerInfo:a.customer_info?JSON.parse(a.customer_info):null,packages:a.packages?JSON.parse(a.packages):[],packagePositions:a.package_positions?JSON.parse(a.package_positions):{},installDate:a.install_date,installTime:a.install_time,installAddress:a.install_address,notes:a.notes,installerName:a.installer_name,imageKey:a.image_key,imageFilename:a.image_filename,createdAt:a.created_at,updatedAt:a.updated_at}));return e.json({success:!0,reports:s})}catch(t){return console.error("Report list error:",t),e.json({success:!1,reports:[],error:t instanceof Error?t.message:"Unknown error"},500)}});T.get("/api/reports/:id",async e=>{try{const{env:t}=e,r=e.req.param("id"),{results:n}=await t.DB.prepare(` // UPDATED
      SELECT  // UPDATED
        id, report_id, customer_info, packages, package_positions, // UPDATED
        install_date, install_time, install_address, notes, // UPDATED
        installer_name, image_key, image_filename, // UPDATED
        created_at, updated_at // UPDATED
      FROM reports // UPDATED
      WHERE report_id = ? // UPDATED
    `).bind(r).all();if(n.length===0)return e.json({success:!1,message:"시공 확인서를 찾을 수 없습니다."},404);const s=n[0],a={reportId:s.report_id,id:s.report_id,customerInfo:s.customer_info?JSON.parse(s.customer_info):null,packages:s.packages?JSON.parse(s.packages):[],packagePositions:s.package_positions?JSON.parse(s.package_positions):{},installDate:s.install_date,installTime:s.install_time,installAddress:s.install_address,notes:s.notes,installerName:s.installer_name,imageKey:s.image_key,imageFilename:s.image_filename,createdAt:s.created_at,updatedAt:s.updated_at};return e.json({success:!0,report:a})}catch(t){return console.error("Report load error:",t),e.json({success:!1,message:"불러오기 중 오류가 발생했습니다.",error:t instanceof Error?t.message:"Unknown error"},500)}});T.delete("/api/reports/:id",async e=>{try{const{env:t}=e,r=e.req.param("id");if(!t.REPORTS_KV)return e.json({success:!1,message:"KV 스토리지가 설정되지 않았습니다."},404);await t.REPORTS_KV.delete(r);const n="report-index",s=await t.REPORTS_KV.get(n);if(s){const i=JSON.parse(s).filter(d=>d.id!==r);await t.REPORTS_KV.put(n,JSON.stringify(i))}return e.json({success:!0,message:"시공 확인서가 삭제되었습니다."})}catch(t){return console.error("Report delete error:",t),e.json({success:!1,message:"삭제 중 오류가 발생했습니다.",error:t instanceof Error?t.message:"Unknown error"},500)}});T.get("/",e=>e.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PV5 시공(예약) 확인서 시스템</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          .file-upload-area {
            border: 2px dashed #cbd5e0;
            transition: all 0.3s;
          }
          .file-upload-area:hover {
            border-color: #4299e1;
            background-color: #ebf8ff;
          }
          .package-card {
            transition: all 0.3s;
            cursor: pointer;
          }
          .package-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          }
          .package-card.selected {
            border: 3px solid #4299e1;
            background-color: #ebf8ff;
          }
          .step-indicator {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;
          }
          .step {
            flex: 1;
            text-align: center;
            padding: 1rem;
            border-bottom: 3px solid #e2e8f0;
            color: #a0aec0;
          }
          .step.active {
            border-bottom-color: #4299e1;
            color: #4299e1;
            font-weight: bold;
          }
          .step.completed {
            border-bottom-color: #48bb78;
            color: #48bb78;
          }
          
          /* 인쇄 전용 스타일 */
          @media print {
            /* body의 모든 자식 요소 중 모달 제외하고 숨김 */
            body > *:not(#previewModal) {
              display: none !important;
            }
            
            body {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }
            
            /* 모달 배경 투명 */
            .modal-overlay {
              background: white !important;
              position: static !important;
              padding: 0 !important;
              display: block !important;
            }
            
            /* 모달 내용 전체 화면 */
            .modal-content {
              max-width: 100% !important;
              max-height: none !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* 헤더와 푸터 숨김 */
            .modal-header,
            .modal-footer {
              display: none !important;
            }
            
            /* 모달만 표시 */
            #previewModal {
              display: block !important;
              position: static !important;
              background: white !important;
            }
            
            /* 테두리 제거 */
            #previewModal .border-2 {
              border: none !important;
            }
          }
        </style>
        <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"><\/script>
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen">
            <!-- Header -->
            <header class="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <img src="/static/kvan-logo.png" alt="K-VAN" class="h-12 w-auto bg-white px-3 py-1 rounded-lg">
                            <div>
                                <h1 class="text-3xl font-bold flex items-center">
                                    <i class="fas fa-clipboard-check mr-3"></i>
                                    PV5 시공(예약) 확인서 시스템
                                </h1>
                                <p class="text-blue-100 mt-2">거래명세서 자동 인식 → 제품 선택 → 설치 일정 확정 → PDF/메일 발송</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <!-- Main Content -->
            <main class="container mx-auto px-4 py-8">
                <!-- Step Indicator -->
                <div class="step-indicator bg-white rounded-lg shadow-md mb-8">
                    <div class="step active" id="step1">
                        <i class="fas fa-upload text-2xl mb-2"></i>
                        <div>1. 거래명세서 업로드</div>
                    </div>
                    <div class="step" id="step2">
                        <i class="fas fa-box text-2xl mb-2"></i>
                        <div>2. 제품 선택</div>
                    </div>
                    <div class="step" id="step3">
                        <i class="fas fa-calendar-alt text-2xl mb-2"></i>
                        <div>3. 설치 정보 입력</div>
                    </div>
                    <div class="step" id="step4">
                        <i class="fas fa-check-circle text-2xl mb-2"></i>
                        <div>4. 확인 및 발송</div>
                    </div>
                    <div class="step" id="step5">
                        <i class="fas fa-folder-open text-2xl mb-2"></i>
                        <div>5. 저장 문서 관리</div>
                    </div>
                </div>

                <!-- Step 1: 파일 업로드 -->
                <div id="upload-section" class="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-file-upload text-blue-600 mr-2"></i>
                        1단계: 거래명세서 업로드
                    </h2>
                    <div class="file-upload-area rounded-lg p-12 text-center cursor-pointer" id="dropZone">
                        <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                        <p class="text-lg text-gray-600 mb-4">거래명세서 이미지를 드래그하거나 클릭하여 업로드</p>
                        <input type="file" id="fileInput" accept="image/*" class="hidden">
                        <div class="flex justify-center space-x-3">
                            <button onclick="document.getElementById('fileInput').click(); event.stopPropagation();" 
                                    class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-folder-open mr-2"></i>파일 선택
                            </button>
                            <button onclick="showManualInputForm(); event.stopPropagation();" 
                                    class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition">
                                <i class="fas fa-keyboard mr-2"></i>수동 입력
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-4">지원 형식: JPG, PNG, GIF (최대 10MB)</p>
                    </div>
                    <div id="uploadResult" class="mt-6 hidden">
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 class="font-bold text-green-800 mb-2">
                                <i class="fas fa-check-circle mr-2"></i>자동 인식 완료
                            </h3>
                            <div id="ocrData" class="grid grid-cols-2 gap-4 text-sm"></div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: 제품 선택 -->
                <div id="package-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-box-open text-blue-600 mr-2"></i>
                        2단계: 시공 제품 선택
                    </h2>
                    
                    <!-- 브랜드 선택 탭 -->
                    <div class="flex space-x-4 mb-6">
                        <button onclick="showBrand('milwaukee')" 
                                class="brand-tab flex-1 py-3 px-6 rounded-lg font-bold transition"
                                data-brand="milwaukee">
                            <i class="fas fa-tools mr-2"></i>밀워키 에디션
                        </button>
                        <button onclick="showBrand('kia')" 
                                class="brand-tab flex-1 py-3 px-6 rounded-lg font-bold transition"
                                data-brand="kia">
                            <i class="fas fa-car mr-2"></i>기아 순정형
                        </button>
                    </div>
                    
                    <!-- 제품 패키지 카드 -->
                    <div id="packageGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
                </div>

                <!-- Step 3: 설치 정보 입력 -->
                <div id="install-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-calendar-check text-blue-600 mr-2"></i>
                        3단계: 설치 일정 및 장소 확정
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-calendar mr-2"></i>설치 날짜
                            </label>
                            <input type="date" id="installDate" 
                                   class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-clock mr-2"></i>설치 시간
                            </label>
                            <div class="space-y-2">
                                <div class="flex gap-2">
                                    <button type="button" id="timePeriodAM" onclick="selectTimePeriod('AM')"
                                            class="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                                        오전
                                    </button>
                                    <button type="button" id="timePeriodPM" onclick="selectTimePeriod('PM')"
                                            class="flex-1 px-3 py-2 text-sm border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                                        오후
                                    </button>
                                </div>
                                <div class="grid grid-cols-5 gap-1">
                                    <button type="button" onclick="selectTimeHour('9')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">9시</button>
                                    <button type="button" onclick="selectTimeHour('10')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">10시</button>
                                    <button type="button" onclick="selectTimeHour('11')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">11시</button>
                                    <button type="button" onclick="selectTimeHour('12')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">12시</button>
                                    <button type="button" onclick="selectTimeHour('1')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">1시</button>
                                    <button type="button" onclick="selectTimeHour('2')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">2시</button>
                                    <button type="button" onclick="selectTimeHour('3')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">3시</button>
                                    <button type="button" onclick="selectTimeHour('4')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">4시</button>
                                    <button type="button" onclick="selectTimeHour('5')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">5시</button>
                                    <button type="button" onclick="selectTimeHour('6')" class="time-hour-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-blue-50">6시</button>
                                </div>
                                <div class="grid grid-cols-6 gap-1">
                                    <button type="button" onclick="selectTimeMinute('00')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">00분</button>
                                    <button type="button" onclick="selectTimeMinute('10')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">10분</button>
                                    <button type="button" onclick="selectTimeMinute('20')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">20분</button>
                                    <button type="button" onclick="selectTimeMinute('30')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">30분</button>
                                    <button type="button" onclick="selectTimeMinute('40')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">40분</button>
                                    <button type="button" onclick="selectTimeMinute('50')" class="time-minute-btn px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-green-50">50분</button>
                                </div>
                                <button type="button" onclick="toggleCustomTimeInput()" class="w-full mt-2 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
                                    <i class="fas fa-keyboard mr-2"></i>직접 입력
                                </button>
                                <div id="customTimeInput" class="hidden mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div class="flex items-center gap-2 mb-2">
                                        <input type="number" id="customHour" min="1" max="12" placeholder="시" class="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center">
                                        <span class="text-sm font-bold">시</span>
                                        <input type="number" id="customMinute" min="0" max="59" placeholder="분" class="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center">
                                        <span class="text-sm font-bold">분</span>
                                        <button type="button" onclick="applyCustomTime()" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                            확인
                                        </button>
                                    </div>
                                    <p class="text-xs text-gray-600">※ 오전/오후를 먼저 선택한 후 시간을 입력하세요</p>
                                </div>
                                <input type="text" id="installTime" readonly
                                       class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-center font-semibold"
                                       placeholder="시간을 선택하세요">
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-map-marker-alt mr-2"></i>설치 주소
                            </label>
                            <div class="flex gap-2">
                                <input type="text" id="installAddress" 
                                       class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                       placeholder="설치 장소 주소를 입력하세요">
                                <button onclick="copyCustomerAddress()" type="button"
                                        class="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
                                    <i class="fas fa-copy mr-2"></i>고객 주소 복사
                                </button>
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-bold text-gray-700 mb-2">
                                <i class="fas fa-comment mr-2"></i>특이사항 / 비고
                            </label>
                            <textarea id="notes" rows="4"
                                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                      placeholder="설치 시 주의사항이나 특이사항을 입력하세요"></textarea>
                        </div>
                    </div>
                    <div class="mt-6 flex justify-end space-x-4">
                        <button onclick="prevStep(2)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                        <button onclick="nextStep(4)" 
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                            다음 <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 4: 최종 확인 및 발송 -->
                <div id="confirm-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-check-double text-blue-600 mr-2"></i>
                        4단계: 최종 확인 및 발송
                    </h2>
                    <div id="finalPreview" class="mb-6"></div>
                    <div class="flex justify-end space-x-4">
                        <button onclick="prevStep(3)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                        <button onclick="saveReport()" 
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                            <i class="fas fa-save mr-2"></i>저장하기
                        </button>
                        <button onclick="sendEmail()" 
                                class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
                            <i class="fas fa-envelope mr-2"></i>이메일 발송
                        </button>
                        <button onclick="nextStep(5)" 
                                class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700">
                            저장 문서 관리 <i class="fas fa-arrow-right ml-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 5: 저장 문서 관리 -->
                <div id="manage-section" class="bg-white rounded-lg shadow-lg p-8 mb-8 hidden">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">
                        <i class="fas fa-folder-open text-purple-600 mr-2"></i>
                        5단계: 저장 문서 관리
                    </h2>
                    
                    <!-- 검색 및 필터 -->
                    <div class="mb-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-calendar mr-2"></i>시작 날짜
                                </label>
                                <input type="date" id="searchStartDate" 
                                       onchange="searchReports()"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-calendar mr-2"></i>종료 날짜
                                </label>
                                <input type="date" id="searchEndDate" 
                                       onchange="searchReports()"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-2">
                                    <i class="fas fa-search mr-2"></i>고객명 검색
                                </label>
                                <input type="text" id="searchCustomerName" 
                                       placeholder="고객명 입력..."
                                       oninput="searchReports()"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            </div>
                        </div>
                        <div class="mt-4 flex justify-between items-center">
                            <div class="flex gap-2">
                                <button onclick="searchReports()" 
                                        class="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                                    <i class="fas fa-search mr-2"></i>검색
                                </button>
                                <button onclick="resetSearch()" 
                                        class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
                                    <i class="fas fa-redo mr-2"></i>초기화
                                </button>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="exportToExcel()" 
                                        class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                                    <i class="fas fa-file-excel mr-2"></i>Excel 내보내기
                                </button>
                                <button onclick="document.getElementById('excelFileInput').click()" 
                                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                    <i class="fas fa-upload mr-2"></i>데이터 가져오기
                                </button>
                                <button onclick="confirmDataReset()" 
                                        class="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700">
                                    <i class="fas fa-trash mr-2"></i>데이터 초기화
                                </button>
                            </div>
                        </div>
                        
                        <!-- 숨겨진 Excel 파일 입력 -->
                        <input type="file" id="excelFileInput" accept=".xlsx,.xls" style="display:none;" onchange="importFromExcel(event)" />
                    </div>
                    
                    <!-- 문서 목록 -->
                    <div id="reportsList" class="space-y-4">
                        <div class="text-center py-12 text-gray-500">
                            <i class="fas fa-folder-open text-6xl mb-4"></i>
                            <p>저장된 문서가 없습니다.</p>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-start">
                        <button onclick="prevStep(4)" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>이전
                        </button>
                    </div>
                </div>
            </main>

            <!-- Footer -->
            <footer class="bg-gray-800 text-white py-6 mt-12">
                <div class="container mx-auto px-4">
                    <div class="flex items-center justify-center gap-4">
                        <img src="/static/kvan-logo.png" alt="K-VAN" class="h-8 w-auto bg-white px-2 py-1 rounded">
                        <p>&copy; 2026 K-VAN PV5 시공관리 시스템. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
        <script src="/static/app.js"><\/script>
    </body>
    </html>
  `));const tt=new Et,Or=Object.assign({"/src/index.tsx":T});let qt=!1;for(const[,e]of Object.entries(Or))e&&(tt.all("*",t=>{let r;try{r=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,r)}),tt.notFound(t=>{let r;try{r=t.executionCtx}catch{}return e.fetch(t.req.raw,t.env,r)}),qt=!0);if(!qt)throw new Error("Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']");export{tt as default};
