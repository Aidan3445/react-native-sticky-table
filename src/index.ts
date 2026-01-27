// Reexport the native module. On web, it will be resolved to StickyTableModule.web.ts
// and on native platforms to StickyTableModule.ts
export { default } from './StickyTableModule';
export { default as StickyTableView } from './StickyTableView';
export * from  './StickyTable.types';
