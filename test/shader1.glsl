/*by musk License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.*/

//#define EXHAUST_LIGHT

float time = iGlobalTime+99.0; //i hate the name in the uniforms
float pi = 3.14159265359;

void angularRepeat(const float a, inout vec2 v)
{
    float an = atan(v.y,v.x);
    float len = length(v);
    an = mod(an+a*.5,a)-a*.5;
    v = vec2(cos(an),sin(an))*len;
}


void angularRepeat(const float a, const float offset, inout vec2 v)
{
    float an = atan(v.y,v.x);
    float len = length(v);
    an = mod(an+a*.5,a)-a*.5;
    an+=offset;
    v = vec2(cos(an),sin(an))*len;
}

float mBox(vec3 p, vec3 b)
{
	return max(max(abs(p.x)-b.x,abs(p.y)-b.y),abs(p.z)-b.z);
}

float mSphere(vec3 p, float r)
{
    return length(p)-r;
}


vec2 frot(const float a, in vec2 v)
{
    float cs = cos(a), ss = sin(a);
    vec2 u = v;
    v.x = u.x*cs + u.y*ss;
    v.y = u.x*-ss+ u.y*cs;
    return v;
}

void rotate(const float a, inout vec2 v)
{
    float cs = cos(a), ss = sin(a);
    vec2 u = v;
    v.x = u.x*cs + u.y*ss;
    v.y = u.x*-ss+ u.y*cs;
}

float rocketRotation = sin(time)*.1;

float dfRocketBody(vec3 p)
{
    rotate(rocketRotation,p.yz);
    
    vec3 p2 = p;
    vec3 pWindow = p;
    
    angularRepeat(pi*.25,p2.zy);
    float d = p2.z;
    d = max(d, frot(pi*-.125, p2.xz+vec2(-.7,0)).y);
    d = max(d, frot(pi*-.25*.75, p2.xz+vec2(-0.95,0)).y);
    d = max(d, frot(pi*-.125*.5, p2.xz+vec2(-0.4,0)).y);
    d = max(d, frot(pi*.125*.25, p2.xz+vec2(+0.2,0)).y);
    d = max(d, frot(pi*.125*.8, p2.xz+vec2(.55,0)).y);
    d = max(d,-.8-p.x);
    d -= .5;
    
    vec3 pThruster = p2;
    pThruster -= vec3(-1.46,.0,.0);
    rotate(pi*-.2,pThruster.xz);
    d = min(d,mBox(pThruster,vec3(.1,.4,.27)));
    d = min(d,mBox(pThruster-vec3(-.09,.0,.0),vec3(.1,.3,.07)));
    
    
    pWindow -= vec3(.1,.0,.0);
    angularRepeat(pi*.25,pWindow.xy);
    pWindow -= vec3(.17,.0,.0);
    d = min(d,mBox(pWindow,vec3(.03,.2,.55)));
    
  	return d;
}

float dfRocketFins(vec3 p)
{
    rotate(rocketRotation,p.yz);
    
    vec3 pFins = p;
    angularRepeat(pi*.5,pFins.zy);
    pFins -= vec3(-1.0+cos(p.x+.2)*.5,.0,.0);
    rotate(pi*.25,pFins.xz);
    float scale = 1.0-pFins.z*.5;
    float d =mBox(pFins,vec3(.17,.03,3.0)*scale)*.5;
    return d;
}

float dfRocket(vec3 p)
{
    float proxy = mBox(p,vec3(2.5,.8,.8));
    if (proxy>1.0)
    	return proxy;
    return min(dfRocketBody(p),dfRocketFins(p));
}

float dfTrailPart(vec3 p, float t)
{
    vec3 pm = p;
    pm.x = mod(p.x+1.0+t,2.0)-1.0;
    float index = p.x-pm.x;
    
    float rpos =(-1.7-index);
    
    
    float i2 = rpos;
    
    float rs = .5;
    
    float rtime1 = (t*.32 + i2*0.2)*rs;
	float rtime2 = (t*.47 + i2*0.3)*rs;
	float rtime3 = (t*.53 + i2*0.1)*rs;
	mat3 rot = mat3(cos(rtime1),0,sin(rtime1),0,1,0,-sin(rtime1),0,cos(rtime1))*
    mat3(cos(rtime2),sin(rtime2),.0,-sin(rtime2),cos(rtime2),.0,0,0,1)*
    mat3(1,0,0,0,cos(rtime3),sin(rtime3),0,-sin(rtime3),cos(rtime3));
    
    //p -= vec3(-2.0,.0,.0);
    float size = .6-.5/(1.0+rpos);
    size = min(size,.6-.5/(17.0-rpos));
    size = max(size,.0);
    return mBox(pm*rot,vec3(size));
}

float dfTrail(vec3 p)
{
    float clip = max(p.x+1.7, -1.7-16.0-p.x);
    float proxy = max(abs(p.y)-1.0, abs(p.z)-1.0);
    float proxy2 = max(clip,proxy);
    if (proxy2>0.5) return proxy2;
    
    float d = 999.0;
    for (int i=0; i<3; i++)
    {
        d=min(d,dfTrailPart(p,time*6.0+float(i)*21.33));
    }
        
    return max(d,clip);
}

float dfTerraHills(vec3 p)
{
    p.y+=sin(p.x*.05)*2.0+1.0;
    vec3 pm = p;
    pm.xz = mod(pm.xz+vec2(8.0),16.0)-vec2(8.0);
    pm = abs(pm);
    return p.y*.8+3.0+pm.x*.1+pm.z*.1;
}

float dfTerra(vec3 p)
{
    p.x+=time*4.0;
    vec3 p2 = p;
    
    float height = (sin(p.x*.1)+sin(p.z*.1));
    rotate(.6,p2.xz);
    return max(dfTerraHills(p2),dfTerraHills(p))+height;
}

float df(vec3 p)
{
    return min(min(dfRocket(p),dfTrail(p)),dfTerra(p));
}

vec3 nf(vec3 p)
{
    vec2 e = vec2(0,0.005);
    return normalize(vec3(df(p+e.yxx),df(p+e.xyx),df(p+e.xxy)));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
	vec2 uv = (fragCoord.xy-iResolution.xy*.5) / iResolution.yy;
    vec2 mouse = (iMouse.xy-iResolution.xy*.5) / iResolution.yy;
    
    vec3 pos = vec3(.1,.1,-5);
    //vec3 dir = normalize(vec3(uv,1.0));
    vec3 dir = normalize(vec3(uv,1.0));
    
    float rx = -mouse.x*8.0 + time*.04 -2.7;
    float ry = mouse.y*8.0 + time*.024+1.2;
     
    rotate(ry,pos.yz);
    rotate(ry,dir.yz);
    rotate(-rx,pos.xz);
    rotate(-rx,dir.xz);  
    rotate(.1,pos.xy);
    rotate(.1,dir.xy);  
    pos*=(pos.y*.25+1.5)*.6;
    
    float dist,tdist = .0;
    
    for (int i=0; i<100; i++)
    {
     	dist = df(pos);
       	pos += dist*dir;
        tdist+=dist;
        if (dist<0.000001||dist>20.0)break;
    }
    
    vec3 light = normalize(vec3(1,2,3));
    
    
    vec3 skyColor = vec3(.1,.3,.7)*.7;
    
    vec3 ambientColor = skyColor*.07;
    vec3 materialColor = vec3(.5,.5,.5);
    vec3 emissiveColor = vec3(.0,.0,.0);
    
    float dTerra = dfTerra(pos);
    float dTrail = dfTrail(pos);
    float dRocketBody = dfRocketBody(pos);
    float dRocketFins = dfRocketFins(pos);
    float dRocket = min(dRocketBody, dRocketFins);
    float dRocketTrail = min(dRocket, dTrail);
    
    
    if (dTerra<dRocketTrail)
    {
        materialColor = vec3(.3,.4,.1);
    }
    else if (dTrail<dRocket)
    {
    	materialColor = vec3(.1,.1,.1);
        float tpos = (-pos.x-1.7)/16.0;
        emissiveColor = vec3(1.9,.9,.2)*pow((1.0-tpos),8.0);
    }
    else 
    {
        //rocket
        ambientColor = mix(skyColor,vec3(.3,.1,.3)*.4,.5);
        if (dfRocketBody(pos)<dfRocketFins(pos))
        {
            if (pos.x<-.85 || pos.x>1.0)
                if (pos.x<-1.31)
                    materialColor = vec3(.25,.25,.25);
                else
                    materialColor = vec3(.9,.1,.1);
            else
            {
                materialColor = vec3(.8,.8,.8);
            }
        }
        else
            materialColor = vec3(.9,.1,.1);
    }
    
    float value = 
        df(pos+light)+
        df(pos+light*.5)*2.0+
        df(pos+light*.25)*4.0+
        df(pos+light*.125)*8.0+
        df(pos+light*.06125)*16.0;
    
    value=value*.2+.04;
    value=min(value,1.0);
    value=max(.0,value);
    
    vec3 normal = nf(pos);
   
    vec3 ref = reflect(dir,nf(pos));
    //float ro = min(max(min(min(df(pos+ref),df(pos+ref*0.25)*4.0), df(pos+ref*.5)*2.0)*.5,.0),1.0);
   	float ro=1.0;
    
    float ao = df(pos+normal*.125)*8.0 +
        df(pos+normal*.5)*2.0 +
    	df(pos+normal*.25)*4.0 +
    	df(pos+normal*.06125)*16.0;
    
    ao=ao*.125+.5;
    
    float fres = pow((dot(dir,normal)*.5+.5),2.0);
    vec3 color = vec3(.0,.0,.0); 
    #ifdef EXHAUST_LIGHT
    vec3 exhaustLightDir = vec3(-1.9+sin(time*14.0)*.02,+cos(time*20.0)*.02,+sin(time*20.0)*.02)-pos;
    float exhaustLightDistance = length(exhaustLightDir);
    exhaustLightDir/=exhaustLightDistance;
    //compute exhaust direct light
    float exhaustLightDiffuse = max(.0,dot(normal,exhaustLightDir)*.8+.2)/(0.5+exhaustLightDistance*exhaustLightDistance);
    exhaustLightDiffuse*=max(.0,min(df(pos+exhaustLightDir*.1)*10.0*.8+.2,df(pos+exhaustLightDir*.05)*20.0*.8+.2)*.8+.2); //occlude exhaust light
    color += exhaustLightDiffuse*vec3(1.9,.9,.2)*.7;
    #endif
    
   
    color +=(value*vec3(dot(nf(pos),light)*.5+.5)*.5+ambientColor*ao)*materialColor +fres*.25;
    color += emissiveColor;
   
    vec3 cSky = skyColor + pow(dot(dir,light)*.5+.5,8.0);
    if (dist>1.0) color = cSky;
    else color = mix(cSky,color,1.0/(1.0+tdist*.005));
    
    color*=1.3; //boost
    color -= pow(length(uv),2.0)*.07;
    color = mix(color,vec3(length(color)),length(color)*.5);
    
	fragColor = vec4(pow(color,vec3(1.0/2.2)),1.0);
    //fragColor = vec4(ro);
    //fragColor = vec4(ao);
    //fragColor = vec4(value);
}