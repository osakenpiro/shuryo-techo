// The Chapter 3 review build can read an existing friend's save, then writes
// only its own namespace. The older public build never sees future TS4 facts.
export function createPreviewStorage(store,prefix='trash-shot-chapter3-preview-1:'){
  if(!store)return null;
  const hidden=key=>prefix+'deleted:'+key;
  return Object.freeze({
    getItem(key){key=String(key);if(store.getItem(hidden(key))==='1')return null;return store.getItem(prefix+key)??store.getItem(key);},
    setItem(key,value){key=String(key);store.setItem(prefix+key,String(value));store.removeItem(hidden(key));},
    removeItem(key){key=String(key);store.setItem(hidden(key),'1');store.removeItem(prefix+key);},
  });
}
