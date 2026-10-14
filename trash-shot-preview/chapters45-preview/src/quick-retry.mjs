// The shortcut belongs to live play; typing and other modal flows keep R.
export function quickRetryKey(event,{available=true}={}){
  if(!available||event?.isComposing||event?.repeat||event?.ctrlKey||event?.metaKey||event?.altKey||event?.shiftKey)return false;
  if(event?.code!=='KeyR'&&event?.key!=='r')return false;
  const targets=typeof event.composedPath==='function'?event.composedPath():[event.target];
  for(const target of targets){
    if(target?.isContentEditable||target?.getAttribute?.('role')==='textbox')return false;
    const tag=target?.tagName?.toUpperCase();
    if(tag==='TEXTAREA'||tag==='SELECT')return false;
    if(tag==='INPUT'&&!['button','submit','reset','range','checkbox','radio','color','file','image'].includes(target.type))return false;
  }
  return true;
}

// Only finishing a successful challenge opens a new scoring run. Cancelling
// an issued shot must not turn the following attempt into a hole-in-one.
export function quickRetryStartsRun({phase,stage,result}){
  return phase==='success'&&(result?.stageId===stage?.id
    ||stage?.successes>0&&stage?.activeShotId===null);
}

// An already queued callback must also be harmless after a retry.
export function createResultDelay({schedule=setTimeout,unschedule=clearTimeout}={}){
  let timer=null,epoch=0;
  function cancel(){epoch++;if(timer!==null)unschedule(timer);timer=null;}
  function run(callback,delay){
    cancel();const token=epoch;
    timer=schedule(()=>{if(token!==epoch)return;timer=null;callback();},delay);
  }
  return Object.freeze({run,cancel});
}
