import * as React from 'react';

import { StickyTableViewProps } from './StickyTable.types';

export default function StickyTableView(props: StickyTableViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
