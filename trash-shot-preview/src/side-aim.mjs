// Screen vector in the side view: right is forward; up is elevation.
// Direction and length are independent, and rendering/setup never choose aim.
export function sideAim(right,up,size){
  if(![right,up,size].every(Number.isFinite)||size<=0)return {power:.5,elevation:48,yaw:0,valid:false};
  const length=Math.hypot(right,up),clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  return {
    power:Math.round(clamp(.5+27*length/size,.5,14)*20)/20,
    elevation:Math.round(clamp(Math.atan2(up,right)*180/Math.PI,5,85)*2)/2,
    yaw:0,
    valid:right>=0&&up>=0&&length>=Math.max(8,size*.035)
  };
}
