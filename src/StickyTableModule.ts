import { NativeModule, requireNativeModule } from 'expo';

import { StickyTableModuleEvents } from './StickyTable.types';

declare class StickyTableModule extends NativeModule<StickyTableModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<StickyTableModule>('StickyTable');
