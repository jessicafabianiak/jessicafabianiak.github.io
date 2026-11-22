/* Multiscale scroll: the background zooms from a galaxy to a nucleus as the page scrolls. */
(function(){
  var c=document.getElementById('cosmos'); if(!c) return;
  var x=c.getContext('2d');
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small=Math.min(innerWidth,innerHeight)<700;
  var dpr=Math.min(window.devicePixelRatio||1, small?1.5:2);
  var W,H,CX,CY,R;
  var secs=[].slice.call(document.querySelectorAll('[data-scene]'));
  var gauge=document.getElementById('gauge'), gv=document.getElementById('gauge-val');
  var GOLD='242,196,109', BLUE='124,196,255', VIOLET='167,139,250', WHITE='235,235,255';
  function rnd(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  /* ---------- static data ---------- */
  var r=rnd(11), stars=[], N=small?260:520;
  for(var i=0;i<N;i++) stars.push({a:r()*6.283,d:Math.pow(r(),.6),s:r()*1.3+.3,p:r()*6.28,h:r()<.12?(r()<.5?GOLD:BLUE):WHITE});
  var arms=[]; for(i=0;i<(small?700:1400);i++){var arm=i%2, t=r()*1, ang=arm*Math.PI+t*4.2+ (r()-.5)*.5; arms.push({t:t,ang:ang,j:(r()-.5)*.08,s:r()*1.2+.2,h:r()<.25?VIOLET:(r()<.3?GOLD:BLUE)});}
  var ejecta=[], EL=['H','He','C','N','O','Ne','Si','Fe','Ni','Au','U'];
  for(i=0;i<46;i++) ejecta.push({a:r()*6.283,v:.25+r()*.75,o:r(),el:EL[Math.floor(r()*EL.length)]});
  var places=[ // name, lat, lon
    ['Omaha',41.26,-95.94],['New Paltz',41.75,-74.09],['Paris-Saclay',48.71,2.17],['Greece',37.98,23.73],['Osaka',34.69,135.5],['Perth',-31.95,115.86]];
  var crowd=[]; for(i=0;i<56;i++){crowd.push({col:i%14,row:Math.floor(i/14),h:.8+r()*.45,g:r()<.5,ph:r()*6.28,sp:.6+r()*1.4});}
  var hits=[]; // double-slit screen hits
  function slitSample(){ // sample interference pattern y in [-1,1]
    for(;;){var y=r()*2-1, k=y*Math.PI*6, env=Math.pow(Math.sin(y*5+1e-9)/(y*5+1e-9),2), p=Math.pow(Math.cos(k),2)*env; if(r()<p) return y;}}
  var flying=[];
  var nucleons=[]; (function(){var n=0;while(nucleons.length<22&&n<2000){n++;var a=r()*6.283,b=Math.acos(2*r()-1),rr=Math.cbrt(r())*.9;var p={x:rr*Math.sin(b)*Math.cos(a),y:rr*Math.sin(b)*Math.sin(a),z:rr*Math.cos(b),pr:nucleons.length%2===0,ph:r()*6.28};nucleons.push(p);}})();
  var tracks=[];

  function size(){W=c.width=innerWidth*dpr;H=c.height=innerHeight*dpr;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';CX=W/2;CY=H*.42;R=Math.min(W,H)*.34;}

  /* ---------- scenes: each draws centred on (CX,CY) at zoom z, opacity al ---------- */
  function glow(px,py,rad,col,a){var g=x.createRadialGradient(px,py,0,px,py,rad);g.addColorStop(0,'rgba('+col+','+a+')');g.addColorStop(1,'rgba('+col+',0)');x.fillStyle=g;x.beginPath();x.arc(px,py,rad,0,6.283);x.fill();}

  var S={};
  S.galaxy=function(z,al,t){
    var rot=t*.00003;
    glow(CX,CY,R*1.6*z,VIOLET,.18*al); glow(CX,CY,R*.45*z,GOLD,.35*al);
    for(var i=0;i<arms.length;i++){var p=arms[i],rr=(p.t*1.5+.05)*R*z,a=p.ang+rot*(1.6-p.t);
      var px=CX+Math.cos(a+p.j)*rr, py=CY+Math.sin(a+p.j)*rr*.55;
      x.fillStyle='rgba('+p.h+','+(.75*al*(1-p.t*.5))+')';x.fillRect(px,py,p.s*dpr,p.s*dpr);}
  };
  S.star=function(z,al,t){
    var rr=R*.55*z;
    glow(CX,CY,rr*3.2,GOLD,.22*al); glow(CX,CY,rr*1.6,'255,170,80',.45*al);
    var g=x.createRadialGradient(CX-rr*.25,CY-rr*.25,rr*.1,CX,CY,rr);g.addColorStop(0,'rgba(255,246,214,'+al+')');g.addColorStop(.6,'rgba(255,190,90,'+al+')');g.addColorStop(1,'rgba(220,110,40,'+al+')');
    x.fillStyle=g;x.beginPath();x.arc(CX,CY,rr,0,6.283);x.fill();
    x.font=(11*dpr)+'px "JetBrains Mono",monospace';x.textAlign='center';
    for(var i=0;i<ejecta.length;i++){var e=ejecta[i],k=((t*.00004*e.v+e.o)%1),d=rr*(1.1+k*3.2);
      x.fillStyle='rgba('+GOLD+','+(al*(1-k)*.9)+')';x.fillText(e.el,CX+Math.cos(e.a)*d,CY+Math.sin(e.a)*d);}
  };
  S.earth=function(z,al,t){
    var rr=R*.95*z, lon0=-60+t*.004;
    glow(CX,CY,rr*1.35,BLUE,.25*al);
    var g=x.createRadialGradient(CX-rr*.3,CY-rr*.35,rr*.1,CX,CY,rr);g.addColorStop(0,'rgba(40,80,160,'+al+')');g.addColorStop(1,'rgba(8,16,48,'+al+')');
    x.fillStyle=g;x.beginPath();x.arc(CX,CY,rr,0,6.283);x.fill();
    function proj(lat,lon){var la=lat*Math.PI/180,lo=(lon-lon0)*Math.PI/180,la0=20*Math.PI/180;
      var cx_=Math.cos(la)*Math.sin(lo), cy_=Math.cos(la0)*Math.sin(la)-Math.sin(la0)*Math.cos(la)*Math.cos(lo), cz=Math.sin(la0)*Math.sin(la)+Math.cos(la0)*Math.cos(la)*Math.cos(lo);
      return [CX+cx_*rr, CY-cy_*rr, cz];}
    x.strokeStyle='rgba('+BLUE+','+(.18*al)+')';x.lineWidth=1*dpr;
    for(var la=-60;la<=60;la+=30){x.beginPath();var st=0;for(var lo=-180;lo<=180;lo+=6){var p=proj(la,lo);if(p[2]>0){st?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);st=1;}else st=0;}x.stroke();}
    for(lo=-180;lo<180;lo+=30){x.beginPath();st=0;for(la=-80;la<=80;la+=6){p=proj(la,lo);if(p[2]>0){st?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);st=1;}else st=0;}x.stroke();}
    var P=places.map(function(q){return proj(q[1],q[2]);}), home=P[0];
    for(var i=1;i<P.length;i++){var q=P[i]; if(q[2]<=0||home[2]<=0) continue;
      var mx=(home[0]+q[0])/2, my=(home[1]+q[1])/2, dx=mx-CX, dy=my-CY, dl=Math.hypot(dx,dy)||1, lift=Math.hypot(q[0]-home[0],q[1]-home[1])*.35;
      x.strokeStyle='rgba('+(i===2?GOLD:VIOLET)+','+(.8*al)+')';x.lineWidth=1.6*dpr;x.beginPath();x.moveTo(home[0],home[1]);x.quadraticCurveTo(mx+dx/dl*lift,my+dy/dl*lift,q[0],q[1]);x.stroke();}
    x.font=(11*dpr)+'px "JetBrains Mono",monospace';x.textAlign='left';
    for(i=0;i<P.length;i++){q=P[i];if(q[2]<=0)continue;var pulse=.6+.4*Math.sin(t*.003+i);
      glow(q[0],q[1],7*dpr,GOLD,al*pulse);x.fillStyle='rgba('+GOLD+','+al+')';x.beginPath();x.arc(q[0],q[1],2.4*dpr,0,6.283);x.fill();
      x.fillStyle='rgba('+WHITE+','+(.85*al)+')';x.fillText(places[i][0],q[0]+6*dpr,q[1]-6*dpr);}
  };
  function figure(px,py,h,col,a,lean){ // simple standing person
    x.strokeStyle='rgba('+col+','+a+')';x.fillStyle='rgba('+col+','+a+')';x.lineWidth=Math.max(1,h*.09);x.lineCap='round';
    var hx=px+lean*h*.5;
    x.beginPath();x.arc(hx,py-h*.88,h*.1,0,6.283);x.fill();
    x.beginPath();x.moveTo(hx,py-h*.76);x.lineTo(px+lean*h*.2,py-h*.4);x.lineTo(px-h*.12,py);x.moveTo(px+lean*h*.2,py-h*.4);x.lineTo(px+h*.12,py);
    x.moveTo(hx-h*.02,py-h*.68);x.lineTo(hx-h*.2,py-h*.45);x.moveTo(hx+h*.02,py-h*.68);x.lineTo(hx+h*.2,py-h*.45);x.stroke();}
  S.crowd=function(z,al,t){
    var sp=R*.3*z, base=R*.42*z;
    for(var i=0;i<crowd.length;i++){var p=crowd[i],px=CX+(p.col-6.5)*sp*.62+(p.row%2)*sp*.3,py=CY+(p.row-1.2)*sp*.95+base*.4;
      var lean=Math.sin(t*.001*p.sp+p.ph)*(p.g?.06:.22);
      figure(px,py,base*.5*p.h,p.g?BLUE:VIOLET,.55*al,lean);}
    // the "average person": dashed gold outline that matches no one
    x.setLineDash([5*dpr,5*dpr]);figure(CX,CY+base*.55,base*1.05,GOLD,.95*al,0);x.setLineDash([]);
    x.font=(12*dpr)+'px "JetBrains Mono",monospace';x.textAlign='center';x.fillStyle='rgba('+GOLD+','+al+')';x.fillText('the average person',CX,CY+base*.55+16*dpr);
  };
  S.person=function(z,al,t){
    var h=R*1.25*z, tilt=Math.sin(t*.0011)*.12+Math.sin(t*.0027)*.05, px=CX, py=CY+h*.5;
    x.save();x.translate(px,py);x.rotate(tilt);
    x.fillStyle='rgba('+GOLD+','+(.8*al)+')';x.fillRect(-h*.3,-h*.03,h*.6,h*.03); // board
    x.restore();
    x.fillStyle='rgba('+GOLD+','+(.6*al)+')';x.beginPath();x.arc(px,py+h*.01,h*.06,Math.PI,0);x.fill(); // pivot
    var lean=-tilt*.8; figure(px,py-h*.03,h*.95,WHITE,.85*al,lean);
    // motion-capture markers
    var hx=px+lean*h*.47, joints=[[hx,py-h*.87],[hx,py-h*.75],[px+lean*h*.19,py-h*.42],[px-h*.11,py-h*.03],[px+h*.11,py-h*.03],[hx-h*.19,py-h*.46],[hx+h*.19,py-h*.46],[px-h*.06,py-h*.22],[px+h*.06,py-h*.22]];
    for(var i=0;i<joints.length;i++){glow(joints[i][0],joints[i][1],6*dpr,BLUE,.9*al);}
    // head trace: a wandering trail
    if(!S.trace)S.trace=[]; S.trace.push([hx,py-h*.87]); if(S.trace.length>160)S.trace.shift();
    x.strokeStyle='rgba('+VIOLET+','+(.5*al)+')';x.lineWidth=1*dpr;x.beginPath();
    for(i=0;i<S.trace.length;i++){var q=S.trace[i];i?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]);}x.stroke();
  };
  S.atom=function(z,al,t,dt){
    var w=R*2.2*z, hgt=R*1.5*z, left=CX-w/2, slitX=CX-w*.12, scr=CX+w/2, gap=hgt*.12, sw=hgt*.035;
    x.fillStyle='rgba('+WHITE+','+(.35*al)+')';
    x.fillRect(slitX-2*dpr,CY-hgt/2,4*dpr,hgt/2-gap-sw);x.fillRect(slitX-2*dpr,CY-gap+sw,4*dpr,2*(gap-sw));x.fillRect(slitX-2*dpr,CY+gap+sw,4*dpr,hgt/2-gap-sw);
    x.fillStyle='rgba('+BLUE+','+(.25*al)+')';x.fillRect(scr,CY-hgt/2,3*dpr,hgt);
    // wavefronts from the two slits
    x.strokeStyle='rgba('+BLUE+','+(.12*al)+')';x.lineWidth=1*dpr;
    for(var k=0;k<7;k++){var rr=((t*.04+k*w*.09)%(w*.62));x.beginPath();x.arc(slitX,CY-gap,rr,-1.1,1.1);x.stroke();x.beginPath();x.arc(slitX,CY+gap,rr,-1.1,1.1);x.stroke();}
    if(!still&&al>.2&&Math.random()<.5){flying.push({x:0,y:slitSample()});}
    for(var i=flying.length-1;i>=0;i--){var f=flying[i];f.x+=dt*.0009;var fx=left+(scr-left)*Math.min(f.x,1),fy;
      if(fx<slitX){fy=CY+(f.y>0?gap:-gap)*Math.min(1,(fx-left)/(slitX-left))*.0+((f.y>0?1:-1)*gap)*((fx-left)/(slitX-left));}
      else{var u=(fx-slitX)/(scr-slitX);fy=CY+(f.y>0?gap:-gap)*(1-u)+f.y*hgt*.45*u;}
      glow(fx,fy,5*dpr,BLUE,.9*al);
      if(f.x>=1){hits.push(f.y);if(hits.length>1800)hits.shift();flying.splice(i,1);}}
    x.fillStyle='rgba('+GOLD+','+(.8*al)+')';
    var rh=rnd(5);for(i=0;i<hits.length;i++){x.fillRect(scr+4*dpr+rh()*14*dpr,CY+hits[i]*hgt*.45,1.6*dpr,1.6*dpr);}
  };
  S.nucleus=function(z,al,t){
    var rr=R*.42*z, rot=t*.0002;
    glow(CX,CY,rr*2.6,VIOLET,.25*al);
    var pts=nucleons.map(function(n){var ca=Math.cos(rot),sa=Math.sin(rot),X=n.x*ca-n.z*sa,Z=n.x*sa+n.z*ca,j=Math.sin(t*.004+n.ph)*.02;return {x:CX+(X+j)*rr,y:CY+(n.y+j)*rr,z:Z,pr:n.pr};}).sort(function(a,b){return a.z-b.z;});
    for(var i=0;i<pts.length;i++){var p=pts[i],s=rr*.28*(1+p.z*.15),col=p.pr?'242,170,90':'110,160,255';
      var g=x.createRadialGradient(p.x-s*.3,p.y-s*.3,s*.1,p.x,p.y,s);g.addColorStop(0,'rgba(255,255,255,'+al+')');g.addColorStop(.35,'rgba('+col+','+al+')');g.addColorStop(1,'rgba('+col+','+(al*.15)+')');
      x.fillStyle=g;x.beginPath();x.arc(p.x,p.y,s,0,6.283);x.fill();}
    if(!still&&al>.3&&Math.random()<.025&&tracks.length<5){var a=Math.random()*6.283;tracks.push({x:CX,y:CY,a:a,v:(2+Math.random()*2)*dpr,k:(Math.random()<.5?-1:1)*(.01+Math.random()*.03),life:0,pts:[],col:Math.random()<.5?BLUE:GOLD});}
    for(i=tracks.length-1;i>=0;i--){var k2=tracks[i];k2.life++;k2.a+=k2.k;k2.k*=1.01;k2.v*=.993;k2.x+=Math.cos(k2.a)*k2.v;k2.y+=Math.sin(k2.a)*k2.v;k2.pts.push([k2.x,k2.y]);
      var fade=1-k2.life/150;if(fade<=0){tracks.splice(i,1);continue;}
      x.strokeStyle='rgba('+k2.col+','+(.7*fade*al)+')';x.lineWidth=1.2*dpr;x.beginPath();for(var m=0;m<k2.pts.length;m++){var q=k2.pts[m];m?x.lineTo(q[0],q[1]):x.moveTo(q[0],q[1]);}x.stroke();}
  };
  S.void=function(){};

  function starfield(z,al,t){ // stars that stream outward as we zoom: the sense of falling inward
    for(var i=0;i<stars.length;i++){var s=stars[i],d=(s.d*Math.max(W,H)*.75)*z,px=CX+Math.cos(s.a)*d,py=CY+Math.sin(s.a)*d;
      if(px<0||py<0||px>W||py>H)continue;var tw=still?.8:.45+.55*Math.abs(Math.sin(s.p+t*.0006));
      x.fillStyle='rgba('+s.h+','+(tw*al)+')';x.fillRect(px,py,s.s*dpr,s.s*dpr);}}

  /* ---------- scroll position -> (scene index, local progress) ---------- */
  function where(){var mid=innerHeight*.5;
    for(var i=0;i<secs.length;i++){var b=secs[i].getBoundingClientRect();if(b.top<=mid&&b.bottom>mid)return [i,(mid-b.top)/b.height];}
    return secs.length&&secs[0].getBoundingClientRect().top>mid?[0,0]:[secs.length-1,.99];}

  var last=performance.now(), shown=-1;
  function frame(t){
    var dt=Math.min(50,t-last);last=t;
    x.clearRect(0,0,W,H);
    var w=where(),i=w[0],u=w[1];
    var fadeStart=.72, a1=u<fadeStart?1:1-(u-fadeStart)/(1-fadeStart), z1=1+u*1.6;
    starfield(1+ (i+u)*.35, .9, t);
    var A=secs[i].dataset.scene, B=secs[i+1]&&secs[i+1].dataset.scene;
    S[A](z1,a1,t,dt);
    if(B&&u>fadeStart){var v=(u-fadeStart)/(1-fadeStart);S[B](.25+v*.75,v,t,dt);}
    var label=(B&&u>.86)?secs[i+1].dataset.scale:secs[i].dataset.scale;
    if(gv&&gv.textContent!==label){gv.textContent=label;}
    if(!still)requestAnimationFrame(frame);
  }
  addEventListener('resize',function(){size();if(still)frame(performance.now());});
  if(still)addEventListener('scroll',function(){frame(performance.now());},{passive:true});
  size(); still?frame(performance.now()):requestAnimationFrame(frame);
})();
