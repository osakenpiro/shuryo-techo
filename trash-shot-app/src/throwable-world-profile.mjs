// The catalog and its historical profiles are immutable. Revised metre-space
// courses may specify a smaller physical object; their world version records
// that choice in both a live shot and its replay.
import {getThrowable} from './throwables.mjs?v=20261015-boar-distance-1';
const OVERRIDES=Object.freeze({
  77:Object.freeze({'paper-plane':Object.freeze({...getThrowable('paper-plane').physics,version:4,radius:.24,windResponse:.65,
    glide:Object.freeze({lift:.62,drag:.035,maxLift:9.2,verticalDamping:1.25})})}),
  76:Object.freeze({'paper-plane':Object.freeze({...getThrowable('paper-plane').physics,version:4,radius:.24,windResponse:.65,
    glide:Object.freeze({lift:.62,drag:.035,maxLift:9.2,verticalDamping:1.25})})}),
  60:Object.freeze({baseball:Object.freeze({...getThrowable('baseball').physics,radius:.0365})}),
  61:Object.freeze({'ice-scoop':Object.freeze({...getThrowable('ice-scoop').physics,radius:.035})}),
  34:Object.freeze({'ice-scoop':Object.freeze({...getThrowable('ice-scoop').physics,radius:.035})}),
  35:Object.freeze({'firework-ball':Object.freeze({...getThrowable('firework-ball').physics,radius:.12})}),
  36:Object.freeze({baseball:Object.freeze({...getThrowable('baseball').physics,radius:.0365})}),
  37:Object.freeze({'firework-ball':Object.freeze({...getThrowable('firework-ball').physics,radius:.12})}),
});
export function throwableWorldProfile(itemId,worldVersion){
  return OVERRIDES[worldVersion]?.[itemId]??getThrowable(itemId)?.physics??null;
}
