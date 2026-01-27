import { requireNativeView } from 'expo';
import * as React from 'react';

import { StickyTableViewProps } from './StickyTable.types';

const NativeView: React.ComponentType<StickyTableViewProps> =
  requireNativeView('StickyTable');

export default function StickyTableView(props: StickyTableViewProps) {
  return <NativeView {...props} />;
}
