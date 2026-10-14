// The catalog and its historical profiles are immutable. Revised metre-space
// courses may specify a smaller physical object; their world version records
// that choice in both a live shot and its replay.
import {getThrowable} from './throwables.mjs?v=20261014-night-cards-1';
const OVERRIDES=Object.freeze({
  34:Object.freeze({'ice-scoop':Object.freeze({...getThrowable('ice-scoop').physics,radius:.035})}),
  35:Object.freeze({'firework-ball':Object.freeze({...getThrowable('firework-ball').physics,radius:.12})}),
  36:Object.freeze({baseball:Object.freeze({...getThrowable('baseball').physics,radius:.0365})}),
  37:Object.freeze({'firework-ball':Object.freeze({...getThrowable('firework-ball').physics,radius:.12})}),
});
export function throwableWorldProfile(itemId,worldVersion){
  return OVERRIDES[worldVersion]?.[itemId]??getThrowable(itemId)?.physics??null;
}
