import {createOnlineRoom,ONLINE_BUILD,ONLINE_LIMITS,onlinePacket,onlineState,onlineInput,onlineName,packet} from './online-room.mjs';
import {createOnlineCourse} from './online-course.mjs';

// Peer identity is taken from the open DataConnection, never a message's id.
// Reliable ordered channels carry bounded input/state messages, not video.
export function createOnlineSession({PeerClass,now=()=>performance.now(),canHost=()=>false,onChange=()=>{},onError=()=>{},onEvent=()=>{}}){
  let peer=null,hostConnection=null,room=null,state=null,selfId=null,host=false,closed=false,clockOffset=0,bestRtt=Infinity,lastBroadcast=-Infinity;
  const connections=new Map(),courses=new Map(),seen=new Map(),pendingPings=new Map();
  let pendingShot=false,lastPing=-Infinity;
  const emit=()=>onChange(snapshot());
  const hostNow=()=>now()+clockOffset;
  function snapshot(){return {selfId,host,connected:!closed&&!!state,state:state?structuredClone(state):null,pendingShot,roomId:host?selfId:hostConnection?.peer??null,rtt:Number.isFinite(bestRtt)?bestRtt:null};}
  function fail(reason){pendingShot=false;onError(reason);emit();}
  function send(connection,value){
    if(!connection?.open)return false;
    if(connection.dataChannel?.bufferedAmount>65536 || connection.bufferSize>32){connection.close();return false;}
    try{connection.send(value);return true;}catch{connection.close();return false;}
  }
  const broadcast=value=>{for(const connection of connections.values())send(connection,value);};
  function syncCourses(next){
    if(!onlineState(next))return false;
    const reset=state?.stageId!==next.stageId || state?.round!==next.round || next.phase==='lobby'&&state?.phase!=='lobby';
    if(reset){courses.clear();seen.clear();pendingShot=false;}
    if(!reset)for(const previous of state?.players??[]){const player=next.players.find(p=>p.id===previous.id);if(previous.shot&&player&&!player.shot&&!player.dnf)courses.get(previous.id)?.advanceTo(12.1);}
    state=structuredClone(next);
    for(const p of state.players){if(!courses.has(p.id))courses.set(p.id,createOnlineCourse(state.stageId));if(p.shot)acceptShot(p.shot);}
    for(const id of courses.keys())if(!state.players.some(p=>p.id===id))courses.delete(id);
    return true;
  }
  function acceptShot(shot){
    if(!state || shot?.round!==state.round || !state.players.some(p=>p.id===shot.id) || !onlineInput(shot.input,state.stageId) || !Number.isInteger(shot.seq) ||
      !Number.isFinite(shot.startedAt) || shot.startedAt<0 || shot.startedAt>ONLINE_LIMITS.roundMs || shot.seq<1)return false;
    if((seen.get(shot.id)??0)>=shot.seq)return false;
    const course=courses.get(shot.id);if(!course)return false;
    // Catch up the preceding throw before applying a later reliable event.
    if(seen.has(shot.id))course.advanceTo(12.1);
    if(!course.launch(shot.input,shot.startedAt/1000))return false;
    seen.set(shot.id,shot.seq);if(shot.id===selfId)pendingShot=false;
    onEvent({type:'accepted',shot:structuredClone(shot)});return true;
  }
  function publish(){
    const next=room.snapshot();syncCourses(next);broadcast(packet('state',{state:next,hostNow:now()}));lastBroadcast=now();emit();
  }
  function accepted(id,input){
    const shot=room.launch(id,input);if(!shot)return false;
    // Install the authoritative state first, then send a recoverable input event.
    syncCourses(room.snapshot());broadcast(packet('accepted',{shot}));publish();return true;
  }
  function listenHost(connection){
    let admitted=false,windowStart=now(),messages=0;
    const admissionTimer=setTimeout(()=>{if(!admitted)connection.close();},10000);
    connection.on('data',value=>{
      if(now()-windowStart>=1000){windowStart=now();messages=0;}
      if(++messages>30 || !onlinePacket(value)){connection.close();return;}
      if(!admitted){
        if(value.kind!=='hello'){connection.close();return;}
        const result=room.join(connection.peer,value.name,value.build);
        if(!result.ok){send(connection,packet('error',{reason:result.reason}));setTimeout(()=>connection.close(),100);return;}
        admitted=true;clearTimeout(admissionTimer);connections.set(connection.peer,connection);
        send(connection,packet('welcome',{state:room.snapshot(),hostNow:now()}));publish();return;
      }
      if(value.kind==='ready'){if(room.ready(connection.peer,value.ready))publish();}
      else if(value.kind==='shot'){if(!accepted(connection.peer,value.input))send(connection,packet('error',{reason:'shot-rejected'}));}
      else if(value.kind==='ping'&&Number.isInteger(value.nonce))send(connection,packet('pong',{nonce:value.nonce,hostNow:now()}));
      else if(value.kind==='leave')connection.close();
      else connection.close();
    });
    connection.on('close',()=>{clearTimeout(admissionTimer);if(connections.get(connection.peer)===connection){connections.delete(connection.peer);room.leave(connection.peer);publish();}});
    connection.on('error',()=>connection.close());
  }
  function openPeer(){
    if(peer)throw new Error('Session already open');closed=false;
    return new Promise((resolve,reject)=>{
      peer=new PeerClass(undefined,{debug:0});let opened=false;
      const timer=setTimeout(()=>{if(!opened){peer.destroy();reject(new Error('connection-timeout'));}},15000);
      peer.on('open',id=>{opened=true;clearTimeout(timer);selfId=id;resolve(id);});
      peer.on('error',error=>{clearTimeout(timer);if(!opened)reject(new Error(error.type??'network'));else fail(error.type??'network');});
      peer.on('disconnected',()=>{if(!closed)fail('signaling-disconnected');});
    });
  }
  async function create(stageId,name){
    if(!canHost(stageId))throw new RangeError('Host course is not eligible');
    host=true;await openPeer();room=createOnlineRoom({hostId:selfId,name,stageId,canHost,now});peer.on('connection',listenHost);publish();return snapshot();
  }
  async function join(roomId,name){
    if(typeof roomId!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(roomId))throw new RangeError('Invalid room code');
    host=false;await openPeer();hostConnection=peer.connect(roomId,{label:'trashoot-four-v1',serialization:'json',reliable:true,metadata:{build:ONLINE_BUILD}});
    peer.on('connection',connection=>connection.close());
    const timer=setTimeout(()=>{if(!state){fail('connection-timeout');hostConnection.close();}},15000);
    hostConnection.on('open',()=>send(hostConnection,packet('hello',{name:onlineName(name)})));
    hostConnection.on('data',value=>{
      if(!onlinePacket(value)){hostConnection.close();return;}
      if(value.kind==='welcome' || value.kind==='state'){
        if(!Number.isFinite(value.hostNow)||!onlineState(value.state)||value.state.hostId!==hostConnection.peer||!value.state.players.some(p=>p.id===selfId)){hostConnection.close();return;}
        if(!state)clockOffset=value.hostNow-now();
        if(syncCourses(value.state)){clearTimeout(timer);emit();}
      }else if(value.kind==='accepted'){acceptShot(value.shot);emit();}
      else if(value.kind==='pong'){
        const sent=pendingPings.get(value.nonce);if(sent===undefined||!Number.isFinite(value.hostNow))return;
        pendingPings.delete(value.nonce);const rtt=now()-sent;if(rtt<bestRtt){bestRtt=rtt;clockOffset=value.hostNow+rtt/2-now();}
      }else if(value.kind==='error')fail(value.reason);
      else hostConnection.close();
    });
    hostConnection.on('close',()=>{clearTimeout(timer);if(!closed){closed=true;fail('host-left');}});
    hostConnection.on('error',()=>{if(!closed)fail('connection-failed');});
    return snapshot();
  }
  function ready(value){if(host){if(room?.ready(selfId,value))publish();}else send(hostConnection,packet('ready',{ready:value}));}
  function start(){if(!host||!room?.start())return false;publish();return true;}
  function rematch(){if(!host||!room?.rematch())return false;publish();return true;}
  function launch(input){
    if(closed||!state||pendingShot)return false;
    if(host)return accepted(selfId,input);
    pendingShot=send(hostConnection,packet('shot',{input}));emit();return pendingShot;
  }
  function tick(){
    if(closed||!state)return;
    if(host&&state.phase==='countdown'){const next=room.tick();if(next.phase!==state.phase){syncCourses(next);publish();}}
    const time=hostNow();
    if(!host&&hostConnection?.open&&now()-lastPing>2000){lastPing=now();const nonce=Math.floor(now()*1000);pendingPings.clear();pendingPings.set(nonce,now());send(hostConnection,packet('ping',{nonce}));}
    for(const p of state.players)if(p.shot){
      const course=courses.get(p.id),result=course.advanceTo(Math.max(0,(Math.min(time,state.deadline)-state.startsAt-p.shot.startedAt)/1000));
      if(host&&result&&room.complete(p.id,p.shot.seq,result))publish();
    }
    if(host){const next=room.tick();if(next.phase!==state.phase){syncCourses(next);publish();}}
    if(host&&now()-lastBroadcast>1000)publish();
  }
  function close(){closed=true;for(const c of connections.values())c.close();connections.clear();hostConnection?.close();peer?.destroy();state=null;courses.clear();emit();}
  return Object.freeze({create,join,ready,start,rematch,launch,tick,close,snapshot,course:id=>courses.get(id)??null,hostNow});
}
