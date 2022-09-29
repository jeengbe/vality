declare global {
  namespace vality {
    interface guards {}
    interface valits {}
  }
  interface vality extends vality.guards, vality.valits {}
}

export const vality = {} as vality;
// Alias
export const v = vality;
