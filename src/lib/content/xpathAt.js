export default function xpathAt(exp, context) {
  const doc = context.ownerDocument || context;
  const result = doc.evaluate(exp, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  
  return result.singleNodeValue;
}
