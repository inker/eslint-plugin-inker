export default <K, V>(maps: readonly ReadonlyMap<K, V>[]) =>
  maps.length === 1 ? maps[0] : new Map(maps.flatMap(item => [...item]));
