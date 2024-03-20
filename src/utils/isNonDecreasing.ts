export default <T, V>(arr: readonly T[], predicate: (item: T) => V) => {
  let p = predicate(arr[0]);
  for (let i = 1; i < arr.length; ++i) {
    const c = predicate(arr[i]);
    if (c < p) {
      return false;
    }
    p = c;
  }
  return true;
};
