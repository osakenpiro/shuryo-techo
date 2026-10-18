export function createFriendMatch({rounds=3,players=['PLAYER 1','PLAYER 2']}={}){
  if(!Number.isInteger(rounds)||rounds<1||rounds>10||players.length!==2)throw Error('Invalid match');
  let turn=0,pending=false;const results=[];
  return {
    result(success){if(pending||turn>=rounds*2)return false;results.push({player:turn%2,round:Math.floor(turn/2)+1,success:success===true});pending=true;return true;},
    next(){if(!pending)return false;turn++;pending=false;return true;},
    snapshot(){return {turn,round:Math.min(rounds,Math.floor(turn/2)+1),rounds,player:turn%2,players:[...players],scores:players.map((_,i)=>results.filter(r=>r.player===i&&r.success).length),pending,finished:results.length===rounds*2,results:results.map(r=>({...r}))};}
  };
}
