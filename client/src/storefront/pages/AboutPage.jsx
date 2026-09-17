import { useMemo } from 'react';
import aboutTemplate from '../templates/about.html?raw';
import { extractBodyMarkup } from '../utils/template';

export default function AboutPage() {
  const bodyMarkup = useMemo(() => extractBodyMarkup(aboutTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
