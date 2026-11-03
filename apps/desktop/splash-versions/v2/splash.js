(function(){"use strict";const kt={fadeInMs:1100,cameraMs:6300,projectorMs:3200,projectorRampMs:600,beamMs:3500,beamRampMs:650,sparksMs:3650,igniteMs:4150,igniteRampMs:1300,wordmarkDelayMs:5650,wordmarkMs:700,holdMs:7200,waitingDelayMs:1500,reducedMotionHoldMs:400};function Hu(i){return i?kt.reducedMotionHoldMs:kt.holdMs}const el="01ABCDEF23456789#%$@";function ku(i,e,t=Math.random){if(e>=1)return i;const n=Math.floor(Math.max(0,e)*i.length);return Array.from(i,(r,s)=>r===" "||s<n?r:el.charAt(Math.floor(t()*el.length))).join("")}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ws="186",Gu=0,tl=1,Vu=2,Fr=1,Wu=2,Ji=3,Qn=0,Ot=1,$t=2,mn=0,Qi=1,ji=2,nl=3,il=4,Xu=5,xi=100,qu=101,Yu=102,Ku=103,Zu=104,$u=200,Ju=201,Qu=202,ju=203,rl=204,sl=205,eh=206,th=207,nh=208,ih=209,rh=210,sh=211,ah=212,oh=213,lh=214,Xs=0,qs=1,Ys=2,er=3,Ks=4,Zs=5,$s=6,Js=7,al=0,ch=1,uh=2,gn=0,ol=1,ll=2,cl=3,ul=4,hl=5,fl=6,dl=7,pl=300,jn=301,_i=302,Qs=303,js=304,Or=306,Br=1e3,vn=1001,zr=1002,Rt=1003,hh=1004,Hr=1005,Tt=1006,ea=1007,Fn=1008,Vt=1009,ml=1010,gl=1011,tr=1012,ta=1013,xn=1014,nn=1015,Lt=1016,na=1017,ia=1018,nr=1020,vl=35902,xl=35899,_l=1021,Ml=1022,rn=1023,An=1026,ei=1027,kr=1028,ra=1029,ti=1030,sa=1031,aa=1033,Gr=33776,Vr=33777,Wr=33778,Xr=33779,oa=35840,la=35841,ca=35842,ua=35843,ha=36196,fa=37492,da=37496,pa=37488,ma=37489,qr=37490,ga=37491,va=37808,xa=37809,_a=37810,Ma=37811,Sa=37812,ya=37813,ba=37814,Ea=37815,wa=37816,Ta=37817,Aa=37818,Ra=37819,Ca=37820,Pa=37821,La=36492,Ia=36494,Da=36495,Na=36283,Ua=36284,Yr=36285,Fa=36286,fh=3200,Sl=0,dh=1,On="",Gt="srgb",Kr="srgb-linear",Zr="linear",lt="srgb",Oa=7680,ph=519,mh=512,gh=513,vh=514,Ba=515,xh=516,_h=517,za=518,Mh=519,Sh=35044,yl="300 es",_n=2e3,$r=2001;function yh(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Jr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function bh(){const i=Jr("canvas");return i.style.display="block",i}const bl={};function El(...i){const e="THREE."+i.shift();console.log(e,...i)}function wl(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ye(...i){i=wl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function nt(...i){i=wl(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Mi(...i){const e=i.join(" ");e in bl||(bl[e]=!0,Ye(...i))}function Eh(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}const wh={[Xs]:qs,[Ys]:$s,[Ks]:Js,[er]:Zs,[qs]:Xs,[$s]:Ys,[Js]:Ks,[Zs]:er};class ni{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const r=n[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const It=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let Tl=1234567;const ir=Math.PI/180,rr=180/Math.PI;function ii(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(It[i&255]+It[i>>8&255]+It[i>>16&255]+It[i>>24&255]+"-"+It[e&255]+It[e>>8&255]+"-"+It[e>>16&15|64]+It[e>>24&255]+"-"+It[t&63|128]+It[t>>8&255]+"-"+It[t>>16&255]+It[t>>24&255]+It[n&255]+It[n>>8&255]+It[n>>16&255]+It[n>>24&255]).toLowerCase()}function Qe(i,e,t){return Math.max(e,Math.min(t,i))}function Ha(i,e){return(i%e+e)%e}function Th(i,e,t,n,r){return n+(i-e)*(r-n)/(t-e)}function Ah(i,e,t){return i!==e?(t-i)/(e-i):0}function sr(i,e,t){return(1-t)*i+t*e}function Rh(i,e,t,n){return sr(i,e,1-Math.exp(-t*n))}function Ch(i,e=1){return e-Math.abs(Ha(i,e*2)-e)}function Ph(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Lh(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function Ih(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Dh(i,e){return i+Math.random()*(e-i)}function Nh(i){return i*(.5-Math.random())}function Uh(i){i!==void 0&&(Tl=i);let e=Tl+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function Fh(i){return i*ir}function Oh(i){return i*rr}function Bh(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function zh(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Hh(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function kh(i,e,t,n,r){const s=Math.cos,a=Math.sin,o=s(t/2),l=a(t/2),c=s((e+n)/2),u=a((e+n)/2),f=s((e-n)/2),h=a((e-n)/2),d=s((n-e)/2),g=a((n-e)/2);switch(r){case"XYX":i.set(o*u,l*f,l*h,o*c);break;case"YZY":i.set(l*h,o*u,l*f,o*c);break;case"ZXZ":i.set(l*f,l*h,o*u,o*c);break;case"XZX":i.set(o*u,l*g,l*d,o*c);break;case"YXY":i.set(l*d,o*u,l*g,o*c);break;case"ZYZ":i.set(l*g,l*d,o*u,o*c);break;default:Ye("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Si(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Bt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Gh={DEG2RAD:ir,RAD2DEG:rr,generateUUID:ii,clamp:Qe,euclideanModulo:Ha,mapLinear:Th,inverseLerp:Ah,lerp:sr,damp:Rh,pingpong:Ch,smoothstep:Ph,smootherstep:Lh,randInt:Ih,randFloat:Dh,randFloatSpread:Nh,seededRandom:Uh,degToRad:Fh,radToDeg:Oh,isPowerOfTwo:Bh,ceilPowerOfTwo:zh,floorPowerOfTwo:Hh,setQuaternionFromProperEuler:kh,normalize:Bt,denormalize:Si},Yo=class Yo{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Qe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Yo.prototype.isVector2=!0;let ae=Yo;class Bn{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let l=n[r+0],c=n[r+1],u=n[r+2],f=n[r+3],h=s[a+0],d=s[a+1],g=s[a+2],S=s[a+3];if(f!==S||l!==h||c!==d||u!==g){let m=l*h+c*d+u*g+f*S;m<0&&(h=-h,d=-d,g=-g,S=-S,m=-m);let p=1-o;if(m<.9995){const w=Math.acos(m),T=Math.sin(w);p=Math.sin(p*w)/T,o=Math.sin(o*w)/T,l=l*p+h*o,c=c*p+d*o,u=u*p+g*o,f=f*p+S*o}else{l=l*p+h*o,c=c*p+d*o,u=u*p+g*o,f=f*p+S*o;const w=1/Math.sqrt(l*l+c*c+u*u+f*f);l*=w,c*=w,u*=w,f*=w}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],l=n[r+1],c=n[r+2],u=n[r+3],f=s[a],h=s[a+1],d=s[a+2],g=s[a+3];return e[t]=o*g+u*f+l*d-c*h,e[t+1]=l*g+u*h+c*f-o*d,e[t+2]=c*g+u*d+o*h-l*f,e[t+3]=u*g-o*f-l*h-c*d,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,l=Math.sin,c=o(n/2),u=o(r/2),f=o(s/2),h=l(n/2),d=l(r/2),g=l(s/2);switch(a){case"XYZ":this._x=h*u*f+c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f-h*d*g;break;case"YXZ":this._x=h*u*f+c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f+h*d*g;break;case"ZXY":this._x=h*u*f-c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f-h*d*g;break;case"ZYX":this._x=h*u*f-c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f+h*d*g;break;case"YZX":this._x=h*u*f+c*d*g,this._y=c*d*f+h*u*g,this._z=c*u*g-h*d*f,this._w=c*u*f-h*d*g;break;case"XZY":this._x=h*u*f-c*d*g,this._y=c*d*f-h*u*g,this._z=c*u*g+h*d*f,this._w=c*u*f+h*d*g;break;default:Ye("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],l=t[9],c=t[2],u=t[6],f=t[10],h=n+o+f;if(h>0){const d=.5/Math.sqrt(h+1);this._w=.25/d,this._x=(u-l)*d,this._y=(s-c)*d,this._z=(a-r)*d}else if(n>o&&n>f){const d=2*Math.sqrt(1+n-o-f);this._w=(u-l)/d,this._x=.25*d,this._y=(r+a)/d,this._z=(s+c)/d}else if(o>f){const d=2*Math.sqrt(1+o-n-f);this._w=(s-c)/d,this._x=(r+a)/d,this._y=.25*d,this._z=(l+u)/d}else{const d=2*Math.sqrt(1+f-n-o);this._w=(a-r)/d,this._x=(s+c)/d,this._y=(l+u)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Qe(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+a*o+r*c-s*l,this._y=r*u+a*l+s*o-n*c,this._z=s*u+a*c+n*l-r*o,this._w=a*u-n*o-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,s=-s,a=-a,o=-o);let l=1-t;if(o<.9995){const c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+n*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this._onChangeCallback()}else this._x=this._x*l+n*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Ko=class Ko{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(Al.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(Al.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,l=e.w,c=2*(a*r-o*n),u=2*(o*t-s*r),f=2*(s*n-a*t);return this.x=t+l*c+a*f-o*u,this.y=n+l*u+o*c-s*f,this.z=r+l*f+s*u-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,l=t.z;return this.x=r*l-s*o,this.y=s*a-n*l,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ka.copy(this).projectOnVector(e),this.sub(ka)}reflect(e){return this.sub(ka.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Qe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Ko.prototype.isVector3=!0;let O=Ko;const ka=new O,Al=new Bn,Zo=class Zo{constructor(e,t,n,r,s,a,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c)}set(e,t,n,r,s,a,o,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=l,u[6]=n,u[7]=a,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],u=n[4],f=n[7],h=n[2],d=n[5],g=n[8],S=r[0],m=r[3],p=r[6],w=r[1],T=r[4],_=r[7],b=r[2],E=r[5],I=r[8];return s[0]=a*S+o*w+l*b,s[3]=a*m+o*T+l*E,s[6]=a*p+o*_+l*I,s[1]=c*S+u*w+f*b,s[4]=c*m+u*T+f*E,s[7]=c*p+u*_+f*I,s[2]=h*S+d*w+g*b,s[5]=h*m+d*T+g*E,s[8]=h*p+d*_+g*I,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8];return t*a*u-t*o*c-n*s*u+n*o*l+r*s*c-r*a*l}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],f=u*a-o*c,h=o*l-u*s,d=c*s-a*l,g=t*f+n*h+r*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/g;return e[0]=f*S,e[1]=(r*c-u*n)*S,e[2]=(o*n-r*a)*S,e[3]=h*S,e[4]=(u*t-r*l)*S,e[5]=(r*s-o*t)*S,e[6]=d*S,e[7]=(n*l-c*t)*S,e[8]=(a*t-n*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*a+c*o)+a+e,-r*c,r*l,-r*(-c*a+l*o)+o+t,0,0,1),this}scale(e,t){return Mi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Ga.makeScale(e,t)),this}rotate(e){return Mi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Ga.makeRotation(-e)),this}translate(e,t){return Mi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Ga.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};Zo.prototype.isMatrix3=!0;let Xe=Zo;const Ga=new Xe,Rl=new Xe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Cl=new Xe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Vh(){const i={enabled:!0,workingColorSpace:Kr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===lt&&(r.r=Rn(r.r),r.g=Rn(r.g),r.b=Rn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===lt&&(r.r=yi(r.r),r.g=yi(r.g),r.b=yi(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===On?Zr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Mi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Mi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Kr]:{primaries:e,whitePoint:n,transfer:Zr,toXYZ:Rl,fromXYZ:Cl,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Gt},outputColorSpaceConfig:{drawingBufferColorSpace:Gt}},[Gt]:{primaries:e,whitePoint:n,transfer:lt,toXYZ:Rl,fromXYZ:Cl,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Gt}}}),i}const tt=Vh();function Rn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function yi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let bi;class Wh{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{bi===void 0&&(bi=Jr("canvas")),bi.width=e.width,bi.height=e.height;const r=bi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=bi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Jr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Rn(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Rn(t[n]/255)*255):t[n]=Rn(t[n]);return{data:t,width:e.width,height:e.height}}else return Ye("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let Xh=0;class Va{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Xh++}),this.uuid=ii(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(Wa(r[a].image)):s.push(Wa(r[a]))}else s=Wa(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function Wa(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Wh.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ye("Texture: Unable to serialize Texture."),{})}let qh=0;const Xa=new O;class Dt extends ni{constructor(e=Dt.DEFAULT_IMAGE,t=Dt.DEFAULT_MAPPING,n=vn,r=vn,s=Tt,a=Fn,o=rn,l=Vt,c=Dt.DEFAULT_ANISOTROPY,u=On){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:qh++}),this.uuid=ii(),this.name="",this.source=new Va(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new ae(0,0),this.repeat=new ae(1,1),this.center=new ae(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Xe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Xa).x}get height(){return this.source.getSize(Xa).y}get depth(){return this.source.getSize(Xa).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ye(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ye(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==pl)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Br:e.x=e.x-Math.floor(e.x);break;case vn:e.x=e.x<0?0:1;break;case zr:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Br:e.y=e.y-Math.floor(e.y);break;case vn:e.y=e.y<0?0:1;break;case zr:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Dt.DEFAULT_IMAGE=null,Dt.DEFAULT_MAPPING=pl,Dt.DEFAULT_ANISOTROPY=1;const $o=class $o{constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const l=e.elements,c=l[0],u=l[4],f=l[8],h=l[1],d=l[5],g=l[9],S=l[2],m=l[6],p=l[10];if(Math.abs(u-h)<.01&&Math.abs(f-S)<.01&&Math.abs(g-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+S)<.1&&Math.abs(g+m)<.1&&Math.abs(c+d+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(c+1)/2,_=(d+1)/2,b=(p+1)/2,E=(u+h)/4,I=(f+S)/4,x=(g+m)/4;return T>_&&T>b?T<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(T),r=E/n,s=I/n):_>b?_<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(_),n=E/r,s=x/r):b<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(b),n=I/s,r=x/s),this.set(n,r,s,t),this}let w=Math.sqrt((m-g)*(m-g)+(f-S)*(f-S)+(h-u)*(h-u));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(f-S)/w,this.z=(h-u)/w,this.w=Math.acos((c+d+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Qe(this.x,e.x,t.x),this.y=Qe(this.y,e.y,t.y),this.z=Qe(this.z,e.z,t.z),this.w=Qe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Qe(this.x,e,t),this.y=Qe(this.y,e,t),this.z=Qe(this.z,e,t),this.w=Qe(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Qe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};$o.prototype.isVector4=!0;let mt=$o;class Yh extends ni{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Tt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new mt(0,0,e,t),this.scissorTest=!1,this.viewport=new mt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:n.depth},s=new Dt(r),a=n.count;for(let o=0;o<a;o++)this.textures[o]=s.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Tt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Va(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ct extends Yh{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class Pl extends Dt{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Kh extends Dt{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=vn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const ks=class ks{constructor(e,t,n,r,s,a,o,l,c,u,f,h,d,g,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,l,c,u,f,h,d,g,S,m)}set(e,t,n,r,s,a,o,l,c,u,f,h,d,g,S,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=l,p[2]=c,p[6]=u,p[10]=f,p[14]=h,p[3]=d,p[7]=g,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ks().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,r=1/Ei.setFromMatrixColumn(e,0).length(),s=1/Ei.setFromMatrixColumn(e,1).length(),a=1/Ei.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const h=a*u,d=a*f,g=o*u,S=o*f;t[0]=l*u,t[4]=-l*f,t[8]=c,t[1]=d+g*c,t[5]=h-S*c,t[9]=-o*l,t[2]=S-h*c,t[6]=g+d*c,t[10]=a*l}else if(e.order==="YXZ"){const h=l*u,d=l*f,g=c*u,S=c*f;t[0]=h+S*o,t[4]=g*o-d,t[8]=a*c,t[1]=a*f,t[5]=a*u,t[9]=-o,t[2]=d*o-g,t[6]=S+h*o,t[10]=a*l}else if(e.order==="ZXY"){const h=l*u,d=l*f,g=c*u,S=c*f;t[0]=h-S*o,t[4]=-a*f,t[8]=g+d*o,t[1]=d+g*o,t[5]=a*u,t[9]=S-h*o,t[2]=-a*c,t[6]=o,t[10]=a*l}else if(e.order==="ZYX"){const h=a*u,d=a*f,g=o*u,S=o*f;t[0]=l*u,t[4]=g*c-d,t[8]=h*c+S,t[1]=l*f,t[5]=S*c+h,t[9]=d*c-g,t[2]=-c,t[6]=o*l,t[10]=a*l}else if(e.order==="YZX"){const h=a*l,d=a*c,g=o*l,S=o*c;t[0]=l*u,t[4]=S-h*f,t[8]=g*f+d,t[1]=f,t[5]=a*u,t[9]=-o*u,t[2]=-c*u,t[6]=d*f+g,t[10]=h-S*f}else if(e.order==="XZY"){const h=a*l,d=a*c,g=o*l,S=o*c;t[0]=l*u,t[4]=-f,t[8]=c*u,t[1]=h*f+S,t[5]=a*u,t[9]=d*f-g,t[2]=g*f-d,t[6]=o*u,t[10]=S*f+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Zh,e,$h)}lookAt(e,t,n){const r=this.elements;return Wt.subVectors(e,t),Wt.lengthSq()===0&&(Wt.z=1),Wt.normalize(),zn.crossVectors(n,Wt),zn.lengthSq()===0&&(Math.abs(n.z)===1?Wt.x+=1e-4:Wt.z+=1e-4,Wt.normalize(),zn.crossVectors(n,Wt)),zn.normalize(),Qr.crossVectors(Wt,zn),r[0]=zn.x,r[4]=Qr.x,r[8]=Wt.x,r[1]=zn.y,r[5]=Qr.y,r[9]=Wt.y,r[2]=zn.z,r[6]=Qr.z,r[10]=Wt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],u=n[1],f=n[5],h=n[9],d=n[13],g=n[2],S=n[6],m=n[10],p=n[14],w=n[3],T=n[7],_=n[11],b=n[15],E=r[0],I=r[4],x=r[8],A=r[12],U=r[1],G=r[5],z=r[9],J=r[13],H=r[2],Y=r[6],re=r[10],$=r[14],Z=r[3],ie=r[7],se=r[11],he=r[15];return s[0]=a*E+o*U+l*H+c*Z,s[4]=a*I+o*G+l*Y+c*ie,s[8]=a*x+o*z+l*re+c*se,s[12]=a*A+o*J+l*$+c*he,s[1]=u*E+f*U+h*H+d*Z,s[5]=u*I+f*G+h*Y+d*ie,s[9]=u*x+f*z+h*re+d*se,s[13]=u*A+f*J+h*$+d*he,s[2]=g*E+S*U+m*H+p*Z,s[6]=g*I+S*G+m*Y+p*ie,s[10]=g*x+S*z+m*re+p*se,s[14]=g*A+S*J+m*$+p*he,s[3]=w*E+T*U+_*H+b*Z,s[7]=w*I+T*G+_*Y+b*ie,s[11]=w*x+T*z+_*re+b*se,s[15]=w*A+T*J+_*$+b*he,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],l=e[9],c=e[13],u=e[2],f=e[6],h=e[10],d=e[14],g=e[3],S=e[7],m=e[11],p=e[15],w=l*d-c*h,T=o*d-c*f,_=o*h-l*f,b=a*d-c*u,E=a*h-l*u,I=a*f-o*u;return t*(S*w-m*T+p*_)-n*(g*w-m*b+p*E)+r*(g*T-S*b+p*I)-s*(g*_-S*E+m*I)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[1],a=e[5],o=e[9],l=e[2],c=e[6],u=e[10];return t*(a*u-o*c)-n*(s*u-o*l)+r*(s*c-a*l)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],l=e[6],c=e[7],u=e[8],f=e[9],h=e[10],d=e[11],g=e[12],S=e[13],m=e[14],p=e[15],w=t*o-n*a,T=t*l-r*a,_=t*c-s*a,b=n*l-r*o,E=n*c-s*o,I=r*c-s*l,x=u*S-f*g,A=u*m-h*g,U=u*p-d*g,G=f*m-h*S,z=f*p-d*S,J=h*p-d*m,H=w*J-T*z+_*G+b*U-E*A+I*x;if(H===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const Y=1/H;return e[0]=(o*J-l*z+c*G)*Y,e[1]=(r*z-n*J-s*G)*Y,e[2]=(S*I-m*E+p*b)*Y,e[3]=(h*E-f*I-d*b)*Y,e[4]=(l*U-a*J-c*A)*Y,e[5]=(t*J-r*U+s*A)*Y,e[6]=(m*_-g*I-p*T)*Y,e[7]=(u*I-h*_+d*T)*Y,e[8]=(a*z-o*U+c*x)*Y,e[9]=(n*U-t*z-s*x)*Y,e[10]=(g*E-S*_+p*w)*Y,e[11]=(f*_-u*E-d*w)*Y,e[12]=(o*A-a*G-l*x)*Y,e[13]=(t*G-n*A+r*x)*Y,e[14]=(S*T-g*b-m*w)*Y,e[15]=(u*b-f*T+h*w)*Y,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,l=e.z,c=s*a,u=s*o;return this.set(c*a+n,c*o-r*l,c*l+r*o,0,c*o+r*l,u*o+n,u*l-r*a,0,c*l-r*o,u*l+r*a,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,l=t._w,c=s+s,u=a+a,f=o+o,h=s*c,d=s*u,g=s*f,S=a*u,m=a*f,p=o*f,w=l*c,T=l*u,_=l*f,b=n.x,E=n.y,I=n.z;return r[0]=(1-(S+p))*b,r[1]=(d+_)*b,r[2]=(g-T)*b,r[3]=0,r[4]=(d-_)*E,r[5]=(1-(h+p))*E,r[6]=(m+w)*E,r[7]=0,r[8]=(g+T)*I,r[9]=(m-w)*I,r[10]=(1-(h+S))*I,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),t.identity(),this;let a=Ei.set(r[0],r[1],r[2]).length();const o=Ei.set(r[4],r[5],r[6]).length(),l=Ei.set(r[8],r[9],r[10]).length();s<0&&(a=-a),sn.copy(this);const c=1/a,u=1/o,f=1/l;return sn.elements[0]*=c,sn.elements[1]*=c,sn.elements[2]*=c,sn.elements[4]*=u,sn.elements[5]*=u,sn.elements[6]*=u,sn.elements[8]*=f,sn.elements[9]*=f,sn.elements[10]*=f,t.setFromRotationMatrix(sn),n.x=a,n.y=o,n.z=l,this}makePerspective(e,t,n,r,s,a,o=_n,l=!1){const c=this.elements,u=2*s/(t-e),f=2*s/(n-r),h=(t+e)/(t-e),d=(n+r)/(n-r);let g,S;if(l)g=s/(a-s),S=a*s/(a-s);else if(o===_n)g=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===$r)g=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=f,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=_n,l=!1){const c=this.elements,u=2/(t-e),f=2/(n-r),h=-(t+e)/(t-e),d=-(n+r)/(n-r);let g,S;if(l)g=1/(a-s),S=a/(a-s);else if(o===_n)g=-2/(a-s),S=-(a+s)/(a-s);else if(o===$r)g=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=f,c[9]=0,c[13]=d,c[2]=0,c[6]=0,c[10]=g,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};ks.prototype.isMatrix4=!0;let ct=ks;const Ei=new O,sn=new ct,Zh=new O(0,0,0),$h=new O(1,1,1),zn=new O,Qr=new O,Wt=new O,Ll=new ct,Il=new Bn;class ri{constructor(e=0,t=0,n=0,r=ri.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],l=r[1],c=r[5],u=r[9],f=r[2],h=r[6],d=r[10];switch(t){case"XYZ":this._y=Math.asin(Qe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,d),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Qe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(Qe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Qe(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,d),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(Qe(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-Qe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,d),this._y=0);break;default:Ye("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Ll.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Ll,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Il.setFromEuler(this),this.setFromQuaternion(Il,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ri.DEFAULT_ORDER="XYZ";class Dl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Jh=0;const Nl=new O,wi=new Bn,Cn=new ct,jr=new O,ar=new O,Qh=new O,jh=new Bn,Ul=new O(1,0,0),Fl=new O(0,1,0),Ol=new O(0,0,1),Bl={type:"added"},ef={type:"removed"},Ti={type:"childadded",child:null},qa={type:"childremoved",child:null};class Xt extends ni{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Jh++}),this.uuid=ii(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Xt.DEFAULT_UP.clone();const e=new O,t=new ri,n=new Bn,r=new O(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new ct},normalMatrix:{value:new Xe}}),this.matrix=new ct,this.matrixWorld=new ct,this.matrixAutoUpdate=Xt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Dl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return wi.setFromAxisAngle(e,t),this.quaternion.multiply(wi),this}rotateOnWorldAxis(e,t){return wi.setFromAxisAngle(e,t),this.quaternion.premultiply(wi),this}rotateX(e){return this.rotateOnAxis(Ul,e)}rotateY(e){return this.rotateOnAxis(Fl,e)}rotateZ(e){return this.rotateOnAxis(Ol,e)}translateOnAxis(e,t){return Nl.copy(e).applyQuaternion(this.quaternion),this.position.add(Nl.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ul,e)}translateY(e){return this.translateOnAxis(Fl,e)}translateZ(e){return this.translateOnAxis(Ol,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Cn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?jr.copy(e):jr.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),ar.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Cn.lookAt(ar,jr,this.up):Cn.lookAt(jr,ar,this.up),this.quaternion.setFromRotationMatrix(Cn),r&&(Cn.extractRotation(r.matrixWorld),wi.setFromRotationMatrix(Cn),this.quaternion.premultiply(wi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(nt("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Bl),Ti.child=e,this.dispatchEvent(Ti),Ti.child=null):nt("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(ef),qa.child=e,this.dispatchEvent(qa),qa.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Cn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Cn.multiply(e.parent.matrixWorld)),e.applyMatrix4(Cn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Bl),Ti.child=e,this.dispatchEvent(Ti),Ti.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ar,e,Qh),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ar,jh,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*n-s[8]*r,s[13]+=n-s[1]*t-s[5]*n-s[9]*r,s[14]+=r-s[2]*t-s[6]*n-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const f=l[c];s(e.shapes,f)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(s(e.materials,this.material[l]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const l=this.animations[o];r.animations.push(s(e.animations,l))}}if(t){const o=a(e.geometries),l=a(e.materials),c=a(e.textures),u=a(e.images),f=a(e.shapes),h=a(e.skeletons),d=a(e.animations),g=a(e.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),h.length>0&&(n.skeletons=h),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=r,n;function a(o){const l=[];for(const c in o){const u=o[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Xt.DEFAULT_UP=new O(0,1,0),Xt.DEFAULT_MATRIX_AUTO_UPDATE=!0,Xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class or extends Xt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const tf={type:"move"};class Ya{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new or,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new or,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new or,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){a=!0;for(const S of e.hand.values()){const m=t.getJointPose(S,n),p=this._getHandJoint(c,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],h=u.position.distanceTo(f.position),d=.02,g=.005;c.inputState.pinching&&h>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&h<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(tf)))}return o!==null&&(o.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new or;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const zl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Hn={h:0,s:0,l:0},es={h:0,s:0,l:0};function Ka(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Ke{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Gt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,tt.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=tt.workingColorSpace){return this.r=e,this.g=t,this.b=n,tt.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=tt.workingColorSpace){if(e=Ha(e,1),t=Qe(t,0,1),n=Qe(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=Ka(a,s,e+1/3),this.g=Ka(a,s,e),this.b=Ka(a,s,e-1/3)}return tt.colorSpaceToWorking(this,r),this}setStyle(e,t=Gt){function n(s){s!==void 0&&parseFloat(s)<1&&Ye("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ye("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ye("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Gt){const n=zl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ye("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Rn(e.r),this.g=Rn(e.g),this.b=Rn(e.b),this}copyLinearToSRGB(e){return this.r=yi(e.r),this.g=yi(e.g),this.b=yi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Gt){return tt.workingToColorSpace(Nt.copy(this),e),Math.round(Qe(Nt.r*255,0,255))*65536+Math.round(Qe(Nt.g*255,0,255))*256+Math.round(Qe(Nt.b*255,0,255))}getHexString(e=Gt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=tt.workingColorSpace){tt.workingToColorSpace(Nt.copy(this),t);const n=Nt.r,r=Nt.g,s=Nt.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let l,c;const u=(o+a)/2;if(o===a)l=0,c=0;else{const f=a-o;switch(c=u<=.5?f/(a+o):f/(2-a-o),a){case n:l=(r-s)/f+(r<s?6:0);break;case r:l=(s-n)/f+2;break;case s:l=(n-r)/f+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=tt.workingColorSpace){return tt.workingToColorSpace(Nt.copy(this),t),e.r=Nt.r,e.g=Nt.g,e.b=Nt.b,e}getStyle(e=Gt){tt.workingToColorSpace(Nt.copy(this),e);const t=Nt.r,n=Nt.g,r=Nt.b;return e!==Gt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(Hn),this.setHSL(Hn.h+e,Hn.s+t,Hn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Hn),e.getHSL(es);const n=sr(Hn.h,es.h,t),r=sr(Hn.s,es.s,t),s=sr(Hn.l,es.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Nt=new Ke;Ke.NAMES=zl;class nf extends Xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ri,this.environmentIntensity=1,this.environmentRotation=new ri,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const an=new O,Pn=new O,Za=new O,Ln=new O,Ai=new O,Ri=new O,Hl=new O,$a=new O,Ja=new O,Qa=new O,ja=new mt,eo=new mt,to=new mt;class on{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),an.subVectors(e,t),r.cross(an);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){an.subVectors(r,t),Pn.subVectors(n,t),Za.subVectors(e,t);const a=an.dot(an),o=an.dot(Pn),l=an.dot(Za),c=Pn.dot(Pn),u=Pn.dot(Za),f=a*c-o*o;if(f===0)return s.set(0,0,0),null;const h=1/f,d=(c*l-o*u)*h,g=(a*u-o*l)*h;return s.set(1-d-g,g,d)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Ln)===null?!1:Ln.x>=0&&Ln.y>=0&&Ln.x+Ln.y<=1}static getInterpolation(e,t,n,r,s,a,o,l){return this.getBarycoord(e,t,n,r,Ln)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,Ln.x),l.addScaledVector(a,Ln.y),l.addScaledVector(o,Ln.z),l)}static getInterpolatedAttribute(e,t,n,r,s,a){return ja.setScalar(0),eo.setScalar(0),to.setScalar(0),ja.fromBufferAttribute(e,t),eo.fromBufferAttribute(e,n),to.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ja,s.x),a.addScaledVector(eo,s.y),a.addScaledVector(to,s.z),a}static isFrontFacing(e,t,n,r){return an.subVectors(n,t),Pn.subVectors(e,t),an.cross(Pn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return an.subVectors(this.c,this.b),Pn.subVectors(this.a,this.b),an.cross(Pn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return on.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return on.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return on.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return on.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return on.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;Ai.subVectors(r,n),Ri.subVectors(s,n),$a.subVectors(e,n);const l=Ai.dot($a),c=Ri.dot($a);if(l<=0&&c<=0)return t.copy(n);Ja.subVectors(e,r);const u=Ai.dot(Ja),f=Ri.dot(Ja);if(u>=0&&f<=u)return t.copy(r);const h=l*f-u*c;if(h<=0&&l>=0&&u<=0)return a=l/(l-u),t.copy(n).addScaledVector(Ai,a);Qa.subVectors(e,s);const d=Ai.dot(Qa),g=Ri.dot(Qa);if(g>=0&&d<=g)return t.copy(s);const S=d*c-l*g;if(S<=0&&c>=0&&g<=0)return o=c/(c-g),t.copy(n).addScaledVector(Ri,o);const m=u*g-d*f;if(m<=0&&f-u>=0&&d-g>=0)return Hl.subVectors(s,r),o=(f-u)/(f-u+(d-g)),t.copy(r).addScaledVector(Hl,o);const p=1/(m+S+h);return a=S*p,o=h*p,t.copy(n).addScaledVector(Ai,a).addScaledVector(Ri,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class si{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(ln.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(ln.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=ln.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,ln):ln.fromBufferAttribute(s,a),ln.applyMatrix4(e.matrixWorld),this.expandByPoint(ln);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ts.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ts.copy(n.boundingBox)),ts.applyMatrix4(e.matrixWorld),this.union(ts)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,ln),ln.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(lr),ns.subVectors(this.max,lr),Ci.subVectors(e.a,lr),Pi.subVectors(e.b,lr),Li.subVectors(e.c,lr),kn.subVectors(Pi,Ci),Gn.subVectors(Li,Pi),ai.subVectors(Ci,Li);let t=[0,-kn.z,kn.y,0,-Gn.z,Gn.y,0,-ai.z,ai.y,kn.z,0,-kn.x,Gn.z,0,-Gn.x,ai.z,0,-ai.x,-kn.y,kn.x,0,-Gn.y,Gn.x,0,-ai.y,ai.x,0];return!no(t,Ci,Pi,Li,ns)||(t=[1,0,0,0,1,0,0,0,1],!no(t,Ci,Pi,Li,ns))?!1:(is.crossVectors(kn,Gn),t=[is.x,is.y,is.z],no(t,Ci,Pi,Li,ns))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,ln).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(ln).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(In[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),In[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),In[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),In[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),In[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),In[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),In[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),In[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(In),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const In=[new O,new O,new O,new O,new O,new O,new O,new O],ln=new O,ts=new si,Ci=new O,Pi=new O,Li=new O,kn=new O,Gn=new O,ai=new O,lr=new O,ns=new O,is=new O,oi=new O;function no(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){oi.fromArray(i,s);const o=r.x*Math.abs(oi.x)+r.y*Math.abs(oi.y)+r.z*Math.abs(oi.z),l=e.dot(oi),c=t.dot(oi),u=n.dot(oi);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}const St=new O,rs=new ae;let rf=0;class qt extends ni{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:rf++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Sh,this.updateRanges=[],this.gpuType=nn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)rs.fromBufferAttribute(this,t),rs.applyMatrix3(e),this.setXY(t,rs.x,rs.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix3(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyMatrix4(e),this.setXYZ(t,St.x,St.y,St.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.applyNormalMatrix(e),this.setXYZ(t,St.x,St.y,St.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)St.fromBufferAttribute(this,t),St.transformDirection(e),this.setXYZ(t,St.x,St.y,St.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Si(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Bt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Si(t,this.array)),t}setX(e,t){return this.normalized&&(t=Bt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Si(t,this.array)),t}setY(e,t){return this.normalized&&(t=Bt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Si(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Bt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Si(t,this.array)),t}setW(e,t){return this.normalized&&(t=Bt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Bt(t,this.array),n=Bt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=Bt(t,this.array),n=Bt(n,this.array),r=Bt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=Bt(t,this.array),n=Bt(n,this.array),r=Bt(r,this.array),s=Bt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}}class kl extends qt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Gl extends qt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class rt extends qt{constructor(e,t,n){super(new Float32Array(e),t,n)}}const sf=new si,cr=new O,io=new O;class ur{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):sf.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;cr.subVectors(e,this.center);const t=cr.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(cr,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(io.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(cr.copy(e.center).add(io)),this.expandByPoint(cr.copy(e.center).sub(io))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let af=0;const Jt=new ct,ro=new Xt,Ii=new O,Yt=new si,hr=new si,At=new O;class yt extends ni{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:af++}),this.uuid=ii(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(yh(e)?Gl:kl)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Xe().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Jt.makeRotationFromQuaternion(e),this.applyMatrix4(Jt),this}rotateX(e){return Jt.makeRotationX(e),this.applyMatrix4(Jt),this}rotateY(e){return Jt.makeRotationY(e),this.applyMatrix4(Jt),this}rotateZ(e){return Jt.makeRotationZ(e),this.applyMatrix4(Jt),this}translate(e,t,n){return Jt.makeTranslation(e,t,n),this.applyMatrix4(Jt),this}scale(e,t,n){return Jt.makeScale(e,t,n),this.applyMatrix4(Jt),this}lookAt(e){return ro.lookAt(e),ro.updateMatrix(),this.applyMatrix4(ro.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ii).negate(),this.translate(Ii.x,Ii.y,Ii.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new rt(n,3))}else{const n=Math.min(e.length,t.count);for(let r=0;r<n;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ye("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new si);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){nt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];Yt.setFromBufferAttribute(s),this.morphTargetsRelative?(At.addVectors(this.boundingBox.min,Yt.min),this.boundingBox.expandByPoint(At),At.addVectors(this.boundingBox.max,Yt.max),this.boundingBox.expandByPoint(At)):(this.boundingBox.expandByPoint(Yt.min),this.boundingBox.expandByPoint(Yt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&nt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new ur);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){nt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const n=this.boundingSphere.center;if(Yt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];hr.setFromBufferAttribute(o),this.morphTargetsRelative?(At.addVectors(Yt.min,hr.min),Yt.expandByPoint(At),At.addVectors(Yt.max,hr.max),Yt.expandByPoint(At)):(Yt.expandByPoint(hr.min),Yt.expandByPoint(hr.max))}Yt.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)At.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(At));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)At.fromBufferAttribute(o,c),l&&(Ii.fromBufferAttribute(e,c),At.add(Ii)),r=Math.max(r,n.distanceToSquared(At))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&nt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){nt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new qt(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],l=[];for(let x=0;x<n.count;x++)o[x]=new O,l[x]=new O;const c=new O,u=new O,f=new O,h=new ae,d=new ae,g=new ae,S=new O,m=new O;function p(x,A,U){c.fromBufferAttribute(n,x),u.fromBufferAttribute(n,A),f.fromBufferAttribute(n,U),h.fromBufferAttribute(s,x),d.fromBufferAttribute(s,A),g.fromBufferAttribute(s,U),u.sub(c),f.sub(c),d.sub(h),g.sub(h);const G=1/(d.x*g.y-g.x*d.y);isFinite(G)&&(S.copy(u).multiplyScalar(g.y).addScaledVector(f,-d.y).multiplyScalar(G),m.copy(f).multiplyScalar(d.x).addScaledVector(u,-g.x).multiplyScalar(G),o[x].add(S),o[A].add(S),o[U].add(S),l[x].add(m),l[A].add(m),l[U].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let x=0,A=w.length;x<A;++x){const U=w[x],G=U.start,z=U.count;for(let J=G,H=G+z;J<H;J+=3)p(e.getX(J+0),e.getX(J+1),e.getX(J+2))}const T=new O,_=new O,b=new O,E=new O;function I(x){b.fromBufferAttribute(r,x),E.copy(b);const A=o[x];T.copy(A),T.sub(b.multiplyScalar(b.dot(A))).normalize(),_.crossVectors(E,A);const G=_.dot(l[x])<0?-1:1;a.setXYZW(x,T.x,T.y,T.z,G)}for(let x=0,A=w.length;x<A;++x){const U=w[x],G=U.start,z=U.count;for(let J=G,H=G+z;J<H;J+=3)I(e.getX(J+0)),I(e.getX(J+1)),I(e.getX(J+2))}this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new qt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let h=0,d=n.count;h<d;h++)n.setXYZ(h,0,0,0);const r=new O,s=new O,a=new O,o=new O,l=new O,c=new O,u=new O,f=new O;if(e)for(let h=0,d=e.count;h<d;h+=3){const g=e.getX(h+0),S=e.getX(h+1),m=e.getX(h+2);r.fromBufferAttribute(t,g),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,S),c.fromBufferAttribute(n,m),o.add(u),l.add(u),c.add(u),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(S,l.x,l.y,l.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let h=0,d=t.count;h<d;h+=3)r.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)At.fromBufferAttribute(e,t),At.normalize(),e.setXYZ(t,At.x,At.y,At.z)}toNonIndexed(){function e(o,l){const c=o.array,u=o.itemSize,f=o.normalized,h=new c.constructor(l.length*u);let d=0,g=0;for(let S=0,m=l.length;S<m;S++){o.isInterleavedBufferAttribute?d=l[S]*o.data.stride+o.offset:d=l[S]*u;for(let p=0;p<u;p++)h[g++]=c[d++]}return new qt(h,u,f)}if(this.index===null)return Ye("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new yt,n=this.index.array,r=this.attributes;for(const o in r){const l=r[o],c=e(l,n);t.setAttribute(o,c)}const s=this.morphAttributes;for(const o in s){const l=[],c=s[o];for(let u=0,f=c.length;u<f;u++){const h=c[u],d=e(h,n);l.push(d)}t.morphAttributes[o]=l}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,l=a.length;o<l;o++){const c=a[o];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let f=0,h=c.length;f<h;f++){const d=c[f];u.push(d.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],f=s[c];for(let h=0,d=f.length;h<d;h++)u.push(f[h].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let c=0,u=a.length;c<u;c++){const f=a[c];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const so=new O,of=new O,lf=new Xe;class Dn{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=so.subVectors(n,t).cross(of.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const r=e.delta(so),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||lf.getNormalMatrix(e),r=this.coplanarPoint(so).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let cf=0;class ss extends ni{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:cf++}),this.uuid=ii(),this.name="",this.type="Material",this.blending=Qi,this.side=Qn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=rl,this.blendDst=sl,this.blendEquation=xi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ke(0,0,0),this.blendAlpha=0,this.depthFunc=er,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ph,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Oa,this.stencilZFail=Oa,this.stencilZPass=Oa,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ye(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ye(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const l=s[o];delete l.metadata,a.push(l)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ke().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Dn().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new ae().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ae().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Nn=new O,ao=new O,as=new O,os=new O;class uf{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Nn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Nn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Nn.copy(this.origin).addScaledVector(this.direction,t),Nn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){ao.copy(e).add(t).multiplyScalar(.5),as.copy(t).sub(e).normalize(),os.copy(this.origin).sub(ao);const s=e.distanceTo(t)*.5,a=-this.direction.dot(as),o=os.dot(this.direction),l=-os.dot(as),c=os.lengthSq(),u=Math.abs(1-a*a);let f,h,d,g;if(u>0)if(f=a*l-o,h=a*o-l,g=s*u,f>=0)if(h>=-g)if(h<=g){const S=1/u;f*=S,h*=S,d=f*(f+a*h+2*o)+h*(a*f+h+2*l)+c}else h=s,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h=-s,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;else h<=-g?(f=Math.max(0,-(-a*s+o)),h=f>0?-s:Math.min(Math.max(-s,-l),s),d=-f*f+h*(h+2*l)+c):h<=g?(f=0,h=Math.min(Math.max(-s,-l),s),d=h*(h+2*l)+c):(f=Math.max(0,-(a*s+o)),h=f>0?s:Math.min(Math.max(-s,-l),s),d=-f*f+h*(h+2*l)+c);else h=a>0?-s:s,f=Math.max(0,-(a*h+o)),d=-f*f+h*(h+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(ao).addScaledVector(as,h),d}intersectSphere(e,t){if(e.radius<0)return null;Nn.subVectors(e.center,this.origin);const n=Nn.dot(this.direction),r=Nn.dot(Nn)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,l;const c=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return c>=0?(n=(e.min.x-h.x)*c,r=(e.max.x-h.x)*c):(n=(e.max.x-h.x)*c,r=(e.min.x-h.x)*c),u>=0?(s=(e.min.y-h.y)*u,a=(e.max.y-h.y)*u):(s=(e.max.y-h.y)*u,a=(e.min.y-h.y)*u),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-h.z)*f,l=(e.max.z-h.z)*f):(o=(e.max.z-h.z)*f,l=(e.min.z-h.z)*f),n>l||o>r)||((o>n||n!==n)&&(n=o),(l<r||r!==r)&&(r=l),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Nn)!==null}intersectTriangle(e,t,n,r,s){const a=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,f=e.x-a.x,h=e.y-a.y,d=e.z-a.z,g=t.x-a.x,S=t.y-a.y,m=t.z-a.z,p=n.x-a.x,w=n.y-a.y,T=n.z-a.z,_=Math.abs(l),b=Math.abs(c),E=Math.abs(u);let I,x,A,U,G,z,J,H,Y,re,$,Z;if(_>=b&&_>=E?(A=l,z=f,Y=g,Z=p,l>=0?(I=c,x=u,U=h,G=d,J=S,H=m,re=w,$=T):(I=u,x=c,U=d,G=h,J=m,H=S,re=T,$=w)):b>=E?(A=c,z=h,Y=S,Z=w,c>=0?(I=u,x=l,U=d,G=f,J=m,H=g,re=T,$=p):(I=l,x=u,U=f,G=d,J=g,H=m,re=p,$=T)):(A=u,z=d,Y=m,Z=T,u>=0?(I=l,x=c,U=f,G=h,J=g,H=S,re=p,$=w):(I=c,x=l,U=h,G=f,J=S,H=g,re=w,$=p)),A===0)return null;const ie=I/A,se=x/A,he=1/A,Le=U-ie*z,pe=G-se*z,Ce=J-ie*Y,De=H-se*Y,Ge=re-ie*Z,N=$-se*Z,D=Ge*De-N*Ce,L=Le*N-pe*Ge,C=Ce*pe-De*Le;if(r){if(D<0||L<0||C<0)return null}else if((D<0||L<0||C<0)&&(D>0||L>0||C>0))return null;const B=D+L+C;if(B===0)return null;const ne=he*(D*z+L*Y+C*Z);return(B>0?ne<0:ne>0)?null:this.at(ne/B,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class fr extends ss{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ke(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ri,this.combine=al,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Vl=new ct,li=new uf,ls=new ur,Wl=new O,cs=new O,us=new O,hs=new O,oo=new O,fs=new O,Xl=new O,ds=new O;class st extends Xt{constructor(e=new yt,t=new fr){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){fs.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=o[l],f=s[l];u!==0&&(oo.fromBufferAttribute(f,e),a?fs.addScaledVector(oo,u):fs.addScaledVector(oo.sub(t),u))}t.add(fs)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ls.copy(n.boundingSphere),ls.applyMatrix4(s),li.copy(e.ray).recast(e.near),!(ls.containsPoint(li.origin)===!1&&(li.intersectSphere(ls,Wl)===null||li.origin.distanceToSquared(Wl)>(e.far-e.near)**2))&&(Vl.copy(s).invert(),li.copy(e.ray).applyMatrix4(Vl),!(n.boundingBox!==null&&li.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,li)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,h=s.groups,d=s.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,S=h.length;g<S;g++){const m=h[g],p=a[m.materialIndex],w=Math.max(m.start,d.start),T=Math.min(o.count,Math.min(m.start+m.count,d.start+d.count));for(let _=w,b=T;_<b;_+=3){const E=o.getX(_),I=o.getX(_+1),x=o.getX(_+2);r=ps(this,p,e,n,c,u,f,E,I,x),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),S=Math.min(o.count,d.start+d.count);for(let m=g,p=S;m<p;m+=3){const w=o.getX(m),T=o.getX(m+1),_=o.getX(m+2);r=ps(this,a,e,n,c,u,f,w,T,_),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,S=h.length;g<S;g++){const m=h[g],p=a[m.materialIndex],w=Math.max(m.start,d.start),T=Math.min(l.count,Math.min(m.start+m.count,d.start+d.count));for(let _=w,b=T;_<b;_+=3){const E=_,I=_+1,x=_+2;r=ps(this,p,e,n,c,u,f,E,I,x),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const g=Math.max(0,d.start),S=Math.min(l.count,d.start+d.count);for(let m=g,p=S;m<p;m+=3){const w=m,T=m+1,_=m+2;r=ps(this,a,e,n,c,u,f,w,T,_),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function hf(i,e,t,n,r,s,a,o){let l;if(e.side===Ot?l=n.intersectTriangle(a,s,r,!0,o):l=n.intersectTriangle(r,s,a,e.side===Qn,o),l===null)return null;ds.copy(o),ds.applyMatrix4(i.matrixWorld);const c=t.ray.origin.distanceTo(ds);return c<t.near||c>t.far?null:{distance:c,point:ds.clone(),object:i}}function ps(i,e,t,n,r,s,a,o,l,c){i.getVertexPosition(o,cs),i.getVertexPosition(l,us),i.getVertexPosition(c,hs);const u=hf(i,e,t,n,cs,us,hs,Xl);if(u){const f=new O;on.getBarycoord(Xl,cs,us,hs,f),r&&(u.uv=on.getInterpolatedAttribute(r,o,l,c,f,new ae)),s&&(u.uv1=on.getInterpolatedAttribute(s,o,l,c,f,new ae)),a&&(u.normal=on.getInterpolatedAttribute(a,o,l,c,f,new O),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:l,c,normal:new O,materialIndex:0};on.getNormal(cs,us,hs,h.normal),u.face=h,u.barycoord=f}return u}class lo extends Dt{constructor(e=null,t=1,n=1,r,s,a,o,l,c=Rt,u=Rt,f,h){super(null,a,o,l,c,u,r,s,f,h),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class vt extends qt{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const Di=new ct,ql=new ct,ms=[],Yl=new si,ff=new ct,dr=new st,pr=new ur;class Ni extends st{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new vt(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<n;r++)this.setMatrixAt(r,ff)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new si),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Di),Yl.copy(e.boundingBox).applyMatrix4(Di),this.boundingBox.union(Yl)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new ur),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Di),pr.copy(e.boundingSphere).applyMatrix4(Di),this.boundingSphere.union(pr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=n.length+1,a=e*s+1;for(let o=0;o<n.length;o++)n[o]=r[a+o]}raycast(e,t){const n=this.matrixWorld,r=this.count;if(dr.geometry=this.geometry,dr.material=this.material,dr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),pr.copy(this.boundingSphere),pr.applyMatrix4(n),e.ray.intersectsSphere(pr)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,Di),ql.multiplyMatrices(n,Di),dr.matrixWorld=ql,dr.raycast(e,ms);for(let a=0,o=ms.length;a<o;a++){const l=ms[a];l.instanceId=s,l.object=this,t.push(l)}ms.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new vt(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){const n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new lo(new Float32Array(r*this.count),r,this.count,kr,nn));const s=this.morphTexture.source.data.data;let a=0;for(let c=0;c<n.length;c++)a+=n[c];const o=this.geometry.morphTargetsRelative?1:1-a,l=r*e;return s[l]=o,s.set(n,l+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const ci=new ur,df=new ae(.5,.5),gs=new O;class Kl{constructor(e=new Dn,t=new Dn,n=new Dn,r=new Dn,s=new Dn,a=new Dn){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=_n,n=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],l=s[2],c=s[3],u=s[4],f=s[5],h=s[6],d=s[7],g=s[8],S=s[9],m=s[10],p=s[11],w=s[12],T=s[13],_=s[14],b=s[15];if(r[0].setComponents(c-a,d-u,p-g,b-w).normalize(),r[1].setComponents(c+a,d+u,p+g,b+w).normalize(),r[2].setComponents(c+o,d+f,p+S,b+T).normalize(),r[3].setComponents(c-o,d-f,p-S,b-T).normalize(),n)r[4].setComponents(l,h,m,_).normalize(),r[5].setComponents(c-l,d-h,p-m,b-_).normalize();else if(r[4].setComponents(c-l,d-h,p-m,b-_).normalize(),t===_n)r[5].setComponents(c+l,d+h,p+m,b+_).normalize();else if(t===$r)r[5].setComponents(l,h,m,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),ci.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),ci.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(ci)}intersectsSprite(e){ci.center.set(0,0,0);const t=df.distanceTo(e.center);return ci.radius=.7071067811865476+t,ci.applyMatrix4(e.matrixWorld),this.intersectsSphere(ci)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(gs.x=r.normal.x>0?e.max.x:e.min.x,gs.y=r.normal.y>0?e.max.y:e.min.y,gs.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(gs)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Zl extends Dt{constructor(e=[],t=jn,n,r,s,a,o,l,c,u){super(e,t,n,r,s,a,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class co extends Dt{constructor(e,t,n,r,s,a,o,l,c){super(e,t,n,r,s,a,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class mr extends Dt{constructor(e,t,n=xn,r,s,a,o=Rt,l=Rt,c,u=An,f=1){if(u!==An&&u!==ei)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:e,height:t,depth:f};super(h,r,s,a,o,l,u,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Va(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class pf extends mr{constructor(e,t=xn,n=jn,r,s,a=Rt,o=Rt,l,c=An){const u={width:e,height:e,depth:1},f=[u,u,u,u,u,u];super(e,e,t,n,r,s,a,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class $l extends Dt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class je extends yt{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const l=[],c=[],u=[],f=[];let h=0,d=0;g("z","y","x",-1,-1,n,t,e,a,s,0),g("z","y","x",1,-1,n,t,-e,a,s,1),g("x","z","y",1,1,e,n,t,r,a,2),g("x","z","y",1,-1,e,n,-t,r,a,3),g("x","y","z",1,-1,e,t,n,r,s,4),g("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(l),this.setAttribute("position",new rt(c,3)),this.setAttribute("normal",new rt(u,3)),this.setAttribute("uv",new rt(f,2));function g(S,m,p,w,T,_,b,E,I,x,A){const U=_/I,G=b/x,z=_/2,J=b/2,H=E/2,Y=I+1,re=x+1;let $=0,Z=0;const ie=new O;for(let se=0;se<re;se++){const he=se*G-J;for(let Le=0;Le<Y;Le++){const pe=Le*U-z;ie[S]=pe*w,ie[m]=he*T,ie[p]=H,c.push(ie.x,ie.y,ie.z),ie[S]=0,ie[m]=0,ie[p]=E>0?1:-1,u.push(ie.x,ie.y,ie.z),f.push(Le/I),f.push(1-se/x),$+=1}}for(let se=0;se<x;se++)for(let he=0;he<I;he++){const Le=h+he+Y*se,pe=h+he+Y*(se+1),Ce=h+(he+1)+Y*(se+1),De=h+(he+1)+Y*se;l.push(Le,pe,De),l.push(pe,Ce,De),Z+=6}o.addGroup(d,Z,A),d+=Z,h+=$}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new je(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class uo extends yt{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],l=[],c=new O,u=new ae;a.push(0,0,0),o.push(0,0,1),l.push(.5,.5);for(let f=0,h=3;f<=t;f++,h+=3){const d=n+f/t*r;c.x=e*Math.cos(d),c.y=e*Math.sin(d),a.push(c.x,c.y,c.z),o.push(0,0,1),u.x=(a[h]/e+1)/2,u.y=(a[h+1]/e+1)/2,l.push(u.x,u.y)}for(let f=1;f<=t;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new rt(a,3)),this.setAttribute("normal",new rt(o,3)),this.setAttribute("uv",new rt(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new uo(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class Ut extends yt{constructor(e=1,t=1,n=1,r=32,s=1,a=!1,o=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:r,heightSegments:s,openEnded:a,thetaStart:o,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const u=[],f=[],h=[],d=[];let g=0;const S=[],m=n/2;let p=0;w(),a===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(u),this.setAttribute("position",new rt(f,3)),this.setAttribute("normal",new rt(h,3)),this.setAttribute("uv",new rt(d,2));function w(){const _=new O,b=new O;let E=0;const I=(t-e)/n;for(let x=0;x<=s;x++){const A=[],U=x/s,G=U*(t-e)+e;for(let z=0;z<=r;z++){const J=z/r,H=J*l+o,Y=Math.sin(H),re=Math.cos(H);b.x=G*Y,b.y=-U*n+m,b.z=G*re,f.push(b.x,b.y,b.z),_.set(Y,I,re).normalize(),h.push(_.x,_.y,_.z),d.push(J,1-U),A.push(g++)}S.push(A)}for(let x=0;x<r;x++)for(let A=0;A<s;A++){const U=S[A][x],G=S[A+1][x],z=S[A+1][x+1],J=S[A][x+1];(e>0||A!==0)&&(u.push(U,G,J),E+=3),(t>0||A!==s-1)&&(u.push(G,z,J),E+=3)}c.addGroup(p,E,0),p+=E}function T(_){const b=g,E=new ae,I=new O;let x=0;const A=_===!0?e:t,U=_===!0?1:-1;for(let z=1;z<=r;z++)f.push(0,m*U,0),h.push(0,U,0),d.push(.5,.5),g++;const G=g;for(let z=0;z<=r;z++){const H=z/r*l+o,Y=Math.cos(H),re=Math.sin(H);I.x=A*re,I.y=m*U,I.z=A*Y,f.push(I.x,I.y,I.z),h.push(0,U,0),E.x=Y*.5+.5,E.y=re*.5*U+.5,d.push(E.x,E.y),g++}for(let z=0;z<r;z++){const J=b+z,H=G+z;_===!0?u.push(H,H+1,J):u.push(H+1,H,J),x+=3}c.addGroup(p,x,_===!0?1:2),p+=x}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ut(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class Mn{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Ye("Curve: .getPoint() not implemented.")}getPointAt(e,t){const n=this.getUtoTmapping(e);return this.getPoint(n,t)}getPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return t}getSpacedPoints(e=5){const t=[];for(let n=0;n<=e;n++)t.push(this.getPointAt(n/e));return t}getLength(){const e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const t=[];let n,r=this.getPoint(0),s=0;t.push(0);for(let a=1;a<=e;a++)n=this.getPoint(a/e),s+=n.distanceTo(r),t.push(s),r=n;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){const n=this.getLengths();let r=0;const s=n.length;let a;t?a=t:a=e*n[s-1];let o=0,l=s-1,c;for(;o<=l;)if(r=Math.floor(o+(l-o)/2),c=n[r]-a,c<0)o=r+1;else if(c>0)l=r-1;else{l=r;break}if(r=l,n[r]===a)return r/(s-1);const u=n[r],h=n[r+1]-u,d=(a-u)/h;return(r+d)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);const a=this.getPoint(r),o=this.getPoint(s),l=t||(a.isVector2?new ae:new O);return l.copy(o).sub(a).normalize(),l}getTangentAt(e,t){const n=this.getUtoTmapping(e);return this.getTangent(n,t)}computeFrenetFrames(e,t=!1){const n=new O,r=[],s=[],a=[],o=new O,l=new ct;for(let d=0;d<=e;d++){const g=d/e;r[d]=this.getTangentAt(g,new O)}s[0]=new O,a[0]=new O;let c=Number.MAX_VALUE;const u=Math.abs(r[0].x),f=Math.abs(r[0].y),h=Math.abs(r[0].z);u<=c&&(c=u,n.set(1,0,0)),f<=c&&(c=f,n.set(0,1,0)),h<=c&&n.set(0,0,1),o.crossVectors(r[0],n).normalize(),s[0].crossVectors(r[0],o),a[0].crossVectors(r[0],s[0]);for(let d=1;d<=e;d++){if(s[d]=s[d-1].clone(),a[d]=a[d-1].clone(),o.crossVectors(r[d-1],r[d]),o.length()>Number.EPSILON){o.normalize();const g=Math.acos(Qe(r[d-1].dot(r[d]),-1,1));s[d].applyMatrix4(l.makeRotationAxis(o,g))}a[d].crossVectors(r[d],s[d])}if(t===!0){let d=Math.acos(Qe(s[0].dot(s[e]),-1,1));d/=e,r[0].dot(o.crossVectors(s[0],s[e]))>0&&(d=-d);for(let g=1;g<=e;g++)s[g].applyMatrix4(l.makeRotationAxis(r[g],d*g)),a[g].crossVectors(r[g],s[g])}return{tangents:r,normals:s,binormals:a}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){const e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}}class ho extends Mn{constructor(e=0,t=0,n=1,r=1,s=0,a=Math.PI*2,o=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=n,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=a,this.aClockwise=o,this.aRotation=l}getPoint(e,t=new ae){const n=t,r=Math.PI*2;let s=this.aEndAngle-this.aStartAngle;const a=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(a?s=0:s=r),this.aClockwise===!0&&!a&&(s===r?s=-r:s=s-r);const o=this.aStartAngle+e*s;let l=this.aX+this.xRadius*Math.cos(o),c=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),h=l-this.aX,d=c-this.aY;l=h*u-d*f+this.aX,c=h*f+d*u+this.aY}return n.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){const e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}}class mf extends ho{constructor(e,t,n,r,s,a){super(e,t,n,n,r,s,a),this.isArcCurve=!0,this.type="ArcCurve"}}function fo(){let i=0,e=0,t=0,n=0;function r(s,a,o,l){i=s,e=o,t=-3*s+3*a-2*o-l,n=2*s-2*a+o+l}return{initCatmullRom:function(s,a,o,l,c){r(a,o,c*(o-s),c*(l-a))},initNonuniformCatmullRom:function(s,a,o,l,c,u,f){let h=(a-s)/c-(o-s)/(c+u)+(o-a)/u,d=(o-a)/u-(l-a)/(u+f)+(l-o)/f;h*=u,d*=u,r(a,o,h,d)},calc:function(s){const a=s*s,o=a*s;return i+e*s+t*a+n*o}}}const Jl=new O,Ql=new O,po=new fo,mo=new fo,go=new fo;class jl extends Mn{constructor(e=[],t=!1,n="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=n,this.tension=r}getPoint(e,t=new O){const n=t,r=this.points,s=r.length,a=(s-(this.closed?0:1))*e;let o=Math.floor(a),l=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/s)+1)*s:l===0&&o===s-1&&(o=s-2,l=1);let c,u;this.closed||o>0?c=r[(o-1)%s]:(Ql.subVectors(r[0],r[1]).add(r[0]),c=Ql);const f=r[o%s],h=r[(o+1)%s];if(this.closed||o+2<s?u=r[(o+2)%s]:(Jl.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=Jl),this.curveType==="centripetal"||this.curveType==="chordal"){const d=this.curveType==="chordal"?.5:.25;let g=Math.pow(c.distanceToSquared(f),d),S=Math.pow(f.distanceToSquared(h),d),m=Math.pow(h.distanceToSquared(u),d);S<1e-4&&(S=1),g<1e-4&&(g=S),m<1e-4&&(m=S),po.initNonuniformCatmullRom(c.x,f.x,h.x,u.x,g,S,m),mo.initNonuniformCatmullRom(c.y,f.y,h.y,u.y,g,S,m),go.initNonuniformCatmullRom(c.z,f.z,h.z,u.z,g,S,m)}else this.curveType==="catmullrom"&&(po.initCatmullRom(c.x,f.x,h.x,u.x,this.tension),mo.initCatmullRom(c.y,f.y,h.y,u.y,this.tension),go.initCatmullRom(c.z,f.z,h.z,u.z,this.tension));return n.set(po.calc(l),mo.calc(l),go.calc(l)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(new O().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}}function ec(i,e,t,n,r){const s=(n-e)*.5,a=(r-t)*.5,o=i*i,l=i*o;return(2*t-2*n+s+a)*l+(-3*t+3*n-2*s-a)*o+s*i+t}function gf(i,e){const t=1-i;return t*t*e}function vf(i,e){return 2*(1-i)*i*e}function xf(i,e){return i*i*e}function gr(i,e,t,n){return gf(i,e)+vf(i,t)+xf(i,n)}function _f(i,e){const t=1-i;return t*t*t*e}function Mf(i,e){const t=1-i;return 3*t*t*i*e}function Sf(i,e){return 3*(1-i)*i*i*e}function yf(i,e){return i*i*i*e}function vr(i,e,t,n,r){return _f(i,e)+Mf(i,t)+Sf(i,n)+yf(i,r)}class tc extends Mn{constructor(e=new ae,t=new ae,n=new ae,r=new ae){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new ae){const n=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(vr(e,r.x,s.x,a.x,o.x),vr(e,r.y,s.y,a.y,o.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class bf extends Mn{constructor(e=new O,t=new O,n=new O,r=new O){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=n,this.v3=r}getPoint(e,t=new O){const n=t,r=this.v0,s=this.v1,a=this.v2,o=this.v3;return n.set(vr(e,r.x,s.x,a.x,o.x),vr(e,r.y,s.y,a.y,o.y),vr(e,r.z,s.z,a.z,o.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}}class nc extends Mn{constructor(e=new ae,t=new ae){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ae){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ae){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class Ef extends Mn{constructor(e=new O,t=new O){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new O){const n=t;return e===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(e).add(this.v1)),n}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new O){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class ic extends Mn{constructor(e=new ae,t=new ae,n=new ae){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new ae){const n=t,r=this.v0,s=this.v1,a=this.v2;return n.set(gr(e,r.x,s.x,a.x),gr(e,r.y,s.y,a.y)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class rc extends Mn{constructor(e=new O,t=new O,n=new O){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=n}getPoint(e,t=new O){const n=t,r=this.v0,s=this.v1,a=this.v2;return n.set(gr(e,r.x,s.x,a.x),gr(e,r.y,s.y,a.y),gr(e,r.z,s.z,a.z)),n}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){const e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}}class sc extends Mn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ae){const n=t,r=this.points,s=(r.length-1)*e,a=Math.floor(s),o=s-a,l=r[a===0?a:a-1],c=r[a],u=r[a>r.length-2?r.length-1:a+1],f=r[a>r.length-3?r.length-1:a+2];return n.set(ec(o,l.x,c.x,u.x,f.x),ec(o,l.y,c.y,u.y,f.y)),n}copy(e){super.copy(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.points=[];for(let t=0,n=this.points.length;t<n;t++){const r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,n=e.points.length;t<n;t++){const r=e.points[t];this.points.push(new ae().fromArray(r))}return this}}var vs=Object.freeze({__proto__:null,ArcCurve:mf,CatmullRomCurve3:jl,CubicBezierCurve:tc,CubicBezierCurve3:bf,EllipseCurve:ho,LineCurve:nc,LineCurve3:Ef,QuadraticBezierCurve:ic,QuadraticBezierCurve3:rc,SplineCurve:sc});class wf extends Mn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){const e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){const n=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new vs[n](t,e))}return this}getPoint(e,t){const n=e*this.getLength(),r=this.getCurveLengths();let s=0;for(;s<r.length;){if(r[s]>=n){const a=r[s]-n,o=this.curves[s],l=o.getLength(),c=l===0?0:1-a/l;return o.getPointAt(c,t)}s++}return null}getLength(){const e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const e=[];let t=0;for(let n=0,r=this.curves.length;n<r;n++)t+=this.curves[n].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){const t=[];for(let n=0;n<=e;n++)t.push(this.getPoint(n/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){const t=[];let n;for(let r=0,s=this.curves;r<s.length;r++){const a=s[r],o=a.isEllipseCurve?e*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?e*a.points.length:e,l=a.getPoints(o);for(let c=0;c<l.length;c++){const u=l[c];n&&n.equals(u)||(t.push(u),n=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){const e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,n=this.curves.length;t<n;t++){const r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,n=e.curves.length;t<n;t++){const r=e.curves[t];this.curves.push(new vs[r.type]().fromJSON(r))}return this}}class ui extends wf{constructor(e){super(),this.type="Path",this.currentPoint=new ae,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,n=e.length;t<n;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){const n=new nc(this.currentPoint.clone(),new ae(e,t));return this.curves.push(n),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,n,r){const s=new ic(this.currentPoint.clone(),new ae(e,t),new ae(n,r));return this.curves.push(s),this.currentPoint.set(n,r),this}bezierCurveTo(e,t,n,r,s,a){const o=new tc(this.currentPoint.clone(),new ae(e,t),new ae(n,r),new ae(s,a));return this.curves.push(o),this.currentPoint.set(s,a),this}splineThru(e){const t=[this.currentPoint.clone()].concat(e),n=new sc(t);return this.curves.push(n),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,n,r,s,a){const o=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+o,t+l,n,r,s,a),this}absarc(e,t,n,r,s,a){return this.absellipse(e,t,n,n,r,s,a),this}ellipse(e,t,n,r,s,a,o,l){const c=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+c,t+u,n,r,s,a,o,l),this}absellipse(e,t,n,r,s,a,o,l){const c=new ho(e,t,n,r,s,a,o,l);if(this.curves.length>0){const f=c.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(c);const u=c.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){const e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}}class xs extends ui{constructor(e){super(e),this.uuid=ii(),this.type="Shape",this.holes=[]}getPointsHoles(e){const t=[];for(let n=0,r=this.holes.length;n<r;n++)t[n]=this.holes[n].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){const e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,n=this.holes.length;t<n;t++){const r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,n=e.holes.length;t<n;t++){const r=e.holes[t];this.holes.push(new ui().fromJSON(r))}return this}}function Tf(i,e,t=2){const n=e&&e.length,r=n?e[0]*t:i.length;let s=ac(i,0,r,t,!0);const a=[];if(!s||s.next===s.prev)return a;let o,l,c;if(n&&(s=Lf(i,e,s,t)),i.length>80*t){o=i[0],l=i[1];let u=o,f=l;for(let h=t;h<r;h+=t){const d=i[h],g=i[h+1];d<o&&(o=d),g<l&&(l=g),d>u&&(u=d),g>f&&(f=g)}c=Math.max(u-o,f-l),c=c!==0?32767/c:0}return xr(s,a,t,o,l,c,0),a}function ac(i,e,t,n,r){let s;if(r===Gf(i,e,t,n)>0)for(let a=e;a<t;a+=n)s=uc(a/n|0,i[a],i[a+1],s);else for(let a=t-n;a>=e;a-=n)s=uc(a/n|0,i[a],i[a+1],s);return s&&Ui(s,s.next)&&(Sr(s),s=s.next),s}function hi(i,e){if(!i)return i;e||(e=i);let t=i,n;do if(n=!1,!t.steiner&&(Ui(t,t.next)||xt(t.prev,t,t.next)===0)){if(Sr(t),t=e=t.prev,t===t.next)break;n=!0}else t=t.next;while(n||t!==e);return e}function xr(i,e,t,n,r,s,a){if(!i)return;!a&&s&&Ff(i,n,r,s);let o=i;for(;i.prev!==i.next;){const l=i.prev,c=i.next;if(s?Rf(i,n,r,s):Af(i)){e.push(l.i,i.i,c.i),Sr(i),i=c.next,o=c.next;continue}if(i=c,i===o){a?a===1?(i=Cf(hi(i),e),xr(i,e,t,n,r,s,2)):a===2&&Pf(i,e,t,n,r,s):xr(hi(i),e,t,n,r,s,1);break}}}function Af(i){const e=i.prev,t=i,n=i.next;if(xt(e,t,n)>=0)return!1;const r=e.x,s=t.x,a=n.x,o=e.y,l=t.y,c=n.y,u=Math.min(r,s,a),f=Math.min(o,l,c),h=Math.max(r,s,a),d=Math.max(o,l,c);let g=n.next;for(;g!==e;){if(g.x>=u&&g.x<=h&&g.y>=f&&g.y<=d&&_r(r,o,s,l,a,c,g.x,g.y)&&xt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Rf(i,e,t,n){const r=i.prev,s=i,a=i.next;if(xt(r,s,a)>=0)return!1;const o=r.x,l=s.x,c=a.x,u=r.y,f=s.y,h=a.y,d=Math.min(o,l,c),g=Math.min(u,f,h),S=Math.max(o,l,c),m=Math.max(u,f,h),p=vo(d,g,e,t,n),w=vo(S,m,e,t,n);let T=i.prevZ,_=i.nextZ;for(;T&&T.z>=p&&_&&_.z<=w;){if(T.x>=d&&T.x<=S&&T.y>=g&&T.y<=m&&T!==r&&T!==a&&_r(o,u,l,f,c,h,T.x,T.y)&&xt(T.prev,T,T.next)>=0||(T=T.prevZ,_.x>=d&&_.x<=S&&_.y>=g&&_.y<=m&&_!==r&&_!==a&&_r(o,u,l,f,c,h,_.x,_.y)&&xt(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;T&&T.z>=p;){if(T.x>=d&&T.x<=S&&T.y>=g&&T.y<=m&&T!==r&&T!==a&&_r(o,u,l,f,c,h,T.x,T.y)&&xt(T.prev,T,T.next)>=0)return!1;T=T.prevZ}for(;_&&_.z<=w;){if(_.x>=d&&_.x<=S&&_.y>=g&&_.y<=m&&_!==r&&_!==a&&_r(o,u,l,f,c,h,_.x,_.y)&&xt(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function Cf(i,e){let t=i;do{const n=t.prev,r=t.next.next;!Ui(n,r)&&lc(n,t,t.next,r)&&Mr(n,r)&&Mr(r,n)&&(e.push(n.i,t.i,r.i),Sr(t),Sr(t.next),t=i=r),t=t.next}while(t!==i);return hi(t)}function Pf(i,e,t,n,r,s){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&zf(a,o)){let l=cc(a,o);a=hi(a,a.next),l=hi(l,l.next),xr(a,e,t,n,r,s,0),xr(l,e,t,n,r,s,0);return}o=o.next}a=a.next}while(a!==i)}function Lf(i,e,t,n){const r=[];for(let s=0,a=e.length;s<a;s++){const o=e[s]*n,l=s<a-1?e[s+1]*n:i.length,c=ac(i,o,l,n,!1);c===c.next&&(c.steiner=!0),r.push(Bf(c))}r.sort(If);for(let s=0;s<r.length;s++)t=Df(r[s],t);return t}function If(i,e){let t=i.x-e.x;if(t===0&&(t=i.y-e.y,t===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=n-r}return t}function Df(i,e){const t=Nf(i,e);if(!t)return e;const n=cc(t,i);return hi(n,n.next),hi(t,t.next)}function Nf(i,e){let t=e;const n=i.x,r=i.y;let s=-1/0,a;if(Ui(i,t))return t;do{if(Ui(i,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){const f=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(f<=n&&f>s&&(s=f,a=t.x<t.next.x?t:t.next,f===n))return a}t=t.next}while(t!==e);if(!a)return null;const o=a,l=a.x,c=a.y;let u=1/0;t=a;do{if(n>=t.x&&t.x>=l&&n!==t.x&&oc(r<c?n:s,r,l,c,r<c?s:n,r,t.x,t.y)){const f=Math.abs(r-t.y)/(n-t.x);Mr(t,i)&&(f<u||f===u&&(t.x>a.x||t.x===a.x&&Uf(a,t)))&&(a=t,u=f)}t=t.next}while(t!==o);return a}function Uf(i,e){return xt(i.prev,i,e.prev)<0&&xt(e.next,i,i.next)<0}function Ff(i,e,t,n){let r=i;do r.z===0&&(r.z=vo(r.x,r.y,e,t,n)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==i);r.prevZ.nextZ=null,r.prevZ=null,Of(r)}function Of(i){let e,t=1;do{let n=i,r;i=null;let s=null;for(e=0;n;){e++;let a=n,o=0;for(let c=0;c<t&&(o++,a=a.nextZ,!!a);c++);let l=t;for(;o>0||l>0&&a;)o!==0&&(l===0||!a||n.z<=a.z)?(r=n,n=n.nextZ,o--):(r=a,a=a.nextZ,l--),s?s.nextZ=r:i=r,r.prevZ=s,s=r;n=a}s.nextZ=null,t*=2}while(e>1);return i}function vo(i,e,t,n,r){return i=(i-t)*r|0,e=(e-n)*r|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,i|e<<1}function Bf(i){let e=i,t=i;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==i);return t}function oc(i,e,t,n,r,s,a,o){return(r-a)*(e-o)>=(i-a)*(s-o)&&(i-a)*(n-o)>=(t-a)*(e-o)&&(t-a)*(s-o)>=(r-a)*(n-o)}function _r(i,e,t,n,r,s,a,o){return!(i===a&&e===o)&&oc(i,e,t,n,r,s,a,o)}function zf(i,e){return i.next.i!==e.i&&i.prev.i!==e.i&&!Hf(i,e)&&(Mr(i,e)&&Mr(e,i)&&kf(i,e)&&(xt(i.prev,i,e.prev)||xt(i,e.prev,e))||Ui(i,e)&&xt(i.prev,i,i.next)>0&&xt(e.prev,e,e.next)>0)}function xt(i,e,t){return(e.y-i.y)*(t.x-e.x)-(e.x-i.x)*(t.y-e.y)}function Ui(i,e){return i.x===e.x&&i.y===e.y}function lc(i,e,t,n){const r=Ms(xt(i,e,t)),s=Ms(xt(i,e,n)),a=Ms(xt(t,n,i)),o=Ms(xt(t,n,e));return!!(r!==s&&a!==o||r===0&&_s(i,t,e)||s===0&&_s(i,n,e)||a===0&&_s(t,i,n)||o===0&&_s(t,e,n))}function _s(i,e,t){return e.x<=Math.max(i.x,t.x)&&e.x>=Math.min(i.x,t.x)&&e.y<=Math.max(i.y,t.y)&&e.y>=Math.min(i.y,t.y)}function Ms(i){return i>0?1:i<0?-1:0}function Hf(i,e){let t=i;do{if(t.i!==i.i&&t.next.i!==i.i&&t.i!==e.i&&t.next.i!==e.i&&lc(t,t.next,i,e))return!0;t=t.next}while(t!==i);return!1}function Mr(i,e){return xt(i.prev,i,i.next)<0?xt(i,e,i.next)>=0&&xt(i,i.prev,e)>=0:xt(i,e,i.prev)<0||xt(i,i.next,e)<0}function kf(i,e){let t=i,n=!1;const r=(i.x+e.x)/2,s=(i.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(n=!n),t=t.next;while(t!==i);return n}function cc(i,e){const t=xo(i.i,i.x,i.y),n=xo(e.i,e.x,e.y),r=i.next,s=e.prev;return i.next=e,e.prev=i,t.next=r,r.prev=t,n.next=t,t.prev=n,s.next=n,n.prev=s,n}function uc(i,e,t,n){const r=xo(i,e,t);return n?(r.next=n.next,r.prev=n,n.next.prev=r,n.next=r):(r.prev=r,r.next=r),r}function Sr(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function xo(i,e,t){return{i,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Gf(i,e,t,n){let r=0;for(let s=e,a=t-n;s<t;s+=n)r+=(i[a]-i[s])*(i[s+1]+i[a+1]),a=s;return r}class Vf{static triangulate(e,t,n=2){return Tf(e,t,n)}}class Vn{static area(e){const t=e.length;let n=0;for(let r=t-1,s=0;s<t;r=s++)n+=e[r].x*e[s].y-e[s].x*e[r].y;return n*.5}static isClockWise(e){return Vn.area(e)<0}static triangulateShape(e,t){const n=[],r=[],s=[];hc(e),fc(n,e);let a=e.length;t.forEach(hc);for(let l=0;l<t.length;l++)r.push(a),a+=t[l].length,fc(n,t[l]);const o=Vf.triangulate(n,r);for(let l=0;l<o.length;l+=3)s.push(o.slice(l,l+3));return s}}function hc(i){const e=i.length;e>2&&i[e-1].equals(i[0])&&i.pop()}function fc(i,e){for(let t=0;t<e.length;t++)i.push(e[t].x),i.push(e[t].y)}class yr extends yt{constructor(e=new xs([new ae(.5,.5),new ae(-.5,.5),new ae(-.5,-.5),new ae(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];const n=this,r=[],s=[];for(let o=0,l=e.length;o<l;o++){const c=e[o];a(c)}this.setAttribute("position",new rt(r,3)),this.setAttribute("uv",new rt(s,2)),this.computeVertexNormals();function a(o){const l=[],c=t.curveSegments!==void 0?t.curveSegments:12,u=t.steps!==void 0?t.steps:1,f=t.depth!==void 0?t.depth:1;let h=t.bevelEnabled!==void 0?t.bevelEnabled:!0,d=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:d-.1,S=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3;const p=t.extrudePath,w=t.UVGenerator!==void 0?t.UVGenerator:Wf;let T,_=!1,b,E,I,x;if(p){T=p.getSpacedPoints(u),_=!0,h=!1;const R=p.isCatmullRomCurve3?p.closed:!1;b=p.computeFrenetFrames(u,R),E=new O,I=new O,x=new O}h||(m=0,d=0,g=0,S=0);const A=o.extractPoints(c);let U=A.shape;const G=A.holes;if(!Vn.isClockWise(U)){U=U.reverse();for(let R=0,k=G.length;R<k;R++){const F=G[R];Vn.isClockWise(F)&&(G[R]=F.reverse())}}function J(R){const F=10000000000000001e-36;let K=R[0];for(let Q=1;Q<=R.length;Q++){const ce=Q%R.length,ve=R[ce],me=ve.x-K.x,q=ve.y-K.y,M=me*me+q*q,Ae=Math.max(Math.abs(ve.x),Math.abs(ve.y),Math.abs(K.x),Math.abs(K.y)),Fe=F*Ae*Ae;if(M<=Fe){R.splice(ce,1),Q--;continue}K=ve}}J(U),G.forEach(J);const H=G.length,Y=U;for(let R=0;R<H;R++){const k=G[R];U=U.concat(k)}function re(R,k,F){return k||nt("ExtrudeGeometry: vec does not exist"),R.clone().addScaledVector(k,F)}const $=U.length;function Z(R,k,F){let K,Q,ce;const ve=R.x-k.x,me=R.y-k.y,q=F.x-R.x,M=F.y-R.y,Ae=ve*ve+me*me,Fe=ve*M-me*q;if(Math.abs(Fe)>Number.EPSILON){const P=Math.sqrt(Ae),v=Math.sqrt(q*q+M*M),X=k.x-me/P,j=k.y+ve/P,le=F.x-M/v,_e=F.y+q/v,Me=((le-X)*M-(_e-j)*q)/(ve*M-me*q);K=X+ve*Me-R.x,Q=j+me*Me-R.y;const ue=K*K+Q*Q;if(ue<=2)return new ae(K,Q);ce=Math.sqrt(ue/2)}else{let P=!1;ve>Number.EPSILON?q>Number.EPSILON&&(P=!0):ve<-Number.EPSILON?q<-Number.EPSILON&&(P=!0):Math.sign(me)===Math.sign(M)&&(P=!0),P?(K=-me,Q=ve,ce=Math.sqrt(Ae)):(K=ve,Q=me,ce=Math.sqrt(Ae/2))}return new ae(K/ce,Q/ce)}const ie=[];for(let R=0,k=Y.length,F=k-1,K=R+1;R<k;R++,F++,K++)F===k&&(F=0),K===k&&(K=0),ie[R]=Z(Y[R],Y[F],Y[K]);const se=[];let he,Le=ie.concat();for(let R=0,k=H;R<k;R++){const F=G[R];he=[];for(let K=0,Q=F.length,ce=Q-1,ve=K+1;K<Q;K++,ce++,ve++)ce===Q&&(ce=0),ve===Q&&(ve=0),he[K]=Z(F[K],F[ce],F[ve]);se.push(he),Le=Le.concat(he)}let pe;if(m===0)pe=Vn.triangulateShape(Y,G);else{const R=[],k=[];for(let F=0;F<m;F++){const K=F/m,Q=d*Math.cos(K*Math.PI/2),ce=g*Math.sin(K*Math.PI/2)+S;for(let ve=0,me=Y.length;ve<me;ve++){const q=re(Y[ve],ie[ve],ce);L(q.x,q.y,-Q),K===0&&R.push(q)}for(let ve=0,me=H;ve<me;ve++){const q=G[ve];he=se[ve];const M=[];for(let Ae=0,Fe=q.length;Ae<Fe;Ae++){const P=re(q[Ae],he[Ae],ce);L(P.x,P.y,-Q),K===0&&M.push(P)}K===0&&k.push(M)}}pe=Vn.triangulateShape(R,k)}const Ce=pe.length,De=g+S;for(let R=0;R<$;R++){const k=h?re(U[R],Le[R],De):U[R];_?(I.copy(b.normals[0]).multiplyScalar(k.x),E.copy(b.binormals[0]).multiplyScalar(k.y),x.copy(T[0]).add(I).add(E),L(x.x,x.y,x.z)):L(k.x,k.y,0)}for(let R=1;R<=u;R++)for(let k=0;k<$;k++){const F=h?re(U[k],Le[k],De):U[k];_?(I.copy(b.normals[R]).multiplyScalar(F.x),E.copy(b.binormals[R]).multiplyScalar(F.y),x.copy(T[R]).add(I).add(E),L(x.x,x.y,x.z)):L(F.x,F.y,f/u*R)}for(let R=m-1;R>=0;R--){const k=R/m,F=d*Math.cos(k*Math.PI/2),K=g*Math.sin(k*Math.PI/2)+S;for(let Q=0,ce=Y.length;Q<ce;Q++){const ve=re(Y[Q],ie[Q],K);L(ve.x,ve.y,f+F)}for(let Q=0,ce=G.length;Q<ce;Q++){const ve=G[Q];he=se[Q];for(let me=0,q=ve.length;me<q;me++){const M=re(ve[me],he[me],K);_?L(M.x,M.y+T[u-1].y,T[u-1].x+F):L(M.x,M.y,f+F)}}}Ge(),N();function Ge(){const R=r.length/3;if(h){let k=0,F=$*k;for(let K=0;K<Ce;K++){const Q=pe[K];C(Q[2]+F,Q[1]+F,Q[0]+F)}k=u+m*2,F=$*k;for(let K=0;K<Ce;K++){const Q=pe[K];C(Q[0]+F,Q[1]+F,Q[2]+F)}}else{for(let k=0;k<Ce;k++){const F=pe[k];C(F[2],F[1],F[0])}for(let k=0;k<Ce;k++){const F=pe[k];C(F[0]+$*u,F[1]+$*u,F[2]+$*u)}}n.addGroup(R,r.length/3-R,0)}function N(){const R=r.length/3;let k=0;D(Y,k),k+=Y.length;for(let F=0,K=G.length;F<K;F++){const Q=G[F];D(Q,k),k+=Q.length}n.addGroup(R,r.length/3-R,1)}function D(R,k){let F=R.length;for(;--F>=0;){const K=F;let Q=F-1;Q<0&&(Q=R.length-1);for(let ce=0,ve=u+m*2;ce<ve;ce++){const me=$*ce,q=$*(ce+1),M=k+K+me,Ae=k+Q+me,Fe=k+Q+q,P=k+K+q;B(M,Ae,Fe,P)}}}function L(R,k,F){l.push(R),l.push(k),l.push(F)}function C(R,k,F){ne(R),ne(k),ne(F);const K=r.length/3,Q=w.generateTopUV(n,r,K-3,K-2,K-1);ge(Q[0]),ge(Q[1]),ge(Q[2])}function B(R,k,F,K){ne(R),ne(k),ne(K),ne(k),ne(F),ne(K);const Q=r.length/3,ce=w.generateSideWallUV(n,r,Q-6,Q-3,Q-2,Q-1);ge(ce[0]),ge(ce[1]),ge(ce[3]),ge(ce[1]),ge(ce[2]),ge(ce[3])}function ne(R){r.push(l[R*3+0]),r.push(l[R*3+1]),r.push(l[R*3+2])}function ge(R){s.push(R.x),s.push(R.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON(),t=this.parameters.shapes,n=this.parameters.options;return Xf(t,n,e)}static fromJSON(e,t){const n=[];for(let s=0,a=e.shapes.length;s<a;s++){const o=t[e.shapes[s]];n.push(o)}const r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new vs[r.type]().fromJSON(r)),new yr(n,e.options)}}const Wf={generateTopUV:function(i,e,t,n,r){const s=e[t*3],a=e[t*3+1],o=e[n*3],l=e[n*3+1],c=e[r*3],u=e[r*3+1];return[new ae(s,a),new ae(o,l),new ae(c,u)]},generateSideWallUV:function(i,e,t,n,r,s){const a=e[t*3],o=e[t*3+1],l=e[t*3+2],c=e[n*3],u=e[n*3+1],f=e[n*3+2],h=e[r*3],d=e[r*3+1],g=e[r*3+2],S=e[s*3],m=e[s*3+1],p=e[s*3+2];return Math.abs(o-u)<Math.abs(a-c)?[new ae(a,1-l),new ae(c,1-f),new ae(h,1-g),new ae(S,1-p)]:[new ae(o,1-l),new ae(u,1-f),new ae(d,1-g),new ae(m,1-p)]}};function Xf(i,e,t){if(t.shapes=[],Array.isArray(i))for(let n=0,r=i.length;n<r;n++){const s=i[n];t.shapes.push(s.uuid)}else t.shapes.push(i.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}class Fi extends yt{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),l=Math.floor(r),c=o+1,u=l+1,f=e/o,h=t/l,d=[],g=[],S=[],m=[];for(let p=0;p<u;p++){const w=p*h-a;for(let T=0;T<c;T++){const _=T*f-s;g.push(_,-w,0),S.push(0,0,1),m.push(T/o),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let w=0;w<o;w++){const T=w+c*p,_=w+c*(p+1),b=w+1+c*(p+1),E=w+1+c*p;d.push(T,_,E),d.push(_,b,E)}this.setIndex(d),this.setAttribute("position",new rt(g,3)),this.setAttribute("normal",new rt(S,3)),this.setAttribute("uv",new rt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fi(e.width,e.height,e.widthSegments,e.heightSegments)}}class Oi extends yt{constructor(e=1,t=32,n=16,r=0,s=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:r,phiLength:s,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(a+o,Math.PI);let c=0;const u=[],f=new O,h=new O,d=[],g=[],S=[],m=[];for(let p=0;p<=n;p++){const w=[],T=p/n,_=a+T*o,b=e*Math.cos(_),E=Math.sqrt(e*e-b*b);let I=0;p===0&&a===0?I=.5/t:p===n&&l===Math.PI&&(I=-.5/t);for(let x=0;x<=t;x++){const A=x/t,U=r+A*s;f.x=-E*Math.cos(U),f.y=b,f.z=E*Math.sin(U),g.push(f.x,f.y,f.z),h.copy(f).normalize(),S.push(h.x,h.y,h.z),m.push(A+I,1-T),w.push(c++)}u.push(w)}for(let p=0;p<n;p++)for(let w=0;w<t;w++){const T=u[p][w+1],_=u[p][w],b=u[p+1][w],E=u[p+1][w+1];(p!==0||a>0)&&d.push(T,_,E),(p!==n-1||l<Math.PI)&&d.push(_,b,E)}this.setIndex(d),this.setAttribute("position",new rt(g,3)),this.setAttribute("normal",new rt(S,3)),this.setAttribute("uv",new rt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Oi(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Ss extends yt{constructor(e=1,t=.4,n=12,r=48,s=Math.PI*2,a=0,o=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:n,tubularSegments:r,arc:s,thetaStart:a,thetaLength:o},n=Math.floor(n),r=Math.floor(r);const l=[],c=[],u=[],f=[],h=new O,d=new O,g=new O;for(let S=0;S<=n;S++){const m=a+S/n*o;for(let p=0;p<=r;p++){const w=p/r*s;d.x=(e+t*Math.cos(m))*Math.cos(w),d.y=(e+t*Math.cos(m))*Math.sin(w),d.z=t*Math.sin(m),c.push(d.x,d.y,d.z),h.x=e*Math.cos(w),h.y=e*Math.sin(w),g.subVectors(d,h).normalize(),u.push(g.x,g.y,g.z),f.push(p/r),f.push(S/n)}}for(let S=1;S<=n;S++)for(let m=1;m<=r;m++){const p=(r+1)*S+m-1,w=(r+1)*(S-1)+m-1,T=(r+1)*(S-1)+m,_=(r+1)*S+m;l.push(p,w,_),l.push(w,T,_)}this.setIndex(l),this.setAttribute("position",new rt(c,3)),this.setAttribute("normal",new rt(u,3)),this.setAttribute("uv",new rt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ss(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}}class _o extends yt{constructor(e=new rc(new O(-1,-1,0),new O(-1,1,0),new O(1,1,0)),t=64,n=1,r=8,s=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:n,radialSegments:r,closed:s};const a=e.computeFrenetFrames(t,s);this.tangents=a.tangents,this.normals=a.normals,this.binormals=a.binormals;const o=new O,l=new O,c=new ae;let u=new O;const f=[],h=[],d=[],g=[];S(),this.setIndex(g),this.setAttribute("position",new rt(f,3)),this.setAttribute("normal",new rt(h,3)),this.setAttribute("uv",new rt(d,2));function S(){for(let T=0;T<t;T++)m(T);m(s===!1?t:0),w(),p()}function m(T){u=e.getPointAt(T/t,u);const _=a.normals[T],b=a.binormals[T];for(let E=0;E<=r;E++){const I=E/r*Math.PI*2,x=Math.sin(I),A=-Math.cos(I);l.x=A*_.x+x*b.x,l.y=A*_.y+x*b.y,l.z=A*_.z+x*b.z,l.normalize(),h.push(l.x,l.y,l.z),o.x=u.x+n*l.x,o.y=u.y+n*l.y,o.z=u.z+n*l.z,f.push(o.x,o.y,o.z)}}function p(){for(let T=1;T<=t;T++)for(let _=1;_<=r;_++){const b=(r+1)*(T-1)+(_-1),E=(r+1)*T+(_-1),I=(r+1)*T+_,x=(r+1)*(T-1)+_;g.push(b,E,x),g.push(E,I,x)}}function w(){for(let T=0;T<=t;T++)for(let _=0;_<=r;_++)c.x=T/t,c.y=_/r,d.push(c.x,c.y)}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){const e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new _o(new vs[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}}function Bi(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];if(dc(r))r.isRenderTargetTexture?(Ye("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone();else if(Array.isArray(r))if(dc(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][n]=s}else e[t][n]=r.slice();else e[t][n]=r}}return e}function zt(i){const e={};for(let t=0;t<i.length;t++){const n=Bi(i[t]);for(const r in n)e[r]=n[r]}return e}function dc(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function qf(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function pc(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:tt.workingColorSpace}const br={clone:Bi,merge:zt};var Yf=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Kf=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class _t extends ss{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Yf,this.fragmentShader=Kf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Bi(e.uniforms),this.uniformsGroups=qf(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=t[r.value]||null;break;case"c":this.uniforms[n].value=new Ke().setHex(r.value);break;case"v2":this.uniforms[n].value=new ae().fromArray(r.value);break;case"v3":this.uniforms[n].value=new O().fromArray(r.value);break;case"v4":this.uniforms[n].value=new mt().fromArray(r.value);break;case"m3":this.uniforms[n].value=new Xe().fromArray(r.value);break;case"m4":this.uniforms[n].value=new ct().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Zf extends _t{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class $f extends ss{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=fh,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Jf extends ss{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const mc={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(gc(i)||(this.files[i]=e))},get:function(i){if(this.enabled!==!1&&!gc(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function gc(i){try{const e=i.slice(i.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class Qf{constructor(e,t,n){const r=this;let s=!1,a=0,o=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,s===!1&&r.onStart!==void 0&&r.onStart(u,a,o),s=!0},this.itemEnd=function(u){a++,r.onProgress!==void 0&&r.onProgress(u,a,o),a===o&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,f){return c.push(u,f),this},this.removeHandler=function(u){const f=c.indexOf(u);return f!==-1&&c.splice(f,2),this},this.getHandler=function(u){for(let f=0,h=c.length;f<h;f+=2){const d=c[f],g=c[f+1];if(d.global&&(d.lastIndex=0),d.test(u))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const jf=new Qf;class Mo{constructor(e){this.manager=e!==void 0?e:jf,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const n=this;return new Promise(function(r,s){n.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}Mo.DEFAULT_MATERIAL_NAME="__DEFAULT";const Un={};class ed extends Error{constructor(e,t){super(e),this.response=t}}class td extends Mo{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,n,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=mc.get(`file:${e}`);if(s!==void 0){this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0);return}if(Un[e]!==void 0){Un[e].push({onLoad:t,onProgress:n,onError:r});return}Un[e]=[],Un[e].push({onLoad:t,onProgress:n,onError:r});const a=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,l=this.responseType;fetch(a).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&Ye("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const u=Un[e],f=c.body.getReader(),h=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),d=h?parseInt(h):0,g=d!==0;let S=0;const m=new ReadableStream({start(p){w();function w(){f.read().then(({done:T,value:_})=>{if(T)p.close();else{S+=_.byteLength;const b=new ProgressEvent("progress",{lengthComputable:g,loaded:S,total:d});for(let E=0,I=u.length;E<I;E++){const x=u[E];x.onProgress&&x.onProgress(b)}p.enqueue(_),w()}},T=>{p.error(T)})}}});return new Response(m)}else throw new ed(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(u=>new DOMParser().parseFromString(u,o));case"json":return c.json();default:if(o==="")return c.text();{const f=/charset="?([^;"\s]*)"?/i.exec(o),h=f&&f[1]?f[1].toLowerCase():void 0,d=new TextDecoder(h);return c.arrayBuffer().then(g=>d.decode(g))}}}).then(c=>{mc.add(`file:${e}`,c);const u=Un[e];delete Un[e];for(let f=0,h=u.length;f<h;f++){const d=u[f];d.onLoad&&d.onLoad(c)}}).catch(c=>{const u=Un[e];if(u===void 0)throw this.manager.itemError(e),c;delete Un[e];for(let f=0,h=u.length;f<h;f++){const d=u[f];d.onError&&d.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const ys=new O,bs=new Bn,Sn=new O;class vc extends Xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ct,this.projectionMatrix=new ct,this.projectionMatrixInverse=new ct,this.coordinateSystem=_n,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ys,bs,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ys,bs,Sn.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(ys,bs,Sn),Sn.x===1&&Sn.y===1&&Sn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ys,bs,Sn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Wn=new O,xc=new ae,_c=new ae;class Kt extends vc{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=rr*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(ir*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return rr*2*Math.atan(Math.tan(ir*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Wn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Wn.x,Wn.y).multiplyScalar(-e/Wn.z),Wn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Wn.x,Wn.y).multiplyScalar(-e/Wn.z)}getViewSize(e,t){return this.getViewBounds(e,xc,_c),t.subVectors(_c,xc)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(ir*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const l=a.fullWidth,c=a.fullHeight;s+=a.offsetX*r/l,t-=a.offsetY*n/c,r*=a.width/l,n*=a.height/c}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class So extends vc{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,a=s+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class nd extends yt{constructor(){super(),this.isInstancedBufferGeometry=!0,this.type="InstancedBufferGeometry",this.instanceCount=1/0}copy(e){return super.copy(e),this.instanceCount=e.instanceCount,this}toJSON(){const e=super.toJSON();return e.instanceCount=this.instanceCount,e.isInstancedBufferGeometry=!0,e}}const zi=-90,Hi=1;class id extends Xt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Kt(zi,Hi,e,t);r.layers=this.layers,this.add(r);const s=new Kt(zi,Hi,e,t);s.layers=this.layers,this.add(s);const a=new Kt(zi,Hi,e,t);a.layers=this.layers,this.add(a);const o=new Kt(zi,Hi,e,t);o.layers=this.layers,this.add(o);const l=new Kt(zi,Hi,e,t);l.layers=this.layers,this.add(l);const c=new Kt(zi,Hi,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,l]=t;for(const c of t)this.remove(c);if(e===_n)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===$r)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,l,c,u]=this.children,f=e.getRenderTarget(),h=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(n,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.generateMipmaps=S,e.setRenderTarget(n,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(f,h,d),e.xr.enabled=g,n.texture.needsPMREMUpdate=!0}}class rd extends Kt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}class sd{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=ad.bind(this),e.addEventListener("visibilitychange",this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener("visibilitychange",this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e!==void 0?e:performance.now())-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}}function ad(){this._document.hidden===!1&&this.reset()}const Jo=class Jo{constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){const s=this.elements;return s[0]=e,s[2]=t,s[1]=n,s[3]=r,this}};Jo.prototype.isMatrix2=!0;let Mc=Jo;const Sc=new ae;class yc{constructor(e=new ae(1/0,1/0),t=new ae(-1/0,-1/0)){this.isBox2=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Sc.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(e){return this.isEmpty()?e.set(0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Sc).distanceTo(e)}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}class fi{constructor(){this.type="ShapePath",this.color=new Ke,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(e,t){return this.currentPath=new ui,this.subPaths.push(this.currentPath),this.currentPath.moveTo(e,t),this}lineTo(e,t){return this.currentPath.lineTo(e,t),this}quadraticCurveTo(e,t,n,r){return this.currentPath.quadraticCurveTo(e,t,n,r),this}bezierCurveTo(e,t,n,r,s,a){return this.currentPath.bezierCurveTo(e,t,n,r,s,a),this}splineThru(e){return this.currentPath.splineThru(e),this}toShapes(){function e(l,c){let u=!1;const f=c.length;for(let h=0,d=f-1;h<f;d=h++){const g=c[h],S=c[d];g.y>l.y!=S.y>l.y&&l.x<(S.x-g.x)*(l.y-g.y)/(S.y-g.y)+g.x&&(u=!u)}return u}function t(l,c){const u=c.getCenter(new ae);if(e(u,l))return u;const f=u.y,h=[],d=l.length;for(let g=0;g<d;g++){const S=l[g],m=l[(g+1)%d];if(S.y>f!=m.y>f){const p=S.x+(f-S.y)*(m.x-S.x)/(m.y-S.y);h.push(p)}}return h.length>1&&(h.sort((g,S)=>g-S),u.x=(h[0]+h[1])/2),u}let n=this.userData.style&&this.userData.style.fillRule||"nonzero";n!=="nonzero"&&n!=="evenodd"&&(Ye('Fill-rule "'+n+'" is not supported, falling back to "nonzero".'),n="nonzero");const r=n==="nonzero"?(l=>l!==0):(l=>(l&1)!==0),s=[];for(const l of this.subPaths){const c=l.getPoints();if(c.length<3)continue;const u=Vn.area(c);if(u===0)continue;const f=new yc;for(let h=0;h<c.length;h++)f.expandByPoint(c[h]);s.push({subPath:l,points:c,boundingBox:f,interiorPoint:t(c,f),absArea:Math.abs(u),winding:u<0?-1:1,container:null,exclude:!1,role:null})}s.sort((l,c)=>c.absArea-l.absArea);for(let l=0;l<s.length;l++){const c=s[l];let u=0;for(let f=l-1;f>=0;f--){const h=s[f];if(h.boundingBox.containsBox(c.boundingBox)&&e(c.interiorPoint,h.points)){c.container=h.exclude?h.container:h,u=h.winding,c.winding+=u;break}}r(c.winding)===r(u)&&(c.exclude=!0)}for(const l of s)l.exclude||(l.role=l.container===null||l.container.role==="hole"?"outer":"hole");const a=[],o=new Map;for(const l of s){if(l.exclude||l.role!=="outer")continue;const c=new xs;c.curves=l.subPath.curves,a.push(c),o.set(l,c)}for(const l of s){if(l.exclude||l.role!=="hole")continue;const c=o.get(l.container);if(!c)continue;const u=new ui;u.curves=l.subPath.curves,c.holes.push(u)}return a}}function bc(i,e,t,n){const r=od(n);switch(t){case _l:return i*e;case kr:return i*e/r.components*r.byteLength;case ra:return i*e/r.components*r.byteLength;case ti:return i*e*2/r.components*r.byteLength;case sa:return i*e*2/r.components*r.byteLength;case Ml:return i*e*3/r.components*r.byteLength;case rn:return i*e*4/r.components*r.byteLength;case aa:return i*e*4/r.components*r.byteLength;case Gr:case Vr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Wr:case Xr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case la:case ua:return Math.max(i,16)*Math.max(e,8)/4;case oa:case ca:return Math.max(i,8)*Math.max(e,8)/2;case ha:case fa:case pa:case ma:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case da:case qr:case ga:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case va:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case xa:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case _a:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Ma:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case Sa:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case ya:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case ba:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case Ea:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case wa:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case Ta:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case Aa:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case Ra:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case Ca:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Pa:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case La:case Ia:case Da:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Na:case Ua:return Math.ceil(i/4)*Math.ceil(e/4)*8;case Yr:case Fa:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function od(i){switch(i){case Vt:case ml:return{byteLength:1,components:1};case tr:case gl:case Lt:return{byteLength:2,components:1};case na:case ia:return{byteLength:2,components:4};case xn:case ta:case nn:return{byteLength:4,components:1};case vl:case xl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ws}})),typeof window<"u"&&(window.__THREE__?Ye("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ws);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function Ec(){let i=null,e=!1,t=null,n=null;function r(s,a){n=i.requestAnimationFrame(r),t(s,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function ld(i){const e=new WeakMap;function t(o,l){const c=o.array,u=o.usage,f=c.byteLength,h=i.createBuffer();i.bindBuffer(l,h),i.bufferData(l,c,u),o.onUploadCallback();let d;if(c instanceof Float32Array)d=i.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)d=i.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?d=i.HALF_FLOAT:d=i.UNSIGNED_SHORT;else if(c instanceof Int16Array)d=i.SHORT;else if(c instanceof Uint32Array)d=i.UNSIGNED_INT;else if(c instanceof Int32Array)d=i.INT;else if(c instanceof Int8Array)d=i.BYTE;else if(c instanceof Uint8Array)d=i.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)d=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:d,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,l,c){const u=l.array,f=l.updateRanges;if(i.bindBuffer(c,o),f.length===0)i.bufferSubData(c,0,u);else{f.sort((d,g)=>d.start-g.start);let h=0;for(let d=1;d<f.length;d++){const g=f[h],S=f[d];S.start<=g.start+g.count+1?g.count=Math.max(g.count,S.start+S.count-g.start):(++h,f[h]=S)}f.length=h+1;for(let d=0,g=f.length;d<g;d++){const S=f[d];i.bufferSubData(c,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const l=e.get(o);l&&(i.deleteBuffer(l.buffer),e.delete(o))}function a(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const c=e.get(o);if(c===void 0)e.set(o,t(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(c.buffer,o,l),c.version=o.version}}return{get:r,remove:s,update:a}}var cd=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,ud=`#ifdef USE_ALPHAHASH
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
#endif`,hd=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,fd=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dd=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,pd=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,md=`#ifdef USE_AOMAP
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
#endif`,gd=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,vd=`#ifdef USE_BATCHING
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
#endif`,xd=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,_d=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Md=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Sd=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,yd=`#ifdef USE_IRIDESCENCE
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
#endif`,bd=`#ifdef USE_BUMPMAP
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
#endif`,Ed=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,wd=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Td=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Ad=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Rd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Cd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Pd=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Ld=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,Id=`#define PI 3.141592653589793
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
} // validated`,Dd=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,Nd=`vec3 transformedNormal = objectNormal;
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
#endif`,Fd=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Od=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Bd=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,zd="gl_FragColor = linearToOutputTexel( gl_FragColor );",Hd=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,kd=`#ifdef USE_ENVMAP
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
#endif`,Gd=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,Vd=`#ifdef USE_ENVMAP
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
#endif`,Wd=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Xd=`#ifdef USE_ENVMAP
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
#endif`,qd=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Yd=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Kd=`#ifdef USE_FOG
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
#endif`,$d=`#ifdef USE_GRADIENTMAP
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
}`,Jd=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Qd=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,jd=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ep=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,tp=`#ifdef USE_ENVMAP
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
#endif`,np=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,ip=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,rp=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,sp=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,ap=`PhysicalMaterial material;
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
#endif`,op=`uniform sampler2D dfgLUT;
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
}`,lp=`
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
#endif`,cp=`#if defined( RE_IndirectDiffuse )
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
#endif`,up=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,hp=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,fp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,dp=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,pp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,mp=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,gp=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,vp=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,xp=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,_p=`#if defined( USE_POINTS_UV )
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
#endif`,Mp=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Sp=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,yp=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,bp=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ep=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,wp=`#ifdef USE_MORPHTARGETS
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
#endif`,Tp=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ap=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,Rp=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,Cp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Pp=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Lp=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Ip=`#ifdef USE_NORMALMAP
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
#endif`,Dp=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Np=`#ifdef USE_CLEARCOAT_NORMALMAP
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
#endif`,Fp=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Op=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Bp=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,zp=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Hp=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,kp=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Gp=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Vp=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Wp=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Xp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,qp=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,Yp=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,Kp=`float getShadowMask() {
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
#endif`,$p=`#ifdef USE_SKINNING
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
#endif`,Jp=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Qp=`#ifdef USE_SKINNING
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
#endif`,jp=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,em=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tm=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,nm=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,im=`#ifdef USE_TRANSMISSION
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
#endif`,rm=`#ifdef USE_TRANSMISSION
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
#endif`,sm=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,am=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,om=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,lm=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const $e={alphahash_fragment:cd,alphahash_pars_fragment:ud,alphamap_fragment:hd,alphamap_pars_fragment:fd,alphatest_fragment:dd,alphatest_pars_fragment:pd,aomap_fragment:md,aomap_pars_fragment:gd,batching_pars_vertex:vd,batching_vertex:xd,begin_vertex:_d,beginnormal_vertex:Md,bsdfs:Sd,iridescence_fragment:yd,bumpmap_pars_fragment:bd,clipping_planes_fragment:Ed,clipping_planes_pars_fragment:wd,clipping_planes_pars_vertex:Td,clipping_planes_vertex:Ad,color_fragment:Rd,color_pars_fragment:Cd,color_pars_vertex:Pd,color_vertex:Ld,common:Id,cube_uv_reflection_fragment:Dd,defaultnormal_vertex:Nd,displacementmap_pars_vertex:Ud,displacementmap_vertex:Fd,emissivemap_fragment:Od,emissivemap_pars_fragment:Bd,colorspace_fragment:zd,colorspace_pars_fragment:Hd,envmap_fragment:kd,envmap_common_pars_fragment:Gd,envmap_pars_fragment:Vd,envmap_pars_vertex:Wd,envmap_physical_pars_fragment:tp,envmap_vertex:Xd,fog_vertex:qd,fog_pars_vertex:Yd,fog_fragment:Kd,fog_pars_fragment:Zd,gradientmap_pars_fragment:$d,lightmap_pars_fragment:Jd,lights_lambert_fragment:Qd,lights_lambert_pars_fragment:jd,lights_pars_begin:ep,lights_toon_fragment:np,lights_toon_pars_fragment:ip,lights_phong_fragment:rp,lights_phong_pars_fragment:sp,lights_physical_fragment:ap,lights_physical_pars_fragment:op,lights_fragment_begin:lp,lights_fragment_maps:cp,lights_fragment_end:up,lightprobes_pars_fragment:hp,logdepthbuf_fragment:fp,logdepthbuf_pars_fragment:dp,logdepthbuf_pars_vertex:pp,logdepthbuf_vertex:mp,map_fragment:gp,map_pars_fragment:vp,map_particle_fragment:xp,map_particle_pars_fragment:_p,metalnessmap_fragment:Mp,metalnessmap_pars_fragment:Sp,morphinstance_vertex:yp,morphcolor_vertex:bp,morphnormal_vertex:Ep,morphtarget_pars_vertex:wp,morphtarget_vertex:Tp,normal_fragment_begin:Ap,normal_fragment_maps:Rp,normal_pars_fragment:Cp,normal_pars_vertex:Pp,normal_vertex:Lp,normalmap_pars_fragment:Ip,clearcoat_normal_fragment_begin:Dp,clearcoat_normal_fragment_maps:Np,clearcoat_pars_fragment:Up,iridescence_pars_fragment:Fp,opaque_fragment:Op,packing:Bp,premultiplied_alpha_fragment:zp,project_vertex:Hp,dithering_fragment:kp,dithering_pars_fragment:Gp,roughnessmap_fragment:Vp,roughnessmap_pars_fragment:Wp,shadowmap_pars_fragment:Xp,shadowmap_pars_vertex:qp,shadowmap_vertex:Yp,shadowmask_pars_fragment:Kp,skinbase_vertex:Zp,skinning_pars_vertex:$p,skinning_vertex:Jp,skinnormal_vertex:Qp,specularmap_fragment:jp,specularmap_pars_fragment:em,tonemapping_fragment:tm,tonemapping_pars_fragment:nm,transmission_fragment:im,transmission_pars_fragment:rm,uv_pars_fragment:sm,uv_pars_vertex:am,uv_vertex:om,worldpos_vertex:lm,background_vert:`varying vec2 vUv;
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
}`},Te={common:{diffuse:{value:new Ke(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Xe}},envmap:{envMap:{value:null},envMapRotation:{value:new Xe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Xe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Xe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Xe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Xe},normalScale:{value:new ae(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Xe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Xe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Xe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Xe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ke(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new O},probesMax:{value:new O},probesResolution:{value:new O}},points:{diffuse:{value:new Ke(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0},uvTransform:{value:new Xe}},sprite:{diffuse:{value:new Ke(16777215)},opacity:{value:1},center:{value:new ae(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Xe},alphaMap:{value:null},alphaMapTransform:{value:new Xe},alphaTest:{value:0}}},yn={basic:{uniforms:zt([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.fog]),vertexShader:$e.meshbasic_vert,fragmentShader:$e.meshbasic_frag},lambert:{uniforms:zt([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,Te.lights,{emissive:{value:new Ke(0)},envMapIntensity:{value:1}}]),vertexShader:$e.meshlambert_vert,fragmentShader:$e.meshlambert_frag},phong:{uniforms:zt([Te.common,Te.specularmap,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,Te.lights,{emissive:{value:new Ke(0)},specular:{value:new Ke(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:$e.meshphong_vert,fragmentShader:$e.meshphong_frag},standard:{uniforms:zt([Te.common,Te.envmap,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.roughnessmap,Te.metalnessmap,Te.fog,Te.lights,{emissive:{value:new Ke(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag},toon:{uniforms:zt([Te.common,Te.aomap,Te.lightmap,Te.emissivemap,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.gradientmap,Te.fog,Te.lights,{emissive:{value:new Ke(0)}}]),vertexShader:$e.meshtoon_vert,fragmentShader:$e.meshtoon_frag},matcap:{uniforms:zt([Te.common,Te.bumpmap,Te.normalmap,Te.displacementmap,Te.fog,{matcap:{value:null}}]),vertexShader:$e.meshmatcap_vert,fragmentShader:$e.meshmatcap_frag},points:{uniforms:zt([Te.points,Te.fog]),vertexShader:$e.points_vert,fragmentShader:$e.points_frag},dashed:{uniforms:zt([Te.common,Te.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:$e.linedashed_vert,fragmentShader:$e.linedashed_frag},depth:{uniforms:zt([Te.common,Te.displacementmap]),vertexShader:$e.depth_vert,fragmentShader:$e.depth_frag},normal:{uniforms:zt([Te.common,Te.bumpmap,Te.normalmap,Te.displacementmap,{opacity:{value:1}}]),vertexShader:$e.meshnormal_vert,fragmentShader:$e.meshnormal_frag},sprite:{uniforms:zt([Te.sprite,Te.fog]),vertexShader:$e.sprite_vert,fragmentShader:$e.sprite_frag},background:{uniforms:{uvTransform:{value:new Xe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:$e.background_vert,fragmentShader:$e.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Xe}},vertexShader:$e.backgroundCube_vert,fragmentShader:$e.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:$e.cube_vert,fragmentShader:$e.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:$e.equirect_vert,fragmentShader:$e.equirect_frag},distance:{uniforms:zt([Te.common,Te.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:$e.distance_vert,fragmentShader:$e.distance_frag},shadow:{uniforms:zt([Te.lights,Te.fog,{color:{value:new Ke(0)},opacity:{value:1}}]),vertexShader:$e.shadow_vert,fragmentShader:$e.shadow_frag}};yn.physical={uniforms:zt([yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Xe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Xe},clearcoatNormalScale:{value:new ae(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Xe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Xe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Xe},sheen:{value:0},sheenColor:{value:new Ke(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Xe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Xe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Xe},transmissionSamplerSize:{value:new ae},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Xe},attenuationDistance:{value:0},attenuationColor:{value:new Ke(0)},specularColor:{value:new Ke(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Xe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Xe},anisotropyVector:{value:new ae},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Xe}}]),vertexShader:$e.meshphysical_vert,fragmentShader:$e.meshphysical_frag};const Es={r:0,b:0,g:0},cm=new ct,wc=new Xe;wc.set(-1,0,0,0,1,0,0,0,1);function um(i,e,t,n,r,s){const a=new Ke(0);let o=r===!0?0:1,l,c,u=null,f=0,h=null;function d(w){let T=w.isScene===!0?w.background:null;if(T&&T.isTexture){const _=w.backgroundBlurriness>0;T=e.get(T,_)}return T}function g(w){let T=!1;const _=d(w);_===null?m(a,o):_&&_.isColor&&(m(_,1),T=!0);const b=i.xr.getEnvironmentBlendMode();b==="additive"?t.buffers.color.setClear(0,0,0,1,s):b==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(i.autoClear||T)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(w,T){const _=d(T);_&&(_.isCubeTexture||_.mapping===Or)?(c===void 0&&(c=new st(new je(1,1,1),new _t({name:"BackgroundCubeMaterial",uniforms:Bi(yn.backgroundCube.uniforms),vertexShader:yn.backgroundCube.vertexShader,fragmentShader:yn.backgroundCube.fragmentShader,side:Ot,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(b,E,I){this.matrixWorld.copyPosition(I.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=_,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(cm.makeRotationFromEuler(T.backgroundRotation)).transpose(),_.isCubeTexture&&_.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(wc),c.material.toneMapped=tt.getTransfer(_.colorSpace)!==lt,(u!==_||f!==_.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=_,f=_.version,h=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new st(new Fi(2,2),new _t({name:"BackgroundMaterial",uniforms:Bi(yn.background.uniforms),vertexShader:yn.background.vertexShader,fragmentShader:yn.background.fragmentShader,side:Qn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=tt.getTransfer(_.colorSpace)!==lt,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||f!==_.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=_,f=_.version,h=i.toneMapping),l.layers.enableAll(),w.unshift(l,l.geometry,l.material,0,0,null))}function m(w,T){w.getRGB(Es,pc(i)),t.buffers.color.setClear(Es.r,Es.g,Es.b,T,s)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return a},setClearColor:function(w,T=1){a.set(w),o=T,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(w){o=w,m(a,o)},render:g,addToRenderList:S,dispose:p}}function hm(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=h(null);let s=r,a=!1;function o(G,z,J,H,Y){let re=!1;const $=f(G,H,J,z);s!==$&&(s=$,c(s.object)),re=d(G,H,J,Y),re&&g(G,H,J,Y),Y!==null&&e.update(Y,i.ELEMENT_ARRAY_BUFFER),(re||a)&&(a=!1,_(G,z,J,H),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Y).buffer))}function l(){return i.createVertexArray()}function c(G){return i.bindVertexArray(G)}function u(G){return i.deleteVertexArray(G)}function f(G,z,J,H){const Y=H.wireframe===!0;let re=n[z.id];re===void 0&&(re={},n[z.id]=re);const $=G.isInstancedMesh===!0?G.id:0;let Z=re[$];Z===void 0&&(Z={},re[$]=Z);let ie=Z[J.id];ie===void 0&&(ie={},Z[J.id]=ie);let se=ie[Y];return se===void 0&&(se=h(l()),ie[Y]=se),se}function h(G){const z=[],J=[],H=[];for(let Y=0;Y<t;Y++)z[Y]=0,J[Y]=0,H[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:z,enabledAttributes:J,attributeDivisors:H,object:G,attributes:{},index:null}}function d(G,z,J,H){const Y=s.attributes,re=z.attributes;let $=0;const Z=J.getAttributes();for(const ie in Z)if(Z[ie].location>=0){const he=Y[ie];let Le=re[ie];if(Le===void 0&&(ie==="instanceMatrix"&&G.instanceMatrix&&(Le=G.instanceMatrix),ie==="instanceColor"&&G.instanceColor&&(Le=G.instanceColor)),he===void 0||he.attribute!==Le||Le&&he.data!==Le.data)return!0;$++}return s.attributesNum!==$||s.index!==H}function g(G,z,J,H){const Y={},re=z.attributes;let $=0;const Z=J.getAttributes();for(const ie in Z)if(Z[ie].location>=0){let he=re[ie];he===void 0&&(ie==="instanceMatrix"&&G.instanceMatrix&&(he=G.instanceMatrix),ie==="instanceColor"&&G.instanceColor&&(he=G.instanceColor));const Le={};Le.attribute=he,he&&he.data&&(Le.data=he.data),Y[ie]=Le,$++}s.attributes=Y,s.attributesNum=$,s.index=H}function S(){const G=s.newAttributes;for(let z=0,J=G.length;z<J;z++)G[z]=0}function m(G){p(G,0)}function p(G,z){const J=s.newAttributes,H=s.enabledAttributes,Y=s.attributeDivisors;J[G]=1,H[G]===0&&(i.enableVertexAttribArray(G),H[G]=1),Y[G]!==z&&(i.vertexAttribDivisor(G,z),Y[G]=z)}function w(){const G=s.newAttributes,z=s.enabledAttributes;for(let J=0,H=z.length;J<H;J++)z[J]!==G[J]&&(i.disableVertexAttribArray(J),z[J]=0)}function T(G,z,J,H,Y,re,$){$===!0?i.vertexAttribIPointer(G,z,J,Y,re):i.vertexAttribPointer(G,z,J,H,Y,re)}function _(G,z,J,H){S();const Y=H.attributes,re=J.getAttributes(),$=z.defaultAttributeValues;for(const Z in re){const ie=re[Z];if(ie.location>=0){let se=Y[Z];if(se===void 0&&(Z==="instanceMatrix"&&G.instanceMatrix&&(se=G.instanceMatrix),Z==="instanceColor"&&G.instanceColor&&(se=G.instanceColor)),se!==void 0){const he=se.normalized,Le=se.itemSize,pe=e.get(se);if(pe===void 0)continue;const Ce=pe.buffer,De=pe.type,Ge=pe.bytesPerElement,N=De===i.INT||De===i.UNSIGNED_INT||se.gpuType===ta;if(se.isInterleavedBufferAttribute){const D=se.data,L=D.stride,C=se.offset;if(D.isInstancedInterleavedBuffer){for(let B=0;B<ie.locationSize;B++)p(ie.location+B,D.meshPerAttribute);G.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=D.meshPerAttribute*D.count)}else for(let B=0;B<ie.locationSize;B++)m(ie.location+B);i.bindBuffer(i.ARRAY_BUFFER,Ce);for(let B=0;B<ie.locationSize;B++)T(ie.location+B,Le/ie.locationSize,De,he,L*Ge,(C+Le/ie.locationSize*B)*Ge,N)}else{if(se.isInstancedBufferAttribute){for(let D=0;D<ie.locationSize;D++)p(ie.location+D,se.meshPerAttribute);G.isInstancedMesh!==!0&&H._maxInstanceCount===void 0&&(H._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let D=0;D<ie.locationSize;D++)m(ie.location+D);i.bindBuffer(i.ARRAY_BUFFER,Ce);for(let D=0;D<ie.locationSize;D++)T(ie.location+D,Le/ie.locationSize,De,he,Le*Ge,Le/ie.locationSize*D*Ge,N)}}else if($!==void 0){const he=$[Z];if(he!==void 0)switch(he.length){case 2:i.vertexAttrib2fv(ie.location,he);break;case 3:i.vertexAttrib3fv(ie.location,he);break;case 4:i.vertexAttrib4fv(ie.location,he);break;default:i.vertexAttrib1fv(ie.location,he)}}}}w()}function b(){A();for(const G in n){const z=n[G];for(const J in z){const H=z[J];for(const Y in H){const re=H[Y];for(const $ in re)u(re[$].object),delete re[$];delete H[Y]}}delete n[G]}}function E(G){if(n[G.id]===void 0)return;const z=n[G.id];for(const J in z){const H=z[J];for(const Y in H){const re=H[Y];for(const $ in re)u(re[$].object),delete re[$];delete H[Y]}}delete n[G.id]}function I(G){for(const z in n){const J=n[z];for(const H in J){const Y=J[H];if(Y[G.id]===void 0)continue;const re=Y[G.id];for(const $ in re)u(re[$].object),delete re[$];delete Y[G.id]}}}function x(G){for(const z in n){const J=n[z],H=G.isInstancedMesh===!0?G.id:0,Y=J[H];if(Y!==void 0){for(const re in Y){const $=Y[re];for(const Z in $)u($[Z].object),delete $[Z];delete Y[re]}delete J[H],Object.keys(J).length===0&&delete n[z]}}}function A(){U(),a=!0,s!==r&&(s=r,c(s.object))}function U(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:A,resetDefaultState:U,dispose:b,releaseStatesOfGeometry:E,releaseStatesOfObject:x,releaseStatesOfProgram:I,initAttributes:S,enableAttribute:m,disableUnusedAttributes:w}}function fm(i,e,t){let n;function r(l){n=l}function s(l,c){i.drawArrays(n,l,c),t.update(c,n,1)}function a(l,c,u){u!==0&&(i.drawArraysInstanced(n,l,c,u),t.update(c,n,u))}function o(l,c,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,c,0,u);let h=0;for(let d=0;d<u;d++)h+=c[d];t.update(h,n,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function dm(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const I=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(I.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(I){return!(I!==rn&&n.convert(I)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(I){const x=I===Lt&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(I!==Vt&&I!==nn&&!x&&n.convert(I)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function l(I){if(I==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";I="mediump"}return I==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const u=l(c);u!==c&&(Ye("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const f=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&Ye("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const d=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),b=i.getParameter(i.MAX_SAMPLES),E=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:a,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:d,maxVertexTextures:g,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:w,maxVaryings:T,maxFragmentUniforms:_,maxSamples:b,samples:E}}function pm(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new Dn,o=new Xe,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){const d=f.length!==0||h||n!==0||r;return r=h,n=f.length,d},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,h){t=u(f,h,0)},this.setState=function(f,h,d){const g=f.clippingPlanes,S=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!r||g===null||g.length===0||s&&!m)s?u(null):c();else{const w=s?0:n,T=w*4;let _=p.clippingState||null;l.value=_,_=u(g,h,T,d);for(let b=0;b!==T;++b)_[b]=t[b];p.clippingState=_,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=w}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(f,h,d,g){const S=f!==null?f.length:0;let m=null;if(S!==0){if(m=l.value,g!==!0||m===null){const p=d+S*4,w=h.matrixWorldInverse;o.getNormalMatrix(w),(m===null||m.length<p)&&(m=new Float32Array(p));for(let T=0,_=d;T!==S;++T,_+=4)a.copy(f[T]).applyMatrix4(w,o),a.normal.toArray(m,_),m[_+3]=a.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}const ki=4,mm=6,gm=20,vm=256,Er=new So,Tc=new Ke;let yo=null,bo=0,Eo=0,wo=!1;const xm=new O,di=new O;class Ac{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,n=.1,r=100,s={}){const{size:a=256,position:o=xm}=s;yo=this._renderer.getRenderTarget(),bo=this._renderer.getActiveCubeFace(),Eo=this._renderer.getActiveMipmapLevel(),wo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,n,r,l,o),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Pc(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Cc(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(yo,bo,Eo),this._renderer.xr.enabled=wo,e.scissorTest=!1,Gi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===jn||e.mapping===_i?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),yo=this._renderer.getRenderTarget(),bo=this._renderer.getActiveCubeFace(),Eo=this._renderer.getActiveMipmapLevel(),wo=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Tt,minFilter:Tt,generateMipmaps:!1,type:Lt,format:rn,colorSpace:Kr,depthBuffer:!1},r=Rc(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Rc(e,t,n);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=_m(s)),this._blurMaterial=Sm(s,e,t),this._ggxMaterial=Mm(s,e,t)}return r}_compileMaterial(e){const t=new st(new yt,e);this._renderer.compile(t,Er)}_sceneToCubeUV(e,t,n,r,s){const l=new Kt(90,1,t,n),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,d=f.toneMapping;f.getClearColor(Tc),f.toneMapping=gn,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(r),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new st(new je,new fr({name:"PMREM.Background",side:Ot,depthWrite:!1,depthTest:!1})));const S=this._backgroundBox,m=S.material;let p=!1;const w=e.background;w?w.isColor&&(m.color.copy(w),e.background=null,p=!0):(m.color.copy(Tc),p=!0);for(let T=0;T<6;T++){const _=T%3;_===0?(l.up.set(0,c[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+u[T],s.y,s.z)):_===1?(l.up.set(0,0,c[T]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+u[T],s.z)):(l.up.set(0,c[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+u[T]));const b=this._cubeSize;Gi(r,_*b,T>2?b:0,b,b),f.setRenderTarget(r),p&&f.render(S,l),f.render(e,l)}f.toneMapping=d,f.autoClear=h,e.background=w}_textureToCubeUV(e,t){const n=this._renderer,r=e.mapping===jn||e.mapping===_i;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Pc()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Cc());const s=r?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=s;const o=s.uniforms;o.envMap.value=e;const l=this._cubeSize;Gi(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(a,Er)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=n}_applyGGXFilter(e,t,n){const r=this._renderer,s=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const l=a.uniforms,c=n/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),f=Math.sqrt(c*c-u*u),h=c*1.25,d=f*h,{_lodMax:g}=this,S=this._sizeLods[n],m=3*S*(n>g-ki?n-g+ki:0),p=4*(this._cubeSize-S);l.envMap.value=e.texture,l.roughness.value=d,l.mipInt.value=g-t,Gi(s,m,p,3*S,2*S),r.setRenderTarget(s),r.render(o,Er),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=g-n,Gi(e,m,p,3*S,2*S),r.setRenderTarget(e),r.render(o,Er)}_blur(e,t,n,r){const s=this._pingPongRenderTarget,a=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,n,a),this._blurPass(s,e,n,n,a)}_blurPass(e,t,n,r,s){const a=this._renderer,o=this._blurMaterial,l=this._lodMeshes[r];l.material=o;const c=o.uniforms;c.envMap.value=e.texture,c.sigma.value=s,c.mipInt.value=this._lodMax-n;const u=this._sizeLods[r],f=3*u*(r>this._lodMax-ki?r-this._lodMax+ki:0),h=4*(this._cubeSize-u);Gi(t,f,h,3*u,2*u),a.setRenderTarget(t),a.render(l,Er)}}function _m(i){const e=[],t=[];let n=i;const r=i-ki+1+mm;for(let s=0;s<r;s++){const a=Math.pow(2,n);e.push(a);const o=1/(a-2),l=-o,c=1+o,u=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,h=6,d=3,g=new Float32Array(d*h*f),S=new Float32Array(d*h*f);for(let p=0;p<f;p++){const w=p%3*2/3-1,T=p>2?0:-1,_=[w,T,0,w+2/3,T,0,w+2/3,T+1,0,w,T,0,w+2/3,T+1,0,w,T+1,0];g.set(_,d*h*p);for(let b=0;b<h;b++){const E=u[b*2]*2-1,I=u[b*2+1]*2-1;p===0?di.set(1,I,E):p===1?di.set(-E,1,-I):p===2?di.set(-E,I,1):p===3?di.set(-1,I,-E):p===4?di.set(-E,-1,I):di.set(E,I,-1),di.toArray(S,(p*h+b)*d)}}const m=new yt;m.setAttribute("position",new qt(g,d)),m.setAttribute("outputDirection",new qt(S,d)),t.push(new st(m,null)),n>ki&&n--}return{lodMeshes:t,sizeLods:e}}function Rc(i,e,t){const n=new Ct(i,e,t);return n.texture.mapping=Or,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Gi(i,e,t,n,r){i.viewport.set(e,t,n,r),i.scissor.set(e,t,n,r)}function Mm(i,e,t){return new _t({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:vm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ws(),fragmentShader:`

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
		`,blending:mn,depthTest:!1,depthWrite:!1})}function Sm(i,e,t){return new _t({name:"SphericalGaussianBlur",defines:{SAMPLES:gm,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:ws(),fragmentShader:`

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
		`,blending:mn,depthTest:!1,depthWrite:!1})}function Cc(){return new _t({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ws(),fragmentShader:`

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
		`,blending:mn,depthTest:!1,depthWrite:!1})}function Pc(){return new _t({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ws(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:mn,depthTest:!1,depthWrite:!1})}function ws(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Lc extends Ct{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Zl(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new je(5,5,5),s=new _t({name:"CubemapFromEquirect",uniforms:Bi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ot,blending:mn});s.uniforms.tEquirect.value=t;const a=new st(r,s),o=t.minFilter;return t.minFilter===Fn&&(t.minFilter=Tt),new id(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}function ym(i){let e=new WeakMap,t=new WeakMap,n=null;function r(h,d=!1){return h==null?null:d?a(h):s(h)}function s(h){if(h&&h.isTexture){const d=h.mapping;if(d===Qs||d===js)if(e.has(h)){const g=e.get(h).texture;return o(g,h.mapping)}else{const g=h.image;if(g&&g.height>0){const S=new Lc(g.height);return S.fromEquirectangularTexture(i,h),e.set(h,S),h.addEventListener("dispose",c),o(S.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){const d=h.mapping,g=d===Qs||d===js,S=d===jn||d===_i;if(g||S){let m=t.get(h);const p=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==p)return n===null&&(n=new Ac(i)),m=g?n.fromEquirectangular(h,m):n.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,t.set(h,m),m.texture;if(m!==void 0)return m.texture;{const w=h.image;return g&&w&&w.height>0||S&&w&&l(w)?(n===null&&(n=new Ac(i)),m=g?n.fromEquirectangular(h):n.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,t.set(h,m),h.addEventListener("dispose",u),m.texture):null}}}return h}function o(h,d){return d===Qs?h.mapping=jn:d===js&&(h.mapping=_i),h}function l(h){let d=0;const g=6;for(let S=0;S<g;S++)h[S]!==void 0&&d++;return d===g}function c(h){const d=h.target;d.removeEventListener("dispose",c);const g=e.get(d);g!==void 0&&(e.delete(d),g.dispose())}function u(h){const d=h.target;d.removeEventListener("dispose",u);const g=t.get(d);g!==void 0&&(t.delete(d),g.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:f}}function bm(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const r=i.getExtension(n);return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&Mi("WebGLRenderer: "+n+" extension not supported."),r}}}function Em(i,e,t,n){const r={},s=new WeakMap;function a(f){const h=f.target;h.index!==null&&e.remove(h.index);for(const g in h.attributes)e.remove(h.attributes[g]);h.removeEventListener("dispose",a),delete r[h.id];const d=s.get(h);d&&(e.remove(d),s.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(f,h){return r[h.id]===!0||(h.addEventListener("dispose",a),r[h.id]=!0,t.memory.geometries++),h}function l(f){const h=f.attributes;for(const d in h)e.update(h[d],i.ARRAY_BUFFER)}function c(f){const h=[],d=f.index,g=f.attributes.position;let S=0;if(g===void 0)return;if(d!==null){const w=d.array;S=d.version;for(let T=0,_=w.length;T<_;T+=3){const b=w[T+0],E=w[T+1],I=w[T+2];h.push(b,E,E,I,I,b)}}else{const w=g.array;S=g.version;for(let T=0,_=w.length/3-1;T<_;T+=3){const b=T+0,E=T+1,I=T+2;h.push(b,E,E,I,I,b)}}const m=new(g.count>=65535?Gl:kl)(h,1);m.version=S;const p=s.get(f);p&&e.remove(p),s.set(f,m)}function u(f){const h=s.get(f);if(h){const d=f.index;d!==null&&h.version<d.version&&c(f)}else c(f);return s.get(f)}return{get:o,update:l,getWireframeAttribute:u}}function wm(i,e,t){let n;function r(f){n=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function l(f,h){i.drawElements(n,h,s,f*a),t.update(h,n,1)}function c(f,h,d){d!==0&&(i.drawElementsInstanced(n,h,s,f*a,d),t.update(h,n,d))}function u(f,h,d){if(d===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,s,f,0,d);let S=0;for(let m=0;m<d;m++)S+=h[m];t.update(S,n,1)}this.setMode=r,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function Tm(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:nt("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function Am(i,e,t){const n=new WeakMap,r=new mt;function s(a,o,l){const c=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==f){let A=function(){I.dispose(),n.delete(o),o.removeEventListener("dispose",A)};h!==void 0&&h.texture.dispose();const d=o.morphAttributes.position!==void 0,g=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],w=o.morphAttributes.color||[];let T=0;d===!0&&(T=1),g===!0&&(T=2),S===!0&&(T=3);let _=o.attributes.position.count*T,b=1;_>e.maxTextureSize&&(b=Math.ceil(_/e.maxTextureSize),_=e.maxTextureSize);const E=new Float32Array(_*b*4*f),I=new Pl(E,_,b,f);I.type=nn,I.needsUpdate=!0;const x=T*4;for(let U=0;U<f;U++){const G=m[U],z=p[U],J=w[U],H=_*b*4*U;for(let Y=0;Y<G.count;Y++){const re=Y*x;d===!0&&(r.fromBufferAttribute(G,Y),E[H+re+0]=r.x,E[H+re+1]=r.y,E[H+re+2]=r.z,E[H+re+3]=0),g===!0&&(r.fromBufferAttribute(z,Y),E[H+re+4]=r.x,E[H+re+5]=r.y,E[H+re+6]=r.z,E[H+re+7]=0),S===!0&&(r.fromBufferAttribute(J,Y),E[H+re+8]=r.x,E[H+re+9]=r.y,E[H+re+10]=r.z,E[H+re+11]=J.itemSize===4?r.w:1)}}h={count:f,texture:I,size:new ae(_,b)},n.set(o,h),o.addEventListener("dispose",A)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)l.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let d=0;for(let S=0;S<c.length;S++)d+=c[S];const g=o.morphTargetsRelative?1:1-d;l.getUniforms().setValue(i,"morphTargetBaseInfluence",g),l.getUniforms().setValue(i,"morphTargetInfluences",c)}l.getUniforms().setValue(i,"morphTargetsTexture",h.texture,t),l.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:s}}function Rm(i,e,t,n,r){let s=new WeakMap;function a(c){const u=r.render.frame,f=c.geometry,h=e.get(c,f);if(s.get(h)!==u&&(e.update(h),s.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==u&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,u))),c.isSkinnedMesh){const d=c.skeleton;s.get(d)!==u&&(d.update(),s.set(d,u))}return h}function o(){s=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}const Cm={[ol]:"LINEAR_TONE_MAPPING",[ll]:"REINHARD_TONE_MAPPING",[cl]:"CINEON_TONE_MAPPING",[ul]:"ACES_FILMIC_TONE_MAPPING",[fl]:"AGX_TONE_MAPPING",[dl]:"NEUTRAL_TONE_MAPPING",[hl]:"CUSTOM_TONE_MAPPING"};function Pm(i,e,t,n,r,s){const a=new Ct(e,t,{type:i,depthBuffer:r,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,l=null;const c=new yt;c.setAttribute("position",new rt([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new rt([0,2,0,0,2,0],2));const u=new Zf({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new st(c,u),h=new So(-1,1,1,-1,0,1);let d=null,g=null,S=!1,m,p=null,w=[],T=!1;this.setSize=function(_,b){a.setSize(_,b),o!==null&&o.setSize(_,b),l!==null&&l.setSize(_,b);for(let E=0;E<w.length;E++){const I=w[E];I.setSize&&I.setSize(_,b)}},this.setEffects=function(_){w=_,T=w.length>0&&w[0].isRenderPass===!0;const b=a.width,E=a.height;w.length>0&&o===null&&(o=new Ct(b,E,{type:Lt,depthBuffer:!1,stencilBuffer:!1}),l=new Ct(b,E,{type:Lt,depthBuffer:!1,stencilBuffer:!1}));for(let I=0;I<w.length;I++){const x=w[I];x.setSize&&x.setSize(b,E)}},this.begin=function(_,b){if(S||_.toneMapping===gn&&w.length===0)return!1;if(p=b,b!==null){const E=b.width,I=b.height;(a.width!==E||a.height!==I)&&this.setSize(E,I)}return T===!1&&_.setRenderTarget(a),m=_.toneMapping,_.toneMapping=gn,!0},this.hasRenderPass=function(){return T},this.end=function(_,b){_.toneMapping=m,S=!0;let E=a,I=o;for(let x=0;x<w.length;x++){const A=w[x];A.enabled!==!1&&(A.render(_,I,E,b),A.needsSwap!==!1&&(E=I,I=I===o?l:o))}if(d!==_.outputColorSpace||g!==_.toneMapping){d=_.outputColorSpace,g=_.toneMapping,u.defines={},tt.getTransfer(d)===lt&&(u.defines.SRGB_TRANSFER="");const x=Cm[g];x&&(u.defines[x]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=E.texture,_.setRenderTarget(p),_.render(f,h),p=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}const Ic=new Dt,To=new mr(1,1),Dc=new Pl,Nc=new Kh,Uc=new Zl,Fc=[],Oc=[],Bc=new Float32Array(16),zc=new Float32Array(9),Hc=new Float32Array(4);function Vi(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=Fc[r];if(s===void 0&&(s=new Float32Array(r),Fc[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function Et(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function wt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Ts(i,e){let t=Oc[e];t===void 0&&(t=new Int32Array(e),Oc[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Lm(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Im(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;i.uniform2fv(this.addr,e),wt(t,e)}}function Dm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Et(t,e))return;i.uniform3fv(this.addr,e),wt(t,e)}}function Nm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;i.uniform4fv(this.addr,e),wt(t,e)}}function Um(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Et(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),wt(t,e)}else{if(Et(t,n))return;Hc.set(n),i.uniformMatrix2fv(this.addr,!1,Hc),wt(t,n)}}function Fm(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Et(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),wt(t,e)}else{if(Et(t,n))return;zc.set(n),i.uniformMatrix3fv(this.addr,!1,zc),wt(t,n)}}function Om(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Et(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),wt(t,e)}else{if(Et(t,n))return;Bc.set(n),i.uniformMatrix4fv(this.addr,!1,Bc),wt(t,n)}}function Bm(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function zm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;i.uniform2iv(this.addr,e),wt(t,e)}}function Hm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Et(t,e))return;i.uniform3iv(this.addr,e),wt(t,e)}}function km(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;i.uniform4iv(this.addr,e),wt(t,e)}}function Gm(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function Vm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Et(t,e))return;i.uniform2uiv(this.addr,e),wt(t,e)}}function Wm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Et(t,e))return;i.uniform3uiv(this.addr,e),wt(t,e)}}function Xm(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Et(t,e))return;i.uniform4uiv(this.addr,e),wt(t,e)}}function qm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?(To.compareFunction=t.isReversedDepthBuffer()?za:Ba,s=To):s=Ic,t.setTexture2D(e||s,r)}function Ym(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Nc,r)}function Km(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTextureCube(e||Uc,r)}function Zm(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||Dc,r)}function $m(i){switch(i){case 5126:return Lm;case 35664:return Im;case 35665:return Dm;case 35666:return Nm;case 35674:return Um;case 35675:return Fm;case 35676:return Om;case 5124:case 35670:return Bm;case 35667:case 35671:return zm;case 35668:case 35672:return Hm;case 35669:case 35673:return km;case 5125:return Gm;case 36294:return Vm;case 36295:return Wm;case 36296:return Xm;case 35678:case 36198:case 36298:case 36306:case 35682:return qm;case 35679:case 36299:case 36307:return Ym;case 35680:case 36300:case 36308:case 36293:return Km;case 36289:case 36303:case 36311:case 36292:return Zm}}function Jm(i,e){i.uniform1fv(this.addr,e)}function Qm(i,e){const t=Vi(e,this.size,2);i.uniform2fv(this.addr,t)}function jm(i,e){const t=Vi(e,this.size,3);i.uniform3fv(this.addr,t)}function e0(i,e){const t=Vi(e,this.size,4);i.uniform4fv(this.addr,t)}function t0(i,e){const t=Vi(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function n0(i,e){const t=Vi(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function i0(i,e){const t=Vi(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function r0(i,e){i.uniform1iv(this.addr,e)}function s0(i,e){i.uniform2iv(this.addr,e)}function a0(i,e){i.uniform3iv(this.addr,e)}function o0(i,e){i.uniform4iv(this.addr,e)}function l0(i,e){i.uniform1uiv(this.addr,e)}function c0(i,e){i.uniform2uiv(this.addr,e)}function u0(i,e){i.uniform3uiv(this.addr,e)}function h0(i,e){i.uniform4uiv(this.addr,e)}function f0(i,e,t){const n=this.cache,r=e.length,s=Ts(t,r);Et(n,s)||(i.uniform1iv(this.addr,s),wt(n,s));let a;this.type===i.SAMPLER_2D_SHADOW?a=To:a=Ic;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function d0(i,e,t){const n=this.cache,r=e.length,s=Ts(t,r);Et(n,s)||(i.uniform1iv(this.addr,s),wt(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Nc,s[a])}function p0(i,e,t){const n=this.cache,r=e.length,s=Ts(t,r);Et(n,s)||(i.uniform1iv(this.addr,s),wt(n,s));for(let a=0;a!==r;++a)t.setTextureCube(e[a]||Uc,s[a])}function m0(i,e,t){const n=this.cache,r=e.length,s=Ts(t,r);Et(n,s)||(i.uniform1iv(this.addr,s),wt(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||Dc,s[a])}function g0(i){switch(i){case 5126:return Jm;case 35664:return Qm;case 35665:return jm;case 35666:return e0;case 35674:return t0;case 35675:return n0;case 35676:return i0;case 5124:case 35670:return r0;case 35667:case 35671:return s0;case 35668:case 35672:return a0;case 35669:case 35673:return o0;case 5125:return l0;case 36294:return c0;case 36295:return u0;case 36296:return h0;case 35678:case 36198:case 36298:case 36306:case 35682:return f0;case 35679:case 36299:case 36307:return d0;case 35680:case 36300:case 36308:case 36293:return p0;case 36289:case 36303:case 36311:case 36292:return m0}}class v0{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=$m(t.type)}}class x0{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=g0(t.type)}}class _0{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const Ao=/(\w+)(\])?(\[|\.)?/g;function kc(i,e){i.seq.push(e),i.map[e.id]=e}function M0(i,e,t){const n=i.name,r=n.length;for(Ao.lastIndex=0;;){const s=Ao.exec(n),a=Ao.lastIndex;let o=s[1];const l=s[2]==="]",c=s[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===r){kc(t,c===void 0?new v0(o,i,e):new x0(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new _0(o),kc(t,f)),t=f}}}class As{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),l=e.getUniformLocation(t,o.name);M0(o,l,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],l=n[o.id];l.needsUpdate!==!1&&o.setValue(e,l.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function Gc(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const S0=37297;let y0=0;function b0(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const Vc=new Xe;function E0(i){tt._getMatrix(Vc,tt.workingColorSpace,i);const e=`mat3( ${Vc.elements.map(t=>t.toFixed(4))} )`;switch(tt.getTransfer(i)){case Zr:return[e,"LinearTransferOETF"];case lt:return[e,"sRGBTransferOETF"];default:return Ye("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Wc(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=(i.getShaderInfoLog(e)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+b0(i.getShaderSource(e),o)}else return s}function w0(i,e){const t=E0(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const T0={[ol]:"Linear",[ll]:"Reinhard",[cl]:"Cineon",[ul]:"ACESFilmic",[fl]:"AgX",[dl]:"Neutral",[hl]:"Custom"};function A0(i,e){const t=T0[e];return t===void 0?(Ye("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Rs=new O;function R0(){tt.getLuminanceCoefficients(Rs);const i=Rs.x.toFixed(4),e=Rs.y.toFixed(4),t=Rs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function C0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(wr).join(`
`)}function P0(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function L0(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function wr(i){return i!==""}function Xc(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function qc(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const I0=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ro(i){return i.replace(I0,N0)}const D0=new Map;function N0(i,e){let t=$e[e];if(t===void 0){const n=D0.get(e);if(n!==void 0)t=$e[n],Ye('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Ro(t)}const U0=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Yc(i){return i.replace(U0,F0)}function F0(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Kc(i){let e=`precision ${i.precision} float;
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
#define LOW_PRECISION`),e}const O0={[Fr]:"SHADOWMAP_TYPE_PCF",[Ji]:"SHADOWMAP_TYPE_VSM"};function B0(i){return O0[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const z0={[jn]:"ENVMAP_TYPE_CUBE",[_i]:"ENVMAP_TYPE_CUBE",[Or]:"ENVMAP_TYPE_CUBE_UV"};function H0(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":z0[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const k0={[_i]:"ENVMAP_MODE_REFRACTION"};function G0(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":k0[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const V0={[al]:"ENVMAP_BLENDING_MULTIPLY",[ch]:"ENVMAP_BLENDING_MIX",[uh]:"ENVMAP_BLENDING_ADD"};function W0(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":V0[i.combine]||"ENVMAP_BLENDING_NONE"}function X0(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function q0(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const l=B0(t),c=H0(t),u=G0(t),f=W0(t),h=X0(t),d=C0(t),g=P0(s),S=r.createProgram();let m,p,w=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(wr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(wr).join(`
`),p.length>0&&(p+=`
`)):(m=[Kc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(wr).join(`
`),p=[Kc(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==gn?"#define TONE_MAPPING":"",t.toneMapping!==gn?$e.tonemapping_pars_fragment:"",t.toneMapping!==gn?A0("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",$e.colorspace_pars_fragment,w0("linearToOutputTexel",t.outputColorSpace),R0(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(wr).join(`
`)),a=Ro(a),a=Xc(a,t),a=qc(a,t),o=Ro(o),o=Xc(o,t),o=qc(o,t),a=Yc(a),o=Yc(o),t.isRawShaderMaterial!==!0&&(w=`#version 300 es
`,m=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===yl?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===yl?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);const T=w+m+a,_=w+p+o,b=Gc(r,r.VERTEX_SHADER,T),E=Gc(r,r.FRAGMENT_SHADER,_);r.attachShader(S,b),r.attachShader(S,E),t.index0AttributeName!==void 0?r.bindAttribLocation(S,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(S,0,"position"),r.linkProgram(S);function I(G){if(i.debug.checkShaderErrors){const z=r.getProgramInfoLog(S)||"",J=r.getShaderInfoLog(b)||"",H=r.getShaderInfoLog(E)||"",Y=z.trim(),re=J.trim(),$=H.trim();let Z=!0,ie=!0;if(r.getProgramParameter(S,r.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,S,b,E);else{const se=Wc(r,b,"vertex"),he=Wc(r,E,"fragment");nt("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(S,r.VALIDATE_STATUS)+`

Material Name: `+G.name+`
Material Type: `+G.type+`

Program Info Log: `+Y+`
`+se+`
`+he)}else Y!==""?Ye("WebGLProgram: Program Info Log:",Y):(re===""||$==="")&&(ie=!1);ie&&(G.diagnostics={runnable:Z,programLog:Y,vertexShader:{log:re,prefix:m},fragmentShader:{log:$,prefix:p}})}r.deleteShader(b),r.deleteShader(E),x=new As(r,S),A=L0(r,S)}let x;this.getUniforms=function(){return x===void 0&&I(this),x};let A;this.getAttributes=function(){return A===void 0&&I(this),A};let U=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return U===!1&&(U=r.getProgramParameter(S,S0)),U},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=y0++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=b,this.fragmentShader=E,this}let Y0=0;class K0{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new Z0(e),t.set(e,n)),n}}class Z0{constructor(e){this.id=Y0++,this.code=e,this.usedTimes=0}}function $0(i){return i===ti||i===qr||i===Yr}function J0(i,e,t,n,r,s){const a=new Dl,o=new K0,l=new Set,c=[],u=new Map,f=n.logarithmicDepthBuffer;let h=n.precision;const d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(x){return l.add(x),x===0?"uv":`uv${x}`}function S(x,A,U,G,z,J){const H=G.fog,Y=z.geometry,re=x.isMeshStandardMaterial||x.isMeshLambertMaterial||x.isMeshPhongMaterial?G.environment:null,$=x.isMeshStandardMaterial||x.isMeshLambertMaterial&&!x.envMap||x.isMeshPhongMaterial&&!x.envMap,Z=e.get(x.envMap||re,$),ie=Z&&Z.mapping===Or?Z.image.height:null,se=d[x.type];x.precision!==null&&(h=n.getMaxPrecision(x.precision),h!==x.precision&&Ye("WebGLProgram.getParameters:",x.precision,"not supported, using",h,"instead."));const he=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Le=he!==void 0?he.length:0;let pe=0;Y.morphAttributes.position!==void 0&&(pe=1),Y.morphAttributes.normal!==void 0&&(pe=2),Y.morphAttributes.color!==void 0&&(pe=3);let Ce,De,Ge,N;if(se){const dt=yn[se];Ce=dt.vertexShader,De=dt.fragmentShader}else{Ce=x.vertexShader,De=x.fragmentShader;const dt=o.getVertexShaderStage(x),at=o.getFragmentShaderStage(x);o.update(x,dt,at),Ge=dt.id,N=at.id}const D=i.getRenderTarget(),L=i.state.buffers.depth.getReversed(),C=z.isInstancedMesh===!0,B=z.isBatchedMesh===!0,ne=!!x.map,ge=!!x.matcap,R=!!Z,k=!!x.aoMap,F=!!x.lightMap,K=!!x.bumpMap&&x.wireframe===!1,Q=!!x.normalMap,ce=!!x.displacementMap,ve=!!x.emissiveMap,me=!!x.metalnessMap,q=!!x.roughnessMap,M=x.anisotropy>0,Ae=x.clearcoat>0,Fe=x.dispersion>0,P=x.retroreflectivity>0,v=x.iridescence>0,X=x.sheen>0,j=x.transmission>0,le=M&&!!x.anisotropyMap,_e=Ae&&!!x.clearcoatMap,Me=Ae&&!!x.clearcoatNormalMap,ue=Ae&&!!x.clearcoatRoughnessMap,fe=v&&!!x.iridescenceMap,Se=v&&!!x.iridescenceThicknessMap,ze=X&&!!x.sheenColorMap,be=X&&!!x.sheenRoughnessMap,ye=!!x.specularMap,Ve=!!x.specularColorMap,qe=!!x.specularIntensityMap,Ze=j&&!!x.transmissionMap,W=j&&!!x.thicknessMap,Ee=!!x.gradientMap,de=!!x.alphaMap,we=x.alphaTest>0,Ie=!!x.alphaHash,xe=!!x.extensions;let We=gn;x.toneMapped&&(D===null||D.isXRRenderTarget===!0)&&(We=i.toneMapping);const He={shaderID:se,shaderType:x.type,shaderName:x.name,vertexShader:Ce,fragmentShader:De,defines:x.defines,customVertexShaderID:Ge,customFragmentShaderID:N,isRawShaderMaterial:x.isRawShaderMaterial===!0,glslVersion:x.glslVersion,precision:h,batching:B,batchingColor:B&&z._colorsTexture!==null,instancing:C,instancingColor:C&&z.instanceColor!==null,instancingMorph:C&&z.morphTexture!==null,outputColorSpace:D===null?i.outputColorSpace:D.isXRRenderTarget===!0?D.texture.colorSpace:tt.workingColorSpace,alphaToCoverage:!!x.alphaToCoverage,map:ne,matcap:ge,envMap:R,envMapMode:R&&Z.mapping,envMapCubeUVHeight:ie,aoMap:k,lightMap:F,bumpMap:K,normalMap:Q,displacementMap:ce,emissiveMap:ve,normalMapObjectSpace:Q&&x.normalMapType===dh,normalMapTangentSpace:Q&&x.normalMapType===Sl,packedNormalMap:Q&&x.normalMapType===Sl&&$0(x.normalMap.format),metalnessMap:me,roughnessMap:q,anisotropy:M,anisotropyMap:le,clearcoat:Ae,clearcoatMap:_e,clearcoatNormalMap:Me,clearcoatRoughnessMap:ue,dispersion:Fe,retroreflection:P,iridescence:v,iridescenceMap:fe,iridescenceThicknessMap:Se,sheen:X,sheenColorMap:ze,sheenRoughnessMap:be,specularMap:ye,specularColorMap:Ve,specularIntensityMap:qe,transmission:j,transmissionMap:Ze,thicknessMap:W,gradientMap:Ee,opaque:x.transparent===!1&&x.blending===Qi&&x.alphaToCoverage===!1,alphaMap:de,alphaTest:we,alphaHash:Ie,combine:x.combine,mapUv:ne&&g(x.map.channel),aoMapUv:k&&g(x.aoMap.channel),lightMapUv:F&&g(x.lightMap.channel),bumpMapUv:K&&g(x.bumpMap.channel),normalMapUv:Q&&g(x.normalMap.channel),displacementMapUv:ce&&g(x.displacementMap.channel),emissiveMapUv:ve&&g(x.emissiveMap.channel),metalnessMapUv:me&&g(x.metalnessMap.channel),roughnessMapUv:q&&g(x.roughnessMap.channel),anisotropyMapUv:le&&g(x.anisotropyMap.channel),clearcoatMapUv:_e&&g(x.clearcoatMap.channel),clearcoatNormalMapUv:Me&&g(x.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ue&&g(x.clearcoatRoughnessMap.channel),iridescenceMapUv:fe&&g(x.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&g(x.iridescenceThicknessMap.channel),sheenColorMapUv:ze&&g(x.sheenColorMap.channel),sheenRoughnessMapUv:be&&g(x.sheenRoughnessMap.channel),specularMapUv:ye&&g(x.specularMap.channel),specularColorMapUv:Ve&&g(x.specularColorMap.channel),specularIntensityMapUv:qe&&g(x.specularIntensityMap.channel),transmissionMapUv:Ze&&g(x.transmissionMap.channel),thicknessMapUv:W&&g(x.thicknessMap.channel),alphaMapUv:de&&g(x.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(Q||M),vertexNormals:!!Y.attributes.normal,vertexColors:x.vertexColors,vertexAlphas:x.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!Y.attributes.uv&&(ne||de),fog:!!H,useFog:x.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:x.wireframe===!1&&(x.flatShading===!0||Y.attributes.normal===void 0&&Q===!1&&(x.isMeshLambertMaterial||x.isMeshPhongMaterial||x.isMeshStandardMaterial||x.isMeshPhysicalMaterial)),sizeAttenuation:x.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:L,skinning:z.isSkinnedMesh===!0,hasPositionAttribute:Y.attributes.position!==void 0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:Le,morphTextureStride:pe,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:J.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:x.dithering,shadowMapEnabled:i.shadowMap.enabled&&U.length>0,shadowMapType:i.shadowMap.type,toneMapping:We,decodeVideoTexture:ne&&x.map.isVideoTexture===!0&&tt.getTransfer(x.map.colorSpace)===lt,decodeVideoTextureEmissive:ve&&x.emissiveMap.isVideoTexture===!0&&tt.getTransfer(x.emissiveMap.colorSpace)===lt,premultipliedAlpha:x.premultipliedAlpha,doubleSided:x.side===$t,flipSided:x.side===Ot,useDepthPacking:x.depthPacking>=0,depthPacking:x.depthPacking||0,index0AttributeName:x.index0AttributeName,extensionClipCullDistance:xe&&x.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(xe&&x.extensions.multiDraw===!0||B)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:x.customProgramCacheKey()};return He.vertexUv1s=l.has(1),He.vertexUv2s=l.has(2),He.vertexUv3s=l.has(3),l.clear(),He}function m(x){const A=[];if(x.shaderID?A.push(x.shaderID):(A.push(x.customVertexShaderID),A.push(x.customFragmentShaderID)),x.defines!==void 0)for(const U in x.defines)A.push(U),A.push(x.defines[U]);return x.isRawShaderMaterial===!1&&(p(A,x),w(A,x),A.push(i.outputColorSpace)),A.push(x.customProgramCacheKey),A.join()}function p(x,A){x.push(A.precision),x.push(A.outputColorSpace),x.push(A.envMapMode),x.push(A.envMapCubeUVHeight),x.push(A.mapUv),x.push(A.alphaMapUv),x.push(A.lightMapUv),x.push(A.aoMapUv),x.push(A.bumpMapUv),x.push(A.normalMapUv),x.push(A.displacementMapUv),x.push(A.emissiveMapUv),x.push(A.metalnessMapUv),x.push(A.roughnessMapUv),x.push(A.anisotropyMapUv),x.push(A.clearcoatMapUv),x.push(A.clearcoatNormalMapUv),x.push(A.clearcoatRoughnessMapUv),x.push(A.iridescenceMapUv),x.push(A.iridescenceThicknessMapUv),x.push(A.sheenColorMapUv),x.push(A.sheenRoughnessMapUv),x.push(A.specularMapUv),x.push(A.specularColorMapUv),x.push(A.specularIntensityMapUv),x.push(A.transmissionMapUv),x.push(A.thicknessMapUv),x.push(A.combine),x.push(A.fogExp2),x.push(A.sizeAttenuation),x.push(A.morphTargetsCount),x.push(A.morphAttributeCount),x.push(A.numSunLights),x.push(A.numDirLights),x.push(A.numPointLights),x.push(A.numSpotLights),x.push(A.numSpotLightMaps),x.push(A.numHemiLights),x.push(A.numRectAreaLights),x.push(A.numSunLightShadows),x.push(A.numDirLightShadows),x.push(A.numPointLightShadows),x.push(A.numSpotLightShadows),x.push(A.numSpotLightShadowsWithMaps),x.push(A.numLightProbes),x.push(A.shadowMapType),x.push(A.toneMapping),x.push(A.numClippingPlanes),x.push(A.numClipIntersection),x.push(A.depthPacking)}function w(x,A){a.disableAll(),A.instancing&&a.enable(0),A.instancingColor&&a.enable(1),A.instancingMorph&&a.enable(2),A.matcap&&a.enable(3),A.envMap&&a.enable(4),A.normalMapObjectSpace&&a.enable(5),A.normalMapTangentSpace&&a.enable(6),A.clearcoat&&a.enable(7),A.iridescence&&a.enable(8),A.alphaTest&&a.enable(9),A.vertexColors&&a.enable(10),A.vertexAlphas&&a.enable(11),A.vertexUv1s&&a.enable(12),A.vertexUv2s&&a.enable(13),A.vertexUv3s&&a.enable(14),A.vertexTangents&&a.enable(15),A.anisotropy&&a.enable(16),A.alphaHash&&a.enable(17),A.batching&&a.enable(18),A.dispersion&&a.enable(19),A.retroreflection&&a.enable(24),A.batchingColor&&a.enable(20),A.gradientMap&&a.enable(21),A.packedNormalMap&&a.enable(22),A.vertexNormals&&a.enable(23),x.push(a.mask),a.disableAll(),A.fog&&a.enable(0),A.useFog&&a.enable(1),A.flatShading&&a.enable(2),A.logarithmicDepthBuffer&&a.enable(3),A.reversedDepthBuffer&&a.enable(4),A.skinning&&a.enable(5),A.morphTargets&&a.enable(6),A.morphNormals&&a.enable(7),A.morphColors&&a.enable(8),A.premultipliedAlpha&&a.enable(9),A.shadowMapEnabled&&a.enable(10),A.doubleSided&&a.enable(11),A.flipSided&&a.enable(12),A.useDepthPacking&&a.enable(13),A.dithering&&a.enable(14),A.transmission&&a.enable(15),A.sheen&&a.enable(16),A.opaque&&a.enable(17),A.pointsUvs&&a.enable(18),A.decodeVideoTexture&&a.enable(19),A.decodeVideoTextureEmissive&&a.enable(20),A.alphaToCoverage&&a.enable(21),A.numLightProbeGrids>0&&a.enable(22),A.hasPositionAttribute&&a.enable(23),x.push(a.mask)}function T(x){const A=d[x.type];let U;if(A){const G=yn[A];U=br.clone(G.uniforms)}else U=x.uniforms;return U}function _(x,A){let U=u.get(A);return U!==void 0?++U.usedTimes:(U=new q0(i,A,x,r),c.push(U),u.set(A,U)),U}function b(x){if(--x.usedTimes===0){const A=c.indexOf(x);c[A]=c[c.length-1],c.pop(),u.delete(x.cacheKey),x.destroy()}}function E(x){o.remove(x)}function I(){o.dispose()}return{getParameters:S,getProgramCacheKey:m,getUniforms:T,acquireProgram:_,releaseProgram:b,releaseShaderCache:E,programs:c,dispose:I}}function Q0(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,l){i.get(a)[o]=l}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function j0(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Zc(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function $c(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(h){let d=0;return h.isInstancedMesh&&(d+=2),h.isSkinnedMesh&&(d+=1),d}function o(h,d,g,S,m,p){let w=i[e];return w===void 0?(w={id:h.id,object:h,geometry:d,material:g,materialVariant:a(h),groupOrder:S,renderOrder:h.renderOrder,z:m,group:p},i[e]=w):(w.id=h.id,w.object=h,w.geometry=d,w.material=g,w.materialVariant=a(h),w.groupOrder=S,w.renderOrder=h.renderOrder,w.z=m,w.group=p),e++,w}function l(h,d,g,S,m,p,w){w.reversedDepth===!0&&(m=-m);const T=o(h,d,g,S,m,p);g.transmission>0?n.push(T):g.transparent===!0?r.push(T):t.push(T)}function c(h,d,g,S,m,p){const w=o(h,d,g,S,m,p);g.transmission>0?n.unshift(w):g.transparent===!0?r.unshift(w):t.unshift(w)}function u(h,d){t.length>1&&t.sort(h||j0),n.length>1&&n.sort(d||Zc),r.length>1&&r.sort(d||Zc)}function f(){for(let h=e,d=i.length;h<d;h++){const g=i[h];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:l,unshift:c,finish:f,sort:u}}function eg(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new $c,i.set(n,[a])):r>=s.length?(a=new $c,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function tg(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new O,color:new Ke};break;case"SpotLight":t={position:new O,direction:new O,color:new Ke,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new Ke,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new Ke,groundColor:new Ke};break;case"RectAreaLight":t={color:new Ke,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function ng(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ae,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let ig=0;function rg(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function sg(i){const e=new tg,t=ng(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)n.probe.push(new O);const r=new O,s=new ct,a=new ct;function o(c){let u=0,f=0,h=0;for(let z=0;z<9;z++)n.probe[z].set(0,0,0);let d=0,g=0,S=0,m=0,p=0,w=0,T=0,_=0,b=0,E=0,I=0,x=0,A=0,U=0;c.sort(rg);for(let z=0,J=c.length;z<J;z++){const H=c[z],Y=H.color,re=H.intensity,$=H.distance;let Z=null;if(H.shadow&&H.shadow.map&&(H.shadow.map.texture.format===ti?Z=H.shadow.map.texture:Z=H.shadow.map.depthTexture||H.shadow.map.texture),H.isAmbientLight)u+=Y.r*re,f+=Y.g*re,h+=Y.b*re;else if(H.isLightProbe){for(let ie=0;ie<9;ie++)n.probe[ie].addScaledVector(H.sh.coefficients[ie],re);U++}else if(H.isSunLight){const ie=e.get(H);if(ie.color.copy(H.color).multiplyScalar(H.intensity),H.castShadow){const se=H.shadow,he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize.copy(se.mapSize).multiply(se.getFrameExtents()),n.sunShadow[g]=he,n.sunShadowMap[g]=Z;const Le=se.getViewportCount();for(let pe=0;pe<Le;pe++)n.sunShadowMatrix[S+pe]=se.getMatrix(pe),n.sunShadowCascade[S+pe]=se._cascadeData[pe];S+=Le,g++}n.sun[d]=ie,d++}else if(H.isDirectionalLight){const ie=e.get(H);if(ie.color.copy(H.color).multiplyScalar(H.intensity),H.castShadow){const se=H.shadow,he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize=se.mapSize,n.directionalShadow[m]=he,n.directionalShadowMap[m]=Z,n.directionalShadowMatrix[m]=H.shadow.matrix,b++}n.directional[m]=ie,m++}else if(H.isSpotLight){const ie=e.get(H);ie.position.setFromMatrixPosition(H.matrixWorld),ie.color.copy(Y).multiplyScalar(re),ie.distance=$,ie.coneCos=Math.cos(H.angle),ie.penumbraCos=Math.cos(H.angle*(1-H.penumbra)),ie.decay=H.decay,n.spot[w]=ie;const se=H.shadow;if(H.map&&(n.spotLightMap[x]=H.map,x++,se.updateMatrices(H),H.castShadow&&A++),n.spotLightMatrix[w]=se.matrix,H.castShadow){const he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize=se.mapSize,n.spotShadow[w]=he,n.spotShadowMap[w]=Z,I++}w++}else if(H.isRectAreaLight){const ie=e.get(H);ie.color.copy(Y).multiplyScalar(re),ie.halfWidth.set(H.width*.5,0,0),ie.halfHeight.set(0,H.height*.5,0),n.rectArea[T]=ie,T++}else if(H.isPointLight){const ie=e.get(H);if(ie.color.copy(H.color).multiplyScalar(H.intensity),ie.distance=H.distance,ie.decay=H.decay,H.castShadow){const se=H.shadow,he=t.get(H);he.shadowIntensity=se.intensity,he.shadowBias=se.bias,he.shadowNormalBias=se.normalBias,he.shadowRadius=se.radius,he.shadowMapSize=se.mapSize,he.shadowCameraNear=se.camera.near,he.shadowCameraFar=se.camera.far,n.pointShadow[p]=he,n.pointShadowMap[p]=Z,n.pointShadowMatrix[p]=H.shadow.matrix,E++}n.point[p]=ie,p++}else if(H.isHemisphereLight){const ie=e.get(H);ie.skyColor.copy(H.color).multiplyScalar(re),ie.groundColor.copy(H.groundColor).multiplyScalar(re),n.hemi[_]=ie,_++}}T>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Te.LTC_FLOAT_1,n.rectAreaLTC2=Te.LTC_FLOAT_2):(n.rectAreaLTC1=Te.LTC_HALF_1,n.rectAreaLTC2=Te.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=h;const G=n.hash;(G.sunLength!==d||G.directionalLength!==m||G.pointLength!==p||G.spotLength!==w||G.rectAreaLength!==T||G.hemiLength!==_||G.numSunShadows!==g||G.numDirectionalShadows!==b||G.numPointShadows!==E||G.numSpotShadows!==I||G.numSpotMaps!==x||G.numLightProbes!==U)&&(n.sun.length=d,n.directional.length=m,n.spot.length=w,n.rectArea.length=T,n.point.length=p,n.hemi.length=_,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=S,n.sunShadowCascade.length=S,n.directionalShadow.length=b,n.directionalShadowMap.length=b,n.directionalShadowMatrix.length=b,n.pointShadow.length=E,n.pointShadowMap.length=E,n.pointShadowMatrix.length=E,n.spotShadow.length=I,n.spotShadowMap.length=I,n.spotLightMatrix.length=I+x-A,n.spotLightMap.length=x,n.numSpotLightShadowsWithMaps=A,n.numLightProbes=U,G.sunLength=d,G.directionalLength=m,G.pointLength=p,G.spotLength=w,G.rectAreaLength=T,G.hemiLength=_,G.numSunShadows=g,G.numDirectionalShadows=b,G.numPointShadows=E,G.numSpotShadows=I,G.numSpotMaps=x,G.numLightProbes=U,n.version=ig++)}function l(c,u){let f=0,h=0,d=0,g=0,S=0,m=0;const p=u.matrixWorldInverse;for(let w=0,T=c.length;w<T;w++){const _=c[w];if(_.isSunLight){const b=n.sun[f];b.direction.setFromMatrixPosition(_.matrixWorld),b.direction.transformDirection(p),f++}else if(_.isDirectionalLight){const b=n.directional[h];b.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(p),h++}else if(_.isSpotLight){const b=n.spot[g];b.position.setFromMatrixPosition(_.matrixWorld),b.position.applyMatrix4(p),b.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(p),g++}else if(_.isRectAreaLight){const b=n.rectArea[S];b.position.setFromMatrixPosition(_.matrixWorld),b.position.applyMatrix4(p),a.identity(),s.copy(_.matrixWorld),s.premultiply(p),a.extractRotation(s),b.halfWidth.set(_.width*.5,0,0),b.halfHeight.set(0,_.height*.5,0),b.halfWidth.applyMatrix4(a),b.halfHeight.applyMatrix4(a),S++}else if(_.isPointLight){const b=n.point[d];b.position.setFromMatrixPosition(_.matrixWorld),b.position.applyMatrix4(p),d++}else if(_.isHemisphereLight){const b=n.hemi[m];b.direction.setFromMatrixPosition(_.matrixWorld),b.direction.transformDirection(p),m++}}}return{setup:o,setupView:l,state:n}}function Jc(i){const e=new sg(i),t=[],n=[],r=[];function s(h){f.camera=h,t.length=0,n.length=0,r.length=0}function a(h){t.push(h)}function o(h){n.push(h)}function l(h){r.push(h)}function c(){e.setup(t)}function u(h){e.setupView(t,h)}const f={lightsArray:t,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:f,setupLights:c,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:l}}function ag(i){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new Jc(i),e.set(r,[o])):s>=a.length?(o=new Jc(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const og=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,lg=`uniform sampler2D shadow_pass;
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
}`,cg=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],ug=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],Qc=new ct,Tr=new O,Co=new O;function hg(i,e,t){let n=new Kl;const r=new ae,s=new ae,a=new mt,o=new $f,l=new Jf,c={},u=t.maxTextureSize,f={[Qn]:Ot,[Ot]:Qn,[$t]:$t},h=new _t({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ae},radius:{value:4}},vertexShader:og,fragmentShader:lg}),d=h.clone();d.defines.HORIZONTAL_PASS=1;const g=new yt;g.setAttribute("position",new qt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new st(g,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Fr;let p=this.type;this.render=function(E,I,x){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||E.length===0)return;this.type===Wu&&(Ye("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Fr);const A=i.getRenderTarget(),U=i.getActiveCubeFace(),G=i.getActiveMipmapLevel(),z=i.state;z.setBlending(mn),z.buffers.depth.getReversed()===!0?z.buffers.color.setClear(0,0,0,0):z.buffers.color.setClear(1,1,1,1),z.buffers.depth.setTest(!0),z.setScissorTest(!1);const J=p!==this.type;J&&I.traverse(function(H){H.material&&(Array.isArray(H.material)?H.material.forEach(Y=>Y.needsUpdate=!0):H.material.needsUpdate=!0)});for(let H=0,Y=E.length;H<Y;H++){const re=E[H],$=re.shadow;if($===void 0){Ye("WebGLShadowMap:",re,"has no shadow.");continue}if($.autoUpdate===!1&&$.needsUpdate===!1)continue;r.copy($.mapSize);const Z=$.getFrameExtents();r.multiply(Z),s.copy($.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/Z.x),r.x=s.x*Z.x,$.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/Z.y),r.y=s.y*Z.y,$.mapSize.y=s.y));const ie=i.state.buffers.depth.getReversed();if($.camera._reversedDepth=ie,$.map===null||J===!0){if($.map!==null&&($.map.depthTexture!==null&&($.map.depthTexture.dispose(),$.map.depthTexture=null),$.map.dispose()),this.type===Ji){if(re.isPointLight){Ye("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}$.map=new Ct(r.x,r.y,{format:ti,type:Lt,minFilter:Tt,magFilter:Tt,generateMipmaps:!1}),$.map.texture.name=re.name+".shadowMap",$.map.depthTexture=new mr(r.x,r.y,nn),$.map.depthTexture.name=re.name+".shadowMapDepth",$.map.depthTexture.format=An,$.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=Rt,$.map.depthTexture.magFilter=Rt}else re.isPointLight?($.map=new Lc(r.x),$.map.depthTexture=new pf(r.x,xn)):($.map=new Ct(r.x,r.y),$.map.depthTexture=new mr(r.x,r.y,xn)),$.map.depthTexture.name=re.name+".shadowMap",$.map.depthTexture.format=An,this.type===Fr?($.map.depthTexture.compareFunction=ie?za:Ba,$.map.depthTexture.minFilter=Tt,$.map.depthTexture.magFilter=Tt):($.map.depthTexture.compareFunction=null,$.map.depthTexture.minFilter=Rt,$.map.depthTexture.magFilter=Rt);$.camera.updateProjectionMatrix()}$.map.isWebGLCubeRenderTarget!==!0&&($.map.width!==r.x||$.map.height!==r.y)&&$.map.setSize(r.x,r.y);const se=$.map.isWebGLCubeRenderTarget?6:$.getViewportCount();re.isPointLight!==!0&&$.updateMatrices(re,x);for(let he=0;he<se;he++){const Le=$.getCamera(he);if(re.isPointLight){const pe=$.camera,Ce=$.matrix,De=re.distance||pe.far;De!==pe.far&&(pe.far=De,pe.updateProjectionMatrix()),Tr.setFromMatrixPosition(re.matrixWorld),pe.position.copy(Tr),Co.copy(pe.position),Co.add(cg[he]),pe.up.copy(ug[he]),pe.lookAt(Co),pe.updateMatrixWorld(),Ce.makeTranslation(-Tr.x,-Tr.y,-Tr.z),Qc.multiplyMatrices(pe.projectionMatrix,pe.matrixWorldInverse),$._frustum.setFromProjectionMatrix(Qc,pe.coordinateSystem,pe.reversedDepth)}if($.map.isWebGLCubeRenderTarget)i.setRenderTarget($.map,he),i.clear();else{he===0&&(i.setRenderTarget($.map),i.clear());const pe=$.getViewport(he);a.set(s.x*pe.x,s.y*pe.y,s.x*pe.z,s.y*pe.w),z.viewport(a)}n=$.getFrustum(he),_(I,x,Le,re,this.type)}$.isPointLightShadow!==!0&&this.type===Ji&&w($,x),$.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(A,U,G)};function w(E,I){const x=e.update(S);h.defines.VSM_SAMPLES!==E.blurSamples&&(h.defines.VSM_SAMPLES=E.blurSamples,d.defines.VSM_SAMPLES=E.blurSamples,h.needsUpdate=!0,d.needsUpdate=!0),E.mapPass===null?E.mapPass=new Ct(r.x,r.y,{format:ti,type:Lt}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),h.uniforms.shadow_pass.value=E.map.depthTexture,h.uniforms.resolution.value.set(E.map.width,E.map.height),h.uniforms.radius.value=E.radius,i.setRenderTarget(E.mapPass),i.clear(),i.renderBufferDirect(I,null,x,h,S,null),d.uniforms.shadow_pass.value=E.mapPass.texture,d.uniforms.resolution.value.set(E.map.width,E.map.height),d.uniforms.radius.value=E.radius,i.setRenderTarget(E.map),i.clear(),i.renderBufferDirect(I,null,x,d,S,null)}function T(E,I,x,A){let U=null;const G=x.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(G!==void 0)U=G;else if(U=x.isPointLight===!0?l:o,i.localClippingEnabled&&I.clipShadows===!0&&Array.isArray(I.clippingPlanes)&&I.clippingPlanes.length!==0||I.displacementMap&&I.displacementScale!==0||I.alphaMap&&I.alphaTest>0||I.map&&I.alphaTest>0||I.alphaToCoverage===!0){const z=U.uuid,J=I.uuid;let H=c[z];H===void 0&&(H={},c[z]=H);let Y=H[J];Y===void 0&&(Y=U.clone(),H[J]=Y,I.addEventListener("dispose",b)),U=Y}if(U.visible=I.visible,U.wireframe=I.wireframe,A===Ji?U.side=I.shadowSide!==null?I.shadowSide:I.side:U.side=I.shadowSide!==null?I.shadowSide:f[I.side],U.alphaMap=I.alphaMap,U.alphaTest=I.alphaToCoverage===!0?.5:I.alphaTest,U.map=I.map,U.clipShadows=I.clipShadows,U.clippingPlanes=I.clippingPlanes,U.clipIntersection=I.clipIntersection,U.displacementMap=I.displacementMap,U.displacementScale=I.displacementScale,U.displacementBias=I.displacementBias,U.wireframeLinewidth=I.wireframeLinewidth,U.linewidth=I.linewidth,x.isPointLight===!0&&U.isMeshDistanceMaterial===!0){const z=i.properties.get(U);z.light=x}return U}function _(E,I,x,A,U){if(E.visible===!1)return;if(E.layers.test(I.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&U===Ji)&&(!E.frustumCulled||E.intersectsFrustum(n))){E.modelViewMatrix.multiplyMatrices(x.matrixWorldInverse,E.matrixWorld);const J=e.update(E),H=E.material;if(Array.isArray(H)){const Y=J.groups;for(let re=0,$=Y.length;re<$;re++){const Z=Y[re],ie=H[Z.materialIndex];if(ie&&ie.visible){const se=T(E,ie,A,U);E.onBeforeShadow(i,E,I,x,J,se,Z),i.renderBufferDirect(x,null,J,se,E,Z),E.onAfterShadow(i,E,I,x,J,se,Z)}}}else if(H.visible){const Y=T(E,H,A,U);E.onBeforeShadow(i,E,I,x,J,Y,null),i.renderBufferDirect(x,null,J,Y,E,null),E.onAfterShadow(i,E,I,x,J,Y,null)}}const z=E.children;for(let J=0,H=z.length;J<H;J++)_(z[J],I,x,A,U)}function b(E){E.target.removeEventListener("dispose",b);for(const x in c){const A=c[x],U=E.target.uuid;U in A&&(A[U].dispose(),delete A[U])}}}function fg(i,e){function t(){let W=!1;const Ee=new mt;let de=null;const we=new mt(0,0,0,0);return{setMask:function(Ie){de!==Ie&&!W&&(i.colorMask(Ie,Ie,Ie,Ie),de=Ie)},setLocked:function(Ie){W=Ie},setClear:function(Ie,xe,We,He,dt){dt===!0&&(Ie*=He,xe*=He,We*=He),Ee.set(Ie,xe,We,He),we.equals(Ee)===!1&&(i.clearColor(Ie,xe,We,He),we.copy(Ee))},reset:function(){W=!1,de=null,we.set(-1,0,0,0)}}}function n(){let W=!1,Ee=!1,de=null,we=null,Ie=null;return{setReversed:function(xe){if(Ee!==xe){const We=e.get("EXT_clip_control");xe?We.clipControlEXT(We.LOWER_LEFT_EXT,We.ZERO_TO_ONE_EXT):We.clipControlEXT(We.LOWER_LEFT_EXT,We.NEGATIVE_ONE_TO_ONE_EXT),Ee=xe;const He=Ie;Ie=null,this.setClear(He)}},getReversed:function(){return Ee},setTest:function(xe){xe?D(i.DEPTH_TEST):L(i.DEPTH_TEST)},setMask:function(xe){de!==xe&&!W&&(i.depthMask(xe),de=xe)},setFunc:function(xe){if(Ee&&(xe=wh[xe]),we!==xe){switch(xe){case Xs:i.depthFunc(i.NEVER);break;case qs:i.depthFunc(i.ALWAYS);break;case Ys:i.depthFunc(i.LESS);break;case er:i.depthFunc(i.LEQUAL);break;case Ks:i.depthFunc(i.EQUAL);break;case Zs:i.depthFunc(i.GEQUAL);break;case $s:i.depthFunc(i.GREATER);break;case Js:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}we=xe}},setLocked:function(xe){W=xe},setClear:function(xe){Ie!==xe&&(Ie=xe,Ee&&(xe=1-xe),i.clearDepth(xe))},reset:function(){W=!1,de=null,we=null,Ie=null,Ee=!1}}}function r(){let W=!1,Ee=null,de=null,we=null,Ie=null,xe=null,We=null,He=null,dt=null;return{setTest:function(at){W||(at?D(i.STENCIL_TEST):L(i.STENCIL_TEST))},setMask:function(at){Ee!==at&&!W&&(i.stencilMask(at),Ee=at)},setFunc:function(at,pn,wn){(de!==at||we!==pn||Ie!==wn)&&(i.stencilFunc(at,pn,wn),de=at,we=pn,Ie=wn)},setOp:function(at,pn,wn){(xe!==at||We!==pn||He!==wn)&&(i.stencilOp(at,pn,wn),xe=at,We=pn,He=wn)},setLocked:function(at){W=at},setClear:function(at){dt!==at&&(i.clearStencil(at),dt=at)},reset:function(){W=!1,Ee=null,de=null,we=null,Ie=null,xe=null,We=null,He=null,dt=null}}}const s=new t,a=new n,o=new r,l=new WeakMap,c=new WeakMap;let u={},f={},h={},d=new WeakMap,g=[],S=null,m=!1,p=null,w=null,T=null,_=null,b=null,E=null,I=null,x=new Ke(0,0,0),A=0,U=!1,G=null,z=null,J=null,H=null,Y=null;const re=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let $=!1,Z=0;const ie=i.getParameter(i.VERSION);ie.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(ie)[1]),$=Z>=1):ie.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(ie)[1]),$=Z>=2);let se=null,he={};const Le=i.getParameter(i.SCISSOR_BOX),pe=i.getParameter(i.VIEWPORT),Ce=new mt().fromArray(Le),De=new mt().fromArray(pe);function Ge(W,Ee,de,we){const Ie=new Uint8Array(4),xe=i.createTexture();i.bindTexture(W,xe),i.texParameteri(W,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(W,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let We=0;We<de;We++)W===i.TEXTURE_3D||W===i.TEXTURE_2D_ARRAY?i.texImage3D(Ee,0,i.RGBA,1,1,we,0,i.RGBA,i.UNSIGNED_BYTE,Ie):i.texImage2D(Ee+We,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Ie);return xe}const N={};N[i.TEXTURE_2D]=Ge(i.TEXTURE_2D,i.TEXTURE_2D,1),N[i.TEXTURE_CUBE_MAP]=Ge(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),N[i.TEXTURE_2D_ARRAY]=Ge(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),N[i.TEXTURE_3D]=Ge(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),D(i.DEPTH_TEST),a.setFunc(er),K(!1),Q(tl),D(i.CULL_FACE),k(mn);function D(W){u[W]!==!0&&(i.enable(W),u[W]=!0)}function L(W){u[W]!==!1&&(i.disable(W),u[W]=!1)}function C(W,Ee){return h[W]!==Ee?(i.bindFramebuffer(W,Ee),h[W]=Ee,W===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=Ee),W===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=Ee),!0):!1}function B(W,Ee){let de=g,we=!1;if(W){de=d.get(Ee),de===void 0&&(de=[],d.set(Ee,de));const Ie=W.textures;if(de.length!==Ie.length||de[0]!==i.COLOR_ATTACHMENT0){for(let xe=0,We=Ie.length;xe<We;xe++)de[xe]=i.COLOR_ATTACHMENT0+xe;de.length=Ie.length,we=!0}}else de[0]!==i.BACK&&(de[0]=i.BACK,we=!0);we&&i.drawBuffers(de)}function ne(W){return S!==W?(i.useProgram(W),S=W,!0):!1}const ge={[xi]:i.FUNC_ADD,[qu]:i.FUNC_SUBTRACT,[Yu]:i.FUNC_REVERSE_SUBTRACT};ge[Ku]=i.MIN,ge[Zu]=i.MAX;const R={[$u]:i.ZERO,[Ju]:i.ONE,[Qu]:i.SRC_COLOR,[rl]:i.SRC_ALPHA,[rh]:i.SRC_ALPHA_SATURATE,[nh]:i.DST_COLOR,[eh]:i.DST_ALPHA,[ju]:i.ONE_MINUS_SRC_COLOR,[sl]:i.ONE_MINUS_SRC_ALPHA,[ih]:i.ONE_MINUS_DST_COLOR,[th]:i.ONE_MINUS_DST_ALPHA,[sh]:i.CONSTANT_COLOR,[ah]:i.ONE_MINUS_CONSTANT_COLOR,[oh]:i.CONSTANT_ALPHA,[lh]:i.ONE_MINUS_CONSTANT_ALPHA};function k(W,Ee,de,we,Ie,xe,We,He,dt,at){if(W===mn){m===!0&&(L(i.BLEND),m=!1);return}if(m===!1&&(D(i.BLEND),m=!0),W!==Xu){if(W!==p||at!==U){if((w!==xi||b!==xi)&&(i.blendEquation(i.FUNC_ADD),w=xi,b=xi),at)switch(W){case Qi:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ji:i.blendFunc(i.ONE,i.ONE);break;case nl:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case il:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:nt("WebGLState: Invalid blending: ",W);break}else switch(W){case Qi:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case ji:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case nl:nt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case il:nt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:nt("WebGLState: Invalid blending: ",W);break}T=null,_=null,E=null,I=null,x.set(0,0,0),A=0,p=W,U=at}return}Ie=Ie||Ee,xe=xe||de,We=We||we,(Ee!==w||Ie!==b)&&(i.blendEquationSeparate(ge[Ee],ge[Ie]),w=Ee,b=Ie),(de!==T||we!==_||xe!==E||We!==I)&&(i.blendFuncSeparate(R[de],R[we],R[xe],R[We]),T=de,_=we,E=xe,I=We),(He.equals(x)===!1||dt!==A)&&(i.blendColor(He.r,He.g,He.b,dt),x.copy(He),A=dt),p=W,U=!1}function F(W,Ee){W.side===$t?L(i.CULL_FACE):D(i.CULL_FACE);let de=W.side===Ot;Ee&&(de=!de),K(de),W.blending===Qi&&W.transparent===!1?k(mn):k(W.blending,W.blendEquation,W.blendSrc,W.blendDst,W.blendEquationAlpha,W.blendSrcAlpha,W.blendDstAlpha,W.blendColor,W.blendAlpha,W.premultipliedAlpha),a.setFunc(W.depthFunc),a.setTest(W.depthTest),a.setMask(W.depthWrite),s.setMask(W.colorWrite);const we=W.stencilWrite;o.setTest(we),we&&(o.setMask(W.stencilWriteMask),o.setFunc(W.stencilFunc,W.stencilRef,W.stencilFuncMask),o.setOp(W.stencilFail,W.stencilZFail,W.stencilZPass)),ve(W.polygonOffset,W.polygonOffsetFactor,W.polygonOffsetUnits),W.alphaToCoverage===!0?D(i.SAMPLE_ALPHA_TO_COVERAGE):L(i.SAMPLE_ALPHA_TO_COVERAGE)}function K(W){G!==W&&(W?i.frontFace(i.CW):i.frontFace(i.CCW),G=W)}function Q(W){W!==Gu?(D(i.CULL_FACE),W!==z&&(W===tl?i.cullFace(i.BACK):W===Vu?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):L(i.CULL_FACE),z=W}function ce(W){W!==J&&($&&i.lineWidth(W),J=W)}function ve(W,Ee,de){W?(D(i.POLYGON_OFFSET_FILL),(H!==Ee||Y!==de)&&(H=Ee,Y=de,a.getReversed()&&(Ee=-Ee),i.polygonOffset(Ee,de))):L(i.POLYGON_OFFSET_FILL)}function me(W){W?D(i.SCISSOR_TEST):L(i.SCISSOR_TEST)}function q(W){W===void 0&&(W=i.TEXTURE0+re-1),se!==W&&(i.activeTexture(W),se=W)}function M(W,Ee,de){de===void 0&&(se===null?de=i.TEXTURE0+re-1:de=se);let we=he[de];we===void 0&&(we={type:void 0,texture:void 0},he[de]=we),(we.type!==W||we.texture!==Ee)&&(se!==de&&(i.activeTexture(de),se=de),i.bindTexture(W,Ee||N[W]),we.type=W,we.texture=Ee)}function Ae(){const W=he[se];W!==void 0&&W.type!==void 0&&(i.bindTexture(W.type,null),W.type=void 0,W.texture=void 0)}function Fe(){try{i.compressedTexImage2D(...arguments)}catch(W){nt("WebGLState:",W)}}function P(){try{i.compressedTexImage3D(...arguments)}catch(W){nt("WebGLState:",W)}}function v(){try{i.texSubImage2D(...arguments)}catch(W){nt("WebGLState:",W)}}function X(){try{i.texSubImage3D(...arguments)}catch(W){nt("WebGLState:",W)}}function j(){try{i.compressedTexSubImage2D(...arguments)}catch(W){nt("WebGLState:",W)}}function le(){try{i.compressedTexSubImage3D(...arguments)}catch(W){nt("WebGLState:",W)}}function _e(){try{i.texStorage2D(...arguments)}catch(W){nt("WebGLState:",W)}}function Me(){try{i.texStorage3D(...arguments)}catch(W){nt("WebGLState:",W)}}function ue(){try{i.texImage2D(...arguments)}catch(W){nt("WebGLState:",W)}}function fe(){try{i.texImage3D(...arguments)}catch(W){nt("WebGLState:",W)}}function Se(W){return f[W]!==void 0?f[W]:i.getParameter(W)}function ze(W,Ee){f[W]!==Ee&&(i.pixelStorei(W,Ee),f[W]=Ee)}function be(W){Ce.equals(W)===!1&&(i.scissor(W.x,W.y,W.z,W.w),Ce.copy(W))}function ye(W){De.equals(W)===!1&&(i.viewport(W.x,W.y,W.z,W.w),De.copy(W))}function Ve(W,Ee){let de=c.get(Ee);de===void 0&&(de=new WeakMap,c.set(Ee,de));let we=de.get(W);we===void 0&&(we=i.getUniformBlockIndex(Ee,W.name),de.set(W,we))}function qe(W,Ee){const we=c.get(Ee).get(W);l.get(Ee)!==we&&(i.uniformBlockBinding(Ee,we,W.__bindingPointIndex),l.set(Ee,we))}function Ze(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},f={},se=null,he={},h={},d=new WeakMap,g=[],S=null,m=!1,p=null,w=null,T=null,_=null,b=null,E=null,I=null,x=new Ke(0,0,0),A=0,U=!1,G=null,z=null,J=null,H=null,Y=null,Ce.set(0,0,i.canvas.width,i.canvas.height),De.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:D,disable:L,bindFramebuffer:C,drawBuffers:B,useProgram:ne,setBlending:k,setMaterial:F,setFlipSided:K,setCullFace:Q,setLineWidth:ce,setPolygonOffset:ve,setScissorTest:me,activeTexture:q,bindTexture:M,unbindTexture:Ae,compressedTexImage2D:Fe,compressedTexImage3D:P,texImage2D:ue,texImage3D:fe,pixelStorei:ze,getParameter:Se,updateUBOMapping:Ve,uniformBlockBinding:qe,texStorage2D:_e,texStorage3D:Me,texSubImage2D:v,texSubImage3D:X,compressedTexSubImage2D:j,compressedTexSubImage3D:le,scissor:be,viewport:ye,reset:Ze}}function dg(i,e,t,n,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ae,u=new WeakMap,f=new Set;let h;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(P,v){return g?new OffscreenCanvas(P,v):Jr("canvas")}function m(P,v,X){let j=1;const le=Fe(P);if((le.width>X||le.height>X)&&(j=X/Math.max(le.width,le.height)),j<1)if(typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&P instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&P instanceof ImageBitmap||typeof VideoFrame<"u"&&P instanceof VideoFrame){const _e=Math.floor(j*le.width),Me=Math.floor(j*le.height);h===void 0&&(h=S(_e,Me));const ue=v?S(_e,Me):h;return ue.width=_e,ue.height=Me,ue.getContext("2d").drawImage(P,0,0,_e,Me),Ye("WebGLRenderer: Texture has been resized from ("+le.width+"x"+le.height+") to ("+_e+"x"+Me+")."),ue}else return"data"in P&&Ye("WebGLRenderer: Image in DataTexture is too big ("+le.width+"x"+le.height+")."),P;return P}function p(P){return P.generateMipmaps}function w(P){i.generateMipmap(P)}function T(P){return P.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:P.isWebGL3DRenderTarget?i.TEXTURE_3D:P.isWebGLArrayRenderTarget||P.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function _(P,v,X,j,le,_e=!1){if(P!==null){if(i[P]!==void 0)return i[P];Ye("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+P+"'")}let Me;j&&(Me=e.get("EXT_texture_norm16"),Me||Ye("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ue=v;if(v===i.RED&&(X===i.FLOAT&&(ue=i.R32F),X===i.HALF_FLOAT&&(ue=i.R16F),X===i.UNSIGNED_BYTE&&(ue=i.R8),X===i.UNSIGNED_SHORT&&Me&&(ue=Me.R16_EXT),X===i.SHORT&&Me&&(ue=Me.R16_SNORM_EXT)),v===i.RED_INTEGER&&(X===i.UNSIGNED_BYTE&&(ue=i.R8UI),X===i.UNSIGNED_SHORT&&(ue=i.R16UI),X===i.UNSIGNED_INT&&(ue=i.R32UI),X===i.BYTE&&(ue=i.R8I),X===i.SHORT&&(ue=i.R16I),X===i.INT&&(ue=i.R32I)),v===i.RG&&(X===i.FLOAT&&(ue=i.RG32F),X===i.HALF_FLOAT&&(ue=i.RG16F),X===i.UNSIGNED_BYTE&&(ue=i.RG8),X===i.UNSIGNED_SHORT&&Me&&(ue=Me.RG16_EXT),X===i.SHORT&&Me&&(ue=Me.RG16_SNORM_EXT)),v===i.RG_INTEGER&&(X===i.UNSIGNED_BYTE&&(ue=i.RG8UI),X===i.UNSIGNED_SHORT&&(ue=i.RG16UI),X===i.UNSIGNED_INT&&(ue=i.RG32UI),X===i.BYTE&&(ue=i.RG8I),X===i.SHORT&&(ue=i.RG16I),X===i.INT&&(ue=i.RG32I)),v===i.RGB_INTEGER&&(X===i.UNSIGNED_BYTE&&(ue=i.RGB8UI),X===i.UNSIGNED_SHORT&&(ue=i.RGB16UI),X===i.UNSIGNED_INT&&(ue=i.RGB32UI),X===i.BYTE&&(ue=i.RGB8I),X===i.SHORT&&(ue=i.RGB16I),X===i.INT&&(ue=i.RGB32I)),v===i.RGBA_INTEGER&&(X===i.UNSIGNED_BYTE&&(ue=i.RGBA8UI),X===i.UNSIGNED_SHORT&&(ue=i.RGBA16UI),X===i.UNSIGNED_INT&&(ue=i.RGBA32UI),X===i.BYTE&&(ue=i.RGBA8I),X===i.SHORT&&(ue=i.RGBA16I),X===i.INT&&(ue=i.RGBA32I)),v===i.RGB&&(X===i.UNSIGNED_SHORT&&Me&&(ue=Me.RGB16_EXT),X===i.SHORT&&Me&&(ue=Me.RGB16_SNORM_EXT),X===i.UNSIGNED_INT_5_9_9_9_REV&&(ue=i.RGB9_E5),X===i.UNSIGNED_INT_10F_11F_11F_REV&&(ue=i.R11F_G11F_B10F)),v===i.RGBA){const fe=_e?Zr:tt.getTransfer(le);X===i.FLOAT&&(ue=i.RGBA32F),X===i.HALF_FLOAT&&(ue=i.RGBA16F),X===i.UNSIGNED_BYTE&&(ue=fe===lt?i.SRGB8_ALPHA8:i.RGBA8),X===i.UNSIGNED_SHORT&&Me&&(ue=Me.RGBA16_EXT),X===i.SHORT&&Me&&(ue=Me.RGBA16_SNORM_EXT),X===i.UNSIGNED_SHORT_4_4_4_4&&(ue=i.RGBA4),X===i.UNSIGNED_SHORT_5_5_5_1&&(ue=i.RGB5_A1)}return(ue===i.R16F||ue===i.R32F||ue===i.RG16F||ue===i.RG32F||ue===i.RGBA16F||ue===i.RGBA32F)&&e.get("EXT_color_buffer_float"),ue}function b(P,v){let X;return P?v===null||v===xn||v===nr?X=i.DEPTH24_STENCIL8:v===nn?X=i.DEPTH32F_STENCIL8:v===tr&&(X=i.DEPTH24_STENCIL8,Ye("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):v===null||v===xn||v===nr?X=i.DEPTH_COMPONENT24:v===nn?X=i.DEPTH_COMPONENT32F:v===tr&&(X=i.DEPTH_COMPONENT16),X}function E(P,v){return p(P)===!0||P.isFramebufferTexture&&P.minFilter!==Rt&&P.minFilter!==Tt?Math.log2(Math.max(v.width,v.height))+1:P.mipmaps!==void 0&&P.mipmaps.length>0?P.mipmaps.length:P.isCompressedTexture&&Array.isArray(P.image)?v.mipmaps.length:1}function I(P){const v=P.target;v.removeEventListener("dispose",I),A(v),v.isVideoTexture&&u.delete(v),v.isHTMLTexture&&f.delete(v)}function x(P){const v=P.target;v.removeEventListener("dispose",x),G(v)}function A(P){const v=n.get(P);if(v.__webglInit===void 0)return;const X=P.source,j=d.get(X);if(j){const le=j[v.__cacheKey];le.usedTimes--,le.usedTimes===0&&U(P),Object.keys(j).length===0&&d.delete(X)}n.remove(P)}function U(P){const v=n.get(P);i.deleteTexture(v.__webglTexture);const X=P.source,j=d.get(X);delete j[v.__cacheKey],a.memory.textures--}function G(P){const v=n.get(P);if(P.depthTexture&&(P.depthTexture.dispose(),n.remove(P.depthTexture)),P.isWebGLCubeRenderTarget)for(let j=0;j<6;j++){if(Array.isArray(v.__webglFramebuffer[j]))for(let le=0;le<v.__webglFramebuffer[j].length;le++)i.deleteFramebuffer(v.__webglFramebuffer[j][le]);else i.deleteFramebuffer(v.__webglFramebuffer[j]);v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer[j])}else{if(Array.isArray(v.__webglFramebuffer))for(let j=0;j<v.__webglFramebuffer.length;j++)i.deleteFramebuffer(v.__webglFramebuffer[j]);else i.deleteFramebuffer(v.__webglFramebuffer);if(v.__webglDepthbuffer&&i.deleteRenderbuffer(v.__webglDepthbuffer),v.__webglMultisampledFramebuffer&&i.deleteFramebuffer(v.__webglMultisampledFramebuffer),v.__webglColorRenderbuffer)for(let j=0;j<v.__webglColorRenderbuffer.length;j++)v.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(v.__webglColorRenderbuffer[j]);v.__webglDepthRenderbuffer&&i.deleteRenderbuffer(v.__webglDepthRenderbuffer)}const X=P.textures;for(let j=0,le=X.length;j<le;j++){const _e=n.get(X[j]);_e.__webglTexture&&(i.deleteTexture(_e.__webglTexture),a.memory.textures--),n.remove(X[j])}n.remove(P)}let z=0;function J(){z=0}function H(){return z}function Y(P){z=P}function re(){const P=z;return P>=r.maxTextures&&Ye("WebGLTextures: Trying to use "+(P+1)+" texture units while this GPU supports only "+r.maxTextures),z+=1,P}function $(P){const v=[];return v.push(P.wrapS),v.push(P.wrapT),v.push(P.wrapR||0),v.push(P.magFilter),v.push(P.minFilter),v.push(P.anisotropy),v.push(P.internalFormat),v.push(P.format),v.push(P.type),v.push(P.generateMipmaps),v.push(P.premultiplyAlpha),v.push(P.flipY),v.push(P.unpackAlignment),v.push(P.colorSpace),v.join()}function Z(P,v){const X=n.get(P);if(P.isVideoTexture&&M(P),P.isRenderTargetTexture===!1&&P.isExternalTexture!==!0&&P.version>0&&X.__version!==P.version){const j=P.image;if(j===null)Ye("WebGLRenderer: Texture marked for update but no image data found.");else if(j.complete===!1)Ye("WebGLRenderer: Texture marked for update but image is incomplete");else{L(X,P,v);return}}else P.isExternalTexture&&(X.__webglTexture=P.sourceTexture?P.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,X.__webglTexture,i.TEXTURE0+v)}function ie(P,v){const X=n.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&X.__version!==P.version){L(X,P,v);return}else P.isExternalTexture&&(X.__webglTexture=P.sourceTexture?P.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,X.__webglTexture,i.TEXTURE0+v)}function se(P,v){const X=n.get(P);if(P.isRenderTargetTexture===!1&&P.version>0&&X.__version!==P.version){L(X,P,v);return}t.bindTexture(i.TEXTURE_3D,X.__webglTexture,i.TEXTURE0+v)}function he(P,v){const X=n.get(P);if(P.isCubeDepthTexture!==!0&&P.version>0&&X.__version!==P.version){C(X,P,v);return}t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture,i.TEXTURE0+v)}const Le={[Br]:i.REPEAT,[vn]:i.CLAMP_TO_EDGE,[zr]:i.MIRRORED_REPEAT},pe={[Rt]:i.NEAREST,[hh]:i.NEAREST_MIPMAP_NEAREST,[Hr]:i.NEAREST_MIPMAP_LINEAR,[Tt]:i.LINEAR,[ea]:i.LINEAR_MIPMAP_NEAREST,[Fn]:i.LINEAR_MIPMAP_LINEAR},Ce={[mh]:i.NEVER,[Mh]:i.ALWAYS,[gh]:i.LESS,[Ba]:i.LEQUAL,[vh]:i.EQUAL,[za]:i.GEQUAL,[xh]:i.GREATER,[_h]:i.NOTEQUAL};function De(P,v){if(v.type===nn&&e.has("OES_texture_float_linear")===!1&&(v.magFilter===Tt||v.magFilter===ea||v.magFilter===Hr||v.magFilter===Fn||v.minFilter===Tt||v.minFilter===ea||v.minFilter===Hr||v.minFilter===Fn)&&Ye("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(P,i.TEXTURE_WRAP_S,Le[v.wrapS]),i.texParameteri(P,i.TEXTURE_WRAP_T,Le[v.wrapT]),(P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY)&&i.texParameteri(P,i.TEXTURE_WRAP_R,Le[v.wrapR]),i.texParameteri(P,i.TEXTURE_MAG_FILTER,pe[v.magFilter]),i.texParameteri(P,i.TEXTURE_MIN_FILTER,pe[v.minFilter]),v.compareFunction&&(i.texParameteri(P,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(P,i.TEXTURE_COMPARE_FUNC,Ce[v.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(v.magFilter===Rt||v.minFilter!==Hr&&v.minFilter!==Fn||v.type===nn&&e.has("OES_texture_float_linear")===!1)return;if(v.anisotropy>1||n.get(v).__currentAnisotropy){const X=e.get("EXT_texture_filter_anisotropic");i.texParameterf(P,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(v.anisotropy,r.getMaxAnisotropy())),n.get(v).__currentAnisotropy=v.anisotropy}}}function Ge(P,v){let X=!1;P.__webglInit===void 0&&(P.__webglInit=!0,v.addEventListener("dispose",I));const j=v.source;let le=d.get(j);le===void 0&&(le={},d.set(j,le));const _e=$(v);if(_e!==P.__cacheKey){le[_e]===void 0&&(le[_e]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,X=!0),le[_e].usedTimes++;const Me=le[P.__cacheKey];Me!==void 0&&(le[P.__cacheKey].usedTimes--,Me.usedTimes===0&&U(v)),P.__cacheKey=_e,P.__webglTexture=le[_e].texture}return X}function N(P,v,X){return Math.floor(Math.floor(P/X)/v)}function D(P,v,X,j){const _e=P.updateRanges;if(_e.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,v.width,v.height,X,j,v.data);else{_e.sort((ze,be)=>ze.start-be.start);let Me=0;for(let ze=1;ze<_e.length;ze++){const be=_e[Me],ye=_e[ze],Ve=be.start+be.count,qe=N(ye.start,v.width,4),Ze=N(be.start,v.width,4);ye.start<=Ve+1&&qe===Ze&&N(ye.start+ye.count-1,v.width,4)===qe?be.count=Math.max(be.count,ye.start+ye.count-be.start):(++Me,_e[Me]=ye)}_e.length=Me+1;const ue=t.getParameter(i.UNPACK_ROW_LENGTH),fe=t.getParameter(i.UNPACK_SKIP_PIXELS),Se=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,v.width);for(let ze=0,be=_e.length;ze<be;ze++){const ye=_e[ze],Ve=Math.floor(ye.start/4),qe=Math.ceil(ye.count/4),Ze=Ve%v.width,W=Math.floor(Ve/v.width),Ee=qe,de=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,Ze),t.pixelStorei(i.UNPACK_SKIP_ROWS,W),t.texSubImage2D(i.TEXTURE_2D,0,Ze,W,Ee,de,X,j,v.data)}P.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,ue),t.pixelStorei(i.UNPACK_SKIP_PIXELS,fe),t.pixelStorei(i.UNPACK_SKIP_ROWS,Se)}}function L(P,v,X){let j=i.TEXTURE_2D;(v.isDataArrayTexture||v.isCompressedArrayTexture)&&(j=i.TEXTURE_2D_ARRAY),v.isData3DTexture&&(j=i.TEXTURE_3D);const le=Ge(P,v),_e=v.source;t.bindTexture(j,P.__webglTexture,i.TEXTURE0+X);const Me=n.get(_e);if(_e.version!==Me.__version||le===!0){if(t.activeTexture(i.TEXTURE0+X),(typeof ImageBitmap<"u"&&v.image instanceof ImageBitmap)===!1){const de=tt.getPrimaries(tt.workingColorSpace),we=v.colorSpace===On?null:tt.getPrimaries(v.colorSpace),Ie=v.colorSpace===On||de===we?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ie)}t.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment);let fe=m(v.image,!1,r.maxTextureSize);fe=Ae(v,fe);const Se=s.convert(v.format,v.colorSpace),ze=s.convert(v.type);let be=_(v.internalFormat,Se,ze,v.normalized,v.colorSpace,v.isVideoTexture);De(j,v);let ye;const Ve=v.mipmaps,qe=v.isVideoTexture!==!0,Ze=Me.__version===void 0||le===!0,W=_e.dataReady,Ee=E(v,fe);if(v.isDepthTexture)be=b(v.format===ei,v.type),Ze&&(qe?t.texStorage2D(i.TEXTURE_2D,1,be,fe.width,fe.height):t.texImage2D(i.TEXTURE_2D,0,be,fe.width,fe.height,0,Se,ze,null));else if(v.isDataTexture)if(Ve.length>0){qe&&Ze&&t.texStorage2D(i.TEXTURE_2D,Ee,be,Ve[0].width,Ve[0].height);for(let de=0,we=Ve.length;de<we;de++)ye=Ve[de],qe?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,ye.width,ye.height,Se,ze,ye.data):t.texImage2D(i.TEXTURE_2D,de,be,ye.width,ye.height,0,Se,ze,ye.data);v.generateMipmaps=!1}else qe?(Ze&&t.texStorage2D(i.TEXTURE_2D,Ee,be,fe.width,fe.height),W&&D(v,fe,Se,ze)):t.texImage2D(i.TEXTURE_2D,0,be,fe.width,fe.height,0,Se,ze,fe.data);else if(v.isCompressedTexture)if(v.isCompressedArrayTexture){qe&&Ze&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ee,be,Ve[0].width,Ve[0].height,fe.depth);for(let de=0,we=Ve.length;de<we;de++)if(ye=Ve[de],v.format!==rn)if(Se!==null)if(qe){if(W)if(v.layerUpdates.size>0){const Ie=bc(ye.width,ye.height,v.format,v.type);for(const xe of v.layerUpdates){const We=ye.data.subarray(xe*Ie/ye.data.BYTES_PER_ELEMENT,(xe+1)*Ie/ye.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,xe,ye.width,ye.height,1,Se,We)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,0,ye.width,ye.height,fe.depth,Se,ye.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,de,be,ye.width,ye.height,fe.depth,0,ye.data,0,0);else Ye("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else qe?W&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,de,0,0,0,ye.width,ye.height,fe.depth,Se,ze,ye.data):t.texImage3D(i.TEXTURE_2D_ARRAY,de,be,ye.width,ye.height,fe.depth,0,Se,ze,ye.data);v.layerUpdates.size>0&&v.clearLayerUpdates()}else{qe&&Ze&&t.texStorage2D(i.TEXTURE_2D,Ee,be,Ve[0].width,Ve[0].height);for(let de=0,we=Ve.length;de<we;de++)ye=Ve[de],v.format!==rn?Se!==null?qe?W&&t.compressedTexSubImage2D(i.TEXTURE_2D,de,0,0,ye.width,ye.height,Se,ye.data):t.compressedTexImage2D(i.TEXTURE_2D,de,be,ye.width,ye.height,0,ye.data):Ye("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):qe?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,ye.width,ye.height,Se,ze,ye.data):t.texImage2D(i.TEXTURE_2D,de,be,ye.width,ye.height,0,Se,ze,ye.data)}else if(v.isDataArrayTexture)if(qe){if(Ze&&t.texStorage3D(i.TEXTURE_2D_ARRAY,Ee,be,fe.width,fe.height,fe.depth),W)if(v.layerUpdates.size>0){const de=bc(fe.width,fe.height,v.format,v.type);for(const we of v.layerUpdates){const Ie=fe.data.subarray(we*de/fe.data.BYTES_PER_ELEMENT,(we+1)*de/fe.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,we,fe.width,fe.height,1,Se,ze,Ie)}v.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,fe.width,fe.height,fe.depth,Se,ze,fe.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,be,fe.width,fe.height,fe.depth,0,Se,ze,fe.data);else if(v.isData3DTexture)qe?(Ze&&t.texStorage3D(i.TEXTURE_3D,Ee,be,fe.width,fe.height,fe.depth),W&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,fe.width,fe.height,fe.depth,Se,ze,fe.data)):t.texImage3D(i.TEXTURE_3D,0,be,fe.width,fe.height,fe.depth,0,Se,ze,fe.data);else if(v.isFramebufferTexture){if(Ze)if(qe)t.texStorage2D(i.TEXTURE_2D,Ee,be,fe.width,fe.height);else{let de=fe.width,we=fe.height;for(let Ie=0;Ie<Ee;Ie++)t.texImage2D(i.TEXTURE_2D,Ie,be,de,we,0,Se,ze,null),de>>=1,we>>=1}}else if(v.isHTMLTexture){if("texElementImage2D"in i){const de=i.canvas;if(de.hasAttribute("layoutsubtree")||de.setAttribute("layoutsubtree","true"),fe.parentNode!==de){de.appendChild(fe),f.add(v),de.onpaint=we=>{const Ie=we.changedElements;for(const xe of f)Ie.includes(xe.image)&&(xe.needsUpdate=!0)},de.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,fe);else{const Ie=i.RGBA,xe=i.RGBA,We=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Ie,xe,We,fe)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Ve.length>0){if(qe&&Ze){const de=Fe(Ve[0]);t.texStorage2D(i.TEXTURE_2D,Ee,be,de.width,de.height)}for(let de=0,we=Ve.length;de<we;de++)ye=Ve[de],qe?W&&t.texSubImage2D(i.TEXTURE_2D,de,0,0,Se,ze,ye):t.texImage2D(i.TEXTURE_2D,de,be,Se,ze,ye);v.generateMipmaps=!1}else if(qe){if(Ze){const de=Fe(fe);t.texStorage2D(i.TEXTURE_2D,Ee,be,de.width,de.height)}W&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Se,ze,fe)}else t.texImage2D(i.TEXTURE_2D,0,be,Se,ze,fe);p(v)&&w(j),Me.__version=_e.version,v.onUpdate&&v.onUpdate(v)}P.__version=v.version}function C(P,v,X){if(v.image.length!==6)return;const j=Ge(P,v),le=v.source;t.bindTexture(i.TEXTURE_CUBE_MAP,P.__webglTexture,i.TEXTURE0+X);const _e=n.get(le);if(le.version!==_e.__version||j===!0){t.activeTexture(i.TEXTURE0+X);const Me=tt.getPrimaries(tt.workingColorSpace),ue=v.colorSpace===On?null:tt.getPrimaries(v.colorSpace),fe=v.colorSpace===On||Me===ue?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,v.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,v.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);const Se=v.isCompressedTexture||v.image[0].isCompressedTexture,ze=v.image[0]&&v.image[0].isDataTexture,be=[];for(let xe=0;xe<6;xe++)!Se&&!ze?be[xe]=m(v.image[xe],!0,r.maxCubemapSize):be[xe]=ze?v.image[xe].image:v.image[xe],be[xe]=Ae(v,be[xe]);const ye=be[0],Ve=s.convert(v.format,v.colorSpace),qe=s.convert(v.type),Ze=_(v.internalFormat,Ve,qe,v.normalized,v.colorSpace),W=v.isVideoTexture!==!0,Ee=_e.__version===void 0||j===!0,de=le.dataReady;let we=E(v,ye);De(i.TEXTURE_CUBE_MAP,v);let Ie;if(Se){W&&Ee&&t.texStorage2D(i.TEXTURE_CUBE_MAP,we,Ze,ye.width,ye.height);for(let xe=0;xe<6;xe++){Ie=be[xe].mipmaps;for(let We=0;We<Ie.length;We++){const He=Ie[We];v.format!==rn?Ve!==null?W?de&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We,0,0,He.width,He.height,Ve,He.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We,Ze,He.width,He.height,0,He.data):Ye("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We,0,0,He.width,He.height,Ve,qe,He.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We,Ze,He.width,He.height,0,Ve,qe,He.data)}}}else{if(Ie=v.mipmaps,W&&Ee){Ie.length>0&&we++;const xe=Fe(be[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,we,Ze,xe.width,xe.height)}for(let xe=0;xe<6;xe++)if(ze){W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,0,0,be[xe].width,be[xe].height,Ve,qe,be[xe].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,Ze,be[xe].width,be[xe].height,0,Ve,qe,be[xe].data);for(let We=0;We<Ie.length;We++){const dt=Ie[We].image[xe].image;W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We+1,0,0,dt.width,dt.height,Ve,qe,dt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We+1,Ze,dt.width,dt.height,0,Ve,qe,dt.data)}}else{W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,0,0,Ve,qe,be[xe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,Ze,Ve,qe,be[xe]);for(let We=0;We<Ie.length;We++){const He=Ie[We];W?de&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We+1,0,0,Ve,qe,He.image[xe]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+xe,We+1,Ze,Ve,qe,He.image[xe])}}}p(v)&&w(i.TEXTURE_CUBE_MAP),_e.__version=le.version,v.onUpdate&&v.onUpdate(v)}P.__version=v.version}function B(P,v,X,j,le,_e){const Me=s.convert(X.format,X.colorSpace),ue=s.convert(X.type),fe=_(X.internalFormat,Me,ue,X.normalized,X.colorSpace),Se=n.get(v),ze=n.get(X);if(ze.__renderTarget=v,!Se.__hasExternalTextures){const be=Math.max(1,v.width>>_e),ye=Math.max(1,v.height>>_e);le===i.TEXTURE_3D||le===i.TEXTURE_2D_ARRAY?t.texImage3D(le,_e,fe,be,ye,v.depth,0,Me,ue,null):t.texImage2D(le,_e,fe,be,ye,0,Me,ue,null)}t.bindFramebuffer(i.FRAMEBUFFER,P),q(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,j,le,ze.__webglTexture,0,me(v)):(le===i.TEXTURE_2D||le>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&le<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,j,le,ze.__webglTexture,_e),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ne(P,v,X){if(i.bindRenderbuffer(i.RENDERBUFFER,P),v.depthBuffer){const j=v.depthTexture,le=j&&j.isDepthTexture?j.type:null,_e=b(v.stencilBuffer,le),Me=v.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;q(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,me(v),_e,v.width,v.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,me(v),_e,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,_e,v.width,v.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,Me,i.RENDERBUFFER,P)}else{const j=v.textures;for(let le=0;le<j.length;le++){const _e=j[le],Me=s.convert(_e.format,_e.colorSpace),ue=s.convert(_e.type),fe=_(_e.internalFormat,Me,ue,_e.normalized,_e.colorSpace);q(v)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,me(v),fe,v.width,v.height):X?i.renderbufferStorageMultisample(i.RENDERBUFFER,me(v),fe,v.width,v.height):i.renderbufferStorage(i.RENDERBUFFER,fe,v.width,v.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ge(P,v,X){const j=v.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,P),!(v.depthTexture&&v.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const le=n.get(v.depthTexture);if(le.__renderTarget=v,(!le.__webglTexture||v.depthTexture.image.width!==v.width||v.depthTexture.image.height!==v.height)&&(v.depthTexture.image.width=v.width,v.depthTexture.image.height=v.height,v.depthTexture.needsUpdate=!0),j){if(le.__webglInit===void 0&&(le.__webglInit=!0,v.depthTexture.addEventListener("dispose",I)),le.__webglTexture===void 0){le.__webglTexture=i.createTexture(),t.bindTexture(i.TEXTURE_CUBE_MAP,le.__webglTexture),De(i.TEXTURE_CUBE_MAP,v.depthTexture);const Se=s.convert(v.depthTexture.format),ze=s.convert(v.depthTexture.type);let be;v.depthTexture.format===An?be=i.DEPTH_COMPONENT24:v.depthTexture.format===ei&&(be=i.DEPTH24_STENCIL8);for(let ye=0;ye<6;ye++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ye,0,be,v.width,v.height,0,Se,ze,null)}}else Z(v.depthTexture,0);const _e=le.__webglTexture,Me=me(v),ue=j?i.TEXTURE_CUBE_MAP_POSITIVE_X+X:i.TEXTURE_2D,fe=v.depthTexture.format===ei?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(v.depthTexture.format===An)q(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,fe,ue,_e,0,Me):i.framebufferTexture2D(i.FRAMEBUFFER,fe,ue,_e,0);else if(v.depthTexture.format===ei)q(v)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,fe,ue,_e,0,Me):i.framebufferTexture2D(i.FRAMEBUFFER,fe,ue,_e,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function R(P){const v=n.get(P),X=P.isWebGLCubeRenderTarget===!0;if(v.__boundDepthTexture!==P.depthTexture){const j=P.depthTexture;if(v.__depthDisposeCallback&&v.__depthDisposeCallback(),j){const le=()=>{delete v.__boundDepthTexture,delete v.__depthDisposeCallback,j.removeEventListener("dispose",le)};j.addEventListener("dispose",le),v.__depthDisposeCallback=le}v.__boundDepthTexture=j}if(P.depthTexture&&!v.__autoAllocateDepthBuffer)if(X)for(let j=0;j<6;j++)ge(v.__webglFramebuffer[j],P,j);else{const j=P.texture.mipmaps;j&&j.length>0?ge(v.__webglFramebuffer[0],P,0):ge(v.__webglFramebuffer,P,0)}else if(X){v.__webglDepthbuffer=[];for(let j=0;j<6;j++)if(t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[j]),v.__webglDepthbuffer[j]===void 0)v.__webglDepthbuffer[j]=i.createRenderbuffer(),ne(v.__webglDepthbuffer[j],P,!1);else{const le=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,_e=v.__webglDepthbuffer[j];i.bindRenderbuffer(i.RENDERBUFFER,_e),i.framebufferRenderbuffer(i.FRAMEBUFFER,le,i.RENDERBUFFER,_e)}}else{const j=P.texture.mipmaps;if(j&&j.length>0?t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,v.__webglFramebuffer),v.__webglDepthbuffer===void 0)v.__webglDepthbuffer=i.createRenderbuffer(),ne(v.__webglDepthbuffer,P,!1);else{const le=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,_e=v.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,_e),i.framebufferRenderbuffer(i.FRAMEBUFFER,le,i.RENDERBUFFER,_e)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function k(P,v,X){const j=n.get(P);v!==void 0&&B(j.__webglFramebuffer,P,P.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),X!==void 0&&R(P)}function F(P){const v=P.texture,X=n.get(P),j=n.get(v);P.addEventListener("dispose",x);const le=P.textures,_e=P.isWebGLCubeRenderTarget===!0,Me=le.length>1;if(Me||(j.__webglTexture===void 0&&(j.__webglTexture=i.createTexture()),j.__version=v.version,a.memory.textures++),_e){X.__webglFramebuffer=[];for(let ue=0;ue<6;ue++)if(v.mipmaps&&v.mipmaps.length>0){X.__webglFramebuffer[ue]=[];for(let fe=0;fe<v.mipmaps.length;fe++)X.__webglFramebuffer[ue][fe]=i.createFramebuffer()}else X.__webglFramebuffer[ue]=i.createFramebuffer()}else{if(v.mipmaps&&v.mipmaps.length>0){X.__webglFramebuffer=[];for(let ue=0;ue<v.mipmaps.length;ue++)X.__webglFramebuffer[ue]=i.createFramebuffer()}else X.__webglFramebuffer=i.createFramebuffer();if(Me)for(let ue=0,fe=le.length;ue<fe;ue++){const Se=n.get(le[ue]);Se.__webglTexture===void 0&&(Se.__webglTexture=i.createTexture(),a.memory.textures++)}if(P.samples>0&&q(P)===!1){X.__webglMultisampledFramebuffer=i.createFramebuffer(),X.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,X.__webglMultisampledFramebuffer);for(let ue=0;ue<le.length;ue++){const fe=le[ue];X.__webglColorRenderbuffer[ue]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,X.__webglColorRenderbuffer[ue]);const Se=s.convert(fe.format,fe.colorSpace),ze=s.convert(fe.type),be=_(fe.internalFormat,Se,ze,fe.normalized,fe.colorSpace,P.isXRRenderTarget===!0),ye=me(P);i.renderbufferStorageMultisample(i.RENDERBUFFER,ye,be,P.width,P.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ue,i.RENDERBUFFER,X.__webglColorRenderbuffer[ue])}i.bindRenderbuffer(i.RENDERBUFFER,null),P.depthBuffer&&(X.__webglDepthRenderbuffer=i.createRenderbuffer(),ne(X.__webglDepthRenderbuffer,P,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(_e){t.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture),De(i.TEXTURE_CUBE_MAP,v);for(let ue=0;ue<6;ue++)if(v.mipmaps&&v.mipmaps.length>0)for(let fe=0;fe<v.mipmaps.length;fe++)B(X.__webglFramebuffer[ue][fe],P,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,fe);else B(X.__webglFramebuffer[ue],P,v,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ue,0);p(v)&&w(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Me){for(let ue=0,fe=le.length;ue<fe;ue++){const Se=le[ue],ze=n.get(Se);let be=i.TEXTURE_2D;(P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(be=P.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(be,ze.__webglTexture),De(be,Se),B(X.__webglFramebuffer,P,Se,i.COLOR_ATTACHMENT0+ue,be,0),p(Se)&&w(be)}t.unbindTexture()}else{let ue=i.TEXTURE_2D;if((P.isWebGL3DRenderTarget||P.isWebGLArrayRenderTarget)&&(ue=P.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ue,j.__webglTexture),De(ue,v),v.mipmaps&&v.mipmaps.length>0)for(let fe=0;fe<v.mipmaps.length;fe++)B(X.__webglFramebuffer[fe],P,v,i.COLOR_ATTACHMENT0,ue,fe);else B(X.__webglFramebuffer,P,v,i.COLOR_ATTACHMENT0,ue,0);p(v)&&w(ue),t.unbindTexture()}P.depthBuffer&&R(P)}function K(P){const v=P.textures;for(let X=0,j=v.length;X<j;X++){const le=v[X];if(p(le)){const _e=T(P),Me=n.get(le).__webglTexture;t.bindTexture(_e,Me),w(_e),t.unbindTexture()}}}const Q=[],ce=[];function ve(P){if(P.samples>0){if(q(P)===!1){const v=P.textures,X=P.width,j=P.height;let le=i.COLOR_BUFFER_BIT;const _e=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Me=n.get(P),ue=v.length>1;if(ue)for(let Se=0;Se<v.length;Se++)t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,Me.__webglMultisampledFramebuffer);const fe=P.texture.mipmaps;fe&&fe.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglFramebuffer);for(let Se=0;Se<v.length;Se++){if(P.resolveDepthBuffer&&(P.depthBuffer&&(le|=i.DEPTH_BUFFER_BIT),P.stencilBuffer&&P.resolveStencilBuffer&&(le|=i.STENCIL_BUFFER_BIT)),ue){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Me.__webglColorRenderbuffer[Se]);const ze=n.get(v[Se]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,ze,0)}i.blitFramebuffer(0,0,X,j,0,0,X,j,le,i.NEAREST),l===!0&&(Q.length=0,ce.length=0,Q.push(i.COLOR_ATTACHMENT0+Se),P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&(Q.push(_e),ce.push(_e),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,ce)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Q))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ue)for(let Se=0;Se<v.length;Se++){t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.RENDERBUFFER,Me.__webglColorRenderbuffer[Se]);const ze=n.get(v[Se]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,Me.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+Se,i.TEXTURE_2D,ze,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,Me.__webglMultisampledFramebuffer)}else if(P.depthBuffer&&P.storeMultisampledDepthBuffer===!1&&l){const v=P.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[v])}}}function me(P){return Math.min(r.maxSamples,P.samples)}function q(P){const v=n.get(P);return P.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&v.__useRenderToTexture!==!1}function M(P){const v=a.render.frame;u.get(P)!==v&&(u.set(P,v),P.update())}function Ae(P,v){const X=P.colorSpace,j=P.format,le=P.type;return P.isCompressedTexture===!0||P.isVideoTexture===!0||X!==Kr&&X!==On&&(tt.getTransfer(X)===lt?(j!==rn||le!==Vt)&&Ye("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):nt("WebGLTextures: Unsupported texture color space:",X)),v}function Fe(P){return typeof HTMLImageElement<"u"&&P instanceof HTMLImageElement?(c.width=P.naturalWidth||P.width,c.height=P.naturalHeight||P.height):typeof VideoFrame<"u"&&P instanceof VideoFrame?(c.width=P.displayWidth,c.height=P.displayHeight):(c.width=P.width,c.height=P.height),c}this.allocateTextureUnit=re,this.resetTextureUnits=J,this.getTextureUnits=H,this.setTextureUnits=Y,this.setTexture2D=Z,this.setTexture2DArray=ie,this.setTexture3D=se,this.setTextureCube=he,this.rebindTextures=k,this.setupRenderTarget=F,this.updateRenderTargetMipmap=K,this.updateMultisampleRenderTarget=ve,this.setupDepthRenderbuffer=R,this.setupFrameBufferTexture=B,this.useMultisampledRTT=q,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function pg(i,e){function t(n,r=On){let s;const a=tt.getTransfer(r);if(n===Vt)return i.UNSIGNED_BYTE;if(n===na)return i.UNSIGNED_SHORT_4_4_4_4;if(n===ia)return i.UNSIGNED_SHORT_5_5_5_1;if(n===vl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===xl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===ml)return i.BYTE;if(n===gl)return i.SHORT;if(n===tr)return i.UNSIGNED_SHORT;if(n===ta)return i.INT;if(n===xn)return i.UNSIGNED_INT;if(n===nn)return i.FLOAT;if(n===Lt)return i.HALF_FLOAT;if(n===_l)return i.ALPHA;if(n===Ml)return i.RGB;if(n===rn)return i.RGBA;if(n===An)return i.DEPTH_COMPONENT;if(n===ei)return i.DEPTH_STENCIL;if(n===kr)return i.RED;if(n===ra)return i.RED_INTEGER;if(n===ti)return i.RG;if(n===sa)return i.RG_INTEGER;if(n===aa)return i.RGBA_INTEGER;if(n===Gr||n===Vr||n===Wr||n===Xr)if(a===lt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Gr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Vr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Wr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Xr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Gr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Vr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Wr)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Xr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===oa||n===la||n===ca||n===ua)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===oa)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===la)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ca)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ua)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===ha||n===fa||n===da||n===pa||n===ma||n===qr||n===ga)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===ha||n===fa)return a===lt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===da)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===pa)return s.COMPRESSED_R11_EAC;if(n===ma)return s.COMPRESSED_SIGNED_R11_EAC;if(n===qr)return s.COMPRESSED_RG11_EAC;if(n===ga)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===va||n===xa||n===_a||n===Ma||n===Sa||n===ya||n===ba||n===Ea||n===wa||n===Ta||n===Aa||n===Ra||n===Ca||n===Pa)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===va)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===xa)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===_a)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ma)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Sa)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===ya)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ba)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ea)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===wa)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Ta)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Aa)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ra)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Ca)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Pa)return a===lt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===La||n===Ia||n===Da)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===La)return a===lt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Ia)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===Da)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Na||n===Ua||n===Yr||n===Fa)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Na)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Ua)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Yr)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Fa)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===nr?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const mg=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,gg=`
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

}`;class vg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new $l(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new _t({vertexShader:mg,fragmentShader:gg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new st(new Fi(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class xg extends ni{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",l=1,c=null,u=null,f=null,h=null,d=null,g=null;const S=typeof XRWebGLBinding<"u",m=new vg,p={},w=t.getContextAttributes();let T=null,_=null;const b=[],E=[],I=new ae;let x=null,A=null;const U=new Kt;U.viewport=new mt;const G=new Kt;G.viewport=new mt;const z=[U,G],J=new rd;let H=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(N){let D=b[N];return D===void 0&&(D=new Ya,b[N]=D),D.getTargetRaySpace()},this.getControllerGrip=function(N){let D=b[N];return D===void 0&&(D=new Ya,b[N]=D),D.getGripSpace()},this.getHand=function(N){let D=b[N];return D===void 0&&(D=new Ya,b[N]=D),D.getHandSpace()};function re(N){const D=E.indexOf(N.inputSource);if(D===-1)return;const L=b[D];L!==void 0&&(L.update(N.inputSource,N.frame,c||a),L.dispatchEvent({type:N.type,data:N.inputSource}))}function $(){r.removeEventListener("select",re),r.removeEventListener("selectstart",re),r.removeEventListener("selectend",re),r.removeEventListener("squeeze",re),r.removeEventListener("squeezestart",re),r.removeEventListener("squeezeend",re),r.removeEventListener("end",$),r.removeEventListener("inputsourceschange",Z);for(let N=0;N<b.length;N++){const D=E[N];D!==null&&(E[N]=null,b[N].disconnect(D))}H=null,Y=null,m.reset();for(const N in p)delete p[N];if(e.setRenderTarget(T),d=null,h=null,f=null,r=null,_=null,Ge.stop(),n.isPresenting=!1,e.setPixelRatio(x),e.setSize(I.width,I.height,!1),A!==null){const N=A.camera;N.fov=A.fov,N.zoom=A.zoom,N.updateProjectionMatrix(),A=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(N){s=N,n.isPresenting===!0&&Ye("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(N){o=N,n.isPresenting===!0&&Ye("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(N){c=N},this.getBaseLayer=function(){return h!==null?h:d},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return g},this.getSession=function(){return r},this.setSession=async function(N){if(r=N,r!==null){if(T=e.getRenderTarget(),r.addEventListener("select",re),r.addEventListener("selectstart",re),r.addEventListener("selectend",re),r.addEventListener("squeeze",re),r.addEventListener("squeezestart",re),r.addEventListener("squeezeend",re),r.addEventListener("end",$),r.addEventListener("inputsourceschange",Z),w.xrCompatible!==!0&&await t.makeXRCompatible(),x=e.getPixelRatio(),e.getSize(I),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let L=null,C=null,B=null;w.depth&&(B=w.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,L=w.stencil?ei:An,C=w.stencil?nr:xn);const ne={colorFormat:t.RGBA8,depthFormat:B,scaleFactor:s};f=this.getBinding(),h=f.createProjectionLayer(ne),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),_=new Ct(h.textureWidth,h.textureHeight,{format:rn,type:Vt,depthTexture:new mr(h.textureWidth,h.textureHeight,C,void 0,void 0,void 0,void 0,void 0,void 0,L),stencilBuffer:w.stencil,colorSpace:e.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{const L={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:s};d=new XRWebGLLayer(r,t,L),r.updateRenderState({baseLayer:d}),e.setPixelRatio(1),e.setSize(d.framebufferWidth,d.framebufferHeight,!1),_=new Ct(d.framebufferWidth,d.framebufferHeight,{format:rn,type:Vt,colorSpace:e.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await r.requestReferenceSpace(o),Ge.setContext(r),Ge.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Z(N){for(let D=0;D<N.removed.length;D++){const L=N.removed[D],C=E.indexOf(L);C>=0&&(E[C]=null,b[C].disconnect(L))}for(let D=0;D<N.added.length;D++){const L=N.added[D];let C=E.indexOf(L);if(C===-1){for(let ne=0;ne<b.length;ne++)if(ne>=E.length){E.push(L),C=ne;break}else if(E[ne]===null){E[ne]=L,C=ne;break}if(C===-1)break}const B=b[C];B&&B.connect(L)}}const ie=new O,se=new O;function he(N,D,L){ie.setFromMatrixPosition(D.matrixWorld),se.setFromMatrixPosition(L.matrixWorld);const C=ie.distanceTo(se),B=D.projectionMatrix.elements,ne=L.projectionMatrix.elements,ge=B[14]/(B[10]-1),R=B[14]/(B[10]+1),k=(B[9]+1)/B[5],F=(B[9]-1)/B[5],K=(B[8]-1)/B[0],Q=(ne[8]+1)/ne[0],ce=ge*K,ve=ge*Q,me=C/(-K+Q),q=me*-K;if(D.matrixWorld.decompose(N.position,N.quaternion,N.scale),N.translateX(q),N.translateZ(me),N.matrixWorld.compose(N.position,N.quaternion,N.scale),N.matrixWorldInverse.copy(N.matrixWorld).invert(),B[10]===-1)N.projectionMatrix.copy(D.projectionMatrix),N.projectionMatrixInverse.copy(D.projectionMatrixInverse);else{const M=ge+me,Ae=R+me,Fe=ce-q,P=ve+(C-q),v=k*R/Ae*M,X=F*R/Ae*M;N.projectionMatrix.makePerspective(Fe,P,v,X,M,Ae),N.projectionMatrixInverse.copy(N.projectionMatrix).invert()}}function Le(N,D){D===null?N.matrixWorld.copy(N.matrix):N.matrixWorld.multiplyMatrices(D.matrixWorld,N.matrix),N.matrixWorldInverse.copy(N.matrixWorld).invert()}this.updateCamera=function(N){if(r===null)return;let D=N.near,L=N.far;m.texture!==null&&(m.depthNear>0&&(D=m.depthNear),m.depthFar>0&&(L=m.depthFar)),J.near=G.near=U.near=D,J.far=G.far=U.far=L,(H!==J.near||Y!==J.far)&&(r.updateRenderState({depthNear:J.near,depthFar:J.far}),H=J.near,Y=J.far),J.layers.mask=N.layers.mask|6,U.layers.mask=J.layers.mask&-5,G.layers.mask=J.layers.mask&-3;const C=N.parent,B=J.cameras;Le(J,C);for(let ne=0;ne<B.length;ne++)Le(B[ne],C);B.length===2?he(J,U,G):J.projectionMatrix.copy(U.projectionMatrix),A===null&&N.isPerspectiveCamera&&(A={camera:N,fov:N.fov,zoom:N.zoom}),pe(N,J,C)};function pe(N,D,L){L===null?N.matrix.copy(D.matrixWorld):(N.matrix.copy(L.matrixWorld),N.matrix.invert(),N.matrix.multiply(D.matrixWorld)),N.matrix.decompose(N.position,N.quaternion,N.scale),N.updateMatrixWorld(!0),N.projectionMatrix.copy(D.projectionMatrix),N.projectionMatrixInverse.copy(D.projectionMatrixInverse),N.isPerspectiveCamera&&(N.fov=rr*2*Math.atan(1/N.projectionMatrix.elements[5]),N.zoom=1)}this.getCamera=function(){return J},this.getFoveation=function(){if(!(h===null&&d===null))return l},this.setFoveation=function(N){l=N,h!==null&&(h.fixedFoveation=N),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=N)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(J)},this.getCameraTexture=function(N){return p[N]};let Ce=null;function De(N,D){if(u=D.getViewerPose(c||a),g=D,u!==null){const L=u.views;d!==null&&(e.setRenderTargetFramebuffer(_,d.framebuffer),e.setRenderTarget(_));let C=!1;L.length!==J.cameras.length&&(J.cameras.length=0,C=!0);for(let R=0;R<L.length;R++){const k=L[R];let F=null;if(d!==null)F=d.getViewport(k);else{const Q=f.getViewSubImage(h,k);F=Q.viewport,R===0&&(e.setRenderTargetTextures(_,Q.colorTexture,Q.depthStencilTexture),e.setRenderTarget(_))}let K=z[R];K===void 0&&(K=new Kt,K.layers.enable(R),K.viewport=new mt,z[R]=K),K.matrix.fromArray(k.transform.matrix),K.matrix.decompose(K.position,K.quaternion,K.scale),K.projectionMatrix.fromArray(k.projectionMatrix),K.projectionMatrixInverse.copy(K.projectionMatrix).invert(),K.viewport.set(F.x,F.y,F.width,F.height),R===0&&(J.matrix.copy(K.matrix),J.matrix.decompose(J.position,J.quaternion,J.scale)),C===!0&&J.cameras.push(K)}const B=r.enabledFeatures;if(B&&B.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){f=n.getBinding();const R=f.getDepthInformation(L[0]);R&&R.isValid&&R.texture&&m.init(R,r.renderState)}if(B&&B.includes("camera-access")&&S){e.state.unbindTexture(),f=n.getBinding();for(let R=0;R<L.length;R++){const k=L[R].camera;if(k){let F=p[k];F||(F=new $l,p[k]=F);const K=f.getCameraImage(k);F.sourceTexture=K}}}}for(let L=0;L<b.length;L++){const C=E[L],B=b[L];C!==null&&B!==void 0&&B.update(C,D,c||a)}Ce&&Ce(N,D),D.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:D}),g=null}const Ge=new Ec;Ge.setAnimationLoop(De),this.setAnimationLoop=function(N){Ce=N},this.dispose=function(){}}}const _g=new ct,jc=new Xe;jc.set(-1,0,0,0,1,0,0,0,1);function Mg(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,pc(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,w,T,_){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),f(m,p)):p.isMeshPhongMaterial?(s(m,p),u(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),h(m,p),p.isMeshPhysicalMaterial&&d(m,p,_)):p.isMeshMatcapMaterial?(s(m,p),g(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),S(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?l(m,p,w,T):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ot&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ot&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const w=e.get(p),T=w.envMap,_=w.envMapRotation;T&&(m.envMap.value=T,m.envMapRotation.value.setFromMatrix4(_g.makeRotationFromEuler(_)).transpose(),T.isCubeTexture&&T.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(jc),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,w,T){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*w,m.scale.value=T*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function h(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function d(m,p,w){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ot&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){const w=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function Sg(i,e,t,n){let r={},s={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function l(_,b){const E=b.program;n.uniformBlockBinding(_,E)}function c(_,b){let E=r[_.id];E===void 0&&(m(_),E=u(_),r[_.id]=E,_.addEventListener("dispose",w));const I=b.program;n.updateUBOMapping(_,I);const x=e.render.frame;s[_.id]!==x&&(h(_),s[_.id]=x)}function u(_){const b=f();_.__bindingPointIndex=b;const E=i.createBuffer(),I=_.__size,x=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,I,x),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,b,E),E}function f(){for(let _=0;_<o;_++)if(a.indexOf(_)===-1)return a.push(_),_;return nt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(_){const b=r[_.id],E=_.uniforms,I=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,b);for(let x=0,A=E.length;x<A;x++){const U=E[x];if(Array.isArray(U))for(let G=0,z=U.length;G<z;G++)d(U[G],x,G,I);else d(U,x,0,I)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(_,b,E,I){if(S(_,b,E,I)===!0){const x=_.__offset,A=_.value;if(Array.isArray(A)){let U=0;for(let G=0;G<A.length;G++){const z=A[G],J=p(z);g(z,_.__data,U),typeof z!="number"&&typeof z!="boolean"&&!z.isMatrix3&&!ArrayBuffer.isView(z)&&(U+=J.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(A,_.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,x,_.__data)}}function g(_,b,E){typeof _=="number"||typeof _=="boolean"?b[0]=_:_.isMatrix3?(b[0]=_.elements[0],b[1]=_.elements[1],b[2]=_.elements[2],b[3]=0,b[4]=_.elements[3],b[5]=_.elements[4],b[6]=_.elements[5],b[7]=0,b[8]=_.elements[6],b[9]=_.elements[7],b[10]=_.elements[8],b[11]=0):ArrayBuffer.isView(_)?b.set(new _.constructor(_.buffer,_.byteOffset,b.length)):_.toArray(b,E)}function S(_,b,E,I){const x=_.value,A=b+"_"+E;if(I[A]===void 0)return typeof x=="number"||typeof x=="boolean"?I[A]=x:ArrayBuffer.isView(x)?I[A]=x.slice():I[A]=x.clone(),!0;{const U=I[A];if(typeof x=="number"||typeof x=="boolean"){if(U!==x)return I[A]=x,!0}else{if(ArrayBuffer.isView(x))return!0;if(U.equals(x)===!1)return U.copy(x),!0}}return!1}function m(_){const b=_.uniforms;let E=0;const I=16;for(let A=0,U=b.length;A<U;A++){const G=Array.isArray(b[A])?b[A]:[b[A]];for(let z=0,J=G.length;z<J;z++){const H=G[z],Y=Array.isArray(H.value)?H.value:[H.value];for(let re=0,$=Y.length;re<$;re++){const Z=Y[re],ie=p(Z),se=E%I,he=se%ie.boundary,Le=se+he;E+=he,Le!==0&&I-Le<ie.storage&&(E+=I-Le),H.__data=new Float32Array(ie.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=E,E+=ie.storage}}}const x=E%I;return x>0&&(E+=I-x),_.__size=E,_.__cache={},this}function p(_){const b={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(b.boundary=4,b.storage=4):_.isVector2?(b.boundary=8,b.storage=8):_.isVector3||_.isColor?(b.boundary=16,b.storage=12):_.isVector4?(b.boundary=16,b.storage=16):_.isMatrix3?(b.boundary=48,b.storage=48):_.isMatrix4?(b.boundary=64,b.storage=64):_.isTexture?Ye("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(_)?(b.boundary=16,b.storage=_.byteLength):Ye("WebGLRenderer: Unsupported uniform value type.",_),b}function w(_){const b=_.target;b.removeEventListener("dispose",w);const E=a.indexOf(b.__bindingPointIndex);a.splice(E,1),i.deleteBuffer(r[b.id]),delete r[b.id],delete s[b.id]}function T(){for(const _ in r)i.deleteBuffer(r[_]);a=[],r={},s={}}return{bind:l,update:c,dispose:T}}const yg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let bn=null;function bg(){return bn===null&&(bn=new lo(yg,16,16,ti,Lt),bn.name="DFG_LUT",bn.minFilter=Tt,bn.magFilter=Tt,bn.wrapS=vn,bn.wrapT=vn,bn.generateMipmaps=!1,bn.needsUpdate=!0),bn}class Eg{constructor(e={}){const{canvas:t=bh(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:d=Vt}=e;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=a;const S=d,m=new Set([aa,sa,ra]),p=new Set([Vt,xn,tr,nr,na,ia]),w=new Uint32Array(4),T=new Int32Array(4),_=new O;let b=null,E=null;const I=[],x=[];let A=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=gn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const U=this;let G=!1,z=null,J=null,H=null,Y=null;this._outputColorSpace=Gt;let re=0,$=0,Z=null,ie=-1,se=null;const he=new mt,Le=new mt;let pe=null;const Ce=new Ke(0);let De=0,Ge=t.width,N=t.height,D=1,L=null,C=null;const B=new mt(0,0,Ge,N),ne=new mt(0,0,Ge,N);let ge=!1;const R=new Kl;let k=!1,F=!1;const K=new ct,Q=new O,ce=new mt,ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let me=!1;function q(){return Z===null?D:1}let M=n;function Ae(y,V){return t.getContext(y,V)}let Fe,P,v,X,j,le,_e,Me,ue,fe,Se,ze,be,ye,Ve,qe,Ze,W,Ee,de,we,Ie,xe;try{const y={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ws}`),t.addEventListener("webglcontextlost",dt,!1),t.addEventListener("webglcontextrestored",at,!1),t.addEventListener("webglcontextcreationerror",pn,!1),M===null){const V="webgl2";if(M=Ae(V,y),M===null)throw Ae(V)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}We()}catch(y){throw t.removeEventListener("webglcontextlost",dt,!1),t.removeEventListener("webglcontextrestored",at,!1),t.removeEventListener("webglcontextcreationerror",pn,!1),nt("WebGLRenderer: "+y.message),y}function We(){Fe=new bm(M),Fe.init(),we=new pg(M,Fe),P=new dm(M,Fe,e,we),v=new fg(M,Fe),P.reversedDepthBuffer&&h&&v.buffers.depth.setReversed(!0),J=M.createFramebuffer(),H=M.createFramebuffer(),Y=M.createFramebuffer(),X=new Tm(M),j=new Q0,le=new dg(M,Fe,v,j,P,we,X),_e=new ym(U),Me=new ld(M),Ie=new hm(M,Me),ue=new Em(M,Me,X,Ie),fe=new Rm(M,ue,Me,Ie,X),W=new Am(M,P,le),Ve=new pm(j),Se=new J0(U,_e,Fe,P,Ie,Ve),ze=new Mg(U,j),be=new eg,ye=new ag(Fe),Ze=new um(U,_e,v,fe,g,l),qe=new hg(U,fe,P),xe=new Sg(M,X,P,v),Ee=new fm(M,Fe,X),de=new wm(M,Fe,X),X.programs=Se.programs,U.capabilities=P,U.extensions=Fe,U.properties=j,U.renderLists=be,U.shadowMap=qe,U.state=v,U.info=X}S!==Vt&&(A=new Pm(S,t.width,t.height,o,r,s));const He=new xg(U,M);this.xr=He,this.getContext=function(){return M},this.getContextAttributes=function(){return M.getContextAttributes()},this.forceContextLoss=function(){const y=Fe.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){const y=Fe.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return D},this.setPixelRatio=function(y){y!==void 0&&(D=y,this.setSize(Ge,N,!1))},this.getSize=function(y){return y.set(Ge,N)},this.setSize=function(y,V,oe=!0){if(He.isPresenting){Ye("WebGLRenderer: Can't change size while VR device is presenting.");return}Ge=y,N=V,t.width=Math.floor(y*D),t.height=Math.floor(V*D),oe===!0&&(t.style.width=y+"px",t.style.height=V+"px"),A!==null&&A.setSize(t.width,t.height),this.setViewport(0,0,y,V)},this.getDrawingBufferSize=function(y){return y.set(Ge*D,N*D).floor()},this.setDrawingBufferSize=function(y,V,oe){Ge=y,N=V,D=oe,t.width=Math.floor(y*oe),t.height=Math.floor(V*oe),this.setViewport(0,0,y,V)},this.setEffects=function(y){if(S===Vt){nt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let V=0;V<y.length;V++)if(y[V].isOutputPass===!0){Ye("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(he)},this.getViewport=function(y){return y.copy(B)},this.setViewport=function(y,V,oe,ee){y.isVector4?B.set(y.x,y.y,y.z,y.w):B.set(y,V,oe,ee),v.viewport(he.copy(B).multiplyScalar(D).round())},this.getScissor=function(y){return y.copy(ne)},this.setScissor=function(y,V,oe,ee){y.isVector4?ne.set(y.x,y.y,y.z,y.w):ne.set(y,V,oe,ee),v.scissor(Le.copy(ne).multiplyScalar(D).round())},this.getScissorTest=function(){return ge},this.setScissorTest=function(y){v.setScissorTest(ge=y)},this.setOpaqueSort=function(y){L=y},this.setTransparentSort=function(y){C=y},this.getClearColor=function(y){return y.copy(Ze.getClearColor())},this.setClearColor=function(){Ze.setClearColor(...arguments)},this.getClearAlpha=function(){return Ze.getClearAlpha()},this.setClearAlpha=function(){Ze.setClearAlpha(...arguments)},this.clear=function(y=!0,V=!0,oe=!0){let ee=0;if(y){let te=!1;if(Z!==null){const Pe=Z.texture.format;te=m.has(Pe)}if(te){const Pe=Z.texture.type,Ue=p.has(Pe),Re=Ze.getClearColor(),Oe=Ze.getClearAlpha(),ke=Re.r,Je=Re.g,et=Re.b;Ue?(w[0]=ke,w[1]=Je,w[2]=et,w[3]=Oe,M.clearBufferuiv(M.COLOR,0,w)):(T[0]=ke,T[1]=Je,T[2]=et,T[3]=Oe,M.clearBufferiv(M.COLOR,0,T))}else ee|=M.COLOR_BUFFER_BIT}V&&(ee|=M.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),oe&&(ee|=M.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ee!==0&&M.clear(ee)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),z=y},this.dispose=function(){t.removeEventListener("webglcontextlost",dt,!1),t.removeEventListener("webglcontextrestored",at,!1),t.removeEventListener("webglcontextcreationerror",pn,!1),Ze.dispose(),be.dispose(),ye.dispose(),j.dispose(),_e.dispose(),fe.dispose(),Ie.dispose(),xe.dispose(),Se.dispose(),He.dispose(),He.removeEventListener("sessionstart",Lu),He.removeEventListener("sessionend",Iu),vi.stop()};function dt(y){y.preventDefault(),El("WebGLRenderer: Context Lost."),G=!0}function at(){El("WebGLRenderer: Context Restored."),G=!1;const y=X.autoReset,V=qe.enabled,oe=qe.autoUpdate,ee=qe.needsUpdate,te=qe.type;We(),X.autoReset=y,qe.enabled=V,qe.autoUpdate=oe,qe.needsUpdate=ee,qe.type=te}function pn(y){nt("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function wn(y){const V=y.target;V.removeEventListener("dispose",wn),yx(V)}function yx(y){bx(y),j.remove(y)}function bx(y){const V=j.get(y).programs;V!==void 0&&(V.forEach(function(oe){Se.releaseProgram(oe)}),y.isShaderMaterial&&Se.releaseShaderCache(y))}this.renderBufferDirect=function(y,V,oe,ee,te,Pe){V===null&&(V=ve);const Ue=te.isMesh&&te.matrixWorld.determinantAffine()<0,Re=Tx(y,V,oe,ee,te);v.setMaterial(ee,Ue);let Oe=oe.index,ke=1;if(ee.wireframe===!0){if(Oe=ue.getWireframeAttribute(oe),Oe===void 0)return;ke=2}const Je=oe.drawRange,et=oe.attributes.position;let Be=Je.start*ke,ot=(Je.start+Je.count)*ke;Pe!==null&&(Be=Math.max(Be,Pe.start*ke),ot=Math.min(ot,(Pe.start+Pe.count)*ke)),Oe!==null?(Be=Math.max(Be,0),ot=Math.min(ot,Oe.count)):et!=null&&(Be=Math.max(Be,0),ot=Math.min(ot,et.count));const bt=ot-Be;if(bt<0||bt===1/0)return;Ie.setup(te,ee,Re,oe,Oe);let gt,ft=Ee;if(Oe!==null&&(gt=Me.get(Oe),ft=de,ft.setIndex(gt)),te.isMesh)ee.wireframe===!0?(v.setLineWidth(ee.wireframeLinewidth*q()),ft.setMode(M.LINES)):ft.setMode(M.TRIANGLES);else if(te.isLine){let Ft=ee.linewidth;Ft===void 0&&(Ft=1),v.setLineWidth(Ft*q()),te.isLineSegments?ft.setMode(M.LINES):te.isLineLoop?ft.setMode(M.LINE_LOOP):ft.setMode(M.LINE_STRIP)}else te.isPoints?ft.setMode(M.POINTS):te.isSprite&&ft.setMode(M.TRIANGLES);if(te.isBatchedMesh)if(Fe.get("WEBGL_multi_draw"))ft.renderMultiDraw(te._multiDrawStarts,te._multiDrawCounts,te._multiDrawCount);else{const Ft=te._multiDrawStarts,Ne=te._multiDrawCounts,Ht=te._multiDrawCount,it=Oe?Me.get(Oe).bytesPerElement:1,tn=j.get(ee).currentProgram.getUniforms();for(let Tn=0;Tn<Ht;Tn++)tn.setValue(M,"_gl_DrawID",Tn),ft.render(Ft[Tn]/it,Ne[Tn])}else if(te.isInstancedMesh)ft.renderInstances(Be,bt,te.count);else if(oe.isInstancedBufferGeometry){const Ft=oe._maxInstanceCount!==void 0?oe._maxInstanceCount:1/0,Ne=Math.min(oe.instanceCount,Ft);ft.renderInstances(Be,bt,Ne)}else ft.render(Be,bt)};function Pu(y,V,oe,ee){z!==null&&y.isNodeMaterial&&z.setObject(ee,y),k===!0&&Ve.setState(y,oe,!1),y.transparent===!0&&y.side===$t&&y.forceSinglePass===!1?(y.side=Ot,y.needsUpdate=!0,Vs(y,V,ee),y.side=Qn,y.needsUpdate=!0,Vs(y,V,ee),y.side=$t):Vs(y,V,ee)}this.compile=function(y,V,oe=null){oe===null&&(oe=y),z!==null&&z.renderStart(y,V,oe),E=ye.get(oe),E.init(V),x.push(E),oe.traverseVisible(function(te){te.isLight&&te.layers.test(V.layers)&&(E.pushLight(te),te.castShadow&&E.pushShadow(te))}),y!==oe&&y.traverseVisible(function(te){te.isLight&&te.layers.test(V.layers)&&(E.pushLight(te),te.castShadow&&E.pushShadow(te))}),E.setupLights(),z!==null&&z.updateLights(E.state.lightsArray),F=this.localClippingEnabled,k=Ve.init(this.clippingPlanes,F),k===!0&&Ve.setGlobalState(this.clippingPlanes,V),z!==null&&qe.render(E.state.shadowsArray,oe,V);const ee=new Set;return y.traverse(function(te){if(!(te.isMesh||te.isPoints||te.isLine||te.isSprite))return;const Pe=te.material;if(Pe)if(Array.isArray(Pe))for(let Ue=0;Ue<Pe.length;Ue++){const Re=Pe[Ue];Pu(Re,oe,V,te),ee.add(Re)}else Pu(Pe,oe,V,te),ee.add(Pe)}),E=x.pop(),z!==null&&z.renderEnd(),ee},this.compileAsync=function(y,V,oe=null){const ee=this.compile(y,V,oe);return new Promise(te=>{function Pe(){if(ee.forEach(function(Ue){const Oe=j.get(Ue).currentProgram;(Oe===void 0||Oe.isReady())&&ee.delete(Ue)}),ee.size===0){te(y);return}setTimeout(Pe,10)}Fe.get("KHR_parallel_shader_compile")!==null?Pe():setTimeout(Pe,10)})};let Qo=null;function Ex(y){Qo&&Qo(y)}function Lu(){vi.stop()}function Iu(){vi.start()}const vi=new Ec;vi.setAnimationLoop(Ex),typeof self<"u"&&vi.setContext(self),this.setAnimationLoop=function(y){Qo=y,He.setAnimationLoop(y),y===null?vi.stop():vi.start()},He.addEventListener("sessionstart",Lu),He.addEventListener("sessionend",Iu),this.render=function(y,V){if(V!==void 0&&V.isCamera!==!0){nt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(G===!0)return;z!==null&&z.renderStart(y,V);const oe=He.enabled===!0&&He.isPresenting===!0,ee=A!==null&&(Z===null||oe)&&A.begin(U,Z);if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),V.parent===null&&V.matrixWorldAutoUpdate===!0&&V.updateMatrixWorld(),He.enabled===!0&&He.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(He.cameraAutoUpdate===!0&&He.updateCamera(V),V=He.getCamera()),y.isScene===!0&&y.onBeforeRender(U,y,V,Z),E=ye.get(y,x.length),E.init(V),E.state.textureUnits=le.getTextureUnits(),x.push(E),K.multiplyMatrices(V.projectionMatrix,V.matrixWorldInverse),R.setFromProjectionMatrix(K,_n,V.reversedDepth),F=this.localClippingEnabled,k=Ve.init(this.clippingPlanes,F),b=be.get(y,I.length),b.init(),I.push(b),He.enabled===!0&&He.isPresenting===!0){const Ue=U.xr.getDepthSensingMesh();Ue!==null&&jo(Ue,V,-1/0,U.sortObjects)}jo(y,V,0,U.sortObjects),b.finish(),z!==null&&z.updateLights(E.state.lightsArray),U.sortObjects===!0&&b.sort(L,C),me=He.enabled===!1||He.isPresenting===!1||He.hasDepthSensing()===!1,me&&Ze.addToRenderList(b,y),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),k===!0&&Ve.beginShadows();const te=E.state.shadowsArray;if(qe.render(te,y,V),k===!0&&Ve.endShadows(),(ee&&A.hasRenderPass())===!1){const Ue=b.opaque,Re=b.transmissive;if(E.setupLights(),V.isArrayCamera){const Oe=V.cameras;if(Re.length>0)for(let ke=0,Je=Oe.length;ke<Je;ke++){const et=Oe[ke];Nu(Ue,Re,y,et)}me&&Ze.render(y);for(let ke=0,Je=Oe.length;ke<Je;ke++){const et=Oe[ke];Du(b,y,et,et.viewport)}}else Re.length>0&&Nu(Ue,Re,y,V),me&&Ze.render(y),Du(b,y,V)}Z!==null&&$===0&&(le.updateMultisampleRenderTarget(Z),le.updateRenderTargetMipmap(Z)),ee&&A.end(U),y.isScene===!0&&y.onAfterRender(U,y,V),Ie.resetDefaultState(),ie=-1,se=null,x.pop(),x.length>0?(E=x[x.length-1],le.setTextureUnits(E.state.textureUnits),k===!0&&Ve.setGlobalState(U.clippingPlanes,E.state.camera)):E=null,I.pop(),I.length>0?b=I[I.length-1]:b=null,z!==null&&z.renderEnd()};function jo(y,V,oe,ee){if(y.visible===!1)return;if(y.layers.test(V.layers)){if(y.isGroup)oe=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(V);else if(y.isLightProbeGrid)E.pushLightProbeGrid(y);else if(y.isLight)E.pushLight(y),y.castShadow&&E.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||y.intersectsFrustum(R)){ee&&ce.setFromMatrixPosition(y.matrixWorld).applyMatrix4(K);const Ue=fe.update(y),Re=y.material;Re.visible&&b.push(y,Ue,Re,oe,ce.z,null,V)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||y.intersectsFrustum(R))){const Ue=fe.update(y),Re=y.material;if(ee&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),ce.copy(y.boundingSphere.center)):(Ue.boundingSphere===null&&Ue.computeBoundingSphere(),ce.copy(Ue.boundingSphere.center)),ce.applyMatrix4(y.matrixWorld).applyMatrix4(K)),Array.isArray(Re)){const Oe=Ue.groups;for(let ke=0,Je=Oe.length;ke<Je;ke++){const et=Oe[ke],Be=Re[et.materialIndex];Be&&Be.visible&&b.push(y,Ue,Be,oe,ce.z,et,V)}}else Re.visible&&b.push(y,Ue,Re,oe,ce.z,null,V)}}const Pe=y.children;for(let Ue=0,Re=Pe.length;Ue<Re;Ue++)jo(Pe[Ue],V,oe,ee)}function Du(y,V,oe,ee){const{opaque:te,transmissive:Pe,transparent:Ue}=y;E.setupLightsView(oe),k===!0&&Ve.setGlobalState(U.clippingPlanes,oe),ee&&v.viewport(he.copy(ee)),te.length>0&&Gs(te,V,oe),Pe.length>0&&Gs(Pe,V,oe),Ue.length>0&&Gs(Ue,V,oe),v.buffers.depth.setTest(!0),v.buffers.depth.setMask(!0),v.buffers.color.setMask(!0),v.setPolygonOffset(!1)}function Nu(y,V,oe,ee){if((oe.isScene===!0?oe.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[ee.id]===void 0){const Be=Fe.has("EXT_color_buffer_half_float")||Fe.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[ee.id]=new Ct(1,1,{generateMipmaps:!0,type:Be?Lt:Vt,minFilter:Fn,samples:Math.max(4,P.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:tt.workingColorSpace})}const Pe=E.state.transmissionRenderTarget[ee.id],Ue=ee.viewport||he;Pe.setSize(Ue.z*U.transmissionResolutionScale,Ue.w*U.transmissionResolutionScale);const Re=U.getRenderTarget(),Oe=U.getActiveCubeFace(),ke=U.getActiveMipmapLevel();U.setRenderTarget(Pe),U.getClearColor(Ce),De=U.getClearAlpha(),De<1&&U.setClearColor(16777215,.5),U.clear(),me&&Ze.render(oe);const Je=U.toneMapping;U.toneMapping=gn;const et=ee.viewport;if(ee.viewport!==void 0&&(ee.viewport=void 0),E.setupLightsView(ee),k===!0&&Ve.setGlobalState(U.clippingPlanes,ee),Gs(y,oe,ee),le.updateMultisampleRenderTarget(Pe),le.updateRenderTargetMipmap(Pe),Fe.has("WEBGL_multisampled_render_to_texture")===!1){let Be=!1;for(let ot=0,bt=V.length;ot<bt;ot++){const gt=V[ot],{object:ft,geometry:Ft,material:Ne,group:Ht}=gt;if(Ne.side===$t&&ft.layers.test(ee.layers)){const it=Ne.side;Ne.side=Ot,Ne.needsUpdate=!0,Uu(ft,oe,ee,Ft,Ne,Ht),Ne.side=it,Ne.needsUpdate=!0,Be=!0}}Be===!0&&(le.updateMultisampleRenderTarget(Pe),le.updateRenderTargetMipmap(Pe))}U.setRenderTarget(Re,Oe,ke),U.setClearColor(Ce,De),et!==void 0&&(ee.viewport=et),U.toneMapping=Je}function Gs(y,V,oe){const ee=V.isScene===!0?V.overrideMaterial:null;for(let te=0,Pe=y.length;te<Pe;te++){const Ue=y[te],{object:Re,geometry:Oe,group:ke}=Ue;let Je=Ue.material;Je.allowOverride===!0&&ee!==null&&(Je=ee),Re.layers.test(oe.layers)&&Uu(Re,V,oe,Oe,Je,ke)}}function Uu(y,V,oe,ee,te,Pe){z!==null&&te.isNodeMaterial&&z.setObject(y,te),y.onBeforeRender(U,V,oe,ee,te,Pe),y.modelViewMatrix.multiplyMatrices(oe.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),te.onBeforeRender(U,V,oe,ee,y,Pe),te.transparent===!0&&te.side===$t&&te.forceSinglePass===!1?(te.side=Ot,te.needsUpdate=!0,U.renderBufferDirect(oe,V,ee,te,y,Pe),te.side=Qn,te.needsUpdate=!0,U.renderBufferDirect(oe,V,ee,te,y,Pe),te.side=$t):U.renderBufferDirect(oe,V,ee,te,y,Pe),y.onAfterRender(U,V,oe,ee,te,Pe)}function Vs(y,V,oe){V.isScene!==!0&&(V=ve);const ee=j.get(y),te=E.state.lights,Pe=E.state.shadowsArray,Ue=te.state.version,Re=Se.getParameters(y,te.state,Pe,V,oe,E.state.lightProbeGridArray),Oe=Se.getProgramCacheKey(Re);let ke=ee.programs;ee.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?V.environment:null,ee.fog=V.fog;const Je=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;ee.envMap=_e.get(y.envMap||ee.environment,Je),ee.envMapRotation=ee.environment!==null&&y.envMap===null?V.environmentRotation:y.envMapRotation,ke===void 0&&(y.addEventListener("dispose",wn),ke=new Map,ee.programs=ke);let et=ke.get(Oe);if(et!==void 0){if(ee.currentProgram===et&&ee.lightsStateVersion===Ue)return Ou(y,Re),et}else Re.uniforms=Se.getUniforms(y),z!==null&&y.isNodeMaterial&&z.build(y,oe,Re),y.onBeforeCompile(Re,U),et=Se.acquireProgram(Re,Oe),ke.set(Oe,et),ee.uniforms=Re.uniforms;const Be=ee.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Be.clippingPlanes=Ve.uniform),Ou(y,Re),ee.needsLights=Rx(y),ee.lightsStateVersion=Ue,ee.needsLights&&(Be.ambientLightColor.value=te.state.ambient,Be.lightProbe.value=te.state.probe,Be.sunLights.value=te.state.sun,Be.sunLightShadows.value=te.state.sunShadow,Be.directionalLights.value=te.state.directional,Be.directionalLightShadows.value=te.state.directionalShadow,Be.spotLights.value=te.state.spot,Be.spotLightShadows.value=te.state.spotShadow,Be.rectAreaLights.value=te.state.rectArea,Be.ltc_1.value=te.state.rectAreaLTC1,Be.ltc_2.value=te.state.rectAreaLTC2,Be.pointLights.value=te.state.point,Be.pointLightShadows.value=te.state.pointShadow,Be.hemisphereLights.value=te.state.hemi,Be.sunShadowMatrix.value=te.state.sunShadowMatrix,Be.sunShadowCascade.value=te.state.sunShadowCascade,Be.directionalShadowMatrix.value=te.state.directionalShadowMatrix,Be.spotLightMatrix.value=te.state.spotLightMatrix,Be.spotLightMap.value=te.state.spotLightMap,Be.pointShadowMatrix.value=te.state.pointShadowMatrix),ee.lightProbeGrid=E.state.lightProbeGridArray.length>0,ee.currentProgram=et,ee.uniformsList=null,et}function Fu(y){if(y.uniformsList===null){const V=y.currentProgram.getUniforms();y.uniformsList=As.seqWithValue(V.seq,y.uniforms)}return y.uniformsList}function Ou(y,V){const oe=j.get(y);oe.outputColorSpace=V.outputColorSpace,oe.batching=V.batching,oe.batchingColor=V.batchingColor,oe.instancing=V.instancing,oe.instancingColor=V.instancingColor,oe.instancingMorph=V.instancingMorph,oe.skinning=V.skinning,oe.morphTargets=V.morphTargets,oe.morphNormals=V.morphNormals,oe.morphColors=V.morphColors,oe.morphTargetsCount=V.morphTargetsCount,oe.numClippingPlanes=V.numClippingPlanes,oe.numIntersection=V.numClipIntersection,oe.vertexAlphas=V.vertexAlphas,oe.vertexTangents=V.vertexTangents,oe.toneMapping=V.toneMapping}function wx(y,V){if(y.length===0)return null;if(y.length===1)return y[0].texture!==null?y[0]:null;_.setFromMatrixPosition(V.matrixWorld);for(let oe=0,ee=y.length;oe<ee;oe++){const te=y[oe];if(te.texture!==null&&te.boundingBox.containsPoint(_))return te}return null}function Tx(y,V,oe,ee,te){V.isScene!==!0&&(V=ve),le.resetTextureUnits();const Pe=V.fog,Ue=ee.isMeshStandardMaterial||ee.isMeshLambertMaterial||ee.isMeshPhongMaterial?V.environment:null,Re=Z===null?U.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:tt.workingColorSpace,Oe=ee.isMeshStandardMaterial||ee.isMeshLambertMaterial&&!ee.envMap||ee.isMeshPhongMaterial&&!ee.envMap,ke=_e.get(ee.envMap||Ue,Oe),Je=ee.vertexColors===!0&&!!oe.attributes.color&&oe.attributes.color.itemSize===4,et=!!oe.attributes.tangent&&(!!ee.normalMap||ee.anisotropy>0),Be=!!oe.morphAttributes.position,ot=!!oe.morphAttributes.normal,bt=!!oe.morphAttributes.color;let gt=gn;ee.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(gt=U.toneMapping);const ft=oe.morphAttributes.position||oe.morphAttributes.normal||oe.morphAttributes.color,Ft=ft!==void 0?ft.length:0,Ne=j.get(ee),Ht=E.state.lights;if(k===!0&&(F===!0||y!==se)){const pt=y===se&&ee.id===ie;Ve.setState(ee,y,pt)}let it=!1;ee.version===Ne.__version?(Ne.needsLights&&Ne.lightsStateVersion!==Ht.state.version||Ne.outputColorSpace!==Re||te.isBatchedMesh&&Ne.batching===!1||!te.isBatchedMesh&&Ne.batching===!0||te.isBatchedMesh&&Ne.batchingColor===!0&&te._colorsTexture===null||te.isBatchedMesh&&Ne.batchingColor===!1&&te._colorsTexture!==null||te.isInstancedMesh&&Ne.instancing===!1||!te.isInstancedMesh&&Ne.instancing===!0||te.isSkinnedMesh&&Ne.skinning===!1||!te.isSkinnedMesh&&Ne.skinning===!0||te.isInstancedMesh&&Ne.instancingColor===!0&&te.instanceColor===null||te.isInstancedMesh&&Ne.instancingColor===!1&&te.instanceColor!==null||te.isInstancedMesh&&Ne.instancingMorph===!0&&te.morphTexture===null||te.isInstancedMesh&&Ne.instancingMorph===!1&&te.morphTexture!==null||Ne.envMap!==ke||ee.fog===!0&&Ne.fog!==Pe||Ne.numClippingPlanes!==void 0&&(Ne.numClippingPlanes!==Ve.numPlanes||Ne.numIntersection!==Ve.numIntersection)||Ne.vertexAlphas!==Je||Ne.vertexTangents!==et||Ne.morphTargets!==Be||Ne.morphNormals!==ot||Ne.morphColors!==bt||Ne.toneMapping!==gt||Ne.morphTargetsCount!==Ft||!!Ne.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(it=!0):(it=!0,Ne.__version=ee.version);let tn=Ne.currentProgram;it===!0&&(tn=Vs(ee,V,te),z&&ee.isNodeMaterial&&z.onUpdateProgram(ee,tn,Ne));let Tn=!1,Zn=!1,Zi=!1;const ht=tn.getUniforms(),Mt=Ne.uniforms;if(v.useProgram(tn.program)&&(Tn=!0,Zn=!0,Zi=!0),ee.id!==ie&&(ie=ee.id,Zn=!0),Ne.needsLights){const pt=wx(E.state.lightProbeGridArray,te);Ne.lightProbeGrid!==pt&&(Ne.lightProbeGrid=pt,Zn=!0)}if(Tn||se!==y){v.buffers.depth.getReversed()&&y.reversedDepth!==!0&&(y._reversedDepth=!0,y.updateProjectionMatrix()),ht.setValue(M,"projectionMatrix",y.projectionMatrix),ht.setValue(M,"viewMatrix",y.matrixWorldInverse);const Jn=ht.map.cameraPosition;Jn!==void 0&&Jn.setValue(M,Q.setFromMatrixPosition(y.matrixWorld)),P.logarithmicDepthBuffer&&ht.setValue(M,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(ee.isMeshPhongMaterial||ee.isMeshToonMaterial||ee.isMeshLambertMaterial||ee.isMeshBasicMaterial||ee.isMeshStandardMaterial||ee.isShaderMaterial)&&ht.setValue(M,"isOrthographic",y.isOrthographicCamera===!0),se!==y&&(se=y,Zn=!0,Zi=!0)}if(Ne.needsLights&&(Ht.state.sunShadowMap.length>0&&ht.setValue(M,"sunShadowMap",Ht.state.sunShadowMap,le),Ht.state.directionalShadowMap.length>0&&ht.setValue(M,"directionalShadowMap",Ht.state.directionalShadowMap,le),Ht.state.spotShadowMap.length>0&&ht.setValue(M,"spotShadowMap",Ht.state.spotShadowMap,le),Ht.state.pointShadowMap.length>0&&ht.setValue(M,"pointShadowMap",Ht.state.pointShadowMap,le)),te.isSkinnedMesh){ht.setOptional(M,te,"bindMatrix"),ht.setOptional(M,te,"bindMatrixInverse");const pt=te.skeleton;pt&&(pt.boneTexture===null&&pt.computeBoneTexture(),ht.setValue(M,"boneTexture",pt.boneTexture,le))}te.isBatchedMesh&&(ht.setOptional(M,te,"batchingTexture"),ht.setValue(M,"batchingTexture",te._matricesTexture,le),ht.setOptional(M,te,"batchingIdTexture"),ht.setValue(M,"batchingIdTexture",te._indirectTexture,le),ht.setOptional(M,te,"batchingColorTexture"),te._colorsTexture!==null&&ht.setValue(M,"batchingColorTexture",te._colorsTexture,le));const $n=oe.morphAttributes;if(($n.position!==void 0||$n.normal!==void 0||$n.color!==void 0)&&W.update(te,oe,tn),(Zn||Ne.receiveShadow!==te.receiveShadow)&&(Ne.receiveShadow=te.receiveShadow,ht.setValue(M,"receiveShadow",te.receiveShadow)),(ee.isMeshStandardMaterial||ee.isMeshLambertMaterial||ee.isMeshPhongMaterial)&&ee.envMap===null&&V.environment!==null&&(Mt.envMapIntensity.value=V.environmentIntensity),Mt.dfgLUT!==void 0&&(Mt.dfgLUT.value=bg()),Zn){if(ht.setValue(M,"toneMappingExposure",U.toneMappingExposure),Ne.needsLights&&Ax(Mt,Zi),Pe&&ee.fog===!0&&ze.refreshFogUniforms(Mt,Pe),ze.refreshMaterialUniforms(Mt,ee,D,N,E.state.transmissionRenderTarget[y.id]),Ne.needsLights&&Ne.lightProbeGrid){const pt=Ne.lightProbeGrid;Mt.probesSH.value=pt.texture,Mt.probesMin.value.copy(pt.boundingBox.min),Mt.probesMax.value.copy(pt.boundingBox.max),Mt.probesResolution.value.copy(pt.resolution)}As.upload(M,Fu(Ne),Mt,le)}if(ee.isShaderMaterial&&ee.uniformsNeedUpdate===!0&&(As.upload(M,Fu(Ne),Mt,le),ee.uniformsNeedUpdate=!1),ee.isSpriteMaterial&&ht.setValue(M,"center",te.center),ht.setValue(M,"modelViewMatrix",te.modelViewMatrix),ht.setValue(M,"normalMatrix",te.normalMatrix),ht.setValue(M,"modelMatrix",te.matrixWorld),ee.uniformsGroups!==void 0){const pt=ee.uniformsGroups;for(let Jn=0,$i=pt.length;Jn<$i;Jn++){const zu=pt[Jn];xe.update(zu,tn),xe.bind(zu,tn)}}return tn}function Ax(y,V){y.ambientLightColor.needsUpdate=V,y.lightProbe.needsUpdate=V,y.sunLights.needsUpdate=V,y.sunLightShadows.needsUpdate=V,y.directionalLights.needsUpdate=V,y.directionalLightShadows.needsUpdate=V,y.pointLights.needsUpdate=V,y.pointLightShadows.needsUpdate=V,y.spotLights.needsUpdate=V,y.spotLightShadows.needsUpdate=V,y.rectAreaLights.needsUpdate=V,y.hemisphereLights.needsUpdate=V}function Rx(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return re},this.getActiveMipmapLevel=function(){return $},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(y,V,oe){const ee=j.get(y);ee.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,ee.__autoAllocateDepthBuffer===!1&&(ee.__useRenderToTexture=!1),j.get(y.texture).__webglTexture=V,j.get(y.depthTexture).__webglTexture=ee.__autoAllocateDepthBuffer?void 0:oe,ee.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,V){const oe=j.get(y);oe.__webglFramebuffer=V,oe.__useDefaultFramebuffer=V===void 0},this.setRenderTarget=function(y,V=0,oe=0){Z=y,re=V,$=oe;let ee=null,te=!1,Pe=!1;if(y){const Re=j.get(y);if(Re.__useDefaultFramebuffer!==void 0){v.bindFramebuffer(M.FRAMEBUFFER,Re.__webglFramebuffer),he.copy(y.viewport),Le.copy(y.scissor),pe=y.scissorTest,v.viewport(he),v.scissor(Le),v.setScissorTest(pe),ie=-1;return}else if(Re.__webglFramebuffer===void 0)le.setupRenderTarget(y);else if(Re.__hasExternalTextures)le.rebindTextures(y,j.get(y.texture).__webglTexture,j.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){const Je=y.depthTexture;if(Re.__boundDepthTexture!==Je){if(Je!==null&&j.has(Je)&&(y.width!==Je.image.width||y.height!==Je.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");le.setupDepthRenderbuffer(y)}}const Oe=y.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(Pe=!0);const ke=j.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(ke[V])?ee=ke[V][oe]:ee=ke[V],te=!0):y.samples>0&&le.useMultisampledRTT(y)===!1?ee=j.get(y).__webglMultisampledFramebuffer:Array.isArray(ke)?ee=ke[oe]:ee=ke,he.copy(y.viewport),Le.copy(y.scissor),pe=y.scissorTest}else he.copy(B).multiplyScalar(D).floor(),Le.copy(ne).multiplyScalar(D).floor(),pe=ge;if(oe!==0&&(ee=J),v.bindFramebuffer(M.FRAMEBUFFER,ee)&&v.drawBuffers(y,ee),v.viewport(he),v.scissor(Le),v.setScissorTest(pe),te){const Re=j.get(y.texture);M.framebufferTexture2D(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_CUBE_MAP_POSITIVE_X+V,Re.__webglTexture,oe)}else if(Pe){const Re=V;for(let Oe=0;Oe<y.textures.length;Oe++){const ke=j.get(y.textures[Oe]);M.framebufferTextureLayer(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0+Oe,ke.__webglTexture,oe,Re)}}else if(y!==null&&oe!==0){const Re=j.get(y.texture);M.framebufferTexture2D(M.FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,Re.__webglTexture,oe)}ie=-1};function Bu(y){const V=j.get(y);return(V.__readFormat!==y.format||V.__readType!==y.type)&&(V.__readFormat=y.format,V.__readType=y.type,V.__formatReadable=P.textureFormatReadable(y.format),V.__typeReadable=P.textureTypeReadable(y.type)),V}this.readRenderTargetPixels=function(y,V,oe,ee,te,Pe,Ue,Re=0){if(!(y&&y.isWebGLRenderTarget)){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Oe=j.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Ue!==void 0&&(Oe=Oe[Ue]),Oe){v.bindFramebuffer(M.FRAMEBUFFER,Oe);try{const ke=y.textures[Re],Je=ke.format,et=ke.type;y.textures.length>1&&M.readBuffer(M.COLOR_ATTACHMENT0+Re);const Be=Bu(ke);if(Be.__formatReadable===!1){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Be.__typeReadable===!1){nt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}V>=0&&V<=y.width-ee&&oe>=0&&oe<=y.height-te&&M.readPixels(V,oe,ee,te,we.convert(Je),we.convert(et),Pe)}finally{const ke=Z!==null?j.get(Z).__webglFramebuffer:null;v.bindFramebuffer(M.FRAMEBUFFER,ke)}}},this.readRenderTargetPixelsAsync=async function(y,V,oe,ee,te,Pe,Ue,Re=0){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Oe=j.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Ue!==void 0&&(Oe=Oe[Ue]),Oe)if(V>=0&&V<=y.width-ee&&oe>=0&&oe<=y.height-te){v.bindFramebuffer(M.FRAMEBUFFER,Oe);const ke=y.textures[Re],Je=ke.format,et=ke.type;y.textures.length>1&&M.readBuffer(M.COLOR_ATTACHMENT0+Re);const Be=Bu(ke);if(Be.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Be.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const ot=M.createBuffer();M.bindBuffer(M.PIXEL_PACK_BUFFER,ot),M.bufferData(M.PIXEL_PACK_BUFFER,Pe.byteLength,M.STREAM_READ),M.readPixels(V,oe,ee,te,we.convert(Je),we.convert(et),0),M.bindBuffer(M.PIXEL_PACK_BUFFER,null);const bt=Z!==null?j.get(Z).__webglFramebuffer:null;v.bindFramebuffer(M.FRAMEBUFFER,bt);const gt=M.fenceSync(M.SYNC_GPU_COMMANDS_COMPLETE,0);return M.flush(),await Eh(M,gt,4),M.bindBuffer(M.PIXEL_PACK_BUFFER,ot),M.getBufferSubData(M.PIXEL_PACK_BUFFER,0,Pe),M.bindBuffer(M.PIXEL_PACK_BUFFER,null),M.deleteBuffer(ot),M.deleteSync(gt),Pe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,V=null,oe=0){const ee=Math.pow(2,-oe),te=Math.floor(y.image.width*ee),Pe=Math.floor(y.image.height*ee),Ue=V!==null?V.x:0,Re=V!==null?V.y:0;le.setTexture2D(y,0),M.copyTexSubImage2D(M.TEXTURE_2D,oe,0,0,Ue,Re,te,Pe),v.unbindTexture()},this.copyTextureToTexture=function(y,V,oe=null,ee=null,te=0,Pe=0){let Ue,Re,Oe,ke,Je,et,Be,ot,bt;const gt=y.isCompressedTexture?y.mipmaps[Pe]:y.image;if(oe!==null)Ue=oe.max.x-oe.min.x,Re=oe.max.y-oe.min.y,Oe=oe.isBox3?oe.max.z-oe.min.z:1,ke=oe.min.x,Je=oe.min.y,et=oe.isBox3?oe.min.z:0;else{const Mt=Math.pow(2,-te);Ue=Math.floor(gt.width*Mt),Re=Math.floor(gt.height*Mt),y.isDataArrayTexture?Oe=gt.depth:y.isData3DTexture?Oe=Math.floor(gt.depth*Mt):Oe=1,ke=0,Je=0,et=0}ee!==null?(Be=ee.x,ot=ee.y,bt=ee.z):(Be=0,ot=0,bt=0);const ft=we.convert(V.format),Ft=we.convert(V.type);let Ne;V.isData3DTexture?(le.setTexture3D(V,0),Ne=M.TEXTURE_3D):V.isDataArrayTexture||V.isCompressedArrayTexture?(le.setTexture2DArray(V,0),Ne=M.TEXTURE_2D_ARRAY):(le.setTexture2D(V,0),Ne=M.TEXTURE_2D),v.activeTexture(M.TEXTURE0),v.pixelStorei(M.UNPACK_FLIP_Y_WEBGL,V.flipY),v.pixelStorei(M.UNPACK_PREMULTIPLY_ALPHA_WEBGL,V.premultiplyAlpha),v.pixelStorei(M.UNPACK_ALIGNMENT,V.unpackAlignment);const Ht=v.getParameter(M.UNPACK_ROW_LENGTH),it=v.getParameter(M.UNPACK_IMAGE_HEIGHT),tn=v.getParameter(M.UNPACK_SKIP_PIXELS),Tn=v.getParameter(M.UNPACK_SKIP_ROWS),Zn=v.getParameter(M.UNPACK_SKIP_IMAGES);v.pixelStorei(M.UNPACK_ROW_LENGTH,gt.width),v.pixelStorei(M.UNPACK_IMAGE_HEIGHT,gt.height),v.pixelStorei(M.UNPACK_SKIP_PIXELS,ke),v.pixelStorei(M.UNPACK_SKIP_ROWS,Je),v.pixelStorei(M.UNPACK_SKIP_IMAGES,et);const Zi=y.isDataArrayTexture||y.isData3DTexture,ht=V.isDataArrayTexture||V.isData3DTexture;if(y.isDepthTexture){const Mt=j.get(y),$n=j.get(V),pt=j.get(Mt.__renderTarget),Jn=j.get($n.__renderTarget);v.bindFramebuffer(M.READ_FRAMEBUFFER,pt.__webglFramebuffer),v.bindFramebuffer(M.DRAW_FRAMEBUFFER,Jn.__webglFramebuffer);for(let $i=0;$i<Oe;$i++)Zi&&(M.framebufferTextureLayer(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,j.get(y).__webglTexture,te,et+$i),M.framebufferTextureLayer(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,j.get(V).__webglTexture,Pe,bt+$i)),M.blitFramebuffer(ke,Je,Ue,Re,Be,ot,Ue,Re,M.DEPTH_BUFFER_BIT,M.NEAREST);v.bindFramebuffer(M.READ_FRAMEBUFFER,null),v.bindFramebuffer(M.DRAW_FRAMEBUFFER,null)}else if(te!==0||y.isRenderTargetTexture||j.has(y)){const Mt=j.get(y),$n=j.get(V);v.bindFramebuffer(M.READ_FRAMEBUFFER,H),v.bindFramebuffer(M.DRAW_FRAMEBUFFER,Y);for(let pt=0;pt<Oe;pt++)Zi?M.framebufferTextureLayer(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,Mt.__webglTexture,te,et+pt):M.framebufferTexture2D(M.READ_FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,Mt.__webglTexture,te),ht?M.framebufferTextureLayer(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,$n.__webglTexture,Pe,bt+pt):M.framebufferTexture2D(M.DRAW_FRAMEBUFFER,M.COLOR_ATTACHMENT0,M.TEXTURE_2D,$n.__webglTexture,Pe),te!==0?M.blitFramebuffer(ke,Je,Ue,Re,Be,ot,Ue,Re,M.COLOR_BUFFER_BIT,M.NEAREST):ht?M.copyTexSubImage3D(Ne,Pe,Be,ot,bt+pt,ke,Je,Ue,Re):M.copyTexSubImage2D(Ne,Pe,Be,ot,ke,Je,Ue,Re);v.bindFramebuffer(M.READ_FRAMEBUFFER,null),v.bindFramebuffer(M.DRAW_FRAMEBUFFER,null)}else ht?y.isDataTexture||y.isData3DTexture?M.texSubImage3D(Ne,Pe,Be,ot,bt,Ue,Re,Oe,ft,Ft,gt.data):V.isCompressedArrayTexture?M.compressedTexSubImage3D(Ne,Pe,Be,ot,bt,Ue,Re,Oe,ft,gt.data):M.texSubImage3D(Ne,Pe,Be,ot,bt,Ue,Re,Oe,ft,Ft,gt):y.isDataTexture?M.texSubImage2D(M.TEXTURE_2D,Pe,Be,ot,Ue,Re,ft,Ft,gt.data):y.isCompressedTexture?M.compressedTexSubImage2D(M.TEXTURE_2D,Pe,Be,ot,gt.width,gt.height,ft,gt.data):M.texSubImage2D(M.TEXTURE_2D,Pe,Be,ot,Ue,Re,ft,Ft,gt);v.pixelStorei(M.UNPACK_ROW_LENGTH,Ht),v.pixelStorei(M.UNPACK_IMAGE_HEIGHT,it),v.pixelStorei(M.UNPACK_SKIP_PIXELS,tn),v.pixelStorei(M.UNPACK_SKIP_ROWS,Tn),v.pixelStorei(M.UNPACK_SKIP_IMAGES,Zn),Pe===0&&V.generateMipmaps&&M.generateMipmap(Ne),v.unbindTexture()},this.initRenderTarget=function(y){j.get(y).__webglFramebuffer===void 0&&le.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?le.setTextureCube(y,0):y.isData3DTexture?le.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?le.setTexture2DArray(y,0):le.setTexture2D(y,0),v.unbindTexture()},this.resetState=function(){re=0,$=0,Z=null,v.reset(),Ie.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return _n}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=tt._getDrawingBufferColorSpace(e),t.unpackColorSpace=tt._getUnpackColorSpace()}}class Ar extends st{constructor(e,t={}){super(e),this.isReflector=!0,this.type="Reflector",this.forceUpdate=!1,this._reflectionCameras=new WeakMap;const n=this,r=t.color!==void 0?new Ke(t.color):new Ke(8355711),s=t.textureWidth||512,a=t.textureHeight||512,o=t.clipBias||0,l=t.shader||Ar.ReflectorShader,c=t.multisample!==void 0?t.multisample:4,u=new Dn,f=new O,h=new O,d=new O,g=new ct,S=new O(0,0,-1),m=new mt,p=new O,w=new O,T=new mt,_=new ct,b=new Ct(s,a,{samples:c,type:Lt}),E=new _t({name:l.name!==void 0?l.name:"unspecified",uniforms:br.clone(l.uniforms),fragmentShader:l.fragmentShader,vertexShader:l.vertexShader});E.uniforms.tDiffuse.value=b.texture,E.uniforms.color.value=r,E.uniforms.textureMatrix.value=_,this.material=E,this.onBeforeRender=function(I,x,A){const U=this.getReflectionCamera(A);if(h.setFromMatrixPosition(n.matrixWorld),d.setFromMatrixPosition(A.matrixWorld),g.extractRotation(n.matrixWorld),f.set(0,0,1),f.applyMatrix4(g),p.subVectors(h,d),p.dot(f)>0===!0&&this.forceUpdate===!1)return;p.reflect(f).negate(),p.add(h),g.extractRotation(A.matrixWorld),S.set(0,0,-1),S.applyMatrix4(g),S.add(d),w.subVectors(h,S),w.reflect(f).negate(),w.add(h),U.position.copy(p),U.up.set(0,1,0),U.up.applyMatrix4(g),U.up.reflect(f),U.lookAt(w),U.far=A.far,U.updateMatrixWorld(),U.projectionMatrix.copy(A.projectionMatrix),_.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),_.multiply(U.projectionMatrix),_.multiply(U.matrixWorldInverse),_.multiply(n.matrixWorld),u.setFromNormalAndCoplanarPoint(f,h),u.applyMatrix4(U.matrixWorldInverse),m.set(u.normal.x,u.normal.y,u.normal.z,u.constant);const z=U.projectionMatrix;U.isOrthographicCamera?(T.x=(Math.sign(m.x)+z.elements[8])/z.elements[0],T.y=(Math.sign(m.y)+z.elements[9])/z.elements[5],T.z=-A.far,T.w=1):(T.x=(Math.sign(m.x)+z.elements[8])/z.elements[0],T.y=(Math.sign(m.y)+z.elements[9])/z.elements[5],T.z=-1,T.w=(1+z.elements[10])/z.elements[14]),m.multiplyScalar(2/m.dot(T)),z.elements[2]=m.x,z.elements[6]=m.y,U.isOrthographicCamera?(z.elements[10]=m.z-o,z.elements[14]=m.w-1):(z.elements[10]=m.z+1-o,z.elements[14]=m.w),n.visible=!1;const J=I.getRenderTarget(),H=I.xr.enabled,Y=I.shadowMap.autoUpdate;I.xr.enabled=!1,I.shadowMap.autoUpdate=!1,I.setRenderTarget(b),I.state.buffers.depth.setMask(!0),I.autoClear===!1&&I.clear(),I.render(x,U),I.xr.enabled=H,I.shadowMap.autoUpdate=Y,I.setRenderTarget(J);const re=A.viewport;re!==void 0&&I.state.viewport(re),n.visible=!0,this.forceUpdate=!1},this.getRenderTarget=function(){return b},this.dispose=function(){b.dispose(),n.material.dispose()},this.getReflectionCamera=function(I){let x=this._reflectionCameras.get(I);return x===void 0&&(x=I.clone(),this._reflectionCameras.set(I,x)),x}}}Ar.ReflectorShader={name:"ReflectorShader",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null}},vertexShader:`
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

		}`};function Cs(i,e=!1){const t=i[0].index!==null,n=new Set(Object.keys(i[0].attributes)),r=new Set(Object.keys(i[0].morphAttributes)),s={},a={},o=i[0].morphTargetsRelative,l=new yt;let c=0;for(let u=0;u<i.length;++u){const f=i[u];let h=0;if(t!==(f.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const d in f.attributes){if(!n.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+d+'" attribute exists among all geometries, or in none of them.'),null;s[d]===void 0&&(s[d]=[]),s[d].push(f.attributes[d]),h++}if(h!==n.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(o!==f.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const d in f.morphAttributes){if(!r.has(d))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;a[d]===void 0&&(a[d]=[]),a[d].push(f.morphAttributes[d])}if(e){let d;if(t)d=f.index.count;else if(f.attributes.position!==void 0)d=f.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,d,u),c+=d}}if(t){let u=0;const f=[];for(let h=0;h<i.length;++h){const d=i[h].index;for(let g=0;g<d.count;++g)f.push(d.getX(g)+u);u+=i[h].attributes.position.count}l.setIndex(f)}for(const u in s){const f=eu(s[u]);if(!f)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;l.setAttribute(u,f)}for(const u in a){const f=a[u][0].length;if(f!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[u]=[];for(let h=0;h<f;++h){const d=[];for(let S=0;S<a[u].length;++S)d.push(a[u][S][h]);const g=eu(d);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;l.morphAttributes[u].push(g)}}}return l}function eu(i){let e,t,n,r=-1,s=0;for(let c=0;c<i.length;++c){const u=i[c];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(n===void 0&&(n=u.normalized),n!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=u.gpuType),r!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=u.count*t}const a=new e(s),o=new qt(a,t,n);let l=0;for(let c=0;c<i.length;++c){const u=i[c];if(u.isInterleavedBufferAttribute){const f=l/t;for(let h=0,d=u.count;h<d;h++)for(let g=0;g<t;g++){const S=u.getComponent(h,g);o.setComponent(h+f,g,S)}}else a.set(u.array,l);l+=u.count*t}return r!==void 0&&(o.gpuType=r),o}const cn={glass:0,panel:1,ribbon:2,hero:3},Pt={none:0,redCorners:1,cyanCorners:2,crownBand:3,floorLines:4,fins:5},un={box:0,round:1},En={spinner:0,hauler:1},Po=8,Ps=4,Lo=17,Qt={start:175,end:-205},Wi={x:12.4,spacing:26,height:9.5},hn={x:0,z:-238,deck:150},jt={x:0,y:186,z:-238,width:48},Rr={north:71,south:-113,rail:-159},Ls=6,tu=[28,72,104],nu=10.5,Zt={x:0,y:50,z:-60,length:24,radius:4.6},pi={z:Rr.rail,height:30,cars:5,carLength:17,gap:1.2,speed:32,span:1100},Xn={pearl:{x:160,z:-430,height:318,clearance:34,view:{from:40,halfAngle:.1}},gate:{x:-146,z:-450,height:250,clearance:62,view:{from:85,halfAngle:.16}},twist:{x:136,z:-710,height:400,radius:30,clearance:42,view:{from:110,halfAngle:.08}},opener:{x:-150,z:-760,height:330,clearance:46,view:{from:140,halfAngle:.08}}},wg=-45,Tg=150,Ag=136,mi=[{at:0,position:{x:0,y:5.2,z:130},target:{x:0,y:17,z:20},fov:62},{at:.3,position:{x:.4,y:8.5,z:62},target:{x:0,y:40,z:-110},fov:58},{at:.54,position:{x:-.5,y:36,z:14},target:{x:0,y:104,z:-210},fov:52},{at:.78,position:{x:.3,y:116,z:-38},target:{x:0,y:150,z:-238},fov:44},{at:1,position:{x:0,y:152,z:-70},target:{x:0,y:157,z:-238},fov:40}];function Io(i){let e=i|0;return()=>{e=e+1831565813|0;let t=Math.imul(e^e>>>15,1|e);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}function Rg(i,e){for(let t=i.length-1;t>0;t-=1){const n=Math.floor(e()*(t+1)),r=i[t];i[t]=i[n],i[n]=r}}function Cg(i,e,t,n,r,s){const a=s*s,o=a*s;return(2*o-3*a+1)*i+(o-2*a+s)*r*t+(-2*o+3*a)*e+(o-a)*r*n}function iu(i,e){const t=mi.length-1;if(e>=t)return 0;const n=mi[Math.max(0,e-1)],r=mi[e+1];return n===void 0||r===void 0?0:(i(r)-i(n))/(r.at-n.at)}function gi(i){var l;const e=Math.min(1,Math.max(0,i));let t=0;for(;t<mi.length-2&&(((l=mi[t+1])==null?void 0:l.at)??1)<e;)t+=1;const n=mi[t],r=mi[t+1];if(n===void 0||r===void 0)throw new Error("splash: camera keys are incomplete");const s=r.at-n.at,a=(e-n.at)/s,o=c=>Cg(c(n),c(r),iu(c,t),iu(c,t+1),s,a);return{position:{x:o(c=>c.position.x),y:o(c=>c.position.y),z:o(c=>c.position.z)},target:{x:o(c=>c.target.x),y:o(c=>c.target.y),z:o(c=>c.target.z)},fov:o(c=>c.fov)}}function Xi(i,e,t){const n=Math.min(1,Math.max(0,(i-e)/t));return n*n*(3-2*n)}function Pg(i){const{speed:e,span:t}=pi;return(((i-1.6)*e+t/2)%t+t)%t-t/2}function Lg(i){let e;for(let t=0;t<=400;t+=1){const n=gi(t/400);Math.abs(n.position.z-i)>6||(e=Math.min(e??1/0,n.position.y))}return e}function Ig(i,e){return Object.values(Rr).find(t=>t+Ls>e&&t-Ls<i)}function Dg(i,e,t){return Object.values(Xn).some(n=>Math.hypot(i-n.x,e-n.z)<n.clearance+t)}function Ng(i,e,t){const n=gi(1).position,r=Math.hypot(i-n.x,e-n.z),s=Math.atan2(i-n.x,n.z-e);let a=1/0;for(const o of Object.values(Xn)){const l=Math.hypot(o.x-n.x,o.z-n.z);if(r+t>=l)continue;const c=Math.abs(s-Math.atan2(o.x-n.x,n.z-o.z))-Math.atan2(t,r),u=Math.min(1,Math.max(0,(c-o.view.halfAngle)/.06));if(u>=1)continue;const f=n.y+(o.view.from-n.y)*(r+t)/l;a=Math.min(a,f+u*u*400)}return a}function Do(i,e,t,n,r){const s=gi(1).position,a=t<wg&&Math.hypot(e-s.x,t-s.z)<Tg?Ag:1/0;return Math.max(r,Math.min(i,a,Ng(e,t,n)))}function Ug(i){const e=i();return e<.46?cn.glass:e<.78?cn.panel:cn.ribbon}function Fg(i,e){const t=i();return e?t<.3?Pt.crownBand:t<.55?Pt.floorLines:t<.7?Pt.fins:Pt.none:t<.05?Pt.redCorners:t<.09?Pt.cyanCorners:t<.18?Pt.crownBand:t<.25?Pt.floorLines:t<.3?Pt.fins:Pt.none}function Is(i,e,t){const n=e(),r=!t.storefront&&t.height>46&&e()<.17,s=r?e()<.6?cn.glass:cn.ribbon:Ug(e),a=.08+e()*.3,o=Fg(e,r),l=r?un.round:un.box,c=[];let u=0,f=r?Math.min(t.width,t.depth):t.width,h=r?f:t.depth,d=t.height>60?2+Math.floor(e()*2):e()<.4?2:1;if(r&&(d=Math.min(d,2)),!r&&d>1&&e()<.55){const w=Math.min(t.height*.4,9+e()*10);c.push({x:t.x,y:0,z:t.z,width:f,depth:h,height:w,seed:n,facade:cn.panel,lit:Math.min(1,a+.15),trim:Pt.none,storefront:t.storefront,form:l,taper:1}),u=w,f*=.7+e()*.18,h*=.7+e()*.18,d-=1}for(let w=0;w<d;w+=1){const T=t.height-u,_=w===d-1,b=_?T:T*(.58+e()*.2),E=r?.84+e()*.16:1;c.push({x:t.x,y:u,z:t.z,width:f,depth:h,height:b,seed:n,facade:s,lit:a,trim:_?o:Pt.none,storefront:t.storefront&&u===0,form:l,taper:E}),u+=b;const I=r?E*(.82+e()*.1):.72+e()*.16;f*=I,h=r?f:h*(.72+e()*.16)}const g=c.at(-1);if(g===void 0)return c;const S=g.y+g.height,m=g.width*g.taper,p=g.depth*g.taper;if(r&&e()<.45)i.antennas.push({x:g.x,y:S,z:g.z,height:t.height*(.12+e()*.1),radius:m*.12});else{const w=1+Math.floor(e()*3);for(let T=0;T<w;T+=1){const _=1.6+e()*Math.min(5,m*.3),b=1.6+e()*Math.min(5,p*.3),E=r?.5:1;i.roofUnits.push({x:g.x+(e()-.5)*(m-_-1.5)*E,y:S,z:g.z+(e()-.5)*(p-b-1.5)*E,width:_,height:1.2+e()*2.4,depth:b})}if(t.height>70&&e()<.55){const T=!r&&t.height>110&&e()<.35;i.antennas.push({x:g.x+(T?0:(e()-.5)*m*.5),y:S,z:g.z+(T?0:(e()-.5)*p*.5),height:T?18+e()*22:7+e()*16,radius:T?Math.min(m,p)*.09:.22})}}return i.tiers.push(...c),c}function ru(i,e){const t=Ig(i,i-e);if(t===void 0)return{length:e};const n=t+Ls;return i-n<8?{skipTo:t-Ls-1}:{length:i-n-.5}}function su(i,e,t){let n=Qt.start;for(;n>Qt.end+12;){const r=ru(n,Math.min(n-Qt.end,14+e()*13));if("skipTo"in r){n=r.skipTo;continue}const s=r.length,a=n-s/2,o=15+e()*13,l=e()*2.2,c=Lo+l,u=Math.max(0,Math.min(1,(40-a)/220)),f=t*(c+o/2),h=Do(26+e()**1.5*96+u*46,f,a,Math.max(o,s)/2,24),g=Is(i,e,{x:f,z:a,width:o,depth:s,height:h,storefront:!0})[0];if(g!==void 0&&a<160&&a>-150){const S=e()<.8?1+Math.floor(e()*2.4):0;for(let m=0;m<S;m+=1){const p=2.1+e()*.6,w=p*(3.7+e()*.5),T=5.5+e()*Math.max(0,Math.min(34,g.height-w-7));T+w>g.height-1||i.signs.push({x:t*(c-p/2-.35),y:T,z:a+(m-(S-1)/2)*Math.min(5,s/Math.max(1,S))+(e()-.5),width:p,height:w,slot:Math.floor(e()*Po)})}}if(g!==void 0&&h>46&&s>16&&e()<.42&&a<120){const S=Math.min(s-4,11+e()*9),m=S*(.5+e()*.12),p=Math.min(g.height-m/2-3,20+m/2+e()*26);p-m/2>12&&i.screens.push({x:t*(c-.45),y:p,z:a,width:S,height:m,yaw:-t*Math.PI/2,slot:Math.floor(e()*Ps)})}n-=s+(e()<.4?4+e()*5:1.2)}}function au(i,e,t){let n=Qt.start-10;for(;n>-300;){const r=ru(n,18+e()*14);if("skipTo"in r){n=r.skipTo;continue}const s=r.length,a=n-s/2,o=18+e()*16,l=Math.max(0,Math.min(1,(60-a)/300)),c=t*(44+e()*10+o/2),u=Do(50+e()**1.3*110+l*60,c,a,Math.max(o,s)/2,40),h=Is(i,e,{x:c,z:a,width:o,depth:s,height:u,storefront:!1}).at(-1);if(h!==void 0&&h.form===un.box&&a<-40&&e()<.35){const d=Math.min(h.width-2,12+e()*8),g=d*.48;i.screens.push({x:h.x,y:h.y+h.height+1.2+g/2,z:h.z+h.depth/2-1,width:d,height:g,yaw:0,slot:Math.floor(e()*Ps)})}n-=s+3+e()*6}}function Og(i,e){for(let t=-520;t<=520;t+=46)for(let n=-780;n<=200;n+=46){if(Math.abs(t)<96&&n>-320||Math.hypot(t-hn.x,n-hn.z)<90)continue;const r=1+Math.floor(e()*2.2);for(let s=0;s<r;s+=1){const a=12+e()*(r===1?20:12),o=12+e()*(r===1?20:12),l=t+(e()-.5)*(34-a),c=n+(e()-.5)*(34-o);if(Dg(l,c,Math.max(a,o)/2))continue;const u=Math.hypot(l-hn.x,c-hn.z),f=e()<.07?70+e()*110:0,h=16+e()**1.8*70+120*Math.exp(-((u/300)**2))+f,d=Do(h,l,c,Math.max(a,o)/2,14);Is(i,e,{x:l,z:c,width:a,depth:o,height:d,storefront:!1})}}}function Bg(i,e){for(let t=0;t<14;t+=1){const n=-Math.PI*.92+t/13*Math.PI*.84+(e()-.5)*.1,r=720+e()*420,s=70+e()*70;Is(i,e,{x:hn.x+Math.cos(n)*r,z:hn.z+Math.sin(n)*r,width:s,depth:s*(.7+e()*.5),height:260+e()*240,storefront:!1})}}function zg(i){const{x:e,z:t,deck:n}=hn,r=(s,a,o,l,c,u,f)=>({x:e,y:s,z:t,width:a,depth:a,height:o,seed:.618,facade:l,lit:.42,trim:c,storefront:!1,form:u,taper:f});i.tiers.push(r(0,72,22,cn.panel,Pt.crownBand,un.box,1),r(22,38,96,cn.hero,Pt.none,un.round,.9),r(118,31,22,cn.hero,Pt.crownBand,un.round,.9),r(140,25,n-140,cn.hero,Pt.crownBand,un.round,.96))}const Hg=[12,36,48,58,82,92,112,126,140],ou=4.6;function kg(i,e){const t=r=>i.tiers.filter(s=>s.storefront&&Math.sign(s.x)===r),n=[];for(const r of t(-1))for(const s of t(1)){const a=Math.min(r.z+r.depth/2,s.z+s.depth/2)-4,o=Math.max(r.z-r.depth/2,s.z-s.depth/2)+4,l=(a+o)/2;if(a-o<7||l>gi(0).position.z||n.some(h=>Math.abs(h-l)<26))continue;const c=Lg(l),u=Math.abs(l-Zt.z)<14,f=Hg.filter(h=>{const d=h+ou,g=(h+d)/2;if(c!==void 0&&!(h>c+14||d<c-18)||tu.some(w=>w>h-5&&w<d+5)||i.signs.some(w=>Math.abs(w.z-l)<4.5&&w.y<d+1&&w.y+w.height>h-1)||i.screens.some(w=>Math.abs(w.z-l)<w.width/2+3.5&&Math.abs(w.y-g)<w.height/2+3.5))return!1;const m=Zt.y-Zt.radius-4,p=Zt.y+Zt.radius+4;return!u||d<m||h>p});Rg(f,e);for(const h of f){const d=h+ou,g=[-1,1].map(p=>{const w=i.tiers.filter(T=>Math.sign(T.x)===p&&Math.abs(T.z-l)<T.depth/2-3&&T.y<h&&T.y+T.height>d+6).map(T=>Math.abs(T.x)-T.width/2);return w.length===0?void 0:p*(Math.min(...w)+1.5)}),[S,m]=g;if(!(S===void 0||m===void 0||m-S>Lo*2+10)){n.push(l),i.tiers.push({x:(S+m)/2,y:h,z:l,width:m-S,height:d-h,depth:6.5,seed:e(),facade:cn.glass,lit:.55,trim:Pt.none,storefront:!1,form:un.box,taper:1});break}}}}function Gg(){const i=Io(7382788),e={tiers:[],roofUnits:[],antennas:[],signs:[],screens:[]};return su(e,i,-1),su(e,i,1),au(e,i,-1),au(e,i,1),Og(e,i),Bg(e,i),zg(e),kg(e,i),e}const Vg=[[.05,.052,.06],[.42,.43,.45],[.3,.024,.028],[.012,.012,.014],[.03,.1,.18]],Wg=[[.4,.24,.04],[.19,.19,.2]];function Xg(){const i=Io(61925),e=[],t=(a,o,l,c,u,f,h)=>{const d=h===En.hauler?Wg:Vg;for(let g=0;g<c;g+=1)e.push({origin:a,directionX:o,directionZ:l,speed:f,span:u,kind:h,phase:(g+.15+i()*.6)*u/c,bob:i()*Math.PI*2,paint:d[Math.floor(i()*d.length)]??[.05,.05,.05]})},n=(Qt.start+Qt.end+30)/2,r=Qt.start-Qt.end+50;for(const a of tu)t({x:-nu,y:a,z:n},0,1,5,r,22+i()*6,En.spinner),t({x:nu,y:a+2.5,z:n},0,-1,5,r,18+i()*6,En.spinner);const s=[[Rr.north,[58,94],40],[Rr.south,[66,98,130],46],[Rr.rail,[60,110],void 0]];for(const[a,o,l]of s){for(const c of o)t({x:0,y:c,z:a+2.4},1,0,6,900,28+i()*8,En.spinner),t({x:0,y:c+3,z:a-2.4},-1,0,6,900,26+i()*8,En.spinner);l!==void 0&&(t({x:0,y:l,z:a+2},1,0,3,900,13,En.hauler),t({x:0,y:l+6,z:a-2},-1,0,3,900,12,En.hauler))}return e}function qg(){const i=Io(24301),e=[],t=(n,r,s,a,o,l)=>{const c=30+i()*14;for(let u=0;u<a;u+=1)e.push({origin:n,directionX:r,directionZ:s,speed:c,span:o,headlight:l,phase:(u+i()*.7)*o/a,bob:i()*Math.PI*2,trail:5+i()*6,radius:.45})};for(const[n,r]of[[-260,150],[-340,190],[-420,230],[260,165],[340,205],[420,250]])t({x:n,y:r,z:-300},0,1,9,900,!0),t({x:n+6,y:r+4,z:-300},0,-1,9,900,!1);for(const[n,r]of[[-380,150],[-540,290],[-660,330]])t({x:0,y:r,z:n},1,0,10,1100,!0),t({x:0,y:r+4,z:n-6},-1,0,10,1100,!1);return e}const fn=`
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
// Craft shrink and dim within 24 m of either loop end, where they wrap.
vec3 lanePlacement(vec4 lane, vec4 motion, float bob, out vec3 forward, out vec3 right, out float presence) {
  forward = vec3(motion.x, 0.0, motion.y);
  right = vec3(motion.y, 0.0, -motion.x);
  float halfSpan = 0.5 * motion.w;
  float travelled = mod(motion.z + uTime * lane.w, motion.w) - halfSpan;
  presence = smoothstep(0.0, 24.0, halfSpan - abs(travelled));
  return lane.xyz + forward * travelled + vec3(0.0, sin(uTime * 0.8 + bob) * 0.3, 0.0);
}
`,Yg=`
attribute vec3 aCenter;
attribute vec4 aSize;
attribute vec4 aStyle;
attribute float aStorefront;
flat varying vec4 vStyle;
flat varying vec4 vSize;
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
  vTier = vec2(aCenter.y, aStorefront);
  vWorld = world;
  vLocal = local;
  vNormal = normalize(surfaceNormal);
  gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
}
`,Kg=`
${fn}
flat varying vec4 vStyle;
flat varying vec4 vSize;
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
  return mix(mix(vec3(0.018), window, glassMask), signLight, band) + strip;
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
  float u = (atan(vLocal.z / vSize.z, vLocal.x / vSize.x) + PI) * radius;
  float faceId = 0.0;
  #else
  float faceWidth = abs(normal.x) > 0.5 ? vSize.z : vSize.x;
  float u = dot(vLocal, tangent) + faceWidth * 0.5;
  float faceId = dot(floor(normal + 0.5), vec3(1.0, 0.0, 2.0)) + 3.0;
  #endif
  float y = vWorld.y;
  bool office = facade != 1;
  bool warm = hash11(seed * 41.3) < 0.55;

  float floorHeight = 3.3 + 0.8 * hash11(seed * 71.3 + 0.17);
  float targetCell = facade == 1 ? 2.1 + 0.9 * hash11(seed * 13.7) : 1.45 + 0.55 * hash11(seed * 29.3);
  float cellWidth = faceWidth / max(1.0, floor(faceWidth / targetCell + 0.5));
  vec2 coord = vec2(u / cellWidth, y / floorHeight);
  vec2 cell = floor(coord);
  vec2 cellUv = fract(coord);
  vec2 pixel = max(fwidth(coord), vec2(1e-5));
  float detail = smoothstep(1.8, 5.5, 1.0 / max(pixel.x, pixel.y));

  vec4 window = facade == 1 ? vec4(0.2, 0.3, 0.8, 0.82)
    : facade == 2 ? vec4(0.0, 0.4, 1.0, 0.9)
    : facade == 3 ? vec4(0.05, 0.16, 0.95, 0.97)
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

  vec3 reflected = reflect(view, normal);
  float cosine = clamp(-dot(view, normal), 0.0, 1.0);
  float f0 = facade == 1 ? 0.04 : 0.1;
  float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosine, 5.0);
  vec3 glassTint = hash11(seed * 3.3) < 0.5 ? vec3(0.72, 0.84, 1.0) : vec3(1.0, 0.84, 0.7);
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
  } else {
    albedo = vec3(0.018, 0.02, 0.026);
    sheen = 0.45;
  }
  float avenue = step(0.5, -normal.x * sign(vWorld.x)) * (1.0 - smoothstep(26.0, 70.0, abs(vWorld.x))) * step(-205.0, vWorld.z);
  vec3 neon = mix(vec3(1.0, 0.08, 0.1), vec3(0.1, 0.65, 1.0), smoothstep(0.35, 0.65, valueNoise(vec2(vWorld.z * 0.05, seed * 9.0))));
  vec3 spill = neon * 0.9 * exp(-max(y - 2.0, 0.0) / 14.0) * avenue;
  vec3 structure = albedo * (cityAmbient(normal, y) + spill + holoLight(vWorld, normal))
    + sky * (0.04 + 0.5 * pow(1.0 - cosine, 5.0)) * sheen;

  vec3 averageTint = warm ? vec3(1.0, 0.62, 0.34) : vec3(0.74, 0.86, 1.0);
  vec3 averageGlass = averageTint * litRatio * 0.13 * (1.0 - fresnel) + sky * fresnel;
  vec3 color = mix(structure, averageGlass, windowArea);
  float sharp = detail * uDetail;
  if (sharp > 0.0) {
    vec3 light = roomLight(warm, zoneTone, roomHash);
    float roomDepth = cellWidth * 1.25 + 1.6;
    vec3 roomDirection = vec3(dot(view, tangent) / (0.5 * cellWidth), view.y / (0.5 * floorHeight), -dot(view, normal) / (0.5 * roomDepth));
    vec3 room = roomRadiance(cellUv, roomDirection, light, lit, roomHash);
    float blindHash = hash13(vec3(cell.yx, seed * 7.0 + faceId + 3.0));
    float blindLevel = mix(window.y, window.w, 0.2 + 0.7 * fract(blindHash * 7.31));
    float blinds = step(blindHash, 0.16) * smoothstep(blindLevel - pixel.y, blindLevel + pixel.y, cellUv.y);
    float slats = mix(1.0, 0.72 + 0.28 * step(0.35, fract(cellUv.y * floorHeight * 5.0)), smoothstep(40.0, 80.0, 1.0 / pixel.y));
    room = mix(room, mix(vec3(0.008), light * (0.18 + 0.3 * cellUv.y), lit) * slats, blinds);
    vec3 glass = room * (1.0 - fresnel) + sky * fresnel;
    // Wide glazing splits into two panes.
    float pane = office && cellWidth > 1.4 ? lineCoverage(cellUv.x - 0.5, 0.012, pixel.x) : 0.0;
    color = mix(color, mix(structure, glass, windowMask * (1.0 - pane)), sharp);
  }

  float pixelU = max(fwidth(u), 1e-4);
  float pixelY = max(fwidth(y), 1e-4);
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

vec3 roofRadiance() {
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
  if (normal.y > 0.5) color = roofRadiance();
  else if (normal.y < -0.5) color = soffitRadiance();
  else color = wallRadiance(normal, view);
  gl_FragColor = vec4(applyHaze(color, vWorld), 1.0);
}
`,Zg=`
uniform mat4 textureMatrix;
varying vec4 vReflection;
varying vec3 vWorld;

void main() {
  vReflection = textureMatrix * vec4(position, 1.0);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,$g=`
${fn}
uniform vec3 color;
uniform sampler2D tDiffuse;
uniform vec4 uStreet;
uniform vec2 uAvenue;
varying vec4 vReflection;
varying vec3 vWorld;

void main() {
  vec3 p = vWorld;
  vec3 view = normalize(p - cameraPosition);
  float across = abs(p.x);
  vec2 pixel = max(fwidth(p.xz), vec2(1e-4));
  float onAvenue = step(uAvenue.y, p.z) * step(p.z, uAvenue.x);
  float frontage = uStreet.w;
  float sidewalk = onAvenue * smoothstep(10.0 - pixel.x, 10.0 + pixel.x, across);

  float puddle = smoothstep(0.5, 0.62, fbm(p.xz * 0.045 + vec2(3.1, 7.7), 4));
  float grainDetail = 1.0 - smoothstep(0.2, 0.8, max(pixel.x, pixel.y) * 1.2);
  float grain = mix(0.5, fbm(p.xz * 1.2, 3), grainDetail);
  float wet = mix(0.45, 1.0, puddle) * (1.0 - 0.4 * sidewalk);
  float roughness = mix(0.5, 0.03, puddle);

  vec2 ripple = vec2(valueNoise(p.xz * 1.6 + uTime * 0.25), valueNoise(p.xz * 1.6 + 9.2 - uTime * 0.25)) - 0.5;
  vec2 uv = vReflection.xy / vReflection.w + ripple * 0.005 * (1.0 - 0.7 * puddle) * grainDetail;
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
  float dash = smoothstep(0.0, pixel.y / 9.0 + 0.002, 0.42 - fract(p.z / 9.0));
  float lanes = (lineCoverage(across - 3.35, 0.08, pixel.x) + lineCoverage(across - 6.75, 0.08, pixel.x)) * dash
    + lineCoverage(across - 9.55, 0.09, pixel.x);
  float centre = lineCoverage(across - 0.22, 0.06, pixel.x);
  float wear = smoothstep(0.25, 0.6, valueNoise(p.xz * vec2(2.0, 0.4)));
  float curb = lineCoverage(across - 10.0, 0.08, pixel.x);
  float tiles = sidewalk * gridLine(p.z, 1.5, 0.02, pixel.y) * grainDetail;
  albedo = mix(albedo, vec3(0.42), lanes * onAvenue * wear);
  albedo = mix(albedo, vec3(0.5, 0.36, 0.08), centre * onAvenue * wear);
  albedo = mix(albedo, vec3(0.12), curb * onAvenue);
  albedo *= 1.0 - 0.35 * tiles;
  float paint = clamp(lanes + centre, 0.0, 1.0) * onAvenue;

  vec3 light = vec3(0.3, 0.08, 0.1);
  float lampZ = p.z - uStreet.y * floor(p.z / uStreet.y + 0.5);
  float lampX = across - uStreet.x;
  light += vec3(1.0, 0.72, 0.46) * 2.6 * exp(-(lampX * lampX + lampZ * lampZ) / 32.0) * onAvenue;
  vec3 neon = mix(vec3(1.0, 0.08, 0.1), vec3(0.1, 0.65, 1.0), smoothstep(0.35, 0.65, valueNoise(vec2(p.z * 0.05, sign(p.x) * 4.0))));
  light += neon * 1.6 * exp(-max(frontage - across, 0.0) / 2.8) * step(across, frontage) * onAvenue;
  light += holoLight(p, vec3(0.0, 1.0, 0.0));

  float shine = wet * (1.0 - 0.6 * paint);
  vec3 radiance = albedo * light * (1.0 - 0.5 * shine) + reflection * color * fresnel * shine;
  float guideDash = step(0.5, fract(p.z / 4.0));
  radiance += vec3(0.1, 0.75, 1.0) * 1.1 * lineCoverage(p.x, 0.05, pixel.x) * guideDash * onAvenue;
  gl_FragColor = vec4(applyHaze(radiance, p), 1.0);
}
`,Jg=`
varying vec3 vDirection;

void main() {
  vDirection = position;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}
`,Qg=`
${fn}
varying vec3 vDirection;

void main() {
  gl_FragColor = vec4(skyRadiance(cameraPosition, normalize(vDirection), uDetail > 0.5 ? 5 : 2), 1.0);
}
`,jg=`
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
`,ev=`
${fn}
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
`,tv=`
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
`,nv=`
${fn}
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
`,Ds=`
${fn}
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
`,iv=`
${Ds}
uniform vec3 uLightOffset;
attribute vec3 aHead;
attribute vec4 aLight;

void main() {
  vec3 head = aHead + uLightOffset;
  emitSegment(head, head, aLight.w, 2.2, aLight.rgb);
}
`,rv=`
${Ds}
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
`,sv=`
${Ds}
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
`,av=`
${Ds}
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
`,ov=`
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
`,lv=`
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
`,cv=`
${fn}
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
`,uv=`
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
`,lu=1.22,hv=`
${fn}
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
  float front = uIgnite * ${lu.toFixed(2)};
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
`,fv=`
varying vec3 vWorld;
varying vec3 vNormal;

void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`,dv=`
${fn}
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
  float longitude = atan(-normal.z, -normal.x);
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
  float angle = atan(-normal.z, -normal.x);
  float strips = gridLine(angle, 2.0 * PI / 3.0, 0.07, max(fwidth(angle), 1e-4));
  float rings = gridLine(vWorld.y, 18.0, 0.22, max(fwidth(vWorld.y), 1e-4));
  color = metal(normal, view, vec3(0.06, 0.058, 0.064), 0.55) + LED_CYAN * 0.85 * strips + PEARL_PINK * 1.0 * rings;
  #elif defined(TWIST)
  vec2 offset = vWorld.xz - uAxis;
  float angle = atan(-offset.y, -offset.x) - uTwistRate * vWorld.y;
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
`,No=`
${fn}
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
`,Uo=`
${fn}
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
`,Cr=Gt;class Fo extends Mo{constructor(e){super(e),this.defaultDPI=90,this.defaultUnit="px"}load(e,t,n,r){const s=this,a=new td(s.manager);a.setPath(s.path),a.setRequestHeader(s.requestHeader),a.setWithCredentials(s.withCredentials),a.load(e,function(o){try{t(s.parse(o))}catch(l){r?r(l):console.error(l),s.manager.itemError(e)}},n,r)}parse(e){const t=this;function n(D,L){if(D.nodeType!==1)return;D.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");const C=b(D);let B=!1,ne=null;switch(D.nodeName){case"svg":L=S(D,L);break;case"style":s(D);break;case"g":L=S(D,L);break;case"path":L=S(D,L),D.hasAttribute("d")&&(ne=r(D));break;case"rect":L=S(D,L),ne=l(D);break;case"polygon":L=S(D,L),ne=c(D);break;case"polyline":L=S(D,L),ne=u(D);break;case"circle":L=S(D,L),ne=f(D);break;case"ellipse":L=S(D,L),ne=h(D);break;case"line":L=S(D,L),ne=d(D);break;case"defs":B=!0;break;case"use":L=S(D,L);const k=(D.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),F=D.viewportElement.getElementById(k);F?n(F,L):console.warn("SVGLoader: 'use node' references non-existent node id: "+k);break}if(ne){L.fill!==void 0&&L.fill!=="none"&&!L.fill.startsWith("url")&&ne.color.setStyle(L.fill,Cr),x(ne,De),Y.push(ne);const R=Object.assign({},L);R.strokeWidth=L.strokeWidth*J(De),ne.userData={node:D,style:R,transform:De.clone(),gradients:$}}const ge=D.childNodes;for(let R=0;R<ge.length;R++){const k=ge[R];B&&k.nodeName!=="style"&&k.nodeName!=="defs"||n(k,L)}C&&(Z.pop(),Z.length>0?De.copy(Z[Z.length-1]):De.identity())}function r(D){const L=new fi,C=new ae,B=new ae,ne=new ae;let ge=!0,R=!1;const k=D.getAttribute("d");if(k===""||k==="none")return null;const F=k.match(/[a-df-z][^a-df-z]*/ig);for(let K=0,Q=F.length;K<Q;K++){const ce=F[K],ve=ce.charAt(0),me=ce.slice(1).trim();ge===!0&&(R=!0,ge=!1);let q;switch(ve){case"M":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=2)C.x=q[M+0],C.y=q[M+1],B.x=C.x,B.y=C.y,M===0?L.moveTo(C.x,C.y):L.lineTo(C.x,C.y),M===0&&ne.copy(C);break;case"H":q=p(me);for(let M=0,Ae=q.length;M<Ae;M++)C.x=q[M],B.x=C.x,B.y=C.y,L.lineTo(C.x,C.y),M===0&&R===!0&&ne.copy(C);break;case"V":q=p(me);for(let M=0,Ae=q.length;M<Ae;M++)C.y=q[M],B.x=C.x,B.y=C.y,L.lineTo(C.x,C.y),M===0&&R===!0&&ne.copy(C);break;case"L":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=2)C.x=q[M+0],C.y=q[M+1],B.x=C.x,B.y=C.y,L.lineTo(C.x,C.y),M===0&&R===!0&&ne.copy(C);break;case"C":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=6)L.bezierCurveTo(q[M+0],q[M+1],q[M+2],q[M+3],q[M+4],q[M+5]),B.x=q[M+2],B.y=q[M+3],C.x=q[M+4],C.y=q[M+5],M===0&&R===!0&&ne.copy(C);break;case"S":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=4)L.bezierCurveTo(m(C.x,B.x),m(C.y,B.y),q[M+0],q[M+1],q[M+2],q[M+3]),B.x=q[M+0],B.y=q[M+1],C.x=q[M+2],C.y=q[M+3],M===0&&R===!0&&ne.copy(C);break;case"Q":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=4)L.quadraticCurveTo(q[M+0],q[M+1],q[M+2],q[M+3]),B.x=q[M+0],B.y=q[M+1],C.x=q[M+2],C.y=q[M+3],M===0&&R===!0&&ne.copy(C);break;case"T":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=2){const Fe=m(C.x,B.x),P=m(C.y,B.y);L.quadraticCurveTo(Fe,P,q[M+0],q[M+1]),B.x=Fe,B.y=P,C.x=q[M+0],C.y=q[M+1],M===0&&R===!0&&ne.copy(C)}break;case"A":q=p(me,[3,4],7);for(let M=0,Ae=q.length;M<Ae;M+=7){if(q[M+5]==C.x&&q[M+6]==C.y)continue;const Fe=C.clone();C.x=q[M+5],C.y=q[M+6],B.x=C.x,B.y=C.y,a(L,q[M],q[M+1],q[M+2],q[M+3],q[M+4],Fe,C),M===0&&R===!0&&ne.copy(C)}break;case"m":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=2)C.x+=q[M+0],C.y+=q[M+1],B.x=C.x,B.y=C.y,M===0?L.moveTo(C.x,C.y):L.lineTo(C.x,C.y),M===0&&ne.copy(C);break;case"h":q=p(me);for(let M=0,Ae=q.length;M<Ae;M++)C.x+=q[M],B.x=C.x,B.y=C.y,L.lineTo(C.x,C.y),M===0&&R===!0&&ne.copy(C);break;case"v":q=p(me);for(let M=0,Ae=q.length;M<Ae;M++)C.y+=q[M],B.x=C.x,B.y=C.y,L.lineTo(C.x,C.y),M===0&&R===!0&&ne.copy(C);break;case"l":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=2)C.x+=q[M+0],C.y+=q[M+1],B.x=C.x,B.y=C.y,L.lineTo(C.x,C.y),M===0&&R===!0&&ne.copy(C);break;case"c":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=6)L.bezierCurveTo(C.x+q[M+0],C.y+q[M+1],C.x+q[M+2],C.y+q[M+3],C.x+q[M+4],C.y+q[M+5]),B.x=C.x+q[M+2],B.y=C.y+q[M+3],C.x+=q[M+4],C.y+=q[M+5],M===0&&R===!0&&ne.copy(C);break;case"s":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=4)L.bezierCurveTo(m(C.x,B.x),m(C.y,B.y),C.x+q[M+0],C.y+q[M+1],C.x+q[M+2],C.y+q[M+3]),B.x=C.x+q[M+0],B.y=C.y+q[M+1],C.x+=q[M+2],C.y+=q[M+3],M===0&&R===!0&&ne.copy(C);break;case"q":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=4)L.quadraticCurveTo(C.x+q[M+0],C.y+q[M+1],C.x+q[M+2],C.y+q[M+3]),B.x=C.x+q[M+0],B.y=C.y+q[M+1],C.x+=q[M+2],C.y+=q[M+3],M===0&&R===!0&&ne.copy(C);break;case"t":q=p(me);for(let M=0,Ae=q.length;M<Ae;M+=2){const Fe=m(C.x,B.x),P=m(C.y,B.y);L.quadraticCurveTo(Fe,P,C.x+q[M+0],C.y+q[M+1]),B.x=Fe,B.y=P,C.x=C.x+q[M+0],C.y=C.y+q[M+1],M===0&&R===!0&&ne.copy(C)}break;case"a":q=p(me,[3,4],7);for(let M=0,Ae=q.length;M<Ae;M+=7){if(q[M+5]==0&&q[M+6]==0)continue;const Fe=C.clone();C.x+=q[M+5],C.y+=q[M+6],B.x=C.x,B.y=C.y,a(L,q[M],q[M+1],q[M+2],q[M+3],q[M+4],Fe,C),M===0&&R===!0&&ne.copy(C)}break;case"Z":case"z":L.currentPath.autoClose=!0,L.currentPath.curves.length>0&&(C.copy(ne),L.currentPath.currentPoint.copy(C),ge=!0);break;default:console.warn(ce)}R=!1}return L}function s(D){if(!(!D.sheet||!D.sheet.cssRules||!D.sheet.cssRules.length))for(let L=0;L<D.sheet.cssRules.length;L++){const C=D.sheet.cssRules[L];if(C.type!==1)continue;const B=C.selectorText.split(/,/gm).filter(Boolean).map(ne=>ne.trim());for(let ne=0;ne<B.length;ne++){const ge=Object.fromEntries(Object.entries(C.style).filter(([,R])=>R!==""));re[B[ne]]=Object.assign(re[B[ne]]||{},ge)}}}function a(D,L,C,B,ne,ge,R,k){if(L==0||C==0){D.lineTo(k.x,k.y);return}B=B*Math.PI/180,L=Math.abs(L),C=Math.abs(C);const F=(R.x-k.x)/2,K=(R.y-k.y)/2,Q=Math.cos(B)*F+Math.sin(B)*K,ce=-Math.sin(B)*F+Math.cos(B)*K;let ve=L*L,me=C*C;const q=Q*Q,M=ce*ce,Ae=q/ve+M/me;if(Ae>1){const fe=Math.sqrt(Ae);L=fe*L,C=fe*C,ve=L*L,me=C*C}const Fe=ve*M+me*q,P=(ve*me-Fe)/Fe;let v=Math.sqrt(Math.max(0,P));ne===ge&&(v=-v);const X=v*L*ce/C,j=-v*C*Q/L,le=Math.cos(B)*X-Math.sin(B)*j+(R.x+k.x)/2,_e=Math.sin(B)*X+Math.cos(B)*j+(R.y+k.y)/2,Me=o(1,0,(Q-X)/L,(ce-j)/C),ue=o((Q-X)/L,(ce-j)/C,(-Q-X)/L,(-ce-j)/C)%(Math.PI*2);D.currentPath.absellipse(le,_e,L,C,Me,Me+ue,ge===0,B)}function o(D,L,C,B){const ne=D*C+L*B,ge=Math.sqrt(D*D+L*L)*Math.sqrt(C*C+B*B);let R=Math.acos(Math.max(-1,Math.min(1,ne/ge)));return D*B-L*C<0&&(R=-R),R}function l(D){const L=_(D.getAttribute("x")||0),C=_(D.getAttribute("y")||0),B=_(D.getAttribute("rx")||D.getAttribute("ry")||0),ne=_(D.getAttribute("ry")||D.getAttribute("rx")||0),ge=_(D.getAttribute("width")),R=_(D.getAttribute("height")),k=1-.551915024494,F=new fi;return F.moveTo(L+B,C),F.lineTo(L+ge-B,C),(B!==0||ne!==0)&&F.bezierCurveTo(L+ge-B*k,C,L+ge,C+ne*k,L+ge,C+ne),F.lineTo(L+ge,C+R-ne),(B!==0||ne!==0)&&F.bezierCurveTo(L+ge,C+R-ne*k,L+ge-B*k,C+R,L+ge-B,C+R),F.lineTo(L+B,C+R),(B!==0||ne!==0)&&F.bezierCurveTo(L+B*k,C+R,L,C+R-ne*k,L,C+R-ne),F.lineTo(L,C+ne),(B!==0||ne!==0)&&F.bezierCurveTo(L,C+ne*k,L+B*k,C,L+B,C),F}function c(D){function L(ge,R,k){const F=_(R),K=_(k);ne===0?B.moveTo(F,K):B.lineTo(F,K),ne++}const C=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,B=new fi;let ne=0;return D.getAttribute("points").replace(C,L),B.currentPath.autoClose=!0,B}function u(D){function L(ge,R,k){const F=_(R),K=_(k);ne===0?B.moveTo(F,K):B.lineTo(F,K),ne++}const C=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,B=new fi;let ne=0;return D.getAttribute("points").replace(C,L),B.currentPath.autoClose=!1,B}function f(D){const L=_(D.getAttribute("cx")||0),C=_(D.getAttribute("cy")||0),B=_(D.getAttribute("r")||0),ne=new ui;ne.absarc(L,C,B,0,Math.PI*2);const ge=new fi;return ge.subPaths.push(ne),ge}function h(D){const L=_(D.getAttribute("cx")||0),C=_(D.getAttribute("cy")||0),B=_(D.getAttribute("rx")||0),ne=_(D.getAttribute("ry")||0),ge=new ui;ge.absellipse(L,C,B,ne,0,Math.PI*2);const R=new fi;return R.subPaths.push(ge),R}function d(D){const L=_(D.getAttribute("x1")||0),C=_(D.getAttribute("y1")||0),B=_(D.getAttribute("x2")||0),ne=_(D.getAttribute("y2")||0),ge=new fi;return ge.moveTo(L,C),ge.lineTo(B,ne),ge.currentPath.autoClose=!1,ge}function g(D){const L="http://www.w3.org/1999/xlink",C=D.querySelectorAll("linearGradient, radialGradient"),B=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],ne={};for(const R of C){const k=R.getAttribute("id");if(!k)continue;const F={type:R.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},K=R.getAttributeNS(L,"href")||R.getAttribute("href")||"";K.startsWith("#")&&(F.href=K.substring(1));for(const ce of B)R.hasAttribute(ce)&&(F.attrs[ce]=R.getAttribute(ce));const Q=R.querySelectorAll("stop");if(Q.length>0){F.stops=[];for(const ce of Q){let ve=ce.getAttribute("stop-color");!ve&&ce.style&&(ve=ce.style["stop-color"]),ve||(ve="#000");let me=ce.getAttribute("stop-opacity");(me===null||me==="")&&ce.style&&(me=ce.style["stop-opacity"]),me=me===null||me===""||me===void 0?1:Math.max(0,Math.min(1,parseFloat(me)));const q=Math.max(0,Math.min(1,parseFloat(ce.getAttribute("offset")||"0")));F.stops.push({offset:q,color:ve,opacity:me})}}ne[k]=F}function ge(R,k){const F=ne[R];if(!F||k.has(R))return F;if(k.add(R),F.href&&ne[F.href]){const K=ge(F.href,k);if(K){F.stops||(F.stops=K.stops);for(const Q in K.attrs)Q in F.attrs||(F.attrs[Q]=K.attrs[Q])}}return F}for(const R in ne)ge(R,new Set);for(const R in ne){let ce=function(ve){return typeof ve!="string"?0:ve.endsWith("%")?parseFloat(ve)/100:_(ve)};const k=ne[R],F=k.attrs,K=F.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",Q={type:k.type,gradientUnits:K,spreadMethod:F.spreadMethod==="reflect"||F.spreadMethod==="repeat"?F.spreadMethod:"pad",gradientTransform:null,stops:(k.stops||[]).slice().sort((ve,me)=>ve.offset-me.offset)};if(F.gradientTransform&&(Q.gradientTransform=new Xe,I(F.gradientTransform,Q.gradientTransform)),k.type==="linearGradient")Q.x1=F.x1!==void 0?ce(F.x1):0,Q.y1=F.y1!==void 0?ce(F.y1):0,Q.x2=F.x2!==void 0?ce(F.x2):K==="objectBoundingBox"?1:0,Q.y2=F.y2!==void 0?ce(F.y2):0;else{const ve=K==="objectBoundingBox"?.5:0,me=K==="objectBoundingBox"?.5:0;Q.cx=F.cx!==void 0?ce(F.cx):ve,Q.cy=F.cy!==void 0?ce(F.cy):ve,Q.r=F.r!==void 0?ce(F.r):me,Q.fx=F.fx!==void 0?ce(F.fx):Q.cx,Q.fy=F.fy!==void 0?ce(F.fy):Q.cy}$[R]=Q}}function S(D,L){L=Object.assign({},L);let C={};if(D.hasAttribute("class")){const R=D.getAttribute("class").split(/\s/).filter(Boolean).map(k=>k.trim());for(let k=0;k<R.length;k++)C=Object.assign(C,re["."+R[k]])}D.hasAttribute("id")&&(C=Object.assign(C,re["#"+D.getAttribute("id")]));function B(R,k,F){F===void 0&&(F=function(Q){return Q}),D.hasAttribute(R)&&(L[k]=F(D.getAttribute(R))),C[k]&&(L[k]=F(C[k])),D.style&&D.style[R]!==""&&(L[k]=F(D.style[R]))}function ne(R){return Math.max(0,Math.min(1,_(R)))}function ge(R){return Math.max(0,_(R))}return B("fill","fill"),B("fill-opacity","fillOpacity",ne),B("fill-rule","fillRule"),B("opacity","opacity",ne),B("stroke","stroke"),B("stroke-opacity","strokeOpacity",ne),B("stroke-width","strokeWidth",ge),B("stroke-linejoin","strokeLineJoin"),B("stroke-linecap","strokeLineCap"),B("stroke-miterlimit","strokeMiterLimit",ge),B("visibility","visibility"),L}function m(D,L){return D-(L-D)}function p(D,L,C){if(typeof D!="string")throw new TypeError("Invalid input: "+typeof D);const B={WHITESPACE:/[ \t\r\n]/,DIGIT:/[\d]/,SIGN:/[-+]/,POINT:/\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},ne=0,ge=1,R=2,k=3;let F=ne,K=!0,Q="",ce="";const ve=[];function me(Fe,P,v){const X=new SyntaxError('Unexpected character "'+Fe+'" at index '+P+".");throw X.partial=v,X}function q(){Q!==""&&(ce===""?ve.push(Number(Q)):ve.push(Number(Q)*Math.pow(10,Number(ce)))),Q="",ce=""}let M;const Ae=D.length;for(let Fe=0;Fe<Ae;Fe++){if(M=D[Fe],Array.isArray(L)&&L.includes(ve.length%C)&&B.FLAGS.test(M)){F=ge,Q=M,q();continue}if(F===ne){if(B.WHITESPACE.test(M))continue;if(B.DIGIT.test(M)||B.SIGN.test(M)){F=ge,Q=M;continue}if(B.POINT.test(M)){F=R,Q=M;continue}B.COMMA.test(M)&&(K&&me(M,Fe,ve),K=!0)}if(F===ge){if(B.DIGIT.test(M)){Q+=M;continue}if(B.POINT.test(M)){Q+=M,F=R;continue}if(B.EXP.test(M)){F=k;continue}B.SIGN.test(M)&&Q.length===1&&B.SIGN.test(Q[0])&&me(M,Fe,ve)}if(F===R){if(B.DIGIT.test(M)){Q+=M;continue}if(B.EXP.test(M)){F=k;continue}B.POINT.test(M)&&Q[Q.length-1]==="."&&me(M,Fe,ve)}if(F===k){if(B.DIGIT.test(M)){ce+=M;continue}if(B.SIGN.test(M)){if(ce===""){ce+=M;continue}ce.length===1&&B.SIGN.test(ce)&&me(M,Fe,ve)}}B.WHITESPACE.test(M)?(q(),F=ne,K=!1):B.COMMA.test(M)?(q(),F=ne,K=!0):B.SIGN.test(M)?(q(),F=ge,Q=M):B.POINT.test(M)?(q(),F=R,Q=M):me(M,Fe,ve)}return q(),ve}const w=["mm","cm","in","pt","pc","px"],T={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function _(D){let L="px";if(typeof D=="string"||D instanceof String)for(let B=0,ne=w.length;B<ne;B++){const ge=w[B];if(D.endsWith(ge)){L=ge,D=D.substring(0,D.length-ge.length);break}}let C;return L==="px"&&t.defaultUnit!=="px"?C=T.in[t.defaultUnit]/t.defaultDPI:(C=T[L][t.defaultUnit],C<0&&(C=T[L].in*t.defaultDPI)),C*parseFloat(D)}function b(D){if(!(D.hasAttribute("transform")||D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))))return null;const L=E(D);return Z.length>0&&L.premultiply(Z[Z.length-1]),De.copy(L),Z.push(L),L}function E(D){const L=new Xe;if(D.nodeName==="use"&&(D.hasAttribute("x")||D.hasAttribute("y"))){const C=_(D.getAttribute("x")||0),B=_(D.getAttribute("y")||0);L.makeTranslation(C,B)}return D.hasAttribute("transform")&&I(D.getAttribute("transform"),L),L}function I(D,L){const C=ie,B=D.split(")");for(let ne=B.length-1;ne>=0;ne--){const ge=B[ne].trim();if(ge==="")continue;const R=ge.indexOf("("),k=ge.length;if(R>0&&R<k){const F=ge.slice(0,R),K=p(ge.slice(R+1));switch(C.identity(),F){case"translate":if(K.length>=1){const Q=K[0];let ce=0;K.length>=2&&(ce=K[1]),C.makeTranslation(Q,ce)}break;case"rotate":if(K.length>=1){let Q=0,ce=0,ve=0;Q=K[0]*Math.PI/180,K.length>=3&&(ce=K[1],ve=K[2]),se.makeTranslation(-ce,-ve),he.makeRotation(Q),Le.multiplyMatrices(he,se),se.makeTranslation(ce,ve),C.multiplyMatrices(se,Le)}break;case"scale":if(K.length>=1){const Q=K[0];let ce=Q;K.length>=2&&(ce=K[1]),C.makeScale(Q,ce)}break;case"skewX":K.length===1&&C.set(1,Math.tan(K[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":K.length===1&&C.set(1,0,0,Math.tan(K[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":K.length===6&&C.set(K[0],K[2],K[4],K[1],K[3],K[5],0,0,1);break}L.premultiply(C)}}return L}function x(D,L){function C(R){Ce.set(R.x,R.y,1).applyMatrix3(L),R.set(Ce.x,Ce.y)}function B(R){const k=R.xRadius,F=R.yRadius,K=Math.cos(R.aRotation),Q=Math.sin(R.aRotation),ce=new O(k*K,k*Q,0),ve=new O(-F*Q,F*K,0),me=ce.applyMatrix3(L),q=ve.applyMatrix3(L),M=ie.set(me.x,q.x,0,me.y,q.y,0,0,0,1),Ae=se.copy(M).invert(),v=he.copy(Ae).transpose().multiply(Ae).elements,X=H(v[0],v[1],v[4]),j=Math.sqrt(X.rt1),le=Math.sqrt(X.rt2);if(R.xRadius=1/j,R.yRadius=1/le,R.aRotation=Math.atan2(X.sn,X.cs),!((R.aEndAngle-R.aStartAngle)%(2*Math.PI)<Number.EPSILON)){const Me=se.set(j,0,0,0,le,0,0,0,1),ue=he.set(X.cs,X.sn,0,-X.sn,X.cs,0,0,0,1),fe=Me.multiply(ue).multiply(M),Se=ze=>{const{x:be,y:ye}=new O(Math.cos(ze),Math.sin(ze),0).applyMatrix3(fe);return Math.atan2(ye,be)};R.aStartAngle=Se(R.aStartAngle),R.aEndAngle=Se(R.aEndAngle),A(L)&&(R.aClockwise=!R.aClockwise)}}function ne(R){const k=G(L),F=z(L);R.xRadius*=k,R.yRadius*=F;const K=k>Number.EPSILON?Math.atan2(L.elements[1],L.elements[0]):Math.atan2(-L.elements[3],L.elements[4]);R.aRotation+=K,A(L)&&(R.aStartAngle*=-1,R.aEndAngle*=-1,R.aClockwise=!R.aClockwise)}const ge=D.subPaths;for(let R=0,k=ge.length;R<k;R++){const K=ge[R].curves;for(let Q=0;Q<K.length;Q++){const ce=K[Q];ce.isLineCurve?(C(ce.v1),C(ce.v2)):ce.isCubicBezierCurve?(C(ce.v0),C(ce.v1),C(ce.v2),C(ce.v3)):ce.isQuadraticBezierCurve?(C(ce.v0),C(ce.v1),C(ce.v2)):ce.isEllipseCurve&&(pe.set(ce.aX,ce.aY),C(pe),ce.aX=pe.x,ce.aY=pe.y,U(L)?B(ce):ne(ce))}}}function A(D){const L=D.elements;return L[0]*L[4]-L[1]*L[3]<0}function U(D){const L=D.elements,C=L[0]*L[3]+L[1]*L[4];if(C===0)return!1;const B=G(D),ne=z(D);return Math.abs(C/(B*ne))>Number.EPSILON}function G(D){const L=D.elements;return Math.sqrt(L[0]*L[0]+L[1]*L[1])}function z(D){const L=D.elements;return Math.sqrt(L[3]*L[3]+L[4]*L[4])}function J(D){const L=D.elements,C=L[0]*L[4]-L[1]*L[3];return Math.sqrt(Math.abs(C))}function H(D,L,C){let B,ne,ge,R,k;const F=D+C,K=D-C,Q=Math.sqrt(K*K+4*L*L);return F>0?(B=.5*(F+Q),k=1/B,ne=D*k*C-L*k*L):F<0?ne=.5*(F-Q):(B=.5*Q,ne=-.5*Q),K>0?ge=K+Q:ge=K-Q,Math.abs(ge)>2*Math.abs(L)?(k=-2*L/ge,R=1/Math.sqrt(1+k*k),ge=k*R):Math.abs(L)===0?(ge=1,R=0):(k=-.5*ge/L,ge=1/Math.sqrt(1+k*k),R=k*ge),K>0&&(k=ge,ge=-R,R=k),{rt1:B,rt2:ne,cs:ge,sn:R}}const Y=[],re={},$={},Z=[],ie=new Xe,se=new Xe,he=new Xe,Le=new Xe,pe=new ae,Ce=new O,De=new Xe,Ge=new DOMParser().parseFromString(e,"image/svg+xml");return g(Ge),n(Ge.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:Y,gradients:$,xml:Ge.documentElement}}static createFillMaterial(e){const t=e.userData.style;if(t.fill===void 0||t.fill==="none")return null;const n=e.color;let r=null;const s=cu.exec(t.fill);if(s){const o=e.userData.gradients&&e.userData.gradients[s[1]];r=pv(o,e)}const a=new fr({opacity:t.fillOpacity*(t.opacity||1),transparent:!0,side:$t,depthWrite:!1});return r!==null?a.map=r:a.color=n,a}static createStrokeMaterial(e){const t=e.userData.style;return t.stroke===void 0||t.stroke==="none"?null:(cu.test(t.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new fr({color:new Ke().setStyle(t.stroke,Cr),opacity:t.strokeOpacity*(t.opacity||1),transparent:!0,side:$t,depthWrite:!1}))}static createShapes(e){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),e.toShapes()}static getStrokeStyle(e,t,n,r,s){return e=e!==void 0?e:1,t=t!==void 0?t:"#000",n=n!==void 0?n:"miter",r=r!==void 0?r:"butt",s=s!==void 0?s:4,{strokeColor:t,strokeWidth:e,strokeLineJoin:n,strokeLineCap:r,strokeMiterLimit:s}}static pointsToStroke(e,t,n,r){const s=[],a=[],o=[];if(Fo.pointsToStrokeWithBuffers(e,t,n,r,s,a,o)===0)return null;const l=new yt;return l.setAttribute("position",new rt(s,3)),l.setAttribute("normal",new rt(a,3)),l.setAttribute("uv",new rt(o,2)),l}static pointsToStrokeWithBuffers(e,t,n,r,s,a,o,l){const c=new ae,u=new ae,f=new ae,h=new ae,d=new ae,g=new ae,S=new ae,m=new ae,p=new ae,w=new ae,T=new ae,_=new ae,b=new ae,E=new ae,I=new ae,x=new ae,A=new ae;n=n!==void 0?n:12,r=r!==void 0?r:.001,l=l!==void 0?l:0,e=ge(e);const U=e.length;if(U<2)return 0;const G=e[0].equals(e[U-1]);let z,J=e[0],H;const Y=t.strokeWidth/2,re=1/(U-1);let $=0,Z,ie,se,he,Le=!1,pe=0,Ce=l*3,De=l*2;Ge(e[0],e[1],c).multiplyScalar(Y),m.copy(e[0]).sub(c),p.copy(e[0]).add(c),w.copy(m),T.copy(p);for(let R=1;R<U;R++){z=e[R],R===U-1?G?H=e[1]:H=void 0:H=e[R+1];const k=c;if(Ge(J,z,k),f.copy(k).multiplyScalar(Y),_.copy(z).sub(f),b.copy(z).add(f),Z=$+re,ie=!1,H!==void 0){Ge(z,H,u),f.copy(u).multiplyScalar(Y),E.copy(z).sub(f),I.copy(z).add(f),se=!0,f.subVectors(H,J),k.dot(f)<0&&(se=!1),R===1&&(Le=se),f.subVectors(H,z),f.normalize();const F=Math.abs(k.dot(f));if(F>Number.EPSILON){const K=Y/F;f.multiplyScalar(-K),h.subVectors(z,J),d.copy(h).setLength(K).add(f),x.copy(d).negate();const Q=d.length(),ce=h.length();h.divideScalar(ce),g.subVectors(H,z);const ve=g.length();if(g.divideScalar(ve),h.dot(x)<ce&&g.dot(x)<ve&&(ie=!0),A.copy(d).add(z),x.add(z),ie){const me=se?p:m,q=(A.x-me.x)*(x.y-me.y)-(A.y-me.y)*(x.x-me.x);(se&&q<0||!se&&q>0)&&x.copy(me)}switch(he=!1,ie?se?(I.copy(x),b.copy(x)):(E.copy(x),_.copy(x)):L(),t.strokeLineJoin){case"bevel":C(se,ie,Z);break;case"round":B(se,ie),se?D(z,_,E,Z,0):D(z,I,b,Z,1);break;case"miter":case"miter-clip":default:const me=Y*t.strokeMiterLimit/Q;if(me<1)if(t.strokeLineJoin!=="miter-clip"){C(se,ie,Z);break}else B(se,ie),se?(g.subVectors(A,_).multiplyScalar(me).add(_),S.subVectors(A,E).multiplyScalar(me).add(E),N(_,Z,0),N(g,Z,0),N(z,Z,.5),N(z,Z,.5),N(g,Z,0),N(S,Z,0),N(z,Z,.5),N(S,Z,0),N(E,Z,0)):(g.subVectors(A,b).multiplyScalar(me).add(b),S.subVectors(A,I).multiplyScalar(me).add(I),N(b,Z,1),N(g,Z,1),N(z,Z,.5),N(z,Z,.5),N(g,Z,1),N(S,Z,1),N(z,Z,.5),N(S,Z,1),N(I,Z,1));else ie?(se?(N(p,$,1),N(m,$,0),N(A,Z,0),N(p,$,1),N(A,Z,0),N(x,Z,1)):(N(p,$,1),N(m,$,0),N(A,Z,1),N(m,$,0),N(x,Z,0),N(A,Z,1)),se?E.copy(A):I.copy(A)):se?(N(_,Z,0),N(A,Z,0),N(z,Z,.5),N(z,Z,.5),N(A,Z,0),N(E,Z,0)):(N(b,Z,1),N(A,Z,1),N(z,Z,.5),N(z,Z,.5),N(A,Z,1),N(I,Z,1)),he=!0;break}}else L()}else L();!G&&R===U-1&&ne(e[0],w,T,se,!0,$),$=Z,J=z,m.copy(E),p.copy(I)}if(!G)ne(z,_,b,se,!1,Z);else if(ie&&s){let R=A,k=x;Le!==se&&(R=x,k=A),se?(he||Le)&&(k.toArray(s,0),k.toArray(s,9),he&&R.toArray(s,3)):(he||!Le)&&(k.toArray(s,3),k.toArray(s,9),he&&R.toArray(s,0))}if(s){const R=[new ae,new ae,new ae],k=l*3;for(let F=k;F<Ce;F+=9)R[0].set(s[F],s[F+1]),R[1].set(s[F+3],s[F+4]),R[2].set(s[F+6],s[F+7]),Vn.area(R)<0&&(s[F+3]=R[0].x,s[F+4]=R[0].y)}return pe;function Ge(R,k,F){return F.subVectors(k,R),F.set(-F.y,F.x).normalize()}function N(R,k,F){s&&(s[Ce]=R.x,s[Ce+1]=R.y,s[Ce+2]=0,a&&(a[Ce]=0,a[Ce+1]=0,a[Ce+2]=1),Ce+=3,o&&(o[De]=k,o[De+1]=F,De+=2)),pe+=3}function D(R,k,F,K,Q){c.copy(k).sub(R).normalize(),u.copy(F).sub(R).normalize();let ce=Math.PI;const ve=c.dot(u);Math.abs(ve)<1&&(ce=Math.abs(Math.acos(ve))),ce/=n,f.copy(k);for(let me=0,q=n-1;me<q;me++)h.copy(f).rotateAround(R,ce),N(f,K,Q),N(h,K,Q),N(R,K,.5),f.copy(h);N(f,K,Q),N(F,K,Q),N(R,K,.5)}function L(){N(p,$,1),N(m,$,0),N(_,Z,0),N(p,$,1),N(_,Z,0),N(b,Z,1)}function C(R,k,F){k?R?(N(p,$,1),N(m,$,0),N(_,Z,0),N(p,$,1),N(_,Z,0),N(x,Z,1),N(_,F,0),N(E,F,0),N(x,F,.5)):(N(p,$,1),N(m,$,0),N(b,Z,1),N(m,$,0),N(x,Z,0),N(b,Z,1),N(b,F,1),N(x,F,0),N(I,F,1)):R?(N(_,F,0),N(E,F,0),N(z,F,.5)):(N(b,F,1),N(I,F,0),N(z,F,.5))}function B(R,k){k&&(R?(N(p,$,1),N(m,$,0),N(_,Z,0),N(p,$,1),N(_,Z,0),N(x,Z,1),N(_,$,0),N(z,Z,.5),N(x,Z,1),N(z,Z,.5),N(E,$,0),N(x,Z,1)):(N(p,$,1),N(m,$,0),N(b,Z,1),N(m,$,0),N(x,Z,0),N(b,Z,1),N(b,$,1),N(x,Z,0),N(z,Z,.5),N(z,Z,.5),N(x,Z,0),N(I,$,1)))}function ne(R,k,F,K,Q,ce){switch(t.strokeLineCap){case"round":Q?D(R,F,k,ce,.5):D(R,k,F,ce,.5);break;case"square":if(Q)c.subVectors(k,R),u.set(c.y,-c.x),f.addVectors(c,u).add(R),h.subVectors(u,c).add(R),K?(f.toArray(s,3),h.toArray(s,0),h.toArray(s,9)):(f.toArray(s,3),o[7]===1?h.toArray(s,9):f.toArray(s,9),h.toArray(s,0));else{c.subVectors(F,R),u.set(c.y,-c.x),f.addVectors(c,u).add(R),h.subVectors(u,c).add(R);const ve=s.length;K?(f.toArray(s,ve-3),h.toArray(s,ve-6),h.toArray(s,ve-12)):(h.toArray(s,ve-6),f.toArray(s,ve-3),h.toArray(s,ve-12))}break}}function ge(R){let k=!1;for(let K=1,Q=R.length-1;K<Q;K++)if(R[K].distanceTo(R[K+1])<r){k=!0;break}if(!k)return R;const F=[];F.push(R[0]);for(let K=1,Q=R.length-1;K<Q;K++)R[K].distanceTo(R[K+1])>=r&&F.push(R[K]);return F.push(R[R.length-1]),F}}}const cu=/^\s*url\(\s*(?:["']\s*)?#([^)'"\s]+)(?:\s*["'])?\s*\)\s*$/;function pv(i,e,t=256){if(!i||!Array.isArray(i.stops)||i.stops.length===0)return null;const n=e.userData.transform,r=i.gradientUnits==="objectBoundingBox";let s=null;if(r&&(s=mv(e,n),s===null))return null;function a(f,h,d){d.set(f,h,1),i.gradientTransform&&d.applyMatrix3(i.gradientTransform),r&&d.set(s.minX+d.x*s.width,s.minY+d.y*s.height,1),n&&d.applyMatrix3(n)}const o=document.createElement("canvas");let l;if(i.type==="linearGradient"){o.width=t,o.height=1;const f=o.getContext("2d"),h=f.createLinearGradient(0,0,t,0);uu(h,i.stops),f.fillStyle=h,f.fillRect(0,0,t,1);const d=new O,g=new O;a(i.x1,i.y1,d),a(i.x2,i.y2,g);const S=g.x-d.x,m=g.y-d.y,p=S*S+m*m||1e-20,w=S/p,T=m/p,_=-(w*d.x+T*d.y);l=new Xe().set(w,T,_,0,0,.5,0,0,1)}else{let f=i.cx,h=i.cy,d=i.fx,g=i.fy,S=i.r;if(i.gradientTransform){const x=new O;x.set(f,h,1).applyMatrix3(i.gradientTransform),f=x.x,h=x.y,x.set(d,g,1).applyMatrix3(i.gradientTransform),d=x.x,g=x.y}if(r&&(f=s.minX+f*s.width,h=s.minY+h*s.height,d=s.minX+d*s.width,g=s.minY+g*s.height,S=S*Math.sqrt((s.width*s.width+s.height*s.height)/2)),S<=0)return null;o.width=t,o.height=t;const m=o.getContext("2d"),p=f-S,w=h-S,T=2*S,_=t/T;m.setTransform(_,0,0,_,-p*_,-w*_);const b=m.createRadialGradient(d,g,0,f,h,S);uu(b,i.stops),m.fillStyle=b,m.fillRect(p,w,T,T);const E=n?n.clone().invert():new Xe;l=new Xe().set(1/T,0,-p/T,0,1/T,-w/T,0,0,1).multiply(E)}const c=new co(o);c.colorSpace=Cr,c.flipY=!1,c.matrixAutoUpdate=!1,c.matrix=l;const u=i.spreadMethod==="reflect"?zr:i.spreadMethod==="repeat"?Br:vn;return c.wrapS=u,c.wrapT=u,c}function mv(i,e){const t=e?e.clone().invert():null,n=new ae,r=new yc;for(const s of i.subPaths)for(const a of s.getPoints())n.copy(a),t&&n.applyMatrix3(t),r.expandByPoint(n);return r.isEmpty()?null:{minX:r.min.x,minY:r.min.y,width:r.max.x-r.min.x,height:r.max.y-r.min.y}}function uu(i,e){const t=new Ke;for(const n of e){let r=n.color;if(n.opacity<1){t.setStyle(n.color,Cr);const s=/rgb\(([^)]+)\)/.exec(t.getStyle(Cr));s&&(r=`rgba(${s[1]},${n.opacity})`)}i.addColorStop(Math.max(0,Math.min(1,n.offset)),r)}}const Oo={width:64,height:64},hu="M32.3 17.92q.54-.07 1.03.17c.42.21.65.58.73.96q.1.54-.1 1.02l-.18.74a13 13 0 0 1 7.57 3.76l.1.11q3.79-.23 7.58.01l1 .09q3.45.33 5.44 1.22c1.52.68 2.48 1.67 2.62 3 .15 1.48-.71 3.05-2.3 4.63a28 28 0 0 1-5.93 4.31A53 53 0 0 1 43 41.2v.01l-.03.01q-.72 1.09-1.63 2.01a12.9 12.9 0 0 1-16.19 1.83c-2.67.28-5.55.5-8.23.5h-.08c-2.8 0-5.12-.23-6.85-.7-2.08-.56-3.51-1.53-3.95-3q-.43-1.5.43-3.05l.11-.2c.6-.98 1.53-1.9 2.6-2.75 1.17-.9 2.52-1.73 3.88-2.46a42 42 0 0 1 6.44-2.8 13 13 0 0 1 4-6.59l-.58-.41v-.01h-.01a1.7 1.7 0 0 1-.66-1.67c.06-.44.3-.75.62-.94.3-.18.65-.24.96-.22h.09l1.95.3.6-1.52c.02-.07.1-.27.27-.48s.46-.48.89-.54h.01a1.5 1.5 0 0 1 1.24.4l.93.83 1.52-1.38q.41-.37.97-.44m7.33 24.48a48 48 0 0 1-6.28 1.54c-1.3.22-3 .48-4.95.73a11.1 11.1 0 0 0 11.23-2.27m9.28-15.92q-3.01-.2-6.02-.07.51.75.92 1.59c1.08.1 1.94.47 2.25 1.32.25.68-.01 1.36-.29 1.84-.22.39-.5.72-.72.96v.01l-.18.18-.14.13-.2.21-.72.76v-.06l-.37.34-.01-.05c-2.28 1.84-5.57 3.37-9.46 4.4a36 36 0 0 1-11.83 1.23l.01.02-.43-.06v.02l-.5-.09.02.04-.7-.15h-.01l-.2-.05-.15-.03-.1-.02q-.9-.22-1.5-.59a2 2 0 0 1-.82-.98l-.05-.18c-.14-.69.2-1.28.54-1.69.26-.3.56-.55.8-.73q-.03-1.08.06-2.16a40 40 0 0 0-4.36 1.9l-.7.37c-4.03 2.14-5.5 3.82-6.02 4.78-.36.65-.42 1.19-.28 1.67l.06.17c.19.41.66.92 1.85 1.36 1.36.5 3.6.88 7.19.88h.08c2.36 0 4.9-.17 7.3-.4l.03-.01.57-.06.19-.02.3-.03h.1c3.02-.34 5.77-.75 7.63-1.05l1.14-.22a47 47 0 0 0 7.6-2.2v-.01l.17-.06.4-.16.18-.07.55-.22 1.25-.54v.01q2.38-1.05 4.65-2.32a27 27 0 0 0 5.56-4.02c1.34-1.34 1.85-2.43 1.77-3.19-.06-.6-.62-1.23-2.13-1.77a21 21 0 0 0-5.28-.93m-14.95-3.06c.33.38.42.99.34 1.51-.06.45-.33.75-.6.94a2 2 0 0 1-.8.3h-.09l-3 .13-2.3 1.44h-.02q-.46.27-1 .26a3 3 0 0 1-.5-.05c-.4-.1-.66-.34-.83-.6-.15-.23-.23-.5-.25-.7v-.08l-.03-1.41a11.6 11.6 0 0 0-3.73 6.2c-.45 1.99-.36 4.06.25 6q.34.06.75.1c3.17.33 7.42-.1 11.37-1.14 4.25-1.14 7.62-2.85 9.61-4.8q-.19-.9-.51-1.77h-.04l-.12-.33-.09-.25a11 11 0 0 0-1.87-2.88l-.03-.04-.02-.02-.83-.84a11 11 0 0 0-6.21-2.82zm-3.72-1.64-.1.09h-.01l-.31.29-.2-.19-.2-.16-1.42-1.3-.67 1.74-.13.36-.02.05-.15.38-.3-.05h-.01l-.15-.02-1.78-.27.49.34.52.37.15.1.49.35.2.15.01.25.03 1.87 2.47-1.54.11-.07.13-.01 3.08-.14-.9-1.4-.12-.18.05-.21.19-.72.04-.17.09-.36.06-.25v-.01l.1-.39.17-.64z",Pr=256,Ns=Math.SQRT2,fu=[[-1,-1,Ns],[0,-1,1],[1,-1,Ns],[-1,0,1],[1,0,1],[-1,1,Ns],[0,1,1],[1,1,Ns]];class gv{constructor(){this.indices=[],this.keys=[]}get size(){return this.indices.length}push(e,t){let n=this.indices.length;for(this.indices.push(e),this.keys.push(t);n>0;){const r=n-1>>1;if((this.keys[r]??0)<=t)break;this.swap(n,r),n=r}}pop(){const e=this.indices[0]??0,t=this.keys[0]??0,n=this.indices.pop()??0,r=this.keys.pop()??0;if(this.indices.length>0){this.indices[0]=n,this.keys[0]=r;let s=0;for(;;){const a=s*2+1,o=a+1;let l=s;if(a<this.keys.length&&(this.keys[a]??0)<(this.keys[l]??0)&&(l=a),o<this.keys.length&&(this.keys[o]??0)<(this.keys[l]??0)&&(l=o),l===s)break;this.swap(s,l),s=l}}return{index:e,key:t}}swap(e,t){const n=this.indices[e]??0,r=this.keys[e]??0;this.indices[e]=this.indices[t]??0,this.keys[e]=this.keys[t]??0,this.indices[t]=n,this.keys[t]=r}}function vv(i,e){let t=e,n=-1;for(let o=0;o<i.length;o+=1){if(i[o]===0)continue;const l=o%e;t=Math.min(t,l),n=Math.max(n,l)}if(n<0)return-1;const r=(t+n)/2,s=Math.max(1,(n-t)*.12);let a=-1;for(let o=0;o<i.length;o+=1)i[o]===0||Math.abs(o%e-r)>s||(a<0||Math.floor(o/e)>Math.floor(a/e))&&(a=o);return a}function xv(i,e,t){const n=new Float32Array(e*e).fill(1/0);if(t<0||i[t]===0)return n.fill(1);const r=new gv;for(n[t]=0,r.push(t,0);r.size>0;){const{index:o,key:l}=r.pop();if(l>(n[o]??1/0))continue;const c=o%e,u=Math.floor(o/e);for(const[f,h,d]of fu){const g=c+f,S=u+h;if(g<0||S<0||g>=e||S>=e)continue;const m=S*e+g;if(i[m]===0)continue;const p=l+d;p<(n[m]??1/0)&&(n[m]=p,r.push(m,p))}}let s=0;for(const o of n)Number.isFinite(o)&&(s=Math.max(s,o));const a=new Float32Array(e*e).fill(-1);for(let o=0;o<a.length;o+=1){const l=n[o]??1/0;i[o]!==0&&(a[o]=Number.isFinite(l)&&s>0?l/s:1)}for(let o=0;o<4;o+=1){const l=a.slice();for(let c=0;c<a.length;c+=1){if((a[c]??0)>=0)continue;const u=c%e,f=Math.floor(c/e);let h=1/0;for(const[d,g]of fu){const S=u+d,m=f+g;if(S<0||m<0||S>=e||m>=e)continue;const p=a[m*e+S]??-1;p>=0&&(h=Math.min(h,p))}Number.isFinite(h)&&(l[c]=h)}a.set(l)}for(let o=0;o<a.length;o+=1)(a[o]??0)<0&&(a[o]=1);return a}function _v(i){const e=document.createElement("canvas");e.width=i,e.height=i;const t=e.getContext("2d",{willReadFrequently:!0});if(t===null)throw new Error("splash: mark raster canvas is unavailable");t.scale(i/Oo.width,i/Oo.height),t.fill(new Path2D(hu));const n=t.getImageData(0,0,i,i).data,r=new Uint8Array(i*i);for(let s=0;s<r.length;s+=1)r[s]=(n[s*4+3]??0)>96?1:0;return r}function Mv(i,e){const t=new Uint8Array(i.length);for(let r=0;r<i.length;r+=1)t[r]=Math.round(Math.min(1,Math.max(0,i[r]??1))*255);const n=new lo(t,e,e,kr,Vt);return n.magFilter=Tt,n.minFilter=Tt,n.generateMipmaps=!1,n.needsUpdate=!0,n}function Sv(i){var f,h;const{width:e,height:t}=Oo,r=new Fo().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${e} ${t}"><path d="${hu}"/></svg>`).paths.flatMap(d=>d.toShapes().map(g=>new yr(g,{depth:.9,bevelEnabled:!0,bevelSegments:5,bevelSize:.22,bevelThickness:.38,curveSegments:14}))),s=Cs(r,!1);for(const d of r)d.dispose();const a=s.getAttribute("position"),o=new Float32Array(a.count*2);for(let d=0;d<a.count;d+=1)o[d*2]=a.getX(d)/e,o[d*2+1]=a.getY(d)/t;s.setAttribute("aMarkUv",new qt(o,2)),s.computeBoundingBox();const l=new O,c=new O;(f=s.boundingBox)==null||f.getCenter(l),(h=s.boundingBox)==null||h.getSize(c),s.translate(-l.x,-l.y,-l.z),s.rotateX(Math.PI);const u=i/c.x;return s.scale(u,u,u),s.computeBoundingBox(),{geometry:s,project:(d,g,S)=>new O((d*e-l.x)*u,-(g*t-l.y)*u,S)}}function yv(i,e,t,n,r){const s=[];for(let a=0;a<i.length;a+=1)i[a]!==0&&s.push(a);return s.length===0?[]:Array.from({length:n},()=>{const a=s[Math.floor(r()*s.length)]??0;return{u:(a%t+.5)/t,v:(Math.floor(a/t)+.5)/t,travel:e[a]??1}})}function bv(i,e,t,n){const r=Math.min(1,Math.max(0,i/n));let s=0,a=1;for(let o=0;o<24;o+=1){const l=(s+a)/2;l*l*(3-2*l)<r?s=l:a=l}return e+(s+a)/2*t}const du=2*Math.PI/3/Xn.twist.height,qn=[1.7,.07,.05];function Bo(i,e,t){const n=Math.min(1,Math.max(0,(t-i)/(e-i)));return n*n*(3-2*n)}function ut(i,e,t=0){const n=i.getAttribute("position").count,r=new Float32Array(n*4);for(let s=0;s<n;s+=1)r.set([e[0],e[1],e[2],t],s*4);return i.setAttribute("aGlow",new qt(r,4)),i}function qi(i){const e=Cs(i,!1);for(const t of i)t.dispose();return e}function Ev(i,e,t,n,r){const s=e.clone().sub(i),a=new Ut(n,t,s.length(),r);a.applyQuaternion(new Bn().setFromUnitVectors(new O(0,1,0),s.clone().normalize()));const o=i.clone().add(e).multiplyScalar(.5);return a.translate(o.x,o.y,o.z),a}function pu(i,e,t,n){return Array.from({length:n+1},(r,s)=>{const a=s/n,o=1-a;return new ae(o*o*i.x+2*o*a*e.x+a*a*t.x,o*o*i.y+2*o*a*e.y+a*a*t.y)})}function Yn(i,e,t){return Array.from({length:t+1},(n,r)=>i.clone().lerp(e,r/t))}function Us(i,e){return i.map(t=>new O(t.x,t.y,typeof e=="number"?e:e(t.y)))}function wv(){const{height:i}=Xn.pearl,e=[],t=(a,o,l,c)=>{e.push(new Oi(c,56,32).translate(a,o,l))};t(0,63,0,17);for(let a=0;a<5;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6;t(Math.cos(o)*6.2,94+a*14,Math.sin(o)*6.2,4.3)}t(0,179,0,15.3),t(0,233,0,5.6);const n=[];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3)+Math.PI/6,l=Math.cos(o)*6.2,c=Math.sin(o)*6.2;n.push(new Ut(3,3,182,24).translate(l,91,c));const u=o+Math.PI/3;n.push(Ev(new O(Math.cos(u)*24,0,Math.sin(u)*24),new O(Math.cos(u)*6,50,Math.sin(u)*6),2.9,2.3,20))}n.push(new Ut(4.2,4.6,54,28).translate(0,206,0));const r=[[238,262,2.6,2.2],[262,288,1.6,1.3],[288,306,.9,.6],[306,i,.35,.08]];for(const[a,o,l,c]of r)n.push(new Ut(c,l,o-a,16).translate(0,(a+o)/2,0)),n.push(new Ut(l+.6,l+.6,.7,20).translate(0,a+.35,0));const s=[{offset:[0,i+.4,0],color:qn,radius:.9,kind:0,trail:0}];for(let a=0;a<3;a+=1){const o=a*(2*Math.PI/3);s.push({offset:[Math.cos(o)*1.9,288.6,Math.sin(o)*1.9],color:qn,radius:.6,kind:0,trail:0}),s.push({offset:[Math.cos(o)*3.4,262.6,Math.sin(o)*3.4],color:qn,radius:.6,kind:0,trail:0})}return{surfaces:[{defines:["PEARL_SPHERE"],geometry:qi(e)},{defines:["PEARL_COLUMN"],geometry:qi(n)}],outlines:[],lights:s}}function Tv(){const{height:i}=Xn.gate,e=30,t=new xs;t.moveTo(-48,0),t.lineTo(-17,0),t.lineTo(-17,150),t.absellipse(0,150,17,38,Math.PI,0,!0,0),t.lineTo(17,0),t.lineTo(48,0),t.quadraticCurveTo(47,150,40,i),t.lineTo(-40,i),t.quadraticCurveTo(-47,150,-48,0);const n=new yr(t,{depth:e,bevelEnabled:!1,curveSegments:32,steps:1});n.translate(0,0,-e/2);const r=e/2+.3,s=[...Yn(new ae(-17,0),new ae(-17,150),30),...Array.from({length:41},(o,l)=>{const c=Math.PI-l/40*Math.PI;return new ae(Math.cos(c)*17,150+Math.sin(c)*38)}),...Yn(new ae(17,150),new ae(17,0),30)],a=[...pu(new ae(-48,0),new ae(-47,150),new ae(-40,i),40),...Yn(new ae(-40,i),new ae(40,i),30),...pu(new ae(40,i),new ae(47,150),new ae(48,0),40)];return{surfaces:[{defines:["PLANAR","DIAGRID"],geometry:n}],outlines:[{color:[2.2,.1,.07],radius:.55,points:Us(s,r)},{color:[.2,1,1.5],radius:.32,points:Us(a,r)}],lights:[{offset:[-38,i+.6,0],color:qn,radius:.9,kind:0,trail:0},{offset:[38,i+.6,0],color:qn,radius:.9,kind:0,trail:0}]}}function Av(){const{height:i,radius:e}=Xn.twist,t=90,n=132,r=[],s=[],a=h=>{const d=h/t*i,g=e*(1-.42*(d/i)**1.2);for(let S=0;S<n;S+=1){const m=S/n*Math.PI*2,p=g*(1+.085*Math.cos(3*(m-du*d)));r.push(Math.cos(m)*p,d,Math.sin(m)*p)}};for(let h=0;h<=t;h+=1)a(h);for(let h=0;h<t;h+=1)for(let d=0;d<n;d+=1){const g=h*n+d,S=h*n+(d+1)%n;s.push(g,g+n,S,S,g+n,S+n)}const o=r.length/3;a(t);const l=r.length/3;r.push(0,i,0);for(let h=0;h<n;h+=1)s.push(l,o+(h+1)%n,o+h);const c=new yt;c.setAttribute("position",new rt(r,3)),c.setIndex(s),c.computeVertexNormals();const u=e*.58,f=Array.from({length:97},(h,d)=>{const g=d/96*Math.PI*2;return new O(Math.cos(g)*(u+.6),i-1.2,Math.sin(g)*(u+.6))});return{surfaces:[{defines:["TWIST"],geometry:c},{defines:["PEARL_COLUMN"],geometry:new Ut(.25,1.1,26,12).translate(0,i+13,0)}],outlines:[{color:[2,.1,.07],radius:.5,points:f}],lights:[{offset:[0,i+26.4,0],color:qn,radius:.9,kind:0,trail:0}]}}function Rv(){const{height:i}=Xn.opener,e=52,t=.72,n=new xs;n.moveTo(-26,0),n.lineTo(26,0),n.lineTo(19,i),n.lineTo(-19,i),n.closePath();const r=new ui;r.moveTo(-15,268),r.lineTo(15,268),r.lineTo(12,302),r.lineTo(-12,302),r.closePath(),n.holes.push(r);const s=new yr(n,{depth:e,bevelEnabled:!1,steps:1});s.translate(0,0,-e/2);const a=s.getAttribute("position");for(let c=0;c<a.count;c+=1)a.setZ(c,a.getZ(c)*(1-t*a.getY(c)/i));s.computeVertexNormals();const o=c=>e/2*(1-t*c/i)+.3,l=[...Yn(new ae(-15,268),new ae(15,268),20),...Yn(new ae(15,268),new ae(12,302),16),...Yn(new ae(12,302),new ae(-12,302),20),...Yn(new ae(-12,302),new ae(-15,268),16)];return{surfaces:[{defines:["PLANAR"],geometry:s}],outlines:[{color:[2.1,.32,.08],radius:.45,points:Us(l,o)},{color:[.2,1,1.5],radius:.3,points:Us(Yn(new ae(-19,i),new ae(19,i),30),o)}],lights:[{offset:[-18,i+.6,0],color:qn,radius:.9,kind:0,trail:0},{offset:[18,i+.6,0],color:qn,radius:.9,kind:0,trail:0}]}}const Cv=[{offset:[-.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[.5,-.02,2.25],color:[1.5,1.45,1.35],radius:.17,kind:1,trail:.3},{offset:[0,.12,-2.26],color:[1.6,.06,.04],radius:.2,kind:2,trail:1.1},{offset:[-1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[1.12,-.06,-1.76],color:[.25,1.1,1.6],radius:.28,kind:2,trail:.9},{offset:[0,-.6,-.5],color:[.06,.32,.6],radius:1.3,kind:0,trail:0}],Pv=[{offset:[-1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[1.1,-.3,5.4],color:[1.6,1.5,1.35],radius:.24,kind:1,trail:.4},{offset:[-1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,4.8],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[1.85,1.3,-5],color:[1.5,.7,.1],radius:.2,kind:0,trail:0},{offset:[-1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[1.4,.4,-5.1],color:[1.6,.06,.04],radius:.24,kind:2,trail:.8},{offset:[0,-2,-1.2],color:[.7,.28,.06],radius:1.6,kind:0,trail:0}];function Lv(){const i=new je(1.9,.62,4.4,4,2,10),e=i.getAttribute("position");for(let r=0;r<e.count;r+=1){const s=e.getX(r),a=e.getY(r),l=(e.getZ(r)+2.2)/4.4,c=Bo(.55,1,l),u=Bo(.25,0,l);e.setX(r,s*(1-.42*c-.12*u)),e.setY(r,(a>0?a*(1-.55*c):a*(1-.3*c))-.05*c)}i.computeVertexNormals();const t=[ut(i,[0,0,0])],n=new Oi(1,20,10,0,Math.PI*2,0,Math.PI/2).scale(.62,.36,1.25).translate(0,.27,.25);t.push(ut(n,[.004,.02,.03],1));for(const r of[-1,1]){t.push(ut(new Ut(.33,.29,1.7,16).rotateX(Math.PI/2).translate(r*1.12,-.06,-.8),[0,0,0]));const s=new Ut(.27,.27,.05,16).rotateX(Math.PI/2).translate(r*1.12,-.06,-1.66);t.push(ut(s,[.35,1.6,2.4])),t.push(ut(new je(.5,.03,1.2).translate(r*1.12,-.37,-.8),[.1,.6,1])),t.push(ut(new je(.42,.07,.05).translate(r*.5,-.02,2.17),[3,2.9,2.7])),t.push(ut(new je(.06,.5,.7).rotateZ(r*.35).translate(r*.45,.45,-1.8),[0,0,0]))}return t.push(ut(new je(1.4,.06,.04).translate(0,.12,-2.21),[2.8,.12,.08])),qi(t)}function Iv(){const i=[ut(new je(3.4,2,2.6).translate(0,.1,4),[0,0,0]),ut(new je(3,.7,.05).translate(0,.55,5.32),[.01,.03,.04],1),ut(new je(3.6,2.6,7.6).translate(0,.2,-1.3),[0,0,0])];for(let e=0;e<7;e+=1)i.push(ut(new je(3.72,2.7,.12).translate(0,.2,-4.7+e*1.13),[0,0,0]));for(const e of[-1,1]){for(const t of[-1,1])i.push(ut(new Ut(.5,.42,.7,16).translate(e*1.55,-1.45,-1.3+t*3),[0,0,0])),i.push(ut(new Ut(.36,.36,.05,16).translate(e*1.55,-1.82,-1.3+t*3),[2.4,.9,.2])),i.push(ut(new je(.16,.16,.16).translate(e*1.85,1.3,t>0?4.8:-5),[2.6,1.3,.2]));i.push(ut(new je(.6,.16,.05).translate(e*1.1,-.3,5.32),[3,2.9,2.7])),i.push(ut(new je(.5,.18,.05).translate(e*1.4,.4,-5.12),[2.8,.12,.08]))}return qi(i)}const Dv=[{offset:[-10.6,4.2,0],color:[1.6,.07,.05],radius:.4,kind:0,trail:0},{offset:[-10.6,-4.2,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[-10.6,0,4.2],color:[.1,1.2,.8],radius:.35,kind:0,trail:0},{offset:[-10.6,0,-4.2],color:[1.6,.07,.05],radius:.35,kind:0,trail:0},{offset:[11.9,0,0],color:[1.4,1.4,1.3],radius:.35,kind:0,trail:0},{offset:[0,-6,0],color:[1,.7,.45],radius:.9,kind:0,trail:0}],en={y:.4,z:4.9,width:13,height:4.4};function Nv(i,e){const t=i/2,n=[ut(new Oi(1,48,24).scale(t,e,e),[0,0,0])],r=e*.55,s=[[r,0,.16,3.4],[-r,0,.16,3.4],[0,r,3.4,.16],[0,-r,3.4,.16]];for(const[o,l,c,u]of s)n.push(ut(new je(2.8,u,c).translate(-t+1.6,o,l),[0,0,0]));n.push(ut(new je(5.2,1.4,2).translate(0,-e-.55,0),[0,0,0])),n.push(ut(new je(4.6,.42,2.06).translate(0,-e-.4,0),[1.4,.95,.55]));const a=new je(en.width+.5,en.height+.5,.3);return n.push(ut(a.translate(0,en.y,en.z-.2),[0,0,0])),n.push(ut(new je(.3,.3,1.6).translate(-4,en.y,en.z-1.1),[0,0,0])),n.push(ut(new je(.3,.3,1.6).translate(4,en.y,en.z-1.1),[0,0,0])),qi(n)}function Uv(){const i=(pi.cars*(pi.carLength+pi.gap)-pi.gap)/2;return[-.9,.9].flatMap(e=>[{offset:[i+.2,-.6,e],color:[1.7,1.6,1.45],radius:.3,kind:0,trail:0},{offset:[-i-.2,-.6,e],color:[1.6,.06,.04],radius:.28,kind:0,trail:0}])}function Fv(){const{cars:i,carLength:e,gap:t}=pi,n=[];for(let r=0;r<i;r+=1){const s=(r-(i-1)/2)*(e+t),a=new je(e,3.3,3.4,12,2,2),o=r===i-1?1:r===0?-1:0;if(o!==0){const l=a.getAttribute("position");for(let c=0;c<l.count;c+=1){const u=Bo(e/2-6,e/2,l.getX(c)*o);l.getY(c)>0&&l.setY(c,l.getY(c)*(1-.75*u)),l.setZ(c,l.getZ(c)*(1-.35*u))}a.computeVertexNormals()}n.push(ut(a.translate(s,0,0),[0,0,0]));for(const l of[-1,1]){const c=new je(e-(o===0?2:7),.8,.04);n.push(ut(c.translate(s-o*2.5,.35,l*1.72),[1.6,1.15,.7])),n.push(ut(new je(e-1,.05,.12).translate(s,1.62,l*1.3),[.8,.05,.04]))}n.push(ut(new je(e-1,.06,2.8).translate(s,-1.68,0),[.2,1.2,1.8]))}return qi(n)}const Lr='"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',Ir='"Montserrat", "Segoe UI", "Helvetica Neue", sans-serif',mu={glow:"#ff2b3a",core:"#ffd9d4"},gu={glow:"#29d6ff",core:"#e4fbff"},Ov=[{glyphs:"夜市",ink:mu,caption:"NIGHT MARKET"},{glyphs:"电子",ink:gu,caption:"CYBER PARTS"},{glyphs:"拉面",ink:{glow:"#ff4fa0",core:"#ffe2ef"},caption:"RAMEN 24H"},{glyphs:"数据",ink:{glow:"#ffae2e",core:"#fff2d8"},caption:"DATA BANK"},{glyphs:"霓虹",ink:mu,caption:"NEON"},{glyphs:"网咖",ink:{glow:"#3dffd0",core:"#e2fff6"},caption:"NET CAFE"},{glyphs:"酒店",ink:{glow:"#b58cff",core:"#efe6ff"},caption:"HOTEL"},{glyphs:"未来",ink:gu,caption:"FUTURE"}],Fs={width:256,height:1024},Dr={width:1024,height:512};function vu(i,e){const t=document.createElement("canvas");t.width=i,t.height=e;const n=t.getContext("2d");if(n===null)throw new Error("splash: signage canvas is unavailable");return{canvas:t,context:n}}function xu(i,e,t,n){i.save(),i.shadowColor=e.glow,i.shadowBlur=n*3.2,i.strokeStyle=e.glow,i.lineWidth=n,i.lineJoin="round",i.lineCap="round",t("stroke"),i.shadowBlur=n*1.2,i.fillStyle=e.core,i.strokeStyle=e.core,i.lineWidth=n*.34,t("fill"),i.restore()}function Bv(i,e,t){const{width:n,height:r}=Fs,s=14;i.fillStyle="#07040a",i.fillRect(e,0,n,r);const a=i.createLinearGradient(e,0,e+n,0);a.addColorStop(0,"#0d0710"),a.addColorStop(.5,"#160b17"),a.addColorStop(1,"#0d0710"),i.fillStyle=a,i.fillRect(e+s,s,n-s*2,r-s*2);const o=s+12;xu(i,t.ink,()=>{i.strokeRect(e+o,o,n-o*2,r-o*2)},7);const l=Array.from(t.glyphs),c=168,u=150,f=(r-380)/Math.max(1,l.length);i.textAlign="center",i.textBaseline="middle",i.font=`700 ${c}px ${Lr}`,l.forEach((h,d)=>{const g=u+f*(d+.5);xu(i,t.ink,S=>{S==="stroke"?i.strokeText(h,e+n/2,g):i.fillText(h,e+n/2,g)},9)}),i.save(),i.translate(e+n/2,r-150),i.rotate(-Math.PI/2),i.font=`600 34px ${Ir}`,i.fillStyle=t.ink.glow,i.shadowColor=t.ink.glow,i.shadowBlur=14,i.fillText(t.caption,0,0),i.restore()}function zv(i,e,t,n){const{width:r,height:s}=Dr;if(i.save(),i.beginPath(),i.rect(e,t,r,s),i.clip(),i.translate(e,t),i.textBaseline="middle",n===0){const a=i.createLinearGradient(0,0,r,s);a.addColorStop(0,"#3a0326"),a.addColorStop(.55,"#1a0636"),a.addColorStop(1,"#03141f"),i.fillStyle=a,i.fillRect(0,0,r,s);for(let o=0;o<6;o+=1)i.strokeStyle=`rgba(255, 79, 160, ${.5-o*.07})`,i.lineWidth=3,i.beginPath(),i.arc(780,250,70+o*34,0,Math.PI*2),i.stroke();i.font=`800 132px ${Lr}`,i.fillStyle="#fff4fb",i.shadowColor="#ff4fa0",i.shadowBlur=30,i.fillText("未来已来",70,210),i.font=`600 40px ${Ir}`,i.fillStyle="#ff9fd0",i.shadowBlur=12,i.fillText("THE FUTURE IS ONLINE",76,340)}else if(n===1){i.fillStyle="#01141c",i.fillRect(0,0,r,s);for(let a=0;a<7;a+=1){i.strokeStyle=`rgba(41, 214, 255, ${.75-a*.09})`,i.lineWidth=3,i.beginPath();for(let o=0;o<=r;o+=8){const l=330+Math.sin(o*.012+a*.7)*(40+a*9)*Math.sin(o*.003+.4);o===0?i.moveTo(o,l):i.lineTo(o,l)}i.stroke()}i.font=`800 120px ${Ir}`,i.fillStyle="#e4fbff",i.shadowColor="#29d6ff",i.shadowBlur=28,i.fillText("AI",70,150),i.font=`700 96px ${Lr}`,i.fillText("智能驱动",250,150)}else if(n===2){const a=i.createLinearGradient(0,0,0,s);a.addColorStop(0,"#2b0605"),a.addColorStop(1,"#120203"),i.fillStyle=a,i.fillRect(0,0,r,s);for(let o=0;o<14;o+=1){const l=60+o*37%11*22;i.fillStyle=o%3===0?"#ffae2e":"#ff3a2b",i.globalAlpha=.7,i.fillRect(560+o*30,s-60-l,18,l)}i.globalAlpha=1,i.font=`800 150px ${Ir}`,i.fillStyle="#fff2d8",i.shadowColor="#ff6a2b",i.shadowBlur=30,i.fillText("24H",70,190),i.font=`700 92px ${Lr}`,i.fillText("全天营业",74,350)}else{i.fillStyle="#0a0216",i.fillRect(0,0,r,s),i.strokeStyle="rgba(255, 79, 160, 0.55)",i.lineWidth=2;for(let a=0;a<=16;a+=1)i.beginPath(),i.moveTo(r/2,250),i.lineTo(-400+a*115,s),i.stroke();for(let a=0;a<7;a+=1){const o=250+(a/6)**2*(s-250);i.beginPath(),i.moveTo(0,o),i.lineTo(r,o),i.stroke()}i.font=`800 96px ${Ir}`,i.fillStyle="#e4fbff",i.shadowColor="#29d6ff",i.shadowBlur=26,i.fillText("NEURAL LINK",70,120),i.font=`700 64px ${Lr}`,i.fillStyle="#ffd6ea",i.shadowColor="#ff4fa0",i.fillText("神经连接 · 即刻上线",74,210)}i.restore()}function _u(i,e){const t=new co(i);return t.colorSpace=Gt,t.anisotropy=e,t.needsUpdate=!0,t}function Hv(i){const{canvas:e,context:t}=vu(Fs.width*Po,Fs.height);return Ov.forEach((n,r)=>{Bv(t,r*Fs.width,n)}),{texture:_u(e,i),grid:new ae(Po,1)}}function kv(i){const t=Math.ceil(Ps/2),{canvas:n,context:r}=vu(Dr.width*2,Dr.height*t);for(let s=0;s<Ps;s+=1)zv(r,s%2*Dr.width,Math.floor(s/2)*Dr.height,s);return{texture:_u(n,i),grid:new ae(2,t)}}const Os={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`};class Nr{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const Gv=new So(-1,1,1,-1,0,1);class Vv extends yt{constructor(){super(),this.setAttribute("position",new rt([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new rt([0,2,0,0,2,0],2))}}const Wv=new Vv;class Mu{constructor(e){this._mesh=new st(Wv,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Gv)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class Su extends Nr{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof _t?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=br.clone(e.uniforms),this.material=new _t({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Mu(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class yu extends Nr{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){const r=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),s.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),s.buffers.stencil.setClear(o),s.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(r.EQUAL,1,4294967295),s.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),s.buffers.stencil.setLocked(!0)}}class Xv extends Nr{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class qv{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const n=e.getSize(new ae);this._width=n.width,this._height=n.height,t=new Ct(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Lt}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Su(Os),this.copyPass.material.blending=mn,this.timer=new sd}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());const t=this.renderer.getRenderTarget();let n=!1;for(let r=0,s=this.passes.length;r<s;r++){const a=this.passes[r];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(r),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),a.needsSwap){if(n){const o=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(o.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(o.EQUAL,1,4294967295)}this.swapBuffers()}yu!==void 0&&(a instanceof yu?n=!0:a instanceof Xv&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new ae);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class Yv extends Nr{constructor(e,t,n=null,r=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Ke}render(e,t,n){const r=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}}const Kv={uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Ke(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`};class Yi extends Nr{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e!==void 0?new ae(e.x,e.y):new ae(256,256),this.clearColor=new Ke(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Ct(s,a,{type:Lt,depthBuffer:!1}),this.renderTargetBright.texture.name="UnrealBloomPass.bright",this.renderTargetBright.texture.generateMipmaps=!1;for(let u=0;u<this.nMips;u++){const f=new Ct(s,a,{type:Lt,depthBuffer:!1});f.texture.name="UnrealBloomPass.h"+u,f.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(f);const h=new Ct(s,a,{type:Lt,depthBuffer:!1});h.texture.name="UnrealBloomPass.v"+u,h.texture.generateMipmaps=!1,this.renderTargetsVertical.push(h),s=Math.round(s/2),a=Math.round(a/2)}const o=Kv;this.highPassUniforms=br.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new _t({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];const l=[6,10,14,18,22];s=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let u=0;u<this.nMips;u++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(l[u])),this.separableBlurMaterials[u].uniforms.invSize.value=new ae(1/s,1/a),s=Math.round(s/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;const c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new O(1,1,1),new O(1,1,1),new O(1,1,1),new O(1,1,1),new O(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=br.clone(Os.uniforms),this.blendMaterial=new _t({uniforms:this.copyUniforms,vertexShader:Os.vertexShader,fragmentShader:Os.fragmentShader,premultipliedAlpha:!0,blending:ji,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Ke,this._oldClearAlpha=1,this._basic=new fr,this._fsQuad=new Mu(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let s=0;s<this.nMips;s++)this.renderTargetsHorizontal[s].setSize(n,r),this.renderTargetsVertical[s].setSize(n,r),this.separableBlurMaterials[s].uniforms.invSize.value=new ae(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(e,t,n,r,s){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();const a=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),s&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=n.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=n.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let o=this.renderTargetBright;for(let l=0;l<this.nMips;l++)this._fsQuad.material=this.separableBlurMaterials[l],this.separableBlurMaterials[l].uniforms.colorTexture.value=o.texture,this.separableBlurMaterials[l].uniforms.direction.value=Yi.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[l]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[l].uniforms.colorTexture.value=this.renderTargetsHorizontal[l].texture,this.separableBlurMaterials[l].uniforms.direction.value=Yi.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[l]),e.clear(),this._fsQuad.render(e),o=this.renderTargetsVertical[l];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,s&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(n),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=a}_getSeparableBlurMaterial(e){const t=[],n=e/3;for(let a=0;a<e;a++)t.push(.39894*Math.exp(-.5*a*a/(n*n))/n);const r=[],s=[];for(let a=1;a<e;a+=2){const o=t[a],l=a+1<e?t[a+1]:0,c=o+l;r.push((a*o+(a+1)*l)/c),s.push(c)}return new _t({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new ae(.5,.5)},direction:{value:new ae(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:s}},vertexShader:`

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

				}`})}}Yi.BlurDirectionX=new ae(1,0),Yi.BlurDirectionY=new ae(0,1);const Zv=`
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,$v=`
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
`;function Jv(i,e,t){const n=new Ct(1,1,{type:Lt,samples:4}),r=new qv(i,n);r.addPass(new Yv(e,t));const s=new Yi(new ae(1,1),.55,.38,1);r.addPass(s);const a={value:0},o={value:0},l=new _t({uniforms:{tDiffuse:{value:null},uExposure:a,uTime:o},vertexShader:Zv,fragmentShader:$v,depthTest:!1,depthWrite:!1}),c=new Su(l);return r.addPass(c),{composer:r,exposure:a,time:o,setSize:(u,f,h)=>{r.setPixelRatio(h),r.setSize(u,f)},dispose:()=>{s.dispose(),c.dispose(),l.dispose(),r.dispose()}}}const bu={finish:()=>{},stop:()=>{}},zo=1,Qv=196869,jv=1.5,Eu=.8,ex=900,tx=.4,nx=450;function dn(i,e,t,n={},r={}){return new _t({...r,vertexShader:e,fragmentShader:t,uniforms:{...i,...n}})}function Kn(i,e,t,n=new Ke(0,0,0)){return dn(i,jg,ev,{uAlbedo:{value:new Ke(e,e*.96,e*1.04)},uEmissive:{value:n},uSheen:{value:t}})}function Ho(i,e,t){const n=new nd;n.index=i.index;for(const[r,s]of Object.entries(i.attributes))n.setAttribute(r,s);for(const[r,s]of Object.entries(t))n.setAttribute(r,s);return n.instanceCount=e,n}function Ur(i,e){const t=new Fi(1,1);return t.deleteAttribute("normal"),Ho(t,i,e)}function ix(i,e,t){i.frustumCulled=!1,i.onBeforeRender=n=>{const r=n.getRenderTarget();r===null?n.getDrawingBufferSize(t.value):t.value.set(r.width,r.height),e.uniformsNeedUpdate=!0}}function Bs(i,e,t,n,r={}){const s=dn(i,t,ov,{uViewport:e,...r},{blending:ji,depthWrite:!1,transparent:!0}),a=new st(n,s);return ix(a,s,e),a}function ko(i,e,t,n={value:new O}){const r=new Float32Array(t.length*3),s=new Float32Array(t.length*4);return t.forEach((a,o)=>{r.set([a.position.x,a.position.y,a.position.z],o*3),s.set([...a.color,a.radius],o*4)}),Bs(i,e,iv,Ur(t.length,{aHead:new vt(r,3),aLight:new vt(s,4)}),{uLightOffset:n})}function wu(i){return Tu(i,new ct)}function Tu(i,e){return i.map(t=>({position:new O(...t.offset).applyMatrix4(e),color:t.color,radius:t.radius}))}function rx(i,e){const t=new je(1,1,1).translate(0,.5,0),n=new Ut(.5,.5,1,48,1).translate(0,.5,0);return[[un.box,t],[un.round,n]].map(([r,s])=>{const a=i.tiers.filter(d=>d.form===r),o=new Float32Array(a.length*3),l=new Float32Array(a.length*4),c=new Float32Array(a.length*4),u=new Float32Array(a.length);a.forEach((d,g)=>{o.set([d.x,d.y,d.z],g*3),l.set([d.width,d.height,d.depth,d.taper],g*4),c.set([d.seed,d.facade,d.lit,d.trim],g*4),u[g]=d.storefront?1:0}),s.deleteAttribute("uv");const f=Ho(s,a.length,{aCenter:new vt(o,3),aSize:new vt(l,4),aStyle:new vt(c,4),aStorefront:new vt(u,1)}),h=new st(f,dn(e,Yg,Kg,{},{defines:r===un.round?{RADIAL:""}:{}}));return h.frustumCulled=!1,h})}function sx(i){const e=new Ar(new Fi(2800,2800),{textureWidth:1,textureHeight:1,clipBias:.003,color:14275551,multisample:4,shader:{name:"SplashGround",uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uStreet:{value:new mt(Wi.x,Wi.spacing,0,Lo)},uAvenue:{value:new ae(Qt.start+15,Qt.end-10)}},vertexShader:Zg,fragmentShader:$g}}),t=e.material;if(!(t instanceof _t))throw new Error("splash: ground reflector has no shader material");Object.assign(t.uniforms,i);const n=e.getRenderTarget().texture;n.generateMipmaps=!0,n.minFilter=Fn,e.rotation.x=-Math.PI/2,e.position.set(0,0,-300);const r=e.onBeforeRender.bind(e),s=new O;return e.onBeforeRender=(a,o,l,...c)=>{if(l instanceof Kt){const u=Math.asin(l.getWorldDirection(s).y)-Gh.degToRad(l.fov/2);if(u>-.01||l.position.y/Math.tan(-u)>nx)return}i.uDetail.value=0,r(a,o,l,...c),i.uDetail.value=1},e}function ax(i){const e=new st(new Oi(1600,48,24),dn(i,Jg,Qg,{},{side:Ot,depthTest:!1,depthWrite:!1}));return e.renderOrder=-1,e.frustumCulled=!1,e.onBeforeRender=(t,n,r)=>{e.position.copy(r.position),e.updateMatrixWorld()},e}function Ki(i,e){const t=new ct,n=new Bn,r=new O(0,1,0);return e.forEach((s,a)=>{n.setFromAxisAngle(r,s.yaw??0),i.setMatrixAt(a,t.compose(s.position,n,s.scale))}),i.instanceMatrix.needsUpdate=!0,i}function ox(){const i=Wi.height,e=[new je(.22,i,.22).translate(0,i/2,0),new je(2.4,.14,.16).translate(-1.15,i-.1,0),new je(.9,.2,.42).translate(-2.1,i-.25,0)],t=Cs(e,!1);for(const n of e)n.dispose();return t}function Au(){const i=[];for(let e=Qt.start;e>Qt.end;e-=Wi.spacing)i.push({x:-12.4,z:e,side:-1},{x:Wi.x,z:e,side:1});return i}function lx(i,e){const t=Kn(e,.05,.25),n=Ki(new Ni(new je(1,1,1).translate(0,.5,0),t,i.roofUnits.length),i.roofUnits.map(l=>({position:new O(l.x,l.y,l.z),scale:new O(l.width,l.height,l.depth)}))),r=Ki(new Ni(new Ut(.04,1,1,12).translate(0,.5,0),t,i.antennas.length),i.antennas.map(l=>({position:new O(l.x,l.y,l.z),scale:new O(l.radius,l.height,l.radius)}))),s=Au(),a=Ki(new Ni(ox(),t,s.length),s.map(l=>({position:new O(l.x,0,l.z),scale:new O(1,1,1),yaw:l.side>0?0:Math.PI}))),o=Ki(new Ni(new je(1,1,1),t,i.signs.length+i.screens.length),[...i.signs.map(l=>({position:new O(l.x,l.y+l.height/2,l.z-.24),scale:new O(l.width+.26,l.height+.26,.42)})),...i.screens.map(l=>({position:new O(l.x-Math.sin(l.yaw)*.25,l.y,l.z-Math.cos(l.yaw)*.25),scale:new O(l.width+.5,l.height+.5,.4),yaw:l.yaw}))]);return[n,r,a,o]}function cx(i){const e=[],t=(n,r,s,a,o)=>{e.push({position:new O(n,r,s),color:a,radius:o})};for(const n of i.antennas)t(n.x,n.y+n.height,n.z,[1.6,.08,.06],Math.max(.55,n.radius*.5));for(const n of Au())t(n.x-n.side*2.1,Wi.height-.42,n.z,[1.8,1.25,.8],.4);for(const[n,r]of[[-12,-12],[12,-12],[-12,12],[12,12]])t(hn.x+n,hn.deck+.6,hn.z+r,[1.8,.1,.08],.6);return e}function Ru(i){const e=new Float32Array(i.length*4),t=new Float32Array(i.length*4);return i.forEach((n,r)=>{e.set([n.origin.x,n.origin.y,n.origin.z,n.speed],r*4),t.set([n.directionX,n.directionZ,n.phase,n.span],r*4)}),{lane:e,motion:t}}function ux(i,e){const t=Xg(),n=[];for(const[u,f]of[[En.spinner,Lv()],[En.hauler,Iv()]]){const h=t.filter(p=>p.kind===u),{lane:d,motion:g}=Ru(h),S=new Float32Array(h.length*4);h.forEach((p,w)=>{S.set([...p.paint,p.bob],w*4)});const m=new st(Ho(f,h.length,{aLane:new vt(d,4),aMotion:new vt(g,4),aCraft:new vt(S,4)}),dn(i,No,Uo,{},{defines:{LANE:""}}));m.frustumCulled=!1,n.push(m)}const r=t.flatMap(u=>(u.kind===En.hauler?Pv:Cv).map(f=>({lane:u,light:f})));for(const u of qg())r.push({lane:u,light:{offset:[0,0,0],color:u.headlight?[1.1,1,.9]:[1.2,.06,.04],radius:u.radius,kind:u.headlight?1:2,trail:u.trail}});const{lane:s,motion:a}=Ru(r.map(u=>u.lane)),o=new Float32Array(r.length*4),l=new Float32Array(r.length*4),c=new Float32Array(r.length*2);return r.forEach(({lane:u,light:f},h)=>{o.set([...f.offset,u.bob],h*4),l.set([...f.color,f.radius],h*4),c.set([f.kind,f.trail],h*2)}),n.push(Bs(i,e,rv,Ur(r.length,{aLane:new vt(s,4),aMotion:new vt(a,4),aOffset:new vt(o,4),aLight:new vt(l,4),aKind:new vt(c,2)}))),n}function hx(i,e){const n=new Float32Array(9600);let r=10775;for(let a=0;a<n.length;a+=1)r=Math.imul(r,1664525)+1013904223>>>0,n[a]=r/4294967296;const s=Bs(i,e,sv,Ur(2400,{aDrop:new vt(n,4)}),{uRainBox:{value:new O(56,40,56)},uRain:{value:1}});return s.layers.set(zo),s}function Go(i,e,t,n,r,s={value:new O}){const a=new Float32Array(e.length*4),o=new Float32Array(e.length*4);e.forEach((c,u)=>{a.set([c.x,c.y,c.z,c.yaw],u*4),o.set([c.width,c.height,c.slot,n],u*4)});const l=new st(Ur(e.length,{aPanel:new vt(a,4),aShape:new vt(o,4)}),dn(i,tv,nv,{uAtlas:{value:t.texture},uGrid:{value:t.grid},uScreen:{value:r?1:0},uPanelOffset:s}));return l.frustumCulled=!1,l}function zs(i,e=new ae,t=1,n=0){return{uSeed:{value:i},uAxis:{value:e},uRadius:{value:t},uTwistRate:{value:n}}}function Hs(i,e,t,n,r){const{x:s,z:a}=t,o=new or;for(const l of e.surfaces){const c=Object.fromEntries(l.defines.map(u=>[u,""]));o.add(new st(l.geometry,dn(i,fv,dv,r,{defines:c})))}for(const l of e.outlines){const c=new jl([...l.points],!1,"centripetal"),u=new _o(c,l.points.length*2,l.radius,6,!1);o.add(new st(u,Kn(i,.02,0,new Ke(...l.color))))}if(o.position.set(s,0,a),n){const l=gi(1).position;o.rotation.y=Math.atan2(l.x-s,l.z-a)}return o.updateMatrixWorld(!0),{group:o,lights:Tu(e.lights,o.matrixWorld)}}function fx(i){const{pearl:e,gate:t,twist:n,opener:r}=Xn,s=zs(.83,new ae(n.x,n.z),n.radius,du),a=[Hs(i,wv(),e,!1,zs(.31)),Hs(i,Tv(),t,!0,zs(.47)),Hs(i,Av(),n,!1,s),Hs(i,Rv(),r,!0,zs(.62))];return{objects:a.map(o=>o.group),lights:a.flatMap(o=>o.lights)}}function dx(i,e,t){const n=new st(Nv(Zt.length,Zt.radius),dn(i,No,Uo,{uPaint:{value:new Ke(.035,.034,.04)}})),r={value:new O(Zt.x,Zt.y,Zt.z)},s={x:0,y:en.y,z:en.z,yaw:0,width:en.width,height:en.height,slot:3},a=Go(i,[s],t,1.1,!0,r),o=ko(i,e,wu(Dv),r);return{objects:[n,a,o],update:(l,c)=>{r.value.set(Zt.x+Math.sin(c*.12)*1.5,Zt.y+Math.sin(c*.5)*.4,Zt.z),n.position.copy(r.value)},dispose:()=>{}}}function px(i,e){const{z:t,height:n,span:r}=pi,s=Kn(i,.045,.3),a=new st(new je(r,2.2,3.2),s);a.position.set(0,n-1.1,t);const o=new st(Cs([new je(r,.12,.05).translate(0,n-.5,t+1.63),new je(r,.12,.05).translate(0,n-.5,t-1.63)],!1),Kn(i,.02,0,new Ke(.18,.9,1.35))),l=[];for(let g=-r/2+20;g<r/2;g+=45)Math.abs(g)>14&&l.push(g);const c=Ki(new Ni(new je(1.8,1,2.2).translate(0,.5,0),s,l.length),l.map(g=>({position:new O(g,0,t),scale:new O(1,n-2.2,1)}))),u={uPaint:{value:new Ke(.46,.47,.5)}},f=new st(Fv(),dn(i,No,Uo,u)),h={value:new O(0,n+1.95,t)},d=ko(i,e,wu(Uv()),h);return{objects:[a,o,c,f,d],update:(g,S)=>{h.value.x=Pg(S),f.position.copy(h.value)},dispose:()=>{}}}function mx(i,e){var Le;const{x:t,z:n,deck:r}=hn,s=Kn(i,.04,.4),a=new Ke(0,0,0),o=new st(new Ss(13.5,.5,12,160),Kn(i,.03,.2,a));o.rotation.x=Math.PI/2,o.position.set(t,r+.9,n);const l=new Ke(0,0,0),c=new st(new Ss(5.6,.22,10,96),Kn(i,.03,.2,l));c.rotation.x=Math.PI/2,c.position.set(t,r+2.5,n);const u=new st(new Ut(3.1,4.4,2.7,48),s);u.position.set(t,r+1.35,n);const f=new Ke(0,0,0),h=new st(new uo(2.7,48),Kn(i,.02,.1,f));h.rotation.x=-Math.PI/2,h.position.set(t,r+2.72,n);const d=Ki(new Ni(new je(.34,3.2,3.4).translate(0,1.6,0),s,12),Array.from({length:12},(pe,Ce)=>{const De=Ce/12*Math.PI*2;return{position:new O(t+Math.sin(De)*9.4,r,n+Math.cos(De)*9.4),scale:new O(1,1,1),yaw:De}})),{geometry:g,project:S}=Sv(jt.width),m=_v(Pr),p=xv(m,Pr,vv(m,Pr)),w=Mv(p,Pr),T={value:0},_={value:0},b=new st(g,dn(i,uv,hv,{uField:{value:w},uIgnite:T,uDormant:_})),E=gi(1).position,I=Math.atan2(jt.y-E.y,E.z-jt.z);b.position.set(jt.x,jt.y,jt.z),b.rotation.x=I,b.updateMatrixWorld();const x=r+2.75,A=jt.y+(((Le=g.boundingBox)==null?void 0:Le.min.y)??-48*.3)*Math.cos(I),U=(pe,Ce,De,Ge)=>{const N={value:0},D={value:0},L=De-x,C=new st(new Ut(Ce,pe,L,64,1,!0),dn(i,lv,cv,{uBeam:N,uBeamReach:D},{blending:ji,depthWrite:!1,transparent:!0,side:$t}));return C.position.set(t,x+L/2,n),{mesh:C,strength:Ge,power:N,reach:D}},G=U(1.5,1.1,A+.6,1),z=U(3.4,jt.width*.46,jt.y,.32);let J=20900;const H=()=>(J=Math.imul(J,1664525)+1013904223>>>0,J/4294967296),Y=yv(m,p,Pr,ex,H),re=new Float32Array(Y.length*3),$=new Float32Array(Y.length*3),Z=new Float32Array(Y.length*3),ie=new Float32Array(Y.length*2);Y.forEach((pe,Ce)=>{const De=H()*Math.PI*2,Ge=Math.sqrt(H())*1.2,N=S(pe.u,pe.v,.9).applyMatrix4(b.matrixWorld);re.set([t+Math.cos(De)*Ge,x+.4,n+Math.sin(De)*Ge],Ce*3),$.set([t+Math.cos(De)*Ge*1.8,A-3-H()*5,n+Math.sin(De)*Ge*1.8],Ce*3),Z.set([N.x,N.y,N.z],Ce*3);const D=bv(pe.travel,kt.igniteMs,kt.igniteRampMs,lu);ie.set([Math.max(kt.sparksMs,D-620-H()*380),D],Ce*2)});const se={value:0},he=Bs(i,e,av,Ur(Y.length,{aFrom:new vt(re,3),aVia:new vt($,3),aTo:new vt(Z,3),aTiming:new vt(ie,2)}),{uTimeline:se});return{objects:[o,c,u,h,d,G.mesh,z.mesh,b,he],update:(pe,Ce)=>{const{projectorMs:De,projectorRampMs:Ge,beamMs:N,beamRampMs:D,igniteMs:L,igniteRampMs:C}=kt,B=Xi(pe,De,Ge),ne=Xi(pe,N,D),ge=Xi(pe,L,C);a.setRGB(2.3*B,.12*B,.09*B),l.setRGB(.25*B,1.2*B,1.7*B),f.setRGB(3.2*B,.9*B,.7*B);for(const k of[G,z])k.power.value=k.strength*B*(1-.35*ge),k.reach.value=ne*1.04;_.value=Xi(pe,N+D*.6,500),T.value=ge,se.value=pe;const R=Xi(pe,L+C-200,1600);b.rotation.y=.16*Math.sin(Ce*.42)*R,i.uHolo.value=.22*B+.78*ge},dispose:()=>{w.dispose()}}}function gx(i){return i instanceof st}function vx(i){i.traverse(e=>{if(e instanceof Ar){e.dispose(),e.geometry.dispose();return}if(!gx(e))return;e.geometry.dispose();const t=Array.isArray(e.material)?e.material:[e.material];for(const n of t){if(n instanceof _t)for(const r of Object.values(n.uniforms)){const s=r.value;s instanceof co&&s.dispose()}n.dispose()}})}function xx(i,e,t){const n=new Eg({canvas:i,antialias:!1,powerPreference:"high-performance",stencil:!1});let r=!1;n.debug.onShaderError=(pe,Ce,De,Ge)=>{r=!0,console.error("Tomato splash: shader compilation failed",pe.getShaderInfoLog(De),pe.getShaderInfoLog(Ge))},n.setClearColor(Qv,1);let s=Math.min(jv,window.devicePixelRatio||1);n.setPixelRatio(s);const a={uTime:{value:0},uDetail:{value:1},uHoloPos:{value:new O(jt.x,jt.y,jt.z)},uHolo:{value:0},uFogDensity:{value:.0034},uFogFalloff:{value:.0125}},o={value:new ae(1,1)},l=new nf,c=new Kt(60,1,.3,4e3);c.layers.enable(zo);const u=Gg(),f=n.capabilities.getMaxAnisotropy(),h=kv(f),d=sx(a);d.getReflectionCamera(c).layers.disable(zo);const g=fx(a),S=[mx(a,o),dx(a,o,h),px(a,o)],m=u.signs.map(pe=>({...pe,y:pe.y+pe.height/2,yaw:0}));l.add(ax(a),d,...rx(u,a),...lx(u,a),...g.objects,Go(a,m,Hv(f),1.45,!1),Go(a,u.screens,h,1,!0),...S.flatMap(pe=>pe.objects),ko(a,o,[...cx(u),...g.lights]),...ux(a,o),hx(a,o));const p=Jv(n,l,c);let w=0,T=!1,_=!1,b=!1,E=0,I=0,x=0,A=0,U=!1,G=-1,z=-1;const J=pe=>_||e?kt.holdMs:Math.min(kt.holdMs,pe-w),H=pe=>{const Ce=gi(pe/kt.cameraMs);c.position.set(Ce.position.x,Ce.position.y,Ce.position.z),c.fov=Ce.fov,c.updateProjectionMatrix(),c.lookAt(Ce.target.x,Ce.target.y,Ce.target.z)},Y=pe=>{(i.clientWidth!==G||i.clientHeight!==z)&&re();const Ce=J(pe),De=(pe-w)/1e3;a.uTime.value=De,p.time.value=De,H(Ce);for(const Ge of S)Ge.update(Ce,De);p.exposure.value=Xi(Ce,0,kt.fadeInMs),p.composer.render()},re=()=>{G=i.clientWidth,z=i.clientHeight;const pe=Math.max(1,G),Ce=Math.max(1,z);n.setPixelRatio(s),n.setSize(pe,Ce,!1),p.setSize(pe,Ce,s);const De=Ge=>Math.max(1,Math.round(Ge*s*tx));d.getRenderTarget().setSize(De(pe),De(Ce)),c.aspect=pe/Ce,c.updateProjectionMatrix(),T&&e&&!b&&Y(performance.now())},$=pe=>{U||(A>0&&(I+=1,I>8&&pe-A>24&&(x+=1)),A=pe,!(I<68)&&(U=!0,x>30&&s>Eu&&(s=Math.max(Eu,s*.72),re())))},Z=pe=>{b||(E=requestAnimationFrame(Z),Y(performance.now()),$(pe))},ie=()=>{if(!b){if(r)throw new Error("splash: a city shader failed to compile");w=performance.now(),T=!0,t(),e?Y(w):E=requestAnimationFrame(Z)}},se=pe=>{console.error("Tomato splash: WebGL scene failed; using the static brand.",pe),b=!0,cancelAnimationFrame(E),document.documentElement.dataset.scene="fallback",T||(T=!0,t())},he=new ResizeObserver(re);he.observe(i),re(),H(e?kt.holdMs:0),n.setRenderTarget(p.composer.renderTarget1);const Le=n.compileAsync(l,c);return n.setRenderTarget(null),Le.then(()=>{b||(p.exposure.value=0,p.composer.render(),ie())}).catch(se),{finish:()=>{_=!0,T&&e&&!b&&Y(performance.now())},stop:()=>{b=!0,cancelAnimationFrame(E),he.disconnect();for(const pe of S)pe.dispose();vx(l),p.dispose(),n.dispose()}}}function _x(i,e,t){if(i===null)return document.documentElement.dataset.scene="fallback",t(),bu;try{return xx(i,e,t)}catch(n){return console.error("Tomato splash: WebGL initialization failed; using the static brand.",n),document.documentElement.dataset.scene="fallback",t(),bu}}const Vo=window.matchMedia("(prefers-reduced-motion: reduce)").matches;function Mx(i){if(i===null||Vo)return{start:()=>{},finish:()=>{},stop:()=>{}};const e=i.dataset.text??i.textContent;let t,n,r=!1;const s=()=>{window.clearTimeout(t),n!==void 0&&window.clearInterval(n)};return{start:()=>{r||(t=window.setTimeout(()=>{const a=performance.now(),o=()=>{const l=(performance.now()-a)/kt.wordmarkMs;i.textContent=ku(e,l),l>=1&&n!==void 0&&(window.clearInterval(n),n=void 0)};o(),n=window.setInterval(o,40)},kt.wordmarkDelayMs))},finish:()=>{r=!0,s(),i.textContent=e},stop:s}}function Sx(i,e,t){let n=!1,r,s;const a=()=>{var o;n||(n=!0,window.clearTimeout(r),t(),document.documentElement.dataset.splash="done",s=window.setTimeout(()=>{i==null||i.classList.add("visible")},kt.waitingDelayMs),(o=window.tomatoSplash)==null||o.notifyAnimationDone())};return{start:()=>{n||(r=window.setTimeout(a,e))},finish:a,stop:()=>{window.clearTimeout(r),s!==void 0&&window.clearTimeout(s)}}}let Wo={finish:()=>{},stop:()=>{}};const Xo=Mx(document.querySelector(".wordmark-name")),qo=Sx(document.querySelector("#waiting"),Hu(Vo),()=>{Wo.finish(),Xo.finish()});Wo=_x(document.querySelector("#city-3d"),Vo,()=>{document.documentElement.dataset.clock="running",Xo.start(),qo.start()});const Cu=()=>{qo.finish()};window.addEventListener("pointerdown",Cu),window.addEventListener("keydown",i=>{i.key==="Escape"&&Cu()}),window.addEventListener("pagehide",()=>{qo.stop(),Xo.stop(),Wo.stop()},{once:!0})})();
