import { registerWebModule, NativeModule } from 'expo';

import { StickyTableModuleEvents } from './StickyTable.types';

class StickyTableModule extends NativeModule<StickyTableModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(StickyTableModule, 'StickyTableModule');
