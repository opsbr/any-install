export type Step =
  | {
      statement: "info";
      with: {
        message: string;
      };
    }
  | {
      statement: "warn";
      with: {
        message: string;
      };
    }
  | {
      statement: "panic";
      with: {
        message: string;
      };
    }
  | {
      statement: "setInstallDir";
      with: {
        env: string;
        defaultValue: string;
      };
    }
  | {
      statement: "setOs";
    }
  | {
      statement: "setArch";
    }
  | {
      statement: "download";
      with: {
        url: string;
        custom?: {
          download?: string;
          extract?: string;
        };
      };
    }
  | {
      statement: "installExecutable";
      with: {
        target: string;
      };
    }
  | {
      statement: "installDirectory";
      with?: {
        options: {
          stripComponents?: number;
        };
      };
    }
  | {
      statement: "setVar";
      with: {
        variable: string;
        value: string;
      };
    }
  | {
      statement: "unsetVar";
      with: {
        variable: string;
      };
    }
  | {
      statement: "switchCases";
      with: {
        target: string;
        cases: Record<string, Step[]>;
      };
    }
  | string;

export type Manifest = {
  $schema?: string;
  sh?: {
    file: string;
    install: Step[];
  };
  ps1?: {
    file: string;
    install: Step[];
  };
};
