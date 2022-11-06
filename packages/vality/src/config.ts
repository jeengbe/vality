declare global {
  namespace vality {
    interface Config {
      // RelationType: string;

      allowExtraProperties: boolean;
      bail: boolean;
      strict: boolean;
    }
  }
}

export const config: Partial<vality.Config> = {};
