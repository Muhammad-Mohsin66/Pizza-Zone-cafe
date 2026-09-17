import { useMemo } from 'react';
import contactTemplate from '../templates/contact.html?raw';
import { extractBodyMarkup } from '../utils/template';

export default function ContactPage() {
  const bodyMarkup = useMemo(() => extractBodyMarkup(contactTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
