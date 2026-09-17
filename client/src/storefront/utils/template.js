export function extractBodyMarkup(html) {
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  documentFragment.querySelectorAll('script').forEach((node) => node.remove());
  return documentFragment.body?.innerHTML ?? '';
}
