(function(){"use strict";const qt={fadeInMs:1100,cameraMs:6300,projectorMs:3200,projectorRampMs:600,beamMs:3500,beamRampMs:650,sparksMs:3650,igniteMs:4150,igniteRampMs:1300,wordmarkDelayMs:5650,wordmarkMs:700,holdMs:7200,waitingDelayMs:1500,reducedMotionHoldMs:400};function Nf(n){return n?qt.reducedMotionHoldMs:qt.holdMs}const Ul="01ABCDEF23456789#%$@";function Uf(n,e,t=Math.random){if(e>=1)return n;const i=Math.floor(Math.max(0,e)*n.length);return Array.from(n,(r,s)=>r===" "||s<i?r:Ul.charAt(Math.floor(t()*Ul.length))).join("")}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const ua="186",Ff=0,Fl=1,Of=2,Jr=1,zf=2,cr=3,ai=0,Ht=1,rn=2,Mn=0,hr=1,fr=2,Ol=3,zl=4,Bf=5,Pi=100,kf=101,Hf=102,Gf=103,Vf=104,Wf=200,Xf=201,qf=202,Yf=203,Bl=204,kl=205,Zf=206,Kf=207,$f=208,Jf=209,Qf=210,jf=211,eu=212,tu=213,nu=214,da=0,pa=1,ma=2,ur=3,ga=4,va=5,xa=6,_a=7,Hl=0,iu=1,ru=2,Sn=0,Gl=1,Vl=2,Wl=3,Xl=4,ql=5,Yl=6,Zl=7,Kl=300,oi=301,Li=302,ya=303,Ma=304,Qr=306,jr=1e3,bn=1001,es=1002,It=1003,su=1004,ts=1005,Pt=1006,Sa=1007,Xn=1008,Kt=1009,$l=1010,Jl=1011,dr=1012,ba=1013,wn=1014,hn=1015,Ut=1016,wa=1017,Ea=1018,pr=1020,Ql=35902,jl=35899,ec=1021,tc=1022,fn=1023,Nn=1026,li=1027,ns=1028,Ta=1029,ci=1030,Aa=1031,Ra=1033,is=33776,rs=33777,ss=33778,as=33779,Ca=35840,Pa=35841,La=35842,Ia=35843,Da=36196,Na=37492,Ua=37496,Fa=37488,Oa=37489,os=37490,za=37491,Ba=37808,ka=37809,Ha=37810,Ga=37811,Va=37812,Wa=37813,Xa=37814,qa=37815,Ya=37816,Za=37817,Ka=37818,$a=37819,Ja=37820,Qa=37821,ja=36492,eo=36494,to=36495,no=36283,io=36284,ls=36285,ro=36286,au=3200,nc=0,ou=1,Un="",Yt="srgb",cs="srgb-linear",hs="linear",ht="srgb",so=7680,lu=519,cu=512,hu=513,fu=514,ao=515,uu=516,du=517,oo=518,pu=519,mu=35044,ic="300 es",En=2e3,fs=2001;function gu(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function us(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function vu(){const n=us("canvas");return n.style.display="block",n}const rc={};function sc(...n){const e="THREE."+n.shift();console.log(e,...n)}function ac(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Ke(...n){n=ac(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function st(...n){n=ac(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Ii(...n){const e=n.join(" ");e in rc||(rc[e]=!0,Ke(...n))}function xu(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const _u={[da]:pa,[ma]:xa,[ga]:_a,[ur]:va,[pa]:da,[xa]:ma,[_a]:ga,[va]:ur};class hi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Ft=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let oc=1234567;const mr=Math.PI/180,gr=180/Math.PI;function fi(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Ft[n&255]+Ft[n>>8&255]+Ft[n>>16&255]+Ft[n>>24&255]+"-"+Ft[e&255]+Ft[e>>8&255]+"-"+Ft[e>>16&15|64]+Ft[e>>24&255]+"-"+Ft[t&63|128]+Ft[t>>8&255]+"-"+Ft[t>>16&255]+Ft[t>>24&255]+Ft[i&255]+Ft[i>>8&255]+Ft[i>>16&255]+Ft[i>>24&255]).toLowerCase()}function et(n,e,t){return Math.max(e,Math.min(t,n))}function lo(n,e){return(n%e+e)%e}function yu(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function Mu(n,e,t){return n!==e?(t-n)/(e-n):0}function vr(n,e,t){return(1-t)*n+t*e}function Su(n,e,t,i){return vr(n,e,1-Math.exp(-t*i))}function bu(n,e=1){return e-Math.abs(lo(n,e*2)-e)}function wu(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function Eu(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function Tu(n,e){return n+Math.floor(Math.random()*(e-n+1))}function Au(n,e){return n+Math.random()*(e-n)}function Ru(n){return n*(.5-Math.random())}function Cu(n){n!==void 0&&(oc=n);let e=oc+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Pu(n){return n*mr}function Lu(n){return n*gr}function Iu(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function Du(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function Nu(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function Uu(n,e,t,i,r){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+i)/2),h=a((e+i)/2),u=s((e-i)/2),f=a((e-i)/2),d=s((i-e)/2),g=a((i-e)/2);switch(r){case"XYX":n.set(o*h,l*u,l*f,o*c);break;case"YZY":n.set(l*f,o*h,l*u,o*c);break;case"ZXZ":n.set(l*u,l*f,o*h,o*c);break;case"XZX":n.set(o*h,l*g,l*d,o*c);break;case"YXY":n.set(l*d,o*h,l*g,o*c);break;case"ZYZ":n.set(l*g,l*d,o*h,o*c);break;default:Ke("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Di(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Gt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Fu={DEG2RAD:mr,RAD2DEG:gr,generateUUID:fi,clamp:et,euclideanModulo:lo,mapLinear:yu,inverseLerp:Mu,lerp:vr,damp:Su,pingpong:bu,smoothstep:wu,smootherstep:Eu,randInt:Tu,randFloat:Au,randFloatSpread:Ru,seededRandom:Cu,degToRad:Pu,radToDeg:Lu,isPowerOfTwo:Iu,ceilPowerOfTwo:Du,floorPowerOfTwo:Nu,setQuaternionFromProperEuler:Uu,normalize:Gt,denormalize:Di},Rl=class Rl{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(et(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(et(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*i-a*r+e.x,this.y=s*r+a*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Rl.prototype.isVector2=!0;let ae=Rl;class Fn{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,a,o){let l=i[r+0],c=i[r+1],h=i[r+2],u=i[r+3],f=s[a+0],d=s[a+1],g=s[a+2],_=s[a+3];if(u!==_||l!==f||c!==d||h!==g){let m=l*f+c*d+h*g+u*_;m<0&&(f=-f,d=-d,g=-g,_=-_,m=-m);let p=1-o;if(m<.9995){const b=Math.acos(m),w=Math.sin(b);p=Math.sin(p*b)/w,o=Math.sin(o*b)/w,l=l*p+f*o,c=c*p+d*o,h=h*p+g*o,u=u*p+_*o}else{l=l*p+f*o,c=c*p+d*o,h=h*p+g*o,u=u*p+_*o;const b=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=b,c*=b,h*=b,u*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,r,s,a){const o=i[r],l=i[r+1],c=i[r+2],h=i[r+3],u=s[a],f=s[a+1],d=s[a+2],g=s[a+3];return e[t]=o*g+h*u+l*d-c*f,e[t+1]=l*g+h*f+c*u-o*d,e[t+2]=c*g+h*d+o*f-l*u,e[t+3]=h*g-o*u-l*f-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(r/2),u=o(s/2),f=l(i/2),d=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"YXZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"ZXY":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"ZYX":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"YZX":this._x=f*h*u+c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u-f*d*g;break;case"XZY":this._x=f*h*u-c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u+f*d*g;break;default:Ke("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],u=t[10],f=i+o+u;if(f>0){const d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(s-c)*d,this._z=(a-r)*d}else if(i>o&&i>u){const d=2*Math.sqrt(1+i-o-u);this._w=(h-l)/d,this._x=.25*d,this._y=(r+a)/d,this._z=(s+c)/d}else if(o>u){const d=2*Math.sqrt(1+o-i-u);this._w=(s-c)/d,this._x=(r+a)/d,this._y=.25*d,this._z=(l+h)/d}else{const d=2*Math.sqrt(1+u-i-o);this._w=(a-r)/d,this._x=(s+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(et(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-i*c,this._z=s*h+a*c+i*l-r*o,this._w=a*h-i*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(i=-i,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Cl=class Cl{constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(lc.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(lc.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*i),h=2*(o*t-s*r),u=2*(s*i-a*t);return this.x=t+l*c+a*u-o*h,this.y=i+l*h+o*c-s*u,this.z=r+l*u+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this.z=et(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this.z=et(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(et(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-i*l,this.z=i*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return co.copy(this).projectOnVector(e),this.sub(co)}reflect(e){return this.sub(co.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(et(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Cl.prototype.isVector3=!0;let U=Cl;const co=new U,lc=new Fn,Pl=class Pl{constructor(e,t,i,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c)}set(e,t,i,r,s,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=l,h[6]=i,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[3],l=i[6],c=i[1],h=i[4],u=i[7],f=i[2],d=i[5],g=i[8],_=r[0],m=r[3],p=r[6],b=r[1],w=r[4],v=r[7],S=r[2],E=r[5],R=r[8];return s[0]=a*_+o*b+l*S,s[3]=a*m+o*w+l*E,s[6]=a*p+o*v+l*R,s[1]=c*_+h*b+u*S,s[4]=c*m+h*w+u*E,s[7]=c*p+h*v+u*R,s[2]=f*_+d*b+g*S,s[5]=f*m+d*w+g*E,s[8]=f*p+d*v+g*R,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-i*s*h+i*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=h*a-o*c,f=o*l-h*s,d=c*s-a*l,g=t*u+i*f+r*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const _=1/g;return e[0]=u*_,e[1]=(r*c-h*i)*_,e[2]=(o*i-r*a)*_,e[3]=f*_,e[4]=(h*t-r*l)*_,e[5]=(r*s-o*t)*_,e[6]=d*_,e[7]=(i*l-c*t)*_,e[8]=(a*t-i*s)*_,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Ii("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ho.makeScale(e,t)),this}rotate(e){return Ii("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ho.makeRotation(-e)),this}translate(e,t){return Ii("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ho.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Pl.prototype.isMatrix3=!0;let qe=Pl;const ho=new qe,cc=new qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),hc=new qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ou(){const n={enabled:!0,workingColorSpace:cs,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===ht&&(r.r=On(r.r),r.g=On(r.g),r.b=On(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ht&&(r.r=Ni(r.r),r.g=Ni(r.g),r.b=Ni(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Un?hs:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Ii("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Ii("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[cs]:{primaries:e,whitePoint:i,transfer:hs,toXYZ:cc,fromXYZ:hc,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Yt},outputColorSpaceConfig:{drawingBufferColorSpace:Yt}},[Yt]:{primaries:e,whitePoint:i,transfer:ht,toXYZ:cc,fromXYZ:hc,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Yt}}}),n}const it=Ou();function On(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ni(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let Ui;class zu{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Ui===void 0&&(Ui=us("canvas")),Ui.width=e.width,Ui.height=e.height;const r=Ui.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Ui}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=us("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=On(s[a]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(On(t[i]/255)*255):t[i]=On(t[i]);return{data:t,width:e.width,height:e.height}}else return Ke("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Bu=0;class fo{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Bu++}),this.uuid=fi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(uo(r[a].image)):s.push(uo(r[a]))}else s=uo(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function uo(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?zu.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Ke("Texture: Unable to serialize Texture."),{})}let ku=0;const po=new U;class Ot extends hi{constructor(e=Ot.DEFAULT_IMAGE,t=Ot.DEFAULT_MAPPING,i=bn,r=bn,s=Pt,a=Xn,o=fn,l=Kt,c=Ot.DEFAULT_ANISOTROPY,h=Un){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:ku++}),this.uuid=fi(),this.name="",this.source=new fo(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ae(0,0),this.repeat=new ae(1,1),this.center=new ae(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(po).x}get height(){return this.source.getSize(po).y}get depth(){return this.source.getSize(po).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){Ke(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ke(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Kl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case jr:e.x=e.x-Math.floor(e.x);break;case bn:e.x=e.x<0?0:1;break;case es:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case jr:e.y=e.y-Math.floor(e.y);break;case bn:e.y=e.y<0?0:1;break;case es:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Ot.DEFAULT_IMAGE=null,Ot.DEFAULT_MAPPING=Kl,Ot.DEFAULT_ANISOTROPY=1;const Ll=class Ll{constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*i+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*i+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*i+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*i+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],g=l[9],_=l[2],m=l[6],p=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-_)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+_)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(c+1)/2,v=(d+1)/2,S=(p+1)/2,E=(h+f)/4,R=(u+_)/4,x=(g+m)/4;return w>v&&w>S?w<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(w),r=E/i,s=R/i):v>S?v<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(v),i=E/r,s=x/r):S<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(S),i=R/s,r=x/s),this.set(i,r,s,t),this}let b=Math.sqrt((m-g)*(m-g)+(u-_)*(u-_)+(f-h)*(f-h));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(u-_)/b,this.z=(f-h)/b,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this.z=et(this.z,e.z,t.z),this.w=et(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this.z=et(this.z,e,t),this.w=et(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(et(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ll.prototype.isVector4=!0;let pt=Ll;class Hu extends hi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new pt(0,0,e,t),this.scissorTest=!1,this.viewport=new pt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new Ot(r),a=i.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Pt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new fo(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Dt extends Hu{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class fc extends Ot{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=It,this.minFilter=It,this.wrapR=bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Gu extends Ot{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=It,this.minFilter=It,this.wrapR=bn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const ca=class ca{constructor(e,t,i,r,s,a,o,l,c,h,u,f,d,g,_,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,a,o,l,c,h,u,f,d,g,_,m)}set(e,t,i,r,s,a,o,l,c,h,u,f,d,g,_,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=u,p[14]=f,p[3]=d,p[7]=g,p[11]=_,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ca().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,i=e.elements,r=1/Fi.setFromMatrixColumn(e,0).length(),s=1/Fi.setFromMatrixColumn(e,1).length(),a=1/Fi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*a,t[9]=i[9]*a,t[10]=i[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,a=Math.cos(i),o=Math.sin(i),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),u=Math.sin(s);if(e.order==="XYZ"){const f=a*h,d=a*u,g=o*h,_=o*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=d+g*c,t[5]=f-_*c,t[9]=-o*l,t[2]=_-f*c,t[6]=g+d*c,t[10]=a*l}else if(e.order==="YXZ"){const f=l*h,d=l*u,g=c*h,_=c*u;t[0]=f+_*o,t[4]=g*o-d,t[8]=a*c,t[1]=a*u,t[5]=a*h,t[9]=-o,t[2]=d*o-g,t[6]=_+f*o,t[10]=a*l}else if(e.order==="ZXY"){const f=l*h,d=l*u,g=c*h,_=c*u;t[0]=f-_*o,t[4]=-a*u,t[8]=g+d*o,t[1]=d+g*o,t[5]=a*h,t[9]=_-f*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const f=a*h,d=a*u,g=o*h,_=o*u;t[0]=l*h,t[4]=g*c-d,t[8]=f*c+_,t[1]=l*u,t[5]=_*c+f,t[9]=d*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const f=a*l,d=a*c,g=o*l,_=o*c;t[0]=l*h,t[4]=_-f*u,t[8]=g*u+d,t[1]=u,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=d*u+g,t[10]=f-_*u}else if(e.order==="XZY"){const f=a*l,d=a*c,g=o*l,_=o*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=f*u+_,t[5]=a*h,t[9]=d*u-g,t[2]=g*u-d,t[6]=o*h,t[10]=_*u+f}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Vu,e,Wu)}lookAt(e,t,i){const r=this.elements;return $t.subVectors(e,t),$t.lengthSq()===0&&($t.z=1),$t.normalize(),qn.crossVectors(i,$t),qn.lengthSq()===0&&(Math.abs(i.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),qn.crossVectors(i,$t)),qn.normalize(),ds.crossVectors($t,qn),r[0]=qn.x,r[4]=ds.x,r[8]=$t.x,r[1]=qn.y,r[5]=ds.y,r[9]=$t.y,r[2]=qn.z,r[6]=ds.z,r[10]=$t.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,a=i[0],o=i[4],l=i[8],c=i[12],h=i[1],u=i[5],f=i[9],d=i[13],g=i[2],_=i[6],m=i[10],p=i[14],b=i[3],w=i[7],v=i[11],S=i[15],E=r[0],R=r[4],x=r[8],A=r[12],N=r[1],H=r[5],O=r[9],J=r[13],k=r[2],W=r[6],ee=r[10],$=r[14],Z=r[3],ie=r[7],re=r[11],ce=r[15];return s[0]=a*E+o*N+l*k+c*Z,s[4]=a*R+o*H+l*W+c*ie,s[8]=a*x+o*O+l*ee+c*re,s[12]=a*A+o*J+l*$+c*ce,s[1]=h*E+u*N+f*k+d*Z,s[5]=h*R+u*H+f*W+d*ie,s[9]=h*x+u*O+f*ee+d*re,s[13]=h*A+u*J+f*$+d*ce,s[2]=g*E+_*N+m*k+p*Z,s[6]=g*R+_*H+m*W+p*ie,s[10]=g*x+_*O+m*ee+p*re,s[14]=g*A+_*J+m*$+p*ce,s[3]=b*E+w*N+v*k+S*Z,s[7]=b*R+w*H+v*W+S*ie,s[11]=b*x+w*O+v*ee+S*re,s[15]=b*A+w*J+v*$+S*ce,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],u=e[6],f=e[10],d=e[14],g=e[3],_=e[7],m=e[11],p=e[15],b=l*d-c*f,w=o*d-c*u,v=o*f-l*u,S=a*d-c*h,E=a*f-l*h,R=a*u-o*h;return t*(_*b-m*w+p*v)-i*(g*b-m*S+p*E)+r*(g*w-_*S+p*R)-s*(g*v-_*E+m*R)}determinantAffine(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-i*(s*h-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],u=e[9],f=e[10],d=e[11],g=e[12],_=e[13],m=e[14],p=e[15],b=t*o-i*a,w=t*l-r*a,v=t*c-s*a,S=i*l-r*o,E=i*c-s*o,R=r*c-s*l,x=h*_-u*g,A=h*m-f*g,N=h*p-d*g,H=u*m-f*_,O=u*p-d*_,J=f*p-d*m,k=b*J-w*O+v*H+S*N-E*A+R*x;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const W=1/k;return e[0]=(o*J-l*O+c*H)*W,e[1]=(r*O-i*J-s*H)*W,e[2]=(_*R-m*E+p*S)*W,e[3]=(f*E-u*R-d*S)*W,e[4]=(l*N-a*J-c*A)*W,e[5]=(t*J-r*N+s*A)*W,e[6]=(m*v-g*R-p*w)*W,e[7]=(h*R-f*v+d*w)*W,e[8]=(a*O-o*N+c*x)*W,e[9]=(i*N-t*O-s*x)*W,e[10]=(g*E-_*v+p*b)*W,e[11]=(u*v-h*E-d*b)*W,e[12]=(o*A-a*H-l*x)*W,e[13]=(t*H-i*A+r*x)*W,e[14]=(_*w-g*S-m*b)*W,e[15]=(h*S-u*w+f*b)*W,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+i,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+i,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,a){return this.set(1,i,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,h=a+a,u=o+o,f=s*c,d=s*h,g=s*u,_=a*h,m=a*u,p=o*u,b=l*c,w=l*h,v=l*u,S=i.x,E=i.y,R=i.z;return r[0]=(1-(_+p))*S,r[1]=(d+v)*S,r[2]=(g-w)*S,r[3]=0,r[4]=(d-v)*E,r[5]=(1-(f+p))*E,r[6]=(m+b)*E,r[7]=0,r[8]=(g+w)*R,r[9]=(m-b)*R,r[10]=(1-(f+_))*R,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let a=Fi.set(r[0],r[1],r[2]).length();const o=Fi.set(r[4],r[5],r[6]).length(),l=Fi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),un.copy(this);const c=1/a,h=1/o,u=1/l;return un.elements[0]*=c,un.elements[1]*=c,un.elements[2]*=c,un.elements[4]*=h,un.elements[5]*=h,un.elements[6]*=h,un.elements[8]*=u,un.elements[9]*=u,un.elements[10]*=u,t.setFromRotationMatrix(un),i.x=a,i.y=o,i.z=l,this}makePerspective(e,t,i,r,s,a,o=En,l=!1){const c=this.elements,h=2*s/(t-e),u=2*s/(i-r),f=(t+e)/(t-e),d=(i+r)/(i-r);let g,_;if(l)g=s/(a-s),_=a*s/(a-s);else if(o===En)g=-(a+s)/(a-s),_=-2*a*s/(a-s);else if(o===fs)g=-a/(a-s),_=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=f,c[12]=0,c[1]=0,c[5]=u,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,a,o=En,l=!1){const c=this.elements,h=2/(t-e),u=2/(i-r),f=-(t+e)/(t-e),d=-(i+r)/(i-r);let g,_;if(l)g=1/(a-s),_=a/(a-s);else if(o===En)g=-2/(a-s),_=-(a+s)/(a-s);else if(o===fs)g=-1/(a-s),_=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=f,c[1]=0,c[5]=u,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}};ca.prototype.isMatrix4=!0;let ft=ca;const Fi=new U,un=new ft,Vu=new U(0,0,0),Wu=new U(1,1,1),qn=new U,ds=new U,$t=new U,uc=new ft,dc=new Fn;class Yn{constructor(e=0,t=0,i=0,r=Yn.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],u=r[2],f=r[6],d=r[10];switch(t){case"XYZ":this._y=Math.asin(et(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-et(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,s),this._z=0);break;case"ZXY":this._x=Math.asin(et(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-et(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(et(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,s)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-et(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Ke("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return uc.makeRotationFromQuaternion(e),this.setFromRotationMatrix(uc,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return dc.setFromEuler(this),this.setFromQuaternion(dc,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Yn.DEFAULT_ORDER="XYZ";class pc{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Xu=0;const mc=new U,Oi=new Fn,zn=new ft,ps=new U,xr=new U,qu=new U,Yu=new Fn,gc=new U(1,0,0),vc=new U(0,1,0),xc=new U(0,0,1),_c={type:"added"},Zu={type:"removed"},zi={type:"childadded",child:null},mo={type:"childremoved",child:null};class Jt extends hi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Xu++}),this.uuid=fi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Jt.DEFAULT_UP.clone();const e=new U,t=new Yn,i=new Fn,r=new U(1,1,1);function s(){i.setFromEuler(t,!1)}function a(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ft},normalMatrix:{value:new qe}}),this.matrix=new ft,this.matrixWorld=new ft,this.matrixAutoUpdate=Jt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new pc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Oi.setFromAxisAngle(e,t),this.quaternion.multiply(Oi),this}rotateOnWorldAxis(e,t){return Oi.setFromAxisAngle(e,t),this.quaternion.premultiply(Oi),this}rotateX(e){return this.rotateOnAxis(gc,e)}rotateY(e){return this.rotateOnAxis(vc,e)}rotateZ(e){return this.rotateOnAxis(xc,e)}translateOnAxis(e,t){return mc.copy(e).applyQuaternion(this.quaternion),this.position.add(mc.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(gc,e)}translateY(e){return this.translateOnAxis(vc,e)}translateZ(e){return this.translateOnAxis(xc,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(zn.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?ps.copy(e):ps.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),xr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?zn.lookAt(xr,ps,this.up):zn.lookAt(ps,xr,this.up),this.quaternion.setFromRotationMatrix(zn),r&&(zn.extractRotation(r.matrixWorld),Oi.setFromRotationMatrix(zn),this.quaternion.premultiply(Oi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(st("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(_c),zi.child=e,this.dispatchEvent(zi),zi.child=null):st("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Zu),mo.child=e,this.dispatchEvent(mo),mo.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),zn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),zn.multiply(e.parent.matrixWorld)),e.applyMatrix4(zn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(_c),zi.child=e,this.dispatchEvent(zi),zi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const a=this.children[i].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xr,e,qu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(xr,Yu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,i)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const u=l[c];s(e.shapes,u)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),u=a(e.shapes),f=a(e.skeletons),d=a(e.animations),g=a(e.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),f.length>0&&(i.skeletons=f),d.length>0&&(i.animations=d),g.length>0&&(i.nodes=g)}return i.object=r,i;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Jt.DEFAULT_UP=new U(0,1,0),Jt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class _r extends Jt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Ku={type:"move"};class go{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new _r,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new _r,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new U,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new U),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new _r,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new U,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new U,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const _ of e.hand.values()){const m=t.getJointPose(_,i),p=this._getHandJoint(c,_);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,g=.005;c.inputState.pinching&&f>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&f<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(Ku)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new _r;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const yc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Zn={h:0,s:0,l:0},ms={h:0,s:0,l:0};function vo(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class Ye{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Yt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,it.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=it.workingColorSpace){return this.r=e,this.g=t,this.b=i,it.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=it.workingColorSpace){if(e=lo(e,1),t=et(t,0,1),i=et(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,a=2*i-s;this.r=vo(a,s,e+1/3),this.g=vo(a,s,e),this.b=vo(a,s,e-1/3)}return it.colorSpaceToWorking(this,r),this}setStyle(e,t=Yt){function i(s){s!==void 0&&parseFloat(s)<1&&Ke("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ke("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ke("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Yt){const i=yc[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Ke("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=On(e.r),this.g=On(e.g),this.b=On(e.b),this}copyLinearToSRGB(e){return this.r=Ni(e.r),this.g=Ni(e.g),this.b=Ni(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Yt){return it.workingToColorSpace(zt.copy(this),e),Math.round(et(zt.r*255,0,255))*65536+Math.round(et(zt.g*255,0,255))*256+Math.round(et(zt.b*255,0,255))}getHexString(e=Yt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=it.workingColorSpace){it.workingToColorSpace(zt.copy(this),t);const i=zt.r,r=zt.g,s=zt.b,a=Math.max(i,r,s),o=Math.min(i,r,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case i:l=(r-s)/u+(r<s?6:0);break;case r:l=(s-i)/u+2;break;case s:l=(i-r)/u+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=it.workingColorSpace){return it.workingToColorSpace(zt.copy(this),t),e.r=zt.r,e.g=zt.g,e.b=zt.b,e}getStyle(e=Yt){it.workingToColorSpace(zt.copy(this),e);const t=zt.r,i=zt.g,r=zt.b;return e!==Yt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Zn),this.setHSL(Zn.h+e,Zn.s+t,Zn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Zn),e.getHSL(ms);const i=vr(Zn.h,ms.h,t),r=vr(Zn.s,ms.s,t),s=vr(Zn.l,ms.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const zt=new Ye;Ye.NAMES=yc;class $u extends Jt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Yn,this.environmentIntensity=1,this.environmentRotation=new Yn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const dn=new U,Bn=new U,xo=new U,kn=new U,Bi=new U,ki=new U,Mc=new U,_o=new U,yo=new U,Mo=new U,So=new pt,bo=new pt,wo=new pt;class pn{constructor(e=new U,t=new U,i=new U){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),dn.subVectors(e,t),r.cross(dn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){dn.subVectors(r,t),Bn.subVectors(i,t),xo.subVectors(e,t);const a=dn.dot(dn),o=dn.dot(Bn),l=dn.dot(xo),c=Bn.dot(Bn),h=Bn.dot(xo),u=a*c-o*o;if(u===0)return s.set(0,0,0),null;const f=1/u,d=(c*l-o*h)*f,g=(a*h-o*l)*f;return s.set(1-d-g,g,d)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,kn)===null?!1:kn.x>=0&&kn.y>=0&&kn.x+kn.y<=1}static getInterpolation(e,t,i,r,s,a,o,l){return this.getBarycoord(e,t,i,r,kn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,kn.x),l.addScaledVector(a,kn.y),l.addScaledVector(o,kn.z),l)}static getInterpolatedAttribute(e,t,i,r,s,a){return So.setScalar(0),bo.setScalar(0),wo.setScalar(0),So.fromBufferAttribute(e,t),bo.fromBufferAttribute(e,i),wo.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(So,s.x),a.addScaledVector(bo,s.y),a.addScaledVector(wo,s.z),a}static isFrontFacing(e,t,i,r){return dn.subVectors(i,t),Bn.subVectors(e,t),dn.cross(Bn).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return dn.subVectors(this.c,this.b),Bn.subVectors(this.a,this.b),dn.cross(Bn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return pn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return pn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return pn.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return pn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return pn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let a,o;Bi.subVectors(r,i),ki.subVectors(s,i),_o.subVectors(e,i);const l=Bi.dot(_o),c=ki.dot(_o);if(l<=0&&c<=0)return t.copy(i);yo.subVectors(e,r);const h=Bi.dot(yo),u=ki.dot(yo);if(h>=0&&u<=h)return t.copy(r);const f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(i).addScaledVector(Bi,a);Mo.subVectors(e,s);const d=Bi.dot(Mo),g=ki.dot(Mo);if(g>=0&&d<=g)return t.copy(s);const _=d*c-l*g;if(_<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(i).addScaledVector(ki,o);const m=h*g-d*u;if(m<=0&&u-h>=0&&d-g>=0)return Mc.subVectors(s,r),o=(u-h)/(u-h+(d-g)),t.copy(r).addScaledVector(Mc,o);const p=1/(m+_+f);return a=_*p,o=f*p,t.copy(i).addScaledVector(Bi,a).addScaledVector(ki,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class ui{constructor(e=new U(1/0,1/0,1/0),t=new U(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(mn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(mn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=mn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,mn):mn.fromBufferAttribute(s,a),mn.applyMatrix4(e.matrixWorld),this.expandByPoint(mn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),gs.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),gs.copy(i.boundingBox)),gs.applyMatrix4(e.matrixWorld),this.union(gs)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,mn),mn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(yr),vs.subVectors(this.max,yr),Hi.subVectors(e.a,yr),Gi.subVectors(e.b,yr),Vi.subVectors(e.c,yr),Kn.subVectors(Gi,Hi),$n.subVectors(Vi,Gi),di.subVectors(Hi,Vi);let t=[0,-Kn.z,Kn.y,0,-$n.z,$n.y,0,-di.z,di.y,Kn.z,0,-Kn.x,$n.z,0,-$n.x,di.z,0,-di.x,-Kn.y,Kn.x,0,-$n.y,$n.x,0,-di.y,di.x,0];return!Eo(t,Hi,Gi,Vi,vs)||(t=[1,0,0,0,1,0,0,0,1],!Eo(t,Hi,Gi,Vi,vs))?!1:(xs.crossVectors(Kn,$n),t=[xs.x,xs.y,xs.z],Eo(t,Hi,Gi,Vi,vs))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,mn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(mn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Hn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Hn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Hn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Hn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Hn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Hn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Hn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Hn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Hn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Hn=[new U,new U,new U,new U,new U,new U,new U,new U],mn=new U,gs=new ui,Hi=new U,Gi=new U,Vi=new U,Kn=new U,$n=new U,di=new U,yr=new U,vs=new U,xs=new U,pi=new U;function Eo(n,e,t,i,r){for(let s=0,a=n.length-3;s<=a;s+=3){pi.fromArray(n,s);const o=r.x*Math.abs(pi.x)+r.y*Math.abs(pi.y)+r.z*Math.abs(pi.z),l=e.dot(pi),c=t.dot(pi),h=i.dot(pi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Et=new U,_s=new ae;let Ju=0;class Zt extends hi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Ju++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=mu,this.updateRanges=[],this.gpuType=hn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)_s.fromBufferAttribute(this,t),_s.applyMatrix3(e),this.setXY(t,_s.x,_s.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix3(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix4(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.applyNormalMatrix(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Et.fromBufferAttribute(this,t),Et.transformDirection(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Di(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Gt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Di(t,this.array)),t}setX(e,t){return this.normalized&&(t=Gt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Di(t,this.array)),t}setY(e,t){return this.normalized&&(t=Gt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Di(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Gt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Di(t,this.array)),t}setW(e,t){return this.normalized&&(t=Gt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Gt(t,this.array),i=Gt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Gt(t,this.array),i=Gt(i,this.array),r=Gt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Gt(t,this.array),i=Gt(i,this.array),r=Gt(r,this.array),s=Gt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class Sc extends Zt{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class bc extends Zt{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class rt extends Zt{constructor(e,t,i){super(new Float32Array(e),t,i)}}const Qu=new ui,Mr=new U,To=new U;class Sr{constructor(e=new U,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):Qu.setFromPoints(e).getCenter(i);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Mr.subVectors(e,this.center);const t=Mr.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Mr,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(To.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Mr.copy(e.center).add(To)),this.expandByPoint(Mr.copy(e.center).sub(To))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let ju=0;const sn=new ft,Ao=new Jt,Wi=new U,Qt=new ui,br=new ui,Lt=new U;class Mt extends hi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ju++}),this.uuid=fi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(gu(e)?bc:Sc)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new qe().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return sn.makeRotationFromQuaternion(e),this.applyMatrix4(sn),this}rotateX(e){return sn.makeRotationX(e),this.applyMatrix4(sn),this}rotateY(e){return sn.makeRotationY(e),this.applyMatrix4(sn),this}rotateZ(e){return sn.makeRotationZ(e),this.applyMatrix4(sn),this}translate(e,t,i){return sn.makeTranslation(e,t,i),this.applyMatrix4(sn),this}scale(e,t,i){return sn.makeScale(e,t,i),this.applyMatrix4(sn),this}lookAt(e){return Ao.lookAt(e),Ao.updateMatrix(),this.applyMatrix4(Ao.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Wi).negate(),this.translate(Wi.x,Wi.y,Wi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];i.push(a.x,a.y,a.z||0)}this.setAttribute("position",new rt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ke("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new ui);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){st("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new U(-1/0,-1/0,-1/0),new U(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Qt.setFromBufferAttribute(s),this.morphTargetsRelative?(Lt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Lt),Lt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Lt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&st('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Sr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){st("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new U,1/0);return}if(e){const i=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];br.setFromBufferAttribute(o),this.morphTargetsRelative?(Lt.addVectors(Qt.min,br.min),Qt.expandByPoint(Lt),Lt.addVectors(Qt.max,br.max),Qt.expandByPoint(Lt)):(Qt.expandByPoint(br.min),Qt.expandByPoint(br.max))}Qt.getCenter(i);let r=0;for(let s=0,a=e.count;s<a;s++)Lt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Lt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Lt.fromBufferAttribute(o,c),l&&(Wi.fromBufferAttribute(e,c),Lt.add(Wi)),r=Math.max(r,i.distanceToSquared(Lt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&st('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){st("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==i.count)&&(a=new Zt(new Float32Array(4*i.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let x=0;x<i.count;x++)o[x]=new U,l[x]=new U;const c=new U,h=new U,u=new U,f=new ae,d=new ae,g=new ae,_=new U,m=new U;function p(x,A,N){c.fromBufferAttribute(i,x),h.fromBufferAttribute(i,A),u.fromBufferAttribute(i,N),f.fromBufferAttribute(s,x),d.fromBufferAttribute(s,A),g.fromBufferAttribute(s,N),h.sub(c),u.sub(c),d.sub(f),g.sub(f);const H=1/(d.x*g.y-g.x*d.y);isFinite(H)&&(_.copy(h).multiplyScalar(g.y).addScaledVector(u,-d.y).multiplyScalar(H),m.copy(u).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(H),o[x].add(_),o[A].add(_),o[N].add(_),l[x].add(m),l[A].add(m),l[N].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let x=0,A=b.length;x<A;++x){const N=b[x],H=N.start,O=N.count;for(let J=H,k=H+O;J<k;J+=3)p(e.getX(J+0),e.getX(J+1),e.getX(J+2))}const w=new U,v=new U,S=new U,E=new U;function R(x){S.fromBufferAttribute(r,x),E.copy(S);const A=o[x];w.copy(A),w.sub(S.multiplyScalar(S.dot(A))).normalize(),v.crossVectors(E,A);const H=v.dot(l[x])<0?-1:1;a.setXYZW(x,w.x,w.y,w.z,H)}for(let x=0,A=b.length;x<A;++x){const N=b[x],H=N.start,O=N.count;for(let J=H,k=H+O;J<k;J+=3)R(e.getX(J+0)),R(e.getX(J+1)),R(e.getX(J+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new Zt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let f=0,d=i.count;f<d;f++)i.setXYZ(f,0,0,0);const r=new U,s=new U,a=new U,o=new U,l=new U,c=new U,h=new U,u=new U;if(e)for(let f=0,d=e.count;f<d;f+=3){const g=e.getX(f+0),_=e.getX(f+1),m=e.getX(f+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,_),a.fromBufferAttribute(t,m),h.subVectors(a,s),u.subVectors(r,s),h.cross(u),o.fromBufferAttribute(i,g),l.fromBufferAttribute(i,_),c.fromBufferAttribute(i,m),o.add(h),l.add(h),c.add(h),i.setXYZ(g,o.x,o.y,o.z),i.setXYZ(_,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let f=0,d=t.count;f<d;f+=3)r.fromBufferAttribute(t,f+0),s.fromBufferAttribute(t,f+1),a.fromBufferAttribute(t,f+2),h.subVectors(a,s),u.subVectors(r,s),h.cross(u),i.setXYZ(f+0,h.x,h.y,h.z),i.setXYZ(f+1,h.x,h.y,h.z),i.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Lt.fromBufferAttribute(e,t),Lt.normalize(),e.setXYZ(t,Lt.x,Lt.y,Lt.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,u=o.normalized,f=new c.constructor(l.length*h);let d=0,g=0;for(let _=0,m=l.length;_<m;_++){o.isInterleavedBufferAttribute?d=l[_]*o.data.stride+o.offset:d=l[_]*h;for(let p=0;p<h;p++)f[g++]=c[d++]}return new Zt(f,h,u)}if(this.index===null)return Ke("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Mt,i=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,i);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,u=c.length;h<u;h++){const f=c[h],d=e(f,i);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){const d=c[u];h.push(d.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const h=r[c];this.setAttribute(c,h.clone(t))}const s=e.morphAttributes;for(const c in s){const h=[],u=s[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Ro=new U,ed=new U,td=new qe;class Gn{constructor(e=new U(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=Ro.subVectors(i,t).cross(ed.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){const r=e.delta(Ro),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||td.getNormalMatrix(e),r=this.coplanarPoint(Ro).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let nd=0;class ys extends hi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:nd++}),this.uuid=fi(),this.name="",this.type="Material",this.blending=hr,this.side=ai,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Bl,this.blendDst=kl,this.blendEquation=Pi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ye(0,0,0),this.blendAlpha=0,this.depthFunc=ur,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=lu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=so,this.stencilZFail=so,this.stencilZPass=so,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){Ke(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ke(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(i.textures=s),a.length>0&&(i.images=a)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ye().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Gn().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ae().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ae().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Vn=new U,Co=new U,Ms=new U,Ss=new U;class id{constructor(e=new U,t=new U(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Vn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Vn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Vn.copy(this.origin).addScaledVector(this.direction,t),Vn.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Co.copy(e).add(t).multiplyScalar(.5),Ms.copy(t).sub(e).normalize(),Ss.copy(this.origin).sub(Co);const s=e.distanceTo(t)*.5,a=-this.direction.dot(Ms),o=Ss.dot(this.direction),l=-Ss.dot(Ms),c=Ss.lengthSq(),h=Math.abs(1-a*a);let u,f,d,g;if(h>0)if(u=a*l-o,f=a*o-l,g=s*h,u>=0)if(f>=-g)if(f<=g){const _=1/h;u*=_,f*=_,d=u*(u+a*f+2*o)+f*(a*u+f+2*l)+c}else f=s,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f=-s,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f<=-g?(u=Math.max(0,-(-a*s+o)),f=u>0?-s:Math.min(Math.max(-s,-l),s),d=-u*u+f*(f+2*l)+c):f<=g?(u=0,f=Math.min(Math.max(-s,-l),s),d=f*(f+2*l)+c):(u=Math.max(0,-(a*s+o)),f=u>0?s:Math.min(Math.max(-s,-l),s),d=-u*u+f*(f+2*l)+c);else f=a>0?-s:s,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Co).addScaledVector(Ms,f),d}intersectSphere(e,t){if(e.radius<0)return null;Vn.subVectors(e.center,this.origin);const i=Vn.dot(this.direction),r=Vn.dot(Vn)-i*i,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=i-a,l=i+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(i=(e.min.x-f.x)*c,r=(e.max.x-f.x)*c):(i=(e.max.x-f.x)*c,r=(e.min.x-f.x)*c),h>=0?(s=(e.min.y-f.y)*h,a=(e.max.y-f.y)*h):(s=(e.max.y-f.y)*h,a=(e.min.y-f.y)*h),i>a||s>r||((s>i||isNaN(i))&&(i=s),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-f.z)*u,l=(e.max.z-f.z)*u):(o=(e.max.z-f.z)*u,l=(e.min.z-f.z)*u),i>l||o>r)||((o>i||i!==i)&&(i=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Vn)!==null}intersectTriangle(e,t,i,r,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,u=e.x-a.x,f=e.y-a.y,d=e.z-a.z,g=t.x-a.x,_=t.y-a.y,m=t.z-a.z,p=i.x-a.x,b=i.y-a.y,w=i.z-a.z,v=Math.abs(l),S=Math.abs(c),E=Math.abs(h);let R,x,A,N,H,O,J,k,W,ee,$,Z;if(v>=S&&v>=E?(A=l,O=u,W=g,Z=p,l>=0?(R=c,x=h,N=f,H=d,J=_,k=m,ee=b,$=w):(R=h,x=c,N=d,H=f,J=m,k=_,ee=w,$=b)):S>=E?(A=c,O=f,W=_,Z=b,c>=0?(R=h,x=l,N=d,H=u,J=m,k=g,ee=w,$=p):(R=l,x=h,N=u,H=d,J=g,k=m,ee=p,$=w)):(A=h,O=d,W=m,Z=w,h>=0?(R=l,x=c,N=u,H=f,J=g,k=_,ee=p,$=b):(R=c,x=l,N=f,H=u,J=_,k=g,ee=b,$=p)),A===0)return null;const ie=R/A,re=x/A,ce=1/A,Re=N-ie*O,xe=H-re*O,_e=J-ie*W,Se=k-re*W,ke=ee-ie*Z,F=$-re*Z,D=ke*Se-F*_e,I=Re*F-xe*ke,P=_e*xe-Se*Re;if(r){if(D<0||I<0||P<0)return null}else if((D<0||I<0||P<0)&&(D>0||I>0||P>0))return null;const B=D+I+P;if(B===0)return null;const se=ce*(D*O+I*W+P*Z);return(B>0?se<0:se>0)?null:this.at(se/B,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class wr extends ys{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ye(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Yn,this.combine=Hl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const wc=new ft,mi=new id,bs=new Sr,Ec=new U,ws=new U,Es=new U,Ts=new U,Po=new U,As=new U,Tc=new U,Rs=new U;class ot extends Jt{constructor(e=new Mt,t=new wr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,a=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){As.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],u=s[l];h!==0&&(Po.fromBufferAttribute(u,e),a?As.addScaledVector(Po,h):As.addScaledVector(Po.sub(t),h))}t.add(As)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),bs.copy(i.boundingSphere),bs.applyMatrix4(s),mi.copy(e.ray).recast(e.near),!(bs.containsPoint(mi.origin)===!1&&(mi.intersectSphere(bs,Ec)===null||mi.origin.distanceToSquared(Ec)>(e.far-e.near)**2))&&(wc.copy(s).invert(),mi.copy(e.ray).applyMatrix4(wc),!(i.boundingBox!==null&&mi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,mi)))}_computeIntersections(e,t,i){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,u=s.attributes.normal,f=s.groups,d=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,_=f.length;g<_;g++){const m=f[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),w=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,S=w;v<S;v+=3){const E=o.getX(v),R=o.getX(v+1),x=o.getX(v+2);r=Cs(this,p,e,i,c,h,u,E,R,x),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),_=Math.min(o.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){const b=o.getX(m),w=o.getX(m+1),v=o.getX(m+2);r=Cs(this,a,e,i,c,h,u,b,w,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,_=f.length;g<_;g++){const m=f[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),w=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let v=b,S=w;v<S;v+=3){const E=v,R=v+1,x=v+2;r=Cs(this,p,e,i,c,h,u,E,R,x),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),_=Math.min(l.count,d.start+d.count);for(let m=g,p=_;m<p;m+=3){const b=m,w=m+1,v=m+2;r=Cs(this,a,e,i,c,h,u,b,w,v),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function rd(n,e,t,i,r,s,a,o){let l;if(e.side===Ht?l=i.intersectTriangle(a,s,r,!0,o):l=i.intersectTriangle(r,s,a,e.side===ai,o),l===null)return null;Rs.copy(o),Rs.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Rs);return c<t.near||c>t.far?null:{distance:c,point:Rs.clone(),object:n}}function Cs(n,e,t,i,r,s,a,o,l,c){n.getVertexPosition(o,ws),n.getVertexPosition(l,Es),n.getVertexPosition(c,Ts);const h=rd(n,e,t,i,ws,Es,Ts,Tc);if(h){const u=new U;pn.getBarycoord(Tc,ws,Es,Ts,u),r&&(h.uv=pn.getInterpolatedAttribute(r,o,l,c,u,new ae)),s&&(h.uv1=pn.getInterpolatedAttribute(s,o,l,c,u,new ae)),a&&(h.normal=pn.getInterpolatedAttribute(a,o,l,c,u,new U),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));const f={a:o,b:l,c,normal:new U,materialIndex:0};pn.getNormal(ws,Es,Ts,f.normal),h.face=f,h.barycoord=u}return h}class Lo extends Ot{constructor(e=null,t=1,i=1,r,s,a,o,l,c=It,h=It,u,f){super(null,a,o,l,c,h,r,s,u,f),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class _t extends Zt{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Xi=new ft,Ac=new ft,Ps=[],Rc=new ui,sd=new ft,Er=new ot,Tr=new Sr;class jt extends ot{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new _t(new Float32Array(i*16),16),this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,sd)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new ui),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Xi),Rc.copy(e.boundingBox).applyMatrix4(Xi),this.boundingBox.union(Rc)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Sr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Xi),Tr.copy(e.boundingSphere).applyMatrix4(Xi),this.boundingSphere.union(Tr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,a=e*s+1;for(let o=0;o<i.length;o++)i[o]=r[a+o]}raycast(e,t){const i=this.matrixWorld,r=this.count;if(Er.geometry=this.geometry,Er.material=this.material,Er.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Tr.copy(this.boundingSphere),Tr.applyMatrix4(i),e.ray.intersectsSphere(Tr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Xi),Ac.multiplyMatrices(i,Xi),Er.matrixWorld=Ac,Er.raycast(e,Ps);for(let a=0,o=Ps.length;a<o;a++){const l=Ps[a];l.instanceId=s,l.object=this,t.push(l)}Ps.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new _t(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new Lo(new Float32Array(r*this.count),r,this.count,ns,hn));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<i.length;c++)a+=i[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;return s[l]=o,s.set(i,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const gi=new Sr,ad=new ae(.5,.5),Ls=new U;class Cc{constructor(e=new Gn,t=new Gn,i=new Gn,r=new Gn,s=new Gn,a=new Gn){this.planes=[e,t,i,r,s,a]}set(e,t,i,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(i),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=En,i=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],h=s[4],u=s[5],f=s[6],d=s[7],g=s[8],_=s[9],m=s[10],p=s[11],b=s[12],w=s[13],v=s[14],S=s[15];if(r[0].setComponents(c-a,d-h,p-g,S-b).normalize(),r[1].setComponents(c+a,d+h,p+g,S+b).normalize(),r[2].setComponents(c+o,d+u,p+_,S+w).normalize(),r[3].setComponents(c-o,d-u,p-_,S-w).normalize(),i)r[4].setComponents(l,f,m,v).normalize(),r[5].setComponents(c-l,d-f,p-m,S-v).normalize();else if(r[4].setComponents(c-l,d-f,p-m,S-v).normalize(),t===En)r[5].setComponents(c+l,d+f,p+m,S+v).normalize();else if(t===fs)r[5].setComponents(l,f,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gi)}intersectsSprite(e){gi.center.set(0,0,0);const t=ad.distanceTo(e.center);return gi.radius=.7071067811865476+t,gi.applyMatrix4(e.matrixWorld),this.intersectsSphere(gi)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Ls.x=r.normal.x>0?e.max.x:e.min.x,Ls.y=r.normal.y>0?e.max.y:e.min.y,Ls.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Ls)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Pc extends Ot{constructor(e=[],t=oi,i,r,s,a,o,l,c,h){super(e,t,i,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Io extends Ot{constructor(e,t,i,r,s,a,o,l,c){super(e,t,i,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class Ar extends Ot{constructor(e,t,i=wn,r,s,a,o=It,l=It,c,h=Nn,u=1){if(h!==Nn&&h!==li)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const f={width:e,height:t,depth:u};super(f,r,s,a,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new fo(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class od extends Ar{constructor(e,t=wn,i=oi,r,s,a=It,o=It,l,c=Nn){const h={width:e,height:e,depth:1},u=[h,h,h,h,h,h];super(e,e,t,i,r,s,a,o,l,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Lc extends Ot{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Fe extends Mt{constructor(e=1,t=1,i=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],u=[];let f=0,d=0;g("z","y","x",-1,-1,i,t,e,a,s,0),g("z","y","x",1,-1,i,t,-e,a,s,1),g("x","z","y",1,1,e,i,t,r,a,2),g("x","z","y",1,-1,e,i,-t,r,a,3),g("x","y","z",1,-1,e,t,i,r,s,4),g("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new rt(c,3)),this.setAttribute("normal",new rt(h,3)),this.setAttribute("uv",new rt(u,2));function g(_,m,p,b,w,v,S,E,R,x,A){const N=v/R,H=S/x,O=v/2,J=S/2,k=E/2,W=R+1,ee=x+1;let $=0,Z=0;const ie=new U;for(let re=0;re<ee;re++){const ce=re*H-J;for(let Re=0;Re<W;Re++){const xe=Re*N-O;ie[_]=xe*b,ie[m]=ce*w,ie[p]=k,c.push(ie.x,ie.y,ie.z),ie[_]=0,ie[m]=0,ie[p]=E>0?1:-1,h.push(ie.x,ie.y,ie.z),u.push(Re/R),u.push(1-re/x),$+=1}}for(let re=0;re<x;re++)for(let ce=0;ce<R;ce++){const Re=f+ce+W*re,xe=f+ce+W*(re+1),_e=f+(ce+1)+W*(re+1),Se=f+(ce+1)+W*re;l.push(Re,xe,Se),l.push(xe,_e,Se),Z+=6}o.addGroup(d,Z,A),d+=Z,f+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fe(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Do extends Mt{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new U,h=new ae;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let u=0,f=3;u<=t;u++,f+=3){const d=i+u/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[f]/e+1)/2,h.y=(a[f+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)s.push(u,u+1,0);this.setIndex(s),this.setAttribute("position",new rt(a,3)),this.setAttribute("normal",new rt(o,3)),this.setAttribute("uv",new rt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Do(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class mt extends Mt{constructor(e=1,t=1,i=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const h=[],u=[],f=[],d=[];let g=0;const _=[],m=i/2;let p=0;b(),a===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new rt(u,3)),this.setAttribute("normal",new rt(f,3)),this.setAttribute("uv",new rt(d,2));function b(){const v=new U,S=new U;let E=0;const R=(t-e)/i;for(let x=0;x<=s;x++){const A=[],N=x/s,H=N*(t-e)+e;for(let O=0;O<=r;O++){const J=O/r,k=J*l+o,W=Math.sin(k),ee=Math.cos(k);S.x=H*W,S.y=-N*i+m,S.z=H*ee,u.push(S.x,S.y,S.z),v.set(W,R,ee).normalize(),f.push(v.x,v.y,v.z),d.push(J,1-N),A.push(g++)}_.push(A)}for(let x=0;x<r;x++)for(let A=0;A<s;A++){const N=_[A][x],H=_[A+1][x],O=_[A+1][x+1],J=_[A][x+1];(e>0||A!==0)&&(h.push(N,H,J),E+=3),(t>0||A!==s-1)&&(h.push(H,O,J),E+=3)}c.addGroup(p,E,0),p+=E}function w(v){const S=g,E=new ae,R=new U;let x=0;const A=v===!0?e:t,N=v===!0?1:-1;for(let O=1;O<=r;O++)u.push(0,m*N,0),f.push(0,N,0),d.push(.5,.5),g++;const H=g;for(let O=0;O<=r;O++){const k=O/r*l+o,W=Math.cos(k),ee=Math.sin(k);R.x=A*ee,R.y=m*N,R.z=A*W,u.push(R.x,R.y,R.z),f.push(0,N,0),E.x=W*.5+.5,E.y=ee*.5*N+.5,d.push(E.x,E.y),g++}for(let O=0;O<r;O++){const J=S+O,k=H+O;v===!0?h.push(k,k+1,J):h.push(k+1,k,J),x+=3}c.addGroup(p,x,v===!0?1:2),p+=x}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new mt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Tn{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ke("Curve: .getPoint() not implemented.")}getPointAt(e,t){const i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){const t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let i,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)i=this.getPoint(a/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){const i=this.getLengths();let r=0;const s=i.length;let a;t?a=t:a=e*i[s-1];let o=0,l=s-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=i[r]-a,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,i[r]===a)return r/(s-1);const h=i[r],f=i[r+1]-h,d=(a-h)/f;return(r+d)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);const a=this.getPoint(r),o=this.getPoint(s),l=t||(a.isVector2?new ae:new U);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){const i=new U,r=[],s=[],a=[],o=new U,l=new ft;for(let d=0;d<=e;d++){const g=d/e;r[d]=this.getTangentAt(g,new U)}s[0]=new U,a[0]=new U;let c=Number.MAX_VALUE;const h=Math.abs(r[0].x),u=Math.abs(r[0].y),f=Math.abs(r[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),f<=c&&i.set(0,0,1),o.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let d=1;d<=e;d++){if(s[d]=s[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(r[d-1],r[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(et(r[d-1].dot(r[d]),-1,1));s[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(r[d],s[d])}if(t===!0){let d=Math.acos(et(s[0].dot(s[e]),-1,1));d/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(d=-d);for(let g=1;g<=e;g++)s[g].applyMatrix4(l.makeRotationAxis(r[g],d*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}class No extends Tn{constructor(e=0,t=0,i=1,r=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ae){const i=t,r=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);const o=this.aStartAngle+e*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),f=l-this.aX,d=c-this.aY;l=f*h-d*u+this.aX,c=f*u+d*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}}class ld extends No{constructor(e,t,i,r,s,a){super(e,t,i,i,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Uo(){let n=0,e=0,t=0,i=0;function r(s,a,o,l){n=s,e=o,t=-3*s+3*a-2*o-l,i=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){r(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,h,u){let f=(a-s)/c-(o-s)/(c+h)+(o-a)/h,d=(o-a)/h-(l-a)/(h+u)+(l-o)/u;f*=h,d*=h,r(a,o,f,d)},calc:function(s){const a=s*s,o=a*s;return n+e*s+t*a+i*o}}}const Ic=new U,Dc=new U,Fo=new Uo,Oo=new Uo,zo=new Uo;class Bo extends Tn{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new U){const i=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,h;this.closed||o>0?c=r[(o-1)%s]:(Dc.subVectors(r[0],r[1]).add(r[0]),c=Dc);const u=r[o%s],f=r[(o+1)%s];if(this.closed||o+2<s?h=r[(o+2)%s]:(Ic.subVectors(r[s-1],r[s-2]).add(r[s-1]),h=Ic),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(u),d),_=Math.pow(u.distanceToSquared(f),d),m=Math.pow(f.distanceToSquared(h),d);_<1e-4&&(_=1),g<1e-4&&(g=_),m<1e-4&&(m=_),Fo.initNonuniformCatmullRom(c.x,u.x,f.x,h.x,g,_,m),Oo.initNonuniformCatmullRom(c.y,u.y,f.y,h.y,g,_,m),zo.initNonuniformCatmullRom(c.z,u.z,f.z,h.z,g,_,m)}else this.curveType==="catmullrom"&&(Fo.initCatmullRom(c.x,u.x,f.x,h.x,this.tension),Oo.initCatmullRom(c.y,u.y,f.y,h.y,this.tension),zo.initCatmullRom(c.z,u.z,f.z,h.z,this.tension));return i.set(Fo.calc(l),Oo.calc(l),zo.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(new U().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}function Nc(n,e,t,i,r){const s=(i-e)*.5,a=(r-t)*.5,o=n*n,l=n*o;return(2*t-2*i+s+a)*l+(-3*t+3*i-2*s-a)*o+s*n+t}function cd(n,e){const t=1-n;return t*t*e}function hd(n,e){return 2*(1-n)*n*e}function fd(n,e){return n*n*e}function Rr(n,e,t,i){return cd(n,e)+hd(n,t)+fd(n,i)}function ud(n,e){const t=1-n;return t*t*t*e}function dd(n,e){const t=1-n;return 3*t*t*n*e}function pd(n,e){return 3*(1-n)*n*n*e}function md(n,e){return n*n*n*e}function Cr(n,e,t,i,r){return ud(n,e)+dd(n,t)+pd(n,i)+md(n,r)}class Uc extends Tn{constructor(e=new ae,t=new ae,i=new ae,r=new ae){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new ae){const i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Cr(e,r.x,s.x,a.x,o.x),Cr(e,r.y,s.y,a.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class gd extends Tn{constructor(e=new U,t=new U,i=new U,r=new U){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new U){const i=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return i.set(Cr(e,r.x,s.x,a.x,o.x),Cr(e,r.y,s.y,a.y,o.y),Cr(e,r.z,s.z,a.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class Fc extends Tn{constructor(e=new ae,t=new ae){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ae){const i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ae){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class vd extends Tn{constructor(e=new U,t=new U){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new U){const i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new U){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Oc extends Tn{constructor(e=new ae,t=new ae,i=new ae){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ae){const i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(Rr(e,r.x,s.x,a.x),Rr(e,r.y,s.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class zc extends Tn{constructor(e=new U,t=new U,i=new U){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new U){const i=t,r=this.v0,s=this.v1,a=this.v2;return i.set(Rr(e,r.x,s.x,a.x),Rr(e,r.y,s.y,a.y),Rr(e,r.z,s.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Bc extends Tn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ae){const i=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,l=r[a===0?a:a-1],c=r[a],h=r[a>r.length-2?r.length-1:a+1],u=r[a>r.length-3?r.length-1:a+2];return i.set(Nc(o,l.x,c.x,h.x,u.x),Nc(o,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){const r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){const r=e.points[t];this.points.push(new ae().fromArray(r))}return this}}var Is=Object.freeze({__proto__:null,ArcCurve:ld,CatmullRomCurve3:Bo,CubicBezierCurve:Uc,CubicBezierCurve3:gd,EllipseCurve:No,LineCurve:Fc,LineCurve3:vd,QuadraticBezierCurve:Oc,QuadraticBezierCurve3:zc,SplineCurve:Bc});class xd extends Tn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Is[i](t,e))}return this}getPoint(e,t){const i=e*this.getLength(),r=this.getCurveLengths();let s=0;for(;s<r.length;){if(r[s]>=i){const a=r[s]-i,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}s++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let i;for(let r=0,s=this.curves;r<s.length;r++){const a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){const r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){const r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){const r=e.curves[t];this.curves.push(new Is[r.type]().fromJSON(r))}return this}}class vi extends xd{constructor(e){super(),this.type="Path",this.currentPoint=new ae,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const i=new Fc(this.currentPoint.clone(),new ae(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){const s=new Oc(this.currentPoint.clone(),new ae(e,t),new ae(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,a){const o=new Uc(this.currentPoint.clone(),new ae(e,t),new ae(i,r),new ae(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),i=new Bc(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,i,r,s,a),this}absarc(e,t,i,r,s,a){return this.absellipse(e,t,i,i,r,s,a),this}ellipse(e,t,i,r,s,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,r,s,a,o,l),this}absellipse(e,t,i,r,s,a,o,l){const c=new No(e,t,i,r,s,a,o,l);if(this.curves.length>0){const u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}}class qi extends vi{constructor(e){super(e),this.uuid=fi(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){const r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){const r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){const r=e.holes[t];this.holes.push(new vi().fromJSON(r))}return this}}function _d(n,e,t=2){const i=e&&e.length,r=i?e[0]*t:n.length;let s=kc(n,0,r,t,!0);const a=[];if(!s||s.next===s.prev)return a;let o,l,c;if(i&&(s=wd(n,e,s,t)),n.length>80*t){o=n[0],l=n[1];let h=o,u=l;for(let f=t;f<r;f+=t){const d=n[f],g=n[f+1];d<o&&(o=d),g<l&&(l=g),d>h&&(h=d),g>u&&(u=g)}c=Math.max(h-o,u-l),c=c!==0?32767/c:0}return Pr(s,a,t,o,l,c,0),a}function kc(n,e,t,i,r){let s;if(r===Ud(n,e,t,i)>0)for(let a=e;a<t;a+=i)s=Wc(a/i|0,n[a],n[a+1],s);else for(let a=t-i;a>=e;a-=i)s=Wc(a/i|0,n[a],n[a+1],s);return s&&Yi(s,s.next)&&(Dr(s),s=s.next),s}function xi(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(Yi(t,t.next)||yt(t.prev,t,t.next)===0)){if(Dr(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function Pr(n,e,t,i,r,s,a){if(!n)return;!a&&s&&Cd(n,i,r,s);let o=n;for(;n.prev!==n.next;){const l=n.prev,c=n.next;if(s?Md(n,i,r,s):yd(n)){e.push(l.i,n.i,c.i),Dr(n),n=c.next,o=c.next;continue}if(n=c,n===o){a?a===1?(n=Sd(xi(n),e),Pr(n,e,t,i,r,s,2)):a===2&&bd(n,e,t,i,r,s):Pr(xi(n),e,t,i,r,s,1);break}}}function yd(n){const e=n.prev,t=n,i=n.next;if(yt(e,t,i)>=0)return!1;const r=e.x,s=t.x,a=i.x,o=e.y,l=t.y,c=i.y,h=Math.min(r,s,a),u=Math.min(o,l,c),f=Math.max(r,s,a),d=Math.max(o,l,c);let g=i.next;for(;g!==e;){if(g.x>=h&&g.x<=f&&g.y>=u&&g.y<=d&&Lr(r,o,s,l,a,c,g.x,g.y)&&yt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Md(n,e,t,i){const r=n.prev,s=n,a=n.next;if(yt(r,s,a)>=0)return!1;const o=r.x,l=s.x,c=a.x,h=r.y,u=s.y,f=a.y,d=Math.min(o,l,c),g=Math.min(h,u,f),_=Math.max(o,l,c),m=Math.max(h,u,f),p=ko(d,g,e,t,i),b=ko(_,m,e,t,i);let w=n.prevZ,v=n.nextZ;for(;w&&w.z>=p&&v&&v.z<=b;){if(w.x>=d&&w.x<=_&&w.y>=g&&w.y<=m&&w!==r&&w!==a&&Lr(o,h,l,u,c,f,w.x,w.y)&&yt(w.prev,w,w.next)>=0||(w=w.prevZ,v.x>=d&&v.x<=_&&v.y>=g&&v.y<=m&&v!==r&&v!==a&&Lr(o,h,l,u,c,f,v.x,v.y)&&yt(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;w&&w.z>=p;){if(w.x>=d&&w.x<=_&&w.y>=g&&w.y<=m&&w!==r&&w!==a&&Lr(o,h,l,u,c,f,w.x,w.y)&&yt(w.prev,w,w.next)>=0)return!1;w=w.prevZ}for(;v&&v.z<=b;){if(v.x>=d&&v.x<=_&&v.y>=g&&v.y<=m&&v!==r&&v!==a&&Lr(o,h,l,u,c,f,v.x,v.y)&&yt(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function Sd(n,e){let t=n;do{const i=t.prev,r=t.next.next;!Yi(i,r)&&Gc(i,t,t.next,r)&&Ir(i,r)&&Ir(r,i)&&(e.push(i.i,t.i,r.i),Dr(t),Dr(t.next),t=n=r),t=t.next}while(t!==n);return xi(t)}function bd(n,e,t,i,r,s){let a=n;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Id(a,o)){let l=Vc(a,o);a=xi(a,a.next),l=xi(l,l.next),Pr(a,e,t,i,r,s,0),Pr(l,e,t,i,r,s,0);return}o=o.next}a=a.next}while(a!==n)}function wd(n,e,t,i){const r=[];for(let s=0,a=e.length;s<a;s++){const o=e[s]*i,l=s<a-1?e[s+1]*i:n.length,c=kc(n,o,l,i,!1);c===c.next&&(c.steiner=!0),r.push(Ld(c))}r.sort(Ed);for(let s=0;s<r.length;s++)t=Td(r[s],t);return t}function Ed(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){const i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function Td(n,e){const t=Ad(n,e);if(!t)return e;const i=Vc(t,n);return xi(i,i.next),xi(t,t.next)}function Ad(n,e){let t=e;const i=n.x,r=n.y;let s=-1/0,a;if(Yi(n,t))return t;do{if(Yi(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){const u=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(u<=i&&u>s&&(s=u,a=t.x<t.next.x?t:t.next,u===i))return a}t=t.next}while(t!==e);if(!a)return null;const o=a,l=a.x,c=a.y;let h=1/0;t=a;do{if(i>=t.x&&t.x>=l&&i!==t.x&&Hc(r<c?i:s,r,l,c,r<c?s:i,r,t.x,t.y)){const u=Math.abs(r-t.y)/(i-t.x);Ir(t,n)&&(u<h||u===h&&(t.x>a.x||t.x===a.x&&Rd(a,t)))&&(a=t,h=u)}t=t.next}while(t!==o);return a}function Rd(n,e){return yt(n.prev,n,e.prev)<0&&yt(e.next,n,n.next)<0}function Cd(n,e,t,i){let r=n;do r.z===0&&(r.z=ko(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,Pd(r)}function Pd(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let a=i,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||i.z<=a.z)?(r=i,i=i.nextZ,o--):(r=a,a=a.nextZ,l--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=a}s.nextZ=null,t*=2}while(e>1);return n}function ko(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function Ld(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function Hc(n,e,t,i,r,s,a,o){return(r-a)*(e-o)>=(n-a)*(s-o)&&(n-a)*(i-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(i-o)}function Lr(n,e,t,i,r,s,a,o){return!(n===a&&e===o)&&Hc(n,e,t,i,r,s,a,o)}function Id(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!Dd(n,e)&&(Ir(n,e)&&Ir(e,n)&&Nd(n,e)&&(yt(n.prev,n,e.prev)||yt(n,e.prev,e))||Yi(n,e)&&yt(n.prev,n,n.next)>0&&yt(e.prev,e,e.next)>0)}function yt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Yi(n,e){return n.x===e.x&&n.y===e.y}function Gc(n,e,t,i){const r=Ns(yt(n,e,t)),s=Ns(yt(n,e,i)),a=Ns(yt(t,i,n)),o=Ns(yt(t,i,e));return!!(r!==s&&a!==o||r===0&&Ds(n,t,e)||s===0&&Ds(n,i,e)||a===0&&Ds(t,n,i)||o===0&&Ds(t,e,i))}function Ds(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function Ns(n){return n>0?1:n<0?-1:0}function Dd(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&Gc(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function Ir(n,e){return yt(n.prev,n,n.next)<0?yt(n,e,n.next)>=0&&yt(n,n.prev,e)>=0:yt(n,e,n.prev)<0||yt(n,n.next,e)<0}function Nd(n,e){let t=n,i=!1;const r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Vc(n,e){const t=Ho(n.i,n.x,n.y),i=Ho(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Wc(n,e,t,i){const r=Ho(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function Dr(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Ho(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Ud(n,e,t,i){let r=0;for(let s=e,a=t-i;s<t;s+=i)r+=(n[a]-n[s])*(n[s+1]+n[a+1]),a=s;return r}class Fd{static triangulate(e,t,i=2){return _d(e,t,i)}}class Jn{static area(e){const t=e.length;let i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return Jn.area(e)<0}static triangulateShape(e,t){const i=[],r=[],s=[];Xc(e),qc(i,e);let a=e.length;t.forEach(Xc);for(let l=0;l<t.length;l++)r.push(a),a+=t[l].length,qc(i,t[l]);const o=Fd.triangulate(i,r);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}}function Xc(n){const e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function qc(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}class Zi extends Mt{constructor(e=new qi([new ae(.5,.5),new ae(-.5,.5),new ae(-.5,-.5),new ae(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];const i=this,r=[],s=[];for(let o=0,l=e.length;o<l;o++){const c=e[o];a(c)}this.setAttribute("position",new rt(r,3)),this.setAttribute("uv",new rt(s,2)),this.computeVertexNormals();function a(o){const l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1;let f=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,_=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3;const p=t.extrudePath,b=t.UVGenerator!==void 0?t.UVGenerator:Od;let w,v=!1,S,E,R,x;if(p){w=p.getSpacedPoints(h),v=!0,f=!1;const C=p.isCatmullRomCurve3?p.closed:!1;S=p.computeFrenetFrames(h,C),E=new U,R=new U,x=new U}f||(m=0,d=0,g=0,_=0);const A=o.extractPoints(c);let N=A.shape;const H=A.holes;if(!Jn.isClockWise(N)){N=N.reverse();for(let C=0,G=H.length;C<G;C++){const z=H[C];Jn.isClockWise(z)&&(H[C]=z.reverse())}}function J(C){const z=10000000000000001e-36;let K=C[0];for(let Q=1;Q<=C.length;Q++){const he=Q%C.length,ge=C[he],pe=ge.x-K.x,Y=ge.y-K.y,M=pe*pe+Y*Y,Pe=Math.max(Math.abs(ge.x),Math.abs(ge.y),Math.abs(K.x),Math.abs(K.y)),Oe=z*Pe*Pe;if(M<=Oe){C.splice(he,1),Q--;continue}K=ge}}J(N),H.forEach(J);const k=H.length,W=N;for(let C=0;C<k;C++){const G=H[C];N=N.concat(G)}function ee(C,G,z){return G||st("ExtrudeGeometry: vec does not exist"),C.clone().addScaledVector(G,z)}const $=N.length;function Z(C,G,z){let K,Q,he;const ge=C.x-G.x,pe=C.y-G.y,Y=z.x-C.x,M=z.y-C.y,Pe=ge*ge+pe*pe,Oe=ge*M-pe*Y;if(Math.abs(Oe)>Number.EPSILON){const L=Math.sqrt(Pe),y=Math.sqrt(Y*Y+M*M),q=G.x-pe/L,j=G.y+ge/L,le=z.x-M/y,ye=z.y+Y/y,Me=((le-q)*M-(ye-j)*Y)/(ge*M-pe*Y);K=q+ge*Me-C.x,Q=j+pe*Me-C.y;const fe=K*K+Q*Q;if(fe<=2)return new ae(K,Q);he=Math.sqrt(fe/2)}else{let L=!1;ge>Number.EPSILON?Y>Number.EPSILON&&(L=!0):ge<-Number.EPSILON?Y<-Number.EPSILON&&(L=!0):Math.sign(pe)===Math.sign(M)&&(L=!0),L?(K=-pe,Q=ge,he=Math.sqrt(Pe)):(K=ge,Q=pe,he=Math.sqrt(Pe/2))}return new ae(K/he,Q/he)}const ie=[];for(let C=0,G=W.length,z=G-1,K=C+1;C<G;C++,z++,K++)z===G&&(z=0),K===G&&(K=0),ie[C]=Z(W[C],W[z],W[K]);const re=[];let ce,Re=ie.concat();for(let C=0,G=k;C<G;C++){const z=H[C];ce=[];for(let K=0,Q=z.length,he=Q-1,ge=K+1;K<Q;K++,he++,ge++)he===Q&&(he=0),ge===Q&&(ge=0),ce[K]=Z(z[K],z[he],z[ge]);re.push(ce),Re=Re.concat(ce)}let xe;if(m===0)xe=Jn.triangulateShape(W,H);else{const C=[],G=[];for(let z=0;z<m;z++){const K=z/m,Q=d*Math.cos(K*Math.PI/2),he=g*Math.sin(K*Math.PI/2)+_;for(let ge=0,pe=W.length;ge<pe;ge++){const Y=ee(W[ge],ie[ge],he);I(Y.x,Y.y,-Q),K===0&&C.push(Y)}for(let ge=0,pe=k;ge<pe;ge++){const Y=H[ge];ce=re[ge];const M=[];for(let Pe=0,Oe=Y.length;Pe<Oe;Pe++){const L=ee(Y[Pe],ce[Pe],he);I(L.x,L.y,-Q),K===0&&M.push(L)}K===0&&G.push(M)}}xe=Jn.triangulateShape(C,G)}const _e=xe.length,Se=g+_;for(let C=0;C<$;C++){const G=f?ee(N[C],Re[C],Se):N[C];v?(R.copy(S.normals[0]).multiplyScalar(G.x),E.copy(S.binormals[0]).multiplyScalar(G.y),x.copy(w[0]).add(R).add(E),I(x.x,x.y,x.z)):I(G.x,G.y,0)}for(let C=1;C<=h;C++)for(let G=0;G<$;G++){const z=f?ee(N[G],Re[G],Se):N[G];v?(R.copy(S.normals[C]).multiplyScalar(z.x),E.copy(S.binormals[C]).multiplyScalar(z.y),x.copy(w[C]).add(R).add(E),I(x.x,x.y,x.z)):I(z.x,z.y,u/h*C)}for(let C=m-1;C>=0;C--){const G=C/m,z=d*Math.cos(G*Math.PI/2),K=g*Math.sin(G*Math.PI/2)+_;for(let Q=0,he=W.length;Q<he;Q++){const ge=ee(W[Q],ie[Q],K);I(ge.x,ge.y,u+z)}for(let Q=0,he=H.length;Q<he;Q++){const ge=H[Q];ce=re[Q];for(let pe=0,Y=ge.length;pe<Y;pe++){const M=ee(ge[pe],ce[pe],K);v?I(M.x,M.y+w[h-1].y,w[h-1].x+z):I(M.x,M.y,u+z)}}}ke(),F();function ke(){const C=r.length/3;if(f){let G=0,z=$*G;for(let K=0;K<_e;K++){const Q=xe[K];P(Q[2]+z,Q[1]+z,Q[0]+z)}G=h+m*2,z=$*G;for(let K=0;K<_e;K++){const Q=xe[K];P(Q[0]+z,Q[1]+z,Q[2]+z)}}else{for(let G=0;G<_e;G++){const z=xe[G];P(z[2],z[1],z[0])}for(let G=0;G<_e;G++){const z=xe[G];P(z[0]+$*h,z[1]+$*h,z[2]+$*h)}}i.addGroup(C,r.length/3-C,0)}function F(){const C=r.length/3;let G=0;D(W,G),G+=W.length;for(let z=0,K=H.length;z<K;z++){const Q=H[z];D(Q,G),G+=Q.length}i.addGroup(C,r.length/3-C,1)}function D(C,G){let z=C.length;for(;--z>=0;){const K=z;let Q=z-1;Q<0&&(Q=C.length-1);for(let he=0,ge=h+m*2;he<ge;he++){const pe=$*he,Y=$*(he+1),M=G+K+pe,Pe=G+Q+pe,Oe=G+Q+Y,L=G+K+Y;B(M,Pe,Oe,L)}}}function I(C,G,z){l.push(C),l.push(G),l.push(z)}function P(C,G,z){se(C),se(G),se(z);const K=r.length/3,Q=b.generateTopUV(i,r,K-3,K-2,K-1);me(Q[0]),me(Q[1]),me(Q[2])}function B(C,G,z,K){se(C),se(G),se(K),se(G),se(z),se(K);const Q=r.length/3,he=b.generateSideWallUV(i,r,Q-6,Q-3,Q-2,Q-1);me(he[0]),me(he[1]),me(he[3]),me(he[1]),me(he[2]),me(he[3])}function se(C){r.push(l[C*3+0]),r.push(l[C*3+1]),r.push(l[C*3+2])}function me(C){s.push(C.x),s.push(C.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return zd(t,i,e)}static fromJSON(e,t){const i=[];for(let s=0,a=e.shapes.length;s<a;s++){const o=t[e.shapes[s]];i.push(o)}const r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new Is[r.type]().fromJSON(r)),new Zi(i,e.options)}}const Od={generateTopUV:function(n,e,t,i,r){const s=e[t*3],a=e[t*3+1],o=e[i*3],l=e[i*3+1],c=e[r*3],h=e[r*3+1];return[new ae(s,a),new ae(o,l),new ae(c,h)]},generateSideWallUV:function(n,e,t,i,r,s){const a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[i*3],h=e[i*3+1],u=e[i*3+2],f=e[r*3],d=e[r*3+1],g=e[r*3+2],_=e[s*3],m=e[s*3+1],p=e[s*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new ae(a,1-l),new ae(c,1-u),new ae(f,1-g),new ae(_,1-p)]:[new ae(o,1-l),new ae(h,1-u),new ae(d,1-g),new ae(m,1-p)]}};function zd(n,e,t){if(t.shapes=[],Array.isArray(n))for(let i=0,r=n.length;i<r;i++){const s=n[i];t.shapes.push(s.uuid)}else t.shapes.push(n.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}class Go extends Mt{constructor(e=[new ae(0,-.5),new ae(.5,0),new ae(0,.5)],t=12,i=0,r=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:r},t=Math.floor(t),r=et(r,0,Math.PI*2);const s=[],a=[],o=[],l=[],c=[],h=1/t,u=new U,f=new ae,d=new U,g=new U,_=new U;let m=0,p=0;for(let b=0;b<=e.length-1;b++)switch(b){case 0:m=e[b+1].x-e[b].x,p=e[b+1].y-e[b].y,d.x=p*1,d.y=-m,d.z=p*0,_.copy(d),d.normalize(),l.push(d.x,d.y,d.z);break;case e.length-1:l.push(_.x,_.y,_.z);break;default:m=e[b+1].x-e[b].x,p=e[b+1].y-e[b].y,d.x=p*1,d.y=-m,d.z=p*0,g.copy(d),d.x+=_.x,d.y+=_.y,d.z+=_.z,d.normalize(),l.push(d.x,d.y,d.z),_.copy(g)}for(let b=0;b<=t;b++){const w=i+b*h*r,v=Math.sin(w),S=Math.cos(w);for(let E=0;E<=e.length-1;E++){u.x=e[E].x*v,u.y=e[E].y,u.z=e[E].x*S,a.push(u.x,u.y,u.z),f.x=b/t,f.y=E/(e.length-1),o.push(f.x,f.y);const R=l[3*E+0]*v,x=l[3*E+1],A=l[3*E+0]*S;c.push(R,x,A)}}for(let b=0;b<t;b++)for(let w=0;w<e.length-1;w++){const v=w+b*e.length,S=v,E=v+e.length,R=v+e.length+1,x=v+1;s.push(S,E,x),s.push(R,x,E)}this.setIndex(s),this.setAttribute("position",new rt(a,3)),this.setAttribute("uv",new rt(o,2)),this.setAttribute("normal",new rt(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Go(e.points,e.segments,e.phiStart,e.phiLength)}}class Ki extends Mt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(i),l=Math.floor(r),c=o+1,h=l+1,u=e/o,f=t/l,d=[],g=[],_=[],m=[];for(let p=0;p<h;p++){const b=p*f-a;for(let w=0;w<c;w++){const v=w*u-s;g.push(v,-b,0),_.push(0,0,1),m.push(w/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<o;b++){const w=b+c*p,v=b+c*(p+1),S=b+1+c*(p+1),E=b+1+c*p;d.push(w,v,E),d.push(v,S,E)}this.setIndex(d),this.setAttribute("position",new rt(g,3)),this.setAttribute("normal",new rt(_,3)),this.setAttribute("uv",new rt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ki(e.width,e.height,e.widthSegments,e.heightSegments)}}class _i extends Mt{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(a+o,Math.PI);let c=0;const h=[],u=new U,f=new U,d=[],g=[],_=[],m=[];for(let p=0;p<=i;p++){const b=[],w=p/i,v=a+w*o,S=e*Math.cos(v),E=Math.sqrt(e*e-S*S);let R=0;p===0&&a===0?R=.5/t:p===i&&l===Math.PI&&(R=-.5/t);for(let x=0;x<=t;x++){const A=x/t,N=r+A*s;u.x=-E*Math.cos(N),u.y=S,u.z=E*Math.sin(N),g.push(u.x,u.y,u.z),f.copy(u).normalize(),_.push(f.x,f.y,f.z),m.push(A+R,1-w),b.push(c++)}h.push(b)}for(let p=0;p<i;p++)for(let b=0;b<t;b++){const w=h[p][b+1],v=h[p][b],S=h[p+1][b],E=h[p+1][b+1];(p!==0||a>0)&&d.push(w,v,E),(p!==i-1||l<Math.PI)&&d.push(v,S,E)}this.setIndex(d),this.setAttribute("position",new rt(g,3)),this.setAttribute("normal",new rt(_,3)),this.setAttribute("uv",new rt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new _i(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Nr extends Mt{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},i=Math.floor(i),r=Math.floor(r);const l=[],c=[],h=[],u=[],f=new U,d=new U,g=new U;for(let _=0;_<=i;_++){const m=a+_/i*o;for(let p=0;p<=r;p++){const b=p/r*s;d.x=(e+t*Math.cos(m))*Math.cos(b),d.y=(e+t*Math.cos(m))*Math.sin(b),d.z=t*Math.sin(m),c.push(d.x,d.y,d.z),f.x=e*Math.cos(b),f.y=e*Math.sin(b),g.subVectors(d,f).normalize(),h.push(g.x,g.y,g.z),u.push(p/r),u.push(_/i)}}for(let _=1;_<=i;_++)for(let m=1;m<=r;m++){const p=(r+1)*_+m-1,b=(r+1)*(_-1)+m-1,w=(r+1)*(_-1)+m,v=(r+1)*_+m;l.push(p,b,v),l.push(b,w,v)}this.setIndex(l),this.setAttribute("position",new rt(c,3)),this.setAttribute("normal",new rt(h,3)),this.setAttribute("uv",new rt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Nr(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}class Us extends Mt{constructor(e=new zc(new U(-1,-1,0),new U(-1,1,0),new U(1,1,0)),t=64,i=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:r,closed:s};const a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new U,l=new U,c=new ae;let h=new U;const u=[],f=[],d=[],g=[];_(),this.setIndex(g),this.setAttribute("position",new rt(u,3)),this.setAttribute("normal",new rt(f,3)),this.setAttribute("uv",new rt(d,2));function _(){for(let w=0;w<t;w++)m(w);m(s===!1?t:0),b(),p()}function m(w){h=e.getPointAt(w/t,h);const v=a.normals[w],S=a.binormals[w];for(let E=0;E<=r;E++){const R=E/r*Math.PI*2,x=Math.sin(R),A=-Math.cos(R);l.x=A*v.x+x*S.x,l.y=A*v.y+x*S.y,l.z=A*v.z+x*S.z,l.normalize(),f.push(l.x,l.y,l.z),o.x=h.x+i*l.x,o.y=h.y+i*l.y,o.z=h.z+i*l.z,u.push(o.x,o.y,o.z)}}function p(){for(let w=1;w<=t;w++)for(let v=1;v<=r;v++){const S=(r+1)*(w-1)+(v-1),E=(r+1)*w+(v-1),R=(r+1)*w+v,x=(r+1)*(w-1)+v;g.push(S,E,x),g.push(E,R,x)}}function b(){for(let w=0;w<=t;w++)for(let v=0;v<=r;v++)c.x=w/t,c.y=v/r,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new Us(new Is[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}}function $i(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];if(Yc(r))r.isRenderTargetTexture?(Ke("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Yc(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function Vt(n){const e={};for(let t=0;t<n.length;t++){const i=$i(n[t]);for(const r in i)e[r]=i[r]}return e}function Yc(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function Bd(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Zc(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:it.workingColorSpace}const Ur={clone:$i,merge:Vt};var kd=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Hd=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class St extends ys{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=kd,this.fragmentShader=Hd,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=$i(e.uniforms),this.uniformsGroups=Bd(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const i in e.uniforms){const r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Ye().setHex(r.value);break;case"v2":this.uniforms[i].value=new ae().fromArray(r.value);break;case"v3":this.uniforms[i].value=new U().fromArray(r.value);break;case"v4":this.uniforms[i].value=new pt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new qe().fromArray(r.value);break;case"m4":this.uniforms[i].value=new ft().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Gd extends St{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Vd extends ys{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=au,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Wd extends ys{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Kc={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&($c(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!$c(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function $c(n){try{const e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class Xd{constructor(e,t,i){const r=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,s===!1&&r.onStart!==void 0&&r.onStart(h,a,o),s=!0},this.itemEnd=function(h){a++,r.onProgress!==void 0&&r.onProgress(h,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){const u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){const d=c[u],g=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const qd=new Xd;class Vo{constructor(e){this.manager=e!==void 0?e:qd,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Vo.DEFAULT_MATERIAL_NAME="__DEFAULT";const Wn={};class Yd extends Error{constructor(e,t){super(e),this.response=t}}class Zd extends Vo{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=Kc.get(`file:${e}`);if(s!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0);return}if(Wn[e]!==void 0){Wn[e].push({onLoad:t,onProgress:i,onError:r});return}Wn[e]=[],Wn[e].push({onLoad:t,onProgress:i,onError:r});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ke("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=Wn[e],u=c.body.getReader(),f=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=f?parseInt(f):0,g=d!==0;let _=0;const m=new ReadableStream({start(p){b();function b(){u.read().then(({done:w,value:v})=>{if(w)p.close();else{_+=v.byteLength;const S=new ProgressEvent("progress",{lengthComputable:g,loaded:_,total:d});for(let E=0,R=h.length;E<R;E++){const x=h[E];x.onProgress&&x.onProgress(S)}p.enqueue(v),b()}},w=>{p.error(w)})}}});return new Response(m)}else throw new Yd(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{const u=/charset="?([^;"\s]*)"?/i.exec(o),f=u&&u[1]?u[1].toLowerCase():void 0,d=new TextDecoder(f);return c.arrayBuffer().then(g=>d.decode(g))}}}).then(c=>{Kc.add(`file:${e}`,c);const h=Wn[e];delete Wn[e];for(let u=0,f=h.length;u<f;u++){const d=h[u];d.onLoad&&d.onLoad(c)}}).catch(c=>{const h=Wn[e];if(h===void 0)throw this.manager.itemError(e),c;delete Wn[e];for(let u=0,f=h.length;u<f;u++){const d=h[u];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Fs=new U,Os=new Fn,An=new U;class Jc extends Jt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ft,this.projectionMatrix=new ft,this.projectionMatrixInverse=new ft,this.coordinateSystem=En,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Fs,Os,An),An.x===1&&An.y===1&&An.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Fs,Os,An.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Fs,Os,An),An.x===1&&An.y===1&&An.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Fs,Os,An.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Qn=new U,Qc=new ae,jc=new ae;class en extends Jc{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=gr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(mr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return gr*2*Math.atan(Math.tan(mr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Qn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Qn.x,Qn.y).multiplyScalar(-e/Qn.z),Qn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Qn.x,Qn.y).multiplyScalar(-e/Qn.z)}getViewSize(e,t){return this.getViewBounds(e,Qc,jc),t.subVectors(jc,Qc)}setViewOffset(e,t,i,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(mr*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*i/c,r*=a.width/l,i*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class Wo extends Jc{constructor(e=-1,t=1,i=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,a=i+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Kd extends Mt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const Ji=-90,Qi=1;class $d extends Jt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new en(Ji,Qi,e,t);r.layers=this.layers,this.add(r);const s=new en(Ji,Qi,e,t);s.layers=this.layers,this.add(s);const a=new en(Ji,Qi,e,t);a.layers=this.layers,this.add(a);const o=new en(Ji,Qi,e,t);o.layers=this.layers,this.add(o);const l=new en(Ji,Qi,e,t);l.layers=this.layers,this.add(l);const c=new en(Ji,Qi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===En)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===fs)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,u=e.getRenderTarget(),f=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const _=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=_,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(u,f,d),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}}class Jd extends en{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class Qd{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=jd.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}}function jd(){this._document.hidden===!1&&this.reset()}const Il=class Il{constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};Il.prototype.isMatrix2=!0;let eh=Il;const th=new ae;class nh{constructor(e=new ae(1/0,1/0),t=new ae(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=th.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,th).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}class yi{constructor(){this.type="ShapePath",this.color=new Ye,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new vi,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,i,r){return this.currentPath.quadraticCurveTo(e,t,i,r),this}bezierCurveTo(e,t,i,r,s,a){return this.currentPath.bezierCurveTo(e,t,i,r,s,a),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(l,c){let h=!1;const u=c.length;for(let f=0,d=u-1;f<u;d=f++){const g=c[f],_=c[d];g.y>l.y!=_.y>l.y&&l.x<(_.x-g.x)*(l.y-g.y)/(_.y-g.y)+g.x&&(h=!h)}return h}function t(l,c){const h=c.getCenter(new ae);if(e(h,l))return h;const u=h.y,f=[],d=l.length;for(let g=0;g<d;g++){const _=l[g],m=l[(g+1)%d];if(_.y>u!=m.y>u){const p=_.x+(u-_.y)*(m.x-_.x)/(m.y-_.y);f.push(p)}}return f.length>1&&(f.sort((g,_)=>g-_),h.x=(f[0]+f[1])/2),h}let i=this.userData.style&&this.userData.style.fillRule||"nonzero";i!=="nonzero"&&i!=="evenodd"&&(Ke('Fill-rule "'+i+'" is not supported, falling back to "nonzero".'),i="nonzero");const r=i==="nonzero"?(l=>l!==0):(l=>(l&1)!==0),s=[];for(const l of this.subPaths){const c=l.getPoints();if(c.length<3)continue;const h=Jn.area(c);if(h===0)continue;const u=new nh;for(let f=0;f<c.length;f++)u.expandByPoint(c[f]);s.push({subPath:l,points:c,boundingBox:u,interiorPoint:t(c,u),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}s.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<s.length;l++){const c=s[l];let h=0;for(let u=l-1;u>=0;u--){const f=s[u];if(f.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,f.points)){c.container=f.exclude?f.container:f,h=f.winding,c.winding+=h;break}}r(c.winding)===r(h)&&(c.exclude=!0)}for(const l of s)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");const a=[],o=new Map;for(const l of s){if(l.exclude||l.role!=="outer")continue;const c=new qi;c.curves=l.subPath.curves,a.push(c),o.set(l,c)}for(const l of s){if(l.exclude||l.role!=="hole")continue;const c=o.get(l.container);if(!c)continue;const h=new vi;h.curves=l.subPath.curves,c.holes.push(h)}return a}}function ih(n,e,t,i){const r=ep(i);switch(t){case ec:return n*e;case ns:return n*e/r.components*r.byteLength;case Ta:return n*e/r.components*r.byteLength;case ci:return n*e*2/r.components*r.byteLength;case Aa:return n*e*2/r.components*r.byteLength;case tc:return n*e*3/r.components*r.byteLength;case fn:return n*e*4/r.components*r.byteLength;case Ra:return n*e*4/r.components*r.byteLength;case is:case rs:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ss:case as:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Pa:case Ia:return Math.max(n,16)*Math.max(e,8)/4;case Ca:case La:return Math.max(n,8)*Math.max(e,8)/2;case Da:case Na:case Fa:case Oa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ua:case os:case za:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ba:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ka:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Ha:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Ga:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Va:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Wa:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Xa:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case qa:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Ya:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Za:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Ka:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case $a:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Ja:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Qa:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case ja:case eo:case to:return Math.ceil(n/4)*Math.ceil(e/4)*16;case no:case io:return Math.ceil(n/4)*Math.ceil(e/4)*8;case ls:case ro:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function ep(n){switch(n){case Kt:case $l:return{byteLength:1,components:1};case dr:case Jl:case Ut:return{byteLength:2,components:1};case wa:case Ea:return{byteLength:2,components:4};case wn:case ba:case hn:return{byteLength:4,components:1};case Ql:case jl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:ua}})),typeof window<"u"&&(window.__THREE__?Ke("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=ua);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function rh(){let n=null,e=!1,t=null,i=null;function r(s,a){i=n.requestAnimationFrame(r),t(s,a)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function tp(n){const e=new WeakMap;function t(o,l){const c=o.array,h=o.usage,u=c.byteLength,f=n.createBuffer();n.bindBuffer(l,f),n.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=n.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=n.HALF_FLOAT:d=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=n.SHORT;else if(c instanceof Uint32Array)d=n.UNSIGNED_INT;else if(c instanceof Int32Array)d=n.INT;else if(c instanceof Int8Array)d=n.BYTE;else if(c instanceof Uint8Array)d=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:f,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:u}}function i(o,l,c){const h=l.array,u=l.updateRanges;if(n.bindBuffer(c,o),u.length===0)n.bufferSubData(c,0,h);else{u.sort((d,g)=>d.start-g.start);let f=0;for(let d=1;d<u.length;d++){const g=u[f],_=u[d];_.start<=g.start+g.count+1?g.count=Math.max(g.count,_.start+_.count-g.start):(++f,u[f]=_)}u.length=f+1;for(let d=0,g=u.length;d<g;d++){const _=u[d];n.bufferSubData(c,_.start*h.BYTES_PER_ELEMENT,h,_.start,_.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(n.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var np=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ip=`#ifdef USE_ALPHAHASH
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
#endif`,rp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,sp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ap=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,op=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,lp=`#ifdef USE_AOMAP
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
#endif`,cp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,hp=`#ifdef USE_BATCHING
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
#endif`,fp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,up=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,dp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pp=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,mp=`#ifdef USE_IRIDESCENCE
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
#endif`,gp=`#ifdef USE_BUMPMAP
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
#endif`,vp=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,xp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,_p=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,yp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Mp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Sp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,bp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,wp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Ep=`#define PI 3.141592653589793
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
} // validated`,Tp=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Ap=`vec3 transformedNormal = objectNormal;
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
#endif`,Rp=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Cp=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Pp=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Lp=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ip="gl_FragColor = linearToOutputTexel( gl_FragColor );",Dp=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Np=`#ifdef USE_ENVMAP
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
#endif`,Up=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Fp=`#ifdef USE_ENVMAP
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
#endif`,Op=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,zp=`#ifdef USE_ENVMAP
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
#endif`,Bp=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,kp=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Hp=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gp=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Vp=`#ifdef USE_GRADIENTMAP
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
}`,Wp=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Xp=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,qp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Yp=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Zp=`#ifdef USE_ENVMAP
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
#endif`,Kp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,$p=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Jp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Qp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,jp=`PhysicalMaterial material;
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
#endif`,e0=`uniform sampler2D dfgLUT;
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
}`,t0=`
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
#endif`,n0=`#if defined( RE_IndirectDiffuse )
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
#endif`,i0=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,r0=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,s0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,a0=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,o0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,l0=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,c0=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,h0=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,f0=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,u0=`#if defined( USE_POINTS_UV )
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
#endif`,d0=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,p0=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,m0=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,g0=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,v0=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,x0=`#ifdef USE_MORPHTARGETS
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
#endif`,_0=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,y0=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,M0=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,S0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,b0=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,w0=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,E0=`#ifdef USE_NORMALMAP
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
#endif`,T0=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,A0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,R0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,C0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,P0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,L0=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,I0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,D0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,N0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,U0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,F0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,O0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,z0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,B0=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,k0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,H0=`float getShadowMask() {
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
}`,G0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,V0=`#ifdef USE_SKINNING
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
#endif`,W0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,X0=`#ifdef USE_SKINNING
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
#endif`,q0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Y0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Z0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,K0=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,$0=`#ifdef USE_TRANSMISSION
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
#endif`,J0=`#ifdef USE_TRANSMISSION
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
#endif`,Q0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,j0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,em=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,tm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Qe={alphahash_fragment:np,alphahash_pars_fragment:ip,alphamap_fragment:rp,alphamap_pars_fragment:sp,alphatest_fragment:ap,alphatest_pars_fragment:op,aomap_fragment:lp,aomap_pars_fragment:cp,batching_pars_vertex:hp,batching_vertex:fp,begin_vertex:up,beginnormal_vertex:dp,bsdfs:pp,iridescence_fragment:mp,bumpmap_pars_fragment:gp,clipping_planes_fragment:vp,clipping_planes_pars_fragment:xp,clipping_planes_pars_vertex:_p,clipping_planes_vertex:yp,color_fragment:Mp,color_pars_fragment:Sp,color_pars_vertex:bp,color_vertex:wp,common:Ep,cube_uv_reflection_fragment:Tp,defaultnormal_vertex:Ap,displacementmap_pars_vertex:Rp,displacementmap_vertex:Cp,emissivemap_fragment:Pp,emissivemap_pars_fragment:Lp,colorspace_fragment:Ip,colorspace_pars_fragment:Dp,envmap_fragment:Np,envmap_common_pars_fragment:Up,envmap_pars_fragment:Fp,envmap_pars_vertex:Op,envmap_physical_pars_fragment:Zp,envmap_vertex:zp,fog_vertex:Bp,fog_pars_vertex:kp,fog_fragment:Hp,fog_pars_fragment:Gp,gradientmap_pars_fragment:Vp,lightmap_pars_fragment:Wp,lights_lambert_fragment:Xp,lights_lambert_pars_fragment:qp,lights_pars_begin:Yp,lights_toon_fragment:Kp,lights_toon_pars_fragment:$p,lights_phong_fragment:Jp,lights_phong_pars_fragment:Qp,lights_physical_fragment:jp,lights_physical_pars_fragment:e0,lights_fragment_begin:t0,lights_fragment_maps:n0,lights_fragment_end:i0,lightprobes_pars_fragment:r0,logdepthbuf_fragment:s0,logdepthbuf_pars_fragment:a0,logdepthbuf_pars_vertex:o0,logdepthbuf_vertex:l0,map_fragment:c0,map_pars_fragment:h0,map_particle_fragment:f0,map_particle_pars_fragment:u0,metalnessmap_fragment:d0,metalnessmap_pars_fragment:p0,morphinstance_vertex:m0,morphcolor_vertex:g0,morphnormal_vertex:v0,morphtarget_pars_vertex:x0,morphtarget_vertex:_0,normal_fragment_begin:y0,normal_fragment_maps:M0,normal_pars_fragment:S0,normal_pars_vertex:b0,normal_vertex:w0,normalmap_pars_fragment:E0,clearcoat_normal_fragment_begin:T0,clearcoat_normal_fragment_maps:A0,clearcoat_pars_fragment:R0,iridescence_pars_fragment:C0,opaque_fragment:P0,packing:L0,premultiplied_alpha_fragment:I0,project_vertex:D0,dithering_fragment:N0,dithering_pars_fragment:U0,roughnessmap_fragment:F0,roughnessmap_pars_fragment:O0,shadowmap_pars_fragment:z0,shadowmap_pars_vertex:B0,shadowmap_vertex:k0,shadowmask_pars_fragment:H0,skinbase_vertex:G0,skinning_pars_vertex:V0,skinning_vertex:W0,skinnormal_vertex:X0,specularmap_fragment:q0,specularmap_pars_fragment:Y0,tonemapping_fragment:Z0,tonemapping_pars_fragment:K0,transmission_fragment:$0,transmission_pars_fragment:J0,uv_pars_fragment:Q0,uv_pars_vertex:j0,uv_vertex:em,worldpos_vertex:tm,background_vert:`varying vec2 vUv;
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
}`},Ce={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new qe}},envmap:{envMap:{value:null},envMapRotation:{value:new qe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new qe},normalScale:{value:new ae(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new U},probesMax:{value:new U},probesResolution:{value:new U}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0},uvTransform:{value:new qe}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new ae(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new qe},alphaMap:{value:null},alphaMapTransform:{value:new qe},alphaTest:{value:0}}},Rn={basic:{uniforms:Vt([Ce.common,Ce.specularmap,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.fog]),vertexShader:Qe.meshbasic_vert,fragmentShader:Qe.meshbasic_frag},lambert:{uniforms:Vt([Ce.common,Ce.specularmap,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.fog,Ce.lights,{emissive:{value:new Ye(0)},envMapIntensity:{value:1}}]),vertexShader:Qe.meshlambert_vert,fragmentShader:Qe.meshlambert_frag},phong:{uniforms:Vt([Ce.common,Ce.specularmap,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.fog,Ce.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphong_vert,fragmentShader:Qe.meshphong_frag},standard:{uniforms:Vt([Ce.common,Ce.envmap,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.roughnessmap,Ce.metalnessmap,Ce.fog,Ce.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag},toon:{uniforms:Vt([Ce.common,Ce.aomap,Ce.lightmap,Ce.emissivemap,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.gradientmap,Ce.fog,Ce.lights,{emissive:{value:new Ye(0)}}]),vertexShader:Qe.meshtoon_vert,fragmentShader:Qe.meshtoon_frag},matcap:{uniforms:Vt([Ce.common,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,Ce.fog,{matcap:{value:null}}]),vertexShader:Qe.meshmatcap_vert,fragmentShader:Qe.meshmatcap_frag},points:{uniforms:Vt([Ce.points,Ce.fog]),vertexShader:Qe.points_vert,fragmentShader:Qe.points_frag},dashed:{uniforms:Vt([Ce.common,Ce.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qe.linedashed_vert,fragmentShader:Qe.linedashed_frag},depth:{uniforms:Vt([Ce.common,Ce.displacementmap]),vertexShader:Qe.depth_vert,fragmentShader:Qe.depth_frag},normal:{uniforms:Vt([Ce.common,Ce.bumpmap,Ce.normalmap,Ce.displacementmap,{opacity:{value:1}}]),vertexShader:Qe.meshnormal_vert,fragmentShader:Qe.meshnormal_frag},sprite:{uniforms:Vt([Ce.sprite,Ce.fog]),vertexShader:Qe.sprite_vert,fragmentShader:Qe.sprite_frag},background:{uniforms:{uvTransform:{value:new qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qe.background_vert,fragmentShader:Qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new qe}},vertexShader:Qe.backgroundCube_vert,fragmentShader:Qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qe.cube_vert,fragmentShader:Qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qe.equirect_vert,fragmentShader:Qe.equirect_frag},distance:{uniforms:Vt([Ce.common,Ce.displacementmap,{referencePosition:{value:new U},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qe.distance_vert,fragmentShader:Qe.distance_frag},shadow:{uniforms:Vt([Ce.lights,Ce.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:Qe.shadow_vert,fragmentShader:Qe.shadow_frag}};Rn.physical={uniforms:Vt([Rn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new qe},clearcoatNormalScale:{value:new ae(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new qe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new qe},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new qe},transmissionSamplerSize:{value:new ae},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new qe},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new qe},anisotropyVector:{value:new ae},anisotropyMap:{value:null},anisotropyMapTransform:{value:new qe}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag};const zs={r:0,b:0,g:0},nm=new ft,sh=new qe;sh.set(-1,0,0,0,1,0,0,0,1);function im(n,e,t,i,r,s){const a=new Ye(0);let o=r===!0?0:1,l,c,h=null,u=0,f=null;function d(b){let w=b.isScene===!0?b.background:null;if(w&&w.isTexture){const v=b.backgroundBlurriness>0;w=e.get(w,v)}return w}function g(b){let w=!1;const v=d(b);v===null?m(a,o):v&&v.isColor&&(m(v,1),w=!0);const S=n.xr.getEnvironmentBlendMode();S==="additive"?t.buffers.color.setClear(0,0,0,1,s):S==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||w)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function _(b,w){const v=d(w);v&&(v.isCubeTexture||v.mapping===Qr)?(c===void 0&&(c=new ot(new Fe(1,1,1),new St({name:"BackgroundCubeMaterial",uniforms:$i(Rn.backgroundCube.uniforms),vertexShader:Rn.backgroundCube.vertexShader,fragmentShader:Rn.backgroundCube.fragmentShader,side:Ht,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(S,E,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(nm.makeRotationFromEuler(w.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(sh),c.material.toneMapped=it.getTransfer(v.colorSpace)!==ht,(h!==v||u!==v.version||f!==n.toneMapping)&&(c.material.needsUpdate=!0,h=v,u=v.version,f=n.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new ot(new Ki(2,2),new St({name:"BackgroundMaterial",uniforms:$i(Rn.background.uniforms),vertexShader:Rn.background.vertexShader,fragmentShader:Rn.background.fragmentShader,side:ai,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=it.getTransfer(v.colorSpace)!==ht,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||u!==v.version||f!==n.toneMapping)&&(l.material.needsUpdate=!0,h=v,u=v.version,f=n.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function m(b,w){b.getRGB(zs,Zc(n)),t.buffers.color.setClear(zs.r,zs.g,zs.b,w,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,w=1){a.set(b),o=w,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,m(a,o)},render:g,addToRenderList:_,dispose:p}}function rm(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=f(null);let s=r,a=!1;function o(H,O,J,k,W){let ee=!1;const $=u(H,k,J,O);s!==$&&(s=$,c(s.object)),ee=d(H,k,J,W),ee&&g(H,k,J,W),W!==null&&e.update(W,n.ELEMENT_ARRAY_BUFFER),(ee||a)&&(a=!1,v(H,O,J,k),W!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(W).buffer))}function l(){return n.createVertexArray()}function c(H){return n.bindVertexArray(H)}function h(H){return n.deleteVertexArray(H)}function u(H,O,J,k){const W=k.wireframe===!0;let ee=i[O.id];ee===void 0&&(ee={},i[O.id]=ee);const $=H.isInstancedMesh===!0?H.id:0;let Z=ee[$];Z===void 0&&(Z={},ee[$]=Z);let ie=Z[J.id];ie===void 0&&(ie={},Z[J.id]=ie);let re=ie[W];return re===void 0&&(re=f(l()),ie[W]=re),re}function f(H){const O=[],J=[],k=[];for(let W=0;W<t;W++)O[W]=0,J[W]=0,k[W]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:O,enabledAttributes:J,attributeDivisors:k,object:H,attributes:{},index:null}}function d(H,O,J,k){const W=s.attributes,ee=O.attributes;let $=0;const Z=J.getAttributes();for(const ie in Z)if(Z[ie].location>=0){const ce=W[ie];let Re=ee[ie];if(Re===void 0&&(ie==="instanceMatrix"&&H.instanceMatrix&&(Re=H.instanceMatrix),ie==="instanceColor"&&H.instanceColor&&(Re=H.instanceColor)),ce===void 0||ce.attribute!==Re||Re&&ce.data!==Re.data)return!0;$++}return s.attributesNum!==$||s.index!==k}function g(H,O,J,k){const W={},ee=O.attributes;let $=0;const Z=J.getAttributes();for(const ie in Z)if(Z[ie].location>=0){let ce=ee[ie];ce===void 0&&(ie==="instanceMatrix"&&H.instanceMatrix&&(ce=H.instanceMatrix),ie==="instanceColor"&&H.instanceColor&&(ce=H.instanceColor));const Re={};Re.attribute=ce,ce&&ce.data&&(Re.data=ce.data),W[ie]=Re,$++}s.attributes=W,s.attributesNum=$,s.index=k}function _(){const H=s.newAttributes;for(let O=0,J=H.length;O<J;O++)H[O]=0}function m(H){p(H,0)}function p(H,O){const J=s.newAttributes,k=s.enabledAttributes,W=s.attributeDivisors;J[H]=1,k[H]===0&&(n.enableVertexAttribArray(H),k[H]=1),W[H]!==O&&(n.vertexAttribDivisor(H,O),W[H]=O)}function b(){const H=s.newAttributes,O=s.enabledAttributes;for(let J=0,k=O.length;J<k;J++)O[J]!==H[J]&&(n.disableVertexAttribArray(J),O[J]=0)}function w(H,O,J,k,W,ee,$){$===!0?n.vertexAttribIPointer(H,O,J,W,ee):n.vertexAttribPointer(H,O,J,k,W,ee)}function v(H,O,J,k){_();const W=k.attributes,ee=J.getAttributes(),$=O.defaultAttributeValues;for(const Z in ee){const ie=ee[Z];if(ie.location>=0){let re=W[Z];if(re===void 0&&(Z==="instanceMatrix"&&H.instanceMatrix&&(re=H.instanceMatrix),Z==="instanceColor"&&H.instanceColor&&(re=H.instanceColor)),re!==void 0){const ce=re.normalized,Re=re.itemSize,xe=e.get(re);if(xe===void 0)continue;const _e=xe.buffer,Se=xe.type,ke=xe.bytesPerElement,F=Se===n.INT||Se===n.UNSIGNED_INT||re.gpuType===ba;if(re.isInterleavedBufferAttribute){const D=re.data,I=D.stride,P=re.offset;if(D.isInstancedInterleavedBuffer){for(let B=0;B<ie.locationSize;B++)p(ie.location+B,D.meshPerAttribute);H.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=D.meshPerAttribute*D.count)}else for(let B=0;B<ie.locationSize;B++)m(ie.location+B);n.bindBuffer(n.ARRAY_BUFFER,_e);for(let B=0;B<ie.locationSize;B++)w(ie.location+B,Re/ie.locationSize,Se,ce,I*ke,(P+Re/ie.locationSize*B)*ke,F)}else{if(re.isInstancedBufferAttribute){for(let D=0;D<ie.locationSize;D++)p(ie.location+D,re.meshPerAttribute);H.isInstancedMesh!==!0&&k._maxInstanceCount===void 0&&(k._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let D=0;D<ie.locationSize;D++)m(ie.location+D);n.bindBuffer(n.ARRAY_BUFFER,_e);for(let D=0;D<ie.locationSize;D++)w(ie.location+D,Re/ie.locationSize,Se,ce,Re*ke,Re/ie.locationSize*D*ke,F)}}else if($!==void 0){const ce=$[Z];if(ce!==void 0)switch(ce.length){case 2:n.vertexAttrib2fv(ie.location,ce);break;case 3:n.vertexAttrib3fv(ie.location,ce);break;case 4:n.vertexAttrib4fv(ie.location,ce);break;default:n.vertexAttrib1fv(ie.location,ce)}}}}b()}function S(){A();for(const H in i){const O=i[H];for(const J in O){const k=O[J];for(const W in k){const ee=k[W];for(const $ in ee)h(ee[$].object),delete ee[$];delete k[W]}}delete i[H]}}function E(H){if(i[H.id]===void 0)return;const O=i[H.id];for(const J in O){const k=O[J];for(const W in k){const ee=k[W];for(const $ in ee)h(ee[$].object),delete ee[$];delete k[W]}}delete i[H.id]}function R(H){for(const O in i){const J=i[O];for(const k in J){const W=J[k];if(W[H.id]===void 0)continue;const ee=W[H.id];for(const $ in ee)h(ee[$].object),delete ee[$];delete W[H.id]}}}function x(H){for(const O in i){const J=i[O],k=H.isInstancedMesh===!0?H.id:0,W=J[k];if(W!==void 0){for(const ee in W){const $=W[ee];for(const Z in $)h($[Z].object),delete $[Z];delete W[ee]}delete J[k],Object.keys(J).length===0&&delete i[O]}}}function A(){N(),a=!0,s!==r&&(s=r,c(s.object))}function N(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:N,dispose:S,releaseStatesOfGeometry:E,releaseStatesOfObject:x,releaseStatesOfProgram:R,initAttributes:_,enableAttribute:m,disableUnusedAttributes:b}}function sm(n,e,t){let i;function r(l){i=l}function s(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function a(l,c,h){h!==0&&(n.drawArraysInstanced(i,l,c,h),t.update(c,i,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let f=0;for(let d=0;d<h;d++)f+=c[d];t.update(f,i,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function am(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const R=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(R.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(R){return!(R!==fn&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(R){const x=R===Ut&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(R!==Kt&&R!==hn&&!x&&i.convert(R)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(R){if(R==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";R="mediump"}return R==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const h=l(c);h!==c&&(Ke("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const u=t.logarithmicDepthBuffer===!0,f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&f===!1&&Ke("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),_=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),b=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),w=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),S=n.getParameter(n.MAX_SAMPLES),E=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:u,reversedDepthBuffer:f,maxTextures:d,maxVertexTextures:g,maxTextureSize:_,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:w,maxFragmentUniforms:v,maxSamples:S,samples:E}}function om(n){const e=this;let t=null,i=0,r=!1,s=!1;const a=new Gn,o=new qe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){const d=u.length!==0||f||i!==0||r;return r=f,i=u.length,d},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(u,f){t=h(u,f,0)},this.setState=function(u,f,d){const g=u.clippingPlanes,_=u.clipIntersection,m=u.clipShadows,p=n.get(u);if(!r||g===null||g.length===0||s&&!m)s?h(null):c();else{const b=s?0:i,w=b*4;let v=p.clippingState||null;l.value=v,v=h(g,f,w,d);for(let S=0;S!==w;++S)v[S]=t[S];p.clippingState=v,this.numIntersection=_?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(u,f,d,g){const _=u!==null?u.length:0;let m=null;if(_!==0){if(m=l.value,g!==!0||m===null){const p=d+_*4,b=f.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let w=0,v=d;w!==_;++w,v+=4)a.copy(u[w]).applyMatrix4(b,o),a.normal.toArray(m,v),m[v+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=_,e.numIntersection=0,m}}const ji=4,lm=6,cm=20,hm=256,Fr=new Wo,ah=new Ye;let Xo=null,qo=0,Yo=0,Zo=!1;const fm=new U,Mi=new U;class oh{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:a=256,position:o=fm}=s;Xo=this._renderer.getRenderTarget(),qo=this._renderer.getActiveCubeFace(),Yo=this._renderer.getActiveMipmapLevel(),Zo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=hh(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=ch(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Xo,qo,Yo),this._renderer.xr.enabled=Zo,e.scissorTest=!1,er(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===oi||e.mapping===Li?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Xo=this._renderer.getRenderTarget(),qo=this._renderer.getActiveCubeFace(),Yo=this._renderer.getActiveMipmapLevel(),Zo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Pt,minFilter:Pt,generateMipmaps:!1,type:Ut,format:fn,colorSpace:cs,depthBuffer:!1},r=lh(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=lh(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=um(s)),this._blurMaterial=pm(s,e,t),this._ggxMaterial=dm(s,e,t)}return r}_compileMaterial(e){const t=new ot(new Mt,e);this._renderer.compile(t,Fr)}_sceneToCubeUV(e,t,i,r,s){const l=new en(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],u=this._renderer,f=u.autoClear,d=u.toneMapping;u.getClearColor(ah),u.toneMapping=Sn,u.autoClear=!1,u.state.buffers.depth.getReversed()&&(u.setRenderTarget(r),u.clearDepth(),u.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new ot(new Fe,new wr({name:"PMREM.Background",side:Ht,depthWrite:!1,depthTest:!1})));const _=this._backgroundBox,m=_.material;let p=!1;const b=e.background;b?b.isColor&&(m.color.copy(b),e.background=null,p=!0):(m.color.copy(ah),p=!0);for(let w=0;w<6;w++){const v=w%3;v===0?(l.up.set(0,c[w],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+h[w],s.y,s.z)):v===1?(l.up.set(0,0,c[w]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+h[w],s.z)):(l.up.set(0,c[w],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+h[w]));const S=this._cubeSize;er(r,v*S,w>2?S:0,S,S),u.setRenderTarget(r),p&&u.render(_,l),u.render(e,l)}u.toneMapping=d,u.autoClear=f,e.background=b}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===oi||e.mapping===Li;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=hh()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=ch());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;er(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(a,Fr)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[i];o.material=a;const l=a.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),u=Math.sqrt(c*c-h*h),f=c*1.25,d=u*f,{_lodMax:g}=this,_=this._sizeLods[i],m=3*_*(i>g-ji?i-g+ji:0),p=4*(this._cubeSize-_);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=g-t,er(s,m,p,3*_,2*_),r.setRenderTarget(s),r.render(o,Fr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-i,er(e,m,p,3*_,2*_),r.setRenderTarget(e),r.render(o,Fr)}_blur(e,t,i,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,i,a),this._blurPass(s,e,i,i,a)}_blurPass(e,t,i,r,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;const c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-i;const h=this._sizeLods[r],u=3*h*(r>this._lodMax-ji?r-this._lodMax+ji:0),f=4*(this._cubeSize-h);er(t,u,f,3*h,2*h),a.setRenderTarget(t),a.render(l,Fr)}}function um(n){const e=[],t=[];let i=n;const r=n-ji+1+lm;for(let s=0;s<r;s++){const a=Math.pow(2,i);e.push(a);const o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],u=6,f=6,d=3,g=new Float32Array(d*f*u),_=new Float32Array(d*f*u);for(let p=0;p<u;p++){const b=p%3*2/3-1,w=p>2?0:-1,v=[b,w,0,b+2/3,w,0,b+2/3,w+1,0,b,w,0,b+2/3,w+1,0,b,w+1,0];g.set(v,d*f*p);for(let S=0;S<f;S++){const E=h[S*2]*2-1,R=h[S*2+1]*2-1;p===0?Mi.set(1,R,E):p===1?Mi.set(-E,1,-R):p===2?Mi.set(-E,R,1):p===3?Mi.set(-1,R,-E):p===4?Mi.set(-E,-1,R):Mi.set(E,R,-1),Mi.toArray(_,(p*f+S)*d)}}const m=new Mt;m.setAttribute("position",new Zt(g,d)),m.setAttribute("outputDirection",new Zt(_,d)),t.push(new ot(m,null)),i>ji&&i--}return{lodMeshes:t,sizeLods:e}}function lh(n,e,t){const i=new Dt(n,e,t);return i.texture.mapping=Qr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function er(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function dm(n,e,t){return new St({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:hm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Bs(),fragmentShader:`

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
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function pm(n,e,t){return new St({name:"SphericalGaussianBlur",defines:{SAMPLES:cm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Bs(),fragmentShader:`

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
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function ch(){return new St({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Bs(),fragmentShader:`

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
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function hh(){return new St({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Bs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Mn,depthTest:!1,depthWrite:!1})}function Bs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class fh extends Dt{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Pc(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Fe(5,5,5),s=new St({name:"CubemapFromEquirect",uniforms:$i(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ht,blending:Mn});s.uniforms.tEquirect.value=t;const a=new ot(r,s),o=t.minFilter;return t.minFilter===Xn&&(t.minFilter=Pt),new $d(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,i,r);e.setRenderTarget(s)}}function mm(n){let e=new WeakMap,t=new WeakMap,i=null;function r(f,d=!1){return f==null?null:d?a(f):s(f)}function s(f){if(f&&f.isTexture){const d=f.mapping;if(d===ya||d===Ma)if(e.has(f)){const g=e.get(f).texture;return o(g,f.mapping)}else{const g=f.image;if(g&&g.height>0){const _=new fh(g.height);return _.fromEquirectangularTexture(n,f),e.set(f,_),f.addEventListener("dispose",c),o(_.texture,f.mapping)}else return null}}return f}function a(f){if(f&&f.isTexture){const d=f.mapping,g=d===ya||d===Ma,_=d===oi||d===Li;if(g||_){let m=t.get(f);const p=m!==void 0?m.texture.pmremVersion:0;if(f.isRenderTargetTexture&&f.pmremVersion!==p)return i===null&&(i=new oh(n)),m=g?i.fromEquirectangular(f,m):i.fromCubemap(f,m),m.texture.pmremVersion=f.pmremVersion,t.set(f,m),m.texture;if(m!==void 0)return m.texture;{const b=f.image;return g&&b&&b.height>0||_&&b&&l(b)?(i===null&&(i=new oh(n)),m=g?i.fromEquirectangular(f):i.fromCubemap(f),m.texture.pmremVersion=f.pmremVersion,t.set(f,m),f.addEventListener("dispose",h),m.texture):null}}}return f}function o(f,d){return d===ya?f.mapping=oi:d===Ma&&(f.mapping=Li),f}function l(f){let d=0;const g=6;for(let _=0;_<g;_++)f[_]!==void 0&&d++;return d===g}function c(f){const d=f.target;d.removeEventListener("dispose",c);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function h(f){const d=f.target;d.removeEventListener("dispose",h);const g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function u(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:u}}function gm(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&Ii("WebGLRenderer: "+i+" extension not supported."),r}}}function vm(n,e,t,i){const r={},s=new WeakMap;function a(u){const f=u.target;f.index!==null&&e.remove(f.index);for(const g in f.attributes)e.remove(f.attributes[g]);f.removeEventListener("dispose",a),delete r[f.id];const d=s.get(f);d&&(e.remove(d),s.delete(f)),i.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,t.memory.geometries--}function o(u,f){return r[f.id]===!0||(f.addEventListener("dispose",a),r[f.id]=!0,t.memory.geometries++),f}function l(u){const f=u.attributes;for(const d in f)e.update(f[d],n.ARRAY_BUFFER)}function c(u){const f=[],d=u.index,g=u.attributes.position;let _=0;if(g===void 0)return;if(d!==null){const b=d.array;_=d.version;for(let w=0,v=b.length;w<v;w+=3){const S=b[w+0],E=b[w+1],R=b[w+2];f.push(S,E,E,R,R,S)}}else{const b=g.array;_=g.version;for(let w=0,v=b.length/3-1;w<v;w+=3){const S=w+0,E=w+1,R=w+2;f.push(S,E,E,R,R,S)}}const m=new(g.count>=65535?bc:Sc)(f,1);m.version=_;const p=s.get(u);p&&e.remove(p),s.set(u,m)}function h(u){const f=s.get(u);if(f){const d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return s.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function xm(n,e,t){let i;function r(u){i=u}let s,a;function o(u){s=u.type,a=u.bytesPerElement}function l(u,f){n.drawElements(i,f,s,u*a),t.update(f,i,1)}function c(u,f,d){d!==0&&(n.drawElementsInstanced(i,f,s,u*a,d),t.update(f,i,d))}function h(u,f,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,f,0,s,u,0,d);let _=0;for(let m=0;m<d;m++)_+=f[m];t.update(_,i,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function _m(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,a,o){switch(t.calls++,a){case n.TRIANGLES:t.triangles+=o*(s/3);break;case n.LINES:t.lines+=o*(s/2);break;case n.LINE_STRIP:t.lines+=o*(s-1);break;case n.LINE_LOOP:t.lines+=o*s;break;case n.POINTS:t.points+=o*s;break;default:st("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function ym(n,e,t){const i=new WeakMap,r=new pt;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=h!==void 0?h.length:0;let f=i.get(o);if(f===void 0||f.count!==u){let A=function(){R.dispose(),i.delete(o),o.removeEventListener("dispose",A)};f!==void 0&&f.texture.dispose();const d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,_=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],b=o.morphAttributes.color||[];let w=0;d===!0&&(w=1),g===!0&&(w=2),_===!0&&(w=3);let v=o.attributes.position.count*w,S=1;v>e.maxTextureSize&&(S=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);const E=new Float32Array(v*S*4*u),R=new fc(E,v,S,u);R.type=hn,R.needsUpdate=!0;const x=w*4;for(let N=0;N<u;N++){const H=m[N],O=p[N],J=b[N],k=v*S*4*N;for(let W=0;W<H.count;W++){const ee=W*x;d===!0&&(r.fromBufferAttribute(H,W),E[k+ee+0]=r.x,E[k+ee+1]=r.y,E[k+ee+2]=r.z,E[k+ee+3]=0),g===!0&&(r.fromBufferAttribute(O,W),E[k+ee+4]=r.x,E[k+ee+5]=r.y,E[k+ee+6]=r.z,E[k+ee+7]=0),_===!0&&(r.fromBufferAttribute(J,W),E[k+ee+8]=r.x,E[k+ee+9]=r.y,E[k+ee+10]=r.z,E[k+ee+11]=J.itemSize===4?r.w:1)}}f={count:u,texture:R,size:new ae(v,S)},i.set(o,f),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",a.morphTexture,t);else{let d=0;for(let _=0;_<c.length;_++)d+=c[_];const g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",f.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",f.size)}return{update:s}}function Mm(n,e,t,i,r){let s=new WeakMap;function a(c){const h=r.render.frame,u=c.geometry,f=e.get(c,u);if(s.get(f)!==h&&(e.update(f),s.set(f,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==h&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){const d=c.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return f}function o(){s=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}const Sm={[Gl]:"LINEAR_TONE_MAPPING",[Vl]:"REINHARD_TONE_MAPPING",[Wl]:"CINEON_TONE_MAPPING",[Xl]:"ACES_FILMIC_TONE_MAPPING",[Yl]:"AGX_TONE_MAPPING",[Zl]:"NEUTRAL_TONE_MAPPING",[ql]:"CUSTOM_TONE_MAPPING"};function bm(n,e,t,i,r,s){const a=new Dt(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new Mt;c.setAttribute("position",new rt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new rt([0,2,0,0,2,0],2));const h=new Gd({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),u=new ot(c,h),f=new Wo(-1,1,1,-1,0,1);let d=null,g=null,_=!1,m,p=null,b=[],w=!1;this.setSize=function(v,S){a.setSize(v,S),o!==null&&o.setSize(v,S),l!==null&&l.setSize(v,S);for(let E=0;E<b.length;E++){const R=b[E];R.setSize&&R.setSize(v,S)}},this.setEffects=function(v){b=v,w=b.length>0&&b[0].isRenderPass===!0;const S=a.width,E=a.height;b.length>0&&o===null&&(o=new Dt(S,E,{type:Ut,depthBuffer:!1,stencilBuffer:!1}),l=new Dt(S,E,{type:Ut,depthBuffer:!1,stencilBuffer:!1}));for(let R=0;R<b.length;R++){const x=b[R];x.setSize&&x.setSize(S,E)}},this.begin=function(v,S){if(_||v.toneMapping===Sn&&b.length===0)return!1;if(p=S,S!==null){const E=S.width,R=S.height;(a.width!==E||a.height!==R)&&this.setSize(E,R)}return w===!1&&v.setRenderTarget(a),m=v.toneMapping,v.toneMapping=Sn,!0},this.hasRenderPass=function(){return w},this.end=function(v,S){v.toneMapping=m,_=!0;let E=a,R=o;for(let x=0;x<b.length;x++){const A=b[x];A.enabled!==!1&&(A.render(v,R,E,S),A.needsSwap!==!1&&(E=R,R=R===o?l:o))}if(d!==v.outputColorSpace||g!==v.toneMapping){d=v.outputColorSpace,g=v.toneMapping,h.defines={},it.getTransfer(d)===ht&&(h.defines.SRGB_TRANSFER="");const x=Sm[g];x&&(h.defines[x]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,v.setRenderTarget(p),v.render(u,f),p=null,_=!1},this.isCompositing=function(){return _},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}const uh=new Ot,Ko=new Ar(1,1),dh=new fc,ph=new Gu,mh=new Pc,gh=[],vh=[],xh=new Float32Array(16),_h=new Float32Array(9),yh=new Float32Array(4);function tr(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=gh[r];if(s===void 0&&(s=new Float32Array(r),gh[r]=s),e!==0){i.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,n[a].toArray(s,o)}return s}function At(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Rt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function ks(n,e){let t=vh[e];t===void 0&&(t=new Int32Array(e),vh[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function wm(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Em(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2fv(this.addr,e),Rt(t,e)}}function Tm(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(At(t,e))return;n.uniform3fv(this.addr,e),Rt(t,e)}}function Am(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4fv(this.addr,e),Rt(t,e)}}function Rm(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Rt(t,e)}else{if(At(t,i))return;yh.set(i),n.uniformMatrix2fv(this.addr,!1,yh),Rt(t,i)}}function Cm(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Rt(t,e)}else{if(At(t,i))return;_h.set(i),n.uniformMatrix3fv(this.addr,!1,_h),Rt(t,i)}}function Pm(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Rt(t,e)}else{if(At(t,i))return;xh.set(i),n.uniformMatrix4fv(this.addr,!1,xh),Rt(t,i)}}function Lm(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function Im(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2iv(this.addr,e),Rt(t,e)}}function Dm(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;n.uniform3iv(this.addr,e),Rt(t,e)}}function Nm(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4iv(this.addr,e),Rt(t,e)}}function Um(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Fm(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;n.uniform2uiv(this.addr,e),Rt(t,e)}}function Om(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;n.uniform3uiv(this.addr,e),Rt(t,e)}}function zm(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;n.uniform4uiv(this.addr,e),Rt(t,e)}}function Bm(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Ko.compareFunction=t.isReversedDepthBuffer()?oo:ao,s=Ko):s=uh,t.setTexture2D(e||s,r)}function km(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||ph,r)}function Hm(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||mh,r)}function Gm(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||dh,r)}function Vm(n){switch(n){case 5126:return wm;case 35664:return Em;case 35665:return Tm;case 35666:return Am;case 35674:return Rm;case 35675:return Cm;case 35676:return Pm;case 5124:case 35670:return Lm;case 35667:case 35671:return Im;case 35668:case 35672:return Dm;case 35669:case 35673:return Nm;case 5125:return Um;case 36294:return Fm;case 36295:return Om;case 36296:return zm;case 35678:case 36198:case 36298:case 36306:case 35682:return Bm;case 35679:case 36299:case 36307:return km;case 35680:case 36300:case 36308:case 36293:return Hm;case 36289:case 36303:case 36311:case 36292:return Gm}}function Wm(n,e){n.uniform1fv(this.addr,e)}function Xm(n,e){const t=tr(e,this.size,2);n.uniform2fv(this.addr,t)}function qm(n,e){const t=tr(e,this.size,3);n.uniform3fv(this.addr,t)}function Ym(n,e){const t=tr(e,this.size,4);n.uniform4fv(this.addr,t)}function Zm(n,e){const t=tr(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Km(n,e){const t=tr(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function $m(n,e){const t=tr(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function Jm(n,e){n.uniform1iv(this.addr,e)}function Qm(n,e){n.uniform2iv(this.addr,e)}function jm(n,e){n.uniform3iv(this.addr,e)}function eg(n,e){n.uniform4iv(this.addr,e)}function tg(n,e){n.uniform1uiv(this.addr,e)}function ng(n,e){n.uniform2uiv(this.addr,e)}function ig(n,e){n.uniform3uiv(this.addr,e)}function rg(n,e){n.uniform4uiv(this.addr,e)}function sg(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Rt(i,s));let a;this.type===n.SAMPLER_2D_SHADOW?a=Ko:a=uh;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function ag(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Rt(i,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||ph,s[a])}function og(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Rt(i,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||mh,s[a])}function lg(n,e,t){const i=this.cache,r=e.length,s=ks(t,r);At(i,s)||(n.uniform1iv(this.addr,s),Rt(i,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||dh,s[a])}function cg(n){switch(n){case 5126:return Wm;case 35664:return Xm;case 35665:return qm;case 35666:return Ym;case 35674:return Zm;case 35675:return Km;case 35676:return $m;case 5124:case 35670:return Jm;case 35667:case 35671:return Qm;case 35668:case 35672:return jm;case 35669:case 35673:return eg;case 5125:return tg;case 36294:return ng;case 36295:return ig;case 36296:return rg;case 35678:case 36198:case 36298:case 36306:case 35682:return sg;case 35679:case 36299:case 36307:return ag;case 35680:case 36300:case 36308:case 36293:return og;case 36289:case 36303:case 36311:case 36292:return lg}}class hg{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Vm(t.type)}}class fg{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=cg(t.type)}}class ug{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],i)}}}const $o=/(\w+)(\])?(\[|\.)?/g;function Mh(n,e){n.seq.push(e),n.map[e.id]=e}function dg(n,e,t){const i=n.name,r=i.length;for($o.lastIndex=0;;){const s=$o.exec(i),a=$o.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){Mh(t,c===void 0?new hg(o,n,e):new fg(o,n,e));break}else{let u=t.map[o];u===void 0&&(u=new ug(o),Mh(t,u)),t=u}}}class Hs{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<i;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);dg(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=i[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&i.push(a)}return i}}function Sh(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const pg=37297;let mg=0;function gg(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;i.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return i.join(`
`)}const bh=new qe;function vg(n){it._getMatrix(bh,it.workingColorSpace,n);const e=`mat3( ${bh.elements.map(t=>t.toFixed(4))} )`;switch(it.getTransfer(n)){case hs:return[e,"LinearTransferOETF"];case ht:return[e,"sRGBTransferOETF"];default:return Ke("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function wh(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+gg(n.getShaderSource(e),o)}else return s}function xg(n,e){const t=vg(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const _g={[Gl]:"Linear",[Vl]:"Reinhard",[Wl]:"Cineon",[Xl]:"ACESFilmic",[Yl]:"AgX",[Zl]:"Neutral",[ql]:"Custom"};function yg(n,e){const t=_g[e];return t===void 0?(Ke("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Gs=new U;function Mg(){it.getLuminanceCoefficients(Gs);const n=Gs.x.toFixed(4),e=Gs.y.toFixed(4),t=Gs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Sg(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Or).join(`
`)}function bg(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function wg(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),a=s.name;let o=1;s.type===n.FLOAT_MAT2&&(o=2),s.type===n.FLOAT_MAT3&&(o=3),s.type===n.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:n.getAttribLocation(e,a),locationSize:o}}return t}function Or(n){return n!==""}function Eh(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Th(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Eg=/^[ \t]*#include +<([\w\d./]+)>/gm;function Jo(n){return n.replace(Eg,Ag)}const Tg=new Map;function Ag(n,e){let t=Qe[e];if(t===void 0){const i=Tg.get(e);if(i!==void 0)t=Qe[i],Ke('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Jo(t)}const Rg=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Ah(n){return n.replace(Rg,Cg)}function Cg(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Rh(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const Pg={[Jr]:"SHADOWMAP_TYPE_PCF",[cr]:"SHADOWMAP_TYPE_VSM"};function Lg(n){return Pg[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Ig={[oi]:"ENVMAP_TYPE_CUBE",[Li]:"ENVMAP_TYPE_CUBE",[Qr]:"ENVMAP_TYPE_CUBE_UV"};function Dg(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Ig[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const Ng={[Li]:"ENVMAP_MODE_REFRACTION"};function Ug(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Ng[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Fg={[Hl]:"ENVMAP_BLENDING_MULTIPLY",[iu]:"ENVMAP_BLENDING_MIX",[ru]:"ENVMAP_BLENDING_ADD"};function Og(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Fg[n.combine]||"ENVMAP_BLENDING_NONE"}function zg(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Bg(n,e,t,i){const r=n.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=Lg(t),c=Dg(t),h=Ug(t),u=Og(t),f=zg(t),d=Sg(t),g=bg(s),_=r.createProgram();let m,p,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Or).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Or).join(`
`),p.length>0&&(p+=`
`)):(m=[Rh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Or).join(`
`),p=[Rh(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Sn?"#define TONE_MAPPING":"",t.toneMapping!==Sn?Qe.tonemapping_pars_fragment:"",t.toneMapping!==Sn?yg("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Qe.colorspace_pars_fragment,xg("linearToOutputTexel",t.outputColorSpace),Mg(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Or).join(`
`)),a=Jo(a),a=Eh(a,t),a=Th(a,t),o=Jo(o),o=Eh(o,t),o=Th(o,t),a=Ah(a),o=Ah(o),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===ic?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ic?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const w=b+m+a,v=b+p+o,S=Sh(r,r.VERTEX_SHADER,w),E=Sh(r,r.FRAGMENT_SHADER,v);r.attachShader(_,S),r.attachShader(_,E),t.index0AttributeName!==void 0?r.bindAttribLocation(_,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(_,0,"position"),r.linkProgram(_);function R(H){if(n.debug.checkShaderErrors){const O=r.getProgramInfoLog(_)||"",J=r.getShaderInfoLog(S)||"",k=r.getShaderInfoLog(E)||"",W=O.trim(),ee=J.trim(),$=k.trim();let Z=!0,ie=!0;if(r.getProgramParameter(_,r.LINK_STATUS)===!1)if(Z=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,_,S,E);else{const re=wh(r,S,"vertex"),ce=wh(r,E,"fragment");st("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(_,r.VALIDATE_STATUS)+`

Material Name: `+H.name+`
Material Type: `+H.type+`

Program Info Log: `+W+`
`+re+`
`+ce)}else W!==""?Ke("WebGLProgram: Program Info Log:",W):(ee===""||$==="")&&(ie=!1);ie&&(H.diagnostics={runnable:Z,programLog:W,vertexShader:{log:ee,prefix:m},fragmentShader:{log:$,prefix:p}})}r.deleteShader(S),r.deleteShader(E),x=new Hs(r,_),A=wg(r,_)}let x;this.getUniforms=function(){return x===void 0&&R(this),x};let A;this.getAttributes=function(){return A===void 0&&R(this),A};let N=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=r.getProgramParameter(_,pg)),N},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=mg++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=S,this.fragmentShader=E,this}let kg=0;class Hg{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new Gg(e),t.set(e,i)),i}}class Gg{constructor(e){this.id=kg++,this.code=e,this.usedTimes=0}}function Vg(n){return n===ci||n===os||n===ls}function Wg(n,e,t,i,r,s){const a=new pc,o=new Hg,l=new Set,c=[],h=new Map,u=i.logarithmicDepthBuffer;let f=i.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(x){return l.add(x),x===0?"uv":`uv${x}`}function _(x,A,N,H,O,J){const k=H.fog,W=O.geometry,ee=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?H.environment:null,$=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,Z=e.get(x.envMap||ee,$),ie=Z&&Z.mapping===Qr?Z.image.height:null,re=d[x.type];x.precision!==null&&(f=i.getMaxPrecision(x.precision),f!==x.precision&&Ke("WebGLProgram.getParameters:",x.precision,"not supported, using",f,"instead."));const ce=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Re=ce!==void 0?ce.length:0;let xe=0;W.morphAttributes.position!==void 0&&(xe=1),W.morphAttributes.normal!==void 0&&(xe=2),W.morphAttributes.color!==void 0&&(xe=3);let _e,Se,ke,F;if(re){const gt=Rn[re];_e=gt.vertexShader,Se=gt.fragmentShader}else{_e=x.vertexShader,Se=x.fragmentShader;const gt=o.getVertexShaderStage(x),lt=o.getFragmentShaderStage(x);o.update(x,gt,lt),ke=gt.id,F=lt.id}const D=n.getRenderTarget(),I=n.state.buffers.depth.getReversed(),P=O.isInstancedMesh===!0,B=O.isBatchedMesh===!0,se=!!x.map,me=!!x.matcap,C=!!Z,G=!!x.aoMap,z=!!x.lightMap,K=!!x.bumpMap&&x.wireframe===!1,Q=!!x.normalMap,he=!!x.displacementMap,ge=!!x.emissiveMap,pe=!!x.metalnessMap,Y=!!x.roughnessMap,M=x.anisotropy>0,Pe=x.clearcoat>0,Oe=x.dispersion>0,L=x.retroreflectivity>0,y=x.iridescence>0,q=x.sheen>0,j=x.transmission>0,le=M&&!!x.anisotropyMap,ye=Pe&&!!x.clearcoatMap,Me=Pe&&!!x.clearcoatNormalMap,fe=Pe&&!!x.clearcoatRoughnessMap,ue=y&&!!x.iridescenceMap,be=y&&!!x.iridescenceThicknessMap,He=q&&!!x.sheenColorMap,Ee=q&&!!x.sheenRoughnessMap,we=!!x.specularMap,We=!!x.specularColorMap,Ze=!!x.specularIntensityMap,Je=j&&!!x.transmissionMap,X=j&&!!x.thicknessMap,Te=!!x.gradientMap,de=!!x.alphaMap,Ae=x.alphaTest>0,De=!!x.alphaHash,ve=!!x.extensions;let Xe=Sn;x.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(Xe=n.toneMapping);const Ge={shaderID:re,shaderType:x.type,shaderName:x.name,vertexShader:_e,fragmentShader:Se,defines:x.defines,customVertexShaderID:ke,customFragmentShaderID:F,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:f,batching:B,batchingColor:B&&O._colorsTexture!==null,instancing:P,instancingColor:P&&O.instanceColor!==null,instancingMorph:P&&O.morphTexture!==null,outputColorSpace:D===null?n.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:it.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:se,matcap:me,envMap:C,envMapMode:C&&Z.mapping,envMapCubeUVHeight:ie,aoMap:G,lightMap:z,bumpMap:K,normalMap:Q,displacementMap:he,emissiveMap:ge,normalMapObjectSpace:Q&&x.normalMapType===ou,normalMapTangentSpace:Q&&x.normalMapType===nc,packedNormalMap:Q&&x.normalMapType===nc&&Vg(x.normalMap.format),metalnessMap:pe,roughnessMap:Y,anisotropy:M,anisotropyMap:le,clearcoat:Pe,clearcoatMap:ye,clearcoatNormalMap:Me,clearcoatRoughnessMap:fe,dispersion:Oe,retroreflection:L,iridescence:y,iridescenceMap:ue,iridescenceThicknessMap:be,sheen:q,sheenColorMap:He,sheenRoughnessMap:Ee,specularMap:we,specularColorMap:We,specularIntensityMap:Ze,transmission:j,transmissionMap:Je,thicknessMap:X,gradientMap:Te,opaque:x.transparent===!1&&x.blending===hr&&x.alphaToCoverage===!1,alphaMap:de,alphaTest:Ae,alphaHash:De,combine:x.combine,mapUv:se&&g(x.map.channel),aoMapUv:G&&g(x.aoMap.channel),lightMapUv:z&&g(x.lightMap.channel),bumpMapUv:K&&g(x.bumpMap.channel),normalMapUv:Q&&g(x.normalMap.channel),displacementMapUv:he&&g(x.displacementMap.channel),emissiveMapUv:ge&&g(x.emissiveMap.channel),metalnessMapUv:pe&&g(x.metalnessMap.channel),roughnessMapUv:Y&&g(x.roughnessMap.channel),anisotropyMapUv:le&&g(x.anisotropyMap.channel),clearcoatMapUv:ye&&g(x.clearcoatMap.channel),clearcoatNormalMapUv:Me&&g(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:fe&&g(x.clearcoatRoughnessMap.channel),iridescenceMapUv:ue&&g(x.iridescenceMap.channel),iridescenceThicknessMapUv:be&&g(x.iridescenceThicknessMap.channel),sheenColorMapUv:He&&g(x.sheenColorMap.channel),sheenRoughnessMapUv:Ee&&g(x.sheenRoughnessMap.channel),specularMapUv:we&&g(x.specularMap.channel),specularColorMapUv:We&&g(x.specularColorMap.channel),specularIntensityMapUv:Ze&&g(x.specularIntensityMap.channel),transmissionMapUv:Je&&g(x.transmissionMap.channel),thicknessMapUv:X&&g(x.thicknessMap.channel),alphaMapUv:de&&g(x.alphaMap.channel),vertexTangents:!!W.attributes.tangent&&(Q||M),vertexNormals:!!W.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,pointsUvs:O.isPoints===!0&&!!W.attributes.uv&&(se||de),fog:!!k,useFog:x.fog===!0,fogExp2:!!k&&k.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||W.attributes.normal===void 0&&Q===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:u,reversedDepthBuffer:I,skinning:O.isSkinnedMesh===!0,hasPositionAttribute:W.attributes.position!==void 0,morphTargets:W.morphAttributes.position!==void 0,morphNormals:W.morphAttributes.normal!==void 0,morphColors:W.morphAttributes.color!==void 0,morphTargetsCount:Re,morphTextureStride:xe,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:J.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:x.dithering,shadowMapEnabled:n.shadowMap.enabled&&N.length>0,shadowMapType:n.shadowMap.type,toneMapping:Xe,decodeVideoTexture:se&&x.map.isVideoTexture===!0&&it.getTransfer(x.map.colorSpace)===ht,decodeVideoTextureEmissive:ge&&x.emissiveMap.isVideoTexture===!0&&it.getTransfer(x.emissiveMap.colorSpace)===ht,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===rn,flipSided:x.side===Ht,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:ve&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&x.extensions.multiDraw===!0||B)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return Ge.vertexUv1s=l.has(1),Ge.vertexUv2s=l.has(2),Ge.vertexUv3s=l.has(3),l.clear(),Ge}function m(x){const A=[];if(x.shaderID?A.push(x.shaderID):(A.push(x.customVertexShaderID),A.push(x.customFragmentShaderID)),x.defines!==void 0)for(const N in x.defines)A.push(N),A.push(x.defines[N]);return x.isRawShaderMaterial===!1&&(p(A,x),b(A,x),A.push(n.outputColorSpace)),A.push(x.customProgramCacheKey),A.join()}function p(x,A){x.push(A.precision),x.push(A.outputColorSpace),x.push(A.envMapMode),x.push(A.envMapCubeUVHeight),x.push(A.mapUv),x.push(A.alphaMapUv),x.push(A.lightMapUv),x.push(A.aoMapUv),x.push(A.bumpMapUv),x.push(A.normalMapUv),x.push(A.displacementMapUv),x.push(A.emissiveMapUv),x.push(A.metalnessMapUv),x.push(A.roughnessMapUv),x.push(A.anisotropyMapUv),x.push(A.clearcoatMapUv),x.push(A.clearcoatNormalMapUv),x.push(A.clearcoatRoughnessMapUv),x.push(A.iridescenceMapUv),x.push(A.iridescenceThicknessMapUv),x.push(A.sheenColorMapUv),x.push(A.sheenRoughnessMapUv),x.push(A.specularMapUv),x.push(A.specularColorMapUv),x.push(A.specularIntensityMapUv),x.push(A.transmissionMapUv),x.push(A.thicknessMapUv),x.push(A.combine),x.push(A.fogExp2),x.push(A.sizeAttenuation),x.push(A.morphTargetsCount),x.push(A.morphAttributeCount),x.push(A.numSunLights),x.push(A.numDirLights),x.push(A.numPointLights),x.push(A.numSpotLights),x.push(A.numSpotLightMaps),x.push(A.numHemiLights),x.push(A.numRectAreaLights),x.push(A.numSunLightShadows),x.push(A.numDirLightShadows),x.push(A.numPointLightShadows),x.push(A.numSpotLightShadows),x.push(A.numSpotLightShadowsWithMaps),x.push(A.numLightProbes),x.push(A.shadowMapType),x.push(A.toneMapping),x.push(A.numClippingPlanes),x.push(A.numClipIntersection),x.push(A.depthPacking)}function b(x,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function w(x){const A=d[x.type];let N;if(A){const H=Rn[A];N=Ur.clone(H.uniforms)}else N=x.uniforms;return N}function v(x,A){let N=h.get(A);return N!==void 0?++N.usedTimes:(N=new Bg(n,A,x,r),c.push(N),h.set(A,N)),N}function S(x){if(--x.usedTimes===0){const A=c.indexOf(x);c[A]=c[c.length-1],c.pop(),h.delete(x.cacheKey),x.destroy()}}function E(x){o.remove(x)}function R(){o.dispose()}return{getParameters:_,getProgramCacheKey:m,getUniforms:w,acquireProgram:v,releaseProgram:S,releaseShaderCache:E,programs:c,dispose:R}}function Xg(){let n=new WeakMap;function e(a){return n.has(a)}function t(a){let o=n.get(a);return o===void 0&&(o={},n.set(a,o)),o}function i(a){n.delete(a)}function r(a,o,l){n.get(a)[o]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function qg(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Ch(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ph(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function a(f){let d=0;return f.isInstancedMesh&&(d+=2),f.isSkinnedMesh&&(d+=1),d}function o(f,d,g,_,m,p){let b=n[e];return b===void 0?(b={id:f.id,object:f,geometry:d,material:g,materialVariant:a(f),groupOrder:_,renderOrder:f.renderOrder,z:m,group:p},n[e]=b):(b.id=f.id,b.object=f,b.geometry=d,b.material=g,b.materialVariant=a(f),b.groupOrder=_,b.renderOrder=f.renderOrder,b.z=m,b.group=p),e++,b}function l(f,d,g,_,m,p,b){b.reversedDepth===!0&&(m=-m);const w=o(f,d,g,_,m,p);g.transmission>0?i.push(w):g.transparent===!0?r.push(w):t.push(w)}function c(f,d,g,_,m,p){const b=o(f,d,g,_,m,p);g.transmission>0?i.unshift(b):g.transparent===!0?r.unshift(b):t.unshift(b)}function h(f,d){t.length>1&&t.sort(f||qg),i.length>1&&i.sort(d||Ch),r.length>1&&r.sort(d||Ch)}function u(){for(let f=e,d=n.length;f<d;f++){const g=n[f];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:u,sort:h}}function Yg(){let n=new WeakMap;function e(i,r){const s=n.get(i);let a;return s===void 0?(a=new Ph,n.set(i,[a])):r>=s.length?(a=new Ph,s.push(a)):a=s[r],a}function t(){n=new WeakMap}return{get:e,dispose:t}}function Zg(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new U,color:new Ye};break;case"SpotLight":t={position:new U,direction:new U,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new U,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new U,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new U,halfWidth:new U,halfHeight:new U};break}return n[e.id]=t,t}}}function Kg(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let $g=0;function Jg(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function Qg(n){const e=new Zg,t=Kg(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new U);const r=new U,s=new ft,a=new ft;function o(c){let h=0,u=0,f=0;for(let O=0;O<9;O++)i.probe[O].set(0,0,0);let d=0,g=0,_=0,m=0,p=0,b=0,w=0,v=0,S=0,E=0,R=0,x=0,A=0,N=0;c.sort(Jg);for(let O=0,J=c.length;O<J;O++){const k=c[O],W=k.color,ee=k.intensity,$=k.distance;let Z=null;if(k.shadow&&k.shadow.map&&(k.shadow.map.texture.format===ci?Z=k.shadow.map.texture:Z=k.shadow.map.depthTexture||k.shadow.map.texture),k.isAmbientLight)h+=W.r*ee,u+=W.g*ee,f+=W.b*ee;else if(k.isLightProbe){for(let ie=0;ie<9;ie++)i.probe[ie].addScaledVector(k.sh.coefficients[ie],ee);N++}else if(k.isSunLight){const ie=e.get(k);if(ie.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){const re=k.shadow,ce=t.get(k);ce.shadowIntensity=re.intensity,ce.shadowBias=re.bias,ce.shadowNormalBias=re.normalBias,ce.shadowRadius=re.radius,ce.shadowMapSize.copy(re.mapSize).multiply(re.getFrameExtents()),i.sunShadow[g]=ce,i.sunShadowMap[g]=Z;const Re=re.getViewportCount();for(let xe=0;xe<Re;xe++)i.sunShadowMatrix[_+xe]=re.getMatrix(xe),i.sunShadowCascade[_+xe]=re._cascadeData[xe];_+=Re,g++}i.sun[d]=ie,d++}else if(k.isDirectionalLight){const ie=e.get(k);if(ie.color.copy(k.color).multiplyScalar(k.intensity),k.castShadow){const re=k.shadow,ce=t.get(k);ce.shadowIntensity=re.intensity,ce.shadowBias=re.bias,ce.shadowNormalBias=re.normalBias,ce.shadowRadius=re.radius,ce.shadowMapSize=re.mapSize,i.directionalShadow[m]=ce,i.directionalShadowMap[m]=Z,i.directionalShadowMatrix[m]=k.shadow.matrix,S++}i.directional[m]=ie,m++}else if(k.isSpotLight){const ie=e.get(k);ie.position.setFromMatrixPosition(k.matrixWorld),ie.color.copy(W).multiplyScalar(ee),ie.distance=$,ie.coneCos=Math.cos(k.angle),ie.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),ie.decay=k.decay,i.spot[b]=ie;const re=k.shadow;if(k.map&&(i.spotLightMap[x]=k.map,x++,re.updateMatrices(k),k.castShadow&&A++),i.spotLightMatrix[b]=re.matrix,k.castShadow){const ce=t.get(k);ce.shadowIntensity=re.intensity,ce.shadowBias=re.bias,ce.shadowNormalBias=re.normalBias,ce.shadowRadius=re.radius,ce.shadowMapSize=re.mapSize,i.spotShadow[b]=ce,i.spotShadowMap[b]=Z,R++}b++}else if(k.isRectAreaLight){const ie=e.get(k);ie.color.copy(W).multiplyScalar(ee),ie.halfWidth.set(k.width*.5,0,0),ie.halfHeight.set(0,k.height*.5,0),i.rectArea[w]=ie,w++}else if(k.isPointLight){const ie=e.get(k);if(ie.color.copy(k.color).multiplyScalar(k.intensity),ie.distance=k.distance,ie.decay=k.decay,k.castShadow){const re=k.shadow,ce=t.get(k);ce.shadowIntensity=re.intensity,ce.shadowBias=re.bias,ce.shadowNormalBias=re.normalBias,ce.shadowRadius=re.radius,ce.shadowMapSize=re.mapSize,ce.shadowCameraNear=re.camera.near,ce.shadowCameraFar=re.camera.far,i.pointShadow[p]=ce,i.pointShadowMap[p]=Z,i.pointShadowMatrix[p]=k.shadow.matrix,E++}i.point[p]=ie,p++}else if(k.isHemisphereLight){const ie=e.get(k);ie.skyColor.copy(k.color).multiplyScalar(ee),ie.groundColor.copy(k.groundColor).multiplyScalar(ee),i.hemi[v]=ie,v++}}w>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Ce.LTC_FLOAT_1,i.rectAreaLTC2=Ce.LTC_FLOAT_2):(i.rectAreaLTC1=Ce.LTC_HALF_1,i.rectAreaLTC2=Ce.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=u,i.ambient[2]=f;const H=i.hash;(H.sunLength!==d||H.directionalLength!==m||H.pointLength!==p||H.spotLength!==b||H.rectAreaLength!==w||H.hemiLength!==v||H.numSunShadows!==g||H.numDirectionalShadows!==S||H.numPointShadows!==E||H.numSpotShadows!==R||H.numSpotMaps!==x||H.numLightProbes!==N)&&(i.sun.length=d,i.directional.length=m,i.spot.length=b,i.rectArea.length=w,i.point.length=p,i.hemi.length=v,i.sunShadow.length=g,i.sunShadowMap.length=g,i.sunShadowMatrix.length=_,i.sunShadowCascade.length=_,i.directionalShadow.length=S,i.directionalShadowMap.length=S,i.directionalShadowMatrix.length=S,i.pointShadow.length=E,i.pointShadowMap.length=E,i.pointShadowMatrix.length=E,i.spotShadow.length=R,i.spotShadowMap.length=R,i.spotLightMatrix.length=R+x-A,i.spotLightMap.length=x,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=N,H.sunLength=d,H.directionalLength=m,H.pointLength=p,H.spotLength=b,H.rectAreaLength=w,H.hemiLength=v,H.numSunShadows=g,H.numDirectionalShadows=S,H.numPointShadows=E,H.numSpotShadows=R,H.numSpotMaps=x,H.numLightProbes=N,i.version=$g++)}function l(c,h){let u=0,f=0,d=0,g=0,_=0,m=0;const p=h.matrixWorldInverse;for(let b=0,w=c.length;b<w;b++){const v=c[b];if(v.isSunLight){const S=i.sun[u];S.direction.setFromMatrixPosition(v.matrixWorld),S.direction.transformDirection(p),u++}else if(v.isDirectionalLight){const S=i.directional[f];S.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(p),f++}else if(v.isSpotLight){const S=i.spot[g];S.position.setFromMatrixPosition(v.matrixWorld),S.position.applyMatrix4(p),S.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),S.direction.sub(r),S.direction.transformDirection(p),g++}else if(v.isRectAreaLight){const S=i.rectArea[_];S.position.setFromMatrixPosition(v.matrixWorld),S.position.applyMatrix4(p),a.identity(),s.copy(v.matrixWorld),s.premultiply(p),a.extractRotation(s),S.halfWidth.set(v.width*.5,0,0),S.halfHeight.set(0,v.height*.5,0),S.halfWidth.applyMatrix4(a),S.halfHeight.applyMatrix4(a),_++}else if(v.isPointLight){const S=i.point[d];S.position.setFromMatrixPosition(v.matrixWorld),S.position.applyMatrix4(p),d++}else if(v.isHemisphereLight){const S=i.hemi[m];S.direction.setFromMatrixPosition(v.matrixWorld),S.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:i}}function Lh(n){const e=new Qg(n),t=[],i=[],r=[];function s(f){u.camera=f,t.length=0,i.length=0,r.length=0}function a(f){t.push(f)}function o(f){i.push(f)}function l(f){r.push(f)}function c(){e.setup(t)}function h(f){e.setupView(t,f)}const u={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:u,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function jg(n){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Lh(n),e.set(r,[o])):s>=a.length?(o=new Lh(n),a.push(o)):o=a[s],o}function i(){e=new WeakMap}return{get:t,dispose:i}}const ev=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,tv=`uniform sampler2D shadow_pass;
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
}`,nv=[new U(1,0,0),new U(-1,0,0),new U(0,1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1)],iv=[new U(0,-1,0),new U(0,-1,0),new U(0,0,1),new U(0,0,-1),new U(0,-1,0),new U(0,-1,0)],Ih=new ft,zr=new U,Qo=new U;function rv(n,e,t){let i=new Cc;const r=new ae,s=new ae,a=new pt,o=new Vd,l=new Wd,c={},h=t.maxTextureSize,u={[ai]:Ht,[Ht]:ai,[rn]:rn},f=new St({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ae},radius:{value:4}},vertexShader:ev,fragmentShader:tv}),d=f.clone();d.defines.HORIZONTAL_PASS=1;const g=new Mt;g.setAttribute("position",new Zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const _=new ot(g,f),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Jr;let p=this.type;this.render=function(E,R,x){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;this.type===zf&&(Ke("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Jr);const A=n.getRenderTarget(),N=n.getActiveCubeFace(),H=n.getActiveMipmapLevel(),O=n.state;O.setBlending(Mn),O.buffers.depth.getReversed()===!0?O.buffers.color.setClear(0,0,0,0):O.buffers.color.setClear(1,1,1,1),O.buffers.depth.setTest(!0),O.setScissorTest(!1);const J=p!==this.type;J&&R.traverse(function(k){k.material&&(Array.isArray(k.material)?k.material.forEach(W=>W.needsUpdate=!0):k.material.needsUpdate=!0)});for(let k=0,W=E.length;k<W;k++){const ee=E[k],$=ee.shadow;if($===void 0){Ke("WebGLShadowMap:",ee,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const Z=$.getFrameExtents();r.multiply(Z),s.copy($.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/Z.x),r.x=s.x*Z.x,$.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/Z.y),r.y=s.y*Z.y,$.mapSize.y=s.y));const ie=n.state.buffers.depth.getReversed();if($.camera._reversedDepth=ie,$.map===null||J===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===cr){if(ee.isPointLight){Ke("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}$.map=new Dt(r.x,r.y,{format:ci,type:Ut,minFilter:Pt,magFilter:Pt,generateMipmaps:!1}),$.map.texture.name=ee.name+".shadowMap",$.map.depthTexture=new Ar(r.x,r.y,hn),$.map.depthTexture.name=ee.name+".shadowMapDepth",$.map.depthTexture.format=Nn,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=It,$.map.depthTexture.magFilter=It}else ee.isPointLight?($.map=new fh(r.x),$.map.depthTexture=new od(r.x,wn)):($.map=new Dt(r.x,r.y),$.map.depthTexture=new Ar(r.x,r.y,wn)),$.map.depthTexture.name=ee.name+".shadowMap",$.map.depthTexture.format=Nn,this.type===Jr?($.map.depthTexture.compareFunction=ie?oo:ao,$.map.depthTexture.minFilter=Pt,$.map.depthTexture.magFilter=Pt):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=It,$.map.depthTexture.magFilter=It);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==r.x||$.map.height!==r.y)&&$.map.setSize(r.x,r.y);const re=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();ee.isPointLight!==!0&&$.updateMatrices(ee,x);for(let ce=0;ce<re;ce++){const Re=$.getCamera(ce);if(ee.isPointLight){const xe=$.camera,_e=$.matrix,Se=ee.distance||xe.far;Se!==xe.far&&(xe.far=Se,xe.updateProjectionMatrix()),zr.setFromMatrixPosition(ee.matrixWorld),xe.position.copy(zr),Qo.copy(xe.position),Qo.add(nv[ce]),xe.up.copy(iv[ce]),xe.lookAt(Qo),xe.updateMatrixWorld(),_e.makeTranslation(-zr.x,-zr.y,-zr.z),Ih.multiplyMatrices(xe.projectionMatrix,xe.matrixWorldInverse),$._frustum.setFromProjectionMatrix(Ih,xe.coordinateSystem,xe.reversedDepth)}if($.map.isWebGLCubeRenderTarget)n.setRenderTarget($.map,ce),n.clear();else{ce===0&&(n.setRenderTarget($.map),n.clear());const xe=$.getViewport(ce);a.set(s.x*xe.x,s.y*xe.y,s.x*xe.z,s.y*xe.w),O.viewport(a)}i=$.getFrustum(ce),v(R,x,Re,ee,this.type)}$.isPointLightShadow!==!0&&this.type===cr&&b($,x),$.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(A,N,H)};function b(E,R){const x=e.update(_);f.defines.VSM_SAMPLES!==E.blurSamples&&(f.defines.VSM_SAMPLES=E.blurSamples,d.defines.VSM_SAMPLES=E.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),E.mapPass===null?E.mapPass=new Dt(r.x,r.y,{format:ci,type:Ut}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),f.uniforms.shadow_pass.value=E.map.depthTexture,f.uniforms.resolution.value.set(E.map.width,E.map.height),f.uniforms.radius.value=E.radius,n.setRenderTarget(E.mapPass),n.clear(),n.renderBufferDirect(R,null,x,f,_,null),d.uniforms.shadow_pass.value=E.mapPass.texture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,n.setRenderTarget(E.map),n.clear(),n.renderBufferDirect(R,null,x,d,_,null)}function w(E,R,x,A){let N=null;const H=x.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(H!==void 0)N=H;else if(N=x.isPointLight===!0?l:o,n.localClippingEnabled&&R.clipShadows===!0&&Array.isArray(R.clippingPlanes)&&R.clippingPlanes.length!==0||R.displacementMap&&R.displacementScale!==0||R.alphaMap&&R.alphaTest>0||R.map&&R.alphaTest>0||R.alphaToCoverage===!0){const O=N.uuid,J=R.uuid;let k=c[O];k===void 0&&(k={},c[O]=k);let W=k[J];W===void 0&&(W=N.clone(),k[J]=W,R.addEventListener("dispose",S)),N=W}if(N.visible=R.visible,N.wireframe=R.wireframe,A===cr?N.side=R.shadowSide!==null?R.shadowSide:R.side:N.side=R.shadowSide!==null?R.shadowSide:u[R.side],N.alphaMap=R.alphaMap,N.alphaTest=R.alphaToCoverage===!0?.5:R.alphaTest,N.map=R.map,N.clipShadows=R.clipShadows,N.clippingPlanes=R.clippingPlanes,N.clipIntersection=R.clipIntersection,N.displacementMap=R.displacementMap,N.displacementScale=R.displacementScale,N.displacementBias=R.displacementBias,N.wireframeLinewidth=R.wireframeLinewidth,N.linewidth=R.linewidth,x.isPointLight===!0&&N.isMeshDistanceMaterial===!0){const O=n.properties.get(N);O.light=x}return N}function v(E,R,x,A,N){if(E.visible===!1)return;if(E.layers.test(R.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&N===cr)&&(!E.frustumCulled||E.intersectsFrustum(i))){E.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,E.matrixWorld);const J=e.update(E),k=E.material;if(Array.isArray(k)){const W=J.groups;for(let ee=0,$=W.length;ee<$;ee++){const Z=W[ee],ie=k[Z.materialIndex];if(ie&&ie.visible){const re=w(E,ie,A,N);E.onBeforeShadow(n,E,R,x,J,re,Z),n.renderBufferDirect(x,null,J,re,E,Z),E.onAfterShadow(n,E,R,x,J,re,Z)}}}else if(k.visible){const W=w(E,k,A,N);E.onBeforeShadow(n,E,R,x,J,W,null),n.renderBufferDirect(x,null,J,W,E,null),E.onAfterShadow(n,E,R,x,J,W,null)}}const O=E.children;for(let J=0,k=O.length;J<k;J++)v(O[J],R,x,A,N)}function S(E){E.target.removeEventListener("dispose",S);for(const x in c){const A=c[x],N=E.target.uuid;N in A&&(A[N].dispose(),delete A[N])}}}function sv(n,e){function t(){let X=!1;const Te=new pt;let de=null;const Ae=new pt(0,0,0,0);return{setMask:function(De){de!==De&&!X&&(n.colorMask(De,De,De,De),de=De)},setLocked:function(De){X=De},setClear:function(De,ve,Xe,Ge,gt){gt===!0&&(De*=Ge,ve*=Ge,Xe*=Ge),Te.set(De,ve,Xe,Ge),Ae.equals(Te)===!1&&(n.clearColor(De,ve,Xe,Ge),Ae.copy(Te))},reset:function(){X=!1,de=null,Ae.set(-1,0,0,0)}}}function i(){let X=!1,Te=!1,de=null,Ae=null,De=null;return{setReversed:function(ve){if(Te!==ve){const Xe=e.get("EXT_clip_control");ve?Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.ZERO_TO_ONE_EXT):Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.NEGATIVE_ONE_TO_ONE_EXT),Te=ve;const Ge=De;De=null,this.setClear(Ge)}},getReversed:function(){return Te},setTest:function(ve){ve?D(n.DEPTH_TEST):I(n.DEPTH_TEST)},setMask:function(ve){de!==ve&&!X&&(n.depthMask(ve),de=ve)},setFunc:function(ve){if(Te&&(ve=_u[ve]),Ae!==ve){switch(ve){case da:n.depthFunc(n.NEVER);break;case pa:n.depthFunc(n.ALWAYS);break;case ma:n.depthFunc(n.LESS);break;case ur:n.depthFunc(n.LEQUAL);break;case ga:n.depthFunc(n.EQUAL);break;case va:n.depthFunc(n.GEQUAL);break;case xa:n.depthFunc(n.GREATER);break;case _a:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Ae=ve}},setLocked:function(ve){X=ve},setClear:function(ve){De!==ve&&(De=ve,Te&&(ve=1-ve),n.clearDepth(ve))},reset:function(){X=!1,de=null,Ae=null,De=null,Te=!1}}}function r(){let X=!1,Te=null,de=null,Ae=null,De=null,ve=null,Xe=null,Ge=null,gt=null;return{setTest:function(lt){X||(lt?D(n.STENCIL_TEST):I(n.STENCIL_TEST))},setMask:function(lt){Te!==lt&&!X&&(n.stencilMask(lt),Te=lt)},setFunc:function(lt,yn,In){(de!==lt||Ae!==yn||De!==In)&&(n.stencilFunc(lt,yn,In),de=lt,Ae=yn,De=In)},setOp:function(lt,yn,In){(ve!==lt||Xe!==yn||Ge!==In)&&(n.stencilOp(lt,yn,In),ve=lt,Xe=yn,Ge=In)},setLocked:function(lt){X=lt},setClear:function(lt){gt!==lt&&(n.clearStencil(lt),gt=lt)},reset:function(){X=!1,Te=null,de=null,Ae=null,De=null,ve=null,Xe=null,Ge=null,gt=null}}}const s=new t,a=new i,o=new r,l=new WeakMap,c=new WeakMap;let h={},u={},f={},d=new WeakMap,g=[],_=null,m=!1,p=null,b=null,w=null,v=null,S=null,E=null,R=null,x=new Ye(0,0,0),A=0,N=!1,H=null,O=null,J=null,k=null,W=null;const ee=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,Z=0;const ie=n.getParameter(n.VERSION);ie.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(ie)[1]),$=Z>=1):ie.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(ie)[1]),$=Z>=2);let re=null,ce={};const Re=n.getParameter(n.SCISSOR_BOX),xe=n.getParameter(n.VIEWPORT),_e=new pt().fromArray(Re),Se=new pt().fromArray(xe);function ke(X,Te,de,Ae){const De=new Uint8Array(4),ve=n.createTexture();n.bindTexture(X,ve),n.texParameteri(X,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(X,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Xe=0;Xe<de;Xe++)X===n.TEXTURE_3D||X===n.TEXTURE_2D_ARRAY?n.texImage3D(Te,0,n.RGBA,1,1,Ae,0,n.RGBA,n.UNSIGNED_BYTE,De):n.texImage2D(Te+Xe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,De);return ve}const F={};F[n.TEXTURE_2D]=ke(n.TEXTURE_2D,n.TEXTURE_2D,1),F[n.TEXTURE_CUBE_MAP]=ke(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),F[n.TEXTURE_2D_ARRAY]=ke(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),F[n.TEXTURE_3D]=ke(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),D(n.DEPTH_TEST),a.setFunc(ur),K(!1),Q(Fl),D(n.CULL_FACE),G(Mn);function D(X){h[X]!==!0&&(n.enable(X),h[X]=!0)}function I(X){h[X]!==!1&&(n.disable(X),h[X]=!1)}function P(X,Te){return f[X]!==Te?(n.bindFramebuffer(X,Te),f[X]=Te,X===n.DRAW_FRAMEBUFFER&&(f[n.FRAMEBUFFER]=Te),X===n.FRAMEBUFFER&&(f[n.DRAW_FRAMEBUFFER]=Te),!0):!1}function B(X,Te){let de=g,Ae=!1;if(X){de=d.get(Te),de===void 0&&(de=[],d.set(Te,de));const De=X.textures;if(de.length!==De.length||de[0]!==n.COLOR_ATTACHMENT0){for(let ve=0,Xe=De.length;ve<Xe;ve++)de[ve]=n.COLOR_ATTACHMENT0+ve;de.length=De.length,Ae=!0}}else de[0]!==n.BACK&&(de[0]=n.BACK,Ae=!0);Ae&&n.drawBuffers(de)}function se(X){return _!==X?(n.useProgram(X),_=X,!0):!1}const me={[Pi]:n.FUNC_ADD,[kf]:n.FUNC_SUBTRACT,[Hf]:n.FUNC_REVERSE_SUBTRACT};me[Gf]=n.MIN,me[Vf]=n.MAX;const C={[Wf]:n.ZERO,[Xf]:n.ONE,[qf]:n.SRC_COLOR,[Bl]:n.SRC_ALPHA,[Qf]:n.SRC_ALPHA_SATURATE,[$f]:n.DST_COLOR,[Zf]:n.DST_ALPHA,[Yf]:n.ONE_MINUS_SRC_COLOR,[kl]:n.ONE_MINUS_SRC_ALPHA,[Jf]:n.ONE_MINUS_DST_COLOR,[Kf]:n.ONE_MINUS_DST_ALPHA,[jf]:n.CONSTANT_COLOR,[eu]:n.ONE_MINUS_CONSTANT_COLOR,[tu]:n.CONSTANT_ALPHA,[nu]:n.ONE_MINUS_CONSTANT_ALPHA};function G(X,Te,de,Ae,De,ve,Xe,Ge,gt,lt){if(X===Mn){m===!0&&(I(n.BLEND),m=!1);return}if(m===!1&&(D(n.BLEND),m=!0),X!==Bf){if(X!==p||lt!==N){if((b!==Pi||S!==Pi)&&(n.blendEquation(n.FUNC_ADD),b=Pi,S=Pi),lt)switch(X){case hr:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case fr:n.blendFunc(n.ONE,n.ONE);break;case Ol:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case zl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:st("WebGLState: Invalid blending: ",X);break}else switch(X){case hr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case fr:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Ol:st("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case zl:st("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:st("WebGLState: Invalid blending: ",X);break}w=null,v=null,E=null,R=null,x.set(0,0,0),A=0,p=X,N=lt}return}De=De||Te,ve=ve||de,Xe=Xe||Ae,(Te!==b||De!==S)&&(n.blendEquationSeparate(me[Te],me[De]),b=Te,S=De),(de!==w||Ae!==v||ve!==E||Xe!==R)&&(n.blendFuncSeparate(C[de],C[Ae],C[ve],C[Xe]),w=de,v=Ae,E=ve,R=Xe),(Ge.equals(x)===!1||gt!==A)&&(n.blendColor(Ge.r,Ge.g,Ge.b,gt),x.copy(Ge),A=gt),p=X,N=!1}function z(X,Te){X.side===rn?I(n.CULL_FACE):D(n.CULL_FACE);let de=X.side===Ht;Te&&(de=!de),K(de),X.blending===hr&&X.transparent===!1?G(Mn):G(X.blending,X.blendEquation,X.blendSrc,X.blendDst,X.blendEquationAlpha,X.blendSrcAlpha,X.blendDstAlpha,X.blendColor,X.blendAlpha,X.premultipliedAlpha),a.setFunc(X.depthFunc),a.setTest(X.depthTest),a.setMask(X.depthWrite),s.setMask(X.colorWrite);const Ae=X.stencilWrite;o.setTest(Ae),Ae&&(o.setMask(X.stencilWriteMask),o.setFunc(X.stencilFunc,X.stencilRef,X.stencilFuncMask),o.setOp(X.stencilFail,X.stencilZFail,X.stencilZPass)),ge(X.polygonOffset,X.polygonOffsetFactor,X.polygonOffsetUnits),X.alphaToCoverage===!0?D(n.SAMPLE_ALPHA_TO_COVERAGE):I(n.SAMPLE_ALPHA_TO_COVERAGE)}function K(X){H!==X&&(X?n.frontFace(n.CW):n.frontFace(n.CCW),H=X)}function Q(X){X!==Ff?(D(n.CULL_FACE),X!==O&&(X===Fl?n.cullFace(n.BACK):X===Of?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):I(n.CULL_FACE),O=X}function he(X){X!==J&&($&&n.lineWidth(X),J=X)}function ge(X,Te,de){X?(D(n.POLYGON_OFFSET_FILL),(k!==Te||W!==de)&&(k=Te,W=de,a.getReversed()&&(Te=-Te),n.polygonOffset(Te,de))):I(n.POLYGON_OFFSET_FILL)}function pe(X){X?D(n.SCISSOR_TEST):I(n.SCISSOR_TEST)}function Y(X){X===void 0&&(X=n.TEXTURE0+ee-1),re!==X&&(n.activeTexture(X),re=X)}function M(X,Te,de){de===void 0&&(re===null?de=n.TEXTURE0+ee-1:de=re);let Ae=ce[de];Ae===void 0&&(Ae={type:void 0,texture:void 0},ce[de]=Ae),(Ae.type!==X||Ae.texture!==Te)&&(re!==de&&(n.activeTexture(de),re=de),n.bindTexture(X,Te||F[X]),Ae.type=X,Ae.texture=Te)}function Pe(){const X=ce[re];X!==void 0&&X.type!==void 0&&(n.bindTexture(X.type,null),X.type=void 0,X.texture=void 0)}function Oe(){try{n.compressedTexImage2D(...arguments)}catch(X){st("WebGLState:",X)}}function L(){try{n.compressedTexImage3D(...arguments)}catch(X){st("WebGLState:",X)}}function y(){try{n.texSubImage2D(...arguments)}catch(X){st("WebGLState:",X)}}function q(){try{n.texSubImage3D(...arguments)}catch(X){st("WebGLState:",X)}}function j(){try{n.compressedTexSubImage2D(...arguments)}catch(X){st("WebGLState:",X)}}function le(){try{n.compressedTexSubImage3D(...arguments)}catch(X){st("WebGLState:",X)}}function ye(){try{n.texStorage2D(...arguments)}catch(X){st("WebGLState:",X)}}function Me(){try{n.texStorage3D(...arguments)}catch(X){st("WebGLState:",X)}}function fe(){try{n.texImage2D(...arguments)}catch(X){st("WebGLState:",X)}}function ue(){try{n.texImage3D(...arguments)}catch(X){st("WebGLState:",X)}}function be(X){return u[X]!==void 0?u[X]:n.getParameter(X)}function He(X,Te){u[X]!==Te&&(n.pixelStorei(X,Te),u[X]=Te)}function Ee(X){_e.equals(X)===!1&&(n.scissor(X.x,X.y,X.z,X.w),_e.copy(X))}function we(X){Se.equals(X)===!1&&(n.viewport(X.x,X.y,X.z,X.w),Se.copy(X))}function We(X,Te){let de=c.get(Te);de===void 0&&(de=new WeakMap,c.set(Te,de));let Ae=de.get(X);Ae===void 0&&(Ae=n.getUniformBlockIndex(Te,X.name),de.set(X,Ae))}function Ze(X,Te){const Ae=c.get(Te).get(X);l.get(Te)!==Ae&&(n.uniformBlockBinding(Te,Ae,X.__bindingPointIndex),l.set(Te,Ae))}function Je(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),a.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},u={},re=null,ce={},f={},d=new WeakMap,g=[],_=null,m=!1,p=null,b=null,w=null,v=null,S=null,E=null,R=null,x=new Ye(0,0,0),A=0,N=!1,H=null,O=null,J=null,k=null,W=null,_e.set(0,0,n.canvas.width,n.canvas.height),Se.set(0,0,n.canvas.width,n.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:D,disable:I,bindFramebuffer:P,drawBuffers:B,useProgram:se,setBlending:G,setMaterial:z,setFlipSided:K,setCullFace:Q,setLineWidth:he,setPolygonOffset:ge,setScissorTest:pe,activeTexture:Y,bindTexture:M,unbindTexture:Pe,compressedTexImage2D:Oe,compressedTexImage3D:L,texImage2D:fe,texImage3D:ue,pixelStorei:He,getParameter:be,updateUBOMapping:We,uniformBlockBinding:Ze,texStorage2D:ye,texStorage3D:Me,texSubImage2D:y,texSubImage3D:q,compressedTexSubImage2D:j,compressedTexSubImage3D:le,scissor:Ee,viewport:we,reset:Je}}function av(n,e,t,i,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ae,h=new WeakMap,u=new Set;let f;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(L,y){return g?new OffscreenCanvas(L,y):us("canvas")}function m(L,y,q){let j=1;const le=Oe(L);if((le.width>q||le.height>q)&&(j=q/Math.max(le.width,le.height)),j<1)if(typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&L instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&L instanceof ImageBitmap||typeof VideoFrame<"u"&&L instanceof VideoFrame){const ye=Math.floor(j*le.width),Me=Math.floor(j*le.height);f===void 0&&(f=_(ye,Me));const fe=y?_(ye,Me):f;return fe.width=ye,fe.height=Me,fe.getContext("2d").drawImage(L,0,0,ye,Me),Ke("WebGLRenderer: Texture has been resized from ("+le.width+"x"+le.height+") to ("+ye+"x"+Me+")."),fe}else return"data"in L&&Ke("WebGLRenderer: Image in DataTexture is too big ("+le.width+"x"+le.height+")."),L;return L}function p(L){return L.generateMipmaps}function b(L){n.generateMipmap(L)}function w(L){return L.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:L.isWebGL3DRenderTarget?n.TEXTURE_3D:L.isWebGLArrayRenderTarget||L.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function v(L,y,q,j,le,ye=!1){if(L!==null){if(n[L]!==void 0)return n[L];Ke("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+L+"'")}let Me;j&&(Me=e.get("EXT_texture_norm16"),Me||Ke("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let fe=y;if(y===n.RED&&(q===n.FLOAT&&(fe=n.R32F),q===n.HALF_FLOAT&&(fe=n.R16F),q===n.UNSIGNED_BYTE&&(fe=n.R8),q===n.UNSIGNED_SHORT&&Me&&(fe=Me.R16_EXT),q===n.SHORT&&Me&&(fe=Me.R16_SNORM_EXT)),y===n.RED_INTEGER&&(q===n.UNSIGNED_BYTE&&(fe=n.R8UI),q===n.UNSIGNED_SHORT&&(fe=n.R16UI),q===n.UNSIGNED_INT&&(fe=n.R32UI),q===n.BYTE&&(fe=n.R8I),q===n.SHORT&&(fe=n.R16I),q===n.INT&&(fe=n.R32I)),y===n.RG&&(q===n.FLOAT&&(fe=n.RG32F),q===n.HALF_FLOAT&&(fe=n.RG16F),q===n.UNSIGNED_BYTE&&(fe=n.RG8),q===n.UNSIGNED_SHORT&&Me&&(fe=Me.RG16_EXT),q===n.SHORT&&Me&&(fe=Me.RG16_SNORM_EXT)),y===n.RG_INTEGER&&(q===n.UNSIGNED_BYTE&&(fe=n.RG8UI),q===n.UNSIGNED_SHORT&&(fe=n.RG16UI),q===n.UNSIGNED_INT&&(fe=n.RG32UI),q===n.BYTE&&(fe=n.RG8I),q===n.SHORT&&(fe=n.RG16I),q===n.INT&&(fe=n.RG32I)),y===n.RGB_INTEGER&&(q===n.UNSIGNED_BYTE&&(fe=n.RGB8UI),q===n.UNSIGNED_SHORT&&(fe=n.RGB16UI),q===n.UNSIGNED_INT&&(fe=n.RGB32UI),q===n.BYTE&&(fe=n.RGB8I),q===n.SHORT&&(fe=n.RGB16I),q===n.INT&&(fe=n.RGB32I)),y===n.RGBA_INTEGER&&(q===n.UNSIGNED_BYTE&&(fe=n.RGBA8UI),q===n.UNSIGNED_SHORT&&(fe=n.RGBA16UI),q===n.UNSIGNED_INT&&(fe=n.RGBA32UI),q===n.BYTE&&(fe=n.RGBA8I),q===n.SHORT&&(fe=n.RGBA16I),q===n.INT&&(fe=n.RGBA32I)),y===n.RGB&&(q===n.UNSIGNED_SHORT&&Me&&(fe=Me.RGB16_EXT),q===n.SHORT&&Me&&(fe=Me.RGB16_SNORM_EXT),q===n.UNSIGNED_INT_5_9_9_9_REV&&(fe=n.RGB9_E5),q===n.UNSIGNED_INT_10F_11F_11F_REV&&(fe=n.R11F_G11F_B10F)),y===n.RGBA){const ue=ye?hs:it.getTransfer(le);q===n.FLOAT&&(fe=n.RGBA32F),q===n.HALF_FLOAT&&(fe=n.RGBA16F),q===n.UNSIGNED_BYTE&&(fe=ue===ht?n.SRGB8_ALPHA8:n.RGBA8),q===n.UNSIGNED_SHORT&&Me&&(fe=Me.RGBA16_EXT),q===n.SHORT&&Me&&(fe=Me.RGBA16_SNORM_EXT),q===n.UNSIGNED_SHORT_4_4_4_4&&(fe=n.RGBA4),q===n.UNSIGNED_SHORT_5_5_5_1&&(fe=n.RGB5_A1)}return(fe===n.R16F||fe===n.R32F||fe===n.RG16F||fe===n.RG32F||fe===n.RGBA16F||fe===n.RGBA32F)&&e.get("EXT_color_buffer_float"),fe}function S(L,y){let q;return L?y===null||y===wn||y===pr?q=n.DEPTH24_STENCIL8:y===hn?q=n.DEPTH32F_STENCIL8:y===dr&&(q=n.DEPTH24_STENCIL8,Ke("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===wn||y===pr?q=n.DEPTH_COMPONENT24:y===hn?q=n.DEPTH_COMPONENT32F:y===dr&&(q=n.DEPTH_COMPONENT16),q}function E(L,y){return p(L)===!0||L.isFramebufferTexture&&L.minFilter!==It&&L.minFilter!==Pt?Math.log2(Math.max(y.width,y.height))+1:L.mipmaps!==void 0&&L.mipmaps.length>0?L.mipmaps.length:L.isCompressedTexture&&Array.isArray(L.image)?y.mipmaps.length:1}function R(L){const y=L.target;y.removeEventListener("dispose",R),A(y),y.isVideoTexture&&h.delete(y),y.isHTMLTexture&&u.delete(y)}function x(L){const y=L.target;y.removeEventListener("dispose",x),H(y)}function A(L){const y=i.get(L);if(y.__webglInit===void 0)return;const q=L.source,j=d.get(q);if(j){const le=j[y.__cacheKey];le.usedTimes--,le.usedTimes===0&&N(L),Object.keys(j).length===0&&d.delete(q)}i.remove(L)}function N(L){const y=i.get(L);n.deleteTexture(y.__webglTexture);const q=L.source,j=d.get(q);delete j[y.__cacheKey],a.memory.textures--}function H(L){const y=i.get(L);if(L.depthTexture&&(L.depthTexture.dispose(),i.remove(L.depthTexture)),L.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(y.__webglFramebuffer[j]))for(let le=0;le<y.__webglFramebuffer[j].length;le++)n.deleteFramebuffer(y.__webglFramebuffer[j][le]);else n.deleteFramebuffer(y.__webglFramebuffer[j]);y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer[j])}else{if(Array.isArray(y.__webglFramebuffer))for(let j=0;j<y.__webglFramebuffer.length;j++)n.deleteFramebuffer(y.__webglFramebuffer[j]);else n.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&n.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&n.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let j=0;j<y.__webglColorRenderbuffer.length;j++)y.__webglColorRenderbuffer[j]&&n.deleteRenderbuffer(y.__webglColorRenderbuffer[j]);y.__webglDepthRenderbuffer&&n.deleteRenderbuffer(y.__webglDepthRenderbuffer)}const q=L.textures;for(let j=0,le=q.length;j<le;j++){const ye=i.get(q[j]);ye.__webglTexture&&(n.deleteTexture(ye.__webglTexture),a.memory.textures--),i.remove(q[j])}i.remove(L)}let O=0;function J(){O=0}function k(){return O}function W(L){O=L}function ee(){const L=O;return L>=r.maxTextures&&Ke("WebGLTextures: Trying to use "+(L+1)+" texture units while this GPU supports only "+r.maxTextures),O+=1,L}function $(L){const y=[];return y.push(L.wrapS),y.push(L.wrapT),y.push(L.wrapR||0),y.push(L.magFilter),y.push(L.minFilter),y.push(L.anisotropy),y.push(L.internalFormat),y.push(L.format),y.push(L.type),y.push(L.generateMipmaps),y.push(L.premultiplyAlpha),y.push(L.flipY),y.push(L.unpackAlignment),y.push(L.colorSpace),y.join()}function Z(L,y){const q=i.get(L);if(L.isVideoTexture&&M(L),L.isRenderTargetTexture===!1&&L.isExternalTexture!==!0&&L.version>0&&q.__version!==L.version){const j=L.image;if(j===null)Ke("WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)Ke("WebGLRenderer: Texture marked for update but image is incomplete");else{I(q,L,y);return}}else L.isExternalTexture&&(q.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,q.__webglTexture,n.TEXTURE0+y)}function ie(L,y){const q=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&q.__version!==L.version){I(q,L,y);return}else L.isExternalTexture&&(q.__webglTexture=L.sourceTexture?L.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,q.__webglTexture,n.TEXTURE0+y)}function re(L,y){const q=i.get(L);if(L.isRenderTargetTexture===!1&&L.version>0&&q.__version!==L.version){I(q,L,y);return}t.bindTexture(n.TEXTURE_3D,q.__webglTexture,n.TEXTURE0+y)}function ce(L,y){const q=i.get(L);if(L.isCubeDepthTexture!==!0&&L.version>0&&q.__version!==L.version){P(q,L,y);return}t.bindTexture(n.TEXTURE_CUBE_MAP,q.__webglTexture,n.TEXTURE0+y)}const Re={[jr]:n.REPEAT,[bn]:n.CLAMP_TO_EDGE,[es]:n.MIRRORED_REPEAT},xe={[It]:n.NEAREST,[su]:n.NEAREST_MIPMAP_NEAREST,[ts]:n.NEAREST_MIPMAP_LINEAR,[Pt]:n.LINEAR,[Sa]:n.LINEAR_MIPMAP_NEAREST,[Xn]:n.LINEAR_MIPMAP_LINEAR},_e={[cu]:n.NEVER,[pu]:n.ALWAYS,[hu]:n.LESS,[ao]:n.LEQUAL,[fu]:n.EQUAL,[oo]:n.GEQUAL,[uu]:n.GREATER,[du]:n.NOTEQUAL};function Se(L,y){if(y.type===hn&&e.has("OES_texture_float_linear")===!1&&(y.magFilter===Pt||y.magFilter===Sa||y.magFilter===ts||y.magFilter===Xn||y.minFilter===Pt||y.minFilter===Sa||y.minFilter===ts||y.minFilter===Xn)&&Ke("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(L,n.TEXTURE_WRAP_S,Re[y.wrapS]),n.texParameteri(L,n.TEXTURE_WRAP_T,Re[y.wrapT]),(L===n.TEXTURE_3D||L===n.TEXTURE_2D_ARRAY)&&n.texParameteri(L,n.TEXTURE_WRAP_R,Re[y.wrapR]),n.texParameteri(L,n.TEXTURE_MAG_FILTER,xe[y.magFilter]),n.texParameteri(L,n.TEXTURE_MIN_FILTER,xe[y.minFilter]),y.compareFunction&&(n.texParameteri(L,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(L,n.TEXTURE_COMPARE_FUNC,_e[y.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===It||y.minFilter!==ts&&y.minFilter!==Xn||y.type===hn&&e.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){const q=e.get("EXT_texture_filter_anisotropic");n.texParameterf(L,q.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,r.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function ke(L,y){let q=!1;L.__webglInit===void 0&&(L.__webglInit=!0,y.addEventListener("dispose",R));const j=y.source;let le=d.get(j);le===void 0&&(le={},d.set(j,le));const ye=$(y);if(ye!==L.__cacheKey){le[ye]===void 0&&(le[ye]={texture:n.createTexture(),usedTimes:0},a.memory.textures++,q=!0),le[ye].usedTimes++;const Me=le[L.__cacheKey];Me!==void 0&&(le[L.__cacheKey].usedTimes--,Me.usedTimes===0&&N(y)),L.__cacheKey=ye,L.__webglTexture=le[ye].texture}return q}function F(L,y,q){return Math.floor(Math.floor(L/q)/y)}function D(L,y,q,j){const ye=L.updateRanges;if(ye.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,y.width,y.height,q,j,y.data);else{ye.sort((He,Ee)=>He.start-Ee.start);let Me=0;for(let He=1;He<ye.length;He++){const Ee=ye[Me],we=ye[He],We=Ee.start+Ee.count,Ze=F(we.start,y.width,4),Je=F(Ee.start,y.width,4);we.start<=We+1&&Ze===Je&&F(we.start+we.count-1,y.width,4)===Ze?Ee.count=Math.max(Ee.count,we.start+we.count-Ee.start):(++Me,ye[Me]=we)}ye.length=Me+1;const fe=t.getParameter(n.UNPACK_ROW_LENGTH),ue=t.getParameter(n.UNPACK_SKIP_PIXELS),be=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,y.width);for(let He=0,Ee=ye.length;He<Ee;He++){const we=ye[He],We=Math.floor(we.start/4),Ze=Math.ceil(we.count/4),Je=We%y.width,X=Math.floor(We/y.width),Te=Ze,de=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Je),t.pixelStorei(n.UNPACK_SKIP_ROWS,X),t.texSubImage2D(n.TEXTURE_2D,0,Je,X,Te,de,q,j,y.data)}L.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,fe),t.pixelStorei(n.UNPACK_SKIP_PIXELS,ue),t.pixelStorei(n.UNPACK_SKIP_ROWS,be)}}function I(L,y,q){let j=n.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(j=n.TEXTURE_2D_ARRAY),y.isData3DTexture&&(j=n.TEXTURE_3D);const le=ke(L,y),ye=y.source;t.bindTexture(j,L.__webglTexture,n.TEXTURE0+q);const Me=i.get(ye);if(ye.version!==Me.__version||le===!0){if(t.activeTexture(n.TEXTURE0+q),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){const de=it.getPrimaries(it.workingColorSpace),Ae=y.colorSpace===Un?null:it.getPrimaries(y.colorSpace),De=y.colorSpace===Un||de===Ae?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,De)}t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment);let ue=m(y.image,!1,r.maxTextureSize);ue=Pe(y,ue);const be=s.convert(y.format,y.colorSpace),He=s.convert(y.type);let Ee=v(y.internalFormat,be,He,y.normalized,y.colorSpace,y.isVideoTexture);Se(j,y);let we;const We=y.mipmaps,Ze=y.isVideoTexture!==!0,Je=Me.__version===void 0||le===!0,X=ye.dataReady,Te=E(y,ue);if(y.isDepthTexture)Ee=S(y.format===li,y.type),Je&&(Ze?t.texStorage2D(n.TEXTURE_2D,1,Ee,ue.width,ue.height):t.texImage2D(n.TEXTURE_2D,0,Ee,ue.width,ue.height,0,be,He,null));else if(y.isDataTexture)if(We.length>0){Ze&&Je&&t.texStorage2D(n.TEXTURE_2D,Te,Ee,We[0].width,We[0].height);for(let de=0,Ae=We.length;de<Ae;de++)we=We[de],Ze?X&&t.texSubImage2D(n.TEXTURE_2D,de,0,0,we.width,we.height,be,He,we.data):t.texImage2D(n.TEXTURE_2D,de,Ee,we.width,we.height,0,be,He,we.data);y.generateMipmaps=!1}else Ze?(Je&&t.texStorage2D(n.TEXTURE_2D,Te,Ee,ue.width,ue.height),X&&D(y,ue,be,He)):t.texImage2D(n.TEXTURE_2D,0,Ee,ue.width,ue.height,0,be,He,ue.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Ze&&Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Te,Ee,We[0].width,We[0].height,ue.depth);for(let de=0,Ae=We.length;de<Ae;de++)if(we=We[de],y.format!==fn)if(be!==null)if(Ze){if(X)if(y.layerUpdates.size>0){const De=ih(we.width,we.height,y.format,y.type);for(const ve of y.layerUpdates){const Xe=we.data.subarray(ve*De/we.data.BYTES_PER_ELEMENT,(ve+1)*De/we.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,de,0,0,ve,we.width,we.height,1,be,Xe)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,de,0,0,0,we.width,we.height,ue.depth,be,we.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,de,Ee,we.width,we.height,ue.depth,0,we.data,0,0);else Ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ze?X&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,de,0,0,0,we.width,we.height,ue.depth,be,He,we.data):t.texImage3D(n.TEXTURE_2D_ARRAY,de,Ee,we.width,we.height,ue.depth,0,be,He,we.data);y.layerUpdates.size>0&&y.clearLayerUpdates()}else{Ze&&Je&&t.texStorage2D(n.TEXTURE_2D,Te,Ee,We[0].width,We[0].height);for(let de=0,Ae=We.length;de<Ae;de++)we=We[de],y.format!==fn?be!==null?Ze?X&&t.compressedTexSubImage2D(n.TEXTURE_2D,de,0,0,we.width,we.height,be,we.data):t.compressedTexImage2D(n.TEXTURE_2D,de,Ee,we.width,we.height,0,we.data):Ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ze?X&&t.texSubImage2D(n.TEXTURE_2D,de,0,0,we.width,we.height,be,He,we.data):t.texImage2D(n.TEXTURE_2D,de,Ee,we.width,we.height,0,be,He,we.data)}else if(y.isDataArrayTexture)if(Ze){if(Je&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Te,Ee,ue.width,ue.height,ue.depth),X)if(y.layerUpdates.size>0){const de=ih(ue.width,ue.height,y.format,y.type);for(const Ae of y.layerUpdates){const De=ue.data.subarray(Ae*de/ue.data.BYTES_PER_ELEMENT,(Ae+1)*de/ue.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,Ae,ue.width,ue.height,1,be,He,De)}y.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ue.width,ue.height,ue.depth,be,He,ue.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,Ee,ue.width,ue.height,ue.depth,0,be,He,ue.data);else if(y.isData3DTexture)Ze?(Je&&t.texStorage3D(n.TEXTURE_3D,Te,Ee,ue.width,ue.height,ue.depth),X&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ue.width,ue.height,ue.depth,be,He,ue.data)):t.texImage3D(n.TEXTURE_3D,0,Ee,ue.width,ue.height,ue.depth,0,be,He,ue.data);else if(y.isFramebufferTexture){if(Je)if(Ze)t.texStorage2D(n.TEXTURE_2D,Te,Ee,ue.width,ue.height);else{let de=ue.width,Ae=ue.height;for(let De=0;De<Te;De++)t.texImage2D(n.TEXTURE_2D,De,Ee,de,Ae,0,be,He,null),de>>=1,Ae>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in n){const de=n.canvas;if(de.hasAttribute("layoutsubtree")||de.setAttribute("layoutsubtree","true"),ue.parentNode!==de){de.appendChild(ue),u.add(y),de.onpaint=Ae=>{const De=Ae.changedElements;for(const ve of u)De.includes(ve.image)&&(ve.needsUpdate=!0)},de.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,ue);else{const De=n.RGBA,ve=n.RGBA,Xe=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,De,ve,Xe,ue)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(We.length>0){if(Ze&&Je){const de=Oe(We[0]);t.texStorage2D(n.TEXTURE_2D,Te,Ee,de.width,de.height)}for(let de=0,Ae=We.length;de<Ae;de++)we=We[de],Ze?X&&t.texSubImage2D(n.TEXTURE_2D,de,0,0,be,He,we):t.texImage2D(n.TEXTURE_2D,de,Ee,be,He,we);y.generateMipmaps=!1}else if(Ze){if(Je){const de=Oe(ue);t.texStorage2D(n.TEXTURE_2D,Te,Ee,de.width,de.height)}X&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,be,He,ue)}else t.texImage2D(n.TEXTURE_2D,0,Ee,be,He,ue);p(y)&&b(j),Me.__version=ye.version,y.onUpdate&&y.onUpdate(y)}L.__version=y.version}function P(L,y,q){if(y.image.length!==6)return;const j=ke(L,y),le=y.source;t.bindTexture(n.TEXTURE_CUBE_MAP,L.__webglTexture,n.TEXTURE0+q);const ye=i.get(le);if(le.version!==ye.__version||j===!0){t.activeTexture(n.TEXTURE0+q);const Me=it.getPrimaries(it.workingColorSpace),fe=y.colorSpace===Un?null:it.getPrimaries(y.colorSpace),ue=y.colorSpace===Un||Me===fe?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,y.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,y.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ue);const be=y.isCompressedTexture||y.image[0].isCompressedTexture,He=y.image[0]&&y.image[0].isDataTexture,Ee=[];for(let ve=0;ve<6;ve++)!be&&!He?Ee[ve]=m(y.image[ve],!0,r.maxCubemapSize):Ee[ve]=He?y.image[ve].image:y.image[ve],Ee[ve]=Pe(y,Ee[ve]);const we=Ee[0],We=s.convert(y.format,y.colorSpace),Ze=s.convert(y.type),Je=v(y.internalFormat,We,Ze,y.normalized,y.colorSpace),X=y.isVideoTexture!==!0,Te=ye.__version===void 0||j===!0,de=le.dataReady;let Ae=E(y,we);Se(n.TEXTURE_CUBE_MAP,y);let De;if(be){X&&Te&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Ae,Je,we.width,we.height);for(let ve=0;ve<6;ve++){De=Ee[ve].mipmaps;for(let Xe=0;Xe<De.length;Xe++){const Ge=De[Xe];y.format!==fn?We!==null?X?de&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,0,0,Ge.width,Ge.height,We,Ge.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,Je,Ge.width,Ge.height,0,Ge.data):Ke("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):X?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,0,0,Ge.width,Ge.height,We,Ze,Ge.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe,Je,Ge.width,Ge.height,0,We,Ze,Ge.data)}}}else{if(De=y.mipmaps,X&&Te){De.length>0&&Ae++;const ve=Oe(Ee[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Ae,Je,ve.width,ve.height)}for(let ve=0;ve<6;ve++)if(He){X?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,Ee[ve].width,Ee[ve].height,We,Ze,Ee[ve].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,Je,Ee[ve].width,Ee[ve].height,0,We,Ze,Ee[ve].data);for(let Xe=0;Xe<De.length;Xe++){const gt=De[Xe].image[ve].image;X?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,0,0,gt.width,gt.height,We,Ze,gt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,Je,gt.width,gt.height,0,We,Ze,gt.data)}}else{X?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,We,Ze,Ee[ve]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,Je,We,Ze,Ee[ve]);for(let Xe=0;Xe<De.length;Xe++){const Ge=De[Xe];X?de&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,0,0,We,Ze,Ge.image[ve]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Xe+1,Je,We,Ze,Ge.image[ve])}}}p(y)&&b(n.TEXTURE_CUBE_MAP),ye.__version=le.version,y.onUpdate&&y.onUpdate(y)}L.__version=y.version}function B(L,y,q,j,le,ye){const Me=s.convert(q.format,q.colorSpace),fe=s.convert(q.type),ue=v(q.internalFormat,Me,fe,q.normalized,q.colorSpace),be=i.get(y),He=i.get(q);if(He.__renderTarget=y,!be.__hasExternalTextures){const Ee=Math.max(1,y.width>>ye),we=Math.max(1,y.height>>ye);le===n.TEXTURE_3D||le===n.TEXTURE_2D_ARRAY?t.texImage3D(le,ye,ue,Ee,we,y.depth,0,Me,fe,null):t.texImage2D(le,ye,ue,Ee,we,0,Me,fe,null)}t.bindFramebuffer(n.FRAMEBUFFER,L),Y(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,j,le,He.__webglTexture,0,pe(y)):(le===n.TEXTURE_2D||le>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&le<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,j,le,He.__webglTexture,ye),t.bindFramebuffer(n.FRAMEBUFFER,null)}function se(L,y,q){if(n.bindRenderbuffer(n.RENDERBUFFER,L),y.depthBuffer){const j=y.depthTexture,le=j&&j.isDepthTexture?j.type:null,ye=S(y.stencilBuffer,le),Me=y.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Y(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,pe(y),ye,y.width,y.height):q?n.renderbufferStorageMultisample(n.RENDERBUFFER,pe(y),ye,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ye,y.width,y.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Me,n.RENDERBUFFER,L)}else{const j=y.textures;for(let le=0;le<j.length;le++){const ye=j[le],Me=s.convert(ye.format,ye.colorSpace),fe=s.convert(ye.type),ue=v(ye.internalFormat,Me,fe,ye.normalized,ye.colorSpace);Y(y)?o.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,pe(y),ue,y.width,y.height):q?n.renderbufferStorageMultisample(n.RENDERBUFFER,pe(y),ue,y.width,y.height):n.renderbufferStorage(n.RENDERBUFFER,ue,y.width,y.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function me(L,y,q){const j=y.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,L),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const le=i.get(y.depthTexture);if(le.__renderTarget=y,(!le.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),j){if(le.__webglInit===void 0&&(le.__webglInit=!0,y.depthTexture.addEventListener("dispose",R)),le.__webglTexture===void 0){le.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,le.__webglTexture),Se(n.TEXTURE_CUBE_MAP,y.depthTexture);const be=s.convert(y.depthTexture.format),He=s.convert(y.depthTexture.type);let Ee;y.depthTexture.format===Nn?Ee=n.DEPTH_COMPONENT24:y.depthTexture.format===li&&(Ee=n.DEPTH24_STENCIL8);for(let we=0;we<6;we++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+we,0,Ee,y.width,y.height,0,be,He,null)}}else Z(y.depthTexture,0);const ye=le.__webglTexture,Me=pe(y),fe=j?n.TEXTURE_CUBE_MAP_POSITIVE_X+q:n.TEXTURE_2D,ue=y.depthTexture.format===li?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(y.depthTexture.format===Nn)Y(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ue,fe,ye,0,Me):n.framebufferTexture2D(n.FRAMEBUFFER,ue,fe,ye,0);else if(y.depthTexture.format===li)Y(y)?o.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ue,fe,ye,0,Me):n.framebufferTexture2D(n.FRAMEBUFFER,ue,fe,ye,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function C(L){const y=i.get(L),q=L.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==L.depthTexture){const j=L.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),j){const le=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,j.removeEventListener("dispose",le)};j.addEventListener("dispose",le),y.__depthDisposeCallback=le}y.__boundDepthTexture=j}if(L.depthTexture&&!y.__autoAllocateDepthBuffer)if(q)for(let j=0;j<6;j++)me(y.__webglFramebuffer[j],L,j);else{const j=L.texture.mipmaps;j&&j.length>0?me(y.__webglFramebuffer[0],L,0):me(y.__webglFramebuffer,L,0)}else if(q){y.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[j]),y.__webglDepthbuffer[j]===void 0)y.__webglDepthbuffer[j]=n.createRenderbuffer(),se(y.__webglDepthbuffer[j],L,!1);else{const le=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ye=y.__webglDepthbuffer[j];n.bindRenderbuffer(n.RENDERBUFFER,ye),n.framebufferRenderbuffer(n.FRAMEBUFFER,le,n.RENDERBUFFER,ye)}}else{const j=L.texture.mipmaps;if(j&&j.length>0?t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=n.createRenderbuffer(),se(y.__webglDepthbuffer,L,!1);else{const le=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,ye=y.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,ye),n.framebufferRenderbuffer(n.FRAMEBUFFER,le,n.RENDERBUFFER,ye)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function G(L,y,q){const j=i.get(L);y!==void 0&&B(j.__webglFramebuffer,L,L.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),q!==void 0&&C(L)}function z(L){const y=L.texture,q=i.get(L),j=i.get(y);L.addEventListener("dispose",x);const le=L.textures,ye=L.isWebGLCubeRenderTarget===!0,Me=le.length>1;if(Me||(j.__webglTexture===void 0&&(j.__webglTexture=n.createTexture()),j.__version=y.version,a.memory.textures++),ye){q.__webglFramebuffer=[];for(let fe=0;fe<6;fe++)if(y.mipmaps&&y.mipmaps.length>0){q.__webglFramebuffer[fe]=[];for(let ue=0;ue<y.mipmaps.length;ue++)q.__webglFramebuffer[fe][ue]=n.createFramebuffer()}else q.__webglFramebuffer[fe]=n.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){q.__webglFramebuffer=[];for(let fe=0;fe<y.mipmaps.length;fe++)q.__webglFramebuffer[fe]=n.createFramebuffer()}else q.__webglFramebuffer=n.createFramebuffer();if(Me)for(let fe=0,ue=le.length;fe<ue;fe++){const be=i.get(le[fe]);be.__webglTexture===void 0&&(be.__webglTexture=n.createTexture(),a.memory.textures++)}if(L.samples>0&&Y(L)===!1){q.__webglMultisampledFramebuffer=n.createFramebuffer(),q.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,q.__webglMultisampledFramebuffer);for(let fe=0;fe<le.length;fe++){const ue=le[fe];q.__webglColorRenderbuffer[fe]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,q.__webglColorRenderbuffer[fe]);const be=s.convert(ue.format,ue.colorSpace),He=s.convert(ue.type),Ee=v(ue.internalFormat,be,He,ue.normalized,ue.colorSpace,L.isXRRenderTarget===!0),we=pe(L);n.renderbufferStorageMultisample(n.RENDERBUFFER,we,Ee,L.width,L.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+fe,n.RENDERBUFFER,q.__webglColorRenderbuffer[fe])}n.bindRenderbuffer(n.RENDERBUFFER,null),L.depthBuffer&&(q.__webglDepthRenderbuffer=n.createRenderbuffer(),se(q.__webglDepthRenderbuffer,L,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(ye){t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),Se(n.TEXTURE_CUBE_MAP,y);for(let fe=0;fe<6;fe++)if(y.mipmaps&&y.mipmaps.length>0)for(let ue=0;ue<y.mipmaps.length;ue++)B(q.__webglFramebuffer[fe][ue],L,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+fe,ue);else B(q.__webglFramebuffer[fe],L,y,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+fe,0);p(y)&&b(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Me){for(let fe=0,ue=le.length;fe<ue;fe++){const be=le[fe],He=i.get(be);let Ee=n.TEXTURE_2D;(L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(Ee=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Ee,He.__webglTexture),Se(Ee,be),B(q.__webglFramebuffer,L,be,n.COLOR_ATTACHMENT0+fe,Ee,0),p(be)&&b(Ee)}t.unbindTexture()}else{let fe=n.TEXTURE_2D;if((L.isWebGL3DRenderTarget||L.isWebGLArrayRenderTarget)&&(fe=L.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(fe,j.__webglTexture),Se(fe,y),y.mipmaps&&y.mipmaps.length>0)for(let ue=0;ue<y.mipmaps.length;ue++)B(q.__webglFramebuffer[ue],L,y,n.COLOR_ATTACHMENT0,fe,ue);else B(q.__webglFramebuffer,L,y,n.COLOR_ATTACHMENT0,fe,0);p(y)&&b(fe),t.unbindTexture()}L.depthBuffer&&C(L)}function K(L){const y=L.textures;for(let q=0,j=y.length;q<j;q++){const le=y[q];if(p(le)){const ye=w(L),Me=i.get(le).__webglTexture;t.bindTexture(ye,Me),b(ye),t.unbindTexture()}}}const Q=[],he=[];function ge(L){if(L.samples>0){if(Y(L)===!1){const y=L.textures,q=L.width,j=L.height;let le=n.COLOR_BUFFER_BIT;const ye=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Me=i.get(L),fe=y.length>1;if(fe)for(let be=0;be<y.length;be++)t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Me.__webglMultisampledFramebuffer);const ue=L.texture.mipmaps;ue&&ue.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Me.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Me.__webglFramebuffer);for(let be=0;be<y.length;be++){if(L.resolveDepthBuffer&&(L.depthBuffer&&(le|=n.DEPTH_BUFFER_BIT),L.stencilBuffer&&L.resolveStencilBuffer&&(le|=n.STENCIL_BUFFER_BIT)),fe){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Me.__webglColorRenderbuffer[be]);const He=i.get(y[be]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,He,0)}n.blitFramebuffer(0,0,q,j,0,0,q,j,le,n.NEAREST),l===!0&&(Q.length=0,he.length=0,Q.push(n.COLOR_ATTACHMENT0+be),L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&(Q.push(ye),he.push(ye),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,he)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Q))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),fe)for(let be=0;be<y.length;be++){t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.RENDERBUFFER,Me.__webglColorRenderbuffer[be]);const He=i.get(y[be]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+be,n.TEXTURE_2D,He,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Me.__webglMultisampledFramebuffer)}else if(L.depthBuffer&&L.storeMultisampledDepthBuffer===!1&&l){const y=L.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[y])}}}function pe(L){return Math.min(r.maxSamples,L.samples)}function Y(L){const y=i.get(L);return L.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function M(L){const y=a.render.frame;h.get(L)!==y&&(h.set(L,y),L.update())}function Pe(L,y){const q=L.colorSpace,j=L.format,le=L.type;return L.isCompressedTexture===!0||L.isVideoTexture===!0||q!==cs&&q!==Un&&(it.getTransfer(q)===ht?(j!==fn||le!==Kt)&&Ke("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):st("WebGLTextures: Unsupported texture color space:",q)),y}function Oe(L){return typeof HTMLImageElement<"u"&&L instanceof HTMLImageElement?(c.width=L.naturalWidth||L.width,c.height=L.naturalHeight||L.height):typeof VideoFrame<"u"&&L instanceof VideoFrame?(c.width=L.displayWidth,c.height=L.displayHeight):(c.width=L.width,c.height=L.height),c}this.allocateTextureUnit=ee,this.resetTextureUnits=J,this.getTextureUnits=k,this.setTextureUnits=W,this.setTexture2D=Z,this.setTexture2DArray=ie,this.setTexture3D=re,this.setTextureCube=ce,this.rebindTextures=G,this.setupRenderTarget=z,this.updateRenderTargetMipmap=K,this.updateMultisampleRenderTarget=ge,this.setupDepthRenderbuffer=C,this.setupFrameBufferTexture=B,this.useMultisampledRTT=Y,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function ov(n,e){function t(i,r=Un){let s;const a=it.getTransfer(r);if(i===Kt)return n.UNSIGNED_BYTE;if(i===wa)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Ea)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Ql)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===jl)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===$l)return n.BYTE;if(i===Jl)return n.SHORT;if(i===dr)return n.UNSIGNED_SHORT;if(i===ba)return n.INT;if(i===wn)return n.UNSIGNED_INT;if(i===hn)return n.FLOAT;if(i===Ut)return n.HALF_FLOAT;if(i===ec)return n.ALPHA;if(i===tc)return n.RGB;if(i===fn)return n.RGBA;if(i===Nn)return n.DEPTH_COMPONENT;if(i===li)return n.DEPTH_STENCIL;if(i===ns)return n.RED;if(i===Ta)return n.RED_INTEGER;if(i===ci)return n.RG;if(i===Aa)return n.RG_INTEGER;if(i===Ra)return n.RGBA_INTEGER;if(i===is||i===rs||i===ss||i===as)if(a===ht)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===is)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===rs)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===ss)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===as)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===is)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===rs)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===ss)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===as)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Ca||i===Pa||i===La||i===Ia)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Ca)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Pa)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===La)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Ia)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Da||i===Na||i===Ua||i===Fa||i===Oa||i===os||i===za)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Da||i===Na)return a===ht?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Ua)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Fa)return s.COMPRESSED_R11_EAC;if(i===Oa)return s.COMPRESSED_SIGNED_R11_EAC;if(i===os)return s.COMPRESSED_RG11_EAC;if(i===za)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Ba||i===ka||i===Ha||i===Ga||i===Va||i===Wa||i===Xa||i===qa||i===Ya||i===Za||i===Ka||i===$a||i===Ja||i===Qa)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Ba)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ka)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Ha)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Ga)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Va)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Wa)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Xa)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===qa)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Ya)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Za)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Ka)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===$a)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ja)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Qa)return a===ht?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===ja||i===eo||i===to)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===ja)return a===ht?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===eo)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===to)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===no||i===io||i===ls||i===ro)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===no)return s.COMPRESSED_RED_RGTC1_EXT;if(i===io)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===ls)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===ro)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===pr?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const lv=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cv=`
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

}`;class hv{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new Lc(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new St({vertexShader:lv,fragmentShader:cv,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new ot(new Ki(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class fv extends hi{constructor(e,t){super();const i=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,g=null;const _=typeof XRWebGLBinding<"u",m=new hv,p={},b=t.getContextAttributes();let w=null,v=null;const S=[],E=[],R=new ae;let x=null,A=null;const N=new en;N.viewport=new pt;const H=new en;H.viewport=new pt;const O=[N,H],J=new Jd;let k=null,W=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(F){let D=S[F];return D===void 0&&(D=new go,S[F]=D),D.getTargetRaySpace()},this.getControllerGrip=function(F){let D=S[F];return D===void 0&&(D=new go,S[F]=D),D.getGripSpace()},this.getHand=function(F){let D=S[F];return D===void 0&&(D=new go,S[F]=D),D.getHandSpace()};function ee(F){const D=E.indexOf(F.inputSource);if(D===-1)return;const I=S[D];I!==void 0&&(I.update(F.inputSource,F.frame,c||a),I.dispatchEvent({type:F.type,data:F.inputSource}))}function $(){r.removeEventListener("select",ee),r.removeEventListener("selectstart",ee),r.removeEventListener("selectend",ee),r.removeEventListener("squeeze",ee),r.removeEventListener("squeezestart",ee),r.removeEventListener("squeezeend",ee),r.removeEventListener("end",$),r.removeEventListener("inputsourceschange",Z);for(let F=0;F<S.length;F++){const D=E[F];D!==null&&(E[F]=null,S[F].disconnect(D))}k=null,W=null,m.reset();for(const F in p)delete p[F];if(e.setRenderTarget(w),d=null,f=null,u=null,r=null,v=null,ke.stop(),i.isPresenting=!1,e.setPixelRatio(x),e.setSize(R.width,R.height,!1),A!==null){const F=A.camera;F.fov=A.fov,F.zoom=A.zoom,F.updateProjectionMatrix(),A=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(F){s=F,i.isPresenting===!0&&Ke("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(F){o=F,i.isPresenting===!0&&Ke("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(F){c=F},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u===null&&_&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(F){if(r=F,r!==null){if(w=e.getRenderTarget(),r.addEventListener("select",ee),r.addEventListener("selectstart",ee),r.addEventListener("selectend",ee),r.addEventListener("squeeze",ee),r.addEventListener("squeezestart",ee),r.addEventListener("squeezeend",ee),r.addEventListener("end",$),r.addEventListener("inputsourceschange",Z),b.xrCompatible!==!0&&await t.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(R),_&&"createProjectionLayer"in XRWebGLBinding.prototype){let I=null,P=null,B=null;b.depth&&(B=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,I=b.stencil?li:Nn,P=b.stencil?pr:wn);const se={colorFormat:t.RGBA8,depthFormat:B,scaleFactor:s};u=this.getBinding(),f=u.createProjectionLayer(se),r.updateRenderState({layers:[f]}),e.setPixelRatio(1),e.setSize(f.textureWidth,f.textureHeight,!1),v=new Dt(f.textureWidth,f.textureHeight,{format:fn,type:Kt,depthTexture:new Ar(f.textureWidth,f.textureHeight,P,void 0,void 0,void 0,void 0,void 0,void 0,I),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}else{const I={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:s};d=new XRWebGLLayer(r,t,I),r.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),v=new Dt(d.framebufferWidth,d.framebufferHeight,{format:fn,type:Kt,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),ke.setContext(r),ke.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Z(F){for(let D=0;D<F.removed.length;D++){const I=F.removed[D],P=E.indexOf(I);P>=0&&(E[P]=null,S[P].disconnect(I))}for(let D=0;D<F.added.length;D++){const I=F.added[D];let P=E.indexOf(I);if(P===-1){for(let se=0;se<S.length;se++)if(se>=E.length){E.push(I),P=se;break}else if(E[se]===null){E[se]=I,P=se;break}if(P===-1)break}const B=S[P];B&&B.connect(I)}}const ie=new U,re=new U;function ce(F,D,I){ie.setFromMatrixPosition(D.matrixWorld),re.setFromMatrixPosition(I.matrixWorld);const P=ie.distanceTo(re),B=D.projectionMatrix.elements,se=I.projectionMatrix.elements,me=B[14]/(B[10]-1),C=B[14]/(B[10]+1),G=(B[9]+1)/B[5],z=(B[9]-1)/B[5],K=(B[8]-1)/B[0],Q=(se[8]+1)/se[0],he=me*K,ge=me*Q,pe=P/(-K+Q),Y=pe*-K;if(D.matrixWorld.decompose(F.position,F.quaternion,F.scale),F.translateX(Y),F.translateZ(pe),F.matrixWorld.compose(F.position,F.quaternion,F.scale),F.matrixWorldInverse.copy(F.matrixWorld).invert(),B[10]===-1)F.projectionMatrix.copy(D.projectionMatrix),F.projectionMatrixInverse.copy(D.projectionMatrixInverse);else{const M=me+pe,Pe=C+pe,Oe=he-Y,L=ge+(P-Y),y=G*C/Pe*M,q=z*C/Pe*M;F.projectionMatrix.makePerspective(Oe,L,y,q,M,Pe),F.projectionMatrixInverse.copy(F.projectionMatrix).invert()}}function Re(F,D){D===null?F.matrixWorld.copy(F.matrix):F.matrixWorld.multiplyMatrices(D.matrixWorld,F.matrix),F.matrixWorldInverse.copy(F.matrixWorld).invert()}this.updateCamera=function(F){if(r===null)return;let D=F.near,I=F.far;m.texture!==null&&(m.depthNear>0&&(D=m.depthNear),m.depthFar>0&&(I=m.depthFar)),J.near=H.near=N.near=D,J.far=H.far=N.far=I,(k!==J.near||W!==J.far)&&(r.updateRenderState({depthNear:J.near,depthFar:J.far}),k=J.near,W=J.far),J.layers.mask=F.layers.mask|6,N.layers.mask=J.layers.mask&-5,H.layers.mask=J.layers.mask&-3;const P=F.parent,B=J.cameras;Re(J,P);for(let se=0;se<B.length;se++)Re(B[se],P);B.length===2?ce(J,N,H):J.projectionMatrix.copy(N.projectionMatrix),A===null&&F.isPerspectiveCamera&&(A={camera:F,fov:F.fov,zoom:F.zoom}),xe(F,J,P)};function xe(F,D,I){I===null?F.matrix.copy(D.matrixWorld):(F.matrix.copy(I.matrixWorld),F.matrix.invert(),F.matrix.multiply(D.matrixWorld)),F.matrix.decompose(F.position,F.quaternion,F.scale),F.updateMatrixWorld(!0),F.projectionMatrix.copy(D.projectionMatrix),F.projectionMatrixInverse.copy(D.projectionMatrixInverse),F.isPerspectiveCamera&&(F.fov=gr*2*Math.atan(1/F.projectionMatrix.elements[5]),F.zoom=1)}this.getCamera=function(){return J},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(F){l=F,f!==null&&(f.fixedFoveation=F),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=F)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(J)},this.getCameraTexture=function(F){return p[F]};let _e=null;function Se(F,D){if(h=D.getViewerPose(c||a),g=D,h!==null){const I=h.views;d!==null&&(e.setRenderTargetFramebuffer(v,d.framebuffer),e.setRenderTarget(v));let P=!1;I.length!==J.cameras.length&&(J.cameras.length=0,P=!0);for(let C=0;C<I.length;C++){const G=I[C];let z=null;if(d!==null)z=d.getViewport(G);else{const Q=u.getViewSubImage(f,G);z=Q.viewport,C===0&&(e.setRenderTargetTextures(v,Q.colorTexture,Q.depthStencilTexture),e.setRenderTarget(v))}let K=O[C];K===void 0&&(K=new en,K.layers.enable(C),K.viewport=new pt,O[C]=K),K.matrix.fromArray(G.transform.matrix),K.matrix.decompose(K.position,K.quaternion,K.scale),K.projectionMatrix.fromArray(G.projectionMatrix),K.projectionMatrixInverse.copy(K.projectionMatrix).invert(),K.viewport.set(z.x,z.y,z.width,z.height),C===0&&(J.matrix.copy(K.matrix),J.matrix.decompose(J.position,J.quaternion,J.scale)),P===!0&&J.cameras.push(K)}const B=r.enabledFeatures;if(B&&B.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&_){u=i.getBinding();const C=u.getDepthInformation(I[0]);C&&C.isValid&&C.texture&&m.init(C,r.renderState)}if(B&&B.includes("camera-access")&&_){e.state.unbindTexture(),u=i.getBinding();for(let C=0;C<I.length;C++){const G=I[C].camera;if(G){let z=p[G];z||(z=new Lc,p[G]=z);const K=u.getCameraImage(G);z.sourceTexture=K}}}}for(let I=0;I<S.length;I++){const P=E[I],B=S[I];P!==null&&B!==void 0&&B.update(P,D,c||a)}_e&&_e(F,D),D.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:D}),g=null}const ke=new rh;ke.setAnimationLoop(Se),this.setAnimationLoop=function(F){_e=F},this.dispose=function(){}}}const uv=new ft,Dh=new qe;Dh.set(-1,0,0,0,1,0,0,0,1);function dv(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,Zc(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,b,w,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),u(m,p)):p.isMeshPhongMaterial?(s(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),f(m,p),p.isMeshPhysicalMaterial&&d(m,p,v)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),_(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,b,w):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ht&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ht&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const b=e.get(p),w=b.envMap,v=b.envMapRotation;w&&(m.envMap.value=w,m.envMapRotation.value.setFromMatrix4(uv.makeRotationFromEuler(v)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Dh),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,b,w){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=w*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function u(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function f(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ht&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function _(m,p){const b=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function pv(n,e,t,i){let r={},s={},a=[];const o=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,S){const E=S.program;i.uniformBlockBinding(v,E)}function c(v,S){let E=r[v.id];E===void 0&&(m(v),E=h(v),r[v.id]=E,v.addEventListener("dispose",b));const R=S.program;i.updateUBOMapping(v,R);const x=e.render.frame;s[v.id]!==x&&(f(v),s[v.id]=x)}function h(v){const S=u();v.__bindingPointIndex=S;const E=n.createBuffer(),R=v.__size,x=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,E),n.bufferData(n.UNIFORM_BUFFER,R,x),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,S,E),E}function u(){for(let v=0;v<o;v++)if(a.indexOf(v)===-1)return a.push(v),v;return st("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(v){const S=r[v.id],E=v.uniforms,R=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,S);for(let x=0,A=E.length;x<A;x++){const N=E[x];if(Array.isArray(N))for(let H=0,O=N.length;H<O;H++)d(N[H],x,H,R);else d(N,x,0,R)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function d(v,S,E,R){if(_(v,S,E,R)===!0){const x=v.__offset,A=v.value;if(Array.isArray(A)){let N=0;for(let H=0;H<A.length;H++){const O=A[H],J=p(O);g(O,v.__data,N),typeof O!="number"&&typeof O!="boolean"&&!O.isMatrix3&&!ArrayBuffer.isView(O)&&(N+=J.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(A,v.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,x,v.__data)}}function g(v,S,E){typeof v=="number"||typeof v=="boolean"?S[0]=v:v.isMatrix3?(S[0]=v.elements[0],S[1]=v.elements[1],S[2]=v.elements[2],S[3]=0,S[4]=v.elements[3],S[5]=v.elements[4],S[6]=v.elements[5],S[7]=0,S[8]=v.elements[6],S[9]=v.elements[7],S[10]=v.elements[8],S[11]=0):ArrayBuffer.isView(v)?S.set(new v.constructor(v.buffer,v.byteOffset,S.length)):v.toArray(S,E)}function _(v,S,E,R){const x=v.value,A=S+"_"+E;if(R[A]===void 0)return typeof x=="number"||typeof x=="boolean"?R[A]=x:ArrayBuffer.isView(x)?R[A]=x.slice():R[A]=x.clone(),!0;{const N=R[A];if(typeof x=="number"||typeof x=="boolean"){if(N!==x)return R[A]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(N.equals(x)===!1)return N.copy(x),!0}}return!1}function m(v){const S=v.uniforms;let E=0;const R=16;for(let A=0,N=S.length;A<N;A++){const H=Array.isArray(S[A])?S[A]:[S[A]];for(let O=0,J=H.length;O<J;O++){const k=H[O],W=Array.isArray(k.value)?k.value:[k.value];for(let ee=0,$=W.length;ee<$;ee++){const Z=W[ee],ie=p(Z),re=E%R,ce=re%ie.boundary,Re=re+ce;E+=ce,Re!==0&&R-Re<ie.storage&&(E+=R-Re),k.__data=new Float32Array(ie.storage/Float32Array.BYTES_PER_ELEMENT),k.__offset=E,E+=ie.storage}}}const x=E%R;return x>0&&(E+=R-x),v.__size=E,v.__cache={},this}function p(v){const S={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(S.boundary=4,S.storage=4):v.isVector2?(S.boundary=8,S.storage=8):v.isVector3||v.isColor?(S.boundary=16,S.storage=12):v.isVector4?(S.boundary=16,S.storage=16):v.isMatrix3?(S.boundary=48,S.storage=48):v.isMatrix4?(S.boundary=64,S.storage=64):v.isTexture?Ke("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(S.boundary=16,S.storage=v.byteLength):Ke("WebGLRenderer: Unsupported uniform value type.",v),S}function b(v){const S=v.target;S.removeEventListener("dispose",b);const E=a.indexOf(S.__bindingPointIndex);a.splice(E,1),n.deleteBuffer(r[S.id]),delete r[S.id],delete s[S.id]}function w(){for(const v in r)n.deleteBuffer(r[v]);a=[],r={},s={}}return{bind:l,update:c,dispose:w}}const mv=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Cn=null;function gv(){return Cn===null&&(Cn=new Lo(mv,16,16,ci,Ut),Cn.name="DFG_LUT",Cn.minFilter=Pt,Cn.magFilter=Pt,Cn.wrapS=bn,Cn.wrapT=bn,Cn.generateMipmaps=!1,Cn.needsUpdate=!0),Cn}class vv{constructor(e={}){const{canvas:t=vu(),context:i=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:f=!1,outputBufferType:d=Kt}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=a;const _=d,m=new Set([Ra,Aa,Ta]),p=new Set([Kt,wn,dr,pr,wa,Ea]),b=new Uint32Array(4),w=new Int32Array(4),v=new U;let S=null,E=null;const R=[],x=[];let A=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Sn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const N=this;let H=!1,O=null,J=null,k=null,W=null;this._outputColorSpace=Yt;let ee=0,$=0,Z=null,ie=-1,re=null;const ce=new pt,Re=new pt;let xe=null;const _e=new Ye(0);let Se=0,ke=t.width,F=t.height,D=1,I=null,P=null;const B=new pt(0,0,ke,F),se=new pt(0,0,ke,F);let me=!1;const C=new Cc;let G=!1,z=!1;const K=new ft,Q=new U,he=new pt,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let pe=!1;function Y(){return Z===null?D:1}let M=i;function Pe(T,V){return t.getContext(T,V)}let Oe,L,y,q,j,le,ye,Me,fe,ue,be,He,Ee,we,We,Ze,Je,X,Te,de,Ae,De,ve;try{const T={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${ua}`),t.addEventListener("webglcontextlost",gt,!1),t.addEventListener("webglcontextrestored",lt,!1),t.addEventListener("webglcontextcreationerror",yn,!1),M===null){const V="webgl2";if(M=Pe(V,T),M===null)throw Pe(V)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Xe()}catch(T){throw t.removeEventListener("webglcontextlost",gt,!1),t.removeEventListener("webglcontextrestored",lt,!1),t.removeEventListener("webglcontextcreationerror",yn,!1),st("WebGLRenderer: "+T.message),T}function Xe(){Oe=new gm(M),Oe.init(),Ae=new ov(M,Oe),L=new am(M,Oe,e,Ae),y=new sv(M,Oe),L.reversedDepthBuffer&&f&&y.buffers.depth.setReversed(!0),J=M.createFramebuffer(),k=M.createFramebuffer(),W=M.createFramebuffer(),q=new _m(M),j=new Xg,le=new av(M,Oe,y,j,L,Ae,q),ye=new mm(N),Me=new tp(M),De=new rm(M,Me),fe=new vm(M,Me,q,De),ue=new Mm(M,fe,Me,De,q),X=new ym(M,L,le),We=new om(j),be=new Wg(N,ye,Oe,L,De,We),He=new dv(N,j),Ee=new Yg,we=new jg(Oe),Je=new im(N,ye,y,ue,g,l),Ze=new rv(N,ue,L),ve=new pv(M,q,L,y),Te=new sm(M,Oe,q),de=new xm(M,Oe,q),q.programs=be.programs,N.capabilities=L,N.extensions=Oe,N.properties=j,N.renderLists=Ee,N.shadowMap=Ze,N.state=y,N.info=q}_!==Kt&&(A=new bm(_,t.width,t.height,o,r,s));const Ge=new fv(N,M);this.xr=Ge,this.getContext=function(){return M},this.getContextAttributes=function(){return M.getContextAttributes()},this.forceContextLoss=function(){const T=Oe.get("WEBGL_lose_context");T&&T.loseContext()},this.forceContextRestore=function(){const T=Oe.get("WEBGL_lose_context");T&&T.restoreContext()},this.getPixelRatio=function(){return D},this.setPixelRatio=function(T){T!==void 0&&(D=T,this.setSize(ke,F,!1))},this.getSize=function(T){return T.set(ke,F)},this.setSize=function(T,V,oe=!0){if(Ge.isPresenting){Ke("WebGLRenderer: Can't change size while VR device is presenting.");return}ke=T,F=V,t.width=Math.floor(T*D),t.height=Math.floor(V*D),oe===!0&&(t.style.width=T+"px",t.style.height=V+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,T,V)},this.getDrawingBufferSize=function(T){return T.set(ke*D,F*D).floor()},this.setDrawingBufferSize=function(T,V,oe){ke=T,F=V,D=oe,t.width=Math.floor(T*oe),t.height=Math.floor(V*oe),this.setViewport(0,0,T,V)},this.setEffects=function(T){if(_===Kt){st("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(T){for(let V=0;V<T.length;V++)if(T[V].isOutputPass===!0){Ke("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(T||[])},this.getCurrentViewport=function(T){return T.copy(ce)},this.getViewport=function(T){return T.copy(B)},this.setViewport=function(T,V,oe,te){T.isVector4?B.set(T.x,T.y,T.z,T.w):B.set(T,V,oe,te),y.viewport(ce.copy(B).multiplyScalar(D).round())},this.getScissor=function(T){return T.copy(se)},this.setScissor=function(T,V,oe,te){T.isVector4?se.set(T.x,T.y,T.z,T.w):se.set(T,V,oe,te),y.scissor(Re.copy(se).multiplyScalar(D).round())},this.getScissorTest=function(){return me},this.setScissorTest=function(T){y.setScissorTest(me=T)},this.setOpaqueSort=function(T){I=T},this.setTransparentSort=function(T){P=T},this.getClearColor=function(T){return T.copy(Je.getClearColor())},this.setClearColor=function(){Je.setClearColor(...arguments)},this.getClearAlpha=function(){return Je.getClearAlpha()},this.setClearAlpha=function(){Je.setClearAlpha(...arguments)},this.clear=function(T=!0,V=!0,oe=!0){let te=0;if(T){let ne=!1;if(Z!==null){const Ie=Z.texture.format;ne=m.has(Ie)}if(ne){const Ie=Z.texture.type,Ue=p.has(Ie),Le=Je.getClearColor(),ze=Je.getClearAlpha(),Ve=Le.r,je=Le.g,nt=Le.b;Ue?(b[0]=Ve,b[1]=je,b[2]=nt,b[3]=ze,M.clearBufferuiv(M.COLOR,0,b)):(w[0]=Ve,w[1]=je,w[2]=nt,w[3]=ze,M.clearBufferiv(M.COLOR,0,w))}else te|=M.COLOR_BUFFER_BIT}V&&(te|=M.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),oe&&(te|=M.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),te!==0&&M.clear(te)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(T){T.setRenderer(this),O=T},this.dispose=function(){t.removeEventListener("webglcontextlost",gt,!1),t.removeEventListener("webglcontextrestored",lt,!1),t.removeEventListener("webglcontextcreationerror",yn,!1),Je.dispose(),Ee.dispose(),we.dispose(),j.dispose(),ye.dispose(),ue.dispose(),De.dispose(),ve.dispose(),be.dispose(),Ge.dispose(),Ge.removeEventListener("sessionstart",Ef),Ge.removeEventListener("sessionend",Tf),Ci.stop()};function gt(T){T.preventDefault(),sc("WebGLRenderer: Context Lost."),H=!0}function lt(){sc("WebGLRenderer: Context Restored."),H=!1;const T=q.autoReset,V=Ze.enabled,oe=Ze.autoUpdate,te=Ze.needsUpdate,ne=Ze.type;Xe(),q.autoReset=T,Ze.enabled=V,Ze.autoUpdate=oe,Ze.needsUpdate=te,Ze.type=ne}function yn(T){st("WebGLRenderer: A WebGL context could not be created. Reason: ",T.statusMessage)}function In(T){const V=T.target;V.removeEventListener("dispose",In),Z_(V)}function Z_(T){K_(T),j.remove(T)}function K_(T){const V=j.get(T).programs;V!==void 0&&(V.forEach(function(oe){be.releaseProgram(oe)}),T.isShaderMaterial&&be.releaseShaderCache(T))}this.renderBufferDirect=function(T,V,oe,te,ne,Ie){V===null&&(V=ge);const Ue=ne.isMesh&&ne.matrixWorld.determinantAffine()<0,Le=Q_(T,V,oe,te,ne);y.setMaterial(te,Ue);let ze=oe.index,Ve=1;if(te.wireframe===!0){if(ze=fe.getWireframeAttribute(oe),ze===void 0)return;Ve=2}const je=oe.drawRange,nt=oe.attributes.position;let Be=je.start*Ve,ct=(je.start+je.count)*Ve;Ie!==null&&(Be=Math.max(Be,Ie.start*Ve),ct=Math.min(ct,(Ie.start+Ie.count)*Ve)),ze!==null?(Be=Math.max(Be,0),ct=Math.min(ct,ze.count)):nt!=null&&(Be=Math.max(Be,0),ct=Math.min(ct,nt.count));const Tt=ct-Be;if(Tt<0||Tt===1/0)return;De.setup(ne,te,Le,oe,ze);let xt,dt=Te;if(ze!==null&&(xt=Me.get(ze),dt=de,dt.setIndex(xt)),ne.isMesh)te.wireframe===!0?(y.setLineWidth(te.wireframeLinewidth*Y()),dt.setMode(M.LINES)):dt.setMode(M.TRIANGLES);else if(ne.isLine){let kt=te.linewidth;kt===void 0&&(kt=1),y.setLineWidth(kt*Y()),ne.isLineSegments?dt.setMode(M.LINES):ne.isLineLoop?dt.setMode(M.LINE_LOOP):dt.setMode(M.LINE_STRIP)}else ne.isPoints?dt.setMode(M.POINTS):ne.isSprite&&dt.setMode(M.TRIANGLES);if(ne.isBatchedMesh)if(Oe.get("WEBGL_multi_draw"))dt.renderMultiDraw(ne._multiDrawStarts,ne._multiDrawCounts,ne._multiDrawCount);else{const kt=ne._multiDrawStarts,Ne=ne._multiDrawCounts,Xt=ne._multiDrawCount,at=ze?Me.get(ze).bytesPerElement:1,cn=j.get(te).currentProgram.getUniforms();for(let Dn=0;Dn<Xt;Dn++)cn.setValue(M,"_gl_DrawID",Dn),dt.render(kt[Dn]/at,Ne[Dn])}else if(ne.isInstancedMesh)dt.renderInstances(Be,Tt,ne.count);else if(oe.isInstancedBufferGeometry){const kt=oe._maxInstanceCount!==void 0?oe._maxInstanceCount:1/0,Ne=Math.min(oe.instanceCount,kt);dt.renderInstances(Be,Tt,Ne)}else dt.render(Be,Tt)};function wf(T,V,oe,te){O!==null&&T.isNodeMaterial&&O.setObject(te,T),G===!0&&We.setState(T,oe,!1),T.transparent===!0&&T.side===rn&&T.forceSinglePass===!1?(T.side=Ht,T.needsUpdate=!0,fa(T,V,te),T.side=ai,T.needsUpdate=!0,fa(T,V,te),T.side=rn):fa(T,V,te)}this.compile=function(T,V,oe=null){oe===null&&(oe=T),O!==null&&O.renderStart(T,V,oe),E=we.get(oe),E.init(V),x.push(E),oe.traverseVisible(function(ne){ne.isLight&&ne.layers.test(V.layers)&&(E.pushLight(ne),ne.castShadow&&E.pushShadow(ne))}),T!==oe&&T.traverseVisible(function(ne){ne.isLight&&ne.layers.test(V.layers)&&(E.pushLight(ne),ne.castShadow&&E.pushShadow(ne))}),E.setupLights(),O!==null&&O.updateLights(E.state.lightsArray),z=this.localClippingEnabled,G=We.init(this.clippingPlanes,z),G===!0&&We.setGlobalState(this.clippingPlanes,V),O!==null&&Ze.render(E.state.shadowsArray,oe,V);const te=new Set;return T.traverse(function(ne){if(!(ne.isMesh||ne.isPoints||ne.isLine||ne.isSprite))return;const Ie=ne.material;if(Ie)if(Array.isArray(Ie))for(let Ue=0;Ue<Ie.length;Ue++){const Le=Ie[Ue];wf(Le,oe,V,ne),te.add(Le)}else wf(Ie,oe,V,ne),te.add(Ie)}),E=x.pop(),O!==null&&O.renderEnd(),te},this.compileAsync=function(T,V,oe=null){const te=this.compile(T,V,oe);return new Promise(ne=>{function Ie(){if(te.forEach(function(Ue){const ze=j.get(Ue).currentProgram;(ze===void 0||ze.isReady())&&te.delete(Ue)}),te.size===0){ne(T);return}setTimeout(Ie,10)}Oe.get("KHR_parallel_shader_compile")!==null?Ie():setTimeout(Ie,10)})};let Dl=null;function $_(T){Dl&&Dl(T)}function Ef(){Ci.stop()}function Tf(){Ci.start()}const Ci=new rh;Ci.setAnimationLoop($_),typeof self<"u"&&Ci.setContext(self),this.setAnimationLoop=function(T){Dl=T,Ge.setAnimationLoop(T),T===null?Ci.stop():Ci.start()},Ge.addEventListener("sessionstart",Ef),Ge.addEventListener("sessionend",Tf),this.render=function(T,V){if(V!==void 0&&V.isCamera!==!0){st("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(H===!0)return;O!==null&&O.renderStart(T,V);const oe=Ge.enabled===!0&&Ge.isPresenting===!0,te=A!==null&&(Z===null||oe)&&A.begin(N,Z);if(T.matrixWorldAutoUpdate===!0&&T.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),Ge.enabled===!0&&Ge.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(Ge.cameraAutoUpdate===!0&&Ge.updateCamera(V),V=Ge.getCamera()),T.isScene===!0&&T.onBeforeRender(N,T,V,Z),E=we.get(T,x.length),E.init(V),E.state.textureUnits=le.getTextureUnits(),x.push(E),K.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),C.setFromProjectionMatrix(K,En,V.reversedDepth),z=this.localClippingEnabled,G=We.init(this.clippingPlanes,z),S=Ee.get(T,R.length),S.init(),R.push(S),Ge.enabled===!0&&Ge.isPresenting===!0){const Ue=N.xr.getDepthSensingMesh();Ue!==null&&Nl(Ue,V,-1/0,N.sortObjects)}Nl(T,V,0,N.sortObjects),S.finish(),O!==null&&O.updateLights(E.state.lightsArray),N.sortObjects===!0&&S.sort(I,P),pe=Ge.enabled===!1||Ge.isPresenting===!1||Ge.hasDepthSensing()===!1,pe&&Je.addToRenderList(S,T),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),G===!0&&We.beginShadows();const ne=E.state.shadowsArray;if(Ze.render(ne,T,V),G===!0&&We.endShadows(),(te&&A.hasRenderPass())===!1){const Ue=S.opaque,Le=S.transmissive;if(E.setupLights(),V.isArrayCamera){const ze=V.cameras;if(Le.length>0)for(let Ve=0,je=ze.length;Ve<je;Ve++){const nt=ze[Ve];Rf(Ue,Le,T,nt)}pe&&Je.render(T);for(let Ve=0,je=ze.length;Ve<je;Ve++){const nt=ze[Ve];Af(S,T,nt,nt.viewport)}}else Le.length>0&&Rf(Ue,Le,T,V),pe&&Je.render(T),Af(S,T,V)}Z!==null&&$===0&&(le.updateMultisampleRenderTarget(Z),le.updateRenderTargetMipmap(Z)),te&&A.end(N),T.isScene===!0&&T.onAfterRender(N,T,V),De.resetDefaultState(),ie=-1,re=null,x.pop(),x.length>0?(E=x[x.length-1],le.setTextureUnits(E.state.textureUnits),G===!0&&We.setGlobalState(N.clippingPlanes,E.state.camera)):E=null,R.pop(),R.length>0?S=R[R.length-1]:S=null,O!==null&&O.renderEnd()};function Nl(T,V,oe,te){if(T.visible===!1)return;if(T.layers.test(V.layers)){if(T.isGroup)oe=T.renderOrder;else if(T.isLOD)T.autoUpdate===!0&&T.update(V);else if(T.isLightProbeGrid)E.pushLightProbeGrid(T);else if(T.isLight)E.pushLight(T),T.castShadow&&E.pushShadow(T);else if(T.isSprite){if(!T.frustumCulled||T.intersectsFrustum(C)){te&&he.setFromMatrixPosition(T.matrixWorld).applyMatrix4(K);const Ue=ue.update(T),Le=T.material;Le.visible&&S.push(T,Ue,Le,oe,he.z,null,V)}}else if((T.isMesh||T.isLine||T.isPoints)&&(!T.frustumCulled||T.intersectsFrustum(C))){const Ue=ue.update(T),Le=T.material;if(te&&(T.boundingSphere!==void 0?(T.boundingSphere===null&&T.computeBoundingSphere(),he.copy(T.boundingSphere.center)):(Ue.boundingSphere===null&&Ue.computeBoundingSphere(),he.copy(Ue.boundingSphere.center)),he.applyMatrix4(T.matrixWorld).applyMatrix4(K)),Array.isArray(Le)){const ze=Ue.groups;for(let Ve=0,je=ze.length;Ve<je;Ve++){const nt=ze[Ve],Be=Le[nt.materialIndex];Be&&Be.visible&&S.push(T,Ue,Be,oe,he.z,nt,V)}}else Le.visible&&S.push(T,Ue,Le,oe,he.z,null,V)}}const Ie=T.children;for(let Ue=0,Le=Ie.length;Ue<Le;Ue++)Nl(Ie[Ue],V,oe,te)}function Af(T,V,oe,te){const{opaque:ne,transmissive:Ie,transparent:Ue}=T;E.setupLightsView(oe),G===!0&&We.setGlobalState(N.clippingPlanes,oe),te&&y.viewport(ce.copy(te)),ne.length>0&&ha(ne,V,oe),Ie.length>0&&ha(Ie,V,oe),Ue.length>0&&ha(Ue,V,oe),y.buffers.depth.setTest(!0),y.buffers.depth.setMask(!0),y.buffers.color.setMask(!0),y.setPolygonOffset(!1)}function Rf(T,V,oe,te){if((oe.isScene===!0?oe.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[te.id]===void 0){const Be=Oe.has("EXT_color_buffer_half_float")||Oe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[te.id]=new Dt(1,1,{generateMipmaps:!0,type:Be?Ut:Kt,minFilter:Xn,samples:Math.max(4,L.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:it.workingColorSpace})}const Ie=E.state.transmissionRenderTarget[te.id],Ue=te.viewport||ce;Ie.setSize(Ue.z*N.transmissionResolutionScale,Ue.w*N.transmissionResolutionScale);const Le=N.getRenderTarget(),ze=N.getActiveCubeFace(),Ve=N.getActiveMipmapLevel();N.setRenderTarget(Ie),N.getClearColor(_e),Se=N.getClearAlpha(),Se<1&&N.setClearColor(16777215,.5),N.clear(),pe&&Je.render(oe);const je=N.toneMapping;N.toneMapping=Sn;const nt=te.viewport;if(te.viewport!==void 0&&(te.viewport=void 0),E.setupLightsView(te),G===!0&&We.setGlobalState(N.clippingPlanes,te),ha(T,oe,te),le.updateMultisampleRenderTarget(Ie),le.updateRenderTargetMipmap(Ie),Oe.has("WEBGL_multisampled_render_to_texture")===!1){let Be=!1;for(let ct=0,Tt=V.length;ct<Tt;ct++){const xt=V[ct],{object:dt,geometry:kt,material:Ne,group:Xt}=xt;if(Ne.side===rn&&dt.layers.test(te.layers)){const at=Ne.side;Ne.side=Ht,Ne.needsUpdate=!0,Cf(dt,oe,te,kt,Ne,Xt),Ne.side=at,Ne.needsUpdate=!0,Be=!0}}Be===!0&&(le.updateMultisampleRenderTarget(Ie),le.updateRenderTargetMipmap(Ie))}N.setRenderTarget(Le,ze,Ve),N.setClearColor(_e,Se),nt!==void 0&&(te.viewport=nt),N.toneMapping=je}function ha(T,V,oe){const te=V.isScene===!0?V.overrideMaterial:null;for(let ne=0,Ie=T.length;ne<Ie;ne++){const Ue=T[ne],{object:Le,geometry:ze,group:Ve}=Ue;let je=Ue.material;je.allowOverride===!0&&te!==null&&(je=te),Le.layers.test(oe.layers)&&Cf(Le,V,oe,ze,je,Ve)}}function Cf(T,V,oe,te,ne,Ie){O!==null&&ne.isNodeMaterial&&O.setObject(T,ne),T.onBeforeRender(N,V,oe,te,ne,Ie),T.modelViewMatrix.multiplyMatrices(oe.matrixWorldInverse,T.matrixWorld),T.normalMatrix.getNormalMatrix(T.modelViewMatrix),ne.onBeforeRender(N,V,oe,te,T,Ie),ne.transparent===!0&&ne.side===rn&&ne.forceSinglePass===!1?(ne.side=Ht,ne.needsUpdate=!0,N.renderBufferDirect(oe,V,te,ne,T,Ie),ne.side=ai,ne.needsUpdate=!0,N.renderBufferDirect(oe,V,te,ne,T,Ie),ne.side=rn):N.renderBufferDirect(oe,V,te,ne,T,Ie),T.onAfterRender(N,V,oe,te,ne,Ie)}function fa(T,V,oe){V.isScene!==!0&&(V=ge);const te=j.get(T),ne=E.state.lights,Ie=E.state.shadowsArray,Ue=ne.state.version,Le=be.getParameters(T,ne.state,Ie,V,oe,E.state.lightProbeGridArray),ze=be.getProgramCacheKey(Le);let Ve=te.programs;te.environment=T.isMeshStandardMaterial||T.isMeshLambertMaterial||T.isMeshPhongMaterial?V.environment:null,te.fog=V.fog;const je=T.isMeshStandardMaterial||T.isMeshLambertMaterial&&!T.envMap||T.isMeshPhongMaterial&&!T.envMap;te.envMap=ye.get(T.envMap||te.environment,je),te.envMapRotation=te.environment!==null&&T.envMap===null?V.environmentRotation:T.envMapRotation,Ve===void 0&&(T.addEventListener("dispose",In),Ve=new Map,te.programs=Ve);let nt=Ve.get(ze);if(nt!==void 0){if(te.currentProgram===nt&&te.lightsStateVersion===Ue)return Lf(T,Le),nt}else Le.uniforms=be.getUniforms(T),O!==null&&T.isNodeMaterial&&O.build(T,oe,Le),T.onBeforeCompile(Le,N),nt=be.acquireProgram(Le,ze),Ve.set(ze,nt),te.uniforms=Le.uniforms;const Be=te.uniforms;return(!T.isShaderMaterial&&!T.isRawShaderMaterial||T.clipping===!0)&&(Be.clippingPlanes=We.uniform),Lf(T,Le),te.needsLights=e1(T),te.lightsStateVersion=Ue,te.needsLights&&(Be.ambientLightColor.value=ne.state.ambient,Be.lightProbe.value=ne.state.probe,Be.sunLights.value=ne.state.sun,Be.sunLightShadows.value=ne.state.sunShadow,Be.directionalLights.value=ne.state.directional,Be.directionalLightShadows.value=ne.state.directionalShadow,Be.spotLights.value=ne.state.spot,Be.spotLightShadows.value=ne.state.spotShadow,Be.rectAreaLights.value=ne.state.rectArea,Be.ltc_1.value=ne.state.rectAreaLTC1,Be.ltc_2.value=ne.state.rectAreaLTC2,Be.pointLights.value=ne.state.point,Be.pointLightShadows.value=ne.state.pointShadow,Be.hemisphereLights.value=ne.state.hemi,Be.sunShadowMatrix.value=ne.state.sunShadowMatrix,Be.sunShadowCascade.value=ne.state.sunShadowCascade,Be.directionalShadowMatrix.value=ne.state.directionalShadowMatrix,Be.spotLightMatrix.value=ne.state.spotLightMatrix,Be.spotLightMap.value=ne.state.spotLightMap,Be.pointShadowMatrix.value=ne.state.pointShadowMatrix),te.lightProbeGrid=E.state.lightProbeGridArray.length>0,te.currentProgram=nt,te.uniformsList=null,nt}function Pf(T){if(T.uniformsList===null){const V=T.currentProgram.getUniforms();T.uniformsList=Hs.seqWithValue(V.seq,T.uniforms)}return T.uniformsList}function Lf(T,V){const oe=j.get(T);oe.outputColorSpace=V.outputColorSpace,oe.batching=V.batching,oe.batchingColor=V.batchingColor,oe.instancing=V.instancing,oe.instancingColor=V.instancingColor,oe.instancingMorph=V.instancingMorph,oe.skinning=V.skinning,oe.morphTargets=V.morphTargets,oe.morphNormals=V.morphNormals,oe.morphColors=V.morphColors,oe.morphTargetsCount=V.morphTargetsCount,oe.numClippingPlanes=V.numClippingPlanes,oe.numIntersection=V.numClipIntersection,oe.vertexAlphas=V.vertexAlphas,oe.vertexTangents=V.vertexTangents,oe.toneMapping=V.toneMapping}function J_(T,V){if(T.length===0)return null;if(T.length===1)return T[0].texture!==null?T[0]:null;v.setFromMatrixPosition(V.matrixWorld);for(let oe=0,te=T.length;oe<te;oe++){const ne=T[oe];if(ne.texture!==null&&ne.boundingBox.containsPoint(v))return ne}return null}function Q_(T,V,oe,te,ne){V.isScene!==!0&&(V=ge),le.resetTextureUnits();const Ie=V.fog,Ue=te.isMeshStandardMaterial||te.isMeshLambertMaterial||te.isMeshPhongMaterial?V.environment:null,Le=Z===null?N.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:it.workingColorSpace,ze=te.isMeshStandardMaterial||te.isMeshLambertMaterial&&!te.envMap||te.isMeshPhongMaterial&&!te.envMap,Ve=ye.get(te.envMap||Ue,ze),je=te.vertexColors===!0&&!!oe.attributes.color&&oe.attributes.color.itemSize===4,nt=!!oe.attributes.tangent&&(!!te.normalMap||te.anisotropy>0),Be=!!oe.morphAttributes.position,ct=!!oe.morphAttributes.normal,Tt=!!oe.morphAttributes.color;let xt=Sn;te.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(xt=N.toneMapping);const dt=oe.morphAttributes.position||oe.morphAttributes.normal||oe.morphAttributes.color,kt=dt!==void 0?dt.length:0,Ne=j.get(te),Xt=E.state.lights;if(G===!0&&(z===!0||T!==re)){const vt=T===re&&te.id===ie;We.setState(te,T,vt)}let at=!1;te.version===Ne.__version?(Ne.needsLights&&Ne.lightsStateVersion!==Xt.state.version||Ne.outputColorSpace!==Le||ne.isBatchedMesh&&Ne.batching===!1||!ne.isBatchedMesh&&Ne.batching===!0||ne.isBatchedMesh&&Ne.batchingColor===!0&&ne._colorsTexture===null||ne.isBatchedMesh&&Ne.batchingColor===!1&&ne._colorsTexture!==null||ne.isInstancedMesh&&Ne.instancing===!1||!ne.isInstancedMesh&&Ne.instancing===!0||ne.isSkinnedMesh&&Ne.skinning===!1||!ne.isSkinnedMesh&&Ne.skinning===!0||ne.isInstancedMesh&&Ne.instancingColor===!0&&ne.instanceColor===null||ne.isInstancedMesh&&Ne.instancingColor===!1&&ne.instanceColor!==null||ne.isInstancedMesh&&Ne.instancingMorph===!0&&ne.morphTexture===null||ne.isInstancedMesh&&Ne.instancingMorph===!1&&ne.morphTexture!==null||Ne.envMap!==Ve||te.fog===!0&&Ne.fog!==Ie||Ne.numClippingPlanes!==void 0&&(Ne.numClippingPlanes!==We.numPlanes||Ne.numIntersection!==We.numIntersection)||Ne.vertexAlphas!==je||Ne.vertexTangents!==nt||Ne.morphTargets!==Be||Ne.morphNormals!==ct||Ne.morphColors!==Tt||Ne.toneMapping!==xt||Ne.morphTargetsCount!==kt||!!Ne.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(at=!0):(at=!0,Ne.__version=te.version);let cn=Ne.currentProgram;at===!0&&(cn=fa(te,V,ne),O&&te.isNodeMaterial&&O.onUpdateProgram(te,cn,Ne));let Dn=!1,ii=!1,or=!1;const ut=cn.getUniforms(),wt=Ne.uniforms;if(y.useProgram(cn.program)&&(Dn=!0,ii=!0,or=!0),te.id!==ie&&(ie=te.id,ii=!0),Ne.needsLights){const vt=J_(E.state.lightProbeGridArray,ne);Ne.lightProbeGrid!==vt&&(Ne.lightProbeGrid=vt,ii=!0)}if(Dn||re!==T){y.buffers.depth.getReversed()&&T.reversedDepth!==!0&&(T._reversedDepth=!0,T.updateProjectionMatrix()),ut.setValue(M,"projectionMatrix",T.projectionMatrix),ut.setValue(M,"viewMatrix",T.matrixWorldInverse);const si=ut.map.cameraPosition;si!==void 0&&si.setValue(M,Q.setFromMatrixPosition(T.matrixWorld)),L.logarithmicDepthBuffer&&ut.setValue(M,"logDepthBufFC",2/(Math.log(T.far+1)/Math.LN2)),(te.isMeshPhongMaterial||te.isMeshToonMaterial||te.isMeshLambertMaterial||te.isMeshBasicMaterial||te.isMeshStandardMaterial||te.isShaderMaterial)&&ut.setValue(M,"isOrthographic",T.isOrthographicCamera===!0),re!==T&&(re=T,ii=!0,or=!0)}if(Ne.needsLights&&(Xt.state.sunShadowMap.length>0&&ut.setValue(M,"sunShadowMap",Xt.state.sunShadowMap,le),Xt.state.directionalShadowMap.length>0&&ut.setValue(M,"directionalShadowMap",Xt.state.directionalShadowMap,le),Xt.state.spotShadowMap.length>0&&ut.setValue(M,"spotShadowMap",Xt.state.spotShadowMap,le),Xt.state.pointShadowMap.length>0&&ut.setValue(M,"pointShadowMap",Xt.state.pointShadowMap,le)),ne.isSkinnedMesh){ut.setOptional(M,ne,"bindMatrix"),ut.setOptional(M,ne,"bindMatrixInverse");const vt=ne.skeleton;vt&&(vt.boneTexture===null&&vt.computeBoneTexture(),ut.setValue(M,"boneTexture",vt.boneTexture,le))}ne.isBatchedMesh&&(ut.setOptional(M,ne,"batchingTexture"),ut.setValue(M,"batchingTexture",ne._matricesTexture,le),ut.setOptional(M,ne,"batchingIdTexture"),ut.setValue(M,"batchingIdTexture",ne._indirectTexture,le),ut.setOptional(M,ne,"batchingColorTexture"),ne._colorsTexture!==null&&ut.setValue(M,"batchingColorTexture",ne._colorsTexture,le));const ri=oe.morphAttributes;if((ri.position!==void 0||ri.normal!==void 0||ri.color!==void 0)&&X.update(ne,oe,cn),(ii||Ne.receiveShadow!==ne.receiveShadow)&&(Ne.receiveShadow=ne.receiveShadow,ut.setValue(M,"receiveShadow",ne.receiveShadow)),(te.isMeshStandardMaterial||te.isMeshLambertMaterial||te.isMeshPhongMaterial)&&te.envMap===null&&V.environment!==null&&(wt.envMapIntensity.value=V.environmentIntensity),wt.dfgLUT!==void 0&&(wt.dfgLUT.value=gv()),ii){if(ut.setValue(M,"toneMappingExposure",N.toneMappingExposure),Ne.needsLights&&j_(wt,or),Ie&&te.fog===!0&&He.refreshFogUniforms(wt,Ie),He.refreshMaterialUniforms(wt,te,D,F,E.state.transmissionRenderTarget[T.id]),Ne.needsLights&&Ne.lightProbeGrid){const vt=Ne.lightProbeGrid;wt.probesSH.value=vt.texture,wt.probesMin.value.copy(vt.boundingBox.min),wt.probesMax.value.copy(vt.boundingBox.max),wt.probesResolution.value.copy(vt.resolution)}Hs.upload(M,Pf(Ne),wt,le)}if(te.isShaderMaterial&&te.uniformsNeedUpdate===!0&&(Hs.upload(M,Pf(Ne),wt,le),te.uniformsNeedUpdate=!1),te.isSpriteMaterial&&ut.setValue(M,"center",ne.center),ut.setValue(M,"modelViewMatrix",ne.modelViewMatrix),ut.setValue(M,"normalMatrix",ne.normalMatrix),ut.setValue(M,"modelMatrix",ne.matrixWorld),te.uniformsGroups!==void 0){const vt=te.uniformsGroups;for(let si=0,lr=vt.length;si<lr;si++){const Df=vt[si];ve.update(Df,cn),ve.bind(Df,cn)}}return cn}function j_(T,V){T.ambientLightColor.needsUpdate=V,T.lightProbe.needsUpdate=V,T.sunLights.needsUpdate=V,T.sunLightShadows.needsUpdate=V,T.directionalLights.needsUpdate=V,T.directionalLightShadows.needsUpdate=V,T.pointLights.needsUpdate=V,T.pointLightShadows.needsUpdate=V,T.spotLights.needsUpdate=V,T.spotLightShadows.needsUpdate=V,T.rectAreaLights.needsUpdate=V,T.hemisphereLights.needsUpdate=V}function e1(T){return T.isMeshLambertMaterial||T.isMeshToonMaterial||T.isMeshPhongMaterial||T.isMeshStandardMaterial||T.isShadowMaterial||T.isShaderMaterial&&T.lights===!0}this.getActiveCubeFace=function(){return ee},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(T,V,oe){const te=j.get(T);te.__autoAllocateDepthBuffer=T.resolveDepthBuffer===!1,te.__autoAllocateDepthBuffer===!1&&(te.__useRenderToTexture=!1),j.get(T.texture).__webglTexture=V,j.get(T.depthTexture).__webglTexture=te.__autoAllocateDepthBuffer?void 0:oe,te.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(T,V){const oe=j.get(T);oe.__webglFramebuffer=V,oe.__useDefaultFramebuffer=V===void 0},this.setRenderTarget=function(T,V=0,oe=0){Z=T,ee=V,$=oe;let te=null,ne=!1,Ie=!1;if(T){const Le=j.get(T);if(Le.__useDefaultFramebuffer!==void 0){y.bindFramebuffer(M.FRAMEBUFFER,Le.__webglFramebuffer),ce.copy(T.viewport),Re.copy(T.scissor),xe=T.scissorTest,y.viewport(ce),y.scissor(Re),y.setScissorTest(xe),ie=-1;return}else if(Le.__webglFramebuffer===void 0)le.setupRenderTarget(T);else if(Le.__hasExternalTextures)le.rebindTextures(T,j.get(T.texture).__webglTexture,j.get(T.depthTexture).__webglTexture);else if(T.depthBuffer){const je=T.depthTexture;if(Le.__boundDepthTexture!==je){if(je!==null&&j.has(je)&&(T.width!==je.image.width||T.height!==je.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");le.setupDepthRenderbuffer(T)}}const ze=T.texture;(ze.isData3DTexture||ze.isDataArrayTexture||ze.isCompressedArrayTexture)&&(Ie=!0);const Ve=j.get(T).__webglFramebuffer;T.isWebGLCubeRenderTarget?(Array.isArray(Ve[V])?te=Ve[V][oe]:te=Ve[V],ne=!0):T.samples>0&&le.useMultisampledRTT(T)===!1?te=j.get(T).__webglMultisampledFramebuffer:Array.isArray(Ve)?te=Ve[oe]:te=Ve,ce.copy(T.viewport),Re.copy(T.scissor),xe=T.scissorTest}else ce.copy(B).multiplyScalar(D).floor(),Re.copy(se).multiplyScalar(D).floor(),xe=me;if(oe!==0&&(te=J),y.bindFramebuffer(M.FRAMEBUFFER,te)&&y.drawBuffers(T,te),y.viewport(ce),y.scissor(Re),y.setScissorTest(xe),ne){const Le=j.get(T.texture);M.framebufferTexture2D(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_CUBE_MAP_POSITIVE_X+V,Le.__webglTexture,oe)}else if(Ie){const Le=V;for(let ze=0;ze<T.textures.length;ze++){const Ve=j.get(T.textures[ze]);M.framebufferTextureLayer(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0+ze,Ve.__webglTexture,oe,Le)}}else if(T!==null&&oe!==0){const Le=j.get(T.texture);M.framebufferTexture2D(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,Le.__webglTexture,oe)}ie=-1};function If(T){const V=j.get(T);return(V.__readFormat!==T.format||V.__readType!==T.type)&&(V.__readFormat=T.format,V.__readType=T.type,V.__formatReadable=L.textureFormatReadable(T.format),V.__typeReadable=L.textureTypeReadable(T.type)),V}this.readRenderTargetPixels=function(T,V,oe,te,ne,Ie,Ue,Le=0){if(!(T&&T.isWebGLRenderTarget)){st("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let ze=j.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Ue!==void 0&&(ze=ze[Ue]),ze){y.bindFramebuffer(M.FRAMEBUFFER,ze);try{const Ve=T.textures[Le],je=Ve.format,nt=Ve.type;T.textures.length>1&&M.readBuffer(M.COLOR_ATTACHMENT0+Le);const Be=If(Ve);if(Be.__formatReadable===!1){st("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Be.__typeReadable===!1){st("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=T.width-te&&oe>=0&&oe<=T.height-ne&&M.readPixels(V,oe,te,ne,Ae.convert(je),Ae.convert(nt),Ie)}finally{const Ve=Z!==null?j.get(Z).__webglFramebuffer:null;y.bindFramebuffer(M.FRAMEBUFFER,Ve)}}},this.readRenderTargetPixelsAsync=async function(T,V,oe,te,ne,Ie,Ue,Le=0){if(!(T&&T.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ze=j.get(T).__webglFramebuffer;if(T.isWebGLCubeRenderTarget&&Ue!==void 0&&(ze=ze[Ue]),ze)if(V>=0&&V<=T.width-te&&oe>=0&&oe<=T.height-ne){y.bindFramebuffer(M.FRAMEBUFFER,ze);const Ve=T.textures[Le],je=Ve.format,nt=Ve.type;T.textures.length>1&&M.readBuffer(M.COLOR_ATTACHMENT0+Le);const Be=If(Ve);if(Be.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Be.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ct=M.createBuffer();M.bindBuffer(M.PIXEL_PACK_BUFFER,ct),M.bufferData(M.PIXEL_PACK_BUFFER,Ie.byteLength,M.STREAM_READ),M.readPixels(V,oe,te,ne,Ae.convert(je),Ae.convert(nt),0),M.bindBuffer(M.PIXEL_PACK_BUFFER,null);const Tt=Z!==null?j.get(Z).__webglFramebuffer:null;y.bindFramebuffer(M.FRAMEBUFFER,Tt);const xt=M.fenceSync(M.SYNC_GPU_COMMANDS_COMPLETE,0);return M.flush(),await xu(M,xt,4),M.bindBuffer(M.PIXEL_PACK_BUFFER,ct),M.getBufferSubData(M.PIXEL_PACK_BUFFER,0,Ie),M.bindBuffer(M.PIXEL_PACK_BUFFER,null),M.deleteBuffer(ct),M.deleteSync(xt),Ie}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(T,V=null,oe=0){const te=Math.pow(2,-oe),ne=Math.floor(T.image.width*te),Ie=Math.floor(T.image.height*te),Ue=V!==null?V.x:0,Le=V!==null?V.y:0;le.setTexture2D(T,0),M.copyTexSubImage2D(M.TEXTURE_2D,oe,0,0,Ue,Le,ne,Ie),y.unbindTexture()},this.copyTextureToTexture=function(T,V,oe=null,te=null,ne=0,Ie=0){let Ue,Le,ze,Ve,je,nt,Be,ct,Tt;const xt=T.isCompressedTexture?T.mipmaps[Ie]:T.image;if(oe!==null)Ue=oe.max.x-oe.min.x,Le=oe.max.y-oe.min.y,ze=oe.isBox3?oe.max.z-oe.min.z:1,Ve=oe.min.x,je=oe.min.y,nt=oe.isBox3?oe.min.z:0;else{const wt=Math.pow(2,-ne);Ue=Math.floor(xt.width*wt),Le=Math.floor(xt.height*wt),T.isDataArrayTexture?ze=xt.depth:T.isData3DTexture?ze=Math.floor(xt.depth*wt):ze=1,Ve=0,je=0,nt=0}te!==null?(Be=te.x,ct=te.y,Tt=te.z):(Be=0,ct=0,Tt=0);const dt=Ae.convert(V.format),kt=Ae.convert(V.type);let Ne;V.isData3DTexture?(le.setTexture3D(V,0),Ne=M.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(le.setTexture2DArray(V,0),Ne=M.TEXTURE_2D_ARRAY):(le.setTexture2D(V,0),Ne=M.TEXTURE_2D),y.activeTexture(M.TEXTURE0),y.pixelStorei(M.UNPACK_FLIP_Y_WEBGL,V.flipY),y.pixelStorei(M.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),y.pixelStorei(M.UNPACK_ALIGNMENT,V.unpackAlignment);const Xt=y.getParameter(M.UNPACK_ROW_LENGTH),at=y.getParameter(M.UNPACK_IMAGE_HEIGHT),cn=y.getParameter(M.UNPACK_SKIP_PIXELS),Dn=y.getParameter(M.UNPACK_SKIP_ROWS),ii=y.getParameter(M.UNPACK_SKIP_IMAGES);y.pixelStorei(M.UNPACK_ROW_LENGTH,xt.width),y.pixelStorei(M.UNPACK_IMAGE_HEIGHT,xt.height),y.pixelStorei(M.UNPACK_SKIP_PIXELS,Ve),y.pixelStorei(M.UNPACK_SKIP_ROWS,je),y.pixelStorei(M.UNPACK_SKIP_IMAGES,nt);const or=T.isDataArrayTexture||T.isData3DTexture,ut=V.isDataArrayTexture||V.isData3DTexture;if(T.isDepthTexture){const wt=j.get(T),ri=j.get(V),vt=j.get(wt.__renderTarget),si=j.get(ri.__renderTarget);y.bindFramebuffer(M.READ_FRAMEBUFFER,vt.__webglFramebuffer),y.bindFramebuffer(M.DRAW_FRAMEBUFFER,si.__webglFramebuffer);for(let lr=0;lr<ze;lr++)or&&(M.framebufferTextureLayer(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,j.get(T).__webglTexture,ne,nt+lr),M.framebufferTextureLayer(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,j.get(V).__webglTexture,Ie,Tt+lr)),M.blitFramebuffer(Ve,je,Ue,Le,Be,ct,Ue,Le,M.DEPTH_BUFFER_BIT,M.NEAREST);y.bindFramebuffer(M.READ_FRAMEBUFFER,null),y.bindFramebuffer(M.DRAW_FRAMEBUFFER,null)}else if(ne!==0||T.isRenderTargetTexture||j.has(T)){const wt=j.get(T),ri=j.get(V);y.bindFramebuffer(M.READ_FRAMEBUFFER,k),y.bindFramebuffer(M.DRAW_FRAMEBUFFER,W);for(let vt=0;vt<ze;vt++)or?M.framebufferTextureLayer(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,wt.__webglTexture,ne,nt+vt):M.framebufferTexture2D(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,wt.__webglTexture,ne),ut?M.framebufferTextureLayer(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,ri.__webglTexture,Ie,Tt+vt):M.framebufferTexture2D(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,ri.__webglTexture,Ie),ne!==0?M.blitFramebuffer(Ve,je,Ue,Le,Be,ct,Ue,Le,M.COLOR_BUFFER_BIT,M.NEAREST):ut?M.copyTexSubImage3D(Ne,Ie,Be,ct,Tt+vt,Ve,je,Ue,Le):M.copyTexSubImage2D(Ne,Ie,Be,ct,Ve,je,Ue,Le);y.bindFramebuffer(M.READ_FRAMEBUFFER,null),y.bindFramebuffer(M.DRAW_FRAMEBUFFER,null)}else ut?T.isDataTexture||T.isData3DTexture?M.texSubImage3D(Ne,Ie,Be,ct,Tt,Ue,Le,ze,dt,kt,xt.data):V.isCompressedArrayTexture?M.compressedTexSubImage3D(Ne,Ie,Be,ct,Tt,Ue,Le,ze,dt,xt.data):M.texSubImage3D(Ne,Ie,Be,ct,Tt,Ue,Le,ze,dt,kt,xt):T.isDataTexture?M.texSubImage2D(M.TEXTURE_2D,Ie,Be,ct,Ue,Le,dt,kt,xt.data):T.isCompressedTexture?M.compressedTexSubImage2D(M.TEXTURE_2D,Ie,Be,ct,xt.width,xt.height,dt,xt.data):M.texSubImage2D(M.TEXTURE_2D,Ie,Be,ct,Ue,Le,dt,kt,xt);y.pixelStorei(M.UNPACK_ROW_LENGTH,Xt),y.pixelStorei(M.UNPACK_IMAGE_HEIGHT,at),y.pixelStorei(M.UNPACK_SKIP_PIXELS,cn),y.pixelStorei(M.UNPACK_SKIP_ROWS,Dn),y.pixelStorei(M.UNPACK_SKIP_IMAGES,ii),Ie===0&&V.generateMipmaps&&M.generateMipmap(Ne),y.unbindTexture()},this.initRenderTarget=function(T){j.get(T).__webglFramebuffer===void 0&&le.setupRenderTarget(T)},this.initTexture=function(T){T.isCubeTexture?le.setTextureCube(T,0):T.isData3DTexture?le.setTexture3D(T,0):T.isDataArrayTexture||T.isCompressedArrayTexture?le.setTexture2DArray(T,0):le.setTexture2D(T,0),y.unbindTexture()},this.resetState=function(){ee=0,$=0,Z=null,y.reset(),De.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return En}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=it._getDrawingBufferColorSpace(e),t.unpackColorSpace=it._getUnpackColorSpace()}}class Br extends ot{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this._reflectionCameras=new WeakMap;const i=this,r=t.color!==void 0?new Ye(t.color):new Ye(8355711),s=t.textureWidth||512,a=t.textureHeight||512,o=t.clipBias||0,l=t.shader||Br.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new Gn,u=new U,f=new U,d=new U,g=new ft,_=new U(0,0,-1),m=new pt,p=new U,b=new U,w=new pt,v=new ft,S=new Dt(s,a,{samples:c,type:Ut}),E=new St({name:l.name!==void 0?l.name:"unspecified",uniforms:Ur.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});E.uniforms.tDiffuse.value=S.texture,E.uniforms.color.value=r,E.uniforms.textureMatrix.value=v,this.material=E,this.onBeforeRender=function(R,x,A){const N=this.getReflectionCamera(A);if(f.setFromMatrixPosition(i.matrixWorld),d.setFromMatrixPosition(A.matrixWorld),g.extractRotation(i.matrixWorld),u.set(0,0,1),u.applyMatrix4(g),p.subVectors(f,d),p.dot(u)>0===!0&&this.forceUpdate===!1)return;p.reflect(u).negate(),p.add(f),g.extractRotation(A.matrixWorld),_.set(0,0,-1),_.applyMatrix4(g),_.add(d),b.subVectors(f,_),b.reflect(u).negate(),b.add(f),N.position.copy(p),N.up.set(0,1,0),N.up.applyMatrix4(g),N.up.reflect(u),N.lookAt(b),N.far=A.far,N.updateMatrixWorld(),N.projectionMatrix.copy(A.projectionMatrix),v.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),v.multiply(N.projectionMatrix),v.multiply(N.matrixWorldInverse),v.multiply(i.matrixWorld),h.setFromNormalAndCoplanarPoint(u,f),h.applyMatrix4(N.matrixWorldInverse),m.set(h.normal.x,h.normal.y,h.normal.z,h.constant);const O=N.projectionMatrix;N.isOrthographicCamera?(w.x=(Math.sign(m.x)+O.elements[8])/O.elements[0],w.y=(Math.sign(m.y)+O.elements[9])/O.elements[5],w.z=-A.far,w.w=1):(w.x=(Math.sign(m.x)+O.elements[8])/O.elements[0],w.y=(Math.sign(m.y)+O.elements[9])/O.elements[5],w.z=-1,w.w=(1+O.elements[10])/O.elements[14]),m.multiplyScalar(2/m.dot(w)),O.elements[2]=m.x,O.elements[6]=m.y,N.isOrthographicCamera?(O.elements[10]=m.z-o,O.elements[14]=m.w-1):(O.elements[10]=m.z+1-o,O.elements[14]=m.w),i.visible=!1;const J=R.getRenderTarget(),k=R.xr.enabled,W=R.shadowMap.autoUpdate;R.xr.enabled=!1,R.shadowMap.autoUpdate=!1,R.setRenderTarget(S),R.state.buffers.depth.setMask(!0),R.autoClear===!1&&R.clear(),R.render(x,N),R.xr.enabled=k,R.shadowMap.autoUpdate=W,R.setRenderTarget(J);const ee=A.viewport;ee!==void 0&&R.state.viewport(ee),i.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return S},this.dispose=function(){S.dispose(),i.material.dispose()},this.getReflectionCamera=function(R){let x=this._reflectionCameras.get(R);return x===void 0&&(x=R.clone(),this._reflectionCameras.set(R,x)),x}}}Br.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function Si(n,e=!1){const t=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),r=new Set(Object.keys(n[0].morphAttributes)),s={},a={},o=n[0].morphTargetsRelative,l=new Mt;let c=0;for(let h=0;h<n.length;++h){const u=n[h];let f=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in u.attributes){if(!i.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;s[d]===void 0&&(s[d]=[]),s[d].push(u.attributes[d]),f++}if(f!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in u.morphAttributes){if(!r.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(u.morphAttributes[d])}if(e){let d;if(t)d=u.index.count;else if(u.attributes.position!==void 0)d=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,h),c+=d}}if(t){let h=0;const u=[];for(let f=0;f<n.length;++f){const d=n[f].index;for(let g=0;g<d.count;++g)u.push(d.getX(g)+h);h+=n[f].attributes.position.count}l.setIndex(u)}for(const h in s){const u=Nh(s[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(const h in a){const u=a[h][0].length;if(u!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let f=0;f<u;++f){const d=[];for(let _=0;_<a[h].length;++_)d.push(a[h][_][f]);const g=Nh(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}}return l}function Nh(n){let e,t,i,r=-1,s=0;for(let c=0;c<n.length;++c){const h=n[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=h.normalized),i!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=h.gpuType),r!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*t}const a=new e(s),o=new Zt(a,t,i);let l=0;for(let c=0;c<n.length;++c){const h=n[c];if(h.isInterleavedBufferAttribute){const u=l/t;for(let f=0,d=h.count;f<d;f++)for(let g=0;g<t;g++){const _=h.getComponent(f,g);o.setComponent(f+u,g,_)}}else a.set(h.array,l);l+=h.count*t}return r!==void 0&&(o.gpuType=r),o}function Uh(n,e=1e-4){e=Math.max(e,Number.EPSILON);const t={},i=n.getIndex(),r=n.getAttribute("position"),s=i?i.count:r.count;let a=0;const o=Object.keys(n.attributes),l={},c={},h=[],u=["getX","getY","getZ","getW"],f=["setX","setY","setZ","setW"];for(let b=0,w=o.length;b<w;b++){const v=o[b],S=n.attributes[v];l[v]=new S.constructor(new S.array.constructor(S.count*S.itemSize),S.itemSize,S.normalized);const E=n.morphAttributes[v];E&&(c[v]||(c[v]=[]),E.forEach((R,x)=>{const A=new R.array.constructor(R.count*R.itemSize);c[v][x]=new R.constructor(A,R.itemSize,R.normalized)}))}const d=e*.5,g=Math.log10(1/e),_=Math.pow(10,g),m=d*_;for(let b=0;b<s;b++){const w=i?i.getX(b):b;let v="";for(let S=0,E=o.length;S<E;S++){const R=o[S],x=n.getAttribute(R),A=x.itemSize;for(let N=0;N<A;N++)v+=`${Math.trunc(x[u[N]](w)*_+m)},`}if(v in t)h.push(t[v]);else{for(let S=0,E=o.length;S<E;S++){const R=o[S],x=n.getAttribute(R),A=n.morphAttributes[R],N=x.itemSize,H=l[R],O=c[R];for(let J=0;J<N;J++){const k=u[J],W=f[J];if(H[W](a,x[k](w)),A)for(let ee=0,$=A.length;ee<$;ee++)O[ee][W](a,A[ee][k](w))}}t[v]=a,h.push(a),a++}}const p=n.clone();for(const b in n.attributes){const w=l[b];if(p.setAttribute(b,new w.constructor(w.array.slice(0,a*w.itemSize),w.itemSize,w.normalized)),b in c)for(let v=0;v<c[b].length;v++){const S=c[b][v];p.morphAttributes[b][v]=new S.constructor(S.array.slice(0,a*S.itemSize),S.itemSize,S.normalized)}}return p.setIndex(h),p}function xv(n,e=Math.PI/3){const t=n.index?n.toNonIndexed():n,i=t.attributes.position,r=i.count;let s;if(i.isBufferAttribute===!0&&i.itemSize===3&&i.normalized===!1)s=i.array;else{s=new Float64Array(r*3);for(let v=0;v<r;v++)s[3*v+0]=i.getX(v),s[3*v+1]=i.getY(v),s[3*v+2]=i.getZ(v)}const a=Math.cos(e),o=(1+1e-10)*100,l=r/3,c=new Float64Array(l*3);for(let v=0;v<l;v++){const S=9*v,E=s[S+0],R=s[S+1],x=s[S+2],A=s[S+3],N=s[S+4],H=s[S+5],O=s[S+6],J=s[S+7],k=s[S+8],W=O-A,ee=J-N,$=k-H,Z=E-A,ie=R-N,re=x-H,ce=ee*re-$*ie,Re=$*Z-W*re,xe=W*ie-ee*Z,_e=1/(Math.sqrt(ce*ce+Re*Re+xe*xe)||1);c[3*v+0]=ce*_e,c[3*v+1]=Re*_e,c[3*v+2]=xe*_e}const h=new Int32Array(r),u=new Float64Array(r*3);let f=1;for(;f<r*2;)f<<=1;const d=f-1,g=new Int32Array(f);let _=0;for(let v=0;v<r;v++){const S=3*v,E=Math.trunc(s[S+0]*o),R=Math.trunc(s[S+1]*o),x=Math.trunc(s[S+2]*o);let A=(Math.imul(E,73856093)^Math.imul(R,19349663)^Math.imul(x,83492791))&d;for(;;){const N=g[A];if(N===0){const O=3*_;u[O+0]=E,u[O+1]=R,u[O+2]=x,g[A]=_+1,h[v]=_++;break}const H=3*(N-1);if(u[H+0]===E&&u[H+1]===R&&u[H+2]===x){h[v]=N-1;break}A=A+1&d}}const m=new Int32Array(_+1);for(let v=0;v<r;v++)m[h[v]+1]++;for(let v=0;v<_;v++)m[v+1]+=m[v];const p=new Int32Array(r),b=m.slice(0,_);for(let v=0;v<l;v++){const S=3*v;p[b[h[S+0]]++]=v,p[b[h[S+1]]++]=v,p[b[h[S+2]]++]=v}const w=new Float32Array(r*3);for(let v=0;v<l;v++){const S=3*v,E=c[S+0],R=c[S+1],x=c[S+2];for(let A=0;A<3;A++){const N=S+A,H=h[N];let O=0,J=0,k=0;for(let ee=m[H],$=m[H+1];ee<$;ee++){const Z=3*p[ee],ie=c[Z+0],re=c[Z+1],ce=c[Z+2];E*ie+R*re+x*ce>a&&(O+=ie,J+=re,k+=ce)}const W=1/(Math.sqrt(O*O+J*J+k*k)||1);w[3*N+0]=O*W,w[3*N+1]=J*W,w[3*N+2]=k*W}}return t.setAttribute("normal",new Zt(w,3,!1)),t}const Bt={glass:0,panel:1,ribbon:2,hero:3},Nt={none:0,redCorners:1,cyanCorners:2,crownBand:3,floorLines:4,fins:5},tn={box:0,round:1},Pn={spinner:0,hauler:1},jo=18,Fh=8,el={facades:5,airship:5,shelters:[6,7]},Vs=17,bt={start:175,end:-205},an={x:12.4,spacing:26,height:9.5},gn={x:0,z:-238,deck:150},on={x:0,y:186,z:-238,width:48},vn={north:71,south:-113,rail:-159},bi=6,Oh=[28,72,104],zh=10.5,nn={x:0,y:50,z:-60,length:24,radius:4.6},wi={z:vn.rail,height:30,cars:5,carLength:17,gap:1.2,speed:32,span:1100},jn={pearl:{x:160,z:-430,height:318,clearance:34,view:{from:40,halfAngle:.1}},gate:{x:-146,z:-450,height:250,clearance:62,view:{from:85,halfAngle:.16}},twist:{x:136,z:-710,height:400,radius:30,clearance:42,view:{from:110,halfAngle:.08}},opener:{x:-150,z:-760,height:330,clearance:46,view:{from:140,halfAngle:.08}}},_v=-45,yv=150,Mv=136,Ws=[{position:{x:0,y:5.2,z:130},target:{x:0,y:17,z:20},fov:62},{position:{x:.4,y:8.5,z:62},target:{x:0,y:40,z:-110},fov:58},{position:{x:-.5,y:36,z:14},target:{x:0,y:104,z:-210},fov:52},{position:{x:.3,y:116,z:-38},target:{x:0,y:150,z:-238},fov:44},{position:{x:0,y:152,z:-70},target:{x:0,y:157,z:-238},fov:40}],Bh=.5,kh={from:.22,to:.5},Hh={from:.62,to:1};function Ei(n){let e=n|0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Sv(n,e){for(let t=n.length-1;t>0;t-=1){const i=Math.floor(e()*(t+1)),r=n[t];n[t]=n[i],n[i]=r}}function Gh(n,e,t){const i=Math.min(1,Math.max(0,(t-n)/(e-n)));return i*i*i*(i*(i*6-15)+10)}function bv(n,e,t,i,r){const s=(g,_)=>Math.max(1e-4,Math.sqrt(Math.hypot(_[0]-g[0],_[1]-g[1],_[2]-g[2]))),a=s(n,e),o=a+s(e,t),l=o+s(t,i),c=a+(o-a)*r,h=(g,_,m,p)=>{const b=(c-m)/(p-m);return[g[0]+(_[0]-g[0])*b,g[1]+(_[1]-g[1])*b,g[2]+(_[2]-g[2])*b]},u=h(n,e,0,a),f=h(e,t,a,o),d=h(t,i,o,l);return h(h(u,f,0,o),h(f,d,a,l),a,o)}function wv(n,e){const t=n.length,i=(a,o)=>a[o]??0,r=new Array(t).fill(0),s=new Array(t).fill(0);for(let a=1;a<t-1;a+=1){const o=i(n,a)-i(n,a-1),l=i(n,a+1)-i(n,a),c=2*(o+l)-o*i(s,a-1),h=6*((i(e,a+1)-i(e,a))/l-(i(e,a)-i(e,a-1))/o);s[a]=l/c,r[a]=(h-o*i(r,a-1))/c}for(let a=t-2;a>0;a-=1)r[a]=i(r,a)-i(s,a)*i(r,a+1);return a=>{let o=0;for(;o<t-2&&i(n,o+1)<a;)o+=1;const l=i(n,o+1)-i(n,o),c=(a-i(n,o))/l,h=1-c;return h*i(e,o)+c*i(e,o+1)+((h*h*h-h)*i(r,o)+(c*c*c-c)*i(r,o+1))*l*l/6}}const Ev=(()=>{const n=Ws.map(p=>[p.position.x,p.position.y,p.position.z]),e=n[0]??[0,0,0],t=n[1]??e,i=n.at(-1)??e,r=n.at(-2)??i,s=[[2*e[0]-t[0],2*e[1]-t[1],2*e[2]-t[2]],...n,[2*i[0]-r[0],2*i[1]-r[1],2*i[2]-r[2]]],a=96,o=[],l=[],c=[0];let h=0;for(let p=0;p<n.length-1;p+=1){const[b,w,v,S]=[s[p],s[p+1],s[p+2],s[p+3]];if(b===void 0||w===void 0||v===void 0||S===void 0)throw new Error("splash: camera path is incomplete");for(let E=p===0?0:1;E<=a;E+=1){const R=bv(b,w,v,S,E/a),x=o.at(-1);x!==void 0&&(h+=Math.hypot(R[0]-x[0],R[1]-x[1],R[2]-x[2])),o.push(R),l.push(h)}c.push(h)}const u=c.map(p=>p/h),f=p=>wv(u,Ws.map(p)),d=p=>(Bh+(1-Bh)*Gh(kh.from,kh.to,p))*(1-Gh(Hh.from,Hh.to,p)),g=1024,_=[0];for(let p=1;p<=g;p+=1)_.push((_.at(-1)??0)+(d((p-1)/g)+d(p/g))/2);const m=_.at(-1)??1;return{samples:o,lengths:l,length:h,speed:d,total:m,covered:_.map(p=>p/m),target:{x:f(p=>p.target.x),y:f(p=>p.target.y),z:f(p=>p.target.z)},fov:f(p=>p.fov)}})();function ei(n){const e=Ws[0],t=Ws.at(-1);if(e===void 0||t===void 0)throw new Error("splash: camera keys are incomplete");if(n<=0)return e;if(n>=1)return t;const{samples:i,lengths:r,length:s,covered:a,speed:o,total:l,target:c,fov:h}=Ev,u=a.length-1,f=Math.floor(n*u),d=f/u,g=(a[f]??0)+(o(d)+o(n))*.5*(n-d)*u/l,_=g*s;let m=0,p=r.length-1;for(;p-m>1;){const E=m+p>>1;(r[E]??0)<_?m=E:p=E}const b=i[m]??[0,0,0],w=i[p]??b,v=r[m]??0,S=Math.min(1,Math.max(0,(_-v)/Math.max(1e-6,(r[p]??v)-v)));return{position:{x:b[0]+(w[0]-b[0])*S,y:b[1]+(w[1]-b[1])*S,z:b[2]+(w[2]-b[2])*S},target:{x:c.x(g),y:c.y(g),z:c.z(g)},fov:h(g)}}function nr(n,e,t){const i=Math.min(1,Math.max(0,(n-e)/t));return i*i*(3-2*i)}function Tv(n){const{speed:e,span:t}=wi;return(((n-1.6)*e+t/2)%t+t)%t-t/2}function Vh(n){let e;for(let t=0;t<=400;t+=1){const i=ei(t/400);Math.abs(i.position.z-n)>6||(e=Math.min(e??1/0,i.position.y))}return e}const Av=1280/760,Rv=[[0,0,.18,.12],[.82,0,1,.12],[0,.89,.1,1],[.75,.89,1,1],[.37,.66,.63,.83]];function Cv(n){const{position:e,target:t,fov:i}=ei(1),r=Wh({x:t.x-e.x,y:t.y-e.y,z:t.z-e.z}),s=Wh({x:-r.z,y:0,z:r.x}),a={x:s.y*r.z-s.z*r.y,y:s.z*r.x-s.x*r.z,z:s.x*r.y-s.y*r.x},o={x:n.x-e.x,y:n.y-e.y,z:n.z-e.z},l=tl(o,r);if(l<=0)return;const c=Math.tan(i*Math.PI/360);return{x:.5+.5*tl(o,s)/(l*c*Av),y:.5-.5*tl(o,a)/(l*c)}}function tl(n,e){return n.x*e.x+n.y*e.y+n.z*e.z}function Wh(n){const e=Math.hypot(n.x,n.y,n.z);return{x:n.x/e,y:n.y/e,z:n.z/e}}function Pv(n){const t=[-1,1].flatMap(o=>[-1,1].map(l=>Cv({x:n.x+Math.cos(n.yaw)*o*n.width/2,y:n.y+l*n.height/2,z:n.z-Math.sin(n.yaw)*o*n.width/2}))).filter(o=>o!==void 0);if(t.length===0)return!1;const i=Math.min(...t.map(o=>o.x)),r=Math.max(...t.map(o=>o.x)),s=Math.min(...t.map(o=>o.y)),a=Math.max(...t.map(o=>o.y));return Rv.some(([o,l,c,h])=>i<c&&r>o&&s<h&&a>l)}function Lv(n,e){return Object.values(vn).find(t=>t+bi>e&&t-bi<n)}function Iv(n,e,t){return Object.values(jn).some(i=>Math.hypot(n-i.x,e-i.z)<i.clearance+t)}function Dv(n,e,t){const i=ei(1).position,r=Math.hypot(n-i.x,e-i.z),s=Math.atan2(n-i.x,i.z-e);let a=1/0;for(const o of Object.values(jn)){const l=Math.hypot(o.x-i.x,o.z-i.z);if(r+t>=l)continue;const c=Math.abs(s-Math.atan2(o.x-i.x,i.z-o.z))-Math.atan2(t,r),h=Math.min(1,Math.max(0,(c-o.view.halfAngle)/.06));if(h>=1)continue;const u=i.y+(o.view.from-i.y)*(r+t)/l;a=Math.min(a,u+h*h*400)}return a}function nl(n,e,t,i,r){const s=ei(1).position,a=t<_v&&Math.hypot(e-s.x,t-s.z)<yv?Mv:1/0;return Math.max(r,Math.min(n,a,Dv(e,t,i)))}function Xh(n,e,t){const[i]=n.splice(Math.floor(e*n.length),1);if(i===void 0)throw new Error(`splash: the city places more ${t} than it has artwork for`);return i}function Nv(n){const e=n();return e<.46?Bt.glass:e<.78?Bt.panel:Bt.ribbon}function Uv(n,e){const t=n();return e?t<.3?Nt.crownBand:t<.55?Nt.floorLines:t<.7?Nt.fins:Nt.none:t<.05?Nt.redCorners:t<.09?Nt.cyanCorners:t<.18?Nt.crownBand:t<.25?Nt.floorLines:t<.3?Nt.fins:Nt.none}function Xs(n,e,t){const i=e(),r=!t.storefront&&t.height>46&&e()<.17,s=r?e()<.6?Bt.glass:Bt.ribbon:Nv(e),a=.08+e()*.3,o=Uv(e,r),l=r?tn.round:tn.box,c=[];let h=0,u=r?Math.min(t.width,t.depth):t.width,f=r?u:t.depth,d=t.height>60?2+Math.floor(e()*2):e()<.4?2:1;if(r&&(d=Math.min(d,2)),!r&&d>1&&e()<.55){const b=Math.min(t.height*.4,9+e()*10);c.push({x:t.x,y:0,z:t.z,width:u,depth:f,height:b,seed:i,facade:Bt.panel,lit:Math.min(1,a+.15),trim:Nt.none,storefront:t.storefront,form:l,taper:1}),h=b,u*=.7+e()*.18,f*=.7+e()*.18,d-=1}for(let b=0;b<d;b+=1){const w=t.height-h,v=b===d-1,S=v?w:w*(.58+e()*.2),E=r?.84+e()*.16:1;c.push({x:t.x,y:h,z:t.z,width:u,depth:f,height:S,seed:i,facade:s,lit:a,trim:v?o:Nt.none,storefront:t.storefront&&h===0,form:l,taper:E}),h+=S;const R=r?E*(.82+e()*.1):.72+e()*.16;u*=R,f=r?u:f*(.72+e()*.16)}const g=c.at(-1);if(g===void 0)return c;const _=g.y+g.height,m=g.width*g.taper,p=g.depth*g.taper;if(r&&e()<.45)n.antennas.push({x:g.x,y:_,z:g.z,height:t.height*(.12+e()*.1),radius:m*.12});else{const b=1+Math.floor(e()*3);for(let w=0;w<b;w+=1){const v=1.6+e()*Math.min(5,m*.3),S=1.6+e()*Math.min(5,p*.3),E=r?.5:1;n.roofUnits.push({x:g.x+(e()-.5)*(m-v-1.5)*E,y:_,z:g.z+(e()-.5)*(p-S-1.5)*E,width:v,height:1.2+e()*2.4,depth:S})}if(t.height>70&&e()<.55){const w=!r&&t.height>110&&e()<.35;n.antennas.push({x:g.x+(w?0:(e()-.5)*m*.5),y:_,z:g.z+(w?0:(e()-.5)*p*.5),height:w?18+e()*22:7+e()*16,radius:w?Math.min(m,p)*.09:.22})}}return n.tiers.push(...c),c}function qh(n,e){const t=Lv(n,n-e);if(t===void 0)return{length:e};const i=t+bi;return n-i<8?{skipTo:t-bi-1}:{length:n-i-.5}}function Yh(n,e,t){let i=bt.start;for(;i>bt.end+12;){const r=qh(i,Math.min(i-bt.end,14+e()*13));if("skipTo"in r){i=r.skipTo;continue}const s=r.length,a=i-s/2,o=15+e()*13,l=e()*2.2,c=Vs+l,h=Math.max(0,Math.min(1,(40-a)/220)),u=t*(c+o/2),f=nl(26+e()**1.5*96+h*46,u,a,Math.max(o,s)/2,24),g=Xs(n,e,{x:u,z:a,width:o,depth:s,height:f,storefront:!0})[0];if(g!==void 0&&a<160&&a>-150){const _=e()<.8?1+Math.floor(e()*2.4):0;for(let m=0;m<_;m+=1){const p=2.1+e()*.6,b=p*(3.7+e()*.5),w=5.5+e()*Math.max(0,Math.min(34,g.height-b-7));w+b>g.height-1||n.signs.push({x:t*(c-p/2-.35),y:w,z:a+(m-(_-1)/2)*Math.min(5,s/Math.max(1,_))+(e()-.5),width:p,height:b,slot:Xh(n.signSlots,e(),"signs")})}}if(g!==void 0&&f>46&&s>16&&e()<.42&&a<120){const _=Math.min(s-4,11+e()*9),m=_*(.5+e()*.12),p=Math.min(g.height-m/2-3,20+m/2+e()*26);p-m/2>12&&n.screens.push({x:t*(c-.45),y:p,z:a,width:_,height:m,yaw:-t*Math.PI/2,draw:e()})}i-=s+(e()<.4?4+e()*5:1.2)}}function Zh(n,e,t){let i=bt.start-10;for(;i>-300;){const r=qh(i,18+e()*14);if("skipTo"in r){i=r.skipTo;continue}const s=r.length,a=i-s/2,o=18+e()*16,l=Math.max(0,Math.min(1,(60-a)/300)),c=t*(44+e()*10+o/2),h=nl(50+e()**1.3*110+l*60,c,a,Math.max(o,s)/2,40),f=Xs(n,e,{x:c,z:a,width:o,depth:s,height:h,storefront:!1}).at(-1);if(f!==void 0&&f.form===tn.box&&a<-40&&e()<.35){const d=Math.min(f.width-2,12+e()*8),g=d*.48;n.screens.push({x:f.x,y:f.y+f.height+1.2+g/2,z:f.z+f.depth/2-1,width:d,height:g,yaw:0,draw:e()})}i-=s+3+e()*6}}function Fv(n,e){for(let t=-520;t<=520;t+=46)for(let i=-780;i<=200;i+=46){if(Math.abs(t)<96&&i>-320||Math.hypot(t-gn.x,i-gn.z)<90)continue;const r=1+Math.floor(e()*2.2);for(let s=0;s<r;s+=1){const a=12+e()*(r===1?20:12),o=12+e()*(r===1?20:12),l=t+(e()-.5)*(34-a),c=i+(e()-.5)*(34-o);if(Iv(l,c,Math.max(a,o)/2))continue;const h=Math.hypot(l-gn.x,c-gn.z),u=e()<.07?70+e()*110:0,f=16+e()**1.8*70+120*Math.exp(-((h/300)**2))+u,d=nl(f,l,c,Math.max(a,o)/2,14);Xs(n,e,{x:l,z:c,width:a,depth:o,height:d,storefront:!1})}}}function Ov(n,e){for(let t=0;t<14;t+=1){const i=-Math.PI*.92+t/13*Math.PI*.84+(e()-.5)*.1,r=720+e()*420,s=70+e()*70;Xs(n,e,{x:gn.x+Math.cos(i)*r,z:gn.z+Math.sin(i)*r,width:s,depth:s*(.7+e()*.5),height:260+e()*240,storefront:!1})}}function zv(n){const{x:e,z:t,deck:i}=gn,r=(s,a,o,l,c,h,u)=>({x:e,y:s,z:t,width:a,depth:a,height:o,seed:.618,facade:l,lit:.42,trim:c,storefront:!1,form:h,taper:u});n.tiers.push(r(0,72,22,Bt.panel,Nt.crownBand,tn.box,1),r(22,38,96,Bt.hero,Nt.none,tn.round,.9),r(118,31,22,Bt.hero,Nt.crownBand,tn.round,.9),r(140,25,i-140,Bt.hero,Nt.crownBand,tn.round,.96))}const Bv=[12,36,48,58,82,92,112,126,140],Kh=4.6;function kv(n,e){const t=r=>n.tiers.filter(s=>s.storefront&&Math.sign(s.x)===r),i=[];for(const r of t(-1))for(const s of t(1)){const a=Math.min(r.z+r.depth/2,s.z+s.depth/2)-4,o=Math.max(r.z-r.depth/2,s.z-s.depth/2)+4,l=(a+o)/2;if(a-o<7||l>ei(0).position.z||i.some(f=>Math.abs(f-l)<26))continue;const c=Vh(l),h=Math.abs(l-nn.z)<14,u=Bv.filter(f=>{const d=f+Kh,g=(f+d)/2;if(c!==void 0&&!(f>c+14||d<c-18)||Oh.some(b=>b>f-5&&b<d+5)||n.signs.some(b=>Math.abs(b.z-l)<4.5&&b.y<d+1&&b.y+b.height>f-1)||n.screens.some(b=>Math.abs(b.z-l)<b.width/2+3.5&&Math.abs(b.y-g)<b.height/2+3.5))return!1;const m=nn.y-nn.radius-4,p=nn.y+nn.radius+4;return!h||d<m||f>p});Sv(u,e);for(const f of u){const d=f+Kh,g=[-1,1].map(p=>{const b=n.tiers.filter(w=>Math.sign(w.x)===p&&Math.abs(w.z-l)<w.depth/2-3&&w.y<f&&w.y+w.height>d+6).map(w=>Math.abs(w.x)-w.width/2);return b.length===0?void 0:p*(Math.min(...b)+1.5)}),[_,m]=g;if(!(_===void 0||m===void 0||m-_>Vs*2+10)){i.push(l),n.tiers.push({x:(_+m)/2,y:f,z:l,width:m-_,height:d-f,depth:6.5,seed:e(),facade:Bt.glass,lit:.55,trim:Nt.none,storefront:!1,form:tn.box,taper:1});break}}}}function Hv(){const n=Ei(7382788),e={tiers:[],roofUnits:[],antennas:[],signs:[],screens:[],signSlots:Array.from({length:jo},(r,s)=>s)};Yh(e,n,-1),Yh(e,n,1),Zh(e,n,-1),Zh(e,n,1),Fv(e,n),Ov(e,n),zv(e),kv(e,n);const t=Array.from({length:el.facades},(r,s)=>s),i=e.screens.filter(r=>!Pv(r)).map(({draw:r,...s})=>({...s,slot:Xh(t,r,"screens")}));return{tiers:e.tiers,roofUnits:e.roofUnits,antennas:e.antennas,signs:e.signs,screens:i}}const Gv=[[.05,.052,.06],[.42,.43,.45],[.3,.024,.028],[.012,.012,.014],[.03,.1,.18]],Vv=[[.4,.24,.04],[.19,.19,.2]];function Wv(){const n=Ei(61925),e=[],t=(a,o,l,c,h,u,f)=>{const d=f===Pn.hauler?Vv:Gv;for(let g=0;g<c;g+=1)e.push({origin:a,directionX:o,directionZ:l,speed:u,span:h,kind:f,phase:(g+.15+n()*.6)*h/c,bob:n()*Math.PI*2,paint:d[Math.floor(n()*d.length)]??[.05,.05,.05]})},i=(bt.start+bt.end+30)/2,r=bt.start-bt.end+50;for(const a of Oh)t({x:-zh,y:a,z:i},0,1,5,r,22+n()*6,Pn.spinner),t({x:zh,y:a+2.5,z:i},0,-1,5,r,18+n()*6,Pn.spinner);const s=[[vn.north,[58,94],40],[vn.south,[66,98,130],46],[vn.rail,[60,110],void 0]];for(const[a,o,l]of s){for(const c of o)t({x:0,y:c,z:a+2.4},1,0,6,900,28+n()*8,Pn.spinner),t({x:0,y:c+3,z:a-2.4},-1,0,6,900,26+n()*8,Pn.spinner);l!==void 0&&(t({x:0,y:l,z:a+2},1,0,3,900,13,Pn.hauler),t({x:0,y:l+6,z:a-2},-1,0,3,900,12,Pn.hauler))}return e}function Xv(){const n=Ei(24301),e=[],t=(i,r,s,a,o,l)=>{const c=30+n()*14;for(let h=0;h<a;h+=1)e.push({origin:i,directionX:r,directionZ:s,speed:c,span:o,headlight:l,phase:(h+n()*.7)*o/a,bob:n()*Math.PI*2,trail:5+n()*6,radius:.45})};for(const[i,r]of[[-260,150],[-340,190],[-420,230],[260,165],[340,205],[420,250]])t({x:i,y:r,z:-300},0,1,9,900,!0),t({x:i+6,y:r+4,z:-300},0,-1,9,900,!1);for(const[i,r]of[[-380,150],[-540,290],[-660,330]])t({x:0,y:r,z:i},1,0,10,1100,!0),t({x:0,y:r+4,z:i-6},-1,0,10,1100,!1);return e}const kr={concrete:0,tile:1,brick:2},qs=6.5,$h=[kr.concrete,kr.tile,kr.brick],Jh=[[.32,.03,.03],[.04,.16,.08],[.42,.38,.3],[.03,.05,.16],[.45,.16,.02]],Qh=[[.02,.02,.022],[.45,.46,.47],[.28,.29,.31],[.32,.03,.03],[.04,.08,.18],[.55,.42,.06],[.06,.2,.1],[.6,.6,.58]];function Hr(n,e){const t=Math.sin(n*12.9898+e*78.233)*43758.5453;return t-Math.floor(t)}function jh(n){const e=n.facade===Bt.panel;return{floorHeight:3.3+.8*Hr(n.seed,1),cellTarget:e?2.1+.9*Hr(n.seed,2):1.45+.55*Hr(n.seed,3),finish:e?$h[Math.floor(Hr(n.seed,4)*$h.length)]??kr.concrete:kr.concrete,balconies:e&&Hr(n.seed,5)<.35}}function qv(n,e){return n/Math.max(1,Math.floor(n/e+.5))}function il(n){const e=new Set(n.tiers.filter(t=>t.storefront).map(t=>t.seed));return n.tiers.filter(t=>e.has(t.seed)&&t.form===tn.box&&Math.abs(t.x)-t.width/2<30)}const Ys=["星河","南巷","云栖","青柠","白鹭","半岛","夜航","北辰","锦里","西岸","拾光","海棠","长街","霓虹","东风","朝夕","银杏","月台"],Zs=[["咖啡","COFFEE"],["直播间","LIVE STUDIO"],["好物馆","SELECT SHOP"],["面馆","NOODLES"],["影像馆","PHOTO STUDIO"],["茶饮","TEA BAR"],["美妆","BEAUTY"],["书店","BOOKS"]],rl=Ys.length*Zs.length;function Yv(n){if(n<0||n>=rl)throw new Error(`splash: no unique name for shop ${n}`);const[e,t]=Zs[(3*n+Math.floor(n/Ys.length))%Zs.length]??Zs[0];return{name:`${Ys[n%Ys.length]??""}${e}`,trade:t}}function ef(n){const e=new Map;let t=0;for(const i of n.tiers)!i.storefront||i.form!==tn.box||(e.set(i,t),t+=Math.ceil(i.depth/qs));if(t>rl)throw new Error(`splash: ${t} shops line the avenue but only ${rl} shop names are unique`);return{first:e,shops:t}}function Zv(n){const e=Ei(5116399),t=[],i=[],r=[];for(const s of il(n)){const a=Math.sign(s.x),o=Math.abs(s.x)-s.width/2,l=m=>a*(o-m),c=m=>a>0?s.z-s.depth/2+m:s.z+s.depth/2-m,h=jh(s),u=qv(s.depth,h.cellTarget),f=Math.round(s.depth/u),d=s.y+s.height,g=[],_=Math.ceil(Math.max(s.y,s.storefront?5.6:0)/h.floorHeight);for(let m=_;(m+1)*h.floorHeight<=d-.3;m+=1)g.push(m*h.floorHeight);if(t.push({x:l(.2),y:d-.3,z:s.z,width:.4,height:.6,depth:s.depth+.4},{x:a*(o+.12),y:d+.55,z:s.z,width:.24,height:1.1,depth:s.depth},{x:a*(o+s.width-.12),y:d+.55,z:s.z,width:.24,height:1.1,depth:s.depth},{x:s.x,y:d+.55,z:s.z+s.depth/2-.12,width:s.width,height:1.1,depth:.24},{x:s.x,y:d+.55,z:s.z-s.depth/2+.12,width:s.width,height:1.1,depth:.24}),s.facade===Bt.glass||s.facade===Bt.ribbon)for(const m of g)t.push({x:l(.16),y:m,z:s.z,width:.32,height:.14,depth:s.depth});else if(s.facade===Bt.panel&&h.balconies)for(const m of g)for(let p=0;p+1<f;p+=2){const b=c((p+1)*u),w=2*u-.3;t.push({x:l(.6),y:m+.09,z:b,width:1.2,height:.18,depth:w},{x:l(.6),y:m+.7,z:b+w/2+.11,width:1.2,height:1.05,depth:.08}),i.push({x:l(1.17),y:m+1.07,z:b,width:.05,height:.05,depth:w},{x:l(1.17),y:m+.5,z:b,width:.03,height:.03,depth:w});for(const v of[-.5,-.17,.17,.5])i.push({x:l(1.17),y:m+.63,z:b+v*w,width:.04,height:.9,depth:.04})}else if(s.facade===Bt.panel){const m=e()<.4&&f>=4?Math.floor(f*.3):-1;g.forEach((p,b)=>{for(let S=0;S<f;S+=1){if(S===m||S===m+1)continue;const E=p+.3*h.floorHeight-.03;if(t.push({x:l(.06),y:E,z:c((S+.5)*u),width:.12,height:.06,depth:.62*u}),e()<.3){const R=p+.06*h.floorHeight+.3;i.push({x:l(.22),y:R,z:c((S+.65)*u),width:.44,height:.6,depth:.82})}}if(m<0)return;const w=c((m+1)*u),v=2*u-.2;i.push({x:l(.55),y:p+.03,z:w,width:1.1,height:.06,depth:v},{x:l(1.08),y:p+1,z:w,width:.04,height:.04,depth:v});for(const S of[-.5,0,.5])i.push({x:l(1.08),y:p+.5,z:w+S*v,width:.04,height:1,depth:.04});if(b+1<g.length){const S=v-.6,E=h.floorHeight,R=(b%2===0?1:-1)*a;i.push({x:l(.8),y:p+E/2,z:w,width:.6,height:.06,depth:Math.hypot(S,E),turnX:-R*Math.atan2(E,S)})}})}if(s.storefront)for(let m=0;(m+1)*qs<=s.depth;m+=1)e()>=.45||r.push({x:l(.75),y:3.62,z:c((m+.5)*qs),width:1.5,height:.07,depth:5.2,turnZ:a*.24,tint:Jh[Math.floor(e()*Jh.length)]??[.3,.03,.03]})}return{masonry:t,steel:i,awnings:r}}function Kv(){const n=Ei(51829),e=(bt.start+bt.end)/2,t=bt.start-bt.end+60;return[[1.8,-1,17],[5.05,-1,14],[8.15,-1,11],[-1.8,1,18],[-5.05,1,15],[-8.15,1,12]].flatMap(([r,s,a])=>Array.from({length:7},(o,l)=>({origin:{x:r,y:0,z:e},directionX:0,directionZ:s,speed:a,span:t,phase:(l+.2+n()*.6)*t/7,bob:-1,paint:Qh[Math.floor(n()*Qh.length)]??[.05,.05,.05]})))}function $v(){const n=[];for(let e=bt.start;e>bt.end;e-=an.spacing)n.push(e);return n}function Gr(n,e){return Object.values(vn).some(t=>Math.abs(n-t)<bi+e)}function Jv(n){const e=Ei(48764),t=[],i=[],r=[],s=[],a=[],o=[];$v().forEach((h,u)=>{for(const f of[-1,1]){const d=h-an.spacing/2;if(u%2===0&&!Gr(d,3)){for(const g of[-.15,0,.15])t.push({x:f*(15.6+g),y:.45,z:d,width:.12,height:.04,depth:1.8});for(const g of[.6,.84])t.push({x:f*15.85,y:g,z:d,width:.04,height:.12,depth:1.8});t.push({x:f*15.6,y:.22,z:d-.75,width:.42,height:.44,depth:.06},{x:f*15.6,y:.22,z:d+.75,width:.42,height:.44,depth:.06},{x:f*15.85,y:.66,z:d-.75,width:.05,height:.48,depth:.06},{x:f*15.85,y:.66,z:d+.75,width:.05,height:.48,depth:.06})}Gr(h-4,1)||i.push({x:f*11.1,y:.45,z:h-4,width:.48,height:.9,depth:.48},{x:f*11.1,y:.93,z:h-4,width:.54,height:.06,depth:.54}),u%3===1&&!Gr(h+6,1)&&r.push({x:f*10.7,y:.31,z:h+6,width:.3,height:.62,depth:.3},{x:f*10.7,y:.66,z:h+6,width:.36,height:.08,depth:.36},{x:f*10.7,y:.76,z:h+6,width:.2,height:.12,depth:.2},{x:f*10.7,y:.42,z:h+6,width:.12,height:.5,depth:.12,turnX:Math.PI/2})}});for(const h of Object.values(vn))for(const u of[-1,1]){for(const d of[6.8,8.2,9.6])for(const g of[-1,1])i.push({x:u*10.45,y:.45,z:h+g*d,width:.2,height:.9,depth:.2});const f=h+u*7.5;i.push({x:u*10.6,y:2.8,z:f,width:.16,height:5.6,depth:.16}),t.push({x:u*7.85,y:5.55,z:f,width:5.5,height:.12,depth:.12},{x:u*5.4,y:5.05,z:f,width:.34,height:.95,depth:.3},{x:u*5.4,y:5.05,z:f-u*.17,width:.5,height:1.15,depth:.03});for(const d of[5.32,4.78])t.push({x:u*5.4,y:d+.13,z:f+u*.26,width:.26,height:.03,depth:.22});a.push({x:u*5.4,y:5.32,z:f+u*.17,color:[1.6,.08,.05],radius:.12},{x:u*5.4,y:4.78,z:f+u*.17,color:[.1,1.3,.55],radius:.12})}for(const h of n.tiers){if(!h.storefront||h.y>0||e()>=.34)continue;const u=Math.sign(h.x),f=Math.abs(h.x)-h.width/2,d=h.z+(e()-.5)*(h.depth-3);Gr(d,1)||(t.push({x:u*(f-.42),y:.95,z:d,width:.8,height:1.9,depth:.95}),s.push({x:u*(f-.83),y:1.08,z:d,width:.03,height:1.4,depth:.8}))}const[l,c]=el.shelters;for(const[h,u,f]of[[1,118,l],[-1,32,c]])t.push({x:h*14.2,y:2.65,z:u,width:1.8,height:.08,depth:4.4},{x:h*15.05,y:1.4,z:u,width:.06,height:2.4,depth:4.4},{x:h*13.4,y:1.3,z:u-2.1,width:.08,height:2.6,depth:.08},{x:h*13.4,y:1.3,z:u+2.1,width:.08,height:2.6,depth:.08},{x:h*14.7,y:.45,z:u,width:.4,height:.06,depth:3},{x:h*14.2,y:1.35,z:u+2.22,width:1.96,height:1.06,depth:.08}),o.push({x:h*14.2,y:1.35,z:u+2.27,width:1.8,height:.9,slot:f});return{steel:t,round:i,red:r,glow:s,lights:a,posters:o}}function Qv(n){const e=Ei(830238),t=il(n),i=n.tiers.filter(o=>Math.abs(o.x)<3&&o.width>Vs),r=[],s=[],a=[9.5,12,14.5,17,19.5,22];for(let o=bt.start-12;o>-40;o-=5+e()*4){if(Gr(o,2)||i.some(_=>Math.abs(_.z-o)<_.depth/2+4))continue;const l=Vh(o),c=Math.floor(e()*a.length);let h;for(let _=0;_<a.length&&h===void 0;_+=1){const m=(a[(c+_)%a.length]??12)+e()*1.5;if(l!==void 0&&Math.abs(m-l)<6||n.signs.some(w=>Math.abs(w.z-o)<2.5&&w.y<m+1.5&&w.y+w.height>m-2.5))continue;const[p,b]=[-1,1].map(w=>{const v=t.find(S=>Math.sign(S.x)===w&&Math.abs(S.z-o)<S.depth/2-1&&S.y<m-1&&S.y+S.height>m+1);return v===void 0?void 0:w*(Math.abs(v.x)-v.width/2)});p!==void 0&&b!==void 0&&(h={height:m,west:p,east:b})}if(h===void 0)continue;const u=.6+e()*1,f=(e()-.5)*3,d={x:h.west,y:h.height,z:o+f},g={x:h.east,y:h.height+(e()-.5)*1.5,z:o-f};if(r.push({from:d,to:g,sag:u}),e()<.45)for(let _=.12;_<.9;_+=.085){const m=4*u*_*(1-_);s.push({x:d.x+(g.x-d.x)*_,y:d.y+(g.y-d.y)*_-m-.32,z:d.z+(g.z-d.z)*_})}}return{cables:r,lanterns:s}}const xn=`
uniform float uTime;
uniform float uDetail;
uniform vec3 uHoloPos;
uniform float uHolo;
uniform float uFogDensity;
uniform float uFogFalloff;
// Avenue lamp heads: |x| of each head, head height, z of the first row, and row spacing toward -Z; uLampRows rows.
uniform vec4 uLamps;
uniform float uLampRows;

const vec3 HOLO_RGB = vec3(1.0, 0.075, 0.06);
const vec3 HAZE_LOW = vec3(0.2, 0.038, 0.052);
const vec3 HAZE_HIGH = vec3(0.028, 0.013, 0.042);
const vec3 LAMP_RGB = vec3(1.0, 0.7, 0.45);

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

// Light of the downward-facing avenue lamp heads in the three rows nearest the point: diffuse irradiance, and in
// specular a highlight of exponent shininess toward the eye along view. Points beyond the avenue get none.
vec3 lampLight(vec3 position, vec3 normal, vec3 view, float shininess, out vec3 specular) {
  specular = vec3(0.0);
  vec3 diffuse = vec3(0.0);
  if (abs(position.x) > 40.0 || position.y > 40.0) return diffuse;
  float row = floor((uLamps.z - position.z) / uLamps.w + 0.5);
  for (int offset = -1; offset <= 1; offset++) {
    float index = row + float(offset);
    if (index < 0.0 || index >= uLampRows) continue;
    for (int side = 0; side < 2; side++) {
      vec3 head = vec3(side == 0 ? -uLamps.x : uLamps.x, uLamps.y, uLamps.z - index * uLamps.w);
      vec3 toLight = head - position;
      float distanceSq = dot(toLight, toLight);
      vec3 direction = toLight * inversesqrt(distanceSq);
      float energy = 90.0 * smoothstep(-0.1, 0.45, direction.y) / (distanceSq + 6.0);
      diffuse += LAMP_RGB * energy * max(dot(normal, direction), 0.0);
      specular += LAMP_RGB * energy * pow(max(dot(normal, normalize(direction - view)), 0.0), shininess);
    }
  }
  return diffuse;
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
`,jv=`
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
`,ex=`
${xn}
uniform sampler2D uFascia;
uniform vec2 uFasciaGrid;
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying vec4 vGrid;
flat varying vec2 vTier;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;

const float PI = 3.14159265;
const float SHOP_WIDTH = ${qs.toFixed(2)};

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
  float shopCoord = u / SHOP_WIDTH;
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
  // Fascia board inset in the band; its lettering is this shop's slot of the fascia atlas, a coverage mask whose
  // blurrier mip doubles as the neon halo. Gradients come from the board coordinate, which is continuous within a shop.
  vec2 board = vec2((across - 0.05) / 0.9, (y - 3.86) / 1.08);
  vec2 boardPixel = max(fwidth(board), vec2(1e-4));
  float onBoard = rectMask(board, vec4(0.0, 0.0, 1.0, 1.0), boardPixel);
  float slot = vTier.y - 1.0 + shop;
  vec2 atlasCell = vec2(mod(slot, uFasciaGrid.x), floor(slot / uFasciaGrid.x));
  vec2 atlasUv = vec2((atlasCell.x + board.x) / uFasciaGrid.x, 1.0 - (atlasCell.y + 1.0 - board.y) / uFasciaGrid.y);
  vec2 gradientX = dFdx(board) / uFasciaGrid;
  vec2 gradientY = dFdy(board) / uFasciaGrid;
  float letters = textureGrad(uFascia, atlasUv, gradientX, gradientY).r * onBoard;
  float halo = textureGrad(uFascia, atlasUv, gradientX * 6.0, gradientY * 6.0).r * onBoard;
  float signKind = fract(shopHash * 11.3);
  vec3 ink = neonTint(fract(shopHash * 3.7));
  vec3 neonSign = vec3(0.012) + ink * (0.92 * letters + 0.3 * halo);
  vec3 boardLight = (shopHash < 0.5 ? vec3(1.0, 0.93, 0.82) : vec3(0.86, 0.9, 1.0)) * 0.2 * onBoard;
  vec3 lightbox = mix(vec3(0.016) + boardLight, ink * 0.03, letters);
  vec3 unlit = vec3(0.012) + vec3(0.035) * letters;
  vec3 signLight = signKind < 0.6 ? neonSign : signKind < 0.85 ? lightbox : unlit;
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
  // The avenue lamps light the lower storeys of the frontage, matching the relief and props in front of it.
  vec3 lampGlint;
  vec3 lighting = cityAmbient(normal, y) + spill + holoLight(vWorld, normal) + lampLight(vWorld, normal, view, 8.0, lampGlint) * avenue;
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
`,tx=`
uniform mat4 textureMatrix;
varying vec4 vReflection;
varying vec3 vWorld;

void main() {
  vReflection = textureMatrix * vec4(position, 1.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,nx=`
${xn}
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
`,ix=`
varying vec3 vDirection;

void main() {
  vDirection = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`,rx=`
${xn}
varying vec3 vDirection;

void main() {
  gl_FragColor = vec4(skyRadiance(cameraPosition, normalize(vDirection), uDetail > 0.5 ? 5 : 2), 1.0);
}
`,sx=`
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTint;
varying vec3 vLocal;
#ifdef BEVEL
flat varying vec3 vExtent;
flat varying mat3 vAxes;
flat varying vec3 vFace;
flat varying vec3 vCentre;
#endif

void main() {
  mat4 model = modelMatrix;
  #ifdef USE_INSTANCING
  model = model * instanceMatrix;
  #endif
  vec4 world = model * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(model) * normal);
  vLocal = position;
  #ifdef BEVEL
  mat3 frame = mat3(model);
  vExtent = vec3(length(frame[0]), length(frame[1]), length(frame[2]));
  vAxes = mat3(frame[0] / vExtent.x, frame[1] / vExtent.y, frame[2] / vExtent.z);
  vFace = normal;
  vCentre = model[3].xyz;
  #endif
  #ifdef USE_INSTANCING_COLOR
  vTint = instanceColor;
  #else
  vTint = vec3(1.0);
  #endif
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,ax=`
${xn}
uniform vec3 uAlbedo;
uniform vec3 uEmissive;
uniform float uSheen;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec3 vTint;
varying vec3 vLocal;
#ifdef BEVEL
flat varying vec3 vExtent;
flat varying mat3 vAxes;
flat varying vec3 vFace;
flat varying vec3 vCentre;
#endif

// Rectangle coverage for the vending front; rect = (x0, y0, x1, y1).
float frontRect(vec2 p, vec4 rect, vec2 pixel) {
  vec2 inside = smoothstep(rect.xy - pixel, rect.xy + pixel, p) * (1.0 - smoothstep(rect.zw - pixel, rect.zw + pixel, p));
  return inside.x * inside.y;
}

// A vending machine's lit front on its 0.8 x 1.4 m face, p in metres from the face centre: a header band, four shelves
// of drinks behind backlit glass, selection buttons, and the dark delivery flap.
vec3 vendingFront(vec2 p, float seed) {
  vec2 pixel = max(fwidth(p), vec2(1e-4));
  vec3 color = vec3(0.014);
  vec2 shelf = vec2((p.x + 0.34) / 0.136, (p.y + 0.08) / 0.14);
  vec2 cell = floor(shelf);
  vec2 inCell = fract(shelf);
  vec2 cellPixel = pixel / vec2(0.136, 0.14);
  float can = frontRect(inCell, vec4(0.24, 0.1, 0.76, 0.78), cellPixel);
  float pick = hash12(cell + seed * 17.0);
  vec3 label = pick < 0.25 ? vec3(0.8, 0.06, 0.06) : pick < 0.5 ? vec3(0.08, 0.32, 0.8) : pick < 0.75 ? vec3(0.85, 0.6, 0.08)
    : vec3(0.1, 0.62, 0.26);
  vec3 shelves = mix(vec3(0.34, 0.39, 0.44), label * 0.5, can) * (1.0 - 0.75 * lineCoverage(inCell.y - 0.03, 0.03, cellPixel.y));
  color = mix(color, shelves, frontRect(p, vec4(-0.34, -0.08, 0.34, 0.48), pixel));
  color = mix(color, vec3(0.42, 0.44, 0.48), frontRect(p, vec4(-0.34, 0.53, 0.34, 0.65), pixel));
  float buttons = frontRect(p, vec4(-0.3, -0.19, 0.3, -0.14), pixel) * step(0.45, fract((p.x + 0.3) / 0.1));
  color = mix(color, vec3(0.62, 0.34, 0.08), buttons);
  return mix(color, vec3(0.002), frontRect(p, vec4(-0.26, -0.56, 0.18, -0.42), pixel));
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 metric = vec3(0.0);
  float edge = 0.0;
  #ifdef BEVEL
  // Within 3 cm of an edge (less on thin members) the face normal turns toward the neighbouring face.
  metric = vLocal * vExtent;
  vec3 inset = 0.5 * vExtent - abs(metric);
  float radius = min(0.03, 0.3 * min(vExtent.x, min(vExtent.y, vExtent.z)));
  vec3 bend = (1.0 - abs(vFace)) * (1.0 - clamp(inset / radius, 0.0, 1.0));
  edge = max(bend.x, max(bend.y, bend.z));
  normal = normalize(vAxes * normalize(vFace + sign(metric) * bend * 0.9));
  #endif
  vec3 facing = abs(normal);
  vec2 coord = facing.y > 0.7 ? vWorld.xz : facing.x > facing.z ? vWorld.zy : vWorld.xy;
  vec3 albedo = uAlbedo * vTint;
  float sheen = uSheen;
  vec3 emissive = uEmissive;
  #if defined(MASONRY)
  float mottle = fbm(coord * 2.3, 3);
  float streaks = facing.y < 0.5 ? smoothstep(0.45, 0.8, valueNoise(vec2(coord.x * 5.0, coord.y * 0.35))) : 0.0;
  albedo *= (0.72 + 0.56 * mottle) * (1.12 - 0.45 * streaks) * (1.0 + 0.6 * edge);
  sheen += 0.25 * step(0.7, normal.y);
  #elif defined(STEEL)
  float rust = smoothstep(0.72, 0.9, valueNoise(coord * 3.1 + 7.0)) * (1.0 - 0.5 * smoothstep(0.0, 3.0, vWorld.y));
  albedo = mix(albedo * (0.85 + 0.3 * valueNoise(coord * 7.0)), vec3(0.11, 0.045, 0.02), 0.7 * rust) * (1.0 + 1.2 * edge);
  #elif defined(FABRIC)
  float stripe = step(0.5, fract(metric.z / 0.36 + 0.25));
  albedo = mix(albedo, vec3(0.42, 0.4, 0.36), 0.85 * stripe) * (0.9 + 0.2 * valueNoise(coord * 9.0));
  #elif defined(PAINTED)
  albedo *= 0.85 + 0.3 * valueNoise(coord * 11.0);
  #endif
  #if defined(VENDING) && defined(BEVEL)
  emissive = facing.y < 0.5 && abs(vFace.x) > 0.5 ? vendingFront(metric.zy * vec2(-sign(vFace.x), 1.0), vCentre.z) : vec3(0.014);
  #endif
  #ifdef LANTERN
  float around = atan(vLocal.z, vLocal.x + 1e-6) * 5.0 / 3.14159265;
  float ribs = gridLine(around, 1.0, 0.06, max(fwidth(around), 1e-4));
  float caps = smoothstep(0.15, 0.165, abs(vLocal.y));
  emissive = uEmissive * (0.75 + 0.25 * (1.0 - abs(vLocal.y) / 0.2)) * (1.0 - 0.6 * ribs) * (1.0 - caps);
  albedo = mix(albedo, vec3(0.3, 0.16, 0.03), caps);
  #endif
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  float fresnel = 0.04 + 0.96 * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  vec3 glint;
  vec3 lamps = lampLight(vWorld, normal, view, 40.0, glint);
  vec3 color = albedo * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal) + lamps)
    + (sky * fresnel + glint * (0.15 + 0.85 * fresnel)) * sheen + emissive;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,ox=`
uniform vec3 uPanelOffset;
uniform float uSlotAspect;
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
  float aspect = aShape.x / aShape.y;
  vec2 cover = aspect > uSlotAspect ? vec2(1.0, uSlotAspect / aspect) : vec2(aspect / uSlotAspect, 1.0);
  vPanel = aShape.zw;
  vUv = 0.5 + (uv - 0.5) * cover;
  vWorld = world;
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,lx=`
${xn}
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
`,Ks=`
${xn}
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
`,cx=`
${Ks}
uniform vec3 uLightOffset;
attribute vec3 aHead;
attribute vec4 aLight;

void main() {
  vec3 head = aHead + uLightOffset;
  emitSegment(head, head, aLight.w, 2.2, aLight.rgb);
}
`,hx=`
${Ks}
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
`,fx=`
${Ks}
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
`,ux=`
${Ks}
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
`,dx=`
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
`,px=`
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
`,mx=`
${xn}
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
`,gx=`
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
`,tf=1.22,vx=`
${xn}
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
  float front = uIgnite * ${tf.toFixed(2)};
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
`,xx=`
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,_x=`
${xn}
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
`,sl=`
${xn}
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
`,al=`
${xn}
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
  // Door shut lines on both flanks below the waist, and the bonnet and boot lid outlines on top.
  float flank = step(0.8, abs(p.x)) * step(0.34, p.y) * step(p.y, 0.92);
  float doors = max(max(lineCoverage(p.z - 0.98, 0.006, pixel.z), lineCoverage(p.z + 0.27, 0.006, pixel.z)),
    lineCoverage(p.z + 1.0, 0.006, pixel.z)) * flank;
  float top = step(0.7, p.y) * step(abs(p.x), 0.8);
  float lidSides = lineCoverage(abs(p.x) - 0.68, 0.006, pixel.x) * (step(1.05, p.z) + step(p.z, -1.5));
  float bootFront = lineCoverage(p.z + 1.5, 0.006, pixel.z) * step(abs(p.x), 0.68);
  return max(doors, max(lidSides, bootFront) * top);
  #else
  return 0.0;
  #endif
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  float metal = step(3.5, vGlow.a);
  float black = step(2.5, vGlow.a) * (1.0 - metal);
  float trim = step(1.5, vGlow.a) * (1.0 - black) * (1.0 - metal);
  float glass = clamp(vGlow.a, 0.0, 1.0) * (1.0 - trim) * (1.0 - black) * (1.0 - metal);
  #ifdef CAR
  // The glass house's upward faces are the painted roof.
  glass *= 1.0 - smoothstep(0.8, 0.9, normal.y);
  #endif
  float painted = (1.0 - glass) * (1.0 - trim) * (1.0 - black) * (1.0 - metal) * step(dot(vGlow.rgb, vec3(1.0)), 0.0);
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
  // Bright metal: a dark base under a strong mirror reflection.
  paint = mix(paint, vec3(0.03), metal);
  fresnel = mix(fresnel, 0.55 + 0.45 * pow(1.0 - cosine, 5.0), metal);
  #ifdef CAR
  // Wheel rims: a hub and a darker spoke ring blurred by the wheel's spin.
  vec2 hub = vec2(vModel.z - sign(vModel.z) * 1.38, vModel.y - 0.33);
  float rimRadius = length(hub);
  paint *= 1.0 - metal * 0.75 * smoothstep(0.06, 0.08, rimRadius) * (1.0 - smoothstep(0.16, 0.18, rimRadius));
  #endif
  vec3 emission = mix(vGlow.rgb, accent * vGlow.r, trim);
  #ifdef BLIMP
  // LED strips run along the gores above and below the screen, tracing the envelope.
  float around = atan(vModel.z, vModel.y + 1e-6) * 6.0 / 3.14159265;
  float aroundPixel = max(fwidth(around), 1e-4);
  float led = max(lineCoverage(abs(around) - 1.5, 0.03, aroundPixel), lineCoverage(abs(around) - 4.5, 0.03, aroundPixel));
  emission += vec3(0.12, 0.7, 1.0) * 0.9 * led * painted * step(abs(vModel.x), 10.0);
  #endif
  // The avenue lamps light the hull and leave a sharp highlight on its clear coat, glass, and metal.
  vec3 highlight;
  vec3 lamps = lampLight(vWorld, normal, view, mix(90.0, 240.0, max(glass, metal)), highlight);
  vec3 color = paint * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal) + lamps) * (1.0 - fresnel)
    + (sky * fresnel * mix(0.7, 1.0, max(glass, metal)) + highlight * (0.2 + 0.8 * fresnel)) * (1.0 - 0.5 * seams)
    + emission;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Vr=Yt;class ol extends Vo{constructor(e){super(e),this.defaultDPI=90,this.defaultUnit="px"}load(e,t,i,r){const s=this,a=new Zd(s.manager);a.setPath(s.path),a.setRequestHeader(s.requestHeader),a.setWithCredentials(s.withCredentials),a.load(e,function(o){try{t(s.parse(o))}catch(l){r?r(l):console.error(l),s.manager.itemError(e)}},i,r)}parse(e){const t=this;function i(D,I){if(D.nodeType!==1)return;D.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");const P=S(D);let B=!1,se=null;switch(D.nodeName){case"svg":I=_(D,I);break;case"style":s(D);break;case"g":I=_(D,I);break;case"path":I=_(D,I),D.hasAttribute("d")&&(se=r(D));break;case"rect":I=_(D,I),se=l(D);break;case"polygon":I=_(D,I),se=c(D);break;case"polyline":I=_(D,I),se=h(D);break;case"circle":I=_(D,I),se=u(D);break;case"ellipse":I=_(D,I),se=f(D);break;case"line":I=_(D,I),se=d(D);break;case"defs":B=!0;break;case"use":I=_(D,I);const G=(D.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),z=D.viewportElement.getElementById(G);z?i(z,I):console.warn("SVGLoader: 'use node' references non-existent node id: "+G);break}if(se){I.fill!==void 0&&I.fill!=="none"&&!I.fill.startsWith("url")&&se.color.setStyle(I.fill,Vr),x(se,Se),W.push(se);const C=Object.assign({},I);C.strokeWidth=I.strokeWidth*J(Se),se.userData={node:D,style:C,transform:Se.clone(),gradients:$}}const me=D.childNodes;for(let C=0;C<me.length;C++){const G=me[C];B&&G.nodeName!=="style"&&G.nodeName!=="defs"||i(G,I)}P&&(Z.pop(),Z.length>0?Se.copy(Z[Z.length-1]):Se.identity())}function r(D){const I=new yi,P=new ae,B=new ae,se=new ae;let me=!0,C=!1;const G=D.getAttribute("d");if(G===""||G==="none")return null;const z=G.match(/[a-df-z][^a-df-z]*/ig);for(let K=0,Q=z.length;K<Q;K++){const he=z[K],ge=he.charAt(0),pe=he.slice(1).trim();me===!0&&(C=!0,me=!1);let Y;switch(ge){case"M":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=2)P.x=Y[M+0],P.y=Y[M+1],B.x=P.x,B.y=P.y,M===0?I.moveTo(P.x,P.y):I.lineTo(P.x,P.y),M===0&&se.copy(P);break;case"H":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M++)P.x=Y[M],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),M===0&&C===!0&&se.copy(P);break;case"V":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M++)P.y=Y[M],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),M===0&&C===!0&&se.copy(P);break;case"L":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=2)P.x=Y[M+0],P.y=Y[M+1],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),M===0&&C===!0&&se.copy(P);break;case"C":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=6)I.bezierCurveTo(Y[M+0],Y[M+1],Y[M+2],Y[M+3],Y[M+4],Y[M+5]),B.x=Y[M+2],B.y=Y[M+3],P.x=Y[M+4],P.y=Y[M+5],M===0&&C===!0&&se.copy(P);break;case"S":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=4)I.bezierCurveTo(m(P.x,B.x),m(P.y,B.y),Y[M+0],Y[M+1],Y[M+2],Y[M+3]),B.x=Y[M+0],B.y=Y[M+1],P.x=Y[M+2],P.y=Y[M+3],M===0&&C===!0&&se.copy(P);break;case"Q":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=4)I.quadraticCurveTo(Y[M+0],Y[M+1],Y[M+2],Y[M+3]),B.x=Y[M+0],B.y=Y[M+1],P.x=Y[M+2],P.y=Y[M+3],M===0&&C===!0&&se.copy(P);break;case"T":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=2){const Oe=m(P.x,B.x),L=m(P.y,B.y);I.quadraticCurveTo(Oe,L,Y[M+0],Y[M+1]),B.x=Oe,B.y=L,P.x=Y[M+0],P.y=Y[M+1],M===0&&C===!0&&se.copy(P)}break;case"A":Y=p(pe,[3,4],7);for(let M=0,Pe=Y.length;M<Pe;M+=7){if(Y[M+5]==P.x&&Y[M+6]==P.y)continue;const Oe=P.clone();P.x=Y[M+5],P.y=Y[M+6],B.x=P.x,B.y=P.y,a(I,Y[M],Y[M+1],Y[M+2],Y[M+3],Y[M+4],Oe,P),M===0&&C===!0&&se.copy(P)}break;case"m":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=2)P.x+=Y[M+0],P.y+=Y[M+1],B.x=P.x,B.y=P.y,M===0?I.moveTo(P.x,P.y):I.lineTo(P.x,P.y),M===0&&se.copy(P);break;case"h":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M++)P.x+=Y[M],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),M===0&&C===!0&&se.copy(P);break;case"v":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M++)P.y+=Y[M],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),M===0&&C===!0&&se.copy(P);break;case"l":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=2)P.x+=Y[M+0],P.y+=Y[M+1],B.x=P.x,B.y=P.y,I.lineTo(P.x,P.y),M===0&&C===!0&&se.copy(P);break;case"c":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=6)I.bezierCurveTo(P.x+Y[M+0],P.y+Y[M+1],P.x+Y[M+2],P.y+Y[M+3],P.x+Y[M+4],P.y+Y[M+5]),B.x=P.x+Y[M+2],B.y=P.y+Y[M+3],P.x+=Y[M+4],P.y+=Y[M+5],M===0&&C===!0&&se.copy(P);break;case"s":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=4)I.bezierCurveTo(m(P.x,B.x),m(P.y,B.y),P.x+Y[M+0],P.y+Y[M+1],P.x+Y[M+2],P.y+Y[M+3]),B.x=P.x+Y[M+0],B.y=P.y+Y[M+1],P.x+=Y[M+2],P.y+=Y[M+3],M===0&&C===!0&&se.copy(P);break;case"q":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=4)I.quadraticCurveTo(P.x+Y[M+0],P.y+Y[M+1],P.x+Y[M+2],P.y+Y[M+3]),B.x=P.x+Y[M+0],B.y=P.y+Y[M+1],P.x+=Y[M+2],P.y+=Y[M+3],M===0&&C===!0&&se.copy(P);break;case"t":Y=p(pe);for(let M=0,Pe=Y.length;M<Pe;M+=2){const Oe=m(P.x,B.x),L=m(P.y,B.y);I.quadraticCurveTo(Oe,L,P.x+Y[M+0],P.y+Y[M+1]),B.x=Oe,B.y=L,P.x=P.x+Y[M+0],P.y=P.y+Y[M+1],M===0&&C===!0&&se.copy(P)}break;case"a":Y=p(pe,[3,4],7);for(let M=0,Pe=Y.length;M<Pe;M+=7){if(Y[M+5]==0&&Y[M+6]==0)continue;const Oe=P.clone();P.x+=Y[M+5],P.y+=Y[M+6],B.x=P.x,B.y=P.y,a(I,Y[M],Y[M+1],Y[M+2],Y[M+3],Y[M+4],Oe,P),M===0&&C===!0&&se.copy(P)}break;case"Z":case"z":I.currentPath.autoClose=!0,I.currentPath.curves.length>0&&(P.copy(se),I.currentPath.currentPoint.copy(P),me=!0);break;default:console.warn(he)}C=!1}return I}function s(D){if(!(!D.sheet||!D.sheet.cssRules||!D.sheet.cssRules.length))for(let I=0;I<D.sheet.cssRules.length;I++){const P=D.sheet.cssRules[I];if(P.type!==1)continue;const B=P.selectorText.split(/,/gm).filter(Boolean).map(se=>se.trim());for(let se=0;se<B.length;se++){const me=Object.fromEntries(Object.entries(P.style).filter(([,C])=>C!==""));ee[B[se]]=Object.assign(ee[B[se]]||{},me)}}}function a(D,I,P,B,se,me,C,G){if(I==0||P==0){D.lineTo(G.x,G.y);return}B=B*Math.PI/180,I=Math.abs(I),P=Math.abs(P);const z=(C.x-G.x)/2,K=(C.y-G.y)/2,Q=Math.cos(B)*z+Math.sin(B)*K,he=-Math.sin(B)*z+Math.cos(B)*K;let ge=I*I,pe=P*P;const Y=Q*Q,M=he*he,Pe=Y/ge+M/pe;if(Pe>1){const ue=Math.sqrt(Pe);I=ue*I,P=ue*P,ge=I*I,pe=P*P}const Oe=ge*M+pe*Y,L=(ge*pe-Oe)/Oe;let y=Math.sqrt(Math.max(0,L));se===me&&(y=-y);const q=y*I*he/P,j=-y*P*Q/I,le=Math.cos(B)*q-Math.sin(B)*j+(C.x+G.x)/2,ye=Math.sin(B)*q+Math.cos(B)*j+(C.y+G.y)/2,Me=o(1,0,(Q-q)/I,(he-j)/P),fe=o((Q-q)/I,(he-j)/P,(-Q-q)/I,(-he-j)/P)%(Math.PI*2);D.currentPath.absellipse(le,ye,I,P,Me,Me+fe,me===0,B)}function o(D,I,P,B){const se=D*P+I*B,me=Math.sqrt(D*D+I*I)*Math.sqrt(P*P+B*B);let C=Math.acos(Math.max(-1,Math.min(1,se/me)));return D*B-I*P<0&&(C=-C),C}function l(D){const I=v(D.getAttribute("x")||0),P=v(D.getAttribute("y")||0),B=v(D.getAttribute("rx")||D.getAttribute("ry")||0),se=v(D.getAttribute("ry")||D.getAttribute("rx")||0),me=v(D.getAttribute("width")),C=v(D.getAttribute("height")),G=1-.551915024494,z=new yi;return z.moveTo(I+B,P),z.lineTo(I+me-B,P),(B!==0||se!==0)&&z.bezierCurveTo(I+me-B*G,P,I+me,P+se*G,I+me,P+se),z.lineTo(I+me,P+C-se),(B!==0||se!==0)&&z.bezierCurveTo(I+me,P+C-se*G,I+me-B*G,P+C,I+me-B,P+C),z.lineTo(I+B,P+C),(B!==0||se!==0)&&z.bezierCurveTo(I+B*G,P+C,I,P+C-se*G,I,P+C-se),z.lineTo(I,P+se),(B!==0||se!==0)&&z.bezierCurveTo(I,P+se*G,I+B*G,P,I+B,P),z}function c(D){function I(me,C,G){const z=v(C),K=v(G);se===0?B.moveTo(z,K):B.lineTo(z,K),se++}const P=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,B=new yi;let se=0;return D.getAttribute("points").replace(P,I),B.currentPath.autoClose=!0,B}function h(D){function I(me,C,G){const z=v(C),K=v(G);se===0?B.moveTo(z,K):B.lineTo(z,K),se++}const P=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,B=new yi;let se=0;return D.getAttribute("points").replace(P,I),B.currentPath.autoClose=!1,B}function u(D){const I=v(D.getAttribute("cx")||0),P=v(D.getAttribute("cy")||0),B=v(D.getAttribute("r")||0),se=new vi;se.absarc(I,P,B,0,Math.PI*2);const me=new yi;return me.subPaths.push(se),me}function f(D){const I=v(D.getAttribute("cx")||0),P=v(D.getAttribute("cy")||0),B=v(D.getAttribute("rx")||0),se=v(D.getAttribute("ry")||0),me=new vi;me.absellipse(I,P,B,se,0,Math.PI*2);const C=new yi;return C.subPaths.push(me),C}function d(D){const I=v(D.getAttribute("x1")||0),P=v(D.getAttribute("y1")||0),B=v(D.getAttribute("x2")||0),se=v(D.getAttribute("y2")||0),me=new yi;return me.moveTo(I,P),me.lineTo(B,se),me.currentPath.autoClose=!1,me}function g(D){const I="http://www.w3.org/1999/xlink",P=D.querySelectorAll("linearGradient, radialGradient"),B=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],se={};for(const C of P){const G=C.getAttribute("id");if(!G)continue;const z={type:C.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},K=C.getAttributeNS(I,"href")||C.getAttribute("href")||"";K.startsWith("#")&&(z.href=K.substring(1));for(const he of B)C.hasAttribute(he)&&(z.attrs[he]=C.getAttribute(he));const Q=C.querySelectorAll("stop");if(Q.length>0){z.stops=[];for(const he of Q){let ge=he.getAttribute("stop-color");!ge&&he.style&&(ge=he.style["stop-color"]),ge||(ge="#000");let pe=he.getAttribute("stop-opacity");(pe===null||pe==="")&&he.style&&(pe=he.style["stop-opacity"]),pe=pe===null||pe===""||pe===void 0?1:Math.max(0,Math.min(1,parseFloat(pe)));const Y=Math.max(0,Math.min(1,parseFloat(he.getAttribute("offset")||"0")));z.stops.push({offset:Y,color:ge,opacity:pe})}}se[G]=z}function me(C,G){const z=se[C];if(!z||G.has(C))return z;if(G.add(C),z.href&&se[z.href]){const K=me(z.href,G);if(K){z.stops||(z.stops=K.stops);for(const Q in K.attrs)Q in z.attrs||(z.attrs[Q]=K.attrs[Q])}}return z}for(const C in se)me(C,new Set);for(const C in se){let he=function(ge){return typeof ge!="string"?0:ge.endsWith("%")?parseFloat(ge)/100:v(ge)};const G=se[C],z=G.attrs,K=z.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",Q={type:G.type,gradientUnits:K,spreadMethod:z.spreadMethod==="reflect"||z.spreadMethod==="repeat"?z.spreadMethod:"pad",gradientTransform:null,stops:(G.stops||[]).slice().sort((ge,pe)=>ge.offset-pe.offset)};if(z.gradientTransform&&(Q.gradientTransform=new qe,R(z.gradientTransform,Q.gradientTransform)),G.type==="linearGradient")Q.x1=z.x1!==void 0?he(z.x1):0,Q.y1=z.y1!==void 0?he(z.y1):0,Q.x2=z.x2!==void 0?he(z.x2):K==="objectBoundingBox"?1:0,Q.y2=z.y2!==void 0?he(z.y2):0;else{const ge=K==="objectBoundingBox"?.5:0,pe=K==="objectBoundingBox"?.5:0;Q.cx=z.cx!==void 0?he(z.cx):ge,Q.cy=z.cy!==void 0?he(z.cy):ge,Q.r=z.r!==void 0?he(z.r):pe,Q.fx=z.fx!==void 0?he(z.fx):Q.cx,Q.fy=z.fy!==void 0?he(z.fy):Q.cy}$[C]=Q}}function _(D,I){I=Object.assign({},I);let P={};if(D.hasAttribute("class")){const C=D.getAttribute("class").split(/\s/).filter(Boolean).map(G=>G.trim());for(let G=0;G<C.length;G++)P=Object.assign(P,ee["."+C[G]])}D.hasAttribute("id")&&(P=Object.assign(P,ee["#"+D.getAttribute("id")]));function B(C,G,z){z===void 0&&(z=function(Q){return Q}),D.hasAttribute(C)&&(I[G]=z(D.getAttribute(C))),P[G]&&(I[G]=z(P[G])),D.style&&D.style[C]!==""&&(I[G]=z(D.style[C]))}function se(C){return Math.max(0,Math.min(1,v(C)))}function me(C){return Math.max(0,v(C))}return B("fill","fill"),B("fill-opacity","fillOpacity",se),B("fill-rule","fillRule"),B("opacity","opacity",se),B("stroke","stroke"),B("stroke-opacity","strokeOpacity",se),B("stroke-width","strokeWidth",me),B("stroke-linejoin","strokeLineJoin"),B("stroke-linecap","strokeLineCap"),B("stroke-miterlimit","strokeMiterLimit",me),B("visibility","visibility"),I}function m(D,I){return D-(I-D)}function p(D,I,P){if(typeof D!="string")throw new TypeError("Invalid input: "+typeof D);const B={WHITESPACE:/[ \t\r\n]/,DIGIT:/[\d]/,SIGN:/[-+]/,POINT:/\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},se=0,me=1,C=2,G=3;let z=se,K=!0,Q="",he="";const ge=[];function pe(Oe,L,y){const q=new SyntaxError('Unexpected character "'+Oe+'" at index '+L+".");throw q.partial=y,q}function Y(){Q!==""&&(he===""?ge.push(Number(Q)):ge.push(Number(Q)*Math.pow(10,Number(he)))),Q="",he=""}let M;const Pe=D.length;for(let Oe=0;Oe<Pe;Oe++){if(M=D[Oe],Array.isArray(I)&&I.includes(ge.length%P)&&B.FLAGS.test(M)){z=me,Q=M,Y();continue}if(z===se){if(B.WHITESPACE.test(M))continue;if(B.DIGIT.test(M)||B.SIGN.test(M)){z=me,Q=M;continue}if(B.POINT.test(M)){z=C,Q=M;continue}B.COMMA.test(M)&&(K&&pe(M,Oe,ge),K=!0)}if(z===me){if(B.DIGIT.test(M)){Q+=M;continue}if(B.POINT.test(M)){Q+=M,z=C;continue}if(B.EXP.test(M)){z=G;continue}B.SIGN.test(M)&&Q.length===1&&B.SIGN.test(Q[0])&&pe(M,Oe,ge)}if(z===C){if(B.DIGIT.test(M)){Q+=M;continue}if(B.EXP.test(M)){z=G;continue}B.POINT.test(M)&&Q[Q.length-1]==="."&&pe(M,Oe,ge)}if(z===G){if(B.DIGIT.test(M)){he+=M;continue}if(B.SIGN.test(M)){if(he===""){he+=M;continue}he.length===1&&B.SIGN.test(he)&&pe(M,Oe,ge)}}B.WHITESPACE.test(M)?(Y(),z=se,K=!1):B.COMMA.test(M)?(Y(),z=se,K=!0):B.SIGN.test(M)?(Y(),z=me,Q=M):B.POINT.test(M)?(Y(),z=C,Q=M):pe(M,Oe,ge)}return Y(),ge}const b=["mm","cm","in","pt","pc","px"],w={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function v(D){let I="px";if(typeof D=="string"||D instanceof String)for(let B=0,se=b.length;B<se;B++){const me=b[B];if(D.endsWith(me)){I=me,D=D.substring(0,D.length-me.length);break}}let P;return I==="px"&&t.defaultUnit!=="px"?P=w.in[t.defaultUnit]/t.defaultDPI:(P=w[I][t.defaultUnit],P<0&&(P=w[I].in*t.defaultDPI)),P*parseFloat(D)}function S(D){if(!(D.hasAttribute("transform")||D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))))return null;const I=E(D);return Z.length>0&&I.premultiply(Z[Z.length-1]),Se.copy(I),Z.push(I),I}function E(D){const I=new qe;if(D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))){const P=v(D.getAttribute("x")||0),B=v(D.getAttribute("y")||0);I.makeTranslation(P,B)}return D.hasAttribute("transform")&&R(D.getAttribute("transform"),I),I}function R(D,I){const P=ie,B=D.split(")");for(let se=B.length-1;se>=0;se--){const me=B[se].trim();if(me==="")continue;const C=me.indexOf("("),G=me.length;if(C>0&&C<G){const z=me.slice(0,C),K=p(me.slice(C+1));switch(P.identity(),z){case"translate":if(K.length>=1){const Q=K[0];let he=0;K.length>=2&&(he=K[1]),P.makeTranslation(Q,he)}break;case"rotate":if(K.length>=1){let Q=0,he=0,ge=0;Q=K[0]*Math.PI/180,K.length>=3&&(he=K[1],ge=K[2]),re.makeTranslation(-he,-ge),ce.makeRotation(Q),Re.multiplyMatrices(ce,re),re.makeTranslation(he,ge),P.multiplyMatrices(re,Re)}break;case"scale":if(K.length>=1){const Q=K[0];let he=Q;K.length>=2&&(he=K[1]),P.makeScale(Q,he)}break;case"skewX":K.length===1&&P.set(1,Math.tan(K[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":K.length===1&&P.set(1,0,0,Math.tan(K[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":K.length===6&&P.set(K[0],K[2],K[4],K[1],K[3],K[5],0,0,1);break}I.premultiply(P)}}return I}function x(D,I){function P(C){_e.set(C.x,C.y,1).applyMatrix3(I),C.set(_e.x,_e.y)}function B(C){const G=C.xRadius,z=C.yRadius,K=Math.cos(C.aRotation),Q=Math.sin(C.aRotation),he=new U(G*K,G*Q,0),ge=new U(-z*Q,z*K,0),pe=he.applyMatrix3(I),Y=ge.applyMatrix3(I),M=ie.set(pe.x,Y.x,0,pe.y,Y.y,0,0,0,1),Pe=re.copy(M).invert(),y=ce.copy(Pe).transpose().multiply(Pe).elements,q=k(y[0],y[1],y[4]),j=Math.sqrt(q.rt1),le=Math.sqrt(q.rt2);if(C.xRadius=1/j,C.yRadius=1/le,C.aRotation=Math.atan2(q.sn,q.cs),!((C.aEndAngle-C.aStartAngle)%(2*Math.PI)<Number.EPSILON)){const Me=re.set(j,0,0,0,le,0,0,0,1),fe=ce.set(q.cs,q.sn,0,-q.sn,q.cs,0,0,0,1),ue=Me.multiply(fe).multiply(M),be=He=>{const{x:Ee,y:we}=new U(Math.cos(He),Math.sin(He),0).applyMatrix3(ue);return Math.atan2(we,Ee)};C.aStartAngle=be(C.aStartAngle),C.aEndAngle=be(C.aEndAngle),A(I)&&(C.aClockwise=!C.aClockwise)}}function se(C){const G=H(I),z=O(I);C.xRadius*=G,C.yRadius*=z;const K=G>Number.EPSILON?Math.atan2(I.elements[1],I.elements[0]):Math.atan2(-I.elements[3],I.elements[4]);C.aRotation+=K,A(I)&&(C.aStartAngle*=-1,C.aEndAngle*=-1,C.aClockwise=!C.aClockwise)}const me=D.subPaths;for(let C=0,G=me.length;C<G;C++){const K=me[C].curves;for(let Q=0;Q<K.length;Q++){const he=K[Q];he.isLineCurve?(P(he.v1),P(he.v2)):he.isCubicBezierCurve?(P(he.v0),P(he.v1),P(he.v2),P(he.v3)):he.isQuadraticBezierCurve?(P(he.v0),P(he.v1),P(he.v2)):he.isEllipseCurve&&(xe.set(he.aX,he.aY),P(xe),he.aX=xe.x,he.aY=xe.y,N(I)?B(he):se(he))}}}function A(D){const I=D.elements;return I[0]*I[4]-I[1]*I[3]<0}function N(D){const I=D.elements,P=I[0]*I[3]+I[1]*I[4];if(P===0)return!1;const B=H(D),se=O(D);return Math.abs(P/(B*se))>Number.EPSILON}function H(D){const I=D.elements;return Math.sqrt(I[0]*I[0]+I[1]*I[1])}function O(D){const I=D.elements;return Math.sqrt(I[3]*I[3]+I[4]*I[4])}function J(D){const I=D.elements,P=I[0]*I[4]-I[1]*I[3];return Math.sqrt(Math.abs(P))}function k(D,I,P){let B,se,me,C,G;const z=D+P,K=D-P,Q=Math.sqrt(K*K+4*I*I);return z>0?(B=.5*(z+Q),G=1/B,se=D*G*P-I*G*I):z<0?se=.5*(z-Q):(B=.5*Q,se=-.5*Q),K>0?me=K+Q:me=K-Q,Math.abs(me)>2*Math.abs(I)?(G=-2*I/me,C=1/Math.sqrt(1+G*G),me=G*C):Math.abs(I)===0?(me=1,C=0):(G=-.5*me/I,me=1/Math.sqrt(1+G*G),C=G*me),K>0&&(G=me,me=-C,C=G),{rt1:B,rt2:se,cs:me,sn:C}}const W=[],ee={},$={},Z=[],ie=new qe,re=new qe,ce=new qe,Re=new qe,xe=new ae,_e=new U,Se=new qe,ke=new DOMParser().parseFromString(e,"image/svg+xml");return g(ke),i(ke.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:W,gradients:$,xml:ke.documentElement}}static createFillMaterial(e){const t=e.userData.style;if(t.fill===void 0||t.fill==="none")return null;const i=e.color;let r=null;const s=nf.exec(t.fill);if(s){const o=e.userData.gradients&&e.userData.gradients[s[1]];r=yx(o,e)}const a=new wr({opacity:t.fillOpacity*(t.opacity||1),transparent:!0,side:rn,depthWrite:!1});return r!==null?a.map=r:a.color=i,a}static createStrokeMaterial(e){const t=e.userData.style;return t.stroke===void 0||t.stroke==="none"?null:(nf.test(t.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new wr({color:new Ye().setStyle(t.stroke,Vr),opacity:t.strokeOpacity*(t.opacity||1),transparent:!0,side:rn,depthWrite:!1}))}static createShapes(e){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),e.toShapes()}static getStrokeStyle(e,t,i,r,s){return e=e!==void 0?e:1,t=t!==void 0?t:"#000",i=i!==void 0?i:"miter",r=r!==void 0?r:"butt",s=s!==void 0?s:4,{strokeColor:t,strokeWidth:e,strokeLineJoin:i,strokeLineCap:r,strokeMiterLimit:s}}static pointsToStroke(e,t,i,r){const s=[],a=[],o=[];if(ol.pointsToStrokeWithBuffers(e,t,i,r,s,a,o)===0)return null;const l=new Mt;return l.setAttribute("position",new rt(s,3)),l.setAttribute("normal",new rt(a,3)),l.setAttribute("uv",new rt(o,2)),l}static pointsToStrokeWithBuffers(e,t,i,r,s,a,o,l){const c=new ae,h=new ae,u=new ae,f=new ae,d=new ae,g=new ae,_=new ae,m=new ae,p=new ae,b=new ae,w=new ae,v=new ae,S=new ae,E=new ae,R=new ae,x=new ae,A=new ae;i=i!==void 0?i:12,r=r!==void 0?r:.001,l=l!==void 0?l:0,e=me(e);const N=e.length;if(N<2)return 0;const H=e[0].equals(e[N-1]);let O,J=e[0],k;const W=t.strokeWidth/2,ee=1/(N-1);let $=0,Z,ie,re,ce,Re=!1,xe=0,_e=l*3,Se=l*2;ke(e[0],e[1],c).multiplyScalar(W),m.copy(e[0]).sub(c),p.copy(e[0]).add(c),b.copy(m),w.copy(p);for(let C=1;C<N;C++){O=e[C],C===N-1?H?k=e[1]:k=void 0:k=e[C+1];const G=c;if(ke(J,O,G),u.copy(G).multiplyScalar(W),v.copy(O).sub(u),S.copy(O).add(u),Z=$+ee,ie=!1,k!==void 0){ke(O,k,h),u.copy(h).multiplyScalar(W),E.copy(O).sub(u),R.copy(O).add(u),re=!0,u.subVectors(k,J),G.dot(u)<0&&(re=!1),C===1&&(Re=re),u.subVectors(k,O),u.normalize();const z=Math.abs(G.dot(u));if(z>Number.EPSILON){const K=W/z;u.multiplyScalar(-K),f.subVectors(O,J),d.copy(f).setLength(K).add(u),x.copy(d).negate();const Q=d.length(),he=f.length();f.divideScalar(he),g.subVectors(k,O);const ge=g.length();if(g.divideScalar(ge),f.dot(x)<he&&g.dot(x)<ge&&(ie=!0),A.copy(d).add(O),x.add(O),ie){const pe=re?p:m,Y=(A.x-pe.x)*(x.y-pe.y)-(A.y-pe.y)*(x.x-pe.x);(re&&Y<0||!re&&Y>0)&&x.copy(pe)}switch(ce=!1,ie?re?(R.copy(x),S.copy(x)):(E.copy(x),v.copy(x)):I(),t.strokeLineJoin){case"bevel":P(re,ie,Z);break;case"round":B(re,ie),re?D(O,v,E,Z,0):D(O,R,S,Z,1);break;case"miter":case"miter-clip":default:const pe=W*t.strokeMiterLimit/Q;if(pe<1)if(t.strokeLineJoin!=="miter-clip"){P(re,ie,Z);break}else B(re,ie),re?(g.subVectors(A,v).multiplyScalar(pe).add(v),_.subVectors(A,E).multiplyScalar(pe).add(E),F(v,Z,0),F(g,Z,0),F(O,Z,.5),F(O,Z,.5),F(g,Z,0),F(_,Z,0),F(O,Z,.5),F(_,Z,0),F(E,Z,0)):(g.subVectors(A,S).multiplyScalar(pe).add(S),_.subVectors(A,R).multiplyScalar(pe).add(R),F(S,Z,1),F(g,Z,1),F(O,Z,.5),F(O,Z,.5),F(g,Z,1),F(_,Z,1),F(O,Z,.5),F(_,Z,1),F(R,Z,1));else ie?(re?(F(p,$,1),F(m,$,0),F(A,Z,0),F(p,$,1),F(A,Z,0),F(x,Z,1)):(F(p,$,1),F(m,$,0),F(A,Z,1),F(m,$,0),F(x,Z,0),F(A,Z,1)),re?E.copy(A):R.copy(A)):re?(F(v,Z,0),F(A,Z,0),F(O,Z,.5),F(O,Z,.5),F(A,Z,0),F(E,Z,0)):(F(S,Z,1),F(A,Z,1),F(O,Z,.5),F(O,Z,.5),F(A,Z,1),F(R,Z,1)),ce=!0;break}}else I()}else I();!H&&C===N-1&&se(e[0],b,w,re,!0,$),$=Z,J=O,m.copy(E),p.copy(R)}if(!H)se(O,v,S,re,!1,Z);else if(ie&&s){let C=A,G=x;Re!==re&&(C=x,G=A),re?(ce||Re)&&(G.toArray(s,0),G.toArray(s,9),ce&&C.toArray(s,3)):(ce||!Re)&&(G.toArray(s,3),G.toArray(s,9),ce&&C.toArray(s,0))}if(s){const C=[new ae,new ae,new ae],G=l*3;for(let z=G;z<_e;z+=9)C[0].set(s[z],s[z+1]),C[1].set(s[z+3],s[z+4]),C[2].set(s[z+6],s[z+7]),Jn.area(C)<0&&(s[z+3]=C[0].x,s[z+4]=C[0].y)}return xe;function ke(C,G,z){return z.subVectors(G,C),z.set(-z.y,z.x).normalize()}function F(C,G,z){s&&(s[_e]=C.x,s[_e+1]=C.y,s[_e+2]=0,a&&(a[_e]=0,a[_e+1]=0,a[_e+2]=1),_e+=3,o&&(o[Se]=G,o[Se+1]=z,Se+=2)),xe+=3}function D(C,G,z,K,Q){c.copy(G).sub(C).normalize(),h.copy(z).sub(C).normalize();let he=Math.PI;const ge=c.dot(h);Math.abs(ge)<1&&(he=Math.abs(Math.acos(ge))),he/=i,u.copy(G);for(let pe=0,Y=i-1;pe<Y;pe++)f.copy(u).rotateAround(C,he),F(u,K,Q),F(f,K,Q),F(C,K,.5),u.copy(f);F(u,K,Q),F(z,K,Q),F(C,K,.5)}function I(){F(p,$,1),F(m,$,0),F(v,Z,0),F(p,$,1),F(v,Z,0),F(S,Z,1)}function P(C,G,z){G?C?(F(p,$,1),F(m,$,0),F(v,Z,0),F(p,$,1),F(v,Z,0),F(x,Z,1),F(v,z,0),F(E,z,0),F(x,z,.5)):(F(p,$,1),F(m,$,0),F(S,Z,1),F(m,$,0),F(x,Z,0),F(S,Z,1),F(S,z,1),F(x,z,0),F(R,z,1)):C?(F(v,z,0),F(E,z,0),F(O,z,.5)):(F(S,z,1),F(R,z,0),F(O,z,.5))}function B(C,G){G&&(C?(F(p,$,1),F(m,$,0),F(v,Z,0),F(p,$,1),F(v,Z,0),F(x,Z,1),F(v,$,0),F(O,Z,.5),F(x,Z,1),F(O,Z,.5),F(E,$,0),F(x,Z,1)):(F(p,$,1),F(m,$,0),F(S,Z,1),F(m,$,0),F(x,Z,0),F(S,Z,1),F(S,$,1),F(x,Z,0),F(O,Z,.5),F(O,Z,.5),F(x,Z,0),F(R,$,1)))}function se(C,G,z,K,Q,he){switch(t.strokeLineCap){case"round":Q?D(C,z,G,he,.5):D(C,G,z,he,.5);break;case"square":if(Q)c.subVectors(G,C),h.set(c.y,-c.x),u.addVectors(c,h).add(C),f.subVectors(h,c).add(C),K?(u.toArray(s,3),f.toArray(s,0),f.toArray(s,9)):(u.toArray(s,3),o[7]===1?f.toArray(s,9):u.toArray(s,9),f.toArray(s,0));else{c.subVectors(z,C),h.set(c.y,-c.x),u.addVectors(c,h).add(C),f.subVectors(h,c).add(C);const ge=s.length;K?(u.toArray(s,ge-3),f.toArray(s,ge-6),f.toArray(s,ge-12)):(f.toArray(s,ge-6),u.toArray(s,ge-3),f.toArray(s,ge-12))}break}}function me(C){let G=!1;for(let K=1,Q=C.length-1;K<Q;K++)if(C[K].distanceTo(C[K+1])<r){G=!0;break}if(!G)return C;const z=[];z.push(C[0]);for(let K=1,Q=C.length-1;K<Q;K++)C[K].distanceTo(C[K+1])>=r&&z.push(C[K]);return z.push(C[C.length-1]),z}}}const nf=/^\s*url\(\s*(?:["']\s*)?#([^)'"\s]+)(?:\s*["'])?\s*\)\s*$/;function yx(n,e,t=256){if(!n||!Array.isArray(n.stops)||n.stops.length===0)return null;const i=e.userData.transform,r=n.gradientUnits==="objectBoundingBox";let s=null;if(r&&(s=Mx(e,i),s===null))return null;function a(u,f,d){d.set(u,f,1),n.gradientTransform&&d.applyMatrix3(n.gradientTransform),r&&d.set(s.minX+d.x*s.width,s.minY+d.y*s.height,1),i&&d.applyMatrix3(i)}const o=document.createElement("canvas");let l;if(n.type==="linearGradient"){o.width=t,o.height=1;const u=o.getContext("2d"),f=u.createLinearGradient(0,0,t,0);rf(f,n.stops),u.fillStyle=f,u.fillRect(0,0,t,1);const d=new U,g=new U;a(n.x1,n.y1,d),a(n.x2,n.y2,g);const _=g.x-d.x,m=g.y-d.y,p=_*_+m*m||1e-20,b=_/p,w=m/p,v=-(b*d.x+w*d.y);l=new qe().set(b,w,v,0,0,.5,0,0,1)}else{let u=n.cx,f=n.cy,d=n.fx,g=n.fy,_=n.r;if(n.gradientTransform){const x=new U;x.set(u,f,1).applyMatrix3(n.gradientTransform),u=x.x,f=x.y,x.set(d,g,1).applyMatrix3(n.gradientTransform),d=x.x,g=x.y}if(r&&(u=s.minX+u*s.width,f=s.minY+f*s.height,d=s.minX+d*s.width,g=s.minY+g*s.height,_=_*Math.sqrt((s.width*s.width+s.height*s.height)/2)),_<=0)return null;o.width=t,o.height=t;const m=o.getContext("2d"),p=u-_,b=f-_,w=2*_,v=t/w;m.setTransform(v,0,0,v,-p*v,-b*v);const S=m.createRadialGradient(d,g,0,u,f,_);rf(S,n.stops),m.fillStyle=S,m.fillRect(p,b,w,w);const E=i?i.clone().invert():new qe;l=new qe().set(1/w,0,-p/w,0,1/w,-b/w,0,0,1).multiply(E)}const c=new Io(o);c.colorSpace=Vr,c.flipY=!1,c.matrixAutoUpdate=!1,c.matrix=l;const h=n.spreadMethod==="reflect"?es:n.spreadMethod==="repeat"?jr:bn;return c.wrapS=h,c.wrapT=h,c}function Mx(n,e){const t=e?e.clone().invert():null,i=new ae,r=new nh;for(const s of n.subPaths)for(const a of s.getPoints())i.copy(a),t&&i.applyMatrix3(t),r.expandByPoint(i);return r.isEmpty()?null:{minX:r.min.x,minY:r.min.y,width:r.max.x-r.min.x,height:r.max.y-r.min.y}}function rf(n,e){const t=new Ye;for(const i of e){let r=i.color;if(i.opacity<1){t.setStyle(i.color,Vr);const s=/rgb\(([^)]+)\)/.exec(t.getStyle(Vr));s&&(r=`rgba(${s[1]},${i.opacity})`)}n.addColorStop(Math.max(0,Math.min(1,i.offset)),r)}}const ll={width:64,height:64},sf="M32.3 17.92q.54-.07 1.03.17c.42.21.65.58.73.96q.1.54-.1 1.02l-.18.74a13 13 0 0 1 7.57 3.76l.1.11q3.79-.23 7.58.01l1 .09q3.45.33 5.44 1.22c1.52.68 2.48 1.67 2.62 3 .15 1.48-.71 3.05-2.3 4.63a28 28 0 0 1-5.93 4.31A53 53 0 0 1 43 41.2v.01l-.03.01q-.72 1.09-1.63 2.01a12.9 12.9 0 0 1-16.19 1.83c-2.67.28-5.55.5-8.23.5h-.08c-2.8 0-5.12-.23-6.85-.7-2.08-.56-3.51-1.53-3.95-3q-.43-1.5.43-3.05l.11-.2c.6-.98 1.53-1.9 2.6-2.75 1.17-.9 2.52-1.73 3.88-2.46a42 42 0 0 1 6.44-2.8 13 13 0 0 1 4-6.59l-.58-.41v-.01h-.01a1.7 1.7 0 0 1-.66-1.67c.06-.44.3-.75.62-.94.3-.18.65-.24.96-.22h.09l1.95.3.6-1.52c.02-.07.1-.27.27-.48s.46-.48.89-.54h.01a1.5 1.5 0 0 1 1.24.4l.93.83 1.52-1.38q.41-.37.97-.44m7.33 24.48a48 48 0 0 1-6.28 1.54c-1.3.22-3 .48-4.95.73a11.1 11.1 0 0 0 11.23-2.27m9.28-15.92q-3.01-.2-6.02-.07.51.75.92 1.59c1.08.1 1.94.47 2.25 1.32.25.68-.01 1.36-.29 1.84-.22.39-.5.72-.72.96v.01l-.18.18-.14.13-.2.21-.72.76v-.06l-.37.34-.01-.05c-2.28 1.84-5.57 3.37-9.46 4.4a36 36 0 0 1-11.83 1.23l.01.02-.43-.06v.02l-.5-.09.02.04-.7-.15h-.01l-.2-.05-.15-.03-.1-.02q-.9-.22-1.5-.59a2 2 0 0 1-.82-.98l-.05-.18c-.14-.69.2-1.28.54-1.69.26-.3.56-.55.8-.73q-.03-1.08.06-2.16a40 40 0 0 0-4.36 1.9l-.7.37c-4.03 2.14-5.5 3.82-6.02 4.78-.36.65-.42 1.19-.28 1.67l.06.17c.19.41.66.92 1.85 1.36 1.36.5 3.6.88 7.19.88h.08c2.36 0 4.9-.17 7.3-.4l.03-.01.57-.06.19-.02.3-.03h.1c3.02-.34 5.77-.75 7.63-1.05l1.14-.22a47 47 0 0 0 7.6-2.2v-.01l.17-.06.4-.16.18-.07.55-.22 1.25-.54v.01q2.38-1.05 4.65-2.32a27 27 0 0 0 5.56-4.02c1.34-1.34 1.85-2.43 1.77-3.19-.06-.6-.62-1.23-2.13-1.77a21 21 0 0 0-5.28-.93m-14.95-3.06c.33.38.42.99.34 1.51-.06.45-.33.75-.6.94a2 2 0 0 1-.8.3h-.09l-3 .13-2.3 1.44h-.02q-.46.27-1 .26a3 3 0 0 1-.5-.05c-.4-.1-.66-.34-.83-.6-.15-.23-.23-.5-.25-.7v-.08l-.03-1.41a11.6 11.6 0 0 0-3.73 6.2c-.45 1.99-.36 4.06.25 6q.34.06.75.1c3.17.33 7.42-.1 11.37-1.14 4.25-1.14 7.62-2.85 9.61-4.8q-.19-.9-.51-1.77h-.04l-.12-.33-.09-.25a11 11 0 0 0-1.87-2.88l-.03-.04-.02-.02-.83-.84a11 11 0 0 0-6.21-2.82zm-3.72-1.64-.1.09h-.01l-.31.29-.2-.19-.2-.16-1.42-1.3-.67 1.74-.13.36-.02.05-.15.38-.3-.05h-.01l-.15-.02-1.78-.27.49.34.52.37.15.1.49.35.2.15.01.25.03 1.87 2.47-1.54.11-.07.13-.01 3.08-.14-.9-1.4-.12-.18.05-.21.19-.72.04-.17.09-.36.06-.25v-.01l.1-.39.17-.64z",Wr=256,$s=Math.SQRT2,af=[[-1,-1,$s],[0,-1,1],[1,-1,$s],[-1,0,1],[1,0,1],[-1,1,$s],[0,1,1],[1,1,$s]];class Sx{constructor(){this.indices=[],this.keys=[]}get size(){return this.indices.length}push(e,t){let i=this.indices.length;for(this.indices.push(e),this.keys.push(t);i>0;){const r=i-1>>1;if((this.keys[r]??0)<=t)break;this.swap(i,r),i=r}}pop(){const e=this.indices[0]??0,t=this.keys[0]??0,i=this.indices.pop()??0,r=this.keys.pop()??0;if(this.indices.length>0){this.indices[0]=i,this.keys[0]=r;let s=0;for(;;){const a=s*2+1,o=a+1;let l=s;if(a<this.keys.length&&(this.keys[a]??0)<(this.keys[l]??0)&&(l=a),o<this.keys.length&&(this.keys[o]??0)<(this.keys[l]??0)&&(l=o),l===s)break;this.swap(s,l),s=l}}return{index:e,key:t}}swap(e,t){const i=this.indices[e]??0,r=this.keys[e]??0;this.indices[e]=this.indices[t]??0,this.keys[e]=this.keys[t]??0,this.indices[t]=i,this.keys[t]=r}}function bx(n,e){let t=e,i=-1;for(let o=0;o<n.length;o+=1){if(n[o]===0)continue;const l=o%e;t=Math.min(t,l),i=Math.max(i,l)}if(i<0)return-1;const r=(t+i)/2,s=Math.max(1,(i-t)*.12);let a=-1;for(let o=0;o<n.length;o+=1)n[o]===0||Math.abs(o%e-r)>s||(a<0||Math.floor(o/e)>Math.floor(a/e))&&(a=o);return a}function wx(n,e,t){const i=new Float32Array(e*e).fill(1/0);if(t<0||n[t]===0)return i.fill(1);const r=new Sx;for(i[t]=0,r.push(t,0);r.size>0;){const{index:o,key:l}=r.pop();if(l>(i[o]??1/0))continue;const c=o%e,h=Math.floor(o/e);for(const[u,f,d]of af){const g=c+u,_=h+f;if(g<0||_<0||g>=e||_>=e)continue;const m=_*e+g;if(n[m]===0)continue;const p=l+d;p<(i[m]??1/0)&&(i[m]=p,r.push(m,p))}}let s=0;for(const o of i)Number.isFinite(o)&&(s=Math.max(s,o));const a=new Float32Array(e*e).fill(-1);for(let o=0;o<a.length;o+=1){const l=i[o]??1/0;n[o]!==0&&(a[o]=Number.isFinite(l)&&s>0?l/s:1)}for(let o=0;o<4;o+=1){const l=a.slice();for(let c=0;c<a.length;c+=1){if((a[c]??0)>=0)continue;const h=c%e,u=Math.floor(c/e);let f=1/0;for(const[d,g]of af){const _=h+d,m=u+g;if(_<0||m<0||_>=e||m>=e)continue;const p=a[m*e+_]??-1;p>=0&&(f=Math.min(f,p))}Number.isFinite(f)&&(l[c]=f)}a.set(l)}for(let o=0;o<a.length;o+=1)(a[o]??0)<0&&(a[o]=1);return a}function Ex(n){const e=document.createElement("canvas");e.width=n,e.height=n;const t=e.getContext("2d",{willReadFrequently:!0});if(t===null)throw new Error("splash: mark raster canvas is unavailable");t.scale(n/ll.width,n/ll.height),t.fill(new Path2D(sf));const i=t.getImageData(0,0,n,n).data,r=new Uint8Array(n*n);for(let s=0;s<r.length;s+=1)r[s]=(i[s*4+3]??0)>96?1:0;return r}function Tx(n,e){const t=new Uint8Array(n.length);for(let r=0;r<n.length;r+=1)t[r]=Math.round(Math.min(1,Math.max(0,n[r]??1))*255);const i=new Lo(t,e,e,ns,Kt);return i.magFilter=Pt,i.minFilter=Pt,i.generateMipmaps=!1,i.needsUpdate=!0,i}function Ax(n){var u,f;const{width:e,height:t}=ll,r=new ol().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${e} ${t}"><path d="${sf}"/></svg>`).paths.flatMap(d=>d.toShapes().map(g=>new Zi(g,{depth:.9,bevelEnabled:!0,bevelSegments:5,bevelSize:.22,bevelThickness:.38,curveSegments:14}))),s=Si(r,!1);for(const d of r)d.dispose();const a=s.getAttribute("position"),o=new Float32Array(a.count*2);for(let d=0;d<a.count;d+=1)o[d*2]=a.getX(d)/e,o[d*2+1]=a.getY(d)/t;s.setAttribute("aMarkUv",new Zt(o,2)),s.computeBoundingBox();const l=new U,c=new U;(u=s.boundingBox)==null||u.getCenter(l),(f=s.boundingBox)==null||f.getSize(c),s.translate(-l.x,-l.y,-l.z),s.rotateX(Math.PI);const h=n/c.x;return s.scale(h,h,h),s.computeBoundingBox(),{geometry:s,project:(d,g,_)=>new U((d*e-l.x)*h,-(g*t-l.y)*h,_)}}function Rx(n,e,t,i,r){const s=[];for(let a=0;a<n.length;a+=1)n[a]!==0&&s.push(a);return s.length===0?[]:Array.from({length:i},()=>{const a=s[Math.floor(r()*s.length)]??0;return{u:(a%t+.5)/t,v:(Math.floor(a/t)+.5)/t,travel:e[a]??1}})}function Cx(n,e,t,i){const r=Math.min(1,Math.max(0,n/i));let s=0,a=1;for(let o=0;o<24;o+=1){const l=(s+a)/2;l*l*(3-2*l)<r?s=l:a=l}return e+(s+a)/2*t}const of=2*Math.PI/3/jn.twist.height,ti=[1.7,.07,.05];function ir(n,e,t){const i=Math.min(1,Math.max(0,(t-n)/(e-n)));return i*i*(3-2*i)}function $e(n,e,t=0){n.hasAttribute("uv")&&n.deleteAttribute("uv");const i=n.getAttribute("position").count,r=new Float32Array(i*4);for(let s=0;s<i;s+=1)r.set([e[0],e[1],e[2],t],s*4);return n.setAttribute("aGlow",new Zt(r,4)),n}function Ti(n){const e=Si(n,!1);for(const t of n)t.dispose();return e}function cl(n,e,t,i,r){const s=e.clone().sub(n),a=new mt(i,t,s.length(),r);a.applyQuaternion(new Fn().setFromUnitVectors(new U(0,1,0),s.clone().normalize()));const o=n.clone().add(e).multiplyScalar(.5);return a.translate(o.x,o.y,o.z),a}function lf(n,e,t,i){return Array.from({length:i+1},(r,s)=>{const a=s/i,o=1-a;return new ae(o*o*n.x+2*o*a*e.x+a*a*t.x,o*o*n.y+2*o*a*e.y+a*a*t.y)})}function ni(n,e,t){return Array.from({length:t+1},(i,r)=>n.clone().lerp(e,r/t))}function Js(n,e){return n.map(t=>new U(t.x,t.y,typeof e=="number"?e:e(t.y)))}function Px(){const{height:n}=jn.pearl,e=[],t=(a,o,l,c)=>{e.push(new _i(c,56,32).translate(a,o,l))};t(0,63,0,17);for(let a=0;a<5;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6;t(Math.cos(o)*6.2,94+a*14,Math.sin(o)*6.2,4.3)}t(0,179,0,15.3),t(0,233,0,5.6);const i=[];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6,l=Math.cos(o)*6.2,c=Math.sin(o)*6.2;i.push(new mt(3,3,182,24).translate(l,91,c));const h=o+Math.PI/3;i.push(cl(new U(Math.cos(h)*24,0,Math.sin(h)*24),new U(Math.cos(h)*6,50,Math.sin(h)*6),2.9,2.3,20))}i.push(new mt(4.2,4.6,54,28).translate(0,206,0));const r=[[238,262,2.6,2.2],[262,288,1.6,1.3],[288,306,.9,.6],[306,n,.35,.08]];for(const[a,o,l,c]of r)i.push(new mt(c,l,o-a,16).translate(0,(a+o)/2,0)),i.push(new mt(l+.6,l+.6,.7,20).translate(0,a+.35,0));const s=[{offset:[0,n+.4,0],color:ti,radius:.9,kind:0,trail:0}];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3);s.push({offset:[Math.cos(o)*1.9,288.6,Math.sin(o)*1.9],color:ti,radius:.6,kind:0,trail:0}),s.push({offset:[Math.cos(o)*3.4,262.6,Math.sin(o)*3.4],color:ti,radius:.6,kind:0,trail:0})}return{surfaces:[{defines:["PEARL_SPHERE"],geometry:Ti(e)},{defines:["PEARL_COLUMN"],geometry:Ti(i)}],outlines:[],lights:s}}function Lx(){const{height:n}=jn.gate,e=30,t=new qi;t.moveTo(-48,0),t.lineTo(-17,0),t.lineTo(-17,150),t.absellipse(0,150,17,38,Math.PI,0,!0,0),t.lineTo(17,0),t.lineTo(48,0),t.quadraticCurveTo(47,150,40,n),t.lineTo(-40,n),t.quadraticCurveTo(-47,150,-48,0);const i=new Zi(t,{depth:e,bevelEnabled:!1,curveSegments:32,steps:1});i.translate(0,0,-e/2);const r=e/2+.3,s=[...ni(new ae(-17,0),new ae(-17,150),30),...Array.from({length:41},(o,l)=>{const c=Math.PI-l/40*Math.PI;return new ae(Math.cos(c)*17,150+Math.sin(c)*38)}),...ni(new ae(17,150),new ae(17,0),30)],a=[...lf(new ae(-48,0),new ae(-47,150),new ae(-40,n),40),...ni(new ae(-40,n),new ae(40,n),30),...lf(new ae(40,n),new ae(47,150),new ae(48,0),40)];return{surfaces:[{defines:["PLANAR","DIAGRID"],geometry:i}],outlines:[{color:[2.2,.1,.07],radius:.55,points:Js(s,r)},{color:[.2,1,1.5],radius:.32,points:Js(a,r)}],lights:[{offset:[-38,n+.6,0],color:ti,radius:.9,kind:0,trail:0},{offset:[38,n+.6,0],color:ti,radius:.9,kind:0,trail:0}]}}function Ix(){const{height:n,radius:e}=jn.twist,t=90,i=132,r=[],s=[],a=f=>{const d=f/t*n,g=e*(1-.42*(d/n)**1.2);for(let _=0;_<i;_+=1){const m=_/i*Math.PI*2,p=g*(1+.085*Math.cos(3*(m-of*d)));r.push(Math.cos(m)*p,d,Math.sin(m)*p)}};for(let f=0;f<=t;f+=1)a(f);for(let f=0;f<t;f+=1)for(let d=0;d<i;d+=1){const g=f*i+d,_=f*i+(d+1)%i;s.push(g,g+i,_,_,g+i,_+i)}const o=r.length/3;a(t);const l=r.length/3;r.push(0,n,0);for(let f=0;f<i;f+=1)s.push(l,o+(f+1)%i,o+f);const c=new Mt;c.setAttribute("position",new rt(r,3)),c.setIndex(s),c.computeVertexNormals();const h=e*.58,u=Array.from({length:97},(f,d)=>{const g=d/96*Math.PI*2;return new U(Math.cos(g)*(h+.6),n-1.2,Math.sin(g)*(h+.6))});return{surfaces:[{defines:["TWIST"],geometry:c},{defines:["PEARL_COLUMN"],geometry:new mt(.25,1.1,26,12).translate(0,n+13,0)}],outlines:[{color:[2,.1,.07],radius:.5,points:u}],lights:[{offset:[0,n+26.4,0],color:ti,radius:.9,kind:0,trail:0}]}}function Dx(){const{height:n}=jn.opener,e=52,t=.72,i=new qi;i.moveTo(-26,0),i.lineTo(26,0),i.lineTo(19,n),i.lineTo(-19,n),i.closePath();const r=new vi;r.moveTo(-15,268),r.lineTo(15,268),r.lineTo(12,302),r.lineTo(-12,302),r.closePath(),i.holes.push(r);const s=new Zi(i,{depth:e,bevelEnabled:!1,steps:1});s.translate(0,0,-e/2);const a=s.getAttribute("position");for(let c=0;c<a.count;c+=1)a.setZ(c,a.getZ(c)*(1-t*a.getY(c)/n));s.computeVertexNormals();const o=c=>e/2*(1-t*c/n)+.3,l=[...ni(new ae(-15,268),new ae(15,268),20),...ni(new ae(15,268),new ae(12,302),16),...ni(new ae(12,302),new ae(-12,302),20),...ni(new ae(-12,302),new ae(-15,268),16)];return{surfaces:[{defines:["PLANAR"],geometry:s}],outlines:[{color:[2.1,.32,.08],radius:.45,points:Js(l,o)},{color:[.2,1,1.5],radius:.3,points:Js(ni(new ae(-19,n),new ae(19,n),30),o)}],lights:[{offset:[-18,n+.6,0],color:ti,radius:.9,kind:0,trail:0},{offset:[18,n+.6,0],color:ti,radius:.9,kind:0,trail:0}]}}const Nx=[{offset:[-.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[0,.12,-2.26],color:[1.6,.06,.04],radius:.2,kind:2,trail:1.1},{offset:[-1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[0,-.6,-.5],color:[.06,.32,.6],radius:1.3,kind:0,trail:0}],Ux=[{offset:[-1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[-1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[0,-2,-1.2],color:[.7,.28,.06],radius:1.6,kind:0,trail:0}];function Fx(){const n=new Fe(1.9,.62,4.4,8,4,18);n.deleteAttribute("normal"),n.deleteAttribute("uv");const e=Uh(n);n.dispose();const t=e.getAttribute("position");for(let s=0;s<t.count;s+=1){const a=t.getX(s),o=t.getY(s),c=(t.getZ(s)+2.2)/4.4,h=ir(.55,1,c),u=ir(.25,0,c),f=1-.16*(o/.31)**2;t.setX(s,a*f*(1-.42*h-.12*u)),t.setY(s,(o>0?o*(1-.55*h):o*(1-.3*h))-.05*h)}e.computeVertexNormals();const i=[$e(e,[0,0,0])],r=new _i(1,28,14,0,Math.PI*2,0,Math.PI/2).scale(.62,.36,1.25).translate(0,.27,.25);i.push($e(r,[.012,.045,.07],1)),i.push($e(new Nr(1,.045,6,28,Math.PI).scale(.63,.37,1).translate(0,.27,.25),[0,0,0]));for(const s of[-1,1]){const a=(o,l,c)=>new mt(o,o,l,20).rotateX(Math.PI/2).translate(s*1.12,-.06,c);i.push($e(new mt(.33,.29,1.7,20).rotateX(Math.PI/2).translate(s*1.12,-.06,-.8),[0,0,0])),i.push($e(a(.36,.1,.06),[.9,0,0],2)),i.push($e(a(.22,.02,.12),[.01,.015,.02])),i.push($e(a(.31,.08,-1.62),[0,0,0])),i.push($e(a(.24,.05,-1.68),[.35,1.6,2.4])),i.push($e(new Fe(.5,.03,1.2).translate(s*1.12,-.37,-.8),[.1,.6,1])),i.push($e(new Fe(.42,.07,.05).translate(s*.5,-.02,2.17),[3,2.9,2.7])),i.push($e(new Fe(.06,.5,.7).rotateZ(s*.35).translate(s*.45,.45,-1.8),[0,0,0])),i.push($e(new Fe(.06,.05,2.2).translate(s*.55,-.335,-.1),[0,0,0])),i.push($e(new Fe(.05,.12,.45).translate(s*.8,0,1),[.01,.012,.015])),i.push($e(new Fe(.03,.025,1.8).translate(s*.925,-.1,-.5),[1.5,0,0],2))}return i.push($e(new Fe(1.4,.06,.04).translate(0,.12,-2.21),[2.8,.12,.08])),i.push($e(new mt(.012,.02,.35,6).translate(.2,.47,-1.5),[0,0,0])),Ti(i)}function Ox(){const n=[$e(new Fe(3.4,2,2.6).translate(0,.1,4),[0,0,0]),$e(new Fe(3,.7,.05).translate(0,.55,5.32),[.01,.03,.04],1),$e(new Fe(3.6,2.6,7.6).translate(0,.2,-1.3),[0,0,0])];for(let e=0;e<7;e+=1)n.push($e(new Fe(3.72,2.7,.12).translate(0,.2,-4.7+e*1.13),[0,0,0]));for(const e of[-1,1]){for(const t of[-1,1])n.push($e(new mt(.5,.42,.7,16).translate(e*1.55,-1.45,-1.3+t*3),[0,0,0])),n.push($e(new mt(.36,.36,.05,16).translate(e*1.55,-1.82,-1.3+t*3),[2.4,.9,.2])),n.push($e(new Fe(.16,.16,.16).translate(e*1.85,1.3,t>0?4.8:-5),[2.6,1.3,.2]));n.push($e(new Fe(.6,.16,.05).translate(e*1.1,-.3,5.32),[3,2.9,2.7])),n.push($e(new Fe(.5,.18,.05).translate(e*1.4,.4,-5.12),[2.8,.12,.08])),n.push($e(new Fe(.07,.74,.08).translate(e*.5,.55,5.34),[0,0,0])),n.push($e(new Fe(.12,.12,7.4).translate(e*1.6,1.56,-1.3),[0,0,0])),n.push($e(new Fe(.04,.05,6.8).translate(e*1.87,-.95,-1.3),[1.3,0,0],2))}return Ti(n)}const zx=[{offset:[-.6,.66,2.27],color:[1.5,1.45,1.35],radius:.12,kind:1,trail:.5},{offset:[.6,.66,2.27],color:[1.5,1.45,1.35],radius:.12,kind:1,trail:.5},{offset:[-.62,.8,-2.27],color:[1.5,.05,.04],radius:.11,kind:2,trail:.9},{offset:[.62,.8,-2.27],color:[1.5,.05,.04],radius:.11,kind:2,trail:.9}],cf={radius:.33,width:.22,track:.8,base:1.38,arch:.45};function hf(n,e,t,i){const r=new Zi(n,{depth:e-2*t,bevelEnabled:!0,bevelThickness:t,bevelSize:t*.7,bevelSegments:4,curveSegments:16});r.deleteAttribute("uv"),r.rotateY(-Math.PI/2).translate(e/2-t,0,0);const s=r.getAttribute("position");for(let l=0;l<s.count;l+=1)s.setX(l,s.getX(l)*i(s.getY(l),s.getZ(l)));const a=xv(r,40*Math.PI/180),o=Uh(a);return r.dispose(),a.dispose(),o}function Bx(){const{radius:n,width:e}=cf,t=e/2,i=[[n*.62,-t],[n-.03,-t],[n,-t+.035],[n,t-.035],[n-.03,t],[n*.62,t]].map(([r,s])=>new ae(r,s));return new Go(i,28).rotateZ(Math.PI/2)}function kx(){const{radius:n,width:e,track:t,base:i,arch:r}=cf,s=new qi;s.moveTo(2.1,.3),s.quadraticCurveTo(2.22,.33,2.21,.5),s.quadraticCurveTo(2.2,.69,2.05,.75),s.lineTo(1.02,.87),s.lineTo(-1.3,.92),s.quadraticCurveTo(-1.98,.93,-2.12,.84),s.quadraticCurveTo(-2.22,.76,-2.2,.52),s.quadraticCurveTo(-2.19,.33,-2.08,.3),s.lineTo(-i-r,.3),s.absarc(-i,.3,r,Math.PI,0,!0),s.lineTo(i-r,.3),s.absarc(i,.3,r,Math.PI,0,!0),s.lineTo(2.1,.3);const a=hf(s,1.8,.07,(f,d)=>(1-.07*ir(.55,.98,f))*(1-.05*ir(1.6,2.27,Math.abs(d)))),o=new qi;o.moveTo(1.02,.84),o.lineTo(.14,1.34),o.quadraticCurveTo(-.12,1.42,-.55,1.42),o.lineTo(-.9,1.4),o.quadraticCurveTo(-1.2,1.36,-1.58,.88),o.lineTo(1.02,.84);const l=hf(o,1.52,.05,f=>1-.16*ir(.9,1.42,f)),c=f=>$e(f,[0,0,0],3),h=f=>$e(f,[0,0,0],4),u=[$e(a,[0,0,0]),$e(l,[.004,.006,.008],1),c(new Fe(1,.15,.06).translate(0,.43,2.24)),c(new Fe(.72,.05,.05).translate(0,.62,2.22)),c(new Fe(1.7,.1,.06).translate(0,.38,-2.22)),$e(new Fe(1.5,.04,.04).translate(0,.83,-2.18),[1.6,.05,.03]),$e(new Fe(.42,.1,.02).translate(0,.55,-2.255),[.4,.38,.32])];for(const f of[-1,1]){for(const g of[-1,1]){u.push(c(Bx().translate(f*t,n,g*i)));const _=new mt(n*.66,n*.66,e+.006,28,1).rotateZ(Math.PI/2);u.push(h(_.translate(f*t,n,g*i)))}u.push($e(new Fe(.42,.06,.07).translate(f*.6,.66,2.2),[2.6,2.5,2.3])),u.push($e(new Fe(.34,.08,.06).translate(f*.63,.79,-2.19),[2.2,.06,.04]));const d=(g,_,m)=>new U(f*g,_,m);u.push($e(cl(d(.74,.88,1),d(.63,1.35,.13),.04,.035,8),[0,0,0])),u.push($e(cl(d(.66,1.39,-.92),d(.75,.92,-1.5),.05,.07,8),[0,0,0])),u.push(c(new Fe(.03,.54,.07).rotateZ(f*.227).translate(f*.71,1.16,-.28))),u.push(h(new Fe(.02,.02,2.4).translate(f*.765,.905,-.27))),u.push(c(new Fe(.03,.07,1.74).translate(f*.89,.31,0))),u.push($e(new Fe(.16,.09,.11).translate(f*.94,.99,.8),[0,0,0])),u.push(c(new Fe(.1,.03,.05).translate(f*.86,.95,.82)));for(const g of[.1,-.88])u.push(h(new Fe(.02,.025,.13).translate(f*.88,.8,g)))}return Ti(u)}const Hx=[{offset:[-10.6,4.2,0],color:[1.6,.07,.05],radius:.4,kind:0,trail:0},{offset:[-10.6,-4.2,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[-10.6,0,4.2],color:[.1,1.2,.8],radius:.35,kind:0,trail:0},{offset:[-10.6,0,-4.2],color:[1.6,.07,.05],radius:.35,kind:0,trail:0},{offset:[11.9,0,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[0,-6,0],color:[1,.7,.45],radius:.9,kind:0,trail:0}],ln={y:.4,z:4.9,width:13,height:4.4};function Gx(n,e){const t=n/2,i=[$e(new _i(1,48,24).scale(t,e,e),[0,0,0])],r=e*.55,s=[[r,0,.16,3.4],[-r,0,.16,3.4],[0,r,3.4,.16],[0,-r,3.4,.16]];for(const[o,l,c,h]of s)i.push($e(new Fe(2.8,h,c).translate(-t+1.6,o,l),[0,0,0]));i.push($e(new Fe(5.2,1.4,2).translate(0,-e-.55,0),[0,0,0])),i.push($e(new Fe(4.6,.42,2.06).translate(0,-e-.4,0),[1.4,.95,.55]));const a=new Fe(ln.width+.5,ln.height+.5,.3);return i.push($e(a.translate(0,ln.y,ln.z-.2),[0,0,0])),i.push($e(new Fe(.3,.3,1.6).translate(-4,ln.y,ln.z-1.1),[0,0,0])),i.push($e(new Fe(.3,.3,1.6).translate(4,ln.y,ln.z-1.1),[0,0,0])),Ti(i)}function Vx(){const n=(wi.cars*(wi.carLength+wi.gap)-wi.gap)/2;return[-.9,.9].flatMap(e=>[{offset:[n+.2,-.6,e],color:[1.7,1.6,1.45],radius:.3,kind:0,trail:0},{offset:[-n-.2,-.6,e],color:[1.6,.06,.04],radius:.28,kind:0,trail:0}])}function Wx(){const{cars:n,carLength:e,gap:t}=wi,i=[];for(let r=0;r<n;r+=1){const s=(r-(n-1)/2)*(e+t),a=new Fe(e,3.3,3.4,12,2,2),o=r===n-1?1:r===0?-1:0;if(o!==0){const l=a.getAttribute("position");for(let c=0;c<l.count;c+=1){const h=ir(e/2-6,e/2,l.getX(c)*o);l.getY(c)>0&&l.setY(c,l.getY(c)*(1-.75*h)),l.setZ(c,l.getZ(c)*(1-.35*h))}a.computeVertexNormals()}i.push($e(a.translate(s,0,0),[0,0,0]));for(const l of[-1,1]){const c=new Fe(e-(o===0?2:7),.8,.04);i.push($e(c.translate(s-o*2.5,.35,l*1.72),[1.6,1.15,.7])),i.push($e(new Fe(e-1,.05,.12).translate(s,1.62,l*1.3),[.8,.05,.04]))}i.push($e(new Fe(e-1,.06,2.8).translate(s,-1.68,0),[.2,1.2,1.8]))}return Ti(i)}const Qs='"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',js='"Montserrat", "Segoe UI", "Helvetica Neue", sans-serif',hl={tube:"#ff2d3c",core:"#ffb8b0",panel:"#16060a"},fl={tube:"#22c8ff",core:"#b6eeff",panel:"#03111b"},ea={tube:"#ff4c9e",core:"#ffc0db",panel:"#150613"},ul={tube:"#ffa526",core:"#ffd99a",panel:"#150d03"},dl={tube:"#2ef0c0",core:"#b4f7e2",panel:"#031410"},pl={tube:"#a77dff",core:"#dacbff",panel:"#0c0717"},ff=[{glyphs:"投流加热",caption:"PAID BOOST",ink:ul},{glyphs:"相似达人",caption:"LOOKALIKE",ink:dl},{glyphs:"粉丝增长",caption:"GROWTH",ink:hl},{glyphs:"竞品监测",caption:"COMPETITORS",ink:hl},{glyphs:"达人报价",caption:"RATE CARD",ink:dl},{glyphs:"档期日历",caption:"SCHEDULE",ink:ul},{glyphs:"达人管理",caption:"CREATOR CRM",ink:fl},{glyphs:"数据复盘",caption:"RECAP",ink:fl},{glyphs:"脚本审核",caption:"SCRIPT REVIEW",ink:pl},{glyphs:"爆款追踪",caption:"TRENDING",ink:pl},{glyphs:"达人画像",caption:"PROFILE",ink:fl},{glyphs:"品牌安全",caption:"BRAND SAFETY",ink:dl},{glyphs:"矩阵分发",caption:"DISTRIBUTION",ink:pl},{glyphs:"种草投放",caption:"SEEDING",ink:hl},{glyphs:"实时看板",caption:"DASHBOARD",ink:ea},{glyphs:"议价谈判",caption:"NEGOTIATION",ink:ea},{glyphs:"内容共创",caption:"CO-CREATION",ink:ea},{glyphs:"假粉检测",caption:"FAKE CHECK",ink:ul}],Xx=.25,qx=2,Ai={width:256,height:1024},Yx={width:1024,height:512},Xr=9,qr=3;function ta(n,e){const t=document.createElement("canvas");t.width=n,t.height=e;const i=t.getContext("2d");if(i===null)throw new Error("splash: signage canvas is unavailable");return{canvas:t,context:i}}function Zx(n,e,t,i,r){let s=i;for(n.font=r(s);s>10&&n.measureText(e).width>t;)s-=1,n.font=r(s)}function ml(n,e,t,i){n.save(),n.lineJoin="round",n.lineCap="round",n.shadowColor=e.tube,n.shadowBlur=t*2,n.strokeStyle=e.tube,n.lineWidth=t,i(),n.stroke(),n.shadowBlur=0,n.strokeStyle=e.core,n.lineWidth=Math.max(1.5,t*.32),i(),n.stroke(),n.restore()}function Kx(n,e,t,i,r){const{width:s,height:a}=Ai,{ink:o}=r,l=n.createLinearGradient(0,i,0,i+a);l.addColorStop(0,"#050307"),l.addColorStop(.5,o.panel),l.addColorStop(1,"#050307"),n.fillStyle=l,n.fillRect(t,i,s,a),n.strokeStyle="rgba(255, 255, 255, 0.07)",n.lineWidth=2,n.strokeRect(t+9,i+30,s-18,a-60),ml(n,o,6,()=>{n.beginPath(),n.roundRect(t+20,i+46,s-40,a-92,16)});const c=Array.from(r.glyphs),h=700/Math.max(1,c.length),u=Math.min(160,Math.floor(h*.86));e.clearRect(0,0,s,a),e.globalCompositeOperation="source-over",e.textAlign="center",e.textBaseline="middle",e.font=`700 ${u}px ${Qs}`,e.fillStyle=o.core,c.forEach((f,d)=>{e.fillText(f,s/2,104+h*(d+.5))}),e.globalCompositeOperation="source-atop",e.strokeStyle=o.tube,e.lineWidth=Math.max(6,u*.065),e.lineJoin="round",c.forEach((f,d)=>{e.strokeText(f,s/2,104+h*(d+.5))}),n.save(),n.shadowColor=o.tube,n.shadowBlur=18,n.drawImage(e.canvas,t,i),n.restore(),ml(n,o,4,()=>{n.beginPath(),n.moveTo(t+70,i+842),n.lineTo(t+s-70,i+842)}),n.textAlign="center",n.textBaseline="middle",Zx(n,r.caption,s-76,28,f=>`500 ${f}px ${js}`),n.fillStyle=o.core,n.fillText(r.caption,t+s/2,i+892)}function tt(n,e,t,i,r){n.save(),n.font=`${r.weight??600} ${r.size}px ${r.latin===!0?js:Qs}`,n.textAlign=r.align??"left",n.textBaseline="middle",n.fillStyle=r.color,r.glow!==void 0&&(n.shadowColor=r.glow,n.shadowBlur=Math.round(r.size*.16)),n.fillText(e,t,i),n.restore()}function rr(n,e,t,i,r=112){tt(n,e,64,r,{size:86,color:"#ffffff",weight:800,glow:i}),tt(n,t,68,r+74,{size:32,color:i,weight:600})}function Wt(n,e,t,i,r,s,a=18){n.fillStyle=s,n.beginPath(),n.roundRect(e,t,i,r,a),n.fill()}function uf(n,e,t,i,r,s=!1){n.font=`600 26px ${s?js:Qs}`;const a=n.measureText(i).width+40;return Wt(n,e,t,a,46,r,23),tt(n,i,e+a/2,t+24,{size:26,color:"#ffffff",align:"center",latin:s}),a}function na(n,e,t,i,r){n.save(),n.beginPath(),n.arc(e,t,i,0,Math.PI*2),n.fillStyle=r,n.fill(),n.clip(),n.fillStyle="rgba(0, 0, 0, 0.42)",n.beginPath(),n.arc(e,t-i*.18,i*.36,0,Math.PI*2),n.fill(),n.beginPath(),n.ellipse(e,t+i*.82,i*.66,i*.5,0,0,Math.PI*2),n.fill(),n.restore()}function Ri(n,e,t,i,r){const s=n.createLinearGradient(0,0,e,t);s.addColorStop(0,i),s.addColorStop(1,r),n.fillStyle=s,n.fillRect(0,0,e,t);const a=n.createRadialGradient(e/2,t/2,t*.3,e/2,t/2,e*.62);a.addColorStop(0,"rgba(0, 0, 0, 0)"),a.addColorStop(1,"rgba(0, 0, 0, 0.45)"),n.fillStyle=a,n.fillRect(0,0,e,t)}function $x(n,e,t){Ri(n,e,t,"#2f0807","#100203"),rr(n,"一键建联","AI 写邮件 · 批量触达达人","#ffb547"),Wt(n,580,46,380,420,"rgba(255, 236, 214, 0.1)"),tt(n,"To: creator@mail.com",612,96,{size:26,color:"#ffe9cf",weight:500,latin:!0}),tt(n,"合作邀请｜新品种草",612,146,{size:30,color:"#ffffff",weight:700}),n.fillStyle="rgba(255, 181, 71, 0.5)",n.fillRect(612,176,316,3),[300,316,248,290,204].forEach((r,s)=>{n.fillStyle=`rgba(255, 233, 207, ${.5-s*.05})`,n.fillRect(612,206+s*34,r,12)}),Wt(n,612,384,150,52,"#ff6a2b",26),tt(n,"发送",687,411,{size:28,color:"#ffffff",weight:700,align:"center"}),n.strokeStyle="#ffb547",n.lineWidth=5,n.strokeRect(70,300,92,64),n.beginPath(),n.moveTo(70,300),n.lineTo(116,338),n.lineTo(162,300),n.stroke(),tt(n,"已发送",188,312,{size:28,color:"rgba(255, 233, 207, 0.75)"}),tt(n,"1,286",186,360,{size:52,color:"#ffffff",weight:700,latin:!0});for(let r=0;r<8;r+=1){const s=24+r*37%11*6;n.fillStyle=r%3===0?"#ffb547":"#ff4b30",n.globalAlpha=.75,n.fillRect(72+r*52,470-s,32,s)}n.globalAlpha=1}function Jx(n,e,t){Ri(n,e,t,"#02121a","#01070c"),rr(n,"全球达人","覆盖 200+ 国家和地区","#3dffd0");const i=[[560,160,86,62],[618,320,40,80],[728,136,42,32],[742,272,56,78],[856,164,108,72],[892,286,36,17],[930,366,42,26]];n.fillStyle="rgba(61, 255, 208, 0.42)";for(let o=70;o<460;o+=13)for(let l=460;l<990;l+=13)i.some(([h,u,f,d])=>((l-h)/f)**2+((o-u)/d)**2<1)&&(n.beginPath(),n.arc(l,o,3.2,0,Math.PI*2),n.fill());const r=[876,190],s=[[520,186],[724,128],[790,232],[892,292],[632,340],[936,366]];n.lineWidth=4;for(const[o,l]of s)n.strokeStyle="rgba(41, 214, 255, 0.85)",n.beginPath(),n.moveTo(r[0],r[1]),n.quadraticCurveTo((r[0]+o)/2,Math.min(r[1],l)-70,o,l),n.stroke(),n.fillStyle="#e4fbff",n.beginPath(),n.arc(o,l,7,0,Math.PI*2),n.fill();n.fillStyle="#3dffd0",n.beginPath(),n.arc(r[0],r[1],11,0,Math.PI*2),n.fill();let a=66;for(const o of["TikTok","YouTube"])a+=uf(n,a,286,o,"rgba(61, 255, 208, 0.22)",!0)+14;uf(n,66,344,"Instagram","rgba(61, 255, 208, 0.22)",!0),tt(n,"1200万+",66,436,{size:54,color:"#ffffff",weight:800}),tt(n,"达人资源",290,440,{size:30,color:"#9ff5df"})}function Qx(n,e,t){Ri(n,e,t,"#071330","#03060f"),rr(n,"电子签约","报价 · 合同 · 在线确认","#7fb4ff"),Wt(n,600,40,330,432,"rgba(190, 212, 255, 0.14)"),tt(n,"合作协议",632,92,{size:34,color:"#ffffff",weight:700}),[260,240,266,200,252,230].forEach((r,s)=>{n.fillStyle=`rgba(214, 228, 255, ${.42-s*.03})`,n.fillRect(632,136+s*30,r,10)}),n.strokeStyle="#a9ccff",n.lineWidth=5,n.lineCap="round",n.beginPath(),n.moveTo(640,382),n.bezierCurveTo(670,330,690,420,720,370),n.bezierCurveTo(740,340,760,410,800,372),n.stroke(),n.fillStyle="rgba(214, 228, 255, 0.4)",n.fillRect(632,406,200,3),n.save(),n.translate(860,380),n.rotate(-.18),n.strokeStyle="#ff4b55",n.lineWidth=7,n.beginPath(),n.arc(0,0,56,0,Math.PI*2),n.stroke(),n.lineWidth=2.5,n.beginPath(),n.arc(0,0,45,0,Math.PI*2),n.stroke(),tt(n,"已签约",0,2,{size:28,color:"#ff4b55",weight:800,align:"center"}),n.restore(),tt(n,"签约周期",68,318,{size:30,color:"rgba(214, 228, 255, 0.7)"}),tt(n,"3 分钟",66,384,{size:64,color:"#ffffff",weight:800})}function jx(n,e,t){Ri(n,e,t,"#032332","#010a10"),rr(n,"受众洞察","粉丝画像 · 真实度分析","#29d6ff");const i=[[.62,"#29d6ff"],[.38,"#ff4fa0"]];let r=-Math.PI/2;for(const[o,l]of i)n.strokeStyle=l,n.lineWidth=32,n.beginPath(),n.arc(170,372,78,r+.03,r+o*Math.PI*2-.03),n.stroke(),r+=o*Math.PI*2;tt(n,"女 62%",170,372,{size:30,color:"#e4fbff",weight:700,align:"center"});const s=[.34,.86,1,.58,.3,.16],a=["18-","18+","25+","31+","41+","50+"];s.forEach((o,l)=>{const c=150*o;n.fillStyle=l===2?"#3dffd0":"rgba(41, 214, 255, 0.75)",n.fillRect(320+l*60,430-c,38,c),tt(n,a[l]??"",339+l*60,458,{size:20,color:"rgba(228, 251, 255, 0.6)",align:"center",latin:!0})}),tt(n,"真实粉丝",720,300,{size:30,color:"#9feaff"}),tt(n,"92%",712,380,{size:96,color:"#e4fbff",weight:800,latin:!0,glow:"#29d6ff"}),Wt(n,720,438,220,12,"rgba(41, 214, 255, 0.2)",6),Wt(n,720,438,202,12,"#29d6ff",6)}function e_(n,e,t){Ri(n,e,t,"#3a0424","#05121e"),rr(n,"AI 达人搜索","全网达人 · 秒级匹配","#ff4fa0"),Wt(n,64,238,540,64,"rgba(255, 255, 255, 0.12)",32),n.strokeStyle="#ff9fd0",n.lineWidth=4,n.beginPath(),n.arc(104,268,15,0,Math.PI*2),n.moveTo(115,279),n.lineTo(128,292),n.stroke(),tt(n,"美妆 · 10万+粉丝 · 高互动",144,270,{size:28,color:"#ffe2ef",weight:500}),[["#ff4fa0","美妆","98%"],["#29d6ff","护肤","95%"],["#ffae2e","彩妆","91%"]].forEach(([s,a,o],l)=>{const c=322+l*56;Wt(n,64,c,540,46,"rgba(255, 255, 255, 0.07)",12),na(n,92,c+23,17,s),n.fillStyle="rgba(255, 255, 255, 0.6)",n.fillRect(124,c+16,126,14),Wt(n,270,c+8,76,30,s,15),tt(n,a,308,c+24,{size:20,color:"#ffffff",align:"center"}),tt(n,o,584,c+24,{size:28,color:s,weight:700,align:"right",latin:!0})});for(let s=0;s<5;s+=1)n.strokeStyle=`rgba(255, 79, 160, ${.5-s*.08})`,n.lineWidth=3,n.beginPath(),n.arc(820,270,46+s*30,0,Math.PI*2),n.stroke();const r=n.createRadialGradient(820,270,0,820,270,166);r.addColorStop(0,"rgba(255, 79, 160, 0.42)"),r.addColorStop(1,"rgba(255, 79, 160, 0)"),n.fillStyle=r,n.beginPath(),n.moveTo(820,270),n.arc(820,270,166,-1.3,-.5),n.fill();for(const[s,a,o]of[[760,190,"#29d6ff"],[910,230,"#ffae2e"],[870,360,"#ff4fa0"],[740,330,"#3dffd0"]])na(n,s,a,18,o)}function t_(n,e,t){n.fillStyle="#0a0216",n.fillRect(0,0,e,t),n.strokeStyle="rgba(255, 79, 160, 0.4)",n.lineWidth=2;for(let r=0;r<=16;r+=1)n.beginPath(),n.moveTo(e*.62,250),n.lineTo(-300+r*120,430),n.stroke();for(let r=0;r<5;r+=1){const s=250+(r/4)**2*180;n.beginPath(),n.moveTo(0,s),n.lineTo(e,s),n.stroke()}tt(n,"达人营销",64,168,{size:92,color:"#ffffff",weight:800,glow:"#29d6ff"}),tt(n,"INFLUENCER MARKETING",66,250,{size:38,color:"#bdf3ff",weight:500,latin:!0}),tt(n,"品牌 × 达人 · 一站协同",66,318,{size:32,color:"#ffc6e2",weight:600});const i=[[620,330],[690,300],[760,312],[830,236],[900,196],[960,120]];ml(n,ea,6,()=>{n.beginPath(),i.forEach(([r,s],a)=>{a===0?n.moveTo(r,s):n.lineTo(r,s)})}),n.fillStyle="#ffe2ef";for(const[r,s]of i)n.beginPath(),n.arc(r,s,8,0,Math.PI*2),n.fill();tt(n,"ROI 3.6x",690,392,{size:52,color:"#ffffff",weight:700,latin:!0,glow:"#ff4fa0"})}function n_(n,e,t){Ri(n,e,t,"#2a0418","#0c0310"),Wt(n,92,34,214,444,"#05030a",30);const i=n.createLinearGradient(0,48,0,464);i.addColorStop(0,"#7a1d55"),i.addColorStop(1,"#2a0c40"),Wt(n,102,46,194,420,i,22),na(n,199,210,74,"#ff8fb8"),Wt(n,116,62,70,32,"#ff2d55",8),tt(n,"LIVE",151,79,{size:20,color:"#ffffff",weight:700,align:"center",latin:!0}),tt(n,"8.6万",282,79,{size:22,color:"#ffffff",weight:600,align:"right"}),Wt(n,116,360,166,86,"rgba(255, 255, 255, 0.9)",14),tt(n,"新品口红",132,384,{size:22,color:"#2a0418",weight:700}),tt(n,"¥99",132,422,{size:30,color:"#ff2d55",weight:800,latin:!0}),Wt(n,206,404,64,30,"#ff2d55",15),tt(n,"抢购",238,420,{size:18,color:"#ffffff",weight:700,align:"center"}),n.fillStyle="#ff6f9c";for(const[r,s,a]of[[330,300,16],[352,238,12],[336,176,9]])n.beginPath(),n.moveTo(r,s+a),n.bezierCurveTo(r-a*1.6,s-a*.2,r-a*.5,s-a*1.3,r,s-a*.4),n.bezierCurveTo(r+a*.5,s-a*1.3,r+a*1.6,s-a*.2,r,s+a),n.fill();tt(n,"直播带货",420,130,{size:90,color:"#ffffff",weight:800,glow:"#ff3a6e"}),tt(n,"达人直播 · 边看边买",424,208,{size:34,color:"#ff8fb0",weight:600}),tt(n,"单场 GMV",424,318,{size:30,color:"rgba(255, 220, 232, 0.7)"}),tt(n,"¥1,280万",420,392,{size:76,color:"#ffffff",weight:800})}function i_(n,e,t){Ri(n,e,t,"#1c0b2a","#08040e"),rr(n,"达人榜单","周热度 · 品类排行","#ffcf4a");const i=[[2,610,300,"#29d6ff","数码"],[1,760,240,"#ffcf4a","美妆"],[3,910,336,"#ff4fa0","美食"]];for(const[r,s,a,o,l]of i){const c=n.createLinearGradient(0,a,0,480);c.addColorStop(0,o),c.addColorStop(1,"rgba(255, 255, 255, 0.05)"),Wt(n,s-64,a,128,480-a,c,12),tt(n,String(r),s,a+52,{size:64,color:"#1c0b2a",weight:800,align:"center",latin:!0}),na(n,s,a-62,44,o),tt(n,l,s,a-132,{size:26,color:"#ffffff",weight:600,align:"center"})}tt(n,"No.1 美妆 · 860万热度",68,330,{size:32,color:"#ffe7a6",weight:600}),tt(n,"↑ 32%",64,404,{size:64,color:"#ffffff",weight:800,latin:!0})}const df=[{module:"受众洞察",paint:jx},{module:"一键建联",paint:$x},{module:"全球达人",paint:Jx},{module:"电子签约",paint:Qx},{module:"AI 达人搜索",paint:e_},{module:"达人营销",paint:t_},{module:"直播带货",paint:n_},{module:"达人榜单",paint:i_}],r_={width:448,height:84},Yr=4;function pf(n,e,t,i,r){const s=Array.from(e),a=s.map(l=>n.measureText(l).width);let o=t-(a.reduce((l,c)=>l+c,0)+r*(s.length-1))/2;n.textAlign="left",s.forEach((l,c)=>{n.fillText(l,o,i),o+=(a[c]??0)+r})}function s_(n,e){const t=Math.max(1,Math.ceil(n/Yr)),{width:i,height:r}=r_,{canvas:s,context:a}=ta(i*Yr,r*t);a.fillStyle="#000000",a.fillRect(0,0,s.width,s.height),a.textBaseline="middle";for(let l=0;l<n;l+=1){const{name:c,trade:h}=Yv(l),u=l%Yr*i+i/2,f=Math.floor(l/Yr)*r;a.fillStyle="#ffffff",a.font=`700 48px ${Qs}`,pf(a,c,u,f+34,6),a.fillStyle="#a8a8a8",a.font=`500 15px ${js}`,pf(a,h,u,f+70,3)}const o=gl(s,e);return o.colorSpace=Un,{texture:o,grid:new ae(Yr,t),aspect:i/r}}function gl(n,e){const t=new Io(n);return t.colorSpace=Yt,t.anisotropy=e,t.needsUpdate=!0,t}function a_(n){if(ff.length!==jo)throw new Error("splash: sign artwork does not fill the sign atlas");const e=Math.ceil(jo/Xr),{canvas:t,context:i}=ta(Ai.width*Xr,Ai.height*e),r=ta(Ai.width,Ai.height).context;return ff.forEach((s,a)=>{Kx(i,r,a%Xr*Ai.width,Math.floor(a/Xr)*Ai.height,s)}),{texture:gl(t,n),grid:new ae(Xr,e),aspect:Xx}}function o_(n){if(df.length!==Fh)throw new Error("splash: screen artwork does not fill the screen atlas");const e=Math.ceil(Fh/qr),{width:t,height:i}=Yx,{canvas:r,context:s}=ta(t*qr,i*e);return df.forEach((a,o)=>{s.save(),s.translate(o%qr*t,Math.floor(o/qr)*i),s.beginPath(),s.rect(0,0,t,i),s.clip(),a.paint(s,t,i),s.restore()}),{texture:gl(r,n),grid:new ae(qr,e),aspect:qx}}const ia={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class Zr{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const l_=new Wo(-1,1,1,-1,0,1);class c_ extends Mt{constructor(){super(),this.setAttribute("position",new rt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new rt([0,2,0,0,2,0],2))}}const h_=new c_;class mf{constructor(e){this._mesh=new ot(h_,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,l_)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class vl extends Zr{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof St?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Ur.clone(e.uniforms),this.material=new St({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new mf(this.material)}render(e,t,i){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=i.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class gf extends Zr{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,i){const r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(i),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class f_ extends Zr{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class u_{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const i=e.getSize(new ae);this._width=i.width,this._height=i.height,t=new Dt(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Ut}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new vl(ia),this.copyPass.material.blending=Mn,this.timer=new Qd}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let i=!1;for(let r=0,s=this.passes.length;r<s;r++){const a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,i),a.needsSwap){if(i){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}gf!==void 0&&(a instanceof gf?i=!0:a instanceof f_&&(i=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new ae);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const i=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(i,r),this.renderTarget2.setSize(i,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(i,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class d_ extends Zr{constructor(e,t,i=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=i,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Ye}render(e,t,i){const r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:i),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}}const p_={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ye(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class sr extends Zr{constructor(e,t=1,i,r){super(),this.strength=t,this.radius=i,this.threshold=r,this.resolution=e!==void 0?new ae(e.x,e.y):new ae(256,256),this.clearColor=new Ye(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Dt(s,a,{type:Ut,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const u=new Dt(s,a,{type:Ut,depthBuffer:!1});u.texture.name="UnrealBloomPass.h"+h,u.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(u);const f=new Dt(s,a,{type:Ut,depthBuffer:!1});f.texture.name="UnrealBloomPass.v"+h,f.texture.generateMipmaps=!1,this.renderTargetsVertical.push(f),s=Math.round(s/2),a=Math.round(a/2)}const o=p_;this.highPassUniforms=Ur.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new St({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[6,10,14,18,22];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new ae(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1),new U(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Ur.clone(ia.uniforms),this.blendMaterial=new St({uniforms:this.copyUniforms,vertexShader:ia.vertexShader,fragmentShader:ia.fragmentShader,premultipliedAlpha:!0,blending:fr,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Ye,this._oldClearAlpha=1,this._basic=new wr,this._fsQuad=new mf(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let i=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(i,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(i,r),this.renderTargetsVertical[s].setSize(i,r),this.separableBlurMaterials[s].uniforms.invSize.value=new ae(1/i,1/r),i=Math.round(i/2),r=Math.round(r/2)}render(e,t,i,r,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=i.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=i.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=sr.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=sr.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(i),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=a}_getSeparableBlurMaterial(e){const t=[],i=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(i*i))/i);const r=[],s=[];for(let a=1;a<e;a+=2){const o=t[a],l=a+1<e?t[a+1]:0,c=o+l;r.push((a*o+(a+1)*l)/c),s.push(c)}return new St({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new ae(.5,.5)},direction:{value:new ae(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:s}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new St({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}}sr.BlurDirectionX=new ae(1,0),sr.BlurDirectionY=new ae(0,1);const vf=`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,m_=`
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
`,g_=`
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  color = mix(color, vec3(0.0), vec3(isnan(color)));
  gl_FragColor = vec4(clamp(color, 0.0, 64.0), 1.0);
}
`;function v_(n,e,t){const i=new Dt(1,1,{type:Ut,samples:4}),r=new u_(n,i);r.addPass(new d_(e,t));const s=new St({uniforms:{tDiffuse:{value:null}},vertexShader:vf,fragmentShader:g_,depthTest:!1,depthWrite:!1}),a=new vl(s);r.addPass(a);const o=new sr(new ae(1,1),.55,.32,1);r.addPass(o);const l={value:0},c={value:0},h={value:new ae(1,1)},u=new St({uniforms:{tDiffuse:{value:null},uExposure:l,uTime:c,uTexel:h},vertexShader:vf,fragmentShader:m_,depthTest:!1,depthWrite:!1}),f=new vl(u);return r.addPass(f),{composer:r,exposure:l,time:c,setSize:(d,g,_)=>{r.setPixelRatio(_),r.setSize(d,g),h.value.set(1/Math.max(1,Math.floor(d*_)),1/Math.max(1,Math.floor(g*_)))},dispose:()=>{a.dispose(),s.dispose(),o.dispose(),f.dispose(),u.dispose(),r.dispose()}}}const xf={finish:()=>{},stop:()=>{}},xl=1,x_=196869,__=2,_f=.8,y_=2560*1520,M_=900,S_=.4,b_=450,ra={signs:1.1,screens:.9,airship:.95,posters:.85},ar={reach:2.1,drop:.42};function _n(n,e,t,i={},r={}){return new St({...r,vertexShader:e,fragmentShader:t,uniforms:{...n,...i}})}function Ct(n,e,t,i=new Ye(0,0,0),r=[]){return _n(n,sx,ax,{uAlbedo:{value:typeof e=="number"?new Ye(e,e*.96,e*1.04):e},uEmissive:{value:i},uSheen:{value:t}},{defines:Object.fromEntries(r.map(s=>[s,""]))})}function _l(n,e,t){const i=new Kd;i.index=n.index;for(const[r,s]of Object.entries(n.attributes))i.setAttribute(r,s);for(const[r,s]of Object.entries(t))i.setAttribute(r,s);return i.instanceCount=e,i}function Kr(n,e){const t=new Ki(1,1);return t.deleteAttribute("normal"),_l(t,n,e)}function w_(n,e,t){n.frustumCulled=!1,n.onBeforeRender=i=>{const r=i.getRenderTarget();r===null?i.getDrawingBufferSize(t.value):t.value.set(r.width,r.height),e.uniformsNeedUpdate=!0}}function sa(n,e,t,i,r={}){const s=_n(n,t,dx,{uViewport:e,...r},{blending:fr,depthWrite:!1,transparent:!0}),a=new ot(i,s);return w_(a,s,e),a}function yl(n,e,t,i={value:new U}){const r=new Float32Array(t.length*3),s=new Float32Array(t.length*4);return t.forEach((a,o)=>{r.set([a.position.x,a.position.y,a.position.z],o*3),s.set([...a.color,a.radius],o*4)}),sa(n,e,cx,Kr(t.length,{aHead:new _t(r,3),aLight:new _t(s,4)}),{uLightOffset:i})}function yf(n){return Mf(n,new ft)}function Mf(n,e){return n.map(t=>({position:new U(...t.offset).applyMatrix4(e),color:t.color,radius:t.radius}))}function E_(n,e,t){const i=new Fe(1,1,1).translate(0,.5,0),r=new mt(.5,.5,1,48,1).translate(0,.5,0),s=new Set(il(n)),a=ef(n).first;return[[tn.box,i],[tn.round,r]].map(([o,l])=>{const c=n.tiers.filter(p=>p.form===o),h=new Float32Array(c.length*3),u=new Float32Array(c.length*4),f=new Float32Array(c.length*4),d=new Float32Array(c.length*4),g=new Float32Array(c.length);c.forEach((p,b)=>{const w=jh(p);h.set([p.x,p.y,p.z],b*3),u.set([p.width,p.height,p.depth,p.taper],b*4),f.set([p.seed,p.facade,p.lit,p.trim],b*4),d.set([w.floorHeight,w.cellTarget,w.finish,(w.balconies?1:0)+(s.has(p)?2:0)],b*4);const v=a.get(p);g[b]=v===void 0?0:v+1}),l.deleteAttribute("uv");const _=_l(l,c.length,{aCenter:new _t(h,3),aSize:new _t(u,4),aStyle:new _t(f,4),aGrid:new _t(d,4),aStorefront:new _t(g,1)}),m=new ot(_,_n(e,jv,ex,{uFascia:{value:t.texture},uFasciaGrid:{value:t.grid}},{defines:o===tn.round?{RADIAL:""}:{}}));return m.frustumCulled=!1,m})}function T_(n){const e=new Br(new Ki(2800,2800),{textureWidth:1,textureHeight:1,clipBias:.003,color:14275551,multisample:4,shader:{name:"SplashGround",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uStreet:{value:new pt(an.x,an.spacing,0,Vs)},uAvenue:{value:new ae(bt.start+15,bt.end-10)},uCrossings:{value:new U(vn.north,vn.south,vn.rail)}},vertexShader:tx,fragmentShader:nx}}),t=e.material;if(!(t instanceof St))throw new Error("splash: ground reflector has no shader material");Object.assign(t.uniforms,n);const i=e.getRenderTarget().texture;i.generateMipmaps=!0,i.minFilter=Xn,e.rotation.x=-Math.PI/2,e.position.set(0,0,-300);const r=e.onBeforeRender.bind(e),s=new U;return e.onBeforeRender=(a,o,l,...c)=>{if(l instanceof en){const h=Math.asin(l.getWorldDirection(s).y)-Fu.degToRad(l.fov/2);if(h>-.01||l.position.y/Math.tan(-h)>b_)return}n.uDetail.value=0,r(a,o,l,...c),n.uDetail.value=1},e}function A_(n){const e=new ot(new _i(1600,48,24),_n(n,ix,rx,{},{side:Ht,depthTest:!1,depthWrite:!1}));return e.renderOrder=-1,e.frustumCulled=!1,e.onBeforeRender=(t,i,r)=>{e.position.copy(r.position),e.updateMatrixWorld()},e}function Ln(n,e){const t=new ft,i=new Fn,r=new U(0,1,0);return e.forEach((s,a)=>{i.setFromAxisAngle(r,s.yaw??0),n.setMatrixAt(a,t.compose(s.position,i,s.scale))}),n.instanceMatrix.needsUpdate=!0,n}function R_(){const n=an.height,e=[new mt(.17,.2,.55,14).translate(0,.275,0),new mt(.065,.11,n,14).translate(0,n/2,0),new mt(.045,.045,ar.reach,10).rotateZ(Math.PI/2).translate(-2.1/2,n-.1,0),new mt(.05,.05,.42,10).rotateZ(Math.PI/4).translate(-.17,n-.27,0),new Fe(.92,.14,.38).translate(-2.1,n-.25,0),new Fe(.7,.06,.3).translate(-2.1+.02,n-.15,0)],t=Si(e,!1);for(const i of e)i.dispose();return t}function Ml(){const n=[];for(let e=bt.start;e>bt.end;e-=an.spacing)n.push({x:-12.4,z:e,side:-1},{x:an.x,z:e,side:1});return n}function C_(){const n=[new mt(.5,.5,.78,18).translate(0,.61,0)];for(const[t,i]of[[-.3,-.3],[.3,-.3],[-.3,.3],[.3,.3]])n.push(new Fe(.07,.24,.07).translate(t,.12,i));const e=Si(n,!1);for(const t of n)t.dispose();return e}function P_(){const n=[new Fe(1,.86,1).translate(0,.43,0),new mt(.34,.34,.14,20).translate(-.18,.93,0),new mt(.34,.34,.14,20).translate(.22,.93,0)],e=Si(n,!1);for(const t of n)t.dispose();return e}function L_(){const n=Object.values(vn).sort((i,r)=>r-i),e=[];let t=bt.start+15;for(const i of n)e.push({from:t,to:i+bi}),t=i-bi;return e.push({from:t,to:bt.end-10}),e.filter(i=>i.from>i.to)}function I_(n,e){const t=Ct(e,.05,.25),i=n.roofUnits.map(m=>Math.floor(Math.abs(Math.sin(m.x*12.9898+m.z*78.233))*43758.5453)%3),r=(m,p,b)=>{const w=n.roofUnits.filter((v,S)=>i[S]===p);return Ln(new jt(m,t,w.length),w.map(v=>{const S=b?Math.min(v.width,v.depth):v.width;return{position:new U(v.x,v.y,v.z),scale:new U(S,v.height,b?S:v.depth)}}))},s=[r(new Fe(1,1,1).translate(0,.5,0),0,!1),r(C_(),1,!0),r(P_(),2,!1)],a=Ln(new jt(new mt(.04,1,1,12).translate(0,.5,0),t,n.antennas.length),n.antennas.map(m=>({position:new U(m.x,m.y,m.z),scale:new U(m.radius,m.height,m.radius)}))),o=Ml(),l=Ln(new jt(R_(),t,o.length),o.map(m=>({position:new U(m.x,0,m.z),scale:new U(1,1,1),yaw:m.side>0?0:Math.PI}))),c=Ln(new jt(new Fe(1,1,1),Ct(e,.02,0,new Ye(1.6,1.15,.75)),o.length),o.map(m=>({position:new U(m.x-m.side*ar.reach,an.height-.33,m.z),scale:new U(.78,.025,.3)}))),h=Ct(e,.05,.25,void 0,["BEVEL","STEEL"]),u=[...n.signs.map(m=>({...m,y:m.y+m.height/2,yaw:0,lip:.13})),...n.screens.map(m=>({...m,lip:.25}))],f=Ln(new jt(new Fe(1,1,1),h,u.length*5),u.flatMap(m=>{const p=Math.sin(m.yaw),b=Math.cos(m.yaw),w=(E,R,x)=>new U(m.x+E*b+x*p,m.y+R,m.z-E*p+x*b),v={width:m.width+2*m.lip,height:m.height+2*m.lip},S=m.lip;return[{position:w(0,0,-.24),scale:new U(v.width,v.height,.42),yaw:m.yaw},{position:w(0,(m.height+S)/2,0),scale:new U(v.width,S,.06),yaw:m.yaw},{position:w(0,-(m.height+S)/2,0),scale:new U(v.width,S,.06),yaw:m.yaw},{position:w((m.width+S)/2,0,0),scale:new U(S,m.height,.06),yaw:m.yaw},{position:w(-(m.width+S)/2,0,0),scale:new U(S,m.height,.06),yaw:m.yaw}]})),d=Ln(new jt(new Fe(1,1,1),h,n.signs.length*2),n.signs.flatMap(m=>[.45,m.height-.45].map(p=>{const b=Math.abs(m.x)+m.width/2;return{position:new U(Math.sign(m.x)*(b+.175),m.y+p,m.z-.24),scale:new U(.5,.08,.1)}}))),g=L_().flatMap(m=>[-1,1].map(p=>({position:new U(p*10.15,.075,(m.from+m.to)/2),scale:new U(.3,.15,m.from-m.to)}))),_=Ln(new jt(new Fe(1,1,1),Ct(e,.09,.15,void 0,["BEVEL","MASONRY"]),g.length),g);return[...s,a,l,c,f,d,_]}function Sl(n,e){const t=new ft,i=new Fn,r=new Yn(0,0,0,"ZYX"),s=new U,a=new U;return e.forEach((o,l)=>{i.setFromEuler(r.set(o.turnX??0,0,o.turnZ??0,"ZYX")),s.set(o.x,o.y,o.z),n.setMatrixAt(l,t.compose(s,i,a.set(o.width,o.height,o.depth)))}),n.instanceMatrix.needsUpdate=!0,n}function $r(n,e){return Sl(new jt(new Fe(1,1,1),e,n.length),n)}function D_(n){return Array.from({length:25},(e,t)=>{const i=t/24;return new U(n.from.x+(n.to.x-n.from.x)*i,n.from.y+(n.to.y-n.from.y)*i-4*n.sag*i*(1-i),n.from.z+(n.to.z-n.from.z)*i)})}function N_(n,e,t){const i=Zv(n),r=Jv(n),{cables:s,lanterns:a}=Qv(n),o=Ct(e,.035,.35,void 0,["BEVEL","STEEL"]),l=new Ye,c=$r(i.awnings,Ct(e,1,.08,void 0,["BEVEL","FABRIC"]));i.awnings.forEach((v,S)=>{c.setColorAt(S,l.setRGB(...v.tint))});const h=s.map(v=>new Us(new Bo(D_(v)),32,.035,5,!1)),u=h.length===0?new Mt:Si(h,!1);for(const v of h)v.dispose();const f=new Ye(1.5,.11,.06),d=Ln(new jt(new _i(.2,18,12),Ct(e,.02,0,f,["LANTERN"]),a.length),a.map(v=>({position:new U(v.x,v.y,v.z),scale:new U(1,1.3,1)}))),g=new mt(.5,.5,1,18),_=r.posters.map(v=>({...v,yaw:0})),m=[$r(i.masonry,Ct(e,.075,.1,void 0,["BEVEL","MASONRY"])),$r(i.steel,o),c,$r(r.steel,o),Sl(new jt(g,Ct(e,.035,.35,void 0,["STEEL"]),r.round.length),r.round),Sl(new jt(g,Ct(e,new Ye(.34,.02,.02),.3,void 0,["PAINTED"]),r.red.length),r.red),$r(r.glow,Ct(e,.02,.2,void 0,["BEVEL","VENDING"])),new ot(u,Ct(e,.02,.2)),d,aa(e,_,t,ra.posters,!0)],p=[1.4,.1,.05],b=v=>new U(v.x,v.y,v.z),w=[...r.lights.map(v=>({position:b(v),color:v.color,radius:v.radius})),...a.map(v=>({position:b(v),color:p,radius:.32}))];return{objects:m,lights:w}}function U_(n){const e=[],t=(i,r,s,a,o)=>{e.push({position:new U(i,r,s),color:a,radius:o})};for(const i of n.antennas)t(i.x,i.y+i.height,i.z,[1.6,.08,.06],Math.max(.55,i.radius*.5));for(const i of Ml())t(i.x-i.side*ar.reach,an.height-ar.drop,i.z,[1.8,1.25,.8],.4);for(const[i,r]of[[-12,-12],[12,-12],[-12,12],[12,12]])t(gn.x+i,gn.deck+.6,gn.z+r,[1.8,.1,.08],.6);return e}function Sf(n){const e=new Float32Array(n.length*4),t=new Float32Array(n.length*4);return n.forEach((i,r)=>{e.set([i.origin.x,i.origin.y,i.origin.z,i.speed],r*4),t.set([i.directionX,i.directionZ,i.phase,i.span],r*4)}),{lane:e,motion:t}}function bl(n,e,t,i){const{lane:r,motion:s}=Sf(e),a=new Float32Array(e.length*4);e.forEach((l,c)=>{a.set([...l.paint,l.bob],c*4)});const o=new ot(_l(t,e.length,{aLane:new _t(r,4),aMotion:new _t(s,4),aCraft:new _t(a,4)}),_n(n,sl,al,{},{defines:{LANE:"",[i]:""}}));return o.frustumCulled=!1,o}function F_(n,e){const t=Wv(),i=Kv(),r=[bl(n,t.filter(u=>u.kind===Pn.spinner),Fx(),"SPINNER"),bl(n,t.filter(u=>u.kind===Pn.hauler),Ox(),"HAULER"),bl(n,i,kx(),"CAR")],s=[...t.flatMap(u=>(u.kind===Pn.hauler?Ux:Nx).map(d=>({lane:u,light:d}))),...i.flatMap(u=>zx.map(f=>({lane:u,light:f})))];for(const u of Xv())s.push({lane:u,light:{offset:[0,0,0],color:u.headlight?[1.1,1,.9]:[1.2,.06,.04],radius:u.radius,kind:u.headlight?1:2,trail:u.trail}});const{lane:a,motion:o}=Sf(s.map(u=>u.lane)),l=new Float32Array(s.length*4),c=new Float32Array(s.length*4),h=new Float32Array(s.length*2);return s.forEach(({lane:u,light:f},d)=>{l.set([...f.offset,u.bob],d*4),c.set([...f.color,f.radius],d*4),h.set([f.kind,f.trail],d*2)}),r.push(sa(n,e,hx,Kr(s.length,{aLane:new _t(a,4),aMotion:new _t(o,4),aOffset:new _t(l,4),aLight:new _t(c,4),aKind:new _t(h,2)}))),r}function O_(n,e){const i=new Float32Array(9600);let r=10775;for(let a=0;a<i.length;a+=1)r=Math.imul(r,1664525)+1013904223>>>0,i[a]=r/4294967296;const s=sa(n,e,fx,Kr(2400,{aDrop:new _t(i,4)}),{uRainBox:{value:new U(56,40,56)},uRain:{value:1}});return s.layers.set(xl),s}function aa(n,e,t,i,r,s={value:new U}){const a=new Float32Array(e.length*4),o=new Float32Array(e.length*4);e.forEach((c,h)=>{a.set([c.x,c.y,c.z,c.yaw],h*4),o.set([c.width,c.height,c.slot,i],h*4)});const l=new ot(Kr(e.length,{aPanel:new _t(a,4),aShape:new _t(o,4)}),_n(n,ox,lx,{uAtlas:{value:t.texture},uGrid:{value:t.grid},uSlotAspect:{value:t.aspect},uScreen:{value:r?1:0},uPanelOffset:s}));return l.frustumCulled=!1,l}function oa(n,e=new ae,t=1,i=0){return{uSeed:{value:n},uAxis:{value:e},uRadius:{value:t},uTwistRate:{value:i}}}function la(n,e,t,i,r){const{x:s,z:a}=t,o=new _r;for(const l of e.surfaces){const c=Object.fromEntries(l.defines.map(h=>[h,""]));o.add(new ot(l.geometry,_n(n,xx,_x,r,{defines:c})))}for(const l of e.outlines){const c=new Bo([...l.points],!1,"centripetal"),h=new Us(c,l.points.length*2,l.radius,6,!1);o.add(new ot(h,Ct(n,.02,0,new Ye(...l.color))))}if(o.position.set(s,0,a),i){const l=ei(1).position;o.rotation.y=Math.atan2(l.x-s,l.z-a)}return o.updateMatrixWorld(!0),{group:o,lights:Mf(e.lights,o.matrixWorld)}}function z_(n){const{pearl:e,gate:t,twist:i,opener:r}=jn,s=oa(.83,new ae(i.x,i.z),i.radius,of),a=[la(n,Px(),e,!1,oa(.31)),la(n,Lx(),t,!0,oa(.47)),la(n,Ix(),i,!1,s),la(n,Dx(),r,!0,oa(.62))];return{objects:a.map(o=>o.group),lights:a.flatMap(o=>o.lights)}}function B_(n,e,t){const i=new ot(Gx(nn.length,nn.radius),_n(n,sl,al,{uPaint:{value:new Ye(.035,.034,.04)}},{defines:{BLIMP:""}})),r={value:new U(nn.x,nn.y,nn.z)},s={x:0,y:ln.y,z:ln.z,yaw:0,width:ln.width,height:ln.height,slot:el.airship},a=aa(n,[s],t,ra.airship,!0,r),o=yl(n,e,yf(Hx),r);return{objects:[i,a,o],update:(l,c)=>{r.value.set(nn.x+Math.sin(c*.12)*1.5,nn.y+Math.sin(c*.5)*.4,nn.z),i.position.copy(r.value)},dispose:()=>{}}}function k_(n,e){const{z:t,height:i,span:r}=wi,s=Ct(n,.045,.3),a=new ot(new Fe(r,2.2,3.2),s);a.position.set(0,i-1.1,t);const o=new ot(Si([new Fe(r,.12,.05).translate(0,i-.5,t+1.63),new Fe(r,.12,.05).translate(0,i-.5,t-1.63)],!1),Ct(n,.02,0,new Ye(.18,.9,1.35))),l=[];for(let g=-r/2+20;g<r/2;g+=45)Math.abs(g)>14&&l.push(g);const c=Ln(new jt(new Fe(1.8,1,2.2).translate(0,.5,0),s,l.length),l.map(g=>({position:new U(g,0,t),scale:new U(1,i-2.2,1)}))),h={uPaint:{value:new Ye(.46,.47,.5)}},u=new ot(Wx(),_n(n,sl,al,h,{defines:{TRAIN:""}})),f={value:new U(0,i+1.95,t)},d=yl(n,e,yf(Vx()),f);return{objects:[a,o,c,u,d],update:(g,_)=>{f.value.x=Tv(_),u.position.copy(f.value)},dispose:()=>{}}}function H_(n,e){var Re;const{x:t,z:i,deck:r}=gn,s=Ct(n,.04,.4),a=new Ye(0,0,0),o=new ot(new Nr(13.5,.5,12,160),Ct(n,.03,.2,a));o.rotation.x=Math.PI/2,o.position.set(t,r+.9,i);const l=new Ye(0,0,0),c=new ot(new Nr(5.6,.22,10,96),Ct(n,.03,.2,l));c.rotation.x=Math.PI/2,c.position.set(t,r+2.5,i);const h=new ot(new mt(3.1,4.4,2.7,48),s);h.position.set(t,r+1.35,i);const u=new Ye(0,0,0),f=new ot(new Do(2.7,48),Ct(n,.02,.1,u));f.rotation.x=-Math.PI/2,f.position.set(t,r+2.72,i);const d=Ln(new jt(new Fe(.34,3.2,3.4).translate(0,1.6,0),s,12),Array.from({length:12},(xe,_e)=>{const Se=_e/12*Math.PI*2;return{position:new U(t+Math.sin(Se)*9.4,r,i+Math.cos(Se)*9.4),scale:new U(1,1,1),yaw:Se}})),{geometry:g,project:_}=Ax(on.width),m=Ex(Wr),p=wx(m,Wr,bx(m,Wr)),b=Tx(p,Wr),w={value:0},v={value:0},S=new ot(g,_n(n,gx,vx,{uField:{value:b},uIgnite:w,uDormant:v})),E=ei(1).position,R=Math.atan2(on.y-E.y,E.z-on.z);S.position.set(on.x,on.y,on.z),S.rotation.x=R,S.updateMatrixWorld();const x=r+2.75,A=on.y+(((Re=g.boundingBox)==null?void 0:Re.min.y)??-48*.3)*Math.cos(R),N=(xe,_e,Se,ke)=>{const F={value:0},D={value:0},I=Se-x,P=new ot(new mt(_e,xe,I,64,1,!0),_n(n,px,mx,{uBeam:F,uBeamReach:D},{blending:fr,depthWrite:!1,transparent:!0,side:rn}));return P.position.set(t,x+I/2,i),{mesh:P,strength:ke,power:F,reach:D}},H=N(1.5,1.1,A+.6,1),O=N(3.4,on.width*.46,on.y,.32);let J=20900;const k=()=>(J=Math.imul(J,1664525)+1013904223>>>0,J/4294967296),W=Rx(m,p,Wr,M_,k),ee=new Float32Array(W.length*3),$=new Float32Array(W.length*3),Z=new Float32Array(W.length*3),ie=new Float32Array(W.length*2);W.forEach((xe,_e)=>{const Se=k()*Math.PI*2,ke=Math.sqrt(k())*1.2,F=_(xe.u,xe.v,.9).applyMatrix4(S.matrixWorld);ee.set([t+Math.cos(Se)*ke,x+.4,i+Math.sin(Se)*ke],_e*3),$.set([t+Math.cos(Se)*ke*1.8,A-3-k()*5,i+Math.sin(Se)*ke*1.8],_e*3),Z.set([F.x,F.y,F.z],_e*3);const D=Cx(xe.travel,qt.igniteMs,qt.igniteRampMs,tf);ie.set([Math.max(qt.sparksMs,D-620-k()*380),D],_e*2)});const re={value:0},ce=sa(n,e,ux,Kr(W.length,{aFrom:new _t(ee,3),aVia:new _t($,3),aTo:new _t(Z,3),aTiming:new _t(ie,2)}),{uTimeline:re});return{objects:[o,c,h,f,d,H.mesh,O.mesh,S,ce],update:(xe,_e)=>{const{projectorMs:Se,projectorRampMs:ke,beamMs:F,beamRampMs:D,igniteMs:I,igniteRampMs:P}=qt,B=nr(xe,Se,ke),se=nr(xe,F,D),me=nr(xe,I,P);a.setRGB(2.3*B,.12*B,.09*B),l.setRGB(.25*B,1.2*B,1.7*B),u.setRGB(3.2*B,.9*B,.7*B);for(const G of[H,O])G.power.value=G.strength*B*(1-.35*me),G.reach.value=se*1.04;v.value=nr(xe,F+D*.6,500),w.value=me,re.value=xe;const C=nr(xe,I+P-200,1600);S.rotation.y=.16*Math.sin(_e*.42)*C,n.uHolo.value=.22*B+.78*me},dispose:()=>{b.dispose()}}}function G_(n){return n instanceof ot}function V_(n){n.traverse(e=>{if(e instanceof Br){e.dispose(),e.geometry.dispose();return}if(!G_(e))return;e.geometry.dispose();const t=Array.isArray(e.material)?e.material:[e.material];for(const i of t){if(i instanceof St)for(const r of Object.values(i.uniforms)){const s=r.value;s instanceof Io&&s.dispose()}i.dispose()}})}function W_(n,e,t){const i=new vv({canvas:n,antialias:!1,powerPreference:"high-performance",stencil:!1});let r=!1;i.debug.onShaderError=(_e,Se,ke,F)=>{r=!0,console.error("Tomato splash: shader compilation failed",_e.getShaderInfoLog(ke),_e.getShaderInfoLog(F))},i.setClearColor(x_,1);let s=Math.min(__,window.devicePixelRatio||1);i.setPixelRatio(s);const a={uTime:{value:0},uDetail:{value:1},uHoloPos:{value:new U(on.x,on.y,on.z)},uHolo:{value:0},uFogDensity:{value:.0034},uFogFalloff:{value:.0125},uLamps:{value:new pt(an.x-ar.reach,an.height-ar.drop,bt.start,an.spacing)},uLampRows:{value:Ml().length/2}},o={value:new ae(1,1)},l=new $u,c=new en(60,1,.3,4e3);c.layers.enable(xl);const h=Hv(),u=i.capabilities.getMaxAnisotropy(),f=o_(u),d=T_(a);d.getReflectionCamera(c).layers.disable(xl);const g=z_(a),_=[H_(a,o),B_(a,o,f),k_(a,o)],m=h.signs.map(_e=>({..._e,y:_e.y+_e.height/2,yaw:0})),p=N_(h,a,f);l.add(A_(a),d,...E_(h,a,s_(ef(h).shops,u)),...I_(h,a),...p.objects,...g.objects,aa(a,m,a_(u),ra.signs,!1),aa(a,h.screens,f,ra.screens,!0),..._.flatMap(_e=>_e.objects),yl(a,o,[...U_(h),...g.lights,...p.lights]),...F_(a,o),O_(a,o));const b=v_(i,l,c);let w=0,v=!1,S=!1,E=!1,R=0,x=0,A=0,N=0,H=!1,O=-1,J=-1;const k=_e=>S||e?qt.holdMs:Math.min(qt.holdMs,_e-w),W=_e=>{const Se=ei(_e/qt.cameraMs);c.position.set(Se.position.x,Se.position.y,Se.position.z),c.fov=Se.fov,c.updateProjectionMatrix(),c.lookAt(Se.target.x,Se.target.y,Se.target.z)},ee=_e=>{(n.clientWidth!==O||n.clientHeight!==J)&&$();const Se=k(_e),ke=(_e-w)/1e3;a.uTime.value=ke,b.time.value=ke,W(Se);for(const F of _)F.update(Se,ke);b.exposure.value=nr(Se,0,qt.fadeInMs),b.composer.render()},$=()=>{O=n.clientWidth,J=n.clientHeight;const _e=Math.max(1,O),Se=Math.max(1,J),ke=Math.min(s,Math.sqrt(y_/(_e*Se)));i.setPixelRatio(ke),i.setSize(_e,Se,!1),b.setSize(_e,Se,ke);const F=D=>Math.max(1,Math.round(D*ke*S_));d.getRenderTarget().setSize(F(_e),F(Se)),c.aspect=_e/Se,c.updateProjectionMatrix(),v&&e&&!E&&ee(performance.now())},Z=_e=>{H||(N>0&&(x+=1,x>4&&_e-N>24&&(A+=1)),N=_e,!(x<24)&&(H=!0,A>10&&s>_f&&(s=Math.max(_f,s*.72),$())))},ie=_e=>{E||(R=requestAnimationFrame(ie),ee(performance.now()),Z(_e))},re=()=>{if(!E){if(r)throw new Error("splash: a city shader failed to compile");w=performance.now(),v=!0,t(),e?ee(w):R=requestAnimationFrame(ie)}},ce=_e=>{console.error("Tomato splash: WebGL scene failed; using the static brand.",_e),E=!0,cancelAnimationFrame(R),document.documentElement.dataset.scene="fallback",v||(v=!0,t())},Re=new ResizeObserver($);Re.observe(n),$(),W(e?qt.holdMs:0),i.setRenderTarget(b.composer.renderTarget1);const xe=i.compileAsync(l,c);return i.setRenderTarget(null),xe.then(()=>{E||(b.exposure.value=0,b.composer.render(),re())}).catch(ce),{finish:()=>{S=!0,v&&e&&!E&&ee(performance.now())},stop:()=>{E=!0,cancelAnimationFrame(R),Re.disconnect();for(const _e of _)_e.dispose();V_(l),b.dispose(),i.dispose()}}}function X_(n,e,t){if(n===null)return document.documentElement.dataset.scene="fallback",t(),xf;try{return W_(n,e,t)}catch(i){return console.error("Tomato splash: WebGL initialization failed; using the static brand.",i),document.documentElement.dataset.scene="fallback",t(),xf}}const wl=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function q_(n){if(n===null||wl)return{start:()=>{},finish:()=>{},stop:()=>{}};const e=n.dataset.text??n.textContent;let t,i,r=!1;const s=()=>{window.clearTimeout(t),i!==void 0&&window.clearInterval(i)};return{start:()=>{r||(t=window.setTimeout(()=>{const a=performance.now(),o=()=>{const l=(performance.now()-a)/qt.wordmarkMs;n.textContent=Uf(e,l),l>=1&&i!==void 0&&(window.clearInterval(i),i=void 0)};o(),i=window.setInterval(o,40)},qt.wordmarkDelayMs))},finish:()=>{r=!0,s(),n.textContent=e},stop:s}}function Y_(n,e,t){let i=!1,r,s;const a=()=>{var o;i||(i=!0,window.clearTimeout(r),t(),document.documentElement.dataset.splash="done",s=window.setTimeout(()=>{n==null||n.classList.add("visible")},qt.waitingDelayMs),(o=window.tomatoSplash)==null||o.notifyAnimationDone())};return{start:()=>{i||(r=window.setTimeout(a,e))},finish:a,stop:()=>{window.clearTimeout(r),s!==void 0&&window.clearTimeout(s)}}}let El={finish:()=>{},stop:()=>{}};const Tl=q_(document.querySelector(".wordmark-name")),Al=Y_(document.querySelector("#waiting"),Nf(wl),()=>{El.finish(),Tl.finish()});El=X_(document.querySelector("#city-3d"),wl,()=>{document.documentElement.dataset.clock="running",Tl.start(),Al.start()});const bf=()=>{Al.finish()};window.addEventListener("pointerdown",bf),window.addEventListener("keydown",n=>{n.key==="Escape"&&bf()}),window.addEventListener("pagehide",()=>{Al.stop(),Tl.stop(),El.stop()},{once:!0})})();
