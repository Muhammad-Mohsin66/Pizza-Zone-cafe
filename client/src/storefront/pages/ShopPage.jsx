import { useMemo } from 'react';
import shopTemplate from '../templates/shop.html?raw';
import { extractBodyMarkup } from '../utils/template';
import { useShopPage } from '../hooks/pageHooks';

export default function ShopPage() {
  useShopPage();
  const bodyMarkup = useMemo(() => extractBodyMarkup(shopTemplate), []);
  return <div className="page-root" dangerouslySetInnerHTML={{ __html: bodyMarkup }} />;
}
