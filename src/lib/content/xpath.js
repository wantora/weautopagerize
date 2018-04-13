export default function xpath(exp, context) {
  const doc = context.ownerDocument || context;
  const result = doc.evaluate(
    exp,
    context,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  const ret = [];

  for (let i = 0, len = result.snapshotLength; i < len; i++) {
    ret.push(result.snapshotItem(i));
  }
  return ret;
}
