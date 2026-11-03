(function(){"use strict";const Wt={fadeInMs:1100,cameraMs:6300,projectorMs:3200,projectorRampMs:600,beamMs:3500,beamRampMs:650,sparksMs:3650,igniteMs:4150,igniteRampMs:1300,wordmarkDelayMs:5650,wordmarkMs:700,holdMs:7200,waitingDelayMs:1500,reducedMotionHoldMs:400};function su(i){return i?Wt.reducedMotionHoldMs:Wt.holdMs}const ul="01ABCDEF23456789#%$@";function au(i,e,t=Math.random){if(e>=1)return i;const n=Math.floor(Math.max(0,e)*i.length);return Array.from(i,(r,s)=>r===" "||s<n?r:ul.charAt(Math.floor(t()*ul.length))).join("")}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ta="186",ou=0,fl=1,lu=2,Wr=1,cu=2,ir=3,ri=0,kt=1,jt=2,vn=0,rr=1,sr=2,dl=3,pl=4,hu=5,Ai=100,uu=101,fu=102,du=103,pu=104,mu=200,gu=201,vu=202,xu=203,ml=204,gl=205,_u=206,Mu=207,yu=208,Su=209,bu=210,wu=211,Eu=212,Tu=213,Au=214,na=0,ia=1,ra=2,ar=3,sa=4,aa=5,oa=6,la=7,vl=0,Ru=1,Cu=2,xn=0,xl=1,_l=2,Ml=3,yl=4,Sl=5,bl=6,wl=7,El=300,si=301,Ri=302,ca=303,ha=304,Xr=306,qr=1e3,_n=1001,Yr=1002,Pt=1003,Pu=1004,Zr=1005,Rt=1006,ua=1007,Hn=1008,qt=1009,Tl=1010,Al=1011,or=1012,fa=1013,Mn=1014,an=1015,Dt=1016,da=1017,pa=1018,lr=1020,Rl=35902,Cl=35899,Pl=1021,Ll=1022,on=1023,Pn=1026,ai=1027,Kr=1028,ma=1029,oi=1030,ga=1031,va=1033,$r=33776,Jr=33777,Qr=33778,jr=33779,xa=35840,_a=35841,Ma=35842,ya=35843,Sa=36196,ba=37492,wa=37496,Ea=37488,Ta=37489,es=37490,Aa=37491,Ra=37808,Ca=37809,Pa=37810,La=37811,Ia=37812,Da=37813,Na=37814,Ua=37815,Fa=37816,Oa=37817,Ba=37818,za=37819,ka=37820,Ha=37821,Ga=36492,Va=36494,Wa=36495,Xa=36283,qa=36284,ts=36285,Ya=36286,Lu=3200,Il=0,Iu=1,Gn="",Xt="srgb",ns="srgb-linear",is="linear",ct="srgb",Za=7680,Du=519,Nu=512,Uu=513,Fu=514,Ka=515,Ou=516,Bu=517,$a=518,zu=519,ku=35044,Dl="300 es",yn=2e3,rs=2001;function Hu(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ss(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Gu(){const i=ss("canvas");return i.style.display="block",i}const Nl={};function Ul(...i){const e="THREE."+i.shift();console.log(e,...i)}function Fl(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ke(...i){i=Fl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function it(...i){i=Fl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Ci(...i){const e=i.join(" ");e in Nl||(Nl[e]=!0,Ke(...i))}function Vu(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}const Wu={[na]:ia,[ra]:oa,[sa]:la,[ar]:aa,[ia]:na,[oa]:ra,[la]:sa,[aa]:ar};class li{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const r=n[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Nt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Ol=1234567;const cr=Math.PI/180,hr=180/Math.PI;function ci(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Nt[i&255]+Nt[i>>8&255]+Nt[i>>16&255]+Nt[i>>24&255]+"-"+Nt[e&255]+Nt[e>>8&255]+"-"+Nt[e>>16&15|64]+Nt[e>>24&255]+"-"+Nt[t&63|128]+Nt[t>>8&255]+"-"+Nt[t>>16&255]+Nt[t>>24&255]+Nt[n&255]+Nt[n>>8&255]+Nt[n>>16&255]+Nt[n>>24&255]).toLowerCase()}function et(i,e,t){return Math.max(e,Math.min(t,i))}function Ja(i,e){return(i%e+e)%e}function Xu(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)}function qu(i,e,t){return i!==e?(t-i)/(e-i):0}function ur(i,e,t){return(1-t)*i+t*e}function Yu(i,e,t,n){return ur(i,e,1-Math.exp(-t*n))}function Zu(i,e=1){return e-Math.abs(Ja(i,e*2)-e)}function Ku(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function $u(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Ju(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Qu(i,e){return i+Math.random()*(e-i)}function ju(i){return i*(.5-Math.random())}function ef(i){i!==void 0&&(Ol=i);let e=Ol+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function tf(i){return i*cr}function nf(i){return i*hr}function rf(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function sf(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function af(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function of(i,e,t,n,r){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+n)/2),h=a((e+n)/2),f=s((e-n)/2),u=a((e-n)/2),d=s((n-e)/2),g=a((n-e)/2);switch(r){case"XYX":i.set(o*h,l*f,l*u,o*c);break;case"YZY":i.set(l*u,o*h,l*f,o*c);break;case"ZXZ":i.set(l*f,l*u,o*h,o*c);break;case"XZX":i.set(o*h,l*g,l*d,o*c);break;case"YXY":i.set(l*d,o*h,l*g,o*c);break;case"ZYZ":i.set(l*g,l*d,o*h,o*c);break;default:Ke("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Pi(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Ht(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const lf={DEG2RAD:cr,RAD2DEG:hr,generateUUID:ci,clamp:et,euclideanModulo:Ja,mapLinear:Xu,inverseLerp:qu,lerp:ur,damp:Yu,pingpong:Zu,smoothstep:Ku,smootherstep:$u,randInt:Ju,randFloat:Qu,randFloatSpread:ju,seededRandom:ef,degToRad:tf,radToDeg:nf,isPowerOfTwo:rf,ceilPowerOfTwo:sf,floorPowerOfTwo:af,setQuaternionFromProperEuler:of,normalize:Ht,denormalize:Pi},rl=class rl{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(et(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(et(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};rl.prototype.isVector2=!0;let ae=rl;class Ln{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let l=n[r+0],c=n[r+1],h=n[r+2],f=n[r+3],u=s[a+0],d=s[a+1],g=s[a+2],x=s[a+3];if(f!==x||l!==u||c!==d||h!==g){let m=l*u+c*d+h*g+f*x;m<0&&(u=-u,d=-d,g=-g,x=-x,m=-m);let p=1-o;if(m<.9995){const b=Math.acos(m),S=Math.sin(b);p=Math.sin(p*b)/S,o=Math.sin(o*b)/S,l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,f=f*p+x*o}else{l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,f=f*p+x*o;const b=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=b,c*=b,h*=b,f*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],l=n[r+1],c=n[r+2],h=n[r+3],f=s[a],u=s[a+1],d=s[a+2],g=s[a+3];return e[t]=o*g+h*f+l*d-c*u,e[t+1]=l*g+h*u+c*f-o*d,e[t+2]=c*g+h*d+o*u-l*f,e[t+3]=h*g-o*f-l*u-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(r/2),f=o(s/2),u=l(n/2),d=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"YXZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"ZXY":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"ZYX":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"YZX":this._x=u*h*f+c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f-u*d*g;break;case"XZY":this._x=u*h*f-c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f+u*d*g;break;default:Ke("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],f=t[10],u=n+o+f;if(u>0){const d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-l)*d,this._y=(s-c)*d,this._z=(a-r)*d}else if(n>o&&n>f){const d=2*Math.sqrt(1+n-o-f);this._w=(h-l)/d,this._x=.25*d,this._y=(r+a)/d,this._z=(s+c)/d}else if(o>f){const d=2*Math.sqrt(1+o-n-f);this._w=(s-c)/d,this._x=(r+a)/d,this._y=.25*d,this._z=(l+h)/d}else{const d=2*Math.sqrt(1+f-n-o);this._w=(a-r)/d,this._x=(s+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(et(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-n*c,this._z=s*h+a*c+n*l-r*o,this._w=a*h-n*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const sl=class sl{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Bl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Bl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*n),h=2*(o*t-s*r),f=2*(s*n-a*t);return this.x=t+l*c+a*f-o*h,this.y=n+l*h+o*c-s*f,this.z=r+l*f+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this.z=et(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this.z=et(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(et(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Qa.copy(this).projectOnVector(e),this.sub(Qa)}reflect(e){return this.sub(Qa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(et(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};sl.prototype.isVector3=!0;let U=sl;const Qa=new U,Bl=new Ln,al=class al{constructor(e,t,n,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c)}set(e,t,n,r,s,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],f=n[7],u=n[2],d=n[5],g=n[8],x=r[0],m=r[3],p=r[6],b=r[1],S=r[4],v=r[7],w=r[2],T=r[5],C=r[8];return s[0]=a*x+o*b+l*w,s[3]=a*m+o*S+l*T,s[6]=a*p+o*v+l*C,s[1]=c*x+h*b+f*w,s[4]=c*m+h*S+f*T,s[7]=c*p+h*v+f*C,s[2]=u*x+d*b+g*w,s[5]=u*m+d*S+g*T,s[8]=u*p+d*v+g*C,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*s*h+n*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=h*a-o*c,u=o*l-h*s,d=c*s-a*l,g=t*f+n*u+r*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/g;return e[0]=f*x,e[1]=(r*c-h*n)*x,e[2]=(o*n-r*a)*x,e[3]=u*x,e[4]=(h*t-r*l)*x,e[5]=(r*s-o*t)*x,e[6]=d*x,e[7]=(n*l-c*t)*x,e[8]=(a*t-n*s)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Ci("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ja.makeScale(e,t)),this}rotate(e){return Ci("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ja.makeRotation(-e)),this}translate(e,t){return Ci("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ja.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};al.prototype.isMatrix3=!0;let qe=al;const ja=new qe,zl=new qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),kl=new qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function cf(){const i={enabled:!0,workingColorSpace:ns,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===ct&&(r.r=In(r.r),r.g=In(r.g),r.b=In(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ct&&(r.r=Li(r.r),r.g=Li(r.g),r.b=Li(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Gn?is:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Ci("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Ci("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[ns]:{primaries:e,whitePoint:n,transfer:is,toXYZ:zl,fromXYZ:kl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Xt},outputColorSpaceConfig:{drawingBufferColorSpace:Xt}},[Xt]:{primaries:e,whitePoint:n,transfer:ct,toXYZ:zl,fromXYZ:kl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Xt}}}),i}const nt=cf();function In(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Li(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let Ii;class hf{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Ii===void 0&&(Ii=ss("canvas")),Ii.width=e.width,Ii.height=e.height;const r=Ii.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=Ii}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=ss("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=In(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(In(t[n]/255)*255):t[n]=In(t[n]);return{data:t,width:e.width,height:e.height}}else return Ke("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let uf=0;class eo{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:uf++}),this.uuid=ci(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(to(r[a].image)):s.push(to(r[a]))}else s=to(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function to(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?hf.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ke("Texture: Unable to serialize Texture."),{})}let ff=0;const no=new U;class Ut extends li{constructor(e=Ut.DEFAULT_IMAGE,t=Ut.DEFAULT_MAPPING,n=_n,r=_n,s=Rt,a=Hn,o=on,l=qt,c=Ut.DEFAULT_ANISOTROPY,h=Gn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ff++}),this.uuid=ci(),this.name="",this.source=new eo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ae(0,0),this.repeat=new ae(1,1),this.center=new ae(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(no).x}get height(){return this.source.getSize(no).y}get depth(){return this.source.getSize(no).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ke(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ke(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==El)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case qr:e.x=e.x-Math.floor(e.x);break;case _n:e.x=e.x<0?0:1;break;case Yr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case qr:e.y=e.y-Math.floor(e.y);break;case _n:e.y=e.y<0?0:1;break;case Yr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Ut.DEFAULT_IMAGE=null,Ut.DEFAULT_MAPPING=El,Ut.DEFAULT_ANISOTROPY=1;const ol=class ol{constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const l=e.elements,c=l[0],h=l[4],f=l[8],u=l[1],d=l[5],g=l[9],x=l[2],m=l[6],p=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-x)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+x)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const S=(c+1)/2,v=(d+1)/2,w=(p+1)/2,T=(h+u)/4,C=(f+x)/4,_=(g+m)/4;return S>v&&S>w?S<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(S),r=T/n,s=C/n):v>w?v<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(v),n=T/r,s=_/r):w<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(w),n=C/s,r=_/s),this.set(n,r,s,t),this}let b=Math.sqrt((m-g)*(m-g)+(f-x)*(f-x)+(u-h)*(u-h));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(f-x)/b,this.z=(u-h)/b,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this.z=et(this.z,e.z,t.z),this.w=et(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this.z=et(this.z,e,t),this.w=et(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(et(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};ol.prototype.isVector4=!0;let mt=ol;class df extends li{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Rt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new mt(0,0,e,t),this.scissorTest=!1,this.viewport=new mt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:n.depth},s=new Ut(r),a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Rt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new eo(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Lt extends df{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Hl extends Ut{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Pt,this.minFilter=Pt,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class pf extends Ut{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Pt,this.minFilter=Pt,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const Qs=class Qs{constructor(e,t,n,r,s,a,o,l,c,h,f,u,d,g,x,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c,h,f,u,d,g,x,m)}set(e,t,n,r,s,a,o,l,c,h,f,u,d,g,x,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=f,p[14]=u,p[3]=d,p[7]=g,p[11]=x,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Qs().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,r=1/Di.setFromMatrixColumn(e,0).length(),s=1/Di.setFromMatrixColumn(e,1).length(),a=1/Di.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const u=a*h,d=a*f,g=o*h,x=o*f;t[0]=l*h,t[4]=-l*f,t[8]=c,t[1]=d+g*c,t[5]=u-x*c,t[9]=-o*l,t[2]=x-u*c,t[6]=g+d*c,t[10]=a*l}else if(e.order==="YXZ"){const u=l*h,d=l*f,g=c*h,x=c*f;t[0]=u+x*o,t[4]=g*o-d,t[8]=a*c,t[1]=a*f,t[5]=a*h,t[9]=-o,t[2]=d*o-g,t[6]=x+u*o,t[10]=a*l}else if(e.order==="ZXY"){const u=l*h,d=l*f,g=c*h,x=c*f;t[0]=u-x*o,t[4]=-a*f,t[8]=g+d*o,t[1]=d+g*o,t[5]=a*h,t[9]=x-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const u=a*h,d=a*f,g=o*h,x=o*f;t[0]=l*h,t[4]=g*c-d,t[8]=u*c+x,t[1]=l*f,t[5]=x*c+u,t[9]=d*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const u=a*l,d=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=x-u*f,t[8]=g*f+d,t[1]=f,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=d*f+g,t[10]=u-x*f}else if(e.order==="XZY"){const u=a*l,d=a*c,g=o*l,x=o*c;t[0]=l*h,t[4]=-f,t[8]=c*h,t[1]=u*f+x,t[5]=a*h,t[9]=d*f-g,t[2]=g*f-d,t[6]=o*h,t[10]=x*f+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(mf,e,gf)}lookAt(e,t,n){const r=this.elements;return Yt.subVectors(e,t),Yt.lengthSq()===0&&(Yt.z=1),Yt.normalize(),Vn.crossVectors(n,Yt),Vn.lengthSq()===0&&(Math.abs(n.z)===1?Yt.x+=1e-4:Yt.z+=1e-4,Yt.normalize(),Vn.crossVectors(n,Yt)),Vn.normalize(),as.crossVectors(Yt,Vn),r[0]=Vn.x,r[4]=as.x,r[8]=Yt.x,r[1]=Vn.y,r[5]=as.y,r[9]=Yt.y,r[2]=Vn.z,r[6]=as.z,r[10]=Yt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],f=n[5],u=n[9],d=n[13],g=n[2],x=n[6],m=n[10],p=n[14],b=n[3],S=n[7],v=n[11],w=n[15],T=r[0],C=r[4],_=r[8],A=r[12],F=r[1],G=r[5],z=r[9],J=r[13],k=r[2],Y=r[6],ne=r[10],$=r[14],K=r[3],re=r[7],se=r[11],ue=r[15];return s[0]=a*T+o*F+l*k+c*K,s[4]=a*C+o*G+l*Y+c*re,s[8]=a*_+o*z+l*ne+c*se,s[12]=a*A+o*J+l*$+c*ue,s[1]=h*T+f*F+u*k+d*K,s[5]=h*C+f*G+u*Y+d*re,s[9]=h*_+f*z+u*ne+d*se,s[13]=h*A+f*J+u*$+d*ue,s[2]=g*T+x*F+m*k+p*K,s[6]=g*C+x*G+m*Y+p*re,s[10]=g*_+x*z+m*ne+p*se,s[14]=g*A+x*J+m*$+p*ue,s[3]=b*T+S*F+v*k+w*K,s[7]=b*C+S*G+v*Y+w*re,s[11]=b*_+S*z+v*ne+w*se,s[15]=b*A+S*J+v*$+w*ue,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],f=e[6],u=e[10],d=e[14],g=e[3],x=e[7],m=e[11],p=e[15],b=l*d-c*u,S=o*d-c*f,v=o*u-l*f,w=a*d-c*h,T=a*u-l*h,C=a*f-o*h;return t*(x*b-m*S+p*v)-n*(g*b-m*w+p*T)+r*(g*S-x*w+p*C)-s*(g*v-x*T+m*C)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(s*h-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=e[9],u=e[10],d=e[11],g=e[12],x=e[13],m=e[14],p=e[15],b=t*o-n*a,S=t*l-r*a,v=t*c-s*a,w=n*l-r*o,T=n*c-s*o,C=r*c-s*l,_=h*x-f*g,A=h*m-u*g,F=h*p-d*g,G=f*m-u*x,z=f*p-d*x,J=u*p-d*m,k=b*J-S*z+v*G+w*F-T*A+C*_;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const Y=1/k;return e[0]=(o*J-l*z+c*G)*Y,e[1]=(r*z-n*J-s*G)*Y,e[2]=(x*C-m*T+p*w)*Y,e[3]=(u*T-f*C-d*w)*Y,e[4]=(l*F-a*J-c*A)*Y,e[5]=(t*J-r*F+s*A)*Y,e[6]=(m*v-g*C-p*S)*Y,e[7]=(h*C-u*v+d*S)*Y,e[8]=(a*z-o*F+c*_)*Y,e[9]=(n*F-t*z-s*_)*Y,e[10]=(g*T-x*v+p*b)*Y,e[11]=(f*v-h*T-d*b)*Y,e[12]=(o*A-a*G-l*_)*Y,e[13]=(t*G-n*A+r*_)*Y,e[14]=(x*S-g*w-m*b)*Y,e[15]=(h*w-f*S+u*b)*Y,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+n,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+n,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,h=a+a,f=o+o,u=s*c,d=s*h,g=s*f,x=a*h,m=a*f,p=o*f,b=l*c,S=l*h,v=l*f,w=n.x,T=n.y,C=n.z;return r[0]=(1-(x+p))*w,r[1]=(d+v)*w,r[2]=(g-S)*w,r[3]=0,r[4]=(d-v)*T,r[5]=(1-(u+p))*T,r[6]=(m+b)*T,r[7]=0,r[8]=(g+S)*C,r[9]=(m-b)*C,r[10]=(1-(u+x))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),t.identity(),this;let a=Di.set(r[0],r[1],r[2]).length();const o=Di.set(r[4],r[5],r[6]).length(),l=Di.set(r[8],r[9],r[10]).length();s<0&&(a=-a),ln.copy(this);const c=1/a,h=1/o,f=1/l;return ln.elements[0]*=c,ln.elements[1]*=c,ln.elements[2]*=c,ln.elements[4]*=h,ln.elements[5]*=h,ln.elements[6]*=h,ln.elements[8]*=f,ln.elements[9]*=f,ln.elements[10]*=f,t.setFromRotationMatrix(ln),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,r,s,a,o=yn,l=!1){const c=this.elements,h=2*s/(t-e),f=2*s/(n-r),u=(t+e)/(t-e),d=(n+r)/(n-r);let g,x;if(l)g=s/(a-s),x=a*s/(a-s);else if(o===yn)g=-(a+s)/(a-s),x=-2*a*s/(a-s);else if(o===rs)g=-a/(a-s),x=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=yn,l=!1){const c=this.elements,h=2/(t-e),f=2/(n-r),u=-(t+e)/(t-e),d=-(n+r)/(n-r);let g,x;if(l)g=1/(a-s),x=a/(a-s);else if(o===yn)g=-2/(a-s),x=-(a+s)/(a-s);else if(o===rs)g=-1/(a-s),x=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Qs.prototype.isMatrix4=!0;let ht=Qs;const Di=new U,ln=new ht,mf=new U(0,0,0),gf=new U(1,1,1),Vn=new U,as=new U,Yt=new U,Gl=new ht,Vl=new Ln;class Wn{constructor(e=0,t=0,n=0,r=Wn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],f=r[2],u=r[6],d=r[10];switch(t){case"XYZ":this._y=Math.asin(et(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-et(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(et(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-et(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(et(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-et(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Ke("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Gl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Gl,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Vl.setFromEuler(this),this.setFromQuaternion(Vl,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Wn.DEFAULT_ORDER="XYZ";class Wl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let vf=0;const Xl=new U,Ni=new Ln,Dn=new ht,os=new U,fr=new U,xf=new U,_f=new Ln,ql=new U(1,0,0),Yl=new U(0,1,0),Zl=new U(0,0,1),Kl={type:"added"},Mf={type:"removed"},Ui={type:"childadded",child:null},io={type:"childremoved",child:null};class Zt extends li{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:vf++}),this.uuid=ci(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Zt.DEFAULT_UP.clone();const e=new U,t=new Wn,n=new Ln,r=new U(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ht},normalMatrix:{value:new qe}}),this.matrix=new ht,this.matrixWorld=new ht,this.matrixAutoUpdate=Zt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Zt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Wl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ni.setFromAxisAngle(e,t),this.quaternion.multiply(Ni),this}rotateOnWorldAxis(e,t){return Ni.setFromAxisAngle(e,t),this.quaternion.premultiply(Ni),this}rotateX(e){return this.rotateOnAxis(ql,e)}rotateY(e){return this.rotateOnAxis(Yl,e)}rotateZ(e){return this.rotateOnAxis(Zl,e)}translateOnAxis(e,t){return Xl.copy(e).applyQuaternion(this.quaternion),this.position.add(Xl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(ql,e)}translateY(e){return this.translateOnAxis(Yl,e)}translateZ(e){return this.translateOnAxis(Zl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Dn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?os.copy(e):os.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),fr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Dn.lookAt(fr,os,this.up):Dn.lookAt(os,fr,this.up),this.quaternion.setFromRotationMatrix(Dn),r&&(Dn.extractRotation(r.matrixWorld),Ni.setFromRotationMatrix(Dn),this.quaternion.premultiply(Ni.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(it("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Kl),Ui.child=e,this.dispatchEvent(Ui),Ui.child=null):it("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Mf),io.child=e,this.dispatchEvent(io),io.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Dn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Dn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Dn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Kl),Ui.child=e,this.dispatchEvent(Ui),Ui.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fr,e,xf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(fr,_f,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*n-s[8]*r,s[13]+=n-s[1]*t-s[5]*n-s[9]*r,s[14]+=r-s[2]*t-s[6]*n-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),f=a(e.shapes),u=a(e.skeletons),d=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=r,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Zt.DEFAULT_UP=new U(0,1,0),Zt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Zt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class dr extends Zt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const yf={type:"move"};class ro{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new dr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new dr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new dr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const x of e.hand.values()){const m=t.getJointPose(x,n),p=this._getHandJoint(c,x);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&u>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(yf)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new dr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const $l={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Xn={h:0,s:0,l:0},ls={h:0,s:0,l:0};function so(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Ye{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,nt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=nt.workingColorSpace){return this.r=e,this.g=t,this.b=n,nt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=nt.workingColorSpace){if(e=Ja(e,1),t=et(t,0,1),n=et(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=so(a,s,e+1/3),this.g=so(a,s,e),this.b=so(a,s,e-1/3)}return nt.colorSpaceToWorking(this,r),this}setStyle(e,t=Xt){function n(s){s!==void 0&&parseFloat(s)<1&&Ke("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ke("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ke("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Xt){const n=$l[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ke("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=In(e.r),this.g=In(e.g),this.b=In(e.b),this}copyLinearToSRGB(e){return this.r=Li(e.r),this.g=Li(e.g),this.b=Li(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Xt){return nt.workingToColorSpace(Ft.copy(this),e),Math.round(et(Ft.r*255,0,255))*65536+Math.round(et(Ft.g*255,0,255))*256+Math.round(et(Ft.b*255,0,255))}getHexString(e=Xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=nt.workingColorSpace){nt.workingToColorSpace(Ft.copy(this),t);const n=Ft.r,r=Ft.g,s=Ft.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=h<=.5?f/(a+o):f/(2-a-o),a){case n:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-n)/f+2;break;case s:l=(n-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=nt.workingColorSpace){return nt.workingToColorSpace(Ft.copy(this),t),e.r=Ft.r,e.g=Ft.g,e.b=Ft.b,e}getStyle(e=Xt){nt.workingToColorSpace(Ft.copy(this),e);const t=Ft.r,n=Ft.g,r=Ft.b;return e!==Xt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(Xn),this.setHSL(Xn.h+e,Xn.s+t,Xn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Xn),e.getHSL(ls);const n=ur(Xn.h,ls.h,t),r=ur(Xn.s,ls.s,t),s=ur(Xn.l,ls.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ft=new Ye;Ye.NAMES=$l;class Sf extends Zt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wn,this.environmentIntensity=1,this.environmentRotation=new Wn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const cn=new U,Nn=new U,ao=new U,Un=new U,Fi=new U,Oi=new U,Jl=new U,oo=new U,lo=new U,co=new U,ho=new mt,uo=new mt,fo=new mt;class hn{constructor(e=new U,t=new U,n=new U){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),cn.subVectors(e,t),r.cross(cn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){cn.subVectors(r,t),Nn.subVectors(n,t),ao.subVectors(e,t);const a=cn.dot(cn),o=cn.dot(Nn),l=cn.dot(ao),c=Nn.dot(Nn),h=Nn.dot(ao),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;const u=1/f,d=(c*l-o*h)*u,g=(a*h-o*l)*u;return s.set(1-d-g,g,d)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(e,t,n,r,s,a,o,l){return this.getBarycoord(e,t,n,r,Un)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Un.x),l.addScaledVector(a,Un.y),l.addScaledVector(o,Un.z),l)}static getInterpolatedAttribute(e,t,n,r,s,a){return ho.setScalar(0),uo.setScalar(0),fo.setScalar(0),ho.fromBufferAttribute(e,t),uo.fromBufferAttribute(e,n),fo.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ho,s.x),a.addScaledVector(uo,s.y),a.addScaledVector(fo,s.z),a}static isFrontFacing(e,t,n,r){return cn.subVectors(n,t),Nn.subVectors(e,t),cn.cross(Nn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return cn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),cn.cross(Nn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return hn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return hn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return hn.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return hn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return hn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;Fi.subVectors(r,n),Oi.subVectors(s,n),oo.subVectors(e,n);const l=Fi.dot(oo),c=Oi.dot(oo);if(l<=0&&c<=0)return t.copy(n);lo.subVectors(e,r);const h=Fi.dot(lo),f=Oi.dot(lo);if(h>=0&&f<=h)return t.copy(r);const u=l*f-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(Fi,a);co.subVectors(e,s);const d=Fi.dot(co),g=Oi.dot(co);if(g>=0&&d<=g)return t.copy(s);const x=d*c-l*g;if(x<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(Oi,o);const m=h*g-d*f;if(m<=0&&f-h>=0&&d-g>=0)return Jl.subVectors(s,r),o=(f-h)/(f-h+(d-g)),t.copy(r).addScaledVector(Jl,o);const p=1/(m+x+u);return a=x*p,o=u*p,t.copy(n).addScaledVector(Fi,a).addScaledVector(Oi,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class hi{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(un.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(un.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=un.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,un):un.fromBufferAttribute(s,a),un.applyMatrix4(e.matrixWorld),this.expandByPoint(un);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),cs.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),cs.copy(n.boundingBox)),cs.applyMatrix4(e.matrixWorld),this.union(cs)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,un),un.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(pr),hs.subVectors(this.max,pr),Bi.subVectors(e.a,pr),zi.subVectors(e.b,pr),ki.subVectors(e.c,pr),qn.subVectors(zi,Bi),Yn.subVectors(ki,zi),ui.subVectors(Bi,ki);let t=[0,-qn.z,qn.y,0,-Yn.z,Yn.y,0,-ui.z,ui.y,qn.z,0,-qn.x,Yn.z,0,-Yn.x,ui.z,0,-ui.x,-qn.y,qn.x,0,-Yn.y,Yn.x,0,-ui.y,ui.x,0];return!po(t,Bi,zi,ki,hs)||(t=[1,0,0,0,1,0,0,0,1],!po(t,Bi,zi,ki,hs))?!1:(us.crossVectors(qn,Yn),t=[us.x,us.y,us.z],po(t,Bi,zi,ki,hs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,un).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(un).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Fn=[new U,new U,new U,new U,new U,new U,new U,new U],un=new U,cs=new hi,Bi=new U,zi=new U,ki=new U,qn=new U,Yn=new U,ui=new U,pr=new U,hs=new U,us=new U,fi=new U;function po(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){fi.fromArray(i,s);const o=r.x*Math.abs(fi.x)+r.y*Math.abs(fi.y)+r.z*Math.abs(fi.z),l=e.dot(fi),c=t.dot(fi),h=n.dot(fi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const wt=new U,fs=new ae;let bf=0;class Kt extends li{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:bf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=ku,this.updateRanges=[],this.gpuType=an,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)fs.fromBufferAttribute(this,t),fs.applyMatrix3(e),this.setXY(t,fs.x,fs.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix3(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyMatrix4(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.applyNormalMatrix(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)wt.fromBufferAttribute(this,t),wt.transformDirection(e),this.setXYZ(t,wt.x,wt.y,wt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Pi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Ht(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Pi(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Pi(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Pi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Pi(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),n=Ht(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),n=Ht(n,this.array),r=Ht(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),n=Ht(n,this.array),r=Ht(r,this.array),s=Ht(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class Ql extends Kt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class jl extends Kt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class st extends Kt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const wf=new hi,mr=new U,mo=new U;class gr{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):wf.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;mr.subVectors(e,this.center);const t=mr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(mr,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(mo.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(mr.copy(e.center).add(mo)),this.expandByPoint(mr.copy(e.center).sub(mo))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Ef=0;const en=new ht,go=new Zt,Hi=new U,$t=new hi,vr=new hi,Ct=new U;class Mt extends li{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Ef++}),this.uuid=ci(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Hu(e)?jl:Ql)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new qe().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return en.makeRotationFromQuaternion(e),this.applyMatrix4(en),this}rotateX(e){return en.makeRotationX(e),this.applyMatrix4(en),this}rotateY(e){return en.makeRotationY(e),this.applyMatrix4(en),this}rotateZ(e){return en.makeRotationZ(e),this.applyMatrix4(en),this}translate(e,t,n){return en.makeTranslation(e,t,n),this.applyMatrix4(en),this}scale(e,t,n){return en.makeScale(e,t,n),this.applyMatrix4(en),this}lookAt(e){return go.lookAt(e),go.updateMatrix(),this.applyMatrix4(go.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Hi).negate(),this.translate(Hi.x,Hi.y,Hi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new st(n,3))}else{const n=Math.min(e.length,t.count);for(let r=0;r<n;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ke("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new hi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){it("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];$t.setFromBufferAttribute(s),this.morphTargetsRelative?(Ct.addVectors(this.boundingBox.min,$t.min),this.boundingBox.expandByPoint(Ct),Ct.addVectors(this.boundingBox.max,$t.max),this.boundingBox.expandByPoint(Ct)):(this.boundingBox.expandByPoint($t.min),this.boundingBox.expandByPoint($t.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&it('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new gr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){it("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){const n=this.boundingSphere.center;if($t.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];vr.setFromBufferAttribute(o),this.morphTargetsRelative?(Ct.addVectors($t.min,vr.min),$t.expandByPoint(Ct),Ct.addVectors($t.max,vr.max),$t.expandByPoint(Ct)):($t.expandByPoint(vr.min),$t.expandByPoint(vr.max))}$t.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)Ct.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(Ct));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Ct.fromBufferAttribute(o,c),l&&(Hi.fromBufferAttribute(e,c),Ct.add(Hi)),r=Math.max(r,n.distanceToSquared(Ct))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&it('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){it("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Kt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let _=0;_<n.count;_++)o[_]=new U,l[_]=new U;const c=new U,h=new U,f=new U,u=new ae,d=new ae,g=new ae,x=new U,m=new U;function p(_,A,F){c.fromBufferAttribute(n,_),h.fromBufferAttribute(n,A),f.fromBufferAttribute(n,F),u.fromBufferAttribute(s,_),d.fromBufferAttribute(s,A),g.fromBufferAttribute(s,F),h.sub(c),f.sub(c),d.sub(u),g.sub(u);const G=1/(d.x*g.y-g.x*d.y);isFinite(G)&&(x.copy(h).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(G),m.copy(f).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(G),o[_].add(x),o[A].add(x),o[F].add(x),l[_].add(m),l[A].add(m),l[F].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let _=0,A=b.length;_<A;++_){const F=b[_],G=F.start,z=F.count;for(let J=G,k=G+z;J<k;J+=3)p(e.getX(J+0),e.getX(J+1),e.getX(J+2))}const S=new U,v=new U,w=new U,T=new U;function C(_){w.fromBufferAttribute(r,_),T.copy(w);const A=o[_];S.copy(A),S.sub(w.multiplyScalar(w.dot(A))).normalize(),v.crossVectors(T,A);const G=v.dot(l[_])<0?-1:1;a.setXYZW(_,S.x,S.y,S.z,G)}for(let _=0,A=b.length;_<A;++_){const F=b[_],G=F.start,z=F.count;for(let J=G,k=G+z;J<k;J+=3)C(e.getX(J+0)),C(e.getX(J+1)),C(e.getX(J+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Kt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,d=n.count;u<d;u++)n.setXYZ(u,0,0,0);const r=new U,s=new U,a=new U,o=new U,l=new U,c=new U,h=new U,f=new U;if(e)for(let u=0,d=e.count;u<d;u+=3){const g=e.getX(u+0),x=e.getX(u+1),m=e.getX(u+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,x),a.fromBufferAttribute(t,m),h.subVectors(a,s),f.subVectors(r,s),h.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,x),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(x,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,d=t.count;u<d;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,s),f.subVectors(r,s),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Ct.fromBufferAttribute(e,t),Ct.normalize(),e.setXYZ(t,Ct.x,Ct.y,Ct.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,f=o.normalized,u=new c.constructor(l.length*h);let d=0,g=0;for(let x=0,m=l.length;x<m;x++){o.isInterleavedBufferAttribute?d=l[x]*o.data.stride+o.offset:d=l[x]*h;for(let p=0;p<h;p++)u[g++]=c[d++]}return new Kt(u,h,f)}if(this.index===null)return Ke("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Mt,n=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,n);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,f=c.length;h<f;h++){const u=c[h],d=e(u,n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){const d=c[f];h.push(d.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const r=e.attributes;for(const c in r){const h=r[c];this.setAttribute(c,h.clone(t))}const s=e.morphAttributes;for(const c in s){const h=[],f=s[c];for(let u=0,d=f.length;u<d;u++)h.push(f[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const vo=new U,Tf=new U,Af=new qe;class On{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=vo.subVectors(n,t).cross(Tf.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const r=e.delta(vo),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Af.getNormalMatrix(e),r=this.coplanarPoint(vo).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let Rf=0;class ds extends li{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Rf++}),this.uuid=ci(),this.name="",this.type="Material",this.blending=rr,this.side=ri,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ml,this.blendDst=gl,this.blendEquation=Ai,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ye(0,0,0),this.blendAlpha=0,this.depthFunc=ar,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Du,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Za,this.stencilZFail=Za,this.stencilZPass=Za,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ke(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ke(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ye().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new On().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ae().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ae().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Bn=new U,xo=new U,ps=new U,ms=new U;class Cf{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Bn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Bn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Bn.copy(this.origin).addScaledVector(this.direction,t),Bn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){xo.copy(e).add(t).multiplyScalar(.5),ps.copy(t).sub(e).normalize(),ms.copy(this.origin).sub(xo);const s=e.distanceTo(t)*.5,a=-this.direction.dot(ps),o=ms.dot(this.direction),l=-ms.dot(ps),c=ms.lengthSq(),h=Math.abs(1-a*a);let f,u,d,g;if(h>0)if(f=a*l-o,u=a*o-l,g=s*h,f>=0)if(u>=-g)if(u<=g){const x=1/h;f*=x,u*=x,d=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=s,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u=-s,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u<=-g?(f=Math.max(0,-(-a*s+o)),u=f>0?-s:Math.min(Math.max(-s,-l),s),d=-f*f+u*(u+2*l)+c):u<=g?(f=0,u=Math.min(Math.max(-s,-l),s),d=u*(u+2*l)+c):(f=Math.max(0,-(a*s+o)),u=f>0?s:Math.min(Math.max(-s,-l),s),d=-f*f+u*(u+2*l)+c);else u=a>0?-s:s,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(xo).addScaledVector(ps,u),d}intersectSphere(e,t){if(e.radius<0)return null;Bn.subVectors(e.center,this.origin);const n=Bn.dot(this.direction),r=Bn.dot(Bn)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(n=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(n=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),h>=0?(s=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(s=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-u.z)*f,l=(e.max.z-u.z)*f):(o=(e.max.z-u.z)*f,l=(e.min.z-u.z)*f),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Bn)!==null}intersectTriangle(e,t,n,r,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,f=e.x-a.x,u=e.y-a.y,d=e.z-a.z,g=t.x-a.x,x=t.y-a.y,m=t.z-a.z,p=n.x-a.x,b=n.y-a.y,S=n.z-a.z,v=Math.abs(l),w=Math.abs(c),T=Math.abs(h);let C,_,A,F,G,z,J,k,Y,ne,$,K;if(v>=w&&v>=T?(A=l,z=f,Y=g,K=p,l>=0?(C=c,_=h,F=u,G=d,J=x,k=m,ne=b,$=S):(C=h,_=c,F=d,G=u,J=m,k=x,ne=S,$=b)):w>=T?(A=c,z=u,Y=x,K=b,c>=0?(C=h,_=l,F=d,G=f,J=m,k=g,ne=S,$=p):(C=l,_=h,F=f,G=d,J=g,k=m,ne=p,$=S)):(A=h,z=d,Y=m,K=S,h>=0?(C=l,_=c,F=f,G=u,J=g,k=x,ne=p,$=b):(C=c,_=l,F=u,G=f,J=x,k=g,ne=b,$=p)),A===0)return null;const re=C/A,se=_/A,ue=1/A,Ie=F-re*z,_e=G-se*z,Me=J-re*Y,Se=k-se*Y,ze=ne-re*K,N=$-se*K,D=ze*Se-N*Me,I=Ie*N-_e*ze,P=Me*_e-Se*Ie;if(r){if(D<0||I<0||P<0)return null}else if((D<0||I<0||P<0)&&(D>0||I>0||P>0))return null;const B=D+I+P;if(B===0)return null;const ie=ue*(D*z+I*Y+P*K);return(B>0?ie<0:ie>0)?null:this.at(ie/B,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class xr extends ds{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ye(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wn,this.combine=vl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ec=new ht,di=new Cf,gs=new gr,tc=new U,vs=new U,xs=new U,_s=new U,_o=new U,Ms=new U,nc=new U,ys=new U;class at extends Zt{constructor(e=new Mt,t=new xr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){Ms.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],f=s[l];h!==0&&(_o.fromBufferAttribute(f,e),a?Ms.addScaledVector(_o,h):Ms.addScaledVector(_o.sub(t),h))}t.add(Ms)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),gs.copy(n.boundingSphere),gs.applyMatrix4(s),di.copy(e.ray).recast(e.near),!(gs.containsPoint(di.origin)===!1&&(di.intersectSphere(gs,tc)===null||di.origin.distanceToSquared(tc)>(e.far-e.near)**2))&&(ec.copy(s).invert(),di.copy(e.ray).applyMatrix4(ec),!(n.boundingBox!==null&&di.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,di)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,f=s.attributes.normal,u=s.groups,d=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,x=u.length;g<x;g++){const m=u[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),S=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,w=S;v<w;v+=3){const T=o.getX(v),C=o.getX(v+1),_=o.getX(v+2);r=Ss(this,p,e,n,c,h,f,T,C,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),x=Math.min(o.count,d.start+d.count);for(let m=g,p=x;m<p;m+=3){const b=o.getX(m),S=o.getX(m+1),v=o.getX(m+2);r=Ss(this,a,e,n,c,h,f,b,S,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,x=u.length;g<x;g++){const m=u[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),S=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,w=S;v<w;v+=3){const T=v,C=v+1,_=v+2;r=Ss(this,p,e,n,c,h,f,T,C,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),x=Math.min(l.count,d.start+d.count);for(let m=g,p=x;m<p;m+=3){const b=m,S=m+1,v=m+2;r=Ss(this,a,e,n,c,h,f,b,S,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function Pf(i,e,t,n,r,s,a,o){let l;if(e.side===kt?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,e.side===ri,o),l===null)return null;ys.copy(o),ys.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(ys);return c<t.near||c>t.far?null:{distance:c,point:ys.clone(),object:i}}function Ss(i,e,t,n,r,s,a,o,l,c){i.getVertexPosition(o,vs),i.getVertexPosition(l,xs),i.getVertexPosition(c,_s);const h=Pf(i,e,t,n,vs,xs,_s,nc);if(h){const f=new U;hn.getBarycoord(nc,vs,xs,_s,f),r&&(h.uv=hn.getInterpolatedAttribute(r,o,l,c,f,new ae)),s&&(h.uv1=hn.getInterpolatedAttribute(s,o,l,c,f,new ae)),a&&(h.normal=hn.getInterpolatedAttribute(a,o,l,c,f,new U),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new U,materialIndex:0};hn.getNormal(vs,xs,_s,u.normal),h.face=u,h.barycoord=f}return h}class Mo extends Ut{constructor(e=null,t=1,n=1,r,s,a,o,l,c=Pt,h=Pt,f,u){super(null,a,o,l,c,h,r,s,f,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class vt extends Kt{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Gi=new ht,ic=new ht,bs=[],rc=new hi,Lf=new ht,_r=new at,Mr=new gr;class Sn extends at{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new vt(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,Lf)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new hi),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Gi),rc.copy(e.boundingBox).applyMatrix4(Gi),this.boundingBox.union(rc)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new gr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Gi),Mr.copy(e.boundingSphere).applyMatrix4(Gi),this.boundingSphere.union(Mr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=n.length+1,a=e*s+1;for(let o=0;o<n.length;o++)n[o]=r[a+o]}raycast(e,t){const n=this.matrixWorld,r=this.count;if(_r.geometry=this.geometry,_r.material=this.material,_r.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Mr.copy(this.boundingSphere),Mr.applyMatrix4(n),e.ray.intersectsSphere(Mr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Gi),ic.multiplyMatrices(n,Gi),_r.matrixWorld=ic,_r.raycast(e,bs);for(let a=0,o=bs.length;a<o;a++){const l=bs[a];l.instanceId=s,l.object=this,t.push(l)}bs.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new vt(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new Mo(new Float32Array(r*this.count),r,this.count,Kr,an));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;return s[l]=o,s.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const pi=new gr,If=new ae(.5,.5),ws=new U;class sc{constructor(e=new On,t=new On,n=new On,r=new On,s=new On,a=new On){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=yn,n=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],h=s[4],f=s[5],u=s[6],d=s[7],g=s[8],x=s[9],m=s[10],p=s[11],b=s[12],S=s[13],v=s[14],w=s[15];if(r[0].setComponents(c-a,d-h,p-g,w-b).normalize(),r[1].setComponents(c+a,d+h,p+g,w+b).normalize(),r[2].setComponents(c+o,d+f,p+x,w+S).normalize(),r[3].setComponents(c-o,d-f,p-x,w-S).normalize(),n)r[4].setComponents(l,u,m,v).normalize(),r[5].setComponents(c-l,d-u,p-m,w-v).normalize();else if(r[4].setComponents(c-l,d-u,p-m,w-v).normalize(),t===yn)r[5].setComponents(c+l,d+u,p+m,w+v).normalize();else if(t===rs)r[5].setComponents(l,u,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),pi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),pi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(pi)}intersectsSprite(e){pi.center.set(0,0,0);const t=If.distanceTo(e.center);return pi.radius=.7071067811865476+t,pi.applyMatrix4(e.matrixWorld),this.intersectsSphere(pi)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(ws.x=r.normal.x>0?e.max.x:e.min.x,ws.y=r.normal.y>0?e.max.y:e.min.y,ws.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ws)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class ac extends Ut{constructor(e=[],t=si,n,r,s,a,o,l,c,h){super(e,t,n,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class yo extends Ut{constructor(e,t,n,r,s,a,o,l,c){super(e,t,n,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class yr extends Ut{constructor(e,t,n=Mn,r,s,a,o=Pt,l=Pt,c,h=Pn,f=1){if(h!==Pn&&h!==ai)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:f};super(u,r,s,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new eo(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class Df extends yr{constructor(e,t=Mn,n=si,r,s,a=Pt,o=Pt,l,c=Pn){const h={width:e,height:e,depth:1},f=[h,h,h,h,h,h];super(e,e,t,n,r,s,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class oc extends Ut{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Ge extends Mt{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],f=[];let u=0,d=0;g("z","y","x",-1,-1,n,t,e,a,s,0),g("z","y","x",1,-1,n,t,-e,a,s,1),g("x","z","y",1,1,e,n,t,r,a,2),g("x","z","y",1,-1,e,n,-t,r,a,3),g("x","y","z",1,-1,e,t,n,r,s,4),g("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new st(c,3)),this.setAttribute("normal",new st(h,3)),this.setAttribute("uv",new st(f,2));function g(x,m,p,b,S,v,w,T,C,_,A){const F=v/C,G=w/_,z=v/2,J=w/2,k=T/2,Y=C+1,ne=_+1;let $=0,K=0;const re=new U;for(let se=0;se<ne;se++){const ue=se*G-J;for(let Ie=0;Ie<Y;Ie++){const _e=Ie*F-z;re[x]=_e*b,re[m]=ue*S,re[p]=k,c.push(re.x,re.y,re.z),re[x]=0,re[m]=0,re[p]=T>0?1:-1,h.push(re.x,re.y,re.z),f.push(Ie/C),f.push(1-se/_),$+=1}}for(let se=0;se<_;se++)for(let ue=0;ue<C;ue++){const Ie=u+ue+Y*se,_e=u+ue+Y*(se+1),Me=u+(ue+1)+Y*(se+1),Se=u+(ue+1)+Y*se;l.push(Ie,_e,Se),l.push(_e,Me,Se),K+=6}o.addGroup(d,K,A),d+=K,u+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ge(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class So extends Mt{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new U,h=new ae;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,u=3;f<=t;f++,u+=3){const d=n+f/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[u]/e+1)/2,h.y=(a[u+1]/e+1)/2,l.push(h.x,h.y)}for(let f=1;f<=t;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new st(a,3)),this.setAttribute("normal",new st(o,3)),this.setAttribute("uv",new st(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new So(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class yt extends Mt{constructor(e=1,t=1,n=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const h=[],f=[],u=[],d=[];let g=0;const x=[],m=n/2;let p=0;b(),a===!1&&(e>0&&S(!0),t>0&&S(!1)),this.setIndex(h),this.setAttribute("position",new st(f,3)),this.setAttribute("normal",new st(u,3)),this.setAttribute("uv",new st(d,2));function b(){const v=new U,w=new U;let T=0;const C=(t-e)/n;for(let _=0;_<=s;_++){const A=[],F=_/s,G=F*(t-e)+e;for(let z=0;z<=r;z++){const J=z/r,k=J*l+o,Y=Math.sin(k),ne=Math.cos(k);w.x=G*Y,w.y=-F*n+m,w.z=G*ne,f.push(w.x,w.y,w.z),v.set(Y,C,ne).normalize(),u.push(v.x,v.y,v.z),d.push(J,1-F),A.push(g++)}x.push(A)}for(let _=0;_<r;_++)for(let A=0;A<s;A++){const F=x[A][_],G=x[A+1][_],z=x[A+1][_+1],J=x[A][_+1];(e>0||A!==0)&&(h.push(F,G,J),T+=3),(t>0||A!==s-1)&&(h.push(G,z,J),T+=3)}c.addGroup(p,T,0),p+=T}function S(v){const w=g,T=new ae,C=new U;let _=0;const A=v===!0?e:t,F=v===!0?1:-1;for(let z=1;z<=r;z++)f.push(0,m*F,0),u.push(0,F,0),d.push(.5,.5),g++;const G=g;for(let z=0;z<=r;z++){const k=z/r*l+o,Y=Math.cos(k),ne=Math.sin(k);C.x=A*ne,C.y=m*F,C.z=A*Y,f.push(C.x,C.y,C.z),u.push(0,F,0),T.x=Y*.5+.5,T.y=ne*.5*F+.5,d.push(T.x,T.y),g++}for(let z=0;z<r;z++){const J=w+z,k=G+z;v===!0?h.push(k,k+1,J):h.push(k+1,k,J),_+=3}c.addGroup(p,_,v===!0?1:2),p+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new yt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class bn{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ke("Curve: .getPoint() not implemented.")}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),s+=n.distanceTo(r),t.push(s),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){const n=this.getLengths();let r=0;const s=n.length;let a;t?a=t:a=e*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,n[r]===a)return r/(s-1);const h=n[r],u=n[r+1]-h,d=(a-h)/u;return(r+d)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);const a=this.getPoint(r),o=this.getPoint(s),l=t||(a.isVector2?new ae:new U);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){const n=new U,r=[],s=[],a=[],o=new U,l=new ht;for(let d=0;d<=e;d++){const g=d/e;r[d]=this.getTangentAt(g,new U)}s[0]=new U,a[0]=new U;let c=Number.MAX_VALUE;const h=Math.abs(r[0].x),f=Math.abs(r[0].y),u=Math.abs(r[0].z);h<=c&&(c=h,n.set(1,0,0)),f<=c&&(c=f,n.set(0,1,0)),u<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let d=1;d<=e;d++){if(s[d]=s[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(r[d-1],r[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(et(r[d-1].dot(r[d]),-1,1));s[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(r[d],s[d])}if(t===!0){let d=Math.acos(et(s[0].dot(s[e]),-1,1));d/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(d=-d);for(let g=1;g<=e;g++)s[g].applyMatrix4(l.makeRotationAxis(r[g],d*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}class bo extends bn{constructor(e=0,t=0,n=1,r=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ae){const n=t,r=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);const o=this.aStartAngle+e*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),f=Math.sin(this.aRotation),u=l-this.aX,d=c-this.aY;l=u*h-d*f+this.aX,c=u*f+d*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}}class Nf extends bo{constructor(e,t,n,r,s,a){super(e,t,n,n,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}}function wo(){let i=0,e=0,t=0,n=0;function r(s,a,o,l){i=s,e=o,t=-3*s+3*a-2*o-l,n=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){r(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,h,f){let u=(a-s)/c-(o-s)/(c+h)+(o-a)/h,d=(o-a)/h-(l-a)/(h+f)+(l-o)/f;u*=h,d*=h,r(a,o,u,d)},calc:function(s){const a=s*s,o=a*s;return i+e*s+t*a+n*o}}}const lc=new U,cc=new U,Eo=new wo,To=new wo,Ao=new wo;class Ro extends bn{constructor(e=[],t=!1,n="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new U){const n=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,h;this.closed||o>0?c=r[(o-1)%s]:(cc.subVectors(r[0],r[1]).add(r[0]),c=cc);const f=r[o%s],u=r[(o+1)%s];if(this.closed||o+2<s?h=r[(o+2)%s]:(lc.subVectors(r[s-1],r[s-2]).add(r[s-1]),h=lc),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(f),d),x=Math.pow(f.distanceToSquared(u),d),m=Math.pow(u.distanceToSquared(h),d);x<1e-4&&(x=1),g<1e-4&&(g=x),m<1e-4&&(m=x),Eo.initNonuniformCatmullRom(c.x,f.x,u.x,h.x,g,x,m),To.initNonuniformCatmullRom(c.y,f.y,u.y,h.y,g,x,m),Ao.initNonuniformCatmullRom(c.z,f.z,u.z,h.z,g,x,m)}else this.curveType==="catmullrom"&&(Eo.initCatmullRom(c.x,f.x,u.x,h.x,this.tension),To.initCatmullRom(c.y,f.y,u.y,h.y,this.tension),Ao.initCatmullRom(c.z,f.z,u.z,h.z,this.tension));return n.set(Eo.calc(l),To.calc(l),Ao.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(new U().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}function hc(i,e,t,n,r){const s=(n-e)*.5,a=(r-t)*.5,o=i*i,l=i*o;return(2*t-2*n+s+a)*l+(-3*t+3*n-2*s-a)*o+s*i+t}function Uf(i,e){const t=1-i;return t*t*e}function Ff(i,e){return 2*(1-i)*i*e}function Of(i,e){return i*i*e}function Sr(i,e,t,n){return Uf(i,e)+Ff(i,t)+Of(i,n)}function Bf(i,e){const t=1-i;return t*t*t*e}function zf(i,e){const t=1-i;return 3*t*t*i*e}function kf(i,e){return 3*(1-i)*i*i*e}function Hf(i,e){return i*i*i*e}function br(i,e,t,n,r){return Bf(i,e)+zf(i,t)+kf(i,n)+Hf(i,r)}class uc extends bn{constructor(e=new ae,t=new ae,n=new ae,r=new ae){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new ae){const n=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(br(e,r.x,s.x,a.x,o.x),br(e,r.y,s.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class Gf extends bn{constructor(e=new U,t=new U,n=new U,r=new U){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new U){const n=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(br(e,r.x,s.x,a.x,o.x),br(e,r.y,s.y,a.y,o.y),br(e,r.z,s.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class fc extends bn{constructor(e=new ae,t=new ae){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ae){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ae){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Vf extends bn{constructor(e=new U,t=new U){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new U){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new U){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class dc extends bn{constructor(e=new ae,t=new ae,n=new ae){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ae){const n=t,r=this.v0,s=this.v1,a=this.v2;return n.set(Sr(e,r.x,s.x,a.x),Sr(e,r.y,s.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class pc extends bn{constructor(e=new U,t=new U,n=new U){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new U){const n=t,r=this.v0,s=this.v1,a=this.v2;return n.set(Sr(e,r.x,s.x,a.x),Sr(e,r.y,s.y,a.y),Sr(e,r.z,s.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class mc extends bn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ae){const n=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,l=r[a===0?a:a-1],c=r[a],h=r[a>r.length-2?r.length-1:a+1],f=r[a>r.length-3?r.length-1:a+2];return n.set(hc(o,l.x,c.x,h.x,f.x),hc(o,l.y,c.y,h.y,f.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(new ae().fromArray(r))}return this}}var Es=Object.freeze({__proto__:null,ArcCurve:Nf,CatmullRomCurve3:Ro,CubicBezierCurve:uc,CubicBezierCurve3:Gf,EllipseCurve:bo,LineCurve:fc,LineCurve3:Vf,QuadraticBezierCurve:dc,QuadraticBezierCurve3:pc,SplineCurve:mc});class Wf extends bn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Es[n](t,e))}return this}getPoint(e,t){const n=e*this.getLength(),r=this.getCurveLengths();let s=0;for(;s<r.length;){if(r[s]>=n){const a=r[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}s++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let n;for(let r=0,s=this.curves;r<s.length;r++){const a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){const r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const r=e.curves[t];this.curves.push(new Es[r.type]().fromJSON(r))}return this}}class mi extends Wf{constructor(e){super(),this.type="Path",this.currentPoint=new ae,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const n=new fc(this.currentPoint.clone(),new ae(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){const s=new dc(this.currentPoint.clone(),new ae(e,t),new ae(n,r));return this.curves.push(s),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,s,a){const o=new uc(this.currentPoint.clone(),new ae(e,t),new ae(n,r),new ae(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),n=new mc(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,s,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,r,s,a),this}absarc(e,t,n,r,s,a){return this.absellipse(e,t,n,n,r,s,a),this}ellipse(e,t,n,r,s,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,r,s,a,o,l),this}absellipse(e,t,n,r,s,a,o,l){const c=new bo(e,t,n,r,s,a,o,l);if(this.curves.length>0){const f=c.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}}class Ts extends mi{constructor(e){super(e),this.uuid=ci(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){const r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const r=e.holes[t];this.holes.push(new mi().fromJSON(r))}return this}}function Xf(i,e,t=2){const n=e&&e.length,r=n?e[0]*t:i.length;let s=gc(i,0,r,t,!0);const a=[];if(!s||s.next===s.prev)return a;let o,l,c;if(n&&(s=$f(i,e,s,t)),i.length>80*t){o=i[0],l=i[1];let h=o,f=l;for(let u=t;u<r;u+=t){const d=i[u],g=i[u+1];d<o&&(o=d),g<l&&(l=g),d>h&&(h=d),g>f&&(f=g)}c=Math.max(h-o,f-l),c=c!==0?32767/c:0}return wr(s,a,t,o,l,c,0),a}function gc(i,e,t,n,r){let s;if(r===od(i,e,t,n)>0)for(let a=e;a<t;a+=n)s=Mc(a/n|0,i[a],i[a+1],s);else for(let a=t-n;a>=e;a-=n)s=Mc(a/n|0,i[a],i[a+1],s);return s&&Vi(s,s.next)&&(Ar(s),s=s.next),s}function gi(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(Vi(t,t.next)||xt(t.prev,t,t.next)===0)){if(Ar(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function wr(i,e,t,n,r,s,a){if(!i)return;!a&&s&&td(i,n,r,s);let o=i;for(;i.prev!==i.next;){const l=i.prev,c=i.next;if(s?Yf(i,n,r,s):qf(i)){e.push(l.i,i.i,c.i),Ar(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=Zf(gi(i),e),wr(i,e,t,n,r,s,2)):a===2&&Kf(i,e,t,n,r,s):wr(gi(i),e,t,n,r,s,1);break}}}function qf(i){const e=i.prev,t=i,n=i.next;if(xt(e,t,n)>=0)return!1;const r=e.x,s=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=Math.min(r,s,a),f=Math.min(o,l,c),u=Math.max(r,s,a),d=Math.max(o,l,c);let g=n.next;for(;g!==e;){if(g.x>=h&&g.x<=u&&g.y>=f&&g.y<=d&&Er(r,o,s,l,a,c,g.x,g.y)&&xt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Yf(i,e,t,n){const r=i.prev,s=i,a=i.next;if(xt(r,s,a)>=0)return!1;const o=r.x,l=s.x,c=a.x,h=r.y,f=s.y,u=a.y,d=Math.min(o,l,c),g=Math.min(h,f,u),x=Math.max(o,l,c),m=Math.max(h,f,u),p=Co(d,g,e,t,n),b=Co(x,m,e,t,n);let S=i.prevZ,v=i.nextZ;for(;S&&S.z>=p&&v&&v.z<=b;){if(S.x>=d&&S.x<=x&&S.y>=g&&S.y<=m&&S!==r&&S!==a&&Er(o,h,l,f,c,u,S.x,S.y)&&xt(S.prev,S,S.next)>=0||(S=S.prevZ,v.x>=d&&v.x<=x&&v.y>=g&&v.y<=m&&v!==r&&v!==a&&Er(o,h,l,f,c,u,v.x,v.y)&&xt(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;S&&S.z>=p;){if(S.x>=d&&S.x<=x&&S.y>=g&&S.y<=m&&S!==r&&S!==a&&Er(o,h,l,f,c,u,S.x,S.y)&&xt(S.prev,S,S.next)>=0)return!1;S=S.prevZ}for(;v&&v.z<=b;){if(v.x>=d&&v.x<=x&&v.y>=g&&v.y<=m&&v!==r&&v!==a&&Er(o,h,l,f,c,u,v.x,v.y)&&xt(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function Zf(i,e){let t=i;do{const n=t.prev,r=t.next.next;!Vi(n,r)&&xc(n,t,t.next,r)&&Tr(n,r)&&Tr(r,n)&&(e.push(n.i,t.i,r.i),Ar(t),Ar(t.next),t=i=r),t=t.next}while(t!==i);return gi(t)}function Kf(i,e,t,n,r,s){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&rd(a,o)){let l=_c(a,o);a=gi(a,a.next),l=gi(l,l.next),wr(a,e,t,n,r,s,0),wr(l,e,t,n,r,s,0);return}o=o.next}a=a.next}while(a!==i)}function $f(i,e,t,n){const r=[];for(let s=0,a=e.length;s<a;s++){const o=e[s]*n,l=s<a-1?e[s+1]*n:i.length,c=gc(i,o,l,n,!1);c===c.next&&(c.steiner=!0),r.push(id(c))}r.sort(Jf);for(let s=0;s<r.length;s++)t=Qf(r[s],t);return t}function Jf(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=n-r}return t}function Qf(i,e){const t=jf(i,e);if(!t)return e;const n=_c(t,i);return gi(n,n.next),gi(t,t.next)}function jf(i,e){let t=e;const n=i.x,r=i.y;let s=-1/0,a;if(Vi(i,t))return t;do{if(Vi(i,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){const f=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(f<=n&&f>s&&(s=f,a=t.x<t.next.x?t:t.next,f===n))return a}t=t.next}while(t!==e);if(!a)return null;const o=a,l=a.x,c=a.y;let h=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&vc(r<c?n:s,r,l,c,r<c?s:n,r,t.x,t.y)){const f=Math.abs(r-t.y)/(n-t.x);Tr(t,i)&&(f<h||f===h&&(t.x>a.x||t.x===a.x&&ed(a,t)))&&(a=t,h=f)}t=t.next}while(t!==o);return a}function ed(i,e){return xt(i.prev,i,e.prev)<0&&xt(e.next,i,i.next)<0}function td(i,e,t,n){let r=i;do r.z===0&&(r.z=Co(r.x,r.y,e,t,n)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==i);r.prevZ.nextZ=null,r.prevZ=null,nd(r)}function nd(i){let e,t=1;do{let n=i,r;i=null;let s=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(r=n,n=n.nextZ,o--):(r=a,a=a.nextZ,l--),s?s.nextZ=r:i=r,r.prevZ=s,s=r;n=a}s.nextZ=null,t*=2}while(e>1);return i}function Co(i,e,t,n,r){return i=(i-t)*r|0,e=(e-n)*r|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function id(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function vc(i,e,t,n,r,s,a,o){return(r-a)*(e-o)>=(i-a)*(s-o)&&(i-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(n-o)}function Er(i,e,t,n,r,s,a,o){return!(i===a&&e===o)&&vc(i,e,t,n,r,s,a,o)}function rd(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!sd(i,e)&&(Tr(i,e)&&Tr(e,i)&&ad(i,e)&&(xt(i.prev,i,e.prev)||xt(i,e.prev,e))||Vi(i,e)&&xt(i.prev,i,i.next)>0&&xt(e.prev,e,e.next)>0)}function xt(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function Vi(i,e){return i.x===e.x&&i.y===e.y}function xc(i,e,t,n){const r=Rs(xt(i,e,t)),s=Rs(xt(i,e,n)),a=Rs(xt(t,n,i)),o=Rs(xt(t,n,e));return!!(r!==s&&a!==o||r===0&&As(i,t,e)||s===0&&As(i,n,e)||a===0&&As(t,i,n)||o===0&&As(t,e,n))}function As(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function Rs(i){return i>0?1:i<0?-1:0}function sd(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&xc(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function Tr(i,e){return xt(i.prev,i,i.next)<0?xt(i,e,i.next)>=0&&xt(i,i.prev,e)>=0:xt(i,e,i.prev)<0||xt(i,i.next,e)<0}function ad(i,e){let t=i,n=!1;const r=(i.x+e.x)/2,s=(i.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function _c(i,e){const t=Po(i.i,i.x,i.y),n=Po(e.i,e.x,e.y),r=i.next,s=e.prev;return i.next=e,e.prev=i,t.next=r,r.prev=t,n.next=t,t.prev=n,s.next=n,n.prev=s,n}function Mc(i,e,t,n){const r=Po(i,e,t);return n?(r.next=n.next,r.prev=n,n.next.prev=r,n.next=r):(r.prev=r,r.next=r),r}function Ar(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Po(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function od(i,e,t,n){let r=0;for(let s=e,a=t-n;s<t;s+=n)r+=(i[a]-i[s])*(i[s+1]+i[a+1]),a=s;return r}class ld{static triangulate(e,t,n=2){return Xf(e,t,n)}}class Zn{static area(e){const t=e.length;let n=0;for(let r=t-1,s=0;s<t;r=s++)n+=e[r].x*e[s].y-e[s].x*e[r].y;return n*.5}static isClockWise(e){return Zn.area(e)<0}static triangulateShape(e,t){const n=[],r=[],s=[];yc(e),Sc(n,e);let a=e.length;t.forEach(yc);for(let l=0;l<t.length;l++)r.push(a),a+=t[l].length,Sc(n,t[l]);const o=ld.triangulate(n,r);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}}function yc(i){const e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function Sc(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}class Rr extends Mt{constructor(e=new Ts([new ae(.5,.5),new ae(-.5,.5),new ae(-.5,-.5),new ae(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];const n=this,r=[],s=[];for(let o=0,l=e.length;o<l;o++){const c=e[o];a(c)}this.setAttribute("position",new st(r,3)),this.setAttribute("uv",new st(s,2)),this.computeVertexNormals();function a(o){const l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,f=t.depth!==void 0?t.depth:1;let u=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,x=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3;const p=t.extrudePath,b=t.UVGenerator!==void 0?t.UVGenerator:cd;let S,v=!1,w,T,C,_;if(p){S=p.getSpacedPoints(h),v=!0,u=!1;const R=p.isCatmullRomCurve3?p.closed:!1;w=p.computeFrenetFrames(h,R),T=new U,C=new U,_=new U}u||(m=0,d=0,g=0,x=0);const A=o.extractPoints(c);let F=A.shape;const G=A.holes;if(!Zn.isClockWise(F)){F=F.reverse();for(let R=0,H=G.length;R<H;R++){const O=G[R];Zn.isClockWise(O)&&(G[R]=O.reverse())}}function J(R){const O=10000000000000001e-36;let Z=R[0];for(let Q=1;Q<=R.length;Q++){const ce=Q%R.length,ge=R[ce],pe=ge.x-Z.x,q=ge.y-Z.y,y=pe*pe+q*q,Ce=Math.max(Math.abs(ge.x),Math.abs(ge.y),Math.abs(Z.x),Math.abs(Z.y)),Fe=O*Ce*Ce;if(y<=Fe){R.splice(ce,1),Q--;continue}Z=ge}}J(F),G.forEach(J);const k=G.length,Y=F;for(let R=0;R<k;R++){const H=G[R];F=F.concat(H)}function ne(R,H,O){return H||it("ExtrudeGeometry: vec does not exist"),R.clone().addScaledVector(H,O)}const $=F.length;function K(R,H,O){let Z,Q,ce;const ge=R.x-H.x,pe=R.y-H.y,q=O.x-R.x,y=O.y-R.y,Ce=ge*ge+pe*pe,Fe=ge*y-pe*q;if(Math.abs(Fe)>Number.EPSILON){const L=Math.sqrt(Ce),M=Math.sqrt(q*q+y*y),X=H.x-pe/L,j=H.y+ge/L,le=O.x-y/M,xe=O.y+q/M,ye=((le-X)*y-(xe-j)*q)/(ge*y-pe*q);Z=X+ge*ye-R.x,Q=j+pe*ye-R.y;const he=Z*Z+Q*Q;if(he<=2)return new ae(Z,Q);ce=Math.sqrt(he/2)}else{let L=!1;ge>Number.EPSILON?q>Number.EPSILON&&(L=!0):ge<-Number.EPSILON?q<-Number.EPSILON&&(L=!0):Math.sign(pe)===Math.sign(y)&&(L=!0),L?(Z=-pe,Q=ge,ce=Math.sqrt(Ce)):(Z=ge,Q=pe,ce=Math.sqrt(Ce/2))}return new ae(Z/ce,Q/ce)}const re=[];for(let R=0,H=Y.length,O=H-1,Z=R+1;R<H;R++,O++,Z++)O===H&&(O=0),Z===H&&(Z=0),re[R]=K(Y[R],Y[O],Y[Z]);const se=[];let ue,Ie=re.concat();for(let R=0,H=k;R<H;R++){const O=G[R];ue=[];for(let Z=0,Q=O.length,ce=Q-1,ge=Z+1;Z<Q;Z++,ce++,ge++)ce===Q&&(ce=0),ge===Q&&(ge=0),ue[Z]=K(O[Z],O[ce],O[ge]);se.push(ue),Ie=Ie.concat(ue)}let _e;if(m===0)_e=Zn.triangulateShape(Y,G);else{const R=[],H=[];for(let O=0;O<m;O++){const Z=O/m,Q=d*Math.cos(Z*Math.PI/2),ce=g*Math.sin(Z*Math.PI/2)+x;for(let ge=0,pe=Y.length;ge<pe;ge++){const q=ne(Y[ge],re[ge],ce);I(q.x,q.y,-Q),Z===0&&R.push(q)}for(let ge=0,pe=k;ge<pe;ge++){const q=G[ge];ue=se[ge];const y=[];for(let Ce=0,Fe=q.length;Ce<Fe;Ce++){const L=ne(q[Ce],ue[Ce],ce);I(L.x,L.y,-Q),Z===0&&y.push(L)}Z===0&&H.push(y)}}_e=Zn.triangulateShape(R,H)}const Me=_e.length,Se=g+x;for(let R=0;R<$;R++){const H=u?ne(F[R],Ie[R],Se):F[R];v?(C.copy(w.normals[0]).multiplyScalar(H.x),T.copy(w.binormals[0]).multiplyScalar(H.y),_.copy(S[0]).add(C).add(T),I(_.x,_.y,_.z)):I(H.x,H.y,0)}for(let R=1;R<=h;R++)for(let H=0;H<$;H++){const O=u?ne(F[H],Ie[H],Se):F[H];v?(C.copy(w.normals[R]).multiplyScalar(O.x),T.copy(w.binormals[R]).multiplyScalar(O.y),_.copy(S[R]).add(C).add(T),I(_.x,_.y,_.z)):I(O.x,O.y,f/h*R)}for(let R=m-1;R>=0;R--){const H=R/m,O=d*Math.cos(H*Math.PI/2),Z=g*Math.sin(H*Math.PI/2)+x;for(let Q=0,ce=Y.length;Q<ce;Q++){const ge=ne(Y[Q],re[Q],Z);I(ge.x,ge.y,f+O)}for(let Q=0,ce=G.length;Q<ce;Q++){const ge=G[Q];ue=se[Q];for(let pe=0,q=ge.length;pe<q;pe++){const y=ne(ge[pe],ue[pe],Z);v?I(y.x,y.y+S[h-1].y,S[h-1].x+O):I(y.x,y.y,f+O)}}}ze(),N();function ze(){const R=r.length/3;if(u){let H=0,O=$*H;for(let Z=0;Z<Me;Z++){const Q=_e[Z];P(Q[2]+O,Q[1]+O,Q[0]+O)}H=h+m*2,O=$*H;for(let Z=0;Z<Me;Z++){const Q=_e[Z];P(Q[0]+O,Q[1]+O,Q[2]+O)}}else{for(let H=0;H<Me;H++){const O=_e[H];P(O[2],O[1],O[0])}for(let H=0;H<Me;H++){const O=_e[H];P(O[0]+$*h,O[1]+$*h,O[2]+$*h)}}n.addGroup(R,r.length/3-R,0)}function N(){const R=r.length/3;let H=0;D(Y,H),H+=Y.length;for(let O=0,Z=G.length;O<Z;O++){const Q=G[O];D(Q,H),H+=Q.length}n.addGroup(R,r.length/3-R,1)}function D(R,H){let O=R.length;for(;--O>=0;){const Z=O;let Q=O-1;Q<0&&(Q=R.length-1);for(let ce=0,ge=h+m*2;ce<ge;ce++){const pe=$*ce,q=$*(ce+1),y=H+Z+pe,Ce=H+Q+pe,Fe=H+Q+q,L=H+Z+q;B(y,Ce,Fe,L)}}}function I(R,H,O){l.push(R),l.push(H),l.push(O)}function P(R,H,O){ie(R),ie(H),ie(O);const Z=r.length/3,Q=b.generateTopUV(n,r,Z-3,Z-2,Z-1);me(Q[0]),me(Q[1]),me(Q[2])}function B(R,H,O,Z){ie(R),ie(H),ie(Z),ie(H),ie(O),ie(Z);const Q=r.length/3,ce=b.generateSideWallUV(n,r,Q-6,Q-3,Q-2,Q-1);me(ce[0]),me(ce[1]),me(ce[3]),me(ce[1]),me(ce[2]),me(ce[3])}function ie(R){r.push(l[R*3+0]),r.push(l[R*3+1]),r.push(l[R*3+2])}function me(R){s.push(R.x),s.push(R.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return hd(t,n,e)}static fromJSON(e,t){const n=[];for(let s=0,a=e.shapes.length;s<a;s++){const o=t[e.shapes[s]];n.push(o)}const r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new Es[r.type]().fromJSON(r)),new Rr(n,e.options)}}const cd={generateTopUV:function(i,e,t,n,r){const s=e[t*3],a=e[t*3+1],o=e[n*3],l=e[n*3+1],c=e[r*3],h=e[r*3+1];return[new ae(s,a),new ae(o,l),new ae(c,h)]},generateSideWallUV:function(i,e,t,n,r,s){const a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[n*3],h=e[n*3+1],f=e[n*3+2],u=e[r*3],d=e[r*3+1],g=e[r*3+2],x=e[s*3],m=e[s*3+1],p=e[s*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new ae(a,1-l),new ae(c,1-f),new ae(u,1-g),new ae(x,1-p)]:[new ae(o,1-l),new ae(h,1-f),new ae(d,1-g),new ae(m,1-p)]}};function hd(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,r=i.length;n<r;n++){const s=i[n];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}class Wi extends Mt{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(r),c=o+1,h=l+1,f=e/o,u=t/l,d=[],g=[],x=[],m=[];for(let p=0;p<h;p++){const b=p*u-a;for(let S=0;S<c;S++){const v=S*f-s;g.push(v,-b,0),x.push(0,0,1),m.push(S/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<o;b++){const S=b+c*p,v=b+c*(p+1),w=b+1+c*(p+1),T=b+1+c*p;d.push(S,v,T),d.push(v,w,T)}this.setIndex(d),this.setAttribute("position",new st(g,3)),this.setAttribute("normal",new st(x,3)),this.setAttribute("uv",new st(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Wi(e.width,e.height,e.widthSegments,e.heightSegments)}}class vi extends Mt{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],f=new U,u=new U,d=[],g=[],x=[],m=[];for(let p=0;p<=n;p++){const b=[],S=p/n,v=a+S*o,w=e*Math.cos(v),T=Math.sqrt(e*e-w*w);let C=0;p===0&&a===0?C=.5/t:p===n&&l===Math.PI&&(C=-.5/t);for(let _=0;_<=t;_++){const A=_/t,F=r+A*s;f.x=-T*Math.cos(F),f.y=w,f.z=T*Math.sin(F),g.push(f.x,f.y,f.z),u.copy(f).normalize(),x.push(u.x,u.y,u.z),m.push(A+C,1-S),b.push(c++)}h.push(b)}for(let p=0;p<n;p++)for(let b=0;b<t;b++){const S=h[p][b+1],v=h[p][b],w=h[p+1][b],T=h[p+1][b+1];(p!==0||a>0)&&d.push(S,v,T),(p!==n-1||l<Math.PI)&&d.push(v,w,T)}this.setIndex(d),this.setAttribute("position",new st(g,3)),this.setAttribute("normal",new st(x,3)),this.setAttribute("uv",new st(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new vi(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Cr extends Mt{constructor(e=1,t=.4,n=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);const l=[],c=[],h=[],f=[],u=new U,d=new U,g=new U;for(let x=0;x<=n;x++){const m=a+x/n*o;for(let p=0;p<=r;p++){const b=p/r*s;d.x=(e+t*Math.cos(m))*Math.cos(b),d.y=(e+t*Math.cos(m))*Math.sin(b),d.z=t*Math.sin(m),c.push(d.x,d.y,d.z),u.x=e*Math.cos(b),u.y=e*Math.sin(b),g.subVectors(d,u).normalize(),h.push(g.x,g.y,g.z),f.push(p/r),f.push(x/n)}}for(let x=1;x<=n;x++)for(let m=1;m<=r;m++){const p=(r+1)*x+m-1,b=(r+1)*(x-1)+m-1,S=(r+1)*(x-1)+m,v=(r+1)*x+m;l.push(p,b,v),l.push(b,S,v)}this.setIndex(l),this.setAttribute("position",new st(c,3)),this.setAttribute("normal",new st(h,3)),this.setAttribute("uv",new st(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Cr(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}class Cs extends Mt{constructor(e=new pc(new U(-1,-1,0),new U(-1,1,0),new U(1,1,0)),t=64,n=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:r,closed:s};const a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new U,l=new U,c=new ae;let h=new U;const f=[],u=[],d=[],g=[];x(),this.setIndex(g),this.setAttribute("position",new st(f,3)),this.setAttribute("normal",new st(u,3)),this.setAttribute("uv",new st(d,2));function x(){for(let S=0;S<t;S++)m(S);m(s===!1?t:0),b(),p()}function m(S){h=e.getPointAt(S/t,h);const v=a.normals[S],w=a.binormals[S];for(let T=0;T<=r;T++){const C=T/r*Math.PI*2,_=Math.sin(C),A=-Math.cos(C);l.x=A*v.x+_*w.x,l.y=A*v.y+_*w.y,l.z=A*v.z+_*w.z,l.normalize(),u.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,f.push(o.x,o.y,o.z)}}function p(){for(let S=1;S<=t;S++)for(let v=1;v<=r;v++){const w=(r+1)*(S-1)+(v-1),T=(r+1)*S+(v-1),C=(r+1)*S+v,_=(r+1)*(S-1)+v;g.push(w,T,_),g.push(T,C,_)}}function b(){for(let S=0;S<=t;S++)for(let v=0;v<=r;v++)c.x=S/t,c.y=v/r,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new Cs(new Es[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}}function Xi(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];if(bc(r))r.isRenderTargetTexture?(Ke("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone();else if(Array.isArray(r))if(bc(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][n]=s}else e[t][n]=r.slice();else e[t][n]=r}}return e}function Gt(i){const e={};for(let t=0;t<i.length;t++){const n=Xi(i[t]);for(const r in n)e[r]=n[r]}return e}function bc(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function ud(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function wc(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:nt.workingColorSpace}const Pr={clone:Xi,merge:Gt};var fd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,dd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class _t extends ds{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=fd,this.fragmentShader=dd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Xi(e.uniforms),this.uniformsGroups=ud(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=t[r.value]||null;break;case"c":this.uniforms[n].value=new Ye().setHex(r.value);break;case"v2":this.uniforms[n].value=new ae().fromArray(r.value);break;case"v3":this.uniforms[n].value=new U().fromArray(r.value);break;case"v4":this.uniforms[n].value=new mt().fromArray(r.value);break;case"m3":this.uniforms[n].value=new qe().fromArray(r.value);break;case"m4":this.uniforms[n].value=new ht().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class pd extends _t{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class md extends ds{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Lu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class gd extends ds{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Ec={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(Tc(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!Tc(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function Tc(i){try{const e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class vd{constructor(e,t,n){const r=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,s===!1&&r.onStart!==void 0&&r.onStart(h,a,o),s=!0},this.itemEnd=function(h){a++,r.onProgress!==void 0&&r.onProgress(h,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){const f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=c.length;f<u;f+=2){const d=c[f],g=c[f+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const xd=new vd;class Lo{constructor(e){this.manager=e!==void 0?e:xd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(r,s){n.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Lo.DEFAULT_MATERIAL_NAME="__DEFAULT";const zn={};class _d extends Error{constructor(e,t){super(e),this.response=t}}class Md extends Lo{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=Ec.get(`file:${e}`);if(s!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0);return}if(zn[e]!==void 0){zn[e].push({onLoad:t,onProgress:n,onError:r});return}zn[e]=[],zn[e].push({onLoad:t,onProgress:n,onError:r});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ke("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=zn[e],f=c.body.getReader(),u=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=u?parseInt(u):0,g=d!==0;let x=0;const m=new ReadableStream({start(p){b();function b(){f.read().then(({done:S,value:v})=>{if(S)p.close();else{x+=v.byteLength;const w=new ProgressEvent("progress",{lengthComputable:g,loaded:x,total:d});for(let T=0,C=h.length;T<C;T++){const _=h[T];_.onProgress&&_.onProgress(w)}p.enqueue(v),b()}},S=>{p.error(S)})}}});return new Response(m)}else throw new _d(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{const f=/charset="?([^;"\s]*)"?/i.exec(o),u=f&&f[1]?f[1].toLowerCase():void 0,d=new TextDecoder(u);return c.arrayBuffer().then(g=>d.decode(g))}}}).then(c=>{Ec.add(`file:${e}`,c);const h=zn[e];delete zn[e];for(let f=0,u=h.length;f<u;f++){const d=h[f];d.onLoad&&d.onLoad(c)}}).catch(c=>{const h=zn[e];if(h===void 0)throw this.manager.itemError(e),c;delete zn[e];for(let f=0,u=h.length;f<u;f++){const d=h[f];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Ps=new U,Ls=new Ln,wn=new U;class Ac extends Zt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ht,this.projectionMatrix=new ht,this.projectionMatrixInverse=new ht,this.coordinateSystem=yn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ps,Ls,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ps,Ls,wn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ps,Ls,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ps,Ls,wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Kn=new U,Rc=new ae,Cc=new ae;class Jt extends Ac{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=hr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(cr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return hr*2*Math.atan(Math.tan(cr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Kn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Kn.x,Kn.y).multiplyScalar(-e/Kn.z),Kn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Kn.x,Kn.y).multiplyScalar(-e/Kn.z)}getViewSize(e,t){return this.getViewBounds(e,Rc,Cc),t.subVectors(Cc,Rc)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(cr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*n/c,r*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Io extends Ac{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class yd extends Mt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const qi=-90,Yi=1;class Sd extends Zt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Jt(qi,Yi,e,t);r.layers=this.layers,this.add(r);const s=new Jt(qi,Yi,e,t);s.layers=this.layers,this.add(s);const a=new Jt(qi,Yi,e,t);a.layers=this.layers,this.add(a);const o=new Jt(qi,Yi,e,t);o.layers=this.layers,this.add(o);const l=new Jt(qi,Yi,e,t);l.layers=this.layers,this.add(l);const c=new Jt(qi,Yi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===yn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===rs)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,f=e.getRenderTarget(),u=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const x=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=x,e.setRenderTarget(n,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(f,u,d),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class bd extends Jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class wd{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Ed.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}}function Ed(){this._document.hidden===!1&&this.reset()}const ll=class ll{constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=n,s[3]=r,this}};ll.prototype.isMatrix2=!0;let Pc=ll;const Lc=new ae;class Ic{constructor(e=new ae(1/0,1/0),t=new ae(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Lc.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Lc).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}class xi{constructor(){this.type="ShapePath",this.color=new Ye,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new mi,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,n,r){return this.currentPath.quadraticCurveTo(e,t,n,r),this}bezierCurveTo(e,t,n,r,s,a){return this.currentPath.bezierCurveTo(e,t,n,r,s,a),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(l,c){let h=!1;const f=c.length;for(let u=0,d=f-1;u<f;d=u++){const g=c[u],x=c[d];g.y>l.y!=x.y>l.y&&l.x<(x.x-g.x)*(l.y-g.y)/(x.y-g.y)+g.x&&(h=!h)}return h}function t(l,c){const h=c.getCenter(new ae);if(e(h,l))return h;const f=h.y,u=[],d=l.length;for(let g=0;g<d;g++){const x=l[g],m=l[(g+1)%d];if(x.y>f!=m.y>f){const p=x.x+(f-x.y)*(m.x-x.x)/(m.y-x.y);u.push(p)}}return u.length>1&&(u.sort((g,x)=>g-x),h.x=(u[0]+u[1])/2),h}let n=this.userData.style&&this.userData.style.fillRule||"nonzero";n!=="nonzero"&&n!=="evenodd"&&(Ke('Fill-rule "'+n+'" is not supported, falling back to "nonzero".'),n="nonzero");const r=n==="nonzero"?(l=>l!==0):(l=>(l&1)!==0),s=[];for(const l of this.subPaths){const c=l.getPoints();if(c.length<3)continue;const h=Zn.area(c);if(h===0)continue;const f=new Ic;for(let u=0;u<c.length;u++)f.expandByPoint(c[u]);s.push({subPath:l,points:c,boundingBox:f,interiorPoint:t(c,f),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}s.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<s.length;l++){const c=s[l];let h=0;for(let f=l-1;f>=0;f--){const u=s[f];if(u.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,u.points)){c.container=u.exclude?u.container:u,h=u.winding,c.winding+=h;break}}r(c.winding)===r(h)&&(c.exclude=!0)}for(const l of s)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");const a=[],o=new Map;for(const l of s){if(l.exclude||l.role!=="outer")continue;const c=new Ts;c.curves=l.subPath.curves,a.push(c),o.set(l,c)}for(const l of s){if(l.exclude||l.role!=="hole")continue;const c=o.get(l.container);if(!c)continue;const h=new mi;h.curves=l.subPath.curves,c.holes.push(h)}return a}}function Dc(i,e,t,n){const r=Td(n);switch(t){case Pl:return i*e;case Kr:return i*e/r.components*r.byteLength;case ma:return i*e/r.components*r.byteLength;case oi:return i*e*2/r.components*r.byteLength;case ga:return i*e*2/r.components*r.byteLength;case Ll:return i*e*3/r.components*r.byteLength;case on:return i*e*4/r.components*r.byteLength;case va:return i*e*4/r.components*r.byteLength;case $r:case Jr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Qr:case jr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case _a:case ya:return Math.max(i,16)*Math.max(e,8)/4;case xa:case Ma:return Math.max(i,8)*Math.max(e,8)/2;case Sa:case ba:case Ea:case Ta:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case wa:case es:case Aa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ra:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ca:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Pa:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case La:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Ia:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Da:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case Na:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Ua:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Fa:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Oa:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Ba:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case za:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ka:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Ha:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Ga:case Va:case Wa:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Xa:case qa:return Math.ceil(i/4)*Math.ceil(e/4)*8;case ts:case Ya:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Td(i){switch(i){case qt:case Tl:return{byteLength:1,components:1};case or:case Al:case Dt:return{byteLength:2,components:1};case da:case pa:return{byteLength:2,components:4};case Mn:case fa:case an:return{byteLength:4,components:1};case Rl:case Cl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ta}})),typeof window<"u"&&(window.__THREE__?Ke("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ta);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Nc(){let i=null,e=!1,t=null,n=null;function r(s,a){n=i.requestAnimationFrame(r),t(s,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function Ad(i){const e=new WeakMap;function t(o,l){const c=o.array,h=o.usage,f=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){const h=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,h);else{f.sort((d,g)=>d.start-g.start);let u=0;for(let d=1;d<f.length;d++){const g=f[u],x=f[d];x.start<=g.start+g.count+1?g.count=Math.max(g.count,x.start+x.count-g.start):(++u,f[u]=x)}f.length=u+1;for(let d=0,g=f.length;d<g;d++){const x=f[d];i.bufferSubData(c,x.start*h.BYTES_PER_ELEMENT,h,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var Rd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Cd=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Pd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Ld=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Id=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Dd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Nd=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Ud=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Fd=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Od=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Bd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,zd=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,kd=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Hd=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Gd=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Vd=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Wd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Xd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,qd=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Yd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Zd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Kd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,$d=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Jd=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Qd=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,jd=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,ep=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,tp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,np=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ip=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,rp="gl_FragColor = linearToOutputTexel( gl_FragColor );",sp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,ap=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,op=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,lp=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,cp=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,hp=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,up=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,dp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,pp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,mp=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,gp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,vp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,xp=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,_p=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Mp=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,yp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Sp=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,bp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,wp=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ep=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Tp=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Ap=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Rp=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Cp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Pp=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Lp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Ip=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Dp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Np=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Up=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Fp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Op=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Bp=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,zp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,kp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Hp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Gp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Vp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Wp=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Xp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,qp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Yp=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Zp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Kp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,$p=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Jp=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Qp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,jp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,e0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,t0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,n0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,i0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,r0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,s0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,a0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,o0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,l0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,c0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,h0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,u0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,f0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,d0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,p0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,m0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,g0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,v0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,x0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,_0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,M0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,y0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,S0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,b0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,w0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,E0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,T0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,A0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Qe={alphahash_fragment:Rd,alphahash_pars_fragment:Cd,alphamap_fragment:Pd,alphamap_pars_fragment:Ld,alphatest_fragment:Id,alphatest_pars_fragment:Dd,aomap_fragment:Nd,aomap_pars_fragment:Ud,batching_pars_vertex:Fd,batching_vertex:Od,begin_vertex:Bd,beginnormal_vertex:zd,bsdfs:kd,iridescence_fragment:Hd,bumpmap_pars_fragment:Gd,clipping_planes_fragment:Vd,clipping_planes_pars_fragment:Wd,clipping_planes_pars_vertex:Xd,clipping_planes_vertex:qd,color_fragment:Yd,color_pars_fragment:Zd,color_pars_vertex:Kd,color_vertex:$d,common:Jd,cube_uv_reflection_fragment:Qd,defaultnormal_vertex:jd,displacementmap_pars_vertex:ep,displacementmap_vertex:tp,emissivemap_fragment:np,emissivemap_pars_fragment:ip,colorspace_fragment:rp,colorspace_pars_fragment:sp,envmap_fragment:ap,envmap_common_pars_fragment:op,envmap_pars_fragment:lp,envmap_pars_vertex:cp,envmap_physical_pars_fragment:Mp,envmap_vertex:hp,fog_vertex:up,fog_pars_vertex:fp,fog_fragment:dp,fog_pars_fragment:pp,gradientmap_pars_fragment:mp,lightmap_pars_fragment:gp,lights_lambert_fragment:vp,lights_lambert_pars_fragment:xp,lights_pars_begin:_p,lights_toon_fragment:yp,lights_toon_pars_fragment:Sp,lights_phong_fragment:bp,lights_phong_pars_fragment:wp,lights_physical_fragment:Ep,lights_physical_pars_fragment:Tp,lights_fragment_begin:Ap,lights_fragment_maps:Rp,lights_fragment_end:Cp,lightprobes_pars_fragment:Pp,logdepthbuf_fragment:Lp,logdepthbuf_pars_fragment:Ip,logdepthbuf_pars_vertex:Dp,logdepthbuf_vertex:Np,map_fragment:Up,map_pars_fragment:Fp,map_particle_fragment:Op,map_particle_pars_fragment:Bp,metalnessmap_fragment:zp,metalnessmap_pars_fragment:kp,morphinstance_vertex:Hp,morphcolor_vertex:Gp,morphnormal_vertex:Vp,morphtarget_pars_vertex:Wp,morphtarget_vertex:Xp,normal_fragment_begin:qp,normal_fragment_maps:Yp,normal_pars_fragment:Zp,normal_pars_vertex:Kp,normal_vertex:$p,normalmap_pars_fragment:Jp,clearcoat_normal_fragment_begin:Qp,clearcoat_normal_fragment_maps:jp,clearcoat_pars_fragment:e0,iridescence_pars_fragment:t0,opaque_fragment:n0,packing:i0,premultiplied_alpha_fragment:r0,project_vertex:s0,dithering_fragment:a0,dithering_pars_fragment:o0,roughnessmap_fragment:l0,roughnessmap_pars_fragment:c0,shadowmap_pars_fragment:h0,shadowmap_pars_vertex:u0,shadowmap_vertex:f0,shadowmask_pars_fragment:d0,skinbase_vertex:p0,skinning_pars_vertex:m0,skinning_vertex:g0,skinnormal_vertex:v0,specularmap_fragment:x0,specularmap_pars_fragment:_0,tonemapping_fragment:M0,tonemapping_pars_fragment:y0,transmission_fragment:S0,transmission_pars_fragment:b0,uv_pars_fragment:w0,uv_pars_vertex:E0,uv_vertex:T0,worldpos_vertex:A0,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},Re={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qe}},envmap:{envMap:{value:null},envMapRotation:{value:new qe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qe},normalScale:{value:new ae(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0},uvTransform:{value:new qe}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new ae(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}}},En={basic:{uniforms:Gt([Re.common,Re.specularmap,Re.envmap,Re.aomap,Re.lightmap,Re.fog]),vertexShader:Qe.meshbasic_vert,fragmentShader:Qe.meshbasic_frag},lambert:{uniforms:Gt([Re.common,Re.specularmap,Re.envmap,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.fog,Re.lights,{emissive:{value:new Ye(0)},envMapIntensity:{value:1}}]),vertexShader:Qe.meshlambert_vert,fragmentShader:Qe.meshlambert_frag},phong:{uniforms:Gt([Re.common,Re.specularmap,Re.envmap,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.fog,Re.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphong_vert,fragmentShader:Qe.meshphong_frag},standard:{uniforms:Gt([Re.common,Re.envmap,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.roughnessmap,Re.metalnessmap,Re.fog,Re.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag},toon:{uniforms:Gt([Re.common,Re.aomap,Re.lightmap,Re.emissivemap,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.gradientmap,Re.fog,Re.lights,{emissive:{value:new Ye(0)}}]),vertexShader:Qe.meshtoon_vert,fragmentShader:Qe.meshtoon_frag},matcap:{uniforms:Gt([Re.common,Re.bumpmap,Re.normalmap,Re.displacementmap,Re.fog,{matcap:{value:null}}]),vertexShader:Qe.meshmatcap_vert,fragmentShader:Qe.meshmatcap_frag},points:{uniforms:Gt([Re.points,Re.fog]),vertexShader:Qe.points_vert,fragmentShader:Qe.points_frag},dashed:{uniforms:Gt([Re.common,Re.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qe.linedashed_vert,fragmentShader:Qe.linedashed_frag},depth:{uniforms:Gt([Re.common,Re.displacementmap]),vertexShader:Qe.depth_vert,fragmentShader:Qe.depth_frag},normal:{uniforms:Gt([Re.common,Re.bumpmap,Re.normalmap,Re.displacementmap,{opacity:{value:1}}]),vertexShader:Qe.meshnormal_vert,fragmentShader:Qe.meshnormal_frag},sprite:{uniforms:Gt([Re.sprite,Re.fog]),vertexShader:Qe.sprite_vert,fragmentShader:Qe.sprite_frag},background:{uniforms:{uvTransform:{value:new qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qe.background_vert,fragmentShader:Qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new qe}},vertexShader:Qe.backgroundCube_vert,fragmentShader:Qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qe.cube_vert,fragmentShader:Qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qe.equirect_vert,fragmentShader:Qe.equirect_frag},distance:{uniforms:Gt([Re.common,Re.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qe.distance_vert,fragmentShader:Qe.distance_frag},shadow:{uniforms:Gt([Re.lights,Re.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:Qe.shadow_vert,fragmentShader:Qe.shadow_frag}};En.physical={uniforms:Gt([En.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qe},clearcoatNormalScale:{value:new ae(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qe},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qe},transmissionSamplerSize:{value:new ae},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qe},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qe},anisotropyVector:{value:new ae},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qe}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag};const Is={r:0,b:0,g:0},R0=new ht,Uc=new qe;Uc.set(-1,0,0,0,1,0,0,0,1);function C0(i,e,t,n,r,s){const a=new Ye(0);let o=r===!0?0:1,l,c,h=null,f=0,u=null;function d(b){let S=b.isScene===!0?b.background:null;if(S&&S.isTexture){const v=b.backgroundBlurriness>0;S=e.get(S,v)}return S}function g(b){let S=!1;const v=d(b);v===null?m(a,o):v&&v.isColor&&(m(v,1),S=!0);const w=i.xr.getEnvironmentBlendMode();w==="additive"?t.buffers.color.setClear(0,0,0,1,s):w==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(i.autoClear||S)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function x(b,S){const v=d(S);v&&(v.isCubeTexture||v.mapping===Xr)?(c===void 0&&(c=new at(new Ge(1,1,1),new _t({name:"BackgroundCubeMaterial",uniforms:Xi(En.backgroundCube.uniforms),vertexShader:En.backgroundCube.vertexShader,fragmentShader:En.backgroundCube.fragmentShader,side:kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(w,T,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(R0.makeRotationFromEuler(S.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(Uc),c.material.toneMapped=nt.getTransfer(v.colorSpace)!==ct,(h!==v||f!==v.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=v,f=v.version,u=i.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new at(new Wi(2,2),new _t({name:"BackgroundMaterial",uniforms:Xi(En.background.uniforms),vertexShader:En.background.vertexShader,fragmentShader:En.background.fragmentShader,side:ri,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,l.material.toneMapped=nt.getTransfer(v.colorSpace)!==ct,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||f!==v.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=v,f=v.version,u=i.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function m(b,S){b.getRGB(Is,wc(i)),t.buffers.color.setClear(Is.r,Is.g,Is.b,S,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,S=1){a.set(b),o=S,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,m(a,o)},render:g,addToRenderList:x,dispose:p}}function P0(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=u(null);let s=r,a=!1;function o(G,z,J,k,Y){let ne=!1;const $=f(G,k,J,z);s!==$&&(s=$,c(s.object)),ne=d(G,k,J,Y),ne&&g(G,k,J,Y),Y!==null&&e.update(Y,i.ELEMENT_ARRAY_BUFFER),(ne||a)&&(a=!1,v(G,z,J,k),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Y).buffer))}function l(){return i.createVertexArray()}function c(G){return i.bindVertexArray(G)}function h(G){return i.deleteVertexArray(G)}function f(G,z,J,k){const Y=k.wireframe===!0;let ne=n[z.id];ne===void 0&&(ne={},n[z.id]=ne);const $=G.isInstancedMesh===!0?G.id:0;let K=ne[$];K===void 0&&(K={},ne[$]=K);let re=K[J.id];re===void 0&&(re={},K[J.id]=re);let se=re[Y];return se===void 0&&(se=u(l()),re[Y]=se),se}function u(G){const z=[],J=[],k=[];for(let Y=0;Y<t;Y++)z[Y]=0,J[Y]=0,k[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:J,attributeDivisors:k,object:G,attributes:{},index:null}}function d(G,z,J,k){const Y=s.attributes,ne=z.attributes;let $=0;const K=J.getAttributes();for(const re in K)if(K[re].location>=0){const ue=Y[re];let Ie=ne[re];if(Ie===void 0&&(re==="instanceMatrix"&&G.instanceMatrix&&(Ie=G.instanceMatrix),re==="instanceColor"&&G.instanceColor&&(Ie=G.instanceColor)),ue===void 0||ue.attribute!==Ie||Ie&&ue.data!==Ie.data)return!0;$++}return s.attributesNum!==$||s.index!==k}function g(G,z,J,k){const Y={},ne=z.attributes;let $=0;const K=J.getAttributes();for(const re in K)if(K[re].location>=0){let ue=ne[re];ue===void 0&&(re==="instanceMatrix"&&G.instanceMatrix&&(ue=G.instanceMatrix),re==="instanceColor"&&G.instanceColor&&(ue=G.instanceColor));const Ie={};Ie.attribute=ue,ue&&ue.data&&(Ie.data=ue.data),Y[re]=Ie,$++}s.attributes=Y,s.attributesNum=$,s.index=k}function x(){const G=s.newAttributes;for(let z=0,J=G.length;z<J;z++)G[z]=0}function m(G){p(G,0)}function p(G,z){const J=s.newAttributes,k=s.enabledAttributes,Y=s.attributeDivisors;J[G]=1,k[G]===0&&(i.enableVertexAttribArray(G),k[G]=1),Y[G]!==z&&(i.vertexAttribDivisor(G,z),Y[G]=z)}function b(){const G=s.newAttributes,z=s.enabledAttributes;for(let J=0,k=z.length;J<k;J++)z[J]!==G[J]&&(i.disableVertexAttribArray(J),z[J]=0)}function S(G,z,J,k,Y,ne,$){$===!0?i.vertexAttribIPointer(G,z,J,Y,ne):i.vertexAttribPointer(G,z,J,k,Y,ne)}function v(G,z,J,k){x();const Y=k.attributes,ne=J.getAttributes(),$=z.defaultAttributeValues;for(const K in ne){const re=ne[K];if(re.location>=0){let se=Y[K];if(se===void 0&&(K==="instanceMatrix"&&G.instanceMatrix&&(se=G.instanceMatrix),K==="instanceColor"&&G.instanceColor&&(se=G.instanceColor)),se!==void 0){const ue=se.normalized,Ie=se.itemSize,_e=e.get(se);if(_e===void 0)continue;const Me=_e.buffer,Se=_e.type,ze=_e.bytesPerElement,N=Se===i.INT||Se===i.UNSIGNED_INT||se.gpuType===fa;if(se.isInterleavedBufferAttribute){const D=se.data,I=D.stride,P=se.offset;if(D.isInstancedInterleavedBuffer){for(let B=0;B<re.locationSize;B++)p(re.location+B,D.meshPerAttribute);G.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=D.meshPerAttribute*D.count)}else for(let B=0;B<re.locationSize;B++)m(re.location+B);i.bindBuffer(i.ARRAY_BUFFER,Me);for(let B=0;B<re.locationSize;B++)S(re.location+B,Ie/re.locationSize,Se,ue,I*ze,(P+Ie/re.locationSize*B)*ze,N)}else{if(se.isInstancedBufferAttribute){for(let D=0;D<re.locationSize;D++)p(re.location+D,se.meshPerAttribute);G.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let D=0;D<re.locationSize;D++)m(re.location+D);i.bindBuffer(i.ARRAY_BUFFER,Me);for(let D=0;D<re.locationSize;D++)S(re.location+D,Ie/re.locationSize,Se,ue,Ie*ze,Ie/re.locationSize*D*ze,N)}}else if($!==void 0){const ue=$[K];if(ue!==void 0)switch(ue.length){case 2:i.vertexAttrib2fv(re.location,ue);break;case 3:i.vertexAttrib3fv(re.location,ue);break;case 4:i.vertexAttrib4fv(re.location,ue);break;default:i.vertexAttrib1fv(re.location,ue)}}}}b()}function w(){A();for(const G in n){const z=n[G];for(const J in z){const k=z[J];for(const Y in k){const ne=k[Y];for(const $ in ne)h(ne[$].object),delete ne[$];delete k[Y]}}delete n[G]}}function T(G){if(n[G.id]===void 0)return;const z=n[G.id];for(const J in z){const k=z[J];for(const Y in k){const ne=k[Y];for(const $ in ne)h(ne[$].object),delete ne[$];delete k[Y]}}delete n[G.id]}function C(G){for(const z in n){const J=n[z];for(const k in J){const Y=J[k];if(Y[G.id]===void 0)continue;const ne=Y[G.id];for(const $ in ne)h(ne[$].object),delete ne[$];delete Y[G.id]}}}function _(G){for(const z in n){const J=n[z],k=G.isInstancedMesh===!0?G.id:0,Y=J[k];if(Y!==void 0){for(const ne in Y){const $=Y[ne];for(const K in $)h($[K].object),delete $[K];delete Y[ne]}delete J[k],Object.keys(J).length===0&&delete n[z]}}}function A(){F(),a=!0,s!==r&&(s=r,c(s.object))}function F(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:F,dispose:w,releaseStatesOfGeometry:T,releaseStatesOfObject:_,releaseStatesOfProgram:C,initAttributes:x,enableAttribute:m,disableUnusedAttributes:b}}function L0(i,e,t){let n;function r(l){n=l}function s(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let d=0;d<h;d++)u+=c[d];t.update(u,n,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function I0(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const C=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(C){return!(C!==on&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(C){const _=C===Dt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==qt&&C!==an&&!_&&n.convert(C)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(C){if(C==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const h=l(c);h!==c&&(Ke("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const f=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ke("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),S=i.getParameter(i.MAX_VARYING_VECTORS),v=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=i.getParameter(i.MAX_SAMPLES),T=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:d,maxVertexTextures:g,maxTextureSize:x,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:S,maxFragmentUniforms:v,maxSamples:w,samples:T}}function D0(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new On,o=new qe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const d=f.length!==0||u||n!==0||r;return r=u,n=f.length,d},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,u){t=h(f,u,0)},this.setState=function(f,u,d){const g=f.clippingPlanes,x=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!r||g===null||g.length===0||s&&!m)s?h(null):c();else{const b=s?0:n,S=b*4;let v=p.clippingState||null;l.value=v,v=h(g,u,S,d);for(let w=0;w!==S;++w)v[w]=t[w];p.clippingState=v,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(f,u,d,g){const x=f!==null?f.length:0;let m=null;if(x!==0){if(m=l.value,g!==!0||m===null){const p=d+x*4,b=u.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let S=0,v=d;S!==x;++S,v+=4)a.copy(f[S]).applyMatrix4(b,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}const Zi=4,N0=6,U0=20,F0=256,Lr=new Io,Fc=new Ye;let Do=null,No=0,Uo=0,Fo=!1;const O0=new U,_i=new U;class Oc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,s={}){const{size:a=256,position:o=O0}=s;Do=this._renderer.getRenderTarget(),No=this._renderer.getActiveCubeFace(),Uo=this._renderer.getActiveMipmapLevel(),Fo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=kc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=zc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Do,No,Uo),this._renderer.xr.enabled=Fo,e.scissorTest=!1,Ki(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===si||e.mapping===Ri?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Do=this._renderer.getRenderTarget(),No=this._renderer.getActiveCubeFace(),Uo=this._renderer.getActiveMipmapLevel(),Fo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Rt,minFilter:Rt,generateMipmaps:!1,type:Dt,format:on,colorSpace:ns,depthBuffer:!1},r=Bc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Bc(e,t,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=B0(s)),this._blurMaterial=k0(s,e,t),this._ggxMaterial=z0(s,e,t)}return r}_compileMaterial(e){const t=new at(new Mt,e);this._renderer.compile(t,Lr)}_sceneToCubeUV(e,t,n,r,s){const l=new Jt(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,d=f.toneMapping;f.getClearColor(Fc),f.toneMapping=xn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new at(new Ge,new xr({name:"PMREM.Background",side:kt,depthWrite:!1,depthTest:!1})));const x=this._backgroundBox,m=x.material;let p=!1;const b=e.background;b?b.isColor&&(m.color.copy(b),e.background=null,p=!0):(m.color.copy(Fc),p=!0);for(let S=0;S<6;S++){const v=S%3;v===0?(l.up.set(0,c[S],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+h[S],s.y,s.z)):v===1?(l.up.set(0,0,c[S]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+h[S],s.z)):(l.up.set(0,c[S],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+h[S]));const w=this._cubeSize;Ki(r,v*w,S>2?w:0,w,w),f.setRenderTarget(r),p&&f.render(x,l),f.render(e,l)}f.toneMapping=d,f.autoClear=u,e.background=b}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===si||e.mapping===Ri;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=kc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=zc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Ki(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,Lr)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=n}_applyGGXFilter(e,t,n){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const l=a.uniforms,c=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-h*h),u=c*1.25,d=f*u,{_lodMax:g}=this,x=this._sizeLods[n],m=3*x*(n>g-Zi?n-g+Zi:0),p=4*(this._cubeSize-x);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=g-t,Ki(s,m,p,3*x,2*x),r.setRenderTarget(s),r.render(o,Lr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-n,Ki(e,m,p,3*x,2*x),r.setRenderTarget(e),r.render(o,Lr)}_blur(e,t,n,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,n,a),this._blurPass(s,e,n,n,a)}_blurPass(e,t,n,r,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;const c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-n;const h=this._sizeLods[r],f=3*h*(r>this._lodMax-Zi?r-this._lodMax+Zi:0),u=4*(this._cubeSize-h);Ki(t,f,u,3*h,2*h),a.setRenderTarget(t),a.render(l,Lr)}}function B0(i){const e=[],t=[];let n=i;const r=i-Zi+1+N0;for(let s=0;s<r;s++){const a=Math.pow(2,n);e.push(a);const o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,u=6,d=3,g=new Float32Array(d*u*f),x=new Float32Array(d*u*f);for(let p=0;p<f;p++){const b=p%3*2/3-1,S=p>2?0:-1,v=[b,S,0,b+2/3,S,0,b+2/3,S+1,0,b,S,0,b+2/3,S+1,0,b,S+1,0];g.set(v,d*u*p);for(let w=0;w<u;w++){const T=h[w*2]*2-1,C=h[w*2+1]*2-1;p===0?_i.set(1,C,T):p===1?_i.set(-T,1,-C):p===2?_i.set(-T,C,1):p===3?_i.set(-1,C,-T):p===4?_i.set(-T,-1,C):_i.set(T,C,-1),_i.toArray(x,(p*u+w)*d)}}const m=new Mt;m.setAttribute("position",new Kt(g,d)),m.setAttribute("outputDirection",new Kt(x,d)),t.push(new at(m,null)),n>Zi&&n--}return{lodMeshes:t,sizeLods:e}}function Bc(i,e,t){const n=new Lt(i,e,t);return n.texture.mapping=Xr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Ki(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function z0(i,e,t){return new _t({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:F0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ds(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function k0(i,e,t){return new _t({name:"SphericalGaussianBlur",defines:{SAMPLES:U0,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Ds(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function zc(){return new _t({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function kc(){return new _t({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function Ds(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Hc extends Lt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ac(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ge(5,5,5),s=new _t({name:"CubemapFromEquirect",uniforms:Xi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:kt,blending:vn});s.uniforms.tEquirect.value=t;const a=new at(r,s),o=t.minFilter;return t.minFilter===Hn&&(t.minFilter=Rt),new Sd(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}function H0(i){let e=new WeakMap,t=new WeakMap,n=null;function r(u,d=!1){return u==null?null:d?a(u):s(u)}function s(u){if(u&&u.isTexture){const d=u.mapping;if(d===ca||d===ha)if(e.has(u)){const g=e.get(u).texture;return o(g,u.mapping)}else{const g=u.image;if(g&&g.height>0){const x=new Hc(g.height);return x.fromEquirectangularTexture(i,u),e.set(u,x),u.addEventListener("dispose",c),o(x.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const d=u.mapping,g=d===ca||d===ha,x=d===si||d===Ri;if(g||x){let m=t.get(u);const p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new Oc(i)),m=g?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{const b=u.image;return g&&b&&b.height>0||x&&b&&l(b)?(n===null&&(n=new Oc(i)),m=g?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function o(u,d){return d===ca?u.mapping=si:d===ha&&(u.mapping=Ri),u}function l(u){let d=0;const g=6;for(let x=0;x<g;x++)u[x]!==void 0&&d++;return d===g}function c(u){const d=u.target;d.removeEventListener("dispose",c);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function h(u){const d=u.target;d.removeEventListener("dispose",h);const g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:f}}function G0(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const r=i.getExtension(n);return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&Ci("WebGLRenderer: "+n+" extension not supported."),r}}}function V0(i,e,t,n){const r={},s=new WeakMap;function a(f){const u=f.target;u.index!==null&&e.remove(u.index);for(const g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete r[u.id];const d=s.get(u);d&&(e.remove(d),s.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(f,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function l(f){const u=f.attributes;for(const d in u)e.update(u[d],i.ARRAY_BUFFER)}function c(f){const u=[],d=f.index,g=f.attributes.position;let x=0;if(g===void 0)return;if(d!==null){const b=d.array;x=d.version;for(let S=0,v=b.length;S<v;S+=3){const w=b[S+0],T=b[S+1],C=b[S+2];u.push(w,T,T,C,C,w)}}else{const b=g.array;x=g.version;for(let S=0,v=b.length/3-1;S<v;S+=3){const w=S+0,T=S+1,C=S+2;u.push(w,T,T,C,C,w)}}const m=new(g.count>=65535?jl:Ql)(u,1);m.version=x;const p=s.get(f);p&&e.remove(p),s.set(f,m)}function h(f){const u=s.get(f);if(u){const d=f.index;d!==null&&u.version<d.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:h}}function W0(i,e,t){let n;function r(f){n=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function l(f,u){i.drawElements(n,u,s,f*a),t.update(u,n,1)}function c(f,u,d){d!==0&&(i.drawElementsInstanced(n,u,s,f*a,d),t.update(u,n,d))}function h(f,u,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,s,f,0,d);let x=0;for(let m=0;m<d;m++)x+=u[m];t.update(x,n,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function X0(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:it("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function q0(i,e,t){const n=new WeakMap,r=new mt;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==f){let A=function(){C.dispose(),n.delete(o),o.removeEventListener("dispose",A)};u!==void 0&&u.texture.dispose();const d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,x=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],b=o.morphAttributes.color||[];let S=0;d===!0&&(S=1),g===!0&&(S=2),x===!0&&(S=3);let v=o.attributes.position.count*S,w=1;v>e.maxTextureSize&&(w=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);const T=new Float32Array(v*w*4*f),C=new Hl(T,v,w,f);C.type=an,C.needsUpdate=!0;const _=S*4;for(let F=0;F<f;F++){const G=m[F],z=p[F],J=b[F],k=v*w*4*F;for(let Y=0;Y<G.count;Y++){const ne=Y*_;d===!0&&(r.fromBufferAttribute(G,Y),T[k+ne+0]=r.x,T[k+ne+1]=r.y,T[k+ne+2]=r.z,T[k+ne+3]=0),g===!0&&(r.fromBufferAttribute(z,Y),T[k+ne+4]=r.x,T[k+ne+5]=r.y,T[k+ne+6]=r.z,T[k+ne+7]=0),x===!0&&(r.fromBufferAttribute(J,Y),T[k+ne+8]=r.x,T[k+ne+9]=r.y,T[k+ne+10]=r.z,T[k+ne+11]=J.itemSize===4?r.w:1)}}u={count:f,texture:C,size:new ae(v,w)},n.set(o,u),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let d=0;for(let x=0;x<c.length;x++)d+=c[x];const g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:s}}function Y0(i,e,t,n,r){let s=new WeakMap;function a(c){const h=r.render.frame,f=c.geometry,u=e.get(c,f);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){const d=c.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return u}function o(){s=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}const Z0={[xl]:"LINEAR_TONE_MAPPING",[_l]:"REINHARD_TONE_MAPPING",[Ml]:"CINEON_TONE_MAPPING",[yl]:"ACES_FILMIC_TONE_MAPPING",[bl]:"AGX_TONE_MAPPING",[wl]:"NEUTRAL_TONE_MAPPING",[Sl]:"CUSTOM_TONE_MAPPING"};function K0(i,e,t,n,r,s){const a=new Lt(e,t,{type:i,depthBuffer:r,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new Mt;c.setAttribute("position",new st([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new st([0,2,0,0,2,0],2));const h=new pd({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new at(c,h),u=new Io(-1,1,1,-1,0,1);let d=null,g=null,x=!1,m,p=null,b=[],S=!1;this.setSize=function(v,w){a.setSize(v,w),o!==null&&o.setSize(v,w),l!==null&&l.setSize(v,w);for(let T=0;T<b.length;T++){const C=b[T];C.setSize&&C.setSize(v,w)}},this.setEffects=function(v){b=v,S=b.length>0&&b[0].isRenderPass===!0;const w=a.width,T=a.height;b.length>0&&o===null&&(o=new Lt(w,T,{type:Dt,depthBuffer:!1,stencilBuffer:!1}),l=new Lt(w,T,{type:Dt,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<b.length;C++){const _=b[C];_.setSize&&_.setSize(w,T)}},this.begin=function(v,w){if(x||v.toneMapping===xn&&b.length===0)return!1;if(p=w,w!==null){const T=w.width,C=w.height;(a.width!==T||a.height!==C)&&this.setSize(T,C)}return S===!1&&v.setRenderTarget(a),m=v.toneMapping,v.toneMapping=xn,!0},this.hasRenderPass=function(){return S},this.end=function(v,w){v.toneMapping=m,x=!0;let T=a,C=o;for(let _=0;_<b.length;_++){const A=b[_];A.enabled!==!1&&(A.render(v,C,T,w),A.needsSwap!==!1&&(T=C,C=C===o?l:o))}if(d!==v.outputColorSpace||g!==v.toneMapping){d=v.outputColorSpace,g=v.toneMapping,h.defines={},nt.getTransfer(d)===ct&&(h.defines.SRGB_TRANSFER="");const _=Z0[g];_&&(h.defines[_]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=T.texture,v.setRenderTarget(p),v.render(f,u),p=null,x=!1},this.isCompositing=function(){return x},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}const Gc=new Ut,Oo=new yr(1,1),Vc=new Hl,Wc=new pf,Xc=new ac,qc=[],Yc=[],Zc=new Float32Array(16),Kc=new Float32Array(9),$c=new Float32Array(4);function $i(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=qc[r];if(s===void 0&&(s=new Float32Array(r),qc[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function Tt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function At(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Ns(i,e){let t=Yc[e];t===void 0&&(t=new Int32Array(e),Yc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function $0(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function J0(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;i.uniform2fv(this.addr,e),At(t,e)}}function Q0(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Tt(t,e))return;i.uniform3fv(this.addr,e),At(t,e)}}function j0(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;i.uniform4fv(this.addr,e),At(t,e)}}function em(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Tt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),At(t,e)}else{if(Tt(t,n))return;$c.set(n),i.uniformMatrix2fv(this.addr,!1,$c),At(t,n)}}function tm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Tt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),At(t,e)}else{if(Tt(t,n))return;Kc.set(n),i.uniformMatrix3fv(this.addr,!1,Kc),At(t,n)}}function nm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Tt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),At(t,e)}else{if(Tt(t,n))return;Zc.set(n),i.uniformMatrix4fv(this.addr,!1,Zc),At(t,n)}}function im(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function rm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;i.uniform2iv(this.addr,e),At(t,e)}}function sm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Tt(t,e))return;i.uniform3iv(this.addr,e),At(t,e)}}function am(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;i.uniform4iv(this.addr,e),At(t,e)}}function om(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function lm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Tt(t,e))return;i.uniform2uiv(this.addr,e),At(t,e)}}function cm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Tt(t,e))return;i.uniform3uiv(this.addr,e),At(t,e)}}function hm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Tt(t,e))return;i.uniform4uiv(this.addr,e),At(t,e)}}function um(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(Oo.compareFunction=t.isReversedDepthBuffer()?$a:Ka,s=Oo):s=Gc,t.setTexture2D(e||s,r)}function fm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Wc,r)}function dm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Xc,r)}function pm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||Vc,r)}function mm(i){switch(i){case 5126:return $0;case 35664:return J0;case 35665:return Q0;case 35666:return j0;case 35674:return em;case 35675:return tm;case 35676:return nm;case 5124:case 35670:return im;case 35667:case 35671:return rm;case 35668:case 35672:return sm;case 35669:case 35673:return am;case 5125:return om;case 36294:return lm;case 36295:return cm;case 36296:return hm;case 35678:case 36198:case 36298:case 36306:case 35682:return um;case 35679:case 36299:case 36307:return fm;case 35680:case 36300:case 36308:case 36293:return dm;case 36289:case 36303:case 36311:case 36292:return pm}}function gm(i,e){i.uniform1fv(this.addr,e)}function vm(i,e){const t=$i(e,this.size,2);i.uniform2fv(this.addr,t)}function xm(i,e){const t=$i(e,this.size,3);i.uniform3fv(this.addr,t)}function _m(i,e){const t=$i(e,this.size,4);i.uniform4fv(this.addr,t)}function Mm(i,e){const t=$i(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function ym(i,e){const t=$i(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Sm(i,e){const t=$i(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function bm(i,e){i.uniform1iv(this.addr,e)}function wm(i,e){i.uniform2iv(this.addr,e)}function Em(i,e){i.uniform3iv(this.addr,e)}function Tm(i,e){i.uniform4iv(this.addr,e)}function Am(i,e){i.uniform1uiv(this.addr,e)}function Rm(i,e){i.uniform2uiv(this.addr,e)}function Cm(i,e){i.uniform3uiv(this.addr,e)}function Pm(i,e){i.uniform4uiv(this.addr,e)}function Lm(i,e,t){const n=this.cache,r=e.length,s=Ns(t,r);Tt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));let a;this.type===i.SAMPLER_2D_SHADOW?a=Oo:a=Gc;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function Im(i,e,t){const n=this.cache,r=e.length,s=Ns(t,r);Tt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Wc,s[a])}function Dm(i,e,t){const n=this.cache,r=e.length,s=Ns(t,r);Tt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Xc,s[a])}function Nm(i,e,t){const n=this.cache,r=e.length,s=Ns(t,r);Tt(n,s)||(i.uniform1iv(this.addr,s),At(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Vc,s[a])}function Um(i){switch(i){case 5126:return gm;case 35664:return vm;case 35665:return xm;case 35666:return _m;case 35674:return Mm;case 35675:return ym;case 35676:return Sm;case 5124:case 35670:return bm;case 35667:case 35671:return wm;case 35668:case 35672:return Em;case 35669:case 35673:return Tm;case 5125:return Am;case 36294:return Rm;case 36295:return Cm;case 36296:return Pm;case 35678:case 36198:case 36298:case 36306:case 35682:return Lm;case 35679:case 36299:case 36307:return Im;case 35680:case 36300:case 36308:case 36293:return Dm;case 36289:case 36303:case 36311:case 36292:return Nm}}class Fm{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=mm(t.type)}}class Om{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Um(t.type)}}class Bm{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const Bo=/(\w+)(\])?(\[|\.)?/g;function Jc(i,e){i.seq.push(e),i.map[e.id]=e}function zm(i,e,t){const n=i.name,r=n.length;for(Bo.lastIndex=0;;){const s=Bo.exec(n),a=Bo.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){Jc(t,c===void 0?new Fm(o,i,e):new Om(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new Bm(o),Jc(t,f)),t=f}}}class Us{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);zm(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function Qc(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const km=37297;let Hm=0;function Gm(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const jc=new qe;function Vm(i){nt._getMatrix(jc,nt.workingColorSpace,i);const e=`mat3( ${jc.elements.map(t=>t.toFixed(4))} )`;switch(nt.getTransfer(i)){case is:return[e,"LinearTransferOETF"];case ct:return[e,"sRGBTransferOETF"];default:return Ke("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function eh(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=(i.getShaderInfoLog(e)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+Gm(i.getShaderSource(e),o)}else return s}function Wm(i,e){const t=Vm(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const Xm={[xl]:"Linear",[_l]:"Reinhard",[Ml]:"Cineon",[yl]:"ACESFilmic",[bl]:"AgX",[wl]:"Neutral",[Sl]:"Custom"};function qm(i,e){const t=Xm[e];return t===void 0?(Ke("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Fs=new U;function Ym(){nt.getLuminanceCoefficients(Fs);const i=Fs.x.toFixed(4),e=Fs.y.toFixed(4),t=Fs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Zm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ir).join(`
`)}function Km(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function $m(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Ir(i){return i!==""}function th(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function nh(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Jm=/^[ \t]*#include +<([\w\d./]+)>/gm;function zo(i){return i.replace(Jm,jm)}const Qm=new Map;function jm(i,e){let t=Qe[e];if(t===void 0){const n=Qm.get(e);if(n!==void 0)t=Qe[n],Ke('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return zo(t)}const eg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ih(i){return i.replace(eg,tg)}function tg(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function rh(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const ng={[Wr]:"SHADOWMAP_TYPE_PCF",[ir]:"SHADOWMAP_TYPE_VSM"};function ig(i){return ng[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const rg={[si]:"ENVMAP_TYPE_CUBE",[Ri]:"ENVMAP_TYPE_CUBE",[Xr]:"ENVMAP_TYPE_CUBE_UV"};function sg(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":rg[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const ag={[Ri]:"ENVMAP_MODE_REFRACTION"};function og(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":ag[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const lg={[vl]:"ENVMAP_BLENDING_MULTIPLY",[Ru]:"ENVMAP_BLENDING_MIX",[Cu]:"ENVMAP_BLENDING_ADD"};function cg(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":lg[i.combine]||"ENVMAP_BLENDING_NONE"}function hg(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function ug(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=ig(t),c=sg(t),h=og(t),f=cg(t),u=hg(t),d=Zm(t),g=Km(s),x=r.createProgram();let m,p,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ir).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Ir).join(`
`),p.length>0&&(p+=`
`)):(m=[rh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ir).join(`
`),p=[rh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==xn?"#define TONE_MAPPING":"",t.toneMapping!==xn?Qe.tonemapping_pars_fragment:"",t.toneMapping!==xn?qm("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Qe.colorspace_pars_fragment,Wm("linearToOutputTexel",t.outputColorSpace),Ym(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ir).join(`
`)),a=zo(a),a=th(a,t),a=nh(a,t),o=zo(o),o=th(o,t),o=nh(o,t),a=ih(a),o=ih(o),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Dl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Dl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const S=b+m+a,v=b+p+o,w=Qc(r,r.VERTEX_SHADER,S),T=Qc(r,r.FRAGMENT_SHADER,v);r.attachShader(x,w),r.attachShader(x,T),t.index0AttributeName!==void 0?r.bindAttribLocation(x,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x);function C(G){if(i.debug.checkShaderErrors){const z=r.getProgramInfoLog(x)||"",J=r.getShaderInfoLog(w)||"",k=r.getShaderInfoLog(T)||"",Y=z.trim(),ne=J.trim(),$=k.trim();let K=!0,re=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(K=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,x,w,T);else{const se=eh(r,w,"vertex"),ue=eh(r,T,"fragment");it("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+G.name+`
Material Type: `+G.type+`

Program Info Log: `+Y+`
`+se+`
`+ue)}else Y!==""?Ke("WebGLProgram: Program Info Log:",Y):(ne===""||$==="")&&(re=!1);re&&(G.diagnostics={runnable:K,programLog:Y,vertexShader:{log:ne,prefix:m},fragmentShader:{log:$,prefix:p}})}r.deleteShader(w),r.deleteShader(T),_=new Us(r,x),A=$m(r,x)}let _;this.getUniforms=function(){return _===void 0&&C(this),_};let A;this.getAttributes=function(){return A===void 0&&C(this),A};let F=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return F===!1&&(F=r.getProgramParameter(x,km)),F},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Hm++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=w,this.fragmentShader=T,this}let fg=0;class dg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new pg(e),t.set(e,n)),n}}class pg{constructor(e){this.id=fg++,this.code=e,this.usedTimes=0}}function mg(i){return i===oi||i===es||i===ts}function gg(i,e,t,n,r,s){const a=new Wl,o=new dg,l=new Set,c=[],h=new Map,f=n.logarithmicDepthBuffer;let u=n.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return l.add(_),_===0?"uv":`uv${_}`}function x(_,A,F,G,z,J){const k=G.fog,Y=z.geometry,ne=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?G.environment:null,$=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,K=e.get(_.envMap||ne,$),re=K&&K.mapping===Xr?K.image.height:null,se=d[_.type];_.precision!==null&&(u=n.getMaxPrecision(_.precision),u!==_.precision&&Ke("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));const ue=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Ie=ue!==void 0?ue.length:0;let _e=0;Y.morphAttributes.position!==void 0&&(_e=1),Y.morphAttributes.normal!==void 0&&(_e=2),Y.morphAttributes.color!==void 0&&(_e=3);let Me,Se,ze,N;if(se){const dt=En[se];Me=dt.vertexShader,Se=dt.fragmentShader}else{Me=_.vertexShader,Se=_.fragmentShader;const dt=o.getVertexShaderStage(_),ot=o.getFragmentShaderStage(_);o.update(_,dt,ot),ze=dt.id,N=ot.id}const D=i.getRenderTarget(),I=i.state.buffers.depth.getReversed(),P=z.isInstancedMesh===!0,B=z.isBatchedMesh===!0,ie=!!_.map,me=!!_.matcap,R=!!K,H=!!_.aoMap,O=!!_.lightMap,Z=!!_.bumpMap&&_.wireframe===!1,Q=!!_.normalMap,ce=!!_.displacementMap,ge=!!_.emissiveMap,pe=!!_.metalnessMap,q=!!_.roughnessMap,y=_.anisotropy>0,Ce=_.clearcoat>0,Fe=_.dispersion>0,L=_.retroreflectivity>0,M=_.iridescence>0,X=_.sheen>0,j=_.transmission>0,le=y&&!!_.anisotropyMap,xe=Ce&&!!_.clearcoatMap,ye=Ce&&!!_.clearcoatNormalMap,he=Ce&&!!_.clearcoatRoughnessMap,fe=M&&!!_.iridescenceMap,be=M&&!!_.iridescenceThicknessMap,ke=X&&!!_.sheenColorMap,Ee=X&&!!_.sheenRoughnessMap,we=!!_.specularMap,We=!!_.specularColorMap,Ze=!!_.specularIntensityMap,Je=j&&!!_.transmissionMap,W=j&&!!_.thicknessMap,Te=!!_.gradientMap,de=!!_.alphaMap,Ae=_.alphaTest>0,De=!!_.alphaHash,ve=!!_.extensions;let Xe=xn;_.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(Xe=i.toneMapping);const He={shaderID:se,shaderType:_.type,shaderName:_.name,vertexShader:Me,fragmentShader:Se,defines:_.defines,customVertexShaderID:ze,customFragmentShaderID:N,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:B,batchingColor:B&&z._colorsTexture!==null,instancing:P,instancingColor:P&&z.instanceColor!==null,instancingMorph:P&&z.morphTexture!==null,outputColorSpace:D===null?i.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:nt.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:ie,matcap:me,envMap:R,envMapMode:R&&K.mapping,envMapCubeUVHeight:re,aoMap:H,lightMap:O,bumpMap:Z,normalMap:Q,displacementMap:ce,emissiveMap:ge,normalMapObjectSpace:Q&&_.normalMapType===Iu,normalMapTangentSpace:Q&&_.normalMapType===Il,packedNormalMap:Q&&_.normalMapType===Il&&mg(_.normalMap.format),metalnessMap:pe,roughnessMap:q,anisotropy:y,anisotropyMap:le,clearcoat:Ce,clearcoatMap:xe,clearcoatNormalMap:ye,clearcoatRoughnessMap:he,dispersion:Fe,retroreflection:L,iridescence:M,iridescenceMap:fe,iridescenceThicknessMap:be,sheen:X,sheenColorMap:ke,sheenRoughnessMap:Ee,specularMap:we,specularColorMap:We,specularIntensityMap:Ze,transmission:j,transmissionMap:Je,thicknessMap:W,gradientMap:Te,opaque:_.transparent===!1&&_.blending===rr&&_.alphaToCoverage===!1,alphaMap:de,alphaTest:Ae,alphaHash:De,combine:_.combine,mapUv:ie&&g(_.map.channel),aoMapUv:H&&g(_.aoMap.channel),lightMapUv:O&&g(_.lightMap.channel),bumpMapUv:Z&&g(_.bumpMap.channel),normalMapUv:Q&&g(_.normalMap.channel),displacementMapUv:ce&&g(_.displacementMap.channel),emissiveMapUv:ge&&g(_.emissiveMap.channel),metalnessMapUv:pe&&g(_.metalnessMap.channel),roughnessMapUv:q&&g(_.roughnessMap.channel),anisotropyMapUv:le&&g(_.anisotropyMap.channel),clearcoatMapUv:xe&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:ye&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:he&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:fe&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:be&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:ke&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:Ee&&g(_.sheenRoughnessMap.channel),specularMapUv:we&&g(_.specularMap.channel),specularColorMapUv:We&&g(_.specularColorMap.channel),specularIntensityMapUv:Ze&&g(_.specularIntensityMap.channel),transmissionMapUv:Je&&g(_.transmissionMap.channel),thicknessMapUv:W&&g(_.thicknessMap.channel),alphaMapUv:de&&g(_.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(Q||y),vertexNormals:!!Y.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!Y.attributes.uv&&(ie||de),fog:!!k,useFog:_.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||Y.attributes.normal===void 0&&Q===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:I,skinning:z.isSkinnedMesh===!0,hasPositionAttribute:Y.attributes.position!==void 0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:Ie,morphTextureStride:_e,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:J.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:i.shadowMap.enabled&&F.length>0,shadowMapType:i.shadowMap.type,toneMapping:Xe,decodeVideoTexture:ie&&_.map.isVideoTexture===!0&&nt.getTransfer(_.map.colorSpace)===ct,decodeVideoTextureEmissive:ge&&_.emissiveMap.isVideoTexture===!0&&nt.getTransfer(_.emissiveMap.colorSpace)===ct,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===jt,flipSided:_.side===kt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ve&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&_.extensions.multiDraw===!0||B)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return He.vertexUv1s=l.has(1),He.vertexUv2s=l.has(2),He.vertexUv3s=l.has(3),l.clear(),He}function m(_){const A=[];if(_.shaderID?A.push(_.shaderID):(A.push(_.customVertexShaderID),A.push(_.customFragmentShaderID)),_.defines!==void 0)for(const F in _.defines)A.push(F),A.push(_.defines[F]);return _.isRawShaderMaterial===!1&&(p(A,_),b(A,_),A.push(i.outputColorSpace)),A.push(_.customProgramCacheKey),A.join()}function p(_,A){_.push(A.precision),_.push(A.outputColorSpace),_.push(A.envMapMode),_.push(A.envMapCubeUVHeight),_.push(A.mapUv),_.push(A.alphaMapUv),_.push(A.lightMapUv),_.push(A.aoMapUv),_.push(A.bumpMapUv),_.push(A.normalMapUv),_.push(A.displacementMapUv),_.push(A.emissiveMapUv),_.push(A.metalnessMapUv),_.push(A.roughnessMapUv),_.push(A.anisotropyMapUv),_.push(A.clearcoatMapUv),_.push(A.clearcoatNormalMapUv),_.push(A.clearcoatRoughnessMapUv),_.push(A.iridescenceMapUv),_.push(A.iridescenceThicknessMapUv),_.push(A.sheenColorMapUv),_.push(A.sheenRoughnessMapUv),_.push(A.specularMapUv),_.push(A.specularColorMapUv),_.push(A.specularIntensityMapUv),_.push(A.transmissionMapUv),_.push(A.thicknessMapUv),_.push(A.combine),_.push(A.fogExp2),_.push(A.sizeAttenuation),_.push(A.morphTargetsCount),_.push(A.morphAttributeCount),_.push(A.numSunLights),_.push(A.numDirLights),_.push(A.numPointLights),_.push(A.numSpotLights),_.push(A.numSpotLightMaps),_.push(A.numHemiLights),_.push(A.numRectAreaLights),_.push(A.numSunLightShadows),_.push(A.numDirLightShadows),_.push(A.numPointLightShadows),_.push(A.numSpotLightShadows),_.push(A.numSpotLightShadowsWithMaps),_.push(A.numLightProbes),_.push(A.shadowMapType),_.push(A.toneMapping),_.push(A.numClippingPlanes),_.push(A.numClipIntersection),_.push(A.depthPacking)}function b(_,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),_.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),_.push(a.mask)}function S(_){const A=d[_.type];let F;if(A){const G=En[A];F=Pr.clone(G.uniforms)}else F=_.uniforms;return F}function v(_,A){let F=h.get(A);return F!==void 0?++F.usedTimes:(F=new ug(i,A,_,r),c.push(F),h.set(A,F)),F}function w(_){if(--_.usedTimes===0){const A=c.indexOf(_);c[A]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function T(_){o.remove(_)}function C(){o.dispose()}return{getParameters:x,getProgramCacheKey:m,getUniforms:S,acquireProgram:v,releaseProgram:w,releaseShaderCache:T,programs:c,dispose:C}}function vg(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,l){i.get(a)[o]=l}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function xg(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function sh(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function ah(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(u){let d=0;return u.isInstancedMesh&&(d+=2),u.isSkinnedMesh&&(d+=1),d}function o(u,d,g,x,m,p){let b=i[e];return b===void 0?(b={id:u.id,object:u,geometry:d,material:g,materialVariant:a(u),groupOrder:x,renderOrder:u.renderOrder,z:m,group:p},i[e]=b):(b.id=u.id,b.object=u,b.geometry=d,b.material=g,b.materialVariant=a(u),b.groupOrder=x,b.renderOrder=u.renderOrder,b.z=m,b.group=p),e++,b}function l(u,d,g,x,m,p,b){b.reversedDepth===!0&&(m=-m);const S=o(u,d,g,x,m,p);g.transmission>0?n.push(S):g.transparent===!0?r.push(S):t.push(S)}function c(u,d,g,x,m,p){const b=o(u,d,g,x,m,p);g.transmission>0?n.unshift(b):g.transparent===!0?r.unshift(b):t.unshift(b)}function h(u,d){t.length>1&&t.sort(u||xg),n.length>1&&n.sort(d||sh),r.length>1&&r.sort(d||sh)}function f(){for(let u=e,d=i.length;u<d;u++){const g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:l,unshift:c,finish:f,sort:h}}function _g(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new ah,i.set(n,[a])):r>=s.length?(a=new ah,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function Mg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new U,color:new Ye};break;case"SpotLight":t={position:new U,direction:new U,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new U,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new U,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new U,halfWidth:new U,halfHeight:new U};break}return i[e.id]=t,t}}}function yg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Sg=0;function bg(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function wg(i){const e=new Mg,t=yg(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new U);const r=new U,s=new ht,a=new ht;function o(c){let h=0,f=0,u=0;for(let z=0;z<9;z++)n.probe[z].set(0,0,0);let d=0,g=0,x=0,m=0,p=0,b=0,S=0,v=0,w=0,T=0,C=0,_=0,A=0,F=0;c.sort(bg);for(let z=0,J=c.length;z<J;z++){const k=c[z],Y=k.color,ne=k.intensity,$=k.distance;let K=null;if(k.shadow&&k.shadow.map&&(k.shadow.map.texture.format===oi?K=k.shadow.map.texture:K=k.shadow.map.depthTexture||k.shadow.map.texture),k.isAmbientLight)h+=Y.r*ne,f+=Y.g*ne,u+=Y.b*ne;else if(k.isLightProbe){for(let re=0;re<9;re++)n.probe[re].addScaledVector(k.sh.coefficients[re],ne);F++}else if(k.isSunLight){const re=e.get(k);if(re.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){const se=k.shadow,ue=t.get(k);ue.shadowIntensity=se.intensity,ue.shadowBias=se.bias,ue.shadowNormalBias=se.normalBias,ue.shadowRadius=se.radius,ue.shadowMapSize.copy(se.mapSize).multiply(se.getFrameExtents()),n.sunShadow[g]=ue,n.sunShadowMap[g]=K;const Ie=se.getViewportCount();for(let _e=0;_e<Ie;_e++)n.sunShadowMatrix[x+_e]=se.getMatrix(_e),n.sunShadowCascade[x+_e]=se._cascadeData[_e];x+=Ie,g++}n.sun[d]=re,d++}else if(k.isDirectionalLight){const re=e.get(k);if(re.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){const se=k.shadow,ue=t.get(k);ue.shadowIntensity=se.intensity,ue.shadowBias=se.bias,ue.shadowNormalBias=se.normalBias,ue.shadowRadius=se.radius,ue.shadowMapSize=se.mapSize,n.directionalShadow[m]=ue,n.directionalShadowMap[m]=K,n.directionalShadowMatrix[m]=k.shadow.matrix,w++}n.directional[m]=re,m++}else if(k.isSpotLight){const re=e.get(k);re.position.setFromMatrixPosition(k.matrixWorld),re.color.copy(Y).multiplyScalar(ne),re.distance=$,re.coneCos=Math.cos(k.angle),re.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),re.decay=k.decay,n.spot[b]=re;const se=k.shadow;if(k.map&&(n.spotLightMap[_]=k.map,_++,se.updateMatrices(k),k.castShadow&&A++),n.spotLightMatrix[b]=se.matrix,k.castShadow){const ue=t.get(k);ue.shadowIntensity=se.intensity,ue.shadowBias=se.bias,ue.shadowNormalBias=se.normalBias,ue.shadowRadius=se.radius,ue.shadowMapSize=se.mapSize,n.spotShadow[b]=ue,n.spotShadowMap[b]=K,C++}b++}else if(k.isRectAreaLight){const re=e.get(k);re.color.copy(Y).multiplyScalar(ne),re.halfWidth.set(k.width*.5,0,0),re.halfHeight.set(0,k.height*.5,0),n.rectArea[S]=re,S++}else if(k.isPointLight){const re=e.get(k);if(re.color.copy(k.color).multiplyScalar(k.intensity),re.distance=k.distance,re.decay=k.decay,k.castShadow){const se=k.shadow,ue=t.get(k);ue.shadowIntensity=se.intensity,ue.shadowBias=se.bias,ue.shadowNormalBias=se.normalBias,ue.shadowRadius=se.radius,ue.shadowMapSize=se.mapSize,ue.shadowCameraNear=se.camera.near,ue.shadowCameraFar=se.camera.far,n.pointShadow[p]=ue,n.pointShadowMap[p]=K,n.pointShadowMatrix[p]=k.shadow.matrix,T++}n.point[p]=re,p++}else if(k.isHemisphereLight){const re=e.get(k);re.skyColor.copy(k.color).multiplyScalar(ne),re.groundColor.copy(k.groundColor).multiplyScalar(ne),n.hemi[v]=re,v++}}S>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Re.LTC_FLOAT_1,n.rectAreaLTC2=Re.LTC_FLOAT_2):(n.rectAreaLTC1=Re.LTC_HALF_1,n.rectAreaLTC2=Re.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;const G=n.hash;(G.sunLength!==d||G.directionalLength!==m||G.pointLength!==p||G.spotLength!==b||G.rectAreaLength!==S||G.hemiLength!==v||G.numSunShadows!==g||G.numDirectionalShadows!==w||G.numPointShadows!==T||G.numSpotShadows!==C||G.numSpotMaps!==_||G.numLightProbes!==F)&&(n.sun.length=d,n.directional.length=m,n.spot.length=b,n.rectArea.length=S,n.point.length=p,n.hemi.length=v,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=x,n.sunShadowCascade.length=x,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.directionalShadowMatrix.length=w,n.pointShadow.length=T,n.pointShadowMap.length=T,n.pointShadowMatrix.length=T,n.spotShadow.length=C,n.spotShadowMap.length=C,n.spotLightMatrix.length=C+_-A,n.spotLightMap.length=_,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=F,G.sunLength=d,G.directionalLength=m,G.pointLength=p,G.spotLength=b,G.rectAreaLength=S,G.hemiLength=v,G.numSunShadows=g,G.numDirectionalShadows=w,G.numPointShadows=T,G.numSpotShadows=C,G.numSpotMaps=_,G.numLightProbes=F,n.version=Sg++)}function l(c,h){let f=0,u=0,d=0,g=0,x=0,m=0;const p=h.matrixWorldInverse;for(let b=0,S=c.length;b<S;b++){const v=c[b];if(v.isSunLight){const w=n.sun[f];w.direction.setFromMatrixPosition(v.matrixWorld),w.direction.transformDirection(p),f++}else if(v.isDirectionalLight){const w=n.directional[u];w.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(p),u++}else if(v.isSpotLight){const w=n.spot[g];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(p),w.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(p),g++}else if(v.isRectAreaLight){const w=n.rectArea[x];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(p),a.identity(),s.copy(v.matrixWorld),s.premultiply(p),a.extractRotation(s),w.halfWidth.set(v.width*.5,0,0),w.halfHeight.set(0,v.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),x++}else if(v.isPointLight){const w=n.point[d];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(p),d++}else if(v.isHemisphereLight){const w=n.hemi[m];w.direction.setFromMatrixPosition(v.matrixWorld),w.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:n}}function oh(i){const e=new wg(i),t=[],n=[],r=[];function s(u){f.camera=u,t.length=0,n.length=0,r.length=0}function a(u){t.push(u)}function o(u){n.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}const f={lightsArray:t,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function Eg(i){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new oh(i),e.set(r,[o])):s>=a.length?(o=new oh(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const Tg=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ag=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Rg=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],Cg=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],lh=new ht,Dr=new U,ko=new U;function Pg(i,e,t){let n=new sc;const r=new ae,s=new ae,a=new mt,o=new md,l=new gd,c={},h=t.maxTextureSize,f={[ri]:kt,[kt]:ri,[jt]:jt},u=new _t({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ae},radius:{value:4}},vertexShader:Tg,fragmentShader:Ag}),d=u.clone();d.defines.HORIZONTAL_PASS=1;const g=new Mt;g.setAttribute("position",new Kt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new at(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Wr;let p=this.type;this.render=function(T,C,_){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||T.length===0)return;this.type===cu&&(Ke("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Wr);const A=i.getRenderTarget(),F=i.getActiveCubeFace(),G=i.getActiveMipmapLevel(),z=i.state;z.setBlending(vn),z.buffers.depth.getReversed()===!0?z.buffers.color.setClear(0,0,0,0):z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);const J=p!==this.type;J&&C.traverse(function(k){k.material&&(Array.isArray(k.material)?k.material.forEach(Y=>Y.needsUpdate=!0):k.material.needsUpdate=!0)});for(let k=0,Y=T.length;k<Y;k++){const ne=T[k],$=ne.shadow;if($===void 0){Ke("WebGLShadowMap:",ne,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const K=$.getFrameExtents();r.multiply(K),s.copy($.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/K.x),r.x=s.x*K.x,$.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/K.y),r.y=s.y*K.y,$.mapSize.y=s.y));const re=i.state.buffers.depth.getReversed();if($.camera._reversedDepth=re,$.map===null||J===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===ir){if(ne.isPointLight){Ke("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}$.map=new Lt(r.x,r.y,{format:oi,type:Dt,minFilter:Rt,magFilter:Rt,generateMipmaps:!1}),$.map.texture.name=ne.name+".shadowMap",$.map.depthTexture=new yr(r.x,r.y,an),$.map.depthTexture.name=ne.name+".shadowMapDepth",$.map.depthTexture.format=Pn,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=Pt,$.map.depthTexture.magFilter=Pt}else ne.isPointLight?($.map=new Hc(r.x),$.map.depthTexture=new Df(r.x,Mn)):($.map=new Lt(r.x,r.y),$.map.depthTexture=new yr(r.x,r.y,Mn)),$.map.depthTexture.name=ne.name+".shadowMap",$.map.depthTexture.format=Pn,this.type===Wr?($.map.depthTexture.compareFunction=re?$a:Ka,$.map.depthTexture.minFilter=Rt,$.map.depthTexture.magFilter=Rt):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=Pt,$.map.depthTexture.magFilter=Pt);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==r.x||$.map.height!==r.y)&&$.map.setSize(r.x,r.y);const se=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();ne.isPointLight!==!0&&$.updateMatrices(ne,_);for(let ue=0;ue<se;ue++){const Ie=$.getCamera(ue);if(ne.isPointLight){const _e=$.camera,Me=$.matrix,Se=ne.distance||_e.far;Se!==_e.far&&(_e.far=Se,_e.updateProjectionMatrix()),Dr.setFromMatrixPosition(ne.matrixWorld),_e.position.copy(Dr),ko.copy(_e.position),ko.add(Rg[ue]),_e.up.copy(Cg[ue]),_e.lookAt(ko),_e.updateMatrixWorld(),Me.makeTranslation(-Dr.x,-Dr.y,-Dr.z),lh.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),$._frustum.setFromProjectionMatrix(lh,_e.coordinateSystem,_e.reversedDepth)}if($.map.isWebGLCubeRenderTarget)i.setRenderTarget($.map,ue),i.clear();else{ue===0&&(i.setRenderTarget($.map),i.clear());const _e=$.getViewport(ue);a.set(s.x*_e.x,s.y*_e.y,s.x*_e.z,s.y*_e.w),z.viewport(a)}n=$.getFrustum(ue),v(C,_,Ie,ne,this.type)}$.isPointLightShadow!==!0&&this.type===ir&&b($,_),$.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(A,F,G)};function b(T,C){const _=e.update(x);u.defines.VSM_SAMPLES!==T.blurSamples&&(u.defines.VSM_SAMPLES=T.blurSamples,d.defines.VSM_SAMPLES=T.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),T.mapPass===null?T.mapPass=new Lt(r.x,r.y,{format:oi,type:Dt}):(T.mapPass.width!==T.map.width||T.mapPass.height!==T.map.height)&&T.mapPass.setSize(T.map.width,T.map.height),u.uniforms.shadow_pass.value=T.map.depthTexture,u.uniforms.resolution.value.set(T.map.width,T.map.height),u.uniforms.radius.value=T.radius,i.setRenderTarget(T.mapPass),i.clear(),i.renderBufferDirect(C,null,_,u,x,null),d.uniforms.shadow_pass.value=T.mapPass.texture,d.uniforms.resolution.value.set(T.map.width,T.map.height),d.uniforms.radius.value=T.radius,i.setRenderTarget(T.map),i.clear(),i.renderBufferDirect(C,null,_,d,x,null)}function S(T,C,_,A){let F=null;const G=_.isPointLight===!0?T.customDistanceMaterial:T.customDepthMaterial;if(G!==void 0)F=G;else if(F=_.isPointLight===!0?l:o,i.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){const z=F.uuid,J=C.uuid;let k=c[z];k===void 0&&(k={},c[z]=k);let Y=k[J];Y===void 0&&(Y=F.clone(),k[J]=Y,C.addEventListener("dispose",w)),F=Y}if(F.visible=C.visible,F.wireframe=C.wireframe,A===ir?F.side=C.shadowSide!==null?C.shadowSide:C.side:F.side=C.shadowSide!==null?C.shadowSide:f[C.side],F.alphaMap=C.alphaMap,F.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,F.map=C.map,F.clipShadows=C.clipShadows,F.clippingPlanes=C.clippingPlanes,F.clipIntersection=C.clipIntersection,F.displacementMap=C.displacementMap,F.displacementScale=C.displacementScale,F.displacementBias=C.displacementBias,F.wireframeLinewidth=C.wireframeLinewidth,F.linewidth=C.linewidth,_.isPointLight===!0&&F.isMeshDistanceMaterial===!0){const z=i.properties.get(F);z.light=_}return F}function v(T,C,_,A,F){if(T.visible===!1)return;if(T.layers.test(C.layers)&&(T.isMesh||T.isLine||T.isPoints)&&(T.castShadow||T.receiveShadow&&F===ir)&&(!T.frustumCulled||T.intersectsFrustum(n))){T.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,T.matrixWorld);const J=e.update(T),k=T.material;if(Array.isArray(k)){const Y=J.groups;for(let ne=0,$=Y.length;ne<$;ne++){const K=Y[ne],re=k[K.materialIndex];if(re&&re.visible){const se=S(T,re,A,F);T.onBeforeShadow(i,T,C,_,J,se,K),i.renderBufferDirect(_,null,J,se,T,K),T.onAfterShadow(i,T,C,_,J,se,K)}}}else if(k.visible){const Y=S(T,k,A,F);T.onBeforeShadow(i,T,C,_,J,Y,null),i.renderBufferDirect(_,null,J,Y,T,null),T.onAfterShadow(i,T,C,_,J,Y,null)}}const z=T.children;for(let J=0,k=z.length;J<k;J++)v(z[J],C,_,A,F)}function w(T){T.target.removeEventListener("dispose",w);for(const _ in c){const A=c[_],F=T.target.uuid;F in A&&(A[F].dispose(),delete A[F])}}}function Lg(i,e){function t(){let W=!1;const Te=new mt;let de=null;const Ae=new mt(0,0,0,0);return{setMask:function(De){de!==De&&!W&&(i.colorMask(De,De,De,De),de=De)},setLocked:function(De){W=De},setClear:function(De,ve,Xe,He,dt){dt===!0&&(De*=He,ve*=He,Xe*=He),Te.set(De,ve,Xe,He),Ae.equals(Te)===!1&&(i.clearColor(De,ve,Xe,He),Ae.copy(Te))},reset:function(){W=!1,de=null,Ae.set(-1,0,0,0)}}}function n(){let W=!1,Te=!1,de=null,Ae=null,De=null;return{setReversed:function(ve){if(Te!==ve){const Xe=e.get("EXT_clip_control");ve?Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.ZERO_TO_ONE_EXT):Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.NEGATIVE_ONE_TO_ONE_EXT),Te=ve;const He=De;De=null,this.setClear(He)}},getReversed:function(){return Te},setTest:function(ve){ve?D(i.DEPTH_TEST):I(i.DEPTH_TEST)},setMask:function(ve){de!==ve&&!W&&(i.depthMask(ve),de=ve)},setFunc:function(ve){if(Te&&(ve=Wu[ve]),Ae!==ve){switch(ve){case na:i.depthFunc(i.NEVER);break;case ia:i.depthFunc(i.ALWAYS);break;case ra:i.depthFunc(i.LESS);break;case ar:i.depthFunc(i.LEQUAL);break;case sa:i.depthFunc(i.EQUAL);break;case aa:i.depthFunc(i.GEQUAL);break;case oa:i.depthFunc(i.GREATER);break;case la:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Ae=ve}},setLocked:function(ve){W=ve},setClear:function(ve){De!==ve&&(De=ve,Te&&(ve=1-ve),i.clearDepth(ve))},reset:function(){W=!1,de=null,Ae=null,De=null,Te=!1}}}function r(){let W=!1,Te=null,de=null,Ae=null,De=null,ve=null,Xe=null,He=null,dt=null;return{setTest:function(ot){W||(ot?D(i.STENCIL_TEST):I(i.STENCIL_TEST))},setMask:function(ot){Te!==ot&&!W&&(i.stencilMask(ot),Te=ot)},setFunc:function(ot,gn,Rn){(de!==ot||Ae!==gn||De!==Rn)&&(i.stencilFunc(ot,gn,Rn),de=ot,Ae=gn,De=Rn)},setOp:function(ot,gn,Rn){(ve!==ot||Xe!==gn||He!==Rn)&&(i.stencilOp(ot,gn,Rn),ve=ot,Xe=gn,He=Rn)},setLocked:function(ot){W=ot},setClear:function(ot){dt!==ot&&(i.clearStencil(ot),dt=ot)},reset:function(){W=!1,Te=null,de=null,Ae=null,De=null,ve=null,Xe=null,He=null,dt=null}}}const s=new t,a=new n,o=new r,l=new WeakMap,c=new WeakMap;let h={},f={},u={},d=new WeakMap,g=[],x=null,m=!1,p=null,b=null,S=null,v=null,w=null,T=null,C=null,_=new Ye(0,0,0),A=0,F=!1,G=null,z=null,J=null,k=null,Y=null;const ne=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,K=0;const re=i.getParameter(i.VERSION);re.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(re)[1]),$=K>=1):re.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(re)[1]),$=K>=2);let se=null,ue={};const Ie=i.getParameter(i.SCISSOR_BOX),_e=i.getParameter(i.VIEWPORT),Me=new mt().fromArray(Ie),Se=new mt().fromArray(_e);function ze(W,Te,de,Ae){const De=new Uint8Array(4),ve=i.createTexture();i.bindTexture(W,ve),i.texParameteri(W,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(W,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Xe=0;Xe<de;Xe++)W===i.TEXTURE_3D||W===i.TEXTURE_2D_ARRAY?i.texImage3D(Te,0,i.RGBA,1,1,Ae,0,i.RGBA,i.UNSIGNED_BYTE,De):i.texImage2D(Te+Xe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,De);return ve}const N={};N[i.TEXTURE_2D]=ze(i.TEXTURE_2D,i.TEXTURE_2D,1),N[i.TEXTURE_CUBE_MAP]=ze(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),N[i.TEXTURE_2D_ARRAY]=ze(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),N[i.TEXTURE_3D]=ze(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),D(i.DEPTH_TEST),a.setFunc(ar),Z(!1),Q(fl),D(i.CULL_FACE),H(vn);function D(W){h[W]!==!0&&(i.enable(W),h[W]=!0)}function I(W){h[W]!==!1&&(i.disable(W),h[W]=!1)}function P(W,Te){return u[W]!==Te?(i.bindFramebuffer(W,Te),u[W]=Te,W===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=Te),W===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=Te),!0):!1}function B(W,Te){let de=g,Ae=!1;if(W){de=d.get(Te),de===void 0&&(de=[],d.set(Te,de));const De=W.textures;if(de.length!==De.length||de[0]!==i.COLOR_ATTACHMENT0){for(let ve=0,Xe=De.length;ve<Xe;ve++)de[ve]=i.COLOR_ATTACHMENT0+ve;de.length=De.length,Ae=!0}}else de[0]!==i.BACK&&(de[0]=i.BACK,Ae=!0);Ae&&i.drawBuffers(de)}function ie(W){return x!==W?(i.useProgram(W),x=W,!0):!1}const me={[Ai]:i.FUNC_ADD,[uu]:i.FUNC_SUBTRACT,[fu]:i.FUNC_REVERSE_SUBTRACT};me[du]=i.MIN,me[pu]=i.MAX;const R={[mu]:i.ZERO,[gu]:i.ONE,[vu]:i.SRC_COLOR,[ml]:i.SRC_ALPHA,[bu]:i.SRC_ALPHA_SATURATE,[yu]:i.DST_COLOR,[_u]:i.DST_ALPHA,[xu]:i.ONE_MINUS_SRC_COLOR,[gl]:i.ONE_MINUS_SRC_ALPHA,[Su]:i.ONE_MINUS_DST_COLOR,[Mu]:i.ONE_MINUS_DST_ALPHA,[wu]:i.CONSTANT_COLOR,[Eu]:i.ONE_MINUS_CONSTANT_COLOR,[Tu]:i.CONSTANT_ALPHA,[Au]:i.ONE_MINUS_CONSTANT_ALPHA};function H(W,Te,de,Ae,De,ve,Xe,He,dt,ot){if(W===vn){m===!0&&(I(i.BLEND),m=!1);return}if(m===!1&&(D(i.BLEND),m=!0),W!==hu){if(W!==p||ot!==F){if((b!==Ai||w!==Ai)&&(i.blendEquation(i.FUNC_ADD),b=Ai,w=Ai),ot)switch(W){case rr:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case sr:i.blendFunc(i.ONE,i.ONE);break;case dl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case pl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:it("WebGLState: Invalid blending: ",W);break}else switch(W){case rr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case sr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case dl:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case pl:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",W);break}S=null,v=null,T=null,C=null,_.set(0,0,0),A=0,p=W,F=ot}return}De=De||Te,ve=ve||de,Xe=Xe||Ae,(Te!==b||De!==w)&&(i.blendEquationSeparate(me[Te],me[De]),b=Te,w=De),(de!==S||Ae!==v||ve!==T||Xe!==C)&&(i.blendFuncSeparate(R[de],R[Ae],R[ve],R[Xe]),S=de,v=Ae,T=ve,C=Xe),(He.equals(_)===!1||dt!==A)&&(i.blendColor(He.r,He.g,He.b,dt),_.copy(He),A=dt),p=W,F=!1}function O(W,Te){W.side===jt?I(i.CULL_FACE):D(i.CULL_FACE);let de=W.side===kt;Te&&(de=!de),Z(de),W.blending===rr&&W.transparent===!1?H(vn):H(W.blending,W.blendEquation,W.blendSrc,W.blendDst,W.blendEquationAlpha,W.blendSrcAlpha,W.blendDstAlpha,W.blendColor,W.blendAlpha,W.premultipliedAlpha),a.setFunc(W.depthFunc),a.setTest(W.depthTest),a.setMask(W.depthWrite),s.setMask(W.colorWrite);const Ae=W.stencilWrite;o.setTest(Ae),Ae&&(o.setMask(W.stencilWriteMask),o.setFunc(W.stencilFunc,W.stencilRef,W.stencilFuncMask),o.setOp(W.stencilFail,W.stencilZFail,W.stencilZPass)),ge(W.polygonOffset,W.polygonOffsetFactor,W.polygonOffsetUnits),W.alphaToCoverage===!0?D(i.SAMPLE_ALPHA_TO_COVERAGE):I(i.SAMPLE_ALPHA_TO_COVERAGE)}function Z(W){G!==W&&(W?i.frontFace(i.CW):i.frontFace(i.CCW),G=W)}function Q(W){W!==ou?(D(i.CULL_FACE),W!==z&&(W===fl?i.cullFace(i.BACK):W===lu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):I(i.CULL_FACE),z=W}function ce(W){W!==J&&($&&i.lineWidth(W),J=W)}function ge(W,Te,de){W?(D(i.POLYGON_OFFSET_FILL),(k!==Te||Y!==de)&&(k=Te,Y=de,a.getReversed()&&(Te=-Te),i.polygonOffset(Te,de))):I(i.POLYGON_OFFSET_FILL)}function pe(W){W?D(i.SCISSOR_TEST):I(i.SCISSOR_TEST)}function q(W){W===void 0&&(W=i.TEXTURE0+ne-1),se!==W&&(i.activeTexture(W),se=W)}function y(W,Te,de){de===void 0&&(se===null?de=i.TEXTURE0+ne-1:de=se);let Ae=ue[de];Ae===void 0&&(Ae={type:void 0,texture:void 0},ue[de]=Ae),(Ae.type!==W||Ae.texture!==Te)&&(se!==de&&(i.activeTexture(de),se=de),i.bindTexture(W,Te||N[W]),Ae.type=W,Ae.texture=Te)}function Ce(){const W=ue[se];W!==void 0&&W.type!==void 0&&(i.bindTexture(W.type,null),W.type=void 0,W.texture=void 0)}function Fe(){try{i.compressedTexImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function L(){try{i.compressedTexImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function M(){try{i.texSubImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function X(){try{i.texSubImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function j(){try{i.compressedTexSubImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function le(){try{i.compressedTexSubImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function xe(){try{i.texStorage2D(...arguments)}catch(W){it("WebGLState:",W)}}function ye(){try{i.texStorage3D(...arguments)}catch(W){it("WebGLState:",W)}}function he(){try{i.texImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function fe(){try{i.texImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function be(W){return f[W]!==void 0?f[W]:i.getParameter(W)}function ke(W,Te){f[W]!==Te&&(i.pixelStorei(W,Te),f[W]=Te)}function Ee(W){Me.equals(W)===!1&&(i.scissor(W.x,W.y,W.z,W.w),Me.copy(W))}function we(W){Se.equals(W)===!1&&(i.viewport(W.x,W.y,W.z,W.w),Se.copy(W))}function We(W,Te){let de=c.get(Te);de===void 0&&(de=new WeakMap,c.set(Te,de));let Ae=de.get(W);Ae===void 0&&(Ae=i.getUniformBlockIndex(Te,W.name),de.set(W,Ae))}function Ze(W,Te){const Ae=c.get(Te).get(W);l.get(Te)!==Ae&&(i.uniformBlockBinding(Te,Ae,W.__bindingPointIndex),l.set(Te,Ae))}function Je(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},se=null,ue={},u={},d=new WeakMap,g=[],x=null,m=!1,p=null,b=null,S=null,v=null,w=null,T=null,C=null,_=new Ye(0,0,0),A=0,F=!1,G=null,z=null,J=null,k=null,Y=null,Me.set(0,0,i.canvas.width,i.canvas.height),Se.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:D,disable:I,bindFramebuffer:P,drawBuffers:B,useProgram:ie,setBlending:H,setMaterial:O,setFlipSided:Z,setCullFace:Q,setLineWidth:ce,setPolygonOffset:ge,setScissorTest:pe,activeTexture:q,bindTexture:y,unbindTexture:Ce,compressedTexImage2D:Fe,compressedTexImage3D:L,texImage2D:he,texImage3D:fe,pixelStorei:ke,getParameter:be,updateUBOMapping:We,uniformBlockBinding:Ze,texStorage2D:xe,texStorage3D:ye,texSubImage2D:M,texSubImage3D:X,compressedTexSubImage2D:j,compressedTexSubImage3D:le,scissor:Ee,viewport:we,reset:Je}}function Ig(i,e,t,n,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ae,h=new WeakMap,f=new Set;let u;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function x(L,M){return g?new OffscreenCanvas(L,M):ss("canvas")}function m(L,M,X){let j=1;const le=Fe(L);if((le.width>X||le.height>X)&&(j=X/Math.max(le.width,le.height)),j<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const xe=Math.floor(j*le.width),ye=Math.floor(j*le.height);u===void 0&&(u=x(xe,ye));const he=M?x(xe,ye):u;return he.width=xe,he.height=ye,he.getContext("2d").drawImage(L,0,0,xe,ye),Ke("WebGLRenderer: Texture has been resized from ("+le.width+"x"+le.height+") to ("+xe+"x"+ye+")."),he}else return"data"in L&&Ke("WebGLRenderer: Image in DataTexture is too big ("+le.width+"x"+le.height+")."),L;return L}function p(L){return L.generateMipmaps}function b(L){i.generateMipmap(L)}function S(L){return L.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?i.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function v(L,M,X,j,le,xe=!1){if(L!==null){if(i[L]!==void 0)return i[L];Ke("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let ye;j&&(ye=e.get("EXT_texture_norm16"),ye||Ke("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let he=M;if(M===i.RED&&(X===i.FLOAT&&(he=i.R32F),X===i.HALF_FLOAT&&(he=i.R16F),X===i.UNSIGNED_BYTE&&(he=i.R8),X===i.UNSIGNED_SHORT&&ye&&(he=ye.R16_EXT),X===i.SHORT&&ye&&(he=ye.R16_SNORM_EXT)),M===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(he=i.R8UI),X===i.UNSIGNED_SHORT&&(he=i.R16UI),X===i.UNSIGNED_INT&&(he=i.R32UI),X===i.BYTE&&(he=i.R8I),X===i.SHORT&&(he=i.R16I),X===i.INT&&(he=i.R32I)),M===i.RG&&(X===i.FLOAT&&(he=i.RG32F),X===i.HALF_FLOAT&&(he=i.RG16F),X===i.UNSIGNED_BYTE&&(he=i.RG8),X===i.UNSIGNED_SHORT&&ye&&(he=ye.RG16_EXT),X===i.SHORT&&ye&&(he=ye.RG16_SNORM_EXT)),M===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(he=i.RG8UI),X===i.UNSIGNED_SHORT&&(he=i.RG16UI),X===i.UNSIGNED_INT&&(he=i.RG32UI),X===i.BYTE&&(he=i.RG8I),X===i.SHORT&&(he=i.RG16I),X===i.INT&&(he=i.RG32I)),M===i.RGB_INTEGER&&(X===i.UNSIGNED_BYTE&&(he=i.RGB8UI),X===i.UNSIGNED_SHORT&&(he=i.RGB16UI),X===i.UNSIGNED_INT&&(he=i.RGB32UI),X===i.BYTE&&(he=i.RGB8I),X===i.SHORT&&(he=i.RGB16I),X===i.INT&&(he=i.RGB32I)),M===i.RGBA_INTEGER&&(X===i.UNSIGNED_BYTE&&(he=i.RGBA8UI),X===i.UNSIGNED_SHORT&&(he=i.RGBA16UI),X===i.UNSIGNED_INT&&(he=i.RGBA32UI),X===i.BYTE&&(he=i.RGBA8I),X===i.SHORT&&(he=i.RGBA16I),X===i.INT&&(he=i.RGBA32I)),M===i.RGB&&(X===i.UNSIGNED_SHORT&&ye&&(he=ye.RGB16_EXT),X===i.SHORT&&ye&&(he=ye.RGB16_SNORM_EXT),X===i.UNSIGNED_INT_5_9_9_9_REV&&(he=i.RGB9_E5),X===i.UNSIGNED_INT_10F_11F_11F_REV&&(he=i.R11F_G11F_B10F)),M===i.RGBA){const fe=xe?is:nt.getTransfer(le);X===i.FLOAT&&(he=i.RGBA32F),X===i.HALF_FLOAT&&(he=i.RGBA16F),X===i.UNSIGNED_BYTE&&(he=fe===ct?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT&&ye&&(he=ye.RGBA16_EXT),X===i.SHORT&&ye&&(he=ye.RGBA16_SNORM_EXT),X===i.UNSIGNED_SHORT_4_4_4_4&&(he=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(he=i.RGB5_A1)}return(he===i.R16F||he===i.R32F||he===i.RG16F||he===i.RG32F||he===i.RGBA16F||he===i.RGBA32F)&&e.get("EXT_color_buffer_float"),he}function w(L,M){let X;return L?M===null||M===Mn||M===lr?X=i.DEPTH24_STENCIL8:M===an?X=i.DEPTH32F_STENCIL8:M===or&&(X=i.DEPTH24_STENCIL8,Ke("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):M===null||M===Mn||M===lr?X=i.DEPTH_COMPONENT24:M===an?X=i.DEPTH_COMPONENT32F:M===or&&(X=i.DEPTH_COMPONENT16),X}function T(L,M){return p(L)===!0||L.isFramebufferTexture&&L.minFilter!==Pt&&L.minFilter!==Rt?Math.log2(Math.max(M.width,M.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?M.mipmaps.length:1}function C(L){const M=L.target;M.removeEventListener("dispose",C),A(M),M.isVideoTexture&&h.delete(M),M.isHTMLTexture&&f.delete(M)}function _(L){const M=L.target;M.removeEventListener("dispose",_),G(M)}function A(L){const M=n.get(L);if(M.__webglInit===void 0)return;const X=L.source,j=d.get(X);if(j){const le=j[M.__cacheKey];le.usedTimes--,le.usedTimes===0&&F(L),Object.keys(j).length===0&&d.delete(X)}n.remove(L)}function F(L){const M=n.get(L);i.deleteTexture(M.__webglTexture);const X=L.source,j=d.get(X);delete j[M.__cacheKey],a.memory.textures--}function G(L){const M=n.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),n.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(M.__webglFramebuffer[j]))for(let le=0;le<M.__webglFramebuffer[j].length;le++)i.deleteFramebuffer(M.__webglFramebuffer[j][le]);else i.deleteFramebuffer(M.__webglFramebuffer[j]);M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer[j])}else{if(Array.isArray(M.__webglFramebuffer))for(let j=0;j<M.__webglFramebuffer.length;j++)i.deleteFramebuffer(M.__webglFramebuffer[j]);else i.deleteFramebuffer(M.__webglFramebuffer);if(M.__webglDepthbuffer&&i.deleteRenderbuffer(M.__webglDepthbuffer),M.__webglMultisampledFramebuffer&&i.deleteFramebuffer(M.__webglMultisampledFramebuffer),M.__webglColorRenderbuffer)for(let j=0;j<M.__webglColorRenderbuffer.length;j++)M.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(M.__webglColorRenderbuffer[j]);M.__webglDepthRenderbuffer&&i.deleteRenderbuffer(M.__webglDepthRenderbuffer)}const X=L.textures;for(let j=0,le=X.length;j<le;j++){const xe=n.get(X[j]);xe.__webglTexture&&(i.deleteTexture(xe.__webglTexture),a.memory.textures--),n.remove(X[j])}n.remove(L)}let z=0;function J(){z=0}function k(){return z}function Y(L){z=L}function ne(){const L=z;return L>=r.maxTextures&&Ke("WebGLTextures: Trying to use "+(L+1)+" texture units while this GPU supports only "+r.maxTextures),z+=1,L}function $(L){const M=[];return M.push(L.wrapS),M.push(L.wrapT),M.push(L.wrapR||0),M.push(L.magFilter),M.push(L.minFilter),M.push(L.anisotropy),M.push(L.internalFormat),M.push(L.format),M.push(L.type),M.push(L.generateMipmaps),M.push(L.premultiplyAlpha),M.push(L.flipY),M.push(L.unpackAlignment),M.push(L.colorSpace),M.join()}function K(L,M){const X=n.get(L);if(L.isVideoTexture&&y(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&X.__version!==L.version){const j=L.image;if(j===null)Ke("WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)Ke("WebGLRenderer: Texture marked for update but image is incomplete");else{I(X,L,M);return}}else L.isExternalTexture&&(X.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+M)}function re(L,M){const X=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&X.__version!==L.version){I(X,L,M);return}else L.isExternalTexture&&(X.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+M)}function se(L,M){const X=n.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&X.__version!==L.version){I(X,L,M);return}t.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+M)}function ue(L,M){const X=n.get(L);if(L.isCubeDepthTexture!==!0&&L.version>0&&X.__version!==L.version){P(X,L,M);return}t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+M)}const Ie={[qr]:i.REPEAT,[_n]:i.CLAMP_TO_EDGE,[Yr]:i.MIRRORED_REPEAT},_e={[Pt]:i.NEAREST,[Pu]:i.NEAREST_MIPMAP_NEAREST,[Zr]:i.NEAREST_MIPMAP_LINEAR,[Rt]:i.LINEAR,[ua]:i.LINEAR_MIPMAP_NEAREST,[Hn]:i.LINEAR_MIPMAP_LINEAR},Me={[Nu]:i.NEVER,[zu]:i.ALWAYS,[Uu]:i.LESS,[Ka]:i.LEQUAL,[Fu]:i.EQUAL,[$a]:i.GEQUAL,[Ou]:i.GREATER,[Bu]:i.NOTEQUAL};function Se(L,M){if(M.type===an&&e.has("OES_texture_float_linear")===!1&&(M.magFilter===Rt||M.magFilter===ua||M.magFilter===Zr||M.magFilter===Hn||M.minFilter===Rt||M.minFilter===ua||M.minFilter===Zr||M.minFilter===Hn)&&Ke("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(L,i.TEXTURE_WRAP_S,Ie[M.wrapS]),i.texParameteri(L,i.TEXTURE_WRAP_T,Ie[M.wrapT]),(L===i.TEXTURE_3D||L===i.TEXTURE_2D_ARRAY)&&i.texParameteri(L,i.TEXTURE_WRAP_R,Ie[M.wrapR]),i.texParameteri(L,i.TEXTURE_MAG_FILTER,_e[M.magFilter]),i.texParameteri(L,i.TEXTURE_MIN_FILTER,_e[M.minFilter]),M.compareFunction&&(i.texParameteri(L,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(L,i.TEXTURE_COMPARE_FUNC,Me[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(M.magFilter===Pt||M.minFilter!==Zr&&M.minFilter!==Hn||M.type===an&&e.has("OES_texture_float_linear")===!1)return;if(M.anisotropy>1||n.get(M).__currentAnisotropy){const X=e.get("EXT_texture_filter_anisotropic");i.texParameterf(L,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,r.getMaxAnisotropy())),n.get(M).__currentAnisotropy=M.anisotropy}}}function ze(L,M){let X=!1;L.__webglInit===void 0&&(L.__webglInit=!0,M.addEventListener("dispose",C));const j=M.source;let le=d.get(j);le===void 0&&(le={},d.set(j,le));const xe=$(M);if(xe!==L.__cacheKey){le[xe]===void 0&&(le[xe]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,X=!0),le[xe].usedTimes++;const ye=le[L.__cacheKey];ye!==void 0&&(le[L.__cacheKey].usedTimes--,ye.usedTimes===0&&F(M)),L.__cacheKey=xe,L.__webglTexture=le[xe].texture}return X}function N(L,M,X){return Math.floor(Math.floor(L/X)/M)}function D(L,M,X,j){const xe=L.updateRanges;if(xe.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,M.width,M.height,X,j,M.data);else{xe.sort((ke,Ee)=>ke.start-Ee.start);let ye=0;for(let ke=1;ke<xe.length;ke++){const Ee=xe[ye],we=xe[ke],We=Ee.start+Ee.count,Ze=N(we.start,M.width,4),Je=N(Ee.start,M.width,4);we.start<=We+1&&Ze===Je&&N(we.start+we.count-1,M.width,4)===Ze?Ee.count=Math.max(Ee.count,we.start+we.count-Ee.start):(++ye,xe[ye]=we)}xe.length=ye+1;const he=t.getParameter(i.UNPACK_ROW_LENGTH),fe=t.getParameter(i.UNPACK_SKIP_PIXELS),be=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,M.width);for(let ke=0,Ee=xe.length;ke<Ee;ke++){const we=xe[ke],We=Math.floor(we.start/4),Ze=Math.ceil(we.count/4),Je=We%M.width,W=Math.floor(We/M.width),Te=Ze,de=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Je),t.pixelStorei(i.UNPACK_SKIP_ROWS,W),t.texSubImage2D(i.TEXTURE_2D,0,Je,W,Te,de,X,j,M.data)}L.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,he),t.pixelStorei(i.UNPACK_SKIP_PIXELS,fe),t.pixelStorei(i.UNPACK_SKIP_ROWS,be)}}function I(L,M,X){let j=i.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(j=i.TEXTURE_2D_ARRAY),M.isData3DTexture&&(j=i.TEXTURE_3D);const le=ze(L,M),xe=M.source;t.bindTexture(j,L.__webglTexture,i.TEXTURE0+X);const ye=n.get(xe);if(xe.version!==ye.__version||le===!0){if(t.activeTexture(i.TEXTURE0+X),(typeof ImageBitmap<"u"&&M.image instanceof ImageBitmap)===!1){const de=nt.getPrimaries(nt.workingColorSpace),Ae=M.colorSpace===Gn?null:nt.getPrimaries(M.colorSpace),De=M.colorSpace===Gn||de===Ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,De)}t.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment);let fe=m(M.image,!1,r.maxTextureSize);fe=Ce(M,fe);const be=s.convert(M.format,M.colorSpace),ke=s.convert(M.type);let Ee=v(M.internalFormat,be,ke,M.normalized,M.colorSpace,M.isVideoTexture);Se(j,M);let we;const We=M.mipmaps,Ze=M.isVideoTexture!==!0,Je=ye.__version===void 0||le===!0,W=xe.dataReady,Te=T(M,fe);if(M.isDepthTexture)Ee=w(M.format===ai,M.type),Je&&(Ze?t.texStorage2D(i.TEXTURE_2D,1,Ee,fe.width,fe.height):t.texImage2D(i.TEXTURE_2D,0,Ee,fe.width,fe.height,0,be,ke,null));else if(M.isDataTexture)if(We.length>0){Ze&&Je&&t.texStorage2D(i.TEXTURE_2D,Te,Ee,We[0].width,We[0].height);for(let de=0,Ae=We.length;de<Ae;de++)we=We[de],Ze?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,we.width,we.height,be,ke,we.data):t.texImage2D(i.TEXTURE_2D,de,Ee,we.width,we.height,0,be,ke,we.data);M.generateMipmaps=!1}else Ze?(Je&&t.texStorage2D(i.TEXTURE_2D,Te,Ee,fe.width,fe.height),W&&D(M,fe,be,ke)):t.texImage2D(i.TEXTURE_2D,0,Ee,fe.width,fe.height,0,be,ke,fe.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){Ze&&Je&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Te,Ee,We[0].width,We[0].height,fe.depth);for(let de=0,Ae=We.length;de<Ae;de++)if(we=We[de],M.format!==on)if(be!==null)if(Ze){if(W)if(M.layerUpdates.size>0){const De=Dc(we.width,we.height,M.format,M.type);for(const ve of M.layerUpdates){const Xe=we.data.subarray(ve*De/we.data.BYTES_PER_ELEMENT,(ve+1)*De/we.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,ve,we.width,we.height,1,be,Xe)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,0,we.width,we.height,fe.depth,be,we.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,de,Ee,we.width,we.height,fe.depth,0,we.data,0,0);else Ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ze?W&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,0,we.width,we.height,fe.depth,be,ke,we.data):t.texImage3D(i.TEXTURE_2D_ARRAY,de,Ee,we.width,we.height,fe.depth,0,be,ke,we.data);M.layerUpdates.size>0&&M.clearLayerUpdates()}else{Ze&&Je&&t.texStorage2D(i.TEXTURE_2D,Te,Ee,We[0].width,We[0].height);for(let de=0,Ae=We.length;de<Ae;de++)we=We[de],M.format!==on?be!==null?Ze?W&&t.compressedTexSubImage2D(i.TEXTURE_2D,de,0,0,we.width,we.height,be,we.data):t.compressedTexImage2D(i.TEXTURE_2D,de,Ee,we.width,we.height,0,we.data):Ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ze?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,we.width,we.height,be,ke,we.data):t.texImage2D(i.TEXTURE_2D,de,Ee,we.width,we.height,0,be,ke,we.data)}else if(M.isDataArrayTexture)if(Ze){if(Je&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Te,Ee,fe.width,fe.height,fe.depth),W)if(M.layerUpdates.size>0){const de=Dc(fe.width,fe.height,M.format,M.type);for(const Ae of M.layerUpdates){const De=fe.data.subarray(Ae*de/fe.data.BYTES_PER_ELEMENT,(Ae+1)*de/fe.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Ae,fe.width,fe.height,1,be,ke,De)}M.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,fe.width,fe.height,fe.depth,be,ke,fe.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Ee,fe.width,fe.height,fe.depth,0,be,ke,fe.data);else if(M.isData3DTexture)Ze?(Je&&t.texStorage3D(i.TEXTURE_3D,Te,Ee,fe.width,fe.height,fe.depth),W&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,fe.width,fe.height,fe.depth,be,ke,fe.data)):t.texImage3D(i.TEXTURE_3D,0,Ee,fe.width,fe.height,fe.depth,0,be,ke,fe.data);else if(M.isFramebufferTexture){if(Je)if(Ze)t.texStorage2D(i.TEXTURE_2D,Te,Ee,fe.width,fe.height);else{let de=fe.width,Ae=fe.height;for(let De=0;De<Te;De++)t.texImage2D(i.TEXTURE_2D,De,Ee,de,Ae,0,be,ke,null),de>>=1,Ae>>=1}}else if(M.isHTMLTexture){if("texElementImage2D"in i){const de=i.canvas;if(de.hasAttribute("layoutsubtree")||de.setAttribute("layoutsubtree","true"),fe.parentNode!==de){de.appendChild(fe),f.add(M),de.onpaint=Ae=>{const De=Ae.changedElements;for(const ve of f)De.includes(ve.image)&&(ve.needsUpdate=!0)},de.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,fe);else{const De=i.RGBA,ve=i.RGBA,Xe=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,De,ve,Xe,fe)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(We.length>0){if(Ze&&Je){const de=Fe(We[0]);t.texStorage2D(i.TEXTURE_2D,Te,Ee,de.width,de.height)}for(let de=0,Ae=We.length;de<Ae;de++)we=We[de],Ze?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,be,ke,we):t.texImage2D(i.TEXTURE_2D,de,Ee,be,ke,we);M.generateMipmaps=!1}else if(Ze){if(Je){const de=Fe(fe);t.texStorage2D(i.TEXTURE_2D,Te,Ee,de.width,de.height)}W&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,be,ke,fe)}else t.texImage2D(i.TEXTURE_2D,0,Ee,be,ke,fe);p(M)&&b(j),ye.__version=xe.version,M.onUpdate&&M.onUpdate(M)}L.__version=M.version}function P(L,M,X){if(M.image.length!==6)return;const j=ze(L,M),le=M.source;t.bindTexture(i.TEXTURE_CUBE_MAP,L.__webglTexture,i.TEXTURE0+X);const xe=n.get(le);if(le.version!==xe.__version||j===!0){t.activeTexture(i.TEXTURE0+X);const ye=nt.getPrimaries(nt.workingColorSpace),he=M.colorSpace===Gn?null:nt.getPrimaries(M.colorSpace),fe=M.colorSpace===Gn||ye===he?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);const be=M.isCompressedTexture||M.image[0].isCompressedTexture,ke=M.image[0]&&M.image[0].isDataTexture,Ee=[];for(let ve=0;ve<6;ve++)!be&&!ke?Ee[ve]=m(M.image[ve],!0,r.maxCubemapSize):Ee[ve]=ke?M.image[ve].image:M.image[ve],Ee[ve]=Ce(M,Ee[ve]);const we=Ee[0],We=s.convert(M.format,M.colorSpace),Ze=s.convert(M.type),Je=v(M.internalFormat,We,Ze,M.normalized,M.colorSpace),W=M.isVideoTexture!==!0,Te=xe.__version===void 0||j===!0,de=le.dataReady;let Ae=T(M,we);Se(i.TEXTURE_CUBE_MAP,M);let De;if(be){W&&Te&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Ae,Je,we.width,we.height);for(let ve=0;ve<6;ve++){De=Ee[ve].mipmaps;for(let Xe=0;Xe<De.length;Xe++){const He=De[Xe];M.format!==on?We!==null?W?de&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,0,0,He.width,He.height,We,He.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,Je,He.width,He.height,0,He.data):Ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,0,0,He.width,He.height,We,Ze,He.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,Je,He.width,He.height,0,We,Ze,He.data)}}}else{if(De=M.mipmaps,W&&Te){De.length>0&&Ae++;const ve=Fe(Ee[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Ae,Je,ve.width,ve.height)}for(let ve=0;ve<6;ve++)if(ke){W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,Ee[ve].width,Ee[ve].height,We,Ze,Ee[ve].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,Je,Ee[ve].width,Ee[ve].height,0,We,Ze,Ee[ve].data);for(let Xe=0;Xe<De.length;Xe++){const dt=De[Xe].image[ve].image;W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,0,0,dt.width,dt.height,We,Ze,dt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,Je,dt.width,dt.height,0,We,Ze,dt.data)}}else{W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,We,Ze,Ee[ve]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,Je,We,Ze,Ee[ve]);for(let Xe=0;Xe<De.length;Xe++){const He=De[Xe];W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,0,0,We,Ze,He.image[ve]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,Je,We,Ze,He.image[ve])}}}p(M)&&b(i.TEXTURE_CUBE_MAP),xe.__version=le.version,M.onUpdate&&M.onUpdate(M)}L.__version=M.version}function B(L,M,X,j,le,xe){const ye=s.convert(X.format,X.colorSpace),he=s.convert(X.type),fe=v(X.internalFormat,ye,he,X.normalized,X.colorSpace),be=n.get(M),ke=n.get(X);if(ke.__renderTarget=M,!be.__hasExternalTextures){const Ee=Math.max(1,M.width>>xe),we=Math.max(1,M.height>>xe);le===i.TEXTURE_3D||le===i.TEXTURE_2D_ARRAY?t.texImage3D(le,xe,fe,Ee,we,M.depth,0,ye,he,null):t.texImage2D(le,xe,fe,Ee,we,0,ye,he,null)}t.bindFramebuffer(i.FRAMEBUFFER,L),q(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,le,ke.__webglTexture,0,pe(M)):(le===i.TEXTURE_2D||le>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&le<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,j,le,ke.__webglTexture,xe),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ie(L,M,X){if(i.bindRenderbuffer(i.RENDERBUFFER,L),M.depthBuffer){const j=M.depthTexture,le=j&&j.isDepthTexture?j.type:null,xe=w(M.stencilBuffer,le),ye=M.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;q(M)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe(M),xe,M.width,M.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe(M),xe,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,xe,M.width,M.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ye,i.RENDERBUFFER,L)}else{const j=M.textures;for(let le=0;le<j.length;le++){const xe=j[le],ye=s.convert(xe.format,xe.colorSpace),he=s.convert(xe.type),fe=v(xe.internalFormat,ye,he,xe.normalized,xe.colorSpace);q(M)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe(M),fe,M.width,M.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe(M),fe,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,fe,M.width,M.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function me(L,M,X){const j=M.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,L),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const le=n.get(M.depthTexture);if(le.__renderTarget=M,(!le.__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),j){if(le.__webglInit===void 0&&(le.__webglInit=!0,M.depthTexture.addEventListener("dispose",C)),le.__webglTexture===void 0){le.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,le.__webglTexture),Se(i.TEXTURE_CUBE_MAP,M.depthTexture);const be=s.convert(M.depthTexture.format),ke=s.convert(M.depthTexture.type);let Ee;M.depthTexture.format===Pn?Ee=i.DEPTH_COMPONENT24:M.depthTexture.format===ai&&(Ee=i.DEPTH24_STENCIL8);for(let we=0;we<6;we++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+we,0,Ee,M.width,M.height,0,be,ke,null)}}else K(M.depthTexture,0);const xe=le.__webglTexture,ye=pe(M),he=j?i.TEXTURE_CUBE_MAP_POSITIVE_X+X:i.TEXTURE_2D,fe=M.depthTexture.format===ai?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(M.depthTexture.format===Pn)q(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,fe,he,xe,0,ye):i.framebufferTexture2D(i.FRAMEBUFFER,fe,he,xe,0);else if(M.depthTexture.format===ai)q(M)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,fe,he,xe,0,ye):i.framebufferTexture2D(i.FRAMEBUFFER,fe,he,xe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function R(L){const M=n.get(L),X=L.isWebGLCubeRenderTarget===!0;if(M.__boundDepthTexture!==L.depthTexture){const j=L.depthTexture;if(M.__depthDisposeCallback&&M.__depthDisposeCallback(),j){const le=()=>{delete M.__boundDepthTexture,delete M.__depthDisposeCallback,j.removeEventListener("dispose",le)};j.addEventListener("dispose",le),M.__depthDisposeCallback=le}M.__boundDepthTexture=j}if(L.depthTexture&&!M.__autoAllocateDepthBuffer)if(X)for(let j=0;j<6;j++)me(M.__webglFramebuffer[j],L,j);else{const j=L.texture.mipmaps;j&&j.length>0?me(M.__webglFramebuffer[0],L,0):me(M.__webglFramebuffer,L,0)}else if(X){M.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[j]),M.__webglDepthbuffer[j]===void 0)M.__webglDepthbuffer[j]=i.createRenderbuffer(),ie(M.__webglDepthbuffer[j],L,!1);else{const le=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,xe=M.__webglDepthbuffer[j];i.bindRenderbuffer(i.RENDERBUFFER,xe),i.framebufferRenderbuffer(i.FRAMEBUFFER,le,i.RENDERBUFFER,xe)}}else{const j=L.texture.mipmaps;if(j&&j.length>0?t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer===void 0)M.__webglDepthbuffer=i.createRenderbuffer(),ie(M.__webglDepthbuffer,L,!1);else{const le=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,xe=M.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,xe),i.framebufferRenderbuffer(i.FRAMEBUFFER,le,i.RENDERBUFFER,xe)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function H(L,M,X){const j=n.get(L);M!==void 0&&B(j.__webglFramebuffer,L,L.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&R(L)}function O(L){const M=L.texture,X=n.get(L),j=n.get(M);L.addEventListener("dispose",_);const le=L.textures,xe=L.isWebGLCubeRenderTarget===!0,ye=le.length>1;if(ye||(j.__webglTexture===void 0&&(j.__webglTexture=i.createTexture()),j.__version=M.version,a.memory.textures++),xe){X.__webglFramebuffer=[];for(let he=0;he<6;he++)if(M.mipmaps&&M.mipmaps.length>0){X.__webglFramebuffer[he]=[];for(let fe=0;fe<M.mipmaps.length;fe++)X.__webglFramebuffer[he][fe]=i.createFramebuffer()}else X.__webglFramebuffer[he]=i.createFramebuffer()}else{if(M.mipmaps&&M.mipmaps.length>0){X.__webglFramebuffer=[];for(let he=0;he<M.mipmaps.length;he++)X.__webglFramebuffer[he]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(ye)for(let he=0,fe=le.length;he<fe;he++){const be=n.get(le[he]);be.__webglTexture===void 0&&(be.__webglTexture=i.createTexture(),a.memory.textures++)}if(L.samples>0&&q(L)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let he=0;he<le.length;he++){const fe=le[he];X.__webglColorRenderbuffer[he]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[he]);const be=s.convert(fe.format,fe.colorSpace),ke=s.convert(fe.type),Ee=v(fe.internalFormat,be,ke,fe.normalized,fe.colorSpace,L.isXRRenderTarget===!0),we=pe(L);i.renderbufferStorageMultisample(i.RENDERBUFFER,we,Ee,L.width,L.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+he,i.RENDERBUFFER,X.__webglColorRenderbuffer[he])}i.bindRenderbuffer(i.RENDERBUFFER,null),L.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),ie(X.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(xe){t.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture),Se(i.TEXTURE_CUBE_MAP,M);for(let he=0;he<6;he++)if(M.mipmaps&&M.mipmaps.length>0)for(let fe=0;fe<M.mipmaps.length;fe++)B(X.__webglFramebuffer[he][fe],L,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+he,fe);else B(X.__webglFramebuffer[he],L,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+he,0);p(M)&&b(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ye){for(let he=0,fe=le.length;he<fe;he++){const be=le[he],ke=n.get(be);let Ee=i.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(Ee=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Ee,ke.__webglTexture),Se(Ee,be),B(X.__webglFramebuffer,L,be,i.COLOR_ATTACHMENT0+he,Ee,0),p(be)&&b(Ee)}t.unbindTexture()}else{let he=i.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(he=L.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(he,j.__webglTexture),Se(he,M),M.mipmaps&&M.mipmaps.length>0)for(let fe=0;fe<M.mipmaps.length;fe++)B(X.__webglFramebuffer[fe],L,M,i.COLOR_ATTACHMENT0,he,fe);else B(X.__webglFramebuffer,L,M,i.COLOR_ATTACHMENT0,he,0);p(M)&&b(he),t.unbindTexture()}L.depthBuffer&&R(L)}function Z(L){const M=L.textures;for(let X=0,j=M.length;X<j;X++){const le=M[X];if(p(le)){const xe=S(L),ye=n.get(le).__webglTexture;t.bindTexture(xe,ye),b(xe),t.unbindTexture()}}}const Q=[],ce=[];function ge(L){if(L.samples>0){if(q(L)===!1){const M=L.textures,X=L.width,j=L.height;let le=i.COLOR_BUFFER_BIT;const xe=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ye=n.get(L),he=M.length>1;if(he)for(let be=0;be<M.length;be++)t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ye.__webglMultisampledFramebuffer);const fe=L.texture.mipmaps;fe&&fe.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglFramebuffer);for(let be=0;be<M.length;be++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(le|=i.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(le|=i.STENCIL_BUFFER_BIT)),he){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ye.__webglColorRenderbuffer[be]);const ke=n.get(M[be]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ke,0)}i.blitFramebuffer(0,0,X,j,0,0,X,j,le,i.NEAREST),l===!0&&(Q.length=0,ce.length=0,Q.push(i.COLOR_ATTACHMENT0+be),L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&(Q.push(xe),ce.push(xe),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,ce)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Q))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),he)for(let be=0;be<M.length;be++){t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.RENDERBUFFER,ye.__webglColorRenderbuffer[be]);const ke=n.get(M[be]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.TEXTURE_2D,ke,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&l){const M=L.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[M])}}}function pe(L){return Math.min(r.maxSamples,L.samples)}function q(L){const M=n.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function y(L){const M=a.render.frame;h.get(L)!==M&&(h.set(L,M),L.update())}function Ce(L,M){const X=L.colorSpace,j=L.format,le=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||X!==ns&&X!==Gn&&(nt.getTransfer(X)===ct?(j!==on||le!==qt)&&Ke("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",X)),M}function Fe(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=ne,this.resetTextureUnits=J,this.getTextureUnits=k,this.setTextureUnits=Y,this.setTexture2D=K,this.setTexture2DArray=re,this.setTexture3D=se,this.setTextureCube=ue,this.rebindTextures=H,this.setupRenderTarget=O,this.updateRenderTargetMipmap=Z,this.updateMultisampleRenderTarget=ge,this.setupDepthRenderbuffer=R,this.setupFrameBufferTexture=B,this.useMultisampledRTT=q,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function Dg(i,e){function t(n,r=Gn){let s;const a=nt.getTransfer(r);if(n===qt)return i.UNSIGNED_BYTE;if(n===da)return i.UNSIGNED_SHORT_4_4_4_4;if(n===pa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Rl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Cl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===Tl)return i.BYTE;if(n===Al)return i.SHORT;if(n===or)return i.UNSIGNED_SHORT;if(n===fa)return i.INT;if(n===Mn)return i.UNSIGNED_INT;if(n===an)return i.FLOAT;if(n===Dt)return i.HALF_FLOAT;if(n===Pl)return i.ALPHA;if(n===Ll)return i.RGB;if(n===on)return i.RGBA;if(n===Pn)return i.DEPTH_COMPONENT;if(n===ai)return i.DEPTH_STENCIL;if(n===Kr)return i.RED;if(n===ma)return i.RED_INTEGER;if(n===oi)return i.RG;if(n===ga)return i.RG_INTEGER;if(n===va)return i.RGBA_INTEGER;if(n===$r||n===Jr||n===Qr||n===jr)if(a===ct)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===$r)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Jr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Qr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===jr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===$r)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Jr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Qr)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===jr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===xa||n===_a||n===Ma||n===ya)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===xa)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===_a)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ma)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ya)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Sa||n===ba||n===wa||n===Ea||n===Ta||n===es||n===Aa)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Sa||n===ba)return a===ct?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===wa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===Ea)return s.COMPRESSED_R11_EAC;if(n===Ta)return s.COMPRESSED_SIGNED_R11_EAC;if(n===es)return s.COMPRESSED_RG11_EAC;if(n===Aa)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ra||n===Ca||n===Pa||n===La||n===Ia||n===Da||n===Na||n===Ua||n===Fa||n===Oa||n===Ba||n===za||n===ka||n===Ha)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===Ra)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Ca)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Pa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===La)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ia)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Da)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Na)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ua)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Fa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Oa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Ba)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===za)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ka)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Ha)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ga||n===Va||n===Wa)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===Ga)return a===ct?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Va)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Wa)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Xa||n===qa||n===ts||n===Ya)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Xa)return s.COMPRESSED_RED_RGTC1_EXT;if(n===qa)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===ts)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ya)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===lr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const Ng=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Ug=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Fg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new oc(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new _t({vertexShader:Ng,fragmentShader:Ug,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new at(new Wi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Og extends li{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,f=null,u=null,d=null,g=null;const x=typeof XRWebGLBinding<"u",m=new Fg,p={},b=t.getContextAttributes();let S=null,v=null;const w=[],T=[],C=new ae;let _=null,A=null;const F=new Jt;F.viewport=new mt;const G=new Jt;G.viewport=new mt;const z=[F,G],J=new bd;let k=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(N){let D=w[N];return D===void 0&&(D=new ro,w[N]=D),D.getTargetRaySpace()},this.getControllerGrip=function(N){let D=w[N];return D===void 0&&(D=new ro,w[N]=D),D.getGripSpace()},this.getHand=function(N){let D=w[N];return D===void 0&&(D=new ro,w[N]=D),D.getHandSpace()};function ne(N){const D=T.indexOf(N.inputSource);if(D===-1)return;const I=w[D];I!==void 0&&(I.update(N.inputSource,N.frame,c||a),I.dispatchEvent({type:N.type,data:N.inputSource}))}function $(){r.removeEventListener("select",ne),r.removeEventListener("selectstart",ne),r.removeEventListener("selectend",ne),r.removeEventListener("squeeze",ne),r.removeEventListener("squeezestart",ne),r.removeEventListener("squeezeend",ne),r.removeEventListener("end",$),r.removeEventListener("inputsourceschange",K);for(let N=0;N<w.length;N++){const D=T[N];D!==null&&(T[N]=null,w[N].disconnect(D))}k=null,Y=null,m.reset();for(const N in p)delete p[N];if(e.setRenderTarget(S),d=null,u=null,f=null,r=null,v=null,ze.stop(),n.isPresenting=!1,e.setPixelRatio(_),e.setSize(C.width,C.height,!1),A!==null){const N=A.camera;N.fov=A.fov,N.zoom=A.zoom,N.updateProjectionMatrix(),A=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(N){s=N,n.isPresenting===!0&&Ke("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(N){o=N,n.isPresenting===!0&&Ke("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(N){c=N},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return f===null&&x&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(N){if(r=N,r!==null){if(S=e.getRenderTarget(),r.addEventListener("select",ne),r.addEventListener("selectstart",ne),r.addEventListener("selectend",ne),r.addEventListener("squeeze",ne),r.addEventListener("squeezestart",ne),r.addEventListener("squeezeend",ne),r.addEventListener("end",$),r.addEventListener("inputsourceschange",K),b.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(C),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let I=null,P=null,B=null;b.depth&&(B=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,I=b.stencil?ai:Pn,P=b.stencil?lr:Mn);const ie={colorFormat:t.RGBA8,depthFormat:B,scaleFactor:s};f=this.getBinding(),u=f.createProjectionLayer(ie),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),v=new Lt(u.textureWidth,u.textureHeight,{format:on,type:qt,depthTexture:new yr(u.textureWidth,u.textureHeight,P,void 0,void 0,void 0,void 0,void 0,void 0,I),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const I={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:s};d=new XRWebGLLayer(r,t,I),r.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new Lt(d.framebufferWidth,d.framebufferHeight,{format:on,type:qt,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),ze.setContext(r),ze.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function K(N){for(let D=0;D<N.removed.length;D++){const I=N.removed[D],P=T.indexOf(I);P>=0&&(T[P]=null,w[P].disconnect(I))}for(let D=0;D<N.added.length;D++){const I=N.added[D];let P=T.indexOf(I);if(P===-1){for(let ie=0;ie<w.length;ie++)if(ie>=T.length){T.push(I),P=ie;break}else if(T[ie]===null){T[ie]=I,P=ie;break}if(P===-1)break}const B=w[P];B&&B.connect(I)}}const re=new U,se=new U;function ue(N,D,I){re.setFromMatrixPosition(D.matrixWorld),se.setFromMatrixPosition(I.matrixWorld);const P=re.distanceTo(se),B=D.projectionMatrix.elements,ie=I.projectionMatrix.elements,me=B[14]/(B[10]-1),R=B[14]/(B[10]+1),H=(B[9]+1)/B[5],O=(B[9]-1)/B[5],Z=(B[8]-1)/B[0],Q=(ie[8]+1)/ie[0],ce=me*Z,ge=me*Q,pe=P/(-Z+Q),q=pe*-Z;if(D.matrixWorld.decompose(N.position,N.quaternion,N.scale),N.translateX(q),N.translateZ(pe),N.matrixWorld.compose(N.position,N.quaternion,N.scale),N.matrixWorldInverse.copy(N.matrixWorld).invert(),B[10]===-1)N.projectionMatrix.copy(D.projectionMatrix),N.projectionMatrixInverse.copy(D.projectionMatrixInverse);else{const y=me+pe,Ce=R+pe,Fe=ce-q,L=ge+(P-q),M=H*R/Ce*y,X=O*R/Ce*y;N.projectionMatrix.makePerspective(Fe,L,M,X,y,Ce),N.projectionMatrixInverse.copy(N.projectionMatrix).invert()}}function Ie(N,D){D===null?N.matrixWorld.copy(N.matrix):N.matrixWorld.multiplyMatrices(D.matrixWorld,N.matrix),N.matrixWorldInverse.copy(N.matrixWorld).invert()}this.updateCamera=function(N){if(r===null)return;let D=N.near,I=N.far;m.texture!==null&&(m.depthNear>0&&(D=m.depthNear),m.depthFar>0&&(I=m.depthFar)),J.near=G.near=F.near=D,J.far=G.far=F.far=I,(k!==J.near||Y!==J.far)&&(r.updateRenderState({depthNear:J.near,depthFar:J.far}),k=J.near,Y=J.far),J.layers.mask=N.layers.mask|6,F.layers.mask=J.layers.mask&-5,G.layers.mask=J.layers.mask&-3;const P=N.parent,B=J.cameras;Ie(J,P);for(let ie=0;ie<B.length;ie++)Ie(B[ie],P);B.length===2?ue(J,F,G):J.projectionMatrix.copy(F.projectionMatrix),A===null&&N.isPerspectiveCamera&&(A={camera:N,fov:N.fov,zoom:N.zoom}),_e(N,J,P)};function _e(N,D,I){I===null?N.matrix.copy(D.matrixWorld):(N.matrix.copy(I.matrixWorld),N.matrix.invert(),N.matrix.multiply(D.matrixWorld)),N.matrix.decompose(N.position,N.quaternion,N.scale),N.updateMatrixWorld(!0),N.projectionMatrix.copy(D.projectionMatrix),N.projectionMatrixInverse.copy(D.projectionMatrixInverse),N.isPerspectiveCamera&&(N.fov=hr*2*Math.atan(1/N.projectionMatrix.elements[5]),N.zoom=1)}this.getCamera=function(){return J},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(N){l=N,u!==null&&(u.fixedFoveation=N),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=N)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(J)},this.getCameraTexture=function(N){return p[N]};let Me=null;function Se(N,D){if(h=D.getViewerPose(c||a),g=D,h!==null){const I=h.views;d!==null&&(e.setRenderTargetFramebuffer(v,d.framebuffer),e.setRenderTarget(v));let P=!1;I.length!==J.cameras.length&&(J.cameras.length=0,P=!0);for(let R=0;R<I.length;R++){const H=I[R];let O=null;if(d!==null)O=d.getViewport(H);else{const Q=f.getViewSubImage(u,H);O=Q.viewport,R===0&&(e.setRenderTargetTextures(v,Q.colorTexture,Q.depthStencilTexture),e.setRenderTarget(v))}let Z=z[R];Z===void 0&&(Z=new Jt,Z.layers.enable(R),Z.viewport=new mt,z[R]=Z),Z.matrix.fromArray(H.transform.matrix),Z.matrix.decompose(Z.position,Z.quaternion,Z.scale),Z.projectionMatrix.fromArray(H.projectionMatrix),Z.projectionMatrixInverse.copy(Z.projectionMatrix).invert(),Z.viewport.set(O.x,O.y,O.width,O.height),R===0&&(J.matrix.copy(Z.matrix),J.matrix.decompose(J.position,J.quaternion,J.scale)),P===!0&&J.cameras.push(Z)}const B=r.enabledFeatures;if(B&&B.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&x){f=n.getBinding();const R=f.getDepthInformation(I[0]);R&&R.isValid&&R.texture&&m.init(R,r.renderState)}if(B&&B.includes("camera-access")&&x){e.state.unbindTexture(),f=n.getBinding();for(let R=0;R<I.length;R++){const H=I[R].camera;if(H){let O=p[H];O||(O=new oc,p[H]=O);const Z=f.getCameraImage(H);O.sourceTexture=Z}}}}for(let I=0;I<w.length;I++){const P=T[I],B=w[I];P!==null&&B!==void 0&&B.update(P,D,c||a)}Me&&Me(N,D),D.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:D}),g=null}const ze=new Nc;ze.setAnimationLoop(Se),this.setAnimationLoop=function(N){Me=N},this.dispose=function(){}}}const Bg=new ht,ch=new qe;ch.set(-1,0,0,0,1,0,0,0,1);function zg(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,wc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,b,S,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),f(m,p)):p.isMeshPhongMaterial?(s(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),u(m,p),p.isMeshPhysicalMaterial&&d(m,p,v)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),x(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,b,S):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===kt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===kt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const b=e.get(p),S=b.envMap,v=b.envMapRotation;S&&(m.envMap.value=S,m.envMapRotation.value.setFromMatrix4(Bg.makeRotationFromEuler(v)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(ch),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,b,S){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=S*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===kt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function x(m,p){const b=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function kg(i,e,t,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,w){const T=w.program;n.uniformBlockBinding(v,T)}function c(v,w){let T=r[v.id];T===void 0&&(m(v),T=h(v),r[v.id]=T,v.addEventListener("dispose",b));const C=w.program;n.updateUBOMapping(v,C);const _=e.render.frame;s[v.id]!==_&&(u(v),s[v.id]=_)}function h(v){const w=f();v.__bindingPointIndex=w;const T=i.createBuffer(),C=v.__size,_=v.usage;return i.bindBuffer(i.UNIFORM_BUFFER,T),i.bufferData(i.UNIFORM_BUFFER,C,_),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,T),T}function f(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){const w=r[v.id],T=v.uniforms,C=v.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let _=0,A=T.length;_<A;_++){const F=T[_];if(Array.isArray(F))for(let G=0,z=F.length;G<z;G++)d(F[G],_,G,C);else d(F,_,0,C)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(v,w,T,C){if(x(v,w,T,C)===!0){const _=v.__offset,A=v.value;if(Array.isArray(A)){let F=0;for(let G=0;G<A.length;G++){const z=A[G],J=p(z);g(z,v.__data,F),typeof z!="number"&&typeof z!="boolean"&&!z.isMatrix3&&!ArrayBuffer.isView(z)&&(F+=J.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(A,v.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,_,v.__data)}}function g(v,w,T){typeof v=="number"||typeof v=="boolean"?w[0]=v:v.isMatrix3?(w[0]=v.elements[0],w[1]=v.elements[1],w[2]=v.elements[2],w[3]=0,w[4]=v.elements[3],w[5]=v.elements[4],w[6]=v.elements[5],w[7]=0,w[8]=v.elements[6],w[9]=v.elements[7],w[10]=v.elements[8],w[11]=0):ArrayBuffer.isView(v)?w.set(new v.constructor(v.buffer,v.byteOffset,w.length)):v.toArray(w,T)}function x(v,w,T,C){const _=v.value,A=w+"_"+T;if(C[A]===void 0)return typeof _=="number"||typeof _=="boolean"?C[A]=_:ArrayBuffer.isView(_)?C[A]=_.slice():C[A]=_.clone(),!0;{const F=C[A];if(typeof _=="number"||typeof _=="boolean"){if(F!==_)return C[A]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(F.equals(_)===!1)return F.copy(_),!0}}return!1}function m(v){const w=v.uniforms;let T=0;const C=16;for(let A=0,F=w.length;A<F;A++){const G=Array.isArray(w[A])?w[A]:[w[A]];for(let z=0,J=G.length;z<J;z++){const k=G[z],Y=Array.isArray(k.value)?k.value:[k.value];for(let ne=0,$=Y.length;ne<$;ne++){const K=Y[ne],re=p(K),se=T%C,ue=se%re.boundary,Ie=se+ue;T+=ue,Ie!==0&&C-Ie<re.storage&&(T+=C-Ie),k.__data=new Float32Array(re.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=T,T+=re.storage}}}const _=T%C;return _>0&&(T+=C-_),v.__size=T,v.__cache={},this}function p(v){const w={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(w.boundary=4,w.storage=4):v.isVector2?(w.boundary=8,w.storage=8):v.isVector3||v.isColor?(w.boundary=16,w.storage=12):v.isVector4?(w.boundary=16,w.storage=16):v.isMatrix3?(w.boundary=48,w.storage=48):v.isMatrix4?(w.boundary=64,w.storage=64):v.isTexture?Ke("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(w.boundary=16,w.storage=v.byteLength):Ke("WebGLRenderer: Unsupported uniform value type.",v),w}function b(v){const w=v.target;w.removeEventListener("dispose",b);const T=a.indexOf(w.__bindingPointIndex);a.splice(T,1),i.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id]}function S(){for(const v in r)i.deleteBuffer(r[v]);a=[],r={},s={}}return{bind:l,update:c,dispose:S}}const Hg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Tn=null;function Gg(){return Tn===null&&(Tn=new Mo(Hg,16,16,oi,Dt),Tn.name="DFG_LUT",Tn.minFilter=Rt,Tn.magFilter=Rt,Tn.wrapS=_n,Tn.wrapT=_n,Tn.generateMipmaps=!1,Tn.needsUpdate=!0),Tn}class Vg{constructor(e={}){const{canvas:t=Gu(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:d=qt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;const x=d,m=new Set([va,ga,ma]),p=new Set([qt,Mn,or,lr,da,pa]),b=new Uint32Array(4),S=new Int32Array(4),v=new U;let w=null,T=null;const C=[],_=[];let A=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=xn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const F=this;let G=!1,z=null,J=null,k=null,Y=null;this._outputColorSpace=Xt;let ne=0,$=0,K=null,re=-1,se=null;const ue=new mt,Ie=new mt;let _e=null;const Me=new Ye(0);let Se=0,ze=t.width,N=t.height,D=1,I=null,P=null;const B=new mt(0,0,ze,N),ie=new mt(0,0,ze,N);let me=!1;const R=new sc;let H=!1,O=!1;const Z=new ht,Q=new U,ce=new mt,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let pe=!1;function q(){return K===null?D:1}let y=n;function Ce(E,V){return t.getContext(E,V)}let Fe,L,M,X,j,le,xe,ye,he,fe,be,ke,Ee,we,We,Ze,Je,W,Te,de,Ae,De,ve;try{const E={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${ta}`),t.addEventListener("webglcontextlost",dt,!1),t.addEventListener("webglcontextrestored",ot,!1),t.addEventListener("webglcontextcreationerror",gn,!1),y===null){const V="webgl2";if(y=Ce(V,E),y===null)throw Ce(V)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Xe()}catch(E){throw t.removeEventListener("webglcontextlost",dt,!1),t.removeEventListener("webglcontextrestored",ot,!1),t.removeEventListener("webglcontextcreationerror",gn,!1),it("WebGLRenderer: "+E.message),E}function Xe(){Fe=new G0(y),Fe.init(),Ae=new Dg(y,Fe),L=new I0(y,Fe,e,Ae),M=new Lg(y,Fe),L.reversedDepthBuffer&&u&&M.buffers.depth.setReversed(!0),J=y.createFramebuffer(),k=y.createFramebuffer(),Y=y.createFramebuffer(),X=new X0(y),j=new vg,le=new Ig(y,Fe,M,j,L,Ae,X),xe=new H0(F),ye=new Ad(y),De=new P0(y,ye),he=new V0(y,ye,X,De),fe=new Y0(y,he,ye,De,X),W=new q0(y,L,le),We=new D0(j),be=new gg(F,xe,Fe,L,De,We),ke=new zg(F,j),Ee=new _g,we=new Eg(Fe),Je=new C0(F,xe,M,fe,g,l),Ze=new Pg(F,fe,L),ve=new kg(y,X,L,M),Te=new L0(y,Fe,X),de=new W0(y,Fe,X),X.programs=be.programs,F.capabilities=L,F.extensions=Fe,F.properties=j,F.renderLists=Ee,F.shadowMap=Ze,F.state=M,F.info=X}x!==qt&&(A=new K0(x,t.width,t.height,o,r,s));const He=new Og(F,y);this.xr=He,this.getContext=function(){return y},this.getContextAttributes=function(){return y.getContextAttributes()},this.forceContextLoss=function(){const E=Fe.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){const E=Fe.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return D},this.setPixelRatio=function(E){E!==void 0&&(D=E,this.setSize(ze,N,!1))},this.getSize=function(E){return E.set(ze,N)},this.setSize=function(E,V,oe=!0){if(He.isPresenting){Ke("WebGLRenderer: Can't change size while VR device is presenting.");return}ze=E,N=V,t.width=Math.floor(E*D),t.height=Math.floor(V*D),oe===!0&&(t.style.width=E+"px",t.style.height=V+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,E,V)},this.getDrawingBufferSize=function(E){return E.set(ze*D,N*D).floor()},this.setDrawingBufferSize=function(E,V,oe){ze=E,N=V,D=oe,t.width=Math.floor(E*oe),t.height=Math.floor(V*oe),this.setViewport(0,0,E,V)},this.setEffects=function(E){if(x===qt){it("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(E){for(let V=0;V<E.length;V++)if(E[V].isOutputPass===!0){Ke("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy(ue)},this.getViewport=function(E){return E.copy(B)},this.setViewport=function(E,V,oe,ee){E.isVector4?B.set(E.x,E.y,E.z,E.w):B.set(E,V,oe,ee),M.viewport(ue.copy(B).multiplyScalar(D).round())},this.getScissor=function(E){return E.copy(ie)},this.setScissor=function(E,V,oe,ee){E.isVector4?ie.set(E.x,E.y,E.z,E.w):ie.set(E,V,oe,ee),M.scissor(Ie.copy(ie).multiplyScalar(D).round())},this.getScissorTest=function(){return me},this.setScissorTest=function(E){M.setScissorTest(me=E)},this.setOpaqueSort=function(E){I=E},this.setTransparentSort=function(E){P=E},this.getClearColor=function(E){return E.copy(Je.getClearColor())},this.setClearColor=function(){Je.setClearColor(...arguments)},this.getClearAlpha=function(){return Je.getClearAlpha()},this.setClearAlpha=function(){Je.setClearAlpha(...arguments)},this.clear=function(E=!0,V=!0,oe=!0){let ee=0;if(E){let te=!1;if(K!==null){const Le=K.texture.format;te=m.has(Le)}if(te){const Le=K.texture.type,Ue=p.has(Le),Pe=Je.getClearColor(),Oe=Je.getClearAlpha(),Ve=Pe.r,je=Pe.g,tt=Pe.b;Ue?(b[0]=Ve,b[1]=je,b[2]=tt,b[3]=Oe,y.clearBufferuiv(y.COLOR,0,b)):(S[0]=Ve,S[1]=je,S[2]=tt,S[3]=Oe,y.clearBufferiv(y.COLOR,0,S))}else ee|=y.COLOR_BUFFER_BIT}V&&(ee|=y.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),oe&&(ee|=y.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ee!==0&&y.clear(ee)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),z=E},this.dispose=function(){t.removeEventListener("webglcontextlost",dt,!1),t.removeEventListener("webglcontextrestored",ot,!1),t.removeEventListener("webglcontextcreationerror",gn,!1),Je.dispose(),Ee.dispose(),we.dispose(),j.dispose(),xe.dispose(),fe.dispose(),De.dispose(),ve.dispose(),be.dispose(),He.dispose(),He.removeEventListener("sessionstart",$h),He.removeEventListener("sessionend",Jh),Ti.stop()};function dt(E){E.preventDefault(),Ul("WebGLRenderer: Context Lost."),G=!0}function ot(){Ul("WebGLRenderer: Context Restored."),G=!1;const E=X.autoReset,V=Ze.enabled,oe=Ze.autoUpdate,ee=Ze.needsUpdate,te=Ze.type;Xe(),X.autoReset=E,Ze.enabled=V,Ze.autoUpdate=oe,Ze.needsUpdate=ee,Ze.type=te}function gn(E){it("WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Rn(E){const V=E.target;V.removeEventListener("dispose",Rn),o_(V)}function o_(E){l_(E),j.remove(E)}function l_(E){const V=j.get(E).programs;V!==void 0&&(V.forEach(function(oe){be.releaseProgram(oe)}),E.isShaderMaterial&&be.releaseShaderCache(E))}this.renderBufferDirect=function(E,V,oe,ee,te,Le){V===null&&(V=ge);const Ue=te.isMesh&&te.matrixWorld.determinantAffine()<0,Pe=u_(E,V,oe,ee,te);M.setMaterial(ee,Ue);let Oe=oe.index,Ve=1;if(ee.wireframe===!0){if(Oe=he.getWireframeAttribute(oe),Oe===void 0)return;Ve=2}const je=oe.drawRange,tt=oe.attributes.position;let Be=je.start*Ve,lt=(je.start+je.count)*Ve;Le!==null&&(Be=Math.max(Be,Le.start*Ve),lt=Math.min(lt,(Le.start+Le.count)*Ve)),Oe!==null?(Be=Math.max(Be,0),lt=Math.min(lt,Oe.count)):tt!=null&&(Be=Math.max(Be,0),lt=Math.min(lt,tt.count));const Et=lt-Be;if(Et<0||Et===1/0)return;De.setup(te,ee,Pe,oe,Oe);let gt,ft=Te;if(Oe!==null&&(gt=ye.get(Oe),ft=de,ft.setIndex(gt)),te.isMesh)ee.wireframe===!0?(M.setLineWidth(ee.wireframeLinewidth*q()),ft.setMode(y.LINES)):ft.setMode(y.TRIANGLES);else if(te.isLine){let zt=ee.linewidth;zt===void 0&&(zt=1),M.setLineWidth(zt*q()),te.isLineSegments?ft.setMode(y.LINES):te.isLineLoop?ft.setMode(y.LINE_LOOP):ft.setMode(y.LINE_STRIP)}else te.isPoints?ft.setMode(y.POINTS):te.isSprite&&ft.setMode(y.TRIANGLES);if(te.isBatchedMesh)if(Fe.get("WEBGL_multi_draw"))ft.renderMultiDraw(te._multiDrawStarts,te._multiDrawCounts,te._multiDrawCount);else{const zt=te._multiDrawStarts,Ne=te._multiDrawCounts,Vt=te._multiDrawCount,rt=Oe?ye.get(Oe).bytesPerElement:1,sn=j.get(ee).currentProgram.getUniforms();for(let Cn=0;Cn<Vt;Cn++)sn.setValue(y,"_gl_DrawID",Cn),ft.render(zt[Cn]/rt,Ne[Cn])}else if(te.isInstancedMesh)ft.renderInstances(Be,Et,te.count);else if(oe.isInstancedBufferGeometry){const zt=oe._maxInstanceCount!==void 0?oe._maxInstanceCount:1/0,Ne=Math.min(oe.instanceCount,zt);ft.renderInstances(Be,Et,Ne)}else ft.render(Be,Et)};function Kh(E,V,oe,ee){z!==null&&E.isNodeMaterial&&z.setObject(ee,E),H===!0&&We.setState(E,oe,!1),E.transparent===!0&&E.side===jt&&E.forceSinglePass===!1?(E.side=kt,E.needsUpdate=!0,ea(E,V,ee),E.side=ri,E.needsUpdate=!0,ea(E,V,ee),E.side=jt):ea(E,V,ee)}this.compile=function(E,V,oe=null){oe===null&&(oe=E),z!==null&&z.renderStart(E,V,oe),T=we.get(oe),T.init(V),_.push(T),oe.traverseVisible(function(te){te.isLight&&te.layers.test(V.layers)&&(T.pushLight(te),te.castShadow&&T.pushShadow(te))}),E!==oe&&E.traverseVisible(function(te){te.isLight&&te.layers.test(V.layers)&&(T.pushLight(te),te.castShadow&&T.pushShadow(te))}),T.setupLights(),z!==null&&z.updateLights(T.state.lightsArray),O=this.localClippingEnabled,H=We.init(this.clippingPlanes,O),H===!0&&We.setGlobalState(this.clippingPlanes,V),z!==null&&Ze.render(T.state.shadowsArray,oe,V);const ee=new Set;return E.traverse(function(te){if(!(te.isMesh||te.isPoints||te.isLine||te.isSprite))return;const Le=te.material;if(Le)if(Array.isArray(Le))for(let Ue=0;Ue<Le.length;Ue++){const Pe=Le[Ue];Kh(Pe,oe,V,te),ee.add(Pe)}else Kh(Le,oe,V,te),ee.add(Le)}),T=_.pop(),z!==null&&z.renderEnd(),ee},this.compileAsync=function(E,V,oe=null){const ee=this.compile(E,V,oe);return new Promise(te=>{function Le(){if(ee.forEach(function(Ue){const Oe=j.get(Ue).currentProgram;(Oe===void 0||Oe.isReady())&&ee.delete(Ue)}),ee.size===0){te(E);return}setTimeout(Le,10)}Fe.get("KHR_parallel_shader_compile")!==null?Le():setTimeout(Le,10)})};let cl=null;function c_(E){cl&&cl(E)}function $h(){Ti.stop()}function Jh(){Ti.start()}const Ti=new Nc;Ti.setAnimationLoop(c_),typeof self<"u"&&Ti.setContext(self),this.setAnimationLoop=function(E){cl=E,He.setAnimationLoop(E),E===null?Ti.stop():Ti.start()},He.addEventListener("sessionstart",$h),He.addEventListener("sessionend",Jh),this.render=function(E,V){if(V!==void 0&&V.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(G===!0)return;z!==null&&z.renderStart(E,V);const oe=He.enabled===!0&&He.isPresenting===!0,ee=A!==null&&(K===null||oe)&&A.begin(F,K);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),He.enabled===!0&&He.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(He.cameraAutoUpdate===!0&&He.updateCamera(V),V=He.getCamera()),E.isScene===!0&&E.onBeforeRender(F,E,V,K),T=we.get(E,_.length),T.init(V),T.state.textureUnits=le.getTextureUnits(),_.push(T),Z.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),R.setFromProjectionMatrix(Z,yn,V.reversedDepth),O=this.localClippingEnabled,H=We.init(this.clippingPlanes,O),w=Ee.get(E,C.length),w.init(),C.push(w),He.enabled===!0&&He.isPresenting===!0){const Ue=F.xr.getDepthSensingMesh();Ue!==null&&hl(Ue,V,-1/0,F.sortObjects)}hl(E,V,0,F.sortObjects),w.finish(),z!==null&&z.updateLights(T.state.lightsArray),F.sortObjects===!0&&w.sort(I,P),pe=He.enabled===!1||He.isPresenting===!1||He.hasDepthSensing()===!1,pe&&Je.addToRenderList(w,E),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),H===!0&&We.beginShadows();const te=T.state.shadowsArray;if(Ze.render(te,E,V),H===!0&&We.endShadows(),(ee&&A.hasRenderPass())===!1){const Ue=w.opaque,Pe=w.transmissive;if(T.setupLights(),V.isArrayCamera){const Oe=V.cameras;if(Pe.length>0)for(let Ve=0,je=Oe.length;Ve<je;Ve++){const tt=Oe[Ve];jh(Ue,Pe,E,tt)}pe&&Je.render(E);for(let Ve=0,je=Oe.length;Ve<je;Ve++){const tt=Oe[Ve];Qh(w,E,tt,tt.viewport)}}else Pe.length>0&&jh(Ue,Pe,E,V),pe&&Je.render(E),Qh(w,E,V)}K!==null&&$===0&&(le.updateMultisampleRenderTarget(K),le.updateRenderTargetMipmap(K)),ee&&A.end(F),E.isScene===!0&&E.onAfterRender(F,E,V),De.resetDefaultState(),re=-1,se=null,_.pop(),_.length>0?(T=_[_.length-1],le.setTextureUnits(T.state.textureUnits),H===!0&&We.setGlobalState(F.clippingPlanes,T.state.camera)):T=null,C.pop(),C.length>0?w=C[C.length-1]:w=null,z!==null&&z.renderEnd()};function hl(E,V,oe,ee){if(E.visible===!1)return;if(E.layers.test(V.layers)){if(E.isGroup)oe=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(V);else if(E.isLightProbeGrid)T.pushLightProbeGrid(E);else if(E.isLight)T.pushLight(E),E.castShadow&&T.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||E.intersectsFrustum(R)){ee&&ce.setFromMatrixPosition(E.matrixWorld).applyMatrix4(Z);const Ue=fe.update(E),Pe=E.material;Pe.visible&&w.push(E,Ue,Pe,oe,ce.z,null,V)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||E.intersectsFrustum(R))){const Ue=fe.update(E),Pe=E.material;if(ee&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),ce.copy(E.boundingSphere.center)):(Ue.boundingSphere===null&&Ue.computeBoundingSphere(),ce.copy(Ue.boundingSphere.center)),ce.applyMatrix4(E.matrixWorld).applyMatrix4(Z)),Array.isArray(Pe)){const Oe=Ue.groups;for(let Ve=0,je=Oe.length;Ve<je;Ve++){const tt=Oe[Ve],Be=Pe[tt.materialIndex];Be&&Be.visible&&w.push(E,Ue,Be,oe,ce.z,tt,V)}}else Pe.visible&&w.push(E,Ue,Pe,oe,ce.z,null,V)}}const Le=E.children;for(let Ue=0,Pe=Le.length;Ue<Pe;Ue++)hl(Le[Ue],V,oe,ee)}function Qh(E,V,oe,ee){const{opaque:te,transmissive:Le,transparent:Ue}=E;T.setupLightsView(oe),H===!0&&We.setGlobalState(F.clippingPlanes,oe),ee&&M.viewport(ue.copy(ee)),te.length>0&&js(te,V,oe),Le.length>0&&js(Le,V,oe),Ue.length>0&&js(Ue,V,oe),M.buffers.depth.setTest(!0),M.buffers.depth.setMask(!0),M.buffers.color.setMask(!0),M.setPolygonOffset(!1)}function jh(E,V,oe,ee){if((oe.isScene===!0?oe.overrideMaterial:null)!==null)return;if(T.state.transmissionRenderTarget[ee.id]===void 0){const Be=Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float");T.state.transmissionRenderTarget[ee.id]=new Lt(1,1,{generateMipmaps:!0,type:Be?Dt:qt,minFilter:Hn,samples:Math.max(4,L.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:nt.workingColorSpace})}const Le=T.state.transmissionRenderTarget[ee.id],Ue=ee.viewport||ue;Le.setSize(Ue.z*F.transmissionResolutionScale,Ue.w*F.transmissionResolutionScale);const Pe=F.getRenderTarget(),Oe=F.getActiveCubeFace(),Ve=F.getActiveMipmapLevel();F.setRenderTarget(Le),F.getClearColor(Me),Se=F.getClearAlpha(),Se<1&&F.setClearColor(16777215,.5),F.clear(),pe&&Je.render(oe);const je=F.toneMapping;F.toneMapping=xn;const tt=ee.viewport;if(ee.viewport!==void 0&&(ee.viewport=void 0),T.setupLightsView(ee),H===!0&&We.setGlobalState(F.clippingPlanes,ee),js(E,oe,ee),le.updateMultisampleRenderTarget(Le),le.updateRenderTargetMipmap(Le),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let Be=!1;for(let lt=0,Et=V.length;lt<Et;lt++){const gt=V[lt],{object:ft,geometry:zt,material:Ne,group:Vt}=gt;if(Ne.side===jt&&ft.layers.test(ee.layers)){const rt=Ne.side;Ne.side=kt,Ne.needsUpdate=!0,eu(ft,oe,ee,zt,Ne,Vt),Ne.side=rt,Ne.needsUpdate=!0,Be=!0}}Be===!0&&(le.updateMultisampleRenderTarget(Le),le.updateRenderTargetMipmap(Le))}F.setRenderTarget(Pe,Oe,Ve),F.setClearColor(Me,Se),tt!==void 0&&(ee.viewport=tt),F.toneMapping=je}function js(E,V,oe){const ee=V.isScene===!0?V.overrideMaterial:null;for(let te=0,Le=E.length;te<Le;te++){const Ue=E[te],{object:Pe,geometry:Oe,group:Ve}=Ue;let je=Ue.material;je.allowOverride===!0&&ee!==null&&(je=ee),Pe.layers.test(oe.layers)&&eu(Pe,V,oe,Oe,je,Ve)}}function eu(E,V,oe,ee,te,Le){z!==null&&te.isNodeMaterial&&z.setObject(E,te),E.onBeforeRender(F,V,oe,ee,te,Le),E.modelViewMatrix.multiplyMatrices(oe.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),te.onBeforeRender(F,V,oe,ee,E,Le),te.transparent===!0&&te.side===jt&&te.forceSinglePass===!1?(te.side=kt,te.needsUpdate=!0,F.renderBufferDirect(oe,V,ee,te,E,Le),te.side=ri,te.needsUpdate=!0,F.renderBufferDirect(oe,V,ee,te,E,Le),te.side=jt):F.renderBufferDirect(oe,V,ee,te,E,Le),E.onAfterRender(F,V,oe,ee,te,Le)}function ea(E,V,oe){V.isScene!==!0&&(V=ge);const ee=j.get(E),te=T.state.lights,Le=T.state.shadowsArray,Ue=te.state.version,Pe=be.getParameters(E,te.state,Le,V,oe,T.state.lightProbeGridArray),Oe=be.getProgramCacheKey(Pe);let Ve=ee.programs;ee.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?V.environment:null,ee.fog=V.fog;const je=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;ee.envMap=xe.get(E.envMap||ee.environment,je),ee.envMapRotation=ee.environment!==null&&E.envMap===null?V.environmentRotation:E.envMapRotation,Ve===void 0&&(E.addEventListener("dispose",Rn),Ve=new Map,ee.programs=Ve);let tt=Ve.get(Oe);if(tt!==void 0){if(ee.currentProgram===tt&&ee.lightsStateVersion===Ue)return nu(E,Pe),tt}else Pe.uniforms=be.getUniforms(E),z!==null&&E.isNodeMaterial&&z.build(E,oe,Pe),E.onBeforeCompile(Pe,F),tt=be.acquireProgram(Pe,Oe),Ve.set(Oe,tt),ee.uniforms=Pe.uniforms;const Be=ee.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Be.clippingPlanes=We.uniform),nu(E,Pe),ee.needsLights=d_(E),ee.lightsStateVersion=Ue,ee.needsLights&&(Be.ambientLightColor.value=te.state.ambient,Be.lightProbe.value=te.state.probe,Be.sunLights.value=te.state.sun,Be.sunLightShadows.value=te.state.sunShadow,Be.directionalLights.value=te.state.directional,Be.directionalLightShadows.value=te.state.directionalShadow,Be.spotLights.value=te.state.spot,Be.spotLightShadows.value=te.state.spotShadow,Be.rectAreaLights.value=te.state.rectArea,Be.ltc_1.value=te.state.rectAreaLTC1,Be.ltc_2.value=te.state.rectAreaLTC2,Be.pointLights.value=te.state.point,Be.pointLightShadows.value=te.state.pointShadow,Be.hemisphereLights.value=te.state.hemi,Be.sunShadowMatrix.value=te.state.sunShadowMatrix,Be.sunShadowCascade.value=te.state.sunShadowCascade,Be.directionalShadowMatrix.value=te.state.directionalShadowMatrix,Be.spotLightMatrix.value=te.state.spotLightMatrix,Be.spotLightMap.value=te.state.spotLightMap,Be.pointShadowMatrix.value=te.state.pointShadowMatrix),ee.lightProbeGrid=T.state.lightProbeGridArray.length>0,ee.currentProgram=tt,ee.uniformsList=null,tt}function tu(E){if(E.uniformsList===null){const V=E.currentProgram.getUniforms();E.uniformsList=Us.seqWithValue(V.seq,E.uniforms)}return E.uniformsList}function nu(E,V){const oe=j.get(E);oe.outputColorSpace=V.outputColorSpace,oe.batching=V.batching,oe.batchingColor=V.batchingColor,oe.instancing=V.instancing,oe.instancingColor=V.instancingColor,oe.instancingMorph=V.instancingMorph,oe.skinning=V.skinning,oe.morphTargets=V.morphTargets,oe.morphNormals=V.morphNormals,oe.morphColors=V.morphColors,oe.morphTargetsCount=V.morphTargetsCount,oe.numClippingPlanes=V.numClippingPlanes,oe.numIntersection=V.numClipIntersection,oe.vertexAlphas=V.vertexAlphas,oe.vertexTangents=V.vertexTangents,oe.toneMapping=V.toneMapping}function h_(E,V){if(E.length===0)return null;if(E.length===1)return E[0].texture!==null?E[0]:null;v.setFromMatrixPosition(V.matrixWorld);for(let oe=0,ee=E.length;oe<ee;oe++){const te=E[oe];if(te.texture!==null&&te.boundingBox.containsPoint(v))return te}return null}function u_(E,V,oe,ee,te){V.isScene!==!0&&(V=ge),le.resetTextureUnits();const Le=V.fog,Ue=ee.isMeshStandardMaterial||ee.isMeshLambertMaterial||ee.isMeshPhongMaterial?V.environment:null,Pe=K===null?F.outputColorSpace:K.isXRRenderTarget===!0?K.texture.colorSpace:nt.workingColorSpace,Oe=ee.isMeshStandardMaterial||ee.isMeshLambertMaterial&&!ee.envMap||ee.isMeshPhongMaterial&&!ee.envMap,Ve=xe.get(ee.envMap||Ue,Oe),je=ee.vertexColors===!0&&!!oe.attributes.color&&oe.attributes.color.itemSize===4,tt=!!oe.attributes.tangent&&(!!ee.normalMap||ee.anisotropy>0),Be=!!oe.morphAttributes.position,lt=!!oe.morphAttributes.normal,Et=!!oe.morphAttributes.color;let gt=xn;ee.toneMapped&&(K===null||K.isXRRenderTarget===!0)&&(gt=F.toneMapping);const ft=oe.morphAttributes.position||oe.morphAttributes.normal||oe.morphAttributes.color,zt=ft!==void 0?ft.length:0,Ne=j.get(ee),Vt=T.state.lights;if(H===!0&&(O===!0||E!==se)){const pt=E===se&&ee.id===re;We.setState(ee,E,pt)}let rt=!1;ee.version===Ne.__version?(Ne.needsLights&&Ne.lightsStateVersion!==Vt.state.version||Ne.outputColorSpace!==Pe||te.isBatchedMesh&&Ne.batching===!1||!te.isBatchedMesh&&Ne.batching===!0||te.isBatchedMesh&&Ne.batchingColor===!0&&te._colorsTexture===null||te.isBatchedMesh&&Ne.batchingColor===!1&&te._colorsTexture!==null||te.isInstancedMesh&&Ne.instancing===!1||!te.isInstancedMesh&&Ne.instancing===!0||te.isSkinnedMesh&&Ne.skinning===!1||!te.isSkinnedMesh&&Ne.skinning===!0||te.isInstancedMesh&&Ne.instancingColor===!0&&te.instanceColor===null||te.isInstancedMesh&&Ne.instancingColor===!1&&te.instanceColor!==null||te.isInstancedMesh&&Ne.instancingMorph===!0&&te.morphTexture===null||te.isInstancedMesh&&Ne.instancingMorph===!1&&te.morphTexture!==null||Ne.envMap!==Ve||ee.fog===!0&&Ne.fog!==Le||Ne.numClippingPlanes!==void 0&&(Ne.numClippingPlanes!==We.numPlanes||Ne.numIntersection!==We.numIntersection)||Ne.vertexAlphas!==je||Ne.vertexTangents!==tt||Ne.morphTargets!==Be||Ne.morphNormals!==lt||Ne.morphColors!==Et||Ne.toneMapping!==gt||Ne.morphTargetsCount!==zt||!!Ne.lightProbeGrid!=T.state.lightProbeGridArray.length>0)&&(rt=!0):(rt=!0,Ne.__version=ee.version);let sn=Ne.currentProgram;rt===!0&&(sn=ea(ee,V,te),z&&ee.isNodeMaterial&&z.onUpdateProgram(ee,sn,Ne));let Cn=!1,ti=!1,tr=!1;const ut=sn.getUniforms(),bt=Ne.uniforms;if(M.useProgram(sn.program)&&(Cn=!0,ti=!0,tr=!0),ee.id!==re&&(re=ee.id,ti=!0),Ne.needsLights){const pt=h_(T.state.lightProbeGridArray,te);Ne.lightProbeGrid!==pt&&(Ne.lightProbeGrid=pt,ti=!0)}if(Cn||se!==E){M.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),ut.setValue(y,"projectionMatrix",E.projectionMatrix),ut.setValue(y,"viewMatrix",E.matrixWorldInverse);const ii=ut.map.cameraPosition;ii!==void 0&&ii.setValue(y,Q.setFromMatrixPosition(E.matrixWorld)),L.logarithmicDepthBuffer&&ut.setValue(y,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(ee.isMeshPhongMaterial||ee.isMeshToonMaterial||ee.isMeshLambertMaterial||ee.isMeshBasicMaterial||ee.isMeshStandardMaterial||ee.isShaderMaterial)&&ut.setValue(y,"isOrthographic",E.isOrthographicCamera===!0),se!==E&&(se=E,ti=!0,tr=!0)}if(Ne.needsLights&&(Vt.state.sunShadowMap.length>0&&ut.setValue(y,"sunShadowMap",Vt.state.sunShadowMap,le),Vt.state.directionalShadowMap.length>0&&ut.setValue(y,"directionalShadowMap",Vt.state.directionalShadowMap,le),Vt.state.spotShadowMap.length>0&&ut.setValue(y,"spotShadowMap",Vt.state.spotShadowMap,le),Vt.state.pointShadowMap.length>0&&ut.setValue(y,"pointShadowMap",Vt.state.pointShadowMap,le)),te.isSkinnedMesh){ut.setOptional(y,te,"bindMatrix"),ut.setOptional(y,te,"bindMatrixInverse");const pt=te.skeleton;pt&&(pt.boneTexture===null&&pt.computeBoneTexture(),ut.setValue(y,"boneTexture",pt.boneTexture,le))}te.isBatchedMesh&&(ut.setOptional(y,te,"batchingTexture"),ut.setValue(y,"batchingTexture",te._matricesTexture,le),ut.setOptional(y,te,"batchingIdTexture"),ut.setValue(y,"batchingIdTexture",te._indirectTexture,le),ut.setOptional(y,te,"batchingColorTexture"),te._colorsTexture!==null&&ut.setValue(y,"batchingColorTexture",te._colorsTexture,le));const ni=oe.morphAttributes;if((ni.position!==void 0||ni.normal!==void 0||ni.color!==void 0)&&W.update(te,oe,sn),(ti||Ne.receiveShadow!==te.receiveShadow)&&(Ne.receiveShadow=te.receiveShadow,ut.setValue(y,"receiveShadow",te.receiveShadow)),(ee.isMeshStandardMaterial||ee.isMeshLambertMaterial||ee.isMeshPhongMaterial)&&ee.envMap===null&&V.environment!==null&&(bt.envMapIntensity.value=V.environmentIntensity),bt.dfgLUT!==void 0&&(bt.dfgLUT.value=Gg()),ti){if(ut.setValue(y,"toneMappingExposure",F.toneMappingExposure),Ne.needsLights&&f_(bt,tr),Le&&ee.fog===!0&&ke.refreshFogUniforms(bt,Le),ke.refreshMaterialUniforms(bt,ee,D,N,T.state.transmissionRenderTarget[E.id]),Ne.needsLights&&Ne.lightProbeGrid){const pt=Ne.lightProbeGrid;bt.probesSH.value=pt.texture,bt.probesMin.value.copy(pt.boundingBox.min),bt.probesMax.value.copy(pt.boundingBox.max),bt.probesResolution.value.copy(pt.resolution)}Us.upload(y,tu(Ne),bt,le)}if(ee.isShaderMaterial&&ee.uniformsNeedUpdate===!0&&(Us.upload(y,tu(Ne),bt,le),ee.uniformsNeedUpdate=!1),ee.isSpriteMaterial&&ut.setValue(y,"center",te.center),ut.setValue(y,"modelViewMatrix",te.modelViewMatrix),ut.setValue(y,"normalMatrix",te.normalMatrix),ut.setValue(y,"modelMatrix",te.matrixWorld),ee.uniformsGroups!==void 0){const pt=ee.uniformsGroups;for(let ii=0,nr=pt.length;ii<nr;ii++){const ru=pt[ii];ve.update(ru,sn),ve.bind(ru,sn)}}return sn}function f_(E,V){E.ambientLightColor.needsUpdate=V,E.lightProbe.needsUpdate=V,E.sunLights.needsUpdate=V,E.sunLightShadows.needsUpdate=V,E.directionalLights.needsUpdate=V,E.directionalLightShadows.needsUpdate=V,E.pointLights.needsUpdate=V,E.pointLightShadows.needsUpdate=V,E.spotLights.needsUpdate=V,E.spotLightShadows.needsUpdate=V,E.rectAreaLights.needsUpdate=V,E.hemisphereLights.needsUpdate=V}function d_(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return ne},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return K},this.setRenderTargetTextures=function(E,V,oe){const ee=j.get(E);ee.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,ee.__autoAllocateDepthBuffer===!1&&(ee.__useRenderToTexture=!1),j.get(E.texture).__webglTexture=V,j.get(E.depthTexture).__webglTexture=ee.__autoAllocateDepthBuffer?void 0:oe,ee.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,V){const oe=j.get(E);oe.__webglFramebuffer=V,oe.__useDefaultFramebuffer=V===void 0},this.setRenderTarget=function(E,V=0,oe=0){K=E,ne=V,$=oe;let ee=null,te=!1,Le=!1;if(E){const Pe=j.get(E);if(Pe.__useDefaultFramebuffer!==void 0){M.bindFramebuffer(y.FRAMEBUFFER,Pe.__webglFramebuffer),ue.copy(E.viewport),Ie.copy(E.scissor),_e=E.scissorTest,M.viewport(ue),M.scissor(Ie),M.setScissorTest(_e),re=-1;return}else if(Pe.__webglFramebuffer===void 0)le.setupRenderTarget(E);else if(Pe.__hasExternalTextures)le.rebindTextures(E,j.get(E.texture).__webglTexture,j.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){const je=E.depthTexture;if(Pe.__boundDepthTexture!==je){if(je!==null&&j.has(je)&&(E.width!==je.image.width||E.height!==je.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");le.setupDepthRenderbuffer(E)}}const Oe=E.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(Le=!0);const Ve=j.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(Ve[V])?ee=Ve[V][oe]:ee=Ve[V],te=!0):E.samples>0&&le.useMultisampledRTT(E)===!1?ee=j.get(E).__webglMultisampledFramebuffer:Array.isArray(Ve)?ee=Ve[oe]:ee=Ve,ue.copy(E.viewport),Ie.copy(E.scissor),_e=E.scissorTest}else ue.copy(B).multiplyScalar(D).floor(),Ie.copy(ie).multiplyScalar(D).floor(),_e=me;if(oe!==0&&(ee=J),M.bindFramebuffer(y.FRAMEBUFFER,ee)&&M.drawBuffers(E,ee),M.viewport(ue),M.scissor(Ie),M.setScissorTest(_e),te){const Pe=j.get(E.texture);y.framebufferTexture2D(y.FRAMEBUFFER,y.COLOR_ATTACHMENT0,y.TEXTURE_CUBE_MAP_POSITIVE_X+V,Pe.__webglTexture,oe)}else if(Le){const Pe=V;for(let Oe=0;Oe<E.textures.length;Oe++){const Ve=j.get(E.textures[Oe]);y.framebufferTextureLayer(y.FRAMEBUFFER,y.COLOR_ATTACHMENT0+Oe,Ve.__webglTexture,oe,Pe)}}else if(E!==null&&oe!==0){const Pe=j.get(E.texture);y.framebufferTexture2D(y.FRAMEBUFFER,y.COLOR_ATTACHMENT0,y.TEXTURE_2D,Pe.__webglTexture,oe)}re=-1};function iu(E){const V=j.get(E);return(V.__readFormat!==E.format||V.__readType!==E.type)&&(V.__readFormat=E.format,V.__readType=E.type,V.__formatReadable=L.textureFormatReadable(E.format),V.__typeReadable=L.textureTypeReadable(E.type)),V}this.readRenderTargetPixels=function(E,V,oe,ee,te,Le,Ue,Pe=0){if(!(E&&E.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Oe=j.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Ue!==void 0&&(Oe=Oe[Ue]),Oe){M.bindFramebuffer(y.FRAMEBUFFER,Oe);try{const Ve=E.textures[Pe],je=Ve.format,tt=Ve.type;E.textures.length>1&&y.readBuffer(y.COLOR_ATTACHMENT0+Pe);const Be=iu(Ve);if(Be.__formatReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Be.__typeReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=E.width-ee&&oe>=0&&oe<=E.height-te&&y.readPixels(V,oe,ee,te,Ae.convert(je),Ae.convert(tt),Le)}finally{const Ve=K!==null?j.get(K).__webglFramebuffer:null;M.bindFramebuffer(y.FRAMEBUFFER,Ve)}}},this.readRenderTargetPixelsAsync=async function(E,V,oe,ee,te,Le,Ue,Pe=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Oe=j.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Ue!==void 0&&(Oe=Oe[Ue]),Oe)if(V>=0&&V<=E.width-ee&&oe>=0&&oe<=E.height-te){M.bindFramebuffer(y.FRAMEBUFFER,Oe);const Ve=E.textures[Pe],je=Ve.format,tt=Ve.type;E.textures.length>1&&y.readBuffer(y.COLOR_ATTACHMENT0+Pe);const Be=iu(Ve);if(Be.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Be.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const lt=y.createBuffer();y.bindBuffer(y.PIXEL_PACK_BUFFER,lt),y.bufferData(y.PIXEL_PACK_BUFFER,Le.byteLength,y.STREAM_READ),y.readPixels(V,oe,ee,te,Ae.convert(je),Ae.convert(tt),0),y.bindBuffer(y.PIXEL_PACK_BUFFER,null);const Et=K!==null?j.get(K).__webglFramebuffer:null;M.bindFramebuffer(y.FRAMEBUFFER,Et);const gt=y.fenceSync(y.SYNC_GPU_COMMANDS_COMPLETE,0);return y.flush(),await Vu(y,gt,4),y.bindBuffer(y.PIXEL_PACK_BUFFER,lt),y.getBufferSubData(y.PIXEL_PACK_BUFFER,0,Le),y.bindBuffer(y.PIXEL_PACK_BUFFER,null),y.deleteBuffer(lt),y.deleteSync(gt),Le}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,V=null,oe=0){const ee=Math.pow(2,-oe),te=Math.floor(E.image.width*ee),Le=Math.floor(E.image.height*ee),Ue=V!==null?V.x:0,Pe=V!==null?V.y:0;le.setTexture2D(E,0),y.copyTexSubImage2D(y.TEXTURE_2D,oe,0,0,Ue,Pe,te,Le),M.unbindTexture()},this.copyTextureToTexture=function(E,V,oe=null,ee=null,te=0,Le=0){let Ue,Pe,Oe,Ve,je,tt,Be,lt,Et;const gt=E.isCompressedTexture?E.mipmaps[Le]:E.image;if(oe!==null)Ue=oe.max.x-oe.min.x,Pe=oe.max.y-oe.min.y,Oe=oe.isBox3?oe.max.z-oe.min.z:1,Ve=oe.min.x,je=oe.min.y,tt=oe.isBox3?oe.min.z:0;else{const bt=Math.pow(2,-te);Ue=Math.floor(gt.width*bt),Pe=Math.floor(gt.height*bt),E.isDataArrayTexture?Oe=gt.depth:E.isData3DTexture?Oe=Math.floor(gt.depth*bt):Oe=1,Ve=0,je=0,tt=0}ee!==null?(Be=ee.x,lt=ee.y,Et=ee.z):(Be=0,lt=0,Et=0);const ft=Ae.convert(V.format),zt=Ae.convert(V.type);let Ne;V.isData3DTexture?(le.setTexture3D(V,0),Ne=y.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(le.setTexture2DArray(V,0),Ne=y.TEXTURE_2D_ARRAY):(le.setTexture2D(V,0),Ne=y.TEXTURE_2D),M.activeTexture(y.TEXTURE0),M.pixelStorei(y.UNPACK_FLIP_Y_WEBGL,V.flipY),M.pixelStorei(y.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),M.pixelStorei(y.UNPACK_ALIGNMENT,V.unpackAlignment);const Vt=M.getParameter(y.UNPACK_ROW_LENGTH),rt=M.getParameter(y.UNPACK_IMAGE_HEIGHT),sn=M.getParameter(y.UNPACK_SKIP_PIXELS),Cn=M.getParameter(y.UNPACK_SKIP_ROWS),ti=M.getParameter(y.UNPACK_SKIP_IMAGES);M.pixelStorei(y.UNPACK_ROW_LENGTH,gt.width),M.pixelStorei(y.UNPACK_IMAGE_HEIGHT,gt.height),M.pixelStorei(y.UNPACK_SKIP_PIXELS,Ve),M.pixelStorei(y.UNPACK_SKIP_ROWS,je),M.pixelStorei(y.UNPACK_SKIP_IMAGES,tt);const tr=E.isDataArrayTexture||E.isData3DTexture,ut=V.isDataArrayTexture||V.isData3DTexture;if(E.isDepthTexture){const bt=j.get(E),ni=j.get(V),pt=j.get(bt.__renderTarget),ii=j.get(ni.__renderTarget);M.bindFramebuffer(y.READ_FRAMEBUFFER,pt.__webglFramebuffer),M.bindFramebuffer(y.DRAW_FRAMEBUFFER,ii.__webglFramebuffer);for(let nr=0;nr<Oe;nr++)tr&&(y.framebufferTextureLayer(y.READ_FRAMEBUFFER,y.COLOR_ATTACHMENT0,j.get(E).__webglTexture,te,tt+nr),y.framebufferTextureLayer(y.DRAW_FRAMEBUFFER,y.COLOR_ATTACHMENT0,j.get(V).__webglTexture,Le,Et+nr)),y.blitFramebuffer(Ve,je,Ue,Pe,Be,lt,Ue,Pe,y.DEPTH_BUFFER_BIT,y.NEAREST);M.bindFramebuffer(y.READ_FRAMEBUFFER,null),M.bindFramebuffer(y.DRAW_FRAMEBUFFER,null)}else if(te!==0||E.isRenderTargetTexture||j.has(E)){const bt=j.get(E),ni=j.get(V);M.bindFramebuffer(y.READ_FRAMEBUFFER,k),M.bindFramebuffer(y.DRAW_FRAMEBUFFER,Y);for(let pt=0;pt<Oe;pt++)tr?y.framebufferTextureLayer(y.READ_FRAMEBUFFER,y.COLOR_ATTACHMENT0,bt.__webglTexture,te,tt+pt):y.framebufferTexture2D(y.READ_FRAMEBUFFER,y.COLOR_ATTACHMENT0,y.TEXTURE_2D,bt.__webglTexture,te),ut?y.framebufferTextureLayer(y.DRAW_FRAMEBUFFER,y.COLOR_ATTACHMENT0,ni.__webglTexture,Le,Et+pt):y.framebufferTexture2D(y.DRAW_FRAMEBUFFER,y.COLOR_ATTACHMENT0,y.TEXTURE_2D,ni.__webglTexture,Le),te!==0?y.blitFramebuffer(Ve,je,Ue,Pe,Be,lt,Ue,Pe,y.COLOR_BUFFER_BIT,y.NEAREST):ut?y.copyTexSubImage3D(Ne,Le,Be,lt,Et+pt,Ve,je,Ue,Pe):y.copyTexSubImage2D(Ne,Le,Be,lt,Ve,je,Ue,Pe);M.bindFramebuffer(y.READ_FRAMEBUFFER,null),M.bindFramebuffer(y.DRAW_FRAMEBUFFER,null)}else ut?E.isDataTexture||E.isData3DTexture?y.texSubImage3D(Ne,Le,Be,lt,Et,Ue,Pe,Oe,ft,zt,gt.data):V.isCompressedArrayTexture?y.compressedTexSubImage3D(Ne,Le,Be,lt,Et,Ue,Pe,Oe,ft,gt.data):y.texSubImage3D(Ne,Le,Be,lt,Et,Ue,Pe,Oe,ft,zt,gt):E.isDataTexture?y.texSubImage2D(y.TEXTURE_2D,Le,Be,lt,Ue,Pe,ft,zt,gt.data):E.isCompressedTexture?y.compressedTexSubImage2D(y.TEXTURE_2D,Le,Be,lt,gt.width,gt.height,ft,gt.data):y.texSubImage2D(y.TEXTURE_2D,Le,Be,lt,Ue,Pe,ft,zt,gt);M.pixelStorei(y.UNPACK_ROW_LENGTH,Vt),M.pixelStorei(y.UNPACK_IMAGE_HEIGHT,rt),M.pixelStorei(y.UNPACK_SKIP_PIXELS,sn),M.pixelStorei(y.UNPACK_SKIP_ROWS,Cn),M.pixelStorei(y.UNPACK_SKIP_IMAGES,ti),Le===0&&V.generateMipmaps&&y.generateMipmap(Ne),M.unbindTexture()},this.initRenderTarget=function(E){j.get(E).__webglFramebuffer===void 0&&le.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?le.setTextureCube(E,0):E.isData3DTexture?le.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?le.setTexture2DArray(E,0):le.setTexture2D(E,0),M.unbindTexture()},this.resetState=function(){ne=0,$=0,K=null,M.reset(),De.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return yn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=nt._getDrawingBufferColorSpace(e),t.unpackColorSpace=nt._getUnpackColorSpace()}}class Nr extends at{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this._reflectionCameras=new WeakMap;const n=this,r=t.color!==void 0?new Ye(t.color):new Ye(8355711),s=t.textureWidth||512,a=t.textureHeight||512,o=t.clipBias||0,l=t.shader||Nr.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new On,f=new U,u=new U,d=new U,g=new ht,x=new U(0,0,-1),m=new mt,p=new U,b=new U,S=new mt,v=new ht,w=new Lt(s,a,{samples:c,type:Dt}),T=new _t({name:l.name!==void 0?l.name:"unspecified",uniforms:Pr.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});T.uniforms.tDiffuse.value=w.texture,T.uniforms.color.value=r,T.uniforms.textureMatrix.value=v,this.material=T,this.onBeforeRender=function(C,_,A){const F=this.getReflectionCamera(A);if(u.setFromMatrixPosition(n.matrixWorld),d.setFromMatrixPosition(A.matrixWorld),g.extractRotation(n.matrixWorld),f.set(0,0,1),f.applyMatrix4(g),p.subVectors(u,d),p.dot(f)>0===!0&&this.forceUpdate===!1)return;p.reflect(f).negate(),p.add(u),g.extractRotation(A.matrixWorld),x.set(0,0,-1),x.applyMatrix4(g),x.add(d),b.subVectors(u,x),b.reflect(f).negate(),b.add(u),F.position.copy(p),F.up.set(0,1,0),F.up.applyMatrix4(g),F.up.reflect(f),F.lookAt(b),F.far=A.far,F.updateMatrixWorld(),F.projectionMatrix.copy(A.projectionMatrix),v.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),v.multiply(F.projectionMatrix),v.multiply(F.matrixWorldInverse),v.multiply(n.matrixWorld),h.setFromNormalAndCoplanarPoint(f,u),h.applyMatrix4(F.matrixWorldInverse),m.set(h.normal.x,h.normal.y,h.normal.z,h.constant);const z=F.projectionMatrix;F.isOrthographicCamera?(S.x=(Math.sign(m.x)+z.elements[8])/z.elements[0],S.y=(Math.sign(m.y)+z.elements[9])/z.elements[5],S.z=-A.far,S.w=1):(S.x=(Math.sign(m.x)+z.elements[8])/z.elements[0],S.y=(Math.sign(m.y)+z.elements[9])/z.elements[5],S.z=-1,S.w=(1+z.elements[10])/z.elements[14]),m.multiplyScalar(2/m.dot(S)),z.elements[2]=m.x,z.elements[6]=m.y,F.isOrthographicCamera?(z.elements[10]=m.z-o,z.elements[14]=m.w-1):(z.elements[10]=m.z+1-o,z.elements[14]=m.w),n.visible=!1;const J=C.getRenderTarget(),k=C.xr.enabled,Y=C.shadowMap.autoUpdate;C.xr.enabled=!1,C.shadowMap.autoUpdate=!1,C.setRenderTarget(w),C.state.buffers.depth.setMask(!0),C.autoClear===!1&&C.clear(),C.render(_,F),C.xr.enabled=k,C.shadowMap.autoUpdate=Y,C.setRenderTarget(J);const ne=A.viewport;ne!==void 0&&C.state.viewport(ne),n.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return w},this.dispose=function(){w.dispose(),n.material.dispose()},this.getReflectionCamera=function(C){let _=this._reflectionCameras.get(C);return _===void 0&&(_=C.clone(),this._reflectionCameras.set(C,_)),_}}}Nr.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
		uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}`,fragmentShader:`
		uniform vec3 color;
		uniform sampler2D tDiffuse;
		varying vec4 vUv;

		#include <logdepthbuf_pars_fragment>

		float blendOverlay( float base, float blend ) {

			return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );

		}

		vec3 blendOverlay( vec3 base, vec3 blend ) {

			return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );

		}

		void main() {

			#include <logdepthbuf_fragment>

			vec4 base = texture2DProj( tDiffuse, vUv );
			gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};function Mi(i,e=!1){const t=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),r=new Set(Object.keys(i[0].morphAttributes)),s={},a={},o=i[0].morphTargetsRelative,l=new Mt;let c=0;for(let h=0;h<i.length;++h){const f=i[h];let u=0;if(t!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in f.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;s[d]===void 0&&(s[d]=[]),s[d].push(f.attributes[d]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in f.morphAttributes){if(!r.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(f.morphAttributes[d])}if(e){let d;if(t)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,h),c+=d}}if(t){let h=0;const f=[];for(let u=0;u<i.length;++u){const d=i[u].index;for(let g=0;g<d.count;++g)f.push(d.getX(g)+h);h+=i[u].attributes.position.count}l.setIndex(f)}for(const h in s){const f=hh(s[h]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,f)}for(const h in a){const f=a[h][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<f;++u){const d=[];for(let x=0;x<a[h].length;++x)d.push(a[h][x][u]);const g=hh(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}}return l}function hh(i){let e,t,n,r=-1,s=0;for(let c=0;c<i.length;++c){const h=i[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=h.gpuType),r!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*t}const a=new e(s),o=new Kt(a,t,n);let l=0;for(let c=0;c<i.length;++c){const h=i[c];if(h.isInterleavedBufferAttribute){const f=l/t;for(let u=0,d=h.count;u<d;u++)for(let g=0;g<t;g++){const x=h.getComponent(u,g);o.setComponent(u+f,g,x)}}else a.set(h.array,l);l+=h.count*t}return r!==void 0&&(o.gpuType=r),o}function uh(i,e=1e-4){e=Math.max(e,Number.EPSILON);const t={},n=i.getIndex(),r=i.getAttribute("position"),s=n?n.count:r.count;let a=0;const o=Object.keys(i.attributes),l={},c={},h=[],f=["getX","getY","getZ","getW"],u=["setX","setY","setZ","setW"];for(let b=0,S=o.length;b<S;b++){const v=o[b],w=i.attributes[v];l[v]=new w.constructor(new w.array.constructor(w.count*w.itemSize),w.itemSize,w.normalized);const T=i.morphAttributes[v];T&&(c[v]||(c[v]=[]),T.forEach((C,_)=>{const A=new C.array.constructor(C.count*C.itemSize);c[v][_]=new C.constructor(A,C.itemSize,C.normalized)}))}const d=e*.5,g=Math.log10(1/e),x=Math.pow(10,g),m=d*x;for(let b=0;b<s;b++){const S=n?n.getX(b):b;let v="";for(let w=0,T=o.length;w<T;w++){const C=o[w],_=i.getAttribute(C),A=_.itemSize;for(let F=0;F<A;F++)v+=`${Math.trunc(_[f[F]](S)*x+m)},`}if(v in t)h.push(t[v]);else{for(let w=0,T=o.length;w<T;w++){const C=o[w],_=i.getAttribute(C),A=i.morphAttributes[C],F=_.itemSize,G=l[C],z=c[C];for(let J=0;J<F;J++){const k=f[J],Y=u[J];if(G[Y](a,_[k](S)),A)for(let ne=0,$=A.length;ne<$;ne++)z[ne][Y](a,A[ne][k](S))}}t[v]=a,h.push(a),a++}}const p=i.clone();for(const b in i.attributes){const S=l[b];if(p.setAttribute(b,new S.constructor(S.array.slice(0,a*S.itemSize),S.itemSize,S.normalized)),b in c)for(let v=0;v<c[b].length;v++){const w=c[b][v];p.morphAttributes[b][v]=new w.constructor(w.array.slice(0,a*w.itemSize),w.itemSize,w.normalized)}}return p.setIndex(h),p}const Ot={glass:0,panel:1,ribbon:2,hero:3},It={none:0,redCorners:1,cyanCorners:2,crownBand:3,floorLines:4,fins:5},tn={box:0,round:1},An={spinner:0,hauler:1},Ho=8,Os=4,Bs=17,St={start:175,end:-205},$n={x:12.4,spacing:26,height:9.5},fn={x:0,z:-238,deck:150},nn={x:0,y:186,z:-238,width:48},dn={north:71,south:-113,rail:-159},yi=6,fh=[28,72,104],dh=10.5,Qt={x:0,y:50,z:-60,length:24,radius:4.6},Si={z:dn.rail,height:30,cars:5,carLength:17,gap:1.2,speed:32,span:1100},Jn={pearl:{x:160,z:-430,height:318,clearance:34,view:{from:40,halfAngle:.1}},gate:{x:-146,z:-450,height:250,clearance:62,view:{from:85,halfAngle:.16}},twist:{x:136,z:-710,height:400,radius:30,clearance:42,view:{from:110,halfAngle:.08}},opener:{x:-150,z:-760,height:330,clearance:46,view:{from:140,halfAngle:.08}}},Wg=-45,Xg=150,qg=136,zs=[{position:{x:0,y:5.2,z:130},target:{x:0,y:17,z:20},fov:62},{position:{x:.4,y:8.5,z:62},target:{x:0,y:40,z:-110},fov:58},{position:{x:-.5,y:36,z:14},target:{x:0,y:104,z:-210},fov:52},{position:{x:.3,y:116,z:-38},target:{x:0,y:150,z:-238},fov:44},{position:{x:0,y:152,z:-70},target:{x:0,y:157,z:-238},fov:40}],ph=.5,mh={from:.22,to:.5},gh={from:.62,to:1};function bi(i){let e=i|0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Yg(i,e){for(let t=i.length-1;t>0;t-=1){const n=Math.floor(e()*(t+1)),r=i[t];i[t]=i[n],i[n]=r}}function vh(i,e,t){const n=Math.min(1,Math.max(0,(t-i)/(e-i)));return n*n*n*(n*(n*6-15)+10)}function Zg(i,e,t,n,r){const s=(g,x)=>Math.max(1e-4,Math.sqrt(Math.hypot(x[0]-g[0],x[1]-g[1],x[2]-g[2]))),a=s(i,e),o=a+s(e,t),l=o+s(t,n),c=a+(o-a)*r,h=(g,x,m,p)=>{const b=(c-m)/(p-m);return[g[0]+(x[0]-g[0])*b,g[1]+(x[1]-g[1])*b,g[2]+(x[2]-g[2])*b]},f=h(i,e,0,a),u=h(e,t,a,o),d=h(t,n,o,l);return h(h(f,u,0,o),h(u,d,a,l),a,o)}function Kg(i,e){const t=i.length,n=(a,o)=>a[o]??0,r=new Array(t).fill(0),s=new Array(t).fill(0);for(let a=1;a<t-1;a+=1){const o=n(i,a)-n(i,a-1),l=n(i,a+1)-n(i,a),c=2*(o+l)-o*n(s,a-1),h=6*((n(e,a+1)-n(e,a))/l-(n(e,a)-n(e,a-1))/o);s[a]=l/c,r[a]=(h-o*n(r,a-1))/c}for(let a=t-2;a>0;a-=1)r[a]=n(r,a)-n(s,a)*n(r,a+1);return a=>{let o=0;for(;o<t-2&&n(i,o+1)<a;)o+=1;const l=n(i,o+1)-n(i,o),c=(a-n(i,o))/l,h=1-c;return h*n(e,o)+c*n(e,o+1)+((h*h*h-h)*n(r,o)+(c*c*c-c)*n(r,o+1))*l*l/6}}const $g=(()=>{const i=zs.map(p=>[p.position.x,p.position.y,p.position.z]),e=i[0]??[0,0,0],t=i[1]??e,n=i.at(-1)??e,r=i.at(-2)??n,s=[[2*e[0]-t[0],2*e[1]-t[1],2*e[2]-t[2]],...i,[2*n[0]-r[0],2*n[1]-r[1],2*n[2]-r[2]]],a=96,o=[],l=[],c=[0];let h=0;for(let p=0;p<i.length-1;p+=1){const[b,S,v,w]=[s[p],s[p+1],s[p+2],s[p+3]];if(b===void 0||S===void 0||v===void 0||w===void 0)throw new Error("splash: camera path is incomplete");for(let T=p===0?0:1;T<=a;T+=1){const C=Zg(b,S,v,w,T/a),_=o.at(-1);_!==void 0&&(h+=Math.hypot(C[0]-_[0],C[1]-_[1],C[2]-_[2])),o.push(C),l.push(h)}c.push(h)}const f=c.map(p=>p/h),u=p=>Kg(f,zs.map(p)),d=p=>(ph+(1-ph)*vh(mh.from,mh.to,p))*(1-vh(gh.from,gh.to,p)),g=1024,x=[0];for(let p=1;p<=g;p+=1)x.push((x.at(-1)??0)+(d((p-1)/g)+d(p/g))/2);const m=x.at(-1)??1;return{samples:o,lengths:l,length:h,speed:d,total:m,covered:x.map(p=>p/m),target:{x:u(p=>p.target.x),y:u(p=>p.target.y),z:u(p=>p.target.z)},fov:u(p=>p.fov)}})();function wi(i){const e=zs[0],t=zs.at(-1);if(e===void 0||t===void 0)throw new Error("splash: camera keys are incomplete");if(i<=0)return e;if(i>=1)return t;const{samples:n,lengths:r,length:s,covered:a,speed:o,total:l,target:c,fov:h}=$g,f=a.length-1,u=Math.floor(i*f),d=u/f,g=(a[u]??0)+(o(d)+o(i))*.5*(i-d)*f/l,x=g*s;let m=0,p=r.length-1;for(;p-m>1;){const T=m+p>>1;(r[T]??0)<x?m=T:p=T}const b=n[m]??[0,0,0],S=n[p]??b,v=r[m]??0,w=Math.min(1,Math.max(0,(x-v)/Math.max(1e-6,(r[p]??v)-v)));return{position:{x:b[0]+(S[0]-b[0])*w,y:b[1]+(S[1]-b[1])*w,z:b[2]+(S[2]-b[2])*w},target:{x:c.x(g),y:c.y(g),z:c.z(g)},fov:h(g)}}function Ji(i,e,t){const n=Math.min(1,Math.max(0,(i-e)/t));return n*n*(3-2*n)}function Jg(i){const{speed:e,span:t}=Si;return(((i-1.6)*e+t/2)%t+t)%t-t/2}function xh(i){let e;for(let t=0;t<=400;t+=1){const n=wi(t/400);Math.abs(n.position.z-i)>6||(e=Math.min(e??1/0,n.position.y))}return e}function Qg(i,e){return Object.values(dn).find(t=>t+yi>e&&t-yi<i)}function jg(i,e,t){return Object.values(Jn).some(n=>Math.hypot(i-n.x,e-n.z)<n.clearance+t)}function ev(i,e,t){const n=wi(1).position,r=Math.hypot(i-n.x,e-n.z),s=Math.atan2(i-n.x,n.z-e);let a=1/0;for(const o of Object.values(Jn)){const l=Math.hypot(o.x-n.x,o.z-n.z);if(r+t>=l)continue;const c=Math.abs(s-Math.atan2(o.x-n.x,n.z-o.z))-Math.atan2(t,r),h=Math.min(1,Math.max(0,(c-o.view.halfAngle)/.06));if(h>=1)continue;const f=n.y+(o.view.from-n.y)*(r+t)/l;a=Math.min(a,f+h*h*400)}return a}function Go(i,e,t,n,r){const s=wi(1).position,a=t<Wg&&Math.hypot(e-s.x,t-s.z)<Xg?qg:1/0;return Math.max(r,Math.min(i,a,ev(e,t,n)))}function tv(i){const e=i();return e<.46?Ot.glass:e<.78?Ot.panel:Ot.ribbon}function nv(i,e){const t=i();return e?t<.3?It.crownBand:t<.55?It.floorLines:t<.7?It.fins:It.none:t<.05?It.redCorners:t<.09?It.cyanCorners:t<.18?It.crownBand:t<.25?It.floorLines:t<.3?It.fins:It.none}function ks(i,e,t){const n=e(),r=!t.storefront&&t.height>46&&e()<.17,s=r?e()<.6?Ot.glass:Ot.ribbon:tv(e),a=.08+e()*.3,o=nv(e,r),l=r?tn.round:tn.box,c=[];let h=0,f=r?Math.min(t.width,t.depth):t.width,u=r?f:t.depth,d=t.height>60?2+Math.floor(e()*2):e()<.4?2:1;if(r&&(d=Math.min(d,2)),!r&&d>1&&e()<.55){const b=Math.min(t.height*.4,9+e()*10);c.push({x:t.x,y:0,z:t.z,width:f,depth:u,height:b,seed:n,facade:Ot.panel,lit:Math.min(1,a+.15),trim:It.none,storefront:t.storefront,form:l,taper:1}),h=b,f*=.7+e()*.18,u*=.7+e()*.18,d-=1}for(let b=0;b<d;b+=1){const S=t.height-h,v=b===d-1,w=v?S:S*(.58+e()*.2),T=r?.84+e()*.16:1;c.push({x:t.x,y:h,z:t.z,width:f,depth:u,height:w,seed:n,facade:s,lit:a,trim:v?o:It.none,storefront:t.storefront&&h===0,form:l,taper:T}),h+=w;const C=r?T*(.82+e()*.1):.72+e()*.16;f*=C,u=r?f:u*(.72+e()*.16)}const g=c.at(-1);if(g===void 0)return c;const x=g.y+g.height,m=g.width*g.taper,p=g.depth*g.taper;if(r&&e()<.45)i.antennas.push({x:g.x,y:x,z:g.z,height:t.height*(.12+e()*.1),radius:m*.12});else{const b=1+Math.floor(e()*3);for(let S=0;S<b;S+=1){const v=1.6+e()*Math.min(5,m*.3),w=1.6+e()*Math.min(5,p*.3),T=r?.5:1;i.roofUnits.push({x:g.x+(e()-.5)*(m-v-1.5)*T,y:x,z:g.z+(e()-.5)*(p-w-1.5)*T,width:v,height:1.2+e()*2.4,depth:w})}if(t.height>70&&e()<.55){const S=!r&&t.height>110&&e()<.35;i.antennas.push({x:g.x+(S?0:(e()-.5)*m*.5),y:x,z:g.z+(S?0:(e()-.5)*p*.5),height:S?18+e()*22:7+e()*16,radius:S?Math.min(m,p)*.09:.22})}}return i.tiers.push(...c),c}function _h(i,e){const t=Qg(i,i-e);if(t===void 0)return{length:e};const n=t+yi;return i-n<8?{skipTo:t-yi-1}:{length:i-n-.5}}function Mh(i,e,t){let n=St.start;for(;n>St.end+12;){const r=_h(n,Math.min(n-St.end,14+e()*13));if("skipTo"in r){n=r.skipTo;continue}const s=r.length,a=n-s/2,o=15+e()*13,l=e()*2.2,c=Bs+l,h=Math.max(0,Math.min(1,(40-a)/220)),f=t*(c+o/2),u=Go(26+e()**1.5*96+h*46,f,a,Math.max(o,s)/2,24),g=ks(i,e,{x:f,z:a,width:o,depth:s,height:u,storefront:!0})[0];if(g!==void 0&&a<160&&a>-150){const x=e()<.8?1+Math.floor(e()*2.4):0;for(let m=0;m<x;m+=1){const p=2.1+e()*.6,b=p*(3.7+e()*.5),S=5.5+e()*Math.max(0,Math.min(34,g.height-b-7));S+b>g.height-1||i.signs.push({x:t*(c-p/2-.35),y:S,z:a+(m-(x-1)/2)*Math.min(5,s/Math.max(1,x))+(e()-.5),width:p,height:b,slot:Math.floor(e()*Ho)})}}if(g!==void 0&&u>46&&s>16&&e()<.42&&a<120){const x=Math.min(s-4,11+e()*9),m=x*(.5+e()*.12),p=Math.min(g.height-m/2-3,20+m/2+e()*26);p-m/2>12&&i.screens.push({x:t*(c-.45),y:p,z:a,width:x,height:m,yaw:-t*Math.PI/2,slot:Math.floor(e()*Os)})}n-=s+(e()<.4?4+e()*5:1.2)}}function yh(i,e,t){let n=St.start-10;for(;n>-300;){const r=_h(n,18+e()*14);if("skipTo"in r){n=r.skipTo;continue}const s=r.length,a=n-s/2,o=18+e()*16,l=Math.max(0,Math.min(1,(60-a)/300)),c=t*(44+e()*10+o/2),h=Go(50+e()**1.3*110+l*60,c,a,Math.max(o,s)/2,40),u=ks(i,e,{x:c,z:a,width:o,depth:s,height:h,storefront:!1}).at(-1);if(u!==void 0&&u.form===tn.box&&a<-40&&e()<.35){const d=Math.min(u.width-2,12+e()*8),g=d*.48;i.screens.push({x:u.x,y:u.y+u.height+1.2+g/2,z:u.z+u.depth/2-1,width:d,height:g,yaw:0,slot:Math.floor(e()*Os)})}n-=s+3+e()*6}}function iv(i,e){for(let t=-520;t<=520;t+=46)for(let n=-780;n<=200;n+=46){if(Math.abs(t)<96&&n>-320||Math.hypot(t-fn.x,n-fn.z)<90)continue;const r=1+Math.floor(e()*2.2);for(let s=0;s<r;s+=1){const a=12+e()*(r===1?20:12),o=12+e()*(r===1?20:12),l=t+(e()-.5)*(34-a),c=n+(e()-.5)*(34-o);if(jg(l,c,Math.max(a,o)/2))continue;const h=Math.hypot(l-fn.x,c-fn.z),f=e()<.07?70+e()*110:0,u=16+e()**1.8*70+120*Math.exp(-((h/300)**2))+f,d=Go(u,l,c,Math.max(a,o)/2,14);ks(i,e,{x:l,z:c,width:a,depth:o,height:d,storefront:!1})}}}function rv(i,e){for(let t=0;t<14;t+=1){const n=-Math.PI*.92+t/13*Math.PI*.84+(e()-.5)*.1,r=720+e()*420,s=70+e()*70;ks(i,e,{x:fn.x+Math.cos(n)*r,z:fn.z+Math.sin(n)*r,width:s,depth:s*(.7+e()*.5),height:260+e()*240,storefront:!1})}}function sv(i){const{x:e,z:t,deck:n}=fn,r=(s,a,o,l,c,h,f)=>({x:e,y:s,z:t,width:a,depth:a,height:o,seed:.618,facade:l,lit:.42,trim:c,storefront:!1,form:h,taper:f});i.tiers.push(r(0,72,22,Ot.panel,It.crownBand,tn.box,1),r(22,38,96,Ot.hero,It.none,tn.round,.9),r(118,31,22,Ot.hero,It.crownBand,tn.round,.9),r(140,25,n-140,Ot.hero,It.crownBand,tn.round,.96))}const av=[12,36,48,58,82,92,112,126,140],Sh=4.6;function ov(i,e){const t=r=>i.tiers.filter(s=>s.storefront&&Math.sign(s.x)===r),n=[];for(const r of t(-1))for(const s of t(1)){const a=Math.min(r.z+r.depth/2,s.z+s.depth/2)-4,o=Math.max(r.z-r.depth/2,s.z-s.depth/2)+4,l=(a+o)/2;if(a-o<7||l>wi(0).position.z||n.some(u=>Math.abs(u-l)<26))continue;const c=xh(l),h=Math.abs(l-Qt.z)<14,f=av.filter(u=>{const d=u+Sh,g=(u+d)/2;if(c!==void 0&&!(u>c+14||d<c-18)||fh.some(b=>b>u-5&&b<d+5)||i.signs.some(b=>Math.abs(b.z-l)<4.5&&b.y<d+1&&b.y+b.height>u-1)||i.screens.some(b=>Math.abs(b.z-l)<b.width/2+3.5&&Math.abs(b.y-g)<b.height/2+3.5))return!1;const m=Qt.y-Qt.radius-4,p=Qt.y+Qt.radius+4;return!h||d<m||u>p});Yg(f,e);for(const u of f){const d=u+Sh,g=[-1,1].map(p=>{const b=i.tiers.filter(S=>Math.sign(S.x)===p&&Math.abs(S.z-l)<S.depth/2-3&&S.y<u&&S.y+S.height>d+6).map(S=>Math.abs(S.x)-S.width/2);return b.length===0?void 0:p*(Math.min(...b)+1.5)}),[x,m]=g;if(!(x===void 0||m===void 0||m-x>Bs*2+10)){n.push(l),i.tiers.push({x:(x+m)/2,y:u,z:l,width:m-x,height:d-u,depth:6.5,seed:e(),facade:Ot.glass,lit:.55,trim:It.none,storefront:!1,form:tn.box,taper:1});break}}}}function lv(){const i=bi(7382788),e={tiers:[],roofUnits:[],antennas:[],signs:[],screens:[]};return Mh(e,i,-1),Mh(e,i,1),yh(e,i,-1),yh(e,i,1),iv(e,i),rv(e,i),sv(e),ov(e,i),e}const cv=[[.05,.052,.06],[.42,.43,.45],[.3,.024,.028],[.012,.012,.014],[.03,.1,.18]],hv=[[.4,.24,.04],[.19,.19,.2]];function uv(){const i=bi(61925),e=[],t=(a,o,l,c,h,f,u)=>{const d=u===An.hauler?hv:cv;for(let g=0;g<c;g+=1)e.push({origin:a,directionX:o,directionZ:l,speed:f,span:h,kind:u,phase:(g+.15+i()*.6)*h/c,bob:i()*Math.PI*2,paint:d[Math.floor(i()*d.length)]??[.05,.05,.05]})},n=(St.start+St.end+30)/2,r=St.start-St.end+50;for(const a of fh)t({x:-dh,y:a,z:n},0,1,5,r,22+i()*6,An.spinner),t({x:dh,y:a+2.5,z:n},0,-1,5,r,18+i()*6,An.spinner);const s=[[dn.north,[58,94],40],[dn.south,[66,98,130],46],[dn.rail,[60,110],void 0]];for(const[a,o,l]of s){for(const c of o)t({x:0,y:c,z:a+2.4},1,0,6,900,28+i()*8,An.spinner),t({x:0,y:c+3,z:a-2.4},-1,0,6,900,26+i()*8,An.spinner);l!==void 0&&(t({x:0,y:l,z:a+2},1,0,3,900,13,An.hauler),t({x:0,y:l+6,z:a-2},-1,0,3,900,12,An.hauler))}return e}function fv(){const i=bi(24301),e=[],t=(n,r,s,a,o,l)=>{const c=30+i()*14;for(let h=0;h<a;h+=1)e.push({origin:n,directionX:r,directionZ:s,speed:c,span:o,headlight:l,phase:(h+i()*.7)*o/a,bob:i()*Math.PI*2,trail:5+i()*6,radius:.45})};for(const[n,r]of[[-260,150],[-340,190],[-420,230],[260,165],[340,205],[420,250]])t({x:n,y:r,z:-300},0,1,9,900,!0),t({x:n+6,y:r+4,z:-300},0,-1,9,900,!1);for(const[n,r]of[[-380,150],[-540,290],[-660,330]])t({x:0,y:r,z:n},1,0,10,1100,!0),t({x:0,y:r+4,z:n-6},-1,0,10,1100,!1);return e}const pn=`
uniform float uTime;
uniform float uDetail;
uniform vec3 uHoloPos;
uniform float uHolo;
uniform float uFogDensity;
uniform float uFogFalloff;

const vec3 HOLO_RGB = vec3(1.0, 0.075, 0.06);
const vec3 HAZE_LOW = vec3(0.2, 0.038, 0.052);
const vec3 HAZE_HIGH = vec3(0.028, 0.013, 0.042);

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 blend = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(cell), hash12(cell + vec2(1.0, 0.0)), blend.x),
    mix(hash12(cell + vec2(0.0, 1.0)), hash12(cell + vec2(1.0, 1.0)), blend.x),
    blend.y);
}

float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int octave = 0; octave < 6; octave++) {
    if (octave >= octaves) break;
    value += amplitude * valueNoise(p);
    p = p * 2.03 + vec2(17.13, 9.71);
    amplitude *= 0.5;
  }
  return value;
}

// Coverage of a line of half-width halfWidth at signed offset; sub-pixel lines widen to one pixel at reduced energy.
float lineCoverage(float offset, float halfWidth, float pixel) {
  float shown = max(halfWidth, pixel);
  return clamp((shown - abs(offset)) / pixel + 0.5, 0.0, 1.0) * (halfWidth / shown);
}

// Periodic lines; once the period spans only a few pixels they resolve to their average so distant grids never shimmer.
float gridLine(float coord, float period, float halfWidth, float pixel) {
  float offset = mod(coord + 0.5 * period, period) - 0.5 * period;
  float average = 2.0 * halfWidth / period;
  return mix(average, lineCoverage(offset, halfWidth, pixel), smoothstep(2.5, 7.0, period / pixel));
}

// Polluted night sky: red horizon glow, under-lit cloud deck, and the mark's glint.
vec3 skyRadiance(vec3 origin, vec3 direction, int cloudOctaves) {
  float rise = direction.y;
  vec3 color = mix(HAZE_LOW * 1.08, vec3(0.052, 0.012, 0.038), smoothstep(0.0, 0.16, rise));
  color = mix(color, vec3(0.005, 0.005, 0.013), smoothstep(0.12, 0.62, rise));
  color = mix(color, HAZE_LOW * 0.8, smoothstep(0.0, -0.25, rise));
  if (cloudOctaves > 0 && rise > 0.0) {
    vec2 drift = vec2(uTime * 0.008, uTime * 0.003);
    float density = smoothstep(0.42, 0.86, fbm(direction.xz / (rise + 0.09) * 1.5 + drift, cloudOctaves));
    vec3 underside = mix(vec3(0.24, 0.046, 0.056), vec3(0.042, 0.018, 0.05), smoothstep(0.03, 0.4, rise));
    color = mix(color, underside, density * smoothstep(0.0, 0.12, rise) * 0.9);
  }
  float toward = max(dot(direction, normalize(uHoloPos - origin)), 0.0);
  color += HOLO_RGB * uHolo * 0.02 * pow(toward, 40.0);
  return color;
}

// Red light the lit mark casts on nearby surfaces.
vec3 holoLight(vec3 position, vec3 normal) {
  vec3 toLight = uHoloPos - position;
  float distanceSq = dot(toLight, toLight);
  return HOLO_RGB * uHolo * 3200.0 / (distanceSq + 1200.0) * max(dot(normal, toLight * inversesqrt(distanceSq)), 0.0);
}

// Night-city fill: warm neon bounce from the streets below, cool sky light from above.
vec3 cityAmbient(vec3 normal, float height) {
  vec3 street = mix(vec3(0.42, 0.11, 0.14), vec3(0.16, 0.08, 0.15), smoothstep(0.0, 180.0, height));
  return mix(street, vec3(0.1, 0.1, 0.2), normal.y * 0.5 + 0.5);
}

// Exponential height haze integrated along the eye ray.
float hazeAmount(vec3 position) {
  vec3 ray = position - cameraPosition;
  float rayLength = length(ray);
  float originY = max(cameraPosition.y, 0.0);
  float rise = ray.y / max(rayLength, 1e-3) * uFogFalloff;
  float path = abs(rise) < 1e-5 ? rayLength : (1.0 - exp(-rayLength * rise)) / rise;
  return 1.0 - exp(-uFogDensity * exp(-originY * uFogFalloff) * path);
}

vec3 hazeRadiance(vec3 position) {
  vec3 ray = position - cameraPosition;
  vec3 direction = ray / max(length(ray), 1e-3);
  float middle = max(cameraPosition.y, 0.0) + ray.y * 0.5;
  vec3 haze = mix(HAZE_LOW, HAZE_HIGH, smoothstep(0.0, 210.0, middle));
  float toward = max(dot(direction, normalize(uHoloPos - cameraPosition)), 0.0);
  return haze + HOLO_RGB * uHolo * 0.07 * pow(toward, 28.0);
}

vec3 applyHaze(vec3 color, vec3 position) {
  return mix(color, hazeRadiance(position), hazeAmount(position));
}

// Craft looping along a straight lane: lane = (origin, metres per second), motion = (direction x, direction z, phase, span).
// Craft shrink and dim within 24 m of either loop end, where they wrap. A negative bob phase keeps ground vehicles level.
vec3 lanePlacement(vec4 lane, vec4 motion, float bob, out vec3 forward, out vec3 right, out float presence) {
  forward = vec3(motion.x, 0.0, motion.y);
  right = vec3(motion.y, 0.0, -motion.x);
  float halfSpan = 0.5 * motion.w;
  float travelled = mod(motion.z + uTime * lane.w, motion.w) - halfSpan;
  presence = smoothstep(0.0, 24.0, halfSpan - abs(travelled));
  float hover = bob < 0.0 ? 0.0 : sin(uTime * 0.8 + bob) * 0.3;
  return lane.xyz + forward * travelled + vec3(0.0, hover, 0.0);
}
`,dv=`
attribute vec3 aCenter;
attribute vec4 aSize;
attribute vec4 aStyle;
attribute vec4 aGrid;
attribute float aStorefront;
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying vec4 vGrid;
flat varying vec2 vTier;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;

void main() {
  vec3 local = position * aSize.xyz;
  vec3 surfaceNormal = normal;
  #ifdef RADIAL
  local.xz *= mix(1.0, aSize.w, position.y);
  float radius = 0.25 * (aSize.x + aSize.z);
  surfaceNormal.y += (1.0 - aSize.w) * radius / aSize.y * length(normal.xz);
  #endif
  vec3 world = aCenter + local;
  vStyle = aStyle;
  vSize = aSize;
  vGrid = aGrid;
  vTier = vec2(aCenter.y, aStorefront);
  vWorld = world;
  vLocal = local;
  vNormal = normalize(surfaceNormal);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,pv=`
${pn}
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying vec4 vGrid;
flat varying vec2 vTier;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;

const float PI = 3.14159265;

vec3 neonTint(float h) {
  if (h < 0.42) return vec3(1.0, 0.08, 0.1);
  if (h < 0.68) return vec3(0.12, 0.72, 1.0);
  if (h < 0.86) return vec3(1.0, 0.24, 0.58);
  return vec3(1.0, 0.58, 0.16);
}

// Room light: each building is warm or cool; rare rooms are lit by coloured screens.
vec3 roomLight(bool warm, float tone, float pick) {
  vec3 tint = warm ? mix(vec3(1.0, 0.54, 0.24), vec3(1.0, 0.74, 0.5), tone) : mix(vec3(0.62, 0.78, 1.0), vec3(0.88, 0.94, 1.0), tone);
  if (pick > 0.975) tint = pick > 0.988 ? vec3(1.0, 0.22, 0.55) : vec3(0.2, 0.88, 1.0);
  return tint * (0.09 + 0.3 * tone * tone + 0.06 * pick);
}

// Ray exit from inside a room box spanning [-1, 1]^3; the window is the z = -1 face.
vec3 roomRadiance(vec2 cellUv, vec3 direction, vec3 light, float lit, float hash) {
  vec3 origin = vec3(cellUv * 2.0 - 1.0, -1.0);
  vec3 inverse = 1.0 / (direction + vec3(1e-5));
  vec3 exits = abs(inverse) - origin * inverse;
  float t = min(min(exits.x, exits.y), exits.z);
  vec3 hit = origin + direction * t;
  float depth = hit.z * 0.5 + 0.5;
  float shade;
  if (t == exits.z) {
    shade = 0.42 + 0.16 * hit.y;
    float furniture = step(hit.y, -0.42) * step(0.3, fract(hit.x * 1.7 + hash * 5.0));
    shade *= 1.0 - 0.45 * furniture;
  } else if (t == exits.y) {
    if (direction.y > 0.0) {
      float fixture = (1.0 - smoothstep(0.36, 0.48, abs(hit.x))) * (1.0 - smoothstep(0.14, 0.24, abs(hit.z - 0.15)));
      shade = 0.55 + 1.1 * fixture;
    } else {
      shade = 0.12 + 0.12 * depth;
    }
  } else {
    shade = 0.24 + 0.16 * depth;
  }
  vec3 dark = vec3(0.003, 0.004, 0.007) * (0.5 + depth);
  return mix(dark, light * shade, lit);
}

// Antialiased coverage of the rectangle rect = (x0, y0, x1, y1), in the units of uv and pixel.
float rectMask(vec2 uv, vec4 rect, vec2 pixel) {
  vec2 inside = smoothstep(rect.xy - pixel, rect.xy + pixel, uv) * (1.0 - smoothstep(rect.zw - pixel, rect.zw + pixel, uv));
  return inside.x * inside.y;
}

vec3 storefront(float u, float y, float seed, vec3 sky, float fresnel) {
  float shopCoord = u / 6.5;
  float shop = floor(shopCoord);
  float across = fract(shopCoord);
  float shopHash = hash12(vec2(shop, seed * 91.0));
  vec2 pixel = max(fwidth(vec2(shopCoord, y)), vec2(1e-4));
  float pixelU = max(fwidth(u), 1e-4);
  float glassMask = smoothstep(0.35 - pixel.y, 0.35 + pixel.y, y) * (1.0 - smoothstep(3.4 - pixel.y, 3.4 + pixel.y, y))
    * smoothstep(0.04 - pixel.x, 0.04 + pixel.x, across) * (1.0 - smoothstep(0.96 - pixel.x, 0.96 + pixel.x, across));
  vec3 tint = shopHash < 0.5 ? vec3(1.0, 0.68, 0.42) : shopHash < 0.82 ? vec3(0.78, 0.88, 1.0) : neonTint(fract(shopHash * 5.3));
  float ceiling = smoothstep(1.0, 3.3, y);
  float shelves = 1.0 - 0.45 * step(0.6, fract(y * 1.5 + shopHash * 3.0)) * step(0.45, y) * step(y, 2.4);
  vec3 interior = tint * (0.04 + 0.15 * ceiling) * shelves * (0.7 + 0.6 * hash11(shopHash * 13.0));
  float figure = step(0.64, valueNoise(vec2(u * 1.15 + shopHash * 40.0, 0.5))) * step(0.35, y) * step(y, 1.8);
  interior *= 1.0 - 0.75 * figure * step(0.35, fract(shopHash * 3.1));
  float open = step(0.14, fract(shopHash * 7.1));
  float ribs = mix(1.0, 0.7 + 0.3 * step(0.5, fract(y * 9.0)), smoothstep(30.0, 60.0, 1.0 / pixel.y));
  vec3 shutter = vec3(0.028) * ribs;
  float mullion = lineCoverage((fract(u / 1.6 + 0.5) - 0.5) * 1.6, 0.03, pixelU) * open;
  vec3 window = mix(mix(shutter, interior, open) * (1.0 - fresnel) + sky * fresnel, vec3(0.01), mullion);
  float band = smoothstep(3.8 - pixel.y, 3.8 + pixel.y, y) * (1.0 - smoothstep(5.0 - pixel.y, 5.0 + pixel.y, y));
  vec2 glyphCoord = vec2(u * 2.4, (y - 3.95) * 2.8);
  vec2 glyphCell = floor(glyphCoord);
  vec2 glyphUv = fract(glyphCoord);
  float glyph = step(0.42, hash12(glyphCell + shop * 7.0)) * step(0.16, glyphUv.x) * step(glyphUv.x, 0.84)
    * step(0.12, glyphUv.y) * step(glyphUv.y, 0.88);
  float textArea = step(0.18, across) * step(across, 0.82) * step(4.0, y) * step(y, 4.8);
  float glyphDetail = smoothstep(2.0, 6.0, 1.0 / max(fwidth(glyphCoord.x), 1e-4));
  float signKind = fract(shopHash * 11.3);
  vec3 neonSign = neonTint(fract(shopHash * 3.7)) * mix(0.26, 0.05 + 1.15 * glyph * textArea, glyphDetail);
  vec3 lightbox = vec3(0.86, 0.9, 1.0) * 0.22 * step(0.1, across) * step(across, 0.9);
  vec3 signLight = signKind < 0.6 ? neonSign : signKind < 0.85 ? lightbox : vec3(0.012);
  vec3 strip = vec3(1.0, 0.82, 0.62) * 0.6 * lineCoverage(y - 3.62, 0.03, pixel.y) * open;
  // Open shops have a framed glass door mid-front; some fronts hang a striped awning over the glass.
  float doorOffset = abs(across - 0.5) * 6.5;
  float door = open * step(0.35, y) * step(y, 2.45) * lineCoverage(doorOffset - 0.62, 0.035, pixelU);
  door = max(door, open * lineCoverage(y - 2.45, 0.035, pixel.y) * step(doorOffset, 0.62));
  window = mix(window, vec3(0.05) + sky * 0.2, door);
  float awning = step(0.55, fract(shopHash * 5.7)) * step(0.05, across) * step(across, 0.95)
    * smoothstep(3.42 - pixel.y, 3.42 + pixel.y, y) * (1.0 - smoothstep(3.76 - pixel.y, 3.76 + pixel.y, y));
  vec3 canvas = mix(vec3(0.07, 0.066, 0.06), neonTint(fract(shopHash * 9.1)) * 0.05, gridLine(u, 0.7, 0.175, pixelU));
  vec3 front = mix(mix(vec3(0.018), window, glassMask), signLight, band) + strip;
  return mix(front, canvas * (0.6 + 0.4 * smoothstep(3.42, 3.76, y)), awning);
}

vec3 wallRadiance(vec3 normal, vec3 view) {
  float seed = vStyle.x;
  int facade = int(vStyle.y + 0.5);
  float litRatio = vStyle.z;
  int trim = int(vStyle.w + 0.5);
  vec3 tangent = vec3(normal.z, 0.0, -normal.x);
  #ifdef RADIAL
  float radius = 0.25 * (vSize.x + vSize.z);
  float faceWidth = 2.0 * PI * radius;
  float u = (atan(vLocal.z / vSize.z, vLocal.x / vSize.x + 1e-6) + PI) * radius;
  float faceId = 0.0;
  #else
  float faceWidth = abs(normal.x) > 0.5 ? vSize.z : vSize.x;
  float u = dot(vLocal, tangent) + faceWidth * 0.5;
  float faceId = dot(floor(normal + 0.5), vec3(1.0, 0.0, 2.0)) + 3.0;
  #endif
  float y = vWorld.y;
  bool office = facade != 1;
  bool warm = hash11(seed * 41.3) < 0.55;
  float buildingHash = hash11(seed * 61.7);
  int finish = int(vGrid.z + 0.5);
  // Balcony blocks have windows that reach the floor as doors.
  bool balconies = mod(vGrid.w, 2.0) > 0.5;

  float floorHeight = vGrid.x;
  float targetCell = vGrid.y;
  float cellWidth = faceWidth / max(1.0, floor(faceWidth / targetCell + 0.5));
  vec2 coord = vec2(u / cellWidth, y / floorHeight);
  vec2 cell = floor(coord);
  vec2 cellUv = fract(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-5));
  float detail = smoothstep(1.8, 5.5, 1.0 / max(pixel.x, pixel.y));

  vec4 window = facade == 1 ? (balconies ? vec4(0.18, 0.08, 0.82, 0.82) : vec4(0.2, 0.3, 0.8, 0.82))
    : facade == 2 ? vec4(0.0, 0.4, 1.0, 0.9)
    : facade == 3 ? vec4(0.05, 0.16, 0.95, 0.97)
    : vec4(0.03, 0.18, 0.97, 0.97);
  float windowArea = (window.z - window.x) * (window.w - window.y);

  float floorBias = hash12(vec2(cell.y, seed * 113.0 + faceId));
  float zoneCells = 3.0 + floor(hash11(seed * 7.7) * 5.0);
  float zone = floor(cell.x / zoneCells);
  float zoneHash = hash13(vec3(cell.y, zone, seed * 53.0 + faceId));
  float zoneTone = hash13(vec3(zone, cell.y, seed * 29.0 + faceId + 5.0));
  float roomHash = hash13(vec3(cell, seed * 197.0 + faceId * 7.0));
  float lit = office
    ? step(zoneHash, litRatio * (0.35 + 1.3 * floorBias)) * step(0.1, roomHash)
    : step(roomHash, litRatio * (0.5 + floorBias));

  vec3 reflected = reflect(view, normal);
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float f0 = facade == 1 ? 0.04 : 0.1;
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
  vec3 glassTint = hash11(seed * 3.3) < 0.5 ? vec3(0.72, 0.84, 1.0) : vec3(1.0, 0.84, 0.7);
  vec3 sky = skyRadiance(vWorld, reflected, 0) * glassTint;

  vec3 albedo;
  float sheen;
  if (facade == 1) {
    // Residential walls: board-marked concrete, small glazed tiles, or brick.
    float grime = fbm(vec2(u * 0.3, y * 0.04) + seed * 31.0, 3);
    float seam = lineCoverage(cellUv.x - 0.5, 0.012, pixel.x) * 0.5;
    albedo = finish == 1 ? vec3(0.15, 0.146, 0.14) * (0.85 + 0.3 * grime)
      : finish == 2 ? vec3(0.1, 0.046, 0.033) * (0.8 + 0.4 * grime)
      : vec3(0.055, 0.05, 0.052) * (0.6 + 0.8 * grime) * (1.0 - seam);
    sheen = finish == 1 ? 0.14 : 0.06;
  } else if (facade == 2) {
    albedo = vec3(0.03, 0.032, 0.038);
    sheen = 0.35;
  } else if (facade == 3) {
    albedo = vec3(0.012, 0.01, 0.014);
    sheen = 0.5;
  } else {
    albedo = vec3(0.018, 0.02, 0.026);
    sheen = 0.45;
  }
  float avenue = step(0.5, -normal.x * sign(vWorld.x)) * (1.0 - smoothstep(26.0, 70.0, abs(vWorld.x))) * step(-205.0, vWorld.z);
  vec3 neon = mix(vec3(1.0, 0.08, 0.1), vec3(0.1, 0.65, 1.0), smoothstep(0.35, 0.65, valueNoise(vec2(vWorld.z * 0.05, seed * 9.0))));
  vec3 spill = neon * 0.9 * exp(-max(y - 2.0, 0.0) / 14.0) * avenue;
  vec3 lighting = cityAmbient(normal, y) + spill + holoLight(vWorld, normal);
  // Avenue faces of the frontage carry real balconies and condensers, so the shader leaves those to the geometry.
  bool relief = vGrid.w > 1.5 && avenue > 0.5;
  vec3 structure = albedo * lighting + sky * (0.04 + 0.5 * pow(1.0 - cosine, 5.0)) * sheen;

  vec3 averageTint = warm ? vec3(1.0, 0.62, 0.34) : vec3(0.74, 0.86, 1.0);
  vec3 averageGlass = averageTint * litRatio * 0.13 * (1.0 - fresnel) + sky * fresnel;
  vec3 color = mix(structure, averageGlass, windowArea);
  float pixelU = max(fwidth(u), 1e-4);
  float pixelY = max(fwidth(y), 1e-4);
  float sharp = detail * uDetail;
  if (sharp > 0.0) {
    vec2 cellMetres = vec2(cellWidth, floorHeight);
    vec2 pixelMetres = pixel * cellMetres;

    // Wall: precast panels two cells wide, glazed tiles, or running-bond brick, with rain streaks washed down from the sills.
    vec3 wallAlbedo;
    float joints;
    if (facade == 1 && finish == 1) {
      vec2 tile = vec2(u, y) / 0.2;
      joints = max(gridLine(u, 0.2, 0.007, pixelU), gridLine(y, 0.2, 0.007, pixelY));
      float tone = mix(1.0, 0.92 + 0.16 * hash12(floor(tile) + seed * 7.0), 1.0 - smoothstep(0.02, 0.05, pixelMetres.y));
      wallAlbedo = mix(albedo * tone, albedo * 0.62, joints);
    } else if (facade == 1 && finish == 2) {
      float course = floor(y / 0.075);
      float offset = mod(course, 2.0) * 0.12;
      joints = max(gridLine(y, 0.075, 0.006, pixelY), gridLine(u + offset, 0.24, 0.006, pixelU));
      float tone = mix(1.0, 0.78 + 0.44 * hash12(vec2(floor((u + offset) / 0.24), course) + seed * 5.0),
        1.0 - smoothstep(0.012, 0.035, pixelMetres.y));
      wallAlbedo = mix(albedo * tone, vec3(0.085, 0.08, 0.075), joints);
    } else {
      float panelTone = 0.84 + 0.32 * hash13(vec3(floor(cell.x * 0.5), cell.y, seed * 17.0 + faceId));
      joints = max(gridLine(y, floorHeight, 0.012, pixelY), gridLine(u, cellWidth * 2.0, 0.012, pixelU));
      wallAlbedo = albedo * panelTone * (1.0 - 0.45 * joints);
    }
    float streaks = smoothstep(0.5, 0.92, valueNoise(vec2(u * 3.4, y * 0.2 + seed * 13.0)));
    float belowSill = step(cellUv.y, window.y) * step(window.x, cellUv.x) * step(cellUv.x, window.z)
      * (1.0 - smoothstep(0.0, 1.6, (window.y - cellUv.y) * floorHeight));
    float grime = clamp(0.4 * streaks + 0.45 * belowSill * (0.4 + streaks), 0.0, 0.7);
    vec3 wall = wallAlbedo * (1.0 - grime) * lighting
      + sky * (0.04 + 0.5 * pow(1.0 - cosine, 5.0)) * (sheen + 0.3 * streaks);
    if (facade == 0) {
      // Curtain-wall spandrels are shadow-box glass with a lit slab edge at each floor.
      vec3 spandrel = vec3(0.008) * lighting + sky * (0.08 + 0.92 * pow(1.0 - cosine, 5.0)) * 0.7;
      wall = mix(spandrel, wall, 0.25) + vec3(0.9, 0.95, 1.0) * 0.12 * gridLine(y, floorHeight, 0.03, pixelY);
    }

    // Windows: the glass sits behind the wall face, so oblique rays meet the jambs, sill, or head first.
    float recess = facade == 1 ? 0.24 : 0.05;
    float facing = max(-dot(view, normal), 0.1);
    vec2 glassUv = cellUv + vec2(dot(view, tangent), view.y) * (recess / facing) / cellMetres;
    float opening = rectMask(cellUv, window, pixel);
    float onGlass = rectMask(glassUv, window, pixel);
    vec2 exits = max(window.xy - glassUv, glassUv - window.zw) * cellMetres;
    vec3 revealNormal = exits.x > exits.y
      ? tangent * sign(window.x + window.z - 2.0 * glassUv.x)
      : vec3(0.0, sign(window.y + window.w - 2.0 * glassUv.y), 0.0);
    vec3 metalFrame = vec3(0.05, 0.051, 0.056) * lighting + sky * 0.11;
    vec3 reveal = facade == 1
      ? albedo * 1.3 * (cityAmbient(revealNormal, y) + spill + holoLight(vWorld, revealNormal)) * 0.85
      : metalFrame;

    // Glazing: casements and transoms in aluminium frames; every pane tilts slightly, so reflections break per pane.
    vec2 paneUv = clamp((glassUv - window.xy) / (window.zw - window.xy), 0.0, 1.0);
    vec2 openingMetres = (window.zw - window.xy) * cellMetres;
    vec2 local = paneUv * openingMetres;
    float columns = facade == 1 || cellWidth > 1.7 ? 2.0 : 1.0;
    float transom = facade == 1 ? 0.7 : hash11(seed * 23.1) < 0.5 ? 0.84 : 2.0;
    float split = columns > 1.5 ? lineCoverage(local.x - 0.5 * openingMetres.x, 0.024, pixelMetres.x) : 0.0;
    float transomBar = lineCoverage(local.y - transom * openingMetres.y, 0.024, pixelMetres.y);
    vec2 edge = min(local, openingMetres - local);
    float rim = 1.0 - smoothstep(0.04 - pixelMetres.x, 0.04 + pixelMetres.x, min(edge.x, edge.y));
    float frame = max(max(split, transomBar), rim);
    vec2 paneId = vec2(step(0.5, paneUv.x) * (columns - 1.0), step(transom, paneUv.y));
    float paneHash = hash13(vec3(cell * 3.0 + paneId, seed * 31.0 + faceId));
    vec3 paneNormal = normalize(normal + tangent * (paneHash - 0.5) * 0.08 + vec3(0.0, (fract(paneHash * 7.31) - 0.5) * 0.06, 0.0));
    vec3 paneSky = skyRadiance(vWorld, reflect(view, paneNormal), 0) * glassTint;

    vec3 light = roomLight(warm, zoneTone, roomHash);
    float roomDepth = cellWidth * 1.25 + 1.6;
    vec3 roomDirection = vec3(dot(view, tangent) / (0.5 * cellWidth), view.y / (0.5 * floorHeight), -dot(view, normal) / (0.5 * roomDepth));
    vec3 room = roomRadiance(glassUv, roomDirection, light, lit, roomHash);
    float blindHash = hash13(vec3(cell.yx, seed * 7.0 + faceId + 3.0));
    float blindLevel = mix(window.y, window.w, 0.2 + 0.7 * fract(blindHash * 7.31));
    float blinds = step(blindHash, 0.16) * smoothstep(blindLevel - pixel.y, blindLevel + pixel.y, glassUv.y);
    float slats = mix(1.0, 0.72 + 0.28 * step(0.35, fract(glassUv.y * floorHeight * 5.0)), smoothstep(40.0, 80.0, 1.0 / pixel.y));
    room = mix(room, mix(vec3(0.008), light * (0.18 + 0.3 * glassUv.y), lit) * slats, blinds);
    vec3 glass = mix(room * (1.0 - fresnel) + paneSky * fresnel, metalFrame, frame);
    vec3 detailed = mix(wall, mix(reveal, glass, onGlass), opening);

    // Curtain walls on some towers carry projecting aluminium fins every third mullion.
    if (facade == 0 && buildingHash < 0.4) {
      float finEvery = cellWidth * 3.0;
      float finOffset = mod(u + 0.5 * finEvery, finEvery) - 0.5 * finEvery;
      float fin = 1.0 - smoothstep(0.07 - pixelU, 0.07 + pixelU, abs(finOffset));
      detailed = mix(detailed, vec3(0.08) * lighting + sky * 0.35, fin);
    }
    if (facade == 1) {
      // Drain pipes run down some cell joints, clamped by a bracket at every floor.
      float every = cellWidth * (4.0 + floor(hash11(seed * 3.9) * 3.0));
      float across = (mod(u + 0.5 * every, every) - 0.5 * every) / 0.06;
      float piped = step(buildingHash, 0.55);
      float pipe = piped * (1.0 - smoothstep(1.0 - pixelU / 0.06, 1.0, abs(across)));
      float bracket = piped * lineCoverage(fract(cellUv.y + 0.5) - 0.5, 0.02, pixel.y) * step(abs(across), 1.6);
      vec3 pipeNormal = normalize(tangent * across + normal * sqrt(max(1.0 - across * across, 0.0)));
      vec3 pipeColor = vec3(0.075, 0.074, 0.07) * (cityAmbient(pipeNormal, y) + spill + holoLight(vWorld, pipeNormal))
        + skyRadiance(vWorld, reflect(view, pipeNormal), 0) * 0.18;
      detailed = mix(detailed, pipeColor, max(pipe, bracket));
    }
    if (facade == 1 && !balconies && !relief) {
      // Air-conditioner condensers hang below some windows: a louvred casing with a round fan grille.
      vec2 unitMetres = vec2(0.82, 0.6);
      vec2 unitUv = (cellUv - vec2(0.48, 0.06)) * cellMetres / unitMetres;
      float unit = step(hash13(vec3(cell, seed * 43.0 + faceId)), 0.34) * rectMask(unitUv, vec4(0.0, 0.0, 1.0, 1.0), pixelMetres / unitMetres);
      vec2 fan = (unitUv - vec2(0.36, 0.5)) * unitMetres;
      float grille = (1.0 - smoothstep(0.2, 0.2 + pixelMetres.x, length(fan))) * (0.55 + 0.45 * gridLine(fan.y, 0.036, 0.009, pixelMetres.y));
      float louvres = step(0.72, unitUv.x) * gridLine(unitUv.y * unitMetres.y, 0.067, 0.017, pixelMetres.y);
      float shade = 1.0 - smoothstep(0.0, 0.08, unitUv.y * unitMetres.y);
      vec3 casing = vec3(0.12, 0.12, 0.118) * (1.0 - 0.7 * grille - 0.35 * louvres - 0.3 * shade) * lighting + sky * 0.05;
      detailed = mix(detailed, casing, unit);
    }
    if (balconies && !relief) {
      // Balconies: a slab edge at each floor and a railing of posts under a handrail.
      float height = cellUv.y * floorHeight;
      float slab = 1.0 - smoothstep(0.18 - pixelMetres.y, 0.18 + pixelMetres.y, height);
      float handrail = lineCoverage(height - 1.05, 0.025, pixelMetres.y);
      float posts = step(0.18, height) * step(height, 1.05) * gridLine(u, 0.13, 0.011, pixelU);
      vec3 slabColor = vec3(0.1, 0.098, 0.095) * 1.2 * lighting;
      detailed = mix(detailed, slabColor, slab);
      detailed = mix(detailed, vec3(0.07) * lighting + sky * 0.25, max(handrail, posts) * 0.9);
    }
    color = mix(color, detailed, sharp);
  }

  if (facade == 3) color += vec3(1.0, 0.06, 0.05) * 1.2 * gridLine(u, cellWidth * 4.0, 0.1, pixelU);
  if (trim == 1 || trim == 2) {
    #ifdef RADIAL
    float quarter = faceWidth * 0.25;
    float offset = mod(u, quarter);
    float edge = min(offset, quarter - offset);
    #else
    float edge = min(u, faceWidth - u);
    #endif
    vec3 strip = trim == 1 ? vec3(1.0, 0.07, 0.06) * 1.5 : vec3(0.1, 0.72, 1.0) * 1.25;
    color += strip * lineCoverage(edge - 0.12, 0.07, pixelU);
  } else if (trim == 3) {
    float below = vTier.x + vSize.y - y;
    color += vec3(1.0, 0.07, 0.06) * 1.5 * lineCoverage(below - 0.6, 0.22, pixelY);
  } else if (trim == 4) {
    vec3 led = hash11(seed * 5.1) < 0.5 ? vec3(0.15, 0.75, 1.0) : vec3(0.9, 0.95, 1.0);
    color += led * 0.5 * gridLine(y - floorHeight * window.y * 0.5, floorHeight * 2.0, 0.06, pixelY);
  } else if (trim == 5) {
    vec3 led = hash11(seed * 9.7) < 0.6 ? vec3(0.15, 0.75, 1.0) : vec3(1.0, 0.2, 0.5);
    color += led * 0.55 * gridLine(u, cellWidth * 3.0, 0.07, pixelU);
  }
  #ifndef RADIAL
  if (vTier.y > 0.5 && avenue > 0.5 && y < 5.6) color = storefront(u, y, seed, sky, fresnel);
  #endif
  return color;
}

vec3 roofRadiance(vec3 view) {
  float seed = vStyle.x;
  float grime = fbm(vWorld.xz * 0.12 + seed * 40.0, 3);
  vec3 albedo = vec3(0.045, 0.042, 0.046) * (0.65 + 0.6 * grime);
  #ifdef RADIAL
  vec2 footprint = vLocal.xz / (0.5 * vSize.xz * vSize.w);
  float edge = 0.5 * min(vSize.x, vSize.z) * vSize.w * (1.0 - length(footprint));
  #else
  vec2 sides = 0.5 * vSize.xz - abs(vLocal.xz);
  float edge = min(sides.x, sides.y);
  #endif
  float rim = 1.0 - smoothstep(0.0, 0.6, edge);
  vec3 color = albedo * (vec3(0.16, 0.08, 0.14) + holoLight(vWorld, vec3(0.0, 1.0, 0.0))) * (1.0 + 0.8 * rim);
  // Membrane seams and rain puddles mirroring the sky.
  vec2 pixelXZ = max(fwidth(vWorld.xz), vec2(1e-4));
  float seams = max(gridLine(vWorld.x, 1.8, 0.02, pixelXZ.x), gridLine(vWorld.z, 1.8, 0.02, pixelXZ.y));
  float puddle = smoothstep(0.58, 0.72, valueNoise(vWorld.xz * 0.3 + seed * 9.0)) * uDetail * (1.0 - rim);
  color = mix(color * (1.0 - 0.3 * seams), skyRadiance(vWorld, reflect(view, vec3(0.0, 1.0, 0.0)), 0) * 0.55, puddle * 0.7);
  // Helipads mark some large roofs; the ring stays faint so roofs never compete with the mark.
  float pad = step(24.0, min(vSize.x, vSize.z)) * step(0.72, hash11(seed * 17.0));
  float radius = length(vLocal.xz);
  float pixel = max(fwidth(radius), 1e-4);
  color += vec3(0.2, 0.75, 1.0) * 0.32 * pad * (lineCoverage(radius - 6.5, 0.16, pixel) + 0.5 * lineCoverage(radius - 5.6, 0.08, pixel));
  return color;
}

// Skybridge undersides carry rows of cool panel lights.
vec3 soffitRadiance() {
  float pixel = max(fwidth(vLocal.x), 1e-4);
  float row = fract(vLocal.x / 3.0 + 0.5) * 3.0 - 1.5;
  float inside = step(abs(vLocal.z), 0.32 * vSize.z);
  return vec3(0.012) + vec3(0.6, 0.85, 1.0) * 0.9 * lineCoverage(row, 0.25, pixel) * inside;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 color;
  if (normal.y > 0.5) color = roofRadiance(view);
  else if (normal.y < -0.5) color = soffitRadiance();
  else color = wallRadiance(normal, view);
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,mv=`
uniform mat4 textureMatrix;
varying vec4 vReflection;
varying vec3 vWorld;

void main() {
  vReflection = textureMatrix * vec4(position, 1.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,gv=`
${pn}
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform vec4 uStreet;
uniform vec2 uAvenue;
uniform vec3 uCrossings;
varying vec4 vReflection;
varying vec3 vWorld;

// Radial slope of the rings spreading where raindrops land, two staggered drop grids deep.
vec2 rainRipples(vec2 p, float time) {
  vec2 slope = vec2(0.0);
  for (int layer = 0; layer < 2; layer++) {
    vec2 q = p * 1.7 + float(layer) * 0.37;
    float h = hash12(floor(q) + float(layer) * 19.0);
    vec2 offset = fract(q) - 0.5 - (vec2(h, fract(h * 7.13)) - 0.5) * 0.3;
    float age = fract(time * 0.9 + h * 5.0);
    float radius = length(offset);
    float ring = exp(-pow((radius - age * 0.32) / 0.025, 2.0)) * (1.0 - age);
    slope += offset / max(radius, 1e-3) * ring;
  }
  return slope;
}

void main() {
  vec3 p = vWorld;
  vec3 view = normalize(p - cameraPosition);
  float across = abs(p.x);
  vec2 pixel = max(fwidth(p.xz), vec2(1e-4));
  float onAvenue = step(uAvenue.y, p.z) * step(p.z, uAvenue.x);
  float frontage = uStreet.w;
  float sidewalk = onAvenue * smoothstep(10.0 - pixel.x, 10.0 + pixel.x, across);
  float road = onAvenue * (1.0 - sidewalk);

  float puddle = smoothstep(0.5, 0.62, fbm(p.xz * 0.045 + vec2(3.1, 7.7), 4));
  float grainDetail = 1.0 - smoothstep(0.2, 0.8, max(pixel.x, pixel.y) * 1.2);
  float nearDetail = 1.0 - smoothstep(0.015, 0.05, max(pixel.x, pixel.y));
  float grain = mix(0.5, fbm(p.xz * 1.2, 3), grainDetail);
  float wet = mix(0.45, 1.0, puddle) * (1.0 - 0.4 * sidewalk);
  float roughness = mix(0.5, 0.03, puddle);

  vec2 ripple = vec2(valueNoise(p.xz * 1.6 + uTime * 0.25), valueNoise(p.xz * 1.6 + 9.2 - uTime * 0.25)) - 0.5;
  vec2 drops = rainRipples(p.xz, uTime) * nearDetail * (0.25 + 0.75 * puddle);
  vec2 uv = vReflection.xy / vReflection.w + ripple * 0.005 * (1.0 - 0.7 * puddle) * grainDetail + drops * 0.004;
  vec3 reflection = vec3(0.0);
  float weight = 0.0;
  for (int tap = -3; tap <= 3; tap++) {
    float offset = float(tap) / 3.0;
    float tapWeight = exp(-offset * offset * 2.0);
    reflection += textureLod(tDiffuse, uv + vec2(0.0, offset * roughness * 0.05), roughness * 4.0).rgb * tapWeight;
    weight += tapWeight;
  }
  reflection /= weight;
  float cosine = clamp(-view.y, 0.0, 1.0);
  float fresnel = 0.05 + 0.95 * pow(1.0 - cosine, 4.0);

  vec3 albedo = mix(vec3(0.02, 0.019, 0.022), vec3(0.05, 0.048, 0.052), sidewalk) * (0.7 + 0.6 * grain);
  // Zebra crossings and stop lines where the cross streets meet the avenue; lane paint stops at them.
  float crossingZ = min(min(abs(p.z - uCrossings.x), abs(p.z - uCrossings.y)), abs(p.z - uCrossings.z));
  float crossing = road * (1.0 - smoothstep(2.6 - pixel.y, 2.6 + pixel.y, crossingZ));
  float zebra = crossing * gridLine(p.x + 0.5, 1.0, 0.25, pixel.x) * step(across, 9.4);
  float stop = road * lineCoverage(crossingZ - 4.0, 0.2, pixel.y) * step(across, 9.4);
  float dash = smoothstep(0.0, pixel.y / 9.0 + 0.002, 0.42 - fract(p.z / 9.0));
  float lanes = ((lineCoverage(across - 3.35, 0.08, pixel.x) + lineCoverage(across - 6.75, 0.08, pixel.x)) * dash
    + lineCoverage(across - 9.55, 0.09, pixel.x)) * (1.0 - crossing);
  float centre = lineCoverage(across - 0.22, 0.06, pixel.x) * (1.0 - crossing);
  float wear = smoothstep(0.25, 0.6, valueNoise(p.xz * vec2(2.0, 0.4)));
  float curb = lineCoverage(across - 10.0, 0.08, pixel.x);
  float tiles = sidewalk * max(gridLine(p.z, 1.5, 0.02, pixel.y), gridLine(across, 1.5, 0.02, pixel.x)) * grainDetail;
  albedo = mix(albedo, vec3(0.42), (lanes * onAvenue + zebra + stop) * wear);
  albedo = mix(albedo, vec3(0.5, 0.36, 0.08), centre * onAvenue * wear);
  albedo = mix(albedo, vec3(0.12), curb * onAvenue);
  albedo *= 1.0 - 0.35 * tiles;
  // Manhole covers in the middle lanes: a cast-iron disc with a ring and a cross-hatched face.
  vec2 manhole = vec2(across - 5.05, p.z - 41.0 * floor(p.z / 41.0 + 0.5) - 7.0 * sign(p.x));
  float manholeRadius = length(manhole);
  float coverDetail = road * nearDetail;
  float cover = coverDetail * (1.0 - smoothstep(0.36 - pixel.x, 0.36 + pixel.x, manholeRadius));
  float hatch = max(gridLine(manhole.x + manhole.y, 0.09, 0.012, pixel.x), gridLine(manhole.x - manhole.y, 0.09, 0.012, pixel.x));
  albedo = mix(albedo, vec3(0.032, 0.03, 0.028) * (1.0 - 0.45 * hatch), cover);
  albedo = mix(albedo, vec3(0.012), coverDetail * lineCoverage(manholeRadius - 0.33, 0.02, pixel.x));
  float paint = clamp(lanes + centre + zebra + stop + cover, 0.0, 1.0) * onAvenue;

  vec3 light = vec3(0.3, 0.08, 0.1);
  float lampZ = p.z - uStreet.y * floor(p.z / uStreet.y + 0.5);
  float lampX = across - uStreet.x;
  light += vec3(1.0, 0.72, 0.46) * 2.6 * exp(-(lampX * lampX + lampZ * lampZ) / 32.0) * onAvenue;
  vec3 neon = mix(vec3(1.0, 0.08, 0.1), vec3(0.1, 0.65, 1.0), smoothstep(0.35, 0.65, valueNoise(vec2(p.z * 0.05, sign(p.x) * 4.0))));
  light += neon * 1.6 * exp(-max(frontage - across, 0.0) / 2.8) * step(across, frontage) * onAvenue;
  light += holoLight(p, vec3(0.0, 1.0, 0.0));

  float shine = wet * (1.0 - 0.6 * paint);
  vec3 radiance = albedo * light * (1.0 - 0.5 * shine) + reflection * color * fresnel * shine;
  // Ring crests catch a little more of the reflected light than the flat water around them.
  radiance += reflection * color * clamp(length(drops), 0.0, 1.0) * 0.15 * shine;
  float guideDash = step(0.5, fract(p.z / 4.0));
  radiance += vec3(0.1, 0.75, 1.0) * 1.1 * lineCoverage(p.x, 0.05, pixel.x) * guideDash * onAvenue * (1.0 - crossing);
  gl_FragColor = vec4(applyHaze(radiance, p), 1.0);
}
`,vv=`
varying vec3 vDirection;

void main() {
  vDirection = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`,xv=`
${pn}
varying vec3 vDirection;

void main() {
  gl_FragColor = vec4(skyRadiance(cameraPosition, normalize(vDirection), uDetail > 0.5 ? 5 : 2), 1.0);
}
`,_v=`
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTint;

void main() {
  mat4 model = modelMatrix;
  #ifdef USE_INSTANCING
  model = model * instanceMatrix;
  #endif
  vec4 world = model * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(model) * normal);
  #ifdef USE_INSTANCING_COLOR
  vTint = instanceColor;
  #else
  vTint = vec3(1.0);
  #endif
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,Mv=`
${pn}
uniform vec3 uAlbedo;
uniform vec3 uEmissive;
uniform float uSheen;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTint;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  vec3 color = uAlbedo * vTint * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal))
    + sky * uSheen * (0.04 + 0.96 * pow(1.0 - cosine, 5.0)) + uEmissive;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,yv=`
uniform vec3 uPanelOffset;
attribute vec4 aPanel;
attribute vec4 aShape;
flat varying vec2 vPanel;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  float c = cos(aPanel.w);
  float s = sin(aPanel.w);
  vec2 local = position.xy * aShape.xy;
  vec3 world = aPanel.xyz + uPanelOffset + vec3(local.x * c, local.y, -local.x * s);
  vPanel = aShape.zw;
  vUv = uv;
  vWorld = world;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,Sv=`
${pn}
uniform sampler2D uAtlas;
uniform vec2 uGrid;
uniform float uScreen;
flat varying vec2 vPanel;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  float column = mod(vPanel.x, uGrid.x);
  float row = floor(vPanel.x / uGrid.x);
  vec2 uv = vec2((column + vUv.x) / uGrid.x, 1.0 - (row + 1.0 - vUv.y) / uGrid.y);
  vec3 color = texture2D(uAtlas, uv).rgb;
  if (uScreen > 0.5) {
    float lineCoord = vUv.y * 90.0;
    float lines = 1.0 - 0.14 * smoothstep(0.4, 0.9, abs(fract(lineCoord) - 0.5) * 2.0) * (1.0 - smoothstep(0.3, 0.7, fwidth(lineCoord)));
    float sweep = 0.86 + 0.14 * smoothstep(0.82, 1.0, 1.0 - abs(fract(vUv.y * 0.6 - uTime * 0.07) - 0.5) * 2.0);
    color *= lines * sweep;
  }
  gl_FragColor = vec4(applyHaze(color * vPanel.y, vWorld), 1.0);
}
`,Hs=`
${pn}
uniform vec2 uViewport;
flat varying vec4 vSegment;
flat varying vec3 vColor;
flat varying float vRadius;

void hideSegment() {
  gl_Position = vec4(0.0, 0.0, 2.0, 1.0);
  vSegment = vec4(0.0);
  vColor = vec3(0.0);
  vRadius = 1.0;
}

void emitSegment(vec3 head, vec3 tail, float worldRadius, float minPixels, vec3 color) {
  mat4 viewProjection = projectionMatrix * viewMatrix;
  vec4 clipHead = viewProjection * vec4(head, 1.0);
  vec4 clipTail = viewProjection * vec4(tail, 1.0);
  const float nearW = 0.05;
  if ((clipHead.w < nearW && clipTail.w < nearW) || dot(color, color) <= 0.0) {
    hideSegment();
    return;
  }
  if (clipHead.w < nearW) clipHead = mix(clipHead, clipTail, (nearW - clipHead.w) / (clipTail.w - clipHead.w));
  if (clipTail.w < nearW) clipTail = mix(clipTail, clipHead, (nearW - clipTail.w) / (clipHead.w - clipTail.w));
  vec2 halfViewport = 0.5 * uViewport;
  vec2 screenHead = clipHead.xy / clipHead.w * halfViewport;
  vec2 screenTail = clipTail.xy / clipTail.w * halfViewport;
  float pixels = worldRadius * projectionMatrix[1][1] * halfViewport.y / clipHead.w;
  float shown = max(pixels, minPixels);
  vec2 axis = screenTail - screenHead;
  float axisLength = length(axis);
  vec2 along = axisLength > 1e-3 ? axis / axisLength : vec2(1.0, 0.0);
  // Clockwise normal keeps the quad's counter-clockwise winding, so front-face culling keeps it.
  vec2 across = vec2(along.y, -along.x);
  float reach = shown * 1.8;
  float t = position.y + 0.5;
  vec2 screen = mix(screenHead - along * reach, screenTail + along * reach, t) + across * position.x * 2.0 * reach;
  vec4 clip = mix(clipHead, clipTail, t);
  gl_Position = vec4(screen / halfViewport * clip.w, clip.z, clip.w);
  float energy = pixels / shown;
  float streak = clamp(axisLength / (4.0 * shown), 0.0, 1.0);
  vSegment = vec4(screenHead, screenTail);
  vRadius = shown;
  vColor = color * mix(energy * energy, energy, streak) * (1.0 - hazeAmount(head));
}
`,bv=`
${Hs}
uniform vec3 uLightOffset;
attribute vec3 aHead;
attribute vec4 aLight;

void main() {
  vec3 head = aHead + uLightOffset;
  emitSegment(head, head, aLight.w, 2.2, aLight.rgb);
}
`,wv=`
${Hs}
attribute vec4 aLane;
attribute vec4 aMotion;
attribute vec4 aOffset;
attribute vec4 aLight;
attribute vec2 aKind;

void main() {
  vec3 forward;
  vec3 right;
  float presence;
  vec3 origin = lanePlacement(aLane, aMotion, aOffset.w, forward, right, presence);
  vec3 head = origin + right * aOffset.x + vec3(0.0, aOffset.y, 0.0) + forward * aOffset.z;
  float facing = dot(forward, normalize(cameraPosition - head));
  float aim = aKind.x < 0.5 ? 1.0 : aKind.x < 1.5 ? facing : -facing;
  float beam = aKind.x < 0.5 ? 1.0 : 0.12 + 0.88 * smoothstep(-0.3, 0.75, aim);
  emitSegment(head, head - forward * aKind.y, aLight.w, 1.4, aLight.rgb * beam * presence);
}
`,Ev=`
${Hs}
uniform vec3 uRainBox;
uniform float uRain;
attribute vec4 aDrop;

void main() {
  vec3 fall = vec3(1.2, -24.0 - 8.0 * aDrop.w, 0.5);
  vec3 local = mod(aDrop.xyz * uRainBox + fall * uTime - cameraPosition + 0.5 * uRainBox, uRainBox) - 0.5 * uRainBox;
  vec3 head = cameraPosition + local;
  float reach = length(local);
  // Drops within a few metres of the lens would smear into long bright lines, so rain fades in from 4 m.
  float fade = smoothstep(24.0, 9.0, reach) * smoothstep(4.0, 7.0, reach) * uRain;
  emitSegment(head, head - normalize(fall) * 0.85, 0.007, 0.7, vec3(0.5, 0.56, 0.7) * 0.36 * fade);
}
`,Tv=`
${Hs}
uniform float uTimeline;
attribute vec3 aFrom;
attribute vec3 aVia;
attribute vec3 aTo;
attribute vec2 aTiming;

vec3 sparkPath(float t) {
  float s = 1.0 - t;
  return s * s * aFrom + 2.0 * s * t * aVia + t * t * aTo;
}

void main() {
  float span = max(aTiming.y - aTiming.x, 1.0);
  float t = (uTimeline - aTiming.x) / span;
  if (t <= 0.0 || t >= 1.0 + 220.0 / span) {
    hideSegment();
    return;
  }
  float fade = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(1.0, 1.0 + 220.0 / span, t));
  float head = clamp(t, 0.0, 1.0);
  float tail = clamp(t - 0.09, 0.0, 1.0);
  emitSegment(sparkPath(head * head * (3.0 - 2.0 * head)), sparkPath(tail * tail * (3.0 - 2.0 * tail)), 0.09, 1.4,
    vec3(1.0, 0.24, 0.16) * 1.6 * fade);
}
`,Av=`
uniform vec2 uViewport;
flat varying vec4 vSegment;
flat varying vec3 vColor;
flat varying float vRadius;

void main() {
  vec2 p = gl_FragCoord.xy - 0.5 * uViewport;
  vec2 head = vSegment.xy;
  vec2 axis = vSegment.zw - head;
  float h = clamp(dot(p - head, axis) / max(dot(axis, axis), 1e-4), 0.0, 1.0);
  float d = length(p - head - axis * h) / vRadius;
  gl_FragColor = vec4(vColor * exp(-d * d * 2.0) * pow(1.0 - h, 1.6), 1.0);
}
`,Rv=`
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;

void main() {
  vHeight = uv.y;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,Cv=`
${pn}
uniform float uBeam;
uniform float uBeamReach;
varying vec3 vWorld;
varying vec3 vNormal;
varying float vHeight;

void main() {
  vec3 view = normalize(cameraPosition - vWorld);
  float facing = abs(dot(normalize(vNormal), view));
  float reach = 1.0 - smoothstep(uBeamReach - 0.12, uBeamReach, vHeight);
  float angle = atan(vWorld.z - uHoloPos.z, vWorld.x - uHoloPos.x);
  float dust = 0.72 + 0.28 * valueNoise(vec2(vHeight * 9.0 - uTime * 1.2, angle * 4.0));
  float density = pow(facing, 1.7) * mix(1.0, 0.5, vHeight) * dust * reach * uBeam;
  gl_FragColor = vec4(vec3(1.0, 0.17, 0.13) * 0.36 * density, 1.0);
}
`,Pv=`
attribute vec2 aMarkUv;
varying vec2 vMarkUv;
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vMarkUv = aMarkUv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,bh=1.22,Lv=`
${pn}
uniform sampler2D uField;
uniform float uIgnite;
uniform float uDormant;
varying vec2 vMarkUv;
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  float travel = texture2D(uField, vMarkUv).r;
  vec3 normal = normalize(vNormal);
  vec3 toEye = normalize(cameraPosition - vWorld);
  float facing = clamp(abs(dot(normal, toEye)), 0.0, 1.0);
  float front = uIgnite * ${bh.toFixed(2)};
  float lit = 1.0 - smoothstep(front - 0.035, front, travel);
  if (lit <= 0.0 && uDormant <= 0.0) discard;
  float edge = smoothstep(front - 0.2, front, travel) * lit;
  vec3 rim = vec3(1.0, 0.025, 0.02) * 0.95;
  vec3 core = vec3(1.0, 0.1, 0.07) * 1.65;
  vec3 neon = mix(rim, core, pow(facing, 2.2)) + vec3(1.0, 0.4, 0.3) * 2.0 * edge;
  vec3 glass = vec3(0.09, 0.016, 0.022) * (0.3 + 0.7 * pow(1.0 - facing, 2.0)) * uDormant
    + skyRadiance(vWorld, reflect(-toEye, normal), 0) * 0.25 * pow(1.0 - facing, 3.0) * uDormant;
  gl_FragColor = vec4(applyHaze(mix(glass, neon, lit), vWorld), 1.0);
}
`,Iv=`
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,Dv=`
${pn}
uniform float uSeed;
uniform vec2 uAxis;
uniform float uRadius;
uniform float uTwistRate;
varying vec3 vWorld;
varying vec3 vNormal;

const float PI = 3.14159265;
const vec3 PEARL_PINK = vec3(1.0, 0.16, 0.42);
const vec3 LED_CYAN = vec3(0.18, 0.82, 1.0);

// Glass curtain wall with office floors lit in zones; resolves to its average when cells span a few pixels.
vec3 curtainWall(float u, float y, float cellWidth, float floorHeight, float litRatio, bool warm, vec3 normal, vec3 view) {
  vec2 coord = vec2(u / cellWidth, y / floorHeight);
  vec2 cell = floor(coord);
  vec2 cellUv = fract(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-5));
  float detail = smoothstep(1.8, 5.5, 1.0 / max(pixel.x, pixel.y)) * uDetail;
  vec2 inside = smoothstep(vec2(0.04, 0.18) - pixel, vec2(0.04, 0.18) + pixel, cellUv)
    * (1.0 - smoothstep(vec2(0.96) - pixel, vec2(0.96) + pixel, cellUv));
  float zone = floor(cell.x / 5.0);
  float zoneHash = hash13(vec3(cell.y, zone, uSeed * 53.0));
  float tone = hash13(vec3(zone, cell.y, uSeed * 29.0 + 5.0));
  float lit = step(zoneHash, litRatio * (0.35 + 1.3 * hash12(vec2(cell.y, uSeed * 113.0))))
    * step(0.1, hash13(vec3(cell, uSeed * 197.0)));
  vec3 tint = warm ? mix(vec3(1.0, 0.54, 0.24), vec3(1.0, 0.74, 0.5), tone) : mix(vec3(0.62, 0.78, 1.0), vec3(0.88, 0.94, 1.0), tone);
  vec3 room = tint * (0.09 + 0.3 * tone * tone) * lit * (0.75 + 0.25 * cellUv.y);
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float fresnel = 0.1 + 0.9 * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0) * vec3(0.78, 0.86, 1.0);
  vec3 frame = vec3(0.02, 0.022, 0.028) * (cityAmbient(normal, y) + holoLight(vWorld, normal)) + sky * 0.25;
  vec3 glass = room * (1.0 - fresnel) + sky * fresnel;
  vec3 average = mix(frame, tint * litRatio * 0.12 * (1.0 - fresnel) + sky * fresnel, 0.75);
  return mix(average, mix(frame, glass, inside.x * inside.y), detail);
}

vec3 metal(vec3 normal, vec3 view, vec3 albedo, float sheen) {
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  return albedo * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal)) + sky * sheen * (0.05 + 0.95 * pow(1.0 - cosine, 5.0));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  vec3 color;
  #if defined(PEARL_SPHERE)
  float latitude = asin(clamp(normal.y, -1.0, 1.0));
  // The epsilon keeps atan defined at the poles, whose normals have no horizontal part.
  float longitude = atan(-normal.z, -normal.x + 1e-6);
  vec2 coord = vec2(longitude / (2.0 * PI) * 40.0, latitude / PI * 20.0);
  vec2 cell = floor(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-4));
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float fresnel = 0.08 + 0.92 * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  float glow = step(hash12(cell + uSeed * 17.0), 0.34) * (0.4 + 0.6 * hash12(cell.yx + 3.0));
  float panelDetail = smoothstep(2.0, 6.0, 1.0 / max(pixel.x, pixel.y));
  vec3 inner = PEARL_PINK * 0.2 * mix(0.37, glow, panelDetail) * (0.6 + 0.4 * smoothstep(-0.6, 0.6, normal.y));
  vec3 glass = inner * (1.0 - fresnel) + sky * fresnel;
  float frame = max(gridLine(coord.x, 1.0, 0.035, pixel.x), gridLine(coord.y, 1.0, 0.035, pixel.y));
  color = mix(glass, metal(normal, view, vec3(0.05), 0.4), frame);
  color += PEARL_PINK * 1.35 * gridLine(coord.y, 3.0, 0.06, pixel.y);
  color += LED_CYAN * 1.1 * lineCoverage(latitude, 0.02, max(fwidth(latitude), 1e-4));
  #elif defined(PEARL_COLUMN)
  float angle = atan(-normal.z, -normal.x + 1e-6);
  float strips = gridLine(angle, 2.0 * PI / 3.0, 0.07, max(fwidth(angle), 1e-4));
  float rings = gridLine(vWorld.y, 18.0, 0.22, max(fwidth(vWorld.y), 1e-4));
  color = metal(normal, view, vec3(0.06, 0.058, 0.064), 0.55) + LED_CYAN * 0.85 * strips + PEARL_PINK * 1.0 * rings;
  #elif defined(TWIST)
  vec2 offset = vWorld.xz - uAxis;
  float angle = atan(-offset.y, -offset.x + 1e-6) - uTwistRate * vWorld.y;
  float u = angle * uRadius;
  if (normal.y > 0.6) {
    color = metal(normal, view, vec3(0.04), 0.2);
  } else {
    color = curtainWall(u, vWorld.y, 1.8, 4.2, 0.3, false, normal, view);
    float angularPixel = max(fwidth(angle), 1e-4);
    color += vec3(0.75, 0.95, 1.0) * 1.25 * gridLine(angle - PI / 3.0, 2.0 * PI / 3.0, 0.011, angularPixel);
    color += LED_CYAN * 0.8 * gridLine(vWorld.y, 52.0, 0.3, max(fwidth(vWorld.y), 1e-4));
  }
  #elif defined(PLANAR)
  if (normal.y > 0.7) {
    color = metal(normal, view, vec3(0.04), 0.2);
  } else if (normal.y < -0.7) {
    float pixel = max(fwidth(vWorld.x), 1e-4);
    color = vec3(0.012) + vec3(0.6, 0.85, 1.0) * 0.7 * gridLine(vWorld.x, 3.0, 0.2, pixel);
  } else {
    vec3 tangent = normalize(vec3(normal.z, 0.0, -normal.x));
    float u = dot(vWorld, tangent);
    color = curtainWall(u, vWorld.y, 1.7, 4.0, 0.34, hash11(uSeed) < 0.5, normal, view);
    #ifdef DIAGRID
    float rising = u + vWorld.y * 0.9;
    float falling = u - vWorld.y * 0.9;
    float lattice = max(gridLine(rising, 16.0, 0.16, max(fwidth(rising), 1e-4)), gridLine(falling, 16.0, 0.16, max(fwidth(falling), 1e-4)));
    color = mix(color, metal(normal, view, vec3(0.05), 0.4), lattice * 0.8) + LED_CYAN * 0.38 * lattice;
    #else
    color += vec3(0.85, 0.92, 1.0) * 0.32 * gridLine(vWorld.y, 12.0, 0.08, max(fwidth(vWorld.y), 1e-4));
    #endif
  }
  #endif
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Vo=`
${pn}
attribute vec4 aGlow;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vGlow;
varying vec3 vPaint;
varying vec3 vModel;
#ifdef LANE
attribute vec4 aLane;
attribute vec4 aMotion;
attribute vec4 aCraft;
#else
uniform vec3 uPaint;
#endif

void main() {
  #ifdef LANE
  vec3 forward;
  vec3 right;
  float presence;
  vec3 origin = lanePlacement(aLane, aMotion, aCraft.w, forward, right, presence);
  vec3 local = position * presence;
  vec3 world = origin + right * local.x + vec3(0.0, local.y, 0.0) + forward * local.z;
  vNormal = normalize(right * normal.x + vec3(0.0, normal.y, 0.0) + forward * normal.z);
  vPaint = aCraft.rgb;
  #else
  vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  vPaint = uPaint;
  #endif
  vWorld = world;
  vGlow = aGlow;
  vModel = position;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,Wo=`
${pn}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vGlow;
varying vec3 vPaint;
varying vec3 vModel;

// One accent colour per craft, picked from its paint.
vec3 accentColour(vec3 paint) {
  float pick = fract(dot(paint, vec3(13.1, 7.7, 29.3)) * 3.17);
  return pick < 0.3 ? vec3(0.12, 0.72, 1.0) : pick < 0.55 ? vec3(1.0, 0.16, 0.5) : pick < 0.8 ? vec3(1.0, 0.07, 0.06) : vec3(1.0, 0.5, 0.12);
}

// Panel seams of each craft kind in its model frame: 1 on a seam.
float panelSeams(vec3 p) {
  vec3 pixel = max(fwidth(p), vec3(1e-4));
  #if defined(SPINNER)
  // Rings around the hull, the waist seam, and a door outline on each flank.
  float rings = gridLine(p.z + 0.15, 0.95, 0.008, pixel.z);
  float waist = lineCoverage(p.y - 0.02, 0.008, pixel.y);
  vec2 door = vec2(p.z - 0.15, p.y + 0.02);
  float doorEdge = max(lineCoverage(abs(door.x) - 0.62, 0.008, pixel.z) * step(abs(door.y), 0.24),
    lineCoverage(abs(door.y) - 0.24, 0.008, pixel.y) * step(abs(door.x), 0.62)) * step(0.6, abs(p.x));
  return max(max(rings, waist), doorEdge);
  #elif defined(HAULER)
  // Corrugated container walls between panel joints, and the cab's panel lines.
  float corrugation = gridLine(p.z, 0.28, 0.035, pixel.z) * step(p.z, 2.55) * step(1.75, abs(p.x));
  float joints = max(gridLine(p.y + 0.2, 0.9, 0.01, pixel.y), gridLine(p.z + 0.3, 2.3, 0.012, pixel.z));
  return max(0.6 * corrugation, joints);
  #elif defined(BLIMP)
  // Envelope gores around the hull axis and the frames inside them.
  float around = atan(p.z, p.y + 1e-6) * 6.0 / 3.14159265;
  float gores = gridLine(around, 1.0, 0.012, max(fwidth(around), 1e-4));
  return 0.7 * max(gores, gridLine(p.x, 2.4, 0.02, pixel.x));
  #elif defined(TRAIN)
  return gridLine(p.x, 2.2, 0.01, pixel.x) * step(abs(p.y), 1.5);
  #elif defined(CAR)
  // Door shut lines on both flanks, and the bonnet and boot lines across the top.
  float doors = max(lineCoverage(p.z - 0.35, 0.006, pixel.z), lineCoverage(p.z + 0.95, 0.006, pixel.z)) * step(0.82, abs(p.x)) * step(p.y, 0.97);
  float lids = max(lineCoverage(p.z - 1.42, 0.006, pixel.z), lineCoverage(p.z + 1.6, 0.006, pixel.z)) * step(0.88, p.y);
  return max(doors, lids);
  #else
  return 0.0;
  #endif
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  float black = step(2.5, vGlow.a);
  float trim = step(1.5, vGlow.a) * (1.0 - black);
  float glass = clamp(vGlow.a, 0.0, 1.0) * (1.0 - trim) * (1.0 - black);
  float painted = (1.0 - glass) * (1.0 - trim) * (1.0 - black) * step(dot(vGlow.rgb, vec3(1.0)), 0.0);
  vec3 accent = accentColour(vPaint);
  float seams = panelSeams(vModel) * painted;
  #ifdef SPINNER
  // Half the spinners wear a livery stripe along both flanks in their accent colour.
  float stripe = step(0.5, fract(dot(vPaint, vec3(5.3, 11.7, 3.1)))) * painted * step(0.6, abs(vModel.x))
    * (1.0 - smoothstep(0.06 - fwidth(vModel.y), 0.06 + fwidth(vModel.y), abs(vModel.y + 0.12)));
  #else
  float stripe = 0.0;
  #endif
  float fresnel = mix(0.06, 0.08, glass) + (1.0 - mix(0.06, 0.08, glass)) * pow(1.0 - cosine, 5.0);
  vec3 reflected = reflect(view, normal);
  vec3 sky = skyRadiance(vWorld, reflected, 0);
  // Near the camera the clear coat also mirrors the lit windows of the canyon walls, which shows the hull's curvature.
  float bearing = atan(reflected.z, reflected.x + 1e-6);
  float windows = step(0.6, valueNoise(vec2(bearing * 9.0, reflected.y * 14.0)));
  float near = 1.0 - smoothstep(30.0, 120.0, length(vWorld - cameraPosition));
  vec3 glints = mix(vec3(1.0, 0.62, 0.34), vec3(0.62, 0.8, 1.0), step(0.5, valueNoise(vec2(bearing * 3.0, 7.0))));
  sky += glints * 0.35 * windows * near * (1.0 - smoothstep(0.0, 0.45, abs(reflected.y)));
  vec3 paint = mix(mix(vPaint, accent * 0.32, stripe), vec3(0.006, 0.008, 0.012), glass) * (1.0 - 0.6 * seams);
  paint = mix(paint, vec3(0.012), black);
  vec3 emission = mix(vGlow.rgb, accent * vGlow.r, trim);
  #ifdef BLIMP
  // LED strips run along the gores above and below the screen, tracing the envelope.
  float around = atan(vModel.z, vModel.y + 1e-6) * 6.0 / 3.14159265;
  float aroundPixel = max(fwidth(around), 1e-4);
  float led = max(lineCoverage(abs(around) - 1.5, 0.03, aroundPixel), lineCoverage(abs(around) - 4.5, 0.03, aroundPixel));
  emission += vec3(0.12, 0.7, 1.0) * 0.9 * led * painted * step(abs(vModel.x), 10.0);
  #endif
  vec3 color = paint * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal)) * (1.0 - fresnel)
    + sky * fresnel * mix(0.7, 1.0, glass) * (1.0 - 0.5 * seams) + emission;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Ur=Xt;class Xo extends Lo{constructor(e){super(e),this.defaultDPI=90,this.defaultUnit="px"}load(e,t,n,r){const s=this,a=new Md(s.manager);a.setPath(s.path),a.setRequestHeader(s.requestHeader),a.setWithCredentials(s.withCredentials),a.load(e,function(o){try{t(s.parse(o))}catch(l){r?r(l):console.error(l),s.manager.itemError(e)}},n,r)}parse(e){const t=this;function n(D,I){if(D.nodeType!==1)return;D.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");const P=w(D);let B=!1,ie=null;switch(D.nodeName){case"svg":I=x(D,I);break;case"style":s(D);break;case"g":I=x(D,I);break;case"path":I=x(D,I),D.hasAttribute("d")&&(ie=r(D));break;case"rect":I=x(D,I),ie=l(D);break;case"polygon":I=x(D,I),ie=c(D);break;case"polyline":I=x(D,I),ie=h(D);break;case"circle":I=x(D,I),ie=f(D);break;case"ellipse":I=x(D,I),ie=u(D);break;case"line":I=x(D,I),ie=d(D);break;case"defs":B=!0;break;case"use":I=x(D,I);const H=(D.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),O=D.viewportElement.getElementById(H);O?n(O,I):console.warn("SVGLoader: 'use node' references non-existent node id: "+H);break}if(ie){I.fill!==void 0&&I.fill!=="none"&&!I.fill.startsWith("url")&&ie.color.setStyle(I.fill,Ur),_(ie,Se),Y.push(ie);const R=Object.assign({},I);R.strokeWidth=I.strokeWidth*J(Se),ie.userData={node:D,style:R,transform:Se.clone(),gradients:$}}const me=D.childNodes;for(let R=0;R<me.length;R++){const H=me[R];B&&H.nodeName!=="style"&&H.nodeName!=="defs"||n(H,I)}P&&(K.pop(),K.length>0?Se.copy(K[K.length-1]):Se.identity())}function r(D){const I=new xi,P=new ae,B=new ae,ie=new ae;let me=!0,R=!1;const H=D.getAttribute("d");if(H===""||H==="none")return null;const O=H.match(/[a-df-z][^a-df-z]*/ig);for(let Z=0,Q=O.length;Z<Q;Z++){const ce=O[Z],ge=ce.charAt(0),pe=ce.slice(1).trim();me===!0&&(R=!0,me=!1);let q;switch(ge){case"M":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=2)P.x=q[y+0],P.y=q[y+1],B.x=P.x,B.y=P.y,y===0?I.moveTo(P.x,P.y):I.lineTo(P.x,P.y),y===0&&ie.copy(P);break;case"H":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y++)P.x=q[y],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),y===0&&R===!0&&ie.copy(P);break;case"V":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y++)P.y=q[y],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),y===0&&R===!0&&ie.copy(P);break;case"L":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=2)P.x=q[y+0],P.y=q[y+1],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),y===0&&R===!0&&ie.copy(P);break;case"C":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=6)I.bezierCurveTo(q[y+0],q[y+1],q[y+2],q[y+3],q[y+4],q[y+5]),B.x=q[y+2],B.y=q[y+3],P.x=q[y+4],P.y=q[y+5],y===0&&R===!0&&ie.copy(P);break;case"S":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=4)I.bezierCurveTo(m(P.x,B.x),m(P.y,B.y),q[y+0],q[y+1],q[y+2],q[y+3]),B.x=q[y+0],B.y=q[y+1],P.x=q[y+2],P.y=q[y+3],y===0&&R===!0&&ie.copy(P);break;case"Q":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=4)I.quadraticCurveTo(q[y+0],q[y+1],q[y+2],q[y+3]),B.x=q[y+0],B.y=q[y+1],P.x=q[y+2],P.y=q[y+3],y===0&&R===!0&&ie.copy(P);break;case"T":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=2){const Fe=m(P.x,B.x),L=m(P.y,B.y);I.quadraticCurveTo(Fe,L,q[y+0],q[y+1]),B.x=Fe,B.y=L,P.x=q[y+0],P.y=q[y+1],y===0&&R===!0&&ie.copy(P)}break;case"A":q=p(pe,[3,4],7);for(let y=0,Ce=q.length;y<Ce;y+=7){if(q[y+5]==P.x&&q[y+6]==P.y)continue;const Fe=P.clone();P.x=q[y+5],P.y=q[y+6],B.x=P.x,B.y=P.y,a(I,q[y],q[y+1],q[y+2],q[y+3],q[y+4],Fe,P),y===0&&R===!0&&ie.copy(P)}break;case"m":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=2)P.x+=q[y+0],P.y+=q[y+1],B.x=P.x,B.y=P.y,y===0?I.moveTo(P.x,P.y):I.lineTo(P.x,P.y),y===0&&ie.copy(P);break;case"h":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y++)P.x+=q[y],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),y===0&&R===!0&&ie.copy(P);break;case"v":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y++)P.y+=q[y],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),y===0&&R===!0&&ie.copy(P);break;case"l":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=2)P.x+=q[y+0],P.y+=q[y+1],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),y===0&&R===!0&&ie.copy(P);break;case"c":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=6)I.bezierCurveTo(P.x+q[y+0],P.y+q[y+1],P.x+q[y+2],P.y+q[y+3],P.x+q[y+4],P.y+q[y+5]),B.x=P.x+q[y+2],B.y=P.y+q[y+3],P.x+=q[y+4],P.y+=q[y+5],y===0&&R===!0&&ie.copy(P);break;case"s":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=4)I.bezierCurveTo(m(P.x,B.x),m(P.y,B.y),P.x+q[y+0],P.y+q[y+1],P.x+q[y+2],P.y+q[y+3]),B.x=P.x+q[y+0],B.y=P.y+q[y+1],P.x+=q[y+2],P.y+=q[y+3],y===0&&R===!0&&ie.copy(P);break;case"q":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=4)I.quadraticCurveTo(P.x+q[y+0],P.y+q[y+1],P.x+q[y+2],P.y+q[y+3]),B.x=P.x+q[y+0],B.y=P.y+q[y+1],P.x+=q[y+2],P.y+=q[y+3],y===0&&R===!0&&ie.copy(P);break;case"t":q=p(pe);for(let y=0,Ce=q.length;y<Ce;y+=2){const Fe=m(P.x,B.x),L=m(P.y,B.y);I.quadraticCurveTo(Fe,L,P.x+q[y+0],P.y+q[y+1]),B.x=Fe,B.y=L,P.x=P.x+q[y+0],P.y=P.y+q[y+1],y===0&&R===!0&&ie.copy(P)}break;case"a":q=p(pe,[3,4],7);for(let y=0,Ce=q.length;y<Ce;y+=7){if(q[y+5]==0&&q[y+6]==0)continue;const Fe=P.clone();P.x+=q[y+5],P.y+=q[y+6],B.x=P.x,B.y=P.y,a(I,q[y],q[y+1],q[y+2],q[y+3],q[y+4],Fe,P),y===0&&R===!0&&ie.copy(P)}break;case"Z":case"z":I.currentPath.autoClose=!0,I.currentPath.curves.length>0&&(P.copy(ie),I.currentPath.currentPoint.copy(P),me=!0);break;default:console.warn(ce)}R=!1}return I}function s(D){if(!(!D.sheet||!D.sheet.cssRules||!D.sheet.cssRules.length))for(let I=0;I<D.sheet.cssRules.length;I++){const P=D.sheet.cssRules[I];if(P.type!==1)continue;const B=P.selectorText.split(/,/gm).filter(Boolean).map(ie=>ie.trim());for(let ie=0;ie<B.length;ie++){const me=Object.fromEntries(Object.entries(P.style).filter(([,R])=>R!==""));ne[B[ie]]=Object.assign(ne[B[ie]]||{},me)}}}function a(D,I,P,B,ie,me,R,H){if(I==0||P==0){D.lineTo(H.x,H.y);return}B=B*Math.PI/180,I=Math.abs(I),P=Math.abs(P);const O=(R.x-H.x)/2,Z=(R.y-H.y)/2,Q=Math.cos(B)*O+Math.sin(B)*Z,ce=-Math.sin(B)*O+Math.cos(B)*Z;let ge=I*I,pe=P*P;const q=Q*Q,y=ce*ce,Ce=q/ge+y/pe;if(Ce>1){const fe=Math.sqrt(Ce);I=fe*I,P=fe*P,ge=I*I,pe=P*P}const Fe=ge*y+pe*q,L=(ge*pe-Fe)/Fe;let M=Math.sqrt(Math.max(0,L));ie===me&&(M=-M);const X=M*I*ce/P,j=-M*P*Q/I,le=Math.cos(B)*X-Math.sin(B)*j+(R.x+H.x)/2,xe=Math.sin(B)*X+Math.cos(B)*j+(R.y+H.y)/2,ye=o(1,0,(Q-X)/I,(ce-j)/P),he=o((Q-X)/I,(ce-j)/P,(-Q-X)/I,(-ce-j)/P)%(Math.PI*2);D.currentPath.absellipse(le,xe,I,P,ye,ye+he,me===0,B)}function o(D,I,P,B){const ie=D*P+I*B,me=Math.sqrt(D*D+I*I)*Math.sqrt(P*P+B*B);let R=Math.acos(Math.max(-1,Math.min(1,ie/me)));return D*B-I*P<0&&(R=-R),R}function l(D){const I=v(D.getAttribute("x")||0),P=v(D.getAttribute("y")||0),B=v(D.getAttribute("rx")||D.getAttribute("ry")||0),ie=v(D.getAttribute("ry")||D.getAttribute("rx")||0),me=v(D.getAttribute("width")),R=v(D.getAttribute("height")),H=1-.551915024494,O=new xi;return O.moveTo(I+B,P),O.lineTo(I+me-B,P),(B!==0||ie!==0)&&O.bezierCurveTo(I+me-B*H,P,I+me,P+ie*H,I+me,P+ie),O.lineTo(I+me,P+R-ie),(B!==0||ie!==0)&&O.bezierCurveTo(I+me,P+R-ie*H,I+me-B*H,P+R,I+me-B,P+R),O.lineTo(I+B,P+R),(B!==0||ie!==0)&&O.bezierCurveTo(I+B*H,P+R,I,P+R-ie*H,I,P+R-ie),O.lineTo(I,P+ie),(B!==0||ie!==0)&&O.bezierCurveTo(I,P+ie*H,I+B*H,P,I+B,P),O}function c(D){function I(me,R,H){const O=v(R),Z=v(H);ie===0?B.moveTo(O,Z):B.lineTo(O,Z),ie++}const P=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,B=new xi;let ie=0;return D.getAttribute("points").replace(P,I),B.currentPath.autoClose=!0,B}function h(D){function I(me,R,H){const O=v(R),Z=v(H);ie===0?B.moveTo(O,Z):B.lineTo(O,Z),ie++}const P=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,B=new xi;let ie=0;return D.getAttribute("points").replace(P,I),B.currentPath.autoClose=!1,B}function f(D){const I=v(D.getAttribute("cx")||0),P=v(D.getAttribute("cy")||0),B=v(D.getAttribute("r")||0),ie=new mi;ie.absarc(I,P,B,0,Math.PI*2);const me=new xi;return me.subPaths.push(ie),me}function u(D){const I=v(D.getAttribute("cx")||0),P=v(D.getAttribute("cy")||0),B=v(D.getAttribute("rx")||0),ie=v(D.getAttribute("ry")||0),me=new mi;me.absellipse(I,P,B,ie,0,Math.PI*2);const R=new xi;return R.subPaths.push(me),R}function d(D){const I=v(D.getAttribute("x1")||0),P=v(D.getAttribute("y1")||0),B=v(D.getAttribute("x2")||0),ie=v(D.getAttribute("y2")||0),me=new xi;return me.moveTo(I,P),me.lineTo(B,ie),me.currentPath.autoClose=!1,me}function g(D){const I="http://www.w3.org/1999/xlink",P=D.querySelectorAll("linearGradient, radialGradient"),B=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],ie={};for(const R of P){const H=R.getAttribute("id");if(!H)continue;const O={type:R.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},Z=R.getAttributeNS(I,"href")||R.getAttribute("href")||"";Z.startsWith("#")&&(O.href=Z.substring(1));for(const ce of B)R.hasAttribute(ce)&&(O.attrs[ce]=R.getAttribute(ce));const Q=R.querySelectorAll("stop");if(Q.length>0){O.stops=[];for(const ce of Q){let ge=ce.getAttribute("stop-color");!ge&&ce.style&&(ge=ce.style["stop-color"]),ge||(ge="#000");let pe=ce.getAttribute("stop-opacity");(pe===null||pe==="")&&ce.style&&(pe=ce.style["stop-opacity"]),pe=pe===null||pe===""||pe===void 0?1:Math.max(0,Math.min(1,parseFloat(pe)));const q=Math.max(0,Math.min(1,parseFloat(ce.getAttribute("offset")||"0")));O.stops.push({offset:q,color:ge,opacity:pe})}}ie[H]=O}function me(R,H){const O=ie[R];if(!O||H.has(R))return O;if(H.add(R),O.href&&ie[O.href]){const Z=me(O.href,H);if(Z){O.stops||(O.stops=Z.stops);for(const Q in Z.attrs)Q in O.attrs||(O.attrs[Q]=Z.attrs[Q])}}return O}for(const R in ie)me(R,new Set);for(const R in ie){let ce=function(ge){return typeof ge!="string"?0:ge.endsWith("%")?parseFloat(ge)/100:v(ge)};const H=ie[R],O=H.attrs,Z=O.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",Q={type:H.type,gradientUnits:Z,spreadMethod:O.spreadMethod==="reflect"||O.spreadMethod==="repeat"?O.spreadMethod:"pad",gradientTransform:null,stops:(H.stops||[]).slice().sort((ge,pe)=>ge.offset-pe.offset)};if(O.gradientTransform&&(Q.gradientTransform=new qe,C(O.gradientTransform,Q.gradientTransform)),H.type==="linearGradient")Q.x1=O.x1!==void 0?ce(O.x1):0,Q.y1=O.y1!==void 0?ce(O.y1):0,Q.x2=O.x2!==void 0?ce(O.x2):Z==="objectBoundingBox"?1:0,Q.y2=O.y2!==void 0?ce(O.y2):0;else{const ge=Z==="objectBoundingBox"?.5:0,pe=Z==="objectBoundingBox"?.5:0;Q.cx=O.cx!==void 0?ce(O.cx):ge,Q.cy=O.cy!==void 0?ce(O.cy):ge,Q.r=O.r!==void 0?ce(O.r):pe,Q.fx=O.fx!==void 0?ce(O.fx):Q.cx,Q.fy=O.fy!==void 0?ce(O.fy):Q.cy}$[R]=Q}}function x(D,I){I=Object.assign({},I);let P={};if(D.hasAttribute("class")){const R=D.getAttribute("class").split(/\s/).filter(Boolean).map(H=>H.trim());for(let H=0;H<R.length;H++)P=Object.assign(P,ne["."+R[H]])}D.hasAttribute("id")&&(P=Object.assign(P,ne["#"+D.getAttribute("id")]));function B(R,H,O){O===void 0&&(O=function(Q){return Q}),D.hasAttribute(R)&&(I[H]=O(D.getAttribute(R))),P[H]&&(I[H]=O(P[H])),D.style&&D.style[R]!==""&&(I[H]=O(D.style[R]))}function ie(R){return Math.max(0,Math.min(1,v(R)))}function me(R){return Math.max(0,v(R))}return B("fill","fill"),B("fill-opacity","fillOpacity",ie),B("fill-rule","fillRule"),B("opacity","opacity",ie),B("stroke","stroke"),B("stroke-opacity","strokeOpacity",ie),B("stroke-width","strokeWidth",me),B("stroke-linejoin","strokeLineJoin"),B("stroke-linecap","strokeLineCap"),B("stroke-miterlimit","strokeMiterLimit",me),B("visibility","visibility"),I}function m(D,I){return D-(I-D)}function p(D,I,P){if(typeof D!="string")throw new TypeError("Invalid input: "+typeof D);const B={WHITESPACE:/[ \t\r\n]/,DIGIT:/[\d]/,SIGN:/[-+]/,POINT:/\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},ie=0,me=1,R=2,H=3;let O=ie,Z=!0,Q="",ce="";const ge=[];function pe(Fe,L,M){const X=new SyntaxError('Unexpected character "'+Fe+'" at index '+L+".");throw X.partial=M,X}function q(){Q!==""&&(ce===""?ge.push(Number(Q)):ge.push(Number(Q)*Math.pow(10,Number(ce)))),Q="",ce=""}let y;const Ce=D.length;for(let Fe=0;Fe<Ce;Fe++){if(y=D[Fe],Array.isArray(I)&&I.includes(ge.length%P)&&B.FLAGS.test(y)){O=me,Q=y,q();continue}if(O===ie){if(B.WHITESPACE.test(y))continue;if(B.DIGIT.test(y)||B.SIGN.test(y)){O=me,Q=y;continue}if(B.POINT.test(y)){O=R,Q=y;continue}B.COMMA.test(y)&&(Z&&pe(y,Fe,ge),Z=!0)}if(O===me){if(B.DIGIT.test(y)){Q+=y;continue}if(B.POINT.test(y)){Q+=y,O=R;continue}if(B.EXP.test(y)){O=H;continue}B.SIGN.test(y)&&Q.length===1&&B.SIGN.test(Q[0])&&pe(y,Fe,ge)}if(O===R){if(B.DIGIT.test(y)){Q+=y;continue}if(B.EXP.test(y)){O=H;continue}B.POINT.test(y)&&Q[Q.length-1]==="."&&pe(y,Fe,ge)}if(O===H){if(B.DIGIT.test(y)){ce+=y;continue}if(B.SIGN.test(y)){if(ce===""){ce+=y;continue}ce.length===1&&B.SIGN.test(ce)&&pe(y,Fe,ge)}}B.WHITESPACE.test(y)?(q(),O=ie,Z=!1):B.COMMA.test(y)?(q(),O=ie,Z=!0):B.SIGN.test(y)?(q(),O=me,Q=y):B.POINT.test(y)?(q(),O=R,Q=y):pe(y,Fe,ge)}return q(),ge}const b=["mm","cm","in","pt","pc","px"],S={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function v(D){let I="px";if(typeof D=="string"||D instanceof String)for(let B=0,ie=b.length;B<ie;B++){const me=b[B];if(D.endsWith(me)){I=me,D=D.substring(0,D.length-me.length);break}}let P;return I==="px"&&t.defaultUnit!=="px"?P=S.in[t.defaultUnit]/t.defaultDPI:(P=S[I][t.defaultUnit],P<0&&(P=S[I].in*t.defaultDPI)),P*parseFloat(D)}function w(D){if(!(D.hasAttribute("transform")||D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))))return null;const I=T(D);return K.length>0&&I.premultiply(K[K.length-1]),Se.copy(I),K.push(I),I}function T(D){const I=new qe;if(D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))){const P=v(D.getAttribute("x")||0),B=v(D.getAttribute("y")||0);I.makeTranslation(P,B)}return D.hasAttribute("transform")&&C(D.getAttribute("transform"),I),I}function C(D,I){const P=re,B=D.split(")");for(let ie=B.length-1;ie>=0;ie--){const me=B[ie].trim();if(me==="")continue;const R=me.indexOf("("),H=me.length;if(R>0&&R<H){const O=me.slice(0,R),Z=p(me.slice(R+1));switch(P.identity(),O){case"translate":if(Z.length>=1){const Q=Z[0];let ce=0;Z.length>=2&&(ce=Z[1]),P.makeTranslation(Q,ce)}break;case"rotate":if(Z.length>=1){let Q=0,ce=0,ge=0;Q=Z[0]*Math.PI/180,Z.length>=3&&(ce=Z[1],ge=Z[2]),se.makeTranslation(-ce,-ge),ue.makeRotation(Q),Ie.multiplyMatrices(ue,se),se.makeTranslation(ce,ge),P.multiplyMatrices(se,Ie)}break;case"scale":if(Z.length>=1){const Q=Z[0];let ce=Q;Z.length>=2&&(ce=Z[1]),P.makeScale(Q,ce)}break;case"skewX":Z.length===1&&P.set(1,Math.tan(Z[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":Z.length===1&&P.set(1,0,0,Math.tan(Z[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":Z.length===6&&P.set(Z[0],Z[2],Z[4],Z[1],Z[3],Z[5],0,0,1);break}I.premultiply(P)}}return I}function _(D,I){function P(R){Me.set(R.x,R.y,1).applyMatrix3(I),R.set(Me.x,Me.y)}function B(R){const H=R.xRadius,O=R.yRadius,Z=Math.cos(R.aRotation),Q=Math.sin(R.aRotation),ce=new U(H*Z,H*Q,0),ge=new U(-O*Q,O*Z,0),pe=ce.applyMatrix3(I),q=ge.applyMatrix3(I),y=re.set(pe.x,q.x,0,pe.y,q.y,0,0,0,1),Ce=se.copy(y).invert(),M=ue.copy(Ce).transpose().multiply(Ce).elements,X=k(M[0],M[1],M[4]),j=Math.sqrt(X.rt1),le=Math.sqrt(X.rt2);if(R.xRadius=1/j,R.yRadius=1/le,R.aRotation=Math.atan2(X.sn,X.cs),!((R.aEndAngle-R.aStartAngle)%(2*Math.PI)<Number.EPSILON)){const ye=se.set(j,0,0,0,le,0,0,0,1),he=ue.set(X.cs,X.sn,0,-X.sn,X.cs,0,0,0,1),fe=ye.multiply(he).multiply(y),be=ke=>{const{x:Ee,y:we}=new U(Math.cos(ke),Math.sin(ke),0).applyMatrix3(fe);return Math.atan2(we,Ee)};R.aStartAngle=be(R.aStartAngle),R.aEndAngle=be(R.aEndAngle),A(I)&&(R.aClockwise=!R.aClockwise)}}function ie(R){const H=G(I),O=z(I);R.xRadius*=H,R.yRadius*=O;const Z=H>Number.EPSILON?Math.atan2(I.elements[1],I.elements[0]):Math.atan2(-I.elements[3],I.elements[4]);R.aRotation+=Z,A(I)&&(R.aStartAngle*=-1,R.aEndAngle*=-1,R.aClockwise=!R.aClockwise)}const me=D.subPaths;for(let R=0,H=me.length;R<H;R++){const Z=me[R].curves;for(let Q=0;Q<Z.length;Q++){const ce=Z[Q];ce.isLineCurve?(P(ce.v1),P(ce.v2)):ce.isCubicBezierCurve?(P(ce.v0),P(ce.v1),P(ce.v2),P(ce.v3)):ce.isQuadraticBezierCurve?(P(ce.v0),P(ce.v1),P(ce.v2)):ce.isEllipseCurve&&(_e.set(ce.aX,ce.aY),P(_e),ce.aX=_e.x,ce.aY=_e.y,F(I)?B(ce):ie(ce))}}}function A(D){const I=D.elements;return I[0]*I[4]-I[1]*I[3]<0}function F(D){const I=D.elements,P=I[0]*I[3]+I[1]*I[4];if(P===0)return!1;const B=G(D),ie=z(D);return Math.abs(P/(B*ie))>Number.EPSILON}function G(D){const I=D.elements;return Math.sqrt(I[0]*I[0]+I[1]*I[1])}function z(D){const I=D.elements;return Math.sqrt(I[3]*I[3]+I[4]*I[4])}function J(D){const I=D.elements,P=I[0]*I[4]-I[1]*I[3];return Math.sqrt(Math.abs(P))}function k(D,I,P){let B,ie,me,R,H;const O=D+P,Z=D-P,Q=Math.sqrt(Z*Z+4*I*I);return O>0?(B=.5*(O+Q),H=1/B,ie=D*H*P-I*H*I):O<0?ie=.5*(O-Q):(B=.5*Q,ie=-.5*Q),Z>0?me=Z+Q:me=Z-Q,Math.abs(me)>2*Math.abs(I)?(H=-2*I/me,R=1/Math.sqrt(1+H*H),me=H*R):Math.abs(I)===0?(me=1,R=0):(H=-.5*me/I,me=1/Math.sqrt(1+H*H),R=H*me),Z>0&&(H=me,me=-R,R=H),{rt1:B,rt2:ie,cs:me,sn:R}}const Y=[],ne={},$={},K=[],re=new qe,se=new qe,ue=new qe,Ie=new qe,_e=new ae,Me=new U,Se=new qe,ze=new DOMParser().parseFromString(e,"image/svg+xml");return g(ze),n(ze.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:Y,gradients:$,xml:ze.documentElement}}static createFillMaterial(e){const t=e.userData.style;if(t.fill===void 0||t.fill==="none")return null;const n=e.color;let r=null;const s=wh.exec(t.fill);if(s){const o=e.userData.gradients&&e.userData.gradients[s[1]];r=Nv(o,e)}const a=new xr({opacity:t.fillOpacity*(t.opacity||1),transparent:!0,side:jt,depthWrite:!1});return r!==null?a.map=r:a.color=n,a}static createStrokeMaterial(e){const t=e.userData.style;return t.stroke===void 0||t.stroke==="none"?null:(wh.test(t.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new xr({color:new Ye().setStyle(t.stroke,Ur),opacity:t.strokeOpacity*(t.opacity||1),transparent:!0,side:jt,depthWrite:!1}))}static createShapes(e){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),e.toShapes()}static getStrokeStyle(e,t,n,r,s){return e=e!==void 0?e:1,t=t!==void 0?t:"#000",n=n!==void 0?n:"miter",r=r!==void 0?r:"butt",s=s!==void 0?s:4,{strokeColor:t,strokeWidth:e,strokeLineJoin:n,strokeLineCap:r,strokeMiterLimit:s}}static pointsToStroke(e,t,n,r){const s=[],a=[],o=[];if(Xo.pointsToStrokeWithBuffers(e,t,n,r,s,a,o)===0)return null;const l=new Mt;return l.setAttribute("position",new st(s,3)),l.setAttribute("normal",new st(a,3)),l.setAttribute("uv",new st(o,2)),l}static pointsToStrokeWithBuffers(e,t,n,r,s,a,o,l){const c=new ae,h=new ae,f=new ae,u=new ae,d=new ae,g=new ae,x=new ae,m=new ae,p=new ae,b=new ae,S=new ae,v=new ae,w=new ae,T=new ae,C=new ae,_=new ae,A=new ae;n=n!==void 0?n:12,r=r!==void 0?r:.001,l=l!==void 0?l:0,e=me(e);const F=e.length;if(F<2)return 0;const G=e[0].equals(e[F-1]);let z,J=e[0],k;const Y=t.strokeWidth/2,ne=1/(F-1);let $=0,K,re,se,ue,Ie=!1,_e=0,Me=l*3,Se=l*2;ze(e[0],e[1],c).multiplyScalar(Y),m.copy(e[0]).sub(c),p.copy(e[0]).add(c),b.copy(m),S.copy(p);for(let R=1;R<F;R++){z=e[R],R===F-1?G?k=e[1]:k=void 0:k=e[R+1];const H=c;if(ze(J,z,H),f.copy(H).multiplyScalar(Y),v.copy(z).sub(f),w.copy(z).add(f),K=$+ne,re=!1,k!==void 0){ze(z,k,h),f.copy(h).multiplyScalar(Y),T.copy(z).sub(f),C.copy(z).add(f),se=!0,f.subVectors(k,J),H.dot(f)<0&&(se=!1),R===1&&(Ie=se),f.subVectors(k,z),f.normalize();const O=Math.abs(H.dot(f));if(O>Number.EPSILON){const Z=Y/O;f.multiplyScalar(-Z),u.subVectors(z,J),d.copy(u).setLength(Z).add(f),_.copy(d).negate();const Q=d.length(),ce=u.length();u.divideScalar(ce),g.subVectors(k,z);const ge=g.length();if(g.divideScalar(ge),u.dot(_)<ce&&g.dot(_)<ge&&(re=!0),A.copy(d).add(z),_.add(z),re){const pe=se?p:m,q=(A.x-pe.x)*(_.y-pe.y)-(A.y-pe.y)*(_.x-pe.x);(se&&q<0||!se&&q>0)&&_.copy(pe)}switch(ue=!1,re?se?(C.copy(_),w.copy(_)):(T.copy(_),v.copy(_)):I(),t.strokeLineJoin){case"bevel":P(se,re,K);break;case"round":B(se,re),se?D(z,v,T,K,0):D(z,C,w,K,1);break;case"miter":case"miter-clip":default:const pe=Y*t.strokeMiterLimit/Q;if(pe<1)if(t.strokeLineJoin!=="miter-clip"){P(se,re,K);break}else B(se,re),se?(g.subVectors(A,v).multiplyScalar(pe).add(v),x.subVectors(A,T).multiplyScalar(pe).add(T),N(v,K,0),N(g,K,0),N(z,K,.5),N(z,K,.5),N(g,K,0),N(x,K,0),N(z,K,.5),N(x,K,0),N(T,K,0)):(g.subVectors(A,w).multiplyScalar(pe).add(w),x.subVectors(A,C).multiplyScalar(pe).add(C),N(w,K,1),N(g,K,1),N(z,K,.5),N(z,K,.5),N(g,K,1),N(x,K,1),N(z,K,.5),N(x,K,1),N(C,K,1));else re?(se?(N(p,$,1),N(m,$,0),N(A,K,0),N(p,$,1),N(A,K,0),N(_,K,1)):(N(p,$,1),N(m,$,0),N(A,K,1),N(m,$,0),N(_,K,0),N(A,K,1)),se?T.copy(A):C.copy(A)):se?(N(v,K,0),N(A,K,0),N(z,K,.5),N(z,K,.5),N(A,K,0),N(T,K,0)):(N(w,K,1),N(A,K,1),N(z,K,.5),N(z,K,.5),N(A,K,1),N(C,K,1)),ue=!0;break}}else I()}else I();!G&&R===F-1&&ie(e[0],b,S,se,!0,$),$=K,J=z,m.copy(T),p.copy(C)}if(!G)ie(z,v,w,se,!1,K);else if(re&&s){let R=A,H=_;Ie!==se&&(R=_,H=A),se?(ue||Ie)&&(H.toArray(s,0),H.toArray(s,9),ue&&R.toArray(s,3)):(ue||!Ie)&&(H.toArray(s,3),H.toArray(s,9),ue&&R.toArray(s,0))}if(s){const R=[new ae,new ae,new ae],H=l*3;for(let O=H;O<Me;O+=9)R[0].set(s[O],s[O+1]),R[1].set(s[O+3],s[O+4]),R[2].set(s[O+6],s[O+7]),Zn.area(R)<0&&(s[O+3]=R[0].x,s[O+4]=R[0].y)}return _e;function ze(R,H,O){return O.subVectors(H,R),O.set(-O.y,O.x).normalize()}function N(R,H,O){s&&(s[Me]=R.x,s[Me+1]=R.y,s[Me+2]=0,a&&(a[Me]=0,a[Me+1]=0,a[Me+2]=1),Me+=3,o&&(o[Se]=H,o[Se+1]=O,Se+=2)),_e+=3}function D(R,H,O,Z,Q){c.copy(H).sub(R).normalize(),h.copy(O).sub(R).normalize();let ce=Math.PI;const ge=c.dot(h);Math.abs(ge)<1&&(ce=Math.abs(Math.acos(ge))),ce/=n,f.copy(H);for(let pe=0,q=n-1;pe<q;pe++)u.copy(f).rotateAround(R,ce),N(f,Z,Q),N(u,Z,Q),N(R,Z,.5),f.copy(u);N(f,Z,Q),N(O,Z,Q),N(R,Z,.5)}function I(){N(p,$,1),N(m,$,0),N(v,K,0),N(p,$,1),N(v,K,0),N(w,K,1)}function P(R,H,O){H?R?(N(p,$,1),N(m,$,0),N(v,K,0),N(p,$,1),N(v,K,0),N(_,K,1),N(v,O,0),N(T,O,0),N(_,O,.5)):(N(p,$,1),N(m,$,0),N(w,K,1),N(m,$,0),N(_,K,0),N(w,K,1),N(w,O,1),N(_,O,0),N(C,O,1)):R?(N(v,O,0),N(T,O,0),N(z,O,.5)):(N(w,O,1),N(C,O,0),N(z,O,.5))}function B(R,H){H&&(R?(N(p,$,1),N(m,$,0),N(v,K,0),N(p,$,1),N(v,K,0),N(_,K,1),N(v,$,0),N(z,K,.5),N(_,K,1),N(z,K,.5),N(T,$,0),N(_,K,1)):(N(p,$,1),N(m,$,0),N(w,K,1),N(m,$,0),N(_,K,0),N(w,K,1),N(w,$,1),N(_,K,0),N(z,K,.5),N(z,K,.5),N(_,K,0),N(C,$,1)))}function ie(R,H,O,Z,Q,ce){switch(t.strokeLineCap){case"round":Q?D(R,O,H,ce,.5):D(R,H,O,ce,.5);break;case"square":if(Q)c.subVectors(H,R),h.set(c.y,-c.x),f.addVectors(c,h).add(R),u.subVectors(h,c).add(R),Z?(f.toArray(s,3),u.toArray(s,0),u.toArray(s,9)):(f.toArray(s,3),o[7]===1?u.toArray(s,9):f.toArray(s,9),u.toArray(s,0));else{c.subVectors(O,R),h.set(c.y,-c.x),f.addVectors(c,h).add(R),u.subVectors(h,c).add(R);const ge=s.length;Z?(f.toArray(s,ge-3),u.toArray(s,ge-6),u.toArray(s,ge-12)):(u.toArray(s,ge-6),f.toArray(s,ge-3),u.toArray(s,ge-12))}break}}function me(R){let H=!1;for(let Z=1,Q=R.length-1;Z<Q;Z++)if(R[Z].distanceTo(R[Z+1])<r){H=!0;break}if(!H)return R;const O=[];O.push(R[0]);for(let Z=1,Q=R.length-1;Z<Q;Z++)R[Z].distanceTo(R[Z+1])>=r&&O.push(R[Z]);return O.push(R[R.length-1]),O}}}const wh=/^\s*url\(\s*(?:["']\s*)?#([^)'"\s]+)(?:\s*["'])?\s*\)\s*$/;function Nv(i,e,t=256){if(!i||!Array.isArray(i.stops)||i.stops.length===0)return null;const n=e.userData.transform,r=i.gradientUnits==="objectBoundingBox";let s=null;if(r&&(s=Uv(e,n),s===null))return null;function a(f,u,d){d.set(f,u,1),i.gradientTransform&&d.applyMatrix3(i.gradientTransform),r&&d.set(s.minX+d.x*s.width,s.minY+d.y*s.height,1),n&&d.applyMatrix3(n)}const o=document.createElement("canvas");let l;if(i.type==="linearGradient"){o.width=t,o.height=1;const f=o.getContext("2d"),u=f.createLinearGradient(0,0,t,0);Eh(u,i.stops),f.fillStyle=u,f.fillRect(0,0,t,1);const d=new U,g=new U;a(i.x1,i.y1,d),a(i.x2,i.y2,g);const x=g.x-d.x,m=g.y-d.y,p=x*x+m*m||1e-20,b=x/p,S=m/p,v=-(b*d.x+S*d.y);l=new qe().set(b,S,v,0,0,.5,0,0,1)}else{let f=i.cx,u=i.cy,d=i.fx,g=i.fy,x=i.r;if(i.gradientTransform){const _=new U;_.set(f,u,1).applyMatrix3(i.gradientTransform),f=_.x,u=_.y,_.set(d,g,1).applyMatrix3(i.gradientTransform),d=_.x,g=_.y}if(r&&(f=s.minX+f*s.width,u=s.minY+u*s.height,d=s.minX+d*s.width,g=s.minY+g*s.height,x=x*Math.sqrt((s.width*s.width+s.height*s.height)/2)),x<=0)return null;o.width=t,o.height=t;const m=o.getContext("2d"),p=f-x,b=u-x,S=2*x,v=t/S;m.setTransform(v,0,0,v,-p*v,-b*v);const w=m.createRadialGradient(d,g,0,f,u,x);Eh(w,i.stops),m.fillStyle=w,m.fillRect(p,b,S,S);const T=n?n.clone().invert():new qe;l=new qe().set(1/S,0,-p/S,0,1/S,-b/S,0,0,1).multiply(T)}const c=new yo(o);c.colorSpace=Ur,c.flipY=!1,c.matrixAutoUpdate=!1,c.matrix=l;const h=i.spreadMethod==="reflect"?Yr:i.spreadMethod==="repeat"?qr:_n;return c.wrapS=h,c.wrapT=h,c}function Uv(i,e){const t=e?e.clone().invert():null,n=new ae,r=new Ic;for(const s of i.subPaths)for(const a of s.getPoints())n.copy(a),t&&n.applyMatrix3(t),r.expandByPoint(n);return r.isEmpty()?null:{minX:r.min.x,minY:r.min.y,width:r.max.x-r.min.x,height:r.max.y-r.min.y}}function Eh(i,e){const t=new Ye;for(const n of e){let r=n.color;if(n.opacity<1){t.setStyle(n.color,Ur);const s=/rgb\(([^)]+)\)/.exec(t.getStyle(Ur));s&&(r=`rgba(${s[1]},${n.opacity})`)}i.addColorStop(Math.max(0,Math.min(1,n.offset)),r)}}const qo={width:64,height:64},Th="M32.3 17.92q.54-.07 1.03.17c.42.21.65.58.73.96q.1.54-.1 1.02l-.18.74a13 13 0 0 1 7.57 3.76l.1.11q3.79-.23 7.58.01l1 .09q3.45.33 5.44 1.22c1.52.68 2.48 1.67 2.62 3 .15 1.48-.71 3.05-2.3 4.63a28 28 0 0 1-5.93 4.31A53 53 0 0 1 43 41.2v.01l-.03.01q-.72 1.09-1.63 2.01a12.9 12.9 0 0 1-16.19 1.83c-2.67.28-5.55.5-8.23.5h-.08c-2.8 0-5.12-.23-6.85-.7-2.08-.56-3.51-1.53-3.95-3q-.43-1.5.43-3.05l.11-.2c.6-.98 1.53-1.9 2.6-2.75 1.17-.9 2.52-1.73 3.88-2.46a42 42 0 0 1 6.44-2.8 13 13 0 0 1 4-6.59l-.58-.41v-.01h-.01a1.7 1.7 0 0 1-.66-1.67c.06-.44.3-.75.62-.94.3-.18.65-.24.96-.22h.09l1.95.3.6-1.52c.02-.07.1-.27.27-.48s.46-.48.89-.54h.01a1.5 1.5 0 0 1 1.24.4l.93.83 1.52-1.38q.41-.37.97-.44m7.33 24.48a48 48 0 0 1-6.28 1.54c-1.3.22-3 .48-4.95.73a11.1 11.1 0 0 0 11.23-2.27m9.28-15.92q-3.01-.2-6.02-.07.51.75.92 1.59c1.08.1 1.94.47 2.25 1.32.25.68-.01 1.36-.29 1.84-.22.39-.5.72-.72.96v.01l-.18.18-.14.13-.2.21-.72.76v-.06l-.37.34-.01-.05c-2.28 1.84-5.57 3.37-9.46 4.4a36 36 0 0 1-11.83 1.23l.01.02-.43-.06v.02l-.5-.09.02.04-.7-.15h-.01l-.2-.05-.15-.03-.1-.02q-.9-.22-1.5-.59a2 2 0 0 1-.82-.98l-.05-.18c-.14-.69.2-1.28.54-1.69.26-.3.56-.55.8-.73q-.03-1.08.06-2.16a40 40 0 0 0-4.36 1.9l-.7.37c-4.03 2.14-5.5 3.82-6.02 4.78-.36.65-.42 1.19-.28 1.67l.06.17c.19.41.66.92 1.85 1.36 1.36.5 3.6.88 7.19.88h.08c2.36 0 4.9-.17 7.3-.4l.03-.01.57-.06.19-.02.3-.03h.1c3.02-.34 5.77-.75 7.63-1.05l1.14-.22a47 47 0 0 0 7.6-2.2v-.01l.17-.06.4-.16.18-.07.55-.22 1.25-.54v.01q2.38-1.05 4.65-2.32a27 27 0 0 0 5.56-4.02c1.34-1.34 1.85-2.43 1.77-3.19-.06-.6-.62-1.23-2.13-1.77a21 21 0 0 0-5.28-.93m-14.95-3.06c.33.38.42.99.34 1.51-.06.45-.33.75-.6.94a2 2 0 0 1-.8.3h-.09l-3 .13-2.3 1.44h-.02q-.46.27-1 .26a3 3 0 0 1-.5-.05c-.4-.1-.66-.34-.83-.6-.15-.23-.23-.5-.25-.7v-.08l-.03-1.41a11.6 11.6 0 0 0-3.73 6.2c-.45 1.99-.36 4.06.25 6q.34.06.75.1c3.17.33 7.42-.1 11.37-1.14 4.25-1.14 7.62-2.85 9.61-4.8q-.19-.9-.51-1.77h-.04l-.12-.33-.09-.25a11 11 0 0 0-1.87-2.88l-.03-.04-.02-.02-.83-.84a11 11 0 0 0-6.21-2.82zm-3.72-1.64-.1.09h-.01l-.31.29-.2-.19-.2-.16-1.42-1.3-.67 1.74-.13.36-.02.05-.15.38-.3-.05h-.01l-.15-.02-1.78-.27.49.34.52.37.15.1.49.35.2.15.01.25.03 1.87 2.47-1.54.11-.07.13-.01 3.08-.14-.9-1.4-.12-.18.05-.21.19-.72.04-.17.09-.36.06-.25v-.01l.1-.39.17-.64z",Fr=256,Gs=Math.SQRT2,Ah=[[-1,-1,Gs],[0,-1,1],[1,-1,Gs],[-1,0,1],[1,0,1],[-1,1,Gs],[0,1,1],[1,1,Gs]];class Fv{constructor(){this.indices=[],this.keys=[]}get size(){return this.indices.length}push(e,t){let n=this.indices.length;for(this.indices.push(e),this.keys.push(t);n>0;){const r=n-1>>1;if((this.keys[r]??0)<=t)break;this.swap(n,r),n=r}}pop(){const e=this.indices[0]??0,t=this.keys[0]??0,n=this.indices.pop()??0,r=this.keys.pop()??0;if(this.indices.length>0){this.indices[0]=n,this.keys[0]=r;let s=0;for(;;){const a=s*2+1,o=a+1;let l=s;if(a<this.keys.length&&(this.keys[a]??0)<(this.keys[l]??0)&&(l=a),o<this.keys.length&&(this.keys[o]??0)<(this.keys[l]??0)&&(l=o),l===s)break;this.swap(s,l),s=l}}return{index:e,key:t}}swap(e,t){const n=this.indices[e]??0,r=this.keys[e]??0;this.indices[e]=this.indices[t]??0,this.keys[e]=this.keys[t]??0,this.indices[t]=n,this.keys[t]=r}}function Ov(i,e){let t=e,n=-1;for(let o=0;o<i.length;o+=1){if(i[o]===0)continue;const l=o%e;t=Math.min(t,l),n=Math.max(n,l)}if(n<0)return-1;const r=(t+n)/2,s=Math.max(1,(n-t)*.12);let a=-1;for(let o=0;o<i.length;o+=1)i[o]===0||Math.abs(o%e-r)>s||(a<0||Math.floor(o/e)>Math.floor(a/e))&&(a=o);return a}function Bv(i,e,t){const n=new Float32Array(e*e).fill(1/0);if(t<0||i[t]===0)return n.fill(1);const r=new Fv;for(n[t]=0,r.push(t,0);r.size>0;){const{index:o,key:l}=r.pop();if(l>(n[o]??1/0))continue;const c=o%e,h=Math.floor(o/e);for(const[f,u,d]of Ah){const g=c+f,x=h+u;if(g<0||x<0||g>=e||x>=e)continue;const m=x*e+g;if(i[m]===0)continue;const p=l+d;p<(n[m]??1/0)&&(n[m]=p,r.push(m,p))}}let s=0;for(const o of n)Number.isFinite(o)&&(s=Math.max(s,o));const a=new Float32Array(e*e).fill(-1);for(let o=0;o<a.length;o+=1){const l=n[o]??1/0;i[o]!==0&&(a[o]=Number.isFinite(l)&&s>0?l/s:1)}for(let o=0;o<4;o+=1){const l=a.slice();for(let c=0;c<a.length;c+=1){if((a[c]??0)>=0)continue;const h=c%e,f=Math.floor(c/e);let u=1/0;for(const[d,g]of Ah){const x=h+d,m=f+g;if(x<0||m<0||x>=e||m>=e)continue;const p=a[m*e+x]??-1;p>=0&&(u=Math.min(u,p))}Number.isFinite(u)&&(l[c]=u)}a.set(l)}for(let o=0;o<a.length;o+=1)(a[o]??0)<0&&(a[o]=1);return a}function zv(i){const e=document.createElement("canvas");e.width=i,e.height=i;const t=e.getContext("2d",{willReadFrequently:!0});if(t===null)throw new Error("splash: mark raster canvas is unavailable");t.scale(i/qo.width,i/qo.height),t.fill(new Path2D(Th));const n=t.getImageData(0,0,i,i).data,r=new Uint8Array(i*i);for(let s=0;s<r.length;s+=1)r[s]=(n[s*4+3]??0)>96?1:0;return r}function kv(i,e){const t=new Uint8Array(i.length);for(let r=0;r<i.length;r+=1)t[r]=Math.round(Math.min(1,Math.max(0,i[r]??1))*255);const n=new Mo(t,e,e,Kr,qt);return n.magFilter=Rt,n.minFilter=Rt,n.generateMipmaps=!1,n.needsUpdate=!0,n}function Hv(i){var f,u;const{width:e,height:t}=qo,r=new Xo().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${e} ${t}"><path d="${Th}"/></svg>`).paths.flatMap(d=>d.toShapes().map(g=>new Rr(g,{depth:.9,bevelEnabled:!0,bevelSegments:5,bevelSize:.22,bevelThickness:.38,curveSegments:14}))),s=Mi(r,!1);for(const d of r)d.dispose();const a=s.getAttribute("position"),o=new Float32Array(a.count*2);for(let d=0;d<a.count;d+=1)o[d*2]=a.getX(d)/e,o[d*2+1]=a.getY(d)/t;s.setAttribute("aMarkUv",new Kt(o,2)),s.computeBoundingBox();const l=new U,c=new U;(f=s.boundingBox)==null||f.getCenter(l),(u=s.boundingBox)==null||u.getSize(c),s.translate(-l.x,-l.y,-l.z),s.rotateX(Math.PI);const h=i/c.x;return s.scale(h,h,h),s.computeBoundingBox(),{geometry:s,project:(d,g,x)=>new U((d*e-l.x)*h,-(g*t-l.y)*h,x)}}function Gv(i,e,t,n,r){const s=[];for(let a=0;a<i.length;a+=1)i[a]!==0&&s.push(a);return s.length===0?[]:Array.from({length:n},()=>{const a=s[Math.floor(r()*s.length)]??0;return{u:(a%t+.5)/t,v:(Math.floor(a/t)+.5)/t,travel:e[a]??1}})}function Vv(i,e,t,n){const r=Math.min(1,Math.max(0,i/n));let s=0,a=1;for(let o=0;o<24;o+=1){const l=(s+a)/2;l*l*(3-2*l)<r?s=l:a=l}return e+(s+a)/2*t}const Rh=2*Math.PI/3/Jn.twist.height,Qn=[1.7,.07,.05];function Or(i,e,t){const n=Math.min(1,Math.max(0,(t-i)/(e-i)));return n*n*(3-2*n)}function $e(i,e,t=0){i.hasAttribute("uv")&&i.deleteAttribute("uv");const n=i.getAttribute("position").count,r=new Float32Array(n*4);for(let s=0;s<n;s+=1)r.set([e[0],e[1],e[2],t],s*4);return i.setAttribute("aGlow",new Kt(r,4)),i}function Ei(i){const e=Mi(i,!1);for(const t of i)t.dispose();return e}function Wv(i,e,t,n,r){const s=e.clone().sub(i),a=new yt(n,t,s.length(),r);a.applyQuaternion(new Ln().setFromUnitVectors(new U(0,1,0),s.clone().normalize()));const o=i.clone().add(e).multiplyScalar(.5);return a.translate(o.x,o.y,o.z),a}function Ch(i,e,t,n){return Array.from({length:n+1},(r,s)=>{const a=s/n,o=1-a;return new ae(o*o*i.x+2*o*a*e.x+a*a*t.x,o*o*i.y+2*o*a*e.y+a*a*t.y)})}function jn(i,e,t){return Array.from({length:t+1},(n,r)=>i.clone().lerp(e,r/t))}function Vs(i,e){return i.map(t=>new U(t.x,t.y,typeof e=="number"?e:e(t.y)))}function Xv(){const{height:i}=Jn.pearl,e=[],t=(a,o,l,c)=>{e.push(new vi(c,56,32).translate(a,o,l))};t(0,63,0,17);for(let a=0;a<5;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6;t(Math.cos(o)*6.2,94+a*14,Math.sin(o)*6.2,4.3)}t(0,179,0,15.3),t(0,233,0,5.6);const n=[];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6,l=Math.cos(o)*6.2,c=Math.sin(o)*6.2;n.push(new yt(3,3,182,24).translate(l,91,c));const h=o+Math.PI/3;n.push(Wv(new U(Math.cos(h)*24,0,Math.sin(h)*24),new U(Math.cos(h)*6,50,Math.sin(h)*6),2.9,2.3,20))}n.push(new yt(4.2,4.6,54,28).translate(0,206,0));const r=[[238,262,2.6,2.2],[262,288,1.6,1.3],[288,306,.9,.6],[306,i,.35,.08]];for(const[a,o,l,c]of r)n.push(new yt(c,l,o-a,16).translate(0,(a+o)/2,0)),n.push(new yt(l+.6,l+.6,.7,20).translate(0,a+.35,0));const s=[{offset:[0,i+.4,0],color:Qn,radius:.9,kind:0,trail:0}];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3);s.push({offset:[Math.cos(o)*1.9,288.6,Math.sin(o)*1.9],color:Qn,radius:.6,kind:0,trail:0}),s.push({offset:[Math.cos(o)*3.4,262.6,Math.sin(o)*3.4],color:Qn,radius:.6,kind:0,trail:0})}return{surfaces:[{defines:["PEARL_SPHERE"],geometry:Ei(e)},{defines:["PEARL_COLUMN"],geometry:Ei(n)}],outlines:[],lights:s}}function qv(){const{height:i}=Jn.gate,e=30,t=new Ts;t.moveTo(-48,0),t.lineTo(-17,0),t.lineTo(-17,150),t.absellipse(0,150,17,38,Math.PI,0,!0,0),t.lineTo(17,0),t.lineTo(48,0),t.quadraticCurveTo(47,150,40,i),t.lineTo(-40,i),t.quadraticCurveTo(-47,150,-48,0);const n=new Rr(t,{depth:e,bevelEnabled:!1,curveSegments:32,steps:1});n.translate(0,0,-e/2);const r=e/2+.3,s=[...jn(new ae(-17,0),new ae(-17,150),30),...Array.from({length:41},(o,l)=>{const c=Math.PI-l/40*Math.PI;return new ae(Math.cos(c)*17,150+Math.sin(c)*38)}),...jn(new ae(17,150),new ae(17,0),30)],a=[...Ch(new ae(-48,0),new ae(-47,150),new ae(-40,i),40),...jn(new ae(-40,i),new ae(40,i),30),...Ch(new ae(40,i),new ae(47,150),new ae(48,0),40)];return{surfaces:[{defines:["PLANAR","DIAGRID"],geometry:n}],outlines:[{color:[2.2,.1,.07],radius:.55,points:Vs(s,r)},{color:[.2,1,1.5],radius:.32,points:Vs(a,r)}],lights:[{offset:[-38,i+.6,0],color:Qn,radius:.9,kind:0,trail:0},{offset:[38,i+.6,0],color:Qn,radius:.9,kind:0,trail:0}]}}function Yv(){const{height:i,radius:e}=Jn.twist,t=90,n=132,r=[],s=[],a=u=>{const d=u/t*i,g=e*(1-.42*(d/i)**1.2);for(let x=0;x<n;x+=1){const m=x/n*Math.PI*2,p=g*(1+.085*Math.cos(3*(m-Rh*d)));r.push(Math.cos(m)*p,d,Math.sin(m)*p)}};for(let u=0;u<=t;u+=1)a(u);for(let u=0;u<t;u+=1)for(let d=0;d<n;d+=1){const g=u*n+d,x=u*n+(d+1)%n;s.push(g,g+n,x,x,g+n,x+n)}const o=r.length/3;a(t);const l=r.length/3;r.push(0,i,0);for(let u=0;u<n;u+=1)s.push(l,o+(u+1)%n,o+u);const c=new Mt;c.setAttribute("position",new st(r,3)),c.setIndex(s),c.computeVertexNormals();const h=e*.58,f=Array.from({length:97},(u,d)=>{const g=d/96*Math.PI*2;return new U(Math.cos(g)*(h+.6),i-1.2,Math.sin(g)*(h+.6))});return{surfaces:[{defines:["TWIST"],geometry:c},{defines:["PEARL_COLUMN"],geometry:new yt(.25,1.1,26,12).translate(0,i+13,0)}],outlines:[{color:[2,.1,.07],radius:.5,points:f}],lights:[{offset:[0,i+26.4,0],color:Qn,radius:.9,kind:0,trail:0}]}}function Zv(){const{height:i}=Jn.opener,e=52,t=.72,n=new Ts;n.moveTo(-26,0),n.lineTo(26,0),n.lineTo(19,i),n.lineTo(-19,i),n.closePath();const r=new mi;r.moveTo(-15,268),r.lineTo(15,268),r.lineTo(12,302),r.lineTo(-12,302),r.closePath(),n.holes.push(r);const s=new Rr(n,{depth:e,bevelEnabled:!1,steps:1});s.translate(0,0,-e/2);const a=s.getAttribute("position");for(let c=0;c<a.count;c+=1)a.setZ(c,a.getZ(c)*(1-t*a.getY(c)/i));s.computeVertexNormals();const o=c=>e/2*(1-t*c/i)+.3,l=[...jn(new ae(-15,268),new ae(15,268),20),...jn(new ae(15,268),new ae(12,302),16),...jn(new ae(12,302),new ae(-12,302),20),...jn(new ae(-12,302),new ae(-15,268),16)];return{surfaces:[{defines:["PLANAR"],geometry:s}],outlines:[{color:[2.1,.32,.08],radius:.45,points:Vs(l,o)},{color:[.2,1,1.5],radius:.3,points:Vs(jn(new ae(-19,i),new ae(19,i),30),o)}],lights:[{offset:[-18,i+.6,0],color:Qn,radius:.9,kind:0,trail:0},{offset:[18,i+.6,0],color:Qn,radius:.9,kind:0,trail:0}]}}const Kv=[{offset:[-.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[0,.12,-2.26],color:[1.6,.06,.04],radius:.2,kind:2,trail:1.1},{offset:[-1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[0,-.6,-.5],color:[.06,.32,.6],radius:1.3,kind:0,trail:0}],$v=[{offset:[-1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[-1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[0,-2,-1.2],color:[.7,.28,.06],radius:1.6,kind:0,trail:0}];function Jv(){const i=new Ge(1.9,.62,4.4,8,4,18);i.deleteAttribute("normal"),i.deleteAttribute("uv");const e=uh(i);i.dispose();const t=e.getAttribute("position");for(let s=0;s<t.count;s+=1){const a=t.getX(s),o=t.getY(s),c=(t.getZ(s)+2.2)/4.4,h=Or(.55,1,c),f=Or(.25,0,c),u=1-.16*(o/.31)**2;t.setX(s,a*u*(1-.42*h-.12*f)),t.setY(s,(o>0?o*(1-.55*h):o*(1-.3*h))-.05*h)}e.computeVertexNormals();const n=[$e(e,[0,0,0])],r=new vi(1,28,14,0,Math.PI*2,0,Math.PI/2).scale(.62,.36,1.25).translate(0,.27,.25);n.push($e(r,[.012,.045,.07],1)),n.push($e(new Cr(1,.045,6,28,Math.PI).scale(.63,.37,1).translate(0,.27,.25),[0,0,0]));for(const s of[-1,1]){const a=(o,l,c)=>new yt(o,o,l,20).rotateX(Math.PI/2).translate(s*1.12,-.06,c);n.push($e(new yt(.33,.29,1.7,20).rotateX(Math.PI/2).translate(s*1.12,-.06,-.8),[0,0,0])),n.push($e(a(.36,.1,.06),[.9,0,0],2)),n.push($e(a(.22,.02,.12),[.01,.015,.02])),n.push($e(a(.31,.08,-1.62),[0,0,0])),n.push($e(a(.24,.05,-1.68),[.35,1.6,2.4])),n.push($e(new Ge(.5,.03,1.2).translate(s*1.12,-.37,-.8),[.1,.6,1])),n.push($e(new Ge(.42,.07,.05).translate(s*.5,-.02,2.17),[3,2.9,2.7])),n.push($e(new Ge(.06,.5,.7).rotateZ(s*.35).translate(s*.45,.45,-1.8),[0,0,0])),n.push($e(new Ge(.06,.05,2.2).translate(s*.55,-.335,-.1),[0,0,0])),n.push($e(new Ge(.05,.12,.45).translate(s*.8,0,1),[.01,.012,.015])),n.push($e(new Ge(.03,.025,1.8).translate(s*.925,-.1,-.5),[1.5,0,0],2))}return n.push($e(new Ge(1.4,.06,.04).translate(0,.12,-2.21),[2.8,.12,.08])),n.push($e(new yt(.012,.02,.35,6).translate(.2,.47,-1.5),[0,0,0])),Ei(n)}function Qv(){const i=[$e(new Ge(3.4,2,2.6).translate(0,.1,4),[0,0,0]),$e(new Ge(3,.7,.05).translate(0,.55,5.32),[.01,.03,.04],1),$e(new Ge(3.6,2.6,7.6).translate(0,.2,-1.3),[0,0,0])];for(let e=0;e<7;e+=1)i.push($e(new Ge(3.72,2.7,.12).translate(0,.2,-4.7+e*1.13),[0,0,0]));for(const e of[-1,1]){for(const t of[-1,1])i.push($e(new yt(.5,.42,.7,16).translate(e*1.55,-1.45,-1.3+t*3),[0,0,0])),i.push($e(new yt(.36,.36,.05,16).translate(e*1.55,-1.82,-1.3+t*3),[2.4,.9,.2])),i.push($e(new Ge(.16,.16,.16).translate(e*1.85,1.3,t>0?4.8:-5),[2.6,1.3,.2]));i.push($e(new Ge(.6,.16,.05).translate(e*1.1,-.3,5.32),[3,2.9,2.7])),i.push($e(new Ge(.5,.18,.05).translate(e*1.4,.4,-5.12),[2.8,.12,.08])),i.push($e(new Ge(.07,.74,.08).translate(e*.5,.55,5.34),[0,0,0])),i.push($e(new Ge(.12,.12,7.4).translate(e*1.6,1.56,-1.3),[0,0,0])),i.push($e(new Ge(.04,.05,6.8).translate(e*1.87,-.95,-1.3),[1.3,0,0],2))}return Ei(i)}const jv=[{offset:[-.62,.72,2.28],color:[1.5,1.45,1.35],radius:.12,kind:1,trail:.5},{offset:[.62,.72,2.28],color:[1.5,1.45,1.35],radius:.12,kind:1,trail:.5},{offset:[-.62,.84,-2.28],color:[1.5,.05,.04],radius:.11,kind:2,trail:.9},{offset:[.62,.84,-2.28],color:[1.5,.05,.04],radius:.11,kind:2,trail:.9}];function ex(){const i=new Ge(1.8,.7,4.5,4,3,14);i.deleteAttribute("normal"),i.deleteAttribute("uv");const e=uh(i);i.dispose();const t=e.getAttribute("position");for(let a=0;a<t.count;a+=1){const o=t.getX(a),l=t.getY(a),c=t.getZ(a)/2.25,h=Or(.55,1,c),f=Or(-.6,-1,c);t.setX(a,o*(1-.1*(l/.35)**2)*(1-.06*h)),l>0&&t.setY(a,l*(1-.35*h-.25*f))}e.computeVertexNormals(),e.translate(0,.63,0);const n=new Ge(1.56,.5,2.3,2,1,4),r=n.getAttribute("position");for(let a=0;a<r.count;a+=1){if(r.getY(a)<=0)continue;const o=r.getZ(a);r.setX(a,r.getX(a)*.82),r.setZ(a,o>0?o-.45:o+.3)}n.computeVertexNormals();const s=[$e(e,[0,0,0]),$e(n.translate(0,1.23,-.2),[.004,.006,.008],1),$e(new Ge(1.3,.04,1.5).translate(0,1.49,-.27),[0,0,0]),$e(new Ge(.8,.14,.03).translate(0,.55,2.27),[0,0,0],3),$e(new Ge(1.76,.14,.12).translate(0,.36,2.26),[0,0,0],3),$e(new Ge(1.76,.14,.12).translate(0,.36,-2.26),[0,0,0],3),$e(new Ge(.42,.12,.02).translate(0,.52,-2.28),[.4,.38,.32])];for(const a of[-1,1]){for(const o of[-1,1]){const l=new yt(.33,.33,.24,16).rotateZ(Math.PI/2).translate(a*.8,.33,o*1.4);s.push($e(l,[0,0,0],3))}s.push($e(new Ge(.36,.1,.04).translate(a*.62,.72,2.26),[2.6,2.5,2.3])),s.push($e(new Ge(.42,.08,.04).translate(a*.62,.84,-2.26),[2.2,.06,.04])),s.push($e(new Ge(.16,.1,.12).translate(a*.95,1.02,.55),[0,0,0]))}return Ei(s)}const tx=[{offset:[-10.6,4.2,0],color:[1.6,.07,.05],radius:.4,kind:0,trail:0},{offset:[-10.6,-4.2,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[-10.6,0,4.2],color:[.1,1.2,.8],radius:.35,kind:0,trail:0},{offset:[-10.6,0,-4.2],color:[1.6,.07,.05],radius:.35,kind:0,trail:0},{offset:[11.9,0,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[0,-6,0],color:[1,.7,.45],radius:.9,kind:0,trail:0}],rn={y:.4,z:4.9,width:13,height:4.4};function nx(i,e){const t=i/2,n=[$e(new vi(1,48,24).scale(t,e,e),[0,0,0])],r=e*.55,s=[[r,0,.16,3.4],[-r,0,.16,3.4],[0,r,3.4,.16],[0,-r,3.4,.16]];for(const[o,l,c,h]of s)n.push($e(new Ge(2.8,h,c).translate(-t+1.6,o,l),[0,0,0]));n.push($e(new Ge(5.2,1.4,2).translate(0,-e-.55,0),[0,0,0])),n.push($e(new Ge(4.6,.42,2.06).translate(0,-e-.4,0),[1.4,.95,.55]));const a=new Ge(rn.width+.5,rn.height+.5,.3);return n.push($e(a.translate(0,rn.y,rn.z-.2),[0,0,0])),n.push($e(new Ge(.3,.3,1.6).translate(-4,rn.y,rn.z-1.1),[0,0,0])),n.push($e(new Ge(.3,.3,1.6).translate(4,rn.y,rn.z-1.1),[0,0,0])),Ei(n)}function ix(){const i=(Si.cars*(Si.carLength+Si.gap)-Si.gap)/2;return[-.9,.9].flatMap(e=>[{offset:[i+.2,-.6,e],color:[1.7,1.6,1.45],radius:.3,kind:0,trail:0},{offset:[-i-.2,-.6,e],color:[1.6,.06,.04],radius:.28,kind:0,trail:0}])}function rx(){const{cars:i,carLength:e,gap:t}=Si,n=[];for(let r=0;r<i;r+=1){const s=(r-(i-1)/2)*(e+t),a=new Ge(e,3.3,3.4,12,2,2),o=r===i-1?1:r===0?-1:0;if(o!==0){const l=a.getAttribute("position");for(let c=0;c<l.count;c+=1){const h=Or(e/2-6,e/2,l.getX(c)*o);l.getY(c)>0&&l.setY(c,l.getY(c)*(1-.75*h)),l.setZ(c,l.getZ(c)*(1-.35*h))}a.computeVertexNormals()}n.push($e(a.translate(s,0,0),[0,0,0]));for(const l of[-1,1]){const c=new Ge(e-(o===0?2:7),.8,.04);n.push($e(c.translate(s-o*2.5,.35,l*1.72),[1.6,1.15,.7])),n.push($e(new Ge(e-1,.05,.12).translate(s,1.62,l*1.3),[.8,.05,.04]))}n.push($e(new Ge(e-1,.06,2.8).translate(s,-1.68,0),[.2,1.2,1.8]))}return Ei(n)}const ei='"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',Qi='"Montserrat", "Segoe UI", "Helvetica Neue", sans-serif',Ph={glow:"#ff2b3a",core:"#ffd9d4"},Lh={glow:"#29d6ff",core:"#e4fbff"},Ih={glow:"#ff4fa0",core:"#ffe2ef"},sx=[{glyphs:"达人搜索",ink:Ph,caption:"KOL SEARCH"},{glyphs:"达人画像",ink:Lh,caption:"PROFILE"},{glyphs:"受众洞察",ink:Ih,caption:"AUDIENCE"},{glyphs:"假粉检测",ink:{glow:"#ffae2e",core:"#fff2d8"},caption:"FAKE CHECK"},{glyphs:"一键建联",ink:{glow:"#3dffd0",core:"#e2fff6"},caption:"OUTREACH"},{glyphs:"种草投放",ink:Ph,caption:"CAMPAIGN"},{glyphs:"爆款追踪",ink:{glow:"#b58cff",core:"#efe6ff"},caption:"TRENDING"},{glyphs:"数据复盘",ink:Lh,caption:"ANALYTICS"}],Ws={width:256,height:1024},Br={width:1024,height:512};function Dh(i,e){const t=document.createElement("canvas");t.width=i,t.height=e;const n=t.getContext("2d");if(n===null)throw new Error("splash: signage canvas is unavailable");return{canvas:t,context:n}}function Xs(i,e,t,n){i.save(),i.shadowColor=e.glow,i.shadowBlur=n*3.2,i.strokeStyle=e.glow,i.lineWidth=n,i.lineJoin="round",i.lineCap="round",t("stroke"),i.shadowBlur=n*1.2,i.fillStyle=e.core,i.strokeStyle=e.core,i.lineWidth=n*.34,t("fill"),i.restore()}function ax(i,e,t){const{width:n,height:r}=Ws,s=14;i.fillStyle="#07040a",i.fillRect(e,0,n,r);const a=i.createLinearGradient(e,0,e+n,0);a.addColorStop(0,"#0d0710"),a.addColorStop(.5,"#160b17"),a.addColorStop(1,"#0d0710"),i.fillStyle=a,i.fillRect(e+s,s,n-s*2,r-s*2);const o=s+12;Xs(i,t.ink,()=>{i.strokeRect(e+o,o,n-o*2,r-o*2)},7);const l=Array.from(t.glyphs),c=720/Math.max(1,l.length);i.textAlign="center",i.textBaseline="middle",i.font=`700 ${Math.min(168,Math.floor(c*.84))}px ${ei}`,l.forEach((h,f)=>{const u=80+c*(f+.5);Xs(i,t.ink,d=>{d==="stroke"?i.strokeText(h,e+n/2,u):i.fillText(h,e+n/2,u)},8)}),Xs(i,t.ink,()=>{i.beginPath(),i.moveTo(e+62,846),i.lineTo(e+n-62,846),i.stroke()},4),i.font=`600 26px ${Qi}`,i.fillStyle=t.ink.glow,i.shadowColor=t.ink.glow,i.shadowBlur=12,i.fillText(t.caption,e+n/2,900),i.shadowBlur=0}function qs(i,e,t,n,r,s){i.fillStyle=s,i.beginPath(),i.roundRect(e,t,n,r,18),i.fill()}function Yo(i,e,t,n,r){i.textAlign="left",i.font=`800 92px ${ei}`,i.fillStyle="#ffffff",i.shadowColor=n,i.shadowBlur=28,i.fillText(e,r,120),i.font=`600 34px ${ei}`,i.shadowBlur=10,i.fillStyle=n,i.fillText(t,r+4,206),i.shadowBlur=0}function ox(i,e,t){const n=i.createLinearGradient(0,0,e,t);n.addColorStop(0,"#3a0326"),n.addColorStop(.6,"#1a0636"),n.addColorStop(1,"#03141f"),i.fillStyle=n,i.fillRect(0,0,e,t),Yo(i,"AI 达人搜索","全网达人 · 秒级匹配","#ff4fa0",56),qs(i,56,262,520,70,"rgba(255, 255, 255, 0.1)"),i.strokeStyle="#ff9fd0",i.lineWidth=4,i.beginPath(),i.arc(96,297,16,0,Math.PI*2),i.moveTo(108,309),i.lineTo(122,323),i.stroke(),i.font=`500 30px ${ei}`,i.fillStyle="#ffe2ef",i.fillText("美妆 · 10万+粉丝 · 高互动",140,298),["#ff4fa0","#29d6ff","#ffae2e"].forEach((s,a)=>{const o=360+a*46;qs(i,56,o,520,38,"rgba(255, 255, 255, 0.06)"),i.fillStyle=s,i.beginPath(),i.arc(80,o+19,13,0,Math.PI*2),i.fill(),i.fillStyle="rgba(255, 255, 255, 0.55)",i.fillRect(106,o+12,120,14),i.fillStyle=s,i.fillRect(250,o+14,180-a*38,10),i.fillRect(450,o+14,90-a*20,10)});for(let s=0;s<6;s+=1)i.strokeStyle=`rgba(255, 79, 160, ${.5-s*.07})`,i.lineWidth=3,i.beginPath(),i.arc(810,270,60+s*32,0,Math.PI*2),i.stroke();i.fillStyle="#ffe2ef",i.beginPath(),i.arc(810,270,34,0,Math.PI*2),i.fill()}function lx(i,e,t){i.fillStyle="#01141c",i.fillRect(0,0,e,t),Yo(i,"受众洞察","粉丝画像 · 真实度分析","#29d6ff",56);const n=[[.62,"#29d6ff"],[.38,"#ff4fa0"]];let r=-Math.PI/2;for(const[a,o]of n)i.strokeStyle=o,i.lineWidth=34,i.beginPath(),i.arc(190,370,84,r,r+a*Math.PI*2),i.stroke(),r+=a*Math.PI*2;i.textAlign="center",i.font=`700 40px ${Qi}`,i.fillStyle="#e4fbff",i.fillText("62%",190,372),[.34,.86,1,.58,.3,.16].forEach((a,o)=>{const l=190*a;i.fillStyle=o===2?"#3dffd0":"rgba(41, 214, 255, 0.75)",i.fillRect(370+o*62,470-l,40,l)}),i.textAlign="left",i.font=`600 30px ${ei}`,i.fillStyle="#9feaff",i.fillText("真实粉丝",780,300),i.font=`800 96px ${Qi}`,i.fillStyle="#e4fbff",i.shadowColor="#29d6ff",i.shadowBlur=24,i.fillText("92%",770,390),i.shadowBlur=0}function cx(i,e,t){const n=i.createLinearGradient(0,0,0,t);n.addColorStop(0,"#2b0605"),n.addColorStop(1,"#120203"),i.fillStyle=n,i.fillRect(0,0,e,t),Yo(i,"一键建联","AI 写邮件 · 批量触达达人","#ffae2e",56),qs(i,560,56,410,400,"rgba(255, 242, 216, 0.1)"),i.font=`600 28px ${Qi}`,i.fillStyle="#fff2d8",i.textAlign="left",i.fillText("To: creator@mail",596,110),i.fillStyle="rgba(255, 174, 46, 0.5)",i.fillRect(596,136,338,3),[300,338,260,320,210,290].forEach((s,a)=>{i.fillStyle=`rgba(255, 242, 216, ${.55-a*.05})`,i.fillRect(596,170+a*34,s,12)}),qs(i,596,384,160,50,"#ff6a2b"),i.font=`700 28px ${ei}`,i.fillStyle="#ffffff",i.fillText("发送",646,410);for(let s=0;s<9;s+=1){const a=40+s*37%11*12;i.fillStyle=s%3===0?"#ffae2e":"#ff3a2b",i.globalAlpha=.7,i.fillRect(60+s*48,t-50-a,30,a)}i.globalAlpha=1}function hx(i,e,t){i.fillStyle="#0a0216",i.fillRect(0,0,e,t),i.strokeStyle="rgba(255, 79, 160, 0.45)",i.lineWidth=2;for(let r=0;r<=16;r+=1)i.beginPath(),i.moveTo(e/2,280),i.lineTo(-400+r*115,t),i.stroke();for(let r=0;r<6;r+=1){const s=280+(r/5)**2*(t-280);i.beginPath(),i.moveTo(0,s),i.lineTo(e,s),i.stroke()}i.textAlign="left",i.font=`800 84px ${ei}`,i.fillStyle="#e4fbff",i.shadowColor="#29d6ff",i.shadowBlur=26,i.fillText("达人营销",64,100),i.font=`700 40px ${Qi}`,i.fillText("INFLUENCER MARKETING",64,176),i.font=`600 34px ${ei}`,i.fillStyle="#ffd6ea",i.shadowColor="#ff4fa0",i.fillText("种草投放 · 数据复盘",66,236),i.shadowBlur=0;const n=[[600,300],[680,270],[760,280],[840,200],[920,150],[980,80]];Xs(i,Ih,()=>{i.beginPath(),n.forEach(([r,s],a)=>{a===0?i.moveTo(r,s):i.lineTo(r,s)}),i.stroke()},6),i.fillStyle="#ffe2ef";for(const[r,s]of n)i.beginPath(),i.arc(r,s,8,0,Math.PI*2),i.fill();i.font=`800 54px ${Qi}`,i.fillText("ROI 3.6x",700,380)}function ux(i,e,t,n){const{width:r,height:s}=Br;i.save(),i.beginPath(),i.rect(e,t,r,s),i.clip(),i.translate(e,t),i.textBaseline="middle",n===0?ox(i,r,s):n===1?lx(i,r,s):n===2?cx(i,r,s):hx(i,r,s),i.restore()}function Nh(i,e){const t=new yo(i);return t.colorSpace=Xt,t.anisotropy=e,t.needsUpdate=!0,t}function fx(i){const{canvas:e,context:t}=Dh(Ws.width*Ho,Ws.height);return sx.forEach((n,r)=>{ax(t,r*Ws.width,n)}),{texture:Nh(e,i),grid:new ae(Ho,1)}}function dx(i){const t=Math.ceil(Os/2),{canvas:n,context:r}=Dh(Br.width*2,Br.height*t);for(let s=0;s<Os;s+=1)ux(r,s%2*Br.width,Math.floor(s/2)*Br.height,s);return{texture:Nh(n,i),grid:new ae(2,t)}}const zr={concrete:0,tile:1,brick:2},Uh=[zr.concrete,zr.tile,zr.brick],Fh=[[.32,.03,.03],[.04,.16,.08],[.42,.38,.3],[.03,.05,.16],[.45,.16,.02]],Oh=[[.02,.02,.022],[.45,.46,.47],[.28,.29,.31],[.32,.03,.03],[.04,.08,.18],[.55,.42,.06],[.06,.2,.1],[.6,.6,.58]];function kr(i,e){const t=Math.sin(i*12.9898+e*78.233)*43758.5453;return t-Math.floor(t)}function Bh(i){const e=i.facade===Ot.panel;return{floorHeight:3.3+.8*kr(i.seed,1),cellTarget:e?2.1+.9*kr(i.seed,2):1.45+.55*kr(i.seed,3),finish:e?Uh[Math.floor(kr(i.seed,4)*Uh.length)]??zr.concrete:zr.concrete,balconies:e&&kr(i.seed,5)<.35}}function px(i,e){return i/Math.max(1,Math.floor(i/e+.5))}function Zo(i){const e=new Set(i.tiers.filter(t=>t.storefront).map(t=>t.seed));return i.tiers.filter(t=>e.has(t.seed)&&t.form===tn.box&&Math.abs(t.x)-t.width/2<30)}function mx(i){const e=bi(5116399),t=[],n=[],r=[];for(const s of Zo(i)){const a=Math.sign(s.x),o=Math.abs(s.x)-s.width/2,l=m=>a*(o-m),c=m=>a>0?s.z-s.depth/2+m:s.z+s.depth/2-m,h=Bh(s),f=px(s.depth,h.cellTarget),u=Math.round(s.depth/f),d=s.y+s.height,g=[],x=Math.ceil(Math.max(s.y,s.storefront?5.6:0)/h.floorHeight);for(let m=x;(m+1)*h.floorHeight<=d-.3;m+=1)g.push(m*h.floorHeight);if(t.push({x:l(.2),y:d-.3,z:s.z,width:.4,height:.6,depth:s.depth+.4},{x:a*(o+.12),y:d+.55,z:s.z,width:.24,height:1.1,depth:s.depth},{x:a*(o+s.width-.12),y:d+.55,z:s.z,width:.24,height:1.1,depth:s.depth},{x:s.x,y:d+.55,z:s.z+s.depth/2-.12,width:s.width,height:1.1,depth:.24},{x:s.x,y:d+.55,z:s.z-s.depth/2+.12,width:s.width,height:1.1,depth:.24}),s.facade===Ot.glass||s.facade===Ot.ribbon)for(const m of g)t.push({x:l(.16),y:m,z:s.z,width:.32,height:.14,depth:s.depth});else if(s.facade===Ot.panel&&h.balconies)for(const m of g)for(let p=0;p+1<u;p+=2){const b=c((p+1)*f),S=2*f-.3;t.push({x:l(.6),y:m+.09,z:b,width:1.2,height:.18,depth:S},{x:l(.6),y:m+.7,z:b+S/2+.11,width:1.2,height:1.05,depth:.08}),n.push({x:l(1.17),y:m+1.07,z:b,width:.05,height:.05,depth:S},{x:l(1.17),y:m+.5,z:b,width:.03,height:.03,depth:S});for(const v of[-.5,-.17,.17,.5])n.push({x:l(1.17),y:m+.63,z:b+v*S,width:.04,height:.9,depth:.04})}else if(s.facade===Ot.panel){const m=e()<.4&&u>=4?Math.floor(u*.3):-1;g.forEach((p,b)=>{for(let w=0;w<u;w+=1){if(w===m||w===m+1)continue;const T=p+.3*h.floorHeight-.03;if(t.push({x:l(.06),y:T,z:c((w+.5)*f),width:.12,height:.06,depth:.62*f}),e()<.3){const C=p+.06*h.floorHeight+.3;n.push({x:l(.22),y:C,z:c((w+.65)*f),width:.44,height:.6,depth:.82})}}if(m<0)return;const S=c((m+1)*f),v=2*f-.2;n.push({x:l(.55),y:p+.03,z:S,width:1.1,height:.06,depth:v},{x:l(1.08),y:p+1,z:S,width:.04,height:.04,depth:v});for(const w of[-.5,0,.5])n.push({x:l(1.08),y:p+.5,z:S+w*v,width:.04,height:1,depth:.04});if(b+1<g.length){const w=v-.6,T=h.floorHeight,C=(b%2===0?1:-1)*a;n.push({x:l(.8),y:p+T/2,z:S,width:.6,height:.06,depth:Math.hypot(w,T),turnX:-C*Math.atan2(T,w)})}})}if(s.storefront)for(let m=0;(m+1)*6.5<=s.depth;m+=1)e()>=.45||r.push({x:l(.75),y:3.62,z:c((m+.5)*6.5),width:1.5,height:.07,depth:5.2,turnZ:a*.24,tint:Fh[Math.floor(e()*Fh.length)]??[.3,.03,.03]})}return{masonry:t,steel:n,awnings:r}}function gx(){const i=bi(51829),e=(St.start+St.end)/2,t=St.start-St.end+60;return[[1.8,-1,17],[5.05,-1,14],[8.15,-1,11],[-1.8,1,18],[-5.05,1,15],[-8.15,1,12]].flatMap(([r,s,a])=>Array.from({length:7},(o,l)=>({origin:{x:r,y:0,z:e},directionX:0,directionZ:s,speed:a,span:t,phase:(l+.2+i()*.6)*t/7,bob:-1,paint:Oh[Math.floor(i()*Oh.length)]??[.05,.05,.05]})))}function vx(){const i=[];for(let e=St.start;e>St.end;e-=$n.spacing)i.push(e);return i}function Hr(i,e){return Object.values(dn).some(t=>Math.abs(i-t)<yi+e)}function xx(i){const e=bi(48764),t=[],n=[],r=[],s=[],a=[];vx().forEach((o,l)=>{for(const c of[-1,1]){const h=o-$n.spacing/2;l%2===0&&!Hr(h,3)&&t.push({x:c*15.6,y:.45,z:h,width:.45,height:.06,depth:1.8},{x:c*15.85,y:.74,z:h,width:.06,height:.5,depth:1.8},{x:c*15.6,y:.22,z:h-.75,width:.42,height:.44,depth:.06},{x:c*15.6,y:.22,z:h+.75,width:.42,height:.44,depth:.06}),Hr(o-4,1)||t.push({x:c*11.1,y:.47,z:o-4,width:.5,height:.94,depth:.5}),l%3===1&&!Hr(o+6,1)&&n.push({x:c*10.7,y:.31,z:o+6,width:.3,height:.62,depth:.3},{x:c*10.7,y:.66,z:o+6,width:.36,height:.08,depth:.36})}});for(const o of Object.values(dn))for(const l of[-1,1]){for(const h of[6.8,8.2,9.6])for(const f of[-1,1])t.push({x:l*10.45,y:.45,z:o+f*h,width:.2,height:.9,depth:.2});const c=o+l*7.5;t.push({x:l*10.6,y:2.8,z:c,width:.16,height:5.6,depth:.16},{x:l*7.85,y:5.55,z:c,width:5.5,height:.12,depth:.12},{x:l*5.4,y:5.05,z:c,width:.34,height:.95,depth:.3}),s.push({x:l*5.4,y:5.32,z:c+l*.17,color:[1.6,.08,.05],radius:.12},{x:l*5.4,y:4.78,z:c+l*.17,color:[.1,1.3,.55],radius:.12})}for(const o of i.tiers){if(!o.storefront||o.y>0||e()>=.34)continue;const l=Math.sign(o.x),c=Math.abs(o.x)-o.width/2,h=o.z+(e()-.5)*(o.depth-3);Hr(h,1)||(t.push({x:l*(c-.42),y:.95,z:h,width:.8,height:1.9,depth:.95}),r.push({x:l*(c-.83),y:1.08,z:h,width:.03,height:1.4,depth:.8}))}for(const[o,l,c]of[[1,118,0],[-1,32,1]])t.push({x:o*14.2,y:2.65,z:l,width:1.8,height:.08,depth:4.4},{x:o*15.05,y:1.4,z:l,width:.06,height:2.4,depth:4.4},{x:o*13.4,y:1.3,z:l-2.1,width:.08,height:2.6,depth:.08},{x:o*13.4,y:1.3,z:l+2.1,width:.08,height:2.6,depth:.08},{x:o*14.7,y:.45,z:l,width:.4,height:.06,depth:3}),r.push({x:o*14.2,y:1.35,z:l+2.24,width:1.96,height:1.06,depth:.04}),a.push({x:o*14.2,y:1.35,z:l+2.27,width:1.8,height:.9,slot:c});return{steel:t,red:n,glow:r,lights:s,posters:a}}function _x(i){const e=bi(830238),t=Zo(i),n=i.tiers.filter(o=>Math.abs(o.x)<3&&o.width>Bs),r=[],s=[],a=[9.5,12,14.5,17,19.5,22];for(let o=St.start-12;o>-40;o-=5+e()*4){if(Hr(o,2)||n.some(x=>Math.abs(x.z-o)<x.depth/2+4))continue;const l=xh(o),c=Math.floor(e()*a.length);let h;for(let x=0;x<a.length&&h===void 0;x+=1){const m=(a[(c+x)%a.length]??12)+e()*1.5;if(l!==void 0&&Math.abs(m-l)<6||i.signs.some(S=>Math.abs(S.z-o)<2.5&&S.y<m+1.5&&S.y+S.height>m-2.5))continue;const[p,b]=[-1,1].map(S=>{const v=t.find(w=>Math.sign(w.x)===S&&Math.abs(w.z-o)<w.depth/2-1&&w.y<m-1&&w.y+w.height>m+1);return v===void 0?void 0:S*(Math.abs(v.x)-v.width/2)});p!==void 0&&b!==void 0&&(h={height:m,west:p,east:b})}if(h===void 0)continue;const f=.6+e()*1,u=(e()-.5)*3,d={x:h.west,y:h.height,z:o+u},g={x:h.east,y:h.height+(e()-.5)*1.5,z:o-u};if(r.push({from:d,to:g,sag:f}),e()<.45)for(let x=.12;x<.9;x+=.085){const m=4*f*x*(1-x);s.push({x:d.x+(g.x-d.x)*x,y:d.y+(g.y-d.y)*x-m-.32,z:d.z+(g.z-d.z)*x})}}return{cables:r,lanterns:s}}const Ys={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class Gr{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Mx=new Io(-1,1,1,-1,0,1);class yx extends Mt{constructor(){super(),this.setAttribute("position",new st([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new st([0,2,0,0,2,0],2))}}const Sx=new yx;class zh{constructor(e){this._mesh=new at(Sx,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Mx)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Ko extends Gr{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof _t?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Pr.clone(e.uniforms),this.material=new _t({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new zh(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class kh extends Gr{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class bx extends Gr{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class wx{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new ae);this._width=n.width,this._height=n.height,t=new Lt(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Dt}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Ko(Ys),this.copyPass.material.blending=vn,this.timer=new wd}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let r=0,s=this.passes.length;r<s;r++){const a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}kh!==void 0&&(a instanceof kh?n=!0:a instanceof bx&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new ae);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Ex extends Gr{constructor(e,t,n=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Ye}render(e,t,n){const r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}}const Tx={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ye(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`};class ji extends Gr{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e!==void 0?new ae(e.x,e.y):new ae(256,256),this.clearColor=new Ye(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Lt(s,a,{type:Dt,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const f=new Lt(s,a,{type:Dt,depthBuffer:!1});f.texture.name="UnrealBloomPass.h"+h,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const u=new Lt(s,a,{type:Dt,depthBuffer:!1});u.texture.name="UnrealBloomPass.v"+h,u.texture.generateMipmaps=!1,this.renderTargetsVertical.push(u),s=Math.round(s/2),a=Math.round(a/2)}const o=Tx;this.highPassUniforms=Pr.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new _t({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[6,10,14,18,22];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new ae(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Pr.clone(Ys.uniforms),this.blendMaterial=new _t({uniforms:this.copyUniforms,vertexShader:Ys.vertexShader,fragmentShader:Ys.fragmentShader,premultipliedAlpha:!0,blending:sr,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Ye,this._oldClearAlpha=1,this._basic=new xr,this._fsQuad=new zh(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(n,r),this.renderTargetsVertical[s].setSize(n,r),this.separableBlurMaterials[s].uniforms.invSize.value=new ae(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(e,t,n,r,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=ji.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=ji.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(n),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=a}_getSeparableBlurMaterial(e){const t=[],n=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(n*n))/n);const r=[],s=[];for(let a=1;a<e;a+=2){const o=t[a],l=a+1<e?t[a+1]:0,c=o+l;r.push((a*o+(a+1)*l)/c),s.push(c)}return new _t({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new ae(.5,.5)},direction:{value:new ae(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:s}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new _t({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}}ji.BlurDirectionX=new ae(1,0),ji.BlurDirectionY=new ae(0,1);const Hh=`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Ax=`
uniform sampler2D tDiffuse;
uniform float uExposure;
uniform float uTime;
uniform vec2 uTexel;
varying vec2 vUv;

const float SHARPEN_PEAK = -1.0 / 6.0;

vec3 rrtAndOdtFit(vec3 v) {
  vec3 a = v * (v + 0.0245786) - 0.000090537;
  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
  return a / b;
}

vec3 acesFilmic(vec3 color) {
  const mat3 inputMatrix = mat3(
    vec3(0.59719, 0.07600, 0.02840),
    vec3(0.35458, 0.90834, 0.13383),
    vec3(0.04823, 0.01566, 0.83777));
  const mat3 outputMatrix = mat3(
    vec3(1.60475, -0.10208, -0.00327),
    vec3(-0.53108, 1.10813, -0.07276),
    vec3(-0.07367, -0.00605, 1.07602));
  return clamp(outputMatrix * rrtAndOdtFit(inputMatrix * (color / 0.6)), 0.0, 1.0);
}

vec3 srgbEncode(vec3 color) {
  return mix(color * 12.92, 1.055 * pow(color, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), color));
}

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 toneMapped(vec2 uv) {
  return acesFilmic(texture2D(tDiffuse, uv).rgb * uExposure);
}

void main() {
  vec3 centre = toneMapped(vUv);
  vec3 north = toneMapped(vUv + vec2(0.0, uTexel.y));
  vec3 south = toneMapped(vUv - vec2(0.0, uTexel.y));
  vec3 east = toneMapped(vUv + vec2(uTexel.x, 0.0));
  vec3 west = toneMapped(vUv - vec2(uTexel.x, 0.0));
  vec3 low = min(centre, min(min(north, south), min(east, west)));
  vec3 high = max(centre, max(max(north, south), max(east, west)));
  vec3 weight = sqrt(clamp(min(low, 1.0 - high) / max(high, vec3(1e-4)), 0.0, 1.0)) * SHARPEN_PEAK;
  vec3 color = max((centre + (north + south + east + west) * weight) / (1.0 + 4.0 * weight), 0.0);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color *= mix(vec3(0.93, 1.0, 1.14), vec3(1.0), smoothstep(0.0, 0.3, luma));
  vec2 centred = vUv - 0.5;
  color *= 1.0 - 0.45 * smoothstep(0.08, 0.42, dot(centred, centred));
  color = srgbEncode(color);
  color += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 61.0) - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(color, 1.0);
}
`,Rx=`
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  color = mix(color, vec3(0.0), vec3(isnan(color)));
  gl_FragColor = vec4(clamp(color, 0.0, 64.0), 1.0);
}
`;function Cx(i,e,t){const n=new Lt(1,1,{type:Dt,samples:4}),r=new wx(i,n);r.addPass(new Ex(e,t));const s=new _t({uniforms:{tDiffuse:{value:null}},vertexShader:Hh,fragmentShader:Rx,depthTest:!1,depthWrite:!1}),a=new Ko(s);r.addPass(a);const o=new ji(new ae(1,1),.55,.32,1);r.addPass(o);const l={value:0},c={value:0},h={value:new ae(1,1)},f=new _t({uniforms:{tDiffuse:{value:null},uExposure:l,uTime:c,uTexel:h},vertexShader:Hh,fragmentShader:Ax,depthTest:!1,depthWrite:!1}),u=new Ko(f);return r.addPass(u),{composer:r,exposure:l,time:c,setSize:(d,g,x)=>{r.setPixelRatio(x),r.setSize(d,g),h.value.set(1/Math.max(1,Math.floor(d*x)),1/Math.max(1,Math.floor(g*x)))},dispose:()=>{a.dispose(),s.dispose(),o.dispose(),u.dispose(),f.dispose(),r.dispose()}}}const Gh={finish:()=>{},stop:()=>{}},$o=1,Px=196869,Lx=2,Vh=.8,Ix=2560*1520,Dx=900,Nx=.4,Ux=450;function mn(i,e,t,n={},r={}){return new _t({...r,vertexShader:e,fragmentShader:t,uniforms:{...i,...n}})}function Bt(i,e,t,n=new Ye(0,0,0)){return mn(i,_v,Mv,{uAlbedo:{value:typeof e=="number"?new Ye(e,e*.96,e*1.04):e},uEmissive:{value:n},uSheen:{value:t}})}function Jo(i,e,t){const n=new yd;n.index=i.index;for(const[r,s]of Object.entries(i.attributes))n.setAttribute(r,s);for(const[r,s]of Object.entries(t))n.setAttribute(r,s);return n.instanceCount=e,n}function Vr(i,e){const t=new Wi(1,1);return t.deleteAttribute("normal"),Jo(t,i,e)}function Fx(i,e,t){i.frustumCulled=!1,i.onBeforeRender=n=>{const r=n.getRenderTarget();r===null?n.getDrawingBufferSize(t.value):t.value.set(r.width,r.height),e.uniformsNeedUpdate=!0}}function Zs(i,e,t,n,r={}){const s=mn(i,t,Av,{uViewport:e,...r},{blending:sr,depthWrite:!1,transparent:!0}),a=new at(n,s);return Fx(a,s,e),a}function Qo(i,e,t,n={value:new U}){const r=new Float32Array(t.length*3),s=new Float32Array(t.length*4);return t.forEach((a,o)=>{r.set([a.position.x,a.position.y,a.position.z],o*3),s.set([...a.color,a.radius],o*4)}),Zs(i,e,bv,Vr(t.length,{aHead:new vt(r,3),aLight:new vt(s,4)}),{uLightOffset:n})}function Wh(i){return Xh(i,new ht)}function Xh(i,e){return i.map(t=>({position:new U(...t.offset).applyMatrix4(e),color:t.color,radius:t.radius}))}function Ox(i,e){const t=new Ge(1,1,1).translate(0,.5,0),n=new yt(.5,.5,1,48,1).translate(0,.5,0),r=new Set(Zo(i));return[[tn.box,t],[tn.round,n]].map(([s,a])=>{const o=i.tiers.filter(x=>x.form===s),l=new Float32Array(o.length*3),c=new Float32Array(o.length*4),h=new Float32Array(o.length*4),f=new Float32Array(o.length*4),u=new Float32Array(o.length);o.forEach((x,m)=>{const p=Bh(x);l.set([x.x,x.y,x.z],m*3),c.set([x.width,x.height,x.depth,x.taper],m*4),h.set([x.seed,x.facade,x.lit,x.trim],m*4),f.set([p.floorHeight,p.cellTarget,p.finish,(p.balconies?1:0)+(r.has(x)?2:0)],m*4),u[m]=x.storefront?1:0}),a.deleteAttribute("uv");const d=Jo(a,o.length,{aCenter:new vt(l,3),aSize:new vt(c,4),aStyle:new vt(h,4),aGrid:new vt(f,4),aStorefront:new vt(u,1)}),g=new at(d,mn(e,dv,pv,{},{defines:s===tn.round?{RADIAL:""}:{}}));return g.frustumCulled=!1,g})}function Bx(i){const e=new Nr(new Wi(2800,2800),{textureWidth:1,textureHeight:1,clipBias:.003,color:14275551,multisample:4,shader:{name:"SplashGround",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uStreet:{value:new mt($n.x,$n.spacing,0,Bs)},uAvenue:{value:new ae(St.start+15,St.end-10)},uCrossings:{value:new U(dn.north,dn.south,dn.rail)}},vertexShader:mv,fragmentShader:gv}}),t=e.material;if(!(t instanceof _t))throw new Error("splash: ground reflector has no shader material");Object.assign(t.uniforms,i);const n=e.getRenderTarget().texture;n.generateMipmaps=!0,n.minFilter=Hn,e.rotation.x=-Math.PI/2,e.position.set(0,0,-300);const r=e.onBeforeRender.bind(e),s=new U;return e.onBeforeRender=(a,o,l,...c)=>{if(l instanceof Jt){const h=Math.asin(l.getWorldDirection(s).y)-lf.degToRad(l.fov/2);if(h>-.01||l.position.y/Math.tan(-h)>Ux)return}i.uDetail.value=0,r(a,o,l,...c),i.uDetail.value=1},e}function zx(i){const e=new at(new vi(1600,48,24),mn(i,vv,xv,{},{side:kt,depthTest:!1,depthWrite:!1}));return e.renderOrder=-1,e.frustumCulled=!1,e.onBeforeRender=(t,n,r)=>{e.position.copy(r.position),e.updateMatrixWorld()},e}function kn(i,e){const t=new ht,n=new Ln,r=new U(0,1,0);return e.forEach((s,a)=>{n.setFromAxisAngle(r,s.yaw??0),i.setMatrixAt(a,t.compose(s.position,n,s.scale))}),i.instanceMatrix.needsUpdate=!0,i}function kx(){const i=$n.height,e=[new Ge(.22,i,.22).translate(0,i/2,0),new Ge(2.4,.14,.16).translate(-1.15,i-.1,0),new Ge(.9,.2,.42).translate(-2.1,i-.25,0)],t=Mi(e,!1);for(const n of e)n.dispose();return t}function qh(){const i=[];for(let e=St.start;e>St.end;e-=$n.spacing)i.push({x:-12.4,z:e,side:-1},{x:$n.x,z:e,side:1});return i}function Hx(){const i=[new yt(.5,.5,.78,18).translate(0,.61,0)];for(const[t,n]of[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]])i.push(new Ge(.07,.24,.07).translate(t,.12,n));const e=Mi(i,!1);for(const t of i)t.dispose();return e}function Gx(){const i=[new Ge(1,.86,1).translate(0,.43,0),new yt(.34,.34,.14,20).translate(-.18,.93,0),new yt(.34,.34,.14,20).translate(.22,.93,0)],e=Mi(i,!1);for(const t of i)t.dispose();return e}function Vx(){const i=Object.values(dn).sort((n,r)=>r-n),e=[];let t=St.start+15;for(const n of i)e.push({from:t,to:n+yi}),t=n-yi;return e.push({from:t,to:St.end-10}),e.filter(n=>n.from>n.to)}function Wx(i,e){const t=Bt(e,.05,.25),n=i.roofUnits.map(d=>Math.floor(Math.abs(Math.sin(d.x*12.9898+d.z*78.233))*43758.5453)%3),r=(d,g,x)=>{const m=i.roofUnits.filter((p,b)=>n[b]===g);return kn(new Sn(d,t,m.length),m.map(p=>{const b=x?Math.min(p.width,p.depth):p.width;return{position:new U(p.x,p.y,p.z),scale:new U(b,p.height,x?b:p.depth)}}))},s=[r(new Ge(1,1,1).translate(0,.5,0),0,!1),r(Hx(),1,!0),r(Gx(),2,!1)],a=kn(new Sn(new yt(.04,1,1,12).translate(0,.5,0),t,i.antennas.length),i.antennas.map(d=>({position:new U(d.x,d.y,d.z),scale:new U(d.radius,d.height,d.radius)}))),o=qh(),l=kn(new Sn(kx(),t,o.length),o.map(d=>({position:new U(d.x,0,d.z),scale:new U(1,1,1),yaw:d.side>0?0:Math.PI}))),c=kn(new Sn(new Ge(1,1,1),t,i.signs.length+i.screens.length),[...i.signs.map(d=>({position:new U(d.x,d.y+d.height/2,d.z-.24),scale:new U(d.width+.26,d.height+.26,.42)})),...i.screens.map(d=>({position:new U(d.x-Math.sin(d.yaw)*.25,d.y,d.z-Math.cos(d.yaw)*.25),scale:new U(d.width+.5,d.height+.5,.4),yaw:d.yaw}))]),h=kn(new Sn(new Ge(1,1,1),t,i.signs.length*2),i.signs.flatMap(d=>[.45,d.height-.45].map(g=>{const x=Math.abs(d.x)+d.width/2;return{position:new U(Math.sign(d.x)*(x+.175),d.y+g,d.z-.24),scale:new U(.5,.08,.1)}}))),f=Vx().flatMap(d=>[-1,1].map(g=>({position:new U(g*10.15,0,(d.from+d.to)/2),scale:new U(.3,.15,d.from-d.to)}))),u=kn(new Sn(new Ge(1,1,1).translate(0,.5,0),Bt(e,.09,.15),f.length),f);return[...s,a,l,c,h,u]}function Xx(i,e){const t=new ht,n=new Ln,r=new Wn(0,0,0,"ZYX"),s=new U,a=new U;return e.forEach((o,l)=>{n.setFromEuler(r.set(o.turnX??0,0,o.turnZ??0,"ZYX")),s.set(o.x,o.y,o.z),i.setMatrixAt(l,t.compose(s,n,a.set(o.width,o.height,o.depth)))}),i.instanceMatrix.needsUpdate=!0,i}function er(i,e){return Xx(new Sn(new Ge(1,1,1),e,i.length),i)}function qx(i){return Array.from({length:25},(e,t)=>{const n=t/24;return new U(i.from.x+(i.to.x-i.from.x)*n,i.from.y+(i.to.y-i.from.y)*n-4*i.sag*n*(1-n),i.from.z+(i.to.z-i.from.z)*n)})}function Yx(i,e,t){const n=mx(i),r=xx(i),{cables:s,lanterns:a}=_x(i),o=Bt(e,.035,.35),l=new Ye,c=er(n.awnings,Bt(e,1,.08));n.awnings.forEach((S,v)=>{c.setColorAt(v,l.setRGB(...S.tint))});const h=s.map(S=>new Cs(new Ro(qx(S)),32,.035,5,!1)),f=h.length===0?new Mt:Mi(h,!1);for(const S of h)S.dispose();const u=new Ye(1.5,.11,.06),d=kn(new Sn(new vi(.2,12,8),Bt(e,.02,0,u),a.length),a.map(S=>({position:new U(S.x,S.y,S.z),scale:new U(1,1.3,1)}))),g=r.posters.map(S=>({...S,yaw:0})),x=[er(n.masonry,Bt(e,.075,.1)),er(n.steel,o),c,er(r.steel,o),er(r.red,Bt(e,new Ye(.34,.02,.02),.25)),er(r.glow,Bt(e,.02,0,new Ye(1.3,1.24,1.1))),new at(f,Bt(e,.02,.2)),d,Ks(e,g,t,1,!0)],m=[1.4,.1,.05],p=S=>new U(S.x,S.y,S.z),b=[...r.lights.map(S=>({position:p(S),color:S.color,radius:S.radius})),...a.map(S=>({position:p(S),color:m,radius:.32}))];return{objects:x,lights:b}}function Zx(i){const e=[],t=(n,r,s,a,o)=>{e.push({position:new U(n,r,s),color:a,radius:o})};for(const n of i.antennas)t(n.x,n.y+n.height,n.z,[1.6,.08,.06],Math.max(.55,n.radius*.5));for(const n of qh())t(n.x-n.side*2.1,$n.height-.42,n.z,[1.8,1.25,.8],.4);for(const[n,r]of[[-12,-12],[12,-12],[-12,12],[12,12]])t(fn.x+n,fn.deck+.6,fn.z+r,[1.8,.1,.08],.6);return e}function Yh(i){const e=new Float32Array(i.length*4),t=new Float32Array(i.length*4);return i.forEach((n,r)=>{e.set([n.origin.x,n.origin.y,n.origin.z,n.speed],r*4),t.set([n.directionX,n.directionZ,n.phase,n.span],r*4)}),{lane:e,motion:t}}function jo(i,e,t,n){const{lane:r,motion:s}=Yh(e),a=new Float32Array(e.length*4);e.forEach((l,c)=>{a.set([...l.paint,l.bob],c*4)});const o=new at(Jo(t,e.length,{aLane:new vt(r,4),aMotion:new vt(s,4),aCraft:new vt(a,4)}),mn(i,Vo,Wo,{},{defines:{LANE:"",[n]:""}}));return o.frustumCulled=!1,o}function Kx(i,e){const t=uv(),n=gx(),r=[jo(i,t.filter(f=>f.kind===An.spinner),Jv(),"SPINNER"),jo(i,t.filter(f=>f.kind===An.hauler),Qv(),"HAULER"),jo(i,n,ex(),"CAR")],s=[...t.flatMap(f=>(f.kind===An.hauler?$v:Kv).map(d=>({lane:f,light:d}))),...n.flatMap(f=>jv.map(u=>({lane:f,light:u})))];for(const f of fv())s.push({lane:f,light:{offset:[0,0,0],color:f.headlight?[1.1,1,.9]:[1.2,.06,.04],radius:f.radius,kind:f.headlight?1:2,trail:f.trail}});const{lane:a,motion:o}=Yh(s.map(f=>f.lane)),l=new Float32Array(s.length*4),c=new Float32Array(s.length*4),h=new Float32Array(s.length*2);return s.forEach(({lane:f,light:u},d)=>{l.set([...u.offset,f.bob],d*4),c.set([...u.color,u.radius],d*4),h.set([u.kind,u.trail],d*2)}),r.push(Zs(i,e,wv,Vr(s.length,{aLane:new vt(a,4),aMotion:new vt(o,4),aOffset:new vt(l,4),aLight:new vt(c,4),aKind:new vt(h,2)}))),r}function $x(i,e){const n=new Float32Array(9600);let r=10775;for(let a=0;a<n.length;a+=1)r=Math.imul(r,1664525)+1013904223>>>0,n[a]=r/4294967296;const s=Zs(i,e,Ev,Vr(2400,{aDrop:new vt(n,4)}),{uRainBox:{value:new U(56,40,56)},uRain:{value:1}});return s.layers.set($o),s}function Ks(i,e,t,n,r,s={value:new U}){const a=new Float32Array(e.length*4),o=new Float32Array(e.length*4);e.forEach((c,h)=>{a.set([c.x,c.y,c.z,c.yaw],h*4),o.set([c.width,c.height,c.slot,n],h*4)});const l=new at(Vr(e.length,{aPanel:new vt(a,4),aShape:new vt(o,4)}),mn(i,yv,Sv,{uAtlas:{value:t.texture},uGrid:{value:t.grid},uScreen:{value:r?1:0},uPanelOffset:s}));return l.frustumCulled=!1,l}function $s(i,e=new ae,t=1,n=0){return{uSeed:{value:i},uAxis:{value:e},uRadius:{value:t},uTwistRate:{value:n}}}function Js(i,e,t,n,r){const{x:s,z:a}=t,o=new dr;for(const l of e.surfaces){const c=Object.fromEntries(l.defines.map(h=>[h,""]));o.add(new at(l.geometry,mn(i,Iv,Dv,r,{defines:c})))}for(const l of e.outlines){const c=new Ro([...l.points],!1,"centripetal"),h=new Cs(c,l.points.length*2,l.radius,6,!1);o.add(new at(h,Bt(i,.02,0,new Ye(...l.color))))}if(o.position.set(s,0,a),n){const l=wi(1).position;o.rotation.y=Math.atan2(l.x-s,l.z-a)}return o.updateMatrixWorld(!0),{group:o,lights:Xh(e.lights,o.matrixWorld)}}function Jx(i){const{pearl:e,gate:t,twist:n,opener:r}=Jn,s=$s(.83,new ae(n.x,n.z),n.radius,Rh),a=[Js(i,Xv(),e,!1,$s(.31)),Js(i,qv(),t,!0,$s(.47)),Js(i,Yv(),n,!1,s),Js(i,Zv(),r,!0,$s(.62))];return{objects:a.map(o=>o.group),lights:a.flatMap(o=>o.lights)}}function Qx(i,e,t){const n=new at(nx(Qt.length,Qt.radius),mn(i,Vo,Wo,{uPaint:{value:new Ye(.035,.034,.04)}},{defines:{BLIMP:""}})),r={value:new U(Qt.x,Qt.y,Qt.z)},s={x:0,y:rn.y,z:rn.z,yaw:0,width:rn.width,height:rn.height,slot:3},a=Ks(i,[s],t,1.1,!0,r),o=Qo(i,e,Wh(tx),r);return{objects:[n,a,o],update:(l,c)=>{r.value.set(Qt.x+Math.sin(c*.12)*1.5,Qt.y+Math.sin(c*.5)*.4,Qt.z),n.position.copy(r.value)},dispose:()=>{}}}function jx(i,e){const{z:t,height:n,span:r}=Si,s=Bt(i,.045,.3),a=new at(new Ge(r,2.2,3.2),s);a.position.set(0,n-1.1,t);const o=new at(Mi([new Ge(r,.12,.05).translate(0,n-.5,t+1.63),new Ge(r,.12,.05).translate(0,n-.5,t-1.63)],!1),Bt(i,.02,0,new Ye(.18,.9,1.35))),l=[];for(let g=-r/2+20;g<r/2;g+=45)Math.abs(g)>14&&l.push(g);const c=kn(new Sn(new Ge(1.8,1,2.2).translate(0,.5,0),s,l.length),l.map(g=>({position:new U(g,0,t),scale:new U(1,n-2.2,1)}))),h={uPaint:{value:new Ye(.46,.47,.5)}},f=new at(rx(),mn(i,Vo,Wo,h,{defines:{TRAIN:""}})),u={value:new U(0,n+1.95,t)},d=Qo(i,e,Wh(ix()),u);return{objects:[a,o,c,f,d],update:(g,x)=>{u.value.x=Jg(x),f.position.copy(u.value)},dispose:()=>{}}}function e_(i,e){var Ie;const{x:t,z:n,deck:r}=fn,s=Bt(i,.04,.4),a=new Ye(0,0,0),o=new at(new Cr(13.5,.5,12,160),Bt(i,.03,.2,a));o.rotation.x=Math.PI/2,o.position.set(t,r+.9,n);const l=new Ye(0,0,0),c=new at(new Cr(5.6,.22,10,96),Bt(i,.03,.2,l));c.rotation.x=Math.PI/2,c.position.set(t,r+2.5,n);const h=new at(new yt(3.1,4.4,2.7,48),s);h.position.set(t,r+1.35,n);const f=new Ye(0,0,0),u=new at(new So(2.7,48),Bt(i,.02,.1,f));u.rotation.x=-Math.PI/2,u.position.set(t,r+2.72,n);const d=kn(new Sn(new Ge(.34,3.2,3.4).translate(0,1.6,0),s,12),Array.from({length:12},(_e,Me)=>{const Se=Me/12*Math.PI*2;return{position:new U(t+Math.sin(Se)*9.4,r,n+Math.cos(Se)*9.4),scale:new U(1,1,1),yaw:Se}})),{geometry:g,project:x}=Hv(nn.width),m=zv(Fr),p=Bv(m,Fr,Ov(m,Fr)),b=kv(p,Fr),S={value:0},v={value:0},w=new at(g,mn(i,Pv,Lv,{uField:{value:b},uIgnite:S,uDormant:v})),T=wi(1).position,C=Math.atan2(nn.y-T.y,T.z-nn.z);w.position.set(nn.x,nn.y,nn.z),w.rotation.x=C,w.updateMatrixWorld();const _=r+2.75,A=nn.y+(((Ie=g.boundingBox)==null?void 0:Ie.min.y)??-48*.3)*Math.cos(C),F=(_e,Me,Se,ze)=>{const N={value:0},D={value:0},I=Se-_,P=new at(new yt(Me,_e,I,64,1,!0),mn(i,Rv,Cv,{uBeam:N,uBeamReach:D},{blending:sr,depthWrite:!1,transparent:!0,side:jt}));return P.position.set(t,_+I/2,n),{mesh:P,strength:ze,power:N,reach:D}},G=F(1.5,1.1,A+.6,1),z=F(3.4,nn.width*.46,nn.y,.32);let J=20900;const k=()=>(J=Math.imul(J,1664525)+1013904223>>>0,J/4294967296),Y=Gv(m,p,Fr,Dx,k),ne=new Float32Array(Y.length*3),$=new Float32Array(Y.length*3),K=new Float32Array(Y.length*3),re=new Float32Array(Y.length*2);Y.forEach((_e,Me)=>{const Se=k()*Math.PI*2,ze=Math.sqrt(k())*1.2,N=x(_e.u,_e.v,.9).applyMatrix4(w.matrixWorld);ne.set([t+Math.cos(Se)*ze,_+.4,n+Math.sin(Se)*ze],Me*3),$.set([t+Math.cos(Se)*ze*1.8,A-3-k()*5,n+Math.sin(Se)*ze*1.8],Me*3),K.set([N.x,N.y,N.z],Me*3);const D=Vv(_e.travel,Wt.igniteMs,Wt.igniteRampMs,bh);re.set([Math.max(Wt.sparksMs,D-620-k()*380),D],Me*2)});const se={value:0},ue=Zs(i,e,Tv,Vr(Y.length,{aFrom:new vt(ne,3),aVia:new vt($,3),aTo:new vt(K,3),aTiming:new vt(re,2)}),{uTimeline:se});return{objects:[o,c,h,u,d,G.mesh,z.mesh,w,ue],update:(_e,Me)=>{const{projectorMs:Se,projectorRampMs:ze,beamMs:N,beamRampMs:D,igniteMs:I,igniteRampMs:P}=Wt,B=Ji(_e,Se,ze),ie=Ji(_e,N,D),me=Ji(_e,I,P);a.setRGB(2.3*B,.12*B,.09*B),l.setRGB(.25*B,1.2*B,1.7*B),f.setRGB(3.2*B,.9*B,.7*B);for(const H of[G,z])H.power.value=H.strength*B*(1-.35*me),H.reach.value=ie*1.04;v.value=Ji(_e,N+D*.6,500),S.value=me,se.value=_e;const R=Ji(_e,I+P-200,1600);w.rotation.y=.16*Math.sin(Me*.42)*R,i.uHolo.value=.22*B+.78*me},dispose:()=>{b.dispose()}}}function t_(i){return i instanceof at}function n_(i){i.traverse(e=>{if(e instanceof Nr){e.dispose(),e.geometry.dispose();return}if(!t_(e))return;e.geometry.dispose();const t=Array.isArray(e.material)?e.material:[e.material];for(const n of t){if(n instanceof _t)for(const r of Object.values(n.uniforms)){const s=r.value;s instanceof yo&&s.dispose()}n.dispose()}})}function i_(i,e,t){const n=new Vg({canvas:i,antialias:!1,powerPreference:"high-performance",stencil:!1});let r=!1;n.debug.onShaderError=(Me,Se,ze,N)=>{r=!0,console.error("Tomato splash: shader compilation failed",Me.getShaderInfoLog(ze),Me.getShaderInfoLog(N))},n.setClearColor(Px,1);let s=Math.min(Lx,window.devicePixelRatio||1);n.setPixelRatio(s);const a={uTime:{value:0},uDetail:{value:1},uHoloPos:{value:new U(nn.x,nn.y,nn.z)},uHolo:{value:0},uFogDensity:{value:.0034},uFogFalloff:{value:.0125}},o={value:new ae(1,1)},l=new Sf,c=new Jt(60,1,.3,4e3);c.layers.enable($o);const h=lv(),f=n.capabilities.getMaxAnisotropy(),u=dx(f),d=Bx(a);d.getReflectionCamera(c).layers.disable($o);const g=Jx(a),x=[e_(a,o),Qx(a,o,u),jx(a,o)],m=h.signs.map(Me=>({...Me,y:Me.y+Me.height/2,yaw:0})),p=Yx(h,a,u);l.add(zx(a),d,...Ox(h,a),...Wx(h,a),...p.objects,...g.objects,Ks(a,m,fx(f),1.45,!1),Ks(a,h.screens,u,1,!0),...x.flatMap(Me=>Me.objects),Qo(a,o,[...Zx(h),...g.lights,...p.lights]),...Kx(a,o),$x(a,o));const b=Cx(n,l,c);let S=0,v=!1,w=!1,T=!1,C=0,_=0,A=0,F=0,G=!1,z=-1,J=-1;const k=Me=>w||e?Wt.holdMs:Math.min(Wt.holdMs,Me-S),Y=Me=>{const Se=wi(Me/Wt.cameraMs);c.position.set(Se.position.x,Se.position.y,Se.position.z),c.fov=Se.fov,c.updateProjectionMatrix(),c.lookAt(Se.target.x,Se.target.y,Se.target.z)},ne=Me=>{(i.clientWidth!==z||i.clientHeight!==J)&&$();const Se=k(Me),ze=(Me-S)/1e3;a.uTime.value=ze,b.time.value=ze,Y(Se);for(const N of x)N.update(Se,ze);b.exposure.value=Ji(Se,0,Wt.fadeInMs),b.composer.render()},$=()=>{z=i.clientWidth,J=i.clientHeight;const Me=Math.max(1,z),Se=Math.max(1,J),ze=Math.min(s,Math.sqrt(Ix/(Me*Se)));n.setPixelRatio(ze),n.setSize(Me,Se,!1),b.setSize(Me,Se,ze);const N=D=>Math.max(1,Math.round(D*ze*Nx));d.getRenderTarget().setSize(N(Me),N(Se)),c.aspect=Me/Se,c.updateProjectionMatrix(),v&&e&&!T&&ne(performance.now())},K=Me=>{G||(F>0&&(_+=1,_>4&&Me-F>24&&(A+=1)),F=Me,!(_<24)&&(G=!0,A>10&&s>Vh&&(s=Math.max(Vh,s*.72),$())))},re=Me=>{T||(C=requestAnimationFrame(re),ne(performance.now()),K(Me))},se=()=>{if(!T){if(r)throw new Error("splash: a city shader failed to compile");S=performance.now(),v=!0,t(),e?ne(S):C=requestAnimationFrame(re)}},ue=Me=>{console.error("Tomato splash: WebGL scene failed; using the static brand.",Me),T=!0,cancelAnimationFrame(C),document.documentElement.dataset.scene="fallback",v||(v=!0,t())},Ie=new ResizeObserver($);Ie.observe(i),$(),Y(e?Wt.holdMs:0),n.setRenderTarget(b.composer.renderTarget1);const _e=n.compileAsync(l,c);return n.setRenderTarget(null),_e.then(()=>{T||(b.exposure.value=0,b.composer.render(),se())}).catch(ue),{finish:()=>{w=!0,v&&e&&!T&&ne(performance.now())},stop:()=>{T=!0,cancelAnimationFrame(C),Ie.disconnect();for(const Me of x)Me.dispose();n_(l),b.dispose(),n.dispose()}}}function r_(i,e,t){if(i===null)return document.documentElement.dataset.scene="fallback",t(),Gh;try{return i_(i,e,t)}catch(n){return console.error("Tomato splash: WebGL initialization failed; using the static brand.",n),document.documentElement.dataset.scene="fallback",t(),Gh}}const el=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function s_(i){if(i===null||el)return{start:()=>{},finish:()=>{},stop:()=>{}};const e=i.dataset.text??i.textContent;let t,n,r=!1;const s=()=>{window.clearTimeout(t),n!==void 0&&window.clearInterval(n)};return{start:()=>{r||(t=window.setTimeout(()=>{const a=performance.now(),o=()=>{const l=(performance.now()-a)/Wt.wordmarkMs;i.textContent=au(e,l),l>=1&&n!==void 0&&(window.clearInterval(n),n=void 0)};o(),n=window.setInterval(o,40)},Wt.wordmarkDelayMs))},finish:()=>{r=!0,s(),i.textContent=e},stop:s}}function a_(i,e,t){let n=!1,r,s;const a=()=>{var o;n||(n=!0,window.clearTimeout(r),t(),document.documentElement.dataset.splash="done",s=window.setTimeout(()=>{i==null||i.classList.add("visible")},Wt.waitingDelayMs),(o=window.tomatoSplash)==null||o.notifyAnimationDone())};return{start:()=>{n||(r=window.setTimeout(a,e))},finish:a,stop:()=>{window.clearTimeout(r),s!==void 0&&window.clearTimeout(s)}}}let tl={finish:()=>{},stop:()=>{}};const nl=s_(document.querySelector(".wordmark-name")),il=a_(document.querySelector("#waiting"),su(el),()=>{tl.finish(),nl.finish()});tl=r_(document.querySelector("#city-3d"),el,()=>{document.documentElement.dataset.clock="running",nl.start(),il.start()});const Zh=()=>{il.finish()};window.addEventListener("pointerdown",Zh),window.addEventListener("keydown",i=>{i.key==="Escape"&&Zh()}),window.addEventListener("pagehide",()=>{il.stop(),nl.stop(),tl.stop()},{once:!0})})();
