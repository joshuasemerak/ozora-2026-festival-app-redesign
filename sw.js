const CACHE="ozora-2026-redesign-v22";
const APP_SHELL=["./index.html","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(APP_SHELL.map(async url=>{
      const response=await fetch(url,{cache:"reload"});
      if(!response.ok)throw new Error("Could not cache "+url);
      await cache.put(url,response);
    }));
  })());
  self.skipWaiting();
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  if(event.request.mode==="navigate"){
    event.respondWith((async()=>{
      try{
        const response=await fetch(event.request);
        if(response&&response.ok){
          const cache=await caches.open(CACHE);
          await cache.put("./index.html",response.clone());
        }
        return response;
      }catch(error){
        return (await caches.match("./index.html"))||(await caches.match(event.request,{ignoreSearch:true}));
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(event.request,{ignoreSearch:true});
    if(cached)return cached;
    try{
      const response=await fetch(event.request);
      if(response&&response.ok){
        const cache=await caches.open(CACHE);
        await cache.put(event.request,response.clone());
      }
      return response;
    }catch(error){
      return new Response("",{status:504,statusText:"Offline"});
    }
  })());
});