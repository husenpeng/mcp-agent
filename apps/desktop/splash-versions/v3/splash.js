(function(){"use strict";const qt={fadeInMs:1100,cameraMs:6300,projectorMs:3200,projectorRampMs:600,beamMs:3500,beamRampMs:650,sparksMs:3650,igniteMs:4150,igniteRampMs:1300,wordmarkDelayMs:5650,wordmarkMs:700,holdMs:7200,waitingDelayMs:1500,reducedMotionHoldMs:400};function zu(i){return i?qt.reducedMotionHoldMs:qt.holdMs}const jo="01ABCDEF23456789#%$@";function Hu(i,e,t=Math.random){if(e>=1)return i;const n=Math.floor(Math.max(0,e)*i.length);return Array.from(i,(r,s)=>r===" "||s<n?r:jo.charAt(Math.floor(t()*jo.length))).join("")}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const zs="186",ku=0,el=1,Gu=2,Dr=1,Vu=2,$i=3,Qn=0,zt=1,tn=2,vn=0,Ji=1,Qi=2,tl=3,nl=4,Wu=5,vi=100,Xu=101,qu=102,Yu=103,Zu=104,Ku=200,$u=201,Ju=202,Qu=203,il=204,rl=205,ju=206,eh=207,th=208,nh=209,ih=210,rh=211,sh=212,ah=213,oh=214,Hs=0,ks=1,Gs=2,ji=3,Vs=4,Ws=5,Xs=6,qs=7,sl=0,lh=1,ch=2,xn=0,al=1,ol=2,ll=3,cl=4,ul=5,hl=6,fl=7,dl=300,jn=301,xi=302,Ys=303,Zs=304,Ur=306,Nr=1e3,_n=1001,Fr=1002,Lt=1003,uh=1004,Or=1005,Ct=1006,Ks=1007,zn=1008,Kt=1009,pl=1010,ml=1011,er=1012,$s=1013,Mn=1014,on=1015,Dt=1016,Js=1017,Qs=1018,tr=1020,gl=35902,vl=35899,xl=1021,_l=1022,ln=1023,Cn=1026,ei=1027,Br=1028,js=1029,ti=1030,ea=1031,ta=1033,zr=33776,Hr=33777,kr=33778,Gr=33779,na=35840,ia=35841,ra=35842,sa=35843,aa=36196,oa=37492,la=37496,ca=37488,ua=37489,Vr=37490,ha=37491,fa=37808,da=37809,pa=37810,ma=37811,ga=37812,va=37813,xa=37814,_a=37815,Ma=37816,Sa=37817,ya=37818,ba=37819,Ea=37820,wa=37821,Ta=36492,Aa=36494,Ra=36495,Ca=36283,Pa=36284,Wr=36285,La=36286,hh=3200,Ml=0,fh=1,Hn="",Yt="srgb",Xr="srgb-linear",qr="linear",ct="srgb",Ia=7680,dh=519,ph=512,mh=513,gh=514,Da=515,vh=516,xh=517,Ua=518,_h=519,Mh=35044,Sl="300 es",Sn=2e3,Yr=2001;function Sh(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Zr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function yh(){const i=Zr("canvas");return i.style.display="block",i}const yl={};function bl(...i){const e="THREE."+i.shift();console.log(e,...i)}function El(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ze(...i){i=El(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function it(...i){i=El(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function _i(...i){const e=i.join(" ");e in yl||(yl[e]=!0,Ze(...i))}function bh(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}const Eh={[Hs]:ks,[Gs]:Xs,[Vs]:qs,[ji]:Ws,[ks]:Hs,[Xs]:Gs,[qs]:Vs,[Ws]:ji};class ni{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const r=n[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Ut=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wl=1234567;const nr=Math.PI/180,ir=180/Math.PI;function ii(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ut[i&255]+Ut[i>>8&255]+Ut[i>>16&255]+Ut[i>>24&255]+"-"+Ut[e&255]+Ut[e>>8&255]+"-"+Ut[e>>16&15|64]+Ut[e>>24&255]+"-"+Ut[t&63|128]+Ut[t>>8&255]+"-"+Ut[t>>16&255]+Ut[t>>24&255]+Ut[n&255]+Ut[n>>8&255]+Ut[n>>16&255]+Ut[n>>24&255]).toLowerCase()}function je(i,e,t){return Math.max(e,Math.min(t,i))}function Na(i,e){return(i%e+e)%e}function wh(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)}function Th(i,e,t){return i!==e?(t-i)/(e-i):0}function rr(i,e,t){return(1-t)*i+t*e}function Ah(i,e,t,n){return rr(i,e,1-Math.exp(-t*n))}function Rh(i,e=1){return e-Math.abs(Na(i,e*2)-e)}function Ch(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Ph(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Lh(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Ih(i,e){return i+Math.random()*(e-i)}function Dh(i){return i*(.5-Math.random())}function Uh(i){i!==void 0&&(wl=i);let e=wl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Nh(i){return i*nr}function Fh(i){return i*ir}function Oh(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function Bh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function zh(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Hh(i,e,t,n,r){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+n)/2),h=a((e+n)/2),f=s((e-n)/2),u=a((e-n)/2),d=s((n-e)/2),g=a((n-e)/2);switch(r){case"XYX":i.set(o*h,l*f,l*u,o*c);break;case"YZY":i.set(l*u,o*h,l*f,o*c);break;case"ZXZ":i.set(l*f,l*u,o*h,o*c);break;case"XZX":i.set(o*h,l*g,l*d,o*c);break;case"YXY":i.set(l*d,o*h,l*g,o*c);break;case"ZYZ":i.set(l*g,l*d,o*h,o*c);break;default:Ze("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Mi(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Ht(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const kh={DEG2RAD:nr,RAD2DEG:ir,generateUUID:ii,clamp:je,euclideanModulo:Na,mapLinear:wh,inverseLerp:Th,lerp:rr,damp:Ah,pingpong:Rh,smoothstep:Ch,smootherstep:Ph,randInt:Lh,randFloat:Ih,randFloatSpread:Dh,seededRandom:Uh,degToRad:Nh,radToDeg:Fh,isPowerOfTwo:Oh,ceilPowerOfTwo:Bh,floorPowerOfTwo:zh,setQuaternionFromProperEuler:Hh,normalize:Ht,denormalize:Mi},qo=class qo{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=je(this.x,e.x,t.x),this.y=je(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=je(this.x,e,t),this.y=je(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};qo.prototype.isVector2=!0;let ue=qo;class kn{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let l=n[r+0],c=n[r+1],h=n[r+2],f=n[r+3],u=s[a+0],d=s[a+1],g=s[a+2],S=s[a+3];if(f!==S||l!==u||c!==d||h!==g){let m=l*u+c*d+h*g+f*S;m<0&&(u=-u,d=-d,g=-g,S=-S,m=-m);let p=1-o;if(m<.9995){const b=Math.acos(m),w=Math.sin(b);p=Math.sin(p*b)/w,o=Math.sin(o*b)/w,l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,f=f*p+S*o}else{l=l*p+u*o,c=c*p+d*o,h=h*p+g*o,f=f*p+S*o;const b=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=b,c*=b,h*=b,f*=b}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],l=n[r+1],c=n[r+2],h=n[r+3],f=s[a],u=s[a+1],d=s[a+2],g=s[a+3];return e[t]=o*g+h*f+l*d-c*u,e[t+1]=l*g+h*u+c*f-o*d,e[t+2]=c*g+h*d+o*u-l*f,e[t+3]=h*g-o*f-l*u-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(r/2),f=o(s/2),u=l(n/2),d=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"YXZ":this._x=u*h*f+c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"ZXY":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f-u*d*g;break;case"ZYX":this._x=u*h*f-c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f+u*d*g;break;case"YZX":this._x=u*h*f+c*d*g,this._y=c*d*f+u*h*g,this._z=c*h*g-u*d*f,this._w=c*h*f-u*d*g;break;case"XZY":this._x=u*h*f-c*d*g,this._y=c*d*f-u*h*g,this._z=c*h*g+u*d*f,this._w=c*h*f+u*d*g;break;default:Ze("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],h=t[6],f=t[10],u=n+o+f;if(u>0){const d=.5/Math.sqrt(u+1);this._w=.25/d,this._x=(h-l)*d,this._y=(s-c)*d,this._z=(a-r)*d}else if(n>o&&n>f){const d=2*Math.sqrt(1+n-o-f);this._w=(h-l)/d,this._x=.25*d,this._y=(r+a)/d,this._z=(s+c)/d}else if(o>f){const d=2*Math.sqrt(1+o-n-f);this._w=(s-c)/d,this._x=(r+a)/d,this._y=.25*d,this._z=(l+h)/d}else{const d=2*Math.sqrt(1+f-n-o);this._w=(a-r)/d,this._x=(s+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(je(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,h=t._w;return this._x=n*h+a*o+r*c-s*l,this._y=r*h+a*l+s*o-n*c,this._z=s*h+a*c+n*l-r*o,this._w=a*h-n*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+n*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Yo=class Yo{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Tl.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Tl.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*n),h=2*(o*t-s*r),f=2*(s*n-a*t);return this.x=t+l*c+a*f-o*h,this.y=n+l*h+o*c-s*f,this.z=r+l*f+s*h-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=je(this.x,e.x,t.x),this.y=je(this.y,e.y,t.y),this.z=je(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=je(this.x,e,t),this.y=je(this.y,e,t),this.z=je(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Fa.copy(this).projectOnVector(e),this.sub(Fa)}reflect(e){return this.sub(Fa.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(je(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Yo.prototype.isVector3=!0;let N=Yo;const Fa=new N,Tl=new kn,Zo=class Zo{constructor(e,t,n,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c)}set(e,t,n,r,s,a,o,l,c){const h=this.elements;return h[0]=e,h[1]=r,h[2]=o,h[3]=t,h[4]=s,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],f=n[7],u=n[2],d=n[5],g=n[8],S=r[0],m=r[3],p=r[6],b=r[1],w=r[4],x=r[7],T=r[2],E=r[5],L=r[8];return s[0]=a*S+o*b+l*T,s[3]=a*m+o*w+l*E,s[6]=a*p+o*x+l*L,s[1]=c*S+h*b+f*T,s[4]=c*m+h*w+f*E,s[7]=c*p+h*x+f*L,s[2]=u*S+d*b+g*T,s[5]=u*m+d*w+g*E,s[8]=u*p+d*x+g*L,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8];return t*a*h-t*o*c-n*s*h+n*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=h*a-o*c,u=o*l-h*s,d=c*s-a*l,g=t*f+n*u+r*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/g;return e[0]=f*S,e[1]=(r*c-h*n)*S,e[2]=(o*n-r*a)*S,e[3]=u*S,e[4]=(h*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=d*S,e[7]=(n*l-c*t)*S,e[8]=(a*t-n*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return _i("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Oa.makeScale(e,t)),this}rotate(e){return _i("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Oa.makeRotation(-e)),this}translate(e,t){return _i("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Oa.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Zo.prototype.isMatrix3=!0;let We=Zo;const Oa=new We,Al=new We().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Rl=new We().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Gh(){const i={enabled:!0,workingColorSpace:Xr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===ct&&(r.r=Pn(r.r),r.g=Pn(r.g),r.b=Pn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===ct&&(r.r=Si(r.r),r.g=Si(r.g),r.b=Si(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Hn?qr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return _i("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return _i("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Xr]:{primaries:e,whitePoint:n,transfer:qr,toXYZ:Al,fromXYZ:Rl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Yt},outputColorSpaceConfig:{drawingBufferColorSpace:Yt}},[Yt]:{primaries:e,whitePoint:n,transfer:ct,toXYZ:Al,fromXYZ:Rl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Yt}}}),i}const nt=Gh();function Pn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Si(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let yi;class Vh{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{yi===void 0&&(yi=Zr("canvas")),yi.width=e.width,yi.height=e.height;const r=yi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=yi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Zr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Pn(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Pn(t[n]/255)*255):t[n]=Pn(t[n]);return{data:t,width:e.width,height:e.height}}else return Ze("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Wh=0;class Ba{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Wh++}),this.uuid=ii(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(za(r[a].image)):s.push(za(r[a]))}else s=za(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function za(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Vh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ze("Texture: Unable to serialize Texture."),{})}let Xh=0;const Ha=new N;class Nt extends ni{constructor(e=Nt.DEFAULT_IMAGE,t=Nt.DEFAULT_MAPPING,n=_n,r=_n,s=Ct,a=zn,o=ln,l=Kt,c=Nt.DEFAULT_ANISOTROPY,h=Hn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Xh++}),this.uuid=ii(),this.name="",this.source=new Ba(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ue(0,0),this.repeat=new ue(1,1),this.center=new ue(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new We,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Ha).x}get height(){return this.source.getSize(Ha).y}get depth(){return this.source.getSize(Ha).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ze(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ze(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==dl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Nr:e.x=e.x-Math.floor(e.x);break;case _n:e.x=e.x<0?0:1;break;case Fr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Nr:e.y=e.y-Math.floor(e.y);break;case _n:e.y=e.y<0?0:1;break;case Fr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Nt.DEFAULT_IMAGE=null,Nt.DEFAULT_MAPPING=dl,Nt.DEFAULT_ANISOTROPY=1;const Ko=class Ko{constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const l=e.elements,c=l[0],h=l[4],f=l[8],u=l[1],d=l[5],g=l[9],S=l[2],m=l[6],p=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-S)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+S)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(c+1)/2,x=(d+1)/2,T=(p+1)/2,E=(h+u)/4,L=(f+S)/4,v=(g+m)/4;return w>x&&w>T?w<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(w),r=E/n,s=L/n):x>T?x<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(x),n=E/r,s=v/r):T<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(T),n=L/s,r=v/s),this.set(n,r,s,t),this}let b=Math.sqrt((m-g)*(m-g)+(f-S)*(f-S)+(u-h)*(u-h));return Math.abs(b)<.001&&(b=1),this.x=(m-g)/b,this.y=(f-S)/b,this.z=(u-h)/b,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=je(this.x,e.x,t.x),this.y=je(this.y,e.y,t.y),this.z=je(this.z,e.z,t.z),this.w=je(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=je(this.x,e,t),this.y=je(this.y,e,t),this.z=je(this.z,e,t),this.w=je(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(je(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ko.prototype.isVector4=!0;let dt=Ko;class qh extends ni{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ct,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new dt(0,0,e,t),this.scissorTest=!1,this.viewport=new dt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:n.depth},s=new Nt(r),a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Ct,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Ba(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class It extends qh{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Cl extends Nt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Lt,this.minFilter=Lt,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Yh extends Nt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Lt,this.minFilter=Lt,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const Fs=class Fs{constructor(e,t,n,r,s,a,o,l,c,h,f,u,d,g,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c,h,f,u,d,g,S,m)}set(e,t,n,r,s,a,o,l,c,h,f,u,d,g,S,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=h,p[10]=f,p[14]=u,p[3]=d,p[7]=g,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Fs().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,r=1/bi.setFromMatrixColumn(e,0).length(),s=1/bi.setFromMatrixColumn(e,1).length(),a=1/bi.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),c=Math.sin(r),h=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const u=a*h,d=a*f,g=o*h,S=o*f;t[0]=l*h,t[4]=-l*f,t[8]=c,t[1]=d+g*c,t[5]=u-S*c,t[9]=-o*l,t[2]=S-u*c,t[6]=g+d*c,t[10]=a*l}else if(e.order==="YXZ"){const u=l*h,d=l*f,g=c*h,S=c*f;t[0]=u+S*o,t[4]=g*o-d,t[8]=a*c,t[1]=a*f,t[5]=a*h,t[9]=-o,t[2]=d*o-g,t[6]=S+u*o,t[10]=a*l}else if(e.order==="ZXY"){const u=l*h,d=l*f,g=c*h,S=c*f;t[0]=u-S*o,t[4]=-a*f,t[8]=g+d*o,t[1]=d+g*o,t[5]=a*h,t[9]=S-u*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const u=a*h,d=a*f,g=o*h,S=o*f;t[0]=l*h,t[4]=g*c-d,t[8]=u*c+S,t[1]=l*f,t[5]=S*c+u,t[9]=d*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const u=a*l,d=a*c,g=o*l,S=o*c;t[0]=l*h,t[4]=S-u*f,t[8]=g*f+d,t[1]=f,t[5]=a*h,t[9]=-o*h,t[2]=-c*h,t[6]=d*f+g,t[10]=u-S*f}else if(e.order==="XZY"){const u=a*l,d=a*c,g=o*l,S=o*c;t[0]=l*h,t[4]=-f,t[8]=c*h,t[1]=u*f+S,t[5]=a*h,t[9]=d*f-g,t[2]=g*f-d,t[6]=o*h,t[10]=S*f+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Zh,e,Kh)}lookAt(e,t,n){const r=this.elements;return $t.subVectors(e,t),$t.lengthSq()===0&&($t.z=1),$t.normalize(),Gn.crossVectors(n,$t),Gn.lengthSq()===0&&(Math.abs(n.z)===1?$t.x+=1e-4:$t.z+=1e-4,$t.normalize(),Gn.crossVectors(n,$t)),Gn.normalize(),Kr.crossVectors($t,Gn),r[0]=Gn.x,r[4]=Kr.x,r[8]=$t.x,r[1]=Gn.y,r[5]=Kr.y,r[9]=$t.y,r[2]=Gn.z,r[6]=Kr.z,r[10]=$t.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],f=n[5],u=n[9],d=n[13],g=n[2],S=n[6],m=n[10],p=n[14],b=n[3],w=n[7],x=n[11],T=n[15],E=r[0],L=r[4],v=r[8],A=r[12],U=r[1],G=r[5],B=r[9],J=r[13],H=r[2],Z=r[6],ie=r[10],$=r[14],K=r[3],re=r[7],se=r[11],he=r[15];return s[0]=a*E+o*U+l*H+c*K,s[4]=a*L+o*G+l*Z+c*re,s[8]=a*v+o*B+l*ie+c*se,s[12]=a*A+o*J+l*$+c*he,s[1]=h*E+f*U+u*H+d*K,s[5]=h*L+f*G+u*Z+d*re,s[9]=h*v+f*B+u*ie+d*se,s[13]=h*A+f*J+u*$+d*he,s[2]=g*E+S*U+m*H+p*K,s[6]=g*L+S*G+m*Z+p*re,s[10]=g*v+S*B+m*ie+p*se,s[14]=g*A+S*J+m*$+p*he,s[3]=b*E+w*U+x*H+T*K,s[7]=b*L+w*G+x*Z+T*re,s[11]=b*v+w*B+x*ie+T*se,s[15]=b*A+w*J+x*$+T*he,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],h=e[2],f=e[6],u=e[10],d=e[14],g=e[3],S=e[7],m=e[11],p=e[15],b=l*d-c*u,w=o*d-c*f,x=o*u-l*f,T=a*d-c*h,E=a*u-l*h,L=a*f-o*h;return t*(S*b-m*w+p*x)-n*(g*b-m*T+p*E)+r*(g*w-S*T+p*L)-s*(g*x-S*E+m*L)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],h=e[10];return t*(a*h-o*c)-n*(s*h-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],h=e[8],f=e[9],u=e[10],d=e[11],g=e[12],S=e[13],m=e[14],p=e[15],b=t*o-n*a,w=t*l-r*a,x=t*c-s*a,T=n*l-r*o,E=n*c-s*o,L=r*c-s*l,v=h*S-f*g,A=h*m-u*g,U=h*p-d*g,G=f*m-u*S,B=f*p-d*S,J=u*p-d*m,H=b*J-w*B+x*G+T*U-E*A+L*v;if(H===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const Z=1/H;return e[0]=(o*J-l*B+c*G)*Z,e[1]=(r*B-n*J-s*G)*Z,e[2]=(S*L-m*E+p*T)*Z,e[3]=(u*E-f*L-d*T)*Z,e[4]=(l*U-a*J-c*A)*Z,e[5]=(t*J-r*U+s*A)*Z,e[6]=(m*x-g*L-p*w)*Z,e[7]=(h*L-u*x+d*w)*Z,e[8]=(a*B-o*U+c*v)*Z,e[9]=(n*U-t*B-s*v)*Z,e[10]=(g*E-S*x+p*b)*Z,e[11]=(f*x-h*E-d*b)*Z,e[12]=(o*A-a*G-l*v)*Z,e[13]=(t*G-n*A+r*v)*Z,e[14]=(S*w-g*T-m*b)*Z,e[15]=(h*T-f*w+u*b)*Z,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,h=s*o;return this.set(c*a+n,c*o-r*l,c*l+r*o,0,c*o+r*l,h*o+n,h*l-r*a,0,c*l-r*o,h*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,h=a+a,f=o+o,u=s*c,d=s*h,g=s*f,S=a*h,m=a*f,p=o*f,b=l*c,w=l*h,x=l*f,T=n.x,E=n.y,L=n.z;return r[0]=(1-(S+p))*T,r[1]=(d+x)*T,r[2]=(g-w)*T,r[3]=0,r[4]=(d-x)*E,r[5]=(1-(u+p))*E,r[6]=(m+b)*E,r[7]=0,r[8]=(g+w)*L,r[9]=(m-b)*L,r[10]=(1-(u+S))*L,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),t.identity(),this;let a=bi.set(r[0],r[1],r[2]).length();const o=bi.set(r[4],r[5],r[6]).length(),l=bi.set(r[8],r[9],r[10]).length();s<0&&(a=-a),cn.copy(this);const c=1/a,h=1/o,f=1/l;return cn.elements[0]*=c,cn.elements[1]*=c,cn.elements[2]*=c,cn.elements[4]*=h,cn.elements[5]*=h,cn.elements[6]*=h,cn.elements[8]*=f,cn.elements[9]*=f,cn.elements[10]*=f,t.setFromRotationMatrix(cn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,r,s,a,o=Sn,l=!1){const c=this.elements,h=2*s/(t-e),f=2*s/(n-r),u=(t+e)/(t-e),d=(n+r)/(n-r);let g,S;if(l)g=s/(a-s),S=a*s/(a-s);else if(o===Sn)g=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===Yr)g=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=Sn,l=!1){const c=this.elements,h=2/(t-e),f=2/(n-r),u=-(t+e)/(t-e),d=-(n+r)/(n-r);let g,S;if(l)g=1/(a-s),S=a/(a-s);else if(o===Sn)g=-2/(a-s),S=-(a+s)/(a-s);else if(o===Yr)g=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};Fs.prototype.isMatrix4=!0;let ut=Fs;const bi=new N,cn=new ut,Zh=new N(0,0,0),Kh=new N(1,1,1),Gn=new N,Kr=new N,$t=new N,Pl=new ut,Ll=new kn;class ri{constructor(e=0,t=0,n=0,r=ri.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],h=r[9],f=r[2],u=r[6],d=r[10];switch(t){case"XYZ":this._y=Math.asin(je(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-je(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(je(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-je(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,d),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(je(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-je(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-h,d),this._y=0);break;default:Ze("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Pl.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Pl,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ll.setFromEuler(this),this.setFromQuaternion(Ll,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ri.DEFAULT_ORDER="XYZ";class Il{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let $h=0;const Dl=new N,Ei=new kn,Ln=new ut,$r=new N,sr=new N,Jh=new N,Qh=new kn,Ul=new N(1,0,0),Nl=new N(0,1,0),Fl=new N(0,0,1),Ol={type:"added"},jh={type:"removed"},wi={type:"childadded",child:null},ka={type:"childremoved",child:null};class Jt extends ni{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:$h++}),this.uuid=ii(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Jt.DEFAULT_UP.clone();const e=new N,t=new ri,n=new kn,r=new N(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ut},normalMatrix:{value:new We}}),this.matrix=new ut,this.matrixWorld=new ut,this.matrixAutoUpdate=Jt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Il,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ei.setFromAxisAngle(e,t),this.quaternion.multiply(Ei),this}rotateOnWorldAxis(e,t){return Ei.setFromAxisAngle(e,t),this.quaternion.premultiply(Ei),this}rotateX(e){return this.rotateOnAxis(Ul,e)}rotateY(e){return this.rotateOnAxis(Nl,e)}rotateZ(e){return this.rotateOnAxis(Fl,e)}translateOnAxis(e,t){return Dl.copy(e).applyQuaternion(this.quaternion),this.position.add(Dl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ul,e)}translateY(e){return this.translateOnAxis(Nl,e)}translateZ(e){return this.translateOnAxis(Fl,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ln.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?$r.copy(e):$r.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),sr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ln.lookAt(sr,$r,this.up):Ln.lookAt($r,sr,this.up),this.quaternion.setFromRotationMatrix(Ln),r&&(Ln.extractRotation(r.matrixWorld),Ei.setFromRotationMatrix(Ln),this.quaternion.premultiply(Ei.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(it("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Ol),wi.child=e,this.dispatchEvent(wi),wi.child=null):it("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(jh),ka.child=e,this.dispatchEvent(ka),ka.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ln.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ln.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ln),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Ol),wi.child=e,this.dispatchEvent(wi),wi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(sr,e,Jh),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(sr,Qh,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*n-s[8]*r,s[13]+=n-s[1]*t-s[5]*n-s[9]*r,s[14]+=r-s[2]*t-s[6]*n-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){const f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),h=a(e.images),f=a(e.shapes),u=a(e.skeletons),d=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),f.length>0&&(n.shapes=f),u.length>0&&(n.skeletons=u),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=r,n;function a(o){const l=[];for(const c in o){const h=o[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Jt.DEFAULT_UP=new N(0,1,0),Jt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Jt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class ar extends Jt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const ef={type:"move"};class Ga{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ar,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ar,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ar,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const S of e.hand.values()){const m=t.getJointPose(S,n),p=this._getHandJoint(c,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&u>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(ef)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new ar;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Bl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Vn={h:0,s:0,l:0},Jr={h:0,s:0,l:0};function Va(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class qe{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Yt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,nt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=nt.workingColorSpace){return this.r=e,this.g=t,this.b=n,nt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=nt.workingColorSpace){if(e=Na(e,1),t=je(t,0,1),n=je(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=Va(a,s,e+1/3),this.g=Va(a,s,e),this.b=Va(a,s,e-1/3)}return nt.colorSpaceToWorking(this,r),this}setStyle(e,t=Yt){function n(s){s!==void 0&&parseFloat(s)<1&&Ze("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ze("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ze("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Yt){const n=Bl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ze("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Pn(e.r),this.g=Pn(e.g),this.b=Pn(e.b),this}copyLinearToSRGB(e){return this.r=Si(e.r),this.g=Si(e.g),this.b=Si(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Yt){return nt.workingToColorSpace(Ft.copy(this),e),Math.round(je(Ft.r*255,0,255))*65536+Math.round(je(Ft.g*255,0,255))*256+Math.round(je(Ft.b*255,0,255))}getHexString(e=Yt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=nt.workingColorSpace){nt.workingToColorSpace(Ft.copy(this),t);const n=Ft.r,r=Ft.g,s=Ft.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let l,c;const h=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=h<=.5?f/(a+o):f/(2-a-o),a){case n:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-n)/f+2;break;case s:l=(n-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=nt.workingColorSpace){return nt.workingToColorSpace(Ft.copy(this),t),e.r=Ft.r,e.g=Ft.g,e.b=Ft.b,e}getStyle(e=Yt){nt.workingToColorSpace(Ft.copy(this),e);const t=Ft.r,n=Ft.g,r=Ft.b;return e!==Yt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(Vn),this.setHSL(Vn.h+e,Vn.s+t,Vn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Vn),e.getHSL(Jr);const n=rr(Vn.h,Jr.h,t),r=rr(Vn.s,Jr.s,t),s=rr(Vn.l,Jr.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Ft=new qe;qe.NAMES=Bl;class tf extends Jt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ri,this.environmentIntensity=1,this.environmentRotation=new ri,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const un=new N,In=new N,Wa=new N,Dn=new N,Ti=new N,Ai=new N,zl=new N,Xa=new N,qa=new N,Ya=new N,Za=new dt,Ka=new dt,$a=new dt;class hn{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),un.subVectors(e,t),r.cross(un);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){un.subVectors(r,t),In.subVectors(n,t),Wa.subVectors(e,t);const a=un.dot(un),o=un.dot(In),l=un.dot(Wa),c=In.dot(In),h=In.dot(Wa),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;const u=1/f,d=(c*l-o*h)*u,g=(a*h-o*l)*u;return s.set(1-d-g,g,d)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Dn)===null?!1:Dn.x>=0&&Dn.y>=0&&Dn.x+Dn.y<=1}static getInterpolation(e,t,n,r,s,a,o,l){return this.getBarycoord(e,t,n,r,Dn)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Dn.x),l.addScaledVector(a,Dn.y),l.addScaledVector(o,Dn.z),l)}static getInterpolatedAttribute(e,t,n,r,s,a){return Za.setScalar(0),Ka.setScalar(0),$a.setScalar(0),Za.fromBufferAttribute(e,t),Ka.fromBufferAttribute(e,n),$a.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(Za,s.x),a.addScaledVector(Ka,s.y),a.addScaledVector($a,s.z),a}static isFrontFacing(e,t,n,r){return un.subVectors(n,t),In.subVectors(e,t),un.cross(In).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return un.subVectors(this.c,this.b),In.subVectors(this.a,this.b),un.cross(In).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return hn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return hn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return hn.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return hn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return hn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;Ti.subVectors(r,n),Ai.subVectors(s,n),Xa.subVectors(e,n);const l=Ti.dot(Xa),c=Ai.dot(Xa);if(l<=0&&c<=0)return t.copy(n);qa.subVectors(e,r);const h=Ti.dot(qa),f=Ai.dot(qa);if(h>=0&&f<=h)return t.copy(r);const u=l*f-h*c;if(u<=0&&l>=0&&h<=0)return a=l/(l-h),t.copy(n).addScaledVector(Ti,a);Ya.subVectors(e,s);const d=Ti.dot(Ya),g=Ai.dot(Ya);if(g>=0&&d<=g)return t.copy(s);const S=d*c-l*g;if(S<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(Ai,o);const m=h*g-d*f;if(m<=0&&f-h>=0&&d-g>=0)return zl.subVectors(s,r),o=(f-h)/(f-h+(d-g)),t.copy(r).addScaledVector(zl,o);const p=1/(m+S+u);return a=S*p,o=u*p,t.copy(n).addScaledVector(Ti,a).addScaledVector(Ai,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class si{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(fn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(fn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=fn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,fn):fn.fromBufferAttribute(s,a),fn.applyMatrix4(e.matrixWorld),this.expandByPoint(fn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Qr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Qr.copy(n.boundingBox)),Qr.applyMatrix4(e.matrixWorld),this.union(Qr)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,fn),fn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(or),jr.subVectors(this.max,or),Ri.subVectors(e.a,or),Ci.subVectors(e.b,or),Pi.subVectors(e.c,or),Wn.subVectors(Ci,Ri),Xn.subVectors(Pi,Ci),ai.subVectors(Ri,Pi);let t=[0,-Wn.z,Wn.y,0,-Xn.z,Xn.y,0,-ai.z,ai.y,Wn.z,0,-Wn.x,Xn.z,0,-Xn.x,ai.z,0,-ai.x,-Wn.y,Wn.x,0,-Xn.y,Xn.x,0,-ai.y,ai.x,0];return!Ja(t,Ri,Ci,Pi,jr)||(t=[1,0,0,0,1,0,0,0,1],!Ja(t,Ri,Ci,Pi,jr))?!1:(es.crossVectors(Wn,Xn),t=[es.x,es.y,es.z],Ja(t,Ri,Ci,Pi,jr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,fn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(fn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Un[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Un[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Un[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Un[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Un[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Un[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Un[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Un[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Un),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Un=[new N,new N,new N,new N,new N,new N,new N,new N],fn=new N,Qr=new si,Ri=new N,Ci=new N,Pi=new N,Wn=new N,Xn=new N,ai=new N,or=new N,jr=new N,es=new N,oi=new N;function Ja(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){oi.fromArray(i,s);const o=r.x*Math.abs(oi.x)+r.y*Math.abs(oi.y)+r.z*Math.abs(oi.z),l=e.dot(oi),c=t.dot(oi),h=n.dot(oi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}const Et=new N,ts=new ue;let nf=0;class Zt extends ni{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:nf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Mh,this.updateRanges=[],this.gpuType=on,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)ts.fromBufferAttribute(this,t),ts.applyMatrix3(e),this.setXY(t,ts.x,ts.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix3(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyMatrix4(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.applyNormalMatrix(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Et.fromBufferAttribute(this,t),Et.transformDirection(e),this.setXYZ(t,Et.x,Et.y,Et.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Mi(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Ht(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Mi(t,this.array)),t}setX(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Mi(t,this.array)),t}setY(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Mi(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Mi(t,this.array)),t}setW(e,t){return this.normalized&&(t=Ht(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),n=Ht(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),n=Ht(n,this.array),r=Ht(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=Ht(t,this.array),n=Ht(n,this.array),r=Ht(r,this.array),s=Ht(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class Hl extends Zt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class kl extends Zt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class et extends Zt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const rf=new si,lr=new N,Qa=new N;class cr{constructor(e=new N,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):rf.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;lr.subVectors(e,this.center);const t=lr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(lr,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Qa.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(lr.copy(e.center).add(Qa)),this.expandByPoint(lr.copy(e.center).sub(Qa))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let sf=0;const nn=new ut,ja=new Jt,Li=new N,Qt=new si,ur=new si,Pt=new N;class xt extends ni{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:sf++}),this.uuid=ii(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Sh(e)?kl:Hl)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new We().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return nn.makeRotationFromQuaternion(e),this.applyMatrix4(nn),this}rotateX(e){return nn.makeRotationX(e),this.applyMatrix4(nn),this}rotateY(e){return nn.makeRotationY(e),this.applyMatrix4(nn),this}rotateZ(e){return nn.makeRotationZ(e),this.applyMatrix4(nn),this}translate(e,t,n){return nn.makeTranslation(e,t,n),this.applyMatrix4(nn),this}scale(e,t,n){return nn.makeScale(e,t,n),this.applyMatrix4(nn),this}lookAt(e){return ja.lookAt(e),ja.updateMatrix(),this.applyMatrix4(ja.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Li).negate(),this.translate(Li.x,Li.y,Li.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new et(n,3))}else{const n=Math.min(e.length,t.count);for(let r=0;r<n;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ze("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new si);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){it("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];Qt.setFromBufferAttribute(s),this.morphTargetsRelative?(Pt.addVectors(this.boundingBox.min,Qt.min),this.boundingBox.expandByPoint(Pt),Pt.addVectors(this.boundingBox.max,Qt.max),this.boundingBox.expandByPoint(Pt)):(this.boundingBox.expandByPoint(Qt.min),this.boundingBox.expandByPoint(Qt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&it('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new cr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){it("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new N,1/0);return}if(e){const n=this.boundingSphere.center;if(Qt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];ur.setFromBufferAttribute(o),this.morphTargetsRelative?(Pt.addVectors(Qt.min,ur.min),Qt.expandByPoint(Pt),Pt.addVectors(Qt.max,ur.max),Qt.expandByPoint(Pt)):(Qt.expandByPoint(ur.min),Qt.expandByPoint(ur.max))}Qt.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)Pt.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(Pt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Pt.fromBufferAttribute(o,c),l&&(Li.fromBufferAttribute(e,c),Pt.add(Li)),r=Math.max(r,n.distanceToSquared(Pt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&it('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){it("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new Zt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let v=0;v<n.count;v++)o[v]=new N,l[v]=new N;const c=new N,h=new N,f=new N,u=new ue,d=new ue,g=new ue,S=new N,m=new N;function p(v,A,U){c.fromBufferAttribute(n,v),h.fromBufferAttribute(n,A),f.fromBufferAttribute(n,U),u.fromBufferAttribute(s,v),d.fromBufferAttribute(s,A),g.fromBufferAttribute(s,U),h.sub(c),f.sub(c),d.sub(u),g.sub(u);const G=1/(d.x*g.y-g.x*d.y);isFinite(G)&&(S.copy(h).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(G),m.copy(f).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(G),o[v].add(S),o[A].add(S),o[U].add(S),l[v].add(m),l[A].add(m),l[U].add(m))}let b=this.groups;b.length===0&&(b=[{start:0,count:e.count}]);for(let v=0,A=b.length;v<A;++v){const U=b[v],G=U.start,B=U.count;for(let J=G,H=G+B;J<H;J+=3)p(e.getX(J+0),e.getX(J+1),e.getX(J+2))}const w=new N,x=new N,T=new N,E=new N;function L(v){T.fromBufferAttribute(r,v),E.copy(T);const A=o[v];w.copy(A),w.sub(T.multiplyScalar(T.dot(A))).normalize(),x.crossVectors(E,A);const G=x.dot(l[v])<0?-1:1;a.setXYZW(v,w.x,w.y,w.z,G)}for(let v=0,A=b.length;v<A;++v){const U=b[v],G=U.start,B=U.count;for(let J=G,H=G+B;J<H;J+=3)L(e.getX(J+0)),L(e.getX(J+1)),L(e.getX(J+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new Zt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let u=0,d=n.count;u<d;u++)n.setXYZ(u,0,0,0);const r=new N,s=new N,a=new N,o=new N,l=new N,c=new N,h=new N,f=new N;if(e)for(let u=0,d=e.count;u<d;u+=3){const g=e.getX(u+0),S=e.getX(u+1),m=e.getX(u+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),h.subVectors(a,s),f.subVectors(r,s),h.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,S),c.fromBufferAttribute(n,m),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(S,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,d=t.count;u<d;u+=3)r.fromBufferAttribute(t,u+0),s.fromBufferAttribute(t,u+1),a.fromBufferAttribute(t,u+2),h.subVectors(a,s),f.subVectors(r,s),h.cross(f),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Pt.fromBufferAttribute(e,t),Pt.normalize(),e.setXYZ(t,Pt.x,Pt.y,Pt.z)}toNonIndexed(){function e(o,l){const c=o.array,h=o.itemSize,f=o.normalized,u=new c.constructor(l.length*h);let d=0,g=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?d=l[S]*o.data.stride+o.offset:d=l[S]*h;for(let p=0;p<h;p++)u[g++]=c[d++]}return new Zt(u,h,f)}if(this.index===null)return Ze("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new xt,n=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,n);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let h=0,f=c.length;h<f;h++){const u=c[h],d=e(u,n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){const d=c[f];h.push(d.toJSON(e.data))}h.length>0&&(r[l]=h,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const r=e.attributes;for(const c in r){const h=r[c];this.setAttribute(c,h.clone(t))}const s=e.morphAttributes;for(const c in s){const h=[],f=s[c];for(let u=0,d=f.length;u<d;u++)h.push(f[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,h=a.length;c<h;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const eo=new N,af=new N,of=new We;class Nn{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=eo.subVectors(n,t).cross(af.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const r=e.delta(eo),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||of.getNormalMatrix(e),r=this.coplanarPoint(eo).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let lf=0;class ns extends ni{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:lf++}),this.uuid=ii(),this.name="",this.type="Material",this.blending=Ji,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=il,this.blendDst=rl,this.blendEquation=vi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new qe(0,0,0),this.blendAlpha=0,this.depthFunc=ji,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=dh,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ia,this.stencilZFail=Ia,this.stencilZPass=Ia,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ze(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ze(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new qe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Nn().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ue().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ue().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Fn=new N,to=new N,is=new N,rs=new N;class cf{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Fn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Fn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Fn.copy(this.origin).addScaledVector(this.direction,t),Fn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){to.copy(e).add(t).multiplyScalar(.5),is.copy(t).sub(e).normalize(),rs.copy(this.origin).sub(to);const s=e.distanceTo(t)*.5,a=-this.direction.dot(is),o=rs.dot(this.direction),l=-rs.dot(is),c=rs.lengthSq(),h=Math.abs(1-a*a);let f,u,d,g;if(h>0)if(f=a*l-o,u=a*o-l,g=s*h,f>=0)if(u>=-g)if(u<=g){const S=1/h;f*=S,u*=S,d=f*(f+a*u+2*o)+u*(a*f+u+2*l)+c}else u=s,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u=-s,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;else u<=-g?(f=Math.max(0,-(-a*s+o)),u=f>0?-s:Math.min(Math.max(-s,-l),s),d=-f*f+u*(u+2*l)+c):u<=g?(f=0,u=Math.min(Math.max(-s,-l),s),d=u*(u+2*l)+c):(f=Math.max(0,-(a*s+o)),u=f>0?s:Math.min(Math.max(-s,-l),s),d=-f*f+u*(u+2*l)+c);else u=a>0?-s:s,f=Math.max(0,-(a*u+o)),d=-f*f+u*(u+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(to).addScaledVector(is,u),d}intersectSphere(e,t){if(e.radius<0)return null;Fn.subVectors(e.center,this.origin);const n=Fn.dot(this.direction),r=Fn.dot(Fn)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,l;const c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(n=(e.min.x-u.x)*c,r=(e.max.x-u.x)*c):(n=(e.max.x-u.x)*c,r=(e.min.x-u.x)*c),h>=0?(s=(e.min.y-u.y)*h,a=(e.max.y-u.y)*h):(s=(e.max.y-u.y)*h,a=(e.min.y-u.y)*h),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-u.z)*f,l=(e.max.z-u.z)*f):(o=(e.max.z-u.z)*f,l=(e.min.z-u.z)*f),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Fn)!==null}intersectTriangle(e,t,n,r,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,f=e.x-a.x,u=e.y-a.y,d=e.z-a.z,g=t.x-a.x,S=t.y-a.y,m=t.z-a.z,p=n.x-a.x,b=n.y-a.y,w=n.z-a.z,x=Math.abs(l),T=Math.abs(c),E=Math.abs(h);let L,v,A,U,G,B,J,H,Z,ie,$,K;if(x>=T&&x>=E?(A=l,B=f,Z=g,K=p,l>=0?(L=c,v=h,U=u,G=d,J=S,H=m,ie=b,$=w):(L=h,v=c,U=d,G=u,J=m,H=S,ie=w,$=b)):T>=E?(A=c,B=u,Z=S,K=b,c>=0?(L=h,v=l,U=d,G=f,J=m,H=g,ie=w,$=p):(L=l,v=h,U=f,G=d,J=g,H=m,ie=p,$=w)):(A=h,B=d,Z=m,K=w,h>=0?(L=l,v=c,U=f,G=u,J=g,H=S,ie=p,$=b):(L=c,v=l,U=u,G=f,J=S,H=g,ie=b,$=p)),A===0)return null;const re=L/A,se=v/A,he=1/A,xe=U-re*B,_e=G-se*B,Ie=J-re*Z,Ne=H-se*Z,Xe=ie-re*K,F=$-se*K,D=Xe*Ne-F*Ie,I=xe*F-_e*Xe,C=Ie*_e-Ne*xe;if(r){if(D<0||I<0||C<0)return null}else if((D<0||I<0||C<0)&&(D>0||I>0||C>0))return null;const z=D+I+C;if(z===0)return null;const j=he*(D*B+I*Z+C*K);return(z>0?j<0:j>0)?null:this.at(j/z,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class hr extends ns{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new qe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ri,this.combine=sl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Gl=new ut,li=new cf,ss=new cr,Vl=new N,as=new N,os=new N,ls=new N,no=new N,cs=new N,Wl=new N,us=new N;class rt extends Jt{constructor(e=new xt,t=new hr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){cs.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const h=o[l],f=s[l];h!==0&&(no.fromBufferAttribute(f,e),a?cs.addScaledVector(no,h):cs.addScaledVector(no.sub(t),h))}t.add(cs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ss.copy(n.boundingSphere),ss.applyMatrix4(s),li.copy(e.ray).recast(e.near),!(ss.containsPoint(li.origin)===!1&&(li.intersectSphere(ss,Vl)===null||li.origin.distanceToSquared(Vl)>(e.far-e.near)**2))&&(Gl.copy(s).invert(),li.copy(e.ray).applyMatrix4(Gl),!(n.boundingBox!==null&&li.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,li)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,h=s.attributes.uv1,f=s.attributes.normal,u=s.groups,d=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,S=u.length;g<S;g++){const m=u[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),w=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let x=b,T=w;x<T;x+=3){const E=o.getX(x),L=o.getX(x+1),v=o.getX(x+2);r=hs(this,p,e,n,c,h,f,E,L,v),r&&(r.faceIndex=Math.floor(x/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),S=Math.min(o.count,d.start+d.count);for(let m=g,p=S;m<p;m+=3){const b=o.getX(m),w=o.getX(m+1),x=o.getX(m+2);r=hs(this,a,e,n,c,h,f,b,w,x),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,S=u.length;g<S;g++){const m=u[g],p=a[m.materialIndex],b=Math.max(m.start,d.start),w=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let x=b,T=w;x<T;x+=3){const E=x,L=x+1,v=x+2;r=hs(this,p,e,n,c,h,f,E,L,v),r&&(r.faceIndex=Math.floor(x/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),S=Math.min(l.count,d.start+d.count);for(let m=g,p=S;m<p;m+=3){const b=m,w=m+1,x=m+2;r=hs(this,a,e,n,c,h,f,b,w,x),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function uf(i,e,t,n,r,s,a,o){let l;if(e.side===zt?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,e.side===Qn,o),l===null)return null;us.copy(o),us.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(us);return c<t.near||c>t.far?null:{distance:c,point:us.clone(),object:i}}function hs(i,e,t,n,r,s,a,o,l,c){i.getVertexPosition(o,as),i.getVertexPosition(l,os),i.getVertexPosition(c,ls);const h=uf(i,e,t,n,as,os,ls,Wl);if(h){const f=new N;hn.getBarycoord(Wl,as,os,ls,f),r&&(h.uv=hn.getInterpolatedAttribute(r,o,l,c,f,new ue)),s&&(h.uv1=hn.getInterpolatedAttribute(s,o,l,c,f,new ue)),a&&(h.normal=hn.getInterpolatedAttribute(a,o,l,c,f,new N),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));const u={a:o,b:l,c,normal:new N,materialIndex:0};hn.getNormal(as,os,ls,u.normal),h.face=u,h.barycoord=f}return h}class io extends Nt{constructor(e=null,t=1,n=1,r,s,a,o,l,c=Lt,h=Lt,f,u){super(null,a,o,l,c,h,r,s,f,u),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class _t extends Zt{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Ii=new ut,Xl=new ut,fs=[],ql=new si,hf=new ut,fr=new rt,dr=new cr;class Di extends rt{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new _t(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,hf)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new si),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ii),ql.copy(e.boundingBox).applyMatrix4(Ii),this.boundingBox.union(ql)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new cr),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ii),dr.copy(e.boundingSphere).applyMatrix4(Ii),this.boundingSphere.union(dr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=n.length+1,a=e*s+1;for(let o=0;o<n.length;o++)n[o]=r[a+o]}raycast(e,t){const n=this.matrixWorld,r=this.count;if(fr.geometry=this.geometry,fr.material=this.material,fr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),dr.copy(this.boundingSphere),dr.applyMatrix4(n),e.ray.intersectsSphere(dr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Ii),Xl.multiplyMatrices(n,Ii),fr.matrixWorld=Xl,fr.raycast(e,fs);for(let a=0,o=fs.length;a<o;a++){const l=fs[a];l.instanceId=s,l.object=this,t.push(l)}fs.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new _t(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new io(new Float32Array(r*this.count),r,this.count,Br,on));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;return s[l]=o,s.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const ci=new cr,ff=new ue(.5,.5),ds=new N;class Yl{constructor(e=new Nn,t=new Nn,n=new Nn,r=new Nn,s=new Nn,a=new Nn){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Sn,n=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],h=s[4],f=s[5],u=s[6],d=s[7],g=s[8],S=s[9],m=s[10],p=s[11],b=s[12],w=s[13],x=s[14],T=s[15];if(r[0].setComponents(c-a,d-h,p-g,T-b).normalize(),r[1].setComponents(c+a,d+h,p+g,T+b).normalize(),r[2].setComponents(c+o,d+f,p+S,T+w).normalize(),r[3].setComponents(c-o,d-f,p-S,T-w).normalize(),n)r[4].setComponents(l,u,m,x).normalize(),r[5].setComponents(c-l,d-u,p-m,T-x).normalize();else if(r[4].setComponents(c-l,d-u,p-m,T-x).normalize(),t===Sn)r[5].setComponents(c+l,d+u,p+m,T+x).normalize();else if(t===Yr)r[5].setComponents(l,u,m,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ci.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ci.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ci)}intersectsSprite(e){ci.center.set(0,0,0);const t=ff.distanceTo(e.center);return ci.radius=.7071067811865476+t,ci.applyMatrix4(e.matrixWorld),this.intersectsSphere(ci)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(ds.x=r.normal.x>0?e.max.x:e.min.x,ds.y=r.normal.y>0?e.max.y:e.min.y,ds.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(ds)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Zl extends Nt{constructor(e=[],t=jn,n,r,s,a,o,l,c,h){super(e,t,n,r,s,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class ro extends Nt{constructor(e,t,n,r,s,a,o,l,c){super(e,t,n,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class pr extends Nt{constructor(e,t,n=Mn,r,s,a,o=Lt,l=Lt,c,h=Cn,f=1){if(h!==Cn&&h!==ei)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const u={width:e,height:t,depth:f};super(u,r,s,a,o,l,h,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ba(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class df extends pr{constructor(e,t=Mn,n=jn,r,s,a=Lt,o=Lt,l,c=Cn){const h={width:e,height:e,depth:1},f=[h,h,h,h,h,h];super(e,e,t,n,r,s,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Kl extends Nt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Ke extends xt{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],h=[],f=[];let u=0,d=0;g("z","y","x",-1,-1,n,t,e,a,s,0),g("z","y","x",1,-1,n,t,-e,a,s,1),g("x","z","y",1,1,e,n,t,r,a,2),g("x","z","y",1,-1,e,n,-t,r,a,3),g("x","y","z",1,-1,e,t,n,r,s,4),g("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new et(c,3)),this.setAttribute("normal",new et(h,3)),this.setAttribute("uv",new et(f,2));function g(S,m,p,b,w,x,T,E,L,v,A){const U=x/L,G=T/v,B=x/2,J=T/2,H=E/2,Z=L+1,ie=v+1;let $=0,K=0;const re=new N;for(let se=0;se<ie;se++){const he=se*G-J;for(let xe=0;xe<Z;xe++){const _e=xe*U-B;re[S]=_e*b,re[m]=he*w,re[p]=H,c.push(re.x,re.y,re.z),re[S]=0,re[m]=0,re[p]=E>0?1:-1,h.push(re.x,re.y,re.z),f.push(xe/L),f.push(1-se/v),$+=1}}for(let se=0;se<v;se++)for(let he=0;he<L;he++){const xe=u+he+Z*se,_e=u+he+Z*(se+1),Ie=u+(he+1)+Z*(se+1),Ne=u+(he+1)+Z*se;l.push(xe,_e,Ne),l.push(_e,Ie,Ne),K+=6}o.addGroup(d,K,A),d+=K,u+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ke(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class so extends xt{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new N,h=new ue;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,u=3;f<=t;f++,u+=3){const d=n+f/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),h.x=(a[u]/e+1)/2,h.y=(a[u+1]/e+1)/2,l.push(h.x,h.y)}for(let f=1;f<=t;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new et(a,3)),this.setAttribute("normal",new et(o,3)),this.setAttribute("uv",new et(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new so(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class Tt extends xt{constructor(e=1,t=1,n=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const h=[],f=[],u=[],d=[];let g=0;const S=[],m=n/2;let p=0;b(),a===!1&&(e>0&&w(!0),t>0&&w(!1)),this.setIndex(h),this.setAttribute("position",new et(f,3)),this.setAttribute("normal",new et(u,3)),this.setAttribute("uv",new et(d,2));function b(){const x=new N,T=new N;let E=0;const L=(t-e)/n;for(let v=0;v<=s;v++){const A=[],U=v/s,G=U*(t-e)+e;for(let B=0;B<=r;B++){const J=B/r,H=J*l+o,Z=Math.sin(H),ie=Math.cos(H);T.x=G*Z,T.y=-U*n+m,T.z=G*ie,f.push(T.x,T.y,T.z),x.set(Z,L,ie).normalize(),u.push(x.x,x.y,x.z),d.push(J,1-U),A.push(g++)}S.push(A)}for(let v=0;v<r;v++)for(let A=0;A<s;A++){const U=S[A][v],G=S[A+1][v],B=S[A+1][v+1],J=S[A][v+1];(e>0||A!==0)&&(h.push(U,G,J),E+=3),(t>0||A!==s-1)&&(h.push(G,B,J),E+=3)}c.addGroup(p,E,0),p+=E}function w(x){const T=g,E=new ue,L=new N;let v=0;const A=x===!0?e:t,U=x===!0?1:-1;for(let B=1;B<=r;B++)f.push(0,m*U,0),u.push(0,U,0),d.push(.5,.5),g++;const G=g;for(let B=0;B<=r;B++){const H=B/r*l+o,Z=Math.cos(H),ie=Math.sin(H);L.x=A*ie,L.y=m*U,L.z=A*Z,f.push(L.x,L.y,L.z),u.push(0,U,0),E.x=Z*.5+.5,E.y=ie*.5*U+.5,d.push(E.x,E.y),g++}for(let B=0;B<r;B++){const J=T+B,H=G+B;x===!0?h.push(H,H+1,J):h.push(H+1,H,J),v+=3}c.addGroup(p,v,x===!0?1:2),p+=v}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Tt(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class ao extends xt{constructor(e=[],t=[],n=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:n,detail:r};const s=[],a=[];o(r),c(n),h(),this.setAttribute("position",new et(s,3)),this.setAttribute("normal",new et(s.slice(),3)),this.setAttribute("uv",new et(a,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function o(b){const w=new N,x=new N,T=new N;for(let E=0;E<t.length;E+=3)d(t[E+0],w),d(t[E+1],x),d(t[E+2],T),l(w,x,T,b)}function l(b,w,x,T){const E=T+1,L=[];for(let v=0;v<=E;v++){L[v]=[];const A=b.clone().lerp(x,v/E),U=w.clone().lerp(x,v/E),G=E-v;for(let B=0;B<=G;B++)B===0&&v===E?L[v][B]=A:L[v][B]=A.clone().lerp(U,B/G)}for(let v=0;v<E;v++)for(let A=0;A<2*(E-v)-1;A++){const U=Math.floor(A/2);A%2===0?(u(L[v][U+1]),u(L[v+1][U]),u(L[v][U])):(u(L[v][U+1]),u(L[v+1][U+1]),u(L[v+1][U]))}}function c(b){const w=new N;for(let x=0;x<s.length;x+=3)w.x=s[x+0],w.y=s[x+1],w.z=s[x+2],w.normalize().multiplyScalar(b),s[x+0]=w.x,s[x+1]=w.y,s[x+2]=w.z}function h(){const b=new N;for(let w=0;w<s.length;w+=3){b.x=s[w+0],b.y=s[w+1],b.z=s[w+2];const x=m(b)/2/Math.PI+.5,T=p(b)/Math.PI+.5;a.push(x,1-T)}g(),f()}function f(){for(let b=0;b<a.length;b+=6){const w=a[b+0],x=a[b+2],T=a[b+4],E=Math.max(w,x,T),L=Math.min(w,x,T);E>.9&&L<.1&&(w<.2&&(a[b+0]+=1),x<.2&&(a[b+2]+=1),T<.2&&(a[b+4]+=1))}}function u(b){s.push(b.x,b.y,b.z)}function d(b,w){const x=b*3;w.x=e[x+0],w.y=e[x+1],w.z=e[x+2]}function g(){const b=new N,w=new N,x=new N,T=new N,E=new ue,L=new ue,v=new ue;for(let A=0,U=0;A<s.length;A+=9,U+=6){b.set(s[A+0],s[A+1],s[A+2]),w.set(s[A+3],s[A+4],s[A+5]),x.set(s[A+6],s[A+7],s[A+8]),E.set(a[U+0],a[U+1]),L.set(a[U+2],a[U+3]),v.set(a[U+4],a[U+5]),T.copy(b).add(w).add(x).divideScalar(3);const G=m(T);S(E,U+0,b,G),S(L,U+2,w,G),S(v,U+4,x,G)}}function S(b,w,x,T){T<0&&b.x===1&&(a[w]=b.x-1),x.x===0&&x.z===0&&(a[w]=T/2/Math.PI+.5)}function m(b){return Math.atan2(b.z,-b.x)}function p(b){return Math.atan2(-b.y,Math.sqrt(b.x*b.x+b.z*b.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ao(e.vertices,e.indices,e.radius,e.detail)}}class yn{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ze("Curve: .getPoint() not implemented.")}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),s+=n.distanceTo(r),t.push(s),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){const n=this.getLengths();let r=0;const s=n.length;let a;t?a=t:a=e*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,n[r]===a)return r/(s-1);const h=n[r],u=n[r+1]-h,d=(a-h)/u;return(r+d)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);const a=this.getPoint(r),o=this.getPoint(s),l=t||(a.isVector2?new ue:new N);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){const n=new N,r=[],s=[],a=[],o=new N,l=new ut;for(let d=0;d<=e;d++){const g=d/e;r[d]=this.getTangentAt(g,new N)}s[0]=new N,a[0]=new N;let c=Number.MAX_VALUE;const h=Math.abs(r[0].x),f=Math.abs(r[0].y),u=Math.abs(r[0].z);h<=c&&(c=h,n.set(1,0,0)),f<=c&&(c=f,n.set(0,1,0)),u<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let d=1;d<=e;d++){if(s[d]=s[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(r[d-1],r[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(je(r[d-1].dot(r[d]),-1,1));s[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(r[d],s[d])}if(t===!0){let d=Math.acos(je(s[0].dot(s[e]),-1,1));d/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(d=-d);for(let g=1;g<=e;g++)s[g].applyMatrix4(l.makeRotationAxis(r[g],d*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}class oo extends yn{constructor(e=0,t=0,n=1,r=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ue){const n=t,r=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);const o=this.aStartAngle+e*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const h=Math.cos(this.aRotation),f=Math.sin(this.aRotation),u=l-this.aX,d=c-this.aY;l=u*h-d*f+this.aX,c=u*f+d*h+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}}class pf extends oo{constructor(e,t,n,r,s,a){super(e,t,n,n,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}}function lo(){let i=0,e=0,t=0,n=0;function r(s,a,o,l){i=s,e=o,t=-3*s+3*a-2*o-l,n=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){r(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,h,f){let u=(a-s)/c-(o-s)/(c+h)+(o-a)/h,d=(o-a)/h-(l-a)/(h+f)+(l-o)/f;u*=h,d*=h,r(a,o,u,d)},calc:function(s){const a=s*s,o=a*s;return i+e*s+t*a+n*o}}}const $l=new N,Jl=new N,co=new lo,uo=new lo,ho=new lo;class fo extends yn{constructor(e=[],t=!1,n="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new N){const n=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,h;this.closed||o>0?c=r[(o-1)%s]:(Jl.subVectors(r[0],r[1]).add(r[0]),c=Jl);const f=r[o%s],u=r[(o+1)%s];if(this.closed||o+2<s?h=r[(o+2)%s]:($l.subVectors(r[s-1],r[s-2]).add(r[s-1]),h=$l),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(f),d),S=Math.pow(f.distanceToSquared(u),d),m=Math.pow(u.distanceToSquared(h),d);S<1e-4&&(S=1),g<1e-4&&(g=S),m<1e-4&&(m=S),co.initNonuniformCatmullRom(c.x,f.x,u.x,h.x,g,S,m),uo.initNonuniformCatmullRom(c.y,f.y,u.y,h.y,g,S,m),ho.initNonuniformCatmullRom(c.z,f.z,u.z,h.z,g,S,m)}else this.curveType==="catmullrom"&&(co.initCatmullRom(c.x,f.x,u.x,h.x,this.tension),uo.initCatmullRom(c.y,f.y,u.y,h.y,this.tension),ho.initCatmullRom(c.z,f.z,u.z,h.z,this.tension));return n.set(co.calc(l),uo.calc(l),ho.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(new N().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}function Ql(i,e,t,n,r){const s=(n-e)*.5,a=(r-t)*.5,o=i*i,l=i*o;return(2*t-2*n+s+a)*l+(-3*t+3*n-2*s-a)*o+s*i+t}function mf(i,e){const t=1-i;return t*t*e}function gf(i,e){return 2*(1-i)*i*e}function vf(i,e){return i*i*e}function mr(i,e,t,n){return mf(i,e)+gf(i,t)+vf(i,n)}function xf(i,e){const t=1-i;return t*t*t*e}function _f(i,e){const t=1-i;return 3*t*t*i*e}function Mf(i,e){return 3*(1-i)*i*i*e}function Sf(i,e){return i*i*i*e}function gr(i,e,t,n,r){return xf(i,e)+_f(i,t)+Mf(i,n)+Sf(i,r)}class jl extends yn{constructor(e=new ue,t=new ue,n=new ue,r=new ue){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new ue){const n=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(gr(e,r.x,s.x,a.x,o.x),gr(e,r.y,s.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class yf extends yn{constructor(e=new N,t=new N,n=new N,r=new N){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new N){const n=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(gr(e,r.x,s.x,a.x,o.x),gr(e,r.y,s.y,a.y,o.y),gr(e,r.z,s.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class ec extends yn{constructor(e=new ue,t=new ue){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ue){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ue){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class bf extends yn{constructor(e=new N,t=new N){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new N){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new N){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class tc extends yn{constructor(e=new ue,t=new ue,n=new ue){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ue){const n=t,r=this.v0,s=this.v1,a=this.v2;return n.set(mr(e,r.x,s.x,a.x),mr(e,r.y,s.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class nc extends yn{constructor(e=new N,t=new N,n=new N){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new N){const n=t,r=this.v0,s=this.v1,a=this.v2;return n.set(mr(e,r.x,s.x,a.x),mr(e,r.y,s.y,a.y),mr(e,r.z,s.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class ic extends yn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ue){const n=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,l=r[a===0?a:a-1],c=r[a],h=r[a>r.length-2?r.length-1:a+1],f=r[a>r.length-3?r.length-1:a+2];return n.set(Ql(o,l.x,c.x,h.x,f.x),Ql(o,l.y,c.y,h.y,f.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(new ue().fromArray(r))}return this}}var ps=Object.freeze({__proto__:null,ArcCurve:pf,CatmullRomCurve3:fo,CubicBezierCurve:jl,CubicBezierCurve3:yf,EllipseCurve:oo,LineCurve:ec,LineCurve3:bf,QuadraticBezierCurve:tc,QuadraticBezierCurve3:nc,SplineCurve:ic});class Ef extends yn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ps[n](t,e))}return this}getPoint(e,t){const n=e*this.getLength(),r=this.getCurveLengths();let s=0;for(;s<r.length;){if(r[s]>=n){const a=r[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}s++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let n;for(let r=0,s=this.curves;r<s.length;r++){const a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){const h=l[c];n&&n.equals(h)||(t.push(h),n=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){const r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const r=e.curves[t];this.curves.push(new ps[r.type]().fromJSON(r))}return this}}class ui extends Ef{constructor(e){super(),this.type="Path",this.currentPoint=new ue,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const n=new ec(this.currentPoint.clone(),new ue(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){const s=new tc(this.currentPoint.clone(),new ue(e,t),new ue(n,r));return this.curves.push(s),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,s,a){const o=new jl(this.currentPoint.clone(),new ue(e,t),new ue(n,r),new ue(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),n=new ic(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,s,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,r,s,a),this}absarc(e,t,n,r,s,a){return this.absellipse(e,t,n,n,r,s,a),this}ellipse(e,t,n,r,s,a,o,l){const c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,n,r,s,a,o,l),this}absellipse(e,t,n,r,s,a,o,l){const c=new oo(e,t,n,r,s,a,o,l);if(this.curves.length>0){const f=c.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(c);const h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}}class po extends ui{constructor(e){super(e),this.uuid=ii(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){const r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const r=e.holes[t];this.holes.push(new ui().fromJSON(r))}return this}}function wf(i,e,t=2){const n=e&&e.length,r=n?e[0]*t:i.length;let s=rc(i,0,r,t,!0);const a=[];if(!s||s.next===s.prev)return a;let o,l,c;if(n&&(s=Pf(i,e,s,t)),i.length>80*t){o=i[0],l=i[1];let h=o,f=l;for(let u=t;u<r;u+=t){const d=i[u],g=i[u+1];d<o&&(o=d),g<l&&(l=g),d>h&&(h=d),g>f&&(f=g)}c=Math.max(h-o,f-l),c=c!==0?32767/c:0}return vr(s,a,t,o,l,c,0),a}function rc(i,e,t,n,r){let s;if(r===kf(i,e,t,n)>0)for(let a=e;a<t;a+=n)s=lc(a/n|0,i[a],i[a+1],s);else for(let a=t-n;a>=e;a-=n)s=lc(a/n|0,i[a],i[a+1],s);return s&&Ui(s,s.next)&&(Mr(s),s=s.next),s}function hi(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(Ui(t,t.next)||vt(t.prev,t,t.next)===0)){if(Mr(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function vr(i,e,t,n,r,s,a){if(!i)return;!a&&s&&Nf(i,n,r,s);let o=i;for(;i.prev!==i.next;){const l=i.prev,c=i.next;if(s?Af(i,n,r,s):Tf(i)){e.push(l.i,i.i,c.i),Mr(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=Rf(hi(i),e),vr(i,e,t,n,r,s,2)):a===2&&Cf(i,e,t,n,r,s):vr(hi(i),e,t,n,r,s,1);break}}}function Tf(i){const e=i.prev,t=i,n=i.next;if(vt(e,t,n)>=0)return!1;const r=e.x,s=t.x,a=n.x,o=e.y,l=t.y,c=n.y,h=Math.min(r,s,a),f=Math.min(o,l,c),u=Math.max(r,s,a),d=Math.max(o,l,c);let g=n.next;for(;g!==e;){if(g.x>=h&&g.x<=u&&g.y>=f&&g.y<=d&&xr(r,o,s,l,a,c,g.x,g.y)&&vt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Af(i,e,t,n){const r=i.prev,s=i,a=i.next;if(vt(r,s,a)>=0)return!1;const o=r.x,l=s.x,c=a.x,h=r.y,f=s.y,u=a.y,d=Math.min(o,l,c),g=Math.min(h,f,u),S=Math.max(o,l,c),m=Math.max(h,f,u),p=mo(d,g,e,t,n),b=mo(S,m,e,t,n);let w=i.prevZ,x=i.nextZ;for(;w&&w.z>=p&&x&&x.z<=b;){if(w.x>=d&&w.x<=S&&w.y>=g&&w.y<=m&&w!==r&&w!==a&&xr(o,h,l,f,c,u,w.x,w.y)&&vt(w.prev,w,w.next)>=0||(w=w.prevZ,x.x>=d&&x.x<=S&&x.y>=g&&x.y<=m&&x!==r&&x!==a&&xr(o,h,l,f,c,u,x.x,x.y)&&vt(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;w&&w.z>=p;){if(w.x>=d&&w.x<=S&&w.y>=g&&w.y<=m&&w!==r&&w!==a&&xr(o,h,l,f,c,u,w.x,w.y)&&vt(w.prev,w,w.next)>=0)return!1;w=w.prevZ}for(;x&&x.z<=b;){if(x.x>=d&&x.x<=S&&x.y>=g&&x.y<=m&&x!==r&&x!==a&&xr(o,h,l,f,c,u,x.x,x.y)&&vt(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function Rf(i,e){let t=i;do{const n=t.prev,r=t.next.next;!Ui(n,r)&&ac(n,t,t.next,r)&&_r(n,r)&&_r(r,n)&&(e.push(n.i,t.i,r.i),Mr(t),Mr(t.next),t=i=r),t=t.next}while(t!==i);return hi(t)}function Cf(i,e,t,n,r,s){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Bf(a,o)){let l=oc(a,o);a=hi(a,a.next),l=hi(l,l.next),vr(a,e,t,n,r,s,0),vr(l,e,t,n,r,s,0);return}o=o.next}a=a.next}while(a!==i)}function Pf(i,e,t,n){const r=[];for(let s=0,a=e.length;s<a;s++){const o=e[s]*n,l=s<a-1?e[s+1]*n:i.length,c=rc(i,o,l,n,!1);c===c.next&&(c.steiner=!0),r.push(Of(c))}r.sort(Lf);for(let s=0;s<r.length;s++)t=If(r[s],t);return t}function Lf(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=n-r}return t}function If(i,e){const t=Df(i,e);if(!t)return e;const n=oc(t,i);return hi(n,n.next),hi(t,t.next)}function Df(i,e){let t=e;const n=i.x,r=i.y;let s=-1/0,a;if(Ui(i,t))return t;do{if(Ui(i,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){const f=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(f<=n&&f>s&&(s=f,a=t.x<t.next.x?t:t.next,f===n))return a}t=t.next}while(t!==e);if(!a)return null;const o=a,l=a.x,c=a.y;let h=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&sc(r<c?n:s,r,l,c,r<c?s:n,r,t.x,t.y)){const f=Math.abs(r-t.y)/(n-t.x);_r(t,i)&&(f<h||f===h&&(t.x>a.x||t.x===a.x&&Uf(a,t)))&&(a=t,h=f)}t=t.next}while(t!==o);return a}function Uf(i,e){return vt(i.prev,i,e.prev)<0&&vt(e.next,i,i.next)<0}function Nf(i,e,t,n){let r=i;do r.z===0&&(r.z=mo(r.x,r.y,e,t,n)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==i);r.prevZ.nextZ=null,r.prevZ=null,Ff(r)}function Ff(i){let e,t=1;do{let n=i,r;i=null;let s=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(r=n,n=n.nextZ,o--):(r=a,a=a.nextZ,l--),s?s.nextZ=r:i=r,r.prevZ=s,s=r;n=a}s.nextZ=null,t*=2}while(e>1);return i}function mo(i,e,t,n,r){return i=(i-t)*r|0,e=(e-n)*r|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function Of(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function sc(i,e,t,n,r,s,a,o){return(r-a)*(e-o)>=(i-a)*(s-o)&&(i-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(n-o)}function xr(i,e,t,n,r,s,a,o){return!(i===a&&e===o)&&sc(i,e,t,n,r,s,a,o)}function Bf(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!zf(i,e)&&(_r(i,e)&&_r(e,i)&&Hf(i,e)&&(vt(i.prev,i,e.prev)||vt(i,e.prev,e))||Ui(i,e)&&vt(i.prev,i,i.next)>0&&vt(e.prev,e,e.next)>0)}function vt(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function Ui(i,e){return i.x===e.x&&i.y===e.y}function ac(i,e,t,n){const r=gs(vt(i,e,t)),s=gs(vt(i,e,n)),a=gs(vt(t,n,i)),o=gs(vt(t,n,e));return!!(r!==s&&a!==o||r===0&&ms(i,t,e)||s===0&&ms(i,n,e)||a===0&&ms(t,i,n)||o===0&&ms(t,e,n))}function ms(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function gs(i){return i>0?1:i<0?-1:0}function zf(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&ac(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function _r(i,e){return vt(i.prev,i,i.next)<0?vt(i,e,i.next)>=0&&vt(i,i.prev,e)>=0:vt(i,e,i.prev)<0||vt(i,i.next,e)<0}function Hf(i,e){let t=i,n=!1;const r=(i.x+e.x)/2,s=(i.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function oc(i,e){const t=go(i.i,i.x,i.y),n=go(e.i,e.x,e.y),r=i.next,s=e.prev;return i.next=e,e.prev=i,t.next=r,r.prev=t,n.next=t,t.prev=n,s.next=n,n.prev=s,n}function lc(i,e,t,n){const r=go(i,e,t);return n?(r.next=n.next,r.prev=n,n.next.prev=r,n.next=r):(r.prev=r,r.next=r),r}function Mr(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function go(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function kf(i,e,t,n){let r=0;for(let s=e,a=t-n;s<t;s+=n)r+=(i[a]-i[s])*(i[s+1]+i[a+1]),a=s;return r}class Gf{static triangulate(e,t,n=2){return wf(e,t,n)}}class qn{static area(e){const t=e.length;let n=0;for(let r=t-1,s=0;s<t;r=s++)n+=e[r].x*e[s].y-e[s].x*e[r].y;return n*.5}static isClockWise(e){return qn.area(e)<0}static triangulateShape(e,t){const n=[],r=[],s=[];cc(e),uc(n,e);let a=e.length;t.forEach(cc);for(let l=0;l<t.length;l++)r.push(a),a+=t[l].length,uc(n,t[l]);const o=Gf.triangulate(n,r);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}}function cc(i){const e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function uc(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}class vs extends xt{constructor(e=new po([new ue(.5,.5),new ue(-.5,.5),new ue(-.5,-.5),new ue(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];const n=this,r=[],s=[];for(let o=0,l=e.length;o<l;o++){const c=e[o];a(c)}this.setAttribute("position",new et(r,3)),this.setAttribute("uv",new et(s,2)),this.computeVertexNormals();function a(o){const l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,f=t.depth!==void 0?t.depth:1;let u=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,S=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3;const p=t.extrudePath,b=t.UVGenerator!==void 0?t.UVGenerator:Vf;let w,x=!1,T,E,L,v;if(p){w=p.getSpacedPoints(h),x=!0,u=!1;const R=p.isCatmullRomCurve3?p.closed:!1;T=p.computeFrenetFrames(h,R),E=new N,L=new N,v=new N}u||(m=0,d=0,g=0,S=0);const A=o.extractPoints(c);let U=A.shape;const G=A.holes;if(!qn.isClockWise(U)){U=U.reverse();for(let R=0,k=G.length;R<k;R++){const O=G[R];qn.isClockWise(O)&&(G[R]=O.reverse())}}function J(R){const O=10000000000000001e-36;let Y=R[0];for(let Q=1;Q<=R.length;Q++){const le=Q%R.length,ge=R[le],pe=ge.x-Y.x,q=ge.y-Y.y,M=pe*pe+q*q,Re=Math.max(Math.abs(ge.x),Math.abs(ge.y),Math.abs(Y.x),Math.abs(Y.y)),Fe=O*Re*Re;if(M<=Fe){R.splice(le,1),Q--;continue}Y=ge}}J(U),G.forEach(J);const H=G.length,Z=U;for(let R=0;R<H;R++){const k=G[R];U=U.concat(k)}function ie(R,k,O){return k||it("ExtrudeGeometry: vec does not exist"),R.clone().addScaledVector(k,O)}const $=U.length;function K(R,k,O){let Y,Q,le;const ge=R.x-k.x,pe=R.y-k.y,q=O.x-R.x,M=O.y-R.y,Re=ge*ge+pe*pe,Fe=ge*M-pe*q;if(Math.abs(Fe)>Number.EPSILON){const P=Math.sqrt(Re),_=Math.sqrt(q*q+M*M),X=k.x-pe/P,ee=k.y+ge/P,oe=O.x-M/_,Me=O.y+q/_,Se=((oe-X)*M-(Me-ee)*q)/(ge*M-pe*q);Y=X+ge*Se-R.x,Q=ee+pe*Se-R.y;const ce=Y*Y+Q*Q;if(ce<=2)return new ue(Y,Q);le=Math.sqrt(ce/2)}else{let P=!1;ge>Number.EPSILON?q>Number.EPSILON&&(P=!0):ge<-Number.EPSILON?q<-Number.EPSILON&&(P=!0):Math.sign(pe)===Math.sign(M)&&(P=!0),P?(Y=-pe,Q=ge,le=Math.sqrt(Re)):(Y=ge,Q=pe,le=Math.sqrt(Re/2))}return new ue(Y/le,Q/le)}const re=[];for(let R=0,k=Z.length,O=k-1,Y=R+1;R<k;R++,O++,Y++)O===k&&(O=0),Y===k&&(Y=0),re[R]=K(Z[R],Z[O],Z[Y]);const se=[];let he,xe=re.concat();for(let R=0,k=H;R<k;R++){const O=G[R];he=[];for(let Y=0,Q=O.length,le=Q-1,ge=Y+1;Y<Q;Y++,le++,ge++)le===Q&&(le=0),ge===Q&&(ge=0),he[Y]=K(O[Y],O[le],O[ge]);se.push(he),xe=xe.concat(he)}let _e;if(m===0)_e=qn.triangulateShape(Z,G);else{const R=[],k=[];for(let O=0;O<m;O++){const Y=O/m,Q=d*Math.cos(Y*Math.PI/2),le=g*Math.sin(Y*Math.PI/2)+S;for(let ge=0,pe=Z.length;ge<pe;ge++){const q=ie(Z[ge],re[ge],le);I(q.x,q.y,-Q),Y===0&&R.push(q)}for(let ge=0,pe=H;ge<pe;ge++){const q=G[ge];he=se[ge];const M=[];for(let Re=0,Fe=q.length;Re<Fe;Re++){const P=ie(q[Re],he[Re],le);I(P.x,P.y,-Q),Y===0&&M.push(P)}Y===0&&k.push(M)}}_e=qn.triangulateShape(R,k)}const Ie=_e.length,Ne=g+S;for(let R=0;R<$;R++){const k=u?ie(U[R],xe[R],Ne):U[R];x?(L.copy(T.normals[0]).multiplyScalar(k.x),E.copy(T.binormals[0]).multiplyScalar(k.y),v.copy(w[0]).add(L).add(E),I(v.x,v.y,v.z)):I(k.x,k.y,0)}for(let R=1;R<=h;R++)for(let k=0;k<$;k++){const O=u?ie(U[k],xe[k],Ne):U[k];x?(L.copy(T.normals[R]).multiplyScalar(O.x),E.copy(T.binormals[R]).multiplyScalar(O.y),v.copy(w[R]).add(L).add(E),I(v.x,v.y,v.z)):I(O.x,O.y,f/h*R)}for(let R=m-1;R>=0;R--){const k=R/m,O=d*Math.cos(k*Math.PI/2),Y=g*Math.sin(k*Math.PI/2)+S;for(let Q=0,le=Z.length;Q<le;Q++){const ge=ie(Z[Q],re[Q],Y);I(ge.x,ge.y,f+O)}for(let Q=0,le=G.length;Q<le;Q++){const ge=G[Q];he=se[Q];for(let pe=0,q=ge.length;pe<q;pe++){const M=ie(ge[pe],he[pe],Y);x?I(M.x,M.y+w[h-1].y,w[h-1].x+O):I(M.x,M.y,f+O)}}}Xe(),F();function Xe(){const R=r.length/3;if(u){let k=0,O=$*k;for(let Y=0;Y<Ie;Y++){const Q=_e[Y];C(Q[2]+O,Q[1]+O,Q[0]+O)}k=h+m*2,O=$*k;for(let Y=0;Y<Ie;Y++){const Q=_e[Y];C(Q[0]+O,Q[1]+O,Q[2]+O)}}else{for(let k=0;k<Ie;k++){const O=_e[k];C(O[2],O[1],O[0])}for(let k=0;k<Ie;k++){const O=_e[k];C(O[0]+$*h,O[1]+$*h,O[2]+$*h)}}n.addGroup(R,r.length/3-R,0)}function F(){const R=r.length/3;let k=0;D(Z,k),k+=Z.length;for(let O=0,Y=G.length;O<Y;O++){const Q=G[O];D(Q,k),k+=Q.length}n.addGroup(R,r.length/3-R,1)}function D(R,k){let O=R.length;for(;--O>=0;){const Y=O;let Q=O-1;Q<0&&(Q=R.length-1);for(let le=0,ge=h+m*2;le<ge;le++){const pe=$*le,q=$*(le+1),M=k+Y+pe,Re=k+Q+pe,Fe=k+Q+q,P=k+Y+q;z(M,Re,Fe,P)}}}function I(R,k,O){l.push(R),l.push(k),l.push(O)}function C(R,k,O){j(R),j(k),j(O);const Y=r.length/3,Q=b.generateTopUV(n,r,Y-3,Y-2,Y-1);me(Q[0]),me(Q[1]),me(Q[2])}function z(R,k,O,Y){j(R),j(k),j(Y),j(k),j(O),j(Y);const Q=r.length/3,le=b.generateSideWallUV(n,r,Q-6,Q-3,Q-2,Q-1);me(le[0]),me(le[1]),me(le[3]),me(le[1]),me(le[2]),me(le[3])}function j(R){r.push(l[R*3+0]),r.push(l[R*3+1]),r.push(l[R*3+2])}function me(R){s.push(R.x),s.push(R.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Wf(t,n,e)}static fromJSON(e,t){const n=[];for(let s=0,a=e.shapes.length;s<a;s++){const o=t[e.shapes[s]];n.push(o)}const r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new ps[r.type]().fromJSON(r)),new vs(n,e.options)}}const Vf={generateTopUV:function(i,e,t,n,r){const s=e[t*3],a=e[t*3+1],o=e[n*3],l=e[n*3+1],c=e[r*3],h=e[r*3+1];return[new ue(s,a),new ue(o,l),new ue(c,h)]},generateSideWallUV:function(i,e,t,n,r,s){const a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[n*3],h=e[n*3+1],f=e[n*3+2],u=e[r*3],d=e[r*3+1],g=e[r*3+2],S=e[s*3],m=e[s*3+1],p=e[s*3+2];return Math.abs(o-h)<Math.abs(a-c)?[new ue(a,1-l),new ue(c,1-f),new ue(u,1-g),new ue(S,1-p)]:[new ue(o,1-l),new ue(h,1-f),new ue(d,1-g),new ue(m,1-p)]}};function Wf(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,r=i.length;n<r;n++){const s=i[n];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}class vo extends ao{constructor(e=1,t=0){const n=(1+Math.sqrt(5))/2,r=[-1,n,0,1,n,0,-1,-n,0,1,-n,0,0,-1,n,0,1,n,0,-1,-n,0,1,-n,n,0,-1,n,0,1,-n,0,-1,-n,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new vo(e.radius,e.detail)}}class Ni extends xt{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(r),c=o+1,h=l+1,f=e/o,u=t/l,d=[],g=[],S=[],m=[];for(let p=0;p<h;p++){const b=p*u-a;for(let w=0;w<c;w++){const x=w*f-s;g.push(x,-b,0),S.push(0,0,1),m.push(w/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let b=0;b<o;b++){const w=b+c*p,x=b+c*(p+1),T=b+1+c*(p+1),E=b+1+c*p;d.push(w,x,E),d.push(x,T,E)}this.setIndex(d),this.setAttribute("position",new et(g,3)),this.setAttribute("normal",new et(S,3)),this.setAttribute("uv",new et(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ni(e.width,e.height,e.widthSegments,e.heightSegments)}}class Fi extends xt{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const h=[],f=new N,u=new N,d=[],g=[],S=[],m=[];for(let p=0;p<=n;p++){const b=[],w=p/n,x=a+w*o,T=e*Math.cos(x),E=Math.sqrt(e*e-T*T);let L=0;p===0&&a===0?L=.5/t:p===n&&l===Math.PI&&(L=-.5/t);for(let v=0;v<=t;v++){const A=v/t,U=r+A*s;f.x=-E*Math.cos(U),f.y=T,f.z=E*Math.sin(U),g.push(f.x,f.y,f.z),u.copy(f).normalize(),S.push(u.x,u.y,u.z),m.push(A+L,1-w),b.push(c++)}h.push(b)}for(let p=0;p<n;p++)for(let b=0;b<t;b++){const w=h[p][b+1],x=h[p][b],T=h[p+1][b],E=h[p+1][b+1];(p!==0||a>0)&&d.push(w,x,E),(p!==n-1||l<Math.PI)&&d.push(x,T,E)}this.setIndex(d),this.setAttribute("position",new et(g,3)),this.setAttribute("normal",new et(S,3)),this.setAttribute("uv",new et(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fi(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class xs extends xt{constructor(e=1,t=.4,n=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);const l=[],c=[],h=[],f=[],u=new N,d=new N,g=new N;for(let S=0;S<=n;S++){const m=a+S/n*o;for(let p=0;p<=r;p++){const b=p/r*s;d.x=(e+t*Math.cos(m))*Math.cos(b),d.y=(e+t*Math.cos(m))*Math.sin(b),d.z=t*Math.sin(m),c.push(d.x,d.y,d.z),u.x=e*Math.cos(b),u.y=e*Math.sin(b),g.subVectors(d,u).normalize(),h.push(g.x,g.y,g.z),f.push(p/r),f.push(S/n)}}for(let S=1;S<=n;S++)for(let m=1;m<=r;m++){const p=(r+1)*S+m-1,b=(r+1)*(S-1)+m-1,w=(r+1)*(S-1)+m,x=(r+1)*S+m;l.push(p,b,x),l.push(b,w,x)}this.setIndex(l),this.setAttribute("position",new et(c,3)),this.setAttribute("normal",new et(h,3)),this.setAttribute("uv",new et(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new xs(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}class _s extends xt{constructor(e=new nc(new N(-1,-1,0),new N(-1,1,0),new N(1,1,0)),t=64,n=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:r,closed:s};const a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new N,l=new N,c=new ue;let h=new N;const f=[],u=[],d=[],g=[];S(),this.setIndex(g),this.setAttribute("position",new et(f,3)),this.setAttribute("normal",new et(u,3)),this.setAttribute("uv",new et(d,2));function S(){for(let w=0;w<t;w++)m(w);m(s===!1?t:0),b(),p()}function m(w){h=e.getPointAt(w/t,h);const x=a.normals[w],T=a.binormals[w];for(let E=0;E<=r;E++){const L=E/r*Math.PI*2,v=Math.sin(L),A=-Math.cos(L);l.x=A*x.x+v*T.x,l.y=A*x.y+v*T.y,l.z=A*x.z+v*T.z,l.normalize(),u.push(l.x,l.y,l.z),o.x=h.x+n*l.x,o.y=h.y+n*l.y,o.z=h.z+n*l.z,f.push(o.x,o.y,o.z)}}function p(){for(let w=1;w<=t;w++)for(let x=1;x<=r;x++){const T=(r+1)*(w-1)+(x-1),E=(r+1)*w+(x-1),L=(r+1)*w+x,v=(r+1)*(w-1)+x;g.push(T,E,v),g.push(E,L,v)}}function b(){for(let w=0;w<=t;w++)for(let x=0;x<=r;x++)c.x=w/t,c.y=x/r,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new _s(new ps[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}}function Oi(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];if(hc(r))r.isRenderTargetTexture?(Ze("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone();else if(Array.isArray(r))if(hc(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][n]=s}else e[t][n]=r.slice();else e[t][n]=r}}return e}function kt(i){const e={};for(let t=0;t<i.length;t++){const n=Oi(i[t]);for(const r in n)e[r]=n[r]}return e}function hc(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Xf(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function fc(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:nt.workingColorSpace}const Sr={clone:Oi,merge:kt};var qf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Yf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Mt extends ns{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=qf,this.fragmentShader=Yf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Oi(e.uniforms),this.uniformsGroups=Xf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=t[r.value]||null;break;case"c":this.uniforms[n].value=new qe().setHex(r.value);break;case"v2":this.uniforms[n].value=new ue().fromArray(r.value);break;case"v3":this.uniforms[n].value=new N().fromArray(r.value);break;case"v4":this.uniforms[n].value=new dt().fromArray(r.value);break;case"m3":this.uniforms[n].value=new We().fromArray(r.value);break;case"m4":this.uniforms[n].value=new ut().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Zf extends Mt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Kf extends ns{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=hh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class $f extends ns{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const dc={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(pc(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!pc(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function pc(i){try{const e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class Jf{constructor(e,t,n){const r=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(h){o++,s===!1&&r.onStart!==void 0&&r.onStart(h,a,o),s=!0},this.itemEnd=function(h){a++,r.onProgress!==void 0&&r.onProgress(h,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(h){r.onError!==void 0&&r.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){const f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=c.length;f<u;f+=2){const d=c[f],g=c[f+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const Qf=new Jf;class xo{constructor(e){this.manager=e!==void 0?e:Qf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(r,s){n.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}xo.DEFAULT_MATERIAL_NAME="__DEFAULT";const On={};class jf extends Error{constructor(e,t){super(e),this.response=t}}class ed extends xo{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=dc.get(`file:${e}`);if(s!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0);return}if(On[e]!==void 0){On[e].push({onLoad:t,onProgress:n,onError:r});return}On[e]=[],On[e].push({onLoad:t,onProgress:n,onError:r});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ze("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const h=On[e],f=c.body.getReader(),u=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=u?parseInt(u):0,g=d!==0;let S=0;const m=new ReadableStream({start(p){b();function b(){f.read().then(({done:w,value:x})=>{if(w)p.close();else{S+=x.byteLength;const T=new ProgressEvent("progress",{lengthComputable:g,loaded:S,total:d});for(let E=0,L=h.length;E<L;E++){const v=h[E];v.onProgress&&v.onProgress(T)}p.enqueue(x),b()}},w=>{p.error(w)})}}});return new Response(m)}else throw new jf(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(h=>new DOMParser().parseFromString(h,o));case"json":return c.json();default:if(o==="")return c.text();{const f=/charset="?([^;"\s]*)"?/i.exec(o),u=f&&f[1]?f[1].toLowerCase():void 0,d=new TextDecoder(u);return c.arrayBuffer().then(g=>d.decode(g))}}}).then(c=>{dc.add(`file:${e}`,c);const h=On[e];delete On[e];for(let f=0,u=h.length;f<u;f++){const d=h[f];d.onLoad&&d.onLoad(c)}}).catch(c=>{const h=On[e];if(h===void 0)throw this.manager.itemError(e),c;delete On[e];for(let f=0,u=h.length;f<u;f++){const d=h[f];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Ms=new N,Ss=new kn,bn=new N;class mc extends Jt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ut,this.projectionMatrix=new ut,this.projectionMatrixInverse=new ut,this.coordinateSystem=Sn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ms,Ss,bn),bn.x===1&&bn.y===1&&bn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ms,Ss,bn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Ms,Ss,bn),bn.x===1&&bn.y===1&&bn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ms,Ss,bn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Yn=new N,gc=new ue,vc=new ue;class jt extends mc{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=ir*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(nr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ir*2*Math.atan(Math.tan(nr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Yn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z),Yn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Yn.x,Yn.y).multiplyScalar(-e/Yn.z)}getViewSize(e,t){return this.getViewBounds(e,gc,vc),t.subVectors(vc,gc)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(nr*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*n/c,r*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class _o extends mc{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class td extends xt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const Bi=-90,zi=1;class nd extends Jt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new jt(Bi,zi,e,t);r.layers=this.layers,this.add(r);const s=new jt(Bi,zi,e,t);s.layers=this.layers,this.add(s);const a=new jt(Bi,zi,e,t);a.layers=this.layers,this.add(a);const o=new jt(Bi,zi,e,t);o.layers=this.layers,this.add(o);const l=new jt(Bi,zi,e,t);l.layers=this.layers,this.add(l);const c=new jt(Bi,zi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===Sn)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===Yr)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,h]=this.children,f=e.getRenderTarget(),u=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=S,e.setRenderTarget(n,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(f,u,d),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class id extends jt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class rd{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=sd.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}}function sd(){this._document.hidden===!1&&this.reset()}const $o=class $o{constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=n,s[3]=r,this}};$o.prototype.isMatrix2=!0;let xc=$o;const _c=new ue;class Mc{constructor(e=new ue(1/0,1/0),t=new ue(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=_c.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,_c).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}class fi{constructor(){this.type="ShapePath",this.color=new qe,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new ui,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,n,r){return this.currentPath.quadraticCurveTo(e,t,n,r),this}bezierCurveTo(e,t,n,r,s,a){return this.currentPath.bezierCurveTo(e,t,n,r,s,a),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(l,c){let h=!1;const f=c.length;for(let u=0,d=f-1;u<f;d=u++){const g=c[u],S=c[d];g.y>l.y!=S.y>l.y&&l.x<(S.x-g.x)*(l.y-g.y)/(S.y-g.y)+g.x&&(h=!h)}return h}function t(l,c){const h=c.getCenter(new ue);if(e(h,l))return h;const f=h.y,u=[],d=l.length;for(let g=0;g<d;g++){const S=l[g],m=l[(g+1)%d];if(S.y>f!=m.y>f){const p=S.x+(f-S.y)*(m.x-S.x)/(m.y-S.y);u.push(p)}}return u.length>1&&(u.sort((g,S)=>g-S),h.x=(u[0]+u[1])/2),h}let n=this.userData.style&&this.userData.style.fillRule||"nonzero";n!=="nonzero"&&n!=="evenodd"&&(Ze('Fill-rule "'+n+'" is not supported, falling back to "nonzero".'),n="nonzero");const r=n==="nonzero"?(l=>l!==0):(l=>(l&1)!==0),s=[];for(const l of this.subPaths){const c=l.getPoints();if(c.length<3)continue;const h=qn.area(c);if(h===0)continue;const f=new Mc;for(let u=0;u<c.length;u++)f.expandByPoint(c[u]);s.push({subPath:l,points:c,boundingBox:f,interiorPoint:t(c,f),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}s.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<s.length;l++){const c=s[l];let h=0;for(let f=l-1;f>=0;f--){const u=s[f];if(u.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,u.points)){c.container=u.exclude?u.container:u,h=u.winding,c.winding+=h;break}}r(c.winding)===r(h)&&(c.exclude=!0)}for(const l of s)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");const a=[],o=new Map;for(const l of s){if(l.exclude||l.role!=="outer")continue;const c=new po;c.curves=l.subPath.curves,a.push(c),o.set(l,c)}for(const l of s){if(l.exclude||l.role!=="hole")continue;const c=o.get(l.container);if(!c)continue;const h=new ui;h.curves=l.subPath.curves,c.holes.push(h)}return a}}function Sc(i,e,t,n){const r=ad(n);switch(t){case xl:return i*e;case Br:return i*e/r.components*r.byteLength;case js:return i*e/r.components*r.byteLength;case ti:return i*e*2/r.components*r.byteLength;case ea:return i*e*2/r.components*r.byteLength;case _l:return i*e*3/r.components*r.byteLength;case ln:return i*e*4/r.components*r.byteLength;case ta:return i*e*4/r.components*r.byteLength;case zr:case Hr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case kr:case Gr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ia:case sa:return Math.max(i,16)*Math.max(e,8)/4;case na:case ra:return Math.max(i,8)*Math.max(e,8)/2;case aa:case oa:case ca:case ua:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case la:case Vr:case ha:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case fa:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case da:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case pa:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case ma:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case ga:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case va:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case xa:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case _a:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case Ma:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Sa:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case ya:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case ba:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Ea:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case wa:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Ta:case Aa:case Ra:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Ca:case Pa:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Wr:case La:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function ad(i){switch(i){case Kt:case pl:return{byteLength:1,components:1};case er:case ml:case Dt:return{byteLength:2,components:1};case Js:case Qs:return{byteLength:2,components:4};case Mn:case $s:case on:return{byteLength:4,components:1};case gl:case vl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:zs}})),typeof window<"u"&&(window.__THREE__?Ze("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=zs);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function yc(){let i=null,e=!1,t=null,n=null;function r(s,a){n=i.requestAnimationFrame(r),t(s,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function od(i){const e=new WeakMap;function t(o,l){const c=o.array,h=o.usage,f=c.byteLength,u=i.createBuffer();i.bindBuffer(l,u),i.bufferData(l,c,h),o.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){const h=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,h);else{f.sort((d,g)=>d.start-g.start);let u=0;for(let d=1;d<f.length;d++){const g=f[u],S=f[d];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++u,f[u]=S)}f.length=u+1;for(let d=0,g=f.length;d<g;d++){const S=f[d];i.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const h=e.get(o);(!h||h.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var ld=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,cd=`#ifdef USE_ALPHAHASH
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
#endif`,ud=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,hd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,fd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,dd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,pd=`#ifdef USE_AOMAP
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
#endif`,md=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,gd=`#ifdef USE_BATCHING
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
#endif`,vd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,xd=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,_d=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Md=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,Sd=`#ifdef USE_IRIDESCENCE
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
#endif`,yd=`#ifdef USE_BUMPMAP
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
#endif`,bd=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,Ed=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,wd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Td=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ad=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Rd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Cd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Pd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Ld=`#define PI 3.141592653589793
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
} // validated`,Id=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Dd=`vec3 transformedNormal = objectNormal;
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
#endif`,Ud=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Nd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Fd=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Od=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Bd="gl_FragColor = linearToOutputTexel( gl_FragColor );",zd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Hd=`#ifdef USE_ENVMAP
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
#endif`,kd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Gd=`#ifdef USE_ENVMAP
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
#endif`,Vd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Wd=`#ifdef USE_ENVMAP
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
#endif`,Xd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,qd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Yd=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Zd=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Kd=`#ifdef USE_GRADIENTMAP
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
}`,$d=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Jd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Qd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,jd=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,ep=`#ifdef USE_ENVMAP
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
#endif`,tp=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,np=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,ip=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,rp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,sp=`PhysicalMaterial material;
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
#endif`,ap=`uniform sampler2D dfgLUT;
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
}`,op=`
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
#endif`,lp=`#if defined( RE_IndirectDiffuse )
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
#endif`,cp=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,up=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,hp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,fp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,dp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,pp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,mp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,gp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,vp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,xp=`#if defined( USE_POINTS_UV )
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
#endif`,_p=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Mp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Sp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,yp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,bp=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ep=`#ifdef USE_MORPHTARGETS
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
#endif`,wp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Tp=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Ap=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Rp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Cp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Pp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Lp=`#ifdef USE_NORMALMAP
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
#endif`,Ip=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Dp=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Up=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Np=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Fp=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Op=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,Bp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,zp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Hp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,kp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Gp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Vp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Wp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Xp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,qp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Yp=`float getShadowMask() {
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
}`,Zp=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Kp=`#ifdef USE_SKINNING
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
#endif`,$p=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Jp=`#ifdef USE_SKINNING
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
#endif`,Qp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,jp=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,em=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,nm=`#ifdef USE_TRANSMISSION
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
#endif`,im=`#ifdef USE_TRANSMISSION
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
#endif`,rm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,sm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,am=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,om=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Je={alphahash_fragment:ld,alphahash_pars_fragment:cd,alphamap_fragment:ud,alphamap_pars_fragment:hd,alphatest_fragment:fd,alphatest_pars_fragment:dd,aomap_fragment:pd,aomap_pars_fragment:md,batching_pars_vertex:gd,batching_vertex:vd,begin_vertex:xd,beginnormal_vertex:_d,bsdfs:Md,iridescence_fragment:Sd,bumpmap_pars_fragment:yd,clipping_planes_fragment:bd,clipping_planes_pars_fragment:Ed,clipping_planes_pars_vertex:wd,clipping_planes_vertex:Td,color_fragment:Ad,color_pars_fragment:Rd,color_pars_vertex:Cd,color_vertex:Pd,common:Ld,cube_uv_reflection_fragment:Id,defaultnormal_vertex:Dd,displacementmap_pars_vertex:Ud,displacementmap_vertex:Nd,emissivemap_fragment:Fd,emissivemap_pars_fragment:Od,colorspace_fragment:Bd,colorspace_pars_fragment:zd,envmap_fragment:Hd,envmap_common_pars_fragment:kd,envmap_pars_fragment:Gd,envmap_pars_vertex:Vd,envmap_physical_pars_fragment:ep,envmap_vertex:Wd,fog_vertex:Xd,fog_pars_vertex:qd,fog_fragment:Yd,fog_pars_fragment:Zd,gradientmap_pars_fragment:Kd,lightmap_pars_fragment:$d,lights_lambert_fragment:Jd,lights_lambert_pars_fragment:Qd,lights_pars_begin:jd,lights_toon_fragment:tp,lights_toon_pars_fragment:np,lights_phong_fragment:ip,lights_phong_pars_fragment:rp,lights_physical_fragment:sp,lights_physical_pars_fragment:ap,lights_fragment_begin:op,lights_fragment_maps:lp,lights_fragment_end:cp,lightprobes_pars_fragment:up,logdepthbuf_fragment:hp,logdepthbuf_pars_fragment:fp,logdepthbuf_pars_vertex:dp,logdepthbuf_vertex:pp,map_fragment:mp,map_pars_fragment:gp,map_particle_fragment:vp,map_particle_pars_fragment:xp,metalnessmap_fragment:_p,metalnessmap_pars_fragment:Mp,morphinstance_vertex:Sp,morphcolor_vertex:yp,morphnormal_vertex:bp,morphtarget_pars_vertex:Ep,morphtarget_vertex:wp,normal_fragment_begin:Tp,normal_fragment_maps:Ap,normal_pars_fragment:Rp,normal_pars_vertex:Cp,normal_vertex:Pp,normalmap_pars_fragment:Lp,clearcoat_normal_fragment_begin:Ip,clearcoat_normal_fragment_maps:Dp,clearcoat_pars_fragment:Up,iridescence_pars_fragment:Np,opaque_fragment:Fp,packing:Op,premultiplied_alpha_fragment:Bp,project_vertex:zp,dithering_fragment:Hp,dithering_pars_fragment:kp,roughnessmap_fragment:Gp,roughnessmap_pars_fragment:Vp,shadowmap_pars_fragment:Wp,shadowmap_pars_vertex:Xp,shadowmap_vertex:qp,shadowmask_pars_fragment:Yp,skinbase_vertex:Zp,skinning_pars_vertex:Kp,skinning_vertex:$p,skinnormal_vertex:Jp,specularmap_fragment:Qp,specularmap_pars_fragment:jp,tonemapping_fragment:em,tonemapping_pars_fragment:tm,transmission_fragment:nm,transmission_pars_fragment:im,uv_pars_fragment:rm,uv_pars_vertex:sm,uv_vertex:am,worldpos_vertex:om,background_vert:`varying vec2 vUv;
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
}`},Ae={common:{diffuse:{value:new qe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new We},alphaMap:{value:null},alphaMapTransform:{value:new We},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new We}},envmap:{envMap:{value:null},envMapRotation:{value:new We},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new We}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new We}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new We},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new We},normalScale:{value:new ue(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new We},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new We}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new We}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new We}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new qe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new N},probesMax:{value:new N},probesResolution:{value:new N}},points:{diffuse:{value:new qe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new We},alphaTest:{value:0},uvTransform:{value:new We}},sprite:{diffuse:{value:new qe(16777215)},opacity:{value:1},center:{value:new ue(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new We},alphaMap:{value:null},alphaMapTransform:{value:new We},alphaTest:{value:0}}},En={basic:{uniforms:kt([Ae.common,Ae.specularmap,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.fog]),vertexShader:Je.meshbasic_vert,fragmentShader:Je.meshbasic_frag},lambert:{uniforms:kt([Ae.common,Ae.specularmap,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.fog,Ae.lights,{emissive:{value:new qe(0)},envMapIntensity:{value:1}}]),vertexShader:Je.meshlambert_vert,fragmentShader:Je.meshlambert_frag},phong:{uniforms:kt([Ae.common,Ae.specularmap,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.fog,Ae.lights,{emissive:{value:new qe(0)},specular:{value:new qe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Je.meshphong_vert,fragmentShader:Je.meshphong_frag},standard:{uniforms:kt([Ae.common,Ae.envmap,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.roughnessmap,Ae.metalnessmap,Ae.fog,Ae.lights,{emissive:{value:new qe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Je.meshphysical_vert,fragmentShader:Je.meshphysical_frag},toon:{uniforms:kt([Ae.common,Ae.aomap,Ae.lightmap,Ae.emissivemap,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.gradientmap,Ae.fog,Ae.lights,{emissive:{value:new qe(0)}}]),vertexShader:Je.meshtoon_vert,fragmentShader:Je.meshtoon_frag},matcap:{uniforms:kt([Ae.common,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,Ae.fog,{matcap:{value:null}}]),vertexShader:Je.meshmatcap_vert,fragmentShader:Je.meshmatcap_frag},points:{uniforms:kt([Ae.points,Ae.fog]),vertexShader:Je.points_vert,fragmentShader:Je.points_frag},dashed:{uniforms:kt([Ae.common,Ae.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Je.linedashed_vert,fragmentShader:Je.linedashed_frag},depth:{uniforms:kt([Ae.common,Ae.displacementmap]),vertexShader:Je.depth_vert,fragmentShader:Je.depth_frag},normal:{uniforms:kt([Ae.common,Ae.bumpmap,Ae.normalmap,Ae.displacementmap,{opacity:{value:1}}]),vertexShader:Je.meshnormal_vert,fragmentShader:Je.meshnormal_frag},sprite:{uniforms:kt([Ae.sprite,Ae.fog]),vertexShader:Je.sprite_vert,fragmentShader:Je.sprite_frag},background:{uniforms:{uvTransform:{value:new We},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Je.background_vert,fragmentShader:Je.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new We}},vertexShader:Je.backgroundCube_vert,fragmentShader:Je.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Je.cube_vert,fragmentShader:Je.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Je.equirect_vert,fragmentShader:Je.equirect_frag},distance:{uniforms:kt([Ae.common,Ae.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Je.distance_vert,fragmentShader:Je.distance_frag},shadow:{uniforms:kt([Ae.lights,Ae.fog,{color:{value:new qe(0)},opacity:{value:1}}]),vertexShader:Je.shadow_vert,fragmentShader:Je.shadow_frag}};En.physical={uniforms:kt([En.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new We},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new We},clearcoatNormalScale:{value:new ue(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new We},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new We},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new We},sheen:{value:0},sheenColor:{value:new qe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new We},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new We},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new We},transmissionSamplerSize:{value:new ue},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new We},attenuationDistance:{value:0},attenuationColor:{value:new qe(0)},specularColor:{value:new qe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new We},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new We},anisotropyVector:{value:new ue},anisotropyMap:{value:null},anisotropyMapTransform:{value:new We}}]),vertexShader:Je.meshphysical_vert,fragmentShader:Je.meshphysical_frag};const ys={r:0,b:0,g:0},lm=new ut,bc=new We;bc.set(-1,0,0,0,1,0,0,0,1);function cm(i,e,t,n,r,s){const a=new qe(0);let o=r===!0?0:1,l,c,h=null,f=0,u=null;function d(b){let w=b.isScene===!0?b.background:null;if(w&&w.isTexture){const x=b.backgroundBlurriness>0;w=e.get(w,x)}return w}function g(b){let w=!1;const x=d(b);x===null?m(a,o):x&&x.isColor&&(m(x,1),w=!0);const T=i.xr.getEnvironmentBlendMode();T==="additive"?t.buffers.color.setClear(0,0,0,1,s):T==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(i.autoClear||w)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(b,w){const x=d(w);x&&(x.isCubeTexture||x.mapping===Ur)?(c===void 0&&(c=new rt(new Ke(1,1,1),new Mt({name:"BackgroundCubeMaterial",uniforms:Oi(En.backgroundCube.uniforms),vertexShader:En.backgroundCube.vertexShader,fragmentShader:En.backgroundCube.fragmentShader,side:zt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(lm.makeRotationFromEuler(w.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(bc),c.material.toneMapped=nt.getTransfer(x.colorSpace)!==ct,(h!==x||f!==x.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=x,f=x.version,u=i.toneMapping),c.layers.enableAll(),b.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new rt(new Ni(2,2),new Mt({name:"BackgroundMaterial",uniforms:Oi(En.background.uniforms),vertexShader:En.background.vertexShader,fragmentShader:En.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.toneMapped=nt.getTransfer(x.colorSpace)!==ct,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||f!==x.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=x,f=x.version,u=i.toneMapping),l.layers.enableAll(),b.unshift(l,l.geometry,l.material,0,0,null))}function m(b,w){b.getRGB(ys,fc(i)),t.buffers.color.setClear(ys.r,ys.g,ys.b,w,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(b,w=1){a.set(b),o=w,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(b){o=b,m(a,o)},render:g,addToRenderList:S,dispose:p}}function um(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=u(null);let s=r,a=!1;function o(G,B,J,H,Z){let ie=!1;const $=f(G,H,J,B);s!==$&&(s=$,c(s.object)),ie=d(G,H,J,Z),ie&&g(G,H,J,Z),Z!==null&&e.update(Z,i.ELEMENT_ARRAY_BUFFER),(ie||a)&&(a=!1,x(G,B,J,H),Z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Z).buffer))}function l(){return i.createVertexArray()}function c(G){return i.bindVertexArray(G)}function h(G){return i.deleteVertexArray(G)}function f(G,B,J,H){const Z=H.wireframe===!0;let ie=n[B.id];ie===void 0&&(ie={},n[B.id]=ie);const $=G.isInstancedMesh===!0?G.id:0;let K=ie[$];K===void 0&&(K={},ie[$]=K);let re=K[J.id];re===void 0&&(re={},K[J.id]=re);let se=re[Z];return se===void 0&&(se=u(l()),re[Z]=se),se}function u(G){const B=[],J=[],H=[];for(let Z=0;Z<t;Z++)B[Z]=0,J[Z]=0,H[Z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:J,attributeDivisors:H,object:G,attributes:{},index:null}}function d(G,B,J,H){const Z=s.attributes,ie=B.attributes;let $=0;const K=J.getAttributes();for(const re in K)if(K[re].location>=0){const he=Z[re];let xe=ie[re];if(xe===void 0&&(re==="instanceMatrix"&&G.instanceMatrix&&(xe=G.instanceMatrix),re==="instanceColor"&&G.instanceColor&&(xe=G.instanceColor)),he===void 0||he.attribute!==xe||xe&&he.data!==xe.data)return!0;$++}return s.attributesNum!==$||s.index!==H}function g(G,B,J,H){const Z={},ie=B.attributes;let $=0;const K=J.getAttributes();for(const re in K)if(K[re].location>=0){let he=ie[re];he===void 0&&(re==="instanceMatrix"&&G.instanceMatrix&&(he=G.instanceMatrix),re==="instanceColor"&&G.instanceColor&&(he=G.instanceColor));const xe={};xe.attribute=he,he&&he.data&&(xe.data=he.data),Z[re]=xe,$++}s.attributes=Z,s.attributesNum=$,s.index=H}function S(){const G=s.newAttributes;for(let B=0,J=G.length;B<J;B++)G[B]=0}function m(G){p(G,0)}function p(G,B){const J=s.newAttributes,H=s.enabledAttributes,Z=s.attributeDivisors;J[G]=1,H[G]===0&&(i.enableVertexAttribArray(G),H[G]=1),Z[G]!==B&&(i.vertexAttribDivisor(G,B),Z[G]=B)}function b(){const G=s.newAttributes,B=s.enabledAttributes;for(let J=0,H=B.length;J<H;J++)B[J]!==G[J]&&(i.disableVertexAttribArray(J),B[J]=0)}function w(G,B,J,H,Z,ie,$){$===!0?i.vertexAttribIPointer(G,B,J,Z,ie):i.vertexAttribPointer(G,B,J,H,Z,ie)}function x(G,B,J,H){S();const Z=H.attributes,ie=J.getAttributes(),$=B.defaultAttributeValues;for(const K in ie){const re=ie[K];if(re.location>=0){let se=Z[K];if(se===void 0&&(K==="instanceMatrix"&&G.instanceMatrix&&(se=G.instanceMatrix),K==="instanceColor"&&G.instanceColor&&(se=G.instanceColor)),se!==void 0){const he=se.normalized,xe=se.itemSize,_e=e.get(se);if(_e===void 0)continue;const Ie=_e.buffer,Ne=_e.type,Xe=_e.bytesPerElement,F=Ne===i.INT||Ne===i.UNSIGNED_INT||se.gpuType===$s;if(se.isInterleavedBufferAttribute){const D=se.data,I=D.stride,C=se.offset;if(D.isInstancedInterleavedBuffer){for(let z=0;z<re.locationSize;z++)p(re.location+z,D.meshPerAttribute);G.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=D.meshPerAttribute*D.count)}else for(let z=0;z<re.locationSize;z++)m(re.location+z);i.bindBuffer(i.ARRAY_BUFFER,Ie);for(let z=0;z<re.locationSize;z++)w(re.location+z,xe/re.locationSize,Ne,he,I*Xe,(C+xe/re.locationSize*z)*Xe,F)}else{if(se.isInstancedBufferAttribute){for(let D=0;D<re.locationSize;D++)p(re.location+D,se.meshPerAttribute);G.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let D=0;D<re.locationSize;D++)m(re.location+D);i.bindBuffer(i.ARRAY_BUFFER,Ie);for(let D=0;D<re.locationSize;D++)w(re.location+D,xe/re.locationSize,Ne,he,xe*Xe,xe/re.locationSize*D*Xe,F)}}else if($!==void 0){const he=$[K];if(he!==void 0)switch(he.length){case 2:i.vertexAttrib2fv(re.location,he);break;case 3:i.vertexAttrib3fv(re.location,he);break;case 4:i.vertexAttrib4fv(re.location,he);break;default:i.vertexAttrib1fv(re.location,he)}}}}b()}function T(){A();for(const G in n){const B=n[G];for(const J in B){const H=B[J];for(const Z in H){const ie=H[Z];for(const $ in ie)h(ie[$].object),delete ie[$];delete H[Z]}}delete n[G]}}function E(G){if(n[G.id]===void 0)return;const B=n[G.id];for(const J in B){const H=B[J];for(const Z in H){const ie=H[Z];for(const $ in ie)h(ie[$].object),delete ie[$];delete H[Z]}}delete n[G.id]}function L(G){for(const B in n){const J=n[B];for(const H in J){const Z=J[H];if(Z[G.id]===void 0)continue;const ie=Z[G.id];for(const $ in ie)h(ie[$].object),delete ie[$];delete Z[G.id]}}}function v(G){for(const B in n){const J=n[B],H=G.isInstancedMesh===!0?G.id:0,Z=J[H];if(Z!==void 0){for(const ie in Z){const $=Z[ie];for(const K in $)h($[K].object),delete $[K];delete Z[ie]}delete J[H],Object.keys(J).length===0&&delete n[B]}}}function A(){U(),a=!0,s!==r&&(s=r,c(s.object))}function U(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:U,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:v,releaseStatesOfProgram:L,initAttributes:S,enableAttribute:m,disableUnusedAttributes:b}}function hm(i,e,t){let n;function r(l){n=l}function s(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,h){h!==0&&(i.drawArraysInstanced(n,l,c,h),t.update(c,n,h))}function o(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,h);let u=0;for(let d=0;d<h;d++)u+=c[d];t.update(u,n,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function fm(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const L=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(L.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(L){return!(L!==ln&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(L){const v=L===Dt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(L!==Kt&&L!==on&&!v&&n.convert(L)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(L){if(L==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";L="mediump"}return L==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const h=l(c);h!==c&&(Ze("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);const f=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Ze("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),b=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),T=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:d,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:b,maxVaryings:w,maxFragmentUniforms:x,maxSamples:T,samples:E}}function dm(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new Nn,o=new We,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){const d=f.length!==0||u||n!==0||r;return r=u,n=f.length,d},this.beginShadows=function(){s=!0,h(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,u){t=h(f,u,0)},this.setState=function(f,u,d){const g=f.clippingPlanes,S=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!r||g===null||g.length===0||s&&!m)s?h(null):c();else{const b=s?0:n,w=b*4;let x=p.clippingState||null;l.value=x,x=h(g,u,w,d);for(let T=0;T!==w;++T)x[T]=t[T];p.clippingState=x,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=b}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(f,u,d,g){const S=f!==null?f.length:0;let m=null;if(S!==0){if(m=l.value,g!==!0||m===null){const p=d+S*4,b=u.matrixWorldInverse;o.getNormalMatrix(b),(m===null||m.length<p)&&(m=new Float32Array(p));for(let w=0,x=d;w!==S;++w,x+=4)a.copy(f[w]).applyMatrix4(b,o),a.normal.toArray(m,x),m[x+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}const Hi=4,pm=6,mm=20,gm=256,yr=new _o,Ec=new qe;let Mo=null,So=0,yo=0,bo=!1;const vm=new N,di=new N;class wc{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,s={}){const{size:a=256,position:o=vm}=s;Mo=this._renderer.getRenderTarget(),So=this._renderer.getActiveCubeFace(),yo=this._renderer.getActiveMipmapLevel(),bo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Rc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ac(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Mo,So,yo),this._renderer.xr.enabled=bo,e.scissorTest=!1,ki(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===jn||e.mapping===xi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Mo=this._renderer.getRenderTarget(),So=this._renderer.getActiveCubeFace(),yo=this._renderer.getActiveMipmapLevel(),bo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Ct,minFilter:Ct,generateMipmaps:!1,type:Dt,format:ln,colorSpace:Xr,depthBuffer:!1},r=Tc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Tc(e,t,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=xm(s)),this._blurMaterial=Mm(s,e,t),this._ggxMaterial=_m(s,e,t)}return r}_compileMaterial(e){const t=new rt(new xt,e);this._renderer.compile(t,yr)}_sceneToCubeUV(e,t,n,r,s){const l=new jt(90,1,t,n),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,d=f.toneMapping;f.getClearColor(Ec),f.toneMapping=xn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new rt(new Ke,new hr({name:"PMREM.Background",side:zt,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,m=S.material;let p=!1;const b=e.background;b?b.isColor&&(m.color.copy(b),e.background=null,p=!0):(m.color.copy(Ec),p=!0);for(let w=0;w<6;w++){const x=w%3;x===0?(l.up.set(0,c[w],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+h[w],s.y,s.z)):x===1?(l.up.set(0,0,c[w]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+h[w],s.z)):(l.up.set(0,c[w],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+h[w]));const T=this._cubeSize;ki(r,x*T,w>2?T:0,T,T),f.setRenderTarget(r),p&&f.render(S,l),f.render(e,l)}f.toneMapping=d,f.autoClear=u,e.background=b}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===jn||e.mapping===xi;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Rc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ac());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;ki(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,yr)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=n}_applyGGXFilter(e,t,n){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const l=a.uniforms,c=n/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-h*h),u=c*1.25,d=f*u,{_lodMax:g}=this,S=this._sizeLods[n],m=3*S*(n>g-Hi?n-g+Hi:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=g-t,ki(s,m,p,3*S,2*S),r.setRenderTarget(s),r.render(o,yr),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-n,ki(e,m,p,3*S,2*S),r.setRenderTarget(e),r.render(o,yr)}_blur(e,t,n,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,n,a),this._blurPass(s,e,n,n,a)}_blurPass(e,t,n,r,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;const c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-n;const h=this._sizeLods[r],f=3*h*(r>this._lodMax-Hi?r-this._lodMax+Hi:0),u=4*(this._cubeSize-h);ki(t,f,u,3*h,2*h),a.setRenderTarget(t),a.render(l,yr)}}function xm(i){const e=[],t=[];let n=i;const r=i-Hi+1+pm;for(let s=0;s<r;s++){const a=Math.pow(2,n);e.push(a);const o=1/(a-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,u=6,d=3,g=new Float32Array(d*u*f),S=new Float32Array(d*u*f);for(let p=0;p<f;p++){const b=p%3*2/3-1,w=p>2?0:-1,x=[b,w,0,b+2/3,w,0,b+2/3,w+1,0,b,w,0,b+2/3,w+1,0,b,w+1,0];g.set(x,d*u*p);for(let T=0;T<u;T++){const E=h[T*2]*2-1,L=h[T*2+1]*2-1;p===0?di.set(1,L,E):p===1?di.set(-E,1,-L):p===2?di.set(-E,L,1):p===3?di.set(-1,L,-E):p===4?di.set(-E,-1,L):di.set(E,L,-1),di.toArray(S,(p*u+T)*d)}}const m=new xt;m.setAttribute("position",new Zt(g,d)),m.setAttribute("outputDirection",new Zt(S,d)),t.push(new rt(m,null)),n>Hi&&n--}return{lodMeshes:t,sizeLods:e}}function Tc(i,e,t){const n=new It(i,e,t);return n.texture.mapping=Ur,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ki(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function _m(i,e,t){return new Mt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:gm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:bs(),fragmentShader:`

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
		`,blending:vn,depthTest:!1,depthWrite:!1})}function Mm(i,e,t){return new Mt({name:"SphericalGaussianBlur",defines:{SAMPLES:mm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:bs(),fragmentShader:`

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
		`,blending:vn,depthTest:!1,depthWrite:!1})}function Ac(){return new Mt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:bs(),fragmentShader:`

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
		`,blending:vn,depthTest:!1,depthWrite:!1})}function Rc(){return new Mt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:bs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:vn,depthTest:!1,depthWrite:!1})}function bs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Cc extends It{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Zl(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Ke(5,5,5),s=new Mt({name:"CubemapFromEquirect",uniforms:Oi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:zt,blending:vn});s.uniforms.tEquirect.value=t;const a=new rt(r,s),o=t.minFilter;return t.minFilter===zn&&(t.minFilter=Ct),new nd(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}function Sm(i){let e=new WeakMap,t=new WeakMap,n=null;function r(u,d=!1){return u==null?null:d?a(u):s(u)}function s(u){if(u&&u.isTexture){const d=u.mapping;if(d===Ys||d===Zs)if(e.has(u)){const g=e.get(u).texture;return o(g,u.mapping)}else{const g=u.image;if(g&&g.height>0){const S=new Cc(g.height);return S.fromEquirectangularTexture(i,u),e.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function a(u){if(u&&u.isTexture){const d=u.mapping,g=d===Ys||d===Zs,S=d===jn||d===xi;if(g||S){let m=t.get(u);const p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return n===null&&(n=new wc(i)),m=g?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{const b=u.image;return g&&b&&b.height>0||S&&b&&l(b)?(n===null&&(n=new wc(i)),m=g?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function o(u,d){return d===Ys?u.mapping=jn:d===Zs&&(u.mapping=xi),u}function l(u){let d=0;const g=6;for(let S=0;S<g;S++)u[S]!==void 0&&d++;return d===g}function c(u){const d=u.target;d.removeEventListener("dispose",c);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function h(u){const d=u.target;d.removeEventListener("dispose",h);const g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:f}}function ym(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const r=i.getExtension(n);return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&_i("WebGLRenderer: "+n+" extension not supported."),r}}}function bm(i,e,t,n){const r={},s=new WeakMap;function a(f){const u=f.target;u.index!==null&&e.remove(u.index);for(const g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",a),delete r[u.id];const d=s.get(u);d&&(e.remove(d),s.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function o(f,u){return r[u.id]===!0||(u.addEventListener("dispose",a),r[u.id]=!0,t.memory.geometries++),u}function l(f){const u=f.attributes;for(const d in u)e.update(u[d],i.ARRAY_BUFFER)}function c(f){const u=[],d=f.index,g=f.attributes.position;let S=0;if(g===void 0)return;if(d!==null){const b=d.array;S=d.version;for(let w=0,x=b.length;w<x;w+=3){const T=b[w+0],E=b[w+1],L=b[w+2];u.push(T,E,E,L,L,T)}}else{const b=g.array;S=g.version;for(let w=0,x=b.length/3-1;w<x;w+=3){const T=w+0,E=w+1,L=w+2;u.push(T,E,E,L,L,T)}}const m=new(g.count>=65535?kl:Hl)(u,1);m.version=S;const p=s.get(f);p&&e.remove(p),s.set(f,m)}function h(f){const u=s.get(f);if(u){const d=f.index;d!==null&&u.version<d.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:h}}function Em(i,e,t){let n;function r(f){n=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function l(f,u){i.drawElements(n,u,s,f*a),t.update(u,n,1)}function c(f,u,d){d!==0&&(i.drawElementsInstanced(n,u,s,f*a,d),t.update(u,n,d))}function h(f,u,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,s,f,0,d);let S=0;for(let m=0;m<d;m++)S+=u[m];t.update(S,n,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function wm(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:it("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function Tm(i,e,t){const n=new WeakMap,r=new dt;function s(a,o,l){const c=a.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0;let u=n.get(o);if(u===void 0||u.count!==f){let A=function(){L.dispose(),n.delete(o),o.removeEventListener("dispose",A)};u!==void 0&&u.texture.dispose();const d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],b=o.morphAttributes.color||[];let w=0;d===!0&&(w=1),g===!0&&(w=2),S===!0&&(w=3);let x=o.attributes.position.count*w,T=1;x>e.maxTextureSize&&(T=Math.ceil(x/e.maxTextureSize),x=e.maxTextureSize);const E=new Float32Array(x*T*4*f),L=new Cl(E,x,T,f);L.type=on,L.needsUpdate=!0;const v=w*4;for(let U=0;U<f;U++){const G=m[U],B=p[U],J=b[U],H=x*T*4*U;for(let Z=0;Z<G.count;Z++){const ie=Z*v;d===!0&&(r.fromBufferAttribute(G,Z),E[H+ie+0]=r.x,E[H+ie+1]=r.y,E[H+ie+2]=r.z,E[H+ie+3]=0),g===!0&&(r.fromBufferAttribute(B,Z),E[H+ie+4]=r.x,E[H+ie+5]=r.y,E[H+ie+6]=r.z,E[H+ie+7]=0),S===!0&&(r.fromBufferAttribute(J,Z),E[H+ie+8]=r.x,E[H+ie+9]=r.y,E[H+ie+10]=r.z,E[H+ie+11]=J.itemSize===4?r.w:1)}}u={count:f,texture:L,size:new ue(x,T)},n.set(o,u),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let d=0;for(let S=0;S<c.length;S++)d+=c[S];const g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:s}}function Am(i,e,t,n,r){let s=new WeakMap;function a(c){const h=r.render.frame,f=c.geometry,u=e.get(c,f);if(s.get(u)!==h&&(e.update(u),s.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==h&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,h))),c.isSkinnedMesh){const d=c.skeleton;s.get(d)!==h&&(d.update(),s.set(d,h))}return u}function o(){s=new WeakMap}function l(c){const h=c.target;h.removeEventListener("dispose",l),n.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:a,dispose:o}}const Rm={[al]:"LINEAR_TONE_MAPPING",[ol]:"REINHARD_TONE_MAPPING",[ll]:"CINEON_TONE_MAPPING",[cl]:"ACES_FILMIC_TONE_MAPPING",[hl]:"AGX_TONE_MAPPING",[fl]:"NEUTRAL_TONE_MAPPING",[ul]:"CUSTOM_TONE_MAPPING"};function Cm(i,e,t,n,r,s){const a=new It(e,t,{type:i,depthBuffer:r,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new xt;c.setAttribute("position",new et([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new et([0,2,0,0,2,0],2));const h=new Zf({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new rt(c,h),u=new _o(-1,1,1,-1,0,1);let d=null,g=null,S=!1,m,p=null,b=[],w=!1;this.setSize=function(x,T){a.setSize(x,T),o!==null&&o.setSize(x,T),l!==null&&l.setSize(x,T);for(let E=0;E<b.length;E++){const L=b[E];L.setSize&&L.setSize(x,T)}},this.setEffects=function(x){b=x,w=b.length>0&&b[0].isRenderPass===!0;const T=a.width,E=a.height;b.length>0&&o===null&&(o=new It(T,E,{type:Dt,depthBuffer:!1,stencilBuffer:!1}),l=new It(T,E,{type:Dt,depthBuffer:!1,stencilBuffer:!1}));for(let L=0;L<b.length;L++){const v=b[L];v.setSize&&v.setSize(T,E)}},this.begin=function(x,T){if(S||x.toneMapping===xn&&b.length===0)return!1;if(p=T,T!==null){const E=T.width,L=T.height;(a.width!==E||a.height!==L)&&this.setSize(E,L)}return w===!1&&x.setRenderTarget(a),m=x.toneMapping,x.toneMapping=xn,!0},this.hasRenderPass=function(){return w},this.end=function(x,T){x.toneMapping=m,S=!0;let E=a,L=o;for(let v=0;v<b.length;v++){const A=b[v];A.enabled!==!1&&(A.render(x,L,E,T),A.needsSwap!==!1&&(E=L,L=L===o?l:o))}if(d!==x.outputColorSpace||g!==x.toneMapping){d=x.outputColorSpace,g=x.toneMapping,h.defines={},nt.getTransfer(d)===ct&&(h.defines.SRGB_TRANSFER="");const v=Rm[g];v&&(h.defines[v]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,x.setRenderTarget(p),x.render(f,u),p=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}const Pc=new Nt,Eo=new pr(1,1),Lc=new Cl,Ic=new Yh,Dc=new Zl,Uc=[],Nc=[],Fc=new Float32Array(16),Oc=new Float32Array(9),Bc=new Float32Array(4);function Gi(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=Uc[r];if(s===void 0&&(s=new Float32Array(r),Uc[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function At(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Rt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Es(i,e){let t=Nc[e];t===void 0&&(t=new Int32Array(e),Nc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Pm(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Lm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;i.uniform2fv(this.addr,e),Rt(t,e)}}function Im(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(At(t,e))return;i.uniform3fv(this.addr,e),Rt(t,e)}}function Dm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;i.uniform4fv(this.addr,e),Rt(t,e)}}function Um(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(At(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Rt(t,e)}else{if(At(t,n))return;Bc.set(n),i.uniformMatrix2fv(this.addr,!1,Bc),Rt(t,n)}}function Nm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(At(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Rt(t,e)}else{if(At(t,n))return;Oc.set(n),i.uniformMatrix3fv(this.addr,!1,Oc),Rt(t,n)}}function Fm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(At(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Rt(t,e)}else{if(At(t,n))return;Fc.set(n),i.uniformMatrix4fv(this.addr,!1,Fc),Rt(t,n)}}function Om(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function Bm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;i.uniform2iv(this.addr,e),Rt(t,e)}}function zm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;i.uniform3iv(this.addr,e),Rt(t,e)}}function Hm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;i.uniform4iv(this.addr,e),Rt(t,e)}}function km(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Gm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;i.uniform2uiv(this.addr,e),Rt(t,e)}}function Vm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;i.uniform3uiv(this.addr,e),Rt(t,e)}}function Wm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;i.uniform4uiv(this.addr,e),Rt(t,e)}}function Xm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(Eo.compareFunction=t.isReversedDepthBuffer()?Ua:Da,s=Eo):s=Pc,t.setTexture2D(e||s,r)}function qm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Ic,r)}function Ym(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Dc,r)}function Zm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||Lc,r)}function Km(i){switch(i){case 5126:return Pm;case 35664:return Lm;case 35665:return Im;case 35666:return Dm;case 35674:return Um;case 35675:return Nm;case 35676:return Fm;case 5124:case 35670:return Om;case 35667:case 35671:return Bm;case 35668:case 35672:return zm;case 35669:case 35673:return Hm;case 5125:return km;case 36294:return Gm;case 36295:return Vm;case 36296:return Wm;case 35678:case 36198:case 36298:case 36306:case 35682:return Xm;case 35679:case 36299:case 36307:return qm;case 35680:case 36300:case 36308:case 36293:return Ym;case 36289:case 36303:case 36311:case 36292:return Zm}}function $m(i,e){i.uniform1fv(this.addr,e)}function Jm(i,e){const t=Gi(e,this.size,2);i.uniform2fv(this.addr,t)}function Qm(i,e){const t=Gi(e,this.size,3);i.uniform3fv(this.addr,t)}function jm(i,e){const t=Gi(e,this.size,4);i.uniform4fv(this.addr,t)}function e0(i,e){const t=Gi(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function t0(i,e){const t=Gi(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function n0(i,e){const t=Gi(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function i0(i,e){i.uniform1iv(this.addr,e)}function r0(i,e){i.uniform2iv(this.addr,e)}function s0(i,e){i.uniform3iv(this.addr,e)}function a0(i,e){i.uniform4iv(this.addr,e)}function o0(i,e){i.uniform1uiv(this.addr,e)}function l0(i,e){i.uniform2uiv(this.addr,e)}function c0(i,e){i.uniform3uiv(this.addr,e)}function u0(i,e){i.uniform4uiv(this.addr,e)}function h0(i,e,t){const n=this.cache,r=e.length,s=Es(t,r);At(n,s)||(i.uniform1iv(this.addr,s),Rt(n,s));let a;this.type===i.SAMPLER_2D_SHADOW?a=Eo:a=Pc;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function f0(i,e,t){const n=this.cache,r=e.length,s=Es(t,r);At(n,s)||(i.uniform1iv(this.addr,s),Rt(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Ic,s[a])}function d0(i,e,t){const n=this.cache,r=e.length,s=Es(t,r);At(n,s)||(i.uniform1iv(this.addr,s),Rt(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Dc,s[a])}function p0(i,e,t){const n=this.cache,r=e.length,s=Es(t,r);At(n,s)||(i.uniform1iv(this.addr,s),Rt(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Lc,s[a])}function m0(i){switch(i){case 5126:return $m;case 35664:return Jm;case 35665:return Qm;case 35666:return jm;case 35674:return e0;case 35675:return t0;case 35676:return n0;case 5124:case 35670:return i0;case 35667:case 35671:return r0;case 35668:case 35672:return s0;case 35669:case 35673:return a0;case 5125:return o0;case 36294:return l0;case 36295:return c0;case 36296:return u0;case 35678:case 36198:case 36298:case 36306:case 35682:return h0;case 35679:case 36299:case 36307:return f0;case 35680:case 36300:case 36308:case 36293:return d0;case 36289:case 36303:case 36311:case 36292:return p0}}class g0{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Km(t.type)}}class v0{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=m0(t.type)}}class x0{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const wo=/(\w+)(\])?(\[|\.)?/g;function zc(i,e){i.seq.push(e),i.map[e.id]=e}function _0(i,e,t){const n=i.name,r=n.length;for(wo.lastIndex=0;;){const s=wo.exec(n),a=wo.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){zc(t,c===void 0?new g0(o,i,e):new v0(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new x0(o),zc(t,f)),t=f}}}class ws{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);_0(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function Hc(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const M0=37297;let S0=0;function y0(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const kc=new We;function b0(i){nt._getMatrix(kc,nt.workingColorSpace,i);const e=`mat3( ${kc.elements.map(t=>t.toFixed(4))} )`;switch(nt.getTransfer(i)){case qr:return[e,"LinearTransferOETF"];case ct:return[e,"sRGBTransferOETF"];default:return Ze("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Gc(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=(i.getShaderInfoLog(e)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+y0(i.getShaderSource(e),o)}else return s}function E0(i,e){const t=b0(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const w0={[al]:"Linear",[ol]:"Reinhard",[ll]:"Cineon",[cl]:"ACESFilmic",[hl]:"AgX",[fl]:"Neutral",[ul]:"Custom"};function T0(i,e){const t=w0[e];return t===void 0?(Ze("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Ts=new N;function A0(){nt.getLuminanceCoefficients(Ts);const i=Ts.x.toFixed(4),e=Ts.y.toFixed(4),t=Ts.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function R0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(br).join(`
`)}function C0(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function P0(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function br(i){return i!==""}function Vc(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Wc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const L0=/^[ \t]*#include +<([\w\d./]+)>/gm;function To(i){return i.replace(L0,D0)}const I0=new Map;function D0(i,e){let t=Je[e];if(t===void 0){const n=I0.get(e);if(n!==void 0)t=Je[n],Ze('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return To(t)}const U0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Xc(i){return i.replace(U0,N0)}function N0(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function qc(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}const F0={[Dr]:"SHADOWMAP_TYPE_PCF",[$i]:"SHADOWMAP_TYPE_VSM"};function O0(i){return F0[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const B0={[jn]:"ENVMAP_TYPE_CUBE",[xi]:"ENVMAP_TYPE_CUBE",[Ur]:"ENVMAP_TYPE_CUBE_UV"};function z0(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":B0[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const H0={[xi]:"ENVMAP_MODE_REFRACTION"};function k0(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":H0[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const G0={[sl]:"ENVMAP_BLENDING_MULTIPLY",[lh]:"ENVMAP_BLENDING_MIX",[ch]:"ENVMAP_BLENDING_ADD"};function V0(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":G0[i.combine]||"ENVMAP_BLENDING_NONE"}function W0(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function X0(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=O0(t),c=z0(t),h=k0(t),f=V0(t),u=W0(t),d=R0(t),g=C0(s),S=r.createProgram();let m,p,b=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(br).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(br).join(`
`),p.length>0&&(p+=`
`)):(m=[qc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(br).join(`
`),p=[qc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==xn?"#define TONE_MAPPING":"",t.toneMapping!==xn?Je.tonemapping_pars_fragment:"",t.toneMapping!==xn?T0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Je.colorspace_pars_fragment,E0("linearToOutputTexel",t.outputColorSpace),A0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(br).join(`
`)),a=To(a),a=Vc(a,t),a=Wc(a,t),o=To(o),o=Vc(o,t),o=Wc(o,t),a=Xc(a),o=Xc(o),t.isRawShaderMaterial!==!0&&(b=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===Sl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Sl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const w=b+m+a,x=b+p+o,T=Hc(r,r.VERTEX_SHADER,w),E=Hc(r,r.FRAGMENT_SHADER,x);r.attachShader(S,T),r.attachShader(S,E),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function L(G){if(i.debug.checkShaderErrors){const B=r.getProgramInfoLog(S)||"",J=r.getShaderInfoLog(T)||"",H=r.getShaderInfoLog(E)||"",Z=B.trim(),ie=J.trim(),$=H.trim();let K=!0,re=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(K=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,S,T,E);else{const se=Gc(r,T,"vertex"),he=Gc(r,E,"fragment");it("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+G.name+`
Material Type: `+G.type+`

Program Info Log: `+Z+`
`+se+`
`+he)}else Z!==""?Ze("WebGLProgram: Program Info Log:",Z):(ie===""||$==="")&&(re=!1);re&&(G.diagnostics={runnable:K,programLog:Z,vertexShader:{log:ie,prefix:m},fragmentShader:{log:$,prefix:p}})}r.deleteShader(T),r.deleteShader(E),v=new ws(r,S),A=P0(r,S)}let v;this.getUniforms=function(){return v===void 0&&L(this),v};let A;this.getAttributes=function(){return A===void 0&&L(this),A};let U=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=r.getProgramParameter(S,M0)),U},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=S0++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=T,this.fragmentShader=E,this}let q0=0;class Y0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Z0(e),t.set(e,n)),n}}class Z0{constructor(e){this.id=q0++,this.code=e,this.usedTimes=0}}function K0(i){return i===ti||i===Vr||i===Wr}function $0(i,e,t,n,r,s){const a=new Il,o=new Y0,l=new Set,c=[],h=new Map,f=n.logarithmicDepthBuffer;let u=n.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(v){return l.add(v),v===0?"uv":`uv${v}`}function S(v,A,U,G,B,J){const H=G.fog,Z=B.geometry,ie=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?G.environment:null,$=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,K=e.get(v.envMap||ie,$),re=K&&K.mapping===Ur?K.image.height:null,se=d[v.type];v.precision!==null&&(u=n.getMaxPrecision(v.precision),u!==v.precision&&Ze("WebGLProgram.getParameters:",v.precision,"not supported, using",u,"instead."));const he=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,xe=he!==void 0?he.length:0;let _e=0;Z.morphAttributes.position!==void 0&&(_e=1),Z.morphAttributes.normal!==void 0&&(_e=2),Z.morphAttributes.color!==void 0&&(_e=3);let Ie,Ne,Xe,F;if(se){const pt=En[se];Ie=pt.vertexShader,Ne=pt.fragmentShader}else{Ie=v.vertexShader,Ne=v.fragmentShader;const pt=o.getVertexShaderStage(v),ot=o.getFragmentShaderStage(v);o.update(v,pt,ot),Xe=pt.id,F=ot.id}const D=i.getRenderTarget(),I=i.state.buffers.depth.getReversed(),C=B.isInstancedMesh===!0,z=B.isBatchedMesh===!0,j=!!v.map,me=!!v.matcap,R=!!K,k=!!v.aoMap,O=!!v.lightMap,Y=!!v.bumpMap&&v.wireframe===!1,Q=!!v.normalMap,le=!!v.displacementMap,ge=!!v.emissiveMap,pe=!!v.metalnessMap,q=!!v.roughnessMap,M=v.anisotropy>0,Re=v.clearcoat>0,Fe=v.dispersion>0,P=v.retroreflectivity>0,_=v.iridescence>0,X=v.sheen>0,ee=v.transmission>0,oe=M&&!!v.anisotropyMap,Me=Re&&!!v.clearcoatMap,Se=Re&&!!v.clearcoatNormalMap,ce=Re&&!!v.clearcoatRoughnessMap,fe=_&&!!v.iridescenceMap,ye=_&&!!v.iridescenceThicknessMap,ze=X&&!!v.sheenColorMap,Ee=X&&!!v.sheenRoughnessMap,be=!!v.specularMap,Ge=!!v.specularColorMap,Ye=!!v.specularIntensityMap,$e=ee&&!!v.transmissionMap,W=ee&&!!v.thicknessMap,we=!!v.gradientMap,de=!!v.alphaMap,Te=v.alphaTest>0,Le=!!v.alphaHash,ve=!!v.extensions;let Ve=xn;v.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(Ve=i.toneMapping);const He={shaderID:se,shaderType:v.type,shaderName:v.name,vertexShader:Ie,fragmentShader:Ne,defines:v.defines,customVertexShaderID:Xe,customFragmentShaderID:F,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:u,batching:z,batchingColor:z&&B._colorsTexture!==null,instancing:C,instancingColor:C&&B.instanceColor!==null,instancingMorph:C&&B.morphTexture!==null,outputColorSpace:D===null?i.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:nt.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:j,matcap:me,envMap:R,envMapMode:R&&K.mapping,envMapCubeUVHeight:re,aoMap:k,lightMap:O,bumpMap:Y,normalMap:Q,displacementMap:le,emissiveMap:ge,normalMapObjectSpace:Q&&v.normalMapType===fh,normalMapTangentSpace:Q&&v.normalMapType===Ml,packedNormalMap:Q&&v.normalMapType===Ml&&K0(v.normalMap.format),metalnessMap:pe,roughnessMap:q,anisotropy:M,anisotropyMap:oe,clearcoat:Re,clearcoatMap:Me,clearcoatNormalMap:Se,clearcoatRoughnessMap:ce,dispersion:Fe,retroreflection:P,iridescence:_,iridescenceMap:fe,iridescenceThicknessMap:ye,sheen:X,sheenColorMap:ze,sheenRoughnessMap:Ee,specularMap:be,specularColorMap:Ge,specularIntensityMap:Ye,transmission:ee,transmissionMap:$e,thicknessMap:W,gradientMap:we,opaque:v.transparent===!1&&v.blending===Ji&&v.alphaToCoverage===!1,alphaMap:de,alphaTest:Te,alphaHash:Le,combine:v.combine,mapUv:j&&g(v.map.channel),aoMapUv:k&&g(v.aoMap.channel),lightMapUv:O&&g(v.lightMap.channel),bumpMapUv:Y&&g(v.bumpMap.channel),normalMapUv:Q&&g(v.normalMap.channel),displacementMapUv:le&&g(v.displacementMap.channel),emissiveMapUv:ge&&g(v.emissiveMap.channel),metalnessMapUv:pe&&g(v.metalnessMap.channel),roughnessMapUv:q&&g(v.roughnessMap.channel),anisotropyMapUv:oe&&g(v.anisotropyMap.channel),clearcoatMapUv:Me&&g(v.clearcoatMap.channel),clearcoatNormalMapUv:Se&&g(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ce&&g(v.clearcoatRoughnessMap.channel),iridescenceMapUv:fe&&g(v.iridescenceMap.channel),iridescenceThicknessMapUv:ye&&g(v.iridescenceThicknessMap.channel),sheenColorMapUv:ze&&g(v.sheenColorMap.channel),sheenRoughnessMapUv:Ee&&g(v.sheenRoughnessMap.channel),specularMapUv:be&&g(v.specularMap.channel),specularColorMapUv:Ge&&g(v.specularColorMap.channel),specularIntensityMapUv:Ye&&g(v.specularIntensityMap.channel),transmissionMapUv:$e&&g(v.transmissionMap.channel),thicknessMapUv:W&&g(v.thicknessMap.channel),alphaMapUv:de&&g(v.alphaMap.channel),vertexTangents:!!Z.attributes.tangent&&(Q||M),vertexNormals:!!Z.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!Z.attributes.uv&&(j||de),fog:!!H,useFog:v.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||Z.attributes.normal===void 0&&Q===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:I,skinning:B.isSkinnedMesh===!0,hasPositionAttribute:Z.attributes.position!==void 0,morphTargets:Z.morphAttributes.position!==void 0,morphNormals:Z.morphAttributes.normal!==void 0,morphColors:Z.morphAttributes.color!==void 0,morphTargetsCount:xe,morphTextureStride:_e,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:J.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&U.length>0,shadowMapType:i.shadowMap.type,toneMapping:Ve,decodeVideoTexture:j&&v.map.isVideoTexture===!0&&nt.getTransfer(v.map.colorSpace)===ct,decodeVideoTextureEmissive:ge&&v.emissiveMap.isVideoTexture===!0&&nt.getTransfer(v.emissiveMap.colorSpace)===ct,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===tn,flipSided:v.side===zt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:ve&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ve&&v.extensions.multiDraw===!0||z)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return He.vertexUv1s=l.has(1),He.vertexUv2s=l.has(2),He.vertexUv3s=l.has(3),l.clear(),He}function m(v){const A=[];if(v.shaderID?A.push(v.shaderID):(A.push(v.customVertexShaderID),A.push(v.customFragmentShaderID)),v.defines!==void 0)for(const U in v.defines)A.push(U),A.push(v.defines[U]);return v.isRawShaderMaterial===!1&&(p(A,v),b(A,v),A.push(i.outputColorSpace)),A.push(v.customProgramCacheKey),A.join()}function p(v,A){v.push(A.precision),v.push(A.outputColorSpace),v.push(A.envMapMode),v.push(A.envMapCubeUVHeight),v.push(A.mapUv),v.push(A.alphaMapUv),v.push(A.lightMapUv),v.push(A.aoMapUv),v.push(A.bumpMapUv),v.push(A.normalMapUv),v.push(A.displacementMapUv),v.push(A.emissiveMapUv),v.push(A.metalnessMapUv),v.push(A.roughnessMapUv),v.push(A.anisotropyMapUv),v.push(A.clearcoatMapUv),v.push(A.clearcoatNormalMapUv),v.push(A.clearcoatRoughnessMapUv),v.push(A.iridescenceMapUv),v.push(A.iridescenceThicknessMapUv),v.push(A.sheenColorMapUv),v.push(A.sheenRoughnessMapUv),v.push(A.specularMapUv),v.push(A.specularColorMapUv),v.push(A.specularIntensityMapUv),v.push(A.transmissionMapUv),v.push(A.thicknessMapUv),v.push(A.combine),v.push(A.fogExp2),v.push(A.sizeAttenuation),v.push(A.morphTargetsCount),v.push(A.morphAttributeCount),v.push(A.numSunLights),v.push(A.numDirLights),v.push(A.numPointLights),v.push(A.numSpotLights),v.push(A.numSpotLightMaps),v.push(A.numHemiLights),v.push(A.numRectAreaLights),v.push(A.numSunLightShadows),v.push(A.numDirLightShadows),v.push(A.numPointLightShadows),v.push(A.numSpotLightShadows),v.push(A.numSpotLightShadowsWithMaps),v.push(A.numLightProbes),v.push(A.shadowMapType),v.push(A.toneMapping),v.push(A.numClippingPlanes),v.push(A.numClipIntersection),v.push(A.depthPacking)}function b(v,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function w(v){const A=d[v.type];let U;if(A){const G=En[A];U=Sr.clone(G.uniforms)}else U=v.uniforms;return U}function x(v,A){let U=h.get(A);return U!==void 0?++U.usedTimes:(U=new X0(i,A,v,r),c.push(U),h.set(A,U)),U}function T(v){if(--v.usedTimes===0){const A=c.indexOf(v);c[A]=c[c.length-1],c.pop(),h.delete(v.cacheKey),v.destroy()}}function E(v){o.remove(v)}function L(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:w,acquireProgram:x,releaseProgram:T,releaseShaderCache:E,programs:c,dispose:L}}function J0(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,l){i.get(a)[o]=l}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function Q0(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Yc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Zc(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(u){let d=0;return u.isInstancedMesh&&(d+=2),u.isSkinnedMesh&&(d+=1),d}function o(u,d,g,S,m,p){let b=i[e];return b===void 0?(b={id:u.id,object:u,geometry:d,material:g,materialVariant:a(u),groupOrder:S,renderOrder:u.renderOrder,z:m,group:p},i[e]=b):(b.id=u.id,b.object=u,b.geometry=d,b.material=g,b.materialVariant=a(u),b.groupOrder=S,b.renderOrder=u.renderOrder,b.z=m,b.group=p),e++,b}function l(u,d,g,S,m,p,b){b.reversedDepth===!0&&(m=-m);const w=o(u,d,g,S,m,p);g.transmission>0?n.push(w):g.transparent===!0?r.push(w):t.push(w)}function c(u,d,g,S,m,p){const b=o(u,d,g,S,m,p);g.transmission>0?n.unshift(b):g.transparent===!0?r.unshift(b):t.unshift(b)}function h(u,d){t.length>1&&t.sort(u||Q0),n.length>1&&n.sort(d||Yc),r.length>1&&r.sort(d||Yc)}function f(){for(let u=e,d=i.length;u<d;u++){const g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:l,unshift:c,finish:f,sort:h}}function j0(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new Zc,i.set(n,[a])):r>=s.length?(a=new Zc,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function eg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new N,color:new qe};break;case"SpotLight":t={position:new N,direction:new N,color:new qe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new N,color:new qe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new N,skyColor:new qe,groundColor:new qe};break;case"RectAreaLight":t={color:new qe,position:new N,halfWidth:new N,halfHeight:new N};break}return i[e.id]=t,t}}}function tg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let ng=0;function ig(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function rg(i){const e=new eg,t=tg(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new N);const r=new N,s=new ut,a=new ut;function o(c){let h=0,f=0,u=0;for(let B=0;B<9;B++)n.probe[B].set(0,0,0);let d=0,g=0,S=0,m=0,p=0,b=0,w=0,x=0,T=0,E=0,L=0,v=0,A=0,U=0;c.sort(ig);for(let B=0,J=c.length;B<J;B++){const H=c[B],Z=H.color,ie=H.intensity,$=H.distance;let K=null;if(H.shadow&&H.shadow.map&&(H.shadow.map.texture.format===ti?K=H.shadow.map.texture:K=H.shadow.map.depthTexture||H.shadow.map.texture),H.isAmbientLight)h+=Z.r*ie,f+=Z.g*ie,u+=Z.b*ie;else if(H.isLightProbe){for(let re=0;re<9;re++)n.probe[re].addScaledVector(H.sh.coefficients[re],ie);U++}else if(H.isSunLight){const re=e.get(H);if(re.color.copy(H.color).multiplyScalar(H.intensity),H.castShadow){const se=H.shadow,he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize.copy(se.mapSize).multiply(se.getFrameExtents()),n.sunShadow[g]=he,n.sunShadowMap[g]=K;const xe=se.getViewportCount();for(let _e=0;_e<xe;_e++)n.sunShadowMatrix[S+_e]=se.getMatrix(_e),n.sunShadowCascade[S+_e]=se._cascadeData[_e];S+=xe,g++}n.sun[d]=re,d++}else if(H.isDirectionalLight){const re=e.get(H);if(re.color.copy(H.color).multiplyScalar(H.intensity),H.castShadow){const se=H.shadow,he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize=se.mapSize,n.directionalShadow[m]=he,n.directionalShadowMap[m]=K,n.directionalShadowMatrix[m]=H.shadow.matrix,T++}n.directional[m]=re,m++}else if(H.isSpotLight){const re=e.get(H);re.position.setFromMatrixPosition(H.matrixWorld),re.color.copy(Z).multiplyScalar(ie),re.distance=$,re.coneCos=Math.cos(H.angle),re.penumbraCos=Math.cos(H.angle*(1-H.penumbra)),re.decay=H.decay,n.spot[b]=re;const se=H.shadow;if(H.map&&(n.spotLightMap[v]=H.map,v++,se.updateMatrices(H),H.castShadow&&A++),n.spotLightMatrix[b]=se.matrix,H.castShadow){const he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize=se.mapSize,n.spotShadow[b]=he,n.spotShadowMap[b]=K,L++}b++}else if(H.isRectAreaLight){const re=e.get(H);re.color.copy(Z).multiplyScalar(ie),re.halfWidth.set(H.width*.5,0,0),re.halfHeight.set(0,H.height*.5,0),n.rectArea[w]=re,w++}else if(H.isPointLight){const re=e.get(H);if(re.color.copy(H.color).multiplyScalar(H.intensity),re.distance=H.distance,re.decay=H.decay,H.castShadow){const se=H.shadow,he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize=se.mapSize,he.shadowCameraNear=se.camera.near,he.shadowCameraFar=se.camera.far,n.pointShadow[p]=he,n.pointShadowMap[p]=K,n.pointShadowMatrix[p]=H.shadow.matrix,E++}n.point[p]=re,p++}else if(H.isHemisphereLight){const re=e.get(H);re.skyColor.copy(H.color).multiplyScalar(ie),re.groundColor.copy(H.groundColor).multiplyScalar(ie),n.hemi[x]=re,x++}}w>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Ae.LTC_FLOAT_1,n.rectAreaLTC2=Ae.LTC_FLOAT_2):(n.rectAreaLTC1=Ae.LTC_HALF_1,n.rectAreaLTC2=Ae.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=f,n.ambient[2]=u;const G=n.hash;(G.sunLength!==d||G.directionalLength!==m||G.pointLength!==p||G.spotLength!==b||G.rectAreaLength!==w||G.hemiLength!==x||G.numSunShadows!==g||G.numDirectionalShadows!==T||G.numPointShadows!==E||G.numSpotShadows!==L||G.numSpotMaps!==v||G.numLightProbes!==U)&&(n.sun.length=d,n.directional.length=m,n.spot.length=b,n.rectArea.length=w,n.point.length=p,n.hemi.length=x,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=S,n.sunShadowCascade.length=S,n.directionalShadow.length=T,n.directionalShadowMap.length=T,n.directionalShadowMatrix.length=T,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=L,n.spotShadowMap.length=L,n.spotLightMatrix.length=L+v-A,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=U,G.sunLength=d,G.directionalLength=m,G.pointLength=p,G.spotLength=b,G.rectAreaLength=w,G.hemiLength=x,G.numSunShadows=g,G.numDirectionalShadows=T,G.numPointShadows=E,G.numSpotShadows=L,G.numSpotMaps=v,G.numLightProbes=U,n.version=ng++)}function l(c,h){let f=0,u=0,d=0,g=0,S=0,m=0;const p=h.matrixWorldInverse;for(let b=0,w=c.length;b<w;b++){const x=c[b];if(x.isSunLight){const T=n.sun[f];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(p),f++}else if(x.isDirectionalLight){const T=n.directional[u];T.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(p),u++}else if(x.isSpotLight){const T=n.spot[g];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(p),T.direction.setFromMatrixPosition(x.matrixWorld),r.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(r),T.direction.transformDirection(p),g++}else if(x.isRectAreaLight){const T=n.rectArea[S];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(p),a.identity(),s.copy(x.matrixWorld),s.premultiply(p),a.extractRotation(s),T.halfWidth.set(x.width*.5,0,0),T.halfHeight.set(0,x.height*.5,0),T.halfWidth.applyMatrix4(a),T.halfHeight.applyMatrix4(a),S++}else if(x.isPointLight){const T=n.point[d];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(p),d++}else if(x.isHemisphereLight){const T=n.hemi[m];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:n}}function Kc(i){const e=new rg(i),t=[],n=[],r=[];function s(u){f.camera=u,t.length=0,n.length=0,r.length=0}function a(u){t.push(u)}function o(u){n.push(u)}function l(u){r.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}const f={lightsArray:t,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:c,setupLightsView:h,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function sg(i){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Kc(i),e.set(r,[o])):s>=a.length?(o=new Kc(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const ag=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,og=`uniform sampler2D shadow_pass;
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
}`,lg=[new N(1,0,0),new N(-1,0,0),new N(0,1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1)],cg=[new N(0,-1,0),new N(0,-1,0),new N(0,0,1),new N(0,0,-1),new N(0,-1,0),new N(0,-1,0)],$c=new ut,Er=new N,Ao=new N;function ug(i,e,t){let n=new Yl;const r=new ue,s=new ue,a=new dt,o=new Kf,l=new $f,c={},h=t.maxTextureSize,f={[Qn]:zt,[zt]:Qn,[tn]:tn},u=new Mt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ue},radius:{value:4}},vertexShader:ag,fragmentShader:og}),d=u.clone();d.defines.HORIZONTAL_PASS=1;const g=new xt;g.setAttribute("position",new Zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new rt(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Dr;let p=this.type;this.render=function(E,L,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;this.type===Vu&&(Ze("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Dr);const A=i.getRenderTarget(),U=i.getActiveCubeFace(),G=i.getActiveMipmapLevel(),B=i.state;B.setBlending(vn),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);const J=p!==this.type;J&&L.traverse(function(H){H.material&&(Array.isArray(H.material)?H.material.forEach(Z=>Z.needsUpdate=!0):H.material.needsUpdate=!0)});for(let H=0,Z=E.length;H<Z;H++){const ie=E[H],$=ie.shadow;if($===void 0){Ze("WebGLShadowMap:",ie,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const K=$.getFrameExtents();r.multiply(K),s.copy($.mapSize),(r.x>h||r.y>h)&&(r.x>h&&(s.x=Math.floor(h/K.x),r.x=s.x*K.x,$.mapSize.x=s.x),r.y>h&&(s.y=Math.floor(h/K.y),r.y=s.y*K.y,$.mapSize.y=s.y));const re=i.state.buffers.depth.getReversed();if($.camera._reversedDepth=re,$.map===null||J===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===$i){if(ie.isPointLight){Ze("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}$.map=new It(r.x,r.y,{format:ti,type:Dt,minFilter:Ct,magFilter:Ct,generateMipmaps:!1}),$.map.texture.name=ie.name+".shadowMap",$.map.depthTexture=new pr(r.x,r.y,on),$.map.depthTexture.name=ie.name+".shadowMapDepth",$.map.depthTexture.format=Cn,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=Lt,$.map.depthTexture.magFilter=Lt}else ie.isPointLight?($.map=new Cc(r.x),$.map.depthTexture=new df(r.x,Mn)):($.map=new It(r.x,r.y),$.map.depthTexture=new pr(r.x,r.y,Mn)),$.map.depthTexture.name=ie.name+".shadowMap",$.map.depthTexture.format=Cn,this.type===Dr?($.map.depthTexture.compareFunction=re?Ua:Da,$.map.depthTexture.minFilter=Ct,$.map.depthTexture.magFilter=Ct):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=Lt,$.map.depthTexture.magFilter=Lt);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==r.x||$.map.height!==r.y)&&$.map.setSize(r.x,r.y);const se=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();ie.isPointLight!==!0&&$.updateMatrices(ie,v);for(let he=0;he<se;he++){const xe=$.getCamera(he);if(ie.isPointLight){const _e=$.camera,Ie=$.matrix,Ne=ie.distance||_e.far;Ne!==_e.far&&(_e.far=Ne,_e.updateProjectionMatrix()),Er.setFromMatrixPosition(ie.matrixWorld),_e.position.copy(Er),Ao.copy(_e.position),Ao.add(lg[he]),_e.up.copy(cg[he]),_e.lookAt(Ao),_e.updateMatrixWorld(),Ie.makeTranslation(-Er.x,-Er.y,-Er.z),$c.multiplyMatrices(_e.projectionMatrix,_e.matrixWorldInverse),$._frustum.setFromProjectionMatrix($c,_e.coordinateSystem,_e.reversedDepth)}if($.map.isWebGLCubeRenderTarget)i.setRenderTarget($.map,he),i.clear();else{he===0&&(i.setRenderTarget($.map),i.clear());const _e=$.getViewport(he);a.set(s.x*_e.x,s.y*_e.y,s.x*_e.z,s.y*_e.w),B.viewport(a)}n=$.getFrustum(he),x(L,v,xe,ie,this.type)}$.isPointLightShadow!==!0&&this.type===$i&&b($,v),$.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(A,U,G)};function b(E,L){const v=e.update(S);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,d.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,d.needsUpdate=!0),E.mapPass===null?E.mapPass=new It(r.x,r.y,{format:ti,type:Dt}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),u.uniforms.shadow_pass.value=E.map.depthTexture,u.uniforms.resolution.value.set(E.map.width,E.map.height),u.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(L,null,v,u,S,null),d.uniforms.shadow_pass.value=E.mapPass.texture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(L,null,v,d,S,null)}function w(E,L,v,A){let U=null;const G=v.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(G!==void 0)U=G;else if(U=v.isPointLight===!0?l:o,i.localClippingEnabled&&L.clipShadows===!0&&Array.isArray(L.clippingPlanes)&&L.clippingPlanes.length!==0||L.displacementMap&&L.displacementScale!==0||L.alphaMap&&L.alphaTest>0||L.map&&L.alphaTest>0||L.alphaToCoverage===!0){const B=U.uuid,J=L.uuid;let H=c[B];H===void 0&&(H={},c[B]=H);let Z=H[J];Z===void 0&&(Z=U.clone(),H[J]=Z,L.addEventListener("dispose",T)),U=Z}if(U.visible=L.visible,U.wireframe=L.wireframe,A===$i?U.side=L.shadowSide!==null?L.shadowSide:L.side:U.side=L.shadowSide!==null?L.shadowSide:f[L.side],U.alphaMap=L.alphaMap,U.alphaTest=L.alphaToCoverage===!0?.5:L.alphaTest,U.map=L.map,U.clipShadows=L.clipShadows,U.clippingPlanes=L.clippingPlanes,U.clipIntersection=L.clipIntersection,U.displacementMap=L.displacementMap,U.displacementScale=L.displacementScale,U.displacementBias=L.displacementBias,U.wireframeLinewidth=L.wireframeLinewidth,U.linewidth=L.linewidth,v.isPointLight===!0&&U.isMeshDistanceMaterial===!0){const B=i.properties.get(U);B.light=v}return U}function x(E,L,v,A,U){if(E.visible===!1)return;if(E.layers.test(L.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&U===$i)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,E.matrixWorld);const J=e.update(E),H=E.material;if(Array.isArray(H)){const Z=J.groups;for(let ie=0,$=Z.length;ie<$;ie++){const K=Z[ie],re=H[K.materialIndex];if(re&&re.visible){const se=w(E,re,A,U);E.onBeforeShadow(i,E,L,v,J,se,K),i.renderBufferDirect(v,null,J,se,E,K),E.onAfterShadow(i,E,L,v,J,se,K)}}}else if(H.visible){const Z=w(E,H,A,U);E.onBeforeShadow(i,E,L,v,J,Z,null),i.renderBufferDirect(v,null,J,Z,E,null),E.onAfterShadow(i,E,L,v,J,Z,null)}}const B=E.children;for(let J=0,H=B.length;J<H;J++)x(B[J],L,v,A,U)}function T(E){E.target.removeEventListener("dispose",T);for(const v in c){const A=c[v],U=E.target.uuid;U in A&&(A[U].dispose(),delete A[U])}}}function hg(i,e){function t(){let W=!1;const we=new dt;let de=null;const Te=new dt(0,0,0,0);return{setMask:function(Le){de!==Le&&!W&&(i.colorMask(Le,Le,Le,Le),de=Le)},setLocked:function(Le){W=Le},setClear:function(Le,ve,Ve,He,pt){pt===!0&&(Le*=He,ve*=He,Ve*=He),we.set(Le,ve,Ve,He),Te.equals(we)===!1&&(i.clearColor(Le,ve,Ve,He),Te.copy(we))},reset:function(){W=!1,de=null,Te.set(-1,0,0,0)}}}function n(){let W=!1,we=!1,de=null,Te=null,Le=null;return{setReversed:function(ve){if(we!==ve){const Ve=e.get("EXT_clip_control");ve?Ve.clipControlEXT(Ve.LOWER_LEFT_EXT,Ve.ZERO_TO_ONE_EXT):Ve.clipControlEXT(Ve.LOWER_LEFT_EXT,Ve.NEGATIVE_ONE_TO_ONE_EXT),we=ve;const He=Le;Le=null,this.setClear(He)}},getReversed:function(){return we},setTest:function(ve){ve?D(i.DEPTH_TEST):I(i.DEPTH_TEST)},setMask:function(ve){de!==ve&&!W&&(i.depthMask(ve),de=ve)},setFunc:function(ve){if(we&&(ve=Eh[ve]),Te!==ve){switch(ve){case Hs:i.depthFunc(i.NEVER);break;case ks:i.depthFunc(i.ALWAYS);break;case Gs:i.depthFunc(i.LESS);break;case ji:i.depthFunc(i.LEQUAL);break;case Vs:i.depthFunc(i.EQUAL);break;case Ws:i.depthFunc(i.GEQUAL);break;case Xs:i.depthFunc(i.GREATER);break;case qs:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Te=ve}},setLocked:function(ve){W=ve},setClear:function(ve){Le!==ve&&(Le=ve,we&&(ve=1-ve),i.clearDepth(ve))},reset:function(){W=!1,de=null,Te=null,Le=null,we=!1}}}function r(){let W=!1,we=null,de=null,Te=null,Le=null,ve=null,Ve=null,He=null,pt=null;return{setTest:function(ot){W||(ot?D(i.STENCIL_TEST):I(i.STENCIL_TEST))},setMask:function(ot){we!==ot&&!W&&(i.stencilMask(ot),we=ot)},setFunc:function(ot,gn,An){(de!==ot||Te!==gn||Le!==An)&&(i.stencilFunc(ot,gn,An),de=ot,Te=gn,Le=An)},setOp:function(ot,gn,An){(ve!==ot||Ve!==gn||He!==An)&&(i.stencilOp(ot,gn,An),ve=ot,Ve=gn,He=An)},setLocked:function(ot){W=ot},setClear:function(ot){pt!==ot&&(i.clearStencil(ot),pt=ot)},reset:function(){W=!1,we=null,de=null,Te=null,Le=null,ve=null,Ve=null,He=null,pt=null}}}const s=new t,a=new n,o=new r,l=new WeakMap,c=new WeakMap;let h={},f={},u={},d=new WeakMap,g=[],S=null,m=!1,p=null,b=null,w=null,x=null,T=null,E=null,L=null,v=new qe(0,0,0),A=0,U=!1,G=null,B=null,J=null,H=null,Z=null;const ie=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,K=0;const re=i.getParameter(i.VERSION);re.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(re)[1]),$=K>=1):re.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(re)[1]),$=K>=2);let se=null,he={};const xe=i.getParameter(i.SCISSOR_BOX),_e=i.getParameter(i.VIEWPORT),Ie=new dt().fromArray(xe),Ne=new dt().fromArray(_e);function Xe(W,we,de,Te){const Le=new Uint8Array(4),ve=i.createTexture();i.bindTexture(W,ve),i.texParameteri(W,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(W,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ve=0;Ve<de;Ve++)W===i.TEXTURE_3D||W===i.TEXTURE_2D_ARRAY?i.texImage3D(we,0,i.RGBA,1,1,Te,0,i.RGBA,i.UNSIGNED_BYTE,Le):i.texImage2D(we+Ve,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Le);return ve}const F={};F[i.TEXTURE_2D]=Xe(i.TEXTURE_2D,i.TEXTURE_2D,1),F[i.TEXTURE_CUBE_MAP]=Xe(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),F[i.TEXTURE_2D_ARRAY]=Xe(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),F[i.TEXTURE_3D]=Xe(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),D(i.DEPTH_TEST),a.setFunc(ji),Y(!1),Q(el),D(i.CULL_FACE),k(vn);function D(W){h[W]!==!0&&(i.enable(W),h[W]=!0)}function I(W){h[W]!==!1&&(i.disable(W),h[W]=!1)}function C(W,we){return u[W]!==we?(i.bindFramebuffer(W,we),u[W]=we,W===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=we),W===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=we),!0):!1}function z(W,we){let de=g,Te=!1;if(W){de=d.get(we),de===void 0&&(de=[],d.set(we,de));const Le=W.textures;if(de.length!==Le.length||de[0]!==i.COLOR_ATTACHMENT0){for(let ve=0,Ve=Le.length;ve<Ve;ve++)de[ve]=i.COLOR_ATTACHMENT0+ve;de.length=Le.length,Te=!0}}else de[0]!==i.BACK&&(de[0]=i.BACK,Te=!0);Te&&i.drawBuffers(de)}function j(W){return S!==W?(i.useProgram(W),S=W,!0):!1}const me={[vi]:i.FUNC_ADD,[Xu]:i.FUNC_SUBTRACT,[qu]:i.FUNC_REVERSE_SUBTRACT};me[Yu]=i.MIN,me[Zu]=i.MAX;const R={[Ku]:i.ZERO,[$u]:i.ONE,[Ju]:i.SRC_COLOR,[il]:i.SRC_ALPHA,[ih]:i.SRC_ALPHA_SATURATE,[th]:i.DST_COLOR,[ju]:i.DST_ALPHA,[Qu]:i.ONE_MINUS_SRC_COLOR,[rl]:i.ONE_MINUS_SRC_ALPHA,[nh]:i.ONE_MINUS_DST_COLOR,[eh]:i.ONE_MINUS_DST_ALPHA,[rh]:i.CONSTANT_COLOR,[sh]:i.ONE_MINUS_CONSTANT_COLOR,[ah]:i.CONSTANT_ALPHA,[oh]:i.ONE_MINUS_CONSTANT_ALPHA};function k(W,we,de,Te,Le,ve,Ve,He,pt,ot){if(W===vn){m===!0&&(I(i.BLEND),m=!1);return}if(m===!1&&(D(i.BLEND),m=!0),W!==Wu){if(W!==p||ot!==U){if((b!==vi||T!==vi)&&(i.blendEquation(i.FUNC_ADD),b=vi,T=vi),ot)switch(W){case Ji:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Qi:i.blendFunc(i.ONE,i.ONE);break;case tl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case nl:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:it("WebGLState: Invalid blending: ",W);break}else switch(W){case Ji:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Qi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case tl:it("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case nl:it("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:it("WebGLState: Invalid blending: ",W);break}w=null,x=null,E=null,L=null,v.set(0,0,0),A=0,p=W,U=ot}return}Le=Le||we,ve=ve||de,Ve=Ve||Te,(we!==b||Le!==T)&&(i.blendEquationSeparate(me[we],me[Le]),b=we,T=Le),(de!==w||Te!==x||ve!==E||Ve!==L)&&(i.blendFuncSeparate(R[de],R[Te],R[ve],R[Ve]),w=de,x=Te,E=ve,L=Ve),(He.equals(v)===!1||pt!==A)&&(i.blendColor(He.r,He.g,He.b,pt),v.copy(He),A=pt),p=W,U=!1}function O(W,we){W.side===tn?I(i.CULL_FACE):D(i.CULL_FACE);let de=W.side===zt;we&&(de=!de),Y(de),W.blending===Ji&&W.transparent===!1?k(vn):k(W.blending,W.blendEquation,W.blendSrc,W.blendDst,W.blendEquationAlpha,W.blendSrcAlpha,W.blendDstAlpha,W.blendColor,W.blendAlpha,W.premultipliedAlpha),a.setFunc(W.depthFunc),a.setTest(W.depthTest),a.setMask(W.depthWrite),s.setMask(W.colorWrite);const Te=W.stencilWrite;o.setTest(Te),Te&&(o.setMask(W.stencilWriteMask),o.setFunc(W.stencilFunc,W.stencilRef,W.stencilFuncMask),o.setOp(W.stencilFail,W.stencilZFail,W.stencilZPass)),ge(W.polygonOffset,W.polygonOffsetFactor,W.polygonOffsetUnits),W.alphaToCoverage===!0?D(i.SAMPLE_ALPHA_TO_COVERAGE):I(i.SAMPLE_ALPHA_TO_COVERAGE)}function Y(W){G!==W&&(W?i.frontFace(i.CW):i.frontFace(i.CCW),G=W)}function Q(W){W!==ku?(D(i.CULL_FACE),W!==B&&(W===el?i.cullFace(i.BACK):W===Gu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):I(i.CULL_FACE),B=W}function le(W){W!==J&&($&&i.lineWidth(W),J=W)}function ge(W,we,de){W?(D(i.POLYGON_OFFSET_FILL),(H!==we||Z!==de)&&(H=we,Z=de,a.getReversed()&&(we=-we),i.polygonOffset(we,de))):I(i.POLYGON_OFFSET_FILL)}function pe(W){W?D(i.SCISSOR_TEST):I(i.SCISSOR_TEST)}function q(W){W===void 0&&(W=i.TEXTURE0+ie-1),se!==W&&(i.activeTexture(W),se=W)}function M(W,we,de){de===void 0&&(se===null?de=i.TEXTURE0+ie-1:de=se);let Te=he[de];Te===void 0&&(Te={type:void 0,texture:void 0},he[de]=Te),(Te.type!==W||Te.texture!==we)&&(se!==de&&(i.activeTexture(de),se=de),i.bindTexture(W,we||F[W]),Te.type=W,Te.texture=we)}function Re(){const W=he[se];W!==void 0&&W.type!==void 0&&(i.bindTexture(W.type,null),W.type=void 0,W.texture=void 0)}function Fe(){try{i.compressedTexImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function P(){try{i.compressedTexImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function _(){try{i.texSubImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function X(){try{i.texSubImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function ee(){try{i.compressedTexSubImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function oe(){try{i.compressedTexSubImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function Me(){try{i.texStorage2D(...arguments)}catch(W){it("WebGLState:",W)}}function Se(){try{i.texStorage3D(...arguments)}catch(W){it("WebGLState:",W)}}function ce(){try{i.texImage2D(...arguments)}catch(W){it("WebGLState:",W)}}function fe(){try{i.texImage3D(...arguments)}catch(W){it("WebGLState:",W)}}function ye(W){return f[W]!==void 0?f[W]:i.getParameter(W)}function ze(W,we){f[W]!==we&&(i.pixelStorei(W,we),f[W]=we)}function Ee(W){Ie.equals(W)===!1&&(i.scissor(W.x,W.y,W.z,W.w),Ie.copy(W))}function be(W){Ne.equals(W)===!1&&(i.viewport(W.x,W.y,W.z,W.w),Ne.copy(W))}function Ge(W,we){let de=c.get(we);de===void 0&&(de=new WeakMap,c.set(we,de));let Te=de.get(W);Te===void 0&&(Te=i.getUniformBlockIndex(we,W.name),de.set(W,Te))}function Ye(W,we){const Te=c.get(we).get(W);l.get(we)!==Te&&(i.uniformBlockBinding(we,Te,W.__bindingPointIndex),l.set(we,Te))}function $e(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},f={},se=null,he={},u={},d=new WeakMap,g=[],S=null,m=!1,p=null,b=null,w=null,x=null,T=null,E=null,L=null,v=new qe(0,0,0),A=0,U=!1,G=null,B=null,J=null,H=null,Z=null,Ie.set(0,0,i.canvas.width,i.canvas.height),Ne.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:D,disable:I,bindFramebuffer:C,drawBuffers:z,useProgram:j,setBlending:k,setMaterial:O,setFlipSided:Y,setCullFace:Q,setLineWidth:le,setPolygonOffset:ge,setScissorTest:pe,activeTexture:q,bindTexture:M,unbindTexture:Re,compressedTexImage2D:Fe,compressedTexImage3D:P,texImage2D:ce,texImage3D:fe,pixelStorei:ze,getParameter:ye,updateUBOMapping:Ge,uniformBlockBinding:Ye,texStorage2D:Me,texStorage3D:Se,texSubImage2D:_,texSubImage3D:X,compressedTexSubImage2D:ee,compressedTexSubImage3D:oe,scissor:Ee,viewport:be,reset:$e}}function fg(i,e,t,n,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ue,h=new WeakMap,f=new Set;let u;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(P,_){return g?new OffscreenCanvas(P,_):Zr("canvas")}function m(P,_,X){let ee=1;const oe=Fe(P);if((oe.width>X||oe.height>X)&&(ee=X/Math.max(oe.width,oe.height)),ee<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const Me=Math.floor(ee*oe.width),Se=Math.floor(ee*oe.height);u===void 0&&(u=S(Me,Se));const ce=_?S(Me,Se):u;return ce.width=Me,ce.height=Se,ce.getContext("2d").drawImage(P,0,0,Me,Se),Ze("WebGLRenderer: Texture has been resized from ("+oe.width+"x"+oe.height+") to ("+Me+"x"+Se+")."),ce}else return"data"in P&&Ze("WebGLRenderer: Image in DataTexture is too big ("+oe.width+"x"+oe.height+")."),P;return P}function p(P){return P.generateMipmaps}function b(P){i.generateMipmap(P)}function w(P){return P.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?i.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function x(P,_,X,ee,oe,Me=!1){if(P!==null){if(i[P]!==void 0)return i[P];Ze("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let Se;ee&&(Se=e.get("EXT_texture_norm16"),Se||Ze("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ce=_;if(_===i.RED&&(X===i.FLOAT&&(ce=i.R32F),X===i.HALF_FLOAT&&(ce=i.R16F),X===i.UNSIGNED_BYTE&&(ce=i.R8),X===i.UNSIGNED_SHORT&&Se&&(ce=Se.R16_EXT),X===i.SHORT&&Se&&(ce=Se.R16_SNORM_EXT)),_===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(ce=i.R8UI),X===i.UNSIGNED_SHORT&&(ce=i.R16UI),X===i.UNSIGNED_INT&&(ce=i.R32UI),X===i.BYTE&&(ce=i.R8I),X===i.SHORT&&(ce=i.R16I),X===i.INT&&(ce=i.R32I)),_===i.RG&&(X===i.FLOAT&&(ce=i.RG32F),X===i.HALF_FLOAT&&(ce=i.RG16F),X===i.UNSIGNED_BYTE&&(ce=i.RG8),X===i.UNSIGNED_SHORT&&Se&&(ce=Se.RG16_EXT),X===i.SHORT&&Se&&(ce=Se.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(ce=i.RG8UI),X===i.UNSIGNED_SHORT&&(ce=i.RG16UI),X===i.UNSIGNED_INT&&(ce=i.RG32UI),X===i.BYTE&&(ce=i.RG8I),X===i.SHORT&&(ce=i.RG16I),X===i.INT&&(ce=i.RG32I)),_===i.RGB_INTEGER&&(X===i.UNSIGNED_BYTE&&(ce=i.RGB8UI),X===i.UNSIGNED_SHORT&&(ce=i.RGB16UI),X===i.UNSIGNED_INT&&(ce=i.RGB32UI),X===i.BYTE&&(ce=i.RGB8I),X===i.SHORT&&(ce=i.RGB16I),X===i.INT&&(ce=i.RGB32I)),_===i.RGBA_INTEGER&&(X===i.UNSIGNED_BYTE&&(ce=i.RGBA8UI),X===i.UNSIGNED_SHORT&&(ce=i.RGBA16UI),X===i.UNSIGNED_INT&&(ce=i.RGBA32UI),X===i.BYTE&&(ce=i.RGBA8I),X===i.SHORT&&(ce=i.RGBA16I),X===i.INT&&(ce=i.RGBA32I)),_===i.RGB&&(X===i.UNSIGNED_SHORT&&Se&&(ce=Se.RGB16_EXT),X===i.SHORT&&Se&&(ce=Se.RGB16_SNORM_EXT),X===i.UNSIGNED_INT_5_9_9_9_REV&&(ce=i.RGB9_E5),X===i.UNSIGNED_INT_10F_11F_11F_REV&&(ce=i.R11F_G11F_B10F)),_===i.RGBA){const fe=Me?qr:nt.getTransfer(oe);X===i.FLOAT&&(ce=i.RGBA32F),X===i.HALF_FLOAT&&(ce=i.RGBA16F),X===i.UNSIGNED_BYTE&&(ce=fe===ct?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT&&Se&&(ce=Se.RGBA16_EXT),X===i.SHORT&&Se&&(ce=Se.RGBA16_SNORM_EXT),X===i.UNSIGNED_SHORT_4_4_4_4&&(ce=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(ce=i.RGB5_A1)}return(ce===i.R16F||ce===i.R32F||ce===i.RG16F||ce===i.RG32F||ce===i.RGBA16F||ce===i.RGBA32F)&&e.get("EXT_color_buffer_float"),ce}function T(P,_){let X;return P?_===null||_===Mn||_===tr?X=i.DEPTH24_STENCIL8:_===on?X=i.DEPTH32F_STENCIL8:_===er&&(X=i.DEPTH24_STENCIL8,Ze("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Mn||_===tr?X=i.DEPTH_COMPONENT24:_===on?X=i.DEPTH_COMPONENT32F:_===er&&(X=i.DEPTH_COMPONENT16),X}function E(P,_){return p(P)===!0||P.isFramebufferTexture&&P.minFilter!==Lt&&P.minFilter!==Ct?Math.log2(Math.max(_.width,_.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?_.mipmaps.length:1}function L(P){const _=P.target;_.removeEventListener("dispose",L),A(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&f.delete(_)}function v(P){const _=P.target;_.removeEventListener("dispose",v),G(_)}function A(P){const _=n.get(P);if(_.__webglInit===void 0)return;const X=P.source,ee=d.get(X);if(ee){const oe=ee[_.__cacheKey];oe.usedTimes--,oe.usedTimes===0&&U(P),Object.keys(ee).length===0&&d.delete(X)}n.remove(P)}function U(P){const _=n.get(P);i.deleteTexture(_.__webglTexture);const X=P.source,ee=d.get(X);delete ee[_.__cacheKey],a.memory.textures--}function G(P){const _=n.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),n.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let ee=0;ee<6;ee++){if(Array.isArray(_.__webglFramebuffer[ee]))for(let oe=0;oe<_.__webglFramebuffer[ee].length;oe++)i.deleteFramebuffer(_.__webglFramebuffer[ee][oe]);else i.deleteFramebuffer(_.__webglFramebuffer[ee]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[ee])}else{if(Array.isArray(_.__webglFramebuffer))for(let ee=0;ee<_.__webglFramebuffer.length;ee++)i.deleteFramebuffer(_.__webglFramebuffer[ee]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let ee=0;ee<_.__webglColorRenderbuffer.length;ee++)_.__webglColorRenderbuffer[ee]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[ee]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}const X=P.textures;for(let ee=0,oe=X.length;ee<oe;ee++){const Me=n.get(X[ee]);Me.__webglTexture&&(i.deleteTexture(Me.__webglTexture),a.memory.textures--),n.remove(X[ee])}n.remove(P)}let B=0;function J(){B=0}function H(){return B}function Z(P){B=P}function ie(){const P=B;return P>=r.maxTextures&&Ze("WebGLTextures: Trying to use "+(P+1)+" texture units while this GPU supports only "+r.maxTextures),B+=1,P}function $(P){const _=[];return _.push(P.wrapS),_.push(P.wrapT),_.push(P.wrapR||0),_.push(P.magFilter),_.push(P.minFilter),_.push(P.anisotropy),_.push(P.internalFormat),_.push(P.format),_.push(P.type),_.push(P.generateMipmaps),_.push(P.premultiplyAlpha),_.push(P.flipY),_.push(P.unpackAlignment),_.push(P.colorSpace),_.join()}function K(P,_){const X=n.get(P);if(P.isVideoTexture&&M(P),P.isRenderTargetTexture===!1&&P.isExternalTexture!==!0&&P.version>0&&X.__version!==P.version){const ee=P.image;if(ee===null)Ze("WebGLRenderer: Texture marked for update but no image data found.");else if(ee.complete===!1)Ze("WebGLRenderer: Texture marked for update but image is incomplete");else{I(X,P,_);return}}else P.isExternalTexture&&(X.__webglTexture=P.sourceTexture?P.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+_)}function re(P,_){const X=n.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&X.__version!==P.version){I(X,P,_);return}else P.isExternalTexture&&(X.__webglTexture=P.sourceTexture?P.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+_)}function se(P,_){const X=n.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&X.__version!==P.version){I(X,P,_);return}t.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+_)}function he(P,_){const X=n.get(P);if(P.isCubeDepthTexture!==!0&&P.version>0&&X.__version!==P.version){C(X,P,_);return}t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+_)}const xe={[Nr]:i.REPEAT,[_n]:i.CLAMP_TO_EDGE,[Fr]:i.MIRRORED_REPEAT},_e={[Lt]:i.NEAREST,[uh]:i.NEAREST_MIPMAP_NEAREST,[Or]:i.NEAREST_MIPMAP_LINEAR,[Ct]:i.LINEAR,[Ks]:i.LINEAR_MIPMAP_NEAREST,[zn]:i.LINEAR_MIPMAP_LINEAR},Ie={[ph]:i.NEVER,[_h]:i.ALWAYS,[mh]:i.LESS,[Da]:i.LEQUAL,[gh]:i.EQUAL,[Ua]:i.GEQUAL,[vh]:i.GREATER,[xh]:i.NOTEQUAL};function Ne(P,_){if(_.type===on&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===Ct||_.magFilter===Ks||_.magFilter===Or||_.magFilter===zn||_.minFilter===Ct||_.minFilter===Ks||_.minFilter===Or||_.minFilter===zn)&&Ze("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(P,i.TEXTURE_WRAP_S,xe[_.wrapS]),i.texParameteri(P,i.TEXTURE_WRAP_T,xe[_.wrapT]),(P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY)&&i.texParameteri(P,i.TEXTURE_WRAP_R,xe[_.wrapR]),i.texParameteri(P,i.TEXTURE_MAG_FILTER,_e[_.magFilter]),i.texParameteri(P,i.TEXTURE_MIN_FILTER,_e[_.minFilter]),_.compareFunction&&(i.texParameteri(P,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(P,i.TEXTURE_COMPARE_FUNC,Ie[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Lt||_.minFilter!==Or&&_.minFilter!==zn||_.type===on&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){const X=e.get("EXT_texture_filter_anisotropic");i.texParameterf(P,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,r.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Xe(P,_){let X=!1;P.__webglInit===void 0&&(P.__webglInit=!0,_.addEventListener("dispose",L));const ee=_.source;let oe=d.get(ee);oe===void 0&&(oe={},d.set(ee,oe));const Me=$(_);if(Me!==P.__cacheKey){oe[Me]===void 0&&(oe[Me]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,X=!0),oe[Me].usedTimes++;const Se=oe[P.__cacheKey];Se!==void 0&&(oe[P.__cacheKey].usedTimes--,Se.usedTimes===0&&U(_)),P.__cacheKey=Me,P.__webglTexture=oe[Me].texture}return X}function F(P,_,X){return Math.floor(Math.floor(P/X)/_)}function D(P,_,X,ee){const Me=P.updateRanges;if(Me.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,X,ee,_.data);else{Me.sort((ze,Ee)=>ze.start-Ee.start);let Se=0;for(let ze=1;ze<Me.length;ze++){const Ee=Me[Se],be=Me[ze],Ge=Ee.start+Ee.count,Ye=F(be.start,_.width,4),$e=F(Ee.start,_.width,4);be.start<=Ge+1&&Ye===$e&&F(be.start+be.count-1,_.width,4)===Ye?Ee.count=Math.max(Ee.count,be.start+be.count-Ee.start):(++Se,Me[Se]=be)}Me.length=Se+1;const ce=t.getParameter(i.UNPACK_ROW_LENGTH),fe=t.getParameter(i.UNPACK_SKIP_PIXELS),ye=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let ze=0,Ee=Me.length;ze<Ee;ze++){const be=Me[ze],Ge=Math.floor(be.start/4),Ye=Math.ceil(be.count/4),$e=Ge%_.width,W=Math.floor(Ge/_.width),we=Ye,de=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,$e),t.pixelStorei(i.UNPACK_SKIP_ROWS,W),t.texSubImage2D(i.TEXTURE_2D,0,$e,W,we,de,X,ee,_.data)}P.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,ce),t.pixelStorei(i.UNPACK_SKIP_PIXELS,fe),t.pixelStorei(i.UNPACK_SKIP_ROWS,ye)}}function I(P,_,X){let ee=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(ee=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(ee=i.TEXTURE_3D);const oe=Xe(P,_),Me=_.source;t.bindTexture(ee,P.__webglTexture,i.TEXTURE0+X);const Se=n.get(Me);if(Me.version!==Se.__version||oe===!0){if(t.activeTexture(i.TEXTURE0+X),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){const de=nt.getPrimaries(nt.workingColorSpace),Te=_.colorSpace===Hn?null:nt.getPrimaries(_.colorSpace),Le=_.colorSpace===Hn||de===Te?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Le)}t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let fe=m(_.image,!1,r.maxTextureSize);fe=Re(_,fe);const ye=s.convert(_.format,_.colorSpace),ze=s.convert(_.type);let Ee=x(_.internalFormat,ye,ze,_.normalized,_.colorSpace,_.isVideoTexture);Ne(ee,_);let be;const Ge=_.mipmaps,Ye=_.isVideoTexture!==!0,$e=Se.__version===void 0||oe===!0,W=Me.dataReady,we=E(_,fe);if(_.isDepthTexture)Ee=T(_.format===ei,_.type),$e&&(Ye?t.texStorage2D(i.TEXTURE_2D,1,Ee,fe.width,fe.height):t.texImage2D(i.TEXTURE_2D,0,Ee,fe.width,fe.height,0,ye,ze,null));else if(_.isDataTexture)if(Ge.length>0){Ye&&$e&&t.texStorage2D(i.TEXTURE_2D,we,Ee,Ge[0].width,Ge[0].height);for(let de=0,Te=Ge.length;de<Te;de++)be=Ge[de],Ye?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,be.width,be.height,ye,ze,be.data):t.texImage2D(i.TEXTURE_2D,de,Ee,be.width,be.height,0,ye,ze,be.data);_.generateMipmaps=!1}else Ye?($e&&t.texStorage2D(i.TEXTURE_2D,we,Ee,fe.width,fe.height),W&&D(_,fe,ye,ze)):t.texImage2D(i.TEXTURE_2D,0,Ee,fe.width,fe.height,0,ye,ze,fe.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Ye&&$e&&t.texStorage3D(i.TEXTURE_2D_ARRAY,we,Ee,Ge[0].width,Ge[0].height,fe.depth);for(let de=0,Te=Ge.length;de<Te;de++)if(be=Ge[de],_.format!==ln)if(ye!==null)if(Ye){if(W)if(_.layerUpdates.size>0){const Le=Sc(be.width,be.height,_.format,_.type);for(const ve of _.layerUpdates){const Ve=be.data.subarray(ve*Le/be.data.BYTES_PER_ELEMENT,(ve+1)*Le/be.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,ve,be.width,be.height,1,ye,Ve)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,0,be.width,be.height,fe.depth,ye,be.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,de,Ee,be.width,be.height,fe.depth,0,be.data,0,0);else Ze("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ye?W&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,0,be.width,be.height,fe.depth,ye,ze,be.data):t.texImage3D(i.TEXTURE_2D_ARRAY,de,Ee,be.width,be.height,fe.depth,0,ye,ze,be.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Ye&&$e&&t.texStorage2D(i.TEXTURE_2D,we,Ee,Ge[0].width,Ge[0].height);for(let de=0,Te=Ge.length;de<Te;de++)be=Ge[de],_.format!==ln?ye!==null?Ye?W&&t.compressedTexSubImage2D(i.TEXTURE_2D,de,0,0,be.width,be.height,ye,be.data):t.compressedTexImage2D(i.TEXTURE_2D,de,Ee,be.width,be.height,0,be.data):Ze("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ye?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,be.width,be.height,ye,ze,be.data):t.texImage2D(i.TEXTURE_2D,de,Ee,be.width,be.height,0,ye,ze,be.data)}else if(_.isDataArrayTexture)if(Ye){if($e&&t.texStorage3D(i.TEXTURE_2D_ARRAY,we,Ee,fe.width,fe.height,fe.depth),W)if(_.layerUpdates.size>0){const de=Sc(fe.width,fe.height,_.format,_.type);for(const Te of _.layerUpdates){const Le=fe.data.subarray(Te*de/fe.data.BYTES_PER_ELEMENT,(Te+1)*de/fe.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Te,fe.width,fe.height,1,ye,ze,Le)}_.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,fe.width,fe.height,fe.depth,ye,ze,fe.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Ee,fe.width,fe.height,fe.depth,0,ye,ze,fe.data);else if(_.isData3DTexture)Ye?($e&&t.texStorage3D(i.TEXTURE_3D,we,Ee,fe.width,fe.height,fe.depth),W&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,fe.width,fe.height,fe.depth,ye,ze,fe.data)):t.texImage3D(i.TEXTURE_3D,0,Ee,fe.width,fe.height,fe.depth,0,ye,ze,fe.data);else if(_.isFramebufferTexture){if($e)if(Ye)t.texStorage2D(i.TEXTURE_2D,we,Ee,fe.width,fe.height);else{let de=fe.width,Te=fe.height;for(let Le=0;Le<we;Le++)t.texImage2D(i.TEXTURE_2D,Le,Ee,de,Te,0,ye,ze,null),de>>=1,Te>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){const de=i.canvas;if(de.hasAttribute("layoutsubtree")||de.setAttribute("layoutsubtree","true"),fe.parentNode!==de){de.appendChild(fe),f.add(_),de.onpaint=Te=>{const Le=Te.changedElements;for(const ve of f)Le.includes(ve.image)&&(ve.needsUpdate=!0)},de.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,fe);else{const Le=i.RGBA,ve=i.RGBA,Ve=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Le,ve,Ve,fe)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ge.length>0){if(Ye&&$e){const de=Fe(Ge[0]);t.texStorage2D(i.TEXTURE_2D,we,Ee,de.width,de.height)}for(let de=0,Te=Ge.length;de<Te;de++)be=Ge[de],Ye?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,ye,ze,be):t.texImage2D(i.TEXTURE_2D,de,Ee,ye,ze,be);_.generateMipmaps=!1}else if(Ye){if($e){const de=Fe(fe);t.texStorage2D(i.TEXTURE_2D,we,Ee,de.width,de.height)}W&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ye,ze,fe)}else t.texImage2D(i.TEXTURE_2D,0,Ee,ye,ze,fe);p(_)&&b(ee),Se.__version=Me.version,_.onUpdate&&_.onUpdate(_)}P.__version=_.version}function C(P,_,X){if(_.image.length!==6)return;const ee=Xe(P,_),oe=_.source;t.bindTexture(i.TEXTURE_CUBE_MAP,P.__webglTexture,i.TEXTURE0+X);const Me=n.get(oe);if(oe.version!==Me.__version||ee===!0){t.activeTexture(i.TEXTURE0+X);const Se=nt.getPrimaries(nt.workingColorSpace),ce=_.colorSpace===Hn?null:nt.getPrimaries(_.colorSpace),fe=_.colorSpace===Hn||Se===ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);const ye=_.isCompressedTexture||_.image[0].isCompressedTexture,ze=_.image[0]&&_.image[0].isDataTexture,Ee=[];for(let ve=0;ve<6;ve++)!ye&&!ze?Ee[ve]=m(_.image[ve],!0,r.maxCubemapSize):Ee[ve]=ze?_.image[ve].image:_.image[ve],Ee[ve]=Re(_,Ee[ve]);const be=Ee[0],Ge=s.convert(_.format,_.colorSpace),Ye=s.convert(_.type),$e=x(_.internalFormat,Ge,Ye,_.normalized,_.colorSpace),W=_.isVideoTexture!==!0,we=Me.__version===void 0||ee===!0,de=oe.dataReady;let Te=E(_,be);Ne(i.TEXTURE_CUBE_MAP,_);let Le;if(ye){W&&we&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Te,$e,be.width,be.height);for(let ve=0;ve<6;ve++){Le=Ee[ve].mipmaps;for(let Ve=0;Ve<Le.length;Ve++){const He=Le[Ve];_.format!==ln?Ge!==null?W?de&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve,0,0,He.width,He.height,Ge,He.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve,$e,He.width,He.height,0,He.data):Ze("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve,0,0,He.width,He.height,Ge,Ye,He.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve,$e,He.width,He.height,0,Ge,Ye,He.data)}}}else{if(Le=_.mipmaps,W&&we){Le.length>0&&Te++;const ve=Fe(Ee[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Te,$e,ve.width,ve.height)}for(let ve=0;ve<6;ve++)if(ze){W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,Ee[ve].width,Ee[ve].height,Ge,Ye,Ee[ve].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,$e,Ee[ve].width,Ee[ve].height,0,Ge,Ye,Ee[ve].data);for(let Ve=0;Ve<Le.length;Ve++){const pt=Le[Ve].image[ve].image;W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve+1,0,0,pt.width,pt.height,Ge,Ye,pt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve+1,$e,pt.width,pt.height,0,Ge,Ye,pt.data)}}else{W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,0,0,Ge,Ye,Ee[ve]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,0,$e,Ge,Ye,Ee[ve]);for(let Ve=0;Ve<Le.length;Ve++){const He=Le[Ve];W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve+1,0,0,Ge,Ye,He.image[ve]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ve,Ve+1,$e,Ge,Ye,He.image[ve])}}}p(_)&&b(i.TEXTURE_CUBE_MAP),Me.__version=oe.version,_.onUpdate&&_.onUpdate(_)}P.__version=_.version}function z(P,_,X,ee,oe,Me){const Se=s.convert(X.format,X.colorSpace),ce=s.convert(X.type),fe=x(X.internalFormat,Se,ce,X.normalized,X.colorSpace),ye=n.get(_),ze=n.get(X);if(ze.__renderTarget=_,!ye.__hasExternalTextures){const Ee=Math.max(1,_.width>>Me),be=Math.max(1,_.height>>Me);oe===i.TEXTURE_3D||oe===i.TEXTURE_2D_ARRAY?t.texImage3D(oe,Me,fe,Ee,be,_.depth,0,Se,ce,null):t.texImage2D(oe,Me,fe,Ee,be,0,Se,ce,null)}t.bindFramebuffer(i.FRAMEBUFFER,P),q(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ee,oe,ze.__webglTexture,0,pe(_)):(oe===i.TEXTURE_2D||oe>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&oe<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,ee,oe,ze.__webglTexture,Me),t.bindFramebuffer(i.FRAMEBUFFER,null)}function j(P,_,X){if(i.bindRenderbuffer(i.RENDERBUFFER,P),_.depthBuffer){const ee=_.depthTexture,oe=ee&&ee.isDepthTexture?ee.type:null,Me=T(_.stencilBuffer,oe),Se=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;q(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe(_),Me,_.width,_.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe(_),Me,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Me,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Se,i.RENDERBUFFER,P)}else{const ee=_.textures;for(let oe=0;oe<ee.length;oe++){const Me=ee[oe],Se=s.convert(Me.format,Me.colorSpace),ce=s.convert(Me.type),fe=x(Me.internalFormat,Se,ce,Me.normalized,Me.colorSpace);q(_)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pe(_),fe,_.width,_.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,pe(_),fe,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,fe,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function me(P,_,X){const ee=_.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,P),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const oe=n.get(_.depthTexture);if(oe.__renderTarget=_,(!oe.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),ee){if(oe.__webglInit===void 0&&(oe.__webglInit=!0,_.depthTexture.addEventListener("dispose",L)),oe.__webglTexture===void 0){oe.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,oe.__webglTexture),Ne(i.TEXTURE_CUBE_MAP,_.depthTexture);const ye=s.convert(_.depthTexture.format),ze=s.convert(_.depthTexture.type);let Ee;_.depthTexture.format===Cn?Ee=i.DEPTH_COMPONENT24:_.depthTexture.format===ei&&(Ee=i.DEPTH24_STENCIL8);for(let be=0;be<6;be++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+be,0,Ee,_.width,_.height,0,ye,ze,null)}}else K(_.depthTexture,0);const Me=oe.__webglTexture,Se=pe(_),ce=ee?i.TEXTURE_CUBE_MAP_POSITIVE_X+X:i.TEXTURE_2D,fe=_.depthTexture.format===ei?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===Cn)q(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,fe,ce,Me,0,Se):i.framebufferTexture2D(i.FRAMEBUFFER,fe,ce,Me,0);else if(_.depthTexture.format===ei)q(_)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,fe,ce,Me,0,Se):i.framebufferTexture2D(i.FRAMEBUFFER,fe,ce,Me,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function R(P){const _=n.get(P),X=P.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==P.depthTexture){const ee=P.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),ee){const oe=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,ee.removeEventListener("dispose",oe)};ee.addEventListener("dispose",oe),_.__depthDisposeCallback=oe}_.__boundDepthTexture=ee}if(P.depthTexture&&!_.__autoAllocateDepthBuffer)if(X)for(let ee=0;ee<6;ee++)me(_.__webglFramebuffer[ee],P,ee);else{const ee=P.texture.mipmaps;ee&&ee.length>0?me(_.__webglFramebuffer[0],P,0):me(_.__webglFramebuffer,P,0)}else if(X){_.__webglDepthbuffer=[];for(let ee=0;ee<6;ee++)if(t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[ee]),_.__webglDepthbuffer[ee]===void 0)_.__webglDepthbuffer[ee]=i.createRenderbuffer(),j(_.__webglDepthbuffer[ee],P,!1);else{const oe=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Me=_.__webglDepthbuffer[ee];i.bindRenderbuffer(i.RENDERBUFFER,Me),i.framebufferRenderbuffer(i.FRAMEBUFFER,oe,i.RENDERBUFFER,Me)}}else{const ee=P.texture.mipmaps;if(ee&&ee.length>0?t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),j(_.__webglDepthbuffer,P,!1);else{const oe=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Me=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Me),i.framebufferRenderbuffer(i.FRAMEBUFFER,oe,i.RENDERBUFFER,Me)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function k(P,_,X){const ee=n.get(P);_!==void 0&&z(ee.__webglFramebuffer,P,P.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&R(P)}function O(P){const _=P.texture,X=n.get(P),ee=n.get(_);P.addEventListener("dispose",v);const oe=P.textures,Me=P.isWebGLCubeRenderTarget===!0,Se=oe.length>1;if(Se||(ee.__webglTexture===void 0&&(ee.__webglTexture=i.createTexture()),ee.__version=_.version,a.memory.textures++),Me){X.__webglFramebuffer=[];for(let ce=0;ce<6;ce++)if(_.mipmaps&&_.mipmaps.length>0){X.__webglFramebuffer[ce]=[];for(let fe=0;fe<_.mipmaps.length;fe++)X.__webglFramebuffer[ce][fe]=i.createFramebuffer()}else X.__webglFramebuffer[ce]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){X.__webglFramebuffer=[];for(let ce=0;ce<_.mipmaps.length;ce++)X.__webglFramebuffer[ce]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(Se)for(let ce=0,fe=oe.length;ce<fe;ce++){const ye=n.get(oe[ce]);ye.__webglTexture===void 0&&(ye.__webglTexture=i.createTexture(),a.memory.textures++)}if(P.samples>0&&q(P)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let ce=0;ce<oe.length;ce++){const fe=oe[ce];X.__webglColorRenderbuffer[ce]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[ce]);const ye=s.convert(fe.format,fe.colorSpace),ze=s.convert(fe.type),Ee=x(fe.internalFormat,ye,ze,fe.normalized,fe.colorSpace,P.isXRRenderTarget===!0),be=pe(P);i.renderbufferStorageMultisample(i.RENDERBUFFER,be,Ee,P.width,P.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.RENDERBUFFER,X.__webglColorRenderbuffer[ce])}i.bindRenderbuffer(i.RENDERBUFFER,null),P.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),j(X.__webglDepthRenderbuffer,P,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Me){t.bindTexture(i.TEXTURE_CUBE_MAP,ee.__webglTexture),Ne(i.TEXTURE_CUBE_MAP,_);for(let ce=0;ce<6;ce++)if(_.mipmaps&&_.mipmaps.length>0)for(let fe=0;fe<_.mipmaps.length;fe++)z(X.__webglFramebuffer[ce][fe],P,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,fe);else z(X.__webglFramebuffer[ce],P,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0);p(_)&&b(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Se){for(let ce=0,fe=oe.length;ce<fe;ce++){const ye=oe[ce],ze=n.get(ye);let Ee=i.TEXTURE_2D;(P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(Ee=P.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(Ee,ze.__webglTexture),Ne(Ee,ye),z(X.__webglFramebuffer,P,ye,i.COLOR_ATTACHMENT0+ce,Ee,0),p(ye)&&b(Ee)}t.unbindTexture()}else{let ce=i.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(ce=P.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ce,ee.__webglTexture),Ne(ce,_),_.mipmaps&&_.mipmaps.length>0)for(let fe=0;fe<_.mipmaps.length;fe++)z(X.__webglFramebuffer[fe],P,_,i.COLOR_ATTACHMENT0,ce,fe);else z(X.__webglFramebuffer,P,_,i.COLOR_ATTACHMENT0,ce,0);p(_)&&b(ce),t.unbindTexture()}P.depthBuffer&&R(P)}function Y(P){const _=P.textures;for(let X=0,ee=_.length;X<ee;X++){const oe=_[X];if(p(oe)){const Me=w(P),Se=n.get(oe).__webglTexture;t.bindTexture(Me,Se),b(Me),t.unbindTexture()}}}const Q=[],le=[];function ge(P){if(P.samples>0){if(q(P)===!1){const _=P.textures,X=P.width,ee=P.height;let oe=i.COLOR_BUFFER_BIT;const Me=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Se=n.get(P),ce=_.length>1;if(ce)for(let ye=0;ye<_.length;ye++)t.bindFramebuffer(i.FRAMEBUFFER,Se.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Se.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Se.__webglMultisampledFramebuffer);const fe=P.texture.mipmaps;fe&&fe.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Se.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Se.__webglFramebuffer);for(let ye=0;ye<_.length;ye++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(oe|=i.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(oe|=i.STENCIL_BUFFER_BIT)),ce){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Se.__webglColorRenderbuffer[ye]);const ze=n.get(_[ye]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ze,0)}i.blitFramebuffer(0,0,X,ee,0,0,X,ee,oe,i.NEAREST),l===!0&&(Q.length=0,le.length=0,Q.push(i.COLOR_ATTACHMENT0+ye),P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&(Q.push(Me),le.push(Me),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,le)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Q))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ce)for(let ye=0;ye<_.length;ye++){t.bindFramebuffer(i.FRAMEBUFFER,Se.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.RENDERBUFFER,Se.__webglColorRenderbuffer[ye]);const ze=n.get(_[ye]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Se.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ye,i.TEXTURE_2D,ze,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Se.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&l){const _=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function pe(P){return Math.min(r.maxSamples,P.samples)}function q(P){const _=n.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function M(P){const _=a.render.frame;h.get(P)!==_&&(h.set(P,_),P.update())}function Re(P,_){const X=P.colorSpace,ee=P.format,oe=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||X!==Xr&&X!==Hn&&(nt.getTransfer(X)===ct?(ee!==ln||oe!==Kt)&&Ze("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):it("WebGLTextures: Unsupported texture color space:",X)),_}function Fe(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(c.width=P.naturalWidth||P.width,c.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(c.width=P.displayWidth,c.height=P.displayHeight):(c.width=P.width,c.height=P.height),c}this.allocateTextureUnit=ie,this.resetTextureUnits=J,this.getTextureUnits=H,this.setTextureUnits=Z,this.setTexture2D=K,this.setTexture2DArray=re,this.setTexture3D=se,this.setTextureCube=he,this.rebindTextures=k,this.setupRenderTarget=O,this.updateRenderTargetMipmap=Y,this.updateMultisampleRenderTarget=ge,this.setupDepthRenderbuffer=R,this.setupFrameBufferTexture=z,this.useMultisampledRTT=q,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function dg(i,e){function t(n,r=Hn){let s;const a=nt.getTransfer(r);if(n===Kt)return i.UNSIGNED_BYTE;if(n===Js)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Qs)return i.UNSIGNED_SHORT_5_5_5_1;if(n===gl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===vl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===pl)return i.BYTE;if(n===ml)return i.SHORT;if(n===er)return i.UNSIGNED_SHORT;if(n===$s)return i.INT;if(n===Mn)return i.UNSIGNED_INT;if(n===on)return i.FLOAT;if(n===Dt)return i.HALF_FLOAT;if(n===xl)return i.ALPHA;if(n===_l)return i.RGB;if(n===ln)return i.RGBA;if(n===Cn)return i.DEPTH_COMPONENT;if(n===ei)return i.DEPTH_STENCIL;if(n===Br)return i.RED;if(n===js)return i.RED_INTEGER;if(n===ti)return i.RG;if(n===ea)return i.RG_INTEGER;if(n===ta)return i.RGBA_INTEGER;if(n===zr||n===Hr||n===kr||n===Gr)if(a===ct)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===zr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Hr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===kr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Gr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===zr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Hr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===kr)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Gr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===na||n===ia||n===ra||n===sa)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===na)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ia)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ra)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===sa)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===aa||n===oa||n===la||n===ca||n===ua||n===Vr||n===ha)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===aa||n===oa)return a===ct?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===la)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===ca)return s.COMPRESSED_R11_EAC;if(n===ua)return s.COMPRESSED_SIGNED_R11_EAC;if(n===Vr)return s.COMPRESSED_RG11_EAC;if(n===ha)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===fa||n===da||n===pa||n===ma||n===ga||n===va||n===xa||n===_a||n===Ma||n===Sa||n===ya||n===ba||n===Ea||n===wa)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===fa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===da)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===pa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===ma)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ga)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===va)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===xa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===_a)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Ma)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Sa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===ya)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ba)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ea)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===wa)return a===ct?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ta||n===Aa||n===Ra)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===Ta)return a===ct?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Aa)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Ra)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ca||n===Pa||n===Wr||n===La)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Ca)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Pa)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Wr)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===La)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===tr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const pg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,mg=`
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

}`;class gg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new Kl(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new Mt({vertexShader:pg,fragmentShader:mg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new rt(new Ni(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class vg extends ni{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,h=null,f=null,u=null,d=null,g=null;const S=typeof XRWebGLBinding<"u",m=new gg,p={},b=t.getContextAttributes();let w=null,x=null;const T=[],E=[],L=new ue;let v=null,A=null;const U=new jt;U.viewport=new dt;const G=new jt;G.viewport=new dt;const B=[U,G],J=new id;let H=null,Z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(F){let D=T[F];return D===void 0&&(D=new Ga,T[F]=D),D.getTargetRaySpace()},this.getControllerGrip=function(F){let D=T[F];return D===void 0&&(D=new Ga,T[F]=D),D.getGripSpace()},this.getHand=function(F){let D=T[F];return D===void 0&&(D=new Ga,T[F]=D),D.getHandSpace()};function ie(F){const D=E.indexOf(F.inputSource);if(D===-1)return;const I=T[D];I!==void 0&&(I.update(F.inputSource,F.frame,c||a),I.dispatchEvent({type:F.type,data:F.inputSource}))}function $(){r.removeEventListener("select",ie),r.removeEventListener("selectstart",ie),r.removeEventListener("selectend",ie),r.removeEventListener("squeeze",ie),r.removeEventListener("squeezestart",ie),r.removeEventListener("squeezeend",ie),r.removeEventListener("end",$),r.removeEventListener("inputsourceschange",K);for(let F=0;F<T.length;F++){const D=E[F];D!==null&&(E[F]=null,T[F].disconnect(D))}H=null,Z=null,m.reset();for(const F in p)delete p[F];if(e.setRenderTarget(w),d=null,u=null,f=null,r=null,x=null,Xe.stop(),n.isPresenting=!1,e.setPixelRatio(v),e.setSize(L.width,L.height,!1),A!==null){const F=A.camera;F.fov=A.fov,F.zoom=A.zoom,F.updateProjectionMatrix(),A=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(F){s=F,n.isPresenting===!0&&Ze("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(F){o=F,n.isPresenting===!0&&Ze("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(F){c=F},this.getBaseLayer=function(){return u!==null?u:d},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(F){if(r=F,r!==null){if(w=e.getRenderTarget(),r.addEventListener("select",ie),r.addEventListener("selectstart",ie),r.addEventListener("selectend",ie),r.addEventListener("squeeze",ie),r.addEventListener("squeezestart",ie),r.addEventListener("squeezeend",ie),r.addEventListener("end",$),r.addEventListener("inputsourceschange",K),b.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(L),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let I=null,C=null,z=null;b.depth&&(z=b.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,I=b.stencil?ei:Cn,C=b.stencil?tr:Mn);const j={colorFormat:t.RGBA8,depthFormat:z,scaleFactor:s};f=this.getBinding(),u=f.createProjectionLayer(j),r.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),x=new It(u.textureWidth,u.textureHeight,{format:ln,type:Kt,depthTexture:new pr(u.textureWidth,u.textureHeight,C,void 0,void 0,void 0,void 0,void 0,void 0,I),stencilBuffer:b.stencil,colorSpace:e.outputColorSpace,samples:b.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{const I={antialias:b.antialias,alpha:!0,depth:b.depth,stencil:b.stencil,framebufferScaleFactor:s};d=new XRWebGLLayer(r,t,I),r.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),x=new It(d.framebufferWidth,d.framebufferHeight,{format:ln,type:Kt,colorSpace:e.outputColorSpace,stencilBuffer:b.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Xe.setContext(r),Xe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function K(F){for(let D=0;D<F.removed.length;D++){const I=F.removed[D],C=E.indexOf(I);C>=0&&(E[C]=null,T[C].disconnect(I))}for(let D=0;D<F.added.length;D++){const I=F.added[D];let C=E.indexOf(I);if(C===-1){for(let j=0;j<T.length;j++)if(j>=E.length){E.push(I),C=j;break}else if(E[j]===null){E[j]=I,C=j;break}if(C===-1)break}const z=T[C];z&&z.connect(I)}}const re=new N,se=new N;function he(F,D,I){re.setFromMatrixPosition(D.matrixWorld),se.setFromMatrixPosition(I.matrixWorld);const C=re.distanceTo(se),z=D.projectionMatrix.elements,j=I.projectionMatrix.elements,me=z[14]/(z[10]-1),R=z[14]/(z[10]+1),k=(z[9]+1)/z[5],O=(z[9]-1)/z[5],Y=(z[8]-1)/z[0],Q=(j[8]+1)/j[0],le=me*Y,ge=me*Q,pe=C/(-Y+Q),q=pe*-Y;if(D.matrixWorld.decompose(F.position,F.quaternion,F.scale),F.translateX(q),F.translateZ(pe),F.matrixWorld.compose(F.position,F.quaternion,F.scale),F.matrixWorldInverse.copy(F.matrixWorld).invert(),z[10]===-1)F.projectionMatrix.copy(D.projectionMatrix),F.projectionMatrixInverse.copy(D.projectionMatrixInverse);else{const M=me+pe,Re=R+pe,Fe=le-q,P=ge+(C-q),_=k*R/Re*M,X=O*R/Re*M;F.projectionMatrix.makePerspective(Fe,P,_,X,M,Re),F.projectionMatrixInverse.copy(F.projectionMatrix).invert()}}function xe(F,D){D===null?F.matrixWorld.copy(F.matrix):F.matrixWorld.multiplyMatrices(D.matrixWorld,F.matrix),F.matrixWorldInverse.copy(F.matrixWorld).invert()}this.updateCamera=function(F){if(r===null)return;let D=F.near,I=F.far;m.texture!==null&&(m.depthNear>0&&(D=m.depthNear),m.depthFar>0&&(I=m.depthFar)),J.near=G.near=U.near=D,J.far=G.far=U.far=I,(H!==J.near||Z!==J.far)&&(r.updateRenderState({depthNear:J.near,depthFar:J.far}),H=J.near,Z=J.far),J.layers.mask=F.layers.mask|6,U.layers.mask=J.layers.mask&-5,G.layers.mask=J.layers.mask&-3;const C=F.parent,z=J.cameras;xe(J,C);for(let j=0;j<z.length;j++)xe(z[j],C);z.length===2?he(J,U,G):J.projectionMatrix.copy(U.projectionMatrix),A===null&&F.isPerspectiveCamera&&(A={camera:F,fov:F.fov,zoom:F.zoom}),_e(F,J,C)};function _e(F,D,I){I===null?F.matrix.copy(D.matrixWorld):(F.matrix.copy(I.matrixWorld),F.matrix.invert(),F.matrix.multiply(D.matrixWorld)),F.matrix.decompose(F.position,F.quaternion,F.scale),F.updateMatrixWorld(!0),F.projectionMatrix.copy(D.projectionMatrix),F.projectionMatrixInverse.copy(D.projectionMatrixInverse),F.isPerspectiveCamera&&(F.fov=ir*2*Math.atan(1/F.projectionMatrix.elements[5]),F.zoom=1)}this.getCamera=function(){return J},this.getFoveation=function(){if(!(u===null&&d===null))return l},this.setFoveation=function(F){l=F,u!==null&&(u.fixedFoveation=F),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=F)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(J)},this.getCameraTexture=function(F){return p[F]};let Ie=null;function Ne(F,D){if(h=D.getViewerPose(c||a),g=D,h!==null){const I=h.views;d!==null&&(e.setRenderTargetFramebuffer(x,d.framebuffer),e.setRenderTarget(x));let C=!1;I.length!==J.cameras.length&&(J.cameras.length=0,C=!0);for(let R=0;R<I.length;R++){const k=I[R];let O=null;if(d!==null)O=d.getViewport(k);else{const Q=f.getViewSubImage(u,k);O=Q.viewport,R===0&&(e.setRenderTargetTextures(x,Q.colorTexture,Q.depthStencilTexture),e.setRenderTarget(x))}let Y=B[R];Y===void 0&&(Y=new jt,Y.layers.enable(R),Y.viewport=new dt,B[R]=Y),Y.matrix.fromArray(k.transform.matrix),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.projectionMatrix.fromArray(k.projectionMatrix),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert(),Y.viewport.set(O.x,O.y,O.width,O.height),R===0&&(J.matrix.copy(Y.matrix),J.matrix.decompose(J.position,J.quaternion,J.scale)),C===!0&&J.cameras.push(Y)}const z=r.enabledFeatures;if(z&&z.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){f=n.getBinding();const R=f.getDepthInformation(I[0]);R&&R.isValid&&R.texture&&m.init(R,r.renderState)}if(z&&z.includes("camera-access")&&S){e.state.unbindTexture(),f=n.getBinding();for(let R=0;R<I.length;R++){const k=I[R].camera;if(k){let O=p[k];O||(O=new Kl,p[k]=O);const Y=f.getCameraImage(k);O.sourceTexture=Y}}}}for(let I=0;I<T.length;I++){const C=E[I],z=T[I];C!==null&&z!==void 0&&z.update(C,D,c||a)}Ie&&Ie(F,D),D.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:D}),g=null}const Xe=new yc;Xe.setAnimationLoop(Ne),this.setAnimationLoop=function(F){Ie=F},this.dispose=function(){}}}const xg=new ut,Jc=new We;Jc.set(-1,0,0,0,1,0,0,0,1);function _g(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,fc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,b,w,x){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),f(m,p)):p.isMeshPhongMaterial?(s(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),u(m,p),p.isMeshPhysicalMaterial&&d(m,p,x)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),S(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,b,w):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===zt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===zt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const b=e.get(p),w=b.envMap,x=b.envMapRotation;w&&(m.envMap.value=w,m.envMapRotation.value.setFromMatrix4(xg.makeRotationFromEuler(x)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(Jc),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,b,w){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*b,m.scale.value=w*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,b){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===zt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=b.texture,m.transmissionSamplerSize.value.set(b.width,b.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){const b=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(b.matrixWorld),m.nearDistance.value=b.shadow.camera.near,m.farDistance.value=b.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function Mg(i,e,t,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,T){const E=T.program;n.uniformBlockBinding(x,E)}function c(x,T){let E=r[x.id];E===void 0&&(m(x),E=h(x),r[x.id]=E,x.addEventListener("dispose",b));const L=T.program;n.updateUBOMapping(x,L);const v=e.render.frame;s[x.id]!==v&&(u(x),s[x.id]=v)}function h(x){const T=f();x.__bindingPointIndex=T;const E=i.createBuffer(),L=x.__size,v=x.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,L,v),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,E),E}function f(){for(let x=0;x<o;x++)if(a.indexOf(x)===-1)return a.push(x),x;return it("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){const T=r[x.id],E=x.uniforms,L=x.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let v=0,A=E.length;v<A;v++){const U=E[v];if(Array.isArray(U))for(let G=0,B=U.length;G<B;G++)d(U[G],v,G,L);else d(U,v,0,L)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(x,T,E,L){if(S(x,T,E,L)===!0){const v=x.__offset,A=x.value;if(Array.isArray(A)){let U=0;for(let G=0;G<A.length;G++){const B=A[G],J=p(B);g(B,x.__data,U),typeof B!="number"&&typeof B!="boolean"&&!B.isMatrix3&&!ArrayBuffer.isView(B)&&(U+=J.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(A,x.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,v,x.__data)}}function g(x,T,E){typeof x=="number"||typeof x=="boolean"?T[0]=x:x.isMatrix3?(T[0]=x.elements[0],T[1]=x.elements[1],T[2]=x.elements[2],T[3]=0,T[4]=x.elements[3],T[5]=x.elements[4],T[6]=x.elements[5],T[7]=0,T[8]=x.elements[6],T[9]=x.elements[7],T[10]=x.elements[8],T[11]=0):ArrayBuffer.isView(x)?T.set(new x.constructor(x.buffer,x.byteOffset,T.length)):x.toArray(T,E)}function S(x,T,E,L){const v=x.value,A=T+"_"+E;if(L[A]===void 0)return typeof v=="number"||typeof v=="boolean"?L[A]=v:ArrayBuffer.isView(v)?L[A]=v.slice():L[A]=v.clone(),!0;{const U=L[A];if(typeof v=="number"||typeof v=="boolean"){if(U!==v)return L[A]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(U.equals(v)===!1)return U.copy(v),!0}}return!1}function m(x){const T=x.uniforms;let E=0;const L=16;for(let A=0,U=T.length;A<U;A++){const G=Array.isArray(T[A])?T[A]:[T[A]];for(let B=0,J=G.length;B<J;B++){const H=G[B],Z=Array.isArray(H.value)?H.value:[H.value];for(let ie=0,$=Z.length;ie<$;ie++){const K=Z[ie],re=p(K),se=E%L,he=se%re.boundary,xe=se+he;E+=he,xe!==0&&L-xe<re.storage&&(E+=L-xe),H.__data=new Float32Array(re.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=E,E+=re.storage}}}const v=E%L;return v>0&&(E+=L-v),x.__size=E,x.__cache={},this}function p(x){const T={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(T.boundary=4,T.storage=4):x.isVector2?(T.boundary=8,T.storage=8):x.isVector3||x.isColor?(T.boundary=16,T.storage=12):x.isVector4?(T.boundary=16,T.storage=16):x.isMatrix3?(T.boundary=48,T.storage=48):x.isMatrix4?(T.boundary=64,T.storage=64):x.isTexture?Ze("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(T.boundary=16,T.storage=x.byteLength):Ze("WebGLRenderer: Unsupported uniform value type.",x),T}function b(x){const T=x.target;T.removeEventListener("dispose",b);const E=a.indexOf(T.__bindingPointIndex);a.splice(E,1),i.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function w(){for(const x in r)i.deleteBuffer(r[x]);a=[],r={},s={}}return{bind:l,update:c,dispose:w}}const Sg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let wn=null;function yg(){return wn===null&&(wn=new io(Sg,16,16,ti,Dt),wn.name="DFG_LUT",wn.minFilter=Ct,wn.magFilter=Ct,wn.wrapS=_n,wn.wrapT=_n,wn.generateMipmaps=!1,wn.needsUpdate=!0),wn}class bg{constructor(e={}){const{canvas:t=yh(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:d=Kt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;const S=d,m=new Set([ta,ea,js]),p=new Set([Kt,Mn,er,tr,Js,Qs]),b=new Uint32Array(4),w=new Int32Array(4),x=new N;let T=null,E=null;const L=[],v=[];let A=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=xn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const U=this;let G=!1,B=null,J=null,H=null,Z=null;this._outputColorSpace=Yt;let ie=0,$=0,K=null,re=-1,se=null;const he=new dt,xe=new dt;let _e=null;const Ie=new qe(0);let Ne=0,Xe=t.width,F=t.height,D=1,I=null,C=null;const z=new dt(0,0,Xe,F),j=new dt(0,0,Xe,F);let me=!1;const R=new Yl;let k=!1,O=!1;const Y=new ut,Q=new N,le=new dt,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let pe=!1;function q(){return K===null?D:1}let M=n;function Re(y,V){return t.getContext(y,V)}let Fe,P,_,X,ee,oe,Me,Se,ce,fe,ye,ze,Ee,be,Ge,Ye,$e,W,we,de,Te,Le,ve;try{const y={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${zs}`),t.addEventListener("webglcontextlost",pt,!1),t.addEventListener("webglcontextrestored",ot,!1),t.addEventListener("webglcontextcreationerror",gn,!1),M===null){const V="webgl2";if(M=Re(V,y),M===null)throw Re(V)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ve()}catch(y){throw t.removeEventListener("webglcontextlost",pt,!1),t.removeEventListener("webglcontextrestored",ot,!1),t.removeEventListener("webglcontextcreationerror",gn,!1),it("WebGLRenderer: "+y.message),y}function Ve(){Fe=new ym(M),Fe.init(),Te=new dg(M,Fe),P=new fm(M,Fe,e,Te),_=new hg(M,Fe),P.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),J=M.createFramebuffer(),H=M.createFramebuffer(),Z=M.createFramebuffer(),X=new wm(M),ee=new J0,oe=new fg(M,Fe,_,ee,P,Te,X),Me=new Sm(U),Se=new od(M),Le=new um(M,Se),ce=new bm(M,Se,X,Le),fe=new Am(M,ce,Se,Le,X),W=new Tm(M,P,oe),Ge=new dm(ee),ye=new $0(U,Me,Fe,P,Le,Ge),ze=new _g(U,ee),Ee=new j0,be=new sg(Fe),$e=new cm(U,Me,_,fe,g,l),Ye=new ug(U,fe,P),ve=new Mg(M,X,P,_),we=new hm(M,Fe,X),de=new Em(M,Fe,X),X.programs=ye.programs,U.capabilities=P,U.extensions=Fe,U.properties=ee,U.renderLists=Ee,U.shadowMap=Ye,U.state=_,U.info=X}S!==Kt&&(A=new Cm(S,t.width,t.height,o,r,s));const He=new vg(U,M);this.xr=He,this.getContext=function(){return M},this.getContextAttributes=function(){return M.getContextAttributes()},this.forceContextLoss=function(){const y=Fe.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=Fe.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return D},this.setPixelRatio=function(y){y!==void 0&&(D=y,this.setSize(Xe,F,!1))},this.getSize=function(y){return y.set(Xe,F)},this.setSize=function(y,V,ae=!0){if(He.isPresenting){Ze("WebGLRenderer: Can't change size while VR device is presenting.");return}Xe=y,F=V,t.width=Math.floor(y*D),t.height=Math.floor(V*D),ae===!0&&(t.style.width=y+"px",t.style.height=V+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,y,V)},this.getDrawingBufferSize=function(y){return y.set(Xe*D,F*D).floor()},this.setDrawingBufferSize=function(y,V,ae){Xe=y,F=V,D=ae,t.width=Math.floor(y*ae),t.height=Math.floor(V*ae),this.setViewport(0,0,y,V)},this.setEffects=function(y){if(S===Kt){it("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let V=0;V<y.length;V++)if(y[V].isOutputPass===!0){Ze("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(he)},this.getViewport=function(y){return y.copy(z)},this.setViewport=function(y,V,ae,te){y.isVector4?z.set(y.x,y.y,y.z,y.w):z.set(y,V,ae,te),_.viewport(he.copy(z).multiplyScalar(D).round())},this.getScissor=function(y){return y.copy(j)},this.setScissor=function(y,V,ae,te){y.isVector4?j.set(y.x,y.y,y.z,y.w):j.set(y,V,ae,te),_.scissor(xe.copy(j).multiplyScalar(D).round())},this.getScissorTest=function(){return me},this.setScissorTest=function(y){_.setScissorTest(me=y)},this.setOpaqueSort=function(y){I=y},this.setTransparentSort=function(y){C=y},this.getClearColor=function(y){return y.copy($e.getClearColor())},this.setClearColor=function(){$e.setClearColor(...arguments)},this.getClearAlpha=function(){return $e.getClearAlpha()},this.setClearAlpha=function(){$e.setClearAlpha(...arguments)},this.clear=function(y=!0,V=!0,ae=!0){let te=0;if(y){let ne=!1;if(K!==null){const Pe=K.texture.format;ne=m.has(Pe)}if(ne){const Pe=K.texture.type,Ue=p.has(Pe),Ce=$e.getClearColor(),Oe=$e.getClearAlpha(),ke=Ce.r,Qe=Ce.g,tt=Ce.b;Ue?(b[0]=ke,b[1]=Qe,b[2]=tt,b[3]=Oe,M.clearBufferuiv(M.COLOR,0,b)):(w[0]=ke,w[1]=Qe,w[2]=tt,w[3]=Oe,M.clearBufferiv(M.COLOR,0,w))}else te|=M.COLOR_BUFFER_BIT}V&&(te|=M.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),ae&&(te|=M.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),te!==0&&M.clear(te)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),B=y},this.dispose=function(){t.removeEventListener("webglcontextlost",pt,!1),t.removeEventListener("webglcontextrestored",ot,!1),t.removeEventListener("webglcontextcreationerror",gn,!1),$e.dispose(),Ee.dispose(),be.dispose(),ee.dispose(),Me.dispose(),fe.dispose(),Le.dispose(),ve.dispose(),ye.dispose(),He.dispose(),He.removeEventListener("sessionstart",Pu),He.removeEventListener("sessionend",Lu),gi.stop()};function pt(y){y.preventDefault(),bl("WebGLRenderer: Context Lost."),G=!0}function ot(){bl("WebGLRenderer: Context Restored."),G=!1;const y=X.autoReset,V=Ye.enabled,ae=Ye.autoUpdate,te=Ye.needsUpdate,ne=Ye.type;Ve(),X.autoReset=y,Ye.enabled=V,Ye.autoUpdate=ae,Ye.needsUpdate=te,Ye.type=ne}function gn(y){it("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function An(y){const V=y.target;V.removeEventListener("dispose",An),yx(V)}function yx(y){bx(y),ee.remove(y)}function bx(y){const V=ee.get(y).programs;V!==void 0&&(V.forEach(function(ae){ye.releaseProgram(ae)}),y.isShaderMaterial&&ye.releaseShaderCache(y))}this.renderBufferDirect=function(y,V,ae,te,ne,Pe){V===null&&(V=ge);const Ue=ne.isMesh&&ne.matrixWorld.determinantAffine()<0,Ce=Tx(y,V,ae,te,ne);_.setMaterial(te,Ue);let Oe=ae.index,ke=1;if(te.wireframe===!0){if(Oe=ce.getWireframeAttribute(ae),Oe===void 0)return;ke=2}const Qe=ae.drawRange,tt=ae.attributes.position;let Be=Qe.start*ke,lt=(Qe.start+Qe.count)*ke;Pe!==null&&(Be=Math.max(Be,Pe.start*ke),lt=Math.min(lt,(Pe.start+Pe.count)*ke)),Oe!==null?(Be=Math.max(Be,0),lt=Math.min(lt,Oe.count)):tt!=null&&(Be=Math.max(Be,0),lt=Math.min(lt,tt.count));const wt=lt-Be;if(wt<0||wt===1/0)return;Le.setup(ne,te,Ce,ae,Oe);let gt,ft=we;if(Oe!==null&&(gt=Se.get(Oe),ft=de,ft.setIndex(gt)),ne.isMesh)te.wireframe===!0?(_.setLineWidth(te.wireframeLinewidth*q()),ft.setMode(M.LINES)):ft.setMode(M.TRIANGLES);else if(ne.isLine){let Bt=te.linewidth;Bt===void 0&&(Bt=1),_.setLineWidth(Bt*q()),ne.isLineSegments?ft.setMode(M.LINES):ne.isLineLoop?ft.setMode(M.LINE_LOOP):ft.setMode(M.LINE_STRIP)}else ne.isPoints?ft.setMode(M.POINTS):ne.isSprite&&ft.setMode(M.TRIANGLES);if(ne.isBatchedMesh)if(Fe.get("WEBGL_multi_draw"))ft.renderMultiDraw(ne._multiDrawStarts,ne._multiDrawCounts,ne._multiDrawCount);else{const Bt=ne._multiDrawStarts,De=ne._multiDrawCounts,Xt=ne._multiDrawCount,st=Oe?Se.get(Oe).bytesPerElement:1,an=ee.get(te).currentProgram.getUniforms();for(let Rn=0;Rn<Xt;Rn++)an.setValue(M,"_gl_DrawID",Rn),ft.render(Bt[Rn]/st,De[Rn])}else if(ne.isInstancedMesh)ft.renderInstances(Be,wt,ne.count);else if(ae.isInstancedBufferGeometry){const Bt=ae._maxInstanceCount!==void 0?ae._maxInstanceCount:1/0,De=Math.min(ae.instanceCount,Bt);ft.renderInstances(Be,wt,De)}else ft.render(Be,wt)};function Cu(y,V,ae,te){B!==null&&y.isNodeMaterial&&B.setObject(te,y),k===!0&&Ge.setState(y,ae,!1),y.transparent===!0&&y.side===tn&&y.forceSinglePass===!1?(y.side=zt,y.needsUpdate=!0,Bs(y,V,te),y.side=Qn,y.needsUpdate=!0,Bs(y,V,te),y.side=tn):Bs(y,V,te)}this.compile=function(y,V,ae=null){ae===null&&(ae=y),B!==null&&B.renderStart(y,V,ae),E=be.get(ae),E.init(V),v.push(E),ae.traverseVisible(function(ne){ne.isLight&&ne.layers.test(V.layers)&&(E.pushLight(ne),ne.castShadow&&E.pushShadow(ne))}),y!==ae&&y.traverseVisible(function(ne){ne.isLight&&ne.layers.test(V.layers)&&(E.pushLight(ne),ne.castShadow&&E.pushShadow(ne))}),E.setupLights(),B!==null&&B.updateLights(E.state.lightsArray),O=this.localClippingEnabled,k=Ge.init(this.clippingPlanes,O),k===!0&&Ge.setGlobalState(this.clippingPlanes,V),B!==null&&Ye.render(E.state.shadowsArray,ae,V);const te=new Set;return y.traverse(function(ne){if(!(ne.isMesh||ne.isPoints||ne.isLine||ne.isSprite))return;const Pe=ne.material;if(Pe)if(Array.isArray(Pe))for(let Ue=0;Ue<Pe.length;Ue++){const Ce=Pe[Ue];Cu(Ce,ae,V,ne),te.add(Ce)}else Cu(Pe,ae,V,ne),te.add(Pe)}),E=v.pop(),B!==null&&B.renderEnd(),te},this.compileAsync=function(y,V,ae=null){const te=this.compile(y,V,ae);return new Promise(ne=>{function Pe(){if(te.forEach(function(Ue){const Oe=ee.get(Ue).currentProgram;(Oe===void 0||Oe.isReady())&&te.delete(Ue)}),te.size===0){ne(y);return}setTimeout(Pe,10)}Fe.get("KHR_parallel_shader_compile")!==null?Pe():setTimeout(Pe,10)})};let Jo=null;function Ex(y){Jo&&Jo(y)}function Pu(){gi.stop()}function Lu(){gi.start()}const gi=new yc;gi.setAnimationLoop(Ex),typeof self<"u"&&gi.setContext(self),this.setAnimationLoop=function(y){Jo=y,He.setAnimationLoop(y),y===null?gi.stop():gi.start()},He.addEventListener("sessionstart",Pu),He.addEventListener("sessionend",Lu),this.render=function(y,V){if(V!==void 0&&V.isCamera!==!0){it("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(G===!0)return;B!==null&&B.renderStart(y,V);const ae=He.enabled===!0&&He.isPresenting===!0,te=A!==null&&(K===null||ae)&&A.begin(U,K);if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),He.enabled===!0&&He.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(He.cameraAutoUpdate===!0&&He.updateCamera(V),V=He.getCamera()),y.isScene===!0&&y.onBeforeRender(U,y,V,K),E=be.get(y,v.length),E.init(V),E.state.textureUnits=oe.getTextureUnits(),v.push(E),Y.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),R.setFromProjectionMatrix(Y,Sn,V.reversedDepth),O=this.localClippingEnabled,k=Ge.init(this.clippingPlanes,O),T=Ee.get(y,L.length),T.init(),L.push(T),He.enabled===!0&&He.isPresenting===!0){const Ue=U.xr.getDepthSensingMesh();Ue!==null&&Qo(Ue,V,-1/0,U.sortObjects)}Qo(y,V,0,U.sortObjects),T.finish(),B!==null&&B.updateLights(E.state.lightsArray),U.sortObjects===!0&&T.sort(I,C),pe=He.enabled===!1||He.isPresenting===!1||He.hasDepthSensing()===!1,pe&&$e.addToRenderList(T,y),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),k===!0&&Ge.beginShadows();const ne=E.state.shadowsArray;if(Ye.render(ne,y,V),k===!0&&Ge.endShadows(),(te&&A.hasRenderPass())===!1){const Ue=T.opaque,Ce=T.transmissive;if(E.setupLights(),V.isArrayCamera){const Oe=V.cameras;if(Ce.length>0)for(let ke=0,Qe=Oe.length;ke<Qe;ke++){const tt=Oe[ke];Du(Ue,Ce,y,tt)}pe&&$e.render(y);for(let ke=0,Qe=Oe.length;ke<Qe;ke++){const tt=Oe[ke];Iu(T,y,tt,tt.viewport)}}else Ce.length>0&&Du(Ue,Ce,y,V),pe&&$e.render(y),Iu(T,y,V)}K!==null&&$===0&&(oe.updateMultisampleRenderTarget(K),oe.updateRenderTargetMipmap(K)),te&&A.end(U),y.isScene===!0&&y.onAfterRender(U,y,V),Le.resetDefaultState(),re=-1,se=null,v.pop(),v.length>0?(E=v[v.length-1],oe.setTextureUnits(E.state.textureUnits),k===!0&&Ge.setGlobalState(U.clippingPlanes,E.state.camera)):E=null,L.pop(),L.length>0?T=L[L.length-1]:T=null,B!==null&&B.renderEnd()};function Qo(y,V,ae,te){if(y.visible===!1)return;if(y.layers.test(V.layers)){if(y.isGroup)ae=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(V);else if(y.isLightProbeGrid)E.pushLightProbeGrid(y);else if(y.isLight)E.pushLight(y),y.castShadow&&E.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||y.intersectsFrustum(R)){te&&le.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Y);const Ue=fe.update(y),Ce=y.material;Ce.visible&&T.push(y,Ue,Ce,ae,le.z,null,V)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||y.intersectsFrustum(R))){const Ue=fe.update(y),Ce=y.material;if(te&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),le.copy(y.boundingSphere.center)):(Ue.boundingSphere===null&&Ue.computeBoundingSphere(),le.copy(Ue.boundingSphere.center)),le.applyMatrix4(y.matrixWorld).applyMatrix4(Y)),Array.isArray(Ce)){const Oe=Ue.groups;for(let ke=0,Qe=Oe.length;ke<Qe;ke++){const tt=Oe[ke],Be=Ce[tt.materialIndex];Be&&Be.visible&&T.push(y,Ue,Be,ae,le.z,tt,V)}}else Ce.visible&&T.push(y,Ue,Ce,ae,le.z,null,V)}}const Pe=y.children;for(let Ue=0,Ce=Pe.length;Ue<Ce;Ue++)Qo(Pe[Ue],V,ae,te)}function Iu(y,V,ae,te){const{opaque:ne,transmissive:Pe,transparent:Ue}=y;E.setupLightsView(ae),k===!0&&Ge.setGlobalState(U.clippingPlanes,ae),te&&_.viewport(he.copy(te)),ne.length>0&&Os(ne,V,ae),Pe.length>0&&Os(Pe,V,ae),Ue.length>0&&Os(Ue,V,ae),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function Du(y,V,ae,te){if((ae.isScene===!0?ae.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[te.id]===void 0){const Be=Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[te.id]=new It(1,1,{generateMipmaps:!0,type:Be?Dt:Kt,minFilter:zn,samples:Math.max(4,P.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:nt.workingColorSpace})}const Pe=E.state.transmissionRenderTarget[te.id],Ue=te.viewport||he;Pe.setSize(Ue.z*U.transmissionResolutionScale,Ue.w*U.transmissionResolutionScale);const Ce=U.getRenderTarget(),Oe=U.getActiveCubeFace(),ke=U.getActiveMipmapLevel();U.setRenderTarget(Pe),U.getClearColor(Ie),Ne=U.getClearAlpha(),Ne<1&&U.setClearColor(16777215,.5),U.clear(),pe&&$e.render(ae);const Qe=U.toneMapping;U.toneMapping=xn;const tt=te.viewport;if(te.viewport!==void 0&&(te.viewport=void 0),E.setupLightsView(te),k===!0&&Ge.setGlobalState(U.clippingPlanes,te),Os(y,ae,te),oe.updateMultisampleRenderTarget(Pe),oe.updateRenderTargetMipmap(Pe),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let Be=!1;for(let lt=0,wt=V.length;lt<wt;lt++){const gt=V[lt],{object:ft,geometry:Bt,material:De,group:Xt}=gt;if(De.side===tn&&ft.layers.test(te.layers)){const st=De.side;De.side=zt,De.needsUpdate=!0,Uu(ft,ae,te,Bt,De,Xt),De.side=st,De.needsUpdate=!0,Be=!0}}Be===!0&&(oe.updateMultisampleRenderTarget(Pe),oe.updateRenderTargetMipmap(Pe))}U.setRenderTarget(Ce,Oe,ke),U.setClearColor(Ie,Ne),tt!==void 0&&(te.viewport=tt),U.toneMapping=Qe}function Os(y,V,ae){const te=V.isScene===!0?V.overrideMaterial:null;for(let ne=0,Pe=y.length;ne<Pe;ne++){const Ue=y[ne],{object:Ce,geometry:Oe,group:ke}=Ue;let Qe=Ue.material;Qe.allowOverride===!0&&te!==null&&(Qe=te),Ce.layers.test(ae.layers)&&Uu(Ce,V,ae,Oe,Qe,ke)}}function Uu(y,V,ae,te,ne,Pe){B!==null&&ne.isNodeMaterial&&B.setObject(y,ne),y.onBeforeRender(U,V,ae,te,ne,Pe),y.modelViewMatrix.multiplyMatrices(ae.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),ne.onBeforeRender(U,V,ae,te,y,Pe),ne.transparent===!0&&ne.side===tn&&ne.forceSinglePass===!1?(ne.side=zt,ne.needsUpdate=!0,U.renderBufferDirect(ae,V,te,ne,y,Pe),ne.side=Qn,ne.needsUpdate=!0,U.renderBufferDirect(ae,V,te,ne,y,Pe),ne.side=tn):U.renderBufferDirect(ae,V,te,ne,y,Pe),y.onAfterRender(U,V,ae,te,ne,Pe)}function Bs(y,V,ae){V.isScene!==!0&&(V=ge);const te=ee.get(y),ne=E.state.lights,Pe=E.state.shadowsArray,Ue=ne.state.version,Ce=ye.getParameters(y,ne.state,Pe,V,ae,E.state.lightProbeGridArray),Oe=ye.getProgramCacheKey(Ce);let ke=te.programs;te.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?V.environment:null,te.fog=V.fog;const Qe=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;te.envMap=Me.get(y.envMap||te.environment,Qe),te.envMapRotation=te.environment!==null&&y.envMap===null?V.environmentRotation:y.envMapRotation,ke===void 0&&(y.addEventListener("dispose",An),ke=new Map,te.programs=ke);let tt=ke.get(Oe);if(tt!==void 0){if(te.currentProgram===tt&&te.lightsStateVersion===Ue)return Fu(y,Ce),tt}else Ce.uniforms=ye.getUniforms(y),B!==null&&y.isNodeMaterial&&B.build(y,ae,Ce),y.onBeforeCompile(Ce,U),tt=ye.acquireProgram(Ce,Oe),ke.set(Oe,tt),te.uniforms=Ce.uniforms;const Be=te.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Be.clippingPlanes=Ge.uniform),Fu(y,Ce),te.needsLights=Rx(y),te.lightsStateVersion=Ue,te.needsLights&&(Be.ambientLightColor.value=ne.state.ambient,Be.lightProbe.value=ne.state.probe,Be.sunLights.value=ne.state.sun,Be.sunLightShadows.value=ne.state.sunShadow,Be.directionalLights.value=ne.state.directional,Be.directionalLightShadows.value=ne.state.directionalShadow,Be.spotLights.value=ne.state.spot,Be.spotLightShadows.value=ne.state.spotShadow,Be.rectAreaLights.value=ne.state.rectArea,Be.ltc_1.value=ne.state.rectAreaLTC1,Be.ltc_2.value=ne.state.rectAreaLTC2,Be.pointLights.value=ne.state.point,Be.pointLightShadows.value=ne.state.pointShadow,Be.hemisphereLights.value=ne.state.hemi,Be.sunShadowMatrix.value=ne.state.sunShadowMatrix,Be.sunShadowCascade.value=ne.state.sunShadowCascade,Be.directionalShadowMatrix.value=ne.state.directionalShadowMatrix,Be.spotLightMatrix.value=ne.state.spotLightMatrix,Be.spotLightMap.value=ne.state.spotLightMap,Be.pointShadowMatrix.value=ne.state.pointShadowMatrix),te.lightProbeGrid=E.state.lightProbeGridArray.length>0,te.currentProgram=tt,te.uniformsList=null,tt}function Nu(y){if(y.uniformsList===null){const V=y.currentProgram.getUniforms();y.uniformsList=ws.seqWithValue(V.seq,y.uniforms)}return y.uniformsList}function Fu(y,V){const ae=ee.get(y);ae.outputColorSpace=V.outputColorSpace,ae.batching=V.batching,ae.batchingColor=V.batchingColor,ae.instancing=V.instancing,ae.instancingColor=V.instancingColor,ae.instancingMorph=V.instancingMorph,ae.skinning=V.skinning,ae.morphTargets=V.morphTargets,ae.morphNormals=V.morphNormals,ae.morphColors=V.morphColors,ae.morphTargetsCount=V.morphTargetsCount,ae.numClippingPlanes=V.numClippingPlanes,ae.numIntersection=V.numClipIntersection,ae.vertexAlphas=V.vertexAlphas,ae.vertexTangents=V.vertexTangents,ae.toneMapping=V.toneMapping}function wx(y,V){if(y.length===0)return null;if(y.length===1)return y[0].texture!==null?y[0]:null;x.setFromMatrixPosition(V.matrixWorld);for(let ae=0,te=y.length;ae<te;ae++){const ne=y[ae];if(ne.texture!==null&&ne.boundingBox.containsPoint(x))return ne}return null}function Tx(y,V,ae,te,ne){V.isScene!==!0&&(V=ge),oe.resetTextureUnits();const Pe=V.fog,Ue=te.isMeshStandardMaterial||te.isMeshLambertMaterial||te.isMeshPhongMaterial?V.environment:null,Ce=K===null?U.outputColorSpace:K.isXRRenderTarget===!0?K.texture.colorSpace:nt.workingColorSpace,Oe=te.isMeshStandardMaterial||te.isMeshLambertMaterial&&!te.envMap||te.isMeshPhongMaterial&&!te.envMap,ke=Me.get(te.envMap||Ue,Oe),Qe=te.vertexColors===!0&&!!ae.attributes.color&&ae.attributes.color.itemSize===4,tt=!!ae.attributes.tangent&&(!!te.normalMap||te.anisotropy>0),Be=!!ae.morphAttributes.position,lt=!!ae.morphAttributes.normal,wt=!!ae.morphAttributes.color;let gt=xn;te.toneMapped&&(K===null||K.isXRRenderTarget===!0)&&(gt=U.toneMapping);const ft=ae.morphAttributes.position||ae.morphAttributes.normal||ae.morphAttributes.color,Bt=ft!==void 0?ft.length:0,De=ee.get(te),Xt=E.state.lights;if(k===!0&&(O===!0||y!==se)){const mt=y===se&&te.id===re;Ge.setState(te,y,mt)}let st=!1;te.version===De.__version?(De.needsLights&&De.lightsStateVersion!==Xt.state.version||De.outputColorSpace!==Ce||ne.isBatchedMesh&&De.batching===!1||!ne.isBatchedMesh&&De.batching===!0||ne.isBatchedMesh&&De.batchingColor===!0&&ne._colorsTexture===null||ne.isBatchedMesh&&De.batchingColor===!1&&ne._colorsTexture!==null||ne.isInstancedMesh&&De.instancing===!1||!ne.isInstancedMesh&&De.instancing===!0||ne.isSkinnedMesh&&De.skinning===!1||!ne.isSkinnedMesh&&De.skinning===!0||ne.isInstancedMesh&&De.instancingColor===!0&&ne.instanceColor===null||ne.isInstancedMesh&&De.instancingColor===!1&&ne.instanceColor!==null||ne.isInstancedMesh&&De.instancingMorph===!0&&ne.morphTexture===null||ne.isInstancedMesh&&De.instancingMorph===!1&&ne.morphTexture!==null||De.envMap!==ke||te.fog===!0&&De.fog!==Pe||De.numClippingPlanes!==void 0&&(De.numClippingPlanes!==Ge.numPlanes||De.numIntersection!==Ge.numIntersection)||De.vertexAlphas!==Qe||De.vertexTangents!==tt||De.morphTargets!==Be||De.morphNormals!==lt||De.morphColors!==wt||De.toneMapping!==gt||De.morphTargetsCount!==Bt||!!De.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(st=!0):(st=!0,De.__version=te.version);let an=De.currentProgram;st===!0&&(an=Bs(te,V,ne),B&&te.isNodeMaterial&&B.onUpdateProgram(te,an,De));let Rn=!1,Kn=!1,Zi=!1;const ht=an.getUniforms(),bt=De.uniforms;if(_.useProgram(an.program)&&(Rn=!0,Kn=!0,Zi=!0),te.id!==re&&(re=te.id,Kn=!0),De.needsLights){const mt=wx(E.state.lightProbeGridArray,ne);De.lightProbeGrid!==mt&&(De.lightProbeGrid=mt,Kn=!0)}if(Rn||se!==y){_.buffers.depth.getReversed()&&y.reversedDepth!==!0&&(y._reversedDepth=!0,y.updateProjectionMatrix()),ht.setValue(M,"projectionMatrix",y.projectionMatrix),ht.setValue(M,"viewMatrix",y.matrixWorldInverse);const Jn=ht.map.cameraPosition;Jn!==void 0&&Jn.setValue(M,Q.setFromMatrixPosition(y.matrixWorld)),P.logarithmicDepthBuffer&&ht.setValue(M,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(te.isMeshPhongMaterial||te.isMeshToonMaterial||te.isMeshLambertMaterial||te.isMeshBasicMaterial||te.isMeshStandardMaterial||te.isShaderMaterial)&&ht.setValue(M,"isOrthographic",y.isOrthographicCamera===!0),se!==y&&(se=y,Kn=!0,Zi=!0)}if(De.needsLights&&(Xt.state.sunShadowMap.length>0&&ht.setValue(M,"sunShadowMap",Xt.state.sunShadowMap,oe),Xt.state.directionalShadowMap.length>0&&ht.setValue(M,"directionalShadowMap",Xt.state.directionalShadowMap,oe),Xt.state.spotShadowMap.length>0&&ht.setValue(M,"spotShadowMap",Xt.state.spotShadowMap,oe),Xt.state.pointShadowMap.length>0&&ht.setValue(M,"pointShadowMap",Xt.state.pointShadowMap,oe)),ne.isSkinnedMesh){ht.setOptional(M,ne,"bindMatrix"),ht.setOptional(M,ne,"bindMatrixInverse");const mt=ne.skeleton;mt&&(mt.boneTexture===null&&mt.computeBoneTexture(),ht.setValue(M,"boneTexture",mt.boneTexture,oe))}ne.isBatchedMesh&&(ht.setOptional(M,ne,"batchingTexture"),ht.setValue(M,"batchingTexture",ne._matricesTexture,oe),ht.setOptional(M,ne,"batchingIdTexture"),ht.setValue(M,"batchingIdTexture",ne._indirectTexture,oe),ht.setOptional(M,ne,"batchingColorTexture"),ne._colorsTexture!==null&&ht.setValue(M,"batchingColorTexture",ne._colorsTexture,oe));const $n=ae.morphAttributes;if(($n.position!==void 0||$n.normal!==void 0||$n.color!==void 0)&&W.update(ne,ae,an),(Kn||De.receiveShadow!==ne.receiveShadow)&&(De.receiveShadow=ne.receiveShadow,ht.setValue(M,"receiveShadow",ne.receiveShadow)),(te.isMeshStandardMaterial||te.isMeshLambertMaterial||te.isMeshPhongMaterial)&&te.envMap===null&&V.environment!==null&&(bt.envMapIntensity.value=V.environmentIntensity),bt.dfgLUT!==void 0&&(bt.dfgLUT.value=yg()),Kn){if(ht.setValue(M,"toneMappingExposure",U.toneMappingExposure),De.needsLights&&Ax(bt,Zi),Pe&&te.fog===!0&&ze.refreshFogUniforms(bt,Pe),ze.refreshMaterialUniforms(bt,te,D,F,E.state.transmissionRenderTarget[y.id]),De.needsLights&&De.lightProbeGrid){const mt=De.lightProbeGrid;bt.probesSH.value=mt.texture,bt.probesMin.value.copy(mt.boundingBox.min),bt.probesMax.value.copy(mt.boundingBox.max),bt.probesResolution.value.copy(mt.resolution)}ws.upload(M,Nu(De),bt,oe)}if(te.isShaderMaterial&&te.uniformsNeedUpdate===!0&&(ws.upload(M,Nu(De),bt,oe),te.uniformsNeedUpdate=!1),te.isSpriteMaterial&&ht.setValue(M,"center",ne.center),ht.setValue(M,"modelViewMatrix",ne.modelViewMatrix),ht.setValue(M,"normalMatrix",ne.normalMatrix),ht.setValue(M,"modelMatrix",ne.matrixWorld),te.uniformsGroups!==void 0){const mt=te.uniformsGroups;for(let Jn=0,Ki=mt.length;Jn<Ki;Jn++){const Bu=mt[Jn];ve.update(Bu,an),ve.bind(Bu,an)}}return an}function Ax(y,V){y.ambientLightColor.needsUpdate=V,y.lightProbe.needsUpdate=V,y.sunLights.needsUpdate=V,y.sunLightShadows.needsUpdate=V,y.directionalLights.needsUpdate=V,y.directionalLightShadows.needsUpdate=V,y.pointLights.needsUpdate=V,y.pointLightShadows.needsUpdate=V,y.spotLights.needsUpdate=V,y.spotLightShadows.needsUpdate=V,y.rectAreaLights.needsUpdate=V,y.hemisphereLights.needsUpdate=V}function Rx(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return ie},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return K},this.setRenderTargetTextures=function(y,V,ae){const te=ee.get(y);te.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,te.__autoAllocateDepthBuffer===!1&&(te.__useRenderToTexture=!1),ee.get(y.texture).__webglTexture=V,ee.get(y.depthTexture).__webglTexture=te.__autoAllocateDepthBuffer?void 0:ae,te.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,V){const ae=ee.get(y);ae.__webglFramebuffer=V,ae.__useDefaultFramebuffer=V===void 0},this.setRenderTarget=function(y,V=0,ae=0){K=y,ie=V,$=ae;let te=null,ne=!1,Pe=!1;if(y){const Ce=ee.get(y);if(Ce.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(M.FRAMEBUFFER,Ce.__webglFramebuffer),he.copy(y.viewport),xe.copy(y.scissor),_e=y.scissorTest,_.viewport(he),_.scissor(xe),_.setScissorTest(_e),re=-1;return}else if(Ce.__webglFramebuffer===void 0)oe.setupRenderTarget(y);else if(Ce.__hasExternalTextures)oe.rebindTextures(y,ee.get(y.texture).__webglTexture,ee.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){const Qe=y.depthTexture;if(Ce.__boundDepthTexture!==Qe){if(Qe!==null&&ee.has(Qe)&&(y.width!==Qe.image.width||y.height!==Qe.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");oe.setupDepthRenderbuffer(y)}}const Oe=y.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(Pe=!0);const ke=ee.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(ke[V])?te=ke[V][ae]:te=ke[V],ne=!0):y.samples>0&&oe.useMultisampledRTT(y)===!1?te=ee.get(y).__webglMultisampledFramebuffer:Array.isArray(ke)?te=ke[ae]:te=ke,he.copy(y.viewport),xe.copy(y.scissor),_e=y.scissorTest}else he.copy(z).multiplyScalar(D).floor(),xe.copy(j).multiplyScalar(D).floor(),_e=me;if(ae!==0&&(te=J),_.bindFramebuffer(M.FRAMEBUFFER,te)&&_.drawBuffers(y,te),_.viewport(he),_.scissor(xe),_.setScissorTest(_e),ne){const Ce=ee.get(y.texture);M.framebufferTexture2D(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_CUBE_MAP_POSITIVE_X+V,Ce.__webglTexture,ae)}else if(Pe){const Ce=V;for(let Oe=0;Oe<y.textures.length;Oe++){const ke=ee.get(y.textures[Oe]);M.framebufferTextureLayer(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0+Oe,ke.__webglTexture,ae,Ce)}}else if(y!==null&&ae!==0){const Ce=ee.get(y.texture);M.framebufferTexture2D(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,Ce.__webglTexture,ae)}re=-1};function Ou(y){const V=ee.get(y);return(V.__readFormat!==y.format||V.__readType!==y.type)&&(V.__readFormat=y.format,V.__readType=y.type,V.__formatReadable=P.textureFormatReadable(y.format),V.__typeReadable=P.textureTypeReadable(y.type)),V}this.readRenderTargetPixels=function(y,V,ae,te,ne,Pe,Ue,Ce=0){if(!(y&&y.isWebGLRenderTarget)){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Oe=ee.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Ue!==void 0&&(Oe=Oe[Ue]),Oe){_.bindFramebuffer(M.FRAMEBUFFER,Oe);try{const ke=y.textures[Ce],Qe=ke.format,tt=ke.type;y.textures.length>1&&M.readBuffer(M.COLOR_ATTACHMENT0+Ce);const Be=Ou(ke);if(Be.__formatReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Be.__typeReadable===!1){it("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=y.width-te&&ae>=0&&ae<=y.height-ne&&M.readPixels(V,ae,te,ne,Te.convert(Qe),Te.convert(tt),Pe)}finally{const ke=K!==null?ee.get(K).__webglFramebuffer:null;_.bindFramebuffer(M.FRAMEBUFFER,ke)}}},this.readRenderTargetPixelsAsync=async function(y,V,ae,te,ne,Pe,Ue,Ce=0){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Oe=ee.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Ue!==void 0&&(Oe=Oe[Ue]),Oe)if(V>=0&&V<=y.width-te&&ae>=0&&ae<=y.height-ne){_.bindFramebuffer(M.FRAMEBUFFER,Oe);const ke=y.textures[Ce],Qe=ke.format,tt=ke.type;y.textures.length>1&&M.readBuffer(M.COLOR_ATTACHMENT0+Ce);const Be=Ou(ke);if(Be.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Be.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const lt=M.createBuffer();M.bindBuffer(M.PIXEL_PACK_BUFFER,lt),M.bufferData(M.PIXEL_PACK_BUFFER,Pe.byteLength,M.STREAM_READ),M.readPixels(V,ae,te,ne,Te.convert(Qe),Te.convert(tt),0),M.bindBuffer(M.PIXEL_PACK_BUFFER,null);const wt=K!==null?ee.get(K).__webglFramebuffer:null;_.bindFramebuffer(M.FRAMEBUFFER,wt);const gt=M.fenceSync(M.SYNC_GPU_COMMANDS_COMPLETE,0);return M.flush(),await bh(M,gt,4),M.bindBuffer(M.PIXEL_PACK_BUFFER,lt),M.getBufferSubData(M.PIXEL_PACK_BUFFER,0,Pe),M.bindBuffer(M.PIXEL_PACK_BUFFER,null),M.deleteBuffer(lt),M.deleteSync(gt),Pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,V=null,ae=0){const te=Math.pow(2,-ae),ne=Math.floor(y.image.width*te),Pe=Math.floor(y.image.height*te),Ue=V!==null?V.x:0,Ce=V!==null?V.y:0;oe.setTexture2D(y,0),M.copyTexSubImage2D(M.TEXTURE_2D,ae,0,0,Ue,Ce,ne,Pe),_.unbindTexture()},this.copyTextureToTexture=function(y,V,ae=null,te=null,ne=0,Pe=0){let Ue,Ce,Oe,ke,Qe,tt,Be,lt,wt;const gt=y.isCompressedTexture?y.mipmaps[Pe]:y.image;if(ae!==null)Ue=ae.max.x-ae.min.x,Ce=ae.max.y-ae.min.y,Oe=ae.isBox3?ae.max.z-ae.min.z:1,ke=ae.min.x,Qe=ae.min.y,tt=ae.isBox3?ae.min.z:0;else{const bt=Math.pow(2,-ne);Ue=Math.floor(gt.width*bt),Ce=Math.floor(gt.height*bt),y.isDataArrayTexture?Oe=gt.depth:y.isData3DTexture?Oe=Math.floor(gt.depth*bt):Oe=1,ke=0,Qe=0,tt=0}te!==null?(Be=te.x,lt=te.y,wt=te.z):(Be=0,lt=0,wt=0);const ft=Te.convert(V.format),Bt=Te.convert(V.type);let De;V.isData3DTexture?(oe.setTexture3D(V,0),De=M.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(oe.setTexture2DArray(V,0),De=M.TEXTURE_2D_ARRAY):(oe.setTexture2D(V,0),De=M.TEXTURE_2D),_.activeTexture(M.TEXTURE0),_.pixelStorei(M.UNPACK_FLIP_Y_WEBGL,V.flipY),_.pixelStorei(M.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),_.pixelStorei(M.UNPACK_ALIGNMENT,V.unpackAlignment);const Xt=_.getParameter(M.UNPACK_ROW_LENGTH),st=_.getParameter(M.UNPACK_IMAGE_HEIGHT),an=_.getParameter(M.UNPACK_SKIP_PIXELS),Rn=_.getParameter(M.UNPACK_SKIP_ROWS),Kn=_.getParameter(M.UNPACK_SKIP_IMAGES);_.pixelStorei(M.UNPACK_ROW_LENGTH,gt.width),_.pixelStorei(M.UNPACK_IMAGE_HEIGHT,gt.height),_.pixelStorei(M.UNPACK_SKIP_PIXELS,ke),_.pixelStorei(M.UNPACK_SKIP_ROWS,Qe),_.pixelStorei(M.UNPACK_SKIP_IMAGES,tt);const Zi=y.isDataArrayTexture||y.isData3DTexture,ht=V.isDataArrayTexture||V.isData3DTexture;if(y.isDepthTexture){const bt=ee.get(y),$n=ee.get(V),mt=ee.get(bt.__renderTarget),Jn=ee.get($n.__renderTarget);_.bindFramebuffer(M.READ_FRAMEBUFFER,mt.__webglFramebuffer),_.bindFramebuffer(M.DRAW_FRAMEBUFFER,Jn.__webglFramebuffer);for(let Ki=0;Ki<Oe;Ki++)Zi&&(M.framebufferTextureLayer(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,ee.get(y).__webglTexture,ne,tt+Ki),M.framebufferTextureLayer(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,ee.get(V).__webglTexture,Pe,wt+Ki)),M.blitFramebuffer(ke,Qe,Ue,Ce,Be,lt,Ue,Ce,M.DEPTH_BUFFER_BIT,M.NEAREST);_.bindFramebuffer(M.READ_FRAMEBUFFER,null),_.bindFramebuffer(M.DRAW_FRAMEBUFFER,null)}else if(ne!==0||y.isRenderTargetTexture||ee.has(y)){const bt=ee.get(y),$n=ee.get(V);_.bindFramebuffer(M.READ_FRAMEBUFFER,H),_.bindFramebuffer(M.DRAW_FRAMEBUFFER,Z);for(let mt=0;mt<Oe;mt++)Zi?M.framebufferTextureLayer(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,bt.__webglTexture,ne,tt+mt):M.framebufferTexture2D(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,bt.__webglTexture,ne),ht?M.framebufferTextureLayer(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,$n.__webglTexture,Pe,wt+mt):M.framebufferTexture2D(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,$n.__webglTexture,Pe),ne!==0?M.blitFramebuffer(ke,Qe,Ue,Ce,Be,lt,Ue,Ce,M.COLOR_BUFFER_BIT,M.NEAREST):ht?M.copyTexSubImage3D(De,Pe,Be,lt,wt+mt,ke,Qe,Ue,Ce):M.copyTexSubImage2D(De,Pe,Be,lt,ke,Qe,Ue,Ce);_.bindFramebuffer(M.READ_FRAMEBUFFER,null),_.bindFramebuffer(M.DRAW_FRAMEBUFFER,null)}else ht?y.isDataTexture||y.isData3DTexture?M.texSubImage3D(De,Pe,Be,lt,wt,Ue,Ce,Oe,ft,Bt,gt.data):V.isCompressedArrayTexture?M.compressedTexSubImage3D(De,Pe,Be,lt,wt,Ue,Ce,Oe,ft,gt.data):M.texSubImage3D(De,Pe,Be,lt,wt,Ue,Ce,Oe,ft,Bt,gt):y.isDataTexture?M.texSubImage2D(M.TEXTURE_2D,Pe,Be,lt,Ue,Ce,ft,Bt,gt.data):y.isCompressedTexture?M.compressedTexSubImage2D(M.TEXTURE_2D,Pe,Be,lt,gt.width,gt.height,ft,gt.data):M.texSubImage2D(M.TEXTURE_2D,Pe,Be,lt,Ue,Ce,ft,Bt,gt);_.pixelStorei(M.UNPACK_ROW_LENGTH,Xt),_.pixelStorei(M.UNPACK_IMAGE_HEIGHT,st),_.pixelStorei(M.UNPACK_SKIP_PIXELS,an),_.pixelStorei(M.UNPACK_SKIP_ROWS,Rn),_.pixelStorei(M.UNPACK_SKIP_IMAGES,Kn),Pe===0&&V.generateMipmaps&&M.generateMipmap(De),_.unbindTexture()},this.initRenderTarget=function(y){ee.get(y).__webglFramebuffer===void 0&&oe.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?oe.setTextureCube(y,0):y.isData3DTexture?oe.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?oe.setTexture2DArray(y,0):oe.setTexture2D(y,0),_.unbindTexture()},this.resetState=function(){ie=0,$=0,K=null,_.reset(),Le.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Sn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=nt._getDrawingBufferColorSpace(e),t.unpackColorSpace=nt._getUnpackColorSpace()}}class wr extends rt{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this._reflectionCameras=new WeakMap;const n=this,r=t.color!==void 0?new qe(t.color):new qe(8355711),s=t.textureWidth||512,a=t.textureHeight||512,o=t.clipBias||0,l=t.shader||wr.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,h=new Nn,f=new N,u=new N,d=new N,g=new ut,S=new N(0,0,-1),m=new dt,p=new N,b=new N,w=new dt,x=new ut,T=new It(s,a,{samples:c,type:Dt}),E=new Mt({name:l.name!==void 0?l.name:"unspecified",uniforms:Sr.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});E.uniforms.tDiffuse.value=T.texture,E.uniforms.color.value=r,E.uniforms.textureMatrix.value=x,this.material=E,this.onBeforeRender=function(L,v,A){const U=this.getReflectionCamera(A);if(u.setFromMatrixPosition(n.matrixWorld),d.setFromMatrixPosition(A.matrixWorld),g.extractRotation(n.matrixWorld),f.set(0,0,1),f.applyMatrix4(g),p.subVectors(u,d),p.dot(f)>0===!0&&this.forceUpdate===!1)return;p.reflect(f).negate(),p.add(u),g.extractRotation(A.matrixWorld),S.set(0,0,-1),S.applyMatrix4(g),S.add(d),b.subVectors(u,S),b.reflect(f).negate(),b.add(u),U.position.copy(p),U.up.set(0,1,0),U.up.applyMatrix4(g),U.up.reflect(f),U.lookAt(b),U.far=A.far,U.updateMatrixWorld(),U.projectionMatrix.copy(A.projectionMatrix),x.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),x.multiply(U.projectionMatrix),x.multiply(U.matrixWorldInverse),x.multiply(n.matrixWorld),h.setFromNormalAndCoplanarPoint(f,u),h.applyMatrix4(U.matrixWorldInverse),m.set(h.normal.x,h.normal.y,h.normal.z,h.constant);const B=U.projectionMatrix;U.isOrthographicCamera?(w.x=(Math.sign(m.x)+B.elements[8])/B.elements[0],w.y=(Math.sign(m.y)+B.elements[9])/B.elements[5],w.z=-A.far,w.w=1):(w.x=(Math.sign(m.x)+B.elements[8])/B.elements[0],w.y=(Math.sign(m.y)+B.elements[9])/B.elements[5],w.z=-1,w.w=(1+B.elements[10])/B.elements[14]),m.multiplyScalar(2/m.dot(w)),B.elements[2]=m.x,B.elements[6]=m.y,U.isOrthographicCamera?(B.elements[10]=m.z-o,B.elements[14]=m.w-1):(B.elements[10]=m.z+1-o,B.elements[14]=m.w),n.visible=!1;const J=L.getRenderTarget(),H=L.xr.enabled,Z=L.shadowMap.autoUpdate;L.xr.enabled=!1,L.shadowMap.autoUpdate=!1,L.setRenderTarget(T),L.state.buffers.depth.setMask(!0),L.autoClear===!1&&L.clear(),L.render(v,U),L.xr.enabled=H,L.shadowMap.autoUpdate=Z,L.setRenderTarget(J);const ie=A.viewport;ie!==void 0&&L.state.viewport(ie),n.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return T},this.dispose=function(){T.dispose(),n.material.dispose()},this.getReflectionCamera=function(L){let v=this._reflectionCameras.get(L);return v===void 0&&(v=L.clone(),this._reflectionCameras.set(L,v)),v}}}wr.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function Ro(i,e=!1){const t=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),r=new Set(Object.keys(i[0].morphAttributes)),s={},a={},o=i[0].morphTargetsRelative,l=new xt;let c=0;for(let h=0;h<i.length;++h){const f=i[h];let u=0;if(t!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in f.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;s[d]===void 0&&(s[d]=[]),s[d].push(f.attributes[d]),u++}if(u!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in f.morphAttributes){if(!r.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(f.morphAttributes[d])}if(e){let d;if(t)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,h),c+=d}}if(t){let h=0;const f=[];for(let u=0;u<i.length;++u){const d=i[u].index;for(let g=0;g<d.count;++g)f.push(d.getX(g)+h);h+=i[u].attributes.position.count}l.setIndex(f)}for(const h in s){const f=Qc(s[h]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,f)}for(const h in a){const f=a[h][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<f;++u){const d=[];for(let S=0;S<a[h].length;++S)d.push(a[h][S][u]);const g=Qc(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}}return l}function Qc(i){let e,t,n,r=-1,s=0;for(let c=0;c<i.length;++c){const h=i[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=h.normalized),n!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=h.gpuType),r!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=h.count*t}const a=new e(s),o=new Zt(a,t,n);let l=0;for(let c=0;c<i.length;++c){const h=i[c];if(h.isInterleavedBufferAttribute){const f=l/t;for(let u=0,d=h.count;u<d;u++)for(let g=0;g<t;g++){const S=h.getComponent(u,g);o.setComponent(u+f,g,S)}}else a.set(h.array,l);l+=h.count*t}return r!==void 0&&(o.gpuType=r),o}const dn={glass:0,panel:1,ribbon:2,hero:3,terrace:4},St={none:0,redCorners:1,cyanCorners:2,crownBand:3,floorLines:4,fins:5},Bn={box:0,round:1},Gt={spinner:0,hauler:1,boat:2},Co=4,pn={west:70,east:500},yt={start:760,end:-1700,halfWidth:10},jc={from:12,to:pn.west},Vi={x:12.4,spacing:30,height:9.5},Po={x:{minX:-152,maxX:-22,minZ:-150,maxZ:44},d:{minX:-118,maxX:-26,minZ:-268,maxZ:-176},z:{minX:-134,maxX:-24,minZ:-400,maxZ:-290}},Eg={x:-57,z:-345,deck:46},Vt={x:-57,y:92,z:-345,width:46},Lo={pearl:{x:610,z:-2700,scale:1.4},twist:{x:830,z:-2960,radius:30,scale:1.45},opener:{x:915,z:-3070,scale:1.4}},Ot={z:-1450,deck:46,rise:104,width:28,from:-60,to:640},Zn={x:60,y:118,z:-420,length:24,radius:4.6},eu=[{x:30,z:318,width:26,depth:34,yaw:.12},{x:52,z:338,width:34,depth:24,yaw:.12},{x:30,z:362,width:26,depth:32,yaw:.12}],tu=17,wg=[{x:-50,z:18,radiusX:13,radiusZ:19,yaw:.35,height:61,leanX:-7,leanZ:-5},{x:-97,z:26,radiusX:16,radiusZ:12,yaw:-.2,height:48,leanX:5,leanZ:-8},{x:-134,z:-14,radiusX:11,radiusZ:17,yaw:.1,height:42,leanX:8,leanZ:3},{x:-130,z:-74,radiusX:15,radiusZ:13,yaw:.5,height:55,leanX:7,leanZ:5},{x:-92,z:-128,radiusX:17,radiusZ:11,yaw:-.15,height:38,leanX:3,leanZ:7},{x:-46,z:-114,radiusX:12,radiusZ:16,yaw:.25,height:52,leanX:-5,leanZ:7},{x:-42,z:-50,radiusX:10,radiusZ:14,yaw:-.3,height:34,leanX:-6,leanZ:2}],nu=[{x:36,z:150,radius:13,height:16},{x:57,z:182,radius:9,height:13},{x:32,z:208,radius:11,height:18},{x:54,z:238,radius:12,height:15},{x:30,z:262,radius:8,height:12}],pi=[{at:0,position:{x:150,y:4.5,z:560},target:{x:98,y:11,z:330},fov:58},{at:.28,position:{x:122,y:5.5,z:236},target:{x:46,y:16,z:34},fov:56},{at:.52,position:{x:74,y:9,z:-66},target:{x:-18,y:26,z:-262},fov:54},{at:.74,position:{x:9,y:44,z:-248},target:{x:-58,y:58,z:-322},fov:50},{at:1,position:{x:30,y:90,z:-200},target:{x:-11,y:64,z:-497},fov:50}];function Io(i){let e=i|0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Tg(i,e,t,n,r,s){const a=s*s,o=a*s;return(2*o-3*a+1)*i+(o-2*a+s)*r*t+(-2*o+3*a)*e+(o-a)*r*n}function iu(i,e){const t=pi.length-1;if(e>=t)return 0;const n=pi[Math.max(0,e-1)],r=pi[e+1];return n===void 0||r===void 0?0:(i(r)-i(n))/(r.at-n.at)}function Do(i){var l;const e=Math.min(1,Math.max(0,i));let t=0;for(;t<pi.length-2&&(((l=pi[t+1])==null?void 0:l.at)??1)<e;)t+=1;const n=pi[t],r=pi[t+1];if(n===void 0||r===void 0)throw new Error("splash: camera keys are incomplete");const s=r.at-n.at,a=(e-n.at)/s,o=c=>Tg(c(n),c(r),iu(c,t),iu(c,t+1),s,a);return{position:{x:o(c=>c.position.x),y:o(c=>c.position.y),z:o(c=>c.position.z)},target:{x:o(c=>c.target.x),y:o(c=>c.target.y),z:o(c=>c.target.z)},fov:o(c=>c.fov)}}function Wi(i,e,t){const n=Math.min(1,Math.max(0,(i-e)/t));return n*n*(3-2*n)}function Ag(i,e,t){return Object.values(Po).some(n=>i+t>n.minX-8&&i-t<n.maxX+8&&e+t>n.minZ-8&&e-t<n.maxZ+8)}function ru(i,e,t){return i+t>-16&&i-t<pn.east+30?!0:Math.abs(e-Ot.z)<Ot.width/2+t+6&&i+t>Ot.from-40&&i-t<Ot.to+20}function Rg(i){const e=i();return e<.46?dn.glass:e<.78?dn.panel:dn.ribbon}function Cg(i,e){const t=i();return e?t<.3?St.crownBand:t<.55?St.floorLines:t<.7?St.fins:St.none:t<.05?St.redCorners:t<.09?St.cyanCorners:t<.18?St.crownBand:t<.25?St.floorLines:t<.3?St.fins:St.none}function Uo(i,e,t){const n=e(),r=t.height>46&&e()<.17,s=r?e()<.6?dn.glass:dn.ribbon:Rg(e),a=.08+e()*.3,o=Cg(e,r),l=r?Bn.round:Bn.box,c=[];let h=0,f=r?Math.min(t.width,t.depth):t.width,u=r?f:t.depth,d=t.height>60?2+Math.floor(e()*2):e()<.4?2:1;if(r&&(d=Math.min(d,2)),!r&&d>1&&e()<.55){const b=Math.min(t.height*.4,9+e()*10);c.push({x:t.x,y:0,z:t.z,width:f,depth:u,height:b,seed:n,facade:dn.panel,lit:Math.min(1,a+.15),trim:St.none,form:l,taper:1}),h=b,f*=.7+e()*.18,u*=.7+e()*.18,d-=1}for(let b=0;b<d;b+=1){const w=t.height-h,x=b===d-1,T=x?w:w*(.58+e()*.2),E=r?.84+e()*.16:1;c.push({x:t.x,y:h,z:t.z,width:f,depth:u,height:T,seed:n,facade:s,lit:a,trim:x?o:St.none,form:l,taper:E}),h+=T;const L=r?E*(.82+e()*.1):.72+e()*.16;f*=L,u=r?f:u*(.72+e()*.16)}const g=c.at(-1);if(g===void 0)return c;const S=g.y+g.height,m=g.width*g.taper,p=g.depth*g.taper;if(r&&e()<.45)i.antennas.push({x:g.x,y:S,z:g.z,height:t.height*(.12+e()*.1),radius:m*.12});else{const b=1+Math.floor(e()*3);for(let w=0;w<b;w+=1){const x=1.6+e()*Math.min(5,m*.3),T=1.6+e()*Math.min(5,p*.3),E=r?.5:1;i.roofUnits.push({x:g.x+(e()-.5)*(m-x-1.5)*E,y:S,z:g.z+(e()-.5)*(p-T-1.5)*E,width:x,height:1.2+e()*2.4,depth:T})}if(t.height>70&&e()<.55){const w=!r&&t.height>110&&e()<.35;i.antennas.push({x:g.x+(w?0:(e()-.5)*m*.5),y:S,z:g.z+(w?0:(e()-.5)*p*.5),height:w?18+e()*22:7+e()*16,radius:w?Math.min(m,p)*.09:.22})}}return i.tiers.push(...c),c}const Pg=[[2,3,3,4,4],[2,3,4,4,4],[3,4,0,4,3],[2,3,4,4,3],[1,2,3,3,4]],Wt=22,Tr=11.5;function Lg(i){const{maxX:e,maxZ:t}=Po.z,n=(a,o,l,c,h,f,u)=>{i.tiers.push({x:a,y:o,z:l,width:c,height:h,depth:f,seed:u,facade:dn.terrace,lit:.62,trim:St.none,form:Bn.box,taper:1})};Pg.forEach((a,o)=>{a.forEach((l,c)=>{if(l===0)return;const h=e-Wt/2-c*Wt,f=t-Wt/2-o*Wt;n(h,0,f,Wt,l*Tr,Wt,.41+o*.013+c*.007)})});const r=e-Wt*2.5,s=t-Wt*2.5;n(r,16,s,Wt,3.2,5,.47),n(r,27.5,s,5,3.2,Wt,.48);for(const a of[3,4])n(e-Wt/2-a*Wt,3*Tr,t+3.5,Wt,Tr,7,.44);n(e+3,2*Tr,t-Wt*2.5,6,Tr,Wt,.45)}function Ig(i){const e=(h,f,u,d,g,S,m)=>{i.tiers.push({x:h,y:f,z:u,width:d,height:g,depth:S,seed:.73,facade:dn.terrace,lit:.55,trim:m,form:Bn.box,taper:1})},{minX:t,maxX:n,minZ:r,maxZ:s}=Po.d,a=(r+s)/2,o=28;e(t+o/2,0,a,o,56,s-r,St.floorLines);for(const h of[r+o/2,s-o/2])e((t+o+n)/2,22,h,n-t-o,34,o,St.floorLines);e(n-13,40,a,26,16,s-r-o*2,St.floorLines);const l=[[18,30],[14,18],[12,7]];let c=t+o;for(const[h,f]of l)e(c+h/2,0,a,h,f,s-r-o*2,St.none),c+=h;e(t+o+13,0,r+o/2,26,6,o-6,St.none)}function Dg(i,e){for(let t=-890;t<=-30;t+=44)for(let n=-1720;n<=720;n+=44){const r=1+Math.floor(e()*2.2);for(let s=0;s<r;s+=1){const a=12+e()*(r===1?20:12),o=12+e()*(r===1?20:12),l=t+(e()-.5)*(32-a),c=n+(e()-.5)*(32-o),h=Math.max(a,o)/2;if(Ag(l,c,h)||ru(l,c,h))continue;const f=Math.min(1,Math.max(0,(-l-160)/520)),u=e()<f*.07?50+e()*100:0;Uo(i,e,{x:l,z:c,width:a,depth:o,height:16+e()**1.7*(28+f*60)+u})}}for(const[t,n,r]of[[-318,-1140,232],[-352,-1206,204]]){const s=(a,o,l,c,h,f)=>({x:t,y:a,z:n,width:o,height:l,depth:o,seed:c,facade:h,lit:.38,trim:f,form:Bn.box,taper:1});i.tiers.push(s(0,44,24,.91,dn.panel,St.crownBand),s(24,34,r-64,.92,dn.glass,St.fins),s(r-40,26,40,.93,dn.hero,St.crownBand)),i.antennas.push({x:t,y:r,z:n,height:26,radius:1.6})}for(const t of i.tiers){if(i.screens.length>=7)break;if(t.y!==0||t.z>-460||t.z<-1e3||t.x<-150||t.height<40||t.form!==Bn.box)continue;const n=Math.min(t.depth-2,12+e()*6),r=n*.5;i.screens.push({x:t.x+t.width/2-1,y:t.height+1.5+r/2,z:t.z,width:n,height:r,yaw:Math.PI/2,slot:i.screens.length%Co})}}function Ug(i,e){for(let t=pn.east+44;t<=1500;t+=50)for(let n=-2300;n<=720;n+=50){if(e()<.35)continue;const r=14+e()*22,s=14+e()*22,a=t+(e()-.5)*(36-r),o=n+(e()-.5)*(36-s);ru(a,o,Math.max(r,s)/2)||Uo(i,e,{x:a,z:o,width:r,depth:s,height:14+e()**2*60})}for(let t=0;t<22;t+=1){const n=380+e()*700,r=-2620-e()*680;if(!Object.values(Lo).every(o=>Math.hypot(n-o.x,r-o.z)>70)||n<pn.east+20)continue;const a=30+e()*26;Uo(i,e,{x:n,z:r,width:a,depth:a*(.8+e()*.4),height:140+e()**1.4*200})}}function Ng(){const i=Io(7382788),e={tiers:[],roofUnits:[],antennas:[],screens:[]};return Lg(e),Ig(e),Dg(e,i),Ug(e,i),e}const Fg=[[.05,.052,.06],[.42,.43,.45],[.3,.024,.028],[.012,.012,.014],[.03,.1,.18]],Og=[[.4,.24,.04],[.19,.19,.2]],Bg=[[.42,.42,.44],[.05,.06,.09],[.32,.03,.04]];function zg(){const i=Io(61925),e=[],t=(s,a,o,l,c,h)=>{const f=h===Gt.hauler?Og:h===Gt.boat?Bg:Fg;for(let u=0;u<o;u+=1)e.push({origin:s,directionX:0,directionZ:a,speed:c,span:l,kind:h,phase:(u+.15+i()*.6)*l/o,bob:i()*Math.PI*2,paint:f[Math.floor(i()*f.length)]??[.05,.05,.05]})},n=(yt.start+yt.end)/2,r=yt.start-yt.end;for(const[s,a]of[[132,26],[300,30],[430,22]])t({x:s,y:a,z:n},-1,7,r,24+i()*6,Gt.spinner),t({x:s+18,y:a+6,z:n},1,7,r,21+i()*6,Gt.spinner);t({x:236,y:62,z:n},-1,4,r,13,Gt.hauler),t({x:256,y:70,z:n},1,4,r,12,Gt.hauler);for(const s of[62,78])t({x:-4,y:s,z:n},-1,5,r,22+i()*5,Gt.spinner),t({x:4,y:s+3,z:n},1,5,r,20+i()*5,Gt.spinner);for(const[s,a]of[[196,-1],[262,1],[384,-1]])t({x:s,y:0,z:n},a,4,r,7+i()*2,Gt.boat);return e}function Hg(){const i=Io(24301),e=[],t=(o,l,c,h,f,u,d,g)=>{for(let S=0;S<h;S+=1){const m=(S+i()*.7)*f/h,p=i()*Math.PI*2;for(const b of g<.3?[-.7,.7]:[0]){const w=c!==0?b:0,x=l!==0?b:0;e.push({origin:{x:o.x+w,y:o.y,z:o.z+x},directionX:l,directionZ:c,speed:u,span:f,phase:m,bob:p,trail:d,radius:g,headlight:c>0||l<0})}}},n=(yt.start+yt.end)/2,r=yt.start-yt.end;for(const o of[-6.6,-3.3])t({x:o,y:.75,z:n},0,1,14,r,13+i()*5,1.4,.16);for(const o of[3.3,6.6])t({x:o,y:.75,z:n},0,-1,14,r,13+i()*5,1.4,.15);const s=(Ot.from+Ot.to)/2,a=Ot.to-Ot.from;for(const o of[-5,5])t({x:s,y:Ot.deck+.9,z:Ot.z+o},o<0?1:-1,0,10,a,15,1.4,.18);for(const[o,l]of[[-260,150],[-420,190],[-600,230],[760,120],[980,160]])t({x:o,y:l,z:-500},0,1,9,2400,34,7,.45),t({x:o+8,y:l+5,z:-500},0,-1,9,2400,30,7,.45);return e}const mn=`
uniform float uTime;
uniform float uDetail;
uniform float uHazeScale;
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

// Night-city fill: warm bounce from the lit streets below, cool sky light from above.
vec3 cityAmbient(vec3 normal, float height) {
  vec3 street = mix(vec3(0.42, 0.11, 0.14), vec3(0.16, 0.08, 0.15), smoothstep(0.0, 180.0, height));
  return mix(street, vec3(0.1, 0.1, 0.2), normal.y * 0.5 + 0.5);
}

// Exponential height haze integrated along the eye ray; uHazeScale thins it for distant landmarks that must stay legible.
float hazeAmount(vec3 position) {
  vec3 ray = position - cameraPosition;
  float rayLength = length(ray);
  float originY = max(cameraPosition.y, 0.0);
  float rise = ray.y / max(rayLength, 1e-3) * uFogFalloff;
  float path = abs(rise) < 1e-5 ? rayLength : (1.0 - exp(-rayLength * rise)) / rise;
  return 1.0 - exp(-uFogDensity * uHazeScale * exp(-originY * uFogFalloff) * path);
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
// Craft shrink and dim within 24 m of either loop end, where they wrap.
vec3 lanePlacement(vec4 lane, vec4 motion, float bob, out vec3 forward, out vec3 right, out float presence) {
  forward = vec3(motion.x, 0.0, motion.y);
  right = vec3(motion.y, 0.0, -motion.x);
  float halfSpan = 0.5 * motion.w;
  float travelled = mod(motion.z + uTime * lane.w, motion.w) - halfSpan;
  presence = smoothstep(0.0, 24.0, halfSpan - abs(travelled));
  return lane.xyz + forward * travelled + vec3(0.0, sin(uTime * 0.8 + bob) * 0.3, 0.0);
}
`,kg=`
attribute vec3 aCenter;
attribute vec4 aSize;
attribute vec4 aStyle;
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying float vBase;
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
  vBase = aCenter.y;
  vWorld = world;
  vLocal = local;
  vNormal = normalize(surfaceNormal);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,Gg=`
${mn}
flat varying vec4 vStyle;
flat varying vec4 vSize;
flat varying float vBase;
varying vec3 vWorld;
varying vec3 vLocal;
varying vec3 vNormal;

const float PI = 3.14159265;

// Room light: each building is warm or cool; rare rooms are lit by coloured screens. Terrace offices use neutral white.
vec3 roomLight(bool warm, bool neutral, float tone, float pick) {
  vec3 tint = neutral ? mix(vec3(1.0, 0.84, 0.66), vec3(0.94, 0.94, 0.92), tone)
    : warm ? mix(vec3(1.0, 0.54, 0.24), vec3(1.0, 0.74, 0.5), tone) : mix(vec3(0.62, 0.78, 1.0), vec3(0.88, 0.94, 1.0), tone);
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

vec3 wallRadiance(vec3 normal, vec3 view) {
  float seed = vStyle.x;
  int facade = int(vStyle.y + 0.5);
  float litRatio = vStyle.z;
  int trim = int(vStyle.w + 0.5);
  bool terrace = facade == 4;
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
  bool warm = terrace || hash11(seed * 41.3) < 0.55;

  float floorHeight = terrace ? 5.75 : 3.3 + 0.8 * hash11(seed * 71.3 + 0.17);
  float targetCell = facade == 1 ? 2.1 + 0.9 * hash11(seed * 13.7) : terrace ? 1.6 : 1.45 + 0.55 * hash11(seed * 29.3);
  float cellWidth = faceWidth / max(1.0, floor(faceWidth / targetCell + 0.5));
  vec2 coord = vec2(u / cellWidth, y / floorHeight);
  vec2 cell = floor(coord);
  vec2 cellUv = fract(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-5));
  float detail = smoothstep(1.8, 5.5, 1.0 / max(pixel.x, pixel.y));

  vec4 window = facade == 1 ? vec4(0.2, 0.3, 0.8, 0.82)
    : facade == 2 ? vec4(0.0, 0.4, 1.0, 0.9)
    : facade == 3 ? vec4(0.05, 0.16, 0.95, 0.97)
    : terrace ? vec4(0.025, 0.07, 0.975, 0.985)
    : vec4(0.03, 0.18, 0.97, 0.97);
  vec2 inside = smoothstep(window.xy - pixel, window.xy + pixel, cellUv)
    * (1.0 - smoothstep(window.zw - pixel, window.zw + pixel, cellUv));
  float windowMask = inside.x * inside.y;
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
  float brightness = terrace ? 1.35 : 1.0;

  vec3 reflected = reflect(view, normal);
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float f0 = facade == 1 ? 0.04 : terrace ? 0.06 : 0.1;
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
  vec3 glassTint = terrace ? vec3(0.9, 0.95, 1.0) : hash11(seed * 3.3) < 0.5 ? vec3(0.72, 0.84, 1.0) : vec3(1.0, 0.84, 0.7);
  vec3 sky = skyRadiance(vWorld, reflected, 0) * glassTint;

  vec3 albedo;
  float sheen;
  if (facade == 1) {
    float grime = fbm(vec2(u * 0.3, y * 0.04) + seed * 31.0, 3);
    float seam = lineCoverage(cellUv.x - 0.5, 0.012, pixel.x) * 0.5;
    albedo = vec3(0.055, 0.05, 0.052) * (0.6 + 0.8 * grime) * (1.0 - seam);
    sheen = 0.06;
  } else if (facade == 2) {
    albedo = vec3(0.03, 0.032, 0.038);
    sheen = 0.35;
  } else if (facade == 3) {
    albedo = vec3(0.012, 0.01, 0.014);
    sheen = 0.5;
  } else if (terrace) {
    albedo = vec3(0.16, 0.165, 0.17);
    sheen = 0.3;
  } else {
    albedo = vec3(0.018, 0.02, 0.026);
    sheen = 0.45;
  }
  vec3 structure = albedo * (cityAmbient(normal, y) + holoLight(vWorld, normal))
    + sky * (0.04 + 0.5 * pow(1.0 - cosine, 5.0)) * sheen;

  vec3 averageTint = terrace ? vec3(1.0, 0.86, 0.7) : warm ? vec3(1.0, 0.62, 0.34) : vec3(0.74, 0.86, 1.0);
  vec3 averageGlass = averageTint * litRatio * 0.13 * brightness * (1.0 - fresnel) + sky * fresnel;
  vec3 color = mix(structure, averageGlass, windowArea);
  float sharp = detail * uDetail;
  if (sharp > 0.0) {
    vec3 light = roomLight(warm, terrace, zoneTone, roomHash) * brightness;
    float roomDepth = cellWidth * 1.25 + 1.6;
    vec3 roomDirection = vec3(dot(view, tangent) / (0.5 * cellWidth), view.y / (0.5 * floorHeight), -dot(view, normal) / (0.5 * roomDepth));
    vec3 room = roomRadiance(cellUv, roomDirection, light, lit, roomHash);
    float blindHash = hash13(vec3(cell.yx, seed * 7.0 + faceId + 3.0));
    float blindLevel = mix(window.y, window.w, 0.2 + 0.7 * fract(blindHash * 7.31));
    float blinds = step(blindHash, terrace ? 0.0 : 0.16) * smoothstep(blindLevel - pixel.y, blindLevel + pixel.y, cellUv.y);
    float slats = mix(1.0, 0.72 + 0.28 * step(0.35, fract(cellUv.y * floorHeight * 5.0)), smoothstep(40.0, 80.0, 1.0 / pixel.y));
    room = mix(room, mix(vec3(0.008), light * (0.18 + 0.3 * cellUv.y), lit) * slats, blinds);
    vec3 glass = room * (1.0 - fresnel) + sky * fresnel;
    // Wide glazing splits into two panes.
    float pane = office && cellWidth > 1.4 ? lineCoverage(cellUv.x - 0.5, terrace ? 0.008 : 0.012, pixel.x) : 0.0;
    color = mix(color, mix(structure, glass, windowMask * (1.0 - pane)), sharp);
  }

  float pixelU = max(fwidth(u), 1e-4);
  float pixelY = max(fwidth(y), 1e-4);
  if (terrace) {
    // Each 11.5 m module reads as a framed cube: pale corner posts and slabs, with warm light washing each slab edge.
    #ifdef RADIAL
    float frame = gridLine(y - vBase, 11.5, 0.32, pixelY);
    #else
    float frame = max(lineCoverage(min(u, faceWidth - u), 0.38, pixelU), gridLine(y - vBase, 11.5, 0.32, pixelY));
    #endif
    color = mix(color, albedo * 1.6 * (cityAmbient(normal, y) + holoLight(vWorld, normal)), frame);
    color += vec3(1.0, 0.8, 0.55) * 0.3 * gridLine(y - vBase - 0.55, 11.5, 0.06, pixelY);
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
    float below = vBase + vSize.y - y;
    color += vec3(1.0, 0.07, 0.06) * 1.5 * lineCoverage(below - 0.6, 0.22, pixelY);
  } else if (trim == 4) {
    vec3 led = hash11(seed * 5.1) < 0.5 ? vec3(0.15, 0.75, 1.0) : vec3(0.9, 0.95, 1.0);
    color += led * 0.5 * gridLine(y - floorHeight * window.y * 0.5, floorHeight * 2.0, 0.06, pixelY);
  } else if (trim == 5) {
    vec3 led = hash11(seed * 9.7) < 0.6 ? vec3(0.15, 0.75, 1.0) : vec3(1.0, 0.2, 0.5);
    color += led * 0.55 * gridLine(u, cellWidth * 3.0, 0.07, pixelU);
  }
  return color;
}

// Garden terrace: planting beds between paved paths, low bollard lights at the path crossings, and a lit balustrade.
vec3 gardenRoof(vec2 world, float seed, float rim) {
  vec2 pixel = max(fwidth(world), vec2(1e-4));
  float beds = smoothstep(0.38, 0.62, valueNoise(world * 0.16 + seed * 37.0));
  vec3 plant = vec3(0.012, 0.03, 0.014) * (0.55 + 0.9 * fbm(world * 0.9 + seed * 11.0, 2));
  vec3 paving = vec3(0.06, 0.057, 0.052);
  float path = max(gridLine(world.x, 7.0, 0.8, pixel.x), gridLine(world.y, 7.0, 0.8, pixel.y));
  vec3 surface = mix(plant, paving, clamp(path + (1.0 - beds) * 0.55, 0.0, 1.0));
  float bollards = gridLine(world.x, 7.0, 0.22, pixel.x) * gridLine(world.y, 7.0, 0.22, pixel.y);
  return surface * (vec3(0.16, 0.08, 0.14) + holoLight(vWorld, vec3(0.0, 1.0, 0.0)))
    + vec3(1.0, 0.72, 0.42) * (1.6 * bollards + 0.25 * rim);
}

vec3 roofRadiance() {
  float seed = vStyle.x;
  #ifdef RADIAL
  vec2 footprint = vLocal.xz / (0.5 * vSize.xz * vSize.w);
  float edge = 0.5 * min(vSize.x, vSize.z) * vSize.w * (1.0 - length(footprint));
  #else
  vec2 sides = 0.5 * vSize.xz - abs(vLocal.xz);
  float edge = min(sides.x, sides.y);
  #endif
  float rim = 1.0 - smoothstep(0.0, 0.6, edge);
  if (int(vStyle.y + 0.5) == 4) return gardenRoof(vWorld.xz, seed, rim);
  float grime = fbm(vWorld.xz * 0.12 + seed * 40.0, 3);
  vec3 albedo = vec3(0.045, 0.042, 0.046) * (0.65 + 0.6 * grime);
  vec3 color = albedo * (vec3(0.16, 0.08, 0.14) + holoLight(vWorld, vec3(0.0, 1.0, 0.0))) * (1.0 + 0.8 * rim);
  // Helipads mark some large roofs; the ring stays faint so roofs never compete with the mark.
  float pad = step(24.0, min(vSize.x, vSize.z)) * step(0.72, hash11(seed * 17.0));
  float radius = length(vLocal.xz);
  float pixel = max(fwidth(radius), 1e-4);
  color += vec3(0.2, 0.75, 1.0) * 0.32 * pad * (lineCoverage(radius - 6.5, 0.16, pixel) + 0.5 * lineCoverage(radius - 5.6, 0.08, pixel));
  return color;
}

// Bridge and cantilever undersides carry rows of cool panel lights.
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
  if (normal.y > 0.5) color = roofRadiance();
  else if (normal.y < -0.5) color = soffitRadiance();
  else color = wallRadiance(normal, view);
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Vg=`
uniform mat4 textureMatrix;
varying vec4 vReflection;
varying vec3 vWorld;

void main() {
  vReflection = textureMatrix * vec4(position, 1.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,Wg=`
${mn}
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform vec4 uStreet;
uniform vec4 uRiver;
uniform vec2 uAvenue;
varying vec4 vReflection;
varying vec3 vWorld;

vec3 mirror(vec2 uv, float spread, float lod) {
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int tap = -3; tap <= 3; tap++) {
    float offset = float(tap) / 3.0;
    float tapWeight = exp(-offset * offset * 2.0);
    sum += textureLod(tDiffuse, uv + vec2(0.0, offset * spread), lod).rgb * tapWeight;
    weight += tapWeight;
  }
  return sum / weight;
}

void main() {
  vec3 p = vWorld;
  vec3 view = normalize(p - cameraPosition);
  vec2 pixel = max(fwidth(p.xz), vec2(1e-4));
  float cosine = clamp(-view.y, 0.0, 1.0);
  float grainDetail = 1.0 - smoothstep(0.2, 0.8, max(pixel.x, pixel.y) * 1.2);
  vec2 screen = vReflection.xy / vReflection.w;

  if (p.x > uRiver.x && p.x < uRiver.y) {
    vec2 swell = vec2(valueNoise(p.xz * vec2(0.03, 0.011) + vec2(0.0, uTime * 0.12)),
      valueNoise(p.xz * vec2(0.026, 0.009) + vec2(4.0, -uTime * 0.1))) - 0.5;
    vec2 chop = vec2(valueNoise(p.xz * 0.32 + uTime * 0.5), valueNoise(p.xz * 0.32 + 9.0 - uTime * 0.45)) - 0.5;
    vec3 reflection = mirror(screen + swell * 0.016 + chop * 0.005 * grainDetail, 0.03, 1.2);
    float fresnel = 0.02 + 0.98 * pow(1.0 - cosine, 5.0);
    vec3 deep = vec3(0.003, 0.008, 0.012) * (0.7 + 0.6 * valueNoise(p.xz * 0.015));
    vec3 radiance = deep * (vec3(0.3, 0.12, 0.16) + holoLight(p, vec3(0.0, 1.0, 0.0))) + reflection * color * mix(0.42, 1.0, fresnel);
    gl_FragColor = vec4(applyHaze(radiance, p), 1.0);
    return;
  }

  float across = abs(p.x);
  float onAvenue = step(uAvenue.y, p.z) * step(p.z, uAvenue.x);
  float road = onAvenue * (1.0 - smoothstep(uRiver.z - pixel.x, uRiver.z + pixel.x, across));
  float park = step(uStreet.z, p.x) * step(p.x, uStreet.w);

  float puddle = smoothstep(0.5, 0.62, fbm(p.xz * 0.045 + vec2(3.1, 7.7), 4));
  float grain = mix(0.5, fbm(p.xz * 1.2, 3), grainDetail);
  float wet = mix(0.45, 1.0, puddle) * (1.0 - 0.4 * (1.0 - road));
  float roughness = mix(0.5, 0.03, puddle);
  vec2 ripple = vec2(valueNoise(p.xz * 1.6 + uTime * 0.25), valueNoise(p.xz * 1.6 + 9.2 - uTime * 0.25)) - 0.5;
  vec3 reflection = mirror(screen + ripple * 0.005 * (1.0 - 0.7 * puddle) * grainDetail, roughness * 0.05, roughness * 4.0);
  float fresnel = 0.05 + 0.95 * pow(1.0 - cosine, 4.0);

  vec3 albedo = mix(vec3(0.05, 0.048, 0.052), vec3(0.02, 0.019, 0.022), road) * (0.7 + 0.6 * grain);
  albedo *= 1.0 - 0.35 * (1.0 - road) * max(gridLine(p.x, 1.5, 0.02, pixel.x), gridLine(p.z, 1.5, 0.02, pixel.y)) * grainDetail;
  float wear = smoothstep(0.25, 0.6, valueNoise(p.xz * vec2(2.0, 0.4)));
  float dash = smoothstep(0.0, pixel.y / 9.0 + 0.002, 0.42 - fract(p.z / 9.0));
  float lanes = ((lineCoverage(across - 3.35, 0.08, pixel.x) + lineCoverage(across - 6.75, 0.08, pixel.x)) * dash
    + lineCoverage(across - 9.55, 0.09, pixel.x)) * road;
  float centre = lineCoverage(across - 0.22, 0.06, pixel.x) * road;
  albedo = mix(albedo, vec3(0.42), lanes * wear);
  albedo = mix(albedo, vec3(0.5, 0.36, 0.08), centre * wear);
  albedo = mix(albedo, vec3(0.12), lineCoverage(across - uRiver.z, 0.08, pixel.x) * onAvenue);

  // The riverside park keeps a dark runway strip with a dashed centre line and edge lines.
  float runwayX = p.x - uRiver.w;
  float runway = park * (1.0 - smoothstep(7.0 - pixel.x, 7.0 + pixel.x, abs(runwayX)));
  albedo = mix(albedo, vec3(0.022, 0.021, 0.024) * (0.7 + 0.6 * grain), runway);
  float runwayPaint = runway * (lineCoverage(runwayX, 0.25, pixel.x) * step(0.55, fract(p.z / 24.0))
    + lineCoverage(abs(runwayX) - 6.4, 0.12, pixel.x));
  albedo = mix(albedo, vec3(0.5), runwayPaint * wear);

  vec3 light = vec3(0.3, 0.08, 0.1);
  float lampZ = p.z - uStreet.y * floor(p.z / uStreet.y + 0.5);
  float lampX = across - uStreet.x;
  light += vec3(1.0, 0.72, 0.46) * 2.4 * exp(-(lampX * lampX + lampZ * lampZ) / 32.0) * onAvenue;
  float bollardZ = p.z - 18.0 * floor(p.z / 18.0 + 0.5);
  float bollardX = p.x - (uRiver.w - 10.0);
  light += vec3(1.0, 0.78, 0.55) * 1.2 * exp(-(bollardX * bollardX + bollardZ * bollardZ) / 10.0) * park;
  light += vec3(1.0, 0.85, 0.65) * 0.6 * exp(-max(uRiver.x - p.x, 0.0) / 3.0) * park;
  light += holoLight(p, vec3(0.0, 1.0, 0.0));

  float shine = wet * (1.0 - 0.6 * clamp(lanes + centre + runwayPaint, 0.0, 1.0));
  vec3 radiance = albedo * light * (1.0 - 0.5 * shine) + reflection * color * fresnel * shine;
  radiance += vec3(0.1, 0.75, 1.0) * 1.1 * lineCoverage(p.x, 0.05, pixel.x) * step(0.5, fract(p.z / 4.0)) * road;
  gl_FragColor = vec4(applyHaze(radiance, p), 1.0);
}
`,Xg=`
varying vec3 vDirection;

void main() {
  vDirection = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`,qg=`
${mn}
varying vec3 vDirection;

void main() {
  gl_FragColor = vec4(skyRadiance(cameraPosition, normalize(vDirection), uDetail > 0.5 ? 5 : 2), 1.0);
}
`,Yg=`
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  mat4 model = modelMatrix;
  #ifdef USE_INSTANCING
  model = model * instanceMatrix;
  #endif
  vec4 world = model * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(model) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,Zg=`
${mn}
uniform vec3 uAlbedo;
uniform vec3 uEmissive;
uniform float uSheen;
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  vec3 color = uAlbedo * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal))
    + sky * uSheen * (0.04 + 0.96 * pow(1.0 - cosine, 5.0)) + uEmissive;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Kg=`
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
`,$g=`
${mn}
uniform sampler2D uAtlas;
uniform vec2 uGrid;
flat varying vec2 vPanel;
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  float column = mod(vPanel.x, uGrid.x);
  float row = floor(vPanel.x / uGrid.x);
  vec2 uv = vec2((column + vUv.x) / uGrid.x, 1.0 - (row + 1.0 - vUv.y) / uGrid.y);
  vec3 color = texture2D(uAtlas, uv).rgb;
  float lineCoord = vUv.y * 90.0;
  float lines = 1.0 - 0.14 * smoothstep(0.4, 0.9, abs(fract(lineCoord) - 0.5) * 2.0) * (1.0 - smoothstep(0.3, 0.7, fwidth(lineCoord)));
  float sweep = 0.86 + 0.14 * smoothstep(0.82, 1.0, 1.0 - abs(fract(vUv.y * 0.6 - uTime * 0.07) - 0.5) * 2.0);
  gl_FragColor = vec4(applyHaze(color * lines * sweep * vPanel.y, vWorld), 1.0);
}
`,As=`
${mn}
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
`,Jg=`
${As}
uniform vec3 uLightOffset;
attribute vec3 aHead;
attribute vec4 aLight;

void main() {
  vec3 head = aHead + uLightOffset;
  emitSegment(head, head, aLight.w, 2.2, aLight.rgb);
}
`,Qg=`
${As}
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
`,jg=`
${As}
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
`,ev=`
${As}
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
`,tv=`
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
`,nv=`
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
`,iv=`
${mn}
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
`,rv=`
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
`,su=1.22,sv=`
${mn}
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
  float front = uIgnite * ${su.toFixed(2)};
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
`,av=`
varying vec3 vWorld;
varying vec3 vNormal;
#ifdef BAKED
attribute vec2 aFacade;
varying vec2 vFacade;
#endif

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  #ifdef BAKED
  vFacade = aFacade;
  #endif
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,ov=`
${mn}
uniform float uSeed;
uniform vec2 uAxis;
uniform float uRadius;
uniform float uTwistRate;
varying vec3 vWorld;
varying vec3 vNormal;
#ifdef BAKED
varying vec2 vFacade;
#endif

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
    color += vec3(0.85, 0.92, 1.0) * 0.32 * gridLine(vWorld.y, 12.0, 0.08, max(fwidth(vWorld.y), 1e-4));
  }
  #elif defined(CRYSTAL)
  if (normal.y > 0.6) {
    color = metal(normal, view, vec3(0.03, 0.045, 0.03), 0.15);
  } else {
    // Clear crystal glazing with offices behind it, aluminium louvres every third of a floor, and lit slab edges.
    color = curtainWall(vFacade.x, vFacade.y, 1.5, 4.3, 0.4, false, normal, view) * vec3(0.9, 1.0, 1.08);
    float pixel = max(fwidth(vFacade.y), 1e-4);
    color = mix(color, metal(normal, view, vec3(0.12, 0.125, 0.13), 0.5), 0.55 * gridLine(vFacade.y, 4.3 / 3.0, 0.045, pixel));
    color += vec3(0.85, 0.93, 1.0) * 0.32 * gridLine(vFacade.y, 4.3, 0.07, pixel);
  }
  #elif defined(TANK)
  if (normal.y > 0.6) {
    color = metal(normal, view, vec3(0.05), 0.2);
  } else {
    // White-painted steel plates: horizontal and vertical seams, and warm light spilling from the glazed base band.
    vec2 pixel = max(fwidth(vFacade), vec2(1e-4));
    float seams = max(gridLine(vFacade.y, 2.4, 0.04, pixel.y), gridLine(vFacade.x, 8.0, 0.04, pixel.x));
    color = metal(normal, view, vec3(0.2, 0.2, 0.205) * (1.0 - 0.5 * seams), 0.3);
    float band = 1.0 - smoothstep(2.6, 3.2, vFacade.y);
    color = mix(color, vec3(1.0, 0.7, 0.42) * 0.55, band);
    color += vec3(1.0, 0.72, 0.45) * 0.55 * exp(-max(vFacade.y - 3.2, 0.0) / 2.5) * (1.0 - band);
  }
  #elif defined(TRANSLUCENT)
  // Roofs and the undersides the mirrored ground render sees have no horizontal tangent.
  if (abs(normal.y) > 0.6) {
    color = metal(normal, view, vec3(0.04), 0.2);
  } else {
    // Channel glass glowing from within: brighter near the floor, darker joints between the channels.
    vec3 tangent = normalize(vec3(normal.z, 0.0, -normal.x));
    float u = dot(vWorld, tangent);
    float pixelU = max(fwidth(u), 1e-4);
    float channels = gridLine(u, 0.55, 0.06, pixelU);
    float mullions = gridLine(u, 6.6, 0.18, pixelU);
    float glow = 0.05 + 0.08 * (1.0 - smoothstep(0.0, 14.0, vWorld.y)) + 0.03 * valueNoise(vec2(u * 0.25, vWorld.y * 0.18));
    color = vec3(1.0, 0.84, 0.64) * glow * (1.0 - 0.5 * channels) * (1.0 - 0.7 * mullions);
  }
  #endif
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,au=`
${mn}
attribute vec4 aGlow;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vGlow;
varying vec3 vPaint;
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
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,ou=`
${mn}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec4 vGlow;
varying vec3 vPaint;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 view = normalize(vWorld - cameraPosition);
  float cosine = clamp(abs(dot(view, normal)), 0.0, 1.0);
  float glass = vGlow.a;
  float fresnel = mix(0.05, 0.08, glass) + (1.0 - mix(0.05, 0.08, glass)) * pow(1.0 - cosine, 5.0);
  vec3 sky = skyRadiance(vWorld, reflect(view, normal), 0);
  vec3 paint = mix(vPaint, vec3(0.006, 0.008, 0.012), glass);
  vec3 color = paint * (cityAmbient(normal, vWorld.y) + holoLight(vWorld, normal)) * (1.0 - fresnel)
    + sky * fresnel * mix(0.7, 1.0, glass) + vGlow.rgb;
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Ar=Yt;class No extends xo{constructor(e){super(e),this.defaultDPI=90,this.defaultUnit="px"}load(e,t,n,r){const s=this,a=new ed(s.manager);a.setPath(s.path),a.setRequestHeader(s.requestHeader),a.setWithCredentials(s.withCredentials),a.load(e,function(o){try{t(s.parse(o))}catch(l){r?r(l):console.error(l),s.manager.itemError(e)}},n,r)}parse(e){const t=this;function n(D,I){if(D.nodeType!==1)return;D.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");const C=T(D);let z=!1,j=null;switch(D.nodeName){case"svg":I=S(D,I);break;case"style":s(D);break;case"g":I=S(D,I);break;case"path":I=S(D,I),D.hasAttribute("d")&&(j=r(D));break;case"rect":I=S(D,I),j=l(D);break;case"polygon":I=S(D,I),j=c(D);break;case"polyline":I=S(D,I),j=h(D);break;case"circle":I=S(D,I),j=f(D);break;case"ellipse":I=S(D,I),j=u(D);break;case"line":I=S(D,I),j=d(D);break;case"defs":z=!0;break;case"use":I=S(D,I);const k=(D.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),O=D.viewportElement.getElementById(k);O?n(O,I):console.warn("SVGLoader: 'use node' references non-existent node id: "+k);break}if(j){I.fill!==void 0&&I.fill!=="none"&&!I.fill.startsWith("url")&&j.color.setStyle(I.fill,Ar),v(j,Ne),Z.push(j);const R=Object.assign({},I);R.strokeWidth=I.strokeWidth*J(Ne),j.userData={node:D,style:R,transform:Ne.clone(),gradients:$}}const me=D.childNodes;for(let R=0;R<me.length;R++){const k=me[R];z&&k.nodeName!=="style"&&k.nodeName!=="defs"||n(k,I)}C&&(K.pop(),K.length>0?Ne.copy(K[K.length-1]):Ne.identity())}function r(D){const I=new fi,C=new ue,z=new ue,j=new ue;let me=!0,R=!1;const k=D.getAttribute("d");if(k===""||k==="none")return null;const O=k.match(/[a-df-z][^a-df-z]*/ig);for(let Y=0,Q=O.length;Y<Q;Y++){const le=O[Y],ge=le.charAt(0),pe=le.slice(1).trim();me===!0&&(R=!0,me=!1);let q;switch(ge){case"M":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=2)C.x=q[M+0],C.y=q[M+1],z.x=C.x,z.y=C.y,M===0?I.moveTo(C.x,C.y):I.lineTo(C.x,C.y),M===0&&j.copy(C);break;case"H":q=p(pe);for(let M=0,Re=q.length;M<Re;M++)C.x=q[M],z.x=C.x,z.y=C.y,I.lineTo(C.x,C.y),M===0&&R===!0&&j.copy(C);break;case"V":q=p(pe);for(let M=0,Re=q.length;M<Re;M++)C.y=q[M],z.x=C.x,z.y=C.y,I.lineTo(C.x,C.y),M===0&&R===!0&&j.copy(C);break;case"L":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=2)C.x=q[M+0],C.y=q[M+1],z.x=C.x,z.y=C.y,I.lineTo(C.x,C.y),M===0&&R===!0&&j.copy(C);break;case"C":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=6)I.bezierCurveTo(q[M+0],q[M+1],q[M+2],q[M+3],q[M+4],q[M+5]),z.x=q[M+2],z.y=q[M+3],C.x=q[M+4],C.y=q[M+5],M===0&&R===!0&&j.copy(C);break;case"S":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=4)I.bezierCurveTo(m(C.x,z.x),m(C.y,z.y),q[M+0],q[M+1],q[M+2],q[M+3]),z.x=q[M+0],z.y=q[M+1],C.x=q[M+2],C.y=q[M+3],M===0&&R===!0&&j.copy(C);break;case"Q":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=4)I.quadraticCurveTo(q[M+0],q[M+1],q[M+2],q[M+3]),z.x=q[M+0],z.y=q[M+1],C.x=q[M+2],C.y=q[M+3],M===0&&R===!0&&j.copy(C);break;case"T":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=2){const Fe=m(C.x,z.x),P=m(C.y,z.y);I.quadraticCurveTo(Fe,P,q[M+0],q[M+1]),z.x=Fe,z.y=P,C.x=q[M+0],C.y=q[M+1],M===0&&R===!0&&j.copy(C)}break;case"A":q=p(pe,[3,4],7);for(let M=0,Re=q.length;M<Re;M+=7){if(q[M+5]==C.x&&q[M+6]==C.y)continue;const Fe=C.clone();C.x=q[M+5],C.y=q[M+6],z.x=C.x,z.y=C.y,a(I,q[M],q[M+1],q[M+2],q[M+3],q[M+4],Fe,C),M===0&&R===!0&&j.copy(C)}break;case"m":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=2)C.x+=q[M+0],C.y+=q[M+1],z.x=C.x,z.y=C.y,M===0?I.moveTo(C.x,C.y):I.lineTo(C.x,C.y),M===0&&j.copy(C);break;case"h":q=p(pe);for(let M=0,Re=q.length;M<Re;M++)C.x+=q[M],z.x=C.x,z.y=C.y,I.lineTo(C.x,C.y),M===0&&R===!0&&j.copy(C);break;case"v":q=p(pe);for(let M=0,Re=q.length;M<Re;M++)C.y+=q[M],z.x=C.x,z.y=C.y,I.lineTo(C.x,C.y),M===0&&R===!0&&j.copy(C);break;case"l":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=2)C.x+=q[M+0],C.y+=q[M+1],z.x=C.x,z.y=C.y,I.lineTo(C.x,C.y),M===0&&R===!0&&j.copy(C);break;case"c":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=6)I.bezierCurveTo(C.x+q[M+0],C.y+q[M+1],C.x+q[M+2],C.y+q[M+3],C.x+q[M+4],C.y+q[M+5]),z.x=C.x+q[M+2],z.y=C.y+q[M+3],C.x+=q[M+4],C.y+=q[M+5],M===0&&R===!0&&j.copy(C);break;case"s":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=4)I.bezierCurveTo(m(C.x,z.x),m(C.y,z.y),C.x+q[M+0],C.y+q[M+1],C.x+q[M+2],C.y+q[M+3]),z.x=C.x+q[M+0],z.y=C.y+q[M+1],C.x+=q[M+2],C.y+=q[M+3],M===0&&R===!0&&j.copy(C);break;case"q":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=4)I.quadraticCurveTo(C.x+q[M+0],C.y+q[M+1],C.x+q[M+2],C.y+q[M+3]),z.x=C.x+q[M+0],z.y=C.y+q[M+1],C.x+=q[M+2],C.y+=q[M+3],M===0&&R===!0&&j.copy(C);break;case"t":q=p(pe);for(let M=0,Re=q.length;M<Re;M+=2){const Fe=m(C.x,z.x),P=m(C.y,z.y);I.quadraticCurveTo(Fe,P,C.x+q[M+0],C.y+q[M+1]),z.x=Fe,z.y=P,C.x=C.x+q[M+0],C.y=C.y+q[M+1],M===0&&R===!0&&j.copy(C)}break;case"a":q=p(pe,[3,4],7);for(let M=0,Re=q.length;M<Re;M+=7){if(q[M+5]==0&&q[M+6]==0)continue;const Fe=C.clone();C.x+=q[M+5],C.y+=q[M+6],z.x=C.x,z.y=C.y,a(I,q[M],q[M+1],q[M+2],q[M+3],q[M+4],Fe,C),M===0&&R===!0&&j.copy(C)}break;case"Z":case"z":I.currentPath.autoClose=!0,I.currentPath.curves.length>0&&(C.copy(j),I.currentPath.currentPoint.copy(C),me=!0);break;default:console.warn(le)}R=!1}return I}function s(D){if(!(!D.sheet||!D.sheet.cssRules||!D.sheet.cssRules.length))for(let I=0;I<D.sheet.cssRules.length;I++){const C=D.sheet.cssRules[I];if(C.type!==1)continue;const z=C.selectorText.split(/,/gm).filter(Boolean).map(j=>j.trim());for(let j=0;j<z.length;j++){const me=Object.fromEntries(Object.entries(C.style).filter(([,R])=>R!==""));ie[z[j]]=Object.assign(ie[z[j]]||{},me)}}}function a(D,I,C,z,j,me,R,k){if(I==0||C==0){D.lineTo(k.x,k.y);return}z=z*Math.PI/180,I=Math.abs(I),C=Math.abs(C);const O=(R.x-k.x)/2,Y=(R.y-k.y)/2,Q=Math.cos(z)*O+Math.sin(z)*Y,le=-Math.sin(z)*O+Math.cos(z)*Y;let ge=I*I,pe=C*C;const q=Q*Q,M=le*le,Re=q/ge+M/pe;if(Re>1){const fe=Math.sqrt(Re);I=fe*I,C=fe*C,ge=I*I,pe=C*C}const Fe=ge*M+pe*q,P=(ge*pe-Fe)/Fe;let _=Math.sqrt(Math.max(0,P));j===me&&(_=-_);const X=_*I*le/C,ee=-_*C*Q/I,oe=Math.cos(z)*X-Math.sin(z)*ee+(R.x+k.x)/2,Me=Math.sin(z)*X+Math.cos(z)*ee+(R.y+k.y)/2,Se=o(1,0,(Q-X)/I,(le-ee)/C),ce=o((Q-X)/I,(le-ee)/C,(-Q-X)/I,(-le-ee)/C)%(Math.PI*2);D.currentPath.absellipse(oe,Me,I,C,Se,Se+ce,me===0,z)}function o(D,I,C,z){const j=D*C+I*z,me=Math.sqrt(D*D+I*I)*Math.sqrt(C*C+z*z);let R=Math.acos(Math.max(-1,Math.min(1,j/me)));return D*z-I*C<0&&(R=-R),R}function l(D){const I=x(D.getAttribute("x")||0),C=x(D.getAttribute("y")||0),z=x(D.getAttribute("rx")||D.getAttribute("ry")||0),j=x(D.getAttribute("ry")||D.getAttribute("rx")||0),me=x(D.getAttribute("width")),R=x(D.getAttribute("height")),k=1-.551915024494,O=new fi;return O.moveTo(I+z,C),O.lineTo(I+me-z,C),(z!==0||j!==0)&&O.bezierCurveTo(I+me-z*k,C,I+me,C+j*k,I+me,C+j),O.lineTo(I+me,C+R-j),(z!==0||j!==0)&&O.bezierCurveTo(I+me,C+R-j*k,I+me-z*k,C+R,I+me-z,C+R),O.lineTo(I+z,C+R),(z!==0||j!==0)&&O.bezierCurveTo(I+z*k,C+R,I,C+R-j*k,I,C+R-j),O.lineTo(I,C+j),(z!==0||j!==0)&&O.bezierCurveTo(I,C+j*k,I+z*k,C,I+z,C),O}function c(D){function I(me,R,k){const O=x(R),Y=x(k);j===0?z.moveTo(O,Y):z.lineTo(O,Y),j++}const C=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,z=new fi;let j=0;return D.getAttribute("points").replace(C,I),z.currentPath.autoClose=!0,z}function h(D){function I(me,R,k){const O=x(R),Y=x(k);j===0?z.moveTo(O,Y):z.lineTo(O,Y),j++}const C=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,z=new fi;let j=0;return D.getAttribute("points").replace(C,I),z.currentPath.autoClose=!1,z}function f(D){const I=x(D.getAttribute("cx")||0),C=x(D.getAttribute("cy")||0),z=x(D.getAttribute("r")||0),j=new ui;j.absarc(I,C,z,0,Math.PI*2);const me=new fi;return me.subPaths.push(j),me}function u(D){const I=x(D.getAttribute("cx")||0),C=x(D.getAttribute("cy")||0),z=x(D.getAttribute("rx")||0),j=x(D.getAttribute("ry")||0),me=new ui;me.absellipse(I,C,z,j,0,Math.PI*2);const R=new fi;return R.subPaths.push(me),R}function d(D){const I=x(D.getAttribute("x1")||0),C=x(D.getAttribute("y1")||0),z=x(D.getAttribute("x2")||0),j=x(D.getAttribute("y2")||0),me=new fi;return me.moveTo(I,C),me.lineTo(z,j),me.currentPath.autoClose=!1,me}function g(D){const I="http://www.w3.org/1999/xlink",C=D.querySelectorAll("linearGradient, radialGradient"),z=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],j={};for(const R of C){const k=R.getAttribute("id");if(!k)continue;const O={type:R.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},Y=R.getAttributeNS(I,"href")||R.getAttribute("href")||"";Y.startsWith("#")&&(O.href=Y.substring(1));for(const le of z)R.hasAttribute(le)&&(O.attrs[le]=R.getAttribute(le));const Q=R.querySelectorAll("stop");if(Q.length>0){O.stops=[];for(const le of Q){let ge=le.getAttribute("stop-color");!ge&&le.style&&(ge=le.style["stop-color"]),ge||(ge="#000");let pe=le.getAttribute("stop-opacity");(pe===null||pe==="")&&le.style&&(pe=le.style["stop-opacity"]),pe=pe===null||pe===""||pe===void 0?1:Math.max(0,Math.min(1,parseFloat(pe)));const q=Math.max(0,Math.min(1,parseFloat(le.getAttribute("offset")||"0")));O.stops.push({offset:q,color:ge,opacity:pe})}}j[k]=O}function me(R,k){const O=j[R];if(!O||k.has(R))return O;if(k.add(R),O.href&&j[O.href]){const Y=me(O.href,k);if(Y){O.stops||(O.stops=Y.stops);for(const Q in Y.attrs)Q in O.attrs||(O.attrs[Q]=Y.attrs[Q])}}return O}for(const R in j)me(R,new Set);for(const R in j){let le=function(ge){return typeof ge!="string"?0:ge.endsWith("%")?parseFloat(ge)/100:x(ge)};const k=j[R],O=k.attrs,Y=O.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",Q={type:k.type,gradientUnits:Y,spreadMethod:O.spreadMethod==="reflect"||O.spreadMethod==="repeat"?O.spreadMethod:"pad",gradientTransform:null,stops:(k.stops||[]).slice().sort((ge,pe)=>ge.offset-pe.offset)};if(O.gradientTransform&&(Q.gradientTransform=new We,L(O.gradientTransform,Q.gradientTransform)),k.type==="linearGradient")Q.x1=O.x1!==void 0?le(O.x1):0,Q.y1=O.y1!==void 0?le(O.y1):0,Q.x2=O.x2!==void 0?le(O.x2):Y==="objectBoundingBox"?1:0,Q.y2=O.y2!==void 0?le(O.y2):0;else{const ge=Y==="objectBoundingBox"?.5:0,pe=Y==="objectBoundingBox"?.5:0;Q.cx=O.cx!==void 0?le(O.cx):ge,Q.cy=O.cy!==void 0?le(O.cy):ge,Q.r=O.r!==void 0?le(O.r):pe,Q.fx=O.fx!==void 0?le(O.fx):Q.cx,Q.fy=O.fy!==void 0?le(O.fy):Q.cy}$[R]=Q}}function S(D,I){I=Object.assign({},I);let C={};if(D.hasAttribute("class")){const R=D.getAttribute("class").split(/\s/).filter(Boolean).map(k=>k.trim());for(let k=0;k<R.length;k++)C=Object.assign(C,ie["."+R[k]])}D.hasAttribute("id")&&(C=Object.assign(C,ie["#"+D.getAttribute("id")]));function z(R,k,O){O===void 0&&(O=function(Q){return Q}),D.hasAttribute(R)&&(I[k]=O(D.getAttribute(R))),C[k]&&(I[k]=O(C[k])),D.style&&D.style[R]!==""&&(I[k]=O(D.style[R]))}function j(R){return Math.max(0,Math.min(1,x(R)))}function me(R){return Math.max(0,x(R))}return z("fill","fill"),z("fill-opacity","fillOpacity",j),z("fill-rule","fillRule"),z("opacity","opacity",j),z("stroke","stroke"),z("stroke-opacity","strokeOpacity",j),z("stroke-width","strokeWidth",me),z("stroke-linejoin","strokeLineJoin"),z("stroke-linecap","strokeLineCap"),z("stroke-miterlimit","strokeMiterLimit",me),z("visibility","visibility"),I}function m(D,I){return D-(I-D)}function p(D,I,C){if(typeof D!="string")throw new TypeError("Invalid input: "+typeof D);const z={WHITESPACE:/[ \t\r\n]/,DIGIT:/[\d]/,SIGN:/[-+]/,POINT:/\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},j=0,me=1,R=2,k=3;let O=j,Y=!0,Q="",le="";const ge=[];function pe(Fe,P,_){const X=new SyntaxError('Unexpected character "'+Fe+'" at index '+P+".");throw X.partial=_,X}function q(){Q!==""&&(le===""?ge.push(Number(Q)):ge.push(Number(Q)*Math.pow(10,Number(le)))),Q="",le=""}let M;const Re=D.length;for(let Fe=0;Fe<Re;Fe++){if(M=D[Fe],Array.isArray(I)&&I.includes(ge.length%C)&&z.FLAGS.test(M)){O=me,Q=M,q();continue}if(O===j){if(z.WHITESPACE.test(M))continue;if(z.DIGIT.test(M)||z.SIGN.test(M)){O=me,Q=M;continue}if(z.POINT.test(M)){O=R,Q=M;continue}z.COMMA.test(M)&&(Y&&pe(M,Fe,ge),Y=!0)}if(O===me){if(z.DIGIT.test(M)){Q+=M;continue}if(z.POINT.test(M)){Q+=M,O=R;continue}if(z.EXP.test(M)){O=k;continue}z.SIGN.test(M)&&Q.length===1&&z.SIGN.test(Q[0])&&pe(M,Fe,ge)}if(O===R){if(z.DIGIT.test(M)){Q+=M;continue}if(z.EXP.test(M)){O=k;continue}z.POINT.test(M)&&Q[Q.length-1]==="."&&pe(M,Fe,ge)}if(O===k){if(z.DIGIT.test(M)){le+=M;continue}if(z.SIGN.test(M)){if(le===""){le+=M;continue}le.length===1&&z.SIGN.test(le)&&pe(M,Fe,ge)}}z.WHITESPACE.test(M)?(q(),O=j,Y=!1):z.COMMA.test(M)?(q(),O=j,Y=!0):z.SIGN.test(M)?(q(),O=me,Q=M):z.POINT.test(M)?(q(),O=R,Q=M):pe(M,Fe,ge)}return q(),ge}const b=["mm","cm","in","pt","pc","px"],w={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function x(D){let I="px";if(typeof D=="string"||D instanceof String)for(let z=0,j=b.length;z<j;z++){const me=b[z];if(D.endsWith(me)){I=me,D=D.substring(0,D.length-me.length);break}}let C;return I==="px"&&t.defaultUnit!=="px"?C=w.in[t.defaultUnit]/t.defaultDPI:(C=w[I][t.defaultUnit],C<0&&(C=w[I].in*t.defaultDPI)),C*parseFloat(D)}function T(D){if(!(D.hasAttribute("transform")||D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))))return null;const I=E(D);return K.length>0&&I.premultiply(K[K.length-1]),Ne.copy(I),K.push(I),I}function E(D){const I=new We;if(D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))){const C=x(D.getAttribute("x")||0),z=x(D.getAttribute("y")||0);I.makeTranslation(C,z)}return D.hasAttribute("transform")&&L(D.getAttribute("transform"),I),I}function L(D,I){const C=re,z=D.split(")");for(let j=z.length-1;j>=0;j--){const me=z[j].trim();if(me==="")continue;const R=me.indexOf("("),k=me.length;if(R>0&&R<k){const O=me.slice(0,R),Y=p(me.slice(R+1));switch(C.identity(),O){case"translate":if(Y.length>=1){const Q=Y[0];let le=0;Y.length>=2&&(le=Y[1]),C.makeTranslation(Q,le)}break;case"rotate":if(Y.length>=1){let Q=0,le=0,ge=0;Q=Y[0]*Math.PI/180,Y.length>=3&&(le=Y[1],ge=Y[2]),se.makeTranslation(-le,-ge),he.makeRotation(Q),xe.multiplyMatrices(he,se),se.makeTranslation(le,ge),C.multiplyMatrices(se,xe)}break;case"scale":if(Y.length>=1){const Q=Y[0];let le=Q;Y.length>=2&&(le=Y[1]),C.makeScale(Q,le)}break;case"skewX":Y.length===1&&C.set(1,Math.tan(Y[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":Y.length===1&&C.set(1,0,0,Math.tan(Y[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":Y.length===6&&C.set(Y[0],Y[2],Y[4],Y[1],Y[3],Y[5],0,0,1);break}I.premultiply(C)}}return I}function v(D,I){function C(R){Ie.set(R.x,R.y,1).applyMatrix3(I),R.set(Ie.x,Ie.y)}function z(R){const k=R.xRadius,O=R.yRadius,Y=Math.cos(R.aRotation),Q=Math.sin(R.aRotation),le=new N(k*Y,k*Q,0),ge=new N(-O*Q,O*Y,0),pe=le.applyMatrix3(I),q=ge.applyMatrix3(I),M=re.set(pe.x,q.x,0,pe.y,q.y,0,0,0,1),Re=se.copy(M).invert(),_=he.copy(Re).transpose().multiply(Re).elements,X=H(_[0],_[1],_[4]),ee=Math.sqrt(X.rt1),oe=Math.sqrt(X.rt2);if(R.xRadius=1/ee,R.yRadius=1/oe,R.aRotation=Math.atan2(X.sn,X.cs),!((R.aEndAngle-R.aStartAngle)%(2*Math.PI)<Number.EPSILON)){const Se=se.set(ee,0,0,0,oe,0,0,0,1),ce=he.set(X.cs,X.sn,0,-X.sn,X.cs,0,0,0,1),fe=Se.multiply(ce).multiply(M),ye=ze=>{const{x:Ee,y:be}=new N(Math.cos(ze),Math.sin(ze),0).applyMatrix3(fe);return Math.atan2(be,Ee)};R.aStartAngle=ye(R.aStartAngle),R.aEndAngle=ye(R.aEndAngle),A(I)&&(R.aClockwise=!R.aClockwise)}}function j(R){const k=G(I),O=B(I);R.xRadius*=k,R.yRadius*=O;const Y=k>Number.EPSILON?Math.atan2(I.elements[1],I.elements[0]):Math.atan2(-I.elements[3],I.elements[4]);R.aRotation+=Y,A(I)&&(R.aStartAngle*=-1,R.aEndAngle*=-1,R.aClockwise=!R.aClockwise)}const me=D.subPaths;for(let R=0,k=me.length;R<k;R++){const Y=me[R].curves;for(let Q=0;Q<Y.length;Q++){const le=Y[Q];le.isLineCurve?(C(le.v1),C(le.v2)):le.isCubicBezierCurve?(C(le.v0),C(le.v1),C(le.v2),C(le.v3)):le.isQuadraticBezierCurve?(C(le.v0),C(le.v1),C(le.v2)):le.isEllipseCurve&&(_e.set(le.aX,le.aY),C(_e),le.aX=_e.x,le.aY=_e.y,U(I)?z(le):j(le))}}}function A(D){const I=D.elements;return I[0]*I[4]-I[1]*I[3]<0}function U(D){const I=D.elements,C=I[0]*I[3]+I[1]*I[4];if(C===0)return!1;const z=G(D),j=B(D);return Math.abs(C/(z*j))>Number.EPSILON}function G(D){const I=D.elements;return Math.sqrt(I[0]*I[0]+I[1]*I[1])}function B(D){const I=D.elements;return Math.sqrt(I[3]*I[3]+I[4]*I[4])}function J(D){const I=D.elements,C=I[0]*I[4]-I[1]*I[3];return Math.sqrt(Math.abs(C))}function H(D,I,C){let z,j,me,R,k;const O=D+C,Y=D-C,Q=Math.sqrt(Y*Y+4*I*I);return O>0?(z=.5*(O+Q),k=1/z,j=D*k*C-I*k*I):O<0?j=.5*(O-Q):(z=.5*Q,j=-.5*Q),Y>0?me=Y+Q:me=Y-Q,Math.abs(me)>2*Math.abs(I)?(k=-2*I/me,R=1/Math.sqrt(1+k*k),me=k*R):Math.abs(I)===0?(me=1,R=0):(k=-.5*me/I,me=1/Math.sqrt(1+k*k),R=k*me),Y>0&&(k=me,me=-R,R=k),{rt1:z,rt2:j,cs:me,sn:R}}const Z=[],ie={},$={},K=[],re=new We,se=new We,he=new We,xe=new We,_e=new ue,Ie=new N,Ne=new We,Xe=new DOMParser().parseFromString(e,"image/svg+xml");return g(Xe),n(Xe.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:Z,gradients:$,xml:Xe.documentElement}}static createFillMaterial(e){const t=e.userData.style;if(t.fill===void 0||t.fill==="none")return null;const n=e.color;let r=null;const s=lu.exec(t.fill);if(s){const o=e.userData.gradients&&e.userData.gradients[s[1]];r=lv(o,e)}const a=new hr({opacity:t.fillOpacity*(t.opacity||1),transparent:!0,side:tn,depthWrite:!1});return r!==null?a.map=r:a.color=n,a}static createStrokeMaterial(e){const t=e.userData.style;return t.stroke===void 0||t.stroke==="none"?null:(lu.test(t.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new hr({color:new qe().setStyle(t.stroke,Ar),opacity:t.strokeOpacity*(t.opacity||1),transparent:!0,side:tn,depthWrite:!1}))}static createShapes(e){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),e.toShapes()}static getStrokeStyle(e,t,n,r,s){return e=e!==void 0?e:1,t=t!==void 0?t:"#000",n=n!==void 0?n:"miter",r=r!==void 0?r:"butt",s=s!==void 0?s:4,{strokeColor:t,strokeWidth:e,strokeLineJoin:n,strokeLineCap:r,strokeMiterLimit:s}}static pointsToStroke(e,t,n,r){const s=[],a=[],o=[];if(No.pointsToStrokeWithBuffers(e,t,n,r,s,a,o)===0)return null;const l=new xt;return l.setAttribute("position",new et(s,3)),l.setAttribute("normal",new et(a,3)),l.setAttribute("uv",new et(o,2)),l}static pointsToStrokeWithBuffers(e,t,n,r,s,a,o,l){const c=new ue,h=new ue,f=new ue,u=new ue,d=new ue,g=new ue,S=new ue,m=new ue,p=new ue,b=new ue,w=new ue,x=new ue,T=new ue,E=new ue,L=new ue,v=new ue,A=new ue;n=n!==void 0?n:12,r=r!==void 0?r:.001,l=l!==void 0?l:0,e=me(e);const U=e.length;if(U<2)return 0;const G=e[0].equals(e[U-1]);let B,J=e[0],H;const Z=t.strokeWidth/2,ie=1/(U-1);let $=0,K,re,se,he,xe=!1,_e=0,Ie=l*3,Ne=l*2;Xe(e[0],e[1],c).multiplyScalar(Z),m.copy(e[0]).sub(c),p.copy(e[0]).add(c),b.copy(m),w.copy(p);for(let R=1;R<U;R++){B=e[R],R===U-1?G?H=e[1]:H=void 0:H=e[R+1];const k=c;if(Xe(J,B,k),f.copy(k).multiplyScalar(Z),x.copy(B).sub(f),T.copy(B).add(f),K=$+ie,re=!1,H!==void 0){Xe(B,H,h),f.copy(h).multiplyScalar(Z),E.copy(B).sub(f),L.copy(B).add(f),se=!0,f.subVectors(H,J),k.dot(f)<0&&(se=!1),R===1&&(xe=se),f.subVectors(H,B),f.normalize();const O=Math.abs(k.dot(f));if(O>Number.EPSILON){const Y=Z/O;f.multiplyScalar(-Y),u.subVectors(B,J),d.copy(u).setLength(Y).add(f),v.copy(d).negate();const Q=d.length(),le=u.length();u.divideScalar(le),g.subVectors(H,B);const ge=g.length();if(g.divideScalar(ge),u.dot(v)<le&&g.dot(v)<ge&&(re=!0),A.copy(d).add(B),v.add(B),re){const pe=se?p:m,q=(A.x-pe.x)*(v.y-pe.y)-(A.y-pe.y)*(v.x-pe.x);(se&&q<0||!se&&q>0)&&v.copy(pe)}switch(he=!1,re?se?(L.copy(v),T.copy(v)):(E.copy(v),x.copy(v)):I(),t.strokeLineJoin){case"bevel":C(se,re,K);break;case"round":z(se,re),se?D(B,x,E,K,0):D(B,L,T,K,1);break;case"miter":case"miter-clip":default:const pe=Z*t.strokeMiterLimit/Q;if(pe<1)if(t.strokeLineJoin!=="miter-clip"){C(se,re,K);break}else z(se,re),se?(g.subVectors(A,x).multiplyScalar(pe).add(x),S.subVectors(A,E).multiplyScalar(pe).add(E),F(x,K,0),F(g,K,0),F(B,K,.5),F(B,K,.5),F(g,K,0),F(S,K,0),F(B,K,.5),F(S,K,0),F(E,K,0)):(g.subVectors(A,T).multiplyScalar(pe).add(T),S.subVectors(A,L).multiplyScalar(pe).add(L),F(T,K,1),F(g,K,1),F(B,K,.5),F(B,K,.5),F(g,K,1),F(S,K,1),F(B,K,.5),F(S,K,1),F(L,K,1));else re?(se?(F(p,$,1),F(m,$,0),F(A,K,0),F(p,$,1),F(A,K,0),F(v,K,1)):(F(p,$,1),F(m,$,0),F(A,K,1),F(m,$,0),F(v,K,0),F(A,K,1)),se?E.copy(A):L.copy(A)):se?(F(x,K,0),F(A,K,0),F(B,K,.5),F(B,K,.5),F(A,K,0),F(E,K,0)):(F(T,K,1),F(A,K,1),F(B,K,.5),F(B,K,.5),F(A,K,1),F(L,K,1)),he=!0;break}}else I()}else I();!G&&R===U-1&&j(e[0],b,w,se,!0,$),$=K,J=B,m.copy(E),p.copy(L)}if(!G)j(B,x,T,se,!1,K);else if(re&&s){let R=A,k=v;xe!==se&&(R=v,k=A),se?(he||xe)&&(k.toArray(s,0),k.toArray(s,9),he&&R.toArray(s,3)):(he||!xe)&&(k.toArray(s,3),k.toArray(s,9),he&&R.toArray(s,0))}if(s){const R=[new ue,new ue,new ue],k=l*3;for(let O=k;O<Ie;O+=9)R[0].set(s[O],s[O+1]),R[1].set(s[O+3],s[O+4]),R[2].set(s[O+6],s[O+7]),qn.area(R)<0&&(s[O+3]=R[0].x,s[O+4]=R[0].y)}return _e;function Xe(R,k,O){return O.subVectors(k,R),O.set(-O.y,O.x).normalize()}function F(R,k,O){s&&(s[Ie]=R.x,s[Ie+1]=R.y,s[Ie+2]=0,a&&(a[Ie]=0,a[Ie+1]=0,a[Ie+2]=1),Ie+=3,o&&(o[Ne]=k,o[Ne+1]=O,Ne+=2)),_e+=3}function D(R,k,O,Y,Q){c.copy(k).sub(R).normalize(),h.copy(O).sub(R).normalize();let le=Math.PI;const ge=c.dot(h);Math.abs(ge)<1&&(le=Math.abs(Math.acos(ge))),le/=n,f.copy(k);for(let pe=0,q=n-1;pe<q;pe++)u.copy(f).rotateAround(R,le),F(f,Y,Q),F(u,Y,Q),F(R,Y,.5),f.copy(u);F(f,Y,Q),F(O,Y,Q),F(R,Y,.5)}function I(){F(p,$,1),F(m,$,0),F(x,K,0),F(p,$,1),F(x,K,0),F(T,K,1)}function C(R,k,O){k?R?(F(p,$,1),F(m,$,0),F(x,K,0),F(p,$,1),F(x,K,0),F(v,K,1),F(x,O,0),F(E,O,0),F(v,O,.5)):(F(p,$,1),F(m,$,0),F(T,K,1),F(m,$,0),F(v,K,0),F(T,K,1),F(T,O,1),F(v,O,0),F(L,O,1)):R?(F(x,O,0),F(E,O,0),F(B,O,.5)):(F(T,O,1),F(L,O,0),F(B,O,.5))}function z(R,k){k&&(R?(F(p,$,1),F(m,$,0),F(x,K,0),F(p,$,1),F(x,K,0),F(v,K,1),F(x,$,0),F(B,K,.5),F(v,K,1),F(B,K,.5),F(E,$,0),F(v,K,1)):(F(p,$,1),F(m,$,0),F(T,K,1),F(m,$,0),F(v,K,0),F(T,K,1),F(T,$,1),F(v,K,0),F(B,K,.5),F(B,K,.5),F(v,K,0),F(L,$,1)))}function j(R,k,O,Y,Q,le){switch(t.strokeLineCap){case"round":Q?D(R,O,k,le,.5):D(R,k,O,le,.5);break;case"square":if(Q)c.subVectors(k,R),h.set(c.y,-c.x),f.addVectors(c,h).add(R),u.subVectors(h,c).add(R),Y?(f.toArray(s,3),u.toArray(s,0),u.toArray(s,9)):(f.toArray(s,3),o[7]===1?u.toArray(s,9):f.toArray(s,9),u.toArray(s,0));else{c.subVectors(O,R),h.set(c.y,-c.x),f.addVectors(c,h).add(R),u.subVectors(h,c).add(R);const ge=s.length;Y?(f.toArray(s,ge-3),u.toArray(s,ge-6),u.toArray(s,ge-12)):(u.toArray(s,ge-6),f.toArray(s,ge-3),u.toArray(s,ge-12))}break}}function me(R){let k=!1;for(let Y=1,Q=R.length-1;Y<Q;Y++)if(R[Y].distanceTo(R[Y+1])<r){k=!0;break}if(!k)return R;const O=[];O.push(R[0]);for(let Y=1,Q=R.length-1;Y<Q;Y++)R[Y].distanceTo(R[Y+1])>=r&&O.push(R[Y]);return O.push(R[R.length-1]),O}}}const lu=/^\s*url\(\s*(?:["']\s*)?#([^)'"\s]+)(?:\s*["'])?\s*\)\s*$/;function lv(i,e,t=256){if(!i||!Array.isArray(i.stops)||i.stops.length===0)return null;const n=e.userData.transform,r=i.gradientUnits==="objectBoundingBox";let s=null;if(r&&(s=cv(e,n),s===null))return null;function a(f,u,d){d.set(f,u,1),i.gradientTransform&&d.applyMatrix3(i.gradientTransform),r&&d.set(s.minX+d.x*s.width,s.minY+d.y*s.height,1),n&&d.applyMatrix3(n)}const o=document.createElement("canvas");let l;if(i.type==="linearGradient"){o.width=t,o.height=1;const f=o.getContext("2d"),u=f.createLinearGradient(0,0,t,0);cu(u,i.stops),f.fillStyle=u,f.fillRect(0,0,t,1);const d=new N,g=new N;a(i.x1,i.y1,d),a(i.x2,i.y2,g);const S=g.x-d.x,m=g.y-d.y,p=S*S+m*m||1e-20,b=S/p,w=m/p,x=-(b*d.x+w*d.y);l=new We().set(b,w,x,0,0,.5,0,0,1)}else{let f=i.cx,u=i.cy,d=i.fx,g=i.fy,S=i.r;if(i.gradientTransform){const v=new N;v.set(f,u,1).applyMatrix3(i.gradientTransform),f=v.x,u=v.y,v.set(d,g,1).applyMatrix3(i.gradientTransform),d=v.x,g=v.y}if(r&&(f=s.minX+f*s.width,u=s.minY+u*s.height,d=s.minX+d*s.width,g=s.minY+g*s.height,S=S*Math.sqrt((s.width*s.width+s.height*s.height)/2)),S<=0)return null;o.width=t,o.height=t;const m=o.getContext("2d"),p=f-S,b=u-S,w=2*S,x=t/w;m.setTransform(x,0,0,x,-p*x,-b*x);const T=m.createRadialGradient(d,g,0,f,u,S);cu(T,i.stops),m.fillStyle=T,m.fillRect(p,b,w,w);const E=n?n.clone().invert():new We;l=new We().set(1/w,0,-p/w,0,1/w,-b/w,0,0,1).multiply(E)}const c=new ro(o);c.colorSpace=Ar,c.flipY=!1,c.matrixAutoUpdate=!1,c.matrix=l;const h=i.spreadMethod==="reflect"?Fr:i.spreadMethod==="repeat"?Nr:_n;return c.wrapS=h,c.wrapT=h,c}function cv(i,e){const t=e?e.clone().invert():null,n=new ue,r=new Mc;for(const s of i.subPaths)for(const a of s.getPoints())n.copy(a),t&&n.applyMatrix3(t),r.expandByPoint(n);return r.isEmpty()?null:{minX:r.min.x,minY:r.min.y,width:r.max.x-r.min.x,height:r.max.y-r.min.y}}function cu(i,e){const t=new qe;for(const n of e){let r=n.color;if(n.opacity<1){t.setStyle(n.color,Ar);const s=/rgb\(([^)]+)\)/.exec(t.getStyle(Ar));s&&(r=`rgba(${s[1]},${n.opacity})`)}i.addColorStop(Math.max(0,Math.min(1,n.offset)),r)}}const Fo={width:64,height:64},uu="M32.3 17.92q.54-.07 1.03.17c.42.21.65.58.73.96q.1.54-.1 1.02l-.18.74a13 13 0 0 1 7.57 3.76l.1.11q3.79-.23 7.58.01l1 .09q3.45.33 5.44 1.22c1.52.68 2.48 1.67 2.62 3 .15 1.48-.71 3.05-2.3 4.63a28 28 0 0 1-5.93 4.31A53 53 0 0 1 43 41.2v.01l-.03.01q-.72 1.09-1.63 2.01a12.9 12.9 0 0 1-16.19 1.83c-2.67.28-5.55.5-8.23.5h-.08c-2.8 0-5.12-.23-6.85-.7-2.08-.56-3.51-1.53-3.95-3q-.43-1.5.43-3.05l.11-.2c.6-.98 1.53-1.9 2.6-2.75 1.17-.9 2.52-1.73 3.88-2.46a42 42 0 0 1 6.44-2.8 13 13 0 0 1 4-6.59l-.58-.41v-.01h-.01a1.7 1.7 0 0 1-.66-1.67c.06-.44.3-.75.62-.94.3-.18.65-.24.96-.22h.09l1.95.3.6-1.52c.02-.07.1-.27.27-.48s.46-.48.89-.54h.01a1.5 1.5 0 0 1 1.24.4l.93.83 1.52-1.38q.41-.37.97-.44m7.33 24.48a48 48 0 0 1-6.28 1.54c-1.3.22-3 .48-4.95.73a11.1 11.1 0 0 0 11.23-2.27m9.28-15.92q-3.01-.2-6.02-.07.51.75.92 1.59c1.08.1 1.94.47 2.25 1.32.25.68-.01 1.36-.29 1.84-.22.39-.5.72-.72.96v.01l-.18.18-.14.13-.2.21-.72.76v-.06l-.37.34-.01-.05c-2.28 1.84-5.57 3.37-9.46 4.4a36 36 0 0 1-11.83 1.23l.01.02-.43-.06v.02l-.5-.09.02.04-.7-.15h-.01l-.2-.05-.15-.03-.1-.02q-.9-.22-1.5-.59a2 2 0 0 1-.82-.98l-.05-.18c-.14-.69.2-1.28.54-1.69.26-.3.56-.55.8-.73q-.03-1.08.06-2.16a40 40 0 0 0-4.36 1.9l-.7.37c-4.03 2.14-5.5 3.82-6.02 4.78-.36.65-.42 1.19-.28 1.67l.06.17c.19.41.66.92 1.85 1.36 1.36.5 3.6.88 7.19.88h.08c2.36 0 4.9-.17 7.3-.4l.03-.01.57-.06.19-.02.3-.03h.1c3.02-.34 5.77-.75 7.63-1.05l1.14-.22a47 47 0 0 0 7.6-2.2v-.01l.17-.06.4-.16.18-.07.55-.22 1.25-.54v.01q2.38-1.05 4.65-2.32a27 27 0 0 0 5.56-4.02c1.34-1.34 1.85-2.43 1.77-3.19-.06-.6-.62-1.23-2.13-1.77a21 21 0 0 0-5.28-.93m-14.95-3.06c.33.38.42.99.34 1.51-.06.45-.33.75-.6.94a2 2 0 0 1-.8.3h-.09l-3 .13-2.3 1.44h-.02q-.46.27-1 .26a3 3 0 0 1-.5-.05c-.4-.1-.66-.34-.83-.6-.15-.23-.23-.5-.25-.7v-.08l-.03-1.41a11.6 11.6 0 0 0-3.73 6.2c-.45 1.99-.36 4.06.25 6q.34.06.75.1c3.17.33 7.42-.1 11.37-1.14 4.25-1.14 7.62-2.85 9.61-4.8q-.19-.9-.51-1.77h-.04l-.12-.33-.09-.25a11 11 0 0 0-1.87-2.88l-.03-.04-.02-.02-.83-.84a11 11 0 0 0-6.21-2.82zm-3.72-1.64-.1.09h-.01l-.31.29-.2-.19-.2-.16-1.42-1.3-.67 1.74-.13.36-.02.05-.15.38-.3-.05h-.01l-.15-.02-1.78-.27.49.34.52.37.15.1.49.35.2.15.01.25.03 1.87 2.47-1.54.11-.07.13-.01 3.08-.14-.9-1.4-.12-.18.05-.21.19-.72.04-.17.09-.36.06-.25v-.01l.1-.39.17-.64z",Rr=256,Rs=Math.SQRT2,hu=[[-1,-1,Rs],[0,-1,1],[1,-1,Rs],[-1,0,1],[1,0,1],[-1,1,Rs],[0,1,1],[1,1,Rs]];class uv{constructor(){this.indices=[],this.keys=[]}get size(){return this.indices.length}push(e,t){let n=this.indices.length;for(this.indices.push(e),this.keys.push(t);n>0;){const r=n-1>>1;if((this.keys[r]??0)<=t)break;this.swap(n,r),n=r}}pop(){const e=this.indices[0]??0,t=this.keys[0]??0,n=this.indices.pop()??0,r=this.keys.pop()??0;if(this.indices.length>0){this.indices[0]=n,this.keys[0]=r;let s=0;for(;;){const a=s*2+1,o=a+1;let l=s;if(a<this.keys.length&&(this.keys[a]??0)<(this.keys[l]??0)&&(l=a),o<this.keys.length&&(this.keys[o]??0)<(this.keys[l]??0)&&(l=o),l===s)break;this.swap(s,l),s=l}}return{index:e,key:t}}swap(e,t){const n=this.indices[e]??0,r=this.keys[e]??0;this.indices[e]=this.indices[t]??0,this.keys[e]=this.keys[t]??0,this.indices[t]=n,this.keys[t]=r}}function hv(i,e){let t=e,n=-1;for(let o=0;o<i.length;o+=1){if(i[o]===0)continue;const l=o%e;t=Math.min(t,l),n=Math.max(n,l)}if(n<0)return-1;const r=(t+n)/2,s=Math.max(1,(n-t)*.12);let a=-1;for(let o=0;o<i.length;o+=1)i[o]===0||Math.abs(o%e-r)>s||(a<0||Math.floor(o/e)>Math.floor(a/e))&&(a=o);return a}function fv(i,e,t){const n=new Float32Array(e*e).fill(1/0);if(t<0||i[t]===0)return n.fill(1);const r=new uv;for(n[t]=0,r.push(t,0);r.size>0;){const{index:o,key:l}=r.pop();if(l>(n[o]??1/0))continue;const c=o%e,h=Math.floor(o/e);for(const[f,u,d]of hu){const g=c+f,S=h+u;if(g<0||S<0||g>=e||S>=e)continue;const m=S*e+g;if(i[m]===0)continue;const p=l+d;p<(n[m]??1/0)&&(n[m]=p,r.push(m,p))}}let s=0;for(const o of n)Number.isFinite(o)&&(s=Math.max(s,o));const a=new Float32Array(e*e).fill(-1);for(let o=0;o<a.length;o+=1){const l=n[o]??1/0;i[o]!==0&&(a[o]=Number.isFinite(l)&&s>0?l/s:1)}for(let o=0;o<4;o+=1){const l=a.slice();for(let c=0;c<a.length;c+=1){if((a[c]??0)>=0)continue;const h=c%e,f=Math.floor(c/e);let u=1/0;for(const[d,g]of hu){const S=h+d,m=f+g;if(S<0||m<0||S>=e||m>=e)continue;const p=a[m*e+S]??-1;p>=0&&(u=Math.min(u,p))}Number.isFinite(u)&&(l[c]=u)}a.set(l)}for(let o=0;o<a.length;o+=1)(a[o]??0)<0&&(a[o]=1);return a}function dv(i){const e=document.createElement("canvas");e.width=i,e.height=i;const t=e.getContext("2d",{willReadFrequently:!0});if(t===null)throw new Error("splash: mark raster canvas is unavailable");t.scale(i/Fo.width,i/Fo.height),t.fill(new Path2D(uu));const n=t.getImageData(0,0,i,i).data,r=new Uint8Array(i*i);for(let s=0;s<r.length;s+=1)r[s]=(n[s*4+3]??0)>96?1:0;return r}function pv(i,e){const t=new Uint8Array(i.length);for(let r=0;r<i.length;r+=1)t[r]=Math.round(Math.min(1,Math.max(0,i[r]??1))*255);const n=new io(t,e,e,Br,Kt);return n.magFilter=Ct,n.minFilter=Ct,n.generateMipmaps=!1,n.needsUpdate=!0,n}function mv(i){var f,u;const{width:e,height:t}=Fo,r=new No().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${e} ${t}"><path d="${uu}"/></svg>`).paths.flatMap(d=>d.toShapes().map(g=>new vs(g,{depth:.9,bevelEnabled:!0,bevelSegments:5,bevelSize:.22,bevelThickness:.38,curveSegments:14}))),s=Ro(r,!1);for(const d of r)d.dispose();const a=s.getAttribute("position"),o=new Float32Array(a.count*2);for(let d=0;d<a.count;d+=1)o[d*2]=a.getX(d)/e,o[d*2+1]=a.getY(d)/t;s.setAttribute("aMarkUv",new Zt(o,2)),s.computeBoundingBox();const l=new N,c=new N;(f=s.boundingBox)==null||f.getCenter(l),(u=s.boundingBox)==null||u.getSize(c),s.translate(-l.x,-l.y,-l.z),s.rotateX(Math.PI);const h=i/c.x;return s.scale(h,h,h),s.computeBoundingBox(),{geometry:s,project:(d,g,S)=>new N((d*e-l.x)*h,-(g*t-l.y)*h,S)}}function gv(i,e,t,n,r){const s=[];for(let a=0;a<i.length;a+=1)i[a]!==0&&s.push(a);return s.length===0?[]:Array.from({length:n},()=>{const a=s[Math.floor(r()*s.length)]??0;return{u:(a%t+.5)/t,v:(Math.floor(a/t)+.5)/t,travel:e[a]??1}})}function vv(i,e,t,n){const r=Math.min(1,Math.max(0,i/n));let s=0,a=1;for(let o=0;o<24;o+=1){const l=(s+a)/2;l*l*(3-2*l)<r?s=l:a=l}return e+(s+a)/2*t}const xv=318,fu=400,_v=330,du=2*Math.PI/3/fu,mi=[1.7,.07,.05];function Cs(i,e,t){const n=Math.min(1,Math.max(0,(t-i)/(e-i)));return n*n*(3-2*n)}function at(i,e,t=0){const n=i.getAttribute("position").count,r=new Float32Array(n*4);for(let s=0;s<n;s+=1)r.set([e[0],e[1],e[2],t],s*4);return i.setAttribute("aGlow",new Zt(r,4)),i}function en(i){const e=Ro(i,!1);for(const t of i)t.dispose();return e}function Mv(i,e,t,n,r){const s=e.clone().sub(i),a=new Tt(n,t,s.length(),r);a.applyQuaternion(new kn().setFromUnitVectors(new N(0,1,0),s.clone().normalize()));const o=i.clone().add(e).multiplyScalar(.5);return a.translate(o.x,o.y,o.z),a}function Cr(i,e,t){return Array.from({length:t+1},(n,r)=>i.clone().lerp(e,r/t))}function pu(i,e){return i.map(t=>new N(t.x,t.y,typeof e=="number"?e:e(t.y)))}function Sv(){const i=xv,e=[],t=(a,o,l,c)=>{e.push(new Fi(c,56,32).translate(a,o,l))};t(0,63,0,17);for(let a=0;a<5;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6;t(Math.cos(o)*6.2,94+a*14,Math.sin(o)*6.2,4.3)}t(0,179,0,15.3),t(0,233,0,5.6);const n=[];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6,l=Math.cos(o)*6.2,c=Math.sin(o)*6.2;n.push(new Tt(3,3,182,24).translate(l,91,c));const h=o+Math.PI/3;n.push(Mv(new N(Math.cos(h)*24,0,Math.sin(h)*24),new N(Math.cos(h)*6,50,Math.sin(h)*6),2.9,2.3,20))}n.push(new Tt(4.2,4.6,54,28).translate(0,206,0));const r=[[238,262,2.6,2.2],[262,288,1.6,1.3],[288,306,.9,.6],[306,i,.35,.08]];for(const[a,o,l,c]of r)n.push(new Tt(c,l,o-a,16).translate(0,(a+o)/2,0)),n.push(new Tt(l+.6,l+.6,.7,20).translate(0,a+.35,0));const s=[{offset:[0,i+.4,0],color:mi,radius:.9,kind:0,trail:0}];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3);s.push({offset:[Math.cos(o)*1.9,288.6,Math.sin(o)*1.9],color:mi,radius:.6,kind:0,trail:0}),s.push({offset:[Math.cos(o)*3.4,262.6,Math.sin(o)*3.4],color:mi,radius:.6,kind:0,trail:0})}return{surfaces:[{defines:["PEARL_SPHERE"],geometry:en(e)},{defines:["PEARL_COLUMN"],geometry:en(n)}],outlines:[],lights:s}}function yv(){const i=fu,{radius:e}=Lo.twist,t=90,n=132,r=[],s=[],a=u=>{const d=u/t*i,g=e*(1-.42*(d/i)**1.2);for(let S=0;S<n;S+=1){const m=S/n*Math.PI*2,p=g*(1+.085*Math.cos(3*(m-du*d)));r.push(Math.cos(m)*p,d,Math.sin(m)*p)}};for(let u=0;u<=t;u+=1)a(u);for(let u=0;u<t;u+=1)for(let d=0;d<n;d+=1){const g=u*n+d,S=u*n+(d+1)%n;s.push(g,g+n,S,S,g+n,S+n)}const o=r.length/3;a(t);const l=r.length/3;r.push(0,i,0);for(let u=0;u<n;u+=1)s.push(l,o+(u+1)%n,o+u);const c=new xt;c.setAttribute("position",new et(r,3)),c.setIndex(s),c.computeVertexNormals();const h=e*.58,f=Array.from({length:97},(u,d)=>{const g=d/96*Math.PI*2;return new N(Math.cos(g)*(h+.6),i-1.2,Math.sin(g)*(h+.6))});return{surfaces:[{defines:["TWIST"],geometry:c},{defines:["PEARL_COLUMN"],geometry:new Tt(.25,1.1,26,12).translate(0,i+13,0)}],outlines:[{color:[2,.1,.07],radius:.5,points:f}],lights:[{offset:[0,i+26.4,0],color:mi,radius:.9,kind:0,trail:0}]}}function bv(){const i=_v,e=52,t=.72,n=new po;n.moveTo(-26,0),n.lineTo(26,0),n.lineTo(19,i),n.lineTo(-19,i),n.closePath();const r=new ui;r.moveTo(-15,268),r.lineTo(15,268),r.lineTo(12,302),r.lineTo(-12,302),r.closePath(),n.holes.push(r);const s=new vs(n,{depth:e,bevelEnabled:!1,steps:1});s.translate(0,0,-e/2);const a=s.getAttribute("position");for(let c=0;c<a.count;c+=1)a.setZ(c,a.getZ(c)*(1-t*a.getY(c)/i));s.computeVertexNormals();const o=c=>e/2*(1-t*c/i)+.3,l=[...Cr(new ue(-15,268),new ue(15,268),20),...Cr(new ue(15,268),new ue(12,302),16),...Cr(new ue(12,302),new ue(-12,302),20),...Cr(new ue(-12,302),new ue(-15,268),16)];return{surfaces:[{defines:["PLANAR"],geometry:s}],outlines:[{color:[2.1,.32,.08],radius:.45,points:pu(l,o)},{color:[.2,1,1.5],radius:.3,points:pu(Cr(new ue(-19,i),new ue(19,i),30),o)}],lights:[{offset:[-18,i+.6,0],color:mi,radius:.9,kind:0,trail:0},{offset:[18,i+.6,0],color:mi,radius:.9,kind:0,trail:0}]}}function Ev(i){const n=[],r=[],s=[];for(const o of i){const l=Math.cos(o.yaw),c=Math.sin(o.yaw),h=Array.from({length:73},(m,p)=>{const b=p/72*Math.PI*2,w=o.radiusX*Math.sign(Math.cos(b))*Math.abs(Math.cos(b))**.77,x=o.radiusZ*Math.sign(Math.sin(b))*Math.abs(Math.sin(b))**.77;return{x:w*l-x*c,z:w*c+x*l}}),f=[0];for(let m=1;m<=72;m+=1){const p=h[m-1]??{x:0,z:0},b=h[m]??{x:0,z:0};f.push((f[m-1]??0)+Math.hypot(b.x-p.x,b.z-p.z))}const u=n.length/3;for(let m=0;m<=14;m+=1){const p=m/14;h.forEach((b,w)=>{n.push(o.x+b.x+o.leanX*p,p*o.height,o.z+b.z+o.leanZ*p),r.push(f[w]??0,p*o.height)})}const d=73;for(let m=0;m<14;m+=1)for(let p=0;p<72;p+=1){const b=u+m*d+p;s.push(b,b+d,b+1,b+1,b+d,b+d+1)}const g=n.length/3;h.forEach(m=>{n.push(o.x+m.x+o.leanX,o.height,o.z+m.z+o.leanZ),r.push(0,o.height)});const S=n.length/3;n.push(o.x+o.leanX,o.height,o.z+o.leanZ),r.push(0,o.height);for(let m=0;m<72;m+=1)s.push(S,g+m+1,g+m)}const a=new xt;return a.setAttribute("position",new et(n,3)),a.setAttribute("aFacade",new et(r,2)),a.setIndex(s),a.computeVertexNormals(),a}function wv(i){return en(i.map(e=>{const t=new Tt(e.radius,e.radius,e.height,56).translate(0,e.height/2,0),n=t.getAttribute("position"),r=t.getAttribute("uv"),s=new Float32Array(n.count*2);for(let a=0;a<n.count;a+=1)s[a*2]=r.getX(a)*Math.PI*2*e.radius,s[a*2+1]=n.getY(a);return t.setAttribute("aFacade",new Zt(s,2)),t.deleteAttribute("uv"),t.translate(e.x,0,e.z)}))}function Tv(){return en(eu.map(i=>new Ke(i.width,tu,i.depth).translate(0,tu/2,0).rotateY(i.yaw).translate(i.x,0,i.z)))}function Ps(i){const e=(i-pn.west)/(pn.east-pn.west),t=Math.max(0,1-(2*e-1)**2);return{height:Ot.deck+Ot.rise*t,half:(Ot.width/2-2)*(1-.35*t)}}function Av(){const{z:i,deck:e,width:t,from:n,to:r}=Ot,{west:s,east:a}=pn,o=[new Ke(r-n,3.4,t).translate((n+r)/2,e-1.7,i)];for(const u of[s-8,a+8])o.push(new Ke(12,e-3.4,t+4).translate(u,(e-3.4)/2,i));for(let u=n+12;u<s-20;u+=34)o.push(new Ke(3,e-3.4,8).translate(u,(e-3.4)/2,i));for(let u=a+30;u<r-6;u+=34)o.push(new Ke(3,e-3.4,8).translate(u,(e-3.4)/2,i));const l=[];for(const u of[-1,1]){const d=Array.from({length:49},(g,S)=>{const m=s+S/48*(a-s),p=Ps(m);return new N(m,p.height,i+u*p.half)});l.push(new _s(new fo(d),96,1.7,8,!1))}for(const u of[.3,.4,.5,.6,.7]){const d=s+u*(a-s),g=Ps(d);o.push(new Ke(1.2,1.2,g.half*2).translate(d,g.height,i))}const c=[];for(let u=s+20;u<a-10;u+=20){const d=Ps(u);for(const g of[-1,1])c.push(new Ke(.3,d.height-e,.3).translate(u,(d.height+e)/2,i+g*d.half))}const h=[-1,1].map(u=>new Ke(r-n,.3,.3).translate((n+r)/2,e-.5,i+u*t/2)),f=Ps((s+a)/2);return{structure:en(o),ribs:en(l),hangers:en(c),strips:en(h),lights:[-1,1].map(u=>({offset:[(s+a)/2,f.height+2,i+u*f.half],color:mi,radius:.9,kind:0,trail:0}))}}function Rv(){const i=new Tt(.22,.32,3.2,6).translate(0,1.6,0).toNonIndexed(),e=new vo(2.6,1).scale(1,1.2,1).translate(0,5.4,0);return en([i,e])}const Cv=[{offset:[-.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[0,.12,-2.26],color:[1.6,.06,.04],radius:.2,kind:2,trail:1.1},{offset:[-1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[0,-.6,-.5],color:[.06,.32,.6],radius:1.3,kind:0,trail:0}],Pv=[{offset:[-1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[-1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[0,-2,-1.2],color:[.7,.28,.06],radius:1.6,kind:0,trail:0}],Lv=[{offset:[0,12.4,6],color:[1.5,1.45,1.35],radius:.35,kind:0,trail:0},{offset:[-4.6,2.8,19],color:[1.6,.07,.05],radius:.3,kind:1,trail:0},{offset:[4.6,2.8,19],color:[.1,1.4,.5],radius:.3,kind:1,trail:0},{offset:[0,3.2,-23.2],color:[1.4,1.35,1.25],radius:.3,kind:2,trail:0}];function Iv(){const i=new Ke(1.9,.62,4.4,4,2,10),e=i.getAttribute("position");for(let r=0;r<e.count;r+=1){const s=e.getX(r),a=e.getY(r),l=(e.getZ(r)+2.2)/4.4,c=Cs(.55,1,l),h=Cs(.25,0,l);e.setX(r,s*(1-.42*c-.12*h)),e.setY(r,(a>0?a*(1-.55*c):a*(1-.3*c))-.05*c)}i.computeVertexNormals();const t=[at(i,[0,0,0])],n=new Fi(1,20,10,0,Math.PI*2,0,Math.PI/2).scale(.62,.36,1.25).translate(0,.27,.25);t.push(at(n,[.004,.02,.03],1));for(const r of[-1,1]){t.push(at(new Tt(.33,.29,1.7,16).rotateX(Math.PI/2).translate(r*1.12,-.06,-.8),[0,0,0]));const s=new Tt(.27,.27,.05,16).rotateX(Math.PI/2).translate(r*1.12,-.06,-1.66);t.push(at(s,[.35,1.6,2.4])),t.push(at(new Ke(.5,.03,1.2).translate(r*1.12,-.37,-.8),[.1,.6,1])),t.push(at(new Ke(.42,.07,.05).translate(r*.5,-.02,2.17),[3,2.9,2.7])),t.push(at(new Ke(.06,.5,.7).rotateZ(r*.35).translate(r*.45,.45,-1.8),[0,0,0]))}return t.push(at(new Ke(1.4,.06,.04).translate(0,.12,-2.21),[2.8,.12,.08])),en(t)}function Dv(){const i=[at(new Ke(3.4,2,2.6).translate(0,.1,4),[0,0,0]),at(new Ke(3,.7,.05).translate(0,.55,5.32),[.01,.03,.04],1),at(new Ke(3.6,2.6,7.6).translate(0,.2,-1.3),[0,0,0])];for(let e=0;e<7;e+=1)i.push(at(new Ke(3.72,2.7,.12).translate(0,.2,-4.7+e*1.13),[0,0,0]));for(const e of[-1,1]){for(const t of[-1,1])i.push(at(new Tt(.5,.42,.7,16).translate(e*1.55,-1.45,-1.3+t*3),[0,0,0])),i.push(at(new Tt(.36,.36,.05,16).translate(e*1.55,-1.82,-1.3+t*3),[2.4,.9,.2])),i.push(at(new Ke(.16,.16,.16).translate(e*1.85,1.3,t>0?4.8:-5),[2.6,1.3,.2]));i.push(at(new Ke(.6,.16,.05).translate(e*1.1,-.3,5.32),[3,2.9,2.7])),i.push(at(new Ke(.5,.18,.05).translate(e*1.4,.4,-5.12),[2.8,.12,.08]))}return en(i)}function Uv(){const i=new Ke(10,3.4,46,2,2,12).translate(0,.5,0),e=i.getAttribute("position");for(let r=0;r<e.count;r+=1){const s=(e.getZ(r)+23)/46;e.setX(r,e.getX(r)*(1-.82*Cs(.72,1,s)-.1*Cs(.08,0,s)))}i.computeVertexNormals();const t=[at(i,[0,0,0])],n=[{width:8.8,height:2.6,depth:34,base:2.2,z:-2,led:[2,.3,1]},{width:7.6,height:2.4,depth:26,base:4.8,z:-4,led:[.3,1.4,2]},{width:5.8,height:2,depth:15,base:7.2,z:-6,led:[2,1.3,.6]}];for(const r of n){const s=new Ke(r.width,r.height,r.depth);t.push(at(s.translate(0,r.base+r.height/2,r.z),[0,0,0]));for(const a of[-1,1]){const o=new Ke(.05,r.height*.45,r.depth*.88);t.push(at(o.translate(a*(r.width/2+.03),r.base+r.height*.56,r.z),[1.4,1,.6]));const l=new Ke(.12,.12,r.depth);t.push(at(l.translate(a*r.width/2,r.base+r.height,r.z),r.led))}for(const a of[-1,1]){const o=new Ke(r.width,.12,.12);t.push(at(o.translate(0,r.base+r.height,r.z+a*r.depth/2),r.led))}}return t.push(at(new Tt(.12,.18,3.2,8).translate(0,10.8,6),[0,0,0])),en(t)}const Nv=[{offset:[-10.6,4.2,0],color:[1.6,.07,.05],radius:.4,kind:0,trail:0},{offset:[-10.6,-4.2,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[-10.6,0,4.2],color:[.1,1.2,.8],radius:.35,kind:0,trail:0},{offset:[-10.6,0,-4.2],color:[1.6,.07,.05],radius:.35,kind:0,trail:0},{offset:[11.9,0,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[0,-6,0],color:[1,.7,.45],radius:.9,kind:0,trail:0}],rn={y:.4,z:4.9,width:13,height:4.4};function Fv(i,e){const t=i/2,n=[at(new Fi(1,48,24).scale(t,e,e),[0,0,0])],r=e*.55,s=[[r,0,.16,3.4],[-r,0,.16,3.4],[0,r,3.4,.16],[0,-r,3.4,.16]];for(const[o,l,c,h]of s)n.push(at(new Ke(2.8,h,c).translate(-t+1.6,o,l),[0,0,0]));n.push(at(new Ke(5.2,1.4,2).translate(0,-e-.55,0),[0,0,0])),n.push(at(new Ke(4.6,.42,2.06).translate(0,-e-.4,0),[1.4,.95,.55]));const a=new Ke(rn.width+.5,rn.height+.5,.3);return n.push(at(a.translate(0,rn.y,rn.z-.2),[0,0,0])),n.push(at(new Ke(.3,.3,1.6).translate(-4,rn.y,rn.z-1.1),[0,0,0])),n.push(at(new Ke(.3,.3,1.6).translate(4,rn.y,rn.z-1.1),[0,0,0])),en(n)}const Ls='"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',Is='"Montserrat", "Segoe UI", "Helvetica Neue", sans-serif',Pr={width:1024,height:512};function Ov(i,e){const t=document.createElement("canvas");t.width=i,t.height=e;const n=t.getContext("2d");if(n===null)throw new Error("splash: screen artwork canvas is unavailable");return{canvas:t,context:n}}function Bv(i,e,t,n){const{width:r,height:s}=Pr;if(i.save(),i.beginPath(),i.rect(e,t,r,s),i.clip(),i.translate(e,t),i.textBaseline="middle",n===0){const a=i.createLinearGradient(0,0,r,s);a.addColorStop(0,"#3a0326"),a.addColorStop(.55,"#1a0636"),a.addColorStop(1,"#03141f"),i.fillStyle=a,i.fillRect(0,0,r,s);for(let o=0;o<6;o+=1)i.strokeStyle=`rgba(255, 79, 160, ${.5-o*.07})`,i.lineWidth=3,i.beginPath(),i.arc(780,250,70+o*34,0,Math.PI*2),i.stroke();i.font=`800 132px ${Ls}`,i.fillStyle="#fff4fb",i.shadowColor="#ff4fa0",i.shadowBlur=30,i.fillText("未来已来",70,210),i.font=`600 40px ${Is}`,i.fillStyle="#ff9fd0",i.shadowBlur=12,i.fillText("THE FUTURE IS ONLINE",76,340)}else if(n===1){i.fillStyle="#01141c",i.fillRect(0,0,r,s);for(let a=0;a<7;a+=1){i.strokeStyle=`rgba(41, 214, 255, ${.75-a*.09})`,i.lineWidth=3,i.beginPath();for(let o=0;o<=r;o+=8){const l=330+Math.sin(o*.012+a*.7)*(40+a*9)*Math.sin(o*.003+.4);o===0?i.moveTo(o,l):i.lineTo(o,l)}i.stroke()}i.font=`800 120px ${Is}`,i.fillStyle="#e4fbff",i.shadowColor="#29d6ff",i.shadowBlur=28,i.fillText("AI",70,150),i.font=`700 96px ${Ls}`,i.fillText("智能驱动",250,150)}else if(n===2){const a=i.createLinearGradient(0,0,0,s);a.addColorStop(0,"#2b0605"),a.addColorStop(1,"#120203"),i.fillStyle=a,i.fillRect(0,0,r,s);for(let o=0;o<14;o+=1){const l=60+o*37%11*22;i.fillStyle=o%3===0?"#ffae2e":"#ff3a2b",i.globalAlpha=.7,i.fillRect(560+o*30,s-60-l,18,l)}i.globalAlpha=1,i.font=`800 150px ${Is}`,i.fillStyle="#fff2d8",i.shadowColor="#ff6a2b",i.shadowBlur=30,i.fillText("24H",70,190),i.font=`700 92px ${Ls}`,i.fillText("全天营业",74,350)}else{i.fillStyle="#0a0216",i.fillRect(0,0,r,s),i.strokeStyle="rgba(255, 79, 160, 0.55)",i.lineWidth=2;for(let a=0;a<=16;a+=1)i.beginPath(),i.moveTo(r/2,250),i.lineTo(-400+a*115,s),i.stroke();for(let a=0;a<7;a+=1){const o=250+(a/6)**2*(s-250);i.beginPath(),i.moveTo(0,o),i.lineTo(r,o),i.stroke()}i.font=`800 96px ${Is}`,i.fillStyle="#e4fbff",i.shadowColor="#29d6ff",i.shadowBlur=26,i.fillText("NEURAL LINK",70,120),i.font=`700 64px ${Ls}`,i.fillStyle="#ffd6ea",i.shadowColor="#ff4fa0",i.fillText("神经连接 · 即刻上线",74,210)}i.restore()}function zv(i){const t=Math.ceil(Co/2),{canvas:n,context:r}=Ov(Pr.width*2,Pr.height*t);for(let a=0;a<Co;a+=1)Bv(r,a%2*Pr.width,Math.floor(a/2)*Pr.height,a);const s=new ro(n);return s.colorSpace=Yt,s.anisotropy=i,s.needsUpdate=!0,{texture:s,grid:new ue(2,t)}}const Ds={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class Lr{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Hv=new _o(-1,1,1,-1,0,1);class kv extends xt{constructor(){super(),this.setAttribute("position",new et([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new et([0,2,0,0,2,0],2))}}const Gv=new kv;class mu{constructor(e){this._mesh=new rt(Gv,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Hv)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Oo extends Lr{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Mt?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Sr.clone(e.uniforms),this.material=new Mt({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new mu(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class gu extends Lr{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class Vv extends Lr{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class Wv{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new ue);this._width=n.width,this._height=n.height,t=new It(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Dt}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Oo(Ds),this.copyPass.material.blending=vn,this.timer=new rd}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let r=0,s=this.passes.length;r<s;r++){const a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}gu!==void 0&&(a instanceof gu?n=!0:a instanceof Vv&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new ue);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Xv extends Lr{constructor(e,t,n=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new qe}render(e,t,n){const r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}}const qv={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new qe(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class Xi extends Lr{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e!==void 0?new ue(e.x,e.y):new ue(256,256),this.clearColor=new qe(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new It(s,a,{type:Dt,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let h=0;h<this.nMips;h++){const f=new It(s,a,{type:Dt,depthBuffer:!1});f.texture.name="UnrealBloomPass.h"+h,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const u=new It(s,a,{type:Dt,depthBuffer:!1});u.texture.name="UnrealBloomPass.v"+h,u.texture.generateMipmaps=!1,this.renderTargetsVertical.push(u),s=Math.round(s/2),a=Math.round(a/2)}const o=qv;this.highPassUniforms=Sr.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Mt({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[6,10,14,18,22];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let h=0;h<this.nMips;h++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[h])),this.separableBlurMaterials[h].uniforms.invSize.value=new ue(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new N(1,1,1),new N(1,1,1),new N(1,1,1),new N(1,1,1),new N(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Sr.clone(Ds.uniforms),this.blendMaterial=new Mt({uniforms:this.copyUniforms,vertexShader:Ds.vertexShader,fragmentShader:Ds.fragmentShader,premultipliedAlpha:!0,blending:Qi,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new qe,this._oldClearAlpha=1,this._basic=new hr,this._fsQuad=new mu(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(n,r),this.renderTargetsVertical[s].setSize(n,r),this.separableBlurMaterials[s].uniforms.invSize.value=new ue(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(e,t,n,r,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=Xi.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=Xi.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(n),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=a}_getSeparableBlurMaterial(e){const t=[],n=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(n*n))/n);const r=[],s=[];for(let a=1;a<e;a+=2){const o=t[a],l=a+1<e?t[a+1]:0,c=o+l;r.push((a*o+(a+1)*l)/c),s.push(c)}return new Mt({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new ue(.5,.5)},direction:{value:new ue(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:s}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new Mt({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}}Xi.BlurDirectionX=new ue(1,0),Xi.BlurDirectionY=new ue(0,1);const vu=`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,Yv=`
uniform sampler2D tDiffuse;
uniform float uExposure;
uniform float uTime;
varying vec2 vUv;

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

void main() {
  vec2 centred = vUv - 0.5;
  float radius = dot(centred, centred);
  vec2 fringe = centred * radius * 0.014;
  vec3 color = vec3(
    texture2D(tDiffuse, vUv + fringe).r,
    texture2D(tDiffuse, vUv).g,
    texture2D(tDiffuse, vUv - fringe).b);
  color = acesFilmic(color * uExposure);
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color *= mix(vec3(0.93, 1.0, 1.14), vec3(1.0), smoothstep(0.0, 0.3, luma));
  color *= 1.0 - 0.45 * smoothstep(0.08, 0.42, radius);
  color = srgbEncode(max(color, 0.0));
  color += (hash(gl_FragCoord.xy + fract(uTime * 7.0) * 61.0) - 0.5) * (1.5 / 255.0);
  gl_FragColor = vec4(color, 1.0);
}
`,Zv=`
uniform sampler2D tDiffuse;
varying vec2 vUv;

void main() {
  vec3 color = texture2D(tDiffuse, vUv).rgb;
  color = mix(color, vec3(0.0), vec3(isnan(color)));
  gl_FragColor = vec4(clamp(color, 0.0, 64.0), 1.0);
}
`;function Kv(i,e,t){const n=new It(1,1,{type:Dt,samples:4}),r=new Wv(i,n);r.addPass(new Xv(e,t));const s=new Mt({uniforms:{tDiffuse:{value:null}},vertexShader:vu,fragmentShader:Zv,depthTest:!1,depthWrite:!1}),a=new Oo(s);r.addPass(a);const o=new Xi(new ue(1,1),.55,.38,1);r.addPass(o);const l={value:0},c={value:0},h=new Mt({uniforms:{tDiffuse:{value:null},uExposure:l,uTime:c},vertexShader:vu,fragmentShader:Yv,depthTest:!1,depthWrite:!1}),f=new Oo(h);return r.addPass(f),{composer:r,exposure:l,time:c,setSize:(u,d,g)=>{r.setPixelRatio(g),r.setSize(u,d)},dispose:()=>{a.dispose(),s.dispose(),o.dispose(),f.dispose(),h.dispose(),r.dispose()}}}const xu={finish:()=>{},stop:()=>{}},Bo=1,$v=196869,Jv=1.5,_u=.8,Qv=900,jv=.4,ex=900,Mu=.5,tx=[18,30],zo=48;function Tn(i,e,t,n={},r={}){return new Mt({...r,vertexShader:e,fragmentShader:t,uniforms:{...i,...n}})}function sn(i,e,t,n=new qe(0,0,0)){return Tn(i,Yg,Zg,{uAlbedo:{value:typeof e=="number"?new qe(e,e*.96,e*1.04):e},uEmissive:{value:n},uSheen:{value:t}})}function Ho(i,e,t){const n=new td;n.index=i.index;for(const[r,s]of Object.entries(i.attributes))n.setAttribute(r,s);for(const[r,s]of Object.entries(t))n.setAttribute(r,s);return n.instanceCount=e,n}function Ir(i,e){const t=new Ni(1,1);return t.deleteAttribute("normal"),Ho(t,i,e)}function nx(i,e,t){i.frustumCulled=!1,i.onBeforeRender=n=>{const r=n.getRenderTarget();r===null?n.getDrawingBufferSize(t.value):t.value.set(r.width,r.height),e.uniformsNeedUpdate=!0}}function Us(i,e,t,n,r={}){const s=Tn(i,t,tv,{uViewport:e,...r},{blending:Qi,depthWrite:!1,transparent:!0}),a=new rt(n,s);return nx(a,s,e),a}function Su(i,e,t,n={value:new N}){const r=new Float32Array(t.length*3),s=new Float32Array(t.length*4);return t.forEach((a,o)=>{r.set([a.position.x,a.position.y,a.position.z],o*3),s.set([...a.color,a.radius],o*4)}),Us(i,e,Jg,Ir(t.length,{aHead:new _t(r,3),aLight:new _t(s,4)}),{uLightOffset:n})}function yu(i,e){return i.map(t=>({position:new N(...t.offset).applyMatrix4(e),color:t.color,radius:t.radius}))}function bu(i){return yu(i,new ut)}function ix(i,e){const t=new Ke(1,1,1).translate(0,.5,0),n=new Tt(.5,.5,1,48,1).translate(0,.5,0);return[[Bn.box,t],[Bn.round,n]].map(([r,s])=>{const a=i.tiers.filter(u=>u.form===r),o=new Float32Array(a.length*3),l=new Float32Array(a.length*4),c=new Float32Array(a.length*4);a.forEach((u,d)=>{o.set([u.x,u.y,u.z],d*3),l.set([u.width,u.height,u.depth,u.taper],d*4),c.set([u.seed,u.facade,u.lit,u.trim],d*4)}),s.deleteAttribute("uv");const h=Ho(s,a.length,{aCenter:new _t(o,3),aSize:new _t(l,4),aStyle:new _t(c,4)}),f=new rt(h,Tn(e,kg,Gg,{},{defines:r===Bn.round?{RADIAL:""}:{}}));return f.frustumCulled=!1,f})}function rx(i){const e=new wr(new Ni(3200,5600),{textureWidth:1,textureHeight:1,clipBias:.003,color:14275551,multisample:4,shader:{name:"SplashGround",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uStreet:{value:new dt(Vi.x,Vi.spacing,jc.from,jc.to)},uRiver:{value:new dt(pn.west,pn.east,yt.halfWidth,zo)},uAvenue:{value:new ue(yt.start,yt.end)}},vertexShader:Vg,fragmentShader:Wg}}),t=e.material;if(!(t instanceof Mt))throw new Error("splash: ground reflector has no shader material");Object.assign(t.uniforms,i);const n=e.getRenderTarget().texture;n.generateMipmaps=!0,n.minFilter=zn,e.rotation.x=-Math.PI/2,e.position.set(300,0,-1400);const r=e.onBeforeRender.bind(e),s=new N;return e.onBeforeRender=(a,o,l,...c)=>{if(l instanceof jt){const h=Math.asin(l.getWorldDirection(s).y)-kh.degToRad(l.fov/2);if(h>-.01||l.position.y/Math.tan(-h)>ex)return}i.uDetail.value=0,r(a,o,l,...c),i.uDetail.value=1},e}function sx(i){const e=new rt(new Fi(1600,48,24),Tn(i,Xg,qg,{},{side:zt,depthTest:!1,depthWrite:!1}));return e.renderOrder=-1,e.frustumCulled=!1,e.onBeforeRender=(t,n,r)=>{e.position.copy(r.position),e.updateMatrixWorld()},e}function qi(i,e){const t=new ut,n=new kn,r=new N(0,1,0);return e.forEach((s,a)=>{n.setFromAxisAngle(r,s.yaw??0),i.setMatrixAt(a,t.compose(s.position,n,s.scale))}),i.instanceMatrix.needsUpdate=!0,i}function ax(){const i=Vi.height,e=[new Ke(.22,i,.22).translate(0,i/2,0),new Ke(2.4,.14,.16).translate(-1.15,i-.1,0),new Ke(.9,.2,.42).translate(-2.1,i-.25,0)],t=Ro(e,!1);for(const n of e)n.dispose();return t}function Eu(){const i=[];for(let e=yt.start;e>yt.end;e-=Vi.spacing)i.push({x:-12.4,z:e,side:-1},{x:Vi.x,z:e,side:1});return i}function wu(i,e,t){const n=nu.some(s=>Math.hypot(i-s.x,e-s.z)<s.radius+t+3),r=eu.some(s=>Math.abs(e-s.z)<s.depth/2+t+4&&Math.abs(i-s.x)<s.width/2+t+4);return n||r||Math.abs(e-Ot.z)<Ot.width/2+t+4}function ox(){let i=32485;const e=()=>(i=Math.imul(i,1664525)+1013904223>>>0,i/4294967296),t=[];for(const n of tx)for(let r=yt.start;r>yt.end;r-=8+e()*4){const s=n+(e()-.5)*3,a=.8+e()*.45;if(wu(s,r,3*a))continue;const o=a*(.9+e()*.25);t.push({position:new N(s,0,r),scale:new N(a,o,a),yaw:e()*Math.PI*2})}return t}function lx(i,e,t){const n=sn(e,.05,.25),r=qi(new Di(new Ke(1,1,1).translate(0,.5,0),n,i.roofUnits.length),i.roofUnits.map(u=>({position:new N(u.x,u.y,u.z),scale:new N(u.width,u.height,u.depth)}))),s=qi(new Di(new Tt(.04,1,1,12).translate(0,.5,0),n,i.antennas.length),i.antennas.map(u=>({position:new N(u.x,u.y,u.z),scale:new N(u.radius,u.height,u.radius)}))),a=Eu(),o=qi(new Di(ax(),n,a.length),a.map(u=>({position:new N(u.x,0,u.z),scale:new N(1,1,1),yaw:u.side>0?0:Math.PI}))),l=qi(new Di(new Ke(1,1,1),n,i.screens.length),i.screens.map(u=>({position:new N(u.x-Math.sin(u.yaw)*.25,u.y,u.z-Math.cos(u.yaw)*.25),scale:new N(u.width+.5,u.height+.5,.4),yaw:u.yaw}))),c=sn(e,new qe(.018,.032,.02),.05),h=qi(new Di(Rv(),c,t.length),t),f=new rt(new Ke(.16,.12,yt.start-yt.end).translate(pn.west-.6,1.05,(yt.start+yt.end)/2),sn(e,.02,0,new qe(.3,.25,.19)));return[r,s,o,l,h,f]}function cx(i,e){const t=[],n=(r,s,a,o,l)=>{t.push({position:new N(r,s,a),color:o,radius:l})};for(const r of i.antennas)n(r.x,r.y+r.height,r.z,[1.6,.08,.06],Math.max(.55,r.radius*.5));for(const r of Eu())n(r.x-r.side*2.1,Vi.height-.42,r.z,[1.8,1.25,.8],.4);for(let r=yt.start;r>yt.end;r-=18)wu(zo-10,r,1)||n(zo-10,.9,r,[1.4,1,.65],.22);return e.forEach((r,s)=>{s%3===0&&n(r.position.x+1.2,.4,r.position.z,[1.1,.85,.55],.25)}),t}function Tu(i){const e=new Float32Array(i.length*4),t=new Float32Array(i.length*4);return i.forEach((n,r)=>{e.set([n.origin.x,n.origin.y,n.origin.z,n.speed],r*4),t.set([n.directionX,n.directionZ,n.phase,n.span],r*4)}),{lane:e,motion:t}}const ux={[Gt.spinner]:Cv,[Gt.hauler]:Pv,[Gt.boat]:Lv};function hx(i,e){const t=zg(),n=[],r=[[Gt.spinner,Iv()],[Gt.hauler,Dv()],[Gt.boat,Uv()]];for(const[f,u]of r){const d=t.filter(b=>b.kind===f),{lane:g,motion:S}=Tu(d),m=new Float32Array(d.length*4);d.forEach((b,w)=>{m.set([...b.paint,b.bob],w*4)});const p=new rt(Ho(u,d.length,{aLane:new _t(g,4),aMotion:new _t(S,4),aCraft:new _t(m,4)}),Tn(i,au,ou,{},{defines:{LANE:""}}));p.frustumCulled=!1,n.push(p)}const s=t.flatMap(f=>(ux[f.kind]??[]).map(u=>({lane:f,light:u})));for(const f of Hg())s.push({lane:f,light:{offset:[0,0,0],color:f.headlight?[1.1,1,.9]:[1.2,.06,.04],radius:f.radius,kind:f.headlight?1:2,trail:f.trail}});const{lane:a,motion:o}=Tu(s.map(f=>f.lane)),l=new Float32Array(s.length*4),c=new Float32Array(s.length*4),h=new Float32Array(s.length*2);return s.forEach(({lane:f,light:u},d)=>{l.set([...u.offset,f.bob],d*4),c.set([...u.color,u.radius],d*4),h.set([u.kind,u.trail],d*2)}),n.push(Us(i,e,Qg,Ir(s.length,{aLane:new _t(a,4),aMotion:new _t(o,4),aOffset:new _t(l,4),aLight:new _t(c,4),aKind:new _t(h,2)}))),n}function fx(i,e){const n=new Float32Array(9600);let r=10775;for(let a=0;a<n.length;a+=1)r=Math.imul(r,1664525)+1013904223>>>0,n[a]=r/4294967296;const s=Us(i,e,jg,Ir(2400,{aDrop:new _t(n,4)}),{uRainBox:{value:new N(56,40,56)},uRain:{value:1}});return s.layers.set(Bo),s}function Au(i,e,t,n,r={value:new N}){const s=new Float32Array(e.length*4),a=new Float32Array(e.length*4);e.forEach((l,c)=>{s.set([l.x,l.y,l.z,l.yaw],c*4),a.set([l.width,l.height,l.slot,n],c*4)});const o=new rt(Ir(e.length,{aPanel:new _t(s,4),aShape:new _t(a,4)}),Tn(i,Kg,$g,{uAtlas:{value:t.texture},uGrid:{value:t.grid},uPanelOffset:r}));return o.frustumCulled=!1,o}function Yi(i,e=new ue,t=1,n=0){return{uSeed:{value:i},uAxis:{value:e},uRadius:{value:t},uTwistRate:{value:n}}}function Ns(i,e,t,n){return new rt(e,Tn(i,av,ov,n,{defines:Object.fromEntries(t.map(r=>[r,""]))}))}function ko(i,e,t,n,r){const s=new ar,a={...r,uHazeScale:{value:Mu}};for(const o of e.surfaces)s.add(Ns(i,o.geometry,o.defines,a));for(const o of e.outlines){const l=new fo([...o.points],!1,"centripetal"),c=new _s(l,o.points.length*2,o.radius,6,!1),h=sn(i,.02,0,new qe(...o.color));h.uniforms.uHazeScale={value:Mu},s.add(new rt(c,h))}if(s.position.set(t.x,0,t.z),s.scale.setScalar(t.scale),n){const o=Do(1).position;s.rotation.y=Math.atan2(o.x-t.x,o.z-t.z)}return s.updateMatrixWorld(!0),{group:s,lights:yu(e.lights,s.matrixWorld)}}function dx(i){const{pearl:e,twist:t,opener:n}=Lo,r=Yi(.83,new ue(t.x,t.z),t.radius*t.scale,du/t.scale),s=[ko(i,Sv(),e,!1,Yi(.31)),ko(i,yv(),t,!1,r),ko(i,bv(),n,!0,Yi(.62))],a=Av(),o=new qe(.32,.85,1.25);return{objects:[...s.map(c=>c.group),Ns(i,Ev(wg),["BAKED","CRYSTAL"],Yi(.52)),Ns(i,wv(nu),["BAKED","TANK"],Yi(.21)),Ns(i,Tv(),["TRANSLUCENT"],Yi(.12)),new rt(a.structure,sn(i,.06,.35)),new rt(a.ribs,sn(i,.04,.3,o)),new rt(a.hangers,sn(i,.04,.2,new qe(.08,.22,.32))),new rt(a.strips,sn(i,.02,0,new qe(1.2,.95,.7)))],lights:[...s.flatMap(c=>c.lights),...bu(a.lights)]}}function px(i,e,t){const n=new rt(Fv(Zn.length,Zn.radius),Tn(i,au,ou,{uPaint:{value:new qe(.035,.034,.04)}})),r={value:new N(Zn.x,Zn.y,Zn.z)},s={x:0,y:rn.y,z:rn.z,yaw:0,width:rn.width,height:rn.height,slot:3},a=Au(i,[s],t,1.1,r),o=Su(i,e,bu(Nv),r);return{objects:[n,a,o],update:(l,c)=>{r.value.set(Zn.x+Math.sin(c*.12)*1.5,Zn.y+Math.sin(c*.5)*.4,Zn.z),n.position.copy(r.value)},dispose:()=>{}}}function mx(i,e){var _e;const{x:t,z:n,deck:r}=Eg,s=sn(i,.04,.4),a=new qe(0,0,0),o=new rt(new xs(8.4,.4,12,128),sn(i,.03,.2,a));o.rotation.x=Math.PI/2,o.position.set(t,r+.9,n);const l=new qe(0,0,0),c=new rt(new xs(5.2,.2,10,96),sn(i,.03,.2,l));c.rotation.x=Math.PI/2,c.position.set(t,r+2.5,n);const h=new rt(new Tt(3.1,4.4,2.7,48),s);h.position.set(t,r+1.35,n);const f=new qe(0,0,0),u=new rt(new so(2.7,48),sn(i,.02,.1,f));u.rotation.x=-Math.PI/2,u.position.set(t,r+2.72,n);const d=qi(new Di(new Ke(.3,2.6,2.6).translate(0,1.3,0),s,12),Array.from({length:12},(Ie,Ne)=>{const Xe=Ne/12*Math.PI*2;return{position:new N(t+Math.sin(Xe)*6.8,r,n+Math.cos(Xe)*6.8),scale:new N(1,1,1),yaw:Xe}})),{geometry:g,project:S}=mv(Vt.width),m=dv(Rr),p=fv(m,Rr,hv(m,Rr)),b=pv(p,Rr),w={value:0},x={value:0},T=new rt(g,Tn(i,rv,sv,{uField:{value:b},uIgnite:w,uDormant:x})),E=Do(1).position,L=Math.atan2(E.x-Vt.x,E.z-Vt.z),v=Math.atan2(Vt.y-E.y,Math.hypot(E.x-Vt.x,E.z-Vt.z));T.position.set(Vt.x,Vt.y,Vt.z),T.rotation.set(v,L,0,"YXZ"),T.updateMatrixWorld();const A=r+2.75,U=Vt.y+(((_e=g.boundingBox)==null?void 0:_e.min.y)??-46*.3)*Math.cos(v),G=(Ie,Ne,Xe,F)=>{const D={value:0},I={value:0},C=Xe-A,z=new rt(new Tt(Ne,Ie,C,64,1,!0),Tn(i,nv,iv,{uBeam:D,uBeamReach:I},{blending:Qi,depthWrite:!1,transparent:!0,side:tn}));return z.position.set(t,A+C/2,n),{mesh:z,strength:F,power:D,reach:I}},B=G(1.5,1.1,U+.6,1),J=G(3.4,Vt.width*.46,Vt.y,.32);let H=20900;const Z=()=>(H=Math.imul(H,1664525)+1013904223>>>0,H/4294967296),ie=gv(m,p,Rr,Qv,Z),$=new Float32Array(ie.length*3),K=new Float32Array(ie.length*3),re=new Float32Array(ie.length*3),se=new Float32Array(ie.length*2);ie.forEach((Ie,Ne)=>{const Xe=Z()*Math.PI*2,F=Math.sqrt(Z())*1.2,D=S(Ie.u,Ie.v,.9).applyMatrix4(T.matrixWorld);$.set([t+Math.cos(Xe)*F,A+.4,n+Math.sin(Xe)*F],Ne*3),K.set([t+Math.cos(Xe)*F*1.8,U-3-Z()*5,n+Math.sin(Xe)*F*1.8],Ne*3),re.set([D.x,D.y,D.z],Ne*3);const I=vv(Ie.travel,qt.igniteMs,qt.igniteRampMs,su);se.set([Math.max(qt.sparksMs,I-620-Z()*380),I],Ne*2)});const he={value:0},xe=Us(i,e,ev,Ir(ie.length,{aFrom:new _t($,3),aVia:new _t(K,3),aTo:new _t(re,3),aTiming:new _t(se,2)}),{uTimeline:he});return{objects:[o,c,h,u,d,B.mesh,J.mesh,T,xe],update:(Ie,Ne)=>{const{projectorMs:Xe,projectorRampMs:F,beamMs:D,beamRampMs:I,igniteMs:C,igniteRampMs:z}=qt,j=Wi(Ie,Xe,F),me=Wi(Ie,D,I),R=Wi(Ie,C,z);a.setRGB(2.3*j,.12*j,.09*j),l.setRGB(.25*j,1.2*j,1.7*j),f.setRGB(3.2*j,.9*j,.7*j);for(const O of[B,J])O.power.value=O.strength*j*(1-.35*R),O.reach.value=me*1.04;x.value=Wi(Ie,D+I*.6,500),w.value=R,he.value=Ie;const k=Wi(Ie,C+z-200,1600);T.rotation.y=L+.16*Math.sin(Ne*.42)*k,i.uHolo.value=.22*j+.78*R},dispose:()=>{b.dispose()}}}function gx(i){return i instanceof rt}function vx(i){i.traverse(e=>{if(e instanceof wr){e.dispose(),e.geometry.dispose();return}if(!gx(e))return;e.geometry.dispose();const t=Array.isArray(e.material)?e.material:[e.material];for(const n of t){if(n instanceof Mt)for(const r of Object.values(n.uniforms)){const s=r.value;s instanceof ro&&s.dispose()}n.dispose()}})}function xx(i,e,t){const n=new bg({canvas:i,antialias:!1,powerPreference:"high-performance",stencil:!1});let r=!1;n.debug.onShaderError=(xe,_e,Ie,Ne)=>{r=!0,console.error("Tomato splash: shader compilation failed",xe.getShaderInfoLog(Ie),xe.getShaderInfoLog(Ne))},n.setClearColor($v,1);let s=Math.min(Jv,window.devicePixelRatio||1);n.setPixelRatio(s);const a={uTime:{value:0},uDetail:{value:1},uHazeScale:{value:1},uHoloPos:{value:new N(Vt.x,Vt.y,Vt.z)},uHolo:{value:0},uFogDensity:{value:.0018},uFogFalloff:{value:.0125}},o={value:new ue(1,1)},l=new tf,c=new jt(60,1,1,4600);c.layers.enable(Bo);const h=Ng(),f=ox(),u=zv(n.capabilities.getMaxAnisotropy()),d=rx(a);d.getReflectionCamera(c).layers.disable(Bo);const g=dx(a),S=[mx(a,o),px(a,o,u)];l.add(sx(a),d,...ix(h,a),...lx(h,a,f),...g.objects,Au(a,h.screens,u,1),...S.flatMap(xe=>xe.objects),Su(a,o,[...cx(h,f),...g.lights]),...hx(a,o),fx(a,o));const m=Kv(n,l,c);let p=0,b=!1,w=!1,x=!1,T=0,E=0,L=0,v=0,A=!1,U=-1,G=-1;const B=xe=>w||e?qt.holdMs:Math.min(qt.holdMs,xe-p),J=xe=>{const _e=Do(xe/qt.cameraMs);c.position.set(_e.position.x,_e.position.y,_e.position.z),c.fov=_e.fov,c.updateProjectionMatrix(),c.lookAt(_e.target.x,_e.target.y,_e.target.z)},H=xe=>{(i.clientWidth!==U||i.clientHeight!==G)&&Z();const _e=B(xe),Ie=(xe-p)/1e3;a.uTime.value=Ie,m.time.value=Ie,J(_e);for(const Ne of S)Ne.update(_e,Ie);m.exposure.value=Wi(_e,0,qt.fadeInMs),m.composer.render()},Z=()=>{U=i.clientWidth,G=i.clientHeight;const xe=Math.max(1,U),_e=Math.max(1,G);n.setPixelRatio(s),n.setSize(xe,_e,!1),m.setSize(xe,_e,s);const Ie=Ne=>Math.max(1,Math.round(Ne*s*jv));d.getRenderTarget().setSize(Ie(xe),Ie(_e)),c.aspect=xe/_e,c.updateProjectionMatrix(),b&&e&&!x&&H(performance.now())},ie=xe=>{A||(v>0&&(E+=1,E>8&&xe-v>24&&(L+=1)),v=xe,!(E<68)&&(A=!0,L>30&&s>_u&&(s=Math.max(_u,s*.72),Z())))},$=xe=>{x||(T=requestAnimationFrame($),H(performance.now()),ie(xe))},K=()=>{if(!x){if(r)throw new Error("splash: a city shader failed to compile");p=performance.now(),b=!0,t(),e?H(p):T=requestAnimationFrame($)}},re=xe=>{console.error("Tomato splash: WebGL scene failed; using the static brand.",xe),x=!0,cancelAnimationFrame(T),document.documentElement.dataset.scene="fallback",b||(b=!0,t())},se=new ResizeObserver(Z);se.observe(i),Z(),J(e?qt.holdMs:0),n.setRenderTarget(m.composer.renderTarget1);const he=n.compileAsync(l,c);return n.setRenderTarget(null),he.then(()=>{x||(m.exposure.value=0,m.composer.render(),K())}).catch(re),{finish:()=>{w=!0,b&&e&&!x&&H(performance.now())},stop:()=>{x=!0,cancelAnimationFrame(T),se.disconnect();for(const xe of S)xe.dispose();vx(l),m.dispose(),n.dispose()}}}function _x(i,e,t){if(i===null)return document.documentElement.dataset.scene="fallback",t(),xu;try{return xx(i,e,t)}catch(n){return console.error("Tomato splash: WebGL initialization failed; using the static brand.",n),document.documentElement.dataset.scene="fallback",t(),xu}}const Go=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function Mx(i){if(i===null||Go)return{start:()=>{},finish:()=>{},stop:()=>{}};const e=i.dataset.text??i.textContent;let t,n,r=!1;const s=()=>{window.clearTimeout(t),n!==void 0&&window.clearInterval(n)};return{start:()=>{r||(t=window.setTimeout(()=>{const a=performance.now(),o=()=>{const l=(performance.now()-a)/qt.wordmarkMs;i.textContent=Hu(e,l),l>=1&&n!==void 0&&(window.clearInterval(n),n=void 0)};o(),n=window.setInterval(o,40)},qt.wordmarkDelayMs))},finish:()=>{r=!0,s(),i.textContent=e},stop:s}}function Sx(i,e,t){let n=!1,r,s;const a=()=>{var o;n||(n=!0,window.clearTimeout(r),t(),document.documentElement.dataset.splash="done",s=window.setTimeout(()=>{i==null||i.classList.add("visible")},qt.waitingDelayMs),(o=window.tomatoSplash)==null||o.notifyAnimationDone())};return{start:()=>{n||(r=window.setTimeout(a,e))},finish:a,stop:()=>{window.clearTimeout(r),s!==void 0&&window.clearTimeout(s)}}}let Vo={finish:()=>{},stop:()=>{}};const Wo=Mx(document.querySelector(".wordmark-name")),Xo=Sx(document.querySelector("#waiting"),zu(Go),()=>{Vo.finish(),Wo.finish()});Vo=_x(document.querySelector("#city-3d"),Go,()=>{document.documentElement.dataset.clock="running",Wo.start(),Xo.start()});const Ru=()=>{Xo.finish()};window.addEventListener("pointerdown",Ru),window.addEventListener("keydown",i=>{i.key==="Escape"&&Ru()}),window.addEventListener("pagehide",()=>{Xo.stop(),Wo.stop(),Vo.stop()},{once:!0})})();
